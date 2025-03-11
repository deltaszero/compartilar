import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize rate limiting map (this is memory-based and will reset on server restart)
// In production, you'd use Redis or another persistent store
const loginAttempts: { [ip: string]: { count: number; lastAttempt: number } } = {};

// Rate limit settings
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window

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
    
    // Get the ID token from the request
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }
    
    // Verify the ID token with Firebase Admin
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Check if this is a new user by looking in Firestore
    const userDoc = await adminDb().collection('users').doc(uid).get();
    let isNewUser = !userDoc.exists;
    
    // If this is a new user, create their document in Firestore
    if (isNewUser) {
      // Get user details from Auth
      const userRecord = await adminAuth().getUser(uid);
      
      // Create a username from email (basic implementation)
      const email = userRecord.email || '';
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + 
                       Math.floor(Math.random() * 1000);
      
      // Create the user document
      await adminDb().collection('users').doc(uid).set({
        uid: uid,
        email: userRecord.email,
        username: username,
        displayName: userRecord.displayName || username,
        photoURL: userRecord.photoURL || null,
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        role: 'user',
        isActive: true,
        subscription: {
          status: 'free',
          validUntil: null
        }
      });
    } else {
      // Update the last login time for existing users
      await adminDb().collection('users').doc(uid).update({
        lastLogin: Timestamp.now()
      });
    }
    
    return NextResponse.json({
      success: true,
      newUser: isNewUser,
      uid: uid
    });
  } catch (error) {
    console.error('Error in Google login API:', error);
    
    // Don't expose the specific error to clients
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

// Rate limiting helper function
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  
  // Initialize if this is the first request from this IP
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 1, lastAttempt: now };
    return false;
  }
  
  const attempt = loginAttempts[ip];
  
  // Reset count if outside the time window
  if (now - attempt.lastAttempt > WINDOW_MS) {
    loginAttempts[ip] = { count: 1, lastAttempt: now };
    return false;
  }
  
  // If too many attempts within the window, rate limit
  if (attempt.count >= MAX_ATTEMPTS) {
    return true;
  }
  
  // Otherwise, increment and allow
  attempt.count += 1;
  attempt.lastAttempt = now;
  return false;
}