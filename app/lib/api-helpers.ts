import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';
import { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { Auth as AdminAuth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { db as clientDb } from './firebaseConfig';

/**
 * Standardized Firebase initialization for API routes with proper TypeScript typing
 * 
 * @returns An object with typed Firebase instances and a flag indicating which SDK is in use
 */
export function initializeFirebase() {
  // Define properly typed variables
  let auth: AdminAuth | Auth | null = null;
  let db: AdminFirestore | Firestore;
  let isAdminSDK = true;

  try {
    // Initialize admin SDK
    auth = adminAuth();
    db = adminDb();
    console.log('Successfully initialized Firebase Admin SDK');
  } catch (error) {
    // Safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to initialize Firebase Admin SDK, falling back to client:', errorMessage);
    
    // Fall back to client SDK
    auth = null;
    db = clientDb ? clientDb : getFirestore();
    isAdminSDK = false;
  }

  return { auth, db, isAdminSDK };
}

/**
 * Safe error response generator for API routes
 * 
 * @param error The error object
 * @param status HTTP status code (default: 500)
 * @returns NextResponse with appropriate error details
 */
export function errorResponse(error: unknown, status = 500) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  return NextResponse.json({
    error: 'Internal server error',
    message: errorMessage,
    stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
  }, { status });
}

/**
 * Token verification helper for API routes
 * 
 * @param authHeader The authorization header from the request
 * @returns Object with either uid or error details
 */
export async function verifyAuthToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized - Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    // Get admin auth instance
    const auth = adminAuth();
    
    // Verify token
    const decodedToken = await auth.verifyIdToken(token);
    return { uid: decodedToken.uid };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Token verification failed:', errorMessage);
    return { error: 'Unauthorized - Invalid token', status: 401 };
  }
}