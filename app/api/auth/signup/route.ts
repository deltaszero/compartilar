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
    const { email, username, idToken } = await request.json();
    
    // For Google signup
    if (idToken) {
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
          return NextResponse.json({
            success: true,
            newUser: false,
            uid
          });
        }
        
        // Get user details from Auth
        const userRecord = await auth.getUser(uid);
        const providedUsername = username?.toLowerCase();
        
        // Check if the username is available
        if (providedUsername) {
          const usernameQuery = await db.collection('users')
            .where('username', '==', providedUsername)
            .limit(1)
            .get();
          
          if (!usernameQuery.empty) {
            return NextResponse.json(
              { error: 'Username already taken' },
              { status: 400 }
            );
          }
        }
        
        // Create a username from email if not provided
        let finalUsername = providedUsername;
        if (!finalUsername) {
          const emailPrefix = userRecord.email?.split('@')[0] || '';
          finalUsername = emailPrefix.toLowerCase();
          
          // Check if this auto-generated username is available
          const usernameQuery = await db.collection('users')
            .where('username', '==', finalUsername)
            .limit(1)
            .get();
          
          if (!usernameQuery.empty) {
            // Add random number if username taken
            finalUsername = `${finalUsername}${Math.floor(Math.random() * 1000)}`;
          }
        }
        
        return NextResponse.json({
          success: true,
          newUser: true,
          useClientSideSignup: false,
          uid,
          username: finalUsername
        });
      } catch (error) {
        console.error('Error verifying Google token:', error);
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
    } else {
      // For email/password signup, verify the data first
      
      if (!email || !username) {
        return NextResponse.json(
          { error: 'Email and username are required' },
          { status: 400 }
        );
      }
      
      // Validate username format
      const usernameRegex = /^[a-z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username.toLowerCase())) {
        return NextResponse.json(
          { error: 'Username must be 3-20 characters and only contain letters, numbers, underscores, or hyphens.' },
          { status: 400 }
        );
      }
      
      // Check if username is available
      const usernameQuery = await db.collection('users')
        .where('username', '==', username.toLowerCase())
        .limit(1)
        .get();
      
      if (!usernameQuery.empty) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
      
      // Let Firebase handle email validation and password creation
      return NextResponse.json({
        success: true,
        useClientSideSignup: true,
        email,
        username: username.toLowerCase(),
      });
    }
  } catch (error) {
    console.error('Error in signup API:', error);
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