import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirestore } from 'firebase/firestore';
import { db as clientDb } from '@/app/lib/firebaseConfig';

// Try to get admin instances, but fall back to client if needed
let auth, db;

try {
  // Get the auth instance
  auth = adminAuth();
  
  // Get the firestore instance
  db = adminDb();
  
  console.log('Successfully initialized Firebase Admin SDK for friend requests');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK for friend requests, falling back:', error.message);
  
  // Fall back to client SDK for development
  auth = null;
  db = clientDb ? clientDb : getFirestore();
}

// For debugging
console.log('Initializing friends/requests API route');

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/friends/requests called');
    
    // Get the userId from URL params or authorization
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Verify we have a userId
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }
    
    console.log('Getting friend requests for userId:', userId);
    
    // Temporary solution for Firebase credential issue:
    // Since we can't properly connect to Firestore in this environment yet,
    // we'll return an empty array for now
    if (process.env.NODE_ENV === 'development' && !db) {
      console.error('Firebase not properly initialized for friend requests, returning empty array');
      return NextResponse.json([]);
    }
    
    // Query pending friendship requests where this user is the receiver
    const requestsRef = db.collection('users').doc(userId).collection('friendship_requests');
    const pendingRequestsQuery = requestsRef.where('status', '==', 'pending');
    const pendingRequestsSnapshot = await pendingRequestsQuery.get();
    
    if (pendingRequestsSnapshot.empty) {
      console.log(`No pending requests found for user ${userId}`);
      return NextResponse.json([]);
    }
    
    // Process the requests data
    const requestsPromises = pendingRequestsSnapshot.docs.map(async (doc) => {
      try {
        const requestData = doc.data();
        const senderId = requestData.senderId;
        
        // Get the sender's user data
        const senderDoc = await db.collection('users').doc(senderId).get();
        if (!senderDoc.exists) {
          console.log(`Sender ${senderId} not found, skipping request`);
          return null;
        }
        
        const senderData = senderDoc.data();
        
        return {
          id: doc.id,
          senderId: senderId,
          senderUsername: senderData.username || '',
          senderPhotoURL: senderData.photoURL || null,
          senderFirstName: senderData.firstName || '',
          senderLastName: senderData.lastName || '',
          receiverId: userId,
          receiverUsername: requestData.receiverUsername || '',
          receiverPhotoURL: requestData.receiverPhotoURL || null,
          receiverFirstName: requestData.receiverFirstName || '',
          receiverLastName: requestData.receiverLastName || '',
          status: 'pending',
          relationshipType: requestData.relationshipType || 'other',
          createdAt: requestData.createdAt ? requestData.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: requestData.updatedAt ? requestData.updatedAt.toDate().toISOString() : new Date().toISOString()
        };
      } catch (docError) {
        console.error(`Error processing request document:`, docError);
        return null; // Skip this request on error
      }
    });
    
    const requestsData = await Promise.all(requestsPromises);
    
    // Filter out any null values (failed lookups)
    const validRequests = requestsData.filter(request => request !== null);
    
    console.log(`Returning ${validRequests.length} pending requests for user ${userId}`);
    return NextResponse.json(validRequests);
  } catch (error) {
    console.error('Error in friend requests API:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/friends/requests called');
    
    // Get request data from body
    const { requestId, status } = await request.json();
    
    // Validate request data
    if (!requestId || !status) {
      return NextResponse.json({ error: 'requestId and status are required' }, { status: 400 });
    }
    
    if (status !== 'accepted' && status !== 'declined') {
      return NextResponse.json({ error: 'status must be "accepted" or "declined"' }, { status: 400 });
    }
    
    console.log('Handling request:', { requestId, status });
    
    // Find which user collection contains this request
    // This approach enables finding the request without knowing the receiver's ID upfront
    const collectionsToCheck = ['friendship_requests'];
    let requestDoc = null;
    let receiverId = null;
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    // Search for the request in each user's friendship_requests collection
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      for (const collectionName of collectionsToCheck) {
        const requestRef = db.collection('users').doc(userId).collection(collectionName).doc(requestId);
        const snapshot = await requestRef.get();
        
        if (snapshot.exists) {
          requestDoc = snapshot;
          receiverId = userId;
          break;
        }
      }
      
      if (requestDoc) break;
    }
    
    if (!requestDoc) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }
    
    const requestData = requestDoc.data();
    const senderId = requestData.senderId;
    
    // Update request status
    await requestDoc.ref.update({
      status: status,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // If request is accepted, create the friendship
    if (status === 'accepted') {
      // Get user data for both sender and receiver
      const [senderDoc, receiverDoc] = await Promise.all([
        db.collection('users').doc(senderId).get(),
        db.collection('users').doc(receiverId).get()
      ]);
      
      if (!senderDoc.exists || !receiverDoc.exists) {
        return NextResponse.json({ error: 'One or both users not found' }, { status: 404 });
      }
      
      const senderData = senderDoc.data();
      const receiverData = receiverDoc.data();
      
      // Create friendship in both users' collections
      const relationshipType = requestData.relationshipType || 'other';
      const timestamp = FieldValue.serverTimestamp();
      
      // Add sender to receiver's friends
      await db.collection('users').doc(receiverId).collection('friends').doc(senderId).set({
        userId: senderId,
        username: senderData.username || '',
        relationshipType: relationshipType,
        addedAt: timestamp
      });
      
      // Add receiver to sender's friends
      await db.collection('users').doc(senderId).collection('friends').doc(receiverId).set({
        userId: receiverId,
        username: receiverData.username || '',
        relationshipType: relationshipType,
        addedAt: timestamp
      });
      
      // Return the new friend data
      const friend = {
        id: senderId,
        username: senderData.username || '',
        firstName: senderData.firstName || '',
        lastName: senderData.lastName || '',
        displayName: senderData.displayName || `${senderData.firstName || ''} ${senderData.lastName || ''}`.trim(),
        photoURL: senderData.photoURL || null,
        relationshipType: relationshipType,
        addedAt: new Date().toISOString()
      };
      
      return NextResponse.json({
        status: status,
        friend: friend
      });
    } else {
      // Just return status for declined requests
      return NextResponse.json({
        status: status,
        friend: null
      });
    }
  } catch (error) {
    console.error('Error handling friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint for creating a new friend request
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/friends/requests called');
    
    // Get request data from body
    const { senderId, receiverId, relationshipType } = await request.json();
    
    // Validate request data
    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'senderId and receiverId are required' }, { status: 400 });
    }
    
    if (senderId === receiverId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }
    
    console.log('Creating friend request:', { senderId, receiverId, relationshipType });
    
    // Get user data for both sender and receiver
    const [senderDoc, receiverDoc] = await Promise.all([
      db.collection('users').doc(senderId).get(),
      db.collection('users').doc(receiverId).get()
    ]);
    
    if (!senderDoc.exists || !receiverDoc.exists) {
      return NextResponse.json({ error: 'One or both users not found' }, { status: 404 });
    }
    
    const senderData = senderDoc.data();
    const receiverData = receiverDoc.data();
    
    // Check if a friendship already exists
    const existingFriendshipRef = db.collection('users').doc(receiverId).collection('friends').doc(senderId);
    const existingFriendship = await existingFriendshipRef.get();
    
    if (existingFriendship.exists) {
      return NextResponse.json({ error: 'Users are already friends' }, { status: 400 });
    }
    
    // Check if a request already exists
    const existingRequestsQuery = db.collection('users')
      .doc(receiverId)
      .collection('friendship_requests')
      .where('senderId', '==', senderId)
      .where('status', '==', 'pending');
    
    const existingRequests = await existingRequestsQuery.get();
    
    if (!existingRequests.empty) {
      return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
    }
    
    // Create the friend request
    const requestRef = db.collection('users').doc(receiverId).collection('friendship_requests').doc();
    
    await requestRef.set({
      senderId: senderId,
      senderUsername: senderData.username || '',
      senderPhotoURL: senderData.photoURL || null,
      senderFirstName: senderData.firstName || '',
      senderLastName: senderData.lastName || '',
      receiverId: receiverId,
      receiverUsername: receiverData.username || '',
      receiverPhotoURL: receiverData.photoURL || null,
      receiverFirstName: receiverData.firstName || '',
      receiverLastName: receiverData.lastName || '',
      status: 'pending',
      relationshipType: relationshipType || 'other',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({
      success: true,
      requestId: requestRef.id
    });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}