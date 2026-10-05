"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Card } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { Sparkline } from "@/components/charts/sparkline";
import { useWhatsappUsage } from "@/lib/api/hooks";

/**
 * WhatsApp usage panel for /billing → Usage: delivered messages and
 * their cost per Meta pricing category, as 360dialog reports them —
 * the same figures as the 360dialog Insights screen, synced hourly.
 *
 * Hidden when the tenant's number isn't a partner channel (BYO): the
 * usage then lives in their own 360dialog account and a zero here
 * would be misleading. Never mixed with SMS or AI numbers.
 */

type RangeKey = "month" | "last_month" | "90d";

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  MARKETING: { ar: "تسويقيّة", en: "Marketing" },
  MARKETING_LITE: { ar: "تسويقيّة Lite", en: "Marketing Lite" },
  UTILITY: { ar: "خدميّة", en: "Utility" },
  AUTHENTICATION: { ar: "مصادقة", en: "Authentication" },
  AUTHENTICATION_INTERNATIONAL: { ar: "مصادقة دوليّة", en: "Auth (intl)" },
  SERVICE: { ar: "خدمة العملاء", en: "Service" },
};

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function rangeFor(key: RangeKey): { from: string; to: string } {
  const now = new Date();
  if (key === "last_month") {
    return {
      from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  if (key === "90d") {
    return { from: ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89)), to: ymd(now) };
  }
  return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now) };
}

export function WhatsappUsageWidget() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const [range, setRange] = useState<RangeKey>("month");
  const { from, to } = rangeFor(range);
  const { data, isLoading } = useWhatsappUsage(from, to);
  const usage = data as any;

  if (!isLoading && !usage?.available) return null;

  const currency: string = usage?.currency || "";
  const money = (v: unknown) => `${Number(v ?? 0).toFixed(2)}${currency ? ` ${currency}` : ""}`;
  const categories: { category: string; volume: number; cost: number }[] = usage?.by_category ?? [];
  const daily: number[] = (usage?.daily ?? []).map((d: any) => Number(d.volume) || 0);
  const maxVolume = Math.max(1, ...categories.map((c) => c.volume));

  const ranges: { key: RangeKey; ar: string; en: string }[] = [
    { key: "month", ar: "هذا الشهر", en: "This month" },
    { key: "last_month", ar: "الشهر الماضي", en: "Last month" },
    { key: "90d", ar: "آخر 90 يوم", en: "Last 90 days" },
  ];

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>
            {isAr ? "قناة واتساب" : "WhatsApp Channel"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="msg" size={18} />
            <span>{isAr ? "استهلاك الرسائل" : "Message usage"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ranges.map((r) => {
            const selected = range === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                style={{
                  padding: "5px 11px", borderRadius: 999,
                  border: `1.5px solid ${selected ? C.pri : C.brd}`,
                  background: selected ? `${C.pri}15` : "transparent",
                  color: selected ? C.pri : C.t2,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                {isAr ? r.ar : r.en}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Tile
          label={isAr ? "رسائل مُسلَّمة" : "Delivered"}
          value={isLoading ? "…" : Number(usage?.total?.volume ?? 0).toLocaleString()}
          unit={isAr ? "رسالة" : "msg"}
          c={C}
        />
        <Tile
          label={isAr ? "منها مدفوعة" : "Paid"}
          value={isLoading ? "…" : Number(usage?.total?.paid ?? 0).toLocaleString()}
          unit={isAr ? "رسالة" : "msg"}
          c={C}
          hint={isAr ? "ردود خدمة العملاء خلال 24 ساعة مجانيّة" : "Service replies within 24h are free"}
        />
        <Tile
          label={isAr ? "تكلفة Meta" : "Meta cost"}
          value={isLoading ? "…" : money(usage?.total?.cost)}
          unit=""
          c={C}
          accent={Number(usage?.total?.cost ?? 0) > 0 ? "#10b981" : undefined}
        />
      </div>

      {categories.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {categories.map((c) => {
            const label = CATEGORY_LABELS[c.category];
            return (
              <div key={c.category} style={{ fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: C.t2 }}>{label ? (isAr ? label.ar : label.en) : c.category}</span>
                  <span style={{ fontWeight: 600 }}>
                    {c.volume.toLocaleString()}
                    <span style={{ color: C.t3, fontWeight: 500, marginInlineStart: 8 }}>{money(c.cost)}</span>
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.inp, overflow: "hidden" }}>
                  <div style={{ width: `${(c.volume / maxVolume) * 100}%`, height: "100%", background: C.pri, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {daily.length > 1 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: C.t2, marginBottom: 6 }}>{isAr ? "الرسائل يوميّاً" : "Messages per day"}</div>
          <Sparkline data={daily} color={C.pri} width={280} height={40} />
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 10.5, color: C.t3 }}>
        {isAr
          ? "المصدر: 360dialog — الأرقام تقديريّة خلال الشهر وتتحدّث كل ساعة."
          : "Source: 360dialog — in-month figures are estimates, refreshed hourly."}
        {usage?.last_synced_at && (
          <span>
            {" "}
            {isAr ? "آخر تحديث:" : "Last update:"}{" "}
            {new Date(String(usage.last_synced_at).replace(" ", "T") + "Z").toLocaleString(isAr ? "ar-SA" : "en-US")}
          </span>
        )}
      </div>
    </Card>
  );
}

function Tile({ label, value, unit, c, accent, hint }: {
  label: string;
  value: string;
  unit: string;
  c: any;
  accent?: string;
  hint?: string;
}) {
  return (
    <div style={{ padding: 14, borderRadius: 10, background: c.inp, border: `1px solid ${c.brd}` }}>
      <div style={{ fontSize: 11, color: c.t2, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ?? c.txt, lineHeight: 1.1 }}>
        {value}
        {unit && <span style={{ fontSize: 11, fontWeight: 500, color: c.t3, marginInlineStart: 4 }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize: 10, color: c.t3, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
