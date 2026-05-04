"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";

/**
 * Floating "?" button rendered above every authenticated page. Tap
 * routes the user to the Help Center hub. Hidden on the help center
 * itself (would be visual noise) and on /login.
 */
export function FloatingHelpButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors: C } = useTheme();
  const { isAr, rtl } = useLocale();
  const [hover, setHover] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Defer the entrance animation until after first paint so we don't
  // render the button mid-route-transition.
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Hide on the help center page itself + on auth pages.
  const hidden = pathname?.startsWith("/support")
    || pathname?.startsWith("/login")
    || pathname?.startsWith("/signup")
    || pathname?.startsWith("/auth")
    || pathname === "/";

  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={() => router.push("/support?tab=guides")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={isAr ? "مركز المساعدة" : "Help Center"}
      style={{
        position: "fixed",
        bottom: 24,
        insetInlineEnd: 24,
        width: 52, height: 52,
        borderRadius: 26,
        background: hover ? C.pri : `linear-gradient(135deg, ${C.pri}, ${C.pri}DD)`,
        color: "#fff",
        border: "none",
        cursor: "pointer",
        boxShadow: hover
          ? "0 12px 36px rgba(0,0,0,0.3)"
          : "0 6px 22px rgba(0,0,0,0.25)",
        zIndex: 150,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: 700,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "scale(1)" : "scale(0.8)",
        transition: "opacity 0.25s, transform 0.25s, box-shadow 0.15s, background 0.15s",
      }}
    >
      ?
    </button>
  );
}
