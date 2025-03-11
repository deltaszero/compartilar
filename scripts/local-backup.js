#!/usr/bin/env node

/**
 * Local Firestore backup script for CompartiLar
 * 
 * This script creates a backup of your Firestore database to a local file.
 * It's useful for development environments or as a starting point before
 * implementing a full cloud-based backup strategy.
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

// Configuration
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'your-project-id'; // Replace with your project ID
const BACKUP_DIR = path.join(__dirname, '../backups');
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'your-encryption-key'; // Use a strong key in production

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Create a timestamp with date (YYYY-MM-DD-HH-MM-SS)
const timestamp = new Date().toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '-')
  .slice(0, 19);

const backupFile = path.join(BACKUP_DIR, `firestore-backup-${timestamp}.json.gz.enc`);
const metadataFile = path.join(BACKUP_DIR, `firestore-backup-${timestamp}.meta.json`);

// Function to encrypt data
function encryptData(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Main backup function
async function runBackup() {
  try {
    console.log('Starting local Firestore backup...');
    
    // Create a temporary file for the export
    const tempFile = path.join(BACKUP_DIR, `temp-${timestamp}.json`);
    
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
    
    // Encrypt the compressed data
    console.log('Encrypting data...');
    const { iv, encryptedData } = encryptData(compressed, ENCRYPTION_KEY);
    
    // Write the encrypted data to the final backup file
    fs.writeFileSync(backupFile, Buffer.from(encryptedData, 'hex'));
    
    // Create a metadata file with information about the backup
    const metadata = {
      timestamp: new Date().toISOString(),
      project: PROJECT_ID,
      filename: path.basename(backupFile),
      encryptionMethod: 'aes-256-cbc',
      iv,
      compressionMethod: 'gzip',
      fileSize: fs.statSync(backupFile).size,
      originalSize: fs.statSync(tempFile).size
    };
    
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    
    // Clean up the temporary file
    fs.unlinkSync(tempFile);
    
    console.log('Backup completed successfully!');
    console.log(`Backup file: ${backupFile}`);
    console.log(`Metadata file: ${metadataFile}`);
    console.log(`Original size: ${metadata.originalSize} bytes`);
    console.log(`Compressed+encrypted size: ${metadata.fileSize} bytes`);
    
    // Log the backup to a history file
    const logEntry = `${new Date().toISOString()}: Backup created - ${path.basename(backupFile)}\n`;
    fs.appendFileSync(path.join(BACKUP_DIR, 'backup-history.log'), logEntry);
    
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