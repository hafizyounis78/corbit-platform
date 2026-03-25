"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Icon } from "@/components/icons/icon";
import { navItems } from "@/data/nav-items";
import { NotificationDropdown } from "./notification-dropdown";
import { FONT_FAMILY } from "@/lib/constants/font";
import api from "@/lib/api/client";

interface HeaderProps {
  onToggleSidebar: () => void;
}

interface SearchResult {
  type: string;
  id: string | number;
  title: string;
  subtitle?: string;
  url: string;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { t, lang, toggleLang } = useLocale();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentNav = navItems.find((n) => pathname === n.path);
  const pageTitle = currentNav ? t(currentNav.labelKey) : "";

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
      const data = res.data?.data ?? res.data ?? [];
      const results: SearchResult[] = Array.isArray(data) ? data : [];
      setSearchResults(results);
      setSearchOpen(results.length > 0);
    } catch {
      setSearchResults([]);
      setSearchOpen(false);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 400);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(searchQuery);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
  };

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const typeIcons: Record<string, string> = {
    conversation: "msg",
    contact: "users",
    campaign: "megaphone",
    template: "file",
  };

  return (
    <header
      style={{
        height: 64,
        minHeight: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: C.card,
        borderBottom: "1px solid " + C.brd,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: "none",
            border: "none",
            color: C.t2,
            cursor: "pointer",
            padding: 4,
          }}
        >
          <Icon name="menu" size={18} />
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>
          {pageTitle}
        </h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Search */}
        <div
          ref={searchRef}
          style={{
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 10,
              background: C.inp,
              width: 180,
            }}
          >
            <Icon name="search" size={14} />
            {searchLoading ? (
              <span style={{ fontSize: 11, color: C.t3 }}>...</span>
            ) : null}
            <input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              style={{
                border: "none",
                background: "none",
                outline: "none",
                fontFamily: FONT_FAMILY,
                fontSize: 12,
                color: C.txt,
                width: "100%",
              }}
            />
          </div>
          {searchOpen && searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 40,
                left: 0,
                width: 320,
                maxHeight: 360,
                overflowY: "auto",
                background: C.card,
                borderRadius: 14,
                border: "1px solid " + C.brd,
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                zIndex: 100,
              }}
            >
              {searchResults.map((result, i) => (
                <div
                  key={`${result.type}-${result.id}-${i}`}
                  onClick={() => handleResultClick(result)}
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    borderBottom:
                      i < searchResults.length - 1
                        ? "1px solid " + C.brdL
                        : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      C.inp;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: C.pri + "15",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: C.pri,
                    }}
                  >
                    <Icon
                      name={typeIcons[result.type] || "search"}
                      size={14}
                    />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 12.5,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div
                        style={{
                          fontSize: 11,
                          color: C.t2,
                          marginTop: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: C.t3,
                      flexShrink: 0,
                      textTransform: "capitalize",
                    }}
                  >
                    {result.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language */}
        <button
          onClick={toggleLang}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
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
          <Icon name="globe" size={14} />
          {lang === "ar" ? "EN" : "عربي"}
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
            <span
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: C.err,
              }}
            />
          </button>
          {notifOpen && (
            <NotificationDropdown onClose={() => setNotifOpen(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
