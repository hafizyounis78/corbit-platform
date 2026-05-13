"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Card, Button, Badge, SearchInput } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { integrationCategories } from "@/data/integrations";
import { useIntegrations } from "@/lib/api/hooks";
import api from "@/lib/api/client";

export default function IntegrationsPage() {
  const { colors: C, isDark: dk } = useTheme();
  const { t, isAr, lang } = useLocale();
  const { showToast } = useToast();
  const isMob = useIsMobile();
  const ar = isAr;

  const [catTab, setCatTab] = useState("all");
  const [search, setSearch] = useState("");
  const [connected, setConnected] = useState<string[]>([]);
  const [connectedLoaded, setConnectedLoaded] = useState(false);
  const [viewApp, setViewApp] = useState<string | null>(null);

  /* ---------- API hook ---------- */
  const { data: apiIntegrations, isLoading, mutate } = useIntegrations({ category: catTab, search });

  // Load connected integrations from API once
  useEffect(() => {
    if (connectedLoaded) return;
    api.get("/integrations/connected").then((res) => {
      const ids = (res.data?.data || []).map((i: any) => i.id || i.integration_id);
      setConnected(ids);
      setConnectedLoaded(true);
    }).catch(() => setConnectedLoaded(true));
  }, [connectedLoaded]);

  // Also sync connected state from is_connected field in API integrations data
  useEffect(() => {
    if (!apiIntegrations?.length) return;
    const connectedFromApi = apiIntegrations
      .filter((a: any) => a.is_connected === true || a.connected === true)
      .map((a: any) => a.id || a.integration_id)
      .filter(Boolean);
    if (connectedFromApi.length > 0) {
      setConnected((prev) => {
        const merged = new Set([...prev, ...connectedFromApi]);
        return Array.from(merged);
      });
    }
  }, [apiIntegrations]);

  /* ---------- Resolved data (API only) ---------- */
  const apps = (Array.isArray(apiIntegrations) ? apiIntegrations : []).map((a: any) => ({
    ...a,
    cat: a.cat || a.category || "",
    name: ar ? (a.name_ar || a.name) : a.name,
    desc: ar ? (a.description_ar || a.description || a.desc) : (a.description || a.desc),
    icon: a.icon || "📦",
    color: a.color || C.pri,
    features: ar ? (a.features_ar || a.features || []) : (a.features || []),
    connected: a.connected ?? a.is_connected ?? false,
  }));
  const filtered = apps.filter((a: any) => (catTab === "all" || a.cat === catTab) && (!search || a.name.toLowerCase().includes(search.toLowerCase())));
  const isConnected = (id: string) => connected.includes(id);

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <p style={{ fontSize: 14, color: C.t2 }}>{ar ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..." : "Loading..."}</p>
      </div>
    );
  }

  if (viewApp) {
    const app = apps.find((a: any) => a.id === viewApp);
    if (!app) return null;
    const conn = isConnected(app.id);

    return (
      <div style={{ padding: "0 24px 24px" }}>
        <button
          onClick={() => setViewApp(null)}
          style={{ background: "none", border: "none", color: C.pri, fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14 }}
        >
          {ar ? "\u2190 \u0627\u0644\u0639\u0648\u062f\u0629" : "\u2190 Back"}
        </button>
        <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "2fr 1fr", gap: 16 }}>
          <div>
            <Card style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${app.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{app.icon}</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>{app.name}</h2>
                  <p style={{ margin: 0, fontSize: 12, color: C.t2 }}>{app.desc}</p>
                  <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                    <Badge color={C.warn}>{ar ? "\u0642\u0631\u064a\u0628\u0627\u064b" : "Coming Soon"}</Badge>
                  </div>
                </div>
                {/* Integrations are flagged "Coming Soon" until each
                    has a real connector wired to its provider \u2014 the
                    UI used to let operators click Connect on a placeholder
                    that did nothing visible, which created false
                    expectations. Disabled badge replaces the live
                    Connect/Disconnect controls until the integration ships. */}
                <Badge color={C.warn}>{ar ? "\u0642\u0631\u064a\u0628\u0627\u064b" : "Coming Soon"}</Badge>
              </div>
            </Card>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>{t("features")}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {app.features.map((f: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: C.inp, fontSize: 12 }}>
                    <span style={{ color: C.ok }}><Icon name="check" size={12} /></span>{f}
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card style={{ padding: 18, alignSelf: "start" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED", marginBottom: 10 }}>AI {ar ? "\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a" : "Tips"}</div>
            {(ar ? ["\u0631\u0628\u0637 \u0647\u0630\u0627 \u0627\u0644\u062a\u0637\u0628\u064a\u0642 \u064a\u0632\u064a\u062f \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a 15%", "\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u062a\u0635\u0644\u0648\u0646 \u062d\u0642\u0642\u0648\u0627 ROI \u0623\u0639\u0644\u0649"] : ["Connecting boosts sales 15%", "Connected customers see higher ROI"]).map((tip, i) => (
              <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: C.inp, marginBottom: 4, fontSize: 12 }}>
                {i === 0 ? "\ud83d\udca1" : "\ud83c\udfaf"} {tip}
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{t("integrations")}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>{ar ? "\u0627\u0631\u0628\u0637 \u0645\u0646\u0635\u062a\u0643 \u0645\u0639 \u0623\u062f\u0648\u0627\u062a\u0643" : "Connect with your tools"}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <SearchInput value={search} onChange={setSearch} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {integrationCategories.map((ct) => (
          <button
            key={ct.key}
            onClick={() => setCatTab(ct.key)}
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: catTab === ct.key ? `1.5px solid ${C.pri}` : `1.5px solid ${dk ? C.brd : "#D5D2CC"}`,
              background: catTab === ct.key ? `${C.pri}10` : "transparent",
              fontFamily: FONT_FAMILY,
              fontSize: 11,
              color: catTab === ct.key ? C.pri : C.t2,
              cursor: "pointer",
              fontWeight: catTab === ct.key ? 600 : 400,
            }}
          >
            {ar ? ct.labelAr : ct.labelEn}
          </button>
        ))}
      </div>
      {connected.length > 0 && (
        <div style={{ padding: "10px 16px", marginBottom: 14, borderRadius: 10, background: `${C.ok}08`, border: `1px solid ${C.ok}20`, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.ok }}><Icon name="check" size={12} /> {connected.length} {ar ? "\u0645\u062a\u0635\u0644\u0629" : "connected"}</span>
          <div style={{ display: "flex", gap: 3, marginInlineStart: "auto" }}>
            {connected.map((id) => { const a = apps.find((x: any) => x.id === id); return a ? <span key={id} onClick={() => setViewApp(id)} style={{ width: 28, height: 28, borderRadius: 7, background: `${a.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>{a.icon}</span> : null; })}
          </div>
        </div>
      )}
      {filtered.length === 0 && !isLoading && (
        <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
          {ar ? "لا توجد تكاملات" : "No integrations"}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {filtered.map((app: any) => {
          const conn = isConnected(app.id);
          return (
            <Card key={app.id} style={{ cursor: "pointer", border: conn ? `1.5px solid ${C.ok}30` : (app.id === "salla" ? `1.5px solid ${app.color}40` : "1.5px solid transparent") }} onClick={() => { if (app.id === "salla") { window.location.href = "/integrations/salla"; } else { setViewApp(app.id); } }}>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${app.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{app.icon}</div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{app.name}</span>
                      {app.popular && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: `${C.warn}15`, color: C.warn }}>⭐</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: C.t2 }}>{app.desc}</p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {/* Salla is the one integration that's actually live \u2014
                      it shows an Available badge + Connect CTA. Every
                      other integration is still Coming Soon. */}
                  {app.id === "salla" ? (
                    <>
                      <Badge color={C.ok}>{ar ? "\u0645\u062a\u0627\u062d" : "Available"}</Badge>
                      <span style={{ fontSize: 11, color: C.pri, fontWeight: 600 }}>
                        {ar ? "\u0627\u0631\u0628\u0637 \u0627\u0644\u0622\u0646 \u2192" : "Connect \u2192"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Badge color={C.warn}>{ar ? "\u0642\u0631\u064a\u0628\u0627\u064b" : "Coming Soon"}</Badge>
                      <span style={{ fontSize: 11, color: C.t3 }}>
                        {ar ? "\u0628\u0627\u0644\u0637\u0631\u064a\u0642" : "Soon"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
