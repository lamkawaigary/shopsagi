// BBMSL Payment API Route
// This handles payment creation and webhook callbacks

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// BBMSL API Configuration
// Replace with environment variables in production
const BBMSL_MERCHANT_ID = process.env.BBMSL_MERCHANT_ID;
const BBMSL_API_KEY = process.env.BBMSL_API_KEY;
const BBMSL_API_URL = process.env.BBMSL_API_URL || 'https://openapi.bbmsl.com';

// Payment methods supported
const PAYMENT_METHODS = [
  'VISA', 'MASTER', 'JCB', 'AMEX',
  'ALIPAYHK', 'WECHATPAYHK', 'OCTOPUS', 'PAYME'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      currency = 'HKD', 
      orderId, 
      orderNumber,
      customerEmail,
      customerPhone,
      paymentMethod 
    } = body;

    // Validate required fields
    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, orderId' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Prepare payment request to BBMSL
    const paymentData = {
      merchantId: BBMSL_MERCHANT_ID,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      orderId: orderId,
      orderNumber: orderNumber || `ORD-${Date.now()}`,
      paymentMethod: paymentMethod || 'ALL', // Allow all methods if not specified
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?orderId=${orderId}`,
      customerInfo: {
        email: customerEmail,
        phone: customerPhone
      }
    };

    // In production, make actual API call to BBMSL
    // For now, return mock payment URL for testing
    const mockPaymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment/checkout?orderId=${orderId}&amount=${amount}`;

    // Update order payment status in Firestore
    if (db && orderId) {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'ALL',
        paymentCreatedAt: serverTimestamp()
      });
    }

    return NextResponse.json({
      success: true,
      paymentUrl: mockPaymentUrl,
      orderId,
      amount,
      currency
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Handle payment webhook from BBMSL
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      paymentStatus, 
      transactionId,
      amount,
      paymentMethod 
    } = body;

    // Verify the payment with BBMSL in production
    // const isValid = await verifyPayment(transactionId);

    // Update order in Firestore
    if (db && orderId) {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: paymentStatus === 'SUCCESS' ? 'paid' : 'failed',
        transactionId,
        paidAt: paymentStatus === 'SUCCESS' ? serverTimestamp() : null,
        paymentMethod,
        paymentAmount: amount
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
