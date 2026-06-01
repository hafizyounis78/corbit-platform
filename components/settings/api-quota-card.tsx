"use client";

/**
 * Live monthly API-quota meter for the Settings → API tab.
 *
 * Hits /api/settings/api-quota which reads the same cache key the
 * EnforceApiMonthlyQuota middleware writes to — so what the user
 * sees and what the gate enforces never disagree.
 *
 * Behaviour by plan:
 *   limit > 0   → progress bar + "X / Y this month"
 *   limit < 0   → unlimited badge ("Enterprise")
 *   limit === 0 → card hides itself (Basic — API access not in plan;
 *                 the API-keys section above already explains why).
 *
 * Polls every 60s so a tenant burning through their cap sees the
 * counter move without a refresh. Cheap — one GET, one cache read
 * on the backend.
 */

import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useApi } from "@/lib/api/hooks";

interface QuotaResponse {
  used: number;
  limit: number;       // -1 = unlimited, 0 = disabled
  remaining: number;
  percent: number;
  reset_at: string;
}

export function ApiQuotaCard() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  const { data, isLoading } = useApi<QuotaResponse>("/settings/api-quota", [], 60_000);

  if (isLoading || ! data) return null;
  if (data.limit === 0)   return null; // Basic — hide

  const unlimited = data.limit < 0;
  const pct       = data.percent ?? 0;

  // Colour band: green under 70, amber under 90, red at/above 90.
  // Mirrors the soft-warning thresholds we use elsewhere.
  const barColor = unlimited
    ? "#10b981"
    : pct >= 90 ? "#ef4444"
    : pct >= 70 ? "#f59e0b"
    : "#10b981";

  const resetDate = new Date(data.reset_at);
  const resetLabel = resetDate.toLocaleDateString(isAr ? "ar" : "en", {
    day: "numeric", month: "short",
  });

  return (
    <Card style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="chart" size={16} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: C.txt }}>
            {isAr ? "استخدام API الشهري" : "API monthly usage"}
          </span>
          {unlimited && (
            <Badge color="#10b981">
              {isAr ? "غير محدود" : "Unlimited"}
            </Badge>
          )}
        </div>
        <div style={{ fontSize: 12, color: C.t2 }}>
          {isAr ? "يُعاد ضبطه في " : "Resets "}
          <strong style={{ color: C.txt }}>{resetLabel}</strong>
        </div>
      </div>

      {unlimited ? (
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.7 }}>
          {isAr
            ? `لقد استخدمت ${data.used.toLocaleString("ar")} طلب هذا الشهر. باقتك تسمح بطلبات غير محدودة.`
            : `You've made ${data.used.toLocaleString()} requests this month. Your plan allows unlimited requests.`}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.t2 }}>
              {isAr ? "المستخدم هذا الشهر" : "Used this month"}
            </span>
            <span style={{ fontSize: 13, color: C.txt, fontFamily: "monospace", direction: "ltr" }}>
              <strong>{data.used.toLocaleString()}</strong>
              <span style={{ color: C.t3 }}> / {data.limit.toLocaleString()}</span>
              <span style={{ color: barColor, marginInlineStart: 8 }}>({pct}%)</span>
            </span>
          </div>
          <div style={{ height: 8, background: C.inp, borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: barColor,
              transition: "width 300ms ease-out",
            }} />
          </div>
          {pct >= 90 && (
            <div style={{ fontSize: 11.5, color: "#ef4444", marginTop: 8, lineHeight: 1.7 }}>
              {isAr
                ? `أوشكت على بلوغ السقف الشهري. عند الوصول إلى ${data.limit.toLocaleString()} طلب، سترجع الـ API بـ 429 حتى ${resetLabel}.`
                : `You're close to your monthly cap. At ${data.limit.toLocaleString()} requests, the API will return 429 until ${resetLabel}.`}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
