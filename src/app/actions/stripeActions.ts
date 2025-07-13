
"use server";

import { Stripe } from 'stripe';
import { headers } from 'next/headers';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

interface CreateCheckoutSessionInput {
  priceId: string;
  userId: string;
}

interface CreateCheckoutSessionOutput {
  checkoutUrl?: string;
  error?: string;
}

export async function createCheckoutSession(
  data: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionOutput> {
  const { priceId, userId } = data;
  const host = headers().get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const appUrl = `${protocol}://${host}`;

  if (!priceId || !userId) {
    return { error: 'Missing priceId or userId' };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/upgrade/success`,
      cancel_url: `${appUrl}/upgrade/canceled`,
      client_reference_id: userId,
    });

    if (!session.url) {
        throw new Error('No checkout URL returned from Stripe.');
    }

    return { checkoutUrl: session.url };

  } catch (error: any) {
    console.error("Error creating Stripe checkout session:", error);
    return { error: error.message };
  }
}
