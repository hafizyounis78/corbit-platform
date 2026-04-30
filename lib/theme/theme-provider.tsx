"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import type { Theme, ThemeColors } from "@/types/common";

function getColors(dk: boolean): ThemeColors {
  return {
    pri: "#16A34A",
    sec: "#FF1778",
    bg: dk ? "#0B1D3A" : "#F2F4F7",
    card: dk ? "#112240" : "#FFF",
    side: dk ? "#0A1830" : "#0B1D3A",
    inp: dk ? "#1A2E4A" : "#EEF0F4",
    txt: dk ? "#E8ECF0" : "#0B1D3A",
    t2: dk ? "#8B99AD" : "#5A6B80",
    t3: dk ? "#5A6B80" : "#9BA8B7",
    brd: dk ? "#1E3350" : "#DEE2E8",
    brdL: dk ? "#243B5C" : "#EEF0F4",
    ok: "#2ECC71",
    warn: "#FF8A2A",
    err: "#FF5A5F",
    info: "#4A9EFF",
    wa: "#25D366",
    ai: "#7C3AED",
    shadow: "0 2px 12px rgba(11,29,58,0.06)",
    shadowLg: "0 12px 40px rgba(11,29,58,0.15)",
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
