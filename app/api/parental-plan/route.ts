import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET - Fetch multiple parental plans
 * 
 * Query parameters:
 * - userId: (optional) Filter plans by user ID (owner, editor, or viewer)
 * - childId: (optional) Filter plans linked to a specific child
 * - limit: (optional) Number of plans to return, default 20
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
    // Verify the Firebase auth token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    const childId = searchParams.get('childId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    
    // Start with base collection reference
    const collectionRef = adminDb().collection('parental_plans');
    
    // Check if the collection exists first to avoid errors on empty collections
    const collectionCheck = await collectionRef.limit(1).get();
    
    // If collection is empty or doesn't exist, return empty array early
    if (collectionCheck.empty) {
      return NextResponse.json([]);
    }
    
    // Base query - exclude deleted plans
    let query = collectionRef.where('isDeleted', '==', false);
    
    // If specific user ID is provided (and not the current user)
    if (queryUserId && queryUserId !== userId) {
      // User can only see other users' plans if they have access
      query = query.where('viewers', 'array-contains', userId);
    } else {
      // By default, show plans where user is owner, editor, or viewer
      // Note: Using separate queries for owner, editor, and viewer to avoid index issues
      try {
        query = query.where('accessibleBy', 'array-contains', userId);
      } catch (error) {
        // Fallback if compound query fails or index doesn't exist
        console.warn('Using fallback query method for parental plans');
        const ownerQuery = collectionRef
          .where('isDeleted', '==', false)
          .where('owner', '==', userId);
          
        const editorsQuery = collectionRef
          .where('isDeleted', '==', false)
          .where('editors', 'array-contains', userId);
          
        const viewersQuery = collectionRef
          .where('isDeleted', '==', false)
          .where('viewers', 'array-contains', userId);
          
        // Execute all queries and merge results
        const [ownerSnapshot, editorsSnapshot, viewersSnapshot] = await Promise.all([
          ownerQuery.get(),
          editorsQuery.get(),
          viewersQuery.get()
        ]);
        
        // Process and merge results
        const plans: any[] = [];
        const processedIds = new Set();
        
        [ownerSnapshot, editorsSnapshot, viewersSnapshot].forEach(snapshot => {
          snapshot.forEach(doc => {
            if (!processedIds.has(doc.id)) {
              processedIds.add(doc.id);
              
              const plan = doc.data();
              const createdAt = plan.createdAt ? plan.createdAt.toDate().toISOString() : null;
              const updatedAt = plan.updatedAt ? plan.updatedAt.toDate().toISOString() : null;
              
              plans.push({
                id: doc.id,
                ...plan,
                createdAt,
                updatedAt
              });
            }
          });
        });
        
        // Sort by updated date (desc)
        plans.sort((a, b) => {
          if (!a.updatedAt) return 1;
          if (!b.updatedAt) return -1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        
        // Apply limit
        return NextResponse.json(plans.slice(0, limit));
      }
    }
    
    // If childId is provided, filter by plans linked to that child
    if (childId) {
      query = query.where('childrenIds', 'array-contains', childId);
    }
    
    // Execute the query
    const planSnapshot = await query
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();
    
    // Process results
    const plans: any[] = [];
    planSnapshot.forEach(doc => {
      const plan = doc.data();
      
      // Convert timestamps to ISO strings for serialization
      const createdAt = plan.createdAt ? plan.createdAt.toDate().toISOString() : null;
      const updatedAt = plan.updatedAt ? plan.updatedAt.toDate().toISOString() : null;
      
      plans.push({
        id: doc.id,
        ...plan,
        createdAt,
        updatedAt
      });
    });
    
    return NextResponse.json(plans);
    
  } catch (error) {
    console.error('Error fetching parental plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Create a new parental plan
 *
 * Required data:
 * - title: Plan title
 * - childrenIds: Array of child IDs linked to this plan
 * - regularEducation: Initial regular education data (can be partial)
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
    // Verify the Firebase auth token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get request body
    const planData = await request.json();
    
    // Validate essential fields
    if (!planData.title) {
      return NextResponse.json({ error: 'Plan title is required' }, { status: 400 });
    }
    
    if (!planData.childrenIds || !Array.isArray(planData.childrenIds) || planData.childrenIds.length === 0) {
      return NextResponse.json({ error: 'At least one child must be linked to the plan' }, { status: 400 });
    }
    
    // Verify user has access to the children
    const childPromises = planData.childrenIds.map(async (childId: string) => {
      const childDoc = await adminDb().collection('children').doc(childId).get();
      if (!childDoc.exists) {
        throw new Error(`Child ${childId} not found`);
      }
      
      const childData = childDoc.data();
      const isOwner = childData?.owner === userId;
      const isEditor = childData?.editors?.includes(userId);
      
      if (!isOwner && !isEditor) {
        throw new Error(`No edit permission for child ${childId}`);
      }
      
      return true;
    });
    
    // If any child check fails, this will throw
    await Promise.all(childPromises);
    
    // Prepare parental plan data
    const timestamp = FieldValue.serverTimestamp();
    
    // Calculate accessibleBy array (for easier querying)
    const accessibleBy = [userId]; // Owner always has access
    
    // These arrays keep track of explicit permissions
    const editors = planData.editors || [];
    const viewers = planData.viewers || []; 
    
    // Add editors and viewers to accessibleBy
    [...editors, ...viewers].forEach(id => {
      if (!accessibleBy.includes(id)) {
        accessibleBy.push(id);
      }
    });
    
    const newPlan = {
      title: planData.title,
      description: planData.description || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userId,
      updatedBy: userId,
      
      // Access control
      owner: userId,
      editors: editors,
      viewers: viewers,
      accessibleBy: accessibleBy, // Special array for querying (combination of owner, editors, viewers)
      
      // Child links
      childrenIds: planData.childrenIds,
      
      // Content
      regularEducation: planData.regularEducation || {},
      
      // Status flags
      isActive: true,
      isDeleted: false,
      status: planData.status || 'active'
    };
    
    // Create the plan document
    const planRef = await adminDb().collection('parental_plans').add(newPlan);
    
    // Create initial changelog entry
    const changelogEntry = {
      planId: planRef.id,
      timestamp: timestamp,
      userId: userId,
      action: 'create',
      description: 'Plano parental criado',
      fieldsAfter: {
        title: planData.title,
        childrenIds: planData.childrenIds,
        regularEducation: planData.regularEducation || {}
      }
    };
    
    await planRef.collection('changelog').add(changelogEntry);
    
    // Return success with the new plan ID
    return NextResponse.json({ 
      success: true,
      id: planRef.id,
      message: 'Parental plan created successfully'
    });
    
  } catch (error) {
    console.error('Error creating parental plan:', error);
    
    // Handle expected errors with user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes('Child') && error.message.includes('not found')) {
        return NextResponse.json({ error: 'One or more children not found' }, { status: 404 });
      }
      
      if (error.message.includes('No edit permission')) {
        return NextResponse.json({ error: 'You do not have permission to link one or more children' }, { status: 403 });
      }
    }
    
    // Generic error response
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}