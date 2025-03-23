# API Refactoring Guidelines

To improve our API architecture, follow these guidelines when refactoring:

## 1. Middleware-Based Security Approach

Create reusable middleware functions:

```typescript
// app/api/_middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  // CSRF protection
  const requestedWith = request.headers.get('x-requested-with');
  if (requestedWith !== 'XMLHttpRequest') {
    return NextResponse.json({ error: 'CSRF verification failed' }, { status: 403 });
  }

  // Auth verification
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify token
    const decodedToken = await adminAuth().verifyIdToken(token);
    return handler(request, decodedToken.uid);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

## 2. Separation of Concerns

Divide route handlers into three clear layers:
1. **Route Layer**: Request/response handling, middleware application
2. **Controller Layer**: Business logic implementation
3. **Service Layer**: Database operations, external API calls

Example implementation:

```typescript
// app/api/friends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../_middleware/auth';
import { getFriendsList } from './_controller';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || userId;
    
    try {
      const friends = await getFriendsList(userId, targetUserId);
      return NextResponse.json(friends);
    } catch (error) {
      console.error('Error in friends GET route:', error);
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message.includes('permission')) {
          return NextResponse.json({ error: error.message }, { status: 403 });
        }
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
```

## 3. Consistent Parameter Handling

Create utility functions for parameter validation:

```typescript
// app/api/_utils/validate.ts
export function validateRequiredParams(
  params: Record<string, any>,
  requiredFields: string[]
) {
  const missingFields = requiredFields.filter(field => !params[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  return true;
}

export function validatePermission(
  userId: string,
  resourceData: any,
  permissionLevel: 'owner' | 'editor' | 'viewer' = 'viewer'
) {
  const isOwner = resourceData?.owner === userId;
  const isEditor = resourceData?.editors?.includes(userId);
  const isViewer = resourceData?.viewers?.includes(userId);
  
  switch(permissionLevel) {
    case 'owner':
      if (!isOwner) throw new Error('Only the owner can perform this action');
      break;
    case 'editor':
      if (!isOwner && !isEditor) throw new Error('Editor permission required');
      break;
    case 'viewer':
      if (!isOwner && !isEditor && !isViewer) throw new Error('Access denied');
      break;
  }
  
  return true;
}
```

## 4. Standardized Response Formatting

Create consistent response helpers:

```typescript
// app/api/_utils/response.ts
import { NextResponse } from 'next/server';

export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown, status = 500) {
  const message = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred';
    
  const errorObj = {
    error: message,
    status,
    // Add stack trace in development only
    ...(process.env.NODE_ENV === 'development' && error instanceof Error 
      ? { stack: error.stack } 
      : {})
  };
  
  return NextResponse.json(errorObj, { status });
}
```

## 5. Type Safety Improvements

Create clear interfaces for all API operations:

```typescript
// app/api/_types/index.ts
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }
}

// Resource-specific interfaces
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
```

## 6. Centralized Error Handling

Create application-specific error classes:

```typescript
// app/api/_utils/errors.ts
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}
```

## 7. Documentation and Testing

Improve API documentation with JSDoc:

```typescript
/**
 * Gets a list of friends for a user
 * 
 * @route GET /api/friends
 * @param {string} userId - The ID of the user whose friends to retrieve
 * @returns {Promise<Friend[]>} List of friend objects
 * @throws {NotFoundError} If the user doesn't exist
 * @throws {ForbiddenError} If the requester doesn't have permission
 */
export async function getFriendsList(requesterId: string, userId: string): Promise<Friend[]> {
  // Implementation...
}
```

Follow these guidelines to create a more maintainable, secure, and consistent API architecture.