#!/usr/bin/env node

/**
 * GCP Cloud Storage Firestore restore script for CompartiLar
 * 
 * This script restores a Firestore backup from Google Cloud Storage.
 * 
 * Prerequisites:
 * - Node.js 14+
 * - Firebase CLI installed and configured
 * - Google Cloud SDK installed and configured
 * - Admin access to your Firebase project
 * 
 * Usage:
 * node gcs-restore.js [--backup-path gs://bucket/path/to/backup]
 * 
 * Set these environment variables:
 * - FIREBASE_PROJECT_ID: Your Firebase project ID
 * - GCS_BUCKET_NAME: Your GCS bucket name
 * - BACKUP_ENCRYPTION_KEY: Your encryption key (if backup is encrypted)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const os = require('os');
const readline = require('readline');

// Configuration
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'your-project-id'; // Replace with your project ID
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'your-bucket-name'; // Replace with your bucket name
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY; // Optional encryption key
const TEMP_DIR = path.join(os.tmpdir(), 'compartilar-restores');

// Create temp directory if it doesn't exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log(`Created temporary directory: ${TEMP_DIR}`);
}

// Function to decrypt data
function decryptData(encryptedData, iv, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc', 
    Buffer.from(key.padEnd(32).slice(0, 32)), 
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
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

// Get backup path from command line or environment
function getBackupPathFromArgs() {
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--backup-path' && i + 1 < process.argv.length) {
      return process.argv[i + 1];
    }
    if (process.argv[i].startsWith('gs://')) {
      return process.argv[i];
    }
  }
  return null;
}

// List available backups in the bucket
async function listAvailableBackups() {
  try {
    console.log(`Listing backups in gs://${BUCKET_NAME}/backups/...`);
    const output = execSync(`gsutil ls -l gs://${BUCKET_NAME}/backups/*.json.gz*`, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Parse the output to get backup files
    const backups = [];
    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.includes('.json.gz')) {
        const parts = line.trim().split(/\s+/);
        const size = parseInt(parts[0], 10);
        const date = new Date(`${parts[1]} ${parts[2]}`);
        const url = parts[parts.length - 1];
        
        if (url.includes('.json.gz')) {
          backups.push({
            url,
            size,
            date,
            formattedDate: date.toLocaleString(),
            formattedSize: formatBytes(size)
          });
        }
      }
    }
    
    // Sort by date, newest first
    backups.sort((a, b) => b.date - a.date);
    return backups;
  } catch (error) {
    console.error('Error listing backups:', error.message);
    if (error.stderr) console.error(error.stderr.toString());
    return [];
  }
}

// Get user confirmation
function confirmRestore() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('WARNING: This will overwrite your current Firestore data. Continue? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Select backup to restore
async function selectBackup() {
  // Check if backup path is provided via command line
  const backupPath = getBackupPathFromArgs();
  if (backupPath) {
    return backupPath;
  }
  
  // List available backups
  const backups = await listAvailableBackups();
  
  if (backups.length === 0) {
    console.error(`No backups found in gs://${BUCKET_NAME}/backups/`);
    process.exit(1);
  }
  
  console.log('Available backups:');
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${path.basename(backup.url)} (${backup.formattedSize}, ${backup.formattedDate})`);
  });
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Enter the number of the backup to restore: ', (answer) => {
      rl.close();
      const index = parseInt(answer) - 1;
      if (isNaN(index) || index < 0 || index >= backups.length) {
        console.error('Invalid selection');
        process.exit(1);
      }
      resolve(backups[index].url);
    });
  });
}

// Main restore function
async function runRestore() {
  try {
    console.log('Starting Firestore restore from Google Cloud Storage...');
    
    // Check authentication
    console.log('Verifying authentication...');
    try {
      execSync('gcloud auth print-identity-token', { stdio: 'pipe' });
    } catch (error) {
      console.error('Not authenticated with gcloud. Please run: gcloud auth login');
      process.exit(1);
    }
    
    // Get backup path
    const backupPath = await selectBackup();
    console.log(`Selected backup: ${backupPath}`);
    
    // Get metadata file path
    const metadataPath = backupPath.replace('.json.gz', '.meta.json')
                                  .replace('.enc', '');
    
    // Download metadata file
    const metadataFile = path.join(TEMP_DIR, path.basename(metadataPath));
    console.log(`Downloading metadata from ${metadataPath}...`);
    try {
      execSync(`gsutil cp ${metadataPath} ${metadataFile}`, { stdio: 'inherit' });
    } catch (error) {
      console.warn('Metadata file not found or could not be downloaded.');
      console.warn('Will attempt restore without metadata (encryption may fail).');
    }
    
    // Parse metadata if available
    let metadata = null;
    let isEncrypted = backupPath.endsWith('.enc');
    let iv = null;
    
    if (fs.existsSync(metadataFile)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        console.log('Backup info:');
        console.log(`- Created: ${new Date(metadata.timestamp).toLocaleString()}`);
        console.log(`- Original size: ${formatBytes(metadata.originalSize)}`);
        console.log(`- Compressed${isEncrypted ? '+encrypted' : ''} size: ${formatBytes(metadata.fileSize)}`);
        isEncrypted = metadata.encryptionMethod !== 'none';
        iv = metadata.iv;
      } catch (error) {
        console.warn('Error parsing metadata:', error.message);
      }
    }
    
    if (isEncrypted && !ENCRYPTION_KEY) {
      console.error('Encryption key is required to decrypt the backup.');
      console.error('Please set the BACKUP_ENCRYPTION_KEY environment variable.');
      process.exit(1);
    }
    
    if (isEncrypted && !iv) {
      console.error('Encryption IV is missing from metadata.');
      console.error('Cannot decrypt the backup without the correct IV.');
      process.exit(1);
    }
    
    // Confirm before proceeding
    const confirmed = await confirmRestore();
    if (!confirmed) {
      console.log('Restore cancelled by user');
      process.exit(0);
    }
    
    // Download backup file
    const backupFile = path.join(TEMP_DIR, path.basename(backupPath));
    console.log(`Downloading backup from ${backupPath}...`);
    execSync(`gsutil cp ${backupPath} ${backupFile}`, { stdio: 'inherit' });
    
    // Create a temporary file for the decrypted and decompressed data
    const tempFile = path.join(TEMP_DIR, `temp-restore-${Date.now()}.json`);
    
    // Process the backup file
    console.log('Processing backup file...');
    let processedData = fs.readFileSync(backupFile);
    
    if (isEncrypted) {
      console.log('Decrypting backup...');
      processedData = decryptData(processedData, iv, ENCRYPTION_KEY);
    }
    
    console.log('Decompressing backup...');
    processedData = zlib.gunzipSync(processedData);
    
    // Write to temp file
    fs.writeFileSync(tempFile, processedData);
    console.log(`Processed backup to ${tempFile}`);
    
    // Import data
    console.log('Importing data to Firestore...');
    execSync(
      `firebase firestore:import ${tempFile} --project=${PROJECT_ID}`,
      { stdio: 'inherit' }
    );
    
    // Clean up
    console.log('Cleaning up temporary files...');
    fs.unlinkSync(tempFile);
    fs.unlinkSync(backupFile);
    if (fs.existsSync(metadataFile)) {
      fs.unlinkSync(metadataFile);
    }
    
    console.log('Restore completed successfully!');
    
    // Record restore in Firestore for tracking (optional)
    try {
      console.log('Recording restore in Firestore...');
      const timestamp = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '-')
        .slice(0, 19);
      
      const recordCmd = `firebase firestore:set --project=${PROJECT_ID} "system_restores/${timestamp}" --data='${JSON.stringify({
        timestamp: new Date().toISOString(),
        sourceBackup: backupPath,
        restoreBy: "manual-restore"
      })}'`;
      
      execSync(recordCmd, { stdio: 'pipe' });
      console.log('Restore recorded in Firestore.');
    } catch (recordError) {
      console.warn('Failed to record restore in Firestore:', recordError.message);
      console.warn('This is non-critical - your restore was completed successfully.');
    }
    
  } catch (error) {
    console.error('Restore failed:', error.message);
    if (error.stderr) console.error(error.stderr.toString());
    process.exit(1);
  }
}

// Run the restore
runRestore().catch(err => {
  console.error('Unhandled error during restore:', err);
  process.exit(1);
});