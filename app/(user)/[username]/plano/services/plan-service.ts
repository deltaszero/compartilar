import { ParentalPlan, EducationSection, FieldStatus, ChangelogEntry, PendingChangeNotification } from '../types';
import { logAuditEvent } from '@/lib/auditLogger';
import {
  getParentalPlansApi,
  getParentalPlanApi,
  createParentalPlanApi,
  updatePlanFieldApi,
  approveFieldApi,
  cancelFieldChangeApi,
  getParentalPlanChangeLogApi,
  updateEducationSectionApi,
  updateEducationFieldApi,
  deleteParentalPlanApi
} from '@/app/api/parental-plan/shared/api-service';

// Export the API functions for direct use from components
export const getParentalPlans = async (userId: string): Promise<ParentalPlan[]> => {
  try {
    // Try to fetch plans from the API
    console.log('Fetching parental plans for user:', userId);
    const plans = await getParentalPlansApi();
    console.log('Received plans from API:', plans.length, 'plans');
    if (plans.length > 0) {
      console.log('First plan sample:', {
        id: plans[0].id,
        title: plans[0].title,
        has_updated_at: !!plans[0].updated_at,
        has_updatedAt: !!plans[0].updatedAt,
        has_created_at: !!plans[0].created_at,
        has_createdAt: !!plans[0].createdAt,
        has_sections: !!plans[0].sections,
        isDeleted: plans[0].isDeleted,
        childrenIds: plans[0].childrenIds?.length
      });
    } else {
      console.log('No plans returned from API');
    }
    return plans;
  } catch (error) {
    console.error('Error fetching parental plans:', error);
    
    // Check if this is an authentication error
    if (error instanceof Error && error.message.includes('logged in')) {
      // Return an empty array instead of throwing for auth errors
      console.warn('User not authenticated, returning empty plans array');
      return [];
    }
    
    // For other types of errors, throw so they can be handled by the caller
    throw error;
  }
};

export const getParentalPlan = async (planId: string, userId?: string): Promise<ParentalPlan | null> => {
  try {
    return await getParentalPlanApi(planId);
  } catch (error) {
    console.error('Error fetching parental plan:', error);
    return null;
  }
};

// Update a specific field in any section of the parental plan
export const updatePlanField = async (
  planId: string,
  section: string,
  fieldName: string,
  value: any,
  userId: string
): Promise<boolean> => {
  try {
    const result = await updatePlanFieldApi(planId, section, fieldName, value);
    return result.success;
  } catch (error) {
    console.error('Error updating plan field:', error);
    throw error;
  }
};

// Generic function to approve or reject a field change in any section
export const approveField = async (
  planId: string,
  section: string,
  fieldName: string,
  approved: boolean,
  userId: string,
  comments?: string
): Promise<boolean> => {
  try {
    const result = await approveFieldApi(planId, section, fieldName, approved, comments);
    return result.success;
  } catch (error) {
    console.error('Error approving/rejecting field:', error);
    throw error;
  }
};

// Function to allow a user to cancel their own pending changes
export const cancelFieldChange = async (
  planId: string,
  userId: string,
  fieldName: string,
  section: string = 'education'
): Promise<boolean> => {
  try {
    const result = await cancelFieldChangeApi(planId, fieldName, section);
    return result.success;
  } catch (error) {
    console.error('Error canceling field change:', error);
    throw error;
  }
};

export const getParentalPlanChangeLog = async (planId: string, userId: string, limit = 20): Promise<ChangelogEntry[]> => {
  try {
    return await getParentalPlanChangeLogApi(planId, limit);
  } catch (error) {
    console.error('Error fetching parental plan changelog:', error);
    throw error;
  }
};

export const createParentalPlan = async (
  userId: string, 
  childrenIds: string[], 
  title: string,
  selectedEditors?: string[]
): Promise<string> => {
  try {
    const result = await createParentalPlanApi(childrenIds, title, selectedEditors);
    
    try {
      await logAuditEvent({
        action: 'create',
        userId,
        resourceId: result.id,
        resourceType: 'parental_plan', // Now using the proper resource type
        details: {
          operation: 'create_parental_plan',
          notes: `Created parental plan for children: ${childrenIds.join(', ')}`
        }
      });
    } catch (auditError) {
      // Log but don't fail the operation
      console.log('Failed to log audit event:', auditError);
    }
    
    return result.id;
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
    await updateEducationSectionApi(planId, educationData);
    
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
    await updateEducationFieldApi(planId, fieldName, value);
    
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
    await approveFieldApi(planId, 'education', fieldName, approved, comments);
    
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

export const cancelEducationFieldChange = async (
  planId: string,
  userId: string,
  fieldName: string,
  section: string = 'education'
): Promise<{success: boolean, originalValue?: string}> => {
  try {
    const result = await cancelFieldChangeApi(planId, fieldName, section);
    
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
    
    return result;
  } catch (error) {
    console.error('Error canceling field change:', error);
    throw error;
  }
};

export const deleteParentalPlan = async (planId: string, userId: string): Promise<void> => {
  try {
    await deleteParentalPlanApi(planId);
    
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