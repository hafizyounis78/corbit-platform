"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useTheme } from "@/lib/theme/theme-provider";
import { useAuth } from "@/lib/auth/auth-context";
import { useIsMobile, useIsTablet } from "@/hooks/use-media-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PlanWarningBanner } from "@/components/plan/plan-warning-banner";
import { SandboxBanner } from "@/components/sandbox/sandbox-banner";
import { FloatingHelpButton } from "@/components/help/floating-help-button";
import { FONT_FAMILY } from "@/lib/constants/font";
import { navItems, canAccessNav } from "@/data/nav-items";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [sideOpen, setSideOpen] = useState(true);
  const { rtl } = useLocale();
  const { colors: C } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const isInbox = pathname === "/inbox";

  // Sidebar default state, by viewport:
  //   mobile (<768): drawer closed — chrome would eat half the viewport.
  //   tablet (768-1023): rail collapsed — 260px sidebar squeezed
  //     content too much in the QA-reported case.
  //   desktop (>=1024): full sidebar expanded.
  useEffect(() => {
    if (isMobile) {
      setSideOpen(false);
    } else if (isTablet) {
      setSideOpen(false); // start collapsed on tablet; user can expand
    } else {
      setSideOpen(true);
    }
  }, [isMobile, isTablet]);

  // Closing the drawer on route change feels expected on phones —
  // tapping a nav item shouldn't leave the overlay covering the page.
  useEffect(() => {
    if (isMobile) setSideOpen(false);
  }, [pathname, isMobile]);

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
        // 100dvh ("dynamic viewport height") tracks the URL bar
        // collapsing on mobile browsers. Without this, descendants
        // using height:100% would extend below the visible area —
        // which was clipping the inbox composer on phones.
        height: "100dvh",
        display: "flex",
        overflow: "hidden",
        fontSize: 14,
        transition: "background 0.3s, color 0.3s",
        position: "relative",
      }}
      dir={rtl ? "rtl" : "ltr"}
    >
      <Sidebar
        open={sideOpen}
        onToggle={() => setSideOpen(!sideOpen)}
        isMobile={isMobile}
      />
      {isMobile && sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 30,
          }}
        />
      )}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <Header onToggleSidebar={() => setSideOpen(!sideOpen)} isMobile={isMobile} />
        <SandboxBanner />
        <PlanWarningBanner />
        <main
          style={{
            flex: 1,
            overflowY: isInbox ? "hidden" : "auto",
            paddingTop: isInbox ? 0 : isMobile ? 12 : 24,
            // minHeight:0 lets the flex child actually shrink to its
            // parent — without it, a tall child (like the inbox chat
            // with its AI panel + messages) would push the composer
            // below the viewport.
            minHeight: 0,
            // For the inbox we make <main> a flex column so the inbox
            // page itself can use flex:1 to grow into the available
            // space. Other pages keep block flow + auto scrolling.
            display: isInbox ? "flex" : undefined,
            flexDirection: isInbox ? "column" : undefined,
          }}
        >
          {children}
        </main>
      </div>
      {/* Floating Help button — shows on every authed page except
          the Help Center itself; routes to /support?tab=guides. */}
      <FloatingHelpButton />
    </div>
  );
}
