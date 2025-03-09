import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    console.log('Update subscription status API called');
    
    // Clone the request to read it multiple times if needed
    const clonedRequest = request.clone();
    
    // Parse the request data
    const requestData = await clonedRequest.json();
    const { sessionId, forceUpdate, userId: providedUserId } = requestData;
    
    console.log('Request data:', { 
      sessionId: sessionId ? sessionId.substring(0, 10) + '...' : null,
      forceUpdate: !!forceUpdate,
      providedUserId: providedUserId ? providedUserId.substring(0, 10) + '...' : null
    });
    
    // SIMPLIFIED APPROACH: If we have a userId from the form, just update directly
    // This is the same approach that works in the manual button
    if (providedUserId) {
      console.log('Direct update with provided user ID:', providedUserId);
      
      try {
        // Create a subscription object with the minimum needed fields
        const directSubscription = {
          active: true,
          plan: 'premium',
          directUpdate: true,
          updatedAt: new Date().toISOString(),
        };
        
        // Update only the subscription field - this is what works in the button
        const userRef = doc(db, 'users', providedUserId);
        await setDoc(userRef, {
          subscription: directSubscription
        }, { merge: true });
        
        console.log('Direct subscription update successful');
        
        return NextResponse.json({
          success: true,
          direct: true,
          subscriptionStatus: 'active',
          plan: 'premium'
        });
      } catch (directError) {
        console.error('Direct update error:', directError);
        throw directError;
      }
    }
    
    // If we don't have a user ID but have a session ID
    if (sessionId) {
      try {
        // Get just enough information from Stripe to get the user ID
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session && session.client_reference_id) {
          const userId = session.client_reference_id;
          
          console.log('Retrieved user ID from Stripe session:', userId);
          
          // Same approach as the working button - only update subscription field
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, {
            subscription: {
              active: true,
              plan: 'premium',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              updatedAt: new Date().toISOString(),
            }
          }, { merge: true });
          
          console.log('Session-based subscription update successful');
          
          return NextResponse.json({
            success: true,
            fromSession: true,
            subscriptionStatus: 'active',
            plan: 'premium'
          });
        } else {
          throw new Error('Invalid session or missing client_reference_id');
        }
      } catch (sessionError) {
        console.error('Session handling error:', sessionError);
        throw sessionError;
      }
    }
    
    // If we have neither user ID nor session ID
    return NextResponse.json(
      { error: 'Missing required parameters (userId or sessionId)' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error handling subscription update:');
    console.error(error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to get the user ID from the request one more time as a last resort
    try {
      const lastRequest = request.clone();
      const data = await lastRequest.json();
      
      if (data.userId) {
        const userId = data.userId;
        console.log('Last resort update with user ID:', userId);
        
        // Just try to set premium status directly
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          subscription: {
            active: true,
            plan: 'premium',
            emergencyUpdate: true,
            updatedAt: new Date().toISOString(),
          }
        }, { merge: true });
        
        console.log('Emergency update successful');
        
        return NextResponse.json({
          success: true,
          emergency: true,
          subscriptionStatus: 'active',
          plan: 'premium'
        });
      }
    } catch (lastResortError) {
      console.error('Last resort update failed:', lastResortError);
    }
    
    return NextResponse.json(
      { 
        error: 'Error updating subscription status',
        details: errorMessage,
        suggestion: 'Use the manual update button'
      },
      { status: 500 }
    );
  }
}