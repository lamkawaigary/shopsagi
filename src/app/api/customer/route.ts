// Get or create Stripe Customer for a user
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    // Search for existing customer with this email
    const searchResponse = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.data.length > 0) {
        // Customer exists
        return NextResponse.json({
          success: true,
          customerId: searchData.data[0].id,
          isNew: false,
        });
      }
    }

    // Create new customer
    const createResponse = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'email': email,
        'name': name || '',
        'metadata[userId]': userId,
      }).toString(),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.error?.message || 'Failed to create customer');
    }

    const customer = await createResponse.json();

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      isNew: true,
    });

  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
