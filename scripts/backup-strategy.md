# Secure Backup Strategy for CompartiLar

## Overview

This document outlines a secure, automated backup strategy for your Firestore database. This approach provides:

1. Regular, encrypted backups of your database
2. Point-in-time recovery capabilities
3. Secure storage with access controls
4. Automated scheduling with minimal maintenance

## Implementation Options

### Option 1: Using Firebase Export and Cloud Functions (Easiest)

#### Setup Steps

1. **Create a dedicated Cloud Storage bucket for backups**

```bash
# Using Google Cloud CLI
gcloud storage buckets create gs://compartilar-secure-backups --location=southamerica-east1 --default-storage-class=STANDARD
```

2. **Create a Cloud Function to export Firestore data**

Create a new file `functions/src/backup.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as firestore from '@google-cloud/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Cloud function that runs daily and creates a backup
export const scheduledFirestoreExport = functions.pubsub
  .schedule('0 2 * * *')  // Run at 2:00 AM every day
  .timeZone('America/Sao_Paulo')  // Adjust to your timezone
  .onRun(async () => {
    try {
      const client = new firestore.v1.FirestoreAdminClient();
      const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
      const databaseName = client.databasePath(projectId, '(default)');
      
      // Create a timestamp with date (YYYY-MM-DD-HH-MM)
      const dateTime = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '-')
        .slice(0, 19);
      
      const outputUriPrefix = `gs://compartilar-secure-backups/${dateTime}`;
      
      // Add metadata to the backup for auditing purposes
      const metadata = {
        timestamp: dateTime,
        initiatedBy: 'scheduled-function',
        backupType: 'automated-daily'
      };
      
      // Log the backup operation
      console.log(`Starting backup to ${outputUriPrefix}`);
      
      const responses = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix,
        // Don't include the collections you don't need to backup
        collectionIds: [], // Empty means all collections
      });
      
      const response = responses[0];
      console.log(`Backup operation started: ${response.name}`);
      
      // Store a record of this backup in Firestore for tracking
      await admin.firestore().collection('system_backups').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        outputUri: outputUriPrefix,
        status: 'started',
        operationName: response.name,
        metadata
      });
      
      return null;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  });

// Function to check backup status and update records
export const checkBackupStatus = functions.pubsub
  .schedule('5 * * * *')  // Run every hour at 5 minutes past the hour
  .onRun(async () => {
    try {
      const client = new firestore.v1.FirestoreAdminClient();
      
      // Get all backups with 'started' status
      const snapshot = await admin.firestore()
        .collection('system_backups')
        .where('status', '==', 'started')
        .get();
      
      if (snapshot.empty) {
        console.log('No in-progress backups to check');
        return null;
      }
      
      // Check status of each backup operation
      const promises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const operationName = data.operationName;
        
        try {
          const [operation] = await client.checkExportDocumentsProgress({
            name: operationName
          });
          
          if (operation.done) {
            await doc.ref.update({
              status: 'completed',
              completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Backup ${operationName} completed successfully`);
          } else {
            console.log(`Backup ${operationName} still in progress`);
          }
        } catch (error) {
          console.error(`Error checking status for ${operationName}:`, error);
          await doc.ref.update({
            status: 'error',
            error: error.toString()
          });
        }
      });
      
      await Promise.all(promises);
      return null;
    } catch (error) {
      console.error('Error checking backup status:', error);
      throw error;
    }
  });
```

3. **Deploy the Cloud Functions**

```bash
firebase deploy --only functions:scheduledFirestoreExport,functions:checkBackupStatus
```

4. **Set up Cloud Storage bucket lifecycle policy**

This policy automatically deletes backups older than your retention period.

```bash
# Example: 30-day retention policy
gcloud storage buckets update gs://compartilar-secure-backups --lifecycle-file=lifecycle.json
```

Where `lifecycle.json` contains:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 30,
          "isLive": true
        }
      }
    ]
  }
}
```

5. **Encrypt your backups (optional but recommended)**

Enable default encryption for the bucket:

```bash
# Create a Cloud KMS key
gcloud kms keyrings create backups --location=southamerica-east1
gcloud kms keys create backups-key --keyring=backups --location=southamerica-east1 --purpose=encryption

# Configure the bucket to use this key
gcloud storage buckets update gs://compartilar-secure-backups --default-encryption-key=projects/YOUR_PROJECT_ID/locations/southamerica-east1/keyRings/backups/cryptoKeys/backups-key
```

### Option 2: Manual Backups (If You Don't Want to Use Cloud Functions)

If you prefer to set up manual backups or run them from your own infrastructure:

1. **Create a script for manual backup**

```typescript
// scripts/backup.js
const { execSync } = require('child_process');
const fs = require('fs');

// Replace with your project ID
const PROJECT_ID = 'your-project-id';
const BUCKET_NAME = 'compartilar-secure-backups';

// Create a timestamp with date (YYYY-MM-DD-HH-MM)
const dateTime = new Date().toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '-')
  .slice(0, 19);

const outputUri = `gs://${BUCKET_NAME}/${dateTime}`;

// Ensure the user is logged in to gcloud
console.log('Verifying authentication...');
try {
  execSync('gcloud auth print-identity-token', { stdio: 'pipe' });
} catch (error) {
  console.error('Not authenticated with gcloud. Please run: gcloud auth login');
  process.exit(1);
}

// Run the export command
console.log(`Starting Firestore export to ${outputUri}...`);
try {
  execSync(
    `gcloud firestore export ${outputUri} --project=${PROJECT_ID}`,
    { stdio: 'inherit' }
  );
  console.log('Backup completed successfully!');
  
  // Log the backup details to a local file
  const logEntry = `${new Date().toISOString()}: Backup exported to ${outputUri}\n`;
  fs.appendFileSync('backup-log.txt', logEntry);
} catch (error) {
  console.error('Backup failed:', error);
  process.exit(1);
}
```

2. **Run the script manually or with cron**

```bash
# Add execution permission
chmod +x scripts/backup.js

# Run manually
node scripts/backup.js

# Or add to crontab for daily execution (example for 2 AM)
# 0 2 * * * /usr/bin/node /path/to/your/project/scripts/backup.js >> /path/to/your/project/backup-cron.log 2>&1
```

## Restore Process

To restore from a backup:

1. **Identify the backup you want to restore from**

```bash
# List all available backups
gcloud storage ls gs://compartilar-secure-backups/
```

2. **Import the backup data**

```bash
# For a complete restore (will overwrite existing data!)
gcloud firestore import gs://compartilar-secure-backups/YYYY-MM-DD-HH-MM/ --project=your-project-id

# For a selective restore to a different collection (safer)
gcloud firestore import gs://compartilar-secure-backups/YYYY-MM-DD-HH-MM/ --collection-ids=children,users --namespace=(default) --project=your-project-id
```

3. **Verify the restore**

After restoring, check that the data has been correctly imported by verifying sample documents in the Firebase console.

## Security Recommendations

1. **Access Control**
   - Use IAM to limit who can access the backup bucket
   - Create a dedicated service account for backup operations
   - Enable audit logging for the storage bucket

2. **Encryption**
   - Enable CMEK (Customer-Managed Encryption Keys) for the storage bucket
   - Use Cloud KMS to manage your encryption keys
   - Consider rotating keys periodically

3. **Testing**
   - Regularly test the restore process to verify backups are valid
   - Document the restore procedure for emergency situations
   - Practice restore scenarios with your team

## Cost Considerations

- Cloud Storage: ~$0.02-$0.03 per GB per month for standard storage
- Cloud Functions: Free tier includes 2 million invocations per month
- Data transfer: Free within the same region

For a typical small to medium application, the backup strategy should cost less than $10-20 per month.

## Compliance Considerations

- For legal/compliance requirements, consider implementing WORM (Write Once Read Many) storage:
  ```bash
  gcloud storage buckets update gs://compartilar-secure-backups --retention-period=2592000s  # 30 days
  ```

- Document your backup schedule and retention policies for legal purposes
- Consider storing critical backups in multiple geographic regions for disaster recovery

## Recommended Schedule

- **Daily incremental backups**: Retain for 30 days
- **Weekly full backups**: Retain for 3 months
- **Monthly backups**: Retain for 1 year
- **Yearly backups**: Retain for 7 years (for legal/tax purposes)

## Next Steps

1. Choose the implementation option that works best for your setup
2. Set up monitoring to alert on backup failures
3. Create documentation for the restore process
4. Perform a test restore to verify the process works correctly