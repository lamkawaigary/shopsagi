import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import PWARegistration from "@/components/PWARegistration";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpenShops - 香港專業電商平台",
  description: "為香港中小企而設的B2C電子商務平台，顧客網上下單，商戶到店取貨。專業、可信賴的網店系統。",
  keywords: ["香港", "電商", "網店", "到店自取", "中小企", "網上開店"],
  authors: [{ name: "OpenShops" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Open Shops",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Open Shops",
    title: "OpenShops - 香港專業電商平台",
    description: "為香港中小企而設的B2C電子商務平台",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Open Shops Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "OpenShops - 香港專業電商平台",
    description: "為香港中小企而設的B2C電子商務平台",
    images: ["/icons/icon-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FF6B35" },
    { media: "(prefers-color-scheme: dark)", color: "#E55A2B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Open Shops" />
        <meta name="application-name" content="Open Shops" />
        <meta name="msapplication-TileColor" content="#FF6B35" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="format-detection" content="telephone=no" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL,GRAD,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}