import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // This should work fine with your Stripe version
});

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const { priceId, email, userId } = await request.json();

    // Validate the required fields
    if (!priceId || !email || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use the provided price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${headersList.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${headersList.get('origin')}/subscription/canceled`,
      customer_email: email,
      client_reference_id: userId,
      locale: 'pt-BR', // Set Brazilian Portuguese as the checkout language
      metadata: {
        userId: userId,
      },
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}