import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logAuditEvent } from '@/lib/auditLogger';

// Define route params with Promise for Next.js 15 compatibility
type RouteParams = {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
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
    
    // Verify the Firebase auth token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get request body
    const { section, fieldName } = await request.json();
    
    if (!section || !fieldName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get plan ID from path parameter - using await for Next.js 15 compatibility
    const { id: planId } = await params;
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }
    
    // Get the plan document
    const planRef = adminDb().collection('parental_plans').doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
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
    
    // Find the field in the specified section
    const sectionData = planData.sections?.[section];
    if (!sectionData) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }
    
    const fieldData = sectionData[fieldName];
    if (!fieldData || typeof fieldData !== 'object' || !('status' in fieldData)) {
      return NextResponse.json({ error: 'Field not found or not pending' }, { status: 404 });
    }
    
    // Check if the user is the one who made the change
    if (fieldData.lastUpdatedBy !== userId) {
      return NextResponse.json({ error: 'You can only cancel your own changes' }, { status: 403 });
    }
    
    // Check if the field is still pending
    if (fieldData.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending changes can be canceled' }, { status: 400 });
    }
    
    // Get the previous value (if exists)
    const previousValue = fieldData.previousValue || '';
    // Make sure originalValue is a string to avoid undefined errors
    const safeOriginalValue = previousValue || '';
    
    // Revert to the previous value
    await planRef.update({
      [`sections.${section}.${fieldName}`]: safeOriginalValue,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId
    });
    
    // Create changelog entry
    const changelogEntry = {
      planId: planId,
      timestamp: FieldValue.serverTimestamp(),
      userId: userId,
      action: 'cancel_field_change',
      description: `Alterações para o campo ${fieldName} canceladas`,
      fieldName,
      section,
      fieldsAfter: { [fieldName]: safeOriginalValue },
      fieldsBefore: { [fieldName]: fieldData.value }
    };
    
    // Add changelog entry
    await planRef.collection('changelog').add(changelogEntry);
    
    // Log audit event
    try {
      await logAuditEvent({
        action: 'update',
        userId,
        resourceId: planId,
        resourceType: 'child',
        details: {
          operation: 'cancel_field_change',
          fields: [fieldName],
          notes: `Canceled changes to ${section} field: ${fieldName}`
        }
      });
    } catch (auditError) {
      // Log but don't fail the operation
      console.error('Failed to log audit event:', auditError);
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Field change cancelled successfully',
      fieldName: fieldName,
      revertedValue: safeOriginalValue
    });
  } catch (error: any) {
    console.error('Error canceling field change:', error);
    
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