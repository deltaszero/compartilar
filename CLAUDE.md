# CompartiLar Development Guidelines

## Build Commands
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

## Code Style & Conventions
- **TypeScript**: Strict typing with shared types in `/types/` directory
- **Components**: React functional components with hooks; include type definitions
- **Firebase**: Collection/document/subcollection pattern; use subcollections over root collections
- **Permissions**: Use editors/viewers arrays in documents for access control
- **Import Order**: React/Next → Firebase → External libraries → Internal components → Types → Styles
- **Naming**: PascalCase for components, camelCase for variables/functions, snake_case for Firebase collections
- **Formatting**: 2-space indent, single quotes, semicolons, Tailwind CSS utilities for styling
- **Error Handling**: Use try/catch with console.error plus user-facing toasts for feedback

## Project Structure
- App Router with route groups: `(auth)`, `(user)`, etc.
- User pages under `app/(user)/[username]/` with feature-specific components
- UI components in `/components/ui/` (shadcn/ui based)
- Path aliases: `@/*`, `@app/*`, `@components/*`, `@lib/*`, `@context/*`, `@assets/*`

## Firebase Best Practices
- Detach Firestore listeners in useEffect cleanup functions
- Check for existing data before creating/updating documents
- Use batched writes or transactions for related operations
- Add change_history for important operations with timestamps
- Use permissioning through editors/viewers arrays consistently
- After auth operations, refresh token: `await user.getIdToken(true)`
- For sensitive operations, validate against security rules first