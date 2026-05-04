"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useHelpFaqs } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";

interface FaqItem {
  id: string;
  question: { ar: string; en?: string | null };
  answer:   { ar: string; en?: string | null };
}

export function FaqPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { data, isLoading } = useHelpFaqs();
  const faqs: FaqItem[] = Array.isArray(data) ? data : [];

  const pick = (loc: { ar?: string | null; en?: string | null }): string => {
    if (isAr) return (loc.ar ?? loc.en ?? "");
    return (loc.en ?? loc.ar ?? "");
  };

  if (isLoading) {
    return (
      <div style={{ padding: "40px 18px", textAlign: "center", color: C.t3, fontSize: 13 }}>
        {isAr ? "جاري تحميل الأسئلة..." : "Loading FAQ..."}
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div style={{ padding: "40px 18px", textAlign: "center", color: C.t3, fontSize: 13 }}>
        📭 {isAr ? "لا توجد أسئلة شائعة بعد." : "No FAQ entries yet."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {faqs.map((f, i) => {
        const open = openIdx === i;
        return (
          <div
            key={f.id ?? i}
            style={{
              borderRadius: 12, background: C.inp, overflow: "hidden",
              transition: "background 0.15s",
            }}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              style={{
                width: "100%", padding: "14px 18px",
                background: "transparent", border: "none",
                cursor: "pointer", fontFamily: FONT_FAMILY,
                display: "flex", alignItems: "center", gap: 10,
                textAlign: "start" as const,
              }}
            >
              <span style={{
                color: C.pri, transition: "transform 0.2s",
                transform: open ? "rotate(90deg)" : "none",
                fontSize: 12, fontWeight: 700,
              }}>▸</span>
              <span style={{
                fontWeight: 600, fontSize: 13, color: C.txt,
                flex: 1, textAlign: "start" as const,
              }}>
                {pick(f.question)}
              </span>
            </button>
            {open && (
              <div style={{
                padding: "0 18px 16px 40px",
                fontSize: 12.5, color: C.t2, lineHeight: 1.85, whiteSpace: "pre-wrap",
              }}>
                {pick(f.answer)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
