// BBMSL Payment API Route - Proper Implementation
// Reference: https://docs.bbmsl.com/docs/api

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// BBMSL API Configuration
const BBMSL_MERCHANT_ID = process.env.BBMSL_MERCHANT_ID;
const BBMSL_API_KEY = process.env.BBMSL_API_KEY;
const BBMSL_API_URL = process.env.BBMSL_API_URL || 'https://openapi.bbmsl.com';
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Payment methods supported
const PAYMENT_METHODS = [
  'VISA', 'MASTER', 'JCB', 'AMEX',
  'ALIPAYHK', 'WECHATPAYHK', 'OCTOPUS', 'PAYME'
];

/**
 * Generate BBMSL Signature
 * Algorithm: SHA256withRSA, Base64 encoded
 */
async function generateSignature(payload: string, privateKey: string): Promise<string> {
  // For Node.js, we need to use crypto module
  const crypto = await import('crypto');
  
  // Remove header/footer and newlines from private key
  const cleanKey = privateKey
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  // Create private key
  const privateKeyObj = crypto.createPrivateKey({
    key: Buffer.from(cleanKey, 'base64'),
    type: 'pkcs8',
    format: 'der'
  });
  
  // Sign with SHA256withRSA
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(payload, 'utf8');
  const signature = sign.sign(privateKeyObj);
  
  return Buffer.from(signature).toString('base64');
}

/**
 * Call BBMSL API
 */
async function callBBMSLApi(endpoint: string, payload: string, privateKey: string): Promise<any> {
  const signature = await generateSignature(payload, privateKey);
  
  // The request must be a JSON string with escaped backslashes
  const requestData = JSON.stringify({
    request: payload,
    signature: signature
  });
  
  const response = await fetch(`${BBMSL_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': BBMSL_API_KEY || ''
    },
    body: requestData
  });
  
  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
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

    // Prepare BBMSL payment request
    const merchantReference = orderNumber || `ORD-${Date.now()}`;
    
    const paymentRequest = {
      merchantId: BBMSL_MERCHANT_ID,
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'HKD',
      merchantReference: merchantReference,
      isRecurring: false,
      callbackUrl: {
        success: `${NEXT_PUBLIC_BASE_URL}/payment/success`,
        fail: `${NEXT_PUBLIC_BASE_URL}/payment/fail`,
        cancel: `${NEXT_PUBLIC_BASE_URL}/payment/cancel`,
        notify: `${NEXT_PUBLIC_BASE_URL}/api/payment/webhook`
      },
      paymentMethod: paymentMethod || 'ALL',
      lineItems: [
        {
          quantity: 1,
          priceData: {
            unitAmount: Math.round(amount * 100),
            name: `Order ${merchantReference}`
          }
        }
      ]
    };

    // Convert to JSON string (this is what gets signed)
    const paymentRequestJson = JSON.stringify(paymentRequest);

    // In production, we would call BBMSL API here
    // For now, return mock response
    // const result = await callBBMSLApi('/payment/hosted/start', paymentRequestJson, privateKey);
    
    // Update order payment status in Firestore
    if (db && orderId) {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'ALL',
        paymentCreatedAt: serverTimestamp(),
        merchantReference: merchantReference
      });
    }

    // For demo: return mock payment URL
    // In production: result.paymentUrl
    const mockPaymentUrl = `${NEXT_PUBLIC_BASE_URL}/payment/checkout?orderId=${orderId}&amount=${amount}`;

    return NextResponse.json({
      success: true,
      // In production: paymentUrl: result.paymentUrl
      paymentUrl: mockPaymentUrl,
      orderId,
      merchantReference,
      amount,
      currency: 'HKD'
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Handle payment webhook/notification from BBMSL
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // BBMSL sends notification with signature
    // Need to verify signature using BBMSL public key
    const { 
      orderId, 
      paymentStatus, 
      transactionId,
      amount,
      paymentMethod,
      signature 
    } = body;

    // TODO: Verify BBMSL signature here
    // const isValid = await verifyBBMSLSignature(body);

    // Update order in Firestore
    if (db && orderId) {
      const paymentSuccess = paymentStatus === 'SUCCESS' || paymentStatus === '0';
      
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: paymentSuccess ? 'paid' : 'failed',
        transactionId: transactionId || null,
        paidAt: paymentSuccess ? serverTimestamp() : null,
        paymentMethod: paymentMethod || null,
        paymentAmount: amount ? amount / 100 : null
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
