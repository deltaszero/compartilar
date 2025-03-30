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

## Premium vs Free Tier Functionality

CompartiLar operates on a freemium model with the following limits:

### Free Tier (Básico):
- 1 child profile maximum
- 3 daily calendar events limit
- 3 daily expenses in financial panel
- 30 days of check-in history
- No support network

### Premium Tier (Duo - R$29,90/month):
- Unlimited child profiles
- Unlimited calendar events
- Unlimited expenses
- Complete check-in history
- Up to 5 support network members
- Personalized notifications and reminders

All features should respect these limits using the `usePremiumFeatures` hook and the `PremiumFeature` component for UI restrictions.

## Quick Reference: Build & Verification Commands

- `npm run dev` - Development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run local` - Dev server accessible from local network
- `firebase emulators:start` - Run Firebase emulators locally