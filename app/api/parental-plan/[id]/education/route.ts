import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET - Fetch education section of a parental plan
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    // Get plan ID from path parameter
    const planId = params.id;
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

    // Return just the education section
    const education = planData?.sections?.education || {};
    
    return NextResponse.json(education);
    
  } catch (error) {
    console.error('Error fetching education data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH - Update the education section of a parental plan
 *
 * This endpoint can be used to:
 * 1. Update the entire education section
 * 2. Update a specific field in the education section
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    // Get plan ID from path parameter
    const planId = params.id;
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get request body
    const updateData = await request.json();
    
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

    const timestamp = Date.now();

    // Store original values for changelog
    const education = planData?.sections?.education || {};
    const beforeValues = { education };
    
    // Create changelog entry
    const changelogEntry = {
      planId: planId,
      timestamp: FieldValue.serverTimestamp(),
      userId: userId,
      action: 'update_education',
      description: updateData.changeDescription || 'Seção de educação atualizada',
      fieldsBefore: beforeValues
    };

    // Update the document based on the request type
    if (updateData.fieldName) {
      // Updating a single field
      const { fieldName, value } = updateData;
      
      // Create a field status object
      const fieldStatus = {
        value: value,
        approved: false, // Default to not approved
        lastUpdatedBy: userId,
        lastUpdatedAt: timestamp
      };
      
      // Update specific field in education section
      await planRef.update({
        [`sections.education.${fieldName}`]: fieldStatus,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId
      });
      
      // Add field-specific info to changelog
      changelogEntry.fieldsAfter = { 
        [`sections.education.${fieldName}`]: fieldStatus
      };
      
    } else if (updateData.entireEducation) {
      // Updating the entire education section
      await planRef.update({
        'sections.education': updateData.entireEducation,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId
      });
      
      // Add entire section to changelog
      changelogEntry.fieldsAfter = { 
        education: updateData.entireEducation 
      };
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid update request. Provide fieldName and value OR entireEducation' 
      }, { status: 400 });
    }
    
    // Add changelog entry
    await planRef.collection('changelog').add(changelogEntry);
    
    return NextResponse.json({ 
      success: true,
      message: 'Education section updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating education section:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Approve or reject a specific field in the education section
 *
 * Expected body:
 * {
 *   fieldName: string,
 *   approved: boolean,
 *   comments?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    // Get plan ID from path parameter
    const planId = params.id;
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get request body
    const approvalData = await request.json();
    const { fieldName, approved, comments } = approvalData;
    
    if (!fieldName) {
      return NextResponse.json({ error: 'Field name is required' }, { status: 400 });
    }
    
    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Approved status is required' }, { status: 400 });
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

    // Get education section and field
    const education = planData?.sections?.education || {};
    const fieldValue = education[fieldName];
    
    if (!fieldValue || typeof fieldValue !== 'object') {
      return NextResponse.json({ 
        error: 'Field not found or not in the correct format' 
      }, { status: 400 });
    }
    
    // Prevent user from approving their own changes
    if (fieldValue.lastUpdatedBy === userId) {
      return NextResponse.json({ 
        error: 'You cannot approve or reject your own changes' 
      }, { status: 403 });
    }
    
    // Update the field status
    const updatedField = {
      ...fieldValue,
      approved,
      comments: comments || fieldValue.comments,
      lastUpdatedBy: userId,
      lastUpdatedAt: Date.now()
    };
    
    // Create changelog entry
    const changelogEntry = {
      planId: planId,
      timestamp: FieldValue.serverTimestamp(),
      userId: userId,
      action: approved ? 'approve_field' : 'reject_field',
      description: approved ? `Campo ${fieldName} aprovado` : `Campo ${fieldName} rejeitado`,
      fieldsBefore: { 
        [fieldName]: fieldValue 
      },
      fieldsAfter: { 
        [fieldName]: updatedField 
      }
    };
    
    // Update the field
    await planRef.update({
      [`sections.education.${fieldName}`]: updatedField,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId
    });
    
    // Add changelog entry
    await planRef.collection('changelog').add(changelogEntry);
    
    return NextResponse.json({ 
      success: true,
      message: approved ? 'Field approved successfully' : 'Field rejected successfully'
    });
    
  } catch (error) {
    console.error('Error approving/rejecting field:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Cancel a pending field change
 *
 * Expected query parameter:
 * - fieldName: The name of the field to cancel changes for
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    // Get plan ID from path parameter
    const planId = params.id;
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get field name from query params
    const { searchParams } = new URL(request.url);
    const fieldName = searchParams.get('fieldName');
    
    if (!fieldName) {
      return NextResponse.json({ error: 'Field name is required' }, { status: 400 });
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

    // Get education section and field
    const education = planData?.sections?.education || {};
    const fieldValue = education[fieldName];
    
    if (!fieldValue || typeof fieldValue !== 'object') {
      return NextResponse.json({ 
        error: 'Field not found or not in the correct format' 
      }, { status: 400 });
    }
    
    // Only the author can cancel a pending change
    if (fieldValue.lastUpdatedBy !== userId) {
      return NextResponse.json({ 
        error: 'You can only cancel your own pending changes' 
      }, { status: 403 });
    }
    
    // Only allow cancellation of unapproved changes without comments (pending)
    if (fieldValue.approved || fieldValue.comments) {
      return NextResponse.json({ 
        error: 'Cannot cancel changes that are already approved or rejected' 
      }, { status: 400 });
    }
    
    // When we cancel a change, we want to preserve the original field value
    // However, we need to make sure we don't leave it as a FieldStatus object
    
    // Get the current stored value - this will be a FieldStatus object
    // For the cancellation flow, we want to:
    // 1. Extract the actual value from the FieldStatus object
    // 2. Apply it directly as a primitive value (not as a FieldStatus object)
    // This effectively cancels the approval workflow

    // We can just use the value that was going to be changed
    const valueToRevert = fieldValue.value;
    
    // For fields that should have a specific format/type, we can check and maintain it
    // Extract the value from the FieldStatus object 
    let originalValue = valueToRevert;
    
    console.log(`For field ${fieldName}, reverting to the value: ${originalValue}`);
    
    // Create changelog entry
    const changelogEntry = {
      planId: planId,
      timestamp: FieldValue.serverTimestamp(),
      userId: userId,
      action: 'cancel_field_change',
      description: `Alterações para o campo ${fieldName} canceladas`,
      fieldsBefore: { 
        [fieldName]: fieldValue 
      },
      fieldsAfter: { 
        [fieldName]: originalValue 
      }
    };
    
    // Revert the field to its original value
    await planRef.update({
      [`sections.education.${fieldName}`]: originalValue,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId
    });
    
    // Add changelog entry
    await planRef.collection('changelog').add(changelogEntry);
    
    return NextResponse.json({ 
      success: true,
      message: 'Field change cancelled successfully',
      fieldName: fieldName,
      revertedValue: originalValue
    });
    
  } catch (error) {
    console.error('Error cancelling field change:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}