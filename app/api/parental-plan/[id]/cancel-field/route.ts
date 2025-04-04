import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper to check if user is an editor of a plan
const isEditor = async (planId: string, userId: string): Promise<boolean> => {
  try {
    const planRef = adminDb().collection('parental_plans').doc(planId);
    const planSnap = await planRef.get();
    
    if (!planSnap.exists) {
      return false;
    }
    
    const planData = planSnap.data();
    if (!planData) return false;
    
    return planData.createdBy === userId || 
           (planData.editors && planData.editors.includes(userId));
  } catch (error) {
    console.error('Error checking editor permissions:', error);
    return false;
  }
};

/**
 * PUT handler to cancel a pending field change
 */
export async function PUT(
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
    // Verify Firebase token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const planId = params.id;
    const { fieldName, section = 'education' } = await request.json();
    
    if (!fieldName) {
      return NextResponse.json({ error: 'Field name is required' }, { status: 400 });
    }
    
    // Verify user is an editor
    if (!(await isEditor(planId, userId))) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    const planRef = adminDb().collection('parental_plans').doc(planId);
    const planSnap = await planRef.get();
    
    if (!planSnap.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    const planData = planSnap.data();
    
    if (!planData) {
      return NextResponse.json({ error: 'Plan data not found' }, { status: 404 });
    }
    
    // Check if field exists and has pending status
    const sectionData = planData.sections && section in planData.sections 
      ? planData.sections[section] 
      : undefined;
      
    if (!sectionData) {
      return NextResponse.json({ error: `Section ${section} not found` }, { status: 404 });
    }
    
    // Safely access the field
    const fieldData = sectionData && typeof sectionData === 'object'
      ? sectionData[fieldName]
      : undefined;
      
    if (!fieldData || typeof fieldData !== 'object') {
      return NextResponse.json(
        { error: `Field ${fieldName} not found or not in the correct format` }, 
        { status: 404 }
      );
    }
    
    // Only the author can cancel a pending change
    if (fieldData.lastUpdatedBy !== userId) {
      return NextResponse.json(
        { error: 'You can only cancel your own pending changes' }, 
        { status: 403 }
      );
    }
    
    // Only allow cancellation of pending changes
    if (fieldData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending changes can be canceled' }, 
        { status: 400 }
      );
    }
    
    // Get the original value to revert to
    const originalValue = fieldData.previousValue || '';
    
    // Create changelog entry
    const changelogEntry = {
      planId,
      timestamp: FieldValue.serverTimestamp(),
      userId,
      action: 'cancel_field_change',
      description: `Canceled changes to ${section} field: ${fieldName}`,
      section,
      fieldName,
      fieldsBefore: { [fieldName]: fieldData },
      fieldsAfter: { [fieldName]: originalValue }
    };
    
    // Update the field - revert to the original value
    await planRef.update({
      [`sections.${section}.${fieldName}`]: originalValue,
      updatedAt: Date.now()
    });
    
    // Add to changelog
    await planRef.collection('changelog').add(changelogEntry);
    
    // Find and update any related notifications
    const notificationsRef = adminDb().collection('notifications');
    const notificationsQuery = notificationsRef
      .where('planId', '==', planId)
      .where('fieldName', '==', fieldName)
      .where('status', '==', 'pending');
    
    const notificationsSnapshot = await notificationsQuery.get();
    
    if (!notificationsSnapshot.empty) {
      const batch = adminDb().batch();
      
      notificationsSnapshot.forEach(doc => {
        batch.update(doc.ref, { 
          status: 'canceled',
          updatedAt: Date.now()
        });
      });
      
      await batch.commit();
    }
    
    return NextResponse.json({ 
      success: true, 
      originalValue,
      message: 'Field change canceled successfully'
    });
  } catch (error) {
    console.error('Error canceling field change:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}