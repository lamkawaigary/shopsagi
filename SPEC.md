# ShopSagi - 商業方案平台

## 產品概述

### 產品名稱
ShopSagi (舖記)

### 產品類型
B2B2C 電子商務 + 配送平台 SaaS

### 核心價值主張
為零售及服務業商戶提供一站式線上店鋪系統，配合零工模式配送司機，實現「上架-下單-配送」全流程自動化。

### 目標用戶
- **商戶端**：零售店、服務業小店、教育/美容/維修等本地商戶
- **客戶端**：本地消費者
- **司機端**：兼職/全職配送司機

---

## 市場定位

### 痛點
- 小型商戶無力開發自己既電商系統
- 現有平台（Foodpanda、Deliveroo）抽佣高且只限餐飲
- 支付系統对接麻煩

### 解決方案
- 低成本入駐（相對自建系統）
- 通用零售及服務業
- 平台費透明化（顯示比客戶）

---

## 功能範圍

### 商戶端 (Merchant Portal)
- 商戶註冊/登入 (Email/Google/電話)
- 店鋪設定 (店名、Logo、營業時間)
- 商品管理 (上架/下架/編輯)
- 訂單管理 (接單/拒單)
- 營收儀表板

### 客戶端 (Customer App/Web)
- 瀏覽商戶 (按分類/距離/評分)
- 商品詳情 + 購物車
- 下單 + 支付
- 訂單追蹤

### 司機端 (Driver App)
- 司機註冊/登入
- 搶單/派單
- 導航整合
- 收入記錄

### 平台管理端 (Admin Portal)
- 商戶/司機管理
- 訂單總覽
- 營收管理

---

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Storage**: Firebase Storage
- **Payments**: Stripe
- **Maps**: Google Maps API
- **Hosting**: Vercel

---

## Database Schema

```
/users/{uid}
  - email, phone, role (merchant|customer|driver|admin)
  - createdAt

/merchants/{merchantId}
  - userId, shopName, logo, description
  - address, coordinates
  - businessHours, categories
  - commissionRate, status

/products/{productId}
  - merchantId, name, description, price
  - images[], category, stock

/orders/{orderId}
  - orderNumber
  - customerId, merchantId, driverId
  - items[], subtotal, platformFee, total
  - status, deliveryAddress
  - timeline[]

/drivers/{driverId}
  - userId, vehicleType, licensePlate
  - status, currentLocation
  - walletBalance, rating
```

---

## 開發進度

### Phase 1: MVP
- [x] Project Setup (Next.js + Firebase)
- [ ] Auth (登入/註冊)
- [ ] 商戶端商品管理
- [ ] 客戶端瀏覽/下單
- [ ] 基本訂單狀態

---

## 環境變量

See `.env.local.example` for required environment variables.
