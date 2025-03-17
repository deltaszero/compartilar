import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // CSRF protection
    const requestedWith = request.headers.get('x-requested-with');
    if (requestedWith !== 'XMLHttpRequest') {
      return NextResponse.json({ error: 'CSRF verification failed' }, { status: 403 });
    }

    // Auth verification
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get the IDs from query params
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    
    if (!ids) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }
    
    // Parse comma-separated IDs
    const userIds = ids.split(',');
    
    // Fetch user data
    const usersData = [];
    
    for (const id of userIds) {
      try {
        // Get user from Auth
        const userRecord = await adminAuth().getUser(id);
        
        // Get additional user data from Firestore
        const userDoc = await adminDb().collection('users').doc(id).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        usersData.push({
          id: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName || userData?.displayName,
          photoURL: userRecord.photoURL || userData?.photoURL,
          username: userData?.username
        });
      } catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        // Add minimal info for the user
        usersData.push({
          id,
          displayName: 'Unknown User'
        });
      }
    }
    
    return NextResponse.json(usersData);
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}