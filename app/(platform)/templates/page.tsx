"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { translateMetaError, extractMetaCode, hasMetaTechnicalDetails } from "@/lib/meta-error-translator";
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
  // Content-policy violations detected in the active template body.
  // Refreshed on body blur via /templates/content-check (cheap regex
  // server-side). Surfaces a red banner before submit so an operator
  // never wastes a 24h Meta review on a guaranteed rejection.
  const [contentReport, setContentReport] = useState<{
    has_violations: boolean;
    summary?: string;
    violations: { category: string; category_label: string; terms: string[]; message: string }[];
  } | null>(null);
  // Last successful sync timestamp — surfaced next to the Sync
  // button so the operator knows if the templates list is fresh.
  // Persists across browser reloads so a refresh doesn't reset it
  // to "—" until the next sync. localStorage is per-device which is
  // fine; cross-device freshness isn't a real requirement here.
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("corbit:templates:last-sync");
  });
  const [errorDetailsTarget, setErrorDetailsTarget] = useState<any | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
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
    header_media_filename: "" as string,
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

  // Refs for the body textareas so the inline format toolbar (B / I / S)
  // can wrap whatever the operator currently has selected. Keeping one
  // ref per language so each toolbar acts on its own field.
  const bodyArRef = useRef<HTMLTextAreaElement>(null);
  const bodyEnRef = useRef<HTMLTextAreaElement>(null);

  // Wrap the current selection of `ta` with `marker` on both sides
  // (e.g. * for bold). If nothing is selected we still insert the
  // markers and place the caret between them, mirroring how Word /
  // Notion / Slack toolbars feel. We avoid toggling logic on purpose —
  // WhatsApp's parser is strict and a partial unwrap from an arbitrary
  // selection would produce broken templates on send.
  const wrapSelection = (
    ta: HTMLTextAreaElement | null,
    marker: string,
    current: string,
    setter: (next: string) => void
  ) => {
    if (!ta) return;
    const start = ta.selectionStart ?? current.length;
    const end = ta.selectionEnd ?? current.length;
    const before = current.slice(0, start);
    const selected = current.slice(start, end);
    const after = current.slice(end);
    const next = `${before}${marker}${selected}${marker}${after}`;
    if (next.length > 1024) return; // honour the same length cap as onChange
    setter(next);
    // Restore the selection inside the wrappers so the operator can
    // keep typing / toggle another marker without re-selecting.
    requestAnimationFrame(() => {
      ta.focus();
      const s = start + marker.length;
      const e = end + marker.length;
      ta.setSelectionRange(s, e);
    });
  };

  // Detect {{n}} placeholders in the active body to decide how many
  // example inputs to show. Only counts unique indices.
  const activeBodyForVars = newTemplate.language === "en"
    ? newTemplate.body
    : newTemplate.body_ar || newTemplate.body;
  const bodyVarIndexes = Array.from(
    new Set(Array.from(activeBodyForVars.matchAll(/\{\{\s*(\d+)\s*\}\}/g), (m) => Number(m[1])))
  ).sort((a, b) => a - b);

  const PAGE_SIZE = 50;

  // Fetch from API. The tabs filter by CATEGORY (utility / marketing
  // / authentication), not by status — easy to confuse because the
  // backend exposes both as query params. Sending status=marketing
  // would always return zero rows since status only takes
  // approved/pending/rejected.
  const tabCategory = activeTab === "all"
    ? undefined
    : (activeTab === "auth" ? "authentication" : activeTab);
  const { data: apiResponse, isLoading, mutate } = useTemplates({
    category: tabCategory,
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
  const { data: apiStats, mutate: mutateStats } = useTemplateStats();
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
    // Same WhatsApp formatting pattern as the phone preview. Applied
    // to plain-text fragments so a *bold* word inside the saved body
    // shows the way the customer will actually see it on their phone,
    // not the raw asterisks.
    const fmtPattern = /(\*[^\s*][^*]*?[^\s*]\*|\*[^\s*]\*|_[^\s_][^_]*?[^\s_]_|_[^\s_]_|~[^\s~][^~]*?[^\s~]~|~[^\s~]~|`[^`]+`)/g;
    const renderFmt = (txt: string, kp: string) => {
      const segs = txt.split(fmtPattern);
      return segs.map((seg, i) => {
        if (!seg) return null;
        const k = `${kp}-${i}`;
        if (seg.startsWith("*") && seg.endsWith("*") && seg.length > 1) return <strong key={k}>{seg.slice(1, -1)}</strong>;
        if (seg.startsWith("_") && seg.endsWith("_") && seg.length > 1) return <em key={k}>{seg.slice(1, -1)}</em>;
        if (seg.startsWith("~") && seg.endsWith("~") && seg.length > 1) return <span key={k} style={{ textDecoration: "line-through" }}>{seg.slice(1, -1)}</span>;
        if (seg.startsWith("`") && seg.endsWith("`") && seg.length > 1) return <span key={k} style={{ fontFamily: "monospace", background: "rgba(0,0,0,0.06)", padding: "0 4px", borderRadius: 3 }}>{seg.slice(1, -1)}</span>;
        return <span key={k}>{seg}</span>;
      });
    };

    const highlightVars = (text: string) => {
      const parts = text.split(/(\{\{[^}]+\}\})/g);
      return parts.map((p, i) =>
        /\{\{[^}]+\}\}/.test(p) ? (
          <span key={i} style={{ borderRadius: 4, padding: "0 3px", fontWeight: 600, background: `${C.pri}30`, color: C.pri }}>
            {p}
          </span>
        ) : (
          <span key={i}>{renderFmt(p, `h${i}`)}</span>
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
                  {/* Media header (image/video/document) — render the actual file
                      so the operator sees what customers will see. Falls back to
                      a typed placeholder if the URL is missing or fails to load. */}
                  {(tmpl.header_format === "image" || tmpl.header_format === "video" || tmpl.header_format === "document") && (
                    <div style={{
                      width: "100%",
                      height: 120,
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "#C8E6C9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 6,
                      color: "#2E7D32",
                      fontSize: 11,
                      fontWeight: 600,
                      gap: 6,
                    }}>
                      {tmpl.header_media_url && tmpl.header_format === "image" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tmpl.header_media_url}
                          alt="header"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      {tmpl.header_media_url && tmpl.header_format === "video" && (
                        <video
                          src={tmpl.header_media_url}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          muted
                          playsInline
                          controls
                        />
                      )}
                      {tmpl.header_media_url && tmpl.header_format === "document" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <Icon name="file" size={28} />
                          <a href={tmpl.header_media_url} target="_blank" rel="noreferrer" style={{ color: "#075E54", fontSize: 10, textDecoration: "underline" }}>
                            {isAr ? "افتح المستند" : "Open document"}
                          </a>
                        </div>
                      )}
                      {!tmpl.header_media_url && (
                        <>
                          <Icon name={tmpl.header_format === "image" ? "image" : tmpl.header_format === "video" ? "video" : "file"} size={22} />
                          <span>
                            {tmpl.header_format === "image" ? (isAr ? "صورة" : "Image")
                              : tmpl.header_format === "video" ? (isAr ? "فيديو" : "Video")
                              : (isAr ? "مستند" : "Document")}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {/* Text header */}
                  {tmpl.header && tmpl.header_format !== "image" && tmpl.header_format !== "video" && tmpl.header_format !== "document" && (
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
          {/* Sync button + last-sync timestamp pair. The timestamp
              answers "is this list current or stale?" \u2014 operators
              were syncing repeatedly because they had no signal.
              Pulse animation while the request is in flight. */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastSyncAt && !syncing && (
              <span style={{ fontSize: 11, color: C.t3, whiteSpace: "nowrap" }} title={new Date(lastSyncAt).toLocaleString(isAr ? "ar-SA" : "en-US")}>
                {(() => {
                  const diff = Date.now() - new Date(lastSyncAt).getTime();
                  const mins = Math.round(diff / 60000);
                  if (mins < 1)  return isAr ? "\u0622\u062E\u0631 \u0645\u0632\u0627\u0645\u0646\u0629: \u0627\u0644\u0622\u0646" : "Synced just now";
                  if (mins < 60) return isAr ? `\u0622\u062E\u0631 \u0645\u0632\u0627\u0645\u0646\u0629: \u0642\u0628\u0644 ${mins} \u062F` : `Synced ${mins}m ago`;
                  const hrs = Math.round(mins / 60);
                  if (hrs < 24) return isAr ? `\u0622\u062E\u0631 \u0645\u0632\u0627\u0645\u0646\u0629: \u0642\u0628\u0644 ${hrs} \u0633` : `Synced ${hrs}h ago`;
                  const days = Math.round(hrs / 24);
                  return isAr ? `\u0622\u062E\u0631 \u0645\u0632\u0627\u0645\u0646\u0629: \u0642\u0628\u0644 ${days} \u064A\u0648\u0645` : `Synced ${days}d ago`;
                })()}
              </span>
            )}
            <Button
              outline
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                try {
                  const res = await api.post('/templates/sync');
                  const n = res?.data?.data?.synced ?? 0;
                  showToast(isAr ? `\u062A\u0645\u062A \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 (${n} \u0642\u0627\u0644\u0628)` : `Synced ${n} templates`);
                  const nowIso = new Date().toISOString();
                  setLastSyncAt(nowIso);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("corbit:templates:last-sync", nowIso);
                  }
                  mutate();
                } catch (err: any) {
                  const msg = err?.response?.data?.message || (isAr ? "\u0641\u0634\u0644\u062A \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629" : "Sync failed");
                  showToast(msg);
                } finally {
                  setSyncing(false);
                }
              }}
              style={syncing ? { opacity: 0.7 } : undefined}
            >
              <Icon name="refresh" size={14} />
              {syncing ? (isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629..." : "Syncing...") : (isAr ? "\u0645\u0632\u0627\u0645\u0646\u0629" : "Sync")}
            </Button>
          </div>
          <Button primary onClick={() => { setNewTemplate({ name: "", category: "utility", language: "ar", header: "", header_format: "none", header_media_url: "", header_media_disk: "", header_media_path: "", header_media_filename: "", header_meta_handle: "", header_upload_status: "", header_upload_error: "", body: "", body_ar: "", footer: "", buttons: [], body_examples: [] }); setPreviewLang("ar"); setShowCreateModal(true); }}>
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
                      {"\u26a0\ufe0f"} {isAr ? "\u0648\u0633\u0627\u0626\u0637 \u0627\u0644\u0640 header \u0644\u0645 \u062a\u064f\u0631\u0641\u0639 \u0644\u0640 Meta \u0628\u0639\u062f" : "Header media not uploaded to Meta yet"}
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
            icon: "award",
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
            icon: "alert",
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
            icon: "timer",
            title: isAr ? "قيد المراجعة" : "Pending Review",
            value: pending.length,
            caption: isAr
              ? "Meta تستغرق 24-48 ساعة عادةً"
              : "Meta typically reviews within 24-48h",
            tone: "warn",
          });
        } else if (approved.length >= 5) {
          cards.push({
            icon: "sparkles",
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
            <div style={{ fontSize: 12, color: C.t2, padding: "8px 12px", borderRadius: 8, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: "monospace", direction: "ltr", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {errorDetailsTarget?.rejection_reason ?? "—"}
            </div>
          </div>

          {/* Friendly explanation — translates Meta/internal payload
              into actionable Arabic. Sits ABOVE the technical block
              so the operator reads guidance before the JSON dump. */}
          <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 8, background: "#EF444410", border: "1.5px solid #EF444430" }}>
            <div style={{ fontSize: 12, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
              {isAr ? "تفسير الخطأ" : "What this means"}
            </div>
            <div style={{ fontSize: 13.5, color: "#B91C1C", lineHeight: 1.8, fontWeight: 500 }}>
              {translateMetaError(
                errorDetailsTarget?.provider_error_details?.raw ?? errorDetailsTarget?.provider_error_details ?? errorDetailsTarget?.rejection_reason,
                isAr,
              )}
            </div>
            {(() => {
              const code = extractMetaCode(errorDetailsTarget?.provider_error_details?.raw ?? errorDetailsTarget?.provider_error_details);
              return code !== null ? (
                <div style={{ fontSize: 10.5, color: C.t3, marginTop: 6, textAlign: isAr ? "left" : "right", fontFamily: "monospace" }}>
                  {isAr ? "رمز Meta:" : "Meta code:"} {code}
                </div>
              ) : null;
            })()}
          </div>

          {errorDetailsTarget?.provider_error_details && (
            <details>
              <summary style={{ cursor: "pointer", fontSize: 12, color: C.t2, padding: "4px 0", userSelect: "none" }}>
                {isAr ? "▸ تفاصيل تقنيّة (للدعم)" : "▸ Full technical details (for support)"}
              </summary>
              <div style={{ marginTop: 8 }}>
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
              </div>
            </details>
          )}

          {!errorDetailsTarget?.provider_error_details && (
            <div style={{ fontSize: 12, color: C.t3, textAlign: "center", padding: 14 }}>
              {isAr ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0641\u0627\u0635\u064A\u0644 \u0625\u0636\u0627\u0641\u064A\u0629 \u0645\u062D\u0641\u0648\u0638\u0629. \u0623\u0639\u062F \u0627\u0644\u062A\u0642\u062F\u064A\u0645 \u0644\u062A\u0638\u0647\u0631 \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0647\u0646\u0627." : "No additional details saved. Resubmit to capture the latest response here."}
            </div>
          )}

          {/* Resubmit rebuilds the payload from the stored template, so a
              rejection caused by how we submitted (rather than by the
              content) clears without retyping the whole template. */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Button
              disabled={resubmitting}
              onClick={async () => {
                if (!errorDetailsTarget || resubmitting) return;
                setResubmitting(true);
                try {
                  await api.post(`/templates/${errorDetailsTarget.id}/resubmit`);
                  showToast(isAr ? "\u062A\u0645\u0651\u062A \u0625\u0639\u0627\u062F\u0629 \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0642\u0627\u0644\u0628 \u0644\u0640 Meta" : "Template resubmitted to Meta");
                  setErrorDetailsTarget(null);
                  mutate();
                } catch (err: any) {
                  const msg = err?.response?.data?.message || (isAr ? "\u0641\u0634\u0644\u062A \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0642\u062F\u064A\u0645" : "Resubmit failed");
                  showToast(msg, "error");
                } finally {
                  setResubmitting(false);
                }
              }}
            >
              {resubmitting
                ? (isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u0625\u0631\u0633\u0627\u0644..." : "Submitting...")
                : (isAr ? "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0642\u062F\u064A\u0645 \u0644\u0640 Meta" : "Resubmit to Meta")}
            </Button>
          </div>
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
            // Revalidate both the list and the stat cards in one
            // pass so the counts at the top of the page don't lag
            // behind the grid below (used to flicker after focus).
            await Promise.all([mutate(), mutateStats()]);
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
          // Meta requires snake_case names — lowercase letters, digits,
          // and underscores only. Without this client-side gate, every
          // typo (capital letter, space, dash) was costing the operator
          // a 24-hour Meta-review round-trip just to find out the name
          // was malformed. Match the backend regex exactly.
          if (! /^[a-z0-9_]+$/.test(newTemplate.name.trim())) {
            showToast(
              isAr
                ? "اسم القالب يجب أن يحتوي على أحرف إنجليزيّة صغيرة وأرقام و _ فقط (مثال: order_confirmation)"
                : "Template name must contain only lowercase letters, digits, and underscores (e.g. order_confirmation)",
              "error",
            );
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
          // A bilingual template goes to Meta as two translations sharing a
          // name, and Meta rejects the pair unless both expose the same
          // variable slots. Catch it here rather than after the round-trip.
          if (ln === "ar+en") {
            const countVars = (text: string) =>
              new Set((text.match(/\{\{\s*\d+\s*\}\}/g) ?? []).map((v) => v.replace(/\D/g, ""))).size;
            const en = countVars(newTemplate.body);
            const ar = countVars(newTemplate.body_ar);
            if (en !== ar) {
              showToast(
                isAr
                  ? `عدد المتغيّرات يجب أن يتطابق بين اللغتين — الإنجليزي فيه ${en} والعربي فيه ${ar}.`
                  : `Variable count must match across both languages — English has ${en}, Arabic has ${ar}.`,
                "error",
              );
              return;
            }
          }
          // Final content-policy gate — re-run the check at submit
          // even if the operator already saw the warning. Blocks
          // submission entirely so a guaranteed-rejected template
          // never burns Meta's review queue.
          try {
            const bodyToScan = (newTemplate.body_ar || newTemplate.body || "").trim();
            if (bodyToScan) {
              const r = await api.post("/templates/content-check", { body: bodyToScan });
              const data = r.data?.data ?? r.data;
              if (data?.has_violations) {
                setContentReport(data);
                showToast(
                  isAr
                    ? "النصّ يحوي محتوى محظور من Meta. عدّل النصّ ثم حاول مرّة أخرى."
                    : "Body contains content prohibited by Meta. Edit and retry.",
                  "error",
                );
                return;
              }
              setContentReport(null);
            }
          } catch {
            // Content-check failure must NOT block the submit —
            // Meta will still review. Just log and continue.
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
            if (newTemplate.header_media_filename) {
              payload.header_media_filename = newTemplate.header_media_filename;
            }
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
            setNewTemplate({ name: "", category: "utility", language: "ar", header: "", header_format: "none", header_media_url: "", header_media_disk: "", header_media_path: "", header_media_filename: "", header_meta_handle: "", header_upload_status: "", header_upload_error: "", body: "", body_ar: "", footer: "", buttons: [], body_examples: [] });
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
                // Live-strip illegal chars and lowercase as the operator
                // types so they never end up with a name Meta will
                // reject. Spaces and dashes auto-convert to underscores.
                onChange={(e) => {
                  const cleaned = e.target.value
                    .toLowerCase()
                    .replace(/[\s-]+/g, "_")
                    .replace(/[^a-z0-9_]/g, "");
                  setNewTemplate({ ...newTemplate, name: cleaned });
                }}
                placeholder={isAr ? "مثال: order_confirmation" : "e.g. order_confirmation"}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ fontSize: 11, color: C.t3, marginTop: 6, lineHeight: 1.5 }}>
                {isAr
                  ? "💡 يقبل: أحرف إنجليزيّة صغيرة، أرقام، شرطة سفليّة فقط. Meta ترفض أيّ شيء آخر."
                  : "💡 Allowed: lowercase letters, digits, underscores only. Meta rejects anything else."}
              </div>
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
                {/* Authentication category — Meta has very strict
                    rules: buttons can't carry variables, no emojis in
                    body, content must be a one-time code prompt only.
                    Surfacing this BEFORE the operator submits saves
                    them a 24-hour rejection round-trip. The CSAT
                    template (corbit_csat) was rejected for exactly
                    this reason on 2026-05-05's external test. */}
                {newTemplate.category === "authentication" && (
                  <div style={{ marginTop: 6, fontSize: 11, color: C.t2, lineHeight: 1.6, padding: "8px 10px", borderRadius: 8, background: `${COLORS.err}12`, border: `1px solid ${COLORS.err}30`, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <span style={{ color: COLORS.err, marginTop: 1, display: "inline-flex", flexShrink: 0 }}><Icon name="alert" size={13} /></span>
                    <span>{isAr
                      ? "سياسة Meta لقوالب المصادقة: الأزرار لا تقبل متغيّرات أو ايموجي، النصّ يجب أن يحتوي رمز تحقّق فقط (مثل: {{1}} هو رمز التحقّق الخاصّ بك). أيّ تخصيص آخر سيؤدّي للرفض."
                      : "Meta auth-template policy: buttons cannot contain variables or emojis; body must be a verification code only (e.g. {{1}} is your verification code). Anything fancier gets rejected."}</span>
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
                  { key: "none",     icon: "ban",   labelAr: "بدون",     labelEn: "None"     },
                  { key: "text",     icon: "text",  labelAr: "نصّ",       labelEn: "Text"     },
                  { key: "image",    icon: "image", labelAr: "صورة",     labelEn: "Image"    },
                  { key: "video",    icon: "video", labelAr: "فيديو",    labelEn: "Video"    },
                  { key: "document", icon: "file",  labelAr: "ملف",      labelEn: "Document" },
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
                        header_media_filename: opt.key === "text" || opt.key === "none" ? "" : prev.header_media_filename,
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
                      <Icon name={opt.icon} size={16} />
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
                          // Preserve the operator's original filename so
                          // the recipient sees "Receipt.pdf" instead of
                          // "Untitled" on document headers. Backend returns
                          // it; we also fall back to the local File.name.
                          header_media_filename: data.media_filename ?? file.name ?? "",
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
                          <Icon name="file" size={24} />
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
                          <div style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#f59e0b15", border: "1px solid #f59e0b40", color: "#92400e", fontSize: 12, lineHeight: 1.7 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                              <Icon name="alert" size={14} />
                              <span>{isAr ? "تكامل Meta لم يُفعَّل بعد" : "Meta integration not yet configured"}</span>
                            </div>
                            <div>
                              {isAr
                                ? "الملف محفوظ بالفعل في حسابك. القالب يُحفظ كـ مسوَّدة وسنعيد محاولة الرفع لـ Meta تلقائياً بعد ما يضيف الأدمن مفاتيح الـ App."
                                : "File saved successfully in your account. Template will be saved as a draft and we'll retry the Meta upload automatically once the admin configures the App keys."}
                            </div>
                            {newTemplate.header_upload_error && (
                              <details style={{ marginTop: 8 }}>
                                <summary style={{ cursor: "pointer", fontSize: 10.5, opacity: 0.7, userSelect: "none" }}>
                                  {isAr ? "▸ تفاصيل تقنيّة (للدعم)" : "▸ Technical details (for support)"}
                                </summary>
                                <div style={{ marginTop: 4, fontSize: 10, opacity: 0.85, fontFamily: "monospace", direction: "ltr", textAlign: "left", padding: "4px 6px", borderRadius: 4, background: "#00000010", wordBreak: "break-word" }}>
                                  {newTemplate.header_upload_error}
                                </div>
                              </details>
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
                {/* WhatsApp formatting toolbar — wraps the current
                    selection with the marker characters Meta accepts.
                    Mirrored above the English body field below. */}
                <div style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="button" title={isAr ? "عريض" : "Bold"} onClick={() => wrapSelection(bodyArRef.current, "*", newTemplate.body_ar, (v) => setNewTemplate({ ...newTemplate, body_ar: v }))} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>B</button>
                  <button type="button" title={isAr ? "مائل" : "Italic"} onClick={() => wrapSelection(bodyArRef.current, "_", newTemplate.body_ar, (v) => setNewTemplate({ ...newTemplate, body_ar: v }))} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, cursor: "pointer", fontStyle: "italic", fontSize: 13 }}>I</button>
                  <button type="button" title={isAr ? "مشطوب" : "Strikethrough"} onClick={() => wrapSelection(bodyArRef.current, "~", newTemplate.body_ar, (v) => setNewTemplate({ ...newTemplate, body_ar: v }))} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, cursor: "pointer", textDecoration: "line-through", fontSize: 13 }}>S</button>
                  <button type="button" title={isAr ? "كود" : "Monospace"} onClick={() => wrapSelection(bodyArRef.current, "`", newTemplate.body_ar, (v) => setNewTemplate({ ...newTemplate, body_ar: v }))} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, cursor: "pointer", fontFamily: "monospace", fontSize: 13 }}>{"<>"}</button>
                  <span style={{ fontSize: 10.5, color: C.t3, marginInlineStart: 6 }}>
                    {isAr ? "ظلّل النص ثم اضغط الزر" : "Select text then click"}
                  </span>
                </div>
                <textarea
                  ref={bodyArRef}
                  value={newTemplate.body_ar}
                  onChange={(e) => {
                    if (e.target.value.length <= 1024) setNewTemplate({ ...newTemplate, body_ar: e.target.value });
                  }}
                  onBlur={async () => {
                    // Live content-policy scan when the operator
                    // tabs out of the field. Cheap (regex-only on
                    // server) so safe to call on every blur.
                    const txt = (newTemplate.body_ar || "").trim();
                    if (!txt) { setContentReport(null); return; }
                    try {
                      const r = await api.post("/templates/content-check", { body: txt });
                      const data = r.data?.data ?? r.data;
                      setContentReport(data?.has_violations ? data : null);
                    } catch { /* never block typing on a check failure */ }
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
                {/* Meta-only template variables hint. The smart variables
                    ({{name}}, {{tier}}, …) work on SMS bodies and inbox
                    free-form replies, but Meta templates ONLY accept
                    numeric placeholders {{1}}, {{2}}, etc. Surfacing the
                    smart tokens here was misleading — it suggested they
                    work in templates when they don't. The backend never
                    substitutes friendly tokens in the WhatsApp template
                    payload (only in the SMS render path), so there's no
                    actual policy violation at send time, but we shouldn't
                    nudge operators toward typing them in templates. */}
                <div style={{
                  marginTop: 8, padding: "8px 12px", borderRadius: 8,
                  background: `${C.info}08`, border: `1px dashed ${C.info}30`,
                  fontSize: 11, color: C.t2, lineHeight: 1.6,
                }}>
                  <span style={{ fontWeight: 700, color: C.info }}>ℹ️ {isAr ? "ملاحظة عن المتغيّرات" : "About variables"}:</span>{" "}
                  {isAr
                    ? "Meta تقبل فقط متغيّرات رقميّة مثل {{1}} و {{2}} في القوالب. القيم تُحدَّد عند الإرسال من بيانات جهة الاتّصال."
                    : "Meta only accepts numeric placeholders like {{1}} and {{2}} in templates. Values are filled at send time from the contact's data."}
                </div>
                {/* Content-policy banner — populated by the body-blur
                    content-check call. Renders only when violations
                    exist; lists exact terms so the operator knows
                    what to remove. */}
                {contentReport?.has_violations && (
                  <div style={{
                    marginTop: 10, padding: "12px 14px", borderRadius: 10,
                    background: `${COLORS.err}10`, border: `1.5px solid ${COLORS.err}50`,
                    fontSize: 12, lineHeight: 1.7,
                  }}>
                    <div style={{ fontWeight: 700, color: COLORS.err, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="ban" size={14} />
                      <span>{isAr ? "محتوى محظور من Meta" : "Content prohibited by Meta"}</span>
                    </div>
                    {contentReport.violations.map((v, i) => (
                      <div key={i} style={{ marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: C.txt }}>{v.category_label}:</span>{" "}
                        <span style={{ color: C.t2 }}>{v.terms.slice(0, 5).join(", ")}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: C.t2, marginTop: 6 }}>
                      {isAr
                        ? "احذف الكلمات أعلاه ثم اضغط خارج الحقل لإعادة الفحص."
                        : "Remove the highlighted terms then click outside the field to recheck."}
                    </div>
                  </div>
                )}
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
                <div style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="button" title="Bold" onClick={() => wrapSelection(bodyEnRef.current, "*", newTemplate.body, (v) => setNewTemplate({ ...newTemplate, body: v }))} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>B</button>
                  <button type="button" title="Italic" onClick={() => wrapSelection(bodyEnRef.current, "_", newTemplate.body, (v) => setNewTemplate({ ...newTemplate, body: v }))} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, cursor: "pointer", fontStyle: "italic", fontSize: 13 }}>I</button>
                  <button type="button" title="Strikethrough" onClick={() => wrapSelection(bodyEnRef.current, "~", newTemplate.body, (v) => setNewTemplate({ ...newTemplate, body: v }))} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, cursor: "pointer", textDecoration: "line-through", fontSize: 13 }}>S</button>
                  <button type="button" title="Monospace" onClick={() => wrapSelection(bodyEnRef.current, "`", newTemplate.body, (v) => setNewTemplate({ ...newTemplate, body: v }))} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, cursor: "pointer", fontFamily: "monospace", fontSize: 13 }}>{"<>"}</button>
                  <span style={{ fontSize: 10.5, color: C.t3, marginInlineStart: 6 }}>
                    {isAr ? "ظلّل النص ثم اضغط الزر" : "Select text then click"}
                  </span>
                </div>
                <textarea
                  ref={bodyEnRef}
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
                    headerFormat={newTemplate.header_format}
                    headerMediaUrl={newTemplate.header_media_url || null}
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
                            {btn.type === "url" && <Icon name="link" size={11} />}
                            {btn.type === "phone" && <Icon name="phone" size={11} />}
                            {btn.type === "quick_reply" && <Icon name="reply" size={11} />}
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
