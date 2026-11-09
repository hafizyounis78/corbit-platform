"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useAuth } from "@/lib/auth/auth-context";
import { Icon } from "@/components/icons/icon";
import { WhatsBitIcon } from "@/components/shared/whatsbit-logo";
import { FONT_FAMILY } from "@/lib/constants/font";

/**
 * Minimal chrome for sales-trial accounts: brand, account name, theme /
 * language toggles and logout. Deliberately no sidebar, search,
 * notifications or plan banners — the trial account can't reach any of
 * those endpoints (the API answers 403 TRIAL_RESTRICTED).
 */
export function TrialShell({ children }: { children: ReactNode }) {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { isAr, rtl, toggleLang } = useLocale();
  const { user, logout } = useAuth();

  const iconBtn = {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid " + C.brd,
    background: C.card,
    color: C.t2,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  } as const;

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      style={{
        fontFamily: FONT_FAMILY,
        background: C.bg,
        color: C.txt,
        minHeight: "100dvh",
        fontSize: 14,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 16px",
          background: C.side,
          color: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <WhatsBitIcon size={34} variant="light" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>WhatsBit</div>
            <div style={{ fontSize: 12, opacity: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {(user?.org?.name || user?.name || "") + " · " + (isAr ? "حساب تجربة" : "Trial account")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggleLang} style={{ ...iconBtn, width: "auto", padding: "0 10px", fontFamily: FONT_FAMILY, fontSize: 12 }}>
            {isAr ? "EN" : "ع"}
          </button>
          <button onClick={toggleTheme} style={iconBtn} aria-label={isAr ? "تبديل المظهر" : "Toggle theme"}>
            <Icon name={isDark ? "sun" : "moon"} size={16} />
          </button>
          <button onClick={logout} style={iconBtn} aria-label={isAr ? "تسجيل الخروج" : "Log out"}>
            <Icon name="logout" size={16} />
          </button>
        </div>
      </header>
      <main style={{ padding: "20px 16px 40px" }}>{children}</main>
    </div>
  );
}
