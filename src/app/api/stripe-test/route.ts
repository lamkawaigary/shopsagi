// Simple Stripe test - direct API call
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({ 
      success: true,
      accountId: account.id,
      email: account.email,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      type: error.type,
      code: error.code
    }, { status: 500 });
  }
}
