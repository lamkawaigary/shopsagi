# BBMSL Payment Integration Guide

## Environment Variables

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
BBMSL_API_KEY=your_api_key_from_bbmsl_portal
BBMSL_PRIVATE_KEY=your_rsa_private_key
BBMSL_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi7pEo8/3ihkA+DHhmjlXyBZd+z6I4av1R9pGsArXtwlY41ynSQi8BAjNJMUJAK0f4QR6DX5VjlMEtoSBrlqBQlbeACZc/tXDMGLjgr2RyhM40ribIBjCVh+0rQl2gSvtZJRY6JX2oVp20Jh4SVOLiL1YdudS1OmRvIAkpPbe6YILagHdF1KZ35vPSVTEhuvquB3qdIO23pMco/GwW9x3S950/XnQ84Lxw5gNWzxunxrEAvSKICgy2I6VFAyi1x/UMem//k75op190TgGEzmr/Gf64IdRzqbenzCfQcWQBo1HwHF/s7nUKdT+Tu6Vv6P5mmNiKU7GYh/N2eVWC+v8eQIDAQAB
BBMSL_API_URL=https://openapi.bbmsl.com

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 你需要提供既野

目前你有：
- ✅ Merchant ID: 1000053
- ✅ BBMSL Public Key (已加入)
- ❌ BBMSL API Key (要係BBMSL Portal拎)
- ❌ Private Key (要自己generate)

## 生成 Private Key

```bash
# Generate RSA private key (2048-bit)
openssl genrsa -out rsa_private_key.pem 2048

# 拎content:
cat rsa_private_key.pem
```

然後將 private key content貼去BBMSL_API_KEY果欄（要erset去BBMSL Portal）。

## 拎 API Key

登入 BBMSL Business Portal -> API Settings ->拎你既API Key

---

## Current Status

| Item | Status |
|------|--------|
| Merchant ID | ✅ 1000053 |
| BBMSL Public Key | ✅ 已加入 |
| API Key | ❌ 需要拎 |
| Private Key | ❌ 需要generate |

你想我點做？
1. 等你提供API Key？
2. 先用mock mode test先？🍎
