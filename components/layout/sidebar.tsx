"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { navItems } from "@/data/nav-items";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { useNavBadges } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { colors: C } = useTheme();
  const { t, isAr } = useLocale();
  const { data: badges } = useNavBadges();
  const { user, logout } = useAuth();

  const getBadge = (item: (typeof navItems)[number]) => {
    if (badges) {
      const count = (badges as Record<string, number>)[item.key];
      if (count !== undefined && count !== null) return count;
    }
    // Fall back to hardcoded badge
    return item.badge;
  };

  return (
    <div
      style={{
        width: open ? 260 : 72,
        minWidth: open ? 260 : 72,
        background: C.side,
        borderInlineEnd: "1px solid " + C.brd,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s",
        overflow: "hidden",
        zIndex: 20,
      }}
    >
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
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: GRADIENT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          C
        </div>
        {open && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
              CORBIT
            </div>
            <div style={{ fontSize: 11, color: C.t2, marginTop: -2 }}>
              المدار
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {navItems.map((n) => {
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
                padding: open ? "10px 14px" : "10px",
                justifyContent: open ? "flex-start" : "center",
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
              {open && <span>{t(n.labelKey)}</span>}
              {badgeCount && open && (
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
      </nav>

      {/* User */}
      {open && (
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
        </div>
      )}
    </div>
  );
}
