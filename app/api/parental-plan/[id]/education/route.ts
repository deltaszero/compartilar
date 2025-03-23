import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { EducationSection, FieldStatus } from '@/app/(user)/[username]/plano/types';
import { z } from 'zod';

// Define route params with Promise for Next.js 15 compatibility
type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * GET - Fetch education section of a parental plan
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
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
    const isOwner = planData?.created_by === userId;
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
  { params }: RouteParams
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
    const isOwner = planData?.created_by === userId;
    const isEditor = planData?.editors?.includes(userId);
    
    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const timestamp = Date.now();

    // Store original values for changelog
    const education = planData?.sections?.education || {};
    const beforeValues = { education };
    
    // Create changelog entry
    const changelogEntry: any = {
      planId: planId,
      timestamp: FieldValue.serverTimestamp(),
      userId: userId,
      action: 'update_education',
      description: updateData.changeDescription || 'Seção de educação atualizada',
      fieldsBefore: beforeValues,
      fieldsAfter: {} // Initialize empty object to be filled later
    };

    // Update the document based on the request type
    if (updateData.fieldName) {
      // Updating a single field
      const { fieldName, value } = updateData;
      
      // Get current field to preserve previous value if it exists
      const currentField = education[fieldName];
      const previousValue = currentField ? 
        (typeof currentField === 'object' ? (currentField as any).value : currentField) 
        : undefined;
      
      // Create a field status object with the new schema
      const fieldStatus = {
        value: value,
        previousValue: previousValue?.toString() || "", // Convert to empty string if undefined
        status: 'pending', // Default to pending status
        isLocked: true, // Lock the field while changes are pending
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
  { params }: RouteParams
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
    const isOwner = planData?.created_by === userId;
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
    
    // Prepare updated field status
    let updatedField;
    
    if (approved) {
      // If approved, update the status and unlock the field
      // Ensure value is valid (not undefined)
      const safeValue = fieldValue.value || "";
      const safePreviousValue = fieldValue.previousValue || "";
      
      updatedField = {
        ...fieldValue,
        status: 'approved',
        isLocked: false,
        value: safeValue, // Ensure value is not undefined
        previousValue: safePreviousValue, // Ensure previousValue is not undefined
        approvedBy: userId,
        approvedAt: Date.now(),
        comments: comments || fieldValue.comments || ""
      };
    } else {
      // If rejected, roll back to previous value and mark as disagreed
      // Ensure we have a valid value to use (empty string if both previousValue and value are undefined)
      const safeValue = fieldValue.previousValue || fieldValue.value || "";
      
      updatedField = {
        ...fieldValue,
        status: 'disagreed',
        isLocked: false,
        value: safeValue, // Rollback to previous value with safety
        previousValue: safeValue, // Keep previousValue consistent
        approvedBy: userId,
        approvedAt: Date.now(),
        comments: comments || 'Changes rejected' // Include rejection comments
      };
    }
    
    // Create changelog entry
    const changelogEntry: any = {
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
    
    // Add more detailed error info for debugging
    const details = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : { message: 'Unknown error type' };
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ 
      error: errorMessage,
      details: details
    }, { status: 500 });
  }
}

/**
 * PUT - Update the complete education section
 * 
 * This endpoint is used when submitting a completely new education section
 * without going through the field-by-field approval workflow.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
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

    // Get request body
    const { educationData } = await request.json();
    
    if (!educationData) {
      return NextResponse.json({ error: 'Education data is required' }, { status: 400 });
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
    const isOwner = planData?.created_by === userId;
    const isEditor = planData?.editors?.includes(userId);
    
    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Store original values for changelog
    const education = planData?.sections?.education || {};
    const beforeValues = { education };
    
    // Process each field to maintain proper structure
    // If a field is already a FieldStatus object and it's locked, don't overwrite it
    const processedEducationData: Record<string, any> = {};
    const timestamp = Date.now();
    
    // Get all field names from both current data and submitted data
    const allFieldNames = new Set([
      ...Object.keys(education),
      ...Object.keys(educationData)
    ]);
    
    for (const fieldName of allFieldNames) {
      const currentValue = education[fieldName];
      const newValue = educationData[fieldName];
      
      // Skip if the field doesn't exist in the new data (not being updated)
      if (newValue === undefined) {
        processedEducationData[fieldName] = currentValue;
        continue;
      }
      
      // If the current field is a FieldStatus object and locked, don't update it
      if (
        currentValue && 
        typeof currentValue === 'object' && 
        (currentValue as FieldStatus).isLocked === true
      ) {
        processedEducationData[fieldName] = currentValue;
        console.log(`Field ${fieldName} is locked and will not be updated`);
        continue;
      }
      
      // For new fields, store them as regular values
      // We'll use field-by-field update for approval workflow
      processedEducationData[fieldName] = newValue;
    }
    
    // Create changelog entry
    const changelogEntry: any = {
      planId,
      timestamp: FieldValue.serverTimestamp(),
      userId,
      action: 'update',
      description: 'Seção de educação atualizada completamente',
      fieldsBefore: beforeValues,
      fieldsAfter: { education: processedEducationData }
    };
    
    // Update the document
    await planRef.update({
      'sections.education': processedEducationData,
      updated_at: FieldValue.serverTimestamp()
    });
    
    // Add changelog entry
    await planRef.collection('changelog').add(changelogEntry);
    
    return NextResponse.json({ 
      success: true,
      message: 'Education section updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating education section:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
  { params }: RouteParams
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
    const isOwner = planData?.created_by === userId;
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
    
    // Only allow cancellation of pending changes
    if (fieldValue.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending changes can be canceled' 
      }, { status: 400 });
    }
    
    // When canceling a change, revert to the previous value stored in the field
    // This is now properly tracked in the previousValue property of FieldStatus
    
    // Get the previous value from the FieldStatus object
    const originalValue = fieldValue.previousValue || '';
    
    // Make sure originalValue is a string to avoid undefined errors
    const safeOriginalValue = originalValue || '';
    
    console.log(`For field ${fieldName}, reverting to the previous value: ${safeOriginalValue}`);
    
    // Create changelog entry
    const changelogEntry: any = {
      planId: planId,
      timestamp: FieldValue.serverTimestamp(),
      userId: userId,
      action: 'cancel_field_change',
      description: `Alterações para o campo ${fieldName} canceladas`,
      fieldsBefore: { 
        [fieldName]: fieldValue 
      },
      fieldsAfter: { 
        [fieldName]: safeOriginalValue 
      }
    };
    
    // Revert the field to its original value
    await planRef.update({
      [`sections.education.${fieldName}`]: safeOriginalValue,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId
    });
    
    // Add changelog entry
    await planRef.collection('changelog').add(changelogEntry);
    
    return NextResponse.json({ 
      success: true,
      message: 'Field change cancelled successfully',
      fieldName: fieldName,
      revertedValue: safeOriginalValue
    });
    
  } catch (error) {
    console.error('Error cancelling field change:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}