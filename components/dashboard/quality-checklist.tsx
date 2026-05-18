"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Card } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import api from "@/lib/api/client";

type Metric = {
  key: string;
  label: string;
  value: string | number;
  status: "ok" | "warn" | "danger";
  hint: string;
};

type ChecklistResponse = {
  window_days: number;
  computed_at: string;
  metrics: Metric[];
};

const ICONS: Record<string, string> = {
  quality: "target",
  block_rate: "ban",
  rejected_templates: "text",
  opt_out_rate: "reply",
  open_rate: "eye",
  reply_rate: "msg",
};

/**
 * Daily 6-metric quality scoreboard from the team guide v2.0 §2.5.
 *
 * Pulls /api/dashboard/quality-checklist and renders a 3×2 grid of
 * status cards. Each card carries a colour (ok/warn/danger), value,
 * and a one-line hint with the next-step action.
 *
 * The card sits high on the dashboard so a supervisor's morning
 * standup can be "open dashboard, scan the colours, drill into
 * anything yellow or red".
 */
export function QualityChecklistWidget() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get("/dashboard/quality-checklist")
      .then((res) => {
        if (cancelled) return;
        setData((res.data?.data ?? res.data) as ChecklistResponse);
      })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const overall: "ok" | "warn" | "danger" = !data
    ? "ok"
    : data.metrics.some((m) => m.status === "danger")
      ? "danger"
      : data.metrics.some((m) => m.status === "warn")
        ? "warn"
        : "ok";

  const overallIcon = overall === "ok" ? "check" : overall === "warn" ? "alert" : "siren";
  const overallColor = overall === "ok" ? "#10b981" : overall === "warn" ? "#f59e0b" : "#ef4444";
  const overallText = overall === "ok"
    ? (isAr ? "حسابك بصحّة ممتازة" : "Account healthy")
    : overall === "warn"
      ? (isAr ? "بعض المؤشّرات تحتاج انتباه" : "Some metrics need attention")
      : (isAr ? "إجراء عاجل مطلوب" : "Urgent action required");

  return (
    <Card style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>
            {isAr ? "مؤشّرات صحّة الحساب اليوميّة" : "Daily Account Health"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: overallColor, display: "inline-flex" }}><Icon name={overallIcon} size={16} /></span>
            <span>{overallText}</span>
          </div>
        </div>
        {data && (
          <div style={{ fontSize: 11, color: C.t3 }}>
            {isAr ? `آخر ${data.window_days} أيام` : `Last ${data.window_days} days`}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: C.t2 }}>
          {isAr ? "جارٍ التحميل..." : "Loading..."}
        </div>
      )}

      {!loading && data && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
        }}>
          {data.metrics.map((m) => {
            const tone = m.status === "ok"
              ? { bg: "#10b98112", border: "#10b98140", fg: "#059669", dot: "#10b981", icon: "check" }
              : m.status === "warn"
                ? { bg: "#f59e0b12", border: "#f59e0b40", fg: "#92400e", dot: "#f59e0b", icon: "alert" }
                : { bg: "#ef444412", border: "#ef444440", fg: "#b91c1c", dot: "#ef4444", icon: "siren" };

            return (
              <div
                key={m.key}
                title={m.hint}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: tone.bg,
                  border: `1px solid ${tone.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ color: tone.fg, display: "inline-flex" }}><Icon name={ICONS[m.key] ?? "circle"} size={14} /></span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.t2, flex: 1, lineHeight: 1.3 }}>
                    {m.label}
                  </span>
                  <span style={{ color: tone.fg, display: "inline-flex" }}><Icon name={tone.icon} size={12} /></span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: tone.fg, lineHeight: 1.1 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 10.5, color: C.t3, marginTop: 6, lineHeight: 1.5 }}>
                  {m.hint}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
