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
    
    // Calendar events
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getChildEvents
} from '@/app/lib/firebaseConfig';

// Re-export type for compatibility
export type { FriendshipStatus } from '@/app/lib/firebaseConfig';

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
    
    // Calendar events
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getChildEvents
};