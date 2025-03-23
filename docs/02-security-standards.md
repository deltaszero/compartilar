# Security-First Coding Standards

## Mandatory Security Checklist
- **No Credentials in Code**: Never commit API keys, passwords, or secrets
- **Authentication Required**: Every API endpoint must verify user identity
- **Rate Limiting**: All public-facing endpoints must implement rate limiting
- **CSRF Protection**: All forms/API requests must include CSRF protection headers
- **Input Validation**: All user inputs must be validated server-side
- **Output Sanitization**: Never return sensitive data in API responses
- **Safe Database Access**: Never use Firebase Admin SDK without auth verification
- **Public Routes**: Clear documentation required for any exceptions to auth requirements

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