"use client";

import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  color: string;
}

export function Badge({ children, color }: BadgeProps) {
  return (
    <span
      style={{
        fontSize: 10.5,
        padding: "2px 10px",
        borderRadius: 8,
        fontWeight: 600,
        background: color + "18",
        color,
      }}
    >
      {children}
    </span>
  );
}
