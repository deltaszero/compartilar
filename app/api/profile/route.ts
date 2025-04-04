import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase, errorResponse } from '@/app/lib/api-helpers';
import { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { DocumentData } from 'firebase/firestore';

// Initialize Firebase with proper typing
const { db, isAdminSDK } = initializeFirebase();

// For debugging
console.log('Initializing profile API route');

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/profile called');
    
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
    
    // Get request data from body
    const { userId, updateData } = await request.json();
    
    if (!userId) {
      console.error('Missing userId parameter');
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      console.error('Missing or empty updateData');
      return NextResponse.json({ error: 'updateData is required' }, { status: 400 });
    }
    
    // Verify Firebase token and check if user is authorized to update this profile
    if (isAdminSDK) {
      const { adminAuth } = require('@/lib/firebase-admin');
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Users can only update their own profiles
      if (decodedToken.uid !== userId) {
        return NextResponse.json({ 
          error: 'Permission denied', 
          message: 'You can only update your own profile'
        }, { status: 403 });
      }
    }
    
    console.log('Updating profile for userId:', userId);
    
    // Temporary solution for Firebase credential issue
    if (process.env.NODE_ENV === 'development' && !db) {
      console.error('Firebase not properly initialized for profile API, returning success response');
      return NextResponse.json({ success: true });
    }
    
    // Check if we're using Admin SDK (required for this operation)
    if (!isAdminSDK) {
      console.error('Admin SDK required but not available');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    
    // Use type assertion since we know this is AdminFirestore based on isAdminSDK check
    const adminDb = db as AdminFirestore;
    
    // Get the user document
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log(`User with id ${userId} not found`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Filter out sensitive fields that should not be updated via this API
    const { password, email, uid, username, ...safeUpdateData } = updateData;
    
    // Add timestamp
    const finalUpdateData = {
      ...safeUpdateData,
      updatedAt: new Date() // This will be converted to Timestamp in Firestore
    };
    
    // Update the user document
    await userRef.update(finalUpdateData);
    
    console.log(`Updated profile for user ${userId}`);
    
    return NextResponse.json({ 
      success: true,
      updatedFields: Object.keys(safeUpdateData)
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/profile called');
    
    // CSRF protection
    const requestedWith = request.headers.get('x-requested-with');
    if (requestedWith !== 'XMLHttpRequest') {
      return NextResponse.json({ error: 'CSRF verification failed' }, { status: 403 });
    }
    
    // Get the username from URL params
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    // Get token from authorization header
    const authHeader = request.headers.get('authorization');
    let currentUserId = searchParams.get('currentUserId'); // For checking friendship status
    
    // If we have an auth header, verify the token and get the user ID
    if (authHeader && authHeader.startsWith('Bearer ') && isAdminSDK) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const { adminAuth } = require('@/lib/firebase-admin');
        const decodedToken = await adminAuth.verifyIdToken(token);
        // Use the token's UID if no currentUserId provided
        if (!currentUserId) {
          currentUserId = decodedToken.uid;
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        // Continue without the token info - just means we show less data
      }
    }
    
    if (!username) {
      console.error('Missing username parameter');
      return NextResponse.json({ error: 'username parameter is required' }, { status: 400 });
    }
    
    console.log('Getting profile for username:', username);
    
    // Temporary solution for Firebase credential issue
    if (process.env.NODE_ENV === 'development' && !db) {
      console.error('Firebase not properly initialized for profile API, returning empty data');
      return NextResponse.json({ 
        error: 'Firebase not initialized', 
        userNotFound: false 
      }, { status: 500 });
    }

    // Check if we're using Admin SDK (required for this operation)
    if (!isAdminSDK) {
      console.error('Admin SDK required but not available');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    
    // Use type assertion since we know this is AdminFirestore based on isAdminSDK check
    const adminDb = db as AdminFirestore;
    
    // Query the Firestore database for the user with this username
    const usersRef = adminDb.collection('users');
    const usersQuery = usersRef.where('username', '==', username.toLowerCase());
    const usersSnapshot = await usersQuery.get();
    
    if (usersSnapshot.empty) {
      console.log(`User with username ${username} not found`);
      return NextResponse.json({ userNotFound: true }, { status: 404 });
    }
    
    // Get the user document
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    if (!userData) {
      return NextResponse.json({ error: 'User data is missing or corrupted' }, { status: 500 });
    }
    
    const userId = userDoc.id;
    
    console.log(`Found user ${userId} with username ${username}`);
    
    // Determine friendship status if currentUserId is provided
    let friendshipStatus = 'none';
    
    if (currentUserId) {
      // If viewing own profile
      if (userId === currentUserId) {
        friendshipStatus = 'self';
      } else {
        try {
          // Check if they are friends by looking in the friends collection
          const friendshipRef = adminDb.collection('users').doc(currentUserId).collection('friends').doc(userId);
          const friendshipDoc = await friendshipRef.get();
          
          if (friendshipDoc.exists) {
            // They are friends, get relationship type
            const friendshipData = friendshipDoc.data();
            if (friendshipData) {
              const relationship = friendshipData.relationshipType || 'friend';
              friendshipStatus = relationship;
            }
          } else {
            // Check if there's a pending request
            const requestsRef = adminDb.collection('users').doc(currentUserId).collection('friendship_requests');
            
            // We need a different approach for complex queries since field function is not properly typed
            // Check for pending requests where the other user is either sender or receiver
            const pendingAsSenderQuery = requestsRef
              .where('status', '==', 'pending')
              .where('senderId', '==', userId);
              
            const pendingAsReceiverQuery = requestsRef
              .where('status', '==', 'pending')
              .where('receiverId', '==', userId);
              
            const [senderSnapshot, receiverSnapshot] = await Promise.all([
              pendingAsSenderQuery.get(),
              pendingAsReceiverQuery.get()
            ]);
            
            if (!senderSnapshot.empty || !receiverSnapshot.empty) {
              friendshipStatus = 'pending';
            }
          }
        } catch (error) {
          console.error('Error checking friendship status:', error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }
    
    // Create the profile response - filter out sensitive data
    const { password, email, ...publicData } = userData;
    
    const profileData = {
      ...publicData,
      uid: userId,
      // Include email only for self
      ...(friendshipStatus === 'self' ? { email } : {}),
      // Add friendship status to response
      friendshipStatus
    };
    
    return NextResponse.json(profileData);
  } catch (error) {
    return errorResponse(error);
  }
}