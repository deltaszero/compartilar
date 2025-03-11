import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { getFirestore } from 'firebase/firestore';
import { db as clientDb } from '@/app/lib/firebaseConfig';

// Try to get admin instances, but fall back to client if needed
let auth, db;

try {
  // Get the auth instance
  auth = adminAuth();
  
  // Get the firestore instance
  db = adminDb();
  
  console.log('Successfully initialized Firebase Admin SDK for profile API');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK for profile API, falling back:', error.message);
  
  // Fall back to client SDK for development
  auth = null;
  db = clientDb ? clientDb : getFirestore();
}

// For debugging
console.log('Initializing profile API route');

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/profile called');
    
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
    
    console.log('Updating profile for userId:', userId);
    
    // Temporary solution for Firebase credential issue
    if (process.env.NODE_ENV === 'development' && !db) {
      console.error('Firebase not properly initialized for profile API, returning success response');
      return NextResponse.json({ success: true });
    }
    
    // Get the user document
    const userRef = db.collection('users').doc(userId);
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
    console.error('Error in profile update API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/profile called');
    
    // Get the username from URL params
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const currentUserId = searchParams.get('currentUserId'); // For checking friendship status
    
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

    // Query the Firestore database for the user with this username
    const usersRef = db.collection('users');
    const usersQuery = usersRef.where('username', '==', username.toLowerCase());
    const usersSnapshot = await usersQuery.get();
    
    if (usersSnapshot.empty) {
      console.log(`User with username ${username} not found`);
      return NextResponse.json({ userNotFound: true }, { status: 404 });
    }
    
    // Get the user document
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
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
          const friendshipRef = db.collection('users').doc(currentUserId).collection('friends').doc(userId);
          const friendshipDoc = await friendshipRef.get();
          
          if (friendshipDoc.exists) {
            // They are friends, get relationship type
            const relationship = friendshipDoc.data().relationshipType || 'friend';
            friendshipStatus = relationship;
          } else {
            // Check if there's a pending request
            const requestsRef = db.collection('users').doc(currentUserId).collection('friendship_requests');
            const pendingQuery = requestsRef.where('status', '==', 'pending')
              .where(field => field.where('senderId', '==', userId).or(field.where('receiverId', '==', userId)));
            
            const pendingSnapshot = await pendingQuery.get();
            
            if (!pendingSnapshot.empty) {
              friendshipStatus = 'pending';
            }
          }
        } catch (error) {
          console.error('Error checking friendship status:', error);
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
    console.error('Error in profile API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}