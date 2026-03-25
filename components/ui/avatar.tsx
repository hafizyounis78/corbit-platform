"use client";

import { useTheme } from "@/lib/theme/theme-provider";

interface AvatarProps {
  name: string;
  size?: number;
  solid?: boolean;
}

export function Avatar({ name, size = 40, solid }: AvatarProps) {
  const { colors: C } = useTheme();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: solid ? C.pri : C.pri + "15",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        color: solid ? "#fff" : C.pri,
        flexShrink: 0,
      }}
    >
      {(name || "?").charAt(0)}
    </div>
  );
}
