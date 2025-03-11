import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';

// Get the firestore instance
const db = adminDb();

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/auth/check-username called');
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    console.log('Checking username availability for:', username);
    
    // For development without Firebase Admin, always return available
    // In production, this would query Firestore
    return NextResponse.json({
      available: true, 
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Error checking username availability' },
      { status: 500 }
    );
  }
}