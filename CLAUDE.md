# CompartiLar Development Guidelines

## Build Commands
- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to Firebase
- `npm run serve` - Run Firebase local server

## Code Style & Conventions
- **TypeScript**: Use strict mode with proper type definitions
- **Imports**: Use path aliases (@app/, @components/, @lib/, etc.) and organize imports by type
- **Components**: Use 'use client' directive for client components, follow atomic design principles
- **Naming**: PascalCase for components, camelCase for variables/functions, ALL_CAPS for constants
- **CSS**: Use Tailwind with daisyUI components, prefer utility classes over custom CSS
- **State**: Prefer Zustand for complex state, React hooks for local state, context for global state
- **Error Handling**: Try/catch blocks with react-hot-toast for user feedback
- **Firebase**: Use established patterns for Firestore/Auth, abstract DB operations into service files
- **Formatting**: 2-space indentation, single quotes, semicolons required, 80-char line limit

## Project Structure
- Feature-based directories with related files grouped together
- Shared components in appropriate /components/ subdirectories
- Types defined in /types/ directory with descriptive namespacing