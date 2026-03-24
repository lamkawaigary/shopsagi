// Stripe Payment API Route
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://shopsagi.vercel.app';

/**
 * POST /api/payment
 * Create Stripe Checkout Session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      orderId, 
      orderNumber,
      customerEmail,
      customerPhone,
      items,
      successUrl,
      cancelUrl
    } = body;

    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, orderId' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail || undefined,
      payment_method_types: ['card'],
      line_items: items || [
        {
          price_data: {
            currency: 'hkd',
            product_data: {
              name: `Order ${orderNumber || orderId}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        }
      ],
      metadata: {
        orderId,
        orderNumber: orderNumber || orderId,
      },
      success_url: successUrl || `${NEXT_PUBLIC_BASE_URL}/payment/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${NEXT_PUBLIC_BASE_URL}/payment/checkout?orderId=${orderId}`,
      phone_number_collection: {
        enabled: true,
      },
    });

    // Update order payment status in Firestore
    if (db && orderId) {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'pending',
        stripeSessionId: session.id,
        paymentCreatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
      orderId,
      amount,
      currency: 'HKD'
    });

  } catch (error: any) {
    console.error('Stripe payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payment
 * Retrieve payment status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const orderId = searchParams.get('orderId');

  if (!sessionId && !orderId) {
    return NextResponse.json(
      { error: 'Missing sessionId or orderId' },
      { status: 400 }
    );
  }

  try {
    if (sessionId) {
      // Retrieve from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      return NextResponse.json({
        sessionId: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total ? session.amount_total / 100 : null,
        currency: session.currency?.toUpperCase(),
      });
    }

    return NextResponse.json({
      orderId,
      paymentStatus: 'pending'
    });

  } catch (error: any) {
    console.error('Error retrieving payment:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
