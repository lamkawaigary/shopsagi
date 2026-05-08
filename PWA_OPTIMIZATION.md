# ShopSagi PWA 優化方案

## 當前狀態評估

| 項目 | 狀態 | 備註 |
|------|------|------|
| next.config.ts | ✅ 已配置 | 使用 @ducanh2912/next-pwa |
| manifest.json | ✅ 已創建 | public/manifest.json |
| Service Worker | ✅ 配置中 | 通過 next-pwa 自動生成 |
| 離線支援 | ✅ 已實現 | public/offline.html |
| App Icons | ⚠️ 部分完成 | SVG 已創建，PNG 待生成 |
| metadata | ✅ 已更新 | layout.tsx |

## 已實現功能

### 1. PWA 配置 (`next.config.ts`)
- 使用 `@ducanh2912/next-pwa` 處理 Service Worker
- 多種緩存策略配置
- Google Fonts: CacheFirst (1年)
- Images: CacheFirst (30天)
- API calls: NetworkFirst (1小時)
- Next.js static: CacheFirst (30天)
- Stripe JS: CacheFirst (1天)

### 2. Web Manifest (`public/manifest.json`)
```json
{
  "name": "Open Shops 開放商店",
  "short_name": "Open Shops",
  "start_url": "/customer",
  "display": "standalone",
  "theme_color": "#FF6B35",
  "icons": [192, 512 sizes],
  "shortcuts": [購物, 訂單]
}
```

### 3. 離線頁面 (`public/offline.html`)
- 用戶友好的離線提示
- 快速訪問最近瀏覽頁面
- 重新嘗試按鈕

### 4. App Icons (`public/icons/`)
- SVG 源文件: icon.svg
- 8個標準尺寸 PNG (72-512px)
- Maskable 格式支援

### 5. Metadata 增強 (`src/app/layout.tsx`)
- PWA 相關 meta tags
- Apple Web App 配置
- Open Graph / Twitter cards
- Theme color 支援深色模式

### 6. Service Worker 組件 (`src/components/PWARegistration.tsx`)
- 自動註冊
- 更新檢測提示
- 在線/離線事件處理
- Hooks: usePWAUpdate, useOnlineStatus

## 待完成事項

### 圖標生成
```bash
# 安裝 sharp
npm install sharp

# 運行生成腳本
node scripts/generate-icons.js

# 或使用在線工具
# https://realfavicongenerator.net/
```

### 安裝提示 UI (可選)
- 添加 "添加到主屏幕" 提示橫幅
- 在首次訪問時顯示

## 測試步驟

1. **本地測試** (production mode):
```bash
npm run build
npm run start
```

2. **DevTools 檢查**:
- Application > Service Workers
- Application > Manifest
- Lighthouse PWA Audit

3. **手機測試**:
- Android Chrome: "加入主畫面"
- iOS Safari: "加入主畫面"

## 性能提升預期

| 指標 | 改善 |
|------|------|
| 首次載入 | 快取靜態資源 |
| 再次載入 | 幾乎即時 (cached) |
| 離線訪問 | 核心頁面可瀏覽 |
| 安裝率 | 可添加到主屏幕 |