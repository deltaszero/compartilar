import { generateCalendarDays } from './date-utils';
import { Child, EventHistory } from '@/types/user.types';
// Note: db is dynamically imported in fetchChildren to avoid direct Firestore references

export { generateCalendarDays };

/**
 * Fetch children accessible to a user using the client-side Firestore
 * This is a fallback method. We should use the API endpoint when possible.
 */
export async function fetchChildren(userId: string): Promise<Child[]> {
  try {
    // This fallback function needs to return to client side for now
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebaseConfig');

    // Get children where the user is an editor
    const editorQuery = query(
      collection(db, 'children'),
      where('editors', 'array-contains', userId)
    );
    
    const editorSnapshot = await getDocs(editorQuery);
    const editorChildren = editorSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Child));
    
    // Get children where the user is a viewer
    const viewerQuery = query(
      collection(db, 'children'),
      where('viewers', 'array-contains', userId)
    );
    
    const viewerSnapshot = await getDocs(viewerQuery);
    const viewerChildren = viewerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Child));
    
    // Combine and deduplicate children
    const allChildren = [...editorChildren];
    viewerChildren.forEach(child => {
      if (!allChildren.some(c => c.id === child.id)) {
        allChildren.push(child);
      }
    });
    
    return allChildren;
  } catch (error) {
    console.error('Error fetching children:', error);
    throw error;
  }
}

/**
 * Fetch co-parenting relationships
 * @returns Promise<string[]> - Placeholder for future implementation
 */
export async function fetchCoParentingRelationships(): Promise<string[]> {
  // This is a placeholder. In a real app, you would fetch this from the API
  return [];
}

/**
 * Fetch event history for a specific event
 * This is a placeholder until the API endpoint is implemented
 */
export async function fetchEventHistory(eventId: string): Promise<EventHistory[]> {
  try {
    // This is a placeholder. In a real app, we'd use an API endpoint
    return [];
  } catch (error) {
    console.error('Error fetching event history:', error);
    throw error;
  }
}
