import { KidInfo } from '../../types';

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