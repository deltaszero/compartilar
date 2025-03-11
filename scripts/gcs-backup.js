#!/usr/bin/env node

/**
 * GCP Cloud Storage Firestore backup script for CompartiLar
 * 
 * This script creates a backup of your Firestore database and uploads it to
 * a Google Cloud Storage bucket.
 * 
 * Prerequisites:
 * - Node.js 14+
 * - Firebase CLI installed and configured
 * - Google Cloud SDK installed and configured
 * - Admin access to your Firebase project
 * - A GCS bucket with appropriate permissions
 * 
 * Usage:
 * node gcs-backup.js [--no-encryption]
 * 
 * Set these environment variables:
 * - FIREBASE_PROJECT_ID: Your Firebase project ID
 * - GCS_BUCKET_NAME: Your GCS bucket name
 * - BACKUP_ENCRYPTION_KEY: Your encryption key (optional)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const os = require('os');

// Configuration
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'compartilar-firebase-app'; // Replace with your project ID
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'compartilar-firebase-app_backup'; // Replace with your bucket name
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY; // Optional encryption key
const TEMP_DIR = path.join(os.tmpdir(), 'compartilar-backups');
const USE_ENCRYPTION = process.argv.includes('--no-encryption') ? false : !!ENCRYPTION_KEY;

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log(`Created temporary directory: ${TEMP_DIR}`);
}

// Create a timestamp with date (YYYY-MM-DD-HH-MM-SS)
const timestamp = new Date().toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '-')
  .slice(0, 19);

const backupFileName = `firestore-backup-${timestamp}.json.gz${USE_ENCRYPTION ? '.enc' : ''}`;
const backupFilePath = path.join(TEMP_DIR, backupFileName);
const metadataFileName = `firestore-backup-${timestamp}.meta.json`;
const metadataFilePath = path.join(TEMP_DIR, metadataFileName);

// Cloud Storage paths
const gcsBackupPath = `gs://${BUCKET_NAME}/backups/${backupFileName}`;
const gcsMetadataPath = `gs://${BUCKET_NAME}/backups/${metadataFileName}`;

// Function to encrypt data
function encryptData(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted };
}

// Function to check if bucket exists and create it if it doesn't
function ensureBucketExists() {
  try {
    // Check if bucket exists
    execSync(`gsutil ls -b gs://${BUCKET_NAME}`, { stdio: 'pipe' });
    console.log(`Bucket gs://${BUCKET_NAME} exists.`);
  } catch (error) {
    // Bucket doesn't exist, create it
    console.log(`Bucket gs://${BUCKET_NAME} doesn't exist. Creating...`);
    try {
      execSync(`gsutil mb -l us-central1 gs://${BUCKET_NAME}`, { stdio: 'inherit' });
      console.log(`Created bucket gs://${BUCKET_NAME}.`);
      
      // Set bucket versioning for extra protection
      execSync(`gsutil versioning set on gs://${BUCKET_NAME}`, { stdio: 'inherit' });
      console.log(`Enabled versioning for bucket gs://${BUCKET_NAME}.`);
    } catch (createError) {
      console.error(`Failed to create bucket: ${createError.message}`);
      process.exit(1);
    }
  }
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Main backup function
async function runBackup() {
  try {
    console.log('Starting Firestore backup to Google Cloud Storage...');
    
    // Check authentication
    console.log('Verifying authentication...');
    try {
      execSync('gcloud auth print-identity-token', { stdio: 'pipe' });
    } catch (error) {
      console.error('Not authenticated with gcloud. Please run: gcloud auth login');
      process.exit(1);
    }
    
    // Ensure bucket exists
    ensureBucketExists();
    
    // Create a temporary file for the export
    const tempFile = path.join(TEMP_DIR, `temp-${timestamp}.json`);
    
    // Use Google Cloud CLI to export data to a GCS location first
    console.log('Exporting data from Firestore...');
    const tempExportDir = path.join(TEMP_DIR, `export-${timestamp}`);
    
    // Create temporary export directory
    if (!fs.existsSync(tempExportDir)) {
      fs.mkdirSync(tempExportDir, { recursive: true });
    }
    
    // Export to a temporary GCS location first
    const tempGcsExportPath = `gs://${BUCKET_NAME}/temp-exports/${timestamp}`;
    
    // Run the export command
    execSync(
      `gcloud firestore export ${tempGcsExportPath} --project=${PROJECT_ID}`,
      { stdio: 'inherit' }
    );
    
    // Download the export data
    console.log(`Downloading export data from ${tempGcsExportPath}...`);
    execSync(
      `gsutil -m cp -r ${tempGcsExportPath}/* ${tempExportDir}`,
      { stdio: 'inherit' }
    );
    
    // Convert the export data to a single JSON file
    console.log('Converting export data to JSON format...');
    const exportFiles = [];
    
    // Recursively find all export files
    function findExportFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findExportFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.export_metadata')) {
          // Skip metadata files
          continue;
        } else if (entry.isFile()) {
          exportFiles.push(fullPath);
        }
      }
    }
    
    findExportFiles(tempExportDir);
    
    // Create a JSON structure with all the exported data
    const exportData = {
      timestamp: new Date().toISOString(),
      project: PROJECT_ID,
      collections: {}
    };
    
    // Process each export file
    for (const file of exportFiles) {
      try {
        const relativePath = path.relative(tempExportDir, file);
        const pathParts = relativePath.split(path.sep);
        
        // Skip metadata files
        if (pathParts[pathParts.length - 1].endsWith('.export_metadata')) {
          continue;
        }
        
        // Read file content
        const content = fs.readFileSync(file, 'utf8');
        
        // Add to the export data structure
        let current = exportData.collections;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        
        try {
          // Try to parse as JSON
          current[pathParts[pathParts.length - 1]] = JSON.parse(content);
        } catch (e) {
          // Store as string if not valid JSON
          current[pathParts[pathParts.length - 1]] = content;
        }
      } catch (e) {
        console.warn(`Failed to process export file ${file}: ${e.message}`);
      }
    }
    
    // Write the consolidated JSON file with explicit UTF-8 encoding
    fs.writeFileSync(tempFile, JSON.stringify(exportData, null, 2), 'utf8');
    
    // Clean up temporary GCS export
    console.log('Cleaning up temporary GCS export...');
    execSync(
      `gsutil -m rm -r ${tempGcsExportPath}`,
      { stdio: 'pipe' }
    );
    
    // Compress the file
    console.log('Compressing data...');
    const fileContent = fs.readFileSync(tempFile, 'utf8');
    const compressed = zlib.gzipSync(Buffer.from(fileContent, 'utf8'));
    
    let finalData;
    let iv;
    
    // Encrypt if needed
    if (USE_ENCRYPTION) {
      console.log('Encrypting data...');
      const encryptionResult = encryptData(compressed, ENCRYPTION_KEY);
      finalData = encryptionResult.encryptedData;
      iv = encryptionResult.iv;
      console.log(`Data encrypted with IV: ${iv}`);
    } else {
      finalData = compressed;
      console.log('Encryption skipped.');
    }
    
    // Write the data to the backup file
    fs.writeFileSync(backupFilePath, finalData);
    
    // Create metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      project: PROJECT_ID,
      filename: backupFileName,
      encryptionMethod: USE_ENCRYPTION ? 'aes-256-cbc' : 'none',
      ...(USE_ENCRYPTION && { iv }),
      compressionMethod: 'gzip',
      fileSize: fs.statSync(backupFilePath).size,
      originalSize: fs.statSync(tempFile).size,
      bucketName: BUCKET_NAME,
      gcsPath: `gs://${BUCKET_NAME}/backups/${backupFileName}`
    };
    
    fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf8');
    
    // Upload to GCS with explicit content-type
    console.log(`Uploading backup to ${gcsBackupPath}...`);
    execSync(`gsutil -h "Content-Type:application/json; charset=utf-8" cp ${backupFilePath} ${gcsBackupPath}`, { stdio: 'inherit' });
    
    console.log(`Uploading metadata to ${gcsMetadataPath}...`);
    execSync(`gsutil -h "Content-Type:application/json; charset=utf-8" cp ${metadataFilePath} ${gcsMetadataPath}`, { stdio: 'inherit' });
    
    // Set appropriate metadata on the files
    execSync(`gsutil setmeta -h "Content-Type:application/octet-stream" -h "x-goog-meta-backup-date:${new Date().toISOString()}" ${gcsBackupPath}`, { stdio: 'pipe' });
    execSync(`gsutil setmeta -h "Content-Type:application/json" -h "x-goog-meta-backup-date:${new Date().toISOString()}" ${gcsMetadataPath}`, { stdio: 'pipe' });
    
    // Clean up temporary files
    fs.unlinkSync(tempFile);
    fs.unlinkSync(backupFilePath);
    fs.unlinkSync(metadataFilePath);
    
    // Clean up temporary export directory
    console.log('Cleaning up temporary export directory...');
    try {
      // Recursively delete the directory
      function deleteDir(dir) {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir).forEach((file) => {
            const curPath = path.join(dir, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              // Recursive call
              deleteDir(curPath);
            } else {
              // Delete file
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(dir);
        }
      }
      deleteDir(tempExportDir);
      console.log(`Removed temporary directory: ${tempExportDir}`);
    } catch (error) {
      console.warn(`Failed to clean up temporary directory: ${error.message}`);
    }
    
    console.log('Backup completed successfully!');
    console.log(`Backup file: ${gcsBackupPath}`);
    console.log(`Metadata file: ${gcsMetadataPath}`);
    console.log(`Original size: ${formatBytes(metadata.originalSize)}`);
    console.log(`Compressed${USE_ENCRYPTION ? '+encrypted' : ''} size: ${formatBytes(metadata.fileSize)}`);
    console.log(`Compression ratio: ${(metadata.originalSize / metadata.fileSize).toFixed(2)}x`);
    
    // Record backup in Firestore for tracking (optional)
    try {
      console.log('Recording backup in Firestore...');
      // We don't use Firebase CLI for this since it doesn't have the command we expected
      // Instead, we'll just log to console that you should record the backup manually
      console.log('---');
      console.log('Backup completed at:', new Date().toISOString());
      console.log('GCS Path:', `gs://${BUCKET_NAME}/backups/${backupFileName}`);
      console.log('File size:', formatBytes(metadata.fileSize));
      console.log('Original size:', formatBytes(metadata.originalSize));
      console.log('Encrypted:', USE_ENCRYPTION ? 'Yes' : 'No');
      console.log('---');
      console.log('NOTE: You may want to manually record this backup in Firestore');
    } catch (recordError) {
      console.warn('Failed to record backup information:', recordError.message);
      console.warn('This is non-critical - your backup was still uploaded successfully.');
    }
    
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  }
}

// Run the backup
runBackup().catch(err => {
  console.error('Unhandled error during backup:', err);
  process.exit(1);
});