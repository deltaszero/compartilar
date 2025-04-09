import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
// Remove usePremiumFeatures import as it can't be used in server components
// Import FieldValue for serverTimestamp
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST handler to create a new child
 */
export async function POST(request: NextRequest) {
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
  
  try {
    // Verify Firebase token - note that adminAuth is a function that returns the auth instance
    const auth = adminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get request body with extra validation
    let body;
    try {
      body = await request.json();
      console.log('Received request body:', JSON.stringify(body));
    } catch (error) {
      console.error('Error parsing JSON body:', error);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: error instanceof Error ? error.message : 'Unknown parsing error'
      }, { status: 400 });
    }
    
    // Extract fields with safe defaults
    const firstName = body.firstName || '';
    const lastName = body.lastName || '';
    const birthDate = body.birthDate || '';
    const gender = body.gender || null;
    const photoURL = body.photoURL || null;
    const notes = body.notes || '';
    const viewers = Array.isArray(body.viewers) ? body.viewers : [];
    const editors = Array.isArray(body.editors) ? body.editors : [];
    
    // Validate required fields
    if (!firstName || !lastName || !birthDate) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        message: 'First name, last name, and birth date are required' 
      }, { status: 400 });
    }
    
    // Make sure the creator is in the editors list
    if (!editors.includes(userId)) {
      editors.push(userId);
    }
    
    // Check premium status for multiple children
    const db = adminDb();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }
    
    // Check premium status from user data
    const isPremium = userData.subscription?.status === 'active' || 
                     userData.subscription?.plan === 'premium' ||
                     userData.subscriptionStatus === 'active';
    
    // Count existing children where user is creator
    const existingChildrenQuery = await db.collection('children')
      .where('createdBy', '==', userId)
      .where('isDeleted', '==', false)
      .get();
    
    const childCount = existingChildrenQuery.size;
    
    // Check if free user has reached their limit
    if (!isPremium && childCount >= 1) {
      return NextResponse.json({ 
        error: 'Free tier limit reached',
        message: 'Free users can create only 1 child. Upgrade to premium for unlimited children.'
      }, { status: 403 });
    }
    
    // Create child document
    const childRef = db.collection('children').doc();
    
    // Prepare child data
    const childData = {
      firstName,
      lastName,
      birthDate,
      gender: gender || null,
      photoURL: photoURL || null,
      notes: notes || "",
      createdBy: userId,
      editors,
      viewers,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isDeleted: false
    };
    
    // Log data we're about to write
    console.log('Writing child data to Firestore:', {
      ...childData,
      createdAt: 'serverTimestamp()',
      updatedAt: 'serverTimestamp()'
    });
    
    // Write to database
    await childRef.set(childData);
    
    // Return success with new child ID
    return NextResponse.json({
      success: true,
      id: childRef.id,
      message: 'Child created successfully'
    });
    
  } catch (error) {
    // Enhanced error logging
    console.error('Error creating child:', error);
    
    // Check if it's a Firebase error with code
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Unknown error occurred';
      
    // Return more specific error message for debugging
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET handler to retrieve children
 */
export async function GET(request: NextRequest) {
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
  
  try {
    // Verify Firebase token - note that adminAuth is a function that returns the auth instance
    const auth = adminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const currentUserId = decodedToken.uid;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || currentUserId;
    const childId = searchParams.get('childId');
    
    // Validate permissions - only allow user to see their own children or ones they have access to
    if (userId !== currentUserId) {
      return NextResponse.json({ 
        error: 'Permission denied', 
        message: 'You can only view your own children by default.' 
      }, { status: 403 });
    }
    
    // Get Firestore instance
    const db = adminDb();
    
    // Query setup
    let childrenQuery;
    
    if (childId) {
      // If childId is provided, just get that one child
      const childRef = db.collection('children').doc(childId);
      const childDoc = await childRef.get();
      
      if (!childDoc.exists) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }
      
      const childData = childDoc.data();
      
      // Check if user has access to this child
      if (childData && (childData.editors.includes(currentUserId) || childData.viewers.includes(currentUserId))) {
        const childResponse = {
          id: childDoc.id,
          ...childData,
          accessLevel: childData.editors.includes(currentUserId) ? 'editor' : 'viewer'
        };
        
        return NextResponse.json(childResponse);
      } else {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }
    
    // Get all children where user is either editor or viewer
    const editorQuery = db.collection('children')
      .where('editors', 'array-contains', userId)
      .where('isDeleted', '==', false);
      
    const viewerQuery = db.collection('children')
      .where('viewers', 'array-contains', userId)
      .where('isDeleted', '==', false);
      
    // Get both query results
    const [editorResults, viewerResults] = await Promise.all([
      editorQuery.get(),
      viewerQuery.get()
    ]);
    
    // Process results with a Map to handle duplicate children (should be rare)
    const childrenMap = new Map();
    
    // Process editor children first
    editorResults.forEach(doc => {
      const data = doc.data();
      childrenMap.set(doc.id, {
        id: doc.id,
        ...data,
        accessLevel: 'editor'
      });
    });
    
    // Then process viewer children, not overriding if already an editor
    viewerResults.forEach(doc => {
      if (!childrenMap.has(doc.id)) {
        const data = doc.data();
        childrenMap.set(doc.id, {
          id: doc.id,
          ...data,
          accessLevel: 'viewer'
        });
      }
    });
    
    // Convert to array and return
    const children = Array.from(childrenMap.values());
    
    return NextResponse.json(children);
  } catch (error) {
    console.error('Error getting children:', error);
    
    // Enhanced error message
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Unknown error occurred';
      
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}