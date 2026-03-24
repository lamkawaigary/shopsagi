// Stripe connection test
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover'
    });
    
    // Try to retrieve account info
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({ 
      success: true,
      accountId: account.id,
      email: account.email,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    }, { status: 500 });
  }
}
