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
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'your-project-id'; // Replace with your project ID
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'your-bucket-name'; // Replace with your bucket name
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
    
    // Use Firebase CLI to export data
    console.log('Exporting data from Firestore...');
    execSync(
      `firebase firestore:export ${tempFile} --project=${PROJECT_ID}`,
      { stdio: 'inherit' }
    );
    
    // Compress the file
    console.log('Compressing data...');
    const fileContent = fs.readFileSync(tempFile);
    const compressed = zlib.gzipSync(fileContent);
    
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
    
    fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));
    
    // Upload to GCS
    console.log(`Uploading backup to ${gcsBackupPath}...`);
    execSync(`gsutil cp ${backupFilePath} ${gcsBackupPath}`, { stdio: 'inherit' });
    
    console.log(`Uploading metadata to ${gcsMetadataPath}...`);
    execSync(`gsutil cp ${metadataFilePath} ${gcsMetadataPath}`, { stdio: 'inherit' });
    
    // Set appropriate metadata on the files
    execSync(`gsutil setmeta -h "Content-Type:application/octet-stream" -h "x-goog-meta-backup-date:${new Date().toISOString()}" ${gcsBackupPath}`, { stdio: 'pipe' });
    execSync(`gsutil setmeta -h "Content-Type:application/json" -h "x-goog-meta-backup-date:${new Date().toISOString()}" ${gcsMetadataPath}`, { stdio: 'pipe' });
    
    // Clean up temporary files
    fs.unlinkSync(tempFile);
    fs.unlinkSync(backupFilePath);
    fs.unlinkSync(metadataFilePath);
    
    console.log('Backup completed successfully!');
    console.log(`Backup file: ${gcsBackupPath}`);
    console.log(`Metadata file: ${gcsMetadataPath}`);
    console.log(`Original size: ${formatBytes(metadata.originalSize)}`);
    console.log(`Compressed${USE_ENCRYPTION ? '+encrypted' : ''} size: ${formatBytes(metadata.fileSize)}`);
    console.log(`Compression ratio: ${(metadata.originalSize / metadata.fileSize).toFixed(2)}x`);
    
    // Record backup in Firestore for tracking (optional)
    try {
      console.log('Recording backup in Firestore...');
      const recordCmd = `firebase firestore:set --project=${PROJECT_ID} "system_backups/${timestamp}" --data='${JSON.stringify({
        timestamp: new Date().toISOString(),
        gcsPath: `gs://${BUCKET_NAME}/backups/${backupFileName}`,
        fileSize: metadata.fileSize,
        originalSize: metadata.originalSize,
        encrypted: USE_ENCRYPTION
      })}'`;
      
      execSync(recordCmd, { stdio: 'pipe' });
      console.log('Backup recorded in Firestore.');
    } catch (recordError) {
      console.warn('Failed to record backup in Firestore:', recordError.message);
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