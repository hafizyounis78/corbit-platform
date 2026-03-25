"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Button, Card, CardHeader, Badge, TabBar, DataTable, Modal, SearchInput, Pagination } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { getStatusColor } from "@/lib/utils/status-color";
import type { Campaign } from "@/data/campaigns";
import { useCampaigns, useCampaignStats, useTemplates as useTemplatesApi, useSegments as useSegmentsApi } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { COLORS, GRADIENT } from "@/lib/constants/colors";
import { FONT_FAMILY } from "@/lib/constants/font";

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
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    template: "",
    segment: "",
    scheduledDate: "",
    scheduledTime: "09:00",
    sendNow: true,
    budget: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAGE_SIZE = 50;

  // Fetch from API, fall back to mock data
  const { data: apiResponse, isLoading, mutate } = useCampaigns({ status: tab === "all" ? undefined : tab, search: serverSearch || undefined, page });

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

  // Search: Enter key triggers server search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setServerSearch(search);
      setPage(1);
    }
  };

  const { data: templatesApiResponse } = useTemplatesApi({ status: "approved" });
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
    if (tab === "all") return campaigns;
    const statusMap: Record<string, string> = {
      active: "active",
      completed: "completed",
      scheduled: "scheduled",
      draft: "draft",
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
    ],
    [isAr]
  );

  // ── Detail View ──
  if (selected) {
    return <DetailView campaign={selected} onBack={() => setSelectedId(null)} />;
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
        <Button primary onClick={() => { setNewCampaign({ name: "", template: "", segment: "", scheduledDate: "", scheduledTime: "09:00", sendNow: true, budget: "" }); setFormErrors({}); setIsSubmitting(false); setShowCreateModal(true); }}>
          <Icon name="megaphone" size={14} />
          {isAr ? "\u062D\u0645\u0644\u0629 \u062C\u062F\u064A\u062F\u0629" : "New Campaign"}
        </Button>
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
                <span>{isAr ? "\u0627\u0644\u062A\u0643\u0644\u0641\u0629" : "Cost"}: ${c.cost}</span>
                <span>ROI: {c.roi}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Button small outline onClick={(e: React.MouseEvent) => { e.stopPropagation(); showToast(isAr ? "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u0645\u0644\u0629" : "Edit campaign"); }}>
                  <Icon name="pencil" size={12} />
                </Button>
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
              <span key="cost">${(Number(c.cost) || 0).toLocaleString()}</span>,
              <span key="roi" style={{ fontWeight: 600, color: c.roi.startsWith("+") ? COLORS.ok : undefined }}>
                {c.roi}
              </span>,
              <div key="actions" style={{ display: "flex", gap: 6 }}>
                <Button small outline onClick={() => setSelectedId(c.id)}>
                  <Icon name="chart" size={12} />
                </Button>
                <Button small outline onClick={() => showToast(isAr ? "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u0645\u0644\u0629" : "Edit campaign")}>
                  <Icon name="pencil" size={12} />
                </Button>
                <Button small outline onClick={() => {
                  api.post(`/campaigns/${c.id}/duplicate`).then(() => {
                    showToast(isAr ? "\u062A\u0645 \u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Campaign duplicated");
                    mutate();
                  }).catch(() => showToast(isAr ? "\u062A\u0643\u0631\u0627\u0631 \u0627\u0644\u062D\u0645\u0644\u0629" : "Duplicate campaign"));
                }}>
                  <Icon name="copy" size={12} />
                </Button>
                <Button small outline onClick={() => {
                  api.delete(`/campaigns/${c.id}`).then(() => {
                    showToast(isAr ? "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062D\u0645\u0644\u0629" : "Campaign deleted");
                    mutate();
                  }).catch(() => showToast(isAr ? "\u0641\u0634\u0644 \u0627\u0644\u062D\u0630\u0641" : "Delete failed"));
                }}>
                  <Icon name="x" size={12} />
                </Button>
              </div>,
            ])}
          />
        </Card>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} totalItems={totalCount} onPageChange={setPage} />

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
          }).then(() => {
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
                {templates.map((tmpl: any) => (
                  <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                ))}
              </select>
              {formErrors.template && (
                <span style={{ fontSize: 11.5, color: COLORS.err, marginTop: 4, display: "block" }}>{formErrors.template}</span>
              )}
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

function DetailView({ campaign: c, onBack }: { campaign: Campaign; onBack: () => void }) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  const statusLabel = (st: string) => {
    const map: Record<string, string> = isAr
      ? { active: "نشطة", completed: "مكتملة", scheduled: "مجدولة", draft: "مسودة", paused: "متوقفة", sending: "جاري الإرسال", cancelled: "ملغاة" }
      : { active: "Active", completed: "Completed", scheduled: "Scheduled", draft: "Draft", paused: "Paused", sending: "Sending", cancelled: "Cancelled" };
    return map[st] || st;
  };

  const kpis = useMemo(
    () => [
      { label: isAr ? "\u0627\u0644\u0645\u0633\u062A\u0644\u0645\u0648\u0646" : "Recipients", value: c.recipients.toLocaleString(), icon: "users", color: COLORS.pri },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u062A\u0648\u0635\u064A\u0644" : "Delivered", value: c.delivery + "%", icon: "check", color: COLORS.ok },
      { label: isAr ? "\u0627\u0644\u0641\u062A\u062D" : "Opens", value: c.readRate + "%", icon: "msg", color: COLORS.info },
      { label: isAr ? "\u0627\u0644\u0646\u0642\u0631\u0627\u062A" : "Clicks", value: c.behavior.clicked.toLocaleString(), icon: "link", color: COLORS.warn },
      { label: isAr ? "\u0627\u0644\u0631\u062F\u0648\u062F" : "Replies", value: c.replyRate + "%", icon: "send", color: COLORS.sec },
      { label: isAr ? "\u0627\u0644\u062A\u062D\u0648\u064A\u0644" : "Conversion", value: c.behavior.converted.toLocaleString(), icon: "target", color: COLORS.ai },
      { label: isAr ? "\u0627\u0644\u062A\u0643\u0644\u0641\u0629" : "Cost", value: "$" + c.cost.toLocaleString(), icon: "wallet", color: COLORS.err },
      { label: "ROI", value: c.roi, icon: "chart", color: COLORS.ok },
    ],
    [c, isAr]
  );

  // Behavior funnel data
  const funnelMax = c.recipients || 1;
  const funnel = useMemo(
    () => [
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644" : "Sent", value: c.recipients, pct: 100 },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u0641\u062A\u062D" : "Opened", value: c.behavior.opened, pct: Math.round((c.behavior.opened / funnelMax) * 100) },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u0646\u0642\u0631" : "Clicked", value: c.behavior.clicked, pct: Math.round((c.behavior.clicked / funnelMax) * 100) },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u0631\u062F" : "Replied", value: c.behavior.replied, pct: Math.round((c.behavior.replied / funnelMax) * 100) },
      { label: isAr ? "\u062A\u0645 \u0627\u0644\u062A\u062D\u0648\u064A\u0644" : "Converted", value: c.behavior.converted, pct: Math.round((c.behavior.converted / funnelMax) * 100) },
    ],
    [c, isAr, funnelMax]
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
                <Icon name="users" size={12} /> {c.segment}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="file" size={12} /> {c.template}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button outline onClick={() => showToast(isAr ? "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062D\u0645\u0644\u0629" : "Edit campaign")}>
              <Icon name="pencil" size={13} />
              {isAr ? "\u062A\u0639\u062F\u064A\u0644" : "Edit"}
            </Button>
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

      {/* Behavior Funnel */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title={isAr ? "\u0645\u0633\u0627\u0631 \u0627\u0644\u0633\u0644\u0648\u0643" : "Behavior Funnel"} />
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
      </Card>

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

      {/* AI Insights */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title={isAr ? "\u0631\u0624\u0649 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A" : "AI Insights"} />
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {c.aiInsights.map((insight, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 10,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: `${COLORS.ai}0F`,
                border: `1px solid ${COLORS.ai}26`,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: `${COLORS.ai}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.ai,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Icon name="brain" size={14} />
              </div>
              <span style={{ fontSize: 13, color: C.txt, lineHeight: 1.6 }}>{insight}</span>
            </div>
          ))}
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
