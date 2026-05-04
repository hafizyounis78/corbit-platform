"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Icon } from "@/components/icons/icon";
import { navItems } from "@/data/nav-items";
import { NotificationDropdown } from "./notification-dropdown";
import { GlobalSearchModal } from "@/components/shared/global-search-modal";
import { FONT_FAMILY } from "@/lib/constants/font";
import { useUnreadCount } from "@/lib/api/hooks";

interface HeaderProps {
  onToggleSidebar: () => void;
  isMobile?: boolean;
}

export function Header({ onToggleSidebar, isMobile = false }: HeaderProps) {
  const pathname = usePathname();
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { t, lang, toggleLang } = useLocale();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Unread badge + audio chime when count goes UP. Polling interval
  // is set in useUnreadCount; we just diff the latest value against
  // the previously-seen one. Skip the chime on the very first read
  // (so a page reload with existing unreads doesn't beep at the user).
  const { data: unreadData, mutate: mutateUnread } = useUnreadCount();
  const unreadCount = (unreadData as any)?.count ?? (unreadData as any) ?? 0;
  const lastSeenUnreadRef = useRef<number | null>(null);
  useEffect(() => {
    const prev = lastSeenUnreadRef.current;
    if (prev !== null && unreadCount > prev) {
      try {
        // Tiny inline chime — no asset to ship, no permission needed.
        // Web Audio API generates a 500ms two-tone beep on the fly.
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.18, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.start();
        o.stop(ctx.currentTime + 0.4);
      } catch {
        // Audio context can fail before any user gesture; silently swallow.
      }
    }
    lastSeenUnreadRef.current = unreadCount;
  }, [unreadCount]);
  // Refresh notifications when the dropdown closes (so the badge resets
  // after Mark all read, etc.)
  useEffect(() => { if (!notifOpen) mutateUnread(); }, [notifOpen, mutateUnread]);
  // Poll the unread count every 20s. Keeps the badge live so an
  // operator who just received a new conversation sees the count
  // tick up + hears the chime within ~20s of arrival, even if they
  // haven't navigated to /inbox.
  useEffect(() => {
    const id = setInterval(() => mutateUnread(), 20000);
    return () => clearInterval(id);
  }, [mutateUnread]);
  const currentNav = navItems.find((n) => pathname === n.path);
  const pageTitle = currentNav ? t(currentNav.labelKey) : "";

  // Global keyboard shortcut: Ctrl+K (Cmd+K on Mac) toggles the
  // unified search modal from any page. Mirror Slack/Notion/VSCode
  // so muscle memory carries over. We bail out when the user is
  // already typing in another editable element except the search
  // box itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (!isToggle) return;
      e.preventDefault();
      setSearchOpen((v) => !v);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      style={{
        height: 64,
        minHeight: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 12px" : "0 24px",
        background: C.card,
        borderBottom: "1px solid " + C.brd,
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: isMobile ? 1 : "0 0 auto" }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: "none",
            border: "none",
            color: C.t2,
            cursor: "pointer",
            padding: 4,
            flexShrink: 0,
          }}
        >
          <Icon name="menu" size={18} />
        </button>
        <h1
          style={{
            fontSize: isMobile ? 15 : 17,
            fontWeight: 700,
            letterSpacing: -0.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {pageTitle}
        </h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {/* Global search trigger.
            Desktop: pill with shortcut hint, opens the modal.
            Mobile: icon-only button to save room next to bell + theme. */}
        {!isMobile ? (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", borderRadius: 10,
              background: C.inp, border: "none",
              cursor: "pointer", color: C.t2,
              fontFamily: FONT_FAMILY, fontSize: 12,
              width: 220, justifyContent: "space-between",
            }}
            title={lang === "ar" ? "بحث شامل (Ctrl+K)" : "Global search (Ctrl+K)"}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="search" size={14} />
              {t("search")}
            </span>
            <span style={{
              fontSize: 9.5, padding: "2px 6px", borderRadius: 5,
              background: C.card, color: C.t3, fontWeight: 600, fontFamily: "monospace",
              border: "1px solid " + C.brd,
            }}>
              ⌘K
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: "1px solid " + C.brd, background: "transparent",
              color: C.txt, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title={lang === "ar" ? "بحث" : "Search"}
          >
            <Icon name="search" size={16} />
          </button>
        )}

        {/* Language — icon-only on mobile to save room next to theme/bell */}
        <button
          onClick={toggleLang}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: isMobile ? 0 : "7px 12px",
            width: isMobile ? 36 : "auto",
            height: isMobile ? 36 : "auto",
            borderRadius: 10,
            border: "1px solid " + C.brd,
            background: "transparent",
            color: C.txt,
            cursor: "pointer",
            fontFamily: FONT_FAMILY,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Icon name="globe" size={isMobile ? 16 : 14} />
          {!isMobile && (lang === "ar" ? "EN" : "عربي")}
        </button>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid " + C.brd,
            background: "transparent",
            color: C.txt,
            cursor: "pointer",
          }}
        >
          <Icon name={isDark ? "sun" : "moon"} size={16} />
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid " + C.brd,
              background: "transparent",
              color: C.txt,
              cursor: "pointer",
              position: "relative",
            }}
          >
            <Icon name="bell" size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 8,
                  background: C.err,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${C.card}`,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationDropdown onClose={() => setNotifOpen(false)} />
          )}
        </div>
      </div>
      {/* Global Search overlay — rendered at the header so it lives
          above the page content and the Cmd+K listener stays mounted
          for the entire authed surface. */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
