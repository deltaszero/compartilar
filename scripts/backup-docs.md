# CompartiLar Backup Solutions

This document describes the backup solutions available for the CompartiLar application.

## Available Backup Methods

### 1. Human-Readable Admin Export

Use this method when you need to explore or analyze your Firestore data in a human-readable format. It creates a clean JSON file that's easy to read and navigate, with full admin access to all your data.

```bash
npm run export:admin -- --key=/path/to/serviceAccountKey.json
```

This method requires a Firebase service account key file (JSON), which you can generate from the Firebase Console:
1. Go to Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the file securely

Options:
- `--key=/path/to/key.json` - Path to your Firebase service account key (REQUIRED)
- `--collection=name` - Export only a specific collection
- `--output=path` - Specify the output file path
- `--no-pretty` - Don't format JSON with indentation

Example:
```bash
# Export only the 'users' collection
npm run export:admin -- --key=./serviceAccountKey.json --collection=users

# Export to a specific file
npm run export:admin -- --key=./serviceAccountKey.json --output=./my-export.json
```

The output will be a clean, properly formatted JSON file with all your Firestore data, including subcollections.

### 2. Local Backup

Use this method for development or personal backup copies. It creates a local backup file of your Firestore database.

```bash
npm run backup
```

To restore from a local backup:

```bash
npm run restore [backup-file-path]
```

### 2. Google Cloud Storage (GCS) Backup

Use this method for production backups. It creates a backup in a Google Cloud Storage bucket.

```bash
npm run backup:gcs
```

To restore from a GCS backup:

```bash
npm run restore:gcs [backup-name]
```

## Configuration Options

You can configure backups through environment variables:

- `FIREBASE_PROJECT_ID`: Your Firebase project ID (default: 'compartilar-firebase-app')
- `GCS_BUCKET_NAME`: Your GCS bucket name (default: 'compartilar-firebase-app_backup')
- `BACKUP_ENCRYPTION_KEY`: Optional encryption key for secure backups

## Optional Parameters

- `--no-encryption`: Skip encryption (only applies if BACKUP_ENCRYPTION_KEY is set)

## Backup Automation

For production environments, it's recommended to set up scheduled backups using:

1. GitHub Actions workflow
2. Google Cloud Scheduler + Cloud Functions
3. Cron job on a dedicated server

## Restoring Backups

Both local and GCS backup solutions include restore capabilities:

- Local restore requires the path to the backup file
- GCS restore requires the name of the backup in the GCS bucket

When restoring, be cautious of:
- Overwriting newer data
- Permissions and access control
- Database rules conflicts

## Troubleshooting

1. **Permission Errors**:
   - Ensure you're authenticated with the correct Firebase project
   - Check GCS bucket permissions

2. **Command Not Found Errors**:
   - Ensure Firebase CLI is installed: `npm install -g firebase-tools`
   - Ensure Google Cloud SDK is installed and in PATH

3. **Backup Fails**:
   - Check authentication with both Firebase and Google Cloud
   - Verify network connectivity
   - Check available disk space for local operations

For more detailed assistance, refer to the Google Cloud documentation on Firestore exports:
https://cloud.google.com/firestore/docs/manage-data/export-import

## Security Considerations

- Backups may contain sensitive user data - handle with appropriate security
- Store encryption keys separately from backup files
- Use IAM permissions to restrict access to backup buckets
- Regularly test restore procedures to ensure backup integrity