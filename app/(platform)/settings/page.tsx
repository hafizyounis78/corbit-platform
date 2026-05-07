"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Card, Button, TabBar, Badge, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { ProgressBar } from "@/components/charts/progress-bar";
import { useSettings } from "@/lib/api/hooks";
// Reverted to legacy paste-API-key flow on 2026-04-30 to unblock an
// urgent paying tenant while we wait for 360dialog Partner credentials.
// When Partner credentials arrive, swap this back to WhatsAppConnectPartner
// (the wizard component + service layer are still in the tree, untouched).
import { WhatsAppConnect } from "@/components/settings/whatsapp-connect";
import { ApiAndWebhooksPanel } from "@/components/settings/api-webhooks-panel";
import { SmsSettingsPanel } from "@/components/settings/sms-settings-panel";
import { CsatSettingsPanel } from "@/components/settings/csat-settings-panel";
import { SendingPolicyCard } from "@/components/settings/sending-policy-card";
import { QuickRepliesPanel } from "@/components/settings/quick-replies-panel";
import api from "@/lib/api/client";

/* ─── helpers ─── */

function SectionTitle({ children }: { children: string }) {
  return <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>{children}</h3>;
}

function FieldLabel({ children, C }: { children: React.ReactNode; C?: any }) {
  return <label style={{ fontSize: 11.5, color: C?.t2, display: "block", marginBottom: 4 }}>{children}</label>;
}

function Input({ value, onChange, placeholder, type, C }: { value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; C: any }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      type={type ?? "text"}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt, outline: "none", boxSizing: "border-box" }}
    />
  );
}

function Select({ value, onChange, options, C }: { value: string; onChange?: (v: string) => void; options: string[]; C: any }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function ToggleRow({ label, on, onToggle, desc, icon, C, comingSoon }: { label: string; on: boolean; onToggle: () => void; desc?: string; icon?: string; C: any; comingSoon?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: C.inp, marginBottom: 4, opacity: comingSoon ? 0.55 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
            {comingSoon && (
              <span style={{ fontSize: 9.5, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: `${C.warn}20`, color: C.warn, letterSpacing: 0.2 }}>قريباً</span>
            )}
          </div>
          {desc && <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
      <Toggle on={comingSoon ? false : on} onToggle={() => { if (!comingSoon) onToggle(); }} />
    </div>
  );
}

/**
 * Section header with a "قريباً" badge — for whole cards/sections that
 * aren't wired up yet. Use sparingly: prefer hiding dead UI to badging it.
 */
function SectionTitleWithComingSoon({ children, C }: { children: string; C: any }) {
  return (
    <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
      {children}
      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: `${C.warn}20`, color: C.warn }}>قريباً</span>
    </h3>
  );
}

function AutoMessageBlock({
  C, ar, icon, label, desc, placeholder, on, onToggle, value, onChangeText,
}: {
  C: any; ar: boolean; icon: string; label: string; desc: string; placeholder: string;
  on: boolean; onToggle: () => void; value: string; onChangeText: (v: string) => void;
}) {
  return (
    <div style={{ padding: "14px 14px 12px", borderRadius: 12, background: C.inp, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: on ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{desc}</div>
          </div>
        </div>
        <Toggle on={on} onToggle={onToggle} />
      </div>
      {on && (
        <textarea
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={placeholder}
          dir={ar ? "rtl" : "ltr"}
          style={{
            width: "100%", minHeight: 64, padding: "9px 12px", borderRadius: 10,
            background: C.bg ?? "#fff", border: `1px solid ${C.brd}`,
            fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt,
            outline: "none", resize: "vertical", boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}

/* ─── Audit Log block ─── */

interface AuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: string | Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

// Friendly labels for the action vocabulary defined in the backend
// AuditLogService. Keeping the mapping client-side (instead of in
// translation files) makes adding new actions a one-line change here.
const ACTION_LABELS_AR: Record<string, string> = {
  "auth.login.success":         "تسجيل دخول ناجح",
  "auth.login.failed":          "محاولة دخول فاشلة",
  "auth.logout":                "تسجيل خروج",
  "auth.password.changed":      "تغيير كلمة المرور",
  "auth.2fa.enabled":           "تفعيل المصادقة الثنائية",
  "auth.2fa.disabled":          "تعطيل المصادقة الثنائية",
  "team.user.invited":          "إضافة عضو",
  "team.user.removed":          "حذف عضو",
  "team.user.role_changed":     "تغيير صلاحية عضو",
  "org.plan.changed":           "تغيير الباقة",
  "org.suspended":              "إيقاف المؤسّسة",
  "org.activated":              "إعادة تفعيل المؤسّسة",
  "org.settings.updated":       "تحديث إعدادات المؤسّسة",
  "billing.transfer.approved":  "اعتماد تحويل بنكي",
  "billing.transfer.rejected":  "رفض تحويل بنكي",
  "billing.wallet.topped_up":   "شحن المحفظة",
  "template.submitted":         "إرسال قالب للمراجعة",
  "template.deleted":           "حذف قالب",
  "bot.created":                "إنشاء بوت",
  "bot.updated":                "تعديل بوت",
  "bot.deleted":                "حذف بوت",
  "campaign.launched":          "إطلاق حملة",
  "campaign.paused":            "إيقاف حملة مؤقّتاً",
  "campaign.cancelled":         "إلغاء حملة",
  "conversation.reassigned":    "نقل محادثة",
  "contact.bulk_deleted":       "حذف جهات اتصال جماعي",
  "contact.opted_out":          "إلغاء اشتراك جهة",
};

const ACTION_LABELS_EN: Record<string, string> = {
  "auth.login.success":         "Login success",
  "auth.login.failed":          "Login failed",
  "auth.logout":                "Logout",
  "auth.password.changed":      "Password changed",
  "auth.2fa.enabled":           "2FA enabled",
  "auth.2fa.disabled":          "2FA disabled",
  "team.user.invited":          "Member invited",
  "team.user.removed":          "Member removed",
  "team.user.role_changed":     "Role changed",
  "org.plan.changed":           "Plan changed",
  "org.suspended":              "Organization suspended",
  "org.activated":              "Organization activated",
  "org.settings.updated":       "Org settings updated",
  "billing.transfer.approved":  "Transfer approved",
  "billing.transfer.rejected":  "Transfer rejected",
  "billing.wallet.topped_up":   "Wallet topped up",
  "template.submitted":         "Template submitted",
  "template.deleted":           "Template deleted",
  "bot.created":                "Bot created",
  "bot.updated":                "Bot updated",
  "bot.deleted":                "Bot deleted",
  "campaign.launched":          "Campaign launched",
  "campaign.paused":            "Campaign paused",
  "campaign.cancelled":         "Campaign cancelled",
  "conversation.reassigned":    "Conversation reassigned",
  "contact.bulk_deleted":       "Contacts bulk deleted",
  "contact.opted_out":          "Contact opted out",
};

// Failed-login + suspension are highlighted; success events stay neutral.
function actionTone(action: string, C: any): string {
  if (action.endsWith(".failed") || action.endsWith(".rejected") || action === "org.suspended") return C.err;
  if (action.endsWith(".changed") || action.endsWith(".disabled") || action.endsWith(".removed")) return C.warn;
  return C.t2;
}

function fmtTime(iso: string, ar: boolean): string {
  try {
    return new Date(iso).toLocaleString(ar ? "ar-SA" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function AuditLogPanel({ C, ar, dk }: { C: any; ar: boolean; dk: boolean }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filters — each one is independent and stacks. Empty string means
  // "no filter" so the backend treats them as nullable. Reset page to
  // 1 whenever any filter changes so a narrow result set doesn't get
  // skipped because the previous page is now empty.
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter]     = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [facetActions, setFacetActions] = useState<string[]>([]);
  const [facetUsers, setFacetUsers]     = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (actionFilter) params.action = actionFilter;
    if (userFilter)   params.user_id = userFilter;
    if (dateFrom)     params.date_from = dateFrom;
    if (dateTo)       params.date_to = dateTo;

    api.get('/settings/security/audit-log', { params })
      .then((res) => {
        if (cancelled) return;
        const payload = res.data?.data ?? res.data;
        setEntries(payload?.data ?? []);
        setTotal(payload?.total ?? 0);
        if (Array.isArray(payload?.filters?.actions)) {
          setFacetActions(payload.filters.actions);
        }
        if (Array.isArray(payload?.filters?.users)) {
          setFacetUsers(payload.filters.users);
        }
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.message || (ar ? "تعذّر تحميل السجلّ" : "Failed to load log"));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, ar, actionFilter, userFilter, dateFrom, dateTo]);

  // Reset to page 1 whenever a filter narrows or widens the set.
  useEffect(() => { setPage(1); }, [actionFilter, userFilter, dateFrom, dateTo]);

  const labels = ar ? ACTION_LABELS_AR : ACTION_LABELS_EN;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card style={{ padding: 18 }}>
      <SectionTitle>{ar ? "سجل التدقيق" : "Audit Log"}</SectionTitle>
      <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 12, lineHeight: 1.6 }}>
        {ar
          ? "كل عمليّة حسّاسة على حسابك (تسجيل دخول، تغيير صلاحيّات، اعتماد تحويلات، إلخ) محفوظة هنا للمساءلة والامتثال."
          : "Every sensitive action on your account (logins, role changes, transfer approvals, etc.) is recorded here for accountability and compliance."}
      </div>

      {/* Filter row — action / user / date range. Each empty value
          treats that facet as "no filter". The dropdowns populate
          from the same audit-log endpoint so they always reflect
          what's actually in the org's history. */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 10, marginBottom: 14,
      }}>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 12 }}
        >
          <option value="">{ar ? "كل الإجراءات" : "All actions"}</option>
          {facetActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 12 }}
        >
          <option value="">{ar ? "كل المستخدمين" : "All users"}</option>
          {facetUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.name || u.email}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder={ar ? "من تاريخ" : "From"}
          style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 12 }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder={ar ? "إلى تاريخ" : "To"}
          style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 12 }}
        />
        {(actionFilter || userFilter || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setActionFilter(""); setUserFilter(""); setDateFrom(""); setDateTo(""); }}
            style={{
              padding: "7px 10px", borderRadius: 8,
              border: `1px solid ${C.brd}`, background: "transparent",
              color: C.t2, fontSize: 11.5, cursor: "pointer",
              fontFamily: FONT_FAMILY,
            }}
          >
            ✕ {ar ? "مسح المرشّحات" : "Clear filters"}
          </button>
        )}
      </div>

      {loading && (
        <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: C.t2 }}>
          {ar ? "جاري التحميل..." : "Loading..."}
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: 12, borderRadius: 8, background: C.err + "15", color: C.err, fontSize: 12 }}>
          {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12.5, color: C.t2 }}>
          {ar ? "لا توجد عمليّات مسجّلة بعد." : "No recorded events yet."}
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {entries.map((e) => {
            const tone = actionTone(e.action, C);
            const label = labels[e.action] ?? e.action;
            const details = typeof e.details === "string" ? safeJsonParse(e.details) : e.details;
            return (
              <div
                key={e.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: dk ? C.inp : "#FAF9F6",
                  border: `1px solid ${C.brdL}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: tone }}>{label}</span>
                  <span style={{ fontSize: 10.5, color: C.t3, fontFamily: "monospace" }}>{fmtTime(e.created_at, ar)}</span>
                </div>
                {(e.ip_address || (details && Object.keys(details).length > 0)) && (
                  <div style={{ fontSize: 11, color: C.t2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {e.ip_address && <span style={{ fontFamily: "monospace" }}>IP: {e.ip_address}</span>}
                    {details && Object.entries(details).slice(0, 3).map(([k, v]) => (
                      <span key={k}>{k}: {String(v).slice(0, 40)}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: "transparent", cursor: page === 1 ? "not-allowed" : "pointer", color: C.txt, fontFamily: FONT_FAMILY, fontSize: 11, opacity: page === 1 ? 0.5 : 1 }}
          >
            {ar ? "السابق" : "Prev"}
          </button>
          <span style={{ fontSize: 11.5, color: C.t2 }}>
            {ar ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: "transparent", cursor: page >= totalPages ? "not-allowed" : "pointer", color: C.txt, fontFamily: FONT_FAMILY, fontSize: 11, opacity: page >= totalPages ? 0.5 : 1 }}
          >
            {ar ? "التالي" : "Next"}
          </button>
        </div>
      )}
    </Card>
  );
}

function safeJsonParse(s: string): Record<string, any> | null {
  try { return JSON.parse(s); } catch { return null; }
}

/* ─── page ─── */

export default function SettingsPage() {
  const { colors: C, isDark: dk, toggleTheme } = useTheme();
  const { t, isAr, lang, toggleLang } = useLocale();
  const { showToast } = useToast();
  const isMob = useIsMobile();
  const ar = isAr;

  // Tab is selectable from a ?tab= query param so the Onboarding
  // wizard (and any other entry point) can deep-link straight to a
  // specific section. Falls back to "general" when the param is
  // missing or unrecognised.
  const searchParams = useSearchParams();
  const validTabs = ["general", "notifications", "security", "channels", "csat", "whatsapp", "sms", "team", "api"];
  const initialTab = searchParams?.get("tab") ?? "general";
  const [tab, setTab] = useState(validTabs.includes(initialTab) ? initialTab : "general");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Keep the tab in sync if the user navigates between two
  // ?tab=... URLs without a full page reload (e.g. clicking two
  // different onboarding rows in succession).
  useEffect(() => {
    const next = searchParams?.get("tab");
    if (next && validTabs.includes(next) && next !== tab) {
      setTab(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch settings from API per section
  const { data: generalData, isLoading: loadingGeneral, mutate: mutateGeneral } = useSettings('general');
  const { data: notifData, isLoading: loadingNotif, mutate: mutateNotif } = useSettings('notifications');
  const { data: securityData, isLoading: loadingSecurity, mutate: mutateSecurity } = useSettings('security');
  const { data: channelsData, isLoading: loadingChannels, mutate: mutateChannels } = useSettings('conversations');
  const { data: whatsappData, mutate: mutateWhatsapp } = useSettings('whatsapp');
  const { data: autoMsgsData, mutate: mutateAutoMsgs } = useSettings('auto-messages');
  const { data: bizHoursData, mutate: mutateBizHours } = useSettings('business-hours');
  const { data: replyModeData, mutate: mutateReplyMode } = useSettings('reply-mode');
  const whatsappNumbers: any[] = (whatsappData?.numbers as any[]) ?? [];

  // Team member counts for the Team tab
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  useEffect(() => {
    api.get('/teams/members').then((res: any) => {
      const list = res?.data?.data ?? res?.data ?? [];
      setTeamMembers(Array.isArray(list) ? list : []);
    }).catch(() => setTeamMembers([]));
  }, []);
  const roleCounts = {
    admin: teamMembers.filter((m: any) => m.role === 'admin').length,
    supervisor: teamMembers.filter((m: any) => m.role === 'supervisor').length,
    agent: teamMembers.filter((m: any) => m.role === 'agent').length,
  };

  /* general settings state */
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [timezone, setTimezone] = useState("Asia/Riyadh (GMT+3)");
  const [currency, setCurrency] = useState("SAR");
  const [description, setDescription] = useState("");

  // Populate from API when data arrives (backend returns: name, email, phone, website, timezone, currency, description)
  useEffect(() => {
    if (generalData) {
      const g: any = generalData;
      if (g.name ?? g.companyName) setCompanyName(g.name ?? g.companyName);
      if (g.email ?? g.companyEmail) setCompanyEmail(g.email ?? g.companyEmail);
      if (g.phone ?? g.companyPhone) setCompanyPhone(g.phone ?? g.companyPhone);
      if (g.website ?? g.companyWebsite) setCompanyWebsite(g.website ?? g.companyWebsite);
      if (g.timezone) setTimezone(g.timezone);
      if (g.currency) setCurrency(g.currency);
      if (g.description) setDescription(g.description);
    }
  }, [generalData]);

  const markChanged = () => { if (!hasChanges) setHasChanges(true); };

  /* toggle states */
  const [welcomeMsg, setWelcomeMsg] = useState(true);
  const [awayMsg, setAwayMsg] = useState(true);
  const [queueMsg, setQueueMsg] = useState(false);
  const [welcomeText, setWelcomeText] = useState("");
  const [awayText, setAwayText] = useState("");
  const [queueText, setQueueText] = useState("");
  const [replyMode, setReplyMode] = useState<"hybrid" | "bot_only" | "ai_only">("hybrid");
  const [notifNew, setNotifNew] = useState(true);
  const [notifMsg, setNotifMsg] = useState(true);
  const [notifAssign, setNotifAssign] = useState(true);
  const [notifEsc, setNotifEsc] = useState(false);
  const [notifSla, setNotifSla] = useState(true);
  const [notifBal, setNotifBal] = useState(true);
  const [pushBrowser, setPushBrowser] = useState(true);
  const [pushEmail, setPushEmail] = useState(true);
  const [pushSound, setPushSound] = useState(true);
  const [pushMobile, setPushMobile] = useState(false);
  // WhatsApp delivery for in-app notifications. Defaults to false —
  // a fresh tenant shouldn't suddenly get pinged on WA the moment
  // they upgrade. They opt in here, AND configure an approved
  // notification template (or the channel silently no-ops).
  const [pushWhatsapp, setPushWhatsapp] = useState(false);
  const [whatsappTemplateName, setWhatsappTemplateName] = useState("");
  const [quietHours, setQuietHours] = useState(false);
  const [quietFrom, setQuietFrom] = useState("22:00");
  const [quietTo, setQuietTo] = useState("07:00");
  const [autoReports, setAutoReports] = useState(true);
  const [autoReportFreq, setAutoReportFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [twoFA, setTwoFA] = useState(true);
  const [sso, setSSO] = useState(false);
  const [ipWhite, setIpWhite] = useState(false);
  const [sessTimeout, setSessTimeout] = useState(true);
  const [smsEnable, setSmsEnable] = useState(true);
  const [channelMode, setChannelMode] = useState("wa_sms");
  const [autoClose, setAutoClose] = useState(true);
  const [autoAssign, setAutoAssign] = useState(true);
  const [custTakeover, setCustTakeover] = useState(false);
  const [postSurvey, setPostSurvey] = useState(true);

  // Populate notification toggles from API
  useEffect(() => {
    if (notifData) {
      if (notifData.newConversation !== undefined) setNotifNew(notifData.newConversation);
      if (notifData.newMessage !== undefined) setNotifMsg(notifData.newMessage);
      if (notifData.assignment !== undefined) setNotifAssign(notifData.assignment);
      if (notifData.escalation !== undefined) setNotifEsc(notifData.escalation);
      if (notifData.slaWarning !== undefined) setNotifSla(notifData.slaWarning);
      if (notifData.lowBalance !== undefined) setNotifBal(notifData.lowBalance);
      if (notifData.browserPush !== undefined) setPushBrowser(notifData.browserPush);
      if (notifData.emailNotif !== undefined) setPushEmail(notifData.emailNotif);
      if (notifData.sound !== undefined) setPushSound(notifData.sound);
      if (notifData.mobilePush !== undefined) setPushMobile(notifData.mobilePush);
      if (notifData.quietHours !== undefined) setQuietHours(notifData.quietHours);
      if (notifData.autoReports !== undefined) setAutoReports(notifData.autoReports);
      // Backend (SettingsService) returns these as quietHoursEnabled /
      // quietHoursFrom / quietHoursTo / autoReportEnabled / autoReportFreq
      // — we hydrate from either name so the UI works regardless of
      // which schema version the API exposes.
      if (notifData.quietHoursEnabled !== undefined) setQuietHours(notifData.quietHoursEnabled);
      if (notifData.quietHoursFrom) setQuietFrom(String(notifData.quietHoursFrom).slice(0, 5));
      if (notifData.quietHoursTo) setQuietTo(String(notifData.quietHoursTo).slice(0, 5));
      if (notifData.autoReportEnabled !== undefined) setAutoReports(notifData.autoReportEnabled);
      if (notifData.autoReportFreq) setAutoReportFreq(notifData.autoReportFreq);

      // WhatsApp channel — derived from the per-type preferences
      // matrix (we use the same flag across types). If any single
      // type has whatsapp=true, treat the global toggle as on.
      if (Array.isArray(notifData.preferences)) {
        const anyWa = notifData.preferences.some((p: any) => p && p.whatsapp);
        setPushWhatsapp(anyWa);
      }
      if (notifData.whatsappTemplateName !== undefined) {
        setWhatsappTemplateName(String(notifData.whatsappTemplateName ?? ""));
      }
    }
  }, [notifData]);

  // Populate security toggles from API
  useEffect(() => {
    if (securityData) {
      if (securityData.twoFA !== undefined) setTwoFA(securityData.twoFA);
      if (securityData.sso !== undefined) setSSO(securityData.sso);
      if (securityData.ipWhitelist !== undefined) setIpWhite(securityData.ipWhitelist);
      if (securityData.sessionTimeout !== undefined) setSessTimeout(securityData.sessionTimeout);
    }
  }, [securityData]);

  // Populate reply-mode from API. Falls back to hybrid for any
  // unrecognized value so the UI never lands on an invalid state.
  useEffect(() => {
    const m = (replyModeData as any)?.mode ?? (replyModeData as any)?.data?.mode;
    if (m === "hybrid" || m === "bot_only" || m === "ai_only") {
      setReplyMode(m);
    }
  }, [replyModeData]);

  // Populate auto-messages (welcome / away / queue) from API.
  // Backend returns array: [{type, text, text_ar, is_enabled}].
  useEffect(() => {
    const list = Array.isArray(autoMsgsData) ? autoMsgsData : (autoMsgsData as any)?.data;
    if (!Array.isArray(list)) return;
    const byType: Record<string, any> = {};
    list.forEach((m: any) => { if (m?.type) byType[m.type] = m; });
    if (byType.welcome) {
      setWelcomeMsg(!!byType.welcome.is_enabled);
      setWelcomeText(byType.welcome.text_ar ?? byType.welcome.text ?? "");
    }
    if (byType.away) {
      setAwayMsg(!!byType.away.is_enabled);
      setAwayText(byType.away.text_ar ?? byType.away.text ?? "");
    }
    if (byType.queue) {
      setQueueMsg(!!byType.queue.is_enabled);
      setQueueText(byType.queue.text_ar ?? byType.queue.text ?? "");
    }
  }, [autoMsgsData]);

  /* business hours state. Day code mapping is by INDEX (0=sun…6=sat) so
     we don't depend on the localized label. */
  const DAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const [bizHours, setBizHours] = useState([
    { day: ar ? "الأحد" : "Sunday", on: true, from: "09:00", to: "17:00" },
    { day: ar ? "الاثنين" : "Monday", on: true, from: "09:00", to: "17:00" },
    { day: ar ? "الثلاثاء" : "Tuesday", on: true, from: "09:00", to: "17:00" },
    { day: ar ? "الأربعاء" : "Wednesday", on: true, from: "09:00", to: "17:00" },
    { day: ar ? "الخميس" : "Thursday", on: true, from: "09:00", to: "14:00" },
    { day: ar ? "الجمعة" : "Friday", on: false, from: "09:00", to: "17:00" },
    { day: ar ? "السبت" : "Saturday", on: false, from: "09:00", to: "17:00" },
  ]);

  // Populate business hours from API. Backend returns array of
  // {day, is_open, open_time, close_time} where day is the 3-letter code.
  // Times come back as HH:MM:SS — trim to HH:MM for <input type="time">.
  useEffect(() => {
    const list = Array.isArray(bizHoursData) ? bizHoursData : (bizHoursData as any)?.data;
    if (!Array.isArray(list)) return;
    const byDay: Record<string, any> = {};
    list.forEach((h: any) => { if (h?.day) byDay[h.day] = h; });

    setBizHours((prev) =>
      prev.map((bh, i) => {
        const fromDb = byDay[DAY_CODES[i]];
        if (!fromDb) return bh;
        return {
          day: bh.day,
          on: !!fromDb.is_open,
          from: String(fromDb.open_time ?? "09:00").slice(0, 5),
          to: String(fromDb.close_time ?? "17:00").slice(0, 5),
        };
      })
    );
    // DAY_CODES is a stable literal; no need to depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizHoursData]);

  const tabs = [
    { key: "general", label: ar ? "عام" : "General" },
    { key: "notifications", label: ar ? "الإشعارات" : "Notifications" },
    { key: "security", label: ar ? "الأمان" : "Security" },
    { key: "channels", label: ar ? "القنوات" : "Channels" },
    { key: "csat", label: ar ? "⭐ التقييم" : "⭐ CSAT" },
    { key: "quick-replies", label: ar ? "⚡ الردود السريعة" : "⚡ Quick Replies" },
    { key: "whatsapp", label: ar ? "ربط الواتساب" : "WhatsApp" },
    { key: "sms", label: ar ? "📱 SMS" : "📱 SMS" },
    { key: "team", label: ar ? "الفريق" : "Team" },
    { key: "api", label: ar ? "واجهة API" : "API" },
  ];

  const grid2Style = { display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 14 } as const;

  const handleSave = async () => {
    setSaving(true);
    try {
      const section = tab === "general" ? "general" :
                      tab === "notifications" ? "notifications" :
                      tab === "security" ? "security" :
                      tab === "channels" ? "conversations" :
                      tab === "team" ? "conversations" :
                      tab === "api" ? "api-keys" : "general";

      const payload: Record<string, any> = {};

      if (tab === "general") {
        // Profile fields go to /settings/general. Welcome / Away / Queue
        // texts are persisted separately to /settings/auto-messages because
        // the backend updateGeneral fillable drops anything outside the
        // organization profile fields.
        Object.assign(payload, { name: companyName, email: companyEmail, phone: companyPhone, website: companyWebsite, timezone, currency, language: lang, description });

        await api.patch(`/settings/auto-messages`, {
          messages: [
            { type: "welcome", text_ar: welcomeText, text: welcomeText, is_enabled: welcomeMsg },
            { type: "away",    text_ar: awayText,    text: awayText,    is_enabled: awayMsg },
            { type: "queue",   text_ar: queueText,   text: queueText,   is_enabled: queueMsg },
          ],
        });
        mutateAutoMsgs();

        // Business hours go to /settings/business-hours. Map our state by
        // index → 3-letter day_of_week code the backend expects.
        await api.patch(`/settings/business-hours`, {
          hours: bizHours.map((bh, i) => ({
            day: DAY_CODES[i],
            is_open: bh.on,
            open_time: bh.from,
            close_time: bh.to,
          })),
        });
        mutateBizHours();

        // Reply mode (per-org auto-reply engine choice) is its own
        // tiny endpoint — separate from /settings/general so the
        // backend can validate the enum on a focused payload.
        await api.patch(`/settings/reply-mode`, { mode: replyMode });
        mutateReplyMode();
      } else if (tab === "notifications") {
        // Backend updateNotificationPrefs takes a per-type-per-channel
        // matrix: each row is { type, browser, email, sound, mobile,
        // whatsapp }. We expand the global channel toggles across the
        // 6 notification types here; an operator who only flips off
        // 'newMessage' (notifMsg=false) will have all channels false
        // for that type but true for the others.
        const typeFlags: Record<string, boolean> = {
          new_conversation: notifNew,
          new_message:      notifMsg,
          assignment:       notifAssign,
          escalation:       notifEsc,
          sla_warning:      notifSla,
          low_balance:      notifBal,
        };
        Object.assign(payload, {
          preferences: Object.entries(typeFlags).map(([type, enabled]) => ({
            type,
            browser:  enabled && pushBrowser,
            email:    enabled && pushEmail,
            sound:    enabled && pushSound,
            mobile:   enabled && pushMobile,
            whatsapp: enabled && pushWhatsapp,
          })),
          // Org-level quiet-hours window + auto-report frequency.
          quietHoursEnabled: quietHours,
          quietHoursFrom:    quietFrom,
          quietHoursTo:      quietTo,
          autoReportEnabled: autoReports,
          autoReportFreq:    autoReportFreq,
          // Org-level WhatsApp notification template name. Empty
          // string clears it on the backend (channel silently no-ops
          // when missing).
          whatsappTemplateName: whatsappTemplateName.trim(),
        });
      } else if (tab === "security") {
        // 2FA persists through dedicated endpoints — the bulk
        // /settings/security PATCH ignores it. Also: backend rejects
        // enable when the user has no phone on file (we'd lock them
        // out of OTP login otherwise), and we surface that to the user.
        try {
          await api.post(twoFA ? '/settings/security/2fa/enable' : '/settings/security/2fa/disable');
        } catch (e: any) {
          setSaving(false);
          const msg = e?.response?.data?.message || (ar ? 'تعذّر تحديث المصادقة الثنائية' : 'Failed to update 2FA');
          showToast(msg, 'error');
          return;
        }
        // SSO + Session Timeout aren't wired up server-side yet; we
        // don't send them so the user doesn't get a misleading "saved"
        // toast for fields that won't take effect.
      } else if (tab === "channels") {
        Object.assign(payload, { settings: { smsEnable, channelMode } });
      } else if (tab === "team") {
        Object.assign(payload, { settings: { autoClose, autoAssign, custTakeover, postSurvey } });
      }

      await api.patch(`/settings/${section}`, payload);
      setSaving(false);
      setHasChanges(false);
      showToast(ar ? "تم حفظ الإعدادات بنجاح ✓" : "Settings saved successfully ✓");
      // Refresh the relevant section
      if (tab === "general") mutateGeneral();
      else if (tab === "notifications") mutateNotif();
      else if (tab === "security") mutateSecurity();
      else if (tab === "channels" || tab === "team") mutateChannels();
    } catch (e: any) {
      setSaving(false);
      const msg = e?.response?.data?.message || e?.message || "";
      showToast(ar ? `فشل حفظ الإعدادات: ${msg}` : `Failed to save settings: ${msg}`, "error");
    }
  };

  const isLoading = (tab === "general" && loadingGeneral) ||
                    (tab === "notifications" && loadingNotif) ||
                    (tab === "security" && loadingSecurity) ||
                    (tab === "channels" && loadingChannels);

  if (isLoading) {
    return (
      <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <p style={{ fontSize: 14, color: C.t2 }}>{ar ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 24px" }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{ar ? "الإعدادات" : "Settings"}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>{ar ? "إدارة إعدادات المنصة والتفضيلات" : "Manage platform settings & preferences"}</p>
        </div>
        <Button primary onClick={handleSave} style={{ opacity: saving ? 0.6 : 1, pointerEvents: saving ? "none" : "auto" }}>
          <Icon name={saving ? "timer" : "check"} size={14} />
          {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {/* ═══════════ GENERAL TAB ═══════════ */}
      {tab === "general" && (
        <div style={grid2Style}>
          {/* left col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Company Info */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "معلومات الشركة" : "Company Info"}</SectionTitle>

              {/* logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 700 }}>C</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{ar ? "شعار الشركة" : "Company Logo"}</div>
                  <Button small outline onClick={() => showToast("✓")}>{ar ? "تغيير" : "Change"}</Button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div><FieldLabel C={C}>{ar ? "اسم الشركة" : "Company Name"}</FieldLabel><Input value={companyName} onChange={(v) => { setCompanyName(v); markChanged(); }} C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "البريد الإلكتروني" : "Email"}</FieldLabel><Input value={companyEmail} onChange={(v) => { setCompanyEmail(v); markChanged(); }} type="email" C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "الهاتف" : "Phone"}</FieldLabel><Input value={companyPhone} onChange={(v) => { setCompanyPhone(v); markChanged(); }} C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "الموقع" : "Website"}</FieldLabel><Input value={companyWebsite} onChange={(v) => { setCompanyWebsite(v); markChanged(); }} C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "المنطقة الزمنية" : "Timezone"}</FieldLabel><Select value={timezone} onChange={(v) => { setTimezone(v); markChanged(); }} options={["Asia/Riyadh (GMT+3)", "Asia/Dubai (GMT+4)", "UTC"]} C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "العملة" : "Currency"}</FieldLabel><Select value={currency} onChange={(v) => { setCurrency(v); markChanged(); }} options={["SAR", "USD", "AED", "EUR"]} C={C} /></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <FieldLabel C={C}>{ar ? "الوصف" : "Description"}</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markChanged(); }}
                  style={{ width: "100%", minHeight: 72, padding: "9px 12px", borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </Card>

            {/* Reply Mode — per-org engine selection */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "وضع الردّ التلقائي" : "Auto-Reply Mode"}</SectionTitle>
              <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 12, lineHeight: 1.7 }}>
                {ar
                  ? "اختر كيف يردّ النظام على رسائل العملاء. رسائل الترحيب والغياب تعمل في كلّ الأوضاع."
                  : "Choose how the system replies to customer messages. Welcome and away messages fire in every mode."}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {([
                  {
                    key: "hybrid",
                    icon: "🔀",
                    label: ar ? "هجين (مُوصى به)" : "Hybrid (recommended)",
                    desc: ar
                      ? "البوت يردّ على الكلمات المحفّزة، الذكاء الاصطناعي يكمل الباقي."
                      : "Bot answers keyword matches; AI handles everything else.",
                  },
                  {
                    key: "bot_only",
                    icon: "🤖",
                    label: ar ? "بوت فقط" : "Bot only",
                    desc: ar
                      ? "فقط البوتات تردّ. أيّ سؤال خارج الكلمات المحفّزة لن يُردّ عليه."
                      : "Only bots reply. Anything outside the configured keywords gets no auto-reply.",
                  },
                  {
                    key: "ai_only",
                    icon: "🧠",
                    label: ar ? "ذكاء اصطناعي فقط" : "AI only",
                    desc: ar
                      ? "كلّ الرسائل تروح للذكاء الاصطناعي. البوتات معطّلة حتى لو منشورة."
                      : "Every message goes to the AI. Keyword bots are bypassed even if published.",
                  },
                ] as const).map((opt) => {
                  const active = replyMode === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => { setReplyMode(opt.key); markChanged(); }}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        cursor: "pointer",
                        border: `1.5px solid ${active ? C.pri : C.brd}`,
                        background: active ? `${C.pri}10` : C.inp,
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div
                          style={{
                            width: 18, height: 18, borderRadius: 9, marginTop: 2,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: `2px solid ${active ? C.pri : C.t3}`,
                            flexShrink: 0,
                          }}
                        >
                          {active && <div style={{ width: 10, height: 10, borderRadius: 5, background: C.pri }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                            <span style={{ marginInlineEnd: 6 }}>{opt.icon}</span>{opt.label}
                          </div>
                          <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.6 }}>{opt.desc}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Auto Messages */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "الرسائل التلقائية" : "Auto Messages"}</SectionTitle>
              <AutoMessageBlock
                C={C}
                ar={ar}
                icon="👋"
                label={ar ? "رسالة الترحيب" : "Welcome Message"}
                desc={ar ? "تُرسل تلقائيّاً لمّا يبدأ العميل محادثة جديدة" : "Auto-send when a new conversation starts"}
                placeholder={ar ? "مرحباً بك في متجرنا! كيف نقدر نخدمك؟" : "Welcome to our store! How can we help?"}
                on={welcomeMsg}
                onToggle={() => { setWelcomeMsg(!welcomeMsg); markChanged(); }}
                value={welcomeText}
                onChangeText={(v) => { setWelcomeText(v); markChanged(); }}
              />
              <AutoMessageBlock
                C={C}
                ar={ar}
                icon="🌙"
                label={ar ? "رسالة الغياب" : "Away Message"}
                desc={ar ? "تُرسل تلقائيّاً خارج ساعات العمل المضبوطة" : "Auto-send outside configured business hours"}
                placeholder={ar ? "نعتذر، نحن خارج الدوام الآن. سنرد عليك في أقرب وقت." : "We're currently away. We'll get back to you soon."}
                on={awayMsg}
                onToggle={() => { setAwayMsg(!awayMsg); markChanged(); }}
                value={awayText}
                onChangeText={(v) => { setAwayText(v); markChanged(); }}
              />
              <AutoMessageBlock
                C={C}
                ar={ar}
                icon="⏳"
                label={ar ? "رسالة قائمة الانتظار" : "Queue Message"}
                desc={ar ? "تُرسل عند وضع العميل في طابور الانتظار" : "Sent when the customer is placed in queue"}
                placeholder={ar ? "شكراً لتواصلك. أنت في قائمة الانتظار وسيتم الردّ عليك قريباً." : "Thanks for reaching out. You're in queue, we'll be with you shortly."}
                on={queueMsg}
                onToggle={() => { setQueueMsg(!queueMsg); markChanged(); }}
                value={queueText}
                onChangeText={(v) => { setQueueText(v); markChanged(); }}
              />
            </Card>
          </div>

          {/* right col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Appearance */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "المظهر" : "Appearance"}</SectionTitle>

              {/* Theme toggle */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel C={C}>{ar ? "السمة" : "Theme"}</FieldLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                  {([["light", "☀️", ar ? "فاتح" : "Light"], ["dark", "🌙", ar ? "داكن" : "Dark"]] as const).map(([key, icon, label]) => (
                    <div
                      key={key}
                      onClick={() => { if ((key === "dark") !== dk) toggleTheme(); }}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: (key === "dark") === dk ? `${C.pri}12` : C.inp,
                        border: (key === "dark") === dk ? `2px solid ${C.pri}` : "2px solid transparent",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                      <div style={{ fontSize: 12, fontWeight: (key === "dark") === dk ? 700 : 400 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language toggle */}
              <div style={{ marginBottom: 18 }}>
                <FieldLabel C={C}>{ar ? "اللغة" : "Language"}</FieldLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                  {([["ar", "🇸🇦", "العربية"], ["en", "🇺🇸", "English"]] as const).map(([key, flag, label]) => (
                    <div
                      key={key}
                      onClick={() => { if ((key === "ar") !== ar) toggleLang(); }}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: (key === "ar") === ar ? `${C.pri}12` : C.inp,
                        border: (key === "ar") === ar ? `2px solid ${C.pri}` : "2px solid transparent",
                        cursor: "pointer",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{flag}</span>
                      <span style={{ fontSize: 12, fontWeight: (key === "ar") === ar ? 700 : 400 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Hours */}
              <FieldLabel C={C}>{ar ? "ساعات العمل" : "Business Hours"}</FieldLabel>
              <div style={{ marginTop: 6 }}>
                {bizHours.map((bh, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 44px 1fr 20px 1fr", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, opacity: bh.on ? 1 : 0.5 }}>{bh.day}</span>
                    <Toggle on={bh.on} onToggle={() => { const u = [...bizHours]; u[i] = { ...u[i], on: !u[i].on }; setBizHours(u); markChanged(); }} />
                    <input
                      type="time"
                      value={bh.from}
                      onChange={(e) => { const u = [...bizHours]; u[i] = { ...u[i], from: e.target.value }; setBizHours(u); markChanged(); }}
                      disabled={!bh.on}
                      style={{ padding: "5px 8px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, fontFamily: FONT_FAMILY, fontSize: 12, color: C.txt, opacity: bh.on ? 1 : 0.4 }}
                    />
                    <span style={{ textAlign: "center", fontSize: 11, color: C.t2 }}>-</span>
                    <input
                      type="time"
                      value={bh.to}
                      onChange={(e) => { const u = [...bizHours]; u[i] = { ...u[i], to: e.target.value }; setBizHours(u); markChanged(); }}
                      disabled={!bh.on}
                      style={{ padding: "5px 8px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, fontFamily: FONT_FAMILY, fontSize: 12, color: C.txt, opacity: bh.on ? 1 : 0.4 }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════ NOTIFICATIONS TAB ═══════════ */}
      {tab === "notifications" && (
        <div style={grid2Style}>
          {/* Platform Notifications */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "إشعارات المنصة" : "Platform Notifications"}</SectionTitle>
            <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 12, lineHeight: 1.6 }}>
              {ar ? "تظهر في الجرس أعلى الشاشة + يصدر صوت عند الوصول." : "Shown in the bell at top + an audio chime on arrival."}
            </div>
            <ToggleRow C={C} label={ar ? "محادثة جديدة" : "New Conversation"} desc={ar ? "عند وصول محادثة جديدة" : "When a new conversation arrives"} on={notifNew} onToggle={() => setNotifNew(!notifNew)} icon="💬" />
            <ToggleRow C={C} label={ar ? "رسالة جديدة" : "New Message"} desc={ar ? "عند وصول رسالة في محادثة حالية" : "When a message arrives in existing conversation"} on={notifMsg} onToggle={() => setNotifMsg(!notifMsg)} icon="📩" />
            <ToggleRow C={C} label={ar ? "تعيين" : "Assignment"} desc={ar ? "عند تعيين محادثة لك" : "When a conversation is assigned to you"} on={notifAssign} onToggle={() => setNotifAssign(!notifAssign)} icon="👤" />
            <ToggleRow C={C} label={ar ? "تصعيد" : "Escalation"} desc={ar ? "عند تصعيد محادثة" : "When a conversation is escalated"} on={notifEsc} onToggle={() => setNotifEsc(!notifEsc)} icon="🚨" />
            <ToggleRow C={C} label={ar ? "تحذير SLA" : "SLA Warning"} desc={ar ? "عند اقتراب انتهاء وقت الاستجابة" : "When response time is nearing limit"} on={notifSla} onToggle={() => setNotifSla(!notifSla)} icon="⏰" />
            <ToggleRow C={C} label={ar ? "رصيد منخفض" : "Low Balance"} desc={ar ? "عند انخفاض رصيد الحساب" : "When account balance is low"} on={notifBal} onToggle={() => setNotifBal(!notifBal)} icon="💰" />
          </Card>

          {/* Notification Channels */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "قنوات الإشعارات" : "Notification Channels"}</SectionTitle>
            <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 12, lineHeight: 1.6 }}>
              {ar ? "البريد والـ SMS يعملان على التنبيهات الحرجة فقط (رصيد منخفض، انتهاء باقة، تصعيد)." : "Email + SMS run only for critical alerts (low balance, plan expiry, escalation)."}
            </div>
            <ToggleRow C={C} comingSoon label={ar ? "إشعارات المتصفح" : "Browser Push"} desc={ar ? "إشعارات منبثقة في المتصفح" : "Browser push notifications"} on={pushBrowser} onToggle={() => setPushBrowser(!pushBrowser)} icon="🔔" />
            <ToggleRow C={C} label={ar ? "البريد الإلكتروني" : "Email"} desc={ar ? "إرسال إشعارات البريد للأنواع المحدّدة" : "Send selected notifications via email"} on={pushEmail} onToggle={() => setPushEmail(!pushEmail)} icon="📧" />
            <ToggleRow C={C} label={ar ? "الصوت" : "Sound"} desc={ar ? "تشغيل صوت عند وصول إشعار" : "Play sound on notification"} on={pushSound} onToggle={() => setPushSound(!pushSound)} icon="🔊" />
            <ToggleRow C={C} label={ar ? "SMS للجوّال" : "SMS to phone"} desc={ar ? "رسالة SMS للتنبيهات الحرجة فقط" : "SMS for critical alerts only"} on={pushMobile} onToggle={() => setPushMobile(!pushMobile)} icon="📱" />
            <ToggleRow C={C} label={ar ? "واتساب" : "WhatsApp"} desc={ar ? "إشعارات تصلك على واتساب عبر قالب معتمد" : "Notifications delivered via an approved WhatsApp template"} on={pushWhatsapp} onToggle={() => setPushWhatsapp(!pushWhatsapp)} icon="💬" />

            {/* Inline template name field — only renders when the
                operator opts into WhatsApp notifications. The backend
                silently no-ops the WA channel when this is empty, so
                we expose the field directly here instead of hiding it
                behind another tab. */}
            {pushWhatsapp && (
              <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}` }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  {ar ? "اسم قالب الإشعار المعتمد على Meta" : "Approved Meta notification template name"}
                </label>
                <input
                  value={whatsappTemplateName}
                  onChange={(e) => { setWhatsappTemplateName(e.target.value); markChanged(); }}
                  placeholder={ar ? "مثال: corbit_alert" : "e.g. corbit_alert"}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.card, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 12 }}
                />
                <div style={{ fontSize: 10.5, color: C.t3, marginTop: 6, lineHeight: 1.5 }}>
                  {ar
                    ? "💡 يجب أن يحتوي القالب على متغيّرين {{1}} (العنوان) و {{2}} (الرسالة). بدون قالب معتمد، لن تُرسَل إشعارات واتساب."
                    : "💡 Template must accept {{1}} (title) and {{2}} (message). Without an approved template, WhatsApp notifications silently won't fire."}
                </div>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <ToggleRow C={C} label={ar ? "ساعات الهدوء" : "Quiet Hours"} desc={ar ? "إيقاف الإشعارات خلال فترة محددة" : "Mute notifications during a specific period"} on={quietHours} onToggle={() => { setQuietHours(!quietHours); markChanged(); }} icon="🌙" />
              {quietHours && (
                <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 10, background: C.inp, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: C.t2 }}>{ar ? "من" : "From"}</span>
                  <input
                    type="time"
                    value={quietFrom}
                    onChange={(e) => { setQuietFrom(e.target.value); markChanged(); }}
                    style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.card, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 12 }}
                  />
                  <span style={{ fontSize: 11.5, color: C.t2 }}>{ar ? "إلى" : "to"}</span>
                  <input
                    type="time"
                    value={quietTo}
                    onChange={(e) => { setQuietTo(e.target.value); markChanged(); }}
                    style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.card, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 12 }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <ToggleRow C={C} label={ar ? "التقارير التلقائية" : "Auto Reports"} desc={ar ? "إرسال تقارير دورية تلقائياً عبر البريد" : "Email periodic performance reports"} on={autoReports} onToggle={() => { setAutoReports(!autoReports); markChanged(); }} icon="📊" />
              {autoReports && (
                <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: 10, background: C.inp, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11.5, color: C.t2, marginInlineEnd: 4 }}>{ar ? "التكرار:" : "Frequency:"}</span>
                  {([
                    { value: "daily",   label: ar ? "يومي" : "Daily" },
                    { value: "weekly",  label: ar ? "أسبوعي" : "Weekly" },
                    { value: "monthly", label: ar ? "شهري" : "Monthly" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setAutoReportFreq(opt.value); markChanged(); }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: `1px solid ${autoReportFreq === opt.value ? C.pri : C.brd}`,
                        background: autoReportFreq === opt.value ? `${C.pri}12` : C.card,
                        color: autoReportFreq === opt.value ? C.pri : C.t2,
                        fontFamily: FONT_FAMILY, fontSize: 11.5, fontWeight: autoReportFreq === opt.value ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ SECURITY TAB ═══════════ */}
      {tab === "security" && (
        <div style={grid2Style}>
          {/* Authentication */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "المصادقة" : "Authentication"}</SectionTitle>
            <ToggleRow C={C} label={ar ? "المصادقة الثنائية" : "Two-Factor Authentication"} desc={ar ? "طلب رمز SMS إضافي عند تسجيل الدخول. يتطلّب رقم جوّال مسجّل." : "Require an SMS code on login. Requires a phone on file."} on={twoFA} onToggle={() => { setTwoFA(!twoFA); markChanged(); }} icon="🔐" />
            <ToggleRow C={C} comingSoon label={ar ? "تسجيل الدخول الموحد" : "Single Sign-On (SSO)"} desc={ar ? "تسجيل الدخول عبر مزود هوية خارجي" : "Login via external identity provider"} on={sso} onToggle={() => setSSO(!sso)} icon="🔑" />
            <ToggleRow C={C} comingSoon label={ar ? "قائمة IP المسموحة" : "IP Whitelist"} desc={ar ? "تقييد الوصول لعناوين IP محددة" : "Restrict access to specific IPs"} on={ipWhite} onToggle={() => setIpWhite(!ipWhite)} icon="🛡️" />
            <ToggleRow C={C} comingSoon label={ar ? "مهلة الجلسة" : "Session Timeout"} desc={ar ? "تسجيل خروج تلقائي بعد فترة خمول" : "Auto-logout after inactivity"} on={sessTimeout} onToggle={() => setSessTimeout(!sessTimeout)} icon="⏱️" />

            <div style={{ marginTop: 10, opacity: 0.55 }}>
              <FieldLabel C={C}>
                {ar ? "سياسة كلمة المرور" : "Password Policy"}
                <span style={{ fontSize: 9.5, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: `${C.warn}20`, color: C.warn, marginInlineStart: 6 }}>قريباً</span>
              </FieldLabel>
              <div style={{ display: "flex", gap: 6 }}>
                {(ar ? ["أساسية", "متوسطة", "قوية"] : ["Basic", "Medium", "Strong"]).map((p, i) => (
                  <button key={i} disabled style={{ padding: "6px 14px", borderRadius: 8, border: i === 2 ? `1.5px solid ${C.pri}` : `1.5px solid ${dk ? C.brd : "#D5D2CC"}`, background: i === 2 ? `${C.pri}12` : "transparent", color: i === 2 ? C.pri : C.t2, fontFamily: FONT_FAMILY, fontSize: 11, cursor: "not-allowed", fontWeight: i === 2 ? 600 : 400 }}>{p}</button>
                ))}
              </div>
            </div>
          </Card>

          {/* Audit Log */}
          <AuditLogPanel C={C} ar={ar} dk={dk} />
        </div>
      )}

      {/* ═══════════ CHANNELS TAB ═══════════ */}
      {tab === "channels" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Org-wide sending policy — frequency cap + send window.
              Per-campaign overrides live in the campaign create
              modal; this is the global default that applies when
              the operator doesn't override. */}
          <SendingPolicyCard />

          <div style={grid2Style}>
            {/* WhatsApp */}
            <Card style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.wa}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="msg" size={18} />
                </div>
                <div>
                  <SectionTitle>WhatsApp Business</SectionTitle>
                </div>
              </div>
              {whatsappNumbers.length === 0 ? (
                <div style={{ padding: "16px 0", fontSize: 12.5, color: C.t2, textAlign: "center" }}>
                  {ar ? "لا توجد أرقام واتساب مُعدّة بعد" : "No WhatsApp numbers configured yet"}
                </div>
              ) : (
                whatsappNumbers.map((ph: any) => (
                  <div key={ph.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, direction: "ltr" }}>{ph.phone_number}</div>
                      <div style={{ fontSize: 11, color: C.t2 }}>{(ar ? ph.display_name_ar : null) || ph.display_name}</div>
                    </div>
                    <Badge color={ph.is_verified ? C.ok : C.warn}>
                      {ph.is_verified ? (ar ? "موثق" : "Verified") : (ar ? "قيد المراجعة" : "Pending")}
                    </Badge>
                  </div>
                ))
              )}
              <div style={{ marginTop: 10, fontSize: 11, color: C.t2 }}>
                {ar ? "المزوّد الحالي: " : "Active provider: "}<b style={{ color: C.txt }}>{(whatsappData as any)?.provider ?? "—"}</b>
              </div>
            </Card>

            {/* SMS — UI shown for the management roadmap, but the per-org
                wiring (provider creds + routing) isn't in place yet. The
                platform-level mobile.net.sa channel is already working
                for OTP and account credentials. */}
            <Card style={{ padding: 18, opacity: 0.7 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.info}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="phone" size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                    {ar ? "الرسائل القصيرة" : "SMS"}
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: `${C.warn}20`, color: C.warn }}>قريباً</span>
                  </h3>
                </div>
                <Toggle on={false} onToggle={() => {}} />
              </div>

              <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.7 }}>
                {ar
                  ? "ستُستخدم كقناة احتياطية للحملات التسويقيّة عند فشل واتساب، وكذلك لإشعارات الحسابات و OTP. مفعّلة على مستوى المنصّة، وقريباً يُتاح الضبط لكل مؤسّسة على حدة."
                  : "Will serve as a fallback for marketing campaigns when WhatsApp fails, plus account & OTP notifications. Already active platform-wide; per-org configuration is on the way."}
              </div>
            </Card>
          </div>

          {/* Channel Preferences — saving isn't wired up yet, so we
              freeze the controls and tag the section. */}
          <Card style={{ padding: 18, opacity: 0.7 }}>
            <SectionTitleWithComingSoon C={C}>{ar ? "تفضيلات القنوات" : "Channel Preferences"}</SectionTitleWithComingSoon>
            <div style={grid2Style}>
              {/* Mode selection */}
              <div>
                <FieldLabel C={C}>{ar ? "وضع القنوات" : "Channel Mode"}</FieldLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  {[
                    { key: "wa_only", label: ar ? "واتساب فقط" : "WhatsApp Only", desc: ar ? "استخدام واتساب كقناة وحيدة" : "Use WhatsApp as the only channel" },
                    { key: "wa_sms", label: ar ? "واتساب + SMS احتياطي" : "WA + SMS Fallback", desc: ar ? "SMS عند عدم توفر واتساب" : "SMS when WhatsApp is unavailable" },
                    { key: "dual", label: ar ? "قنوات مزدوجة" : "Dual Channel", desc: ar ? "استخدام كلا القناتين بالتوازي" : "Use both channels simultaneously" },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        cursor: "not-allowed",
                        border: `1px solid ${channelMode === opt.key ? C.pri : C.brd}`,
                        background: channelMode === opt.key ? `${C.pri}10` : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{ width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${channelMode === opt.key ? C.pri : C.t3}` }}
                        >
                          {channelMode === opt.key && <div style={{ width: 10, height: 10, borderRadius: 5, background: C.pri }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: C.t2 }}>{opt.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel routing */}
              <div>
                <FieldLabel C={C}>{ar ? "توجيه القنوات حسب الاستخدام" : "Channel Routing by Use Case"}</FieldLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
                  {[
                    { label: ar ? "الدعم" : "Support", value: "WhatsApp" },
                    { label: ar ? "التسويق" : "Marketing", value: "WhatsApp" },
                    { label: ar ? "المعاملات" : "Transactional", value: ar ? "كلاهما" : "Both" },
                    { label: ar ? "التنبيهات" : "Alerts", value: "SMS" },
                  ].map((route, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>
                      <span style={{ fontSize: 13 }}>{route.label}</span>
                      <span style={{ fontSize: 12, color: C.t2, padding: "5px 10px", borderRadius: 8, background: C.inp }}>{route.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Channel Comparison — KPI cards per channel + decision tip.
              Numbers are static benchmarks for orientation, not a
              live read of this org's traffic. */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "مقارنة القنوات" : "Channel Comparison"}</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {[
                {
                  channel: "WhatsApp",
                  color: C.wa,
                  emoji: "💬",
                  metrics: [
                    { label: ar ? "نسبة القراءة" : "Read Rate", value: "79%", color: C.ok },
                    { label: ar ? "التكلفة" : "Cost", value: ar ? "0.20-0.30 ر.س" : "0.20-0.30 SAR", color: C.pri },
                    { label: ar ? "الوسائط" : "Media", value: "✓", color: C.ok },
                  ],
                },
                {
                  channel: "SMS",
                  color: "#5B21B6",
                  emoji: "📱",
                  metrics: [
                    { label: ar ? "نسبة القراءة" : "Read Rate", value: "95%", color: C.ok },
                    { label: ar ? "التكلفة" : "Cost", value: ar ? "0.15-0.30 ر.س" : "0.15-0.30 SAR", color: C.warn },
                    { label: ar ? "الوسائط" : "Media", value: "✗", color: C.err },
                  ],
                },
              ].map((row) => (
                <div key={row.channel} style={{ padding: 12, borderRadius: 12, background: C.inp }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 700, fontSize: 13 }}>
                    <span style={{ fontSize: 16 }}>{row.emoji}</span>
                    <span style={{ color: row.color }}>{row.channel}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {row.metrics.map((m, i) => (
                      <div key={i} style={{ textAlign: "center", padding: "8px 6px", borderRadius: 8, background: dk ? "#0e0e16" : "#fff" }}>
                        <div style={{ fontSize: 10.5, color: C.t2, marginBottom: 3 }}>{m.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: `${C.pri}08`, border: `1px solid ${C.pri}20`, fontSize: 11.5, color: C.t2, lineHeight: 1.6 }}>
              💡 {ar
                ? "SMS أعلى نسبة قراءة لكن بدون وسائط. واتساب أغنى محتوى وأكثر تفاعلاً للحملات. الجمع بينهما (Fallback) يضمن الوصول دون مضاعفة التكلفة."
                : "SMS has the highest read rate but no media. WhatsApp is richer and more engaging for campaigns. Combining them (Fallback mode) maximizes reach without doubling cost."}
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ WHATSAPP TAB ═══════════ */}
      {tab === "whatsapp" && (
        <WhatsAppConnect showHeader={false} />
      )}

      {/* ═══════════ SMS TAB ═══════════ */}
      {tab === "sms" && (
        <SmsSettingsPanel />
      )}

      {/* ═══════════ CSAT TAB ═══════════ */}
      {tab === "csat" && (
        <CsatSettingsPanel />
      )}

      {/* ═══════════ QUICK REPLIES TAB ═══════════ */}
      {tab === "quick-replies" && (
        <QuickRepliesPanel />
      )}

      {/* ═══════════ TEAM TAB ═══════════ */}
      {tab === "team" && (
        <div style={grid2Style}>
          {/* Roles & Permissions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "الأدوار والصلاحيات" : "Roles & Permissions"}</SectionTitle>
              {[
                { role: ar ? "مدير" : "Admin", count: roleCounts.admin, color: C.err, desc: ar ? "وصول كامل لجميع الإعدادات والبيانات" : "Full access to all settings and data", icon: "🔴" },
                { role: ar ? "مشرف" : "Supervisor", count: roleCounts.supervisor, color: C.warn, desc: ar ? "إدارة الفريق ومراقبة المحادثات" : "Team management & conversation monitoring", icon: "🟡" },
                { role: ar ? "وكيل" : "Agent", count: roleCounts.agent, color: C.ok, desc: ar ? "التعامل مع المحادثات والعملاء" : "Handle conversations and customers", icon: "🟢" },
              ].map((r, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 12, background: C.inp, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{r.role}</span>
                      <Badge color={r.color}>{r.count} {ar ? "أعضاء" : "members"}</Badge>
                    </div>
                    <Button small outline onClick={() => showToast("✓")}>
                      <Icon name="pencil" size={12} />
                    </Button>
                  </div>
                  <div style={{ fontSize: 11, color: C.t2 }}>{r.desc}</div>
                </div>
              ))}
            </Card>

            {/* SLA Settings */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "إعدادات SLA" : "SLA Settings"}</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldLabel C={C}>{ar ? "وقت الاستجابة الأولى" : "First Response Time"}</FieldLabel>
                  <Select value={ar ? "5 دقائق" : "5 minutes"} options={ar ? ["1 دقيقة", "5 دقائق", "15 دقيقة", "30 دقيقة"] : ["1 minute", "5 minutes", "15 minutes", "30 minutes"]} C={C} />
                </div>
                <div>
                  <FieldLabel C={C}>{ar ? "وقت الحل" : "Resolution Time"}</FieldLabel>
                  <Select value={ar ? "4 ساعات" : "4 hours"} options={ar ? ["ساعة", "4 ساعات", "8 ساعات", "24 ساعة"] : ["1 hour", "4 hours", "8 hours", "24 hours"]} C={C} />
                </div>
                <div>
                  <FieldLabel C={C}>{ar ? "تحذير التصعيد" : "Escalation Warning"}</FieldLabel>
                  <Select value={ar ? "3 دقائق" : "3 minutes"} options={ar ? ["1 دقيقة", "3 دقائق", "5 دقائق"] : ["1 minute", "3 minutes", "5 minutes"]} C={C} />
                </div>
                <div>
                  <FieldLabel C={C}>{ar ? "أولوية VIP" : "VIP Priority"}</FieldLabel>
                  <Select value={ar ? "عالية" : "High"} options={ar ? ["عادية", "عالية", "عاجلة"] : ["Normal", "High", "Urgent"]} C={C} />
                </div>
              </div>
            </Card>
          </div>

          {/* Conversation Settings */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "إعدادات المحادثات" : "Conversation Settings"}</SectionTitle>
            <ToggleRow C={C}
              label={ar ? "إغلاق تلقائي" : "Auto Close"}
              desc={ar ? "إغلاق المحادثات غير النشطة بعد 24 ساعة" : "Close inactive conversations after 24 hours"}
              on={autoClose}
              onToggle={() => setAutoClose(!autoClose)}
              icon="🔒"
            />
            <ToggleRow C={C}
              label={ar ? "تعيين تلقائي" : "Auto Assign"}
              desc={ar ? "تعيين المحادثات الجديدة تلقائياً للوكلاء المتاحين" : "Auto-assign new conversations to available agents"}
              on={autoAssign}
              onToggle={() => setAutoAssign(!autoAssign)}
              icon="🔄"
            />
            <ToggleRow C={C}
              label={ar ? "استلام العميل" : "Customer Takeover"}
              desc={ar ? "السماح للعملاء بتحويل من البوت للوكيل" : "Allow customers to transfer from bot to agent"}
              on={custTakeover}
              onToggle={() => setCustTakeover(!custTakeover)}
              icon="🤝"
            />
            <ToggleRow C={C}
              label={ar ? "استبيان بعد الإغلاق" : "Post-Close Survey"}
              desc={ar ? "إرسال استبيان رضا بعد إغلاق المحادثة" : "Send satisfaction survey after closing conversation"}
              on={postSurvey}
              onToggle={() => setPostSurvey(!postSurvey)}
              icon="⭐"
            />

            <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: `${C.pri}08`, border: `1px solid ${C.pri}20` }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{ar ? "إعدادات التعيين التلقائي" : "Auto-Assign Settings"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <FieldLabel C={C}>{ar ? "الخوارزمية" : "Algorithm"}</FieldLabel>
                  <Select value={ar ? "الأقل حملاً" : "Least Load"} options={ar ? ["الأقل حملاً", "دوري", "عشوائي"] : ["Least Load", "Round Robin", "Random"]} C={C} />
                </div>
                <div>
                  <FieldLabel C={C}>{ar ? "الحد الأقصى للوكيل" : "Max per Agent"}</FieldLabel>
                  <Input value="15" type="number" C={C} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ API TAB ═══════════ */}
      {tab === "api" && (
        <ApiAndWebhooksPanel C={C} dk={dk} ar={ar} isMob={isMob} />
      )}
    </div>
  );
}
