import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { Notification } from '@/types/shared.types';

// Verify Firebase auth token
async function verifyAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized - Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    // Verify token using Firebase Admin SDK
    const decodedToken = await adminAuth().verifyIdToken(token);
    return { uid: decodedToken.uid };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { error: 'Unauthorized - Invalid token', status: 401 };
  }
}

// GET endpoint to fetch notifications
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuthToken(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    // Get the authenticated user's ID from the token
    const authenticatedUserId = auth.uid;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // optional filter by status
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Validate parameters
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify that the requested userId matches the authenticated user's ID
    if (userId !== authenticatedUserId) {
      console.error(`User ID mismatch: ${userId} vs authenticated ${authenticatedUserId}`);
      return NextResponse.json({ 
        error: 'Unauthorized - User ID in query does not match authenticated user' 
      }, { status: 403 });
    }

    console.log(`Fetching notifications for user: ${userId}`);

    // Use admin DB for the query
    const dbAdmin = adminDb();
    
    // Query friendship requests as notifications
    const requestsRef = dbAdmin.collection('users').doc(userId).collection('friendship_requests');
    let requestsSnapshot;
    
    if (status) {
      requestsSnapshot = await requestsRef.where('status', '==', status).get();
    } else {
      requestsSnapshot = await requestsRef.get();
    }
    
    // Convert friend requests to notification format
    const notifications: any[] = [];
    
    requestsSnapshot.forEach(doc => {
      try {
        const data = doc.data();
        
        // Skip if missing required data
        if (!data || !data.senderUsername) {
          return;
        }
        
        // Create a notification object from the friend request
        const notification = {
          id: doc.id,
          userId: userId,
          type: 'friend_request',
          title: 'Nova solicitação de amizade',
          message: `${data.senderUsername} quer se conectar como ${data.relationshipType || 'amigo'}`,
          status: data.status === 'pending' ? 'unread' : 'read',
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()).getTime() : Date.now(),
          metadata: {
            senderId: data.senderId || '',
            senderUsername: data.senderUsername || '',
            senderPhotoURL: data.senderPhotoURL || '',
            requestId: doc.id,
            relationshipType: data.relationshipType || 'support'
          },
          actionUrl: `/api/friends/requests/${doc.id}`
        };
        
        notifications.push(notification);
      } catch (err) {
        console.error('Error processing notification:', err);
      }
    });
    
    // Sort notifications by creation date (newest first)
    notifications.sort((a, b) => {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      return bTime - aTime;
    });
    
    // Apply limit
    const limitedNotifications = notifications.slice(0, limit);
    
    return NextResponse.json(limitedNotifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update notification status (mark as read/archived)
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuthToken(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    
    // Get the authenticated user's ID from the token
    const authenticatedUserId = auth.uid;

    // Parse request body
    const body = await request.json();
    const { notificationId, userId, status } = body;

    // Validate required fields
    if (!notificationId || !userId || !status) {
      return NextResponse.json({ 
        error: 'Notification ID, user ID, and status are required' 
      }, { status: 400 });
    }

    // Verify that the userId matches the authenticated user's ID
    if (userId !== authenticatedUserId) {
      console.error(`User ID mismatch: ${userId} vs authenticated ${authenticatedUserId}`);
      return NextResponse.json({ 
        error: 'Unauthorized - User ID does not match authenticated user' 
      }, { status: 403 });
    }

    if (status !== 'read' && status !== 'archived') {
      return NextResponse.json({ 
        error: 'Status must be either "read" or "archived"' 
      }, { status: 400 });
    }

    console.log(`Updating notification ${notificationId} to status ${status}`);

    // Use admin DB for the operations
    const dbAdmin = adminDb();
    
    // First check if this is a friend request notification
    // Since we're using the friend request collection as a source of notifications
    const requestRef = dbAdmin.collection('users').doc(userId).collection('friendship_requests').doc(notificationId);
    const requestDoc = await requestRef.get();
    
    if (requestDoc.exists) {
      // This is a friend request notification
      // We don't actually update the status in the friendship_requests collection
      // because those are handled separately with accept/decline actions
      return NextResponse.json({ 
        message: 'Friend request notifications are handled through the friends/requests endpoint',
        success: true
      });
    }

    // If we get here, it's a regular notification (not implemented yet)
    return NextResponse.json({ 
      message: 'Regular notifications not implemented yet',
      success: false
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}