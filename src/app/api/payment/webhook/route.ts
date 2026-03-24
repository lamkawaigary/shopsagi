// Stripe Webhook Handler
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

/**
 * POST /api/payment/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log('Stripe webhook event:', event.type);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('Checkout completed:', session.id);
      console.log('Payment status:', session.payment_status);
      
      if (session.payment_status === 'paid') {
        const orderId = session.metadata?.orderId;
        
        if (orderId && db) {
          try {
            await updateDoc(doc(db, 'orders', orderId), {
              paymentStatus: 'paid',
              stripeSessionId: session.id,
              paidAt: serverTimestamp(),
              paymentAmount: session.amount_total ? session.amount_total / 100 : null,
              customerEmail: session.customer_email,
            });
            console.log('Order updated to paid:', orderId);
          } catch (err) {
            console.error('Error updating order:', err);
          }
        }
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', paymentIntent.id);
      
      const orderId = paymentIntent.metadata?.orderId;
      if (orderId && db) {
        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus: 'failed',
          paymentError: paymentIntent.last_payment_error?.message,
        });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
