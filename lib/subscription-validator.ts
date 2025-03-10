import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Subscription validation configuration
const CONFIG = {
  // Maximum time allowed (in milliseconds) before rechecking subscription
  // Default: 1 day (86400000ms)
  MAX_SUBSCRIPTION_CACHE_AGE: 86400000,
  
  // Grace period (in milliseconds) after expiration before features are disabled
  // Default: 3 days (259200000ms)
  GRACE_PERIOD_MS: 3 * 24 * 60 * 60 * 1000,
  
  // How long before expiration to start showing renewal warnings (in days)
  RENEWAL_WARNING_DAYS: 5
};

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
    
    // If subscription has active: true, consider it valid no matter how it was set
    // (direct, api, webhook, etc.)
    if (subscription.active === true && subscription.plan === 'premium') {
      console.log('User has an active premium subscription');
      
      // Check if subscription information is stale and needs refreshing
      const lastUpdated = subscription.updatedAt 
        ? new Date(subscription.updatedAt).getTime() 
        : 0;
      
      const timeSinceLastUpdate = Date.now() - lastUpdated;
      
      // If subscription info is recent enough, use the cached active status
      if (timeSinceLastUpdate < CONFIG.MAX_SUBSCRIPTION_CACHE_AGE) {
        return true;
      }
      
      console.log('Subscription data is stale, validating with Stripe if possible...');
    }
    
    // If we have a subscription ID, validate with Stripe
    if (subscription.stripeSubscriptionId) {
      try {
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
          console.warn('Failed to validate subscription with API');
          // Still consider active if that's what Firestore says
          return !!subscription.active;
        }
        
        const result = await response.json();
        return result.isActive;
      } catch (apiError) {
        console.error('Error validating with API:', apiError);
        // On API error, trust the stored value
        return !!subscription.active;
      }
    }
    
    // If we don't have a subscription ID, but have active status, trust it
    // This handles the case of direct Firestore updates
    if (subscription.hasOwnProperty('active')) {
      return !!subscription.active;
    }
    
    // No clear subscription status
    return false;
  } catch (error) {
    console.error('Error validating subscription:', error);
    // On error, be permissive - if Firestore says active, trust it
    return false;
  }
}

/**
 * Checks if a subscription is expired based on its end date,
 * with optional grace period consideration
 */
export function isSubscriptionExpired(
  subscription: any,
  includeGracePeriod: boolean = false
): boolean {
  if (!subscription) return true;
  
  // If subscription is explicitly marked as inactive, it's expired
  if (subscription.active === false) return true;
  
  // Check the end date if available
  if (subscription.currentPeriodEnd) {
    const endDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    
    // If including grace period, add grace period to end date
    if (includeGracePeriod) {
      const graceEndDate = new Date(endDate.getTime() + CONFIG.GRACE_PERIOD_MS);
      return graceEndDate < now;
    }
    
    return endDate < now;
  }
  
  // If no end date but has active flag, trust the active flag
  if (subscription.hasOwnProperty('active')) {
    return !subscription.active;
  }
  
  // No reliable data, assume expired
  return true;
}

/**
 * Check if a subscription is in grace period (expired but within grace window)
 */
export function isInGracePeriod(subscription: any): boolean {
  if (!subscription || !subscription.currentPeriodEnd) {
    return false;
  }
  
  // Check if it's expired without grace period
  const isExpiredNormally = isSubscriptionExpired(subscription, false);
  
  // If not expired normally, it's not in grace period
  if (!isExpiredNormally) {
    return false;
  }
  
  // Check if it's expired with grace period
  const isExpiredWithGrace = isSubscriptionExpired(subscription, true);
  
  // If expired normally but not with grace, it's in grace period
  return !isExpiredWithGrace;
}

/**
 * Checks if a subscription is approaching expiration (renewal warning)
 */
export function isApproachingExpiration(subscription: any): boolean {
  if (!subscription || !subscription.currentPeriodEnd || subscription.active === false) {
    return false;
  }
  
  const endDate = new Date(subscription.currentPeriodEnd);
  const now = new Date();
  
  // Calculate days until expiration
  const msUntilExpiration = endDate.getTime() - now.getTime();
  const daysUntilExpiration = msUntilExpiration / (1000 * 60 * 60 * 24);
  
  // Return true if within warning period
  return daysUntilExpiration > 0 && daysUntilExpiration <= CONFIG.RENEWAL_WARNING_DAYS;
}