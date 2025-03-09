import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

  // Get current user data
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    console.error('User not found:', userId);
    return;
  }

  // Update user document with subscription information
  await setDoc(userRef, {
    ...userDoc.data(),
    subscription: {
      active: true,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      plan: 'premium',
      updatedAt: new Date().toISOString(),
    }
  }, { merge: true });
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
    return;
  }

  // Update user's subscription status
  const userId = snapshot.docs[0].id;
  const userRef = doc(db, 'users', userId);
  const currentDoc = await getDoc(userRef);
  
  // Determine active state and plan based on subscription status
  const isActive = subscription.status === 'active' || 
                  subscription.status === 'trialing';
  
  // Get current data
  const userData = currentDoc.exists() ? currentDoc.data() : {};
  const currentPlan = userData.subscription?.plan || 'free';
  
  // Only downgrade from premium to free if subscription is inactive
  // Otherwise, maintain the existing plan (important for subscription pauses)
  const plan = isActive ? 'premium' : 'free';
  
  const subscriptionData = {
    active: isActive,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    plan: plan,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log(`Updating subscription for user ${userId}:`, subscriptionData);
  
  await setDoc(userRef, {
    ...userData,
    subscription: subscriptionData
  }, { merge: true });
  
  console.log('Subscription updated successfully');
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
}