import { getApps, initializeApp, cert, App, AppOptions } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if it hasn't been initialized yet
let adminApp: App | undefined;

// For debugging
console.log('Firebase Admin module loaded, apps count:', admin.apps.length);

export function initAdminApp() {
  console.log('initAdminApp called, existing apps:', getApps().length);
  
  try {
    // If we already have an initialized app, return it
    if (getApps().length > 0) {
      console.log('Returning existing Firebase Admin app');
      const existingApp = getApps()[0];
      if (existingApp) {
        adminApp = existingApp;
        return adminApp;
      }
    }
    
    // Need to initialize a new app
    console.log('Initializing new Firebase Admin app with environment:',
      {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'not set',
        hasCredentials: !!process.env.FIREBASE_ADMIN_CREDENTIALS,
        hasAdminProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID
      }
    );
    
    // For Firebase Admin SDK v11+ in Next.js 13+, use the v11 admin SDK (imported as * as admin)
    if (admin.apps.length === 0) {
      console.log('Using top-level admin.initializeApp');
      
      // Create the app with a simple configuration
      adminApp = admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      
      console.log('Firebase Admin initialized with admin.initializeApp');
      return adminApp;
    } else if (admin.apps.length > 0 && admin.apps[0]) {
      console.log('Using existing admin app:', admin.apps[0]?.name || 'unknown');
      return admin.apps[0];
    }
    
    // Fallback if no app was found or created
    throw new Error('Could not initialize Firebase Admin app');
  } catch (error) {
    console.error('Error in initAdminApp:', error);
    throw error;
  }
}

// Export admin auth and firestore instances with error handling
export const adminAuth = () => {
  try {
    const app = initAdminApp();
    // Only pass app if it's defined
    if (app) {
      return getAuth(app);
    }
    throw new Error('Firebase Admin app is undefined');
  } catch (error) {
    console.error('Error getting admin auth:', error instanceof Error ? error.message : 'Unknown error');
    // For development fallback, return a mock auth object
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock auth for development');
      return {
        verifyIdToken: async () => ({ uid: 'mock-uid' }),
        getUser: async () => ({ uid: 'mock-uid', email: 'mock@example.com' }),
        getUserByEmail: async () => ({ uid: 'mock-uid', email: 'mock@example.com' }),
        revokeRefreshTokens: async () => {}
      } as any;
    }
    throw error;
  }
};

export const adminDb = () => {
  try {
    const app = initAdminApp();
    // Only pass app if it's defined
    if (app) {
      return getFirestore(app);
    }
    throw new Error('Firebase Admin app is undefined');
  } catch (error) {
    console.error('Error getting admin firestore:', error instanceof Error ? error.message : 'Unknown error');
    // For development, we could potentially provide a mock DB for testing
    throw error;
  }
};