import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase, errorResponse } from '@/app/lib/api-helpers';
import { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { Firestore, DocumentData } from 'firebase/firestore';

// Initialize Firebase with proper typing
const { db, isAdminSDK } = initializeFirebase();

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
    
    // Temporary solution for Firebase credential issue
    if (process.env.NODE_ENV === 'development' && !db) {
      console.error('Firebase not properly initialized, returning empty array');
      return NextResponse.json([]);
    }
    
    // Check if we're using Admin SDK (required for this operation)
    if (!isAdminSDK) {
      console.error('Admin SDK required but not available');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    
    // Use type assertion since we know this is AdminFirestore based on isAdminSDK check
    const adminDb = db as AdminFirestore;
    
    // First, check if the user exists in the database
    console.log(`Checking if user ${userId} exists in database...`);
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.error(`User ${userId} does not exist in the database`);
      return NextResponse.json({ error: `User with ID ${userId} not found` }, { status: 404 });
    }
    
    const userData = userDoc.data();
    console.log(`User found. User data:`, userData ? JSON.stringify(userData) : 'undefined');
    
    // Query the Firestore database to get the friends of the user
    console.log(`Querying friends collection for user ${userId}...`);
    const friendsRef = userDocRef.collection('friends');
    const friendsSnapshot = await friendsRef.get();
    
    console.log(`Query complete. Found ${friendsSnapshot.size} friends documents.`);
    
    if (friendsSnapshot.empty) {
      console.log(`No friends found for user ${userId}`);
      return NextResponse.json([]);
    }
    
    // Process the friends data
    console.log('Processing friend documents...');
    
    // Define Friend interface
    interface Friend {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      displayName: string;
      photoURL: string | null;
      gender: string | null;
      relationshipType: string;
      addedAt: string;
    }
    
    const friendsPromises: Promise<Friend | null>[] = friendsSnapshot.docs.map(async (doc, index) => {
      try {
        const friendData = doc.data();
        if (!friendData) return null;
        
        const friendId = friendData.userId || doc.id;
        
        console.log(`Processing friend ${index + 1} with ID: ${friendId}`);
        
        // Get the friend's user data
        const friendUserDoc = await adminDb.collection('users').doc(friendId).get();
        if (!friendUserDoc.exists) {
          console.log(`Friend user ${friendId} not found in users collection, skipping`);
          return null;
        }
        
        const friendUserData = friendUserDoc.data();
        if (!friendUserData) {
          console.log(`Friend user data is undefined, skipping`);
          return null;
        }
        
        const firstName = friendUserData.firstName || '';
        const lastName = friendUserData.lastName || '';
        
        const friend: Friend = {
          id: friendId,
          username: friendUserData.username || '',
          firstName: firstName,
          lastName: lastName,
          displayName: friendUserData.displayName || `${firstName} ${lastName}`.trim(),
          photoURL: friendUserData.photoURL || null,
          gender: friendUserData.gender || null,
          relationshipType: friendData.relationshipType || 'other',
          addedAt: friendData.addedAt ? new Date(friendData.addedAt.toDate()).toISOString() : new Date().toISOString()
        };
        
        return friend;
      } catch (docError) {
        console.error(`Error processing friend document ${index + 1}:`, docError);
        return null; // Skip this friend on error
      }
    });
    
    const friendsData = await Promise.all(friendsPromises);
    
    // Filter out any null values (failed lookups)
    const validFriends = friendsData.filter((friend): friend is Friend => friend !== null);
    
    console.log(`Returning ${validFriends.length} valid friends for user ${userId}`);
    return NextResponse.json(validFriends);
  } catch (error) {
    return errorResponse(error);
  }
}