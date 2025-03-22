import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/app/lib/firebase-admin';

/**
 * GET - Retrieve a fresh Firebase ID token from the session cookie
 * 
 * This endpoint is used by client components to get a fresh token for API calls
 * The token is generated from the session cookie, which is set during login
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Verify the session cookie and create a custom token
    const decodedClaims = await adminAuth().verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;
    
    // Create a custom token
    const customToken = await adminAuth().createCustomToken(uid);
    
    // Return the custom token as plain text
    return new Response(customToken, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
  } catch (error) {
    console.error('Error creating custom token:', error);
    return new Response('Unauthorized', { status: 401 });
  }
}