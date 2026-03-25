"use client";

import type { CSSProperties, ReactNode } from "react";
import { useTheme } from "@/lib/theme/theme-provider";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ children, style: s, onClick }: CardProps) {
  const { colors: C } = useTheme();

  return (
    <div
      onClick={onClick}
      style={{
        background: C.card,
        borderRadius: 14,
        border: "1px solid " + C.brd,
        overflow: "hidden",
        ...(onClick ? { cursor: "pointer" } : {}),
        ...s,
      }}
    >
      {children}
    </div>
  );
}
