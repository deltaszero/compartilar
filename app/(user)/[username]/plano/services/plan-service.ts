import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, serverTimestamp, deleteDoc, orderBy, writeBatch, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { ParentalPlan, EducationSection, FieldStatus, ChangelogEntry, PendingChangeNotification } from '../types';
import { logAuditEvent } from '@/lib/auditLogger';

const COLLECTION_NAME = 'parental_plans';
const NOTIFICATION_COLLECTION = 'notifications';

// Helper to check if the user has permissions to access a plan
const hasPermissionToPlan = async (planId: string, userId: string): Promise<boolean> => {
  try {
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      return false;
    }
    
    const planData = planSnap.data();
    return planData.created_by === userId || 
           (planData.editors && planData.editors.includes(userId)) ||
           (planData.viewers && planData.viewers.includes(userId));
  } catch (error) {
    console.error('Error checking plan permissions:', error);
    return false;
  }
};

// Helper to check if user is an editor of a plan
const isEditor = async (planId: string, userId: string): Promise<boolean> => {
  try {
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      return false;
    }
    
    const planData = planSnap.data();
    return planData.created_by === userId || 
           (planData.editors && planData.editors.includes(userId));
  } catch (error) {
    console.error('Error checking editor permissions:', error);
    return false;
  }
};

// Helper to get other editors of a plan
const getOtherEditors = async (planId: string, currentUserId: string): Promise<string[]> => {
  try {
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      return [];
    }
    
    const planData = planSnap.data();
    const allEditors = [...(planData.editors || [])];
    
    // Add creator if not in editors list
    if (planData.created_by && !allEditors.includes(planData.created_by)) {
      allEditors.push(planData.created_by);
    }
    
    // Filter out current user
    return allEditors.filter(editorId => editorId !== currentUserId);
  } catch (error) {
    console.error('Error getting other editors:', error);
    return [];
  }
};

// Add a notification for editors
const addChangeRequestNotification = async (
  planId: string, 
  planTitle: string,
  fieldName: string, 
  section: string,
  requestingUserId: string,
  targetUserIds: string[]
): Promise<void> => {
  try {
    if (!targetUserIds.length) return;

    const timestamp = Date.now();
    const batch = writeBatch(db);
    
    for (const targetUserId of targetUserIds) {
      const notification: PendingChangeNotification = {
        planId,
        fieldName,
        section,
        timestamp,
        requestedBy: requestingUserId,
        targetUsers: [targetUserId], // Each notification targets one user
        status: 'pending',
        read: false
      };
      
      // Add metadata for UI display
      const fullNotification = {
        ...notification,
        type: 'change_request',
        planTitle,
        title: 'Solicitação de alteração',
        message: `Uma mudança no campo ${fieldName} da seção ${section} requer sua aprovação`,
      };
      
      // Add to notifications collection
      const notifRef = collection(db, NOTIFICATION_COLLECTION);
      const newNotifDoc = doc(notifRef);
      batch.set(newNotifDoc, fullNotification);
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error adding change request notification:', error);
    // Don't throw here - we want the main operation to succeed even if notifications fail
  }
};

// Add an approval notification for the original requester
const addApprovalNotification = async (
  planId: string,
  planTitle: string,
  fieldName: string,
  section: string,
  approved: boolean,
  approvingUserId: string,
  originalRequesterId: string
): Promise<void> => {
  try {
    const timestamp = Date.now();
    
    const notification: PendingChangeNotification = {
      planId,
      fieldName,
      section,
      timestamp,
      requestedBy: approvingUserId,
      targetUsers: [originalRequesterId],
      status: approved ? 'approved' : 'rejected',
      read: false
    };
    
    // Add metadata for UI display
    const fullNotification = {
      ...notification,
      type: 'change_response',
      planTitle,
      title: approved ? 'Alteração aprovada' : 'Alteração rejeitada',
      message: `Sua alteração no campo ${fieldName} da seção ${section} foi ${approved ? 'aprovada' : 'rejeitada'}`,
    };
    
    // Add to notifications collection
    await addDoc(collection(db, NOTIFICATION_COLLECTION), fullNotification);
  } catch (error) {
    console.error('Error adding approval notification:', error);
    // Don't throw here - we want the main operation to succeed even if notifications fail
  }
};

// Update notification status
const updateNotificationStatus = async (
  planId: string,
  fieldName: string,
  newStatus: 'approved' | 'rejected' | 'canceled'
): Promise<void> => {
  try {
    // Find related pending notifications
    const notificationsQuery = query(
      collection(db, NOTIFICATION_COLLECTION),
      where('planId', '==', planId),
      where('fieldName', '==', fieldName),
      where('status', '==', 'pending')
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    if (notificationsSnapshot.empty) return;
    
    // Update all in a batch
    const batch = writeBatch(db);
    
    notificationsSnapshot.forEach(doc => {
      batch.update(doc.ref, { 
        status: newStatus,
        updatedAt: Date.now()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error updating notification status:', error);
    // Don't throw here - we want the main operation to succeed even if notifications fail
  }
};

// Helper to add a changelog entry
const addChangelogEntry = async (entry: ChangelogEntry): Promise<void> => {
  try {
    const planRef = doc(db, COLLECTION_NAME, entry.planId);
    await addDoc(collection(planRef, 'changelog'), {
      ...entry,
      timestamp: entry.timestamp || Date.now()
    });
  } catch (error) {
    console.error('Error adding changelog entry:', error);
    // Log but don't fail the operation
  }
};

export const getParentalPlans = async (userId: string) => {
  try {
    // Query plans where the user is an editor
    const editorQuery = query(
      collection(db, COLLECTION_NAME),
      where('editors', 'array-contains', userId)
    );
    
    const editorSnapshot = await getDocs(editorQuery);
    let editorPlans = editorSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter out deleted plans in memory
    editorPlans = editorPlans.filter(plan => !plan.isDeleted);

    // Also check for plans where user is a viewer
    const viewerQuery = query(
      collection(db, COLLECTION_NAME),
      where('viewers', 'array-contains', userId)
    );
    
    const viewerSnapshot = await getDocs(viewerQuery);
    let viewerPlans = viewerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter out deleted plans in memory
    viewerPlans = viewerPlans.filter(plan => !plan.isDeleted);
    
    // Combine and deduplicate plans
    const allPlans = [...editorPlans];
    viewerPlans.forEach(plan => {
      if (!allPlans.some(p => p.id === plan.id)) {
        allPlans.push(plan);
      }
    });
    
    // Sort by updated_at in descending order
    return allPlans.sort((a, b) => b.updated_at - a.updated_at) as ParentalPlan[];
  } catch (error) {
    console.error('Error fetching parental plans:', error);
    throw error;
  }
};

export const getParentalPlan = async (planId: string, userId?: string): Promise<ParentalPlan | null> => {
  try {
    // If userId is provided, verify permission
    if (userId && !(await hasPermissionToPlan(planId, userId))) {
      console.error('User does not have permission to access this plan');
      return null;
    }
    
    const docRef = doc(db, COLLECTION_NAME, planId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const planData = docSnap.data();
      
      // Check if plan is deleted
      if (planData.isDeleted) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...planData
      } as ParentalPlan;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching parental plan:', error);
    throw error;
  }
};

export const getParentalPlanChangeLog = async (planId: string, userId: string, limit = 20): Promise<ChangelogEntry[]> => {
  try {
    // Verify permission
    if (!(await hasPermissionToPlan(planId, userId))) {
      throw new Error('User does not have permission to view this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    const changeLogRef = collection(planRef, 'changelog');
    
    const changeLogQuery = query(
      changeLogRef,
      orderBy('timestamp', 'desc'),
      limit > 0 ? query(changeLogRef).limit(limit) : query(changeLogRef)
    );
    
    const changeLogSnapshot = await getDocs(changeLogQuery);
    
    return changeLogSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChangelogEntry[];
  } catch (error) {
    console.error('Error fetching parental plan changelog:', error);
    throw error;
  }
};

export const createParentalPlan = async (userId: string, childrenIds: string[], title: string): Promise<string> => {
  try {
    // Validate input
    if (!title.trim()) {
      throw new Error('Plan title is required');
    }
    
    if (!childrenIds.length) {
      throw new Error('At least one child must be linked to the plan');
    }
    
    // Fetch all editors of children to include them as editors of the plan
    const allEditors = new Set<string>([userId]); // Start with current user
    
    // For each child, get the editors
    for (const childId of childrenIds) {
      try {
        const childRef = doc(db, 'children', childId);
        const childSnap = await getDoc(childRef);
        
        if (childSnap.exists()) {
          const childData = childSnap.data();
          // Add all editors of the child to the set
          if (childData.editors && Array.isArray(childData.editors)) {
            childData.editors.forEach((editorId: string) => allEditors.add(editorId));
          }
          // Also include the child's creator if present
          if (childData.created_by) {
            allEditors.add(childData.created_by);
          }
        }
      } catch (childError) {
        console.error(`Error fetching editors for child ${childId}:`, childError);
        // Continue with other children, don't fail the whole operation
      }
    }
    
    const editorsArray = Array.from(allEditors);
    console.log(`Including ${editorsArray.length} editors in new parental plan:`, editorsArray);
    
    // Create a new plan with all collected editors
    const now = Date.now();
    const newPlan = {
      title,
      childrenIds,
      created_at: now,
      updated_at: now,
      editors: editorsArray,
      viewers: [],
      created_by: userId,
      sections: {},
      isLocked: false,
      isDeleted: false,
      status: 'active'
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), newPlan);
    
    // Add to changelog
    await addChangelogEntry({
      planId: docRef.id,
      timestamp: now,
      userId,
      action: 'create',
      description: `Created parental plan "${title}"`
    });
    
    try {
      await logAuditEvent({
        action: 'create',
        userId,
        resourceId: docRef.id,
        resourceType: 'child', // Using 'child' as resource type since 'parental_plan' is not in the allowed types
        details: {
          operation: 'create_parental_plan',
          notes: `Created parental plan for children: ${childrenIds.join(', ')}`
        }
      });
    } catch (auditError) {
      // Log but don't fail the operation
      console.log('Failed to log audit event:', auditError);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating parental plan:', error);
    throw error;
  }
};

export const updateEducationSection = async (
  planId: string,
  userId: string,
  educationData: EducationSection
): Promise<void> => {
  try {
    // Verify the user has edit permissions
    if (!(await isEditor(planId, userId))) {
      throw new Error('User does not have permission to edit this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      throw new Error('Plan not found');
    }
    
    const planData = planSnap.data();
    
    // Check if plan is locked
    if (planData.isLocked) {
      throw new Error('Plan is locked and cannot be edited');
    }
    
    // Store original data for changelog
    const originalEducation = planData.sections?.education || {};
    
    await updateDoc(planRef, {
      'sections.education': educationData,
      updated_at: Date.now()
    });
    
    // Add to changelog
    await addChangelogEntry({
      planId,
      timestamp: Date.now(),
      userId,
      action: 'update',
      description: `Updated education section in parental plan`,
      section: 'education',
      fieldsBefore: { education: originalEducation },
      fieldsAfter: { education: educationData }
    });
    
    try {
      await logAuditEvent({
        action: 'update',
        userId,
        resourceId: planId,
        resourceType: 'child', // Using 'child' as resource type
        details: {
          operation: 'update_parental_plan_section',
          fields: ['education'],
          notes: 'Updated education section in parental plan'
        }
      });
    } catch (auditError) {
      // Log but don't fail the operation
      console.log('Failed to log audit event:', auditError);
    }
  } catch (error) {
    console.error('Error updating education section:', error);
    throw error;
  }
};

export const updateEducationField = async (
  planId: string,
  userId: string,
  fieldName: string,
  value: string | boolean | number,
): Promise<void> => {
  try {
    // Verify the user has edit permissions
    if (!(await isEditor(planId, userId))) {
      throw new Error('User does not have permission to edit this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      throw new Error('Plan not found');
    }
    
    const planData = planSnap.data() as ParentalPlan;
    
    // Check if plan is locked
    if (planData.isLocked) {
      throw new Error('Plan is locked and cannot be edited');
    }
    
    const education = planData.sections.education || {};
    const currentField = education[fieldName];
    
    // Check if the field is locked
    if (currentField && typeof currentField === 'object' && (currentField as FieldStatus).isLocked) {
      throw new Error('This field is locked and cannot be edited');
    }
    
    // Store the previous value for potential rollback
    const previousValue = currentField ? 
      (typeof currentField === 'object' ? (currentField as FieldStatus).value : currentField) 
      : "";
    
    // Create a field status object
    const fieldStatus: FieldStatus = {
      value: value.toString(),
      previousValue: previousValue?.toString() || "", // Use empty string if undefined
      status: 'pending', // Default to pending approval
      isLocked: true, // Lock the field while change is pending
      lastUpdatedBy: userId,
      lastUpdatedAt: Date.now(),
    };
    
    // Update the specific field
    const updatedEducation = {
      ...education,
      [fieldName]: fieldStatus
    };
    
    // Update the document
    await updateDoc(planRef, {
      [`sections.education`]: updatedEducation,
      updated_at: Date.now()
    });
    
    // Get other editors to notify
    const otherEditors = await getOtherEditors(planId, userId);
    
    // Add change request notifications for other editors
    if (otherEditors.length > 0) {
      await addChangeRequestNotification(
        planId,
        planData.title,
        fieldName,
        'education',
        userId,
        otherEditors
      );
    }
    
    // Add to changelog
    await addChangelogEntry({
      planId,
      timestamp: Date.now(),
      userId,
      action: 'update',
      description: `Updated education field: ${fieldName}`,
      section: 'education',
      fieldName,
      fieldsBefore: { [fieldName]: currentField },
      fieldsAfter: { [fieldName]: fieldStatus }
    });
    
    try {
      await logAuditEvent({
        action: 'update',
        userId,
        resourceId: planId,
        resourceType: 'child',
        details: {
          operation: 'update_parental_plan_field',
          fields: [fieldName],
          notes: `Updated education field: ${fieldName}`
        }
      });
    } catch (auditError) {
      console.log('Failed to log audit event:', auditError);
    }
  } catch (error) {
    console.error('Error updating education field:', error);
    throw error;
  }
};

export const approveEducationField = async (
  planId: string,
  userId: string,
  fieldName: string,
  approved: boolean,
  comments?: string
): Promise<void> => {
  try {
    // Verify the user has edit permissions
    if (!(await isEditor(planId, userId))) {
      throw new Error('User does not have permission to edit this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      throw new Error('Plan not found');
    }
    
    const planData = planSnap.data() as ParentalPlan;
    
    // Check if plan is locked
    if (planData.isLocked) {
      throw new Error('Plan is locked and cannot be edited');
    }
    
    const education = planData.sections.education || {};
    
    if (!education[fieldName] || typeof education[fieldName] !== 'object') {
      throw new Error('Field not found or not in the correct format');
    }
    
    // Get the current field status
    const fieldStatus = education[fieldName] as FieldStatus;
    
    // Prevent user from approving their own changes
    if (fieldStatus.lastUpdatedBy === userId) {
      throw new Error('You cannot approve or reject your own changes');
    }
    
    // Prepare updated field status
    let updatedFieldStatus: FieldStatus;
    
    if (approved) {
      // If approved, update the status and unlock
      updatedFieldStatus = {
        ...fieldStatus,
        status: 'approved',
        isLocked: false, // Unlock the field
        approvedBy: userId,
        approvedAt: Date.now(),
        comments: comments // Optional approval comments
      };
    } else {
      // If rejected, roll back to previous value and unlock
      updatedFieldStatus = {
        ...fieldStatus,
        value: fieldStatus.previousValue || fieldStatus.value, // Rollback
        status: 'disagreed',
        isLocked: false, // Unlock the field
        approvedBy: userId,
        approvedAt: Date.now(),
        comments: comments || 'Changes rejected' // Rejection comments
      };
    }
    
    // Update the field
    await updateDoc(planRef, {
      [`sections.education.${fieldName}`]: updatedFieldStatus,
      updated_at: Date.now()
    });
    
    // Update notification status
    await updateNotificationStatus(planId, fieldName, approved ? 'approved' : 'rejected');
    
    // Notify the original requester
    await addApprovalNotification(
      planId,
      planData.title,
      fieldName,
      'education',
      approved,
      userId,
      fieldStatus.lastUpdatedBy
    );
    
    // Add to changelog
    await addChangelogEntry({
      planId,
      timestamp: Date.now(),
      userId,
      action: approved ? 'approve_field' : 'reject_field',
      description: `${approved ? 'Approved' : 'Rejected'} education field: ${fieldName}`,
      section: 'education',
      fieldName,
      fieldsBefore: { [fieldName]: fieldStatus },
      fieldsAfter: { [fieldName]: updatedFieldStatus }
    });
    
    try {
      await logAuditEvent({
        action: 'update',
        userId,
        resourceId: planId,
        resourceType: 'child',
        details: {
          operation: 'approve_parental_plan_field',
          fields: [fieldName],
          notes: `${approved ? 'Approved' : 'Rejected'} education field: ${fieldName}`
        }
      });
    } catch (auditError) {
      console.log('Failed to log audit event:', auditError);
    }
  } catch (error) {
    console.error('Error approving education field:', error);
    throw error;
  }
};

export const cancelFieldChange = async (
  planId: string,
  userId: string,
  fieldName: string,
  section: string = 'education'
): Promise<{success: boolean, originalValue?: string}> => {
  try {
    // Verify the user has edit permissions
    if (!(await isEditor(planId, userId))) {
      throw new Error('User does not have permission to edit this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      throw new Error('Plan not found');
    }
    
    const planData = planSnap.data() as ParentalPlan;
    
    // Get the section data
    const sectionData = planData.sections[section];
    if (!sectionData) {
      throw new Error(`Section ${section} not found`);
    }
    
    // Get the field
    const fieldData = sectionData[fieldName];
    if (!fieldData || typeof fieldData !== 'object') {
      throw new Error(`Field ${fieldName} not found or not in the correct format`);
    }
    
    const fieldStatus = fieldData as FieldStatus;
    
    // Only the author can cancel a pending change
    if (fieldStatus.lastUpdatedBy !== userId) {
      throw new Error('You can only cancel your own pending changes');
    }
    
    // Only allow cancellation of pending changes
    if (fieldStatus.status !== 'pending') {
      throw new Error('Only pending changes can be canceled');
    }
    
    // Get the original value to revert to
    const originalValue = fieldStatus.previousValue || '';
    
    // Update the field - revert to the original value or empty string
    await updateDoc(planRef, {
      [`sections.${section}.${fieldName}`]: originalValue,
      updated_at: Date.now()
    });
    
    // Update notification status
    await updateNotificationStatus(planId, fieldName, 'canceled');
    
    // Add to changelog
    await addChangelogEntry({
      planId,
      timestamp: Date.now(),
      userId,
      action: 'cancel_field_change',
      description: `Canceled changes to ${section} field: ${fieldName}`,
      section,
      fieldName,
      fieldsBefore: { [fieldName]: fieldStatus },
      fieldsAfter: { [fieldName]: originalValue }
    });
    
    try {
      await logAuditEvent({
        action: 'update',
        userId,
        resourceId: planId,
        resourceType: 'child',
        details: {
          operation: 'cancel_parental_plan_field_change',
          fields: [fieldName],
          notes: `Canceled changes to ${section} field: ${fieldName}`
        }
      });
    } catch (auditError) {
      console.log('Failed to log audit event:', auditError);
    }
    
    return { success: true, originalValue };
  } catch (error) {
    console.error('Error canceling field change:', error);
    throw error;
  }
};

export const deleteParentalPlan = async (planId: string, userId: string): Promise<void> => {
  try {
    // Verify the user has edit permissions
    if (!(await isEditor(planId, userId))) {
      throw new Error('User does not have permission to delete this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      throw new Error('Plan not found');
    }
    
    // Perform soft delete
    await updateDoc(planRef, {
      isDeleted: true,
      status: 'archived',
      deleted_at: Date.now(),
      deleted_by: userId,
      updated_at: Date.now()
    });
    
    // Add to changelog
    await addChangelogEntry({
      planId,
      timestamp: Date.now(),
      userId,
      action: 'delete',
      description: 'Deleted parental plan'
    });
    
    try {
      await logAuditEvent({
        action: 'delete',
        userId,
        resourceId: planId,
        resourceType: 'child', // Using 'child' as resource type
        details: {
          operation: 'delete_parental_plan',
          notes: 'Deleted parental plan'
        }
      });
    } catch (auditError) {
      // Log but don't fail the operation
      console.log('Failed to log audit event:', auditError);
    }
  } catch (error) {
    console.error('Error deleting parental plan:', error);
    throw error;
  }
};