"use client";

/**
 * Shared pieces of the redesigned auth screens (login, forgot/reset password).
 * The auth screens default to the light theme, independent of the platform
 * theme, so the preference is stored under its own key.
 */
export const AUTH_THEME_KEY = "wb_auth_theme";

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
