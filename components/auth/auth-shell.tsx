"use client";

import { useEffect, useState } from "react";

/**
 * Shared pieces of the redesigned auth screens (login, forgot password).
 * The auth screens default to the light theme, independent of the platform
 * theme, so the preference is stored under its own key.
 */
export const AUTH_THEME_KEY = "wb_auth_theme";

const SHELL_T = {
  ar: {
    talk: "تحدث معنا", theme: "تبديل الوضع", site: "موقع كوربت", terms: "شروط الاستخدام", privacy: "الخصوصية",
    dpa: "معالجة البيانات", waPolicy: "سياسة واتساب", copy: "© 2026 Corbit",
  },
  en: {
    talk: "Talk to us", theme: "Toggle theme", site: "Corbit website", terms: "Terms", privacy: "Privacy",
    dpa: "Data processing", waPolicy: "WhatsApp policy", copy: "© 2026 Corbit",
  },
} as const;

/** Light/dark preference of the auth screens, remembered across visits. */
export function useAuthTheme(): [boolean, () => void] {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try { setDark(localStorage.getItem(AUTH_THEME_KEY) === "dark"); } catch { /* ignore */ }
  }, []);

  const toggle = () => {
    setDark((d) => {
      try { localStorage.setItem(AUTH_THEME_KEY, d ? "light" : "dark"); } catch { /* ignore */ }
      return !d;
    });
  };

  return [dark, toggle];
}

/** «تحدث معنا»: opens the existing live-support chat; falls back to the unified number. */
export function openSupportChat() {
  try {
    const siq = (window as any).$zoho?.salesiq;
    if (siq?.floatwindow?.visible) { siq.floatwindow.visible("show"); return; }
  } catch { /* ignore */ }
  window.location.href = "tel:920006900";
}

export const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);

/** Eye / crossed-eye for the show-password button. */
export const EyeIcon = ({ off }: { off?: boolean }) => (off
  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9" /></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>);

/** WhatsBit wordmark — links back to the product page on corbit.sa. */
export function AuthLogo() {
  return (
    <a className="wm-logo" href="https://corbit.sa/products/whatsapp" title="WhatsBit" aria-label="WhatsBit">
      <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="wbArcA" x1="12" y1="62" x2="64" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF8A1C" /><stop offset=".35" stopColor="#FF2D8F" /><stop offset="1" stopColor="#FF8A1C" />
          </linearGradient>
          <linearGradient id="wbArcB" x1="86" y1="55" x2="55" y2="86" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF8A1C" /><stop offset="1" stopColor="#FF2D8F" />
          </linearGradient>
        </defs>
        <path d="M14.5 56.3A36 36 0 0 1 62.3 16.2" stroke="url(#wbArcA)" strokeWidth="3" strokeLinecap="round" />
        <path d="M85.5 56.3A36 36 0 0 1 56.3 85.5" stroke="url(#wbArcB)" strokeWidth="3" strokeLinecap="round" />
        <path d="M66 25.5A28 28 0 0 0 30.2 69.8L24 81l14-6.2A28 28 0 0 0 73.5 64" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="76" y="24" width="6.5" height="6.5" rx="1.2" fill="#FF5B5B" />
        <rect x="66" y="33.5" width="13" height="6.5" rx="1.4" fill="#28A745" />
        <rect x="56" y="38" width="6" height="4.5" rx="1.1" fill="#28A745" />
        <rect x="59" y="44" width="14.5" height="7" rx="1.4" fill="#28A745" />
        <rect x="79" y="42" width="8" height="4.8" rx="1.1" fill="#28A745" />
        <rect x="49" y="47.5" width="6" height="4.2" rx="1.1" fill="#28A745" />
        <rect x="39" y="55" width="7.5" height="5" rx="1.1" fill="#28A745" />
        <rect x="52" y="54.5" width="8.5" height="5" rx="1.1" fill="#28A745" />
        <rect x="66" y="53.5" width="12" height="5.8" rx="1.3" fill="#28A745" />
      </svg>
      <span>Whats<b>Bit</b></span>
    </a>
  );
}

/** Logo + «تحدث معنا» + language + theme buttons. */
export function AuthTopbar({ en, onToggleLang, onToggleTheme }: { en: boolean; onToggleLang: () => void; onToggleTheme: () => void }) {
  const t = SHELL_T[en ? "en" : "ar"];
  return (
    <header className="topbar reveal">
      <AuthLogo />
      <div className="topbar-actions">
        <button type="button" className="talk-btn" onClick={openSupportChat}><PhoneIcon /><span className="tt">{t.talk}</span></button>
        <button type="button" className="lang-btn" lang={en ? "ar" : "en"} aria-label={en ? "التبديل إلى العربية" : "Switch to English"} onClick={onToggleLang}>{en ? "عربي" : "EN"}</button>
        <button type="button" className="theme-btn" aria-label={t.theme} onClick={onToggleTheme}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
        </button>
      </div>
    </header>
  );
}

/** Contact line + legal links. */
export function AuthLegal({ en }: { en: boolean }) {
  const t = SHELL_T[en ? "en" : "ar"];
  return (
    <footer className="legal reveal">
      <nav>
        <a href="https://corbit.sa" target="_blank" rel="noopener" className="site"><span className="dot" /><span>{t.site}</span></a>
        <a className="sup" href="mailto:info@corbit.sa"><bdi dir="ltr">info@corbit.sa</bdi></a>
        <a className="tel" href="tel:920006900"><PhoneIcon /><bdi dir="ltr">920006900</bdi></a>
      </nav>
      <nav>
        <a href="/terms">{t.terms}</a>
        <a href="/privacy">{t.privacy}</a>
        <a href="/dpa">{t.dpa}</a>
        {/* Required by Meta WhatsApp Business Policy — kept from the previous screen. */}
        <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" rel="noopener noreferrer">{t.waPolicy}</a>
        <span className="cpy">{t.copy}</span>
      </nav>
    </footer>
  );
}
