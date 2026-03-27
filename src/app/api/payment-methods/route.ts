// Get saved payment methods for a customer
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json(
      { error: 'Missing customerId' },
      { status: 400 }
    );
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    // Get customer's payment methods
    const pmResponse = await fetch(
      `https://api.stripe.com/v1/payment_methods?customer=${customerId}&type=card`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    if (!pmResponse.ok) {
      const errorData = await pmResponse.json();
      throw new Error(errorData.error?.message || 'Failed to get payment methods');
    }

    const pmData = await pmResponse.json();

    // Get customer info
    const customerResponse = await fetch(
      `https://api.stripe.com/v1/customers/${customerId}`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    const customerData = customerResponse.ok ? await customerResponse.json() : null;

    // Format payment methods
    const paymentMethods = pmData.data.map((pm: any) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: customerData?.invoice_settings?.default_payment_method === pm.id,
    }));

    return NextResponse.json({
      customerId,
      paymentMethods,
      hasSavedCards: paymentMethods.length > 0,
    });

  } catch (error: any) {
    console.error('Error getting payment methods:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
