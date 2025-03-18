import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';

// Get the auth instance
const auth = adminAuth();

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();
const RATE_LIMIT = 10; // Max requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute window

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Check for CSRF protection
    const requestedWith = request.headers.get('x-requested-with');
    if (requestedWith !== 'XMLHttpRequest') {
      return NextResponse.json(
        { error: 'CSRF verification failed' },
        { status: 403 }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      // Verify the token is valid
      await auth.verifyIdToken(idToken);
      
      // Note: In Firebase Authentication, server-side logout isn't necessary
      // Firebase handles token revocation client-side
      // The client should call auth.signOut() after this API returns

      // For additional security, we could revoke all refresh tokens for this user
      // This is typically only needed for security-critical applications
      // const decodedToken = await auth.verifyIdToken(idToken);
      // await auth.revokeRefreshTokens(decodedToken.uid);
      
      return NextResponse.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error processing logout' },
      { status: 500 }
    );
  }
}

// Rate limiting function
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }
  
  const rateLimitInfo = rateLimitMap.get(ip)!;
  
  // Reset count if outside window
  if (now - rateLimitInfo.lastReset > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }
  
  // Increment count and check if over limit
  rateLimitInfo.count += 1;
  
  return rateLimitInfo.count > RATE_LIMIT;
}