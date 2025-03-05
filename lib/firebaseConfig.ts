// Re-export Firebase services from the app folder to maintain backward compatibility
import { auth, db, storage, analytics, checkFriendshipStatus, getUserByUsername } from '@/app/lib/firebaseConfig';

// Re-export type for compatibility
export type { FriendshipStatus } from '@/app/lib/firebaseConfig';

// Re-export all Firebase services
export { auth, db, storage, analytics, checkFriendshipStatus, getUserByUsername };