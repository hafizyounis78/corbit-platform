"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Badge } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useSupportTicket } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import { FONT_FAMILY } from "@/lib/constants/font";

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const { data, isLoading, mutate } = useSupportTicket(id);
  const ticket: any = (data as any)?.data ?? data;

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  if (isLoading) {
    return (
      <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY }}>
        <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: C.t2 }}>
          {isAr ? "جاري التحميل..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY }}>
        <Card style={{ padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: C.t2 }}>{isAr ? "التذكرة غير موجودة" : "Ticket not found"}</div>
          <Button outline small style={{ marginTop: 12 }} onClick={() => router.push("/support")}>
            {isAr ? "العودة للقائمة" : "Back to list"}
          </Button>
        </Card>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";
  const messages: any[] = ticket.public_messages ?? ticket.publicMessages ?? ticket.messages ?? [];

  const submitReply = async () => {
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.post(API.SUPPORT.TICKETS.REPLY(id), { body });
      setReply("");
      mutate();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "";
      showToast(isAr ? `فشل الإرسال: ${msg}` : `Failed: ${msg}`, "error");
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    if (!confirm(isAr ? "هل تريد إغلاق هذه التذكرة؟" : "Close this ticket?")) return;
    setClosing(true);
    try {
      await api.post(API.SUPPORT.TICKETS.CLOSE(id));
      showToast(isAr ? "تمّ إغلاق التذكرة" : "Ticket closed");
      mutate();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "";
      showToast(isAr ? `فشل الإغلاق: ${msg}` : `Failed: ${msg}`, "error");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 16, fontSize: 12.5 }}>
        <a onClick={() => router.push("/support")} style={{ color: C.pri, cursor: "pointer", textDecoration: "none" }}>
          ← {isAr ? "كلّ التذاكر" : "All tickets"}
        </a>
      </div>

      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{ticket.subject}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, fontSize: 12, color: C.t2, flexWrap: "wrap" }}>
              <span>#{String(ticket.id).slice(0, 8)}</span>
              <StatusBadge status={ticket.status} isAr={isAr} C={C} />
              <PriorityBadge priority={ticket.priority} isAr={isAr} C={C} />
              {ticket.context_type && ticket.context_type !== "general" && (
                <Badge color={C.info}>{contextLabel(ticket.context_type, isAr)}</Badge>
              )}
            </div>
          </div>
          {!isClosed && (
            <Button outline small onClick={closeTicket} disabled={closing}>
              {closing ? (isAr ? "جاري الإغلاق..." : "Closing...") : (isAr ? "إغلاق" : "Close")}
            </Button>
          )}
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {messages.length === 0 && (
          <Card style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: C.t2 }}>
            {isAr ? "لا توجد ردود بعد" : "No messages yet"}
          </Card>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} C={C} isAr={isAr} />
        ))}
      </div>

      {!isClosed ? (
        <Card style={{ padding: 16 }}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={isAr ? "اكتب ردّك..." : "Type your reply..."}
            rows={4}
            style={{
              width: "100%", padding: 12, borderRadius: 10, background: C.inp,
              border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 13.5,
              color: C.txt, outline: "none", resize: "vertical", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <Button primary onClick={submitReply} disabled={sending || !reply.trim()}>
              {sending ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الردّ" : "Send Reply")}
            </Button>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: C.t2 }}>
          {isAr ? "هذه التذكرة مغلقة. افتح تذكرة جديدة للمتابعة." : "This ticket is closed. Open a new ticket to continue."}
        </Card>
      )}
    </div>
  );
}

function MessageBubble({ m, C, isAr }: { m: any; C: any; isAr: boolean }) {
  const fromAdmin = m.author_type === "admin";
  const fromSystem = m.author_type === "system";

  return (
    <Card
      style={{
        padding: 14,
        background: fromAdmin ? `${C.pri}08` : fromSystem ? C.inp : C.card,
        borderLeft: fromAdmin ? `3px solid ${C.pri}` : fromSystem ? `3px solid ${C.t3}` : `3px solid ${C.ok}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.txt }}>
          {fromAdmin ? (isAr ? `فريق Corbit · ${m.author_name}` : `Corbit Team · ${m.author_name}`)
            : fromSystem ? (isAr ? "النظام" : "System")
            : m.author_name}
        </div>
        <div style={{ fontSize: 11, color: C.t2 }}>{formatTime(m.created_at, isAr)}</div>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap", color: C.txt }}>
        {m.body}
      </div>
    </Card>
  );
}

function StatusBadge({ status, isAr, C }: { status: string; isAr: boolean; C: any }) {
  const map: Record<string, { color: string; ar: string; en: string }> = {
    open:          { color: C.info, ar: "مفتوحة",       en: "Open" },
    in_progress:   { color: C.warn, ar: "قيد المعالجة", en: "In Progress" },
    awaiting_user: { color: C.pri,  ar: "بانتظارك",     en: "Awaiting You" },
    resolved:      { color: C.ok,   ar: "محلولة",       en: "Resolved" },
    closed:        { color: C.t3,   ar: "مغلقة",        en: "Closed" },
  };
  const v = map[status] ?? { color: C.t3, ar: status, en: status };
  return <Badge color={v.color}>{isAr ? v.ar : v.en}</Badge>;
}

function PriorityBadge({ priority, isAr, C }: { priority: string; isAr: boolean; C: any }) {
  const map: Record<string, { color: string; ar: string; en: string }> = {
    urgent: { color: C.err, ar: "عاجلة",   en: "Urgent" },
    high:   { color: C.warn, ar: "عالية",  en: "High" },
    medium: { color: C.info, ar: "عاديّة", en: "Medium" },
    low:    { color: C.t3,  ar: "منخفضة", en: "Low" },
  };
  const v = map[priority] ?? map.medium;
  return <Badge color={v.color}>{isAr ? v.ar : v.en}</Badge>;
}

function contextLabel(t: string, isAr: boolean): string {
  return ({
    message:      { ar: "رسالة",   en: "Message" },
    conversation: { ar: "محادثة",  en: "Conversation" },
    campaign:     { ar: "حملة",    en: "Campaign" },
    template:     { ar: "قالب",    en: "Template" },
    billing:      { ar: "فوترة",   en: "Billing" },
    general:      { ar: "عام",     en: "General" },
  } as Record<string, { ar: string; en: string }>)[t]?.[isAr ? "ar" : "en"] ?? t;
}

function formatTime(iso: string | undefined, isAr: boolean): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}
