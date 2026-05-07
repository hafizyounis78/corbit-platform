"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Button, Card, CardHeader, Badge, TabBar, DataTable, Modal, SearchInput, Pagination } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { getStatusColor } from "@/lib/utils/status-color";
import type { Campaign } from "@/data/campaigns";

/**
 * Defensive label-extractor. The API sometimes hydrates relations
 * (template, segment) as full objects with id+name+name_ar+...
 * instead of the bare string the Campaign type promises. Rendering
 * the raw object trips React error #31 ("objects are not valid as
 * a React child") and crashes the whole page.
 *
 * Returns the most human-readable name field, falls back through
 * label/title, then a stringified id, finally null.
 */
function fieldName(v: any): string | null {
  if (v == null) return null;
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    return (
      v.name_ar ||
      v.name ||
      v.label ||
      v.title ||
      (v.id != null ? String(v.id) : null)
    );
  }
  return null;
}
import { useCampaigns, useCampaignStats, useCampaignProgress, useTemplates as useTemplatesApi, useSegments as useSegmentsApi, useCampaignFunnel, useSmsConfig } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { COLORS, GRADIENT } from "@/lib/constants/colors";
import { FONT_FAMILY } from "@/lib/constants/font";
import { CampaignAIBuilderModal } from "@/components/campaigns/ai-builder-modal";

export default function CampaignsPage() {
  const { colors: C } = useTheme();
  const { lang, isAr, t } = useLocale();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [serverSearch, setServerSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // V2 Smart Builder modal — pre-fills the create modal from a preset
  // or a free-text prompt. Decoupled from the regular create flow so
  // the operator can still hit the "New Campaign" button for a blank
  // sheet when they don't want AI.
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    template: "",
    segment: "",
    scheduledDate: "",
    scheduledTime: "09:00",
    sendNow: true,
    budget: "",
    abTest: false,
    variantA: "",
    variantB: "",
    abSplit: 50,         // % of test pool that gets A
    abTestSize: 30,      // % of total recipients in the test pool (rest = holdout)
    // Channel routing: how each recipient receives the campaign.
    //   wa_only  — WhatsApp only (default; no SMS cost)
    //   sms_only — SMS only (skip WhatsApp entirely)
    //   wa_sms   — WhatsApp first, fall back to SMS if WA send fails
    //   dual     — both channels in parallel (each contact gets two messages)
    channelMode: "wa_only" as "wa_only" | "sms_only" | "wa_sms" | "dual",
    // Sending-policy overrides — empty string means "inherit from
    // org defaults" (which themselves default to 2/7 and 09:00-21:00
    // skip-Fridays per the team guide v2.0). Operator can override
    // per campaign here; Quiet Hours + Frequency Cap are enforced
    // by SendingPolicyGate at dispatch time.
    overrideSendWindow: false,
    sendWindowStart: "09:00",
    sendWindowEnd: "21:00",
    sendWindowSkipFridays: true,
    overrideFrequencyCap: false,
    frequencyCapCount: 2,
    frequencyCapDays: 7,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState(false);

  const PAGE_SIZE = 50;

  // Fetch from API, fall back to mock data
  const { data: apiResponse, isLoading, mutate } = useCampaigns({ status: tab === "all" ? undefined : tab, search: serverSearch || undefined, page });

  // SMS readiness — gates the SMS-touching channel modes (sms_only,
  // wa_sms, dual) so the operator doesn't pick a mode the backend
  // will refuse with a 422. The 'connected' flag mirrors the backend's
  // isReady() check (token + sender + is_active), so we use it as the
  // single source of truth instead of recomputing client-side.
  const { data: smsConfigResponse } = useSmsConfig();
  const smsConfig = smsConfigResponse?.data ?? smsConfigResponse;
  const smsReady = !!smsConfig?.connected;

  // Per-channel cost estimate — refetched whenever segment OR channel
  // mode changes. We never sum WA + SMS into one number; the modal
  // renders each channel as its own line so the operator can see
  // exactly where the budget goes (and whether SMS is on a fallback
  // basis vs guaranteed).
  const [estimate, setEstimate] = useState<{
    count: number;
    channel_mode: string;
    whatsapp: { count: number; unit_price: number; cost: number };
    sms: { count: number; unit_price: number; cost: number; is_fallback?: boolean };
    total: number;
  } | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  // Extract data and pagination meta
  const apiCampaigns = apiResponse?.data || apiResponse;
  const paginationMeta = apiResponse?.meta || apiResponse?.pagination || null;
  const totalCount = paginationMeta?.total || (Array.isArray(apiCampaigns) ? apiCampaigns.length : 0);
  const totalPages = paginationMeta?.last_page || Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Map API fields (st = status) and fall back to mock
  const pageCampaigns: Campaign[] = useMemo(() => {
    const list = Array.isArray(apiCampaigns) ? apiCampaigns : [];
    return list.map((c: any) => ({
      ...c,
      st: c.st || c.status || "",
      readRate: c.readRate ?? c.read_rate ?? c.delivery ?? 0,
      replyRate: c.replyRate ?? c.reply_rate ?? 0,
      recipients: c.recipients ?? c.total_recipients ?? 0,
      delivery: c.delivery ?? c.delivery_rate ?? 0,
      cost: c.cost ?? 0,
      roi: c.roi ?? "+0%",
    }));
  }, [apiCampaigns]);

  // Local search filter (instant, within current page)
  const campaigns: Campaign[] = useMemo(() => {
    if (!search.trim() || serverSearch === search) return pageCampaigns;
    const q = search.trim().toLowerCase();
    return pageCampaigns.filter(c =>
      c.name.toLowerCase().includes(q)
    );
  }, [pageCampaigns, search, serverSearch]);

  // When tab changes, reset to page 1
  useEffect(() => { setPage(1); }, [tab]);

  // Re-estimate the per-channel cost whenever the operator picks a
  // different segment or channel mode in the create modal. We only
  // hit the API when the modal is actually open AND the operator has
  // chosen a segment — otherwise the request would be a noop. Empty
  // segment short-circuits to a cleared estimate so the cost panel
  // doesn't flash stale numbers from a previous draft.
  useEffect(() => {
    if (!showCreateModal || !newCampaign.segment) {
      setEstimate(null);
      return;
    }
    let cancelled = false;
    setEstimateLoading(true);
    api.get('/campaigns/estimate', {
      params: {
        segment: newCampaign.segment,
        channel_mode: newCampaign.channelMode,
      },
    })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        setEstimate(data ?? null);
      })
      .catch(() => { if (!cancelled) setEstimate(null); })
      .finally(() => { if (!cancelled) setEstimateLoading(false); });
    return () => { cancelled = true; };
  }, [showCreateModal, newCampaign.segment, newCampaign.channelMode]);

  // Search: Enter key triggers server search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setServerSearch(search);
      setPage(1);
    }
  };

  const { data: templatesApiResponse } = useTemplatesApi();
  const templates = useMemo(() => {
    const list = templatesApiResponse?.data || templatesApiResponse;
    return Array.isArray(list) ? list : [];
  }, [templatesApiResponse]);

  const { data: segmentsApiResponse } = useSegmentsApi();
  const segments = useMemo(() => {
    const list = segmentsApiResponse?.data || segmentsApiResponse;
    return Array.isArray(list) ? list : [];
  }, [segmentsApiResponse]);

  const statusLabel = (st: string) => {
    const map: Record<string, string> = isAr
      ? { active: "نشطة", completed: "مكتملة", scheduled: "مجدولة", draft: "مسودة", paused: "متوقفة", sending: "جاري الإرسال", cancelled: "ملغاة" }
      : { active: "Active", completed: "Completed", scheduled: "Scheduled", draft: "Draft", paused: "Paused", sending: "Sending", cancelled: "Cancelled" };
    return map[st] || st;
  };

  const filtered = useMemo(() => {
    // "All" hides archived — that tab is the day-to-day workspace,
    // not the audit history. Archived campaigns surface only when
    // the operator explicitly switches to the Archive tab. Keeps
    // the table from re-filling with stale items the operator just
    // removed.
    if (tab === "all") return campaigns.filter((c) => c.st !== "archived");
    const statusMap: Record<string, string> = {
      active: "active",
      completed: "completed",
      scheduled: "scheduled",
      draft: "draft",
      archived: "archived",
    };
    return campaigns.filter((c) => c.st === statusMap[tab]);
  }, [campaigns, tab]);

  const selected = useMemo(
    () => (selectedId !== null ? campaigns.find((c) => c.id === selectedId) ?? null : null),
    [campaigns, selectedId]
  );

  // Stats from API, fall back to computed mock stats
  const { data: apiStats } = useCampaignStats();
  const stats = useMemo(() => {
    const active = apiStats?.active ?? campaigns.filter((c) => c.st === "active").length;
    const done = campaigns.filter((c) => c.st === "completed").length;
    const sched = campaigns.filter((c) => c.st === "scheduled").length;
    const withRoi = campaigns.filter((c) => c.roi && c.roi !== "-" && c.roi !== "+0%");
    const totalRoi =
      withRoi.length > 0
        ? (() => {
            const sum = withRoi.reduce((s, c) => {
              const v = parseFloat(String(c.roi).replace(/[+%]/g, ""));
              return s + (isNaN(v) ? 0 : v);
            }, 0);
            const avg = Math.round(sum / withRoi.length);
            return (avg >= 0 ? "+" : "") + avg + "%";
          })()
        : "0%";
    const avgOpen =
      campaigns.length > 0
        ? (campaigns.reduce((s, c) => s + (Number(c.readRate) || 0), 0) / campaigns.length).toFixed(1) + "%"
        : "0%";
    const convRate =
      campaigns.length > 0
        ? (campaigns.reduce((s, c) => s + (Number(c.replyRate) || 0), 0) / campaigns.length).toFixed(1) + "%"
        : "0%";
    return [
      { label: isAr ? "\u0646\u0634\u0637\u0629" : "Active", value: active, icon: "zap", color: COLORS.ok },
      { label: isAr ? "\u0645\u0643\u062A\u0645\u0644\u0629" : "Done", value: done, icon: "check", color: COLORS.info },
      { label: isAr ? "\u0645\u062C\u062F\u0648\u0644\u0629" : "Scheduled", value: sched, icon: "timer", color: COLORS.warn },
      { label: isAr ? "\u0625\u062C\u0645\u0627\u0644\u064A ROI" : "Total ROI", value: totalRoi, icon: "chart", color: COLORS.pri },
      { label: isAr ? "\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u0641\u062A\u062D" : "Avg Open", value: avgOpen, icon: "msg", color: COLORS.sec },
      { label: isAr ? "\u0645\u0639\u062F\u0644 \u0627\u0644\u062A\u062D\u0648\u064A\u0644" : "Conv Rate", value: convRate, icon: "target", color: COLORS.ai },
    ];
  }, [apiStats, campaigns, isAr]);

  const tabs = useMemo(
    () => [
      { key: "all", label: isAr ? "\u0627\u0644\u0643\u0644" : "All" },
      { key: "active", label: isAr ? "\u0646\u0634\u0637\u0629" : "Active" },
      { key: "completed", label: isAr ? "\u0645\u0643\u062A\u0645\u0644\u0629" : "Completed" },
      { key: "scheduled", label: isAr ? "\u0645\u062C\u062F\u0648\u0644\u0629" : "Scheduled" },
      { key: "draft", label: isAr ? "\u0645\u0633\u0648\u062F\u0629" : "Draft" },
      { key: "archived", label: isAr ? "\u0627\u0644\u0623\u0631\u0634\u064A\u0641" : "Archived" },
    ],
    [isAr]
  );

  // ── Detail View ──
  if (selected) {
    return <DetailView campaign={selected} onBack={() => setSelectedId(null)} onRefresh={mutate} />;
  }

  // ── List View ──
  return (
    <div
      style={{
        padding: isMobile ? "0 14px 14px" : "0 28px 28px",
        direction: isAr ? "rtl" : "ltr",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.txt }}>
            {isAr ? "\u0627\u0644\u062D\u0645\u0644\u0627\u062A" : "Campaigns"}
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.t2 }}>
            {isAr ? "\u0625\u062F\u0627\u0631\u0629 \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u062D\u0645\u0644\u0627\u062A\u0643 \u0627\u0644\u062A\u0633\u0648\u064A\u0642\u064A\u0629" : "Manage and track your marketing campaigns"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Smart Builder \u2014 primary CTA for V2. Operators who want a
              blank sheet can still use "New Campaign" to the right. */}
          <Button outline onClick={() => setShowAIBuilder(true)} style={{ color: "#FF5A5F", borderColor: "#FF5A5F" }}>
            <Icon name="brain" size={14} />
            {isAr ? "\uD83E\uDDE0 \u0645\u0646\u0634\u0626 \u0630\u0643\u064A" : "\uD83E\uDDE0 AI Builder"}
          </Button>
          <Button primary onClick={() => { setNewCampaign({ name: "", template: "", segment: "", scheduledDate: "", scheduledTime: "09:00", sendNow: true, budget: "", abTest: false, variantA: "", variantB: "", abSplit: 50, abTestSize: 30, channelMode: "wa_only", overrideSendWindow: false, sendWindowStart: "09:00", sendWindowEnd: "21:00", sendWindowSkipFridays: true, overrideFrequencyCap: false, frequencyCapCount: 2, frequencyCapDays: 7 }); setFormErrors({}); setIsSubmitting(false); setShowCreateModal(true); }}>
            <Icon name="megaphone" size={14} />
            {isAr ? "\u062D\u0645\u0644\u0629 \u062C\u062F\u064A\u062F\u0629" : "New Campaign"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map((s: any) => (
          <Card key={s.label} style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: `${s.color}18`,
                  color: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={s.icon} size={15} />
              </div>
              <span style={{ fontSize: 11.5, color: C.t2, fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.txt }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Tab Bar + Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        <div style={{ flex: 1, minWidth: 180, maxWidth: 320 }}>
          <SearchInput value={search} onChange={setSearch} onKeyDown={handleSearchKeyDown} placeholder={isAr ? "بحث بالاسم... (Enter للبحث)" : "Search by name... (Enter to search)"} />
        </div>
      </div>

      {/* Campaigns Table / Cards */}
      {isLoading ? (
        <Card style={{ padding: 48 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
            <div style={{ textAlign: "center", color: C.t2 }}>
              <Icon name="timer" size={32} />
              <p style={{ marginTop: 12, fontSize: 14 }}>{isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." : "Loading..."}</p>
            </div>
          </div>
        </Card>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((c) => (
            <Card key={c.id} onClick={() => setSelectedId(c.id)} style={{ padding: 16, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.txt }}>{c.name}</span>
                <Badge color={getStatusColor(c.st)}>{statusLabel(c.st)}</Badge>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: C.t2 }}>
                <span>{isAr ? "\u0627\u0644\u0645\u0633\u062A\u0644\u0645\u0648\u0646" : "Recipients"}: {c.recipients.toLocaleString()}</span>
                <span>{isAr ? "\u0627\u0644\u062A\u0648\u0635\u064A\u0644" : "Delivery"}: {Number(c.delivery) || 0}%</span>
                <span>{isAr ? "\u0627\u0644\u0642\u0631\u0627\u0621\u0629" : "Read"}: {Number(c.readRate) || 0}%</span>
                <span>{isAr ? "\u0627\u0644\u0631\u062F" : "Reply"}: {Number(c.replyRate) || 0}%</span>
                <span>{isAr ? "\u0627\u0644\u062A\u0643\u0644\u0641\u0629" : "Cost"}: {(Number(c.cost) || 0).toLocaleString()} {isAr ? "\u0631.\u0633" : "SAR"}</span>
                <span>ROI: {c.roi}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {/* Edit only makes sense for drafts and scheduled \u2014 once
                    the dispatcher has touched the campaign, we hide the
                    pencil so QA stops asking why it doesn't open an editor. */}
                {(c.st === 'draft' || c.st === 'scheduled') && (
                  <Button small outline onClick={(e: React.MouseEvent) => { e.stopPropagation(); showToast(isAr ? "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u0645\u0644\u0629" : "Edit campaign"); }}>
                    <Icon name="pencil" size={12} />
                  </Button>
                )}
                <Button small outline onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  api.post(`/campaigns/${c.id}/duplicate`).then(() => {
                    showToast(isAr ? "\u062A\u0645 \u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Campaign duplicated");
                    mutate();
                  }).catch(() => showToast(isAr ? "\u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Duplicate campaign"));
                }}>
                  <Icon name="copy" size={12} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <DataTable
            headers={[
              isAr ? "\u0627\u0644\u062D\u0645\u0644\u0629" : "Campaign",
              isAr ? "\u0627\u0644\u062D\u0627\u0644\u0629" : "Status",
              isAr ? "\u0627\u0644\u0645\u0633\u062A\u0644\u0645\u0648\u0646" : "Recipients",
              isAr ? "\u0627\u0644\u062A\u0648\u0635\u064A\u0644" : "Delivery%",
              isAr ? "\u0627\u0644\u0642\u0631\u0627\u0621\u0629" : "Read%",
              isAr ? "\u0627\u0644\u0631\u062F" : "Reply%",
              isAr ? "\u0627\u0644\u062A\u0643\u0644\u0641\u0629" : "Cost",
              "ROI",
              isAr ? "\u0625\u062C\u0631\u0627\u0621\u0627\u062A" : "Actions",
            ]}
            rows={filtered.map((c) => [
              <span
                key="name"
                style={{ fontWeight: 600, color: C.txt, cursor: "pointer" }}
                onClick={() => setSelectedId(c.id)}
              >
                {c.name}
              </span>,
              <Badge key="st" color={getStatusColor(c.st)}>
                {statusLabel(c.st)}
              </Badge>,
              <span key="rec">{c.recipients.toLocaleString()}</span>,
              <span key="del">{Number(c.delivery) || 0}%</span>,
              <span key="read">{Number(c.readRate) || 0}%</span>,
              <span key="reply">{Number(c.replyRate) || 0}%</span>,
              <span key="cost">{(Number(c.cost) || 0).toLocaleString()} {isAr ? "ر.س" : "SAR"}</span>,
              <span key="roi" style={{ fontWeight: 600, color: c.roi.startsWith("+") ? COLORS.ok : undefined }}>
                {c.roi}
              </span>,
              <div key="actions" style={{ display: "flex", gap: 6 }}>
                <Button small outline onClick={() => setSelectedId(c.id)}>
                  <Icon name="chart" size={12} />
                </Button>
                {(c.st === 'draft' || c.st === 'scheduled') && (
                  <Button small outline onClick={() => showToast(isAr ? "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u0645\u0644\u0629" : "Edit campaign")}>
                    <Icon name="pencil" size={12} />
                  </Button>
                )}
                <Button small outline onClick={() => {
                  api.post(`/campaigns/${c.id}/duplicate`).then(() => {
                    showToast(isAr ? "\u062A\u0645 \u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Campaign duplicated");
                    mutate();
                  }).catch(() => showToast(isAr ? "\u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Duplicate campaign"));
                }}>
                  <Icon name="copy" size={12} />
                </Button>
                <Button small outline onClick={() => setDeleteTarget(c)}>
                  <Icon name="x" size={12} />
                </Button>
              </div>,
            ])}
          />
        </Card>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} totalItems={totalCount} onPageChange={setPage} />

      {/* ── Delete Campaign Confirmation Modal ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deletingCampaign && setDeleteTarget(null)}
        title={isAr ? "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0630\u0641" : "Confirm Delete"}
        submitLabel={deletingCampaign ? (isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062D\u0630\u0641..." : "Deleting...") : (isAr ? "\u0646\u0639\u0645\u060C \u0627\u062D\u0630\u0641" : "Yes, Delete")}
        submitDisabled={deletingCampaign}
        submitLoading={deletingCampaign}
        onSubmit={async () => {
          if (!deleteTarget) return;
          setDeletingCampaign(true);
          try {
            await api.delete(`/campaigns/${deleteTarget.id}`);
            showToast(isAr ? "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u0645\u0644\u0629 \u2713" : "Campaign deleted \u2713");
            mutate();
            setDeleteTarget(null);
          } catch (err: any) {
            const msg = err?.response?.data?.message || (isAr ? "\u0641\u0634\u0644 \u0627\u0644\u062D\u0630\u0641" : "Delete failed");
            showToast(msg);
          } finally {
            setDeletingCampaign(false);
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
                {isAr ? `\u0647\u0644 \u062A\u0631\u064A\u062F \u062D\u0630\u0641 \u0627\u0644\u062D\u0645\u0644\u0629 "${deleteTarget?.name}"\u061F` : `Delete campaign "${deleteTarget?.name}"?`}
              </div>
              <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>
                {isAr ? "\u0633\u064A\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u0645\u0644\u0629 \u0646\u0647\u0627\u0626\u064A\u0627\u064B. \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621." : "The campaign will be permanently deleted. This action cannot be undone."}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Smart Builder Modal — V2 ── */}
      {/* Shown when the operator clicks the AI Builder button. Lets them
          pick a preset (free, no AI call) or type free-text (gated by
          the daily AI quota). When the operator clicks Continue on the
          preview screen, we close this modal and open the regular
          create modal pre-filled with the draft so they can review and
          launch with the existing flow. */}
      <CampaignAIBuilderModal
        open={showAIBuilder}
        onClose={() => setShowAIBuilder(false)}
        onDraftReady={(draft) => {
          // Map AI builder draft to the existing create modal's shape.
          // Some fields (template, scheduledDate) have no equivalent in
          // the AI proposal yet — left blank so the operator picks them.
          setNewCampaign({
            name: draft.name,
            template: "",
            segment: draft.segment_key ?? "",
            scheduledDate: "",
            scheduledTime: draft.suggested_send_time || "09:00",
            sendNow: false,
            budget: "",
            abTest: false,
            variantA: "",
            variantB: "",
            abSplit: 50,
            abTestSize: 30,
            channelMode: "wa_only",
            overrideSendWindow: false,
            sendWindowStart: "09:00",
            sendWindowEnd: "21:00",
            sendWindowSkipFridays: true,
            overrideFrequencyCap: false,
            frequencyCapCount: 2,
            frequencyCapDays: 7,
          });
          setFormErrors({});
          setIsSubmitting(false);
          setShowCreateModal(true);
        }}
      />

      {/* ── Create Campaign Modal ── */}
      <Modal
        open={showCreateModal}
        onClose={() => { if (!isSubmitting) setShowCreateModal(false); }}
        title={isAr ? "حملة جديدة" : "New Campaign"}
        wide
        submitLabel={newCampaign.sendNow ? (isAr ? "إرسال الآن" : "Send Now") : (isAr ? "جدولة الحملة" : "Schedule Campaign")}
        submitLoading={isSubmitting}
        submitDisabled={isSubmitting}
        onSubmit={() => {
          // Validate
          const errors: Record<string, string> = {};
          if (!newCampaign.name.trim()) {
            errors.name = isAr ? "اسم الحملة مطلوب" : "Campaign name is required";
          }
          if (!newCampaign.template) {
            errors.template = isAr ? "يرجى اختيار قالب" : "Please select a template";
          }
          if (!newCampaign.segment) {
            errors.segment = isAr ? "يرجى اختيار شريحة" : "Please select a segment";
          }
          if (!newCampaign.sendNow && !newCampaign.scheduledDate) {
            errors.scheduledDate = isAr ? "يرجى تحديد تاريخ الإرسال" : "Please set a scheduled date";
          }
          if (newCampaign.budget && (isNaN(Number(newCampaign.budget)) || Number(newCampaign.budget) < 0)) {
            errors.budget = isAr ? "الميزانية يجب أن تكون رقماً صحيحاً" : "Budget must be a valid positive number";
          }
          if (newCampaign.abTest) {
            if (!newCampaign.variantA.trim()) {
              errors.variantA = isAr ? "نصّ النسخة A مطلوب" : "Variant A text is required";
            }
            if (!newCampaign.variantB.trim()) {
              errors.variantB = isAr ? "نصّ النسخة B مطلوب" : "Variant B text is required";
            }
            if (newCampaign.variantA.trim() && newCampaign.variantA.trim() === newCampaign.variantB.trim()) {
              errors.variantB = isAr ? "النسختان متطابقتان — لا فائدة من اختبار A/B" : "Variants are identical — no point A/B testing";
            }
          }
          // SMS-touching modes need a connected mobile.net.sa account.
          // We block at submit (not on selection) so the operator can
          // still preview the cost copy before being told to set up SMS.
          if (newCampaign.channelMode !== "wa_only" && !smsReady) {
            errors.channelMode = isAr
              ? "لإرسال هذه الحملة عبر SMS، اربط حساب الـ SMS أولاً من الإعدادات > SMS."
              : "Connect your SMS account in Settings > SMS before using SMS-enabled modes.";
          }
          setFormErrors(errors);
          if (Object.keys(errors).length > 0) return;

          setIsSubmitting(true);
          api.post("/campaigns", {
            name: newCampaign.name,
            template: newCampaign.template,
            segment: newCampaign.segment,
            sendNow: newCampaign.sendNow,
            scheduledDate: newCampaign.scheduledDate || undefined,
            scheduledTime: newCampaign.scheduledTime || undefined,
            budget: newCampaign.budget ? Number(newCampaign.budget) : undefined,
            channel_mode: newCampaign.channelMode,
            // Sending-policy overrides — only sent when the operator
            // explicitly toggled the override on. NULL on the backend
            // means "inherit org_settings defaults" (2/7, 09:00-21:00,
            // skip Fridays per the team guide v2.0).
            ...(newCampaign.overrideSendWindow ? {
              send_window_start:        newCampaign.sendWindowStart + ":00",
              send_window_end:          newCampaign.sendWindowEnd + ":00",
              send_window_skip_fridays: newCampaign.sendWindowSkipFridays,
            } : {}),
            ...(newCampaign.overrideFrequencyCap ? {
              frequency_cap_count: newCampaign.frequencyCapCount,
              frequency_cap_days:  newCampaign.frequencyCapDays,
            } : {}),
          }).then(async (res) => {
            // If A/B is on, configure it on the just-created campaign
            // before closing the modal. We do this in two steps because
            // the create endpoint doesn't accept ab_* fields yet —
            // separating keeps the create path simple and the A/B
            // feature opt-in.
            if (newCampaign.abTest) {
              const created = res?.data?.data ?? res?.data;
              const campaignId = created?.id || created?.campaign?.id;
              if (campaignId) {
                try {
                  await api.post(`/campaigns/${campaignId}/ab-test`, {
                    variantA: newCampaign.variantA,
                    variantB: newCampaign.variantB,
                    split: newCampaign.abSplit,
                    testSize: newCampaign.abTestSize,
                  });
                } catch {
                  showToast(isAr ? "تمّ إنشاء الحملة لكن تعذّر إعداد A/B" : "Campaign created but A/B setup failed", "error");
                }
              }
            }
            showToast(isAr ? "تم إنشاء الحملة بنجاح" : "Campaign created successfully");
            setShowCreateModal(false);
            setIsSubmitting(false);
            mutate();
          }).catch(() => {
            showToast(isAr ? "فشل إنشاء الحملة، حاول مرة أخرى" : "Failed to create campaign, please try again");
            setIsSubmitting(false);
          });
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Campaign Name */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
              {isAr ? "اسم الحملة" : "Campaign Name"} <span style={{ color: COLORS.err }}>*</span>
            </label>
            <input
              value={newCampaign.name}
              onChange={(e) => { setNewCampaign({ ...newCampaign, name: e.target.value }); setFormErrors((prev) => { const n = { ...prev }; delete n.name; return n; }); }}
              placeholder={isAr ? "مثال: حملة رمضان 2026" : "e.g. Ramadan Campaign 2026"}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${formErrors.name ? COLORS.err : C.brd}`,
                background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none",
                boxSizing: "border-box",
              }}
            />
            {formErrors.name && (
              <span style={{ fontSize: 11.5, color: COLORS.err, marginTop: 4, display: "block" }}>{formErrors.name}</span>
            )}
          </div>

          {/* Template & Segment Row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "القالب" : "Template"} <span style={{ color: COLORS.err }}>*</span>
              </label>
              <select
                value={newCampaign.template}
                onChange={(e) => { setNewCampaign({ ...newCampaign, template: e.target.value }); setFormErrors((prev) => { const n = { ...prev }; delete n.template; return n; }); }}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: `1px solid ${formErrors.template ? COLORS.err : C.brd}`,
                  background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <option value="">{isAr ? "اختر قالب..." : "Select template..."}</option>
                {templates.map((tmpl: any) => {
                  const st = String(tmpl.status || "").toLowerCase();
                  const stLabel = st === "approved" ? (isAr ? "معتمد" : "approved") : st === "pending" ? (isAr ? "معلق" : "pending") : st === "rejected" ? (isAr ? "مرفوض" : "rejected") : st;
                  return (
                    <option key={tmpl.id} value={tmpl.id}>{tmpl.name} — {stLabel}</option>
                  );
                })}
              </select>
              {formErrors.template && (
                <span style={{ fontSize: 11.5, color: COLORS.err, marginTop: 4, display: "block" }}>{formErrors.template}</span>
              )}
              <div style={{ fontSize: 11, color: C.t3, marginTop: 6 }}>
                {isAr ? "ملاحظة: فقط القوالب المعتمدة من Meta تُرسل فعلياً في الحملة." : "Note: Only Meta-approved templates are actually sent."}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "الشريحة المستهدفة" : "Segment / Audience"} <span style={{ color: COLORS.err }}>*</span>
              </label>
              <select
                value={newCampaign.segment}
                onChange={(e) => { setNewCampaign({ ...newCampaign, segment: e.target.value }); setFormErrors((prev) => { const n = { ...prev }; delete n.segment; return n; }); }}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: `1px solid ${formErrors.segment ? COLORS.err : C.brd}`,
                  background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <option value="">{isAr ? "اختر شريحة..." : "Select segment..."}</option>
                {segments.map((seg: any) => (
                  <option key={seg.id} value={seg.id}>{seg.name}</option>
                ))}
              </select>
              {formErrors.segment && (
                <span style={{ fontSize: 11.5, color: COLORS.err, marginTop: 4, display: "block" }}>{formErrors.segment}</span>
              )}
            </div>
          </div>

          {/* ── Channel Mode ── */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 10 }}>
              {isAr ? "قناة الإرسال" : "Delivery Channel"}
            </label>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 10 }}>
              {([
                { key: "wa_only",  emoji: "📱", title: isAr ? "واتساب فقط"        : "WhatsApp only",   sub: isAr ? "بدون تكلفة SMS"            : "No SMS cost",          requiresSms: false },
                { key: "sms_only", emoji: "💬", title: isAr ? "SMS فقط"            : "SMS only",        sub: isAr ? "تجاوز واتساب نهائياً"      : "Skip WhatsApp entirely", requiresSms: true  },
                { key: "wa_sms",   emoji: "🔁", title: isAr ? "واتساب ثم SMS"      : "WhatsApp + SMS fallback", sub: isAr ? "SMS فقط عند فشل واتساب" : "SMS only when WhatsApp fails", requiresSms: true },
                { key: "dual",     emoji: "📡", title: isAr ? "كلاهما (Dual)"     : "Dual",            sub: isAr ? "رسالتان لكلّ مستلم"        : "Two messages per contact", requiresSms: true },
              ] as const).map((opt) => {
                const selected = newCampaign.channelMode === opt.key;
                const disabled = opt.requiresSms && !smsReady;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setNewCampaign({ ...newCampaign, channelMode: opt.key });
                      setFormErrors((prev) => { const n = { ...prev }; delete n.channelMode; return n; });
                    }}
                    title={disabled ? (isAr ? "اربط حساب الـ SMS أولاً من الإعدادات > SMS" : "Connect your SMS account first in Settings > SMS") : undefined}
                    style={{
                      padding: "12px 10px", borderRadius: 10,
                      border: `2px solid ${selected ? C.pri : C.brd}`,
                      background: selected ? `${C.pri}12` : "transparent",
                      color: disabled ? C.t3 : (selected ? C.pri : C.txt),
                      opacity: disabled ? 0.55 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontFamily: FONT_FAMILY, textAlign: "center",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 18 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{opt.title}</div>
                    <div style={{ fontSize: 10.5, color: disabled ? C.t3 : C.t2, lineHeight: 1.3 }}>{opt.sub}</div>
                  </button>
                );
              })}
            </div>
            {!smsReady && (
              <div style={{ fontSize: 11, color: C.t3, marginTop: 8 }}>
                {isAr
                  ? "💡 لتفعيل خيارات SMS، اربط حساب mobile.net.sa من الإعدادات > SMS."
                  : "💡 Connect your mobile.net.sa account in Settings > SMS to unlock SMS modes."}
              </div>
            )}
            {newCampaign.channelMode !== "wa_only" && smsReady && (
              <div style={{ fontSize: 11, color: C.t2, marginTop: 8, padding: "8px 12px", background: `${C.info}10`, borderRadius: 8, border: `1px dashed ${C.info}40` }}>
                {newCampaign.channelMode === "dual"
                  ? (isAr ? "ℹ️ سيستلم كلّ مستلم رسالتين — احسب التكلفة لكليهما." : "ℹ️ Each contact receives two messages — budget for both.")
                  : newCampaign.channelMode === "wa_sms"
                  ? (isAr ? "ℹ️ SMS تُحتسب فقط للمستلمين الذين فشل تسليم واتساب لهم." : "ℹ️ SMS is only billed for recipients whose WhatsApp delivery failed.")
                  : (isAr ? "ℹ️ سيُحتسب رصيد SMS بدلاً من رصيد واتساب لهذه الحملة." : "ℹ️ This campaign uses your SMS balance instead of WhatsApp.")}
              </div>
            )}
            {formErrors.channelMode && (
              <span style={{ fontSize: 11.5, color: COLORS.err, marginTop: 6, display: "block" }}>{formErrors.channelMode}</span>
            )}
          </div>

          {/* ── Cost Preview (per channel, never lumped) ──
              Renders one row per channel that will actually be billed,
              plus a grand total. Empty until the operator picks a
              segment — we don't fake numbers from a default. */}
          {newCampaign.segment && (
            <div style={{
              padding: 14, borderRadius: 10,
              border: `1px solid ${C.brd}`,
              background: `${C.pri}06`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.txt }}>
                  💰 {isAr ? "تقدير التكلفة" : "Cost Estimate"}
                </div>
                {estimateLoading && (
                  <div style={{ fontSize: 11, color: C.t3 }}>{isAr ? "جارٍ الحساب..." : "Calculating..."}</div>
                )}
              </div>

              {!estimate ? (
                <div style={{ fontSize: 11.5, color: C.t3 }}>
                  {isAr ? "اختر الشريحة والقناة لرؤية التكلفة." : "Pick a segment + channel to see the cost."}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 10 }}>
                    {isAr ? `عدد المستلمين: ${estimate.count.toLocaleString()}` : `Recipients: ${estimate.count.toLocaleString()}`}
                  </div>

                  {/* Each channel row stays its own line — no aggregation. */}
                  {estimate.whatsapp.count > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12.5, borderBottom: `1px dashed ${C.brd}` }}>
                      <span style={{ color: C.txt }}>
                        📱 {isAr ? "واتساب" : "WhatsApp"}
                        <span style={{ color: C.t3, fontWeight: 400, marginInlineStart: 6 }}>
                          ({estimate.whatsapp.count.toLocaleString()} × {estimate.whatsapp.unit_price.toFixed(2)} {isAr ? "ر.س" : "SAR"})
                        </span>
                      </span>
                      <span style={{ fontWeight: 700, color: COLORS.ok }}>
                        {estimate.whatsapp.cost.toFixed(2)} {isAr ? "ر.س" : "SAR"}
                      </span>
                    </div>
                  )}

                  {(estimate.sms.count > 0 || estimate.sms.is_fallback) && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12.5, borderBottom: `1px dashed ${C.brd}` }}>
                      <span style={{ color: C.txt }}>
                        💬 {isAr ? "SMS" : "SMS"}
                        <span style={{ color: C.t3, fontWeight: 400, marginInlineStart: 6 }}>
                          {estimate.sms.is_fallback
                            ? (isAr ? `(احتياط — ${estimate.sms.unit_price.toFixed(2)} ر.س لكل رسالة فاشلة على واتساب)` : `(fallback — ${estimate.sms.unit_price.toFixed(2)} SAR per WA failure)`)
                            : `(${estimate.sms.count.toLocaleString()} × ${estimate.sms.unit_price.toFixed(2)} ${isAr ? "ر.س" : "SAR"})`}
                        </span>
                      </span>
                      <span style={{ fontWeight: 700, color: estimate.sms.is_fallback ? C.t3 : C.info }}>
                        {estimate.sms.is_fallback
                          ? (isAr ? "حسب الحاجة" : "as needed")
                          : `${estimate.sms.cost.toFixed(2)} ${isAr ? "ر.س" : "SAR"}`}
                      </span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, fontSize: 13, fontWeight: 700, color: C.txt }}>
                    <span>{isAr ? "الإجمالي المتوقّع" : "Expected total"}</span>
                    <span style={{ color: C.pri, fontSize: 14 }}>
                      {estimate.total.toFixed(2)} {isAr ? "ر.س" : "SAR"}
                    </span>
                  </div>

                  {estimate.sms.is_fallback && (
                    <div style={{ fontSize: 10.5, color: C.t3, marginTop: 8, lineHeight: 1.5 }}>
                      {isAr
                        ? "ℹ️ تكلفة SMS تُحسَب فقط للمستلمين الذين فشل تسليم واتساب لهم. الإجمالي أعلاه لا يشمل احتياط SMS."
                        : "ℹ️ SMS cost is only charged for recipients whose WhatsApp delivery failed. Total above excludes the SMS reserve."}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Sending Policy (override org defaults) ──
              Frequency cap + send window come from org_settings by
              default (2/7 + 09:00-21:00 skip-Fridays per the team
              guide). The two collapsibles below let the operator
              override per campaign — either narrow the cap, broaden
              the window, or both. */}
          <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.txt, marginBottom: 4 }}>
              {isAr ? "🛡️ سياسة الإرسال" : "🛡️ Sending Policy"}
            </div>
            <div style={{ fontSize: 11, color: C.t3, marginBottom: 12, lineHeight: 1.6 }}>
              {isAr
                ? "افتراضياً تستخدم الحملة قواعد المؤسّسة (نافذة 9-21 + تجنّب الجمعة، حدّ 2 رسالة/7 أيام لكلّ عميل). فعّل التعديل لتجاوز هذه القواعد في هذه الحملة فقط."
                : "By default this campaign inherits org rules (window 9-21 + skip-Fridays, cap 2 msg/7d per contact). Enable override to customise just this campaign."}
            </div>

            {/* Send Window override */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 10, background: newCampaign.overrideSendWindow ? `${C.pri}10` : "transparent", border: `1.5px solid ${newCampaign.overrideSendWindow ? C.pri : C.brd}` }}>
                <input
                  type="checkbox"
                  checked={newCampaign.overrideSendWindow}
                  onChange={(e) => setNewCampaign({ ...newCampaign, overrideSendWindow: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: C.pri, cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>
                    {isAr ? "🕒 تخصيص نافذة الإرسال" : "🕒 Customise send window"}
                  </div>
                  <div style={{ fontSize: 11, color: C.t2 }}>
                    {isAr ? "الافتراضي: 09:00 - 21:00، تجنّب الجمعة" : "Default: 09:00 - 21:00, skip Fridays"}
                  </div>
                </div>
              </label>
              {newCampaign.overrideSendWindow && (
                <div style={{ marginTop: 8, padding: 12, borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4 }}>{isAr ? "من" : "From"}</label>
                    <input
                      type="time"
                      value={newCampaign.sendWindowStart}
                      onChange={(e) => setNewCampaign({ ...newCampaign, sendWindowStart: e.target.value })}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.card, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4 }}>{isAr ? "إلى" : "To"}</label>
                    <input
                      type="time"
                      value={newCampaign.sendWindowEnd}
                      onChange={(e) => setNewCampaign({ ...newCampaign, sendWindowEnd: e.target.value })}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.card, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 12 }}
                    />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.txt, cursor: "pointer", paddingTop: isMobile ? 4 : 18 }}>
                    <input
                      type="checkbox"
                      checked={newCampaign.sendWindowSkipFridays}
                      onChange={(e) => setNewCampaign({ ...newCampaign, sendWindowSkipFridays: e.target.checked })}
                      style={{ width: 14, height: 14, accentColor: C.pri, cursor: "pointer" }}
                    />
                    {isAr ? "تجنّب الجمعة" : "Skip Fridays"}
                  </label>
                </div>
              )}
            </div>

            {/* Frequency cap override */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 10, background: newCampaign.overrideFrequencyCap ? `${C.pri}10` : "transparent", border: `1.5px solid ${newCampaign.overrideFrequencyCap ? C.pri : C.brd}` }}>
                <input
                  type="checkbox"
                  checked={newCampaign.overrideFrequencyCap}
                  onChange={(e) => setNewCampaign({ ...newCampaign, overrideFrequencyCap: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: C.pri, cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>
                    {isAr ? "📊 تخصيص حد الإرسال للعميل" : "📊 Customise per-contact cap"}
                  </div>
                  <div style={{ fontSize: 11, color: C.t2 }}>
                    {isAr ? "الافتراضي: 2 رسائل / 7 أيام لكلّ عميل" : "Default: 2 messages / 7 days per contact"}
                  </div>
                </div>
              </label>
              {newCampaign.overrideFrequencyCap && (
                <div style={{ marginTop: 8, padding: 12, borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4 }}>
                      {isAr ? "الحدّ الأقصى للرسائل" : "Max messages"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={newCampaign.frequencyCapCount}
                      onChange={(e) => setNewCampaign({ ...newCampaign, frequencyCapCount: Math.max(0, Math.min(10, Number(e.target.value) || 0)) })}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.card, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 12 }}
                    />
                    <div style={{ fontSize: 10, color: C.t3, marginTop: 4 }}>
                      {isAr ? "0 = إيقاف الحدّ" : "0 = disable cap"}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4 }}>
                      {isAr ? "خلال (أيام)" : "Within (days)"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={newCampaign.frequencyCapDays}
                      onChange={(e) => setNewCampaign({ ...newCampaign, frequencyCapDays: Math.max(1, Math.min(90, Number(e.target.value) || 1)) })}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.card, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 12 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Send Now or Schedule */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 10 }}>
              {isAr ? "وقت الإرسال" : "Schedule"}
            </label>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => { setNewCampaign({ ...newCampaign, sendNow: true }); setFormErrors((prev) => { const n = { ...prev }; delete n.scheduledDate; return n; }); }}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 10, border: `2px solid ${newCampaign.sendNow ? C.pri : C.brd}`,
                  background: newCampaign.sendNow ? `${C.pri}12` : "transparent", color: newCampaign.sendNow ? C.pri : C.t2,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT_FAMILY, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Icon name="send" size={16} />
                {isAr ? "إرسال فوري" : "Send Now"}
              </button>
              <button
                type="button"
                onClick={() => setNewCampaign({ ...newCampaign, sendNow: false })}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 10, border: `2px solid ${!newCampaign.sendNow ? C.pri : C.brd}`,
                  background: !newCampaign.sendNow ? `${C.pri}12` : "transparent", color: !newCampaign.sendNow ? C.pri : C.t2,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT_FAMILY, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Icon name="timer" size={16} />
                {isAr ? "جدولة" : "Schedule"}
              </button>
            </div>

            {!newCampaign.sendNow && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, color: C.t3, marginBottom: 4 }}>
                    {isAr ? "التاريخ" : "Date"} <span style={{ color: COLORS.err }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={newCampaign.scheduledDate}
                    onChange={(e) => { setNewCampaign({ ...newCampaign, scheduledDate: e.target.value }); setFormErrors((prev) => { const n = { ...prev }; delete n.scheduledDate; return n; }); }}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: `1px solid ${formErrors.scheduledDate ? COLORS.err : C.brd}`,
                      background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {formErrors.scheduledDate && (
                    <span style={{ fontSize: 11.5, color: COLORS.err, marginTop: 4, display: "block" }}>{formErrors.scheduledDate}</span>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, color: C.t3, marginBottom: 4 }}>
                    {isAr ? "الوقت" : "Time"}
                  </label>
                  <input
                    type="time"
                    value={newCampaign.scheduledTime}
                    onChange={(e) => setNewCampaign({ ...newCampaign, scheduledTime: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`,
                      background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Budget (optional) */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
              {isAr ? "الميزانية" : "Budget"} <span style={{ fontSize: 11, fontWeight: 400, color: C.t3 }}>({isAr ? "اختياري" : "optional"})</span>
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", [isAr ? "right" : "left"]: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 13, color: C.t3, pointerEvents: "none",
              }}>
                {isAr ? "ر.س" : "SAR"}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newCampaign.budget}
                onChange={(e) => { setNewCampaign({ ...newCampaign, budget: e.target.value }); setFormErrors((prev) => { const n = { ...prev }; delete n.budget; return n; }); }}
                placeholder={isAr ? "0.00" : "0.00"}
                style={{
                  width: "100%", padding: "10px 14px", [isAr ? "paddingRight" : "paddingLeft"]: 50, borderRadius: 10,
                  border: `1px solid ${formErrors.budget ? COLORS.err : C.brd}`,
                  background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {formErrors.budget && (
              <span style={{ fontSize: 11.5, color: COLORS.err, marginTop: 4, display: "block" }}>{formErrors.budget}</span>
            )}
          </div>

          {/* ── A/B Testing (optional) ── */}
          <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: 18 }}>
            <label
              style={{
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                padding: "10px 14px", borderRadius: 10,
                background: newCampaign.abTest ? `${C.pri}10` : "transparent",
                border: `1.5px solid ${newCampaign.abTest ? C.pri : C.brd}`,
                transition: "all 0.15s",
              }}
            >
              <input
                type="checkbox"
                checked={newCampaign.abTest}
                onChange={(e) => setNewCampaign({ ...newCampaign, abTest: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: C.pri, cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.txt }}>
                  🧪 {isAr ? "تفعيل A/B Testing" : "Enable A/B Testing"}
                </div>
                <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>
                  {isAr
                    ? "أرسل نسختين مختلفتين لمجموعتين، شوف أيّهما أعلى استجابة، ثم أرسل الفائزة لباقي العملاء."
                    : "Ship two body variants to a test pool, see which performs better, then send the winner to the rest."}
                </div>
              </div>
            </label>

            {newCampaign.abTest && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Variant A */}
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                    {isAr ? "النسخة A" : "Variant A"} <span style={{ color: COLORS.err }}>*</span>
                  </label>
                  <textarea
                    value={newCampaign.variantA}
                    onChange={(e) => { setNewCampaign({ ...newCampaign, variantA: e.target.value }); setFormErrors((prev) => { const n = { ...prev }; delete n.variantA; return n; }); }}
                    rows={3}
                    maxLength={1024}
                    placeholder={isAr ? "نصّ النسخة الأولى — يحلّ محلّ {{1}} في القالب" : "First variant body — replaces {{1}} in the template"}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: `1px solid ${formErrors.variantA ? COLORS.err : C.brd}`,
                      background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none",
                      boxSizing: "border-box", resize: "vertical",
                    }}
                  />
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 3, textAlign: isAr ? "left" : "right" }}>
                    {newCampaign.variantA.length} / 1024
                  </div>
                  {formErrors.variantA && (
                    <span style={{ fontSize: 11.5, color: COLORS.err, display: "block" }}>{formErrors.variantA}</span>
                  )}
                </div>

                {/* Variant B */}
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                    {isAr ? "النسخة B" : "Variant B"} <span style={{ color: COLORS.err }}>*</span>
                  </label>
                  <textarea
                    value={newCampaign.variantB}
                    onChange={(e) => { setNewCampaign({ ...newCampaign, variantB: e.target.value }); setFormErrors((prev) => { const n = { ...prev }; delete n.variantB; return n; }); }}
                    rows={3}
                    maxLength={1024}
                    placeholder={isAr ? "نصّ النسخة الثانية — للمقارنة" : "Second variant body — for comparison"}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: `1px solid ${formErrors.variantB ? COLORS.err : C.brd}`,
                      background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none",
                      boxSizing: "border-box", resize: "vertical",
                    }}
                  />
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 3, textAlign: isAr ? "left" : "right" }}>
                    {newCampaign.variantB.length} / 1024
                  </div>
                  {formErrors.variantB && (
                    <span style={{ fontSize: 11.5, color: COLORS.err, display: "block" }}>{formErrors.variantB}</span>
                  )}
                </div>

                {/* Split A% vs B% */}
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                    {isAr ? "تقسيم A / B" : "A / B Split"} —{" "}
                    <span style={{ color: C.pri }}>A: {newCampaign.abSplit}%</span>{" "}
                    <span style={{ color: C.t3 }}>·</span>{" "}
                    <span style={{ color: C.info }}>B: {100 - newCampaign.abSplit}%</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={newCampaign.abSplit}
                    onChange={(e) => setNewCampaign({ ...newCampaign, abSplit: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: C.pri, cursor: "pointer" }}
                  />
                </div>

                {/* Test pool size */}
                <div>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                    {isAr ? "حجم عيّنة الاختبار" : "Test pool size"} —{" "}
                    <span style={{ color: C.pri }}>{newCampaign.abTestSize}%</span>{" "}
                    {newCampaign.abTestSize < 100 && (
                      <span style={{ color: C.t3 }}>
                        ({isAr ? `الـ ${100 - newCampaign.abTestSize}% الباقي ينتظر النسخة الفائزة` : `remaining ${100 - newCampaign.abTestSize}% wait for the winner`})
                      </span>
                    )}
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={10}
                    value={newCampaign.abTestSize}
                    onChange={(e) => setNewCampaign({ ...newCampaign, abTestSize: Number(e.target.value) })}
                    style={{ width: "100%", accentColor: C.pri, cursor: "pointer" }}
                  />
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
                    {isAr
                      ? "نوصي بـ 30% للحملات الكبيرة (1000+ عميل) — يكفي للقياس + يبقي مساحة لإرسال النسخة الفائزة لاحقاً."
                      : "30% recommended for big campaigns (1000+ contacts) — enough to measure, leaves room to ship the winner after."}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected segment info hint */}
          {newCampaign.segment && (
            <div style={{ padding: 16, borderRadius: 12, background: `${COLORS.info}10`, border: `1px solid ${COLORS.info}20`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.info}20`, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.info, flexShrink: 0 }}>
                <Icon name="users" size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>
                  {isAr ? "الشريحة المختارة" : "Selected Segment"}
                </div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>
                  {segments.find((s: any) => s.id === newCampaign.segment)?.name || newCampaign.segment}
                  {segments.find((s: any) => s.id === newCampaign.segment)?.contacts_count != null && (
                    <> &middot; {Number(segments.find((s: any) => s.id === newCampaign.segment)?.contacts_count).toLocaleString()} {isAr ? "جهة اتصال" : "contacts"}</>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ── Detail View Component ──

function DetailView({ campaign: c, onBack, onRefresh }: { campaign: Campaign; onBack: () => void; onRefresh?: () => void }) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  // Poll /progress only while the campaign is actually doing work.
  // 'active' = batch running, 'paused' = paused but still has pending
  // rows worth refreshing once on display. 'completed'/'draft' are
  // terminal — no polling.
  const isLive = c.st === 'active' || c.st === 'sending' || c.st === 'paused';
  const { data: progress } = useCampaignProgress(c.id as any, isLive);

  // Real Behavior Funnel + segment performance + cost summary, fetched
  // from the V2 analytics endpoint. The detail view rendered mock
  // numbers from c.behavior before this — now we read live aggregates
  // off campaign_sends. Falls back to the legacy mock fields when the
  // API hasn't responded yet so the layout never flashes empty.
  const { data: funnelData } = useCampaignFunnel(String(c.id));
  const fStages = (funnelData as any)?.funnel?.stages ?? [];
  const fCost = (funnelData as any)?.cost ?? null;
  const stageCount = (key: string): number => {
    const stage = fStages.find((s: any) => s.key === key);
    return stage ? Number(stage.count) : 0;
  };

  // Per-channel rollup — only meaningful when the campaign uses more
  // than one channel (sms_only / wa_sms / dual). Hidden by the render
  // when nothing has been sent yet OR when the breakdown is a single
  // wa_only row (then the funnel above already tells the story).
  const [channelBreakdown, setChannelBreakdown] = useState<{
    channel_mode: string;
    breakdown: Array<{ channel: string; total: number; sent: number; failed: number; pending: number; delivered: number; read: number }>;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.get(`/campaigns/${c.id}/channel-breakdown`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        setChannelBreakdown(data ?? null);
      })
      .catch(() => { if (!cancelled) setChannelBreakdown(null); });
    return () => { cancelled = true; };
  }, [c.id]);

  // V2 per-campaign AI insights — rule-based cards generated by the
  // backend insight engine. Cached on the campaigns row, regenerated
  // hourly for active / daily for completed. We fetch once on mount;
  // a manual refresh button below forces regeneration.
  const [insights, setInsights] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    api.get(`/campaigns/${c.id}/ai/insights-detail`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        setInsights(data?.insights ?? []);
      })
      .catch(() => { if (!cancelled) setInsights([]); })
      .finally(() => { if (!cancelled) setInsightsLoading(false); });
    return () => { cancelled = true; };
  }, [c.id]);

  // A/B testing results — fetched only when this campaign is an
  // A/B test (the endpoint returns 404 otherwise, which we treat as
  // "no panel"). Polls alongside the live progress hook so the
  // operator sees variant performance update in real time during a
  // running test.
  const [abResults, setAbResults] = useState<any | null>(null);
  const [promotingWinner, setPromotingWinner] = useState(false);
  const fetchAbResults = useCallback(() => {
    api.get(`/campaigns/${c.id}/ab-results`)
      .then((res) => setAbResults(res?.data?.data ?? res?.data ?? null))
      .catch(() => setAbResults(null));
  }, [c.id]);
  useEffect(() => {
    if (!(c as any).abTest && !(c as any).ab_test) return;
    fetchAbResults();
    if (!isLive) return;
    const t = setInterval(fetchAbResults, 8000);
    return () => clearInterval(t);
  }, [c, isLive, fetchAbResults]);

  const handlePromoteWinner = async (variant: 'a' | 'b') => {
    if (promotingWinner) return;
    if (!confirm(isAr
      ? `سيتم إرسال النسخة ${variant.toUpperCase()} لباقي العملاء (${abResults?.holdout?.total ?? 0} مستلم). متأكّد؟`
      : `Variant ${variant.toUpperCase()} will be sent to remaining ${abResults?.holdout?.total ?? 0} recipients. Confirm?`,
    )) return;
    setPromotingWinner(true);
    try {
      const res = await api.post(`/campaigns/${c.id}/ab-promote-winner`, { variant });
      const data = res?.data?.data ?? res?.data;
      showToast(isAr
        ? `تمّ ترقية النسخة ${variant.toUpperCase()} — ${data?.queued ?? 0} رسالة في الطابور`
        : `Variant ${variant.toUpperCase()} promoted — ${data?.queued ?? 0} messages queued`);
      fetchAbResults();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? "تعذّرت ترقية النسخة الفائزة" : "Promote winner failed"), "error");
    } finally {
      setPromotingWinner(false);
    }
  };

  // Retarget Non-openers — V2 wires this to actually create a draft
  // follow-up campaign instead of just returning the count. The new
  // campaign lands in 'draft' state with the non-openers pre-loaded
  // as recipients; the operator finishes editing (template, copy,
  // schedule) inside the regular campaign editor.
  const [retargeting, setRetargeting] = useState(false);
  const handleRetargetNonOpeners = async () => {
    if (retargeting) return;
    setRetargeting(true);
    try {
      const res = await api.post(`/campaigns/${c.id}/retarget-non-openers/create`);
      const data = res.data?.data ?? res.data;
      const count = data?.recipient_count ?? 0;
      showToast(isAr
        ? `تم إنشاء حملة متابعة بـ ${count} مستلم. حرّر القالب ثم اضغط إرسال.`
        : `Created follow-up campaign with ${count} recipients. Edit the template then send.`);
      onRefresh?.();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? "تعذّر إنشاء حملة المتابعة" : "Failed to create follow-up"));
    } finally {
      setRetargeting(false);
    }
  };

  // Action button busy-state — prevents double-click during the 100-200ms
  // round trip to the backend.
  const [busy, setBusy] = useState<string | null>(null);

  const statusLabel = (st: string) => {
    const map: Record<string, string> = isAr
      ? { active: "نشطة", completed: "مكتملة", scheduled: "مجدولة", draft: "مسودة", paused: "متوقفة", sending: "جاري الإرسال", cancelled: "ملغاة" }
      : { active: "Active", completed: "Completed", scheduled: "Scheduled", draft: "Draft", paused: "Paused", sending: "Sending", cancelled: "Cancelled" };
    return map[st] || st;
  };

  // When polling, the live counters from /progress override the stale
  // values from the list query. Falls back to the campaign object's
  // own counters (which the API already exposes via CampaignResource).
  const live = progress || {
    sent: (c as any).sent ?? 0,
    failed: (c as any).failed ?? 0,
    pending: (c as any).pending ?? 0,
    total: c.recipients ?? 0,
    progressPct: 0,
  };
  const totalForBar = live.total || c.recipients || 1;
  const sentPct = Math.round(((live.sent + live.failed) / totalForBar) * 100);

  const callAction = async (action: 'send' | 'pause' | 'resume') => {
    if (busy) return;
    setBusy(action);
    try {
      await api.post(`/campaigns/${c.id}/${action}`);
      const msgMap: Record<string, [string, string]> = {
        send:   [isAr ? "بدأ الإرسال" : "Sending started",     isAr ? "تعذّر بدء الإرسال" : "Failed to start sending"],
        pause:  [isAr ? "تم إيقاف الحملة مؤقتاً" : "Campaign paused", isAr ? "تعذّر الإيقاف" : "Failed to pause"],
        resume: [isAr ? "تم استئناف الحملة" : "Campaign resumed",     isAr ? "تعذّر الاستئناف" : "Failed to resume"],
      };
      showToast(msgMap[action][0]);
      onRefresh?.();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? "حدث خطأ" : "Something went wrong"));
    } finally {
      setBusy(null);
    }
  };

  const kpis = useMemo(
    () => [
      { label: isAr ? "\u0627\u0644\u0645\u0633\u062A\u0644\u0645\u0648\u0646" : "Recipients", value: c.recipients.toLocaleString(), icon: "users", color: COLORS.pri },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u062A\u0648\u0635\u064A\u0644" : "Delivered", value: c.delivery + "%", icon: "check", color: COLORS.ok },
      { label: isAr ? "\u0627\u0644\u0641\u062A\u062D" : "Opens", value: c.readRate + "%", icon: "msg", color: COLORS.info },
      { label: isAr ? "\u0627\u0644\u0646\u0642\u0631\u0627\u062A" : "Clicks", value: (stageCount('clicked') || c.behavior?.clicked || 0).toLocaleString(), icon: "link", color: COLORS.warn },
      { label: isAr ? "\u0627\u0644\u0631\u062F\u0648\u062F" : "Replies", value: c.replyRate + "%", icon: "send", color: COLORS.sec },
      { label: isAr ? "\u0627\u0644\u062A\u062D\u0648\u064A\u0644" : "Conversion", value: (stageCount('converted') || c.behavior?.converted || 0).toLocaleString(), icon: "target", color: COLORS.ai },
      // Cost / ROI \u2014 read live from /funnel response when available so a
      // refreshed campaign updates without a full page reload. Currency
      // is SAR (matching the wallet) instead of $ \u2014 old code was using $.
      { label: isAr ? "\u0627\u0644\u062A\u0643\u0644\u0641\u0629" : "Cost", value: ((fCost?.cost_sar ?? c.cost) || 0).toLocaleString() + " " + (isAr ? "\u0631.\u0633" : "SAR"), icon: "wallet", color: COLORS.err },
      { label: "ROI", value: fCost?.roi_pct != null ? `${fCost.roi_pct > 0 ? "+" : ""}${fCost.roi_pct}%` : (c.roi || "\u2014"), icon: "chart", color: COLORS.ok },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c, isAr, fStages, fCost]
  );

  // Behavior funnel data \u2014 prefers live API counts; falls back to the
  // legacy c.behavior mock for old campaigns or while the funnel call
  // is still in flight. funnelMax is "sent" so each step is a % of the
  // campaign's actual send volume rather than the original recipient
  // list (catches the case where some sends failed).
  const sentLive = stageCount('sent') || c.recipients || 1;
  const funnelMax = sentLive;
  const funnel = useMemo(
    () => [
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644" : "Sent", value: stageCount('sent') || c.recipients, pct: 100 },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u0641\u062A\u062D" : "Opened", value: stageCount('read') || c.behavior?.opened || 0, pct: Math.round(((stageCount('read') || c.behavior?.opened || 0) / funnelMax) * 100) },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u0646\u0642\u0631" : "Clicked", value: stageCount('clicked') || c.behavior?.clicked || 0, pct: Math.round(((stageCount('clicked') || c.behavior?.clicked || 0) / funnelMax) * 100) },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u0631\u062F" : "Replied", value: stageCount('replied') || c.behavior?.replied || 0, pct: Math.round(((stageCount('replied') || c.behavior?.replied || 0) / funnelMax) * 100) },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u062A\u062D\u0648\u064A\u0644" : "Converted", value: stageCount('converted') || c.behavior?.converted || 0, pct: Math.round(((stageCount('converted') || c.behavior?.converted || 0) / funnelMax) * 100) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [c, isAr, funnelMax, fStages]
  );

  const funnelColors = [COLORS.pri, COLORS.info, COLORS.warn, COLORS.sec, COLORS.ok];

  return (
    <div
      style={{
        padding: isMobile ? "0 14px 14px" : "0 28px 28px",
        direction: isAr ? "rtl" : "ltr",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Back Button + Header */}
      <div style={{ marginBottom: 24 }}>
        <Button outline onClick={onBack} style={{ marginBottom: 16 }}>
          <Icon name="send" size={14} />
          {isAr ? "\u0631\u062C\u0648\u0639" : "Back"}
        </Button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.txt }}>{c.name}</h1>
              <Badge color={getStatusColor(c.st)}>{statusLabel(c.st)}</Badge>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: C.t2, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="timer" size={12} /> {c.date}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="users" size={12} /> {fieldName(c.segment) || (isAr ? "—" : "—")}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="file" size={12} /> {fieldName(c.template) || (isAr ? "—" : "—")}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Stage-specific actions: Send for draft/scheduled, Pause
                while active, Resume while paused. The list page's
                Duplicate/Edit/Export are still available below for
                terminal states. */}
            {(c.st === 'draft' || c.st === 'scheduled') && (
              <Button primary onClick={() => callAction('send')} disabled={busy !== null}>
                <Icon name="send" size={13} />
                {busy === 'send'
                  ? (isAr ? "\u062C\u0627\u0631\u064A \u0627\u0644\u0628\u062F\u0621..." : "Starting...")
                  : (isAr ? "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0622\u0646" : "Send now")}
              </Button>
            )}
            {c.st === 'active' && (
              <Button outline onClick={() => callAction('pause')} disabled={busy !== null}>
                <Icon name="pause" size={13} />
                {busy === 'pause'
                  ? (isAr ? "\u062C\u0627\u0631\u064A \u0627\u0644\u0625\u064A\u0642\u0627\u0641..." : "Pausing...")
                  : (isAr ? "\u0625\u064A\u0642\u0627\u0641 \u0645\u0624\u0642\u062A" : "Pause")}
              </Button>
            )}
            {c.st === 'paused' && (
              <Button primary onClick={() => callAction('resume')} disabled={busy !== null}>
                <Icon name="send" size={13} />
                {busy === 'resume'
                  ? (isAr ? "\u062C\u0627\u0631\u064A \u0627\u0644\u0627\u0633\u062A\u0626\u0646\u0627\u0641..." : "Resuming...")
                  : (isAr ? "\u0627\u0633\u062A\u0626\u0646\u0627\u0641" : "Resume")}
              </Button>
            )}
            <Button outline onClick={() => showToast(isAr ? "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u0645\u0644\u0629" : "Edit campaign")}>
              <Icon name="pencil" size={13} />
              {isAr ? "\u062A\u0639\u062F\u064A\u0644" : "Edit"}
            </Button>
            {/* Retarget non-openers \u2014 only meaningful for completed
                campaigns where Sent > 0 and there's a real "non-openers"
                set to chase. Hidden on drafts/scheduled because the
                count is meaningless before any send happens. */}
            {(c.st === 'completed' || c.st === 'active' || c.st === 'paused') && (
              <Button
                outline
                onClick={handleRetargetNonOpeners}
                disabled={retargeting}
                style={{ color: COLORS.sec, borderColor: COLORS.sec }}
              >
                <Icon name="target" size={13} />
                {retargeting
                  ? (isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062D\u0633\u0627\u0628..." : "Counting...")
                  : (isAr ? "\u0625\u0639\u0627\u062F\u0629 \u0627\u0633\u062A\u0647\u062F\u0627\u0641 \u0645\u0646 \u0644\u0645 \u064A\u0641\u062A\u062D\u0648\u0627" : "Retarget non-openers")}
              </Button>
            )}
            <Button outline onClick={() => {
              api.post(`/campaigns/${c.id}/duplicate`).then(() => {
                showToast(isAr ? "\u062A\u0645 \u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Campaign duplicated");
              }).catch(() => showToast(isAr ? "\u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Duplicate campaign"));
            }}>
              <Icon name="copy" size={13} />
              {isAr ? "\u062A\u0643\u0631\u0627\u0631" : "Duplicate"}
            </Button>
            <Button primary onClick={() => {
              api.post(`/campaigns/${c.id}/export`).then(() => {
                showToast(isAr ? "\u062A\u0645 \u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u062A\u0642\u0631\u064A\u0631" : "Report exported");
              }).catch(() => showToast(isAr ? "\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u062A\u0642\u0631\u064A\u0631" : "Export report"));
            }}>
              <Icon name="sheet" size={13} />
              {isAr ? "\u062A\u0635\u062F\u064A\u0631" : "Export"}
            </Button>
          </div>
        </div>
      </div>

      {/* Meta pacing indicator — shows when actual throughput drops
          below 50% of the configured rate for ≥10 minutes. Backend
          heuristic in CampaignService::detectMetaPacing. Sits above
          the progress card so it's the first thing the operator sees
          when something's slowing the campaign down. */}
      {isLive && (progress as any)?.pacing?.active && (() => {
        const p = (progress as any).pacing;
        return (
          <Card style={{ marginBottom: 16, padding: 16, background: `${COLORS.warn}10`, border: `1px solid ${COLORS.warn}40` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ fontSize: 22, lineHeight: 1 }}>🐢</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.txt, marginBottom: 4 }}>
                  {isAr ? "Meta يخفّض سرعة الإرسال (Pacing)" : "Meta is throttling send rate (Pacing)"}
                </div>
                <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6, marginBottom: 8 }}>
                  {isAr
                    ? `السرعة الفعليّة الآن ${p.actualRatePerMin?.toFixed?.(0) ?? p.actualRatePerMin} رسالة/دقيقة، بينما المتوقّع ${p.expectedRatePerMin?.toFixed?.(0) ?? p.expectedRatePerMin} رسالة/دقيقة (منذ ${p.minutesElapsed} دقيقة).`
                    : `Actual rate ${p.actualRatePerMin?.toFixed?.(0) ?? p.actualRatePerMin} msg/min — expected ${p.expectedRatePerMin?.toFixed?.(0) ?? p.expectedRatePerMin} msg/min (over ${p.minutesElapsed} minutes).`}
                </div>
                {p.tip && (
                  <div style={{ fontSize: 11.5, color: C.t3, lineHeight: 1.6, padding: "6px 10px", background: C.card, borderRadius: 6, border: `1px solid ${C.brd}` }}>
                    💡 {p.tip}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Live Progress — only while the campaign is doing work. The
          status banner above already shows draft/scheduled/completed;
          this card adds the moving parts (counters + bar) for active
          and paused. */}
      {isLive && (
        <Card style={{ marginBottom: 24, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: c.st === 'paused' ? `${COLORS.warn}18` : `${COLORS.pri}18`,
                  color:      c.st === 'paused' ? COLORS.warn : COLORS.pri,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={c.st === 'paused' ? "pause" : "send"} size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: C.txt, fontSize: 14 }}>
                  {c.st === 'paused'
                    ? (isAr ? "متوقفة مؤقتاً" : "Paused")
                    : (isAr ? "جاري الإرسال" : "Sending in progress")}
                </div>
                <div style={{ fontSize: 12, color: C.t2 }}>
                  {isAr
                    ? `${live.sent.toLocaleString()} من ${(live.total || c.recipients).toLocaleString()} رسالة`
                    : `${live.sent.toLocaleString()} of ${(live.total || c.recipients).toLocaleString()} messages`}
                  {live.failed > 0 && (
                    <span style={{ color: COLORS.err, marginInlineStart: 8 }}>
                      · {live.failed.toLocaleString()} {isAr ? "فاشل" : "failed"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.txt }}>
              {sentPct}%
            </div>
          </div>
          <div style={{ width: "100%", height: 10, borderRadius: 5, background: C.inp, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 5,
                width: `${sentPct}%`,
                background: c.st === 'paused' ? COLORS.warn : COLORS.pri,
                transition: "width 0.6s ease-out",
              }}
            />
          </div>
        </Card>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {kpis.map((k) => (
          <Card key={k.label} style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: `${k.color}18`,
                  color: k.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={k.icon} size={15} />
              </div>
              <span style={{ fontSize: 11.5, color: C.t2, fontWeight: 500 }}>{k.label}</span>
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: k.label === "ROI" && c.roi.startsWith("+") ? COLORS.ok : C.txt,
              }}
            >
              {k.value}
            </div>
          </Card>
        ))}
      </div>

      {/* A/B Testing Results \u2014 only when this campaign is an A/B test */}
      {abResults && (
        <Card style={{ marginBottom: 24 }}>
          <CardHeader title={isAr ? "\ud83e\uddea \u0646\u062a\u0627\u0626\u062c A/B Testing" : "\ud83e\uddea A/B Testing Results"} />
          <div style={{ padding: 20 }}>
            {(() => {
              const a = abResults.variants?.a ?? { sent: 0, delivered: 0, read: 0, replied: 0, clicked: 0, read_rate: 0, reply_rate: 0 };
              const b = abResults.variants?.b ?? { sent: 0, delivered: 0, read: 0, replied: 0, clicked: 0, read_rate: 0, reply_rate: 0 };
              const winner = abResults.winner; // 'a' / 'b' / null
              const promoted = !!abResults.promoted_at;
              const holdoutTotal = abResults.holdout?.total ?? 0;

              const StatRow = ({ label, va, vb, suffix = "" }: { label: string; va: number; vb: number; suffix?: string }) => (
                <tr>
                  <td style={{ padding: "10px 12px", color: C.t2, fontSize: 12.5, borderBottom: `1px solid ${C.brd}` }}>{label}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: C.txt, fontSize: 13, borderBottom: `1px solid ${C.brd}`, background: winner === 'a' ? `${COLORS.ok}10` : "transparent" }}>
                    {va.toLocaleString()}{suffix}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: C.txt, fontSize: 13, borderBottom: `1px solid ${C.brd}`, background: winner === 'b' ? `${COLORS.ok}10` : "transparent" }}>
                    {vb.toLocaleString()}{suffix}
                  </td>
                </tr>
              );

              return (
                <>
                  {/* Comparison table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: "12px", textAlign: isAr ? "right" : "left", color: C.t3, fontWeight: 600, fontSize: 11.5 }}>
                            {isAr ? "\u0627\u0644\u0645\u0642\u064a\u0627\u0633" : "Metric"}
                          </th>
                          <th style={{ padding: "12px", textAlign: "center", color: winner === 'a' ? COLORS.ok : C.pri, fontWeight: 700, fontSize: 13 }}>
                            {isAr ? "\u0627\u0644\u0646\u0633\u062e\u0629 A" : "Variant A"} {winner === 'a' && "\u2b50"}
                          </th>
                          <th style={{ padding: "12px", textAlign: "center", color: winner === 'b' ? COLORS.ok : COLORS.info, fontWeight: 700, fontSize: 13 }}>
                            {isAr ? "\u0627\u0644\u0646\u0633\u062e\u0629 B" : "Variant B"} {winner === 'b' && "\u2b50"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <StatRow label={isAr ? "\u0627\u0644\u0645\u0631\u0633\u064e\u0644" : "Sent"} va={a.sent} vb={b.sent} />
                        <StatRow label={isAr ? "\u0627\u0644\u0645\u0633\u0644\u064e\u0651\u0645" : "Delivered"} va={a.delivered} vb={b.delivered} />
                        <StatRow label={isAr ? "\u0627\u0644\u0645\u0642\u0631\u0648\u0621" : "Read"} va={a.read} vb={b.read} />
                        <StatRow label={isAr ? "\u0631\u062f\u0651\u0648\u0627" : "Replied"} va={a.replied} vb={b.replied} />
                        <StatRow label={isAr ? "\u0646\u0642\u0631\u0648\u0627" : "Clicked"} va={a.clicked} vb={b.clicked} />
                        <StatRow label={isAr ? "\u0645\u0639\u062f\u0651\u0644 \u0627\u0644\u0642\u0631\u0627\u0621\u0629" : "Read rate"} va={a.read_rate} vb={b.read_rate} suffix="%" />
                        <StatRow label={isAr ? "\u0645\u0639\u062f\u0651\u0644 \u0627\u0644\u0631\u062f\u0651" : "Reply rate"} va={a.reply_rate} vb={b.reply_rate} suffix="%" />
                      </tbody>
                    </table>
                  </div>

                  {/* Winner + promote */}
                  <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: promoted ? `${COLORS.ok}10` : winner ? `${C.pri}10` : `${C.brd}30`, border: `1px solid ${promoted ? COLORS.ok : winner ? C.pri : C.brd}` }}>
                    {promoted ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>\u2705</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.ok }}>
                            {isAr ? `\u062a\u0645\u0651 \u062a\u0631\u0642\u064a\u0629 \u0627\u0644\u0646\u0633\u062e\u0629 ${(abResults.winner ?? '').toUpperCase()}` : `Variant ${(abResults.winner ?? '').toUpperCase()} promoted`}
                          </div>
                          <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>
                            {isAr ? "\u062a\u0645 \u0625\u0631\u0633\u0627\u0644\u0647\u0627 \u0644\u0643\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0641\u064a \u0639\u064a\u0651\u0646\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631." : "Sent to the holdout pool."}
                          </div>
                        </div>
                      </div>
                    ) : winner && holdoutTotal > 0 ? (
                      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.txt }}>
                            {isAr ? `\u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u0641\u0627\u0626\u0632\u0629: ${winner.toUpperCase()}` : `Winning variant: ${winner.toUpperCase()}`}
                          </div>
                          <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>
                            {isAr
                              ? `${holdoutTotal} \u0645\u0633\u062a\u0644\u0645 \u0641\u064a \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631 \u0644\u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0646\u0633\u062e\u0629 \u0627\u0644\u0641\u0627\u0626\u0632\u0629.`
                              : `${holdoutTotal} recipients waiting on the winner.`}
                          </div>
                        </div>
                        <Button primary onClick={() => handlePromoteWinner(winner as 'a' | 'b')} disabled={promotingWinner}>
                          {promotingWinner
                            ? (isAr ? "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0631\u0633\u0627\u0644..." : "Promoting...")
                            : (isAr ? `\ud83d\udce4 \u0623\u0631\u0633\u0644 \u0627\u0644\u0646\u0633\u062e\u0629 ${winner.toUpperCase()} \u0644\u0644\u0628\u0627\u0642\u064a\u0646` : `\ud83d\udce4 Send variant ${winner.toUpperCase()} to the rest`)}
                        </Button>
                      </div>
                    ) : winner && holdoutTotal === 0 ? (
                      <div style={{ fontSize: 12.5, color: C.t2 }}>
                        {isAr
                          ? `\u0627\u0644\u0646\u0633\u062e\u0629 ${winner.toUpperCase()} \u0647\u064a \u0627\u0644\u0623\u0641\u0636\u0644 \u0623\u062f\u0627\u0621\u064b\u060c \u0644\u0643\u0646 \u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0633\u062a\u0644\u0645\u0648\u0646 \u0641\u064a \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631 (\u0627\u0644\u062d\u0645\u0644\u0629 \u0643\u0627\u0645\u0644\u0629 \u0627\u0633\u062a\u0644\u0645\u062a).`
                          : `Variant ${winner.toUpperCase()} performs best, but there's no holdout pool to ship it to.`}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12.5, color: C.t2 }}>
                        {isAr
                          ? "\u0644\u0627 \u064a\u0645\u0643\u0646 \u062a\u062d\u062f\u064a\u062f \u0641\u0627\u0626\u0632 \u0628\u0639\u062f \u2014 \u0627\u0646\u062a\u0638\u0631 \u0661\u0660 \u0645\u0631\u0633\u064e\u0644 \u0644\u0643\u0644 \u0646\u0633\u062e\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644."
                          : "No winner yet \u2014 wait for at least 10 sends per variant."}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      )}

      {/* Behavior Funnel \u2014 when sent count is 0 the funnel is just
          5 empty bars which confuses operators on a fresh campaign.
          Show a friendly empty state instead until something ships. */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title={isAr ? "\u0645\u0633\u0627\u0631 \u0627\u0644\u0633\u0644\u0648\u0643" : "Behavior Funnel"} />
        {sentLive <= 1 && (c.st === 'draft' || c.st === 'scheduled') ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>\ud83d\udcca</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.txt, marginBottom: 6 }}>
              {isAr ? "\u0641\u064a \u0627\u0646\u062a\u0638\u0627\u0631 \u0628\u062f\u0621 \u0627\u0644\u0625\u0631\u0633\u0627\u0644" : "Waiting for sends to start"}
            </div>
            <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
              {isAr
                ? "\u0633\u062a\u0638\u0647\u0631 \u0645\u0631\u0627\u062d\u0644 \u0627\u0644\u0645\u0633\u0627\u0631 (\u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u2192 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u2192 \u0627\u0644\u0641\u062a\u062d \u2192 \u0627\u0644\u0646\u0642\u0631 \u2192 \u0627\u0644\u062a\u062d\u0648\u064a\u0644) \u0647\u0646\u0627 \u0641\u0648\u0631 \u0628\u062f\u0621 \u0627\u0644\u062d\u0645\u0644\u0629."
                : "Funnel stages (Sent \u2192 Delivered \u2192 Opened \u2192 Clicked \u2192 Converted) will populate once the campaign starts."}
            </div>
          </div>
        ) : (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {funnel.map((step, i) => (
              <div key={step.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 500, color: C.txt }}>{step.label}</span>
                  <span style={{ color: C.t2 }}>
                    {step.value.toLocaleString()} ({step.pct}%)
                  </span>
                </div>
                <div style={{ width: "100%", height: 10, borderRadius: 5, background: C.inp, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 5,
                      width: `${step.pct}%`,
                      background: funnelColors[i],
                      transition: "width 0.6s ease-out",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Channel Breakdown \u2014 only when the campaign actually used >1
          channel. wa_only campaigns hide this since the funnel above
          already shows the full picture for the single channel. */}
      {channelBreakdown && channelBreakdown.breakdown.length > 1 && (
        <Card style={{ marginBottom: 24 }}>
          <CardHeader title={isAr ? "\u0627\u0644\u062A\u0648\u0632\u064A\u0639 \u062D\u0633\u0628 \u0627\u0644\u0642\u0646\u0627\u0629" : "Channel Breakdown"} />
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            {channelBreakdown.breakdown.map((row) => {
              const isWa  = row.channel === "whatsapp";
              const total = Math.max(1, row.total);
              const deliveryPct = Math.round((row.delivered / total) * 100);
              const failPct     = Math.round((row.failed / total) * 100);
              const readPct     = Math.round((row.read / total) * 100);
              return (
                <div key={row.channel} style={{
                  border: `1px solid ${C.brd}`, borderRadius: 12, padding: 16,
                  background: isWa ? `${COLORS.ok}08` : `${C.info}08`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: C.txt }}>
                      <span style={{ fontSize: 18 }}>{isWa ? "\uD83D\uDCF1" : "\uD83D\uDCAC"}</span>
                      {isWa ? (isAr ? "\u0648\u0627\u062A\u0633\u0627\u0628" : "WhatsApp") : "SMS"}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: isWa ? COLORS.ok : C.info }}>
                      {row.total.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11.5 }}>
                    <div>
                      <div style={{ color: C.t3 }}>{isAr ? "\u062A\u0633\u0644\u064A\u0645" : "Delivered"}</div>
                      <div style={{ fontWeight: 700, color: C.txt, fontSize: 14 }}>{row.delivered.toLocaleString()} <span style={{ fontSize: 10, color: C.t3 }}>({deliveryPct}%)</span></div>
                    </div>
                    <div>
                      <div style={{ color: C.t3 }}>{isAr ? "\u0642\u0631\u0627\u0621\u0629" : "Read"}</div>
                      <div style={{ fontWeight: 700, color: C.txt, fontSize: 14 }}>{row.read.toLocaleString()} <span style={{ fontSize: 10, color: C.t3 }}>({readPct}%)</span></div>
                    </div>
                    <div>
                      <div style={{ color: C.t3 }}>{isAr ? "\u0641\u0634\u0644" : "Failed"}</div>
                      <div style={{ fontWeight: 700, color: row.failed > 0 ? COLORS.err : C.txt, fontSize: 14 }}>{row.failed.toLocaleString()} <span style={{ fontSize: 10, color: C.t3 }}>({failPct}%)</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {channelBreakdown.channel_mode === "wa_sms" && (
            <div style={{ padding: "0 20px 16px", fontSize: 11, color: C.t3 }}>
              {isAr
                ? "\u2139\uFE0F \u0648\u0636\u0639 fallback: SMS \u0623\u064F\u0631\u0633\u0644\u062A \u0641\u0642\u0637 \u0644\u0644\u0645\u0633\u062A\u0644\u0645\u064A\u0646 \u0627\u0644\u0630\u064A\u0646 \u0641\u0634\u0644 \u062A\u0633\u0644\u064A\u0645 \u0648\u0627\u062A\u0633\u0627\u0628 \u0644\u0647\u0645."
                : "\u2139\uFE0F Fallback mode: SMS rows were only created for recipients whose WhatsApp delivery failed."}
            </div>
          )}
        </Card>
      )}

      {/* Segment Performance */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title={isAr ? "\u0623\u062F\u0627\u0621 \u0627\u0644\u0634\u0631\u0627\u0626\u062D" : "Segment Performance"} />
        <DataTable
          headers={[
            isAr ? "\u0627\u0644\u0634\u0631\u064A\u062D\u0629" : "Segment",
            isAr ? "\u0627\u0644\u0645\u0631\u0633\u0644" : "Sent",
            isAr ? "\u0627\u0644\u0641\u062A\u062D%" : "Open%",
            isAr ? "\u0627\u0644\u0646\u0642\u0631%" : "Click%",
            isAr ? "\u0627\u0644\u062A\u062D\u0648\u064A\u0644%" : "Conv%",
          ]}
          rows={c.segments.map((seg) => [
            <span key="name" style={{ fontWeight: 600, color: C.txt }}>{seg.name}</span>,
            <span key="sent">{seg.sent.toLocaleString()}</span>,
            <span key="open" style={{ color: seg.open >= 95 ? COLORS.ok : undefined }}>{seg.open}%</span>,
            <span key="click">{seg.click}%</span>,
            <span key="conv" style={{ fontWeight: 600, color: seg.conv >= 20 ? COLORS.ok : undefined }}>
              {seg.conv}%
            </span>,
          ])}
        />
      </Card>

      {/* AI Insights \u2014 V2 reads from the live insight engine. Each
          card has a tone (success/warning/danger/info) that drives
          its colour, an icon, and an optional action. Falls back to
          the legacy c.aiInsights string array if the engine hasn't
          responded yet (initial render only). */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader
          title={isAr ? "\u0631\u0624\u0649 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A" : "AI Insights"}
          actionLabel={isAr ? "\u062A\u062D\u062F\u064A\u062B" : "Refresh"}
          onAction={async () => {
            try {
              const res = await api.post(`/campaigns/${c.id}/ai/insights-detail/refresh`);
              const data = res.data?.data ?? res.data;
              setInsights(data?.insights ?? []);
              showToast(isAr ? "\u062A\u0645 \u0627\u0644\u062A\u062D\u062F\u064A\u062B \u2713" : "Refreshed \u2713");
            } catch {
              showToast(isAr ? "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062A\u062D\u062F\u064A\u062B" : "Couldn't refresh");
            }
          }}
        />
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {insightsLoading ? (
            <div style={{ padding: 16, color: C.t2, fontSize: 13, textAlign: "center", gridColumn: "1 / -1" }}>
              {isAr ? "\u062C\u0627\u0631\u064D \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u062D\u0645\u0644\u0629..." : "Analysing campaign..."}
            </div>
          ) : insights.length > 0 ? (
            insights.map((insight, i) => {
              // tone \u2192 accent colour mapping. Insights from the
              // backend carry one of: success / warning / danger / info.
              const toneColor = insight.tone === "success" ? COLORS.ok
                : insight.tone === "warning" ? COLORS.warn
                : insight.tone === "danger"  ? COLORS.err
                : COLORS.info;
              return (
                <div
                  key={i}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    background: `${toneColor}0F`,
                    border: `1px solid ${toneColor}30`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      fontSize: 18,
                      lineHeight: 1,
                      flexShrink: 0,
                      marginTop: 1,
                    }}>
                      {insight.icon ?? "\uD83D\uDCA1"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: toneColor, marginBottom: 4 }}>
                        {insight.title}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.txt, lineHeight: 1.6 }}>
                        {insight.message}
                      </div>
                    </div>
                  </div>
                  {/* Action button \u2014 only shows when the insight
                      proposes a concrete next step. Wired to the
                      existing Retarget handler when applicable. */}
                  {insight.action === "retarget_non_openers" && (
                    <Button small outline style={{ alignSelf: "flex-start", color: toneColor, borderColor: toneColor }}
                      onClick={handleRetargetNonOpeners}
                      disabled={retargeting}>
                      <Icon name="target" size={11} />
                      {isAr ? "\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D" : "Apply suggestion"}
                    </Button>
                  )}
                  {insight.action === "duplicate" && (
                    <Button small outline style={{ alignSelf: "flex-start", color: toneColor, borderColor: toneColor }}
                      onClick={() => {
                        api.post(`/campaigns/${c.id}/duplicate`).then(() => {
                          showToast(isAr ? "\u062A\u0645 \u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Duplicated");
                        }).catch(() => showToast(isAr ? "\u0641\u0634\u0644 \u0627\u0644\u062A\u0643\u0631\u0627\u0631" : "Duplicate failed"));
                      }}>
                      <Icon name="copy" size={11} />
                      {isAr ? "\u0643\u0631\u0651\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Duplicate"}
                    </Button>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: 16, color: C.t2, fontSize: 13, textAlign: "center", gridColumn: "1 / -1" }}>
              {isAr ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0648\u0635\u064A\u0627\u062A \u062D\u0627\u0644\u064A\u0651\u0627\u064B." : "No insights yet."}
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button
          primary
          onClick={() => {
            api.post(`/campaigns/${c.id}/resend`).then(() => {
              showToast(isAr ? "\u062A\u0645 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644" : "Resent to non-openers");
            }).catch(() => showToast(isAr ? "\u0625\u0639\u0627\u062F\u0629 \u0625\u0631\u0633\u0627\u0644 \u0644\u0644\u0645\u062A\u0628\u0642\u064A\u0646" : "Resend to non-openers"));
          }}
        >
          <Icon name="refresh" size={14} />
          {isAr ? "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644" : "Resend to Non-Openers"}
        </Button>
        <Button
          outline
          onClick={() => showToast(isAr ? "\u0627\u062E\u062A\u0628\u0627\u0631 A/B" : "A/B Test")}
          style={{ borderColor: `${COLORS.ai}66`, color: COLORS.ai }}
        >
          <Icon name="zap" size={14} />
          {isAr ? "\u0627\u062E\u062A\u0628\u0627\u0631 A/B" : "A/B Test"}
        </Button>
        <Button
          outline
          onClick={() => {
            api.post(`/campaigns/${c.id}/archive`).then(() => {
              showToast(isAr ? "\u062A\u0645 \u0623\u0631\u0634\u0641\u0629 \u0627\u0644\u062D\u0645\u0644\u0629" : "Campaign archived");
            }).catch(() => showToast(isAr ? "\u0623\u0631\u0634\u0641\u0629 \u0627\u0644\u062D\u0645\u0644\u0629" : "Archive campaign"));
          }}
        >
          <Icon name="bookmark" size={14} />
          {isAr ? "\u0623\u0631\u0634\u0641\u0629" : "Archive"}
        </Button>
      </div>
    </div>
  );
}
