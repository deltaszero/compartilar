'use client';

import { useUser } from '@context/userContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { 
  validateSubscription, 
  isSubscriptionExpired, 
  isInGracePeriod,
  isApproachingExpiration 
} from '@/lib/subscription-validator';
import { createSubscriptionNotification } from '@/lib/subscription-notifications';

// Define the premium features available
export type PremiumFeature = 
  | 'unlimited_children' 
  | 'advanced_calendar' 
  | 'detailed_reports'
  | 'expense_analytics'
  | 'location_history'
  | 'priority_support';

// Define limits for free tier
const FREE_TIER_LIMITS = {
  max_children: 2,
  max_calendar_events: 10,
  max_financial_entries: 15,
  reports_enabled: false,
  location_history_days: 7
};

// The complete hook for premium feature access control
export function usePremiumFeatures() {
  const { userData } = useUser();
  const [freshSubscriptionStatus, setFreshSubscriptionStatus] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInGracePeriodState, setIsInGracePeriodState] = useState(false);
  const [isApproachingExpirationState, setIsApproachingExpirationState] = useState(false);
  const [graceEndsAt, setGraceEndsAt] = useState<string | null>(null);

  // Check subscription from Firestore directly to ensure it's up-to-date
  useEffect(() => {
    const checkSubscription = async () => {
      if (!userData?.uid) return;

      setIsLoading(true);
      try {
        // Get the latest user data directly from Firestore
        const userRef = doc(db, 'users', userData.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const subscription = userData.subscription;
          
          console.log('Fresh subscription status from Firestore:', subscription);
          
          // First check if subscription data exists and has an end date
          if (subscription && subscription.currentPeriodEnd) {
            // Check if the subscription is approaching expiration (for renewal warnings)
            const approaching = isApproachingExpiration(subscription);
            setIsApproachingExpirationState(approaching);
            
            // If approaching expiration, show a notification (only once per day)
            if (approaching && subscription.active) {
              const endDate = new Date(subscription.currentPeriodEnd);
              const now = new Date();
              const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              
              const lastWarningDate = subscription.lastRenewalWarning 
                ? new Date(subscription.lastRenewalWarning) 
                : new Date(0);
                
              const daysSinceLastWarning = Math.floor((now.getTime() - lastWarningDate.getTime()) / (1000 * 60 * 60 * 24));
              
              // Only show warning once per day
              if (daysSinceLastWarning >= 1) {
                try {
                  // Send renewal warning notification
                  await createSubscriptionNotification(userData.uid, 'renewal_upcoming', {
                    daysRemaining,
                    expirationDate: subscription.currentPeriodEnd
                  });
                  
                  // Update last warning timestamp in subscription data
                  const userRef = doc(db, 'users', userData.uid);
                  await setDoc(userRef, {
                    subscription: {
                      ...subscription,
                      lastRenewalWarning: new Date().toISOString()
                    }
                  }, { merge: true });
                } catch (error) {
                  console.error('Error creating renewal notification:', error);
                }
              }
            }
            
            // Check if the subscription period has expired (normal check without grace period)
            if (isSubscriptionExpired(subscription, false)) {
              console.log('Subscription appears to be expired, checking grace period');
              
              // Check if in grace period
              const inGracePeriod = isInGracePeriod(subscription);
              setIsInGracePeriodState(inGracePeriod);
              
              if (inGracePeriod) {
                console.log('Subscription is in grace period');
                // Calculate grace period end date
                const endDate = new Date(subscription.currentPeriodEnd);
                const gracePeriodEnd = new Date(endDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
                setGraceEndsAt(gracePeriodEnd.toISOString());
                
                // During grace period, still allow premium access
                setFreshSubscriptionStatus(true);
              } else {
                console.log('Subscription is expired beyond grace period, validating with Stripe');
                // Validate with Stripe if it seems completely expired
                const isActive = await validateSubscription(userData.uid);
                setFreshSubscriptionStatus(isActive);
              }
            } else {
              // Subscription is within its period, use the active flag
              setFreshSubscriptionStatus(
                !!(subscription?.active && subscription?.plan === 'premium')
              );
              setIsInGracePeriodState(false);
            }
          } else {
            // No subscription end date, use the active flag directly
            setFreshSubscriptionStatus(
              !!(subscription?.active && subscription?.plan === 'premium')
            );
            setIsInGracePeriodState(false);
            setIsApproachingExpirationState(false);
          }
        } else {
          setFreshSubscriptionStatus(false);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setFreshSubscriptionStatus(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [userData?.uid]);
  
  // Check if the user has an active subscription, first from fresh check, then fallback to context
  const isPremium = useMemo(() => {
    // If we have fresh data from Firestore, use that
    if (freshSubscriptionStatus !== null) {
      return freshSubscriptionStatus;
    }
    
    // Otherwise fall back to the data in the user context
    return !!(userData?.subscription?.active && 
              userData?.subscription?.plan === 'premium');
  }, [freshSubscriptionStatus, userData]);

  // Debug info 
  useEffect(() => {
    console.log('Premium status:', { 
      fromContext: !!(userData?.subscription?.active && userData?.subscription?.plan === 'premium'),
      fromFreshCheck: freshSubscriptionStatus,
      finalValue: isPremium
    });
  }, [isPremium, freshSubscriptionStatus, userData]);

  // Get remaining free tier limits
  const remainingFreeTierLimits = useMemo(() => {
    // This would normally fetch actual usage from the database
    // For now, we're just returning the static limits
    return FREE_TIER_LIMITS;
  }, []);

  // Force refresh the subscription status from Stripe
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!userData?.uid) return false;
    
    setIsLoading(true);
    try {
      console.log('Forcing subscription validation with Stripe');
      const isActive = await validateSubscription(userData?.uid);
      setFreshSubscriptionStatus(isActive);
      return isActive;
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      setFreshSubscriptionStatus(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userData?.uid]);

  // Check if a specific feature is available
  const canUseFeature = useCallback((feature: PremiumFeature): boolean => {
    // Premium users can access all features
    if (isPremium) return true;
    
    // Free tier restrictions based on feature
    switch (feature) {
      case 'unlimited_children':
        // Logic to check if user has reached free tier limit
        return false;
      case 'advanced_calendar':
        return false;
      case 'detailed_reports':
        return false;
      case 'expense_analytics':
        return false;
      case 'location_history':
        // Free users can access basic location history
        return true;
      case 'priority_support':
        return false;
      default:
        return false;
    }
  }, [isPremium]);

  // Get a message explaining why a feature is locked
  const getFeatureLockedMessage = useCallback((feature: PremiumFeature): string => {
    switch (feature) {
      case 'unlimited_children':
        return `Limite gratuito: ${FREE_TIER_LIMITS.max_children} crianças. Faça upgrade para adicionar mais.`;
      case 'advanced_calendar':
        return `Limite gratuito: ${FREE_TIER_LIMITS.max_calendar_events} eventos. Faça upgrade para recursos avançados.`;
      case 'detailed_reports':
        return 'Relatórios detalhados são exclusivos para membros Premium.';
      case 'expense_analytics':
        return 'Análises financeiras avançadas estão disponíveis apenas para assinantes Premium.';
      case 'location_history':
        return `Histórico de localização limitado a ${FREE_TIER_LIMITS.location_history_days} dias na versão gratuita.`;
      case 'priority_support':
        return 'Suporte prioritário é exclusivo para membros Premium.';
      default:
        return 'Este recurso está disponível apenas para assinantes Premium.';
    }
  }, []);

  return {
    isPremium,
    canUseFeature,
    getFeatureLockedMessage,
    remainingFreeTierLimits,
    refreshSubscriptionStatus,
    isLoading,
    isInGracePeriod: isInGracePeriodState,
    isApproachingExpiration: isApproachingExpirationState,
    graceEndsAt
  };
}