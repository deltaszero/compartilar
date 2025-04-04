import { auth } from '@/lib/firebaseConfig';
import { ParentalPlan, ChangelogEntry } from '../../../(user)/[username]/plano/types';

// Base API URL for parental plan endpoints
const BASE_URL = '/api/parental-plan';

// Helper to get auth token
const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.getIdToken(true);
};

// Helper to make authenticated API requests
const apiRequest = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> => {
  try {
    // Get authentication token
    let token;
    try {
      token = await getAuthToken();
    } catch (authError) {
      console.error('Authentication error:', authError);
      throw new Error('You must be logged in to access this resource');
    }
    
    // Make the request with timeout - helps for Firebase initialization issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // First try to parse the error response
      if (!response.ok) {
        try {
          const errorData = await response.json();
          
          // Special handling for GET methods to empty collections - return empty results
          if (method === 'GET' && response.status === 500) {
            if (url === '/api/parental-plan' || url.endsWith('/api/parental-plan')) {
              console.warn('Error fetching parental plans, returning empty array');
              return [] as unknown as T;
            }
          }
          
          throw new Error(errorData.message || errorData.error || `API request failed: ${response.status}`);
        } catch (jsonError) {
          // For GET requests to collections, return empty arrays instead of throwing
          if (method === 'GET' && response.status === 500) {
            if (url === '/api/parental-plan' || url.endsWith('/api/parental-plan')) {
              console.warn('Error fetching parental plans, returning empty array');
              return [] as unknown as T;
            }
          }
          
          throw new Error(`API request failed: ${response.status}`);
        }
      }
      
      // Parse the successful response
      const responseData = await response.json();
      return responseData;
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(`API request error for ${url}:`, error);
    throw error;
  }
};

// API functions for parental plans

// Get all parental plans for a user
export const getParentalPlansApi = async (): Promise<ParentalPlan[]> => {
  console.log('API Service: Fetching parental plans from:', `${BASE_URL}`);
  try {
    const plans = await apiRequest<ParentalPlan[]>(`${BASE_URL}`);
    console.log('API Service: Received', plans.length, 'plans from API');
    return plans;
  } catch (error) {
    console.error('API Service: Error fetching plans:', error);
    throw error;
  }
};

// Get a specific parental plan by ID
export const getParentalPlanApi = async (planId: string): Promise<ParentalPlan> => {
  return apiRequest<ParentalPlan>(`${BASE_URL}/${planId}`);
};

// Create a new parental plan
export const createParentalPlanApi = async (
  childrenIds: string[],
  title: string,
  selectedEditors?: string[]
): Promise<{ id: string }> => {
  return apiRequest<{ id: string }>(
    `${BASE_URL}`,
    'POST',
    { childrenIds, title, selectedEditors }
  );
};

// Update a specific field in any section of the parental plan
export const updatePlanFieldApi = async (
  planId: string,
  section: string,
  fieldName: string,
  value: any
): Promise<{ success: boolean }> => {
  return apiRequest<{ success: boolean }>(
    `${BASE_URL}/${planId}/field`,
    'PUT',
    { section, fieldName, value }
  );
};

// Approve or reject a field change
export const approveFieldApi = async (
  planId: string,
  section: string,
  fieldName: string,
  approved: boolean,
  comments?: string
): Promise<{ success: boolean }> => {
  return apiRequest<{ success: boolean }>(
    `${BASE_URL}/${planId}/approve-field`,
    'PUT',
    { section, fieldName, approved, comments }
  );
};

// Cancel a field change
export const cancelFieldChangeApi = async (
  planId: string,
  fieldName: string,
  section: string = 'education'
): Promise<{ success: boolean, originalValue?: string }> => {
  return apiRequest<{ success: boolean, originalValue?: string }>(
    `${BASE_URL}/${planId}/cancel-field`,
    'PUT',
    { fieldName, section }
  );
};

// Get changelog for a parental plan
export const getParentalPlanChangeLogApi = async (
  planId: string, 
  limit: number = 20
): Promise<ChangelogEntry[]> => {
  return apiRequest<ChangelogEntry[]>(`${BASE_URL}/${planId}/changelog?limit=${limit}`);
};

// Update education section
export const updateEducationSectionApi = async (
  planId: string,
  educationData: any
): Promise<{ success: boolean }> => {
  return apiRequest<{ success: boolean }>(
    `${BASE_URL}/${planId}/education`,
    'PUT',
    educationData
  );
};

// Update education field
export const updateEducationFieldApi = async (
  planId: string,
  fieldName: string,
  value: string | boolean | number
): Promise<{ success: boolean }> => {
  return apiRequest<{ success: boolean }>(
    `${BASE_URL}/${planId}/education`,
    'PUT',
    { fieldName, value }
  );
};

// Delete parental plan
export const deleteParentalPlanApi = async (planId: string): Promise<{ success: boolean }> => {
  return apiRequest<{ success: boolean }>(`${BASE_URL}/${planId}`, 'DELETE');
};