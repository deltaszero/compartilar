import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { createSubscriptionNotification } from '@/lib/subscription-notifications';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // This should work fine with your Stripe version
});

/**
 * Subscription status events that we want to handle:
 * - customer.subscription.created: New subscription created
 * - customer.subscription.updated: Any update to subscription (including pausing, resuming, etc.)
 * - customer.subscription.deleted: Subscription canceled or ended
 * - invoice.payment_failed: Failed payment on subscription
 * - invoice.payment_succeeded: Successful payment on subscription
 */

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhook secret is not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    console.log(`Processing Stripe webhook event: ${event.type}`);
    
    // Handle specific Stripe events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

// Handle successful checkout
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (!session.client_reference_id) {
    console.error('No client_reference_id found in session');
    return;
  }

  const userId = session.client_reference_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log(`Processing checkout completed for user ${userId}`);
  console.log(`Customer ID: ${customerId}, Subscription ID: ${subscriptionId}`);

  // Get current user data
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    console.error('User not found:', userId);
    return;
  }

  // Get current subscription data if it exists
  const userData = userDoc.data();
  const existingSubscription = userData.subscription || {};
  
  // Build comprehensive subscription object
  const subscriptionData = {
    ...existingSubscription,
    active: true,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    stripeSessionId: session.id,
    webhookActivated: true,
    plan: 'premium',
    status: 'active',
    createdAt: existingSubscription.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  try {
    // DOUBLE VERIFY: Check that the existing user document's ID matches the client_reference_id
    // This adds an extra layer of security to prevent incorrect subscription assignments
    const existingUser = await getDoc(userRef);
    
    if (!existingUser.exists()) {
      console.error(`User ${userId} not found in database during webhook processing`);
      return;
    }
    
    // Extra security check - verify we're updating the correct user
    if (existingUser.id !== userId) {
      console.error(`Security alert: Webhook trying to update user ${existingUser.id} but client_reference_id is ${userId}`);
      return;
    }
    
    // Update only the subscription field to avoid permission issues
    await setDoc(userRef, {
      subscription: subscriptionData
    }, { merge: true });
    
    console.log(`Successfully updated subscription for user ${userId} via webhook`);
    
    // Send notification to user about their subscription activation
    try {
      await createSubscriptionNotification(userId, 'subscription_activated', {
        subscriptionId: subscriptionId,
        customerId: customerId
      });
    } catch (notificationError) {
      console.error('Error sending activation notification:', notificationError);
    }
  } catch (error) {
    console.error(`Error updating user ${userId} subscription:`, error);
    // We'll still continue with the webhook processing
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Handling subscription update:', {
    id: subscription.id,
    status: subscription.status,
    customerId: subscription.customer as string,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });
  
  const customerId = subscription.customer as string;
  
  // Find the user with this customer ID
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('subscription.stripeCustomerId', '==', customerId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.error('No user found with customer ID:', customerId);
    console.log('This might happen if the customer ID was not saved during checkout');
    return;
  }

  // Update user's subscription status
  const userId = snapshot.docs[0].id;
  const userRef = doc(db, 'users', userId);
  
  try {
    const currentDoc = await getDoc(userRef);
    
    // Determine active state and plan based on subscription status
    const isActive = subscription.status === 'active' || 
                    subscription.status === 'trialing';
    
    // Get current data
    const userData = currentDoc.exists() ? currentDoc.data() : {};
    const existingSubscription = userData.subscription || {};
    
    // Only downgrade from premium to free if subscription is inactive
    // Otherwise, maintain the existing plan (important for subscription pauses)
    const plan = isActive ? 'premium' : 'free';
    
    const subscriptionData = {
      ...existingSubscription,
      active: isActive,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: plan,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      webhookUpdated: true,
      updatedAt: new Date().toISOString(),
    };
    
    console.log(`Updating subscription for user ${userId}`);
    
    // Update only the subscription field to avoid permission issues
    await setDoc(userRef, {
      subscription: subscriptionData
    }, { merge: true });
    
    console.log('Subscription updated successfully via webhook');
    
    // Notify the user if there's a status change
    if (subscription.status !== existingSubscription.status) {
      try {
        if (!isActive && existingSubscription.active) {
          // Subscription was deactivated
          await createSubscriptionNotification(userId, 'subscription_expired', {
            subscriptionId: subscription.id,
            reason: subscription.status
          });
        } else if (isActive && !existingSubscription.active) {
          // Subscription was reactivated
          await createSubscriptionNotification(userId, 'subscription_activated', {
            subscriptionId: subscription.id
          });
        }
      } catch (notificationError) {
        console.error('Error creating subscription status notification:', notificationError);
      }
    }
  } catch (error) {
    console.error(`Error updating subscription for user ${userId}:`, error);
    // Log error but don't throw, to keep webhook processing
  }
}

// Handle subscription deletions
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Handling subscription deletion:', {
    id: subscription.id,
    status: subscription.status,
    customerId: subscription.customer as string
  });
  
  const customerId = subscription.customer as string;
  
  // Find the user with this customer ID
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('subscription.stripeCustomerId', '==', customerId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.error('No user found with customer ID:', customerId);
    return;
  }

  // Update user's subscription status
  const userId = snapshot.docs[0].id;
  const userRef = doc(db, 'users', userId);
  const currentDoc = await getDoc(userRef);
  const userData = currentDoc.exists() ? currentDoc.data() : {};
  
  const subscriptionData = {
    active: false,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    plan: 'free',
    status: 'canceled',
    canceledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log(`Updating subscription for user ${userId} to canceled status:`, subscriptionData);
  
  await setDoc(userRef, {
    ...userData,
    subscription: subscriptionData
  }, { merge: true });
  
  console.log('Subscription marked as canceled successfully');
  
  // Notify the user that their subscription has been canceled
  try {
    await createSubscriptionNotification(userId, 'subscription_expired', {
      subscriptionId: subscription.id,
      reason: 'canceled',
      canceledAt: new Date().toISOString()
    });
  } catch (notificationError) {
    console.error('Error creating subscription cancellation notification:', notificationError);
  }
}

// Handle invoice payment failures
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Handling invoice payment failure:', {
    id: invoice.id,
    customerId: invoice.customer as string,
    subscriptionId: invoice.subscription,
    attemptCount: invoice.attempt_count,
    nextPaymentAttempt: invoice.next_payment_attempt ? 
                         new Date(invoice.next_payment_attempt * 1000).toISOString() : null
  });
  
  if (!invoice.subscription) {
    console.log('Invoice not associated with a subscription, skipping');
    return;
  }
  
  const customerId = invoice.customer as string;
  
  // Find the user with this customer ID
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('subscription.stripeCustomerId', '==', customerId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.error('No user found with customer ID:', customerId);
    return;
  }

  // Update user's subscription status to reflect payment issues
  const userId = snapshot.docs[0].id;
  const userRef = doc(db, 'users', userId);
  const currentDoc = await getDoc(userRef);
  const userData = currentDoc.exists() ? currentDoc.data() : {};
  const currentSubscription = userData.subscription || {};
  
  // Keep subscription active but mark payment failure
  // After multiple failures, Stripe will eventually cancel the subscription
  // which will trigger the subscription.deleted event
  await setDoc(userRef, {
    ...userData,
    subscription: {
      ...currentSubscription,
      paymentFailed: true,
      lastPaymentFailureAt: new Date().toISOString(),
      paymentAttemptCount: invoice.attempt_count,
      nextPaymentAttempt: invoice.next_payment_attempt ? 
                           new Date(invoice.next_payment_attempt * 1000).toISOString() : null,
      updatedAt: new Date().toISOString(),
    }
  }, { merge: true });
  
  console.log('User subscription updated to reflect payment failure');
  
  // Notify the user about the payment failure
  try {
    await createSubscriptionNotification(userId, 'payment_failed', {
      subscriptionId: invoice.subscription,
      attemptCount: invoice.attempt_count,
      nextAttempt: invoice.next_payment_attempt ? 
                  new Date(invoice.next_payment_attempt * 1000).toISOString() : null
    });
  } catch (notificationError) {
    console.error('Error creating payment failure notification:', notificationError);
  }
}

// Handle successful invoice payments
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Handling successful invoice payment:', {
    id: invoice.id,
    customerId: invoice.customer as string,
    subscriptionId: invoice.subscription,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency
  });
  
  if (!invoice.subscription) {
    console.log('Invoice not associated with a subscription, skipping');
    return;
  }
  
  const customerId = invoice.customer as string;
  
  // Find the user with this customer ID
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('subscription.stripeCustomerId', '==', customerId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.error('No user found with customer ID:', customerId);
    return;
  }

  // Update user's subscription to mark payment as successful
  const userId = snapshot.docs[0].id;
  const userRef = doc(db, 'users', userId);
  const currentDoc = await getDoc(userRef);
  const userData = currentDoc.exists() ? currentDoc.data() : {};
  const currentSubscription = userData.subscription || {};
  
  // Ensure subscription is marked as active and clear any payment failure flags
  await setDoc(userRef, {
    ...userData,
    subscription: {
      ...currentSubscription,
      active: true,
      plan: 'premium',
      paymentFailed: false,
      lastPaymentSuccessAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }, { merge: true });
  
  console.log('User subscription updated to reflect successful payment');
  
  // If there was a payment failure flag, notify that payment is now successful
  if (currentSubscription.paymentFailed) {
    try {
      await createSubscriptionNotification(userId, 'subscription_activated', {
        subscriptionId: invoice.subscription,
        previouslyFailed: true,
        message: 'Seu pagamento foi processado com sucesso após a falha anterior.'
      });
    } catch (notificationError) {
      console.error('Error creating payment success notification:', notificationError);
    }
  }
}