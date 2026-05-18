"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";
import { Icon } from "@/components/icons/icon";

export interface AiInsightCard {
  icon: string;
  title: string;
  value?: string | number;
  caption: string;
  cta?: string;
  /** Tone tints the accent stripe and value/CTA color. */
  tone: "ok" | "warn" | "err" | "pri";
}

/**
 * Reusable strip of "AI Insights" cards. Each page (Templates, Bots,
 * Analytics, etc.) computes its own card list from local data and
 * renders them with the same visual language we already use on
 * Contacts (CustomerInsightsBar). Keeping the layout shared means
 * the design stays consistent as more pages adopt the pattern.
 */
export function AiInsightsBar({
  cards,
  title,
}: {
  cards: AiInsightCard[];
  title?: string;
}) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  if (!cards || cards.length === 0) return null;

  const toneColor = (tone: AiInsightCard["tone"]) => {
    switch (tone) {
      case "ok":   return C.ok;
      case "warn": return C.warn;
      case "err":  return C.err;
      case "pri":
      default:     return C.pri;
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
        fontSize: 13,
        fontWeight: 700,
        color: C.txt,
      }}>
        <span style={{ color: C.pri, display: "inline-flex" }}><Icon name="brain" size={16} /></span>
        {title || (isAr ? "رؤى الذكاء الاصطناعي" : "AI Insights")}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 10,
      }}>
        {cards.map((card, i) => {
          const color = toneColor(card.tone);
          return (
            <div
              key={i}
              style={{
                background: C.card,
                border: `1px solid ${C.brd}`,
                borderRadius: 12,
                padding: "14px 16px",
                fontFamily: FONT_FAMILY,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Coloured accent stripe down the lead edge */}
              <div style={{
                position: "absolute",
                insetInlineStart: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: color,
              }} />
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color, display: "inline-flex" }}><Icon name={card.icon} size={16} /></span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: C.txt }}>
                    {card.title}
                  </span>
                </div>
                {card.value !== undefined && (
                  <span style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color,
                    fontFamily: "monospace",
                  }}>
                    {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                  </span>
                )}
              </div>
              <div style={{
                fontSize: 11.5,
                color: C.t2,
                lineHeight: 1.5,
              }}>
                {card.caption}
              </div>
              {card.cta && (
                <div style={{
                  fontSize: 11,
                  color,
                  fontWeight: 600,
                  marginTop: 6,
                }}>
                  → {card.cta}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
