// Stripe Payment API Route - Edge Function
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      orderId, 
      orderNumber,
      customerEmail,
      customerId, // Stripe Customer ID
      items,
      successUrl,
      cancelUrl,
      saveCard, // Whether to save the card
      paymentMethodId, // Selected saved payment method
    } = body;

    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, orderId' },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://shopsagi.vercel.app';

    // Build session parameters
    const sessionParams: Record<string, string> = {
      'mode': 'payment',
      'payment_method_types[0]': 'card',
      'payment_method_types[1]': 'alipay',
      'payment_method_types[2]': 'wechat_pay',
      'line_items[0][price_data][currency]': 'hkd',
      'line_items[0][price_data][product_data][name]': `Order ${orderNumber || orderId}`,
      'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
      'line_items[0][quantity]': '1',
      'metadata[orderId]': orderId,
      'metadata[orderNumber]': orderNumber || orderId,
      'success_url': successUrl || `${NEXT_PUBLIC_BASE_URL}/payment/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': cancelUrl || `${NEXT_PUBLIC_BASE_URL}/payment/checkout?orderId=${orderId}`,
    };

    // If user has a Stripe Customer ID, attach to session
    if (customerId) {
      sessionParams['customer'] = customerId;
    } else if (customerEmail) {
      // If no customer ID but has email, create a customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'email': customerEmail,
          'metadata[orderId]': orderId,
        }).toString(),
      });
      
      if (customerResponse.ok) {
        const customer = await customerResponse.json();
        sessionParams['customer'] = customer.id;
      }
    }

    // If using a saved payment method (only for card)
    if (paymentMethodId) {
      sessionParams['payment_method'] = paymentMethodId;
      sessionParams['payment_method_types[0]'] = 'card'; // Force card only when using saved method
    }

    // Create Stripe Checkout Session via fetch
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(sessionParams).toString(),
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      throw new Error(errorData.error?.message || 'Failed to create Stripe session');
    }

    const session = await stripeResponse.json();

    return NextResponse.json({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
      customerId: session.customer,
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId' },
      { status: 400 }
    );
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      throw new Error(errorData.error?.message || 'Failed to retrieve session');
    }

    const session = await stripeResponse.json();

    return NextResponse.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      customerId: session.customer,
      amountTotal: session.amount_total ? session.amount_total / 100 : null,
      currency: session.currency?.toUpperCase(),
      savedPaymentMethod: session.setup_future_usage ? true : false,
    });

  } catch (error: any) {
    console.error('Error retrieving payment:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
