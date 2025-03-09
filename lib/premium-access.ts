import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { PremiumFeature } from '@/hooks/usePremiumFeatures';

// Free tier limits - should match the ones in usePremiumFeatures.ts
export const FREE_TIER_LIMITS = {
  max_children: 2,
  max_calendar_events: 10,
  max_financial_entries: 15,
  reports_enabled: false,
  location_history_days: 7
};

// Type for subscription data stored in Firestore
interface SubscriptionData {
  active: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: 'free' | 'premium';
  status?: string;
  updatedAt?: string;
}

/**
 * Check if a user has premium status
 */
export async function isUserPremium(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    const subscription = userData.subscription as SubscriptionData | undefined;
    
    return !!(subscription?.active && subscription?.plan === 'premium');
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Check if a user can access a specific premium feature
 */
export async function canAccessFeature(userId: string, feature: PremiumFeature): Promise<boolean> {
  // First check if user is premium
  const isPremium = await isUserPremium(userId);
  if (isPremium) return true;
  
  // Free tier logic - should match the client-side logic in usePremiumFeatures.ts
  try {
    switch (feature) {
      case 'unlimited_children':
        // Check how many children the user currently has
        const childrenRef = collection(db, 'children');
        const childrenQuery = query(
          childrenRef,
          where('editors', 'array-contains', userId)
        );
        const snapshot = await getDocs(childrenQuery);
        
        return snapshot.size < FREE_TIER_LIMITS.max_children;
        
      case 'advanced_calendar':
        return false; // Free users don't have access to advanced calendar features
        
      case 'detailed_reports':
        return false; // Free users don't have access to detailed reports
        
      case 'expense_analytics':
        return false; // Free users don't have access to expense analytics
        
      case 'location_history':
        return true; // Free users have limited location history access
        
      case 'priority_support':
        return false; // Free users don't have priority support
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Enforce premium feature access in API routes
 */
export async function enforcePremiumAccess(userId: string, feature: PremiumFeature) {
  const hasAccess = await canAccessFeature(userId, feature);
  
  if (!hasAccess) {
    throw new Error(`Premium feature access denied: ${feature}`);
  }
}