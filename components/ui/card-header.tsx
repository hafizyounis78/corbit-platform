"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { FONT_FAMILY } from "@/lib/constants/font";

interface CardHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function CardHeader({ title, actionLabel, onAction }: CardHeaderProps) {
  const { colors: C } = useTheme();

  return (
    <div
      style={{
        padding: "14px 20px",
        borderBottom: "1px solid " + C.brd,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}>{title}</h3>
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            color: C.pri,
            fontFamily: FONT_FAMILY,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
