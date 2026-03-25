"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";

export interface TabItem {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  const { colors: C } = useTheme();

  return (
    <div style={{ display: "flex", gap: 4, background: C.inp, borderRadius: 10, padding: 3, flexWrap: "wrap" }}>
      {tabs.map((tb) => (
        <button
          key={tb.key}
          onClick={() => onChange(tb.key)}
          style={{
            padding: "6px 16px",
            borderRadius: 8,
            border: "none",
            fontFamily: FONT_FAMILY,
            fontSize: 12,
            fontWeight: active === tb.key ? 600 : 400,
            cursor: "pointer",
            color: active === tb.key ? "#fff" : C.t2,
            background: active === tb.key ? GRADIENT : "transparent",
            whiteSpace: "nowrap",
          }}
        >
          {tb.label}
        </button>
      ))}
    </div>
  );
}
