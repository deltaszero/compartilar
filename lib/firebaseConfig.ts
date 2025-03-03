import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
    // getFirestore, 
    // enablePersistence,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    limit
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
    }),
});
const auth = getAuth(app);

// Initialize storage and analytics only in browser context
let storage = null as ReturnType<typeof getStorage> | null;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
    storage = getStorage(app);
    analytics = getAnalytics(app);
}

// Friendship utility functions
export type FriendshipStatus = 'none' | 'pending' | 'friend' | 'support' | 'coparent' | 'other' | 'self';

/**
 * Check friendship status between two users
 * @param currentUserId - The ID of the current user
 * @param otherUserId - The ID of the other user to check friendship with
 * @returns A promise that resolves to the friendship status
 */
export async function checkFriendshipStatus(
  currentUserId: string,
  otherUserId: string
): Promise<FriendshipStatus> {
  // If same user, return 'self'
  if (currentUserId === otherUserId) {
    return 'self';
  }
  
  try {
    // First check if they're friends
    const friendDocRef = doc(db, 'friends', currentUserId, 'friendsList', otherUserId);
    const friendDoc = await getDoc(friendDocRef);
    
    // If they're friends, return the relationship type
    if (friendDoc.exists()) {
      const relationshipType = friendDoc.data().relationshipType;
      return relationshipType || 'friend'; // Default to 'friend' if no relationship type
    }
    
    // If not friends, check if there's a pending request
    return 'none';
  } catch (error) {
    console.error('Error checking friendship status:', error);
    return 'none';
  }
}

/**
 * Get user data by username
 * @param username - The username to look up
 * @returns A promise that resolves to the user data or null if not found
 */
export async function getUserByUsername(username: string) {
  try {
    // Query the account_info collection to find a user by username
    const usersRef = collection(db, 'account_info');
    const userQuery = query(
      usersRef,
      where('username', '==', username.toLowerCase()),
      limit(1)
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Get the first document
    const userDoc = querySnapshot.docs[0];
    
    return {
      uid: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
}

export { auth, db, storage, analytics };