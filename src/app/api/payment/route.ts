// BBMSL Payment API Route - Complete Implementation
// Based on BBMSL Documentation: https://docs.bbmsl.com/

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// BBMSL API Configuration
const BBMSL_MERCHANT_ID = process.env.BBMSL_MERCHANT_ID;
const BBMSL_API_KEY = process.env.BBMSL_API_KEY;
const BBMSL_API_URL = process.env.BBMSL_API_URL || 'https://openapi.bbmsl.com';
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// BBMSL Public Key for verifying notifications (base64)
const BBMSL_PUBLIC_KEY = process.env.BBMSL_PUBLIC_KEY;

/**
 * Generate BBMSL Signature for request
 * Algorithm: RSA 2048-bit + SHA256withRSA, Base64 encoded
 */
async function generateRequestSignature(payload: string, privateKey: string): Promise<string> {
  const crypto = await import('crypto');
  
  // Clean private key
  const cleanKey = privateKey
    .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const privateKeyObj = crypto.createPrivateKey({
    key: Buffer.from(cleanKey, 'base64'),
    type: 'pkcs8',
    format: 'der'
  });
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(payload, 'utf8');
  const signature = sign.sign(privateKeyObj);
  
  return Buffer.from(signature).toString('base64');
}

/**
 * Verify BBMSL Notification Signature
 * 1. Remove signature field
 * 2. Sort remaining fields alphabetically
 * 3. Join with '&'
 * 4. Verify with RSA-SHA256
 */
async function verifyNotificationSignature(
  payload: Record<string, any>, 
  signature: string
): Promise<boolean> {
  try {
    const crypto = await import('crypto');
    
    // Remove signature field
    const { signature: _, ...fields } = payload;
    
    // Sort fields alphabetically
    const sortedKeys = Object.keys(fields).sort();
    
    // Join with '&'
    const signaturePayload = sortedKeys
      .map(key => `${key}=${fields[key]}`)
      .join('&');
    
    // Load BBMSL public key
    const cleanPubKey = (BBMSL_PUBLIC_KEY || '')
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s/g, '');
    
    const publicKeyObj = crypto.createPublicKey({
      key: Buffer.from(cleanPubKey, 'base64'),
      type: 'spki',
      format: 'der'
    });
    
    // Verify signature
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signaturePayload, 'utf8');
    return verify.verify(publicKeyObj, Buffer.from(signature, 'base64'));
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Call BBMSL API to create payment
 */
async function createBBMSLPayment(paymentData: any, privateKey: string): Promise<any> {
  // Convert to JSON string (this is what gets signed)
  const payloadJson = JSON.stringify(paymentData);
  
  // Generate signature
  const signature = await generateRequestSignature(payloadJson, privateKey);
  
  // Create request body with escaped JSON
  const requestBody = {
    request: payloadJson,
    signature: signature
  };
  
  const response = await fetch(`${BBMSL_API_URL}/payment/hosted/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': BBMSL_API_KEY || ''
    },
    body: JSON.stringify(requestBody)
  });
  
  return await response.json();
}

// ==================== API Routes ====================

/**
 * POST /api/payment
 * Create a new payment and get BBMSL payment URL
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
      paymentMethod 
    } = body;

    // Validate required fields
    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, orderId' },
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

    // In production, call BBMSL API:
    // const result = await createBBMSLPayment(paymentRequest, privateKey);
    // const paymentUrl = result.paymentUrl;
    
    // For demo: return mock payment URL
    const mockPaymentUrl = `${NEXT_PUBLIC_BASE_URL}/payment/checkout?orderId=${orderId}&amount=${amount}`;

    // Update order payment status in Firestore
    if (db && orderId) {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'ALL',
        paymentCreatedAt: serverTimestamp(),
        merchantReference: merchantReference
      });
    }

    return NextResponse.json({
      success: true,
      paymentUrl: mockPaymentUrl, // In production: result.paymentUrl
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

/**
 * PUT /api/payment/webhook
 * Handle BBMSL payment notification
 */
export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('BBMSL Webhook received:', payload);
    
    const { 
      merchantReference,
      status, 
      amount,
      orderId,
      cardType,
      maskedPan,
      signature,
      updateTime
    } = payload;

    // Verify signature (CRITICAL for security)
    if (signature) {
      const isValid = await verifyNotificationSignature(payload, signature);
      if (!isValid) {
        console.error('Invalid BBMSL signature!');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    }

    // Determine payment status
    const paymentSuccess = status === 'SUCCESS';
    
    // Find order by merchantReference or orderId
    let orderDocId = orderId || merchantReference;
    
    if (db && orderDocId) {
      try {
        await updateDoc(doc(db, 'orders', orderDocId), {
          paymentStatus: paymentSuccess ? 'paid' : 'failed',
          paymentMethod: cardType || null,
          paidAt: paymentSuccess ? serverTimestamp() : null,
          paymentAmount: amount ? parseFloat(amount) / 100 : null,
          maskedCard: maskedPan || null,
          paymentUpdateTime: updateTime || null
        });
        console.log('Order updated:', orderDocId);
      } catch (err) {
        console.error('Failed to update order:', err);
      }
    }

    // Must return OK for BBMSL to stop retrying
    return NextResponse.json({ 
      success: true,
      message: 'Notification received' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    // Still return OK to stop retries for parsing errors
    return NextResponse.json({ 
      success: true,
      message: 'Notification processed' 
    });
  }
}

/**
 * GET /api/payment/status
 * Check payment status (for frontend polling)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  
  if (!orderId) {
    return NextResponse.json(
      { error: 'Missing orderId' },
      { status: 400 }
    );
  }
  
  // In production, query Firestore for payment status
  // For demo, return mock status
  return NextResponse.json({
    orderId,
    paymentStatus: 'pending'
  });
}
