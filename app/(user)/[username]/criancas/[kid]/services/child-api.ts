import { KidInfo } from '../../types';
import { ChangeHistoryEntry } from '@/lib/firebaseConfig';

/**
 * Fetch child data from API
 */
export async function fetchChildData(childId: string, token: string): Promise<KidInfo> {
  const response = await fetch(`/api/children/[id]?id=${childId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest' // CSRF protection
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('child_not_found');
    } else if (response.status === 403) {
      throw new Error('access_denied');
    } else {
      throw new Error(`Failed to fetch child data: ${response.status}`);
    }
  }

  return await response.json() as KidInfo;
}

/**
 * Search for users
 */
export async function searchUsers(searchTerm: string, token: string): Promise<any[]> {
  try {
    console.log(`Searching users with term: ${searchTerm}`);
    
    const response = await fetch(`/api/users/search?term=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    if (!response.ok) {
      console.error(`Search users API error: ${response.status}`);
      
      // Try to get more detailed error information
      try {
        const errorBody = await response.json();
        console.error('Search API error details:', errorBody);
      } catch (e) {
        // If we can't parse the error response as JSON
        console.error('Could not parse error response');
      }
      
      throw new Error(`Failed to search users: ${response.status}`);
    }

    const results = await response.json();
    console.log(`User search returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Fetch users details by IDs
 */
export async function fetchUsersDetails(userIds: string[], token: string): Promise<any[]> {
  if (userIds.length === 0) return [];
  
  try {
    // Create a comma-separated list of user IDs
    const idsParam = userIds.join(',');
    
    const response = await fetch(`/api/users?ids=${idsParam}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user details: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
}

/**
 * Update child data
 */
export async function updateChildData(
  childId: string, 
  updates: Partial<KidInfo>, 
  historyEntry: any | null,
  token: string
): Promise<void> {
  const payload: any = { ...updates, id: childId };
  
  // Add history entry if provided
  if (historyEntry) {
    payload.historyEntry = historyEntry;
  }
  
  try {
    const response = await fetch(`/api/children/[id]`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to update child: ${response.status}`);
    }
  } catch (error) {
    console.error('Error updating child:', error);
    throw error;
  }
}

/**
 * Delete child (soft delete)
 */
export async function deleteChild(childId: string, token: string): Promise<void> {
  try {
    const response = await fetch(`/api/children/[id]?id=${childId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete child: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting child:', error);
    throw error;
  }
}

/**
 * Fetch child history
 */
export async function fetchChildHistory(childId: string, token: string): Promise<ChangeHistoryEntry[]> {
  try {
    const response = await fetch(`/api/children/[id]/history?childId=${childId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
}

/**
 * Add user access (editor or viewer)
 */
export async function addUserAccess(
  childId: string, 
  userId: string, 
  accessType: 'editor' | 'viewer',
  token: string
): Promise<void> {
  try {
    console.log(`Adding user access: user=${userId}, type=${accessType}, child=${childId}`);
    
    const response = await fetch(`/api/children/[id]/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      },
      body: JSON.stringify({
        childId,
        userId,
        type: accessType
      })
    });

    if (!response.ok) {
      console.error(`Add user access API error: ${response.status}`);
      
      // Try to parse error details
      try {
        const errorBody = await response.json();
        console.error('API error details:', errorBody);
      } catch (e) {
        console.error('Could not parse error response');
      }
      
      throw new Error(`Failed to add user access: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Add user access result:', result);
  } catch (error) {
    console.error('Error adding user access:', error);
    throw error;
  }
}

/**
 * Remove user access (editor or viewer)
 */
export async function removeUserAccess(
  childId: string, 
  userId: string, 
  accessType: 'editor' | 'viewer',
  token: string
): Promise<void> {
  try {
    console.log(`Removing user access: user=${userId}, type=${accessType}, child=${childId}`);
    
    const response = await fetch(`/api/children/[id]/permissions?childId=${childId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      },
      body: JSON.stringify({
        childId,
        userId,
        type: accessType
      })
    });

    if (!response.ok) {
      console.error(`Remove user access API error: ${response.status}`);
      
      // Try to parse error details
      try {
        const errorBody = await response.json();
        console.error('API error details:', errorBody);
      } catch (e) {
        console.error('Could not parse error response');
      }
      
      throw new Error(`Failed to remove user access: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Remove user access result:', result);
  } catch (error) {
    console.error('Error removing user access:', error);
    throw error;
  }
}