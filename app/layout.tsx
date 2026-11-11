import type { Metadata } from "next";
import { Providers } from "./providers";
import { ConnectPopupRelay } from "@/components/auth/connect-popup-relay";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsBit — منصة واتساب الأعمال المتكاملة",
  description: "WhatsBit by Corbit — Integrated WhatsApp Business Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ConnectPopupRelay />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
