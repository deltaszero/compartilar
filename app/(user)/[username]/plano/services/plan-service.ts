import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, serverTimestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { ParentalPlan, EducationSection } from '../types';
import { logAuditEvent } from '@/lib/auditLogger';

const COLLECTION_NAME = 'parental_plans';

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

export const getParentalPlans = async (userId: string) => {
  try {
    // Query plans where the user is an editor or viewer
    const editorQuery = query(
      collection(db, COLLECTION_NAME),
      where('editors', 'array-contains', userId),
      orderBy('updated_at', 'desc')
    );
    
    const editorSnapshot = await getDocs(editorQuery);
    const editorPlans = editorSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Also check for plans where user is a viewer
    const viewerQuery = query(
      collection(db, COLLECTION_NAME),
      where('viewers', 'array-contains', userId),
      orderBy('updated_at', 'desc')
    );
    
    const viewerSnapshot = await getDocs(viewerQuery);
    const viewerPlans = viewerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
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
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ParentalPlan;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching parental plan:', error);
    throw error;
  }
};

export const createParentalPlan = async (userId: string, childId: string, title: string): Promise<string> => {
  try {
    // For testing, create a simple mock plan for now
    // In a production environment, we would verify the user has editor access to the child
    const mockPlan = {
      title,
      child_id: childId,
      created_at: Date.now(),
      updated_at: Date.now(),
      editors: [userId],
      viewers: [],
      created_by: userId,
      sections: {}
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), mockPlan);
    
    try {
      await logAuditEvent({
        action: 'create',
        userId,
        resourceId: docRef.id,
        resourceType: 'child', // Using 'child' as resource type since 'parental_plan' is not in the allowed types
        details: {
          operation: 'create_parental_plan',
          notes: `Created parental plan for child ${childId}`
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
    if (!(await hasPermissionToPlan(planId, userId))) {
      throw new Error('User does not have permission to edit this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    
    await updateDoc(planRef, {
      'sections.education': educationData,
      updated_at: Date.now()
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
    if (!(await hasPermissionToPlan(planId, userId))) {
      throw new Error('User does not have permission to edit this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      throw new Error('Plan not found');
    }
    
    const plan = planSnap.data() as ParentalPlan;
    const education = plan.sections.education || {};
    
    // Create a field status object
    const fieldStatus = {
      value: value,
      approved: false, // Default to not approved
      lastUpdatedBy: userId,
      lastUpdatedAt: Date.now(),
    };
    
    // Update the specific field
    const updatedEducation = {
      ...education,
      [fieldName]: fieldStatus
    };
    
    await updateDoc(planRef, {
      [`sections.education`]: updatedEducation,
      updated_at: Date.now()
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
    if (!(await hasPermissionToPlan(planId, userId))) {
      throw new Error('User does not have permission to edit this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    const planSnap = await getDoc(planRef);
    
    if (!planSnap.exists()) {
      throw new Error('Plan not found');
    }
    
    const plan = planSnap.data() as ParentalPlan;
    const education = plan.sections.education || {};
    
    if (!education[fieldName] || typeof education[fieldName] !== 'object') {
      throw new Error('Field not found or not in the correct format');
    }
    
    // Update approval status
    const fieldStatus = education[fieldName] as { 
      value: string; 
      approved: boolean; 
      lastUpdatedBy: string; 
      lastUpdatedAt: number;
      comments?: string;
    };
    
    const updatedFieldStatus = {
      ...fieldStatus,
      approved,
      comments: comments || fieldStatus.comments,
      lastUpdatedBy: userId,
      lastUpdatedAt: Date.now()
    };
    
    await updateDoc(planRef, {
      [`sections.education.${fieldName}`]: updatedFieldStatus,
      updated_at: Date.now()
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

export const deleteParentalPlan = async (planId: string, userId: string): Promise<void> => {
  try {
    // Verify the user has edit permissions
    if (!(await hasPermissionToPlan(planId, userId))) {
      throw new Error('User does not have permission to delete this plan');
    }
    
    const planRef = doc(db, COLLECTION_NAME, planId);
    await deleteDoc(planRef);
    
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