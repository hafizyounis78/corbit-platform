"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import { FONT_FAMILY } from "@/lib/constants/font";

export type IssueContext =
  | { type: "general" }
  | { type: "message"; conversationId: string; messageId: string; preview?: string; sentAt?: string }
  | { type: "conversation"; conversationId: string; preview?: string }
  | { type: "campaign"; campaignId: string; name?: string }
  | { type: "template"; templateId: string; name?: string }
  | { type: "billing"; transactionId?: string };

interface Props {
  open: boolean;
  onClose: () => void;
  context: IssueContext;
  /** Called with the new ticket id once the API succeeds. */
  onCreated?: (ticketId: string) => void;
}

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
type Priority = (typeof PRIORITIES)[number];

/**
 * Reusable modal that opens a support ticket pre-bound to whatever
 * context the caller is in (a specific message, a campaign, billing,
 * or just "general"). The context payload is captured into
 * context_meta on the server so support can see what the customer
 * was looking at even if the underlying object is later deleted.
 */
export function ReportIssueModal({ open, onClose, context, onCreated }: Props) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [submitting, setSubmitting] = useState(false);

  // Reset form whenever the modal opens for a new context.
  useEffect(() => {
    if (open) {
      setSubject(suggestedSubject(context, isAr));
      setBody("");
      setPriority("medium");
    }
  }, [open, context, isAr]);

  const submit = async () => {
    const trimmed = subject.trim();
    const message = body.trim();
    if (!trimmed || !message) {
      showToast(isAr ? "العنوان والشرح مطلوبان" : "Subject and message are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const { type, ...rest } = context as { type: string } & Record<string, unknown>;
      const contextId =
        type === "message" ? (rest.messageId as string)
        : type === "conversation" ? (rest.conversationId as string)
        : type === "campaign" ? (rest.campaignId as string)
        : type === "template" ? (rest.templateId as string)
        : type === "billing" ? ((rest.transactionId as string) ?? null)
        : null;

      const res = await api.post(API.SUPPORT.TICKETS.CREATE, {
        subject:      trimmed,
        body:         message,
        priority,
        context_type: type,
        context_id:   contextId,
        context_meta: rest,
      });
      const ticketId = res?.data?.data?.id ?? res?.data?.id;
      showToast(isAr ? "تمّ فتح تذكرتك. سنرد عليك قريباً." : "Ticket opened. We'll reply soon.");
      onCreated?.(ticketId);
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "";
      showToast(isAr ? `تعذّر فتح التذكرة: ${msg}` : `Failed to open ticket: ${msg}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const contextLabel = describeContext(context, isAr);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isAr ? "تبليغ عن مشكلة" : "Report an Issue"}
      submitLabel={submitting ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال البلاغ" : "Submit")}
      submitLoading={submitting}
      onSubmit={submit}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {contextLabel && (
          <div style={{ fontSize: 12, padding: "10px 12px", borderRadius: 10, background: `${C.info}10`, color: C.t2, lineHeight: 1.7, border: `1px solid ${C.info}25` }}>
            <div style={{ fontWeight: 600, color: C.txt, marginBottom: 2 }}>
              {isAr ? "السياق المرفق:" : "Attached context:"}
            </div>
            {contextLabel}
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, color: C.t2, display: "block", marginBottom: 6 }}>
            {isAr ? "العنوان" : "Subject"} *
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={isAr ? "ملخّص قصير للمشكلة" : "Short summary"}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 13, color: C.txt, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: C.t2, display: "block", marginBottom: 6 }}>
            {isAr ? "الأهميّة" : "Priority"}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            {PRIORITIES.map((p) => {
              const active = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    padding: "8px 10px", borderRadius: 8, fontSize: 11.5, fontFamily: FONT_FAMILY,
                    border: `1.5px solid ${active ? C.pri : C.brd}`,
                    background: active ? `${C.pri}10` : C.inp,
                    color: active ? C.pri : C.t2,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  {priorityLabel(p, isAr)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, color: C.t2, display: "block", marginBottom: 6 }}>
            {isAr ? "تفاصيل المشكلة" : "Details"} *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isAr ? "ماذا حصل بالضبط؟ ما الخطوات التي قمت بها؟" : "What happened? What steps did you take?"}
            rows={6}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 13, color: C.txt, outline: "none", resize: "vertical", boxSizing: "border-box" }}
          />
        </div>
      </div>
    </Modal>
  );
}

function priorityLabel(p: Priority, isAr: boolean): string {
  if (isAr) {
    return p === "low" ? "منخفضة" : p === "medium" ? "عاديّة" : p === "high" ? "عالية" : "عاجلة";
  }
  return p[0].toUpperCase() + p.slice(1);
}

function suggestedSubject(ctx: IssueContext, isAr: boolean): string {
  switch (ctx.type) {
    case "message":
      return isAr ? "مشكلة في رسالة" : "Issue with a message";
    case "conversation":
      return isAr ? "مشكلة في محادثة" : "Issue with a conversation";
    case "campaign":
      return isAr ? `مشكلة في حملة${ctx.name ? ": " + ctx.name : ""}` : `Issue with campaign${ctx.name ? ": " + ctx.name : ""}`;
    case "template":
      return isAr ? `مشكلة في قالب${ctx.name ? ": " + ctx.name : ""}` : `Issue with template${ctx.name ? ": " + ctx.name : ""}`;
    case "billing":
      return isAr ? "مشكلة في الفوترة" : "Billing issue";
    default:
      return "";
  }
}

function describeContext(ctx: IssueContext, isAr: boolean): string {
  switch (ctx.type) {
    case "message":
      return isAr
        ? `رسالة في محادثة (ID: ${shortId(ctx.messageId)})${ctx.preview ? ` — "${truncate(ctx.preview, 60)}"` : ""}`
        : `Message in conversation (ID: ${shortId(ctx.messageId)})${ctx.preview ? ` — "${truncate(ctx.preview, 60)}"` : ""}`;
    case "conversation":
      return isAr
        ? `محادثة (ID: ${shortId(ctx.conversationId)})`
        : `Conversation (ID: ${shortId(ctx.conversationId)})`;
    case "campaign":
      return isAr
        ? `حملة${ctx.name ? `: ${ctx.name}` : ""} (ID: ${shortId(ctx.campaignId)})`
        : `Campaign${ctx.name ? `: ${ctx.name}` : ""} (ID: ${shortId(ctx.campaignId)})`;
    case "template":
      return isAr
        ? `قالب${ctx.name ? `: ${ctx.name}` : ""} (ID: ${shortId(ctx.templateId)})`
        : `Template${ctx.name ? `: ${ctx.name}` : ""} (ID: ${shortId(ctx.templateId)})`;
    case "billing":
      return isAr ? "الفوترة" : "Billing";
    default:
      return "";
  }
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
