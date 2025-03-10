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
export type { 
    FriendshipStatus,
    SerializableChangeHistoryEntry as ChangeHistoryEntry
} from '@/app/lib/firebaseConfig';

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