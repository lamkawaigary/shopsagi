# ShopSagi (舖記) - 商業計劃書 v2.0

## 產品概述

### 產品名稱
ShopSagi (舖記)

### 產品類型
B2C 電子商務平台 - 專注香港本地商戶與顧客

### 核心價值主張
為香港中小企提供簡單的線上店鋪系統，顧客網上下單，商戶到店取貨，實現「上架-下單-取貨」全流程。

### 目標用戶
- **商戶端**：零售店、餐飲、服務業、教育/美容等本地商戶
- **顧客端**：本地消費者

---

## 市場定位

### 痛點
- 小型商戶無力開發自己既電商系統
- 現有平台抽佣高
- 顧客無法確認貨物預留

### 解決方案
- 低成本入駐
- 免費版零成本試用
- 付費版提供網上交易保障

---

## 商業模式：雙版本策略

### 免費版 (Basic)
| 功能 | 說明 |
|------|------|
| 商家註冊 | ✅ |
| 商品上架 | ✅ (最多20件) |
| 接收預購訂單 | ✅ |
| 到店自取 | ✅ |
| 店內付費 | ✅ |
| 庫存顯示 | ✅ |

**費用：** 完全免費

### 付費版 (Pro) - HK$168-328/月
| 功能 | 說明 |
|------|------|
| 所有免費版功能 | ✅ |
| 網上結算 | ✅ |
| 付款確認預留貨物 | ✅ |
| 無限商品上架 | ✅ |
| 庫存追蹤 | ✅ |
| 優惠券功能 | ✅ |
| 數據分析 | 高級 |

**費用：** HK$168-328/月 + 5% 交易佣金

---

## 功能範圍

### 商戶端 (Merchant Portal)
- 商戶註冊/登入 (Email/Google)
- 店鋪設定 (店名、Logo、營業時間、地址)
- 商品管理 (上架/下架/編輯、圖片、庫存)
- 訂單管理 (查看/處理訂單)
- 營收統計
- 方案升級

### 顧客端 (Customer Web)
- 瀏覽商戶 (分類、搜尋)
- 商品詳情 + 購物車
- 下單 (選擇到店自取)
- 網上付款 (Pro 商戶)
- 訂單確認 + 二維碼
- 歷史訂單

### 平台管理端 (Admin Portal)
- 商戶管理
- 訂單總覽
- 收益管理

---

## 技術架構

### Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **UI**: Tailwind CSS + Lucide Icons
- **Backend**: Firebase (Auth, Firestore)
- **Payments**: Stripe (Pro 版本)
- **部署**: Vercel

### Database Schema (Firestore)

```
/users/{uid}
  - email, role (merchant|customer|admin)
  - createdAt

/merchants/{merchantId}
  - userId, shopName, logo, description
  - address, phone, coordinates
  - businessHours, categories
  - plan: 'free' | 'pro'
  - stripeAccountId (for Pro)
  - status: 'active' | 'pending' | 'suspended'
  - createdAt

/products/{productId}
  - merchantId, name, description, price
  - images[], category, stock
  - status: 'active' | 'inactive'

/orders/{orderId}
  - orderNumber (unique)
  - customerId, merchantId
  - items[], subtotal
  - platformFee, total
  - status: 'pending' | 'paid' | 'completed' | 'cancelled'
  - paymentStatus: 'unpaid' | 'paid'
  - pickupCode (6-digit)
  - createdAt
  - paidAt (if paid)
```

---

## 用戶流程

### 免費版流程
```
1. 商戶註冊 → 建立商店
2. 上架商品 (≤20件)
3. 顧客瀏覽 → 預購 (填資料)
4. 商戶接單 → 確認庫存
5. 顧客到店 → 出示訂單
6. 店內付款 → 取貨
```

### 付費版流程
```
1. 商戶升級 Pro → 連接 Stripe
2. 上架商品 (無限)
3. 顧客瀏覽 → 預購
4. 選擇網上付款 → Stripe 付款
5. 系統自動預留貨物
6. 顧客到店 → 出示二維碼
7. 取貨確認 → 完成
8. 平台自動扣除 5% 佣金
```

---

## 訂單狀態

| 狀態 | 說明 |
|------|------|
| `pending` | 新訂單，商家未確認 |
| `paid` | 已付款，貨物已預留 |
| `completed` | 已取貨 |
| `cancelled` | 已取消 |

---

## 版本鎖定機制

| 功能 | 免費版 | 付費版 |
|------|--------|--------|
| 商戶註冊 | ✅ | ✅ |
| 商品上架 | ≤20件 | 無限 |
| 到店自取 | ✅ | ✅ |
| 店內付款 | ✅ | ✅ |
| 網上結算 | ❌ | ✅ |
| 付款預留 | ❌ | ✅ |
| 庫存追蹤 | ❌ | ✅ |
| 優惠券 | ❌ | ✅ |
| 數據分析 | 基本 | 高級 |

---

## 開發進度

### Phase 1: MVP (Current)
- [x] Project Setup
- [ ] 商戶註冊/登入
- [ ] 商店設定
- [ ] 商品管理
- [ ] 免費版完整流程

### Phase 2: 付費版
- [ ] Stripe 整合
- [ ] 網上付款
- [ ] 訂單預留系統

### Phase 3: 功能完善
- [ ] 庫存管理
- [ ] 優惠券
- [ ] 高級分析

---

## 環境變量

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

---

## 成功指標

| 指標 | 第一年目標 |
|------|-----------|
| 註冊商戶 | 500 |
| 付費轉化率 | 10-15% |
| 活躍顧客 | 5,000 |
| GMV | HK$1,000,000 |
