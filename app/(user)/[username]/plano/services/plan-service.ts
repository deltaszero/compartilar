import { User } from 'firebase/auth';
import { ParentalPlan } from '../types';
import { 
  fetchParentalPlans,
  fetchParentalPlan,
  createParentalPlan as apiCreateParentalPlan,
  updateParentalPlan as apiUpdateParentalPlan,
  deleteParentalPlan as apiDeleteParentalPlan
} from './parental-plan-service';

/**
 * Fetch all parental plans for the current user
 */
export async function getParentalPlans(user: User): Promise<ParentalPlan[]> {
  try {
    const token = await user.getIdToken(true);
    return await fetchParentalPlans(token);
  } catch (error) {
    console.error('Failed to get parental plans:', error);
    throw error;
  }
}

/**
 * Fetch a single parental plan by ID
 */
export async function getParentalPlan(user: User, planId: string): Promise<ParentalPlan> {
  try {
    const token = await user.getIdToken(true);
    return await fetchParentalPlan(planId, token);
  } catch (error) {
    console.error(`Failed to get parental plan ${planId}:`, error);
    throw error;
  }
}

/**
 * Create a new parental plan
 */
export async function createParentalPlan(
  user: User,
  planData: Partial<ParentalPlan>
): Promise<string> {
  try {
    const token = await user.getIdToken(true);
    const response = await apiCreateParentalPlan(planData, token);
    return response.id;
  } catch (error) {
    console.error('Failed to create parental plan:', error);
    throw error;
  }
}

/**
 * Update an existing parental plan
 */
export async function updateParentalPlan(
  user: User,
  planId: string,
  updates: Partial<ParentalPlan>,
  changeDescription: string = ''
): Promise<void> {
  try {
    const token = await user.getIdToken(true);
    await apiUpdateParentalPlan(planId, updates, changeDescription, token);
  } catch (error) {
    console.error(`Failed to update parental plan ${planId}:`, error);
    throw error;
  }
}

/**
 * Delete a parental plan
 */
export async function deleteParentalPlan(user: User, planId: string): Promise<void> {
  try {
    const token = await user.getIdToken(true);
    await apiDeleteParentalPlan(planId, token);
  } catch (error) {
    console.error(`Failed to delete parental plan ${planId}:`, error);
    throw error;
  }
}