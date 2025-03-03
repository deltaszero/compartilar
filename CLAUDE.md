# CompartiLar Development Guidelines

## Build Commands
- `npm run dev` - Run development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style & Conventions
- **TypeScript**: Use strict typing with proper interfaces/types
- **Components**: Use React 19 features and function components
- **Imports**: Order imports: React/Next.js core, external libraries, internal components, types, styles
- **Naming**: PascalCase for components, camelCase for variables/functions
- **CSS**: Use Tailwind CSS utility classes; maintain semantic HTML structure
- **Formatting**: 2-space indentation, single quotes for strings
- **Images**: Use Next.js Image component with proper sizing and alt text
- **Accessibility**: Ensure components are accessible (proper ARIA attributes, keyboard navigation)
- **Error Handling**: Use try/catch for async operations with proper error messages
- **Performance**: Memoize expensive calculations, use proper React hooks dependencies

## Project Structure
- App Router-based file organization (app directory)
- Use Next.js 15 conventions for layouts, loading states, and error boundaries
- Page components should be lean, delegating to smaller component files