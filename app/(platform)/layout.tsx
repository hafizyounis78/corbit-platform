"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useTheme } from "@/lib/theme/theme-provider";
import { useAuth } from "@/lib/auth/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PlanWarningBanner } from "@/components/plan/plan-warning-banner";
import { FONT_FAMILY } from "@/lib/constants/font";
import { navItems, canAccessNav } from "@/data/nav-items";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const [sideOpen, setSideOpen] = useState(true);
  const { rtl } = useLocale();
  const { colors: C } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const isInbox = pathname === "/inbox";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Role-based page guard: if current path matches a nav item with role
    // restrictions and the user's role isn't allowed, bounce to dashboard.
    if (!isLoading && user) {
      const current = navItems.find((n) => pathname === n.path || pathname.startsWith(n.path + "/"));
      if (current && !canAccessNav(current, user.role)) {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: C.bg, fontFamily: FONT_FAMILY }}>
        <div style={{ color: C.t2, fontSize: 15 }}>جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        direction: rtl ? "rtl" : "ltr",
        background: C.bg,
        color: C.txt,
        height: "100vh",
        display: "flex",
        overflow: "hidden",
        fontSize: 14,
        transition: "background 0.3s, color 0.3s",
      }}
      dir={rtl ? "rtl" : "ltr"}
    >
      <Sidebar open={sideOpen} onToggle={() => setSideOpen(!sideOpen)} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <Header onToggleSidebar={() => setSideOpen(!sideOpen)} />
        <PlanWarningBanner />
        <main
          style={{
            flex: 1,
            overflowY: isInbox ? "hidden" : "auto",
            paddingTop: isInbox ? 0 : 24,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
