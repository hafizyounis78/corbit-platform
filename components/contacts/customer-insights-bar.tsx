"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useAiInsights } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";
import { Icon } from "@/components/icons/icon";

interface InsightsPayload {
  fastest_growing: string | null;
  churn_risk_count: number;
  opportunity_count: number;
  hot_leads_count: number;
}

/**
 * Three "AI Insights" cards across the bottom of the Contacts page.
 * Each one nudges the operator toward an action: win back at-risk
 * customers, reward repeat buyers, prioritise hot leads. Numbers are
 * computed server-side from the same Smart Segments builders so the
 * count here always matches the segment tile above.
 */
export function CustomerInsightsBar() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { data, isLoading } = useAiInsights();

  if (isLoading) {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 10,
        marginTop: 20,
      }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{
            height: 76,
            borderRadius: 12,
            background: C.card,
            border: `1px solid ${C.brd}`,
            opacity: 0.5,
          }} />
        ))}
      </div>
    );
  }

  const insights = data as InsightsPayload | null;
  if (!insights) return null;

  // Each card has its own colour signal so the operator's eye lands on
  // the right action: red for risk, green for opportunity, primary for
  // leads worth chasing now.
  const cards = [
    {
      icon: "siren",
      title: isAr ? "خطر فقدان عملاء" : "Churn Risk",
      value: insights.churn_risk_count,
      caption: isAr ? "عملاء غير نشطين 30+ يوم" : "Inactive 30+ days",
      cta: isAr ? "حملة استرجاع" : "Win-back campaign",
      color: C.err,
    },
    {
      icon: "gem",
      title: isAr ? "فرصة برنامج ولاء" : "Loyalty Opportunity",
      value: insights.opportunity_count,
      caption: isAr ? "مشترون متكررون يستحقّون مكافأة" : "Repeat buyers worth rewarding",
      cta: isAr ? "تفعيل برنامج ولاء" : "Launch loyalty",
      color: C.ok,
    },
    {
      icon: "fire",
      title: isAr ? "عملاء حارّون" : "Hot Leads",
      value: insights.hot_leads_count,
      caption: isAr ? "متفاعلون مع آخر حملاتك" : "Engaged with recent campaigns",
      cta: isAr ? "ارسل عرض حصري" : "Send exclusive offer",
      color: C.pri,
    },
  ];

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
        <span style={{ color: C.pri, display: "inline-flex" }}><Icon name="sparkles" size={16} /></span>
        {isAr ? "رؤى ذكيّة عن عملائك" : "AI Customer Insights"}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 10,
      }}>
        {cards.map((card, i) => (
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
            {/* Coloured accent stripe down the lead edge of the card */}
            <div style={{
              position: "absolute",
              insetInlineStart: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: card.color,
            }} />
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: card.color, display: "inline-flex" }}><Icon name={card.icon} size={16} /></span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.txt }}>
                  {card.title}
                </span>
              </div>
              <span style={{
                fontSize: 22,
                fontWeight: 800,
                color: card.color,
                fontFamily: "monospace",
              }}>
                {card.value.toLocaleString()}
              </span>
            </div>
            <div style={{
              fontSize: 11.5,
              color: C.t2,
              lineHeight: 1.5,
            }}>
              {card.caption}
            </div>
            <div style={{
              fontSize: 11,
              color: card.color,
              fontWeight: 600,
              marginTop: 6,
            }}>
              → {card.cta}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
