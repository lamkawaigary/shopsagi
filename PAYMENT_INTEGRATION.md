# BBMSL Payment Integration Guide

## Environment Variables

Copy this file to `.env.local` and fill in your values:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# BBMSL Payment Configuration
BBMSL_MERCHANT_ID=1000053
BBMSL_API_KEY=your_api_key
BBMSL_API_SECRET=your_api_secret
BBMSL_API_URL=https://openapi.bbmsl.com
BBMSL_PRIVATE_KEY=your_rsa_private_key

# Base URL (use localhost for dev, your domain for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## BBMSL API Flow

### 1. Generate RSA Key Pair

```bash
# Generate private key
openssl genrsa -out rsa_private_key.pem 2048

# Export public key
openssl rsa -in rsa_private_key.pem -pubout -out rsa_public_key.pem

# Remove header/footer for use in code
# Upload public key to BBMSL Business Portal
```

### 2. Sign Request

Algorithm: **SHA256withRSA** (RSA-SHA256)
Encoding: **Base64**

```javascript
// Example signing process
const crypto = require('crypto');

function sign(payload, privateKey) {
  const cleanKey = privateKey.replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
    .replace(/-----END RSA PRIVATE KEY-----/g, '')
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
```

### 3. API Request Format

```json
{
  "request": "{\"merchantId\":\"1000053\",\"amount\":1000,\"currency\":\"HKD\",\"merchantReference\":\"ORD-123\",\"callbackUrl\":{\"success\":\"https://yoursite.com/success\",\"fail\":\"https://yoursite.com/fail\",\"cancel\":\"https://yoursite.com/cancel\",\"notify\":\"https://yoursite.com/api/payment/webhook\"},\"paymentMethod\":\"ALL\"}",
  "signature": "base64_encoded_signature_here..."
}
```

**Important:** The `request` value must be a JSON string with escaped backslashes!

## Payment Methods Supported

| Method | Code | Icon |
|--------|------|------|
| Visa | VISA | 💳 |
| Mastercard | MASTER | 💳 |
| JCB | JCB | 💳 |
| American Express | AMEX | 💳 |
| AlipayHK | ALIPAYHK | 🟢 |
| WeChat Pay HK | WECHATPAYHK | 🟣 |
| PayMe | PAYME | 🟦 |
| Octopus | OCTOPUS | 🐙 |

## API Endpoints

### Create Payment
```
POST /api/payment
{
  amount: number,
  orderId: string,
  orderNumber?: string,
  customerEmail?: string,
  customerPhone?: string,
  paymentMethod?: string
}
```

### Webhook (Callback)
```
PUT /api/payment
{
  orderId: string,
  paymentStatus: 'SUCCESS' | 'FAILED',
  transactionId: string,
  amount: number,
  paymentMethod: string,
  signature: string
}
```

## Flow

1. Customer selects products → Cart
2. Customer clicks checkout → /customer/checkout
3. Submit order → Creates order in Firestore
4. Redirect to /payment/checkout?orderId=xxx
5. Select payment method → Submit
6. API creates payment → Returns payment URL
7. Redirect to BBMSL hosted payment page
8. Customer completes payment
9. BBMSL webhook → Update order status
10. Redirect to order confirmation

## Security Notes

- Always verify webhook signatures using BBMSL public key
- Use HTTPS in production
- Store API keys and private keys in environment variables
- Never commit secrets to git
- Private key should be kept extremely secure

## You Need to Provide

1. **BBMSL_API_KEY** - From BBMSL Business Portal
2. **BBMSL_PRIVATE_KEY** - Your RSA private key (生成的私鑰)
3. Upload your public key to BBMSL portal

## Reference

- BBMSL Docs: https://docs.bbmsl.com/docs/api
- API uses RSA 2048-bit keys
- Hashing: SHA256withRSA
