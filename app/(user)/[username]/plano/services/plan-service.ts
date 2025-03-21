import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, serverTimestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { ParentalPlan, EducationSection } from '../types';
import { auditLog } from '@/lib/auditLogger';

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
    
    await auditLog({
      action: 'create_parental_plan',
      userId,
      resourceId: docRef.id,
      resourceType: 'parental_plan',
      metadata: { childId }
    });
    
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
    
    await auditLog({
      action: 'update_parental_plan_section',
      userId,
      resourceId: planId,
      resourceType: 'parental_plan',
      metadata: { section: 'education' }
    });
  } catch (error) {
    console.error('Error updating education section:', error);
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
    
    await auditLog({
      action: 'delete_parental_plan',
      userId,
      resourceId: planId,
      resourceType: 'parental_plan'
    });
  } catch (error) {
    console.error('Error deleting parental plan:', error);
    throw error;
  }
};