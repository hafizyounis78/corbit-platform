"use client";

import type { CSSProperties, ReactNode, MouseEvent } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";

interface ButtonProps {
  children: ReactNode;
  primary?: boolean;
  small?: boolean;
  outline?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
}

export function Button({ children, primary, small, outline, disabled, onClick, style: s }: ButtonProps) {
  const { colors: C } = useTheme();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "5px 12px" : "8px 18px",
        borderRadius: 10,
        fontFamily: FONT_FAMILY,
        fontSize: small ? 11.5 : 12.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        border: outline ? "1px solid " + C.brd : "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        opacity: disabled ? 0.5 : 1,
        background: primary ? GRADIENT : outline ? "transparent" : C.pri + "12",
        color: primary ? "#fff" : outline ? C.txt : C.pri,
        ...s,
      }}
    >
      {children}
    </button>
  );
}
