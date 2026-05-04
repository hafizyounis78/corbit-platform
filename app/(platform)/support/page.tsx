"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Badge, TabBar } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useSupportTickets } from "@/lib/api/hooks";
import { ReportIssueModal } from "@/components/support/report-issue-modal";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GuidesPanel } from "@/components/help/guides-panel";
import { FaqPanel } from "@/components/help/faq-panel";
import { ContactPanel } from "@/components/help/contact-panel";
import { LiveChatPanel } from "@/components/help/live-chat-panel";

const STATUSES = ["all", "open", "in_progress", "awaiting_user", "resolved", "closed"] as const;

type Tab = "guides" | "faq" | "tickets" | "live-chat" | "contact";

const VALID_TABS: Tab[] = ["guides", "faq", "tickets", "live-chat", "contact"];

/**
 * Help Center — replaces the old single-purpose Tickets page with
 * five tabs (Guides / FAQ / Tickets / Live Chat / Contact). Tickets
 * tab is the legacy view, the rest are new. Tab state survives
 * navigation via the ?tab= query parameter.
 */
export default function HelpCenterPage() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams?.get("tab") as Tab) ?? "guides";
  const [tab, setTab] = useState<Tab>(VALID_TABS.includes(initialTab) ? initialTab : "guides");

  // Reflect tab choice in the URL so a deep link from a guide step's
  // "Open this in Help Center" works, and a refresh keeps the user
  // where they were.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, [tab]);

  const tabs = [
    { key: "guides",    label: isAr ? "📖 الأدلّة" : "📖 Guides" },
    { key: "faq",       label: isAr ? "❓ الأسئلة الشائعة" : "❓ FAQ" },
    { key: "tickets",   label: isAr ? "🎫 التذاكر" : "🎫 Tickets" },
    { key: "live-chat", label: isAr ? "💬 محادثة الدعم" : "💬 Live Chat" },
    { key: "contact",   label: isAr ? "📞 تواصل معنا" : "📞 Contact" },
  ];

  return (
    <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          {isAr ? "مركز المساعدة" : "Help Center"}
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: C.t2 }}>
          {isAr
            ? "أدلّة الاستخدام، الأسئلة الشائعة، والدعم الفنّي — كلّها في مكان واحد."
            : "Guides, FAQ, and technical support — all in one place."}
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} active={tab} onChange={(v) => setTab(v as Tab)} />
      </div>

      {tab === "guides" && <GuidesPanel onNavigate={(path) => router.push(path)} />}
      {tab === "faq" && <FaqPanel />}
      {tab === "tickets" && <TicketsTab router={router} />}
      {tab === "live-chat" && <LiveChatPanel />}
      {tab === "contact" && <ContactPanel />}
    </div>
  );
}

// ─── Tickets Tab — the legacy support page, now embedded ─────────

function TicketsTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("all");
  const { data, isLoading, mutate } = useSupportTickets(statusFilter === "all" ? undefined : statusFilter);
  const [createOpen, setCreateOpen] = useState(false);
  const tickets: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUSES.map((s) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "6px 12px", borderRadius: 999, border: `1px solid ${active ? C.pri : C.brd}`,
                  background: active ? `${C.pri}12` : "transparent",
                  color: active ? C.pri : C.t2, fontFamily: FONT_FAMILY, fontSize: 12.5,
                  fontWeight: active ? 600 : 500, cursor: "pointer",
                }}
              >
                {ticketsStatusLabel(s, isAr)}
              </button>
            );
          })}
        </div>
        <Button primary onClick={() => setCreateOpen(true)}>
          {isAr ? "+ تذكرة جديدة" : "+ New Ticket"}
        </Button>
      </div>

      <Card style={{ padding: 0 }}>
        {isLoading && (
          <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
            {isAr ? "جاري التحميل..." : "Loading..."}
          </div>
        )}

        {!isLoading && tickets.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎫</div>
            <div style={{ fontSize: 14, color: C.t2, marginBottom: 14 }}>
              {isAr ? "لا توجد تذاكر بعد." : "No tickets yet."}
            </div>
            <Button outline small onClick={() => setCreateOpen(true)}>
              {isAr ? "افتح أوّل تذكرة" : "Open your first ticket"}
            </Button>
          </div>
        )}

        {!isLoading && tickets.length > 0 && (
          <div>
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => router.push(`/support/${t.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                  borderBottom: `1px solid ${C.brd}`, cursor: "pointer",
                }}
              >
                <PriorityDot priority={t.priority} C={C} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.subject}
                    </div>
                    <TicketStatusBadge status={t.status} isAr={isAr} C={C} />
                  </div>
                  <div style={{ fontSize: 11.5, color: C.t2, display: "flex", gap: 12 }}>
                    <span>#{String(t.id).slice(0, 8)}</span>
                    <span>{t.messages_count ?? 0} {isAr ? "ردّ" : "replies"}</span>
                    {t.last_reply_at && <span>{ticketsRelativeTime(t.last_reply_at, isAr)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ReportIssueModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        context={{ type: "general" }}
        onCreated={() => mutate()}
      />
    </>
  );
}

function PriorityDot({ priority, C }: { priority: string; C: any }) {
  const color = priority === "urgent" ? C.err : priority === "high" ? C.warn : priority === "medium" ? C.info : C.t3;
  return <div style={{ width: 10, height: 10, borderRadius: 5, background: color, flexShrink: 0 }} />;
}

function TicketStatusBadge({ status, isAr, C }: { status: string; isAr: boolean; C: any }) {
  const map: Record<string, { color: string; ar: string; en: string }> = {
    open:           { color: C.info, ar: "مفتوحة",       en: "Open" },
    in_progress:    { color: C.warn, ar: "قيد المعالجة", en: "In Progress" },
    awaiting_user:  { color: C.pri,  ar: "بانتظارك",     en: "Awaiting You" },
    resolved:       { color: C.ok,   ar: "محلولة",       en: "Resolved" },
    closed:         { color: C.t3,   ar: "مغلقة",        en: "Closed" },
  };
  const v = map[status] ?? { color: C.t3, ar: status, en: status };
  return <Badge color={v.color}>{isAr ? v.ar : v.en}</Badge>;
}

function ticketsStatusLabel(s: string, isAr: boolean): string {
  if (s === "all") return isAr ? "الكل" : "All";
  return ({
    open:          { ar: "مفتوحة",       en: "Open" },
    in_progress:   { ar: "قيد المعالجة", en: "In Progress" },
    awaiting_user: { ar: "بانتظارك",     en: "Awaiting You" },
    resolved:      { ar: "محلولة",       en: "Resolved" },
    closed:        { ar: "مغلقة",        en: "Closed" },
  } as Record<string, { ar: string; en: string }>)[s]?.[isAr ? "ar" : "en"] ?? s;
}

function ticketsRelativeTime(iso: string, isAr: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return isAr ? "الآن" : "now";
  if (min < 60) return isAr ? `قبل ${min} دقيقة` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return isAr ? `قبل ${hr} ساعة` : `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return isAr ? `قبل ${day} يوم` : `${day}d ago`;
}
