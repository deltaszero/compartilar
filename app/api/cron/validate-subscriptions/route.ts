import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Secure cron job endpoint to validate all active subscriptions
 * This should be called daily via a cron job service like Vercel Cron
 * 
 * To secure this endpoint:
 * 1. Use a secret key in the Authorization header
 * 2. Set up IP restrictions in your cloud provider
 */
export async function GET(request: Request) {
  // Verify authentication (using Authorization header with a secret key)
  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET_KEY}`;
  
  if (!process.env.CRON_SECRET_KEY || authHeader !== expectedAuth) {
    console.error('Unauthorized access attempt to subscription validation cron');
    return NextResponse.json(
      { error: 'Unauthorized access' },
      { status: 401 }
    );
  }
  
  try {
    console.log('Starting scheduled subscription validation');
    
    // Find all users with active subscriptions
    const usersRef = collection(db, 'users');
    const activeSubscriptionsQuery = query(
      usersRef,
      where('subscription.active', '==', true),
      where('subscription.plan', '==', 'premium')
    );
    
    const snapshot = await getDocs(activeSubscriptionsQuery);
    
    console.log(`Found ${snapshot.size} active subscriptions to validate`);
    
    // Track results
    const results = {
      total: snapshot.size,
      validated: 0,
      expired: 0,
      errors: 0,
      notFound: 0
    };
    
    // Process each subscription
    const updatePromises = snapshot.docs.map(async (doc) => {
      const userId = doc.id;
      const userData = doc.data();
      const subscription = userData.subscription || {};
      
      // Skip if subscription was updated recently (last 12 hours)
      const lastUpdated = subscription.updatedAt 
        ? new Date(subscription.updatedAt).getTime() 
        : 0;
      const twelveHours = 12 * 60 * 60 * 1000;
      
      if (Date.now() - lastUpdated < twelveHours) {
        console.log(`Skipping recent subscription for user ${userId}, updated ${new Date(lastUpdated).toISOString()}`);
        results.validated++;
        return;
      }
      
      try {
        // If we have a subscription ID, verify with Stripe
        if (subscription.stripeSubscriptionId) {
          try {
            // Get subscription from Stripe
            const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
            
            // Check if subscription is still active in Stripe
            const isActive = ['active', 'trialing'].includes(stripeSubscription.status);
            
            if (!isActive && subscription.active) {
              // Subscription is no longer active in Stripe, but marked active in our DB
              console.log(`Subscription ${subscription.stripeSubscriptionId} for user ${userId} is no longer active in Stripe`);
              
              // Update the subscription status
              await setDoc(doc(db, 'users', userId), {
                subscription: {
                  ...subscription,
                  active: false,
                  plan: 'free',
                  status: stripeSubscription.status,
                  canceledAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  cronValidated: true
                }
              }, { merge: true });
              
              results.expired++;
              
              // TODO: Send user a notification about subscription expiration
            } else if (isActive && !subscription.active) {
              // Subscription is active in Stripe, but marked inactive in our DB
              console.log(`Subscription ${subscription.stripeSubscriptionId} for user ${userId} is active in Stripe but not in our DB`);
              
              // Update the subscription status
              await setDoc(doc(db, 'users', userId), {
                subscription: {
                  ...subscription,
                  active: true,
                  plan: 'premium',
                  status: stripeSubscription.status,
                  updatedAt: new Date().toISOString(),
                  cronValidated: true
                }
              }, { merge: true });
              
              results.validated++;
              
              // TODO: Send user a notification about subscription reactivation
            } else {
              // Status is consistent, just update metadata
              await setDoc(doc(db, 'users', userId), {
                subscription: {
                  ...subscription,
                  status: stripeSubscription.status,
                  currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                  updatedAt: new Date().toISOString(),
                  cronValidated: true
                }
              }, { merge: true });
              
              results.validated++;
            }
            
          } catch (stripeError) {
            // Handle "no such subscription" error
            const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
            
            if (errorMessage.includes('No such subscription')) {
              console.log(`Subscription ${subscription.stripeSubscriptionId} for user ${userId} not found in Stripe`);
              
              // Update subscription to inactive if it was previously active
              if (subscription.active) {
                await setDoc(doc(db, 'users', userId), {
                  subscription: {
                    ...subscription,
                    active: false,
                    plan: 'free',
                    status: 'canceled',
                    error: 'Subscription not found in Stripe',
                    updatedAt: new Date().toISOString(),
                    cronValidated: true
                  }
                }, { merge: true });
                
                results.notFound++;
              }
            } else {
              console.error(`Error validating subscription for user ${userId}:`, stripeError);
              results.errors++;
            }
          }
        } else if (subscription.currentPeriodEnd) {
          // If we have an end date but no subscription ID, check if it's expired
          const endDate = new Date(subscription.currentPeriodEnd);
          
          if (endDate < new Date() && subscription.active) {
            console.log(`Subscription for user ${userId} expired on ${endDate.toISOString()}`);
            
            // Update to inactive
            await setDoc(doc(db, 'users', userId), {
              subscription: {
                ...subscription,
                active: false,
                plan: 'free',
                status: 'expired',
                updatedAt: new Date().toISOString(),
                cronValidated: true
              }
            }, { merge: true });
            
            results.expired++;
          } else {
            results.validated++;
          }
        }
      } catch (error) {
        console.error(`Error processing subscription for user ${userId}:`, error);
        results.errors++;
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log('Subscription validation completed', results);
    
    return NextResponse.json({
      message: 'Subscription validation completed',
      results
    });
    
  } catch (error) {
    console.error('Error in subscription validation cron:', error);
    
    return NextResponse.json(
      { 
        error: 'Error validating subscriptions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}