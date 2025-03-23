# Code Style & Conventions

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