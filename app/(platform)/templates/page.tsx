"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Button, Card, CardHeader, Badge, TabBar, SearchInput, Modal, Pagination } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { ProgressBar } from "@/components/charts/progress-bar";
import { WhatsAppPhonePreview } from "@/components/templates/whatsapp-phone-preview";
import { AiInsightsBar, type AiInsightCard } from "@/components/shared/ai-insights-bar";
import { getStatusColor } from "@/lib/utils/status-color";
import type { Template } from "@/data/templates";
import { useTemplates, useTemplateStats } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { COLORS } from "@/lib/constants/colors";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";

function templateStatusColor(status: string): string {
  if (status === "approved") return COLORS.ok;
  if (status === "pending") return COLORS.warn;
  if (status === "rejected") return COLORS.err;
  return "#555764";
}

export default function TemplatesPage() {
  const { colors: C } = useTheme();
  const { t, isAr, lang } = useLocale();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  const [search, setSearch] = useState("");
  const [serverSearch, setServerSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorDetailsTarget, setErrorDetailsTarget] = useState<any | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [previewLang, setPreviewLang] = useState<"ar" | "en">("ar");
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "utility" as string,
    language: "ar" as string,
    header: "",
    // Header media support (M5). The format drives which input the
    // operator sees; media_url is what we render in the preview;
    // meta_handle is what gets shipped to Meta when the template is
    // submitted. Upload status surfaces the deferred-upload state when
    // 360dialog/Meta App ID isn't yet wired up.
    header_format: "none" as "none" | "text" | "image" | "video" | "document",
    header_media_url: "" as string,
    header_media_disk: "" as string,
    header_media_path: "" as string,
    header_meta_handle: "" as string,
    header_upload_status: "" as "" | "ready" | "pending_handle" | "failed",
    header_upload_error: "" as string,
    body: "",
    body_ar: "",
    footer: "",
    buttons: [] as { text: string; type: string; value?: string }[],
    body_examples: [] as string[],
  });
  const [uploadingHeaderMedia, setUploadingHeaderMedia] = useState(false);

  // Detect {{n}} placeholders in the active body to decide how many
  // example inputs to show. Only counts unique indices.
  const activeBodyForVars = newTemplate.language === "en"
    ? newTemplate.body
    : newTemplate.body_ar || newTemplate.body;
  const bodyVarIndexes = Array.from(
    new Set(Array.from(activeBodyForVars.matchAll(/\{\{\s*(\d+)\s*\}\}/g), (m) => Number(m[1])))
  ).sort((a, b) => a - b);

  const PAGE_SIZE = 50;

  // Fetch from API, fall back to mock data
  const { data: apiResponse, isLoading, mutate } = useTemplates({
    status: activeTab === "all" ? undefined : activeTab,
    search: serverSearch || undefined,
    page,
  });
  // Extract data and pagination meta
  const apiTemplates = apiResponse?.data || apiResponse;
  const paginationMeta = apiResponse?.meta || apiResponse?.pagination || null;
  const paginationTotalCount = paginationMeta?.total || (Array.isArray(apiTemplates) ? apiTemplates.length : 0);
  const totalPages = paginationMeta?.last_page || Math.ceil(paginationTotalCount / PAGE_SIZE) || 1;

  // Map API fields: cat = category, ln = language, st = status
  const pageTemplates: Template[] = useMemo(() => {
    const list = Array.isArray(apiTemplates) ? apiTemplates : [];
    return list.map((t: any) => ({
      ...t,
      cat: t.cat || t.category || "",
      ln: t.ln || t.language || "",
      st: t.st || t.status || "",
      uses: t.uses ?? 0,
      open: t.open ?? 0,
      click: t.click ?? 0,
      sent: t.sent ?? 0,
      delivered: t.delivered ?? 0,
      read: t.read ?? 0,
      replied: t.replied ?? 0,
      aiScore: t.aiScore ?? t.ai_score ?? 0,
      aiTips: t.aiTips ?? t.ai_tips ?? [],
      buttons: t.buttons ?? [],
      vars: t.vars ?? [],
      header: t.header ?? "",
      footer: t.footer ?? "",
      body: t.body ?? "",
    }));
  }, [apiTemplates]);

  // Local search filter (instant, within current page)
  const templates: Template[] = useMemo(() => {
    if (!search.trim() || serverSearch === search) return pageTemplates;
    const q = search.trim().toLowerCase();
    return pageTemplates.filter(tmpl =>
      tmpl.name.toLowerCase().includes(q)
    );
  }, [pageTemplates, search, serverSearch]);

  // When tab changes, reset to page 1
  useEffect(() => { setPage(1); }, [activeTab]);

  // Auto-sync with 360dialog on mount + every 60s while the page is open.
  // Silent (no toast) — keeps the list fresh without nagging the user.
  useEffect(() => {
    let cancelled = false;
    const silentSync = async () => {
      try {
        await api.post('/templates/sync');
        if (!cancelled) mutate();
      } catch {
        // ignore — manual sync button is still available
      }
    };
    silentSync();
    const interval = setInterval(silentSync, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search: Enter key triggers server search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setServerSearch(search);
      setPage(1);
    }
  };

  const tabs = [
    { key: "all", label: isAr ? "\u0627\u0644\u0643\u0644" : "All" },
    { key: "marketing", label: t("mkt") },
    { key: "utility", label: t("util") },
    { key: "auth", label: t("authn") },
  ];

  const filtered = useMemo(() => {
    return templates.filter((tmpl) => {
      const matchTab =
        activeTab === "all" ||
        tmpl.cat === activeTab ||
        (activeTab === "auth" && tmpl.cat === "authentication");
      return matchTab;
    });
  }, [templates, activeTab]);

  // Stats from API, fall back to computed
  const { data: apiStats } = useTemplateStats();
  const totalCount = templates.length;
  const approvedCount = templates.filter((t) => t.st === "approved").length;
  const pendingCount = templates.filter((t) => t.st === "pending").length;
  const rejectedCount = templates.filter((t) => t.st === "rejected").length;

  const stats = useMemo(() => {
    const total = apiStats?.total ?? totalCount;
    const approved = apiStats?.approved ?? approvedCount;
    const pending = apiStats?.pending ?? pendingCount;
    const rejected = apiStats?.rejected ?? rejectedCount;
    return [
      { label: isAr ? "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A" : "Total", value: total, color: C.pri, icon: "file" },
      { label: t("approved"), value: approved, color: COLORS.ok, icon: "check" },
      { label: t("pending"), value: pending, color: COLORS.warn, icon: "timer" },
      { label: t("rejected"), value: rejected, color: COLORS.err, icon: "x" },
    ];
  }, [apiStats, totalCount, approvedCount, pendingCount, rejectedCount, isAr, C.pri, t]);

  const categoryLabel = (cat: string) => {
    if (cat === "marketing") return t("mkt");
    if (cat === "utility") return t("util");
    if (cat === "authentication") return t("authn");
    return cat;
  };

  const categoryColor = (cat: string) => {
    if (cat === "marketing") return C.sec;
    if (cat === "utility") return C.info;
    if (cat === "authentication") return COLORS.ai;
    return C.t2;
  };

  // ---------- Detail View ----------
  if (selected) {
    const tmpl = selected;
    const sColor = templateStatusColor(tmpl.st);
    const deliveryRate = tmpl.sent > 0 ? Math.round((tmpl.delivered / tmpl.sent) * 100) : 0;
    const readRate = tmpl.sent > 0 ? Math.round((tmpl.read / tmpl.sent) * 100) : 0;
    const replyRate = tmpl.sent > 0 ? Math.round((tmpl.replied / tmpl.sent) * 100) : 0;

    const perfStats = [
      { label: isAr ? "\u0645\u0631\u0633\u0644\u0629" : "Sent", value: tmpl.sent.toLocaleString(), color: C.pri },
      { label: isAr ? "\u0645\u0633\u0644\u0651\u0645\u0629" : "Delivered", value: tmpl.delivered.toLocaleString(), pct: deliveryRate, color: COLORS.ok },
      { label: isAr ? "\u0645\u0642\u0631\u0648\u0621\u0629" : "Read", value: tmpl.read.toLocaleString(), pct: readRate, color: C.info },
      { label: isAr ? "\u0631\u062F\u0648\u062F" : "Replied", value: tmpl.replied.toLocaleString(), pct: replyRate, color: COLORS.ai },
    ];

    const aiScoreColor =
      tmpl.aiScore >= 80 ? COLORS.ok : tmpl.aiScore >= 60 ? COLORS.warn : COLORS.err;

    // Build WhatsApp preview body with highlighted variables
    const highlightVars = (text: string) => {
      const parts = text.split(/(\{\{[^}]+\}\})/g);
      return parts.map((p, i) =>
        /\{\{[^}]+\}\}/.test(p) ? (
          <span key={i} style={{ borderRadius: 4, padding: "0 3px", fontWeight: 600, background: `${C.pri}30`, color: C.pri }}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      );
    };

    return (
      <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY, direction: isAr ? "rtl" : "ltr" }}>
        {/* Back button */}
        <button
          onClick={() => setSelected(null)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            color: C.pri,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 20,
            padding: 0,
            fontFamily: FONT_FAMILY,
          }}
        >
          <span style={{ display: "inline-block", transform: isAr ? "rotate(180deg)" : "none" }}><Icon name="send" size={14} /></span>
          {t("back")}
        </button>

        {/* Template info header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.txt }}>{tmpl.name}</h2>
          <Badge color={categoryColor(tmpl.cat)}>{categoryLabel(tmpl.cat)}</Badge>
          <Badge color={sColor}>{tmpl.st === "approved" ? t("approved") : tmpl.st === "pending" ? t("pending") : t("rejected")}</Badge>
          <span style={{ fontSize: 12, color: C.t2 }}>{tmpl.ln}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "340px 1fr", gap: 20 }}>
          {/* WhatsApp Phone Mockup */}
          <div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {/* Phone top bar */}
              <div style={{ background: "#075E54", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Icon name="phone" size={14} />
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>WhatsBit</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}>
                    {isAr ? "\u0645\u062A\u0635\u0644" : "Online"}
                  </div>
                </div>
              </div>

              {/* Chat background */}
              <div style={{ background: "#ECE5DD", padding: "20px 14px", minHeight: 320, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                {/* Message bubble */}
                <div style={{ background: "#DCF8C6", borderRadius: "12px 12px 12px 0", padding: "8px 12px", maxWidth: "88%", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                  {/* Header */}
                  {tmpl.header && (
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1A1A1A", marginBottom: 4 }}>
                      {highlightVars(tmpl.header)}
                    </div>
                  )}
                  {/* Body */}
                  <div style={{ fontSize: 12.5, color: "#303030", lineHeight: 1.5 }}>
                    {highlightVars(tmpl.body)}
                  </div>
                  {/* Footer */}
                  {tmpl.footer && (
                    <div style={{ fontSize: 11, color: "#8B8B8B", marginTop: 6 }}>
                      {tmpl.footer}
                    </div>
                  )}
                  {/* Timestamp */}
                  <div style={{ fontSize: 10, color: "#8B8B8B", textAlign: "right", marginTop: 4 }}>
                    12:00 PM
                  </div>
                </div>

                {/* Buttons */}
                {tmpl.buttons.length > 0 && (
                  <div style={{ marginTop: 4, maxWidth: "88%" }}>
                    {tmpl.buttons.map((btn, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#fff",
                          padding: "8px 12px",
                          textAlign: "center",
                          color: "#00A5F4",
                          fontSize: 12.5,
                          fontWeight: 600,
                          borderTop: "1px solid #E8E8E8",
                          borderRadius: i === tmpl.buttons.length - 1 ? "0 0 8px 8px" : 0,
                        }}
                      >
                        {btn.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone bottom bar */}
              <div style={{ background: "#F0F0F0", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, background: "#fff", borderRadius: 20, padding: "8px 14px", fontSize: 12, color: "#999" }}>
                  {isAr ? "\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u0629..." : "Type a message..."}
                </div>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Icon name="send" size={14} />
                </div>
              </div>
            </Card>
          </div>

          {/* Right column - Performance & AI */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Performance Stats */}
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14.5, fontWeight: 600, color: C.txt }}>
                {isAr ? "\u0627\u0644\u0623\u062F\u0627\u0621" : "Performance"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
                {perfStats.map((s, i) => (
                  <div
                    key={i}
                    style={{ padding: 14, borderRadius: 12, textAlign: "center", background: `${s.color}10` }}
                  >
                    <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    {s.pct !== undefined && (
                      <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{s.pct}%</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Score */}
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14.5, fontWeight: 600, color: C.txt }}>
                {isAr ? "\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A" : "AI Score"}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
                {/* Score circle */}
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: `${aiScoreColor}15`,
                    border: `3px solid ${aiScoreColor}`,
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 700, color: aiScoreColor }}>
                    {tmpl.aiScore}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: C.txt }}>
                    {tmpl.aiScore >= 80
                      ? isAr ? "\u0645\u0645\u062A\u0627\u0632" : "Excellent"
                      : tmpl.aiScore >= 60
                        ? isAr ? "\u062C\u064A\u062F" : "Good"
                        : isAr ? "\u064A\u062D\u062A\u0627\u062C \u062A\u062D\u0633\u064A\u0646" : "Needs Improvement"}
                  </div>
                  <ProgressBar value={tmpl.aiScore} color={aiScoreColor} />
                </div>
              </div>

              {/* AI Tips */}
              {tmpl.aiTips.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 8 }}>
                    {isAr ? "\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0627\u0644\u062A\u062D\u0633\u064A\u0646" : "Improvement Tips"}
                  </div>
                  {tmpl.aiTips.map((tip, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: `${COLORS.ai}1A`,
                        fontSize: 12,
                        color: C.txt,
                        marginBottom: i < tmpl.aiTips.length - 1 ? 6 : 0,
                      }}
                    >
                      <Icon name="zap" size={13} />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Template Meta */}
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14.5, fontWeight: 600, color: C.txt }}>
                {isAr ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0642\u0627\u0644\u0628" : "Template Details"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                {[
                  [t("cat"), categoryLabel(tmpl.cat)],
                  [t("lng"), tmpl.ln],
                  [t("status"), tmpl.st === "approved" ? t("approved") : tmpl.st === "pending" ? t("pending") : t("rejected")],
                  [isAr ? "\u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0627\u062A" : "Uses", tmpl.uses.toLocaleString()],
                  [isAr ? "\u0645\u0639\u062F\u0644 \u0627\u0644\u0641\u062A\u062D" : "Open Rate", `${tmpl.open}%`],
                  [isAr ? "\u0645\u0639\u062F\u0644 \u0627\u0644\u0646\u0642\u0631" : "Click Rate", `${tmpl.click}%`],
                ].map(([label, value], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.brdL}` }}>
                    <span style={{ color: C.t2 }}>{label}</span>
                    <span style={{ fontWeight: 600, color: C.txt }}>{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ---------- List View ----------
  return (
    <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY, direction: isAr ? "rtl" : "ltr" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.txt }}>{t("templates")}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            outline
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              try {
                const res = await api.post('/templates/sync');
                const n = res?.data?.data?.synced ?? 0;
                showToast(isAr ? `\u062A\u0645\u062A \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 (${n} \u0642\u0627\u0644\u0628)` : `Synced ${n} templates`);
                mutate();
              } catch (err: any) {
                const msg = err?.response?.data?.message || (isAr ? "\u0641\u0634\u0644\u062A \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629" : "Sync failed");
                showToast(msg);
              } finally {
                setSyncing(false);
              }
            }}
          >
            <Icon name="refresh" size={14} />
            {syncing ? (isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629..." : "Syncing...") : (isAr ? "\u0645\u0632\u0627\u0645\u0646\u0629" : "Sync")}
          </Button>
          <Button primary onClick={() => { setNewTemplate({ name: "", category: "utility", language: "ar", header: "", header_format: "none", header_media_url: "", header_media_disk: "", header_media_path: "", header_meta_handle: "", header_upload_status: "", header_upload_error: "", body: "", body_ar: "", footer: "", buttons: [], body_examples: [] }); setPreviewLang("ar"); setShowCreateModal(true); }}>
            <Icon name="file" size={14} />
            {t("createTmpl")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        {(stats as any[]).map((s: any, i: number) => (
          <Card key={i} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${s.color}15`,
                  color: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={s.icon} size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.t2 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.txt }}>{s.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div style={{ flex: 1, minWidth: 180, maxWidth: 320 }}>
          <SearchInput value={search} onChange={setSearch} onKeyDown={handleSearchKeyDown} placeholder={isAr ? "بحث بالاسم... (Enter للبحث)" : "Search by name... (Enter to search)"} />
        </div>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <Card style={{ padding: 48 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <div style={{ textAlign: "center", color: C.t2 }}>
              <Icon name="timer" size={32} />
              <p style={{ marginTop: 12, fontSize: 14 }}>{isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." : "Loading..."}</p>
            </div>
          </div>
        </Card>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {filtered.map((tmpl) => {
          const sColor = templateStatusColor(tmpl.st);
          return (
            <Card
              key={tmpl.id}
              onClick={() => setSelected(tmpl)}
              style={{ padding: 0, cursor: "pointer", transition: "box-shadow 0.15s" }}
            >
              {/* Card top */}
              <div style={{ padding: "16px 20px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 6, color: C.txt }}>{tmpl.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Badge color={categoryColor(tmpl.cat)}>{categoryLabel(tmpl.cat)}</Badge>
                      <span
                        onClick={(e) => {
                          if (tmpl.st === "rejected") {
                            e.stopPropagation();
                            setErrorDetailsTarget(tmpl);
                          }
                        }}
                        style={{ cursor: tmpl.st === "rejected" ? "pointer" : "default" }}
                        title={tmpl.st === "rejected" ? (isAr ? "\u0639\u0631\u0636 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0631\u0641\u0636" : "View rejection details") : undefined}
                      >
                        <Badge color={sColor}>
                          {tmpl.st === "approved" ? t("approved") : tmpl.st === "pending" ? t("pending") : t("rejected")}
                        </Badge>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(tmpl);
                    }}
                    title={isAr ? "\u062D\u0630\u0641" : "Delete"}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "#EF444412", color: "#EF4444",
                      border: `1px solid #EF444430`, cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
                <div style={{ fontSize: 11.5, color: C.t2, marginTop: 4 }}>
                  {t("lng")}: {tmpl.ln}
                </div>
                {tmpl.st === "rejected" && (tmpl as any).rejection_reason && (
                  <div
                    onClick={(e) => { e.stopPropagation(); setErrorDetailsTarget(tmpl); }}
                    style={{ fontSize: 11, color: "#EF4444", marginTop: 6, lineHeight: 1.5, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
                  >
                    {isAr ? "\u0633\u0628\u0628 \u0627\u0644\u0631\u0641\u0636:" : "Reason:"} {(tmpl as any).rejection_reason}
                  </div>
                )}
                {/* Pending media handle \u2014 Meta upload didn't complete on
                    create. Show a yellow notice + a retry button. */}
                {(tmpl as any).header_upload_status === "pending_handle" && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: 11, marginTop: 8, padding: "8px 10px",
                      borderRadius: 8, background: "#f59e0b15", border: "1px solid #f59e0b40",
                      color: "#92400e", lineHeight: 1.5, display: "flex",
                      alignItems: "center", gap: 8, flexWrap: "wrap",
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      \u26a0\ufe0f {isAr ? "\u0648\u0633\u0627\u0626\u0637 \u0627\u0644\u0640 header \u0644\u0645 \u062a\u064f\u0631\u0641\u0639 \u0644\u0640 Meta \u0628\u0639\u062f" : "Header media not uploaded to Meta yet"}
                    </span>
                    <Button
                      outline
                      onClick={async () => {
                        try {
                          await api.post(`/templates/${tmpl.id}/retry-header-upload`);
                          showToast(isAr ? "\u062a\u0645\u0651 \u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641 \u0628\u0646\u062c\u0627\u062d\u060c \u0627\u0644\u0642\u0627\u0644\u0628 \u0623\u064f\u0631\u0633\u0644 \u0644\u0640 Meta" : "Upload succeeded, template submitted to Meta");
                          mutate();
                        } catch (err: any) {
                          const msg = err?.response?.data?.message || (isAr ? "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0631\u0641\u0639 \u0641\u0634\u0644\u062a" : "Retry failed");
                          showToast(msg);
                        }
                      }}
                    >
                      {isAr ? "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629" : "Retry upload"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Card metrics */}
              <div style={{ padding: "10px 20px 14px", borderTop: `1px solid ${C.brdL}`, display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.t2 }}>{isAr ? "\u0627\u0633\u062A\u062E\u062F\u0627\u0645" : "Uses"}</div>
                  <div style={{ fontWeight: 700, marginTop: 2, color: C.txt }}>{tmpl.uses.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.t2 }}>{isAr ? "\u0641\u062A\u062D" : "Open"}</div>
                  <div style={{ fontWeight: 700, marginTop: 2, color: COLORS.ok }}>{tmpl.open}%</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.t2 }}>{isAr ? "\u0646\u0642\u0631" : "Click"}</div>
                  <div style={{ fontWeight: 700, marginTop: 2, color: COLORS.info }}>{tmpl.click}%</div>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: C.t2, fontSize: 14 }}>
            {isAr ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u0642\u0648\u0627\u0644\u0628" : "No templates found"}
          </div>
        )}
      </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} totalItems={paginationTotalCount} onPageChange={setPage} />

      {/* AI Insights — derived locally from the loaded page so we
          don't need a dedicated insights endpoint. */}
      {(() => {
        const allTemplates = pageTemplates as any[];
        if (!allTemplates || allTemplates.length === 0) return null;
        const approved = allTemplates.filter((t) => t.status === "approved");
        const rejected = allTemplates.filter((t) => t.status === "rejected");
        const pending = allTemplates.filter((t) => t.status === "pending");
        // Best performer = highest open rate among approved with stats.
        const withStats = approved.filter((t) => typeof t.open_rate === "number" || typeof t.openRate === "number");
        const sortedByOpen = [...withStats].sort((a, b) => (Number(b.open_rate ?? b.openRate ?? 0)) - (Number(a.open_rate ?? a.openRate ?? 0)));
        const top = sortedByOpen[0];
        const cards: AiInsightCard[] = [];
        if (top) {
          const rate = Number(top.open_rate ?? top.openRate ?? 0);
          cards.push({
            icon: "🏆",
            title: isAr ? "أعلى أداء" : "Top Performer",
            value: rate ? `${rate.toFixed(1)}%` : undefined,
            caption: isAr
              ? `${top.name} يحقّق أعلى نسبة فتح هذا الشهر`
              : `${top.name} has the highest open rate this month`,
            cta: isAr ? "كرّر بناه في قالب جديد" : "Replicate in a new template",
            tone: "ok",
          });
        }
        if (rejected.length > 0) {
          cards.push({
            icon: "⚠️",
            title: isAr ? "قوالب مرفوضة" : "Rejected Templates",
            value: rejected.length,
            caption: isAr
              ? "تحتاج مراجعة قبل إعادة التقديم لـ Meta"
              : "Need review before re-submitting to Meta",
            cta: isAr ? "افتح تفاصيل الرفض" : "View rejection details",
            tone: "err",
          });
        }
        if (pending.length > 0) {
          cards.push({
            icon: "⏳",
            title: isAr ? "قيد المراجعة" : "Pending Review",
            value: pending.length,
            caption: isAr
              ? "Meta تستغرق 24-48 ساعة عادةً"
              : "Meta typically reviews within 24-48h",
            tone: "warn",
          });
        } else if (approved.length >= 5) {
          cards.push({
            icon: "💡",
            title: isAr ? "اقتراح" : "Suggestion",
            caption: isAr
              ? "أضف قالب CSAT لقياس رضا العملاء بعد كل محادثة"
              : "Add a CSAT template to measure satisfaction after each chat",
            cta: isAr ? "أنشئ قالب جديد" : "Create new template",
            tone: "pri",
          });
        }
        return <AiInsightsBar cards={cards} title={isAr ? "تحليل قوالبك" : "Templates Insights"} />;
      })()}

      {/* ── Rejection Details Modal ── */}
      <Modal
        open={!!errorDetailsTarget}
        onClose={() => setErrorDetailsTarget(null)}
        title={isAr ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0631\u0641\u0636" : "Rejection details"}
        hideFooter
        wide
      >
        <div style={{ padding: "4px 0" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.t2, marginBottom: 4 }}>{isAr ? "\u0627\u0644\u0642\u0627\u0644\u0628" : "Template"}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{errorDetailsTarget?.name}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.t2, marginBottom: 4 }}>{isAr ? "\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062E\u0637\u0623" : "Error message"}</div>
            <div style={{ fontSize: 13, color: "#EF4444", padding: "10px 12px", borderRadius: 8, background: "#EF444410", border: "1px solid #EF444430" }}>
              {errorDetailsTarget?.rejection_reason ?? "—"}
            </div>
          </div>

          {errorDetailsTarget?.provider_error_details && (
            <>
              {errorDetailsTarget.provider_error_details.status && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: C.t2, marginBottom: 4 }}>{isAr ? "\u062d\u0627\u0644\u0629 HTTP" : "HTTP Status"}</div>
                  <div style={{ fontSize: 13, fontFamily: "monospace" }}>{errorDetailsTarget.provider_error_details.status}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, color: C.t2, marginBottom: 4 }}>{isAr ? "\u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0645\u0646 \u0627\u0644\u0645\u0632\u0648\u0651\u062F" : "Full provider response"}</div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontFamily: "monospace",
                    padding: "12px 14px",
                    borderRadius: 8,
                    background: C.inp,
                    border: `1px solid ${C.brd}`,
                    color: C.t2,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    direction: "ltr",
                    maxHeight: 300,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(errorDetailsTarget.provider_error_details.raw ?? errorDetailsTarget.provider_error_details, null, 2)}
                </pre>
              </div>
            </>
          )}

          {!errorDetailsTarget?.provider_error_details && (
            <div style={{ fontSize: 12, color: C.t3, textAlign: "center", padding: 14 }}>
              {isAr ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0641\u0627\u0635\u064A\u0644 \u0625\u0636\u0627\u0641\u064A\u0629 \u0645\u062D\u0641\u0648\u0638\u0629. \u0623\u0639\u062F \u0627\u0644\u062A\u0642\u062F\u064A\u0645 \u0644\u062A\u0638\u0647\u0631 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0647\u0646\u0627." : "No additional details saved. Resubmit to capture the latest response here."}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Delete Template Confirmation Modal ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deletingTemplate && setDeleteTarget(null)}
        title={isAr ? "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0630\u0641" : "Confirm Delete"}
        submitLabel={deletingTemplate ? (isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062D\u0630\u0641..." : "Deleting...") : (isAr ? "\u0646\u0639\u0645\u060C \u0627\u062D\u0630\u0641" : "Yes, Delete")}
        submitDisabled={deletingTemplate}
        onSubmit={async () => {
          if (!deleteTarget) return;
          setDeletingTemplate(true);
          try {
            await api.delete(`/templates/${deleteTarget.id}`);
            showToast(isAr ? "\u062A\u0645 \u0627\u0644\u062D\u0630\u0641 \u2713" : "Deleted \u2713");
            mutate();
            setDeleteTarget(null);
          } catch (err: any) {
            const msg = err?.response?.data?.message || (isAr ? "\u0641\u0634\u0644 \u0627\u0644\u062D\u0630\u0641" : "Failed to delete");
            showToast(msg);
          } finally {
            setDeletingTemplate(false);
          }
        }}
      >
        <div style={{ padding: "8px 4px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, borderRadius: 12, background: "#EF444410", border: `1px solid #EF444430` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EF444418", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="x" size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {isAr ? `\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0630\u0641 \u0627\u0644\u0642\u0627\u0644\u0628 "${deleteTarget?.name}"\u061F` : `Delete template "${deleteTarget?.name}"?`}
              </div>
              <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>
                {isAr ? "\u0633\u064A\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0642\u0627\u0644\u0628 \u0645\u0646 \u0627\u0644\u0645\u0646\u0635\u0629. \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621." : "The template will be removed from the platform. This action cannot be undone."}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Create Template Modal ── */}
      <Modal
        open={showCreateModal}
        onClose={() => !creatingTemplate && setShowCreateModal(false)}
        title={isAr ? "إنشاء قالب" : "Create Template"}
        wide
        submitLabel={creatingTemplate ? (isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0625\u0644\u0649 Meta..." : "Submitting to Meta...") : (isAr ? "إنشاء القالب" : "Create Template")}
        submitDisabled={creatingTemplate}
        submitLoading={creatingTemplate}
        onSubmit={async () => {
          if (creatingTemplate) return;
          if (!newTemplate.name.trim()) {
            showToast(isAr ? "يرجى إدخال اسم القالب" : "Please enter template name");
            return;
          }
          const ln = newTemplate.language;
          const needsBody = ln === "en" || ln === "ar+en";
          const needsBodyAr = ln === "ar" || ln === "ar+en";
          if (needsBody && !newTemplate.body.trim()) {
            showToast(isAr ? "يرجى إدخال نص القالب بالإنجليزية" : "Please enter English body");
            return;
          }
          if (needsBodyAr && !newTemplate.body_ar.trim()) {
            showToast(isAr ? "يرجى إدخال نص القالب بالعربية" : "Please enter Arabic body");
            return;
          }
          if (newTemplate.body.length > 1024 || newTemplate.body_ar.length > 1024) {
            showToast(isAr ? "النص يتجاوز 1024 حرف" : "Body exceeds 1024 characters");
            return;
          }
          const payload: Record<string, any> = {
            name: newTemplate.name,
            category: newTemplate.category,
            language: newTemplate.language,
          };
          if (ln === "ar") {
            payload.body = newTemplate.body_ar;
          } else if (ln === "en") {
            payload.body = newTemplate.body;
          } else {
            payload.body = newTemplate.body;
            payload.body_ar = newTemplate.body_ar;
          }
          // Header: pick the path that matches the chosen format. We
          // never send a stale field (e.g. text + media_url at the
          // same time) so the backend never has to guess.
          if (newTemplate.header_format === "text" && newTemplate.header.trim()) {
            payload.header_format = "text";
            payload.header        = newTemplate.header;
          } else if (
            (newTemplate.header_format === "image" || newTemplate.header_format === "video" || newTemplate.header_format === "document")
            && newTemplate.header_media_url
          ) {
            payload.header_format       = newTemplate.header_format;
            payload.header_media_url    = newTemplate.header_media_url;
            payload.header_media_disk   = newTemplate.header_media_disk;
            payload.header_media_path   = newTemplate.header_media_path;
            if (newTemplate.header_meta_handle) {
              payload.header_meta_handle = newTemplate.header_meta_handle;
            }
          } else {
            payload.header_format = "none";
          }
          if (newTemplate.footer.trim()) payload.footer = newTemplate.footer;
          if (newTemplate.buttons.length > 0) payload.buttons = newTemplate.buttons;

          setCreatingTemplate(true);
          try {
            await api.post("/templates", payload);
            showToast(isAr ? "تم إنشاء القالب بنجاح" : "Template created successfully");
            setShowCreateModal(false);
            setNewTemplate({ name: "", category: "utility", language: "ar", header: "", header_format: "none", header_media_url: "", header_media_disk: "", header_media_path: "", header_meta_handle: "", header_upload_status: "", header_upload_error: "", body: "", body_ar: "", footer: "", buttons: [], body_examples: [] });
            mutate();
          } catch (err: any) {
            const msg = err?.response?.data?.message || (isAr ? "حدث خطأ" : "Error occurred");
            showToast(msg);
          } finally {
            setCreatingTemplate(false);
          }
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 24 }}>
          {/* Left: Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "65vh", overflowY: "auto", paddingInlineEnd: 8 }}>

            {/* Template Name */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "اسم القالب" : "Template Name"} <span style={{ color: COLORS.err }}>*</span>
              </label>
              <input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder={isAr ? "مثال: رسالة ترحيب" : "e.g. Welcome Message"}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Category & Language Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  {isAr ? "الفئة" : "Category"} <span style={{ color: COLORS.err }}>*</span>
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => {
                    const next = e.target.value;
                    setNewTemplate((prev) => {
                      // Suggest an unsubscribe footer the first time the
                      // user picks MARKETING — Meta expects marketing
                      // templates to give recipients a way out.
                      const needsFooter = next === "marketing" && !prev.footer;
                      return {
                        ...prev,
                        category: next,
                        footer: needsFooter
                          ? (isAr ? "لإيقاف الرسائل، أرسل \"إلغاء\"" : "Reply STOP to unsubscribe")
                          : prev.footer,
                      };
                    });
                  }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                >
                  <option value="utility">{isAr ? "خدمي" : "Utility"} (خدمي)</option>
                  <option value="marketing">{isAr ? "تسويقي" : "Marketing"} (تسويقي)</option>
                  <option value="authentication">{isAr ? "مصادقة" : "Authentication"} (مصادقة)</option>
                </select>
                {newTemplate.category === "marketing" && (
                  <div style={{ marginTop: 6, fontSize: 11, color: C.t2, lineHeight: 1.6, padding: "8px 10px", borderRadius: 8, background: `${COLORS.warn}12`, border: `1px solid ${COLORS.warn}30` }}>
                    {isAr
                      ? "سياسة Meta: القوالب التسويقية يجب أن تتضمن طريقة لإلغاء الاشتراك. تم تعبئة حقل التذييل تلقائياً، يمكنك تعديله."
                      : "Meta policy: marketing templates must include an opt-out method. A default footer was added — feel free to edit."}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  {isAr ? "اللغة" : "Language"} <span style={{ color: COLORS.err }}>*</span>
                </label>
                <select
                  value={newTemplate.language}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewTemplate({ ...newTemplate, language: val });
                    if (val === "ar") setPreviewLang("ar");
                    else if (val === "en") setPreviewLang("en");
                    else setPreviewLang("ar");
                  }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
                >
                  <option value="ar">{isAr ? "عربي" : "Arabic"} (عربي)</option>
                  <option value="en">English</option>
                  <option value="ar+en">{isAr ? "عربي + English" : "Arabic + English"} (عربي + English)</option>
                </select>
              </div>
            </div>

            {/* Header — type picker + per-type input */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>
                {isAr ? "العنوان (Header)" : "Header"}
                <span style={{ fontSize: 11, fontWeight: 400, color: C.t3, marginInlineStart: 6 }}>
                  ({isAr ? "اختياري" : "optional"})
                </span>
              </label>

              {/* 5-button picker — none / text / image / video / document */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 10 }}>
                {([
                  { key: "none",     emoji: "🚫", labelAr: "بدون",     labelEn: "None"     },
                  { key: "text",     emoji: "📝", labelAr: "نصّ",       labelEn: "Text"     },
                  { key: "image",    emoji: "🖼️", labelAr: "صورة",     labelEn: "Image"    },
                  { key: "video",    emoji: "🎥", labelAr: "فيديو",    labelEn: "Video"    },
                  { key: "document", emoji: "📄", labelAr: "ملف",      labelEn: "Document" },
                ] as const).map((opt) => {
                  const selected = newTemplate.header_format === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setNewTemplate((prev) => ({
                        ...prev,
                        header_format: opt.key,
                        // Clear cross-type fields when switching so a stale
                        // image preview doesn't linger on a text header.
                        header: opt.key === "text" ? prev.header : "",
                        header_media_url: opt.key === "text" || opt.key === "none" ? "" : prev.header_media_url,
                        header_media_disk: opt.key === "text" || opt.key === "none" ? "" : prev.header_media_disk,
                        header_media_path: opt.key === "text" || opt.key === "none" ? "" : prev.header_media_path,
                        header_meta_handle: opt.key === "text" || opt.key === "none" ? "" : prev.header_meta_handle,
                        header_upload_status: opt.key === "text" || opt.key === "none" ? "" : prev.header_upload_status,
                        header_upload_error: opt.key === "text" || opt.key === "none" ? "" : prev.header_upload_error,
                      }))}
                      style={{
                        padding: "8px 6px", borderRadius: 8,
                        border: `1.5px solid ${selected ? C.pri : C.brd}`,
                        background: selected ? `${C.pri}12` : "transparent",
                        color: selected ? C.pri : C.txt,
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{opt.emoji}</span>
                      <span>{isAr ? opt.labelAr : opt.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* TEXT header — keep existing behaviour */}
              {newTemplate.header_format === "text" && (
                <input
                  value={newTemplate.header}
                  onChange={(e) => setNewTemplate({ ...newTemplate, header: e.target.value })}
                  placeholder={newTemplate.language === "ar" ? "مثال: أهلاً وسهلاً!" : "e.g. Welcome!"}
                  dir={newTemplate.language === "ar" ? "rtl" : "ltr"}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }}
                />
              )}

              {/* MEDIA headers — file upload + preview */}
              {(newTemplate.header_format === "image" || newTemplate.header_format === "video" || newTemplate.header_format === "document") && (
                <div>
                  <input
                    type="file"
                    accept={
                      newTemplate.header_format === "image" ? "image/jpeg,image/png" :
                      newTemplate.header_format === "video" ? "video/mp4,video/3gpp" :
                      "application/pdf"
                    }
                    disabled={uploadingHeaderMedia}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingHeaderMedia(true);
                      try {
                        const fd = new FormData();
                        fd.append("format", newTemplate.header_format);
                        fd.append("file", file);
                        const res = await api.post("/templates/upload-header-media", fd, {
                          headers: { "Content-Type": "multipart/form-data" },
                        });
                        const data = res.data?.data ?? res.data;
                        setNewTemplate((prev) => ({
                          ...prev,
                          header_media_url:    data.media_url ?? "",
                          header_media_disk:   data.media_disk ?? "",
                          header_media_path:   data.media_path ?? "",
                          header_meta_handle:  data.meta_handle ?? "",
                          header_upload_status: data.upload_status ?? "ready",
                          header_upload_error:  data.upload_error ?? "",
                        }));
                        showToast(
                          data.upload_status === "ready"
                            ? (isAr ? "تمّ رفع الملف بنجاح" : "File uploaded successfully")
                            : (isAr ? "تمّ حفظ الملف، الرفع لـ Meta سيُحاوَل لاحقاً" : "File saved, Meta upload deferred"),
                        );
                      } catch (err: any) {
                        const msg = err?.response?.data?.message
                          || (isAr ? "فشل الرفع، حاول مرّة أخرى" : "Upload failed, please retry");
                        showToast(msg);
                      } finally {
                        setUploadingHeaderMedia(false);
                        // Reset the input so picking the same file again re-fires onChange
                        e.target.value = "";
                      }
                    }}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: `1px dashed ${C.brd}`, background: C.inp, color: C.txt,
                      fontSize: 12, fontFamily: FONT_FAMILY, cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  />

                  {/* Helper line */}
                  <div style={{ fontSize: 10.5, color: C.t3, marginTop: 6, lineHeight: 1.5 }}>
                    {newTemplate.header_format === "image" && (isAr ? "JPEG / PNG · حدّ أقصى 5 ميجا" : "JPEG / PNG · max 5 MB")}
                    {newTemplate.header_format === "video" && (isAr ? "MP4 / 3GP · حدّ أقصى 16 ميجا" : "MP4 / 3GP · max 16 MB")}
                    {newTemplate.header_format === "document" && (isAr ? "PDF · حدّ أقصى 100 ميجا" : "PDF · max 100 MB")}
                  </div>

                  {/* Upload state */}
                  {uploadingHeaderMedia && (
                    <div style={{ fontSize: 11.5, color: C.t2, marginTop: 8 }}>
                      ⏳ {isAr ? "جارٍ الرفع..." : "Uploading..."}
                    </div>
                  )}

                  {/* Preview pane — appears once a URL exists */}
                  {newTemplate.header_media_url && !uploadingHeaderMedia && (
                    <div style={{
                      marginTop: 10, padding: 10, borderRadius: 10,
                      border: `1px solid ${C.brd}`, background: C.inp,
                    }}>
                      {newTemplate.header_format === "image" && (
                        <img src={newTemplate.header_media_url} alt="header preview" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, display: "block" }} />
                      )}
                      {newTemplate.header_format === "video" && (
                        <video src={newTemplate.header_media_url} controls style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8, display: "block" }} />
                      )}
                      {newTemplate.header_format === "document" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 24 }}>📄</span>
                          <a href={newTemplate.header_media_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.pri, textDecoration: "underline" }}>
                            {isAr ? "معاينة الملف" : "Preview file"}
                          </a>
                        </div>
                      )}

                      {/* Status badge */}
                      <div style={{ marginTop: 8, fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                        {newTemplate.header_upload_status === "ready" && (
                          <span style={{ color: COLORS.ok, fontWeight: 600 }}>✓ {isAr ? "جاهز للإرسال إلى Meta" : "Ready to ship to Meta"}</span>
                        )}
                        {newTemplate.header_upload_status === "pending_handle" && (
                          <div style={{ flex: 1, padding: "8px 10px", borderRadius: 6, background: "#f59e0b15", border: "1px solid #f59e0b40", color: "#92400e", fontSize: 11, lineHeight: 1.5 }}>
                            ⚠️ {isAr
                              ? "الملف محفوظ، لكن الرفع لـ Meta لم يكتمل. سيتمّ حفظ القالب كمسوّدة محليّاً، وسيُحاوَل الرفع لاحقاً عند تفعيل التكامل."
                              : "File saved, but Meta upload didn't complete. Template will save as a local draft and we'll retry the Meta upload once the integration is configured."}
                            {newTemplate.header_upload_error && (
                              <div style={{ marginTop: 4, fontSize: 10, opacity: 0.85 }}>
                                {newTemplate.header_upload_error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Arabic Body ── */}
            {(newTemplate.language === "ar" || newTemplate.language === "ar+en") && (
              <div>
                {newTemplate.language === "ar+en" && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.pri, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: `${C.pri}18`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.pri }}>ع</span>
                    {isAr ? "النص العربي" : "Arabic Body"}
                  </div>
                )}
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  {newTemplate.language === "ar+en" ? (isAr ? "نص القالب (عربي)" : "Body (Arabic)") : (isAr ? "نص القالب" : "Body")} <span style={{ color: COLORS.err }}>*</span>
                  <span style={{ fontWeight: 400, fontSize: 11, color: C.t3, marginInlineStart: 6 }}>
                    {isAr ? "استخدم {{1}} {{2}} للمتغيرات" : "Use {{1}} {{2}} for variables"}
                  </span>
                </label>
                <textarea
                  value={newTemplate.body_ar}
                  onChange={(e) => {
                    if (e.target.value.length <= 1024) setNewTemplate({ ...newTemplate, body_ar: e.target.value });
                  }}
                  placeholder={isAr ? "مرحباً {{1}}! شكراً لانضمامك لمتجرنا..." : "مرحباً {{1}}! شكراً لانضمامك..."}
                  rows={4}
                  dir="rtl"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11 }}>
                  <span style={{ color: newTemplate.body_ar.length > 950 ? COLORS.err : C.t3 }}>{newTemplate.body_ar.length} / 1024</span>
                  <span style={{ color: C.t3, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ background: `${C.pri}20`, color: C.pri, borderRadius: 4, padding: "1px 5px", fontWeight: 600, fontSize: 10 }}>
                      {(newTemplate.body_ar.match(/\{\{\d+\}\}/g) || []).length}
                    </span>
                    {isAr ? "متغيرات" : "variables"}
                  </span>
                </div>
              </div>
            )}

            {/* ── English Body ── */}
            {(newTemplate.language === "en" || newTemplate.language === "ar+en") && (
              <div>
                {newTemplate.language === "ar+en" && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.info, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: `${COLORS.info}18`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: COLORS.info }}>En</span>
                    {isAr ? "النص الإنجليزي" : "English Body"}
                  </div>
                )}
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  {newTemplate.language === "ar+en" ? (isAr ? "نص القالب (إنجليزي)" : "Body (English)") : (isAr ? "نص القالب" : "Body")} <span style={{ color: COLORS.err }}>*</span>
                  <span style={{ fontWeight: 400, fontSize: 11, color: C.t3, marginInlineStart: 6 }}>
                    Use {"{{1}}"} {"{{2}}"} for variables
                  </span>
                </label>
                <textarea
                  value={newTemplate.body}
                  onChange={(e) => {
                    if (e.target.value.length <= 1024) setNewTemplate({ ...newTemplate, body: e.target.value });
                  }}
                  placeholder="Hi {{1}}! Thanks for joining our store..."
                  rows={4}
                  dir="ltr"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11 }}>
                  <span style={{ color: newTemplate.body.length > 950 ? COLORS.err : C.t3 }}>{newTemplate.body.length} / 1024</span>
                  <span style={{ color: C.t3, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ background: `${C.pri}20`, color: C.pri, borderRadius: 4, padding: "1px 5px", fontWeight: 600, fontSize: 10 }}>
                      {(newTemplate.body.match(/\{\{\d+\}\}/g) || []).length}
                    </span>
                    variables
                  </span>
                </div>
              </div>
            )}

            {/* Footer (optional) */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "التذييل (اختياري)" : "Footer (optional)"}
              </label>
              <input
                value={newTemplate.footer}
                onChange={(e) => setNewTemplate({ ...newTemplate, footer: e.target.value })}
                placeholder={isAr ? "مثال: كوربت - شريك أعمالك" : "e.g. CORBIT - Your Business Partner"}
                dir={newTemplate.language === "ar" ? "rtl" : "ltr"}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Buttons (max 3) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: C.t2 }}>
                  {isAr ? "الأزرار" : "Buttons"} <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>({isAr ? "حد أقصى 3" : "max 3"})</span>
                </label>
                {newTemplate.buttons.length < 3 && (
                  <button
                    onClick={() => setNewTemplate({ ...newTemplate, buttons: [...newTemplate.buttons, { text: "", type: "url" }] })}
                    style={{ background: "transparent", border: "none", color: C.pri, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT_FAMILY, display: "flex", alignItems: "center", gap: 4 }}
                  >
                    + {isAr ? "إضافة زر" : "Add Button"}
                  </button>
                )}
              </div>
              {newTemplate.buttons.map((btn, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, padding: 10, border: `1px solid ${C.brd}`, borderRadius: 8, background: C.bg }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      value={btn.text}
                      onChange={(e) => {
                        const btns = [...newTemplate.buttons];
                        btns[i] = { ...btns[i], text: e.target.value.slice(0, 25) };
                        setNewTemplate({ ...newTemplate, buttons: btns });
                      }}
                      placeholder={isAr ? "نص الزر (حد أقصى 25 حرف)" : "Button label (max 25 chars)"}
                      maxLength={25}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${C.brd}`,
                        background: C.inp,
                        color: C.txt,
                        fontSize: 12.5,
                        fontFamily: FONT_FAMILY,
                        outline: "none",
                      }}
                    />
                    <select
                      value={btn.type}
                      onChange={(e) => {
                        const btns = [...newTemplate.buttons];
                        // Reset value when switching types so old data doesn't leak
                        btns[i] = { text: btns[i].text, type: e.target.value, value: "" };
                        setNewTemplate({ ...newTemplate, buttons: btns });
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1px solid ${C.brd}`,
                        background: C.inp,
                        color: C.txt,
                        fontSize: 12,
                        fontFamily: FONT_FAMILY,
                        outline: "none",
                        cursor: "pointer",
                        minWidth: 90,
                      }}
                    >
                      <option value="url">URL</option>
                      <option value="phone">{isAr ? "هاتف" : "Phone"}</option>
                      <option value="quick_reply">{isAr ? "رد سريع" : "Quick Reply"}</option>
                    </select>
                    <button
                      onClick={() => {
                        const btns = newTemplate.buttons.filter((_, idx) => idx !== i);
                        setNewTemplate({ ...newTemplate, buttons: btns });
                      }}
                      style={{ background: "transparent", border: "none", color: COLORS.err, cursor: "pointer", padding: 4, flexShrink: 0 }}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                  {btn.type === "url" && (
                    <input
                      value={btn.value || ""}
                      onChange={(e) => {
                        const btns = [...newTemplate.buttons];
                        btns[i] = { ...btns[i], value: e.target.value };
                        setNewTemplate({ ...newTemplate, buttons: btns });
                      }}
                      placeholder={isAr ? "الرابط (مثال: https://corbit.sa)" : "URL (e.g. https://corbit.sa)"}
                      type="url"
                      dir="ltr"
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${C.brd}`,
                        background: C.inp,
                        color: C.txt,
                        fontSize: 12.5,
                        fontFamily: FONT_FAMILY,
                        outline: "none",
                      }}
                    />
                  )}
                  {btn.type === "phone" && (
                    <input
                      value={btn.value || ""}
                      onChange={(e) => {
                        const btns = [...newTemplate.buttons];
                        btns[i] = { ...btns[i], value: e.target.value };
                        setNewTemplate({ ...newTemplate, buttons: btns });
                      }}
                      placeholder={isAr ? "رقم الجوال (مثال: +966500000000)" : "Phone (e.g. +966500000000)"}
                      type="tel"
                      dir="ltr"
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${C.brd}`,
                        background: C.inp,
                        color: C.txt,
                        fontSize: 12.5,
                        fontFamily: FONT_FAMILY,
                        outline: "none",
                      }}
                    />
                  )}
                </div>
              ))}
              {newTemplate.buttons.length === 0 && (
                <div style={{ fontSize: 11.5, color: C.t3, padding: "8px 0" }}>
                  {isAr ? "لم تتم إضافة أزرار بعد" : "No buttons added yet"}
                </div>
              )}
            </div>
          </div>

          {/* Right: Live WhatsApp Preview */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 10, textAlign: "center" }}>
              {isAr ? "معاينة واتساب" : "WhatsApp Preview"}
            </div>
            {/* Language Toggle for Preview */}
            {newTemplate.language === "ar+en" && (
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 8 }}>
                <button
                  onClick={() => setPreviewLang("ar")}
                  style={{
                    padding: "5px 18px", borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_FAMILY, border: "none", transition: "all 0.15s",
                    background: previewLang === "ar" ? C.pri : C.inp, color: previewLang === "ar" ? "#fff" : C.t2,
                  }}
                >
                  عربي
                </button>
                <button
                  onClick={() => setPreviewLang("en")}
                  style={{
                    padding: "5px 18px", borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_FAMILY, border: "none", transition: "all 0.15s",
                    background: previewLang === "en" ? C.pri : C.inp, color: previewLang === "en" ? "#fff" : C.t2,
                  }}
                >
                  English
                </button>
              </div>
            )}
            {(() => {
              const pLang = newTemplate.language === "ar" ? "ar" : newTemplate.language === "en" ? "en" : previewLang;
              const pBody = pLang === "ar" ? newTemplate.body_ar : newTemplate.body;
              const pHeader = newTemplate.header;
              const pFooter = newTemplate.footer;
              const isRtl = pLang === "ar";

              // Use the shared WhatsApp preview component — same visual
              // we'll plug into other places (template detail page, AI
              // builder draft preview). Keeping the legacy inline render
              // as a fall-back below for the exact phone-frame styling
              // operators are used to; the new component is rendered
              // first so once design signs off we can drop the legacy
              // block entirely.
              return (
                <div>
                  <WhatsAppPhonePreview
                    header={pHeader}
                    body={pBody}
                    footer={pFooter}
                    buttons={(newTemplate.buttons || []).map((b) => ({
                      text: b.text,
                      kind: b.type === "url" ? "url" : b.type === "phone" ? "phone" : "quick_reply",
                    }))}
                    rtl={isRtl}
                  />
                </div>
              );
            })()}
            {/* Legacy inline preview kept commented for the moment so
                we can A/B against the new component visually. Remove
                once design confirms the new one matches. */}
            {false && (() => {
              const pLang = newTemplate.language === "ar" ? "ar" : newTemplate.language === "en" ? "en" : previewLang;
              const pBody = pLang === "ar" ? newTemplate.body_ar : newTemplate.body;
              const pHeader = newTemplate.header;
              const pFooter = newTemplate.footer;
              const isRtl = pLang === "ar";
              const highlightPreviewVars = (text: string) => {
                const parts = text.split(/(\{\{\d+\}\})/g);
                return parts.map((p, idx) =>
                  /\{\{\d+\}\}/.test(p) ? (
                    <span key={idx} style={{ background: "#B6F5D0", borderRadius: 3, padding: "1px 4px", fontWeight: 600, color: "#075E54" }}>{p}</span>
                  ) : (
                    <span key={idx}>{p}</span>
                  )
                );
              };
              return (
            <div style={{ borderRadius: 20, background: "#ECE5DD", overflow: "hidden", border: "6px solid #222" }}>
              {/* WA Header bar */}
              <div style={{ background: "#075E54", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>W</div>
                <div>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>WhatsBit</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9 }}>{pLang === "ar" ? "متصل" : "Online"}</div>
                </div>
              </div>

              {/* Chat area */}
              <div style={{ padding: "16px 12px", minHeight: 220, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                {pBody ? (
                  <>
                    <div style={{ background: "#DCF8C6", borderRadius: "10px 10px 10px 0", padding: "8px 10px", maxWidth: "92%", boxShadow: "0 1px 2px rgba(0,0,0,0.08)", direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left" }}>
                      {pHeader && (
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#1A1A1A", marginBottom: 3 }}>{pHeader}</div>
                      )}
                      <div style={{ fontSize: 11.5, color: "#303030", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                        {highlightPreviewVars(pBody)}
                      </div>
                      {pFooter && (
                        <div style={{ fontSize: 9.5, color: "#8B8B8B", marginTop: 4 }}>{pFooter}</div>
                      )}
                      <div style={{ fontSize: 9, color: "#8B8B8B", textAlign: isRtl ? "left" : "right", marginTop: 3 }}>12:00 PM</div>
                    </div>
                    {newTemplate.buttons.length > 0 && (
                      <div style={{ maxWidth: "92%", marginTop: 3 }}>
                        {newTemplate.buttons.map((btn, bi) => (
                          <div key={bi} style={{
                            background: "#fff", padding: "7px 10px", textAlign: "center", color: "#00A5F4", fontSize: 11.5, fontWeight: 600,
                            borderTop: "1px solid #E8E8E8",
                            borderRadius: bi === newTemplate.buttons.length - 1 ? "0 0 8px 8px" : 0,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          }}>
                            {btn.type === "url" && <span style={{ fontSize: 10 }}>🔗</span>}
                            {btn.type === "phone" && <span style={{ fontSize: 10 }}>📞</span>}
                            {btn.type === "quick_reply" && <span style={{ fontSize: 10 }}>↩️</span>}
                            {btn.text || (isAr ? "نص الزر" : "Button text")}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center", color: "#999", fontSize: 12, padding: 20 }}>
                    {isAr ? "ابدأ بكتابة نص القالب لرؤية المعاينة" : "Start typing to see preview"}
                  </div>
                )}
              </div>

              {/* WA Bottom bar */}
              <div style={{ background: "#F0F0F0", padding: "8px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "6px 12px", fontSize: 11, color: "#999" }}>
                  {pLang === "ar" ? "اكتب رسالة..." : "Type a message..."}
                </div>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#128C7E", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Icon name="send" size={12} />
                </div>
              </div>
            </div>
              );
            })()}
          </div>
        </div>
      </Modal>
    </div>
  );
}
