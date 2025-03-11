import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Get the auth and firestore instances
const auth = adminAuth();
const db = adminDb();

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/auth/signup called');
    const { email, password, username, idToken } = await request.json();

    // For Google Sign-in or email/password, we'll let the client handle it all
    console.log('Signup requested for:', email || 'Google auth');
    
    return NextResponse.json({
      success: true,
      useClientSideSignup: true,
      email,
      username: username?.toLowerCase(),
    });
  } catch (error) {
    console.error('Error in signup API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}