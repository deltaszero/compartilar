# CompartiLar Backup & Restore Utilities

This directory contains scripts for backing up and restoring your Firestore database.

## Local Backup Utilities

These scripts create encrypted, compressed backups on your local machine.

### Scripts

- `local-backup.js` - Creates a local backup of your Firestore database
- `local-restore.js` - Restores from a local backup

### Usage

```bash
# Create a backup
npm run backup

# Restore from a backup
npm run restore
```

## Google Cloud Storage Backup Utilities

These scripts create backups directly in a Google Cloud Storage bucket.

### Scripts

- `gcs-backup.js` - Creates a backup in Google Cloud Storage
- `gcs-restore.js` - Restores from a backup in Google Cloud Storage
- `backup-cloud-function.js` - Cloud Function for automated backups

### Usage

```bash
# Set environment variables
export FIREBASE_PROJECT_ID="your-project-id"
export GCS_BUCKET_NAME="your-bucket-name"
export BACKUP_ENCRYPTION_KEY="your-encryption-key"  # Optional

# Create a backup to GCS
npm run backup:gcs

# Restore from a GCS backup
npm run restore:gcs

# Restore from a specific backup in GCS
npm run restore:gcs -- --backup-path gs://bucket-name/backups/file-name.json.gz.enc
```

## Setting Up Automatic Backups

To set up automatic backups using Google Cloud Functions:

1. Create a Cloud Function:
   ```bash
   cd functions
   npm install @google-cloud/firestore @google-cloud/storage
   ```

2. Copy the Cloud Function code:
   ```bash
   cp ../scripts/backup-cloud-function.js src/backup.js
   ```

3. Configure it in `index.js`:
   ```javascript
   const backupFunctions = require('./backup');
   exports.scheduledFirestoreExport = backupFunctions.scheduledFirestoreExport;
   exports.checkBackupStatus = backupFunctions.checkBackupStatus;
   exports.cleanupOldBackups = backupFunctions.cleanupOldBackups;
   ```

4. Deploy the function:
   ```bash
   firebase deploy --only functions:scheduledFirestoreExport,functions:checkBackupStatus,functions:cleanupOldBackups
   ```

5. Set the environment variables:
   ```bash
   firebase functions:config:set backup.bucket="your-bucket-name"
   ```

## Security Considerations

1. **Encryption Key Management**:
   - Store your encryption key securely
   - Consider using a key management service like Google Cloud KMS
   - Rotate encryption keys periodically

2. **Bucket Permissions**:
   - Restrict access to your backup bucket
   - Use IAM to control who can read/write to the bucket
   - Enable bucket versioning for extra protection

3. **Retention Policies**:
   - Set up lifecycle rules on your bucket
   - Keep multiple versions of backups
   - Consider compliance and legal requirements

## Backup Strategies

1. **Daily Backups**: Keep for 7 days
2. **Weekly Backups**: Keep for 4 weeks
3. **Monthly Backups**: Keep for 12 months
4. **Yearly Backups**: Keep indefinitely

The automated Cloud Function implements this retention policy.