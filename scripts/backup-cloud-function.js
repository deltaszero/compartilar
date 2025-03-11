/**
 * Cloud Function for automated Firestore backups
 * 
 * This function exports Firestore data to a Cloud Storage bucket
 * and can be scheduled to run automatically.
 * 
 * To deploy this function:
 * 1. Create a functions directory if you don't already have one
 * 2. Copy this file to functions/src/backup.js
 * 3. Update the package.json in the functions directory as needed
 * 4. Deploy with: firebase deploy --only functions:scheduledFirestoreExport
 * 
 * Required environment variables:
 * - GCS_BUCKET: The name of the Cloud Storage bucket to store backups
 */

const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');

admin.initializeApp();

// Configure these variables in your environment
const BUCKET_NAME = process.env.GCS_BUCKET || 'your-bucket-name';
const REGION = 'us-central1'; // Change to your region
const TIMEZONE = 'America/Sao_Paulo'; // Change to your timezone
const BACKUP_SCHEDULE = '0 2 * * *'; // 2 AM every day

/**
 * Creates a Firestore export with relevant metadata
 */
exports.scheduledFirestoreExport = functions
  .region(REGION)
  .pubsub
  .schedule(BACKUP_SCHEDULE)
  .timeZone(TIMEZONE)
  .onRun(async (context) => {
    try {
      const client = new firestore.v1.FirestoreAdminClient();
      const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
      const databaseName = client.databasePath(projectId, '(default)');
      
      // Create a timestamp with date (YYYY-MM-DD-HH-MM)
      const date = new Date();
      const formattedDate = date.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '-')
        .slice(0, 19);
      
      const outputUriPrefix = `gs://${BUCKET_NAME}/backups/${formattedDate}`;
      
      // Add metadata to the backup for auditing purposes
      const metadata = {
        timestamp: formattedDate,
        initiatedBy: 'cloud-function',
        backupType: 'scheduled',
        schedule: BACKUP_SCHEDULE
      };
      
      console.log(`Starting backup to ${outputUriPrefix}`);
      
      // Start the export operation
      const [operation] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix,
        // If you want to export only specific collections:
        // collectionIds: ['users', 'children'],
      });
      
      console.log(`Started export operation: ${operation.name}`);
      
      // Store a record of this backup in Firestore for tracking
      await admin.firestore().collection('system_backups').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        outputUri: outputUriPrefix,
        status: 'started',
        operationName: operation.name,
        metadata
      });
      
      // Upload a metadata file to the bucket
      const storage = new Storage();
      const bucket = storage.bucket(BUCKET_NAME);
      
      const metadataFilePath = `backups/${formattedDate}/metadata.json`;
      const file = bucket.file(metadataFilePath);
      
      await file.save(JSON.stringify({
        timestamp: date.toISOString(),
        project: projectId,
        outputUri: outputUriPrefix,
        operationName: operation.name,
        initiatedBy: 'cloud-function',
        collections: 'all'
      }, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            backupDate: date.toISOString(),
            backupType: 'scheduled',
          }
        }
      });
      
      return null;
    } catch (error) {
      console.error('Backup failed:', error);
      
      // Log the error to Firestore for monitoring
      await admin.firestore().collection('system_backup_errors').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: error.toString(),
        stack: error.stack
      });
      
      throw error;
    }
  });

/**
 * Checks the status of ongoing backup operations
 * and updates their status in Firestore
 */
exports.checkBackupStatus = functions
  .region(REGION)
  .pubsub
  .schedule('5,35 * * * *') // Run every 30 mins, at 5 and 35 past the hour
  .timeZone(TIMEZONE)
  .onRun(async (context) => {
    try {
      const client = new firestore.v1.FirestoreAdminClient();
      
      // Get all backups with 'started' status that are less than 24 hours old
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const snapshot = await admin.firestore()
        .collection('system_backups')
        .where('status', '==', 'started')
        .where('timestamp', '>=', oneDayAgo)
        .get();
      
      if (snapshot.empty) {
        console.log('No in-progress backups to check');
        return null;
      }
      
      console.log(`Found ${snapshot.size} in-progress backups to check`);
      
      // Check status of each backup operation
      const promises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const operationName = data.operationName;
        
        if (!operationName) {
          console.log(`Backup ${doc.id} has no operation name, marking as error`);
          return doc.ref.update({
            status: 'error',
            errorMessage: 'Missing operation name'
          });
        }
        
        try {
          console.log(`Checking status of operation: ${operationName}`);
          const [operation] = await client.checkExportDocumentsProgress({
            name: operationName
          });
          
          if (operation.done) {
            console.log(`Backup operation ${operationName} completed`);
            
            // Check if there was an error
            if (operation.error) {
              console.error(`Backup operation ${operationName} failed:`, operation.error);
              return doc.ref.update({
                status: 'failed',
                error: operation.error,
                completedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            }
            
            // Success
            return doc.ref.update({
              status: 'completed',
              completedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            console.log(`Backup operation ${operationName} still in progress`);
            return null;
          }
        } catch (error) {
          console.error(`Error checking status for ${operationName}:`, error);
          return doc.ref.update({
            status: 'error',
            error: error.toString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
      
      await Promise.all(promises);
      return null;
    } catch (error) {
      console.error('Error in checkBackupStatus:', error);
      throw error;
    }
  });

/**
 * Cleans up old backups based on retention policy
 * Keep:
 * - Daily backups for 7 days
 * - Weekly backups for 4 weeks
 * - Monthly backups for 12 months
 * - Yearly backups indefinitely
 */
exports.cleanupOldBackups = functions
  .region(REGION)
  .pubsub
  .schedule('0 3 * * *') // Run at 3 AM every day
  .timeZone(TIMEZONE)
  .onRun(async (context) => {
    try {
      const storage = new Storage();
      const bucket = storage.bucket(BUCKET_NAME);
      
      console.log(`Starting backup cleanup in bucket: ${BUCKET_NAME}`);
      
      // List all backups
      const [files] = await bucket.getFiles({ prefix: 'backups/' });
      console.log(`Found ${files.length} backup files`);
      
      // Group backups by date
      const backupsByDate = {};
      for (const file of files) {
        // Extract date from path: backups/YYYY-MM-DD-...
        const match = file.name.match(/backups\/(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const date = match[1];
          if (!backupsByDate[date]) {
            backupsByDate[date] = [];
          }
          backupsByDate[date].push(file);
        }
      }
      
      const now = new Date();
      const toDelete = [];
      
      // Apply retention policy
      for (const date in backupsByDate) {
        const backupDate = new Date(date);
        const ageInDays = Math.floor((now - backupDate) / (1000 * 60 * 60 * 24));
        
        // Special handling for the first day of the month and year
        const isFirstOfMonth = backupDate.getDate() === 1;
        const isFirstOfYear = isFirstOfMonth && backupDate.getMonth() === 0;
        
        // Keep yearly backups indefinitely
        if (isFirstOfYear) {
          console.log(`Keeping yearly backup from ${date}`);
          continue;
        }
        
        // Keep monthly backups for 12 months
        if (isFirstOfMonth && ageInDays <= 365) {
          console.log(`Keeping monthly backup from ${date}`);
          continue;
        }
        
        // Keep weekly backups (Monday) for 4 weeks
        const dayOfWeek = backupDate.getDay();
        if (dayOfWeek === 1 && ageInDays <= 28) {
          console.log(`Keeping weekly backup from ${date}`);
          continue;
        }
        
        // Keep daily backups for 7 days
        if (ageInDays <= 7) {
          console.log(`Keeping daily backup from ${date}`);
          continue;
        }
        
        // Mark for deletion if it doesn't match any retention rule
        console.log(`Marking backup from ${date} for deletion (${ageInDays} days old)`);
        toDelete.push(...backupsByDate[date]);
      }
      
      // Delete the files
      if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} backup files`);
        const deletePromises = toDelete.map(file => {
          console.log(`Deleting ${file.name}`);
          return file.delete();
        });
        
        await Promise.all(deletePromises);
        console.log('Deletion complete');
      } else {
        console.log('No backups to delete');
      }
      
      return null;
    } catch (error) {
      console.error('Error in cleanupOldBackups:', error);
      throw error;
    }
  });