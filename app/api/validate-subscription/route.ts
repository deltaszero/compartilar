import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * API route to validate a subscription status and update the user's record
 */
export async function POST(request: Request) {
  try {
    console.log('Validate subscription API called');
    const { subscriptionId, userId } = await request.json();
    
    // Validate required fields
    if (!subscriptionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log(`Validating subscription ${subscriptionId} for user ${userId}`);
    
    // Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('Subscription retrieved from Stripe:', {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
    
    // Check if the subscription is active
    const isActive = subscription.status === 'active' || 
                     subscription.status === 'trialing';
    
    // Get user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userDoc.data();
    const currentSubscription = userData.subscription || {};
    
    // Update the subscription information
    const updatedSubscription = {
      ...currentSubscription,
      active: isActive,
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
      plan: isActive ? 'premium' : 'free',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      lastValidated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Updating user subscription data:', updatedSubscription);
    
    // Update the user document
    await setDoc(userRef, {
      ...userData,
      subscription: updatedSubscription
    }, { merge: true });
    
    console.log('User subscription updated successfully');
    
    return NextResponse.json({
      isActive,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      updated: true
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error validating subscription:', error);
    
    // Handle Stripe "no such subscription" error
    if (errorMessage.includes('No such subscription')) {
      // If the subscription doesn't exist, update the user record to reflect this
      try {
        const { userId } = await request.json();
        if (userId) {
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            await setDoc(userRef, {
              ...userData,
              subscription: {
                active: false,
                plan: 'free',
                status: 'canceled',
                error: 'Subscription not found in Stripe',
                updatedAt: new Date().toISOString(),
              }
            }, { merge: true });
            
            console.log('User subscription marked as inactive (not found in Stripe)');
          }
        }
      } catch (updateError) {
        console.error('Error updating user after subscription not found:', updateError);
      }
      
      return NextResponse.json({
        isActive: false,
        status: 'canceled',
        error: 'Subscription not found',
        updated: true
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Error validating subscription', 
        details: errorMessage,
        isActive: false
      },
      { status: 500 }
    );
  }
}