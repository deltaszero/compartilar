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
  
  console.log('Successfully initialized Firebase Admin SDK for profile children API');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK for profile children API, falling back:', error.message);
  
  // Fall back to client SDK for development
  auth = null;
  db = clientDb ? clientDb : getFirestore();
}

// For debugging
console.log('Initializing profile/children API route');

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/profile/children called');
    
    // Get the userId and currentUserId from URL params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const currentUserId = searchParams.get('currentUserId');
    const relationshipStatus = searchParams.get('relationshipStatus') || 'none';
    
    // Validate parameters
    if (!userId) {
      console.error('Missing userId parameter');
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }
    
    if (!currentUserId) {
      console.error('Missing currentUserId parameter');
      return NextResponse.json({ error: 'currentUserId parameter is required' }, { status: 400 });
    }
    
    console.log('Getting children for userId:', userId, 'with relationshipStatus:', relationshipStatus);
    
    // Temporary solution for Firebase credential issue
    if (process.env.NODE_ENV === 'development' && !db) {
      console.error('Firebase not properly initialized for profile children API, returning empty array');
      return NextResponse.json([]);
    }
    
    // Check if user has permission to view this profile's children
    const canViewChildren = 
      userId === currentUserId || // Own profile
      ['friend', 'support', 'coparent'].includes(relationshipStatus); // In network
    
    if (!canViewChildren) {
      console.log('User does not have permission to view children');
      return NextResponse.json({
        error: 'Permission denied',
        message: 'You do not have permission to view this user\'s children'
      }, { status: 403 });
    }
    
    // Determine which children to fetch based on the relationship
    let childrenData = [];
    
    if (userId === currentUserId) {
      // If viewing own profile, fetch all children the user has access to
      console.log('Fetching all accessible children for current user');
      
      // Query children where user is either a viewer or editor
      const viewerQuery = db.collection('children').where('viewers', 'array-contains', userId);
      const editorQuery = db.collection('children').where('editors', 'array-contains', userId);
      
      const [viewerSnapshot, editorSnapshot] = await Promise.all([
        viewerQuery.get(),
        editorQuery.get()
      ]);
      
      // Process children data into a map to remove duplicates
      const childrenMap = new Map();
      
      // Process viewer children
      viewerSnapshot.docs.forEach(doc => {
        const childData = doc.data();
        
        // Skip deleted children
        if (childData.isDeleted === true) {
          console.log(`Skipping deleted child ${doc.id} (viewer access) in profile/children API`);
          return;
        }
        
        childrenMap.set(doc.id, {
          id: doc.id,
          ...childData,
          accessLevel: 'viewer'
        });
      });
      
      // Process editor children, overriding accessLevel if needed
      editorSnapshot.docs.forEach(doc => {
        const childData = doc.data();
        
        // Skip deleted children
        if (childData.isDeleted === true) {
          console.log(`Skipping deleted child ${doc.id} (editor access) in profile/children API`);
          return;
        }
        
        if (childrenMap.has(doc.id)) {
          // Update access level to editor
          childrenMap.get(doc.id).accessLevel = 'editor';
        } else {
          // Add new child with editor access
          childrenMap.set(doc.id, {
            id: doc.id,
            ...childData,
            accessLevel: 'editor'
          });
        }
      });
      
      // Convert map to array
      childrenData = Array.from(childrenMap.values());
    } else {
      // Viewing someone else's profile
      console.log('Fetching shared children between profile owner and current user');
      
      // For non-self view, we need to find the intersection of children
      // that both users have access to
      
      // Query children where both users are editors (strong relationship, full access)
      const editorQuery = db.collection('children')
        .where('editors', 'array-contains', userId);
      
      const editorSnapshot = await editorQuery.get();
      
      // Filter to only include children that the current user also has access to
      const accessibleChildren = [];
      
      for (const doc of editorSnapshot.docs) {
        const childData = doc.data();
        
        // Skip deleted children
        if (childData.isDeleted === true) {
          console.log(`Skipping deleted child ${doc.id} in profile view (other user's profile)`);
          continue;
        }
        
        const editors = childData.editors || [];
        const viewers = childData.viewers || [];
        
        // Check if current user has access to this child
        if (editors.includes(currentUserId) || viewers.includes(currentUserId)) {
          // Determine access level for current user
          const accessLevel = editors.includes(currentUserId) ? 'editor' : 'viewer';
          
          accessibleChildren.push({
            id: doc.id,
            ...childData,
            accessLevel
          });
        }
      }
      
      childrenData = accessibleChildren;
    }
    
    console.log(`Returning ${childrenData.length} children`);
    
    // Format the response data - remove sensitive fields
    const formattedChildren = childrenData.map(child => ({
      id: child.id,
      firstName: child.firstName || '',
      lastName: child.lastName || '',
      name: child.name || `${child.firstName || ''} ${child.lastName || ''}`.trim(),
      birthDate: child.birthDate || '',
      gender: child.gender || null,
      photoURL: child.photoURL || null,
      accessLevel: child.accessLevel || 'viewer',
      editors: child.editors || [],
      viewers: child.viewers || []
    }));
    
    return NextResponse.json(formattedChildren);
  } catch (error) {
    console.error('Error in profile children API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}