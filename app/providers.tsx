"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { ToastProvider } from "@/hooks/use-toast";
import { AuthProvider } from "@/lib/auth/auth-context";
import GoogleTagManager from "@/components/marketing/google-tag-manager";
import { CookieConsentBanner } from "@/components/marketing/cookie-consent-banner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LocaleProvider>
          <ToastProvider>{children}</ToastProvider>
          {/* موافقة الكوكيز — مشتركة مع corbit.sa والبوابة وSchoolBit */}
          <CookieConsentBanner />
        </LocaleProvider>
      </ThemeProvider>
      {/* تتبّع الحملات (GTM + مصدر الزائر) */}
      <GoogleTagManager />
    </AuthProvider>
  );
}
