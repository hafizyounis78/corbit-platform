"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme/theme-provider";
import { CONSENT_EVENT, getConsent, setConsent } from "@/lib/marketing/consent";
import { isTrackedPath } from "@/lib/marketing/tracked-paths";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

/**
 * شريط موافقة الكوكيز — يظهر حتى يجيب الزائر مرة واحدة في أيّ موقع من
 * `*.corbit.sa` (الجواب كوكي مشترك، انظر lib/marketing/consent.ts). ويُعدّ ردّ
 * الخادم «مُجاباً» حتى لا يومض الشريط أثناء التحميل.
 */
export function CookieConsentBanner() {
  const { isAr } = useLocale();
  const { colors: C } = useTheme();
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribe, getConsent, () => "necessary");

  if (consent !== null || !isTrackedPath(pathname)) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      dir={isAr ? "rtl" : "ltr"}
      style={{
        position: "fixed",
        insetInline: 12,
        bottom: 12,
        zIndex: 60,
        maxWidth: 760,
        margin: "0 auto",
        background: C.card,
        border: "1px solid " + C.brd,
        borderRadius: 16,
        boxShadow: "0 12px 32px rgba(0,0,0,.14)",
        padding: 16,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
      }}
    >
      <p style={{ flex: "1 1 320px", margin: 0, fontSize: 14, lineHeight: 1.7, color: C.txt }}>
        {isAr
          ? "نستخدم ملفات تعريف الارتباط (الكوكيز) لتحسين تجربتك وقياس أداء حملاتنا الإعلانية. يمكنك قبولها كلها أو الاكتفاء بالضرورية فقط."
          : "We use cookies to improve your experience and measure our ad campaigns. You can accept all of them or keep only the necessary ones."}
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Button outline onClick={() => setConsent("necessary")}>
          {isAr ? "الضرورية فقط" : "Necessary only"}
        </Button>
        <Button primary onClick={() => setConsent("accepted")}>
          {isAr ? "قبول الكل" : "Accept all"}
        </Button>
      </div>
    </div>
  );
}
