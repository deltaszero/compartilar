// Re-export Firebase services from the app folder to maintain backward compatibility
import { 
    auth, 
    db, 
    storage, 
    analytics, 
    checkFriendshipStatus, 
    getUserByUsername,
    markFirestoreListenersInactive,
    markFirestoreListenersActive,
    addFirestoreListener,
    activeListeners,
    
    // New schema functions
    createChild,
    updateChild,
    addChildViewer,
    addChildEditor,
    removeChildViewer,
    removeChildEditor,
    getUserChildren,
    getChildChangeHistory,
    
    // Calendar events
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getChildEvents
} from '@/app/lib/firebaseConfig';

// Re-export types for compatibility
// The ChangeHistoryEntry interface needs a fix for the timestamp type
export type { 
    FriendshipStatus
} from '@/app/lib/firebaseConfig';

// Re-export with a modified timestamp type for better client-side handling
export interface ChangeHistoryEntry {
    timestamp: Date;  // Using Date instead of Firestore Timestamp for serialization
    userId: string;
    userName?: string;
    action: 'create' | 'update' | 'delete' | 'permission_add' | 'permission_remove';
    fields: string[];
    fieldLabels?: string[];  // Human-readable field names
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    description?: string;
}

// Re-export all Firebase services
export { 
    auth, 
    db, 
    storage, 
    analytics, 
    checkFriendshipStatus, 
    getUserByUsername,
    markFirestoreListenersInactive,
    markFirestoreListenersActive,
    addFirestoreListener,
    activeListeners,
    
    // New schema functions
    createChild,
    updateChild,
    addChildViewer,
    addChildEditor,
    removeChildViewer,
    removeChildEditor,
    getUserChildren,
    getChildChangeHistory,
    
    // Calendar events
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getChildEvents
};