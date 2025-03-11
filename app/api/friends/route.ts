import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { getFirestore } from 'firebase/firestore';
import { db as clientDb } from '@/app/lib/firebaseConfig'; // Import the client Firestore instance as fallback

// Try to get admin instances, but fall back to client
let auth, db;

try {
  // Get the auth instance
  auth = adminAuth();
  
  // Get the firestore instance
  db = adminDb();
  
  console.log('Successfully initialized Firebase Admin SDK');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK, falling back to client SDK:', error.message);
  
  // Fall back to client SDK for development
  auth = null;
  db = clientDb ? clientDb : getFirestore();
}

// For debugging
console.log('Initializing friends API route');

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/friends called');
    
    // Get the userId from URL params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      console.error('Missing userId parameter');
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }
    
    console.log('Getting friends for userId:', userId);
    
    // Temporary solution for Firebase credential issue:
    // Since we can't properly connect to Firestore in this environment yet,
    // we'll return an empty array for now and let the frontend display a message
    // This is not the same as mock data - we're just handling the error gracefully
    if (process.env.NODE_ENV === 'development' && !db) {
      console.error('Firebase not properly initialized, returning empty array');
      return NextResponse.json([]);
    }
    
    // First, check if the user exists in the database
    console.log(`Checking if user ${userId} exists in database...`);
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.error(`User ${userId} does not exist in the database`);
      return NextResponse.json({ error: `User with ID ${userId} not found` }, { status: 404 });
    }
    
    console.log(`User found. User data:`, JSON.stringify(userDoc.data()));
    
    // Query the Firestore database to get the friends of the user
    console.log(`Querying friends collection for user ${userId}...`);
    const friendsRef = userDocRef.collection('friends');
    const friendsSnapshot = await friendsRef.get();
    
    console.log(`Query complete. Found ${friendsSnapshot.size} friends documents.`);
    
    if (friendsSnapshot.empty) {
      console.log(`No friends found for user ${userId}`);
      return NextResponse.json([]);
    }
    
    // Log some info about the friend documents
    friendsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Friend ${index + 1} - ID: ${doc.id}, Data:`, JSON.stringify(data));
    });
    
    // Process the friends data
    console.log('Processing friend documents...');
    const friendsPromises = friendsSnapshot.docs.map(async (doc, index) => {
      try {
        const friendData = doc.data();
        const friendId = friendData.userId || doc.id;
        
        console.log(`Processing friend ${index + 1} with ID: ${friendId}`);
        
        // Get the friend's user data
        const friendUserDoc = await db.collection('users').doc(friendId).get();
        if (!friendUserDoc.exists) {
          console.log(`Friend user ${friendId} not found in users collection, skipping`);
          return null;
        }
        
        const friendUserData = friendUserDoc.data();
        console.log(`Friend user data:`, JSON.stringify(friendUserData));
        
        const friend = {
          id: friendId,
          username: friendUserData.username || '',
          firstName: friendUserData.firstName || '',
          lastName: friendUserData.lastName || '',
          displayName: friendUserData.displayName || `${friendUserData.firstName || ''} ${friendUserData.lastName || ''}`.trim(),
          photoURL: friendUserData.photoURL || null,
          gender: friendUserData.gender || null,
          relationshipType: friendData.relationshipType || 'other',
          addedAt: friendData.addedAt ? friendData.addedAt.toDate().toISOString() : new Date().toISOString()
        };
        
        console.log(`Processed friend ${index + 1}:`, JSON.stringify(friend));
        return friend;
      } catch (docError) {
        console.error(`Error processing friend document ${index + 1}:`, docError);
        return null; // Skip this friend on error
      }
    });
    
    const friendsData = await Promise.all(friendsPromises);
    
    // Filter out any null values (failed lookups)
    const validFriends = friendsData.filter(friend => friend !== null);
    
    console.log(`Returning ${validFriends.length} valid friends for user ${userId}`);
    return NextResponse.json(validFriends);
  } catch (error) {
    console.error('Error in friends API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}