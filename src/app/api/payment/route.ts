// Stripe Payment API Route - Edge Function
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

type SupportedPaymentMethod = 'card' | 'alipay' | 'wechat_pay';

function getPaymentMethodTypes(selectedMethod?: string): SupportedPaymentMethod[] {
  switch (selectedMethod) {
    case 'alipay':
      return ['alipay'];
    case 'wechat_pay':
      return ['wechat_pay'];
    case 'card':
    default:
      return ['card'];
  }
}

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_BASE_URL?.trim() || request.nextUrl.origin;
}

async function getStripeErrorMessage(response: Response) {
  try {
    const errorData = await response.json();
    return errorData?.error?.message || `Stripe API request failed (${response.status})`;
  } catch {
    return `Stripe API request failed (${response.status})`;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      orderId,
      orderNumber,
      customerEmail,
      customerId, // Stripe Customer ID
      successUrl,
      cancelUrl,
      saveCard, // Whether to save the card
      paymentMethod, // card | alipay | wechat_pay
      paymentMethodId, // Selected saved payment method
    } = body;

    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, orderId' },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. amount must be a positive number.' },
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

    const baseUrl = getBaseUrl(request);
    const allowedPaymentMethodTypes = getPaymentMethodTypes(paymentMethod);

    const sessionParams = new URLSearchParams();
    sessionParams.set('mode', 'payment');
    allowedPaymentMethodTypes.forEach((method, index) => {
      sessionParams.set(`payment_method_types[${index}]`, method);
    });
    sessionParams.set('line_items[0][price_data][currency]', 'hkd');
    sessionParams.set('line_items[0][price_data][product_data][name]', `Order ${orderNumber || orderId}`);
    sessionParams.set('line_items[0][price_data][unit_amount]', String(Math.round(parsedAmount * 100)));
    sessionParams.set('line_items[0][quantity]', '1');
    sessionParams.set('metadata[orderId]', orderId);
    sessionParams.set('metadata[orderNumber]', orderNumber || orderId);
    sessionParams.set('metadata[selectedPaymentMethod]', paymentMethod || 'card');
    if (paymentMethodId) {
      sessionParams.set('metadata[selectedPaymentMethodId]', paymentMethodId);
    }
    sessionParams.set(
      'success_url',
      successUrl || `${baseUrl}/payment/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`
    );
    sessionParams.set(
      'cancel_url',
      cancelUrl || `${baseUrl}/payment/cancel?orderId=${orderId}`
    );

    // If user has a Stripe Customer ID, attach to session
    if (customerId) {
      sessionParams.set('customer', customerId);
    } else if (customerEmail) {
      // If no customer ID but has email, create a customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: customerEmail,
          'metadata[orderId]': orderId,
        }).toString(),
      });

      if (customerResponse.ok) {
        const customer = await customerResponse.json();
        sessionParams.set('customer', customer.id);
      }
    }

    // Save card for future off-session use when explicitly requested
    if (saveCard && allowedPaymentMethodTypes.includes('card')) {
      sessionParams.set('payment_intent_data[setup_future_usage]', 'off_session');
    }

    // Add payment method options for WeChat Pay
    if (allowedPaymentMethodTypes.includes('wechat_pay')) {
      sessionParams.set('payment_method_options[wechat_pay][client]', 'web');
    }

    // Create Stripe Checkout Session via fetch
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sessionParams.toString(),
    });

    if (!stripeResponse.ok) {
      const message = await getStripeErrorMessage(stripeResponse);
      throw new Error(message);
    }

    const session = await stripeResponse.json();

    return NextResponse.json({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
      customerId: session.customer,
      orderId,
      amount: parsedAmount,
      currency: 'HKD'
    });

  } catch (error: unknown) {
    console.error('Stripe payment error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to create payment session') },
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
      const message = await getStripeErrorMessage(stripeResponse);
      throw new Error(message);
    }

    const session = await stripeResponse.json();

    return NextResponse.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      orderId: session.metadata?.orderId || null,
      customerEmail: session.customer_email,
      customerId: session.customer,
      amountTotal: session.amount_total ? session.amount_total / 100 : null,
      currency: session.currency?.toUpperCase(),
      savedPaymentMethod: session.setup_future_usage ? true : false,
    });

  } catch (error: unknown) {
    console.error('Error retrieving payment:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to retrieve payment') },
      { status: 500 }
    );
  }
}
