# CompartiLar Development Guidelines

> ⚠️ **CRITICAL SECURITY NOTICE**: All code in this project MUST be production-ready and secure by default. No exceptions.
> Data leakage, unauthorized access, or insecure implementations are considered severe issues that must be fixed immediately.

## Documentation

Complete development guidelines have been moved to the `/docs` directory for better organization.

Please refer to the following documents:

1. [Overview and Setup](/docs/01-overview.md)
2. [Security Standards](/docs/02-security-standards.md)
3. [Coding Standards](/docs/03-coding-standards.md)
4. [Firebase Guidelines](/docs/04-firebase-guidelines.md)
5. [API Design](/docs/05-api-design.md)
6. [API Refactoring](/docs/06-api-refactoring.md)

## Quick Reference: Build & Verification Commands

- `npm run dev` - Development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run local` - Dev server accessible from local network
- `firebase emulators:start` - Run Firebase emulators locally