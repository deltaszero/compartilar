import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';

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

// GET endpoint to fetch friend requests
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
    const status = searchParams.get('status') || 'pending';

    // Verify that the requested userId matches the authenticated user's ID
    if (userId !== authenticatedUserId) {
      console.error(`User ID mismatch: ${userId} vs authenticated ${authenticatedUserId}`);
      return NextResponse.json({ 
        error: 'Unauthorized - User ID in query does not match authenticated user' 
      }, { status: 403 });
    }

    console.log(`Fetching friend requests for user: ${userId} with status: ${status}`);

    // Use admin DB for the query
    const requestsRef = adminDb().collection('users').doc(userId).collection('friendship_requests');
    const requestsSnapshot = await requestsRef.where('status', '==', status).get();
    
    if (requestsSnapshot.empty) {
      return NextResponse.json([]);
    }

    // Process the requests
    const friendRequests = [];

    requestsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Format the request data
      const request = {
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        status: data.status,
        relationshipType: data.relationshipType || 'support',
        createdAt: data.createdAt ? new Date(data.createdAt.toDate()).getTime() : null,
        senderUsername: data.senderUsername || '',
        senderPhotoURL: data.senderPhotoURL || '',
        receiverUsername: data.receiverUsername || ''
      };
      
      friendRequests.push(request);
    });

    return NextResponse.json(friendRequests);
  } catch (error) {
    console.error('Error getting friend requests:', error);
    return NextResponse.json(
      { error: 'Failed to get friend requests', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a friend request
export async function POST(request: NextRequest) {
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
    const { 
      senderId, 
      receiverId, 
      relationshipType, 
      senderUsername, 
      senderPhotoURL, 
      receiverUsername 
    } = body;

    // Validate required fields
    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'Sender ID and Receiver ID are required' }, { status: 400 });
    }

    // Verify that the sender ID matches the authenticated user's ID
    if (senderId !== authenticatedUserId) {
      console.error(`Sender ID mismatch: ${senderId} vs authenticated ${authenticatedUserId}`);
      return NextResponse.json({ 
        error: 'Unauthorized - Sender ID does not match authenticated user' 
      }, { status: 403 });
    }

    if (senderId === receiverId) {
      return NextResponse.json({ error: 'You cannot send a friend request to yourself' }, { status: 400 });
    }

    console.log(`Creating friend request from ${senderId} to ${receiverId}`);

    // Use admin DB for all operations
    const dbAdmin = adminDb();
    
    // Check if receiver exists
    const receiverRef = dbAdmin.collection('users').doc(receiverId);
    const receiverDoc = await receiverRef.get();
    
    if (!receiverDoc.exists) {
      return NextResponse.json({ error: 'Receiver user not found' }, { status: 404 });
    }

    // Check if there's an existing pending request
    const receiverRequestsRef = dbAdmin.collection('users').doc(receiverId).collection('friendship_requests');
    const existingRequestsSnapshot = await receiverRequestsRef
      .where('senderId', '==', senderId)
      .where('status', '==', 'pending')
      .get();
    
    if (!existingRequestsSnapshot.empty) {
      return NextResponse.json({ 
        message: 'Friend request already sent',
        requestId: existingRequestsSnapshot.docs[0].id
      });
    }

    // Check if users are already friends
    const senderFriendsRef = dbAdmin.collection('users').doc(senderId).collection('friends').doc(receiverId);
    const senderFriendDoc = await senderFriendsRef.get();
    
    if (senderFriendDoc.exists) {
      return NextResponse.json({ 
        message: 'Users are already friends',
        friendId: receiverId
      });
    }

    // Check for incoming requests (receiver to sender)
    const senderRequestsRef = dbAdmin.collection('users').doc(senderId).collection('friendship_requests');
    const incomingRequestsSnapshot = await senderRequestsRef
      .where('senderId', '==', receiverId)
      .where('status', '==', 'pending')
      .get();
    
    if (!incomingRequestsSnapshot.empty) {
      return NextResponse.json({ 
        message: 'There is already an incoming request from this user',
        requestId: incomingRequestsSnapshot.docs[0].id
      });
    }

    // Create the friend request data
    const requestData = {
      senderId,
      receiverId,
      status: 'pending',
      relationshipType: relationshipType || 'support',
      createdAt: new Date(),
      senderUsername: senderUsername || '',
      senderPhotoURL: senderPhotoURL || '',
      receiverUsername: receiverUsername || ''
    };

    // Add the request to the receiver's requests subcollection
    const docRef = await receiverRequestsRef.add(requestData);

    return NextResponse.json({ 
      message: 'Friend request sent successfully',
      requestId: docRef.id
    });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json(
      { error: 'Failed to create friend request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update a friend request (accept/decline)
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
    const { requestId, userId, action } = body;

    // Validate required fields
    if (!requestId || !userId || !action) {
      return NextResponse.json({ 
        error: 'Request ID, user ID, and action are required' 
      }, { status: 400 });
    }

    // Verify that the userId matches the authenticated user's ID
    if (userId !== authenticatedUserId) {
      console.error(`User ID mismatch: ${userId} vs authenticated ${authenticatedUserId}`);
      return NextResponse.json({ 
        error: 'Unauthorized - User ID does not match authenticated user' 
      }, { status: 403 });
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ 
        error: 'Action must be either "accept" or "decline"' 
      }, { status: 400 });
    }

    // Use admin DB for all operations
    const dbAdmin = adminDb();
    
    // Get the request document
    const requestRef = dbAdmin.collection('users').doc(userId).collection('friendship_requests').doc(requestId);
    const requestDoc = await requestRef.get();
    
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    const requestData = requestDoc.data();
    
    // Verify the request is pending and the user is the receiver
    if (requestData.status !== 'pending') {
      return NextResponse.json({ 
        error: 'This request has already been processed' 
      }, { status: 400 });
    }

    if (requestData.receiverId !== userId) {
      return NextResponse.json({ 
        error: 'You do not have permission to update this request' 
      }, { status: 403 });
    }

    // Process the action
    if (action === 'accept') {
      // Update request status
      await requestRef.update({
        status: 'accepted',
        updatedAt: new Date()
      });

      // Add each user to the other's friends collection
      const senderId = requestData.senderId;
      const senderData = {
        uid: senderId,
        username: requestData.senderUsername || '',
        photoURL: requestData.senderPhotoURL || '',
        relationshipType: requestData.relationshipType || 'support',
        createdAt: new Date()
      };

      const receiverData = {
        uid: userId,
        username: requestData.receiverUsername || '',
        relationshipType: requestData.relationshipType || 'support',
        createdAt: new Date()
      };

      // Get receiver data to fill in missing fields
      const receiverUserRef = dbAdmin.collection('users').doc(userId);
      const receiverUserDoc = await receiverUserRef.get();
      
      if (receiverUserDoc.exists) {
        const userData = receiverUserDoc.data();
        receiverData.photoURL = userData.photoURL || '';
        if (!receiverData.username) {
          receiverData.username = userData.username || '';
        }
      }

      // Add each user to the other's friends collection
      const senderFriendsRef = dbAdmin.collection('users').doc(senderId).collection('friends').doc(userId);
      const receiverFriendsRef = dbAdmin.collection('users').doc(userId).collection('friends').doc(senderId);
      
      // Use a batch to ensure both operations succeed or fail together
      const batch = dbAdmin.batch();
      batch.set(senderFriendsRef, receiverData);
      batch.set(receiverFriendsRef, senderData);
      await batch.commit();

      return NextResponse.json({ message: 'Friend request accepted' });
    } else {
      // Decline request
      await requestRef.update({
        status: 'declined',
        updatedAt: new Date()
      });

      return NextResponse.json({ message: 'Friend request declined' });
    }
  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json(
      { error: 'Failed to update friend request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}