import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Maximum time allowed (in milliseconds) before rechecking subscription
// Default: 1 day (86400000ms)
const MAX_SUBSCRIPTION_CACHE_AGE = 86400000; 

/**
 * Validates if a user's subscription information is still current
 * and updates it in Firestore if needed.
 */
export async function validateSubscription(userId: string): Promise<boolean> {
  try {
    // Get user data from Firestore
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return false;
    }
    
    const userData = userDoc.data();
    const subscription = userData.subscription;
    
    // If no subscription data, user is not premium
    if (!subscription) {
      return false;
    }
    
    // Check if subscription information is stale and needs refreshing
    const lastUpdated = subscription.updatedAt 
      ? new Date(subscription.updatedAt).getTime() 
      : 0;
    
    const timeSinceLastUpdate = Date.now() - lastUpdated;
    
    // If subscription info is recent enough, use the cached active status
    if (timeSinceLastUpdate < MAX_SUBSCRIPTION_CACHE_AGE) {
      return !!subscription.active;
    }
    
    // If subscription data is stale, check with Stripe
    console.log('Subscription data is stale, validating with Stripe...');
    
    // If we have a subscription ID, validate it
    if (subscription.stripeSubscriptionId) {
      const response = await fetch('/api/validate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripeSubscriptionId,
          userId,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to validate subscription');
        return !!subscription.active; // Fall back to cached status on API error
      }
      
      const result = await response.json();
      return result.isActive;
    }
    
    // No subscription ID, assume not premium
    return false;
  } catch (error) {
    console.error('Error validating subscription:', error);
    return false;
  }
}

/**
 * Checks if a subscription is expired based on its end date
 */
export function isSubscriptionExpired(subscription: any): boolean {
  if (!subscription) return true;
  
  // If subscription is explicitly marked as inactive, it's expired
  if (subscription.active === false) return true;
  
  // Check the end date if available
  if (subscription.currentPeriodEnd) {
    const endDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    return endDate < now;
  }
  
  // If no end date but has active flag, trust the active flag
  if (subscription.hasOwnProperty('active')) {
    return !subscription.active;
  }
  
  // No reliable data, assume expired
  return true;
}