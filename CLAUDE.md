# CompartiLar Development Guidelines

## Build & Test Commands
- `npm run dev` - Development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run local` - Dev server accessible from network
- `firebase emulators:start` - Run Firebase emulators locally
- `firebase deploy --only hosting` - Deploy to Firebase Hosting

## Code Style & Conventions
- **TypeScript**: Strict typing; shared types in `/types/` directory
- **Components**: React functional components with hooks
- **Firebase**: Collection/document/subcollection pattern; use subcollections over root collections
- **Permissions**: Use editors/viewers arrays in documents for access control
- **Imports**: React/Next → Firebase → External libraries → Internal components → Types → Styles
- **Naming**: PascalCase components, camelCase variables/functions, snake_case Firebase collections
- **Formatting**: 2-space indent, single quotes, semicolons, Tailwind CSS utilities
- **Error Handling**: Use try/catch with console.error for Firebase operations; provide user feedback with toasts

## Project Structure
- App Router with route groups: `(auth)`, `(user)`, etc.
- User pages under `app/(user)/[username]/` with shared components
- UI components in `/components/ui/` (shadcn/ui based)
- Firebase config in `/app/lib/firebaseConfig.ts` and `/lib/firebaseConfig.ts`
- Path aliases: `@/*`, `@app/*`, `@components/*`, `@lib/*`

## Firebase Best Practices
- Detach Firestore listeners in useEffect cleanup
- Check for existing data before creating/updating docs
- Use batched writes or transactions for related operations
- Add change history for important operations
- Use `addFirestoreListener` for consistent listener management
- Implement security rules for all collections
- For change_history access, validate editors array permissions
- After auth operations, refresh token: `await user.getIdToken(true)`