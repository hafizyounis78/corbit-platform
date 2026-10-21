"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, getConsent, type ConsentLevel } from "@/lib/marketing/consent";
import { captureAttribution, watchConsentForAttribution } from "@/lib/marketing/attribution";
import { isTrackedPath } from "@/lib/marketing/tracked-paths";

/**
 * Google Tag Manager مع Consent Mode v2: كل شيء «مرفوض» حتى يقبل الزائر الكوكيز
 * (GA4 يرسل إشارات بلا كوكيز فقط)، ثم يُمنح عند «قبول الكل».
 *
 * يُحقن يدوياً. بلا `NEXT_PUBLIC_GTM_ID` لا يُحمَّل GTM — ولا يُفترض
 * رقمٌ افتراضيّ — لكن يبقى التقاط مصدر الزائر للخادم يعمل.
 */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

function consentState(level: ConsentLevel | null) {
  const granted = level === "accepted" ? "granted" : "denied";
  return {
    ad_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted,
    analytics_storage: granted,
  };
}

export default function GoogleTagManager() {
  const pathname = usePathname();
  const tracked = isTrackedPath(pathname);

  useEffect(() => {
    if (!tracked) return;

    captureAttribution();
    const stopWatching = watchConsentForAttribution();

    if (!GTM_ID) return stopWatching;

    const w = window as GtagWindow;
    if (!document.getElementById("gtm-script")) {
      w.dataLayer = w.dataLayer || [];
      // يجب دفع كائن arguments نفسه — هكذا يقرأ GTM أوامر gtag.
      w.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
      w.gtag("consent", "default", { ...consentState(null), wait_for_update: 500 });
      const level = getConsent();
      if (level) w.gtag("consent", "update", consentState(level));
      w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

      const script = document.createElement("script");
      script.id = "gtm-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
      document.head.appendChild(script);
    }

    const onConsent = (e: Event) => {
      const level = (e as CustomEvent<ConsentLevel>).detail;
      w.gtag?.("consent", "update", consentState(level));
      // يتيح لـ GTM تحميل البكسلات التي انتظرت الموافقة دون إعادة تحميل الصفحة.
      if (level === "accepted") w.dataLayer?.push({ event: "consent_granted" });
    };
    window.addEventListener(CONSENT_EVENT, onConsent);

    return () => {
      stopWatching();
      window.removeEventListener(CONSENT_EVENT, onConsent);
    };
  }, [tracked]);

  return null;
}
