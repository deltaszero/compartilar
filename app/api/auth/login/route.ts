import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

// Get the auth and firestore instances
const auth = adminAuth();
const db = adminDb();

// Add error logging for debugging
console.log('Initializing auth/login API route');

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/auth/login called');
    const { email, password, idToken } = await request.json();
    
    // For simplicity, always instruct client to use client-side auth
    // This removes dependency on Firebase Admin for login
    console.log('Email login requested for:', email || 'No email provided');
    
    return NextResponse.json({
      success: true,
      useClientSideAuth: true,
      email: email
    });
  } catch (error) {
    console.error('Error in login API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}