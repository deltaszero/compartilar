import { ParentalPlan, PlanChangeLog } from '../types';

/**
 * Fetch all parental plans available to the current user
 */
export async function fetchParentalPlans(token: string): Promise<ParentalPlan[]> {
  try {
    const response = await fetch('/api/parental-plan', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    // If server returns error with status, throw appropriate error
    if (!response.ok) {
      // For 4xx client errors, get error message from response
      if (response.status >= 400 && response.status < 500) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Client error: ${response.status}`);
      }
      
      // For 500 server errors
      if (response.status >= 500) {
        console.error(`Server error ${response.status} when fetching parental plans`);
        // Return empty array instead of throwing for server errors
        return [];
      }
      
      throw new Error(`Failed to fetch parental plans: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Log but don't rethrow server errors - return empty array instead
    if (error instanceof Error && error.message.includes('Server error')) {
      console.error('Error fetching parental plans:', error);
      return [];
    }
    
    // Client errors (auth, etc.) should still be thrown
    console.error('Error fetching parental plans:', error);
    throw error;
  }
}

/**
 * Fetch a specific parental plan by ID
 */
export async function fetchParentalPlan(planId: string, token: string): Promise<ParentalPlan> {
  try {
    const response = await fetch(`/api/parental-plan/${planId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('parental_plan_not_found');
      } else if (response.status === 403) {
        throw new Error('access_denied');
      }
      throw new Error(`Failed to fetch parental plan: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching parental plan:', error);
    throw error;
  }
}

/**
 * Create a new parental plan
 */
export async function createParentalPlan(
  planData: Partial<ParentalPlan>,
  token: string
): Promise<{ id: string }> {
  try {
    const response = await fetch('/api/parental-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      },
      body: JSON.stringify(planData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create parental plan: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating parental plan:', error);
    throw error;
  }
}

/**
 * Update an existing parental plan
 */
export async function updateParentalPlan(
  planId: string,
  updates: Partial<ParentalPlan>,
  changeDescription: string = '',
  token: string
): Promise<void> {
  try {
    // Add change description for changelog
    const payload = {
      ...updates,
      changeDescription
    };
    
    const response = await fetch(`/api/parental-plan/${planId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update parental plan: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating parental plan:', error);
    throw error;
  }
}

/**
 * Delete a parental plan
 */
export async function deleteParentalPlan(planId: string, token: string): Promise<void> {
  try {
    const response = await fetch(`/api/parental-plan/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete parental plan: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting parental plan:', error);
    throw error;
  }
}

/**
 * Fetch changelog for a parental plan
 */
export async function fetchParentalPlanChangelog(
  planId: string,
  token: string,
  limit: number = 20
): Promise<PlanChangeLog[]> {
  try {
    const response = await fetch(`/api/parental-plan/${planId}/changelog?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch parental plan changelog: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching parental plan changelog:', error);
    throw error;
  }
}