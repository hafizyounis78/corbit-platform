"use client";

import type { CSSProperties } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Icon } from "@/components/icons/icon";

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  style?: CSSProperties;
}

export function SearchInput({ value, onChange, onKeyDown, placeholder, style: s }: SearchInputProps) {
  const { colors: C } = useTheme();
  const { t } = useLocale();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 10,
        background: C.inp,
        ...s,
      }}
    >
      <Icon name="search" size={14} />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? t("search")}
        style={{
          border: "none",
          background: "transparent",
          outline: "none",
          fontSize: 13,
          color: C.txt,
          width: "100%",
        }}
      />
    </div>
  );
}
