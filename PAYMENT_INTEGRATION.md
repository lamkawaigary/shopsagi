# BBMSL Payment Integration

## Environment Variables

Copy this file to `.env.local` and fill in your values:

```bash
# BBMSL Configuration
BBMSL_MERCHANT_ID=your_merchant_id
BBMSL_API_KEY=your_api_key
BBMSL_API_SECRET=your_api_secret
BBMSL_API_URL=https://openapi.bbmsl.com

# Base URL for callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

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

### Webhook
```
PUT /api/payment
{
  orderId: string,
  paymentStatus: 'SUCCESS' | 'FAILED',
  transactionId: string,
  amount: number,
  paymentMethod: string
}
```

## Flow

1. Customer selects products → Cart
2. Customer clicks checkout → /payment/checkout
3. Select payment method → Submit
4. API creates payment → Redirects to BBMSL
5. Customer completes payment
6. BBMSL webhook → Update order status
7. Redirect to order confirmation

## Security

- Always verify webhook signatures
- Use HTTPS in production
- Store API keys in environment variables
- Never commit secrets to git
