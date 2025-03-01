// app/lib/analyticsService.ts
import { db } from '@/app/lib/firebaseConfig';
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { AnalyticsEventType, AnalyticsEventParams } from '@/app/components/Analytics';

/**
 * Stores an analytics event in Firestore
 * This provides server-side persistence for analytics events
 * which can be used for reporting and dashboards
 */
export const storeAnalyticsEvent = async (
  eventType: AnalyticsEventType,
  userId?: string | null,
  params: AnalyticsEventParams = {}
): Promise<void> => {
  try {
    await addDoc(collection(db, 'analytics_events'), {
      event_name: eventType,
      user_id: userId || null,
      params,
      timestamp: serverTimestamp(),
      client_timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Error storing analytics event:', error);
    // Silently fail - analytics should not impact user experience
  }
};

/**
 * Combined function to handle both Firebase Analytics client-side tracking 
 * and server-side event storage for more reliable analytics
 */
export const trackAnalyticsEvent = async (
  eventType: AnalyticsEventType,
  userId?: string | null,
  params: AnalyticsEventParams = {}
): Promise<void> => {
  // Track in Firebase Analytics (client-side)
  // This is handled separately by the Analytics component or trackEvent function
  
  // Store in Firestore (server-side)
  await storeAnalyticsEvent(eventType, userId, params);
};

/**
 * Helper function to identify and format user for analytics
 */
export const identifyUser = (userId: string, userData: any): AnalyticsEventParams => {
  return {
    user_id: userId,
    user_email: userData.email || null,
    user_name: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : null,
    user_since: userData.createdAt ? userData.createdAt.toDate().toISOString() : null,
  };
};