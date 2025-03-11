#!/usr/bin/env node

/**
 * Local Firestore restore script for CompartiLar
 * 
 * This script restores a backup of your Firestore database from a local file.
 * It decrypts and decompresses the backup file before importing it.
 * 
 * Usage: node local-restore.js <backup-file>
 * 
 * Prerequisites:
 * - Node.js 14+
 * - Firebase CLI installed and configured
 * - Admin access to your Firebase project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const readline = require('readline');

// Configuration
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'your-project-id'; // Replace with your project ID
const BACKUP_DIR = path.join(__dirname, '../backups');
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'your-encryption-key'; // Use the same key as for backup

// Get the backup file from command line argument or prompt the user
async function getBackupFile() {
  if (process.argv.length > 2) {
    return process.argv[2];
  }
  
  // List available backups
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('firestore-backup-') && file.endsWith('.json.gz.enc'))
    .sort()
    .reverse(); // Most recent first
  
  if (files.length === 0) {
    console.error('No backup files found in', BACKUP_DIR);
    process.exit(1);
  }
  
  console.log('Available backups:');
  files.forEach((file, index) => {
    const stats = fs.statSync(path.join(BACKUP_DIR, file));
    console.log(`${index + 1}. ${file} (${formatBytes(stats.size)}, ${new Date(stats.mtime).toLocaleString()})`);
  });
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Enter the number of the backup to restore: ', (answer) => {
      rl.close();
      const index = parseInt(answer) - 1;
      if (isNaN(index) || index < 0 || index >= files.length) {
        console.error('Invalid selection');
        process.exit(1);
      }
      resolve(path.join(BACKUP_DIR, files[index]));
    });
  });
}

// Function to decrypt data
function decryptData(encryptedData, iv, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc', 
    Buffer.from(key.padEnd(32).slice(0, 32)), 
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
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

// Main restore function
async function runRestore() {
  try {
    const backupFile = await getBackupFile();
    console.log(`Selected backup: ${backupFile}`);
    
    // Check for metadata file
    const metadataFile = backupFile.replace('.json.gz.enc', '.meta.json');
    let iv;
    
    if (fs.existsSync(metadataFile)) {
      const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
      console.log('Backup info:');
      console.log(`- Created: ${new Date(metadata.timestamp).toLocaleString()}`);
      console.log(`- Original size: ${formatBytes(metadata.originalSize)}`);
      console.log(`- Compressed+encrypted size: ${formatBytes(metadata.fileSize)}`);
      iv = metadata.iv;
    } else {
      console.error('Metadata file not found. Cannot determine IV for decryption.');
      process.exit(1);
    }
    
    // Confirm before proceeding
    const confirmed = await confirmRestore();
    if (!confirmed) {
      console.log('Restore cancelled by user');
      process.exit(0);
    }
    
    // Create a temporary file for the decrypted and decompressed data
    const tempFile = path.join(BACKUP_DIR, `temp-restore-${Date.now()}.json`);
    
    // Decrypt and decompress
    console.log('Decrypting and decompressing backup...');
    const encryptedData = fs.readFileSync(backupFile).toString('hex');
    const decrypted = decryptData(encryptedData, iv, ENCRYPTION_KEY);
    const decompressed = zlib.gunzipSync(decrypted);
    
    // Write to temp file
    fs.writeFileSync(tempFile, decompressed);
    console.log(`Decrypted and decompressed backup to ${tempFile}`);
    
    // Import data
    console.log('Importing data to Firestore...');
    execSync(
      `firebase firestore:import ${tempFile} --project=${PROJECT_ID}`,
      { stdio: 'inherit' }
    );
    
    // Clean up
    fs.unlinkSync(tempFile);
    
    console.log('Restore completed successfully!');
    
    // Log the restore operation
    const logEntry = `${new Date().toISOString()}: Restored from backup - ${path.basename(backupFile)}\n`;
    fs.appendFileSync(path.join(BACKUP_DIR, 'restore-history.log'), logEntry);
    
  } catch (error) {
    console.error('Restore failed:', error.message);
    process.exit(1);
  }
}

// Run the restore
runRestore().catch(err => {
  console.error('Unhandled error during restore:', err);
  process.exit(1);
});