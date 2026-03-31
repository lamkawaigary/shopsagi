// Stripe Webhook Handler - Edge Function
import { NextResponse } from 'next/server';

export const runtime = 'edge';

type StripeSessionLike = {
  id: string;
  payment_status?: string;
  metadata?: { orderId?: string };
  amount_total?: number;
  customer_email?: string;
};

async function hmacSha256Hex(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function parseStripeSignature(signatureHeader: string) {
  const parts = signatureHeader.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))
    .filter(Boolean);

  return { timestamp, signatures };
}

async function isValidStripeWebhookSignature(
  body: string,
  signatureHeader: string,
  webhookSecret: string
) {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const payload = `${timestamp}.${body}`;
  const expectedSignature = await hmacSha256Hex(webhookSecret, payload);

  return signatures.some((signature) => timingSafeEqualHex(signature, expectedSignature));
}

async function updateOrderStatusViaFunction(
  orderId: string,
  patch: Record<string, unknown>
) {
  const firebaseUrl = process.env.FIREBASE_FUNCTIONS_URL || process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL;
  if (!firebaseUrl) {
    console.warn('Missing FIREBASE_FUNCTIONS_URL, skipping order status sync.');
    return;
  }

  const response = await fetch(`${firebaseUrl}/updateOrderStatus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      ...patch,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`updateOrderStatus failed (${response.status}): ${message}`);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signatureHeader = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signatureHeader) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not configured' },
      { status: 500 }
    );
  }

  try {
    const isValid = await isValidStripeWebhookSignature(body, signatureHeader, webhookSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    console.log('Webhook event type:', event.type);
    console.log('Webhook event id:', event.id);

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object as StripeSessionLike;
      const orderId = session?.metadata?.orderId;

      if (orderId && session?.payment_status === 'paid') {
        await updateOrderStatusViaFunction(orderId, {
          paymentStatus: 'paid',
          stripeSessionId: session.id,
          paidAt: new Date().toISOString(),
          paymentAmount: session.amount_total ? session.amount_total / 100 : null,
          customerEmail: session.customer_email || null,
          paidVia: 'stripe_webhook',
        });
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data?.object as StripeSessionLike;
      const orderId = session?.metadata?.orderId;
      if (orderId) {
        await updateOrderStatusViaFunction(orderId, {
          paymentStatus: 'expired',
          stripeSessionId: session.id,
        });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data?.object as {
        id: string;
        metadata?: { orderId?: string };
        last_payment_error?: { message?: string };
      };
      const orderId = paymentIntent?.metadata?.orderId;
      if (orderId) {
        await updateOrderStatusViaFunction(orderId, {
          paymentStatus: 'failed',
          paymentError: paymentIntent.last_payment_error?.message || 'Payment failed',
          stripePaymentIntentId: paymentIntent.id,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('Webhook error:', err);
    const message = err instanceof Error ? err.message : 'Webhook processing failed';
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

// Also add GET for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Webhook endpoint is working'
  });
}
