'use client';

import { useUser } from '@context/userContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { validateSubscription, isSubscriptionExpired } from '@/lib/subscription-validator';

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
            // Check if the subscription period has expired
            if (isSubscriptionExpired(subscription)) {
              console.log('Subscription appears to be expired, validating with Stripe');
              // Validate with Stripe if it seems expired
              const isActive = await validateSubscription(userData.uid);
              setFreshSubscriptionStatus(isActive);
            } else {
              // Subscription is within its period, use the active flag
              setFreshSubscriptionStatus(
                !!(subscription?.active && subscription?.plan === 'premium')
              );
            }
          } else {
            // No subscription end date, use the active flag directly
            setFreshSubscriptionStatus(
              !!(subscription?.active && subscription?.plan === 'premium')
            );
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
    isLoading
  };
}