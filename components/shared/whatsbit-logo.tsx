/**
 * WhatsBit visual identity logo.
 * Chat bubble + pixel blocks + orbit arcs gradient.
 *
 * Variants:
 *  - "light"  → white bubble stroke (use on dark navy backgrounds, e.g. sidebar)
 *  - "dark"   → navy bubble stroke (use on light/white backgrounds, e.g. legal pages)
 */
"use client";

import { FONT_LATIN } from "@/lib/constants/font";

type Variant = "light" | "dark";

interface IconProps {
  size?: number;
  variant?: Variant;
}

export function WhatsBitIcon({ size = 44, variant = "light" }: IconProps) {
  const stroke = variant === "light" ? "#fff" : "#0B1D3A";
  const gradId = `wbOrb_${variant}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF1778" />
          <stop offset="1" stopColor="#FF8A2A" />
        </linearGradient>
      </defs>
      <path d="M5 18 A19 19 0 0 1 18 5" stroke={`url(#${gradId})`} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M30 43 A19 19 0 0 0 43 30" stroke={`url(#${gradId})`} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M14 11 H34 A4 4 0 0 1 38 15 V31 A4 4 0 0 1 34 35 H22 L17 41 V35 A4 4 0 0 1 14 31 V15 A4 4 0 0 1 14 11 Z" stroke={stroke} strokeWidth="2.4" fill="none" strokeLinejoin="round" />
      <rect x="19" y="17" width="3" height="2.5" rx="0.5" fill="#16A34A" />
      <rect x="23" y="17" width="5" height="2.5" rx="0.5" fill="#2ECC71" />
      <rect x="29.5" y="17" width="2.5" height="2.5" rx="0.5" fill="#FF5A5F" />
      <rect x="19" y="21" width="6" height="2.5" rx="0.5" fill="#16A34A" />
      <rect x="26" y="21" width="3.5" height="2.5" rx="0.5" fill="#2ECC71" />
      <rect x="20.5" y="25" width="3" height="2.5" rx="0.5" fill="#2ECC71" />
      <rect x="24.5" y="25" width="5" height="2.5" rx="0.5" fill="#16A34A" />
      <rect x="30.5" y="25" width="2" height="2.5" rx="0.5" fill="#FF8A2A" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  variant?: Variant;
  showTagline?: boolean;
  tagline?: string;
  wordmarkSize?: number;
}

export function WhatsBitLogo({
  size = 44,
  variant = "light",
  showTagline = true,
  tagline,
  wordmarkSize = 20,
}: LogoProps) {
  const wordWhats = variant === "light" ? "#fff" : "#0B1D3A";
  const taglineColor = variant === "light" ? "rgba(255,255,255,0.6)" : "#5A6B80";
  const tag = tagline ?? "منصة واتساب أعمال متكاملة";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <WhatsBitIcon size={size} variant={variant} />
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: wordmarkSize,
            letterSpacing: -0.5,
            fontFamily: FONT_LATIN,
            lineHeight: 1,
          }}
        >
          <span style={{ color: wordWhats }}>Whats</span>
          <span style={{ color: "#2ECC71", fontWeight: 800 }}>Bit</span>
        </div>
        {showTagline && (
          <div style={{ fontSize: 10, color: taglineColor, marginTop: 4 }}>{tag}</div>
        )}
      </div>
    </div>
  );
}
