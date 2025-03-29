import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, orderBy, writeBatch, Timestamp, WhereFilterOp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Child } from '@/types/user.types';
import { getEventsForDay, generateCalendarDays } from './date-utils';
import { CalendarEventWithChild } from './types';

export { generateCalendarDays };

/**
 * Fetch children accessible to a user
 */
export async function fetchChildren(userId: string): Promise<Child[]> {
  try {
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
 */
export async function fetchCoParentingRelationships(userId: string): Promise<string[]> {
  try {
    // This is a placeholder. In a real app, you would fetch this from Firestore
    return [];
  } catch (error) {
    console.error('Error fetching co-parenting relationships:', error);
    throw error;
  }
}

/**
 * Fetch event history for a specific event
 */
export async function fetchEventHistory(eventId: string): Promise<any[]> {
  try {
    // This is a placeholder. In a real app, you would fetch this from Firestore
    return [];
  } catch (error) {
    console.error('Error fetching event history:', error);
    throw error;
  }
}