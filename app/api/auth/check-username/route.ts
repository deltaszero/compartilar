import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

// Get the auth and firestore instances
const auth = adminAuth();
const db = adminDb();

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();
const RATE_LIMIT = 10; // Max requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute window

export async function GET(request: NextRequest) {
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
    
    // Get username from query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.toLowerCase();
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    // Validate username format
    const usernameRegex = /^[a-z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        available: false,
        error: 'Username must be 3-20 characters and only contain letters, numbers, underscores, or hyphens.'
      });
    }
    
    // Check if username exists in Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).limit(1).get();
    
    return NextResponse.json({
      available: snapshot.empty,
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Error checking username availability' },
      { status: 500 }
    );
  }
}

// Note: This endpoint doesn't need authentication verification because:
// 1. It's only reading public username information, not sensitive data
// 2. It's rate limited to prevent abuse
// 3. It's used in the signup flow before auth is established
// 4. The data returned (username availability) is not sensitive information
// This is an acceptable exception to the "require auth for all API routes" rule

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