"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { WhatsBitIcon } from "@/components/shared/whatsbit-logo";
import { navItems, canAccessNav } from "@/data/nav-items";
import { FONT_FAMILY, FONT_LATIN } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { useNavBadges, usePlanUsage } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function Sidebar({ open, onToggle, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { colors: C } = useTheme();
  const { t, isAr, rtl } = useLocale();
  const { data: badges } = useNavBadges();
  const { data: planData } = usePlanUsage();
  const { user, logout } = useAuth();
  // On mobile the sidebar floats over the content as a drawer, on
  // desktop it shrinks/expands inline. The desktop "collapsed" rail
  // (72px) is hidden entirely on mobile — when the drawer closes we
  // pull it fully off-screen instead.
  const drawerOpen = isMobile ? open : true;
  const widthDesktop = open ? 260 : 72;
  const widthMobile = 280;

  const plan = (planData as any)?.plan;
  const usage = (planData as any)?.usage ?? {};
  const limits = (planData as any)?.limits ?? {};
  const convUsed = Number(usage.conversations ?? 0);
  const convLimit = Number(limits.max_conversations ?? 0);
  const convPct = convLimit > 0 && convLimit !== -1 ? Math.min(100, (convUsed / convLimit) * 100) : 0;
  const convDanger = convLimit !== -1 && convPct >= 90;
  const convWarn = convLimit !== -1 && convPct >= 70 && convPct < 90;

  const getBadge = (item: (typeof navItems)[number]) => {
    if (badges) {
      const count = (badges as Record<string, number>)[item.key];
      if (count !== undefined && count !== null) return count;
    }
    // Fall back to hardcoded badge
    return item.badge;
  };

  // Pre-compute mobile vs desktop styles so the markup stays one block.
  // On mobile we always render fully-open content (260px width) but
  // translate the whole panel off-screen when closed; on desktop we
  // animate the inline width as before.
  const mobileTranslate = drawerOpen
    ? "translateX(0)"
    : rtl
      ? "translateX(100%)"
      : "translateX(-100%)";

  const containerStyle: React.CSSProperties = isMobile
    ? {
        width: widthMobile,
        minWidth: widthMobile,
        background: C.side,
        borderInlineEnd: "1px solid " + C.brd,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        insetInlineStart: 0,
        transform: mobileTranslate,
        transition: "transform 0.3s",
        overflow: "hidden",
        zIndex: 40,
        boxShadow: drawerOpen ? "0 8px 32px rgba(0,0,0,0.35)" : "none",
      }
    : {
        width: widthDesktop,
        minWidth: widthDesktop,
        background: C.side,
        borderInlineEnd: "1px solid " + C.brd,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s",
        overflow: "hidden",
        zIndex: 20,
      };

  // Inside the drawer we always want the "expanded" labels visible —
  // a 280px-wide drawer with icon-only nav would feel broken.
  const showLabels = isMobile ? true : open;

  return (
    <div style={containerStyle}>
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid " + C.brd,
        }}
      >
        <WhatsBitIcon size={44} variant="light" />
        {showLabels && (
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: -0.5,
                fontFamily: FONT_LATIN,
                lineHeight: 1,
              }}
            >
              <span style={{ color: "#fff" }}>Whats</span>
              <span style={{ color: "#2ECC71", fontWeight: 800 }}>Bit</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
              {isAr ? "منصة واتساب أعمال متكاملة" : "Integrated WhatsApp Business"}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {navItems.filter((n) => canAccessNav(n, user?.role)).map((n) => {
          const isActive = pathname === n.path;
          const badgeCount = getBadge(n);
          return (
            <Link
              key={n.key}
              href={n.path}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: showLabels ? "10px 14px" : "10px",
                justifyContent: showLabels ? "flex-start" : "center",
                marginBottom: 2,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontFamily: FONT_FAMILY,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? C.pri : C.t2,
                background: isActive ? C.pri + "12" : "transparent",
                textDecoration: "none",
              }}
            >
              <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>
                <Icon name={n.icon} size={18} />
              </span>
              {showLabels && <span>{t(n.labelKey)}</span>}
              {badgeCount && showLabels && (
                <span
                  style={{
                    marginInlineStart: "auto",
                    background: GRADIENT,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 10,
                    padding: "2px 8px",
                  }}
                >
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}

        {user?.isSuperAdmin ? (
          <>
            <Link
              href="/super-admin"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: showLabels ? "10px 14px" : "10px",
                justifyContent: showLabels ? "flex-start" : "center",
                marginTop: 8,
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: FONT_FAMILY,
                fontSize: 13.5,
                fontWeight: pathname === "/super-admin" ? 600 : 400,
                color: pathname === "/super-admin" ? C.pri : C.t2,
                background: pathname === "/super-admin" ? C.pri + "12" : "transparent",
                textDecoration: "none",
                borderTop: "1px dashed " + C.brd,
                paddingTop: 14,
              }}
            >
              <span style={{ flexShrink: 0, opacity: pathname === "/super-admin" ? 1 : 0.6 }}>
                <Icon name="shield" size={18} />
              </span>
              {showLabels && <span>{isAr ? "المشرف العام" : "Super Admin"}</span>}
            </Link>

            <Link
              href="/super-admin/sms-welcome"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: showLabels ? "10px 14px" : "10px",
                justifyContent: showLabels ? "flex-start" : "center",
                marginTop: 2,
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: FONT_FAMILY,
                fontSize: 13.5,
                fontWeight: pathname === "/super-admin/sms-welcome" ? 600 : 400,
                color: pathname === "/super-admin/sms-welcome" ? C.pri : C.t2,
                background: pathname === "/super-admin/sms-welcome" ? C.pri + "12" : "transparent",
                textDecoration: "none",
              }}
            >
              <span style={{ flexShrink: 0, opacity: pathname === "/super-admin/sms-welcome" ? 1 : 0.6 }}>
                <Icon name="msg" size={18} />
              </span>
              {showLabels && <span>{isAr ? "رسائل SMS ترحيبيّة" : "Welcome SMS"}</span>}
            </Link>
          </>
        ) : null}
      </nav>

      {/* Plan badge — links to /billing */}
      {showLabels && plan && (
        <Link
          href="/billing"
          style={{
            margin: "0 16px 4px",
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${convDanger ? C.err : convWarn ? C.warn : C.brd}`,
            background: convDanger ? C.err + "10" : convWarn ? C.warn + "10" : "transparent",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="star" size={12} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.txt }}>
                {isAr ? plan.name_ar || plan.name : plan.name}
              </span>
            </div>
            <span style={{ fontSize: 10, color: C.t2 }}>
              {Number(plan.price).toLocaleString()} {isAr ? "ر.س" : "SAR"}
            </span>
          </div>
          <div style={{ fontSize: 10, color: C.t2, display: "flex", justifyContent: "space-between" }}>
            <span>{isAr ? "محادثات الشهر" : "Conversations"}</span>
            <span style={{ fontFamily: "monospace" }}>
              {convUsed.toLocaleString()} / {convLimit === -1 ? "∞" : convLimit.toLocaleString()}
            </span>
          </div>
          {convLimit !== -1 && (
            <div style={{ height: 4, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${convPct}%`,
                background: convDanger ? C.err : convWarn ? C.warn : "#10b981",
                transition: "width 0.3s",
              }} />
            </div>
          )}
        </Link>
      )}

      {/* User */}
      {showLabels && (
        <div style={{ padding: 16, borderTop: "1px solid " + C.brd }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              background: C.pri + "15",
            }}
          >
            <Avatar name={user?.name?.charAt(0) || (isAr ? "م" : "A")} size={36} solid />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || (isAr ? "محمد أحمد" : "Mohammed")}
              </div>
              <div style={{ fontSize: 11, color: C.t2 }}>{user?.role || "Admin"}</div>
            </div>
            <button
              onClick={logout}
              title={isAr ? "تسجيل الخروج" : "Logout"}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                color: C.t2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.err + "20"; e.currentTarget.style.color = C.err; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.t2; }}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>

          {/* Legal links — surfaced on every authenticated page so a
              tenant (or a Meta reviewer) can always reach Privacy +
              Terms. The pages exist already; this gives them a
              reliable entry point per WhatsApp Business Policy. */}
          <div style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${C.brd}`,
            display: "flex",
            justifyContent: "center",
            gap: 8,
            fontSize: 10,
            color: C.t3,
            flexWrap: "wrap",
          }}>
            <Link href="/privacy" style={{ color: C.t3, textDecoration: "none" }}>
              {isAr ? "الخصوصيّة" : "Privacy"}
            </Link>
            <span style={{ opacity: 0.4 }}>·</span>
            <Link href="/terms" style={{ color: C.t3, textDecoration: "none" }}>
              {isAr ? "الشروط" : "Terms"}
            </Link>
            <span style={{ opacity: 0.4 }}>·</span>
            <Link href="/dpa" style={{ color: C.t3, textDecoration: "none" }}>
              {isAr ? "DPA" : "DPA"}
            </Link>
            <span style={{ opacity: 0.4 }}>·</span>
            <a
              href="https://www.whatsapp.com/legal/business-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.t3, textDecoration: "none" }}
            >
              {isAr ? "سياسة واتساب" : "WA Policy"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
