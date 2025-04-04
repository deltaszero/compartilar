import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Define interface for subscription data
interface SubscriptionData {
  active: boolean;
  plan: string;
  apiDirectUpdate?: boolean;     // Optional: used in direct updates
  apiSessionUpdate?: boolean;    // Optional: used in session-based updates
  stripeSessionId: string | null;
  verifiedOwner?: boolean;       // Optional: may not be present in all updates
  updatedAt: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  [key: string]: any; // Allow additional properties
}

// Helper function to create consistent subscription data objects
function createSubscriptionData(
  options: {
    isDirectUpdate?: boolean;
    isSessionUpdate?: boolean;
    isVerified?: boolean;
    sessionId?: string | null;
    customerId?: string;
    subscriptionId?: string;
    activationMethod?: string;
  }
): SubscriptionData {
  const {
    isDirectUpdate = false,
    isSessionUpdate = false,
    isVerified = false,
    sessionId = null,
    customerId,
    subscriptionId,
    activationMethod = 'api'
  } = options;
  
  const data: SubscriptionData = {
    active: true,
    plan: 'premium',
    stripeSessionId: sessionId,
    updatedAt: new Date().toISOString(),
    activationMethod
  };
  
  // Add conditional properties
  if (isDirectUpdate) data.apiDirectUpdate = true;
  if (isSessionUpdate) data.apiSessionUpdate = true;
  if (isVerified) data.verifiedOwner = true;
  if (customerId) data.stripeCustomerId = customerId;
  if (subscriptionId) data.stripeSubscriptionId = subscriptionId;
  
  // Add specific flags based on activation method
  if (activationMethod === 'auto') data.autoActivated = true;
  if (activationMethod === 'manual') data.manualActivation = true;
  
  return data;
}

export async function POST(request: Request) {
  try {
    console.log('Update subscription status API called');
    
    // Parse the request data
    const requestData = await request.json();
    const { sessionId, userId: providedUserId, requireVerification, method } = requestData;
    
    console.log('Request data:', { 
      sessionId: sessionId ? sessionId.substring(0, 10) + '...' : null,
      providedUserId: providedUserId ? providedUserId.substring(0, 10) + '...' : null,
      requireVerification,
      method: method || 'api'
    });
    
    // SECURITY CHECK: If verification is required or session ID is provided, verify ownership
    if (sessionId && (requireVerification || providedUserId)) {
      try {
        console.log('Verifying session ownership...');
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        // Verify the session belongs to the claimed user
        if (session.client_reference_id !== providedUserId) {
          console.error('Session ownership verification failed:');
          console.error(`Session belongs to ${session.client_reference_id}, but requested by ${providedUserId}`);
          
          return NextResponse.json({
            error: 'Unauthorized: This session does not belong to the provided user ID',
            reason: 'session_user_mismatch'
          }, { status: 403 });
        }
        
        console.log('Session ownership verified successfully');
      } catch (verifyError) {
        console.error('Error verifying session:', verifyError);
        
        return NextResponse.json({
          error: 'Failed to verify session ownership',
          details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // APPROACH 1: If we have a userId from the client, update directly
    // This is the most reliable approach and works with the manual button
    if (providedUserId) {
      console.log('Direct update with provided user ID:', providedUserId);
      
      try {
        // Create subscription data with our helper
        let customerId: string | undefined;
        let subscriptionId: string | undefined;
        
        // Try to get Stripe data if we have a session ID
        if (sessionId) {
          try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (session && session.customer && session.subscription) {
              customerId = session.customer as string;
              subscriptionId = session.subscription as string;
            }
          } catch (stripeError) {
            // If Stripe lookup fails, continue with the basic data we have
            console.warn('Failed to get additional Stripe data:', stripeError);
          }
        }
        
        // Create subscription data object
        const subscriptionData = createSubscriptionData({
          isDirectUpdate: true,
          isVerified: true,
          sessionId,
          customerId,
          subscriptionId,
          activationMethod: method || 'api'
        });
        
        // Update only the subscription field
        const userRef = doc(db, 'users', providedUserId);
        await setDoc(userRef, {
          subscription: subscriptionData
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
        
        // Return the error but don't crash the whole request
        return NextResponse.json({ 
          error: 'Direct update failed',
          details: directError instanceof Error ? directError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // APPROACH 2: If we only have a session ID, try to get user info from Stripe
    if (sessionId) {
      try {
        // Get session data from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session && session.client_reference_id) {
          const userId = session.client_reference_id;
          
          console.log('Retrieved user ID from Stripe session:', userId);
          
          // Same approach as above - update subscription data
          const userRef = doc(db, 'users', userId);
          
          // Create subscription data with our helper
          const subscriptionData = createSubscriptionData({
            isSessionUpdate: true,
            sessionId,
            customerId: session.customer as string,
            subscriptionId: session.subscription as string
          });
          
          await setDoc(userRef, {
            subscription: subscriptionData
          }, { merge: true });
          
          console.log('Session-based subscription update successful');
          
          return NextResponse.json({
            success: true,
            fromSession: true,
            subscriptionStatus: 'active',
            plan: 'premium'
          });
        } else {
          return NextResponse.json(
            { error: 'Invalid session or missing client_reference_id' },
            { status: 400 }
          );
        }
      } catch (sessionError) {
        console.error('Session handling error:', sessionError);
        
        return NextResponse.json({ 
          error: 'Session processing failed',
          details: sessionError instanceof Error ? sessionError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // If we have neither user ID nor session ID
    return NextResponse.json(
      { error: 'Missing required parameters (userId or sessionId)' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error processing subscription update request:', error);
    
    return NextResponse.json(
      { 
        error: 'Error updating subscription status',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Use the manual activation button on the success page'
      },
      { status: 500 }
    );
  }
}