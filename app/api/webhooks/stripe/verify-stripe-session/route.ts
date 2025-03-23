import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * API endpoint to verify if a Stripe session belongs to a specific user
 * This is a critical security check to prevent session hijacking
 */
export async function POST(request: Request) {
  try {
    // Parse the request data
    const { sessionId, userId } = await request.json();
    
    // Validate required parameters
    if (!sessionId) {
      return NextResponse.json({ 
        isValid: false, 
        reason: 'missing_session_id' 
      }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ 
        isValid: false, 
        reason: 'missing_user_id' 
      }, { status: 400 });
    }
    
    // Retrieve the session from Stripe
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Verify the client_reference_id matches the provided userId
      const isValid = session.client_reference_id === userId;
      
      if (!isValid) {
        console.error(`Session ownership verification failed for session ${sessionId}`);
        console.error(`Session belongs to ${session.client_reference_id}, but requested by ${userId}`);
        
        return NextResponse.json({
          isValid: false,
          reason: 'session_user_mismatch',
          message: 'This session does not belong to the specified user'
        });
      }
      
      // Session is valid and belongs to the user
      return NextResponse.json({
        isValid: true,
        sessionData: {
          customerId: session.customer,
          subscriptionId: session.subscription,
          status: session.status,
        }
      });
      
    } catch (stripeError) {
      console.error('Error retrieving Stripe session:', stripeError);
      
      // Check if it's a "no such session" error
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
      
      if (errorMessage.includes('No such checkout.session')) {
        return NextResponse.json({
          isValid: false,
          reason: 'invalid_session_id',
          message: 'The provided session ID does not exist'
        }, { status: 404 });
      }
      
      // Other Stripe error
      return NextResponse.json({
        isValid: false,
        reason: 'stripe_error',
        message: errorMessage
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing session verification request:', error);
    
    return NextResponse.json({
      isValid: false,
      reason: 'server_error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}