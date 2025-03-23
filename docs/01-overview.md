# CompartiLar Development Guidelines

> ⚠️ **CRITICAL SECURITY NOTICE**: All code in this project MUST be production-ready and secure by default. No exceptions. 
> Data leakage, unauthorized access, or insecure implementations are considered severe issues that must be fixed immediately.

## Pre-Deployment Security Checklist

- [ ] **Authentication**: All API endpoints verify Firebase auth tokens
- [ ] **Authorization**: User permissions are checked before accessing data
- [ ] **CSRF Protection**: All API endpoints validate X-Requested-With header
- [ ] **Input Validation**: All user inputs are validated server-side
- [ ] **Rate Limiting**: Public endpoints have rate limiting implemented
- [ ] **Error Handling**: No sensitive information is leaked in error responses
- [ ] **Logging**: No PII or sensitive data is logged
- [ ] **Admin SDK**: No use of Admin SDK without proper auth verification
- [ ] **Token Management**: Proper token refresh mechanisms implemented
- [ ] **Credentials**: No API keys or secrets in client-side code
- [ ] **Data Access**: Least privilege principle applied to data access
- [ ] **Exceptions**: Any security exceptions are clearly documented with justification

All code changes must address these requirements before deployment.

## Build & Verification Commands
- `npm run dev` - Development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run local` - Dev server accessible from local network
- `firebase emulators:start` - Run Firebase emulators locally
- `firebase deploy --only hosting` - Deploy to Firebase Hosting

## Backup Commands
- `npm run backup` - Create local Firestore backup
- `npm run restore [backup-file-path]` - Restore from local backup
- `npm run backup:gcs` - Create GCS backup (requires Google Cloud SDK)
- `npm run restore:gcs [backup-name]` - Restore from GCS backup
- `npm run export:admin --key=/path/to/serviceAccountKey.json` - Export human-readable JSON as admin
- See `scripts/backup-docs.md` for detailed documentation