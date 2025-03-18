import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header and verify token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      // Verify token using Firebase Admin SDK
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Get the authenticated user's ID from the token
    const authenticatedUserId = decodedToken.uid;

    // Get search term from query parameters
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('term');
    const userId = searchParams.get('userId'); // This should match the authenticated user ID
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate parameters
    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    // If userId is provided, verify it matches the authenticated user
    if (userId && userId !== authenticatedUserId) {
      console.error(`User ID mismatch: ${userId} vs authenticated ${authenticatedUserId}`);
      return NextResponse.json({ 
        error: 'Unauthorized - User ID in query does not match authenticated user' 
      }, { status: 403 });
    }

    if (searchTerm.length < 3) {
      return NextResponse.json({ error: 'Search term must be at least 3 characters' }, { status: 400 });
    }

    console.log(`Searching users with term: ${searchTerm} for authenticated user: ${authenticatedUserId}`);
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    // Now we can safely use the adminDb for searching
    const usersCollection = adminDb().collection('users');

    // Search by username
    const usernameSnapshot = await usersCollection
      .where('username', '>=', searchTermLower)
      .where('username', '<=', searchTermLower + '\uf8ff')
      .limit(limit)
      .get();
      
    // Search by displayName
    const displayNameSnapshot = await usersCollection
      .where('displayName', '>=', searchTermLower)
      .where('displayName', '<=', searchTermLower + '\uf8ff')
      .limit(limit)
      .get();
    
    // Define the interface for search results
    interface UserSearchResult {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      photoURL: string;
      email: string;
      displayName: string;
    }
    
    // Process the results with proper typing
    let results: UserSearchResult[] = [];
    const processedUids = new Set<string>();
    
    // Process the snapshots
    const processSnapshot = (snapshot: FirebaseFirestore.QuerySnapshot) => {
      snapshot.forEach((doc) => {
        const user = doc.data();
        // Skip current user and already processed users
        if (doc.id !== authenticatedUserId && !processedUids.has(doc.id)) {
          processedUids.add(doc.id);
          
          // Only include necessary fields for security
          results.push({
            id: doc.id, // Using id instead of uid to match client expectations
            username: user.username || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            photoURL: user.photoURL || '',
            email: user.email || '', // Include email for display purposes
            // Don't include email for privacy/security
            displayName: user.displayName || user.username || ''
          });
        }
      });
    };
    
    processSnapshot(usernameSnapshot);
    processSnapshot(displayNameSnapshot);

    // Sort results by relevance
    results.sort((a, b) => {
      const aUsername = (a.username || '').toLowerCase();
      const bUsername = (b.username || '').toLowerCase();
      const aDisplayName = a.displayName ? a.displayName.toLowerCase() : aUsername;
      const bDisplayName = b.displayName ? b.displayName.toLowerCase() : bUsername;
      
      // Exact username matches first
      if (aUsername === searchTermLower && bUsername !== searchTermLower) return -1;
      if (bUsername === searchTermLower && aUsername !== searchTermLower) return 1;
      
      // Then username starts with search term
      if (aUsername.startsWith(searchTermLower) && !bUsername.startsWith(searchTermLower)) return -1;
      if (bUsername.startsWith(searchTermLower) && !aUsername.startsWith(searchTermLower)) return 1;
      
      // Then displayName matches
      if (aDisplayName.includes(searchTermLower) && !bDisplayName.includes(searchTermLower)) return -1;
      if (bDisplayName.includes(searchTermLower) && !aDisplayName.includes(searchTermLower)) return 1;
      
      // Alphabetical by username as fallback
      return aUsername.localeCompare(bUsername);
    });

    // Limit results to requested limit
    const limitedResults = results.slice(0, limit);

    console.log(`Returning ${limitedResults.length} user search results`);
    return NextResponse.json(limitedResults);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}