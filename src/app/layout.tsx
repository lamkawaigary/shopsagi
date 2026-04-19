import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cjk"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShopSagi 舖記 - 香港本地電商平台",
  description: "為香港中小企而設的B2C電子商務平台，顧客網上下單，商戶到店取貨",
  keywords: ["香港", "電商", "網店", "到店自取", "中小企"],
  authors: [{ name: "ShopSagi" }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C3AED",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
