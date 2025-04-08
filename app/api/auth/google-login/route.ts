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
    // Get client IP for rate limiting - safely handle potential spoofing
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente mais tarde.' },
        { 
          status: 429,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Cache-Control': 'no-store, max-age=0',
            'Retry-After': '3600'
          }
        }
      );
    }
    
    // Enhanced CSRF protection - check for both header and token
    const requestedWith = request.headers.get('x-requested-with');
    const csrfToken = request.headers.get('x-csrf-token');
    const cookies = request.cookies;
    const storedToken = cookies.get('csrf_token')?.value;
    
    // Verify the csrf protection - either by header or token
    const isValidCsrf = requestedWith === 'XMLHttpRequest' || 
                       (csrfToken && storedToken && csrfToken === storedToken);
                       
    if (!isValidCsrf) {
      return NextResponse.json(
        { error: 'Verificação de segurança falhou' },
        { 
          status: 403,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Cache-Control': 'no-store, max-age=0'
          }
        }
      );
    }
    
    // Get the ID token from the request
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { 
          status: 400,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Cache-Control': 'no-store, max-age=0'
          }
        }
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
    }, {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error in Google login API:', error);
    
    // Don't expose the specific error to clients
    return NextResponse.json(
      { error: 'Falha na autenticação' },
      { 
        status: 401,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Cache-Control': 'no-store, max-age=0'
        }
      }
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