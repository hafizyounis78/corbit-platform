"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Card, Button, TabBar, Badge, Avatar } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { Donut } from "@/components/charts/donut";
import { Sparkline } from "@/components/charts/sparkline";
import { MiniBar } from "@/components/charts/mini-bar";
import { ProgressBar } from "@/components/charts/progress-bar";
import { FONT_FAMILY } from "@/lib/constants/font";
import { useAnalytics } from "@/lib/api/hooks";
import api from "@/lib/api/client";

export default function AnalyticsPage() {
  const { colors: C } = useTheme();
  const { t, isAr } = useLocale();
  const { showToast } = useToast();
  const isMob = useIsMobile();
  const [tab, setTab] = useState("overview");
  const [range, setRange] = useState("weekly");
  const ar = isAr;

  /* ---------- API hook ---------- */
  const { data: apiData, isLoading } = useAnalytics(tab, range);

  /* ---------- Resolved data (API only) ---------- */
  const kpis = (Array.isArray(apiData?.kpis) ? apiData.kpis : []).map((k: any) => ({
    ...k,
    value: k.value ?? "0",
    change: k.change ?? "0%",
    data: k.data ?? [],
  }));
  const categories = Array.isArray(apiData?.categories) ? apiData.categories : [];
  const hourlyData = Array.isArray(apiData?.hourlyData) ? apiData.hourlyData : [];
  const agents = Array.isArray(apiData?.agents) ? apiData.agents : [];

  // For conversations and ai tabs - map API response to expected format
  const convMetrics = apiData?.total !== undefined ? [
    [ar ? "إجمالي" : "Total", String(apiData.total ?? 0), C.pri],
    [ar ? "مفتوحة" : "Open", String(apiData.open ?? 0), C.warn],
    [ar ? "محلولة" : "Resolved", String(apiData.resolved ?? 0), C.ok],
    [ar ? "متوسط الرسائل" : "Avg Messages", String(apiData.avgPerDay ?? 0), C.info],
  ] : null;
  const satTrend = apiData?.trend ? apiData.trend.map((t: any) => t.value ?? 0) : null;
  const aiPerformance = apiData?.aiPerformance ?? null;
  const aiStats = apiData?.aiStats ?? null;

  const tabs = [
    { key: "overview", label: t("overview") },
    { key: "conversations", label: t("conv") },
    { key: "agents", label: t("agentPerf") },
    { key: "ai", label: "AI" },
  ];

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{t("analytics")}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>{ar ? "\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0623\u062f\u0627\u0621" : "Performance analytics"}</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <TabBar tabs={[{ key: "daily", label: t("daily") }, { key: "weekly", label: t("weekly") }, { key: "monthly", label: t("monthly") }]} active={range} onChange={setRange} />
          <Button outline small onClick={async () => {
            try {
              await api.post("/analytics/export", { tab, range, format: "csv" });
            } catch {}
            showToast("\u2713");
          }}>{t("expCSV")}</Button>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <p style={{ fontSize: 14, color: C.t2 }}>{ar ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..." : "Loading..."}</p>
        </div>
      )}

      {!isLoading && tab === "overview" && (
        <>
          {kpis.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
              {ar ? "لا توجد بيانات" : "No data"}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
            {kpis.map((k: any, i: number) => (
              <Card key={i} style={{ padding: 16 }}>
                <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 4 }}>{k.label}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>{k.value}</span>
                  <Sparkline data={k.data} color={k.color} width={60} height={24} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.ok }}>{k.change}</span>
              </Card>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{ar ? "\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0641\u0626\u0627\u062a" : "Category Distribution"}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Donut segments={categories.map((c: any) => ({ value: c.value, color: c.color }))} size={100} strokeWidth={12} />
                <div style={{ flex: 1 }}>
                  {categories.map((c: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: C.t2 }}>{c.name}</span>
                      <span style={{ fontWeight: 600 }}>{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{ar ? "\u0627\u0644\u062a\u0648\u0632\u064a\u0639 \u0628\u0627\u0644\u0633\u0627\u0639\u0629" : "Hourly Distribution"}</h3>
              <MiniBar data={hourlyData} color={C.pri} height={80} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: C.t3 }}>
                <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
              </div>
            </Card>
          </div>
        </>
      )}

      {!isLoading && tab === "conversations" && (
        <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{t("convMetrics")}</h3>
            {(convMetrics ?? [[ar ? "\u0625\u062c\u0645\u0627\u0644\u064a" : "Total", "0", C.pri], [ar ? "\u0645\u0641\u062a\u0648\u062d\u0629" : "Open", "0", C.warn], [ar ? "\u0645\u062d\u0644\u0648\u0644\u0629" : "Resolved", "0", C.ok], [ar ? "\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0631\u0633\u0627\u0626\u0644" : "Avg Messages", "0", C.info]] as const).map(([l, v, c]: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: C.inp, marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: C.t2 }}>{l}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
          </Card>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{t("satTrend")}</h3>
            <Sparkline data={satTrend ?? []} color={C.ok} width={280} height={80} />
            <div style={{ marginTop: 12, fontSize: 12, color: C.t2 }}>{ar ? "\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0631\u0636\u0627" : "Average CSAT"}</div>
          </Card>
        </div>
      )}

      {!isLoading && tab === "agents" && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{t("agentPerf")}</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: FONT_FAMILY }}>
              <thead>
                <tr>
                  {[t("agent"), t("status"), t("conv"), t("frt"), t("resTime"), t("csat"), ar ? "\u0627\u0644\u062d\u0645\u0644" : "Load"].map((h, i) => (
                    <th key={i} style={{ padding: "10px 14px", textAlign: "inherit", fontSize: 11.5, fontWeight: 600, color: C.t2, borderBottom: "1px solid " + C.brd }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((a: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid " + (C.brd + "60") }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={a.name} size={32} />
                        <span style={{ fontWeight: 600 }}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}><Badge color={a.st === "online" ? C.ok : a.st === "busy" ? C.warn : C.t3}>{a.st}</Badge></td>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>{a.convos}</td>
                    <td style={{ padding: "12px 14px" }}>{a.frt}</td>
                    <td style={{ padding: "12px 14px" }}>{a.res}</td>
                    <td style={{ padding: "12px 14px" }}><span style={{ fontWeight: 600, color: a.csat >= 95 ? C.ok : a.csat >= 90 ? C.warn : C.err }}>{a.csat}%</span></td>
                    <td style={{ padding: "12px 14px", width: 120 }}><ProgressBar value={a.load} color={a.load > 70 ? C.err : a.load > 50 ? C.warn : C.ok} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!isLoading && tab === "ai" && (
        <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{ar ? "\u0623\u062f\u0627\u0621 AI" : "AI Performance"}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
              <Donut segments={aiPerformance ?? [{ value: 0, color: C.ok }, { value: 0, color: C.warn }, { value: 0, color: C.err }]} size={90} strokeWidth={10} />
              <div style={{ fontSize: 12 }}>
                {(aiPerformance ? [[ar ? "\u0645\u0642\u0628\u0648\u0644\u0629" : "Accepted", `${aiPerformance[0]?.value ?? 0}%`, C.ok], [ar ? "\u0645\u0639\u062f\u0651\u0644\u0629" : "Modified", `${aiPerformance[1]?.value ?? 0}%`, C.warn], [ar ? "\u0645\u0631\u0641\u0648\u0636\u0629" : "Rejected", `${aiPerformance[2]?.value ?? 0}%`, C.err]] : [[ar ? "\u0645\u0642\u0628\u0648\u0644\u0629" : "Accepted", "0%", C.ok], [ar ? "\u0645\u0639\u062f\u0651\u0644\u0629" : "Modified", "0%", C.warn], [ar ? "\u0645\u0631\u0641\u0648\u0636\u0629" : "Rejected", "0%", C.err]] as const).map(([l, v, c]: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                    <span style={{ color: C.t2 }}>{l}</span>
                    <span style={{ fontWeight: 600, marginInlineStart: "auto" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{ar ? "\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a" : "Stats"}</h3>
            {(aiStats ?? [[ar ? "\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a \u0627\u0644\u064a\u0648\u0645" : "Today's Suggestions", "0"], [ar ? "\u0627\u0644\u062f\u0642\u0629" : "Accuracy", "0%"], [ar ? "\u0648\u0642\u062a \u0627\u0644\u062a\u0648\u0641\u064a\u0631" : "Time Saved", "0h"], [ar ? "\u0631\u0635\u064a\u062f \u0645\u062a\u0628\u0642\u064a" : "Credits Left", "0"]] as const).map(([l, v]: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: C.inp, marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: C.t2 }}>{l}</span>
                <span style={{ fontWeight: 700, color: "#7C3AED" }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
