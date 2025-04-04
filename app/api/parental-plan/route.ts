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
  console.log('GET /api/parental-plan being called');
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
    
    console.log('API: Fetching parental plans for user:', userId);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    
    // Start with base collection reference
    const collectionRef = adminDb().collection('parental_plans');
    
    // SIMPLIFIED APPROACH: Use three separate queries and merge results 
    // This matches exactly how the Firestore rules are written
    console.log('API: Using simplified query approach for parental plans...');
    
    // 1. Query plans where user is the creator (created_by field)
    const creatorQuery = collectionRef.where('created_by', '==', userId);
    
    // 2. Query plans where user is an editor
    const editorQuery = collectionRef.where('editors', 'array-contains', userId);
    
    // 3. Query plans where user is a viewer
    const viewerQuery = collectionRef.where('viewers', 'array-contains', userId);
    
    // Execute all queries in parallel
    console.log('API: Executing three separate queries for parental plans');
    const [
      creatorSnapshot, 
      editorSnapshot, 
      viewerSnapshot
    ] = await Promise.all([
      creatorQuery.get(),
      editorQuery.get(),
      viewerQuery.get()
    ]);
    
    console.log('API: Query results received', {
      creatorCount: creatorSnapshot.size,
      editorCount: editorSnapshot.size,
      viewerCount: viewerSnapshot.size
    });
    
    // Process and merge results
    const plans: any[] = [];
    const processedIds = new Set();
    
    // Helper function to process snapshots
    const processSnapshot = (snapshot: any) => {
      snapshot.forEach((doc: any) => {
        if (!processedIds.has(doc.id)) {
          processedIds.add(doc.id);
          
          const plan = doc.data();
          console.log(`API: Processing plan ${doc.id}, title: ${plan.title}`);
          
          // Skip deleted plans
          if (plan.isDeleted === true) {
            console.log(`API: Skipping deleted plan: ${doc.id}`);
            return;
          }
          
          // Filter by childId if provided
          if (childId && (!plan.childrenIds || !plan.childrenIds.includes(childId))) {
            console.log(`API: Skipping plan ${doc.id} - doesn't include child ${childId}`);
            return;
          }
          
          // Process timestamps
          let created_at = null;
          let updated_at = null;
          
          try {
            if (plan.created_at) {
              if (typeof plan.created_at === 'object' && plan.created_at.toDate) {
                created_at = plan.created_at.toDate().toISOString();
              } else if (typeof plan.created_at === 'number') {
                created_at = new Date(plan.created_at).toISOString();
              } else {
                created_at = plan.created_at;
              }
            }
          } catch (err) {
            console.error(`Error processing created_at for plan ${doc.id}:`, err);
          }
          
          try {
            if (plan.updated_at) {
              if (typeof plan.updated_at === 'object' && plan.updated_at.toDate) {
                updated_at = plan.updated_at.toDate().toISOString();
              } else if (typeof plan.updated_at === 'number') {
                updated_at = new Date(plan.updated_at).toISOString();
              } else {
                updated_at = plan.updated_at;
              }
            }
          } catch (err) {
            console.error(`Error processing updated_at for plan ${doc.id}:`, err);
          }
          
          // Create normalized plan object with both naming conventions
          plans.push({
            id: doc.id,
            ...plan,
            // Ensure both conventions are available
            created_at: created_at || plan.created_at,
            updated_at: updated_at || plan.updated_at,
            createdAt: created_at || plan.createdAt,
            updatedAt: updated_at || plan.updatedAt,
            created_by: plan.created_by,
            createdBy: plan.created_by || plan.createdBy
          });
        }
      });
    };
    
    // Process all snapshots
    processSnapshot(creatorSnapshot);
    processSnapshot(editorSnapshot);
    processSnapshot(viewerSnapshot);
    
    // Sort by updated date (desc) - try both field naming conventions
    plans.sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 
                   a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 
                   b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      
      return bTime - aTime; // descending order
    });
    
    // Apply limit and return
    const limitedPlans = plans.slice(0, limit);
    console.log(`API: Returning ${limitedPlans.length} parental plans after processing`);
    
    // Log the first plan for debugging
    if (limitedPlans.length > 0) {
      console.log('API: First plan sample:', {
        id: limitedPlans[0].id,
        title: limitedPlans[0].title,
        created_by: limitedPlans[0].created_by,
        created_at_type: typeof limitedPlans[0].created_at,
        updated_at_type: typeof limitedPlans[0].updated_at
      });
    }
    
    return NextResponse.json(limitedPlans);
    
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
      created_at: timestamp,
      updated_at: timestamp,
      created_by: userId,
      
      // Access control
      owner: userId,
      editors: editors,
      viewers: viewers,
      accessibleBy: accessibleBy, // Special array for querying (combination of owner, editors, viewers)
      
      // Child links
      childrenIds: planData.childrenIds,
      
      // Content
      sections: {
        regularEducation: planData.regularEducation || {}
      },
      
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