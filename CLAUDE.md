# CompartiLar Development Guidelines

## Build Commands
- `npm run dev` - Run development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run local` - Run development server accessible from other devices on network
- `firebase deploy --only firestore:rules` - Deploy Firestore security rules
- `firebase deploy --only storage:rules` - Deploy Storage rules
- `firebase deploy --only hosting` - Deploy the application to Firebase Hosting

## Code Style & Conventions
- **TypeScript**: Use strict typing with proper interfaces/types; define shared types in `/types/` directory
- **Components**: Use React functional components with hooks; follow separation of concerns
- **Firebase**: Follow `collection/document/subcollection` pattern; use helper functions from `/app/lib/firebaseConfig.ts`
- **Imports Order**: React/Next.js core, Firebase, external libraries, internal components, types, styles
- **Naming**: PascalCase for components, camelCase for variables/functions, snake_case for Firebase collections
- **CSS**: Use Tailwind CSS utility classes; consistent color scheme using design system variables
- **Formatting**: 2-space indentation, single quotes for strings, semicolons at end of statements
- **Error Handling**: Use try/catch for Firebase operations with proper console.error and user-facing toast messages
- **Performance**: Optimize Firebase queries with proper indexes; use Firestore listeners wisely
- **Security**: Follow the permission model with viewers/editors arrays in child documents

## Path Aliases
The project uses path aliases for cleaner imports:
- `@/*` - Root directory
- `@app/*` - App directory
- `@auth/*` - Auth components
- `@components/*` - UI components
- `@assets/*` - Images and icons
- `@lib/*` - Utility functions
- `@public/*` - Public assets
- `@context/*` - React context files

## Project Structure
- App Router-based organization with route groups: `(auth)`, `(user)`, etc.
- User-specific pages under `app/(user)/[username]/` with shared components
- UI components in `/components/ui/` (shadcn/ui based components)
- Firebase utilities in `/app/lib/firebaseConfig.ts` with context providers in `/context/`
- Type definitions in `/types/` directory

## Firebase Rules
- Firestore rules in `.firestore-rules` - enforce viewer/editor permission model
- Storage rules in `storage.rules` - manage access to profile and children photos
- All operations require authentication by default
- Children data access controlled by viewers/editors arrays in child documents
- Private events only visible to creators
- Expense groups can be shared or private