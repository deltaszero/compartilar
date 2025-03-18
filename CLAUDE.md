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

## Security-First Coding Standards

### Mandatory Security Checklist
- **No Credentials in Code**: Never commit API keys, passwords, or secrets
- **Authentication Required**: Every API endpoint must verify user identity
- **Rate Limiting**: All public-facing endpoints must implement rate limiting
- **CSRF Protection**: All forms/API requests must include CSRF protection headers
- **Input Validation**: All user inputs must be validated server-side
- **Output Sanitization**: Never return sensitive data in API responses
- **Safe Database Access**: Never use Firebase Admin SDK without auth verification
- **Public Routes**: Clear documentation required for any exceptions to auth requirements

### Code Style & Conventions
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

## Firebase Security Requirements
- **Detach Listeners**: Always detach Firestore listeners in useEffect cleanup functions
- **Data Validation**: Check for existing data before creating/updating documents
- **Transactions**: Use batched writes or transactions for related operations
- **Audit Logs**: Add change_history for important operations with timestamps
- **Access Control**: Use permissioning through editors/viewers arrays consistently
- **Token Refresh**: After auth operations, refresh token: `await user.getIdToken(true)`
- **Security Rules**: For sensitive operations, validate against security rules first
- **Client-Only Access**: Never bypass security rules with Admin SDK in client code
- **Read Restrictions**: Enforce least-privilege data access with compound queries
- **Auth State**: Always handle authentication state changes securely
- **Anonymous Users**: Migrate anonymous user data properly when converting to permanent accounts
- **Token Expiry**: Handle token expiration gracefully with proper refresh mechanisms

## API Architecture & Implementation Guidelines

### Core API Design Principles

1. **RESTful Pattern**: APIs follow standard REST patterns for consistent interaction
   - `GET`: Retrieve resources (read-only)
   - `POST`: Create new resources
   - `PATCH`: Update existing resources partially
   - `PUT`: Replace resources completely
   - `DELETE`: Remove resources

2. **Resource Naming**: Use clear, consistent naming for API endpoints
   - Collections as plural nouns: `/api/friends`, `/api/children`
   - Actions within related collections: `/api/friends/requests`, `/api/children/access`

3. **Client-Server Communication Contract**:
   - Response format consistency: Always return JSON with success/error structure
   - Status codes: Use appropriate HTTP status (200, 201, 400, 401, 403, 404, 500)
   - Error messages: Include user-friendly messages and detailed error info for debugging

### Client-Side Implementation Requirements

- **HTTP Method Matching**: Client methods MUST match server expectations
  ```typescript
  // Example: For friend request acceptance, use PATCH not POST
  const response = await fetch('/api/friends/requests', {
    method: 'PATCH', // Must match API endpoint expectation
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({
      requestId,
      userId,
      action: 'accept' // Must match API parameter expectations
    })
  });
  ```

- **Request Body Structure**: Must exactly match server-side expected parameters
  ```typescript
  // Required for all components interacting with API
  // Check endpoint implementation for expected parameters
  body: JSON.stringify({
    // These parameter names must match exactly what the API expects
    paramName1: value1, 
    paramName2: value2
  })
  ```

- **Authentication Headers**: All API requests must include proper authentication
  ```typescript
  // Required pattern for all client components
  const token = await user.getIdToken(true); // Get fresh token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Requested-With': 'XMLHttpRequest' // Required for CSRF protection
  };
  ```

- **Token Refresh**: Always get fresh token before API calls to prevent expiration
  ```typescript
  // Required for all API calls
  const token = await user.getIdToken(true); // Force refresh
  ```

## Production API Security Requirements

### ⚠️ NO EXCEPTIONS TO THESE RULES ⚠️

- **Authentication Required**: All API routes MUST verify Firebase auth tokens
- **Admin SDK Usage**: Only use Firebase Admin SDK in API routes with proper auth checks
- **Token Verification**:
  ```typescript
  // Required pattern for all API routes
  const token = request.headers.get('authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const decodedToken = await adminAuth().verifyIdToken(token);
  ```
- **Client Token Sending**:
  ```typescript
  // Required pattern for all client components
  const token = await user.getIdToken();
  fetch('/api/endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest'  // CSRF protection
    }
  });
  ```
- **CSRF Protection**: All API routes must verify X-Requested-With header
  ```typescript
  // Required in all API routes
  const requestedWith = request.headers.get('x-requested-with');
  if (requestedWith !== 'XMLHttpRequest') {
    return NextResponse.json({ error: 'CSRF verification failed' }, { status: 403 });
  }
  ```
- **Rate Limiting**: All API routes must implement rate limiting
  ```typescript
  // Required in all API routes
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  ```
- **Authorization Checks**: Verify the authenticated user has permission for the operation
  ```typescript
  // Verify user can access their own data
  if (decodedToken.uid !== requestedUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  ```
- **Safe Error Responses**: Never expose internal errors to clients
  ```typescript
  // Correct way to handle errors
  try {
    // API logic
  } catch (error) {
    console.error('Internal error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
  ```
- **No Sensitive Logging**: Never log sensitive user data, tokens, or credentials
- **Input Validation**: Always validate all client-provided data server-side
- **Safe Data Return**: Never return more data than necessary for the operation
- **Security-Rule Pattern**: Design API routes to follow Firestore security rules patterns
- **Sensitive Actions**: Require re-authentication for critical operations
- **Admin Routes Protection**: Add extra validation for admin-only operations
- **Documentation**: Clearly document any exceptions with security justification