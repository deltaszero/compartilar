import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase, errorResponse } from '@/app/lib/api-helpers';
import { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { DocumentData } from 'firebase/firestore';

// Initialize Firebase with proper typing
const { db, isAdminSDK } = initializeFirebase();

// For debugging
console.log('Initializing profile/children API route');

// Define the child data interface
interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  birthDate: string;
  gender: string | null;
  photoURL: string | null;
  accessLevel: 'viewer' | 'editor';
  editors: string[];
  viewers: string[];
  isDeleted?: boolean;
  [key: string]: any; // For other properties that might be in the data
}

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
    
    // Check if we're using Admin SDK (required for this operation)
    if (!isAdminSDK) {
      console.error('Admin SDK required but not available');
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    
    // Use type assertion since we know this is AdminFirestore based on isAdminSDK check
    const adminDb = db as AdminFirestore;
    
    // Determine which children to fetch based on the relationship
    let childrenData: ChildData[] = [];
    
    if (userId === currentUserId) {
      // If viewing own profile, fetch all children the user has access to
      console.log('Fetching all accessible children for current user');
      
      // Query children where user is either a viewer or editor
      const viewerQuery = adminDb.collection('children').where('viewers', 'array-contains', userId);
      const editorQuery = adminDb.collection('children').where('editors', 'array-contains', userId);
      
      const [viewerSnapshot, editorSnapshot] = await Promise.all([
        viewerQuery.get(),
        editorQuery.get()
      ]);
      
      // Process children data into a map to remove duplicates
      const childrenMap = new Map<string, ChildData>();
      
      // Process viewer children
      viewerSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data) return;
        
        // Skip deleted children
        if (data.isDeleted === true) {
          console.log(`Skipping deleted child ${doc.id} (viewer access) in profile/children API`);
          return;
        }
        
        childrenMap.set(doc.id, {
          id: doc.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          birthDate: data.birthDate || '',
          gender: data.gender || null,
          photoURL: data.photoURL || null,
          editors: data.editors || [],
          viewers: data.viewers || [],
          accessLevel: 'viewer',
          isDeleted: data.isDeleted || false
        });
      });
      
      // Process editor children, overriding accessLevel if needed
      editorSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data) return;
        
        // Skip deleted children
        if (data.isDeleted === true) {
          console.log(`Skipping deleted child ${doc.id} (editor access) in profile/children API`);
          return;
        }
        
        if (childrenMap.has(doc.id)) {
          // Update access level to editor
          const child = childrenMap.get(doc.id);
          if (child) {
            child.accessLevel = 'editor';
          }
        } else {
          // Add new child with editor access
          childrenMap.set(doc.id, {
            id: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            birthDate: data.birthDate || '',
            gender: data.gender || null,
            photoURL: data.photoURL || null,
            editors: data.editors || [],
            viewers: data.viewers || [],
            accessLevel: 'editor',
            isDeleted: data.isDeleted || false
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
      const editorQuery = adminDb.collection('children')
        .where('editors', 'array-contains', userId);
      
      const editorSnapshot = await editorQuery.get();
      
      // Filter to only include children that the current user also has access to
      const accessibleChildren: ChildData[] = [];
      
      for (const doc of editorSnapshot.docs) {
        const data = doc.data();
        if (!data) continue;
        
        // Skip deleted children
        if (data.isDeleted === true) {
          console.log(`Skipping deleted child ${doc.id} in profile view (other user's profile)`);
          continue;
        }
        
        const editors = data.editors || [];
        const viewers = data.viewers || [];
        
        // Check if current user has access to this child
        if (editors.includes(currentUserId) || viewers.includes(currentUserId)) {
          // Determine access level for current user
          const accessLevel = editors.includes(currentUserId) ? 'editor' : 'viewer';
          
          accessibleChildren.push({
            id: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            birthDate: data.birthDate || '',
            gender: data.gender || null,
            photoURL: data.photoURL || null,
            editors: editors,
            viewers: viewers,
            accessLevel: accessLevel,
            isDeleted: data.isDeleted || false
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
    return errorResponse(error);
  }
}