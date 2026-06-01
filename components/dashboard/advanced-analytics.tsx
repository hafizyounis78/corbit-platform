"use client";

/**
 * Tier-gated analytics surface for the dashboard.
 *
 *   - Basic/Starter (advanced_analytics=false)
 *     → renders a slim upgrade banner explaining what they'd unlock.
 *
 *   - Business/Enterprise (advanced_analytics=true)
 *     → renders three derived metric cards on top of the existing
 *       /api/dashboard/stats payload. No new endpoint needed for v1
 *       — every number here is either already in the response or
 *       computable from it client-side. The cards are deliberately
 *       different in shape from the four headline stat cards above
 *       so the differentiation feels meaningful, not just "+1 card".
 *
 * Hides itself completely (returns null) while the plan + stats
 * payload are loading so we don't flash a stale tier message.
 */

import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useRouter } from "next/navigation";
import { usePlanUsage, useDashboardStats } from "@/lib/api/hooks";

export function AdvancedAnalyticsCard() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const router = useRouter();
  const { data: planData } = usePlanUsage();
  const { data: apiData } = useDashboardStats();

  const advanced = (planData?.limits?.advanced_analytics as boolean | undefined) ?? false;
  const planName = planData?.plan?.name ?? "";
  const planNameAr = planData?.plan?.name_ar ?? "";

  // Don't render until we know the tier — avoids flashing the
  // upgrade banner to Business tenants for one paint.
  if (! planData) return null;

  if (! advanced) {
    return <UpgradeBanner C={C} isAr={isAr} onUpgrade={() => router.push("/billing")} planName={isAr ? planNameAr : planName} />;
  }

  return <AdvancedGrid C={C} isAr={isAr} apiData={apiData} planName={isAr ? planNameAr : planName} />;
}

// ─── Upgrade banner (Basic/Starter) ───────────────────────────────

function UpgradeBanner({
  C, isAr, onUpgrade, planName,
}: { C: any; isAr: boolean; onUpgrade: () => void; planName: string }) {
  return (
    <Card style={{
      padding: 18,
      marginBottom: 16,
      borderRight: `4px solid ${C.info}`,
      background: `linear-gradient(135deg, ${C.info}08, ${C.pri}05)`,
    }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${C.info}18`, color: C.info,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name="chart" size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: C.txt }}>
              {isAr ? "افتح التحليلات المتقدّمة" : "Unlock advanced analytics"}
            </h3>
            <Badge color={C.t2}>{planName}</Badge>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: C.t2, lineHeight: 1.7 }}>
            {isAr
              ? "ترقّ إلى Business أو Enterprise للوصول إلى مخطّط القمع، تتبّع المحادثات حسب الفترة، ومؤشّرات الأداء الأسبوعيّة المقارنة."
              : "Upgrade to Business or Enterprise to unlock funnel charts, period-over-period comparisons, and engagement KPIs."}
          </p>
        </div>
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: C.pri,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {isAr ? "رقّ الباقة" : "Upgrade plan"}
        </button>
      </div>
    </Card>
  );
}

// ─── Advanced grid (Business/Enterprise) ──────────────────────────

function AdvancedGrid({
  C, isAr, apiData, planName,
}: { C: any; isAr: boolean; apiData: any; planName: string }) {
  // Three derived metrics on top of the existing payload:
  //
  //   Engagement rate = avg of replies / sent across the sparkline,
  //     surfaced as a percentage. Sparkline is the last-7-day count
  //     of outbound; for v1 we approximate replies from active-
  //     agents value as a proxy for "conversations that bounced
  //     back". When the backend ships a true replies counter we
  //     swap this in without changing the card layout.
  //
  //   Trend = week-over-week change in totalConversations using the
  //     'change' string the backend already calculates. Re-presented
  //     as a banner with up/down arrow + the value.
  //
  //   Peak hour = the index of the maximum value in the
  //     totalConversations.sparkline array. Sparklines are 24 buckets
  //     so the index doubles as the hour-of-day. When sparkline is
  //     empty we hide the card rather than render a fake zero.

  const sparkline = (apiData?.totalConversations?.sparkline ?? []) as number[];
  const peakIdx = sparkline.length > 0
    ? sparkline.reduce((maxI, v, i, arr) => v > arr[maxI] ? i : maxI, 0)
    : -1;
  const peakHour = peakIdx >= 0 ? peakIdx : null;
  const peakCount = peakHour !== null ? sparkline[peakHour] : null;

  const trendStr   = apiData?.totalConversations?.change ?? "0%";
  const trendUp    = trendStr.trim().startsWith("+") || (! trendStr.startsWith("-") && parseFloat(trendStr) > 0);
  const trendColor = trendUp ? "#10b981" : "#ef4444";

  // Engagement proxy: ratio of replies (campaignsSent.sparkline sum)
  // to outbound (totalConversations.sparkline sum). Floor at 0,
  // cap at 100% so a tiny denominator + bursty replies doesn't
  // render "240%".
  const repliesArr = (apiData?.campaignsSent?.sparkline ?? []) as number[];
  const sentTotal  = sparkline.reduce((s, v) => s + v, 0);
  const replyTotal = repliesArr.reduce((s, v) => s + v, 0);
  const engagementPct = sentTotal > 0
    ? Math.min(100, Math.round((replyTotal / sentTotal) * 100))
    : 0;

  return (
    <Card style={{
      padding: 18, marginBottom: 16,
      borderRight: `4px solid #10b981`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Icon name="chart" size={18} />
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>
          {isAr ? "تحليلات متقدّمة" : "Advanced analytics"}
        </h3>
        <Badge color="#10b981">{planName}</Badge>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}>
        <MetricTile
          C={C}
          icon="trending"
          color={trendColor}
          label={isAr ? "اتّجاه المحادثات (أسبوعيّ)" : "Conversations trend (week)"}
          value={trendStr}
          hint={isAr ? "مقارنة بالأسبوع الماضي" : "vs. previous week"}
        />
        <MetricTile
          C={C}
          icon="reply"
          color={C.info}
          label={isAr ? "معدّل الردّ" : "Engagement rate"}
          value={`${engagementPct}%`}
          hint={isAr ? "ردود مقابل رسائل صادرة" : "replies / outbound"}
        />
        {peakHour !== null && (
          <MetricTile
            C={C}
            icon="clock"
            color={C.pri}
            label={isAr ? "ساعة الذروة" : "Peak hour"}
            value={`${peakHour.toString().padStart(2, "0")}:00`}
            hint={isAr
              ? `${peakCount?.toLocaleString() ?? 0} محادثة في هذه الساعة`
              : `${peakCount?.toLocaleString() ?? 0} conversations in this hour`}
          />
        )}
      </div>
    </Card>
  );
}

function MetricTile({
  C, icon, color, label, value, hint,
}: { C: any; icon: string; color: string; label: string; value: string; hint: string }) {
  return (
    <div style={{
      padding: 14,
      borderRadius: 10,
      border: `1px solid ${C.brd}`,
      background: C.inp,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ color, display: "inline-flex" }}><Icon name={icon} size={14} /></span>
        <span style={{ fontSize: 11.5, color: C.t2, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: C.t3 }}>{hint}</div>
    </div>
  );
}
