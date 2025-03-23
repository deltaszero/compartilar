import { KidInfo } from '../../types';

// Change history entry type definition
export interface ChangeHistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  fields?: string[];
  description: string;
  userName?: string;
  userPhotoURL?: string;
  beforeValues?: Record<string, any>;
  afterValues?: Record<string, any>;
}

// User info type definition
export interface UserInfo {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  lastActive?: string;
}

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
 * Fetch child history entries
 */
export async function fetchChildHistory(
  childId: string, 
  token: string, 
  limit: number = 20
): Promise<ChangeHistoryEntry[]> {
  try {
    const response = await fetch(`/api/children/[id]/history?childId=${childId}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.status}`);
    }

    const historyEntries = await response.json();
    
    // Format timestamps
    return historyEntries.map((entry: any) => ({
      ...entry,
      timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching history:', error);
    throw error;
  }
}

/**
 * Search for users by name or email
 */
export async function searchUsers(searchTerm: string, token: string): Promise<UserInfo[]> {
  try {
    const response = await fetch(`/api/users/search?term=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

/**
 * Fetch user details by IDs
 */
export async function fetchUsersDetails(userIds: string[], token: string): Promise<UserInfo[]> {
  if (userIds.length === 0) return [];
  
  try {
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
 * Add user access (editor or viewer)
 */
export async function addUserAccess(
  childId: string,
  userId: string,
  accessType: 'editor' | 'viewer',
  token: string
): Promise<void> {
  try {
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
      throw new Error(`Failed to add user access: ${response.status}`);
    }
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
      throw new Error(`Failed to remove user access: ${response.status}`);
    }
  } catch (error) {
    console.error('Error removing user access:', error);
    throw error;
  }
}