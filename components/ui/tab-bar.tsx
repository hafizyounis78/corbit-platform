"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { Icon } from "@/components/icons/icon";

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
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
      {tabs.map((tb) => {
        const isActive = active === tb.key;
        return (
          <button
            key={tb.key}
            onClick={() => onChange(tb.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              fontFamily: FONT_FAMILY,
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              color: isActive ? "#fff" : C.t2,
              background: isActive ? GRADIENT : "transparent",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {tb.icon && (
              <span style={{ display: "inline-flex", opacity: isActive ? 1 : 0.75 }}>
                <Icon name={tb.icon} size={14} />
              </span>
            )}
            <span>{tb.label}</span>
          </button>
        );
      })}
    </div>
  );
}
