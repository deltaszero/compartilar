import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

/**
 * GET - Fetch a single user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user ID from params - using await for Next.js 15 compatibility
    const { id: userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    try {
      // Get user from Auth
      const userRecord = await adminAuth().getUser(userId);
      
      // Get additional user data from Firestore
      const userDoc = await adminDb().collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      
      // Return user data
      return NextResponse.json({
        id: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userData?.displayName,
        photoURL: userRecord.photoURL || userData?.photoURL,
        username: userData?.username,
        firstName: userData?.firstName,
        lastName: userData?.lastName
      });
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      // Return minimal info for the user when not found
      return NextResponse.json({
        id: userId,
        displayName: 'Usuário',
        email: null,
        photoURL: null
      });
    }
  } catch (error) {
    console.error('Error in users/[id] API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}