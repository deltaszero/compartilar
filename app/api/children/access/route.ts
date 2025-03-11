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
  
  console.log('Successfully initialized Firebase Admin SDK for children access API');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK for children access API, falling back:', error.message);
  
  // Fall back to client SDK for development
  auth = null;
  db = clientDb ? clientDb : getFirestore();
}

// For debugging
console.log('Initializing children/access API route');

// GET endpoint for retrieving user's children with access control info
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/children/access called');
    
    // Get the userId from URL params or token verification
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const friendId = searchParams.get('friendId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }
    
    console.log('Getting children for userId:', userId, 'with friendId:', friendId);
    
    // Temporary solution for Firebase credential issue:
    // Since we can't properly connect to Firestore in this environment yet,
    // we'll return an empty array for now
    if (process.env.NODE_ENV === 'development' && !db) {
      console.error('Firebase not properly initialized for children access API, returning empty array');
      return NextResponse.json([]);
    }
    
    // Query the Firestore database for children that the user has access to
    const childrenRef = db.collection('children');
    
    // Create queries for children where the user is either a viewer or editor
    const viewerQuery = childrenRef.where('viewers', 'array-contains', userId);
    const editorQuery = childrenRef.where('editors', 'array-contains', userId);
    
    // Execute both queries
    const [viewerSnapshot, editorSnapshot] = await Promise.all([
      viewerQuery.get(),
      editorQuery.get()
    ]);
    
    // Process children data
    const childrenMap = new Map();
    
    // Add children from viewer query (excluding deleted children)
    viewerSnapshot.docs.forEach(doc => {
      const childData = doc.data();
      
      // Skip deleted children
      if (childData.isDeleted === true) {
        console.log(`Skipping deleted child ${doc.id} (viewer access) in API response`);
        return;
      }
      
      childrenMap.set(doc.id, {
        id: doc.id,
        name: childData.name || `${childData.firstName || ''} ${childData.lastName || ''}`.trim(),
        firstName: childData.firstName || '',
        lastName: childData.lastName || '',
        photoURL: childData.photoURL || null,
        birthDate: childData.birthDate,
        gender: childData.gender || null,
        editors: childData.editors || [],
        viewers: childData.viewers || [],
        accessLevel: 'viewer',
        isDeleted: childData.isDeleted || false // Include this flag for consistency
      });
    });
    
    // Add children from editor query, updating access level if needed (excluding deleted children)
    editorSnapshot.docs.forEach(doc => {
      const childData = doc.data();
      
      // Skip deleted children
      if (childData.isDeleted === true) {
        console.log(`Skipping deleted child ${doc.id} (editor access) in API response`);
        return;
      }
      
      if (childrenMap.has(doc.id)) {
        // Already in map, update access level to editor
        childrenMap.get(doc.id).accessLevel = 'editor';
      } else {
        // Not in map, add with editor access level
        childrenMap.set(doc.id, {
          id: doc.id,
          name: childData.name || `${childData.firstName || ''} ${childData.lastName || ''}`.trim(),
          firstName: childData.firstName || '',
          lastName: childData.lastName || '',
          photoURL: childData.photoURL || null,
          birthDate: childData.birthDate,
          gender: childData.gender || null,
          editors: childData.editors || [],
          viewers: childData.viewers || [],
          accessLevel: 'editor',
          isDeleted: childData.isDeleted || false // Include this flag for consistency
        });
      }
    });
    
    // Convert map to array
    let children = Array.from(childrenMap.values());
    
    console.log(`Found ${children.length} children for user ${userId}`);
    
    // If friendId is specified, include permission info for that friend
    if (friendId) {
      children = children.map(child => {
        const isEditor = child.editors.includes(friendId);
        const isViewer = child.viewers.includes(friendId);
        
        return {
          ...child,
          friendAccessLevel: isEditor ? 'editor' : (isViewer ? 'viewer' : 'none')
        };
      });
    }
    
    return NextResponse.json(children);
  } catch (error) {
    console.error('Error in children/access API:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

// PUT endpoint for updating child access permissions
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/children/access called');
    
    // Get request data from body
    const { childId, friendId, accessLevel } = await request.json();
    
    // Validate request data
    if (!childId || !friendId) {
      return NextResponse.json({ error: 'childId and friendId are required' }, { status: 400 });
    }
    
    if (!['editor', 'viewer', 'none'].includes(accessLevel)) {
      return NextResponse.json({ error: 'accessLevel must be "editor", "viewer", or "none"' }, { status: 400 });
    }
    
    console.log('Updating child access:', { childId, friendId, accessLevel });
    
    // Get the child document
    const childRef = db.collection('children').doc(childId);
    const childDoc = await childRef.get();
    
    if (!childDoc.exists) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }
    
    const childData = childDoc.data();
    const editors = childData.editors || [];
    const viewers = childData.viewers || [];
    
    // Update arrays based on the new access level
    let updateData = {};
    
    if (accessLevel === 'editor') {
      // Add to editors, remove from viewers if present
      updateData = {
        editors: FieldValue.arrayUnion(friendId),
        viewers: FieldValue.arrayRemove(friendId),
        updatedAt: FieldValue.serverTimestamp()
      };
    } else if (accessLevel === 'viewer') {
      // Add to viewers, remove from editors if present
      updateData = {
        viewers: FieldValue.arrayUnion(friendId),
        editors: FieldValue.arrayRemove(friendId),
        updatedAt: FieldValue.serverTimestamp()
      };
    } else if (accessLevel === 'none') {
      // Remove from both arrays
      updateData = {
        editors: FieldValue.arrayRemove(friendId),
        viewers: FieldValue.arrayRemove(friendId),
        updatedAt: FieldValue.serverTimestamp()
      };
    }
    
    // Update the child document
    await childRef.update(updateData);
    
    // Get updated child data
    const updatedChildDoc = await childRef.get();
    const updatedChildData = updatedChildDoc.data();
    
    // Get friend user data for response
    const friendRef = db.collection('users').doc(friendId);
    const friendDoc = await friendRef.get();
    
    let friendName = friendId;
    if (friendDoc.exists) {
      const friendData = friendDoc.data();
      friendName = friendData.displayName || 
        `${friendData.firstName || ''} ${friendData.lastName || ''}`.trim() || 
        friendData.username || 
        friendId;
    }
    
    return NextResponse.json({
      success: true,
      accessLevel,
      childId,
      friendId,
      childName: childData.name || `${childData.firstName || ''} ${childData.lastName || ''}`.trim(),
      friendName: friendName
    });
  } catch (error) {
    console.error('Error updating child access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}