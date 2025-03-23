# API Architecture & Implementation Guidelines

## Core API Design Principles

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

## Client-Side Implementation Requirements

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