import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';

// Get the auth instance
const auth = adminAuth();

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/auth/logout called');
    
    // For development without Firebase Admin
    // Just return success and let client handle the actual signout
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Error in logout API:', error);
    return NextResponse.json(
      { error: 'Error processing logout' },
      { status: 500 }
    );
  }
}