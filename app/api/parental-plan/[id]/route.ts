import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET - Fetch a single parental plan by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Get plan ID from path parameter - using await for Next.js 15 compatibility
    const { id: planId } = await params;
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get the plan document
    const planRef = adminDb().collection('parental_plans').doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Parental plan not found' }, { status: 404 });
    }

    const planData = planDoc.data();
    
    // Check if plan is deleted
    if (planData?.isDeleted) {
      return NextResponse.json({ error: 'Parental plan not found' }, { status: 404 });
    }
    
    // Check if user has permission to view this plan
    const isOwner = planData?.owner === userId;
    const isEditor = planData?.editors?.includes(userId);
    const isViewer = planData?.viewers?.includes(userId);
    
    if (!isOwner && !isEditor && !isViewer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Convert timestamps to ISO strings for serialization
    const createdAt = planData?.createdAt ? planData.createdAt.toDate().toISOString() : null;
    const updatedAt = planData?.updatedAt ? planData.updatedAt.toDate().toISOString() : null;
    
    // Return the plan data with backward compatibility for snake_case fields
    return NextResponse.json({ 
      id: planDoc.id,
      ...planData,
      createdAt,
      updatedAt,
      // Add backward compatibility for existing client code
      created_at: createdAt || planData?.created_at || null,
      updated_at: updatedAt || planData?.updated_at || null
    });
    
  } catch (error) {
    console.error('Error fetching parental plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH - Update an existing parental plan
 * 
 * Updates can include:
 * - title
 * - childrenIds (adding/removing children)
 * - regularEducation (updating education section)
 * - status (active/archived)
 * 
 * Changes are tracked in the changelog collection
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Get plan ID from path parameter - using await for Next.js 15 compatibility
    const { id: planId } = await params;
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get the plan document
    const planRef = adminDb().collection('parental_plans').doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Parental plan not found' }, { status: 404 });
    }

    const planData = planDoc.data();
    
    // Check if plan is deleted
    if (planData?.isDeleted) {
      return NextResponse.json({ error: 'Parental plan not found' }, { status: 404 });
    }
    
    // Check if user has permission to edit this plan
    const isOwner = planData?.owner === userId;
    const isEditor = planData?.editors?.includes(userId);
    
    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get update data
    const updates = await request.json();
    
    // Store original values for changelog
    const beforeValues: Record<string, any> = {};
    const changedFields: string[] = [];
    
    // Prepare update object
    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId
    };
    
    // Process title update
    if (updates.title) {
      beforeValues.title = planData?.title;
      updateData.title = updates.title;
      changedFields.push('title');
    }
    
    // Process children update (must validate access for new children)
    if (updates.childrenIds) {
      // Verify user has access to all children that are being added
      const currentChildrenIds = planData?.childrenIds || [];
      const newChildrenIds = updates.childrenIds.filter(
        (id: string) => !currentChildrenIds.includes(id)
      );
      
      if (newChildrenIds.length > 0) {
        // Check permissions for each new child
        const childPromises = newChildrenIds.map(async (childId: string) => {
          const childDoc = await adminDb().collection('children').doc(childId).get();
          if (!childDoc.exists) {
            throw new Error(`Child ${childId} not found`);
          }
          
          const childData = childDoc.data();
          const isChildOwner = childData?.owner === userId;
          const isChildEditor = childData?.editors?.includes(userId);
          
          if (!isChildOwner && !isChildEditor) {
            throw new Error(`No edit permission for child ${childId}`);
          }
          
          return true;
        });
        
        // If any child check fails, this will throw
        await Promise.all(childPromises);
      }
      
      beforeValues.childrenIds = planData?.childrenIds;
      updateData.childrenIds = updates.childrenIds;
      changedFields.push('childrenIds');
    }
    
    // Process regularEducation update
    if (updates.regularEducation) {
      beforeValues.regularEducation = planData?.regularEducation || {};
      updateData.regularEducation = {
        ...(planData?.regularEducation || {}),
        ...updates.regularEducation
      };
      changedFields.push('regularEducation');
    }
    
    // Process status update
    if (updates.status) {
      beforeValues.status = planData?.status;
      updateData.status = updates.status;
      changedFields.push('status');
    }
    
    // If there are no fields to update, return early
    if (changedFields.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No changes to apply'
      });
    }
    
    // Save change to changelog first
    const changelogEntry = {
      planId: planId,
      timestamp: FieldValue.serverTimestamp(),
      userId: userId,
      action: 'update',
      description: updates.changeDescription || 'Plano parental atualizado',
      fieldsBefore: beforeValues,
      fieldsAfter: updates
    };
    
    await planRef.collection('changelog').add(changelogEntry);
    
    // Then update the plan document
    await planRef.update(updateData);
    
    return NextResponse.json({ 
      success: true,
      message: 'Parental plan updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating parental plan:', error);
    
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

/**
 * DELETE - Soft delete a parental plan
 * 
 * Sets isDeleted flag to true instead of actually removing the document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Get plan ID from path parameter - using await for Next.js 15 compatibility
    const { id: planId } = await params;
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get the plan document
    const planRef = adminDb().collection('parental_plans').doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Parental plan not found' }, { status: 404 });
    }

    const planData = planDoc.data();
    
    // Check if plan is already deleted
    if (planData?.isDeleted) {
      return NextResponse.json({ error: 'Parental plan already deleted' }, { status: 400 });
    }
    
    // Check if user is the owner (only owners can delete)
    if (planData?.owner !== userId) {
      return NextResponse.json({ error: 'Only the owner can delete a parental plan' }, { status: 403 });
    }

    // Save deletion to changelog
    const changelogEntry = {
      planId: planId,
      timestamp: FieldValue.serverTimestamp(),
      userId: userId,
      action: 'delete',
      description: 'Plano parental excluído'
    };
    
    await planRef.collection('changelog').add(changelogEntry);
    
    // Soft delete the plan
    await planRef.update({
      isDeleted: true,
      status: 'archived',
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: userId
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Parental plan deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting parental plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}