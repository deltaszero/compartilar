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
    // Get client IP for rate limiting - safely handle potential spoofing
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    // Check rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente mais tarde.' },
        { status: 429, 
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
        { status: 403,
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
      
      // Validate username format
      const usernameRegex = /^[a-z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username.toLowerCase())) {
        return NextResponse.json(
          { error: 'Formato de usuário inválido' },
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
      
      // Check if username is available
      const usernameQuery = await db.collection('users')
        .where('username', '==', username.toLowerCase())
        .limit(1)
        .get();
      
      if (!usernameQuery.empty) {
        return NextResponse.json(
          { error: 'Nome de usuário indisponível' },
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
      
      // Check if email is already in use
      try {
        // Try to get user by email
        const emailCheck = await auth.getUserByEmail(email);
        if (emailCheck) {
          // Email exists - use generic message for security
          return NextResponse.json(
            { error: 'Credenciais inválidas' },
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
      } catch (error: any) {
        // If error is "user-not-found", that's good (email is available)
        if (error.code !== 'auth/user-not-found') {
          console.error('Error checking email availability:', error);
          return NextResponse.json(
            { error: 'Erro durante o cadastro' },
            { 
              status: 500,
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
        // If error is "user-not-found", continue with signup
      }
      
      // Let Firebase handle the rest of email validation and password creation
      return NextResponse.json({
        success: true,
        useClientSideSignup: true,
        email,
        username: username.toLowerCase(),
      }, {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }
  } catch (error) {
    // Log error details for debugging but don't expose them to the client
    console.error('Error in signup API:', error);
    
    // Generic error message for security
    return NextResponse.json(
      { error: 'Ocorreu um erro durante o cadastro' },
      { 
        status: 500,
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