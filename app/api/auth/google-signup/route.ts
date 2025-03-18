import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Get the auth and firestore instances
const auth = adminAuth();
const db = adminDb();

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();
const RATE_LIMIT = 5; // Max signup attempts per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour window

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
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
    
    // Get data from request
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }
    
    try {
      // Verify the ID token with Firebase Admin - this is the critical security check
      // This ensures the token is valid and was issued by our Firebase project
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // Important: This endpoint is secure because:
      // 1. We verify the Firebase token above, confirming the user identity
      // 2. We only allow actions for the user's own account (matching the token UID)
      // 3. All Firestore operations use the verified UID
      
      // Check if user already exists in Firestore
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (userDoc.exists) {
        // User exists, just return success
        return NextResponse.json({
          success: true,
          newUser: false,
          uid
        });
      }
      
      // Get user details from Auth
      const userRecord = await auth.getUser(uid);
      
      // Create a username from email
      const emailPrefix = userRecord.email?.split('@')[0] || '';
      let username = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check if this auto-generated username is available
      const usernameQuery = await db.collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();
      
      if (!usernameQuery.empty) {
        // Add random number if username taken
        username = `${username}${Math.floor(Math.random() * 1000)}`;
      }
      
      // Create the user document in Firestore
      const userData = {
        uid,
        email: userRecord.email,
        username,
        displayName: userRecord.displayName || username,
        photoURL: userRecord.photoURL,
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        role: 'user',
        isActive: true,
        subscription: {
          status: 'free',
          validUntil: null
        }
      };
      
      await db.collection('users').doc(uid).set(userData);
      
      return NextResponse.json({
        success: true,
        newUser: true,
        uid,
        username
      });
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error in Google signup API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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