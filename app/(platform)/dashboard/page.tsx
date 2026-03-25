"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { Card, CardHeader, Avatar } from "@/components/ui";
import { StatusDot } from "@/components/ui/status-dot";
import { Donut } from "@/components/charts/donut";
import { MiniBar } from "@/components/charts/mini-bar";
import { Icon } from "@/components/icons/icon";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useDashboardStats } from "@/lib/api/hooks";


export default function DashboardPage() {
  const { colors: C } = useTheme();
  const { t, isAr, lang } = useLocale();
  const { showToast } = useToast();
  const router = useRouter();
  const { data: apiData, isLoading: apiLoading } = useDashboardStats();

  /* ── Derive stat cards (API only) ──── */
  const stats: [string, string, string, string, number[]][] = [
    [
      t("totalConv"),
      apiData?.totalConversations?.value ?? "0",
      apiData?.totalConversations?.change ?? "0%",
      C.pri,
      apiData?.totalConversations?.sparkline ?? [],
    ],
    [
      t("activeAgents"),
      apiData?.activeAgents?.value ?? "0",
      apiData?.activeAgents?.change ?? "0",
      C.ok,
      apiData?.activeAgents?.sparkline ?? [],
    ],
    [
      t("avgResp"),
      apiData?.avgResponseTime?.value ?? `0 ${t("min")}`,
      apiData?.avgResponseTime?.change ?? "0%",
      C.info,
      apiData?.avgResponseTime?.sparkline ?? [],
    ],
    [
      t("campSent"),
      apiData?.campaignsSent?.value ?? "0",
      apiData?.campaignsSent?.change ?? "0",
      C.sec,
      apiData?.campaignsSent?.sparkline ?? [],
    ],
  ];

  /* ── Bottom stats (API only) ───────── */
  const slaValue = apiData?.sla?.value ?? 0;
  const slaDisplay = apiData?.sla?.display ?? "0%";
  const csatValue = apiData?.csat?.value ?? 0;
  const csatDisplay = apiData?.csat?.display ?? "0";
  const walletDisplay = apiData?.walletBalance?.display ?? "0";

  /* ── WhatsApp numbers ────────────────────────────── */
  const waNumbers = apiData?.whatsappNumbers ?? [];

  /* ── AI usage ────────────────────────────────────── */
  const aiSuggestions = apiData?.aiUsage?.suggestions ?? "0";
  const aiAccepted = apiData?.aiUsage?.accepted ?? "0%";
  const aiCredits = apiData?.aiUsage?.credits ?? "0";
  const aiDonut = apiData?.aiUsage?.donut ?? [0, 0, 0];

  /* ── Recent conversations ────────────────────────── */
  const recentConvos = apiData?.recentConversations ?? [];

  /* ── Loading state ───────────────────────────────── */
  if (apiLoading) {
    return (
      <div style={{ padding: "0 24px 24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: C.t2 }}>{isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." : "Loading dashboard..."}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 24px" }}>
      {/* Welcome Banner */}
      <div style={{ padding: "28px 32px", borderRadius: 16, background: GRADIENT, marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: 0, position: "relative" }}>{t("welcome")}</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", margin: "8px 0 0", fontSize: 14, position: "relative" }}>{t("tagline")}</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
        {stats.map(([lb, vl, ch, cl, data], i) => (
          <Card key={i} style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: C.t2, marginBottom: 6 }}>{lb}</div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{vl}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.ok, background: C.ok + "15", padding: "3px 8px", borderRadius: 8, height: "fit-content" }}>{ch}</span>
            </div>
            <MiniBar data={data} color={cl} />
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Recent Conversations */}
        <Card>
          <CardHeader title={t("recentConv")} actionLabel={t("viewAll")} onAction={() => router.push("/inbox")} />
          {recentConvos.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
              {isAr ? "لا توجد محادثات" : "No conversations"}
            </div>
          )}
          {recentConvos.map((c: any, i: number) => (
            <div
              key={i}
              onClick={() => router.push("/inbox")}
              style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < 3 ? "1px solid " + C.brdL : "none", cursor: "pointer" }}
            >
              <Avatar name={c.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: C.t3 }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 12, color: C.t2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{c.msg}</div>
              </div>
              {c.unread > 0 && (
                <span style={{ background: GRADIENT, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 10, padding: "2px 8px" }}>{c.unread}</span>
              )}
            </div>
          ))}
        </Card>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Quick Actions */}
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14.5, fontWeight: 600 }}>{t("quickAct")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([
                [t("newCamp"), C.pri],
                [t("newTmpl"), C.sec],
                [t("importCont"), C.ok],
                [t("addAgent"), C.info],
              ] as [string, string][]).map(([l, c2], i) => (
                <button
                  key={i}
                  onClick={() => showToast("\u2713")}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 10, background: c2 + "12", border: "none", cursor: "pointer", fontFamily: FONT_FAMILY, fontSize: 12.5, fontWeight: 600, color: c2 }}
                >
                  {l}
                </button>
              ))}
            </div>
          </Card>

          {/* WhatsApp Numbers */}
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14.5, fontWeight: 600 }}>{t("waNum")}</h3>
            {waNumbers.length === 0 && (
              <div style={{ padding: "10px 0", textAlign: "center", fontSize: 12, color: C.t2 }}>
                {isAr ? "لا توجد أرقام" : "No numbers"}
              </div>
            )}
            {waNumbers.map((n: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: C.inp, marginBottom: i === 0 ? 8 : 0 }}>
                <Icon name="phone" size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{isAr ? (n.labelAr ?? n.label) : n.label}</div>
                  <div style={{ fontSize: 12, color: C.t2, direction: "ltr" }}>{n.number}</div>
                </div>
                <StatusDot color={C.ok} label={t("connected")} />
              </div>
            ))}
          </Card>

          {/* AI Usage */}
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14.5, fontWeight: 600 }}>{t("aiUsage")}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Donut segments={[{ value: aiDonut[0], color: C.pri }, { value: aiDonut[1], color: C.sec }, { value: aiDonut[2], color: C.brd }]} size={80} strokeWidth={10} />
              <div style={{ flex: 1, fontSize: 12 }}>
                {([[t("aiSug"), aiSuggestions], [t("aiAcc"), aiAccepted], [t("aiCred"), aiCredits]] as [string, string][]).map(([l, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < 2 ? 8 : 0 }}>
                    <span style={{ color: C.t2 }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
        {([
          [t("sla"), slaValue, C.ok, slaDisplay],
          [t("csat"), csatValue, C.pri, csatDisplay],
          [t("wallet"), null, null, walletDisplay],
        ] as [string, number | null, string | null, string][]).map(([l, v, cl, disp], i) => (
          <Card key={i} style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.t2, marginBottom: 8 }}>{l}</div>
            {v != null ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <Donut segments={[{ value: v, color: cl! }, { value: 100 - v, color: C.brd }]} size={90} strokeWidth={8} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>{disp}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 16, background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{disp}</div>
                <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>{t("sar")}</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
