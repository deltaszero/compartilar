import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue, Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { Auth as AdminAuth } from 'firebase-admin/auth';
import { getFirestore, Firestore, collection, query, where, getDocs, DocumentData, CollectionReference, Query } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { db as clientDb } from '@/app/lib/firebaseConfig';

// Try to get admin instances, but fall back to client if needed
let auth: AdminAuth | Auth | null;
let db: AdminFirestore | Firestore;
// Flag to distinguish between admin and client SDK
let isAdminSDK = true;

try {
  // Get the auth instance
  auth = adminAuth();
  
  // Get the firestore instance
  db = adminDb();
  
  console.log('Successfully initialized Firebase Admin SDK for children access API');
} catch (error) {
  // Properly handle unknown error type
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Failed to initialize Firebase Admin SDK for children access API, falling back:', errorMessage);
  
  // Fall back to client SDK for development
  auth = null;
  db = clientDb ? clientDb : getFirestore();
  isAdminSDK = false;
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
    
    // Execute queries based on which SDK we're using (admin or client)
    let viewerSnapshot, editorSnapshot;
    
    if (isAdminSDK) {
      // Admin SDK approach
      const childrenRef = (db as AdminFirestore).collection('children');
      
      // Create queries for children where the user is either a viewer or editor
      const viewerQuery = childrenRef.where('viewers', 'array-contains', userId);
      const editorQuery = childrenRef.where('editors', 'array-contains', userId);
      
      // Execute both queries
      [viewerSnapshot, editorSnapshot] = await Promise.all([
        viewerQuery.get(),
        editorQuery.get()
      ]);
    } else {
      // Client SDK approach
      const childrenRef = collection(db as Firestore, 'children');
      
      // Create queries for children where the user is either a viewer or editor
      const viewerQuery = query(childrenRef, where('viewers', 'array-contains', userId));
      const editorQuery = query(childrenRef, where('editors', 'array-contains', userId));
      
      // Execute both queries
      [viewerSnapshot, editorSnapshot] = await Promise.all([
        getDocs(viewerQuery),
        getDocs(editorQuery)
      ]);
    }
    
    // Process children data
    const childrenMap = new Map();
    
    // Process snapshot data with null/undefined checks
    const processSnapshot = (snapshot: any, accessLevel: 'viewer' | 'editor') => {
      if (!snapshot || !snapshot.docs) {
        console.warn(`Empty or undefined ${accessLevel} snapshot`);
        return;
      }
      
      snapshot.docs.forEach((doc: any) => {
        if (!doc) return;
        
        const childData = doc.data ? doc.data() : null;
        if (!childData) return;
        
        // Skip deleted children
        if (childData.isDeleted === true) {
          console.log(`Skipping deleted child ${doc.id} (${accessLevel} access) in API response`);
          return;
        }
        
        const firstName = childData.firstName || '';
        const lastName = childData.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        if (accessLevel === 'viewer' || !childrenMap.has(doc.id)) {
          childrenMap.set(doc.id, {
            id: doc.id,
            name: childData.name || fullName,
            firstName: firstName,
            lastName: lastName,
            photoURL: childData.photoURL || null,
            birthDate: childData.birthDate,
            gender: childData.gender || null,
            editors: childData.editors || [],
            viewers: childData.viewers || [],
            accessLevel: accessLevel,
            isDeleted: childData.isDeleted || false // Include this flag for consistency
          });
        } else if (accessLevel === 'editor' && childrenMap.has(doc.id)) {
          // Already in map, update access level to editor
          childrenMap.get(doc.id)!.accessLevel = 'editor';
        }
      });
    };
    
    // Process viewer and editor snapshots
    processSnapshot(viewerSnapshot, 'viewer');
    processSnapshot(editorSnapshot, 'editor');
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', message: errorMessage }, { status: 500 });
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
    
    let childDoc, childData: DocumentData | undefined;
    
    if (isAdminSDK) {
      // Admin SDK approach
      const childRef = (db as AdminFirestore).collection('children').doc(childId);
      childDoc = await childRef.get();
      
      if (!childDoc.exists) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }
      
      childData = childDoc.data();
      
      // Check if childData is undefined after retrieving it
      if (!childData) {
        return NextResponse.json({ error: 'Child data is empty or corrupted' }, { status: 500 });
      }
    } else {
      // Not implemented for client SDK in this function
      // This would require a different approach with client SDK methods
      return NextResponse.json({ 
        error: 'This operation requires the Admin SDK which is not available in this environment' 
      }, { status: 501 }); // 501 Not Implemented
    }
    
    // TypeScript now knows childData is defined here
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
    
    // Admin SDK is confirmed at this point based on previous checks
    // Update the child document
    const childRef = (db as AdminFirestore).collection('children').doc(childId);
    await childRef.update(updateData);
    
    // Get updated child data
    const updatedChildDoc = await childRef.get();
    const updatedChildData = updatedChildDoc.data();
    
    // Get friend user data for response
    const friendRef = (db as AdminFirestore).collection('users').doc(friendId);
    const friendDoc = await friendRef.get();
    
    let friendName = friendId;
    if (friendDoc.exists) {
      const friendData = friendDoc.data();
      if (friendData) {
        friendName = friendData.displayName || 
          `${friendData.firstName || ''} ${friendData.lastName || ''}`.trim() || 
          friendData.username || 
          friendId;
      }
    }
    
    // Safe access to child data (we already verified childData is defined above)
    const childFirstName = childData?.firstName || '';
    const childLastName = childData?.lastName || '';
    const childName = childData?.name || `${childFirstName} ${childLastName}`.trim();
    
    return NextResponse.json({
      success: true,
      accessLevel,
      childId,
      friendId,
      childName: childName,
      friendName: friendName
    });
  } catch (error) {
    console.error('Error updating child access:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', message: errorMessage }, { status: 500 });
  }
}