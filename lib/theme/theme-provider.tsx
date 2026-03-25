"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import type { Theme, ThemeColors } from "@/types/common";

function getColors(dk: boolean): ThemeColors {
  return {
    pri: "#E8713A",
    sec: "#D94F8A",
    bg: dk ? "#0C0E14" : "#F8F7F5",
    card: dk ? "#141721" : "#FFF",
    side: dk ? "#0F1119" : "#FFF",
    inp: dk ? "#1A1E2E" : "#F0EFED",
    txt: dk ? "#E8E6E3" : "#1A1A1A",
    t2: dk ? "#8B8D97" : "#6B6B6B",
    t3: dk ? "#555764" : "#9B9B9B",
    brd: dk ? "#1E2233" : "#E8E6E3",
    brdL: dk ? "#262A3A" : "#F0EFED",
    ok: "#34C77B",
    warn: "#F5A623",
    err: "#E84855",
    info: "#4A9EFF",
    wa: "#25D366",
    ai: "#7C3AED",
    shadow: "0 2px 12px rgba(0,0,0,0.06)",
    shadowLg: "0 12px 40px rgba(0,0,0,0.15)",
  };
}

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const isDark = theme === "dark";
  const colors = useMemo(() => getColors(isDark), [isDark]);

  // Read saved theme after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme;
    if (saved && saved !== theme) setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ theme, isDark, colors, toggleTheme }),
    [theme, isDark, colors, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
