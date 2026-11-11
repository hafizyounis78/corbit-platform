"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useApi } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { SelfServeTrial } from "@/components/trial-platform/self-serve-trial";

type TrialStatus = "active" | "not_started" | "expired" | "cap_reached" | "ended";

interface TrialTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  header: string | null;
  body: string;
  footer: string | null;
  variablesCount: number;
  variableExamples: string[];
}

interface TrialSummary {
  status: TrialStatus;
  startsAt: string | null;
  expiresAt: string | null;
  daysLeft: number;
  messageCap: number;
  messagesUsed: number;
  remaining: number;
  allowedPhones: string[];
  templates: TrialTemplate[];
}

interface TrialMessage {
  id: string;
  phone: string;
  templateName: string;
  body: string | null;
  status: "sent" | "delivered" | "read" | "failed";
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
}

const STATUS_COPY: Record<TrialStatus, { ar: string; en: string }> = {
  active: { ar: "التجربة فعّالة", en: "Trial active" },
  not_started: { ar: "لم تبدأ التجربة بعد", en: "Trial not started yet" },
  expired: { ar: "انتهت مدّة التجربة — تواصل مع فريق المبيعات للاشتراك", en: "Trial period ended — contact sales to subscribe" },
  cap_reached: { ar: "استُنفد سقف رسائل التجربة — تواصل مع فريق المبيعات للاشتراك", en: "Trial message limit reached — contact sales to subscribe" },
  ended: { ar: "انتهت التجربة", en: "Trial ended" },
};

const MSG_STATUS: Record<TrialMessage["status"], { ar: string; en: string; color: string }> = {
  sent: { ar: "أُرسلت", en: "Sent", color: "#8B99AD" },
  delivered: { ar: "وصلت", en: "Delivered", color: "#4A9EFF" },
  read: { ar: "قُرئت", en: "Read", color: "#2ECC71" },
  failed: { ar: "فشلت", en: "Failed", color: "#FF5A5F" },
};

function render(body: string, vars: string[]): string {
  return body.replace(/\{\{\s*(\d+)\s*\}\}/g, (m, n) => {
    const v = vars[Number(n) - 1];
    return v && v.trim() ? v : m;
  });
}

export default function TrialPage() {
  const { colors: C } = useTheme();
  const { isAr, lang } = useLocale();
  const { showToast } = useToast();

  const { data: summary, isLoading, mutate: refreshSummary } = useApi<TrialSummary>("/trial");
  const [page, setPage] = useState(1);
  const { data: list, mutate: refreshList } = useApi<{ items: TrialMessage[]; meta: { currentPage: number; lastPage: number; total: number } }>(
    // The self-serve dashboard loads its own messages; this list (and its 10s poll) is for sales trials only.
    summary && !(summary as any).selfServe ? `/trial/messages?page=${page}&limit=10` : null,
    [],
    10000,
  );

  const [phone, setPhone] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [vars, setVars] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const template = useMemo(
    () => summary?.templates.find((t) => t.id === templateId) ?? null,
    [summary, templateId],
  );

  // Sensible defaults once the summary arrives.
  useEffect(() => {
    if (!summary) return;
    if (!phone && summary.allowedPhones.length) setPhone(summary.allowedPhones[0]);
    if (!templateId && summary.templates.length) setTemplateId(summary.templates[0].id);
  }, [summary]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill variables from the template's examples when it changes.
  useEffect(() => {
    if (!template) return setVars([]);
    setVars(Array.from({ length: template.variablesCount }, (_, i) => template.variableExamples[i] ?? ""));
  }, [template]);

  const active = summary?.status === "active";
  const varsOk = vars.every((v) => v.trim().length > 0);
  const canSend = active && !!phone && !!template && varsOk && !sending;

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(lang === "ar" ? "ar-SA" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const send = async () => {
    if (!canSend || !template) return;
    setSending(true);
    try {
      const res = await api.post("/trial/messages", { phone, templateId: template.id, variables: vars });
      const msg: TrialMessage | undefined = res.data?.data?.message;
      if (msg?.status === "failed") {
        showToast((isAr ? "تعذّر الإرسال: " : "Send failed: ") + (msg.error || ""), "error");
      } else {
        showToast(isAr ? "تمّ إرسال رسالة الاختبار" : "Test message sent");
      }
      setPage(1);
      refreshSummary(true);
      refreshList(true);
    } catch (e: any) {
      const errs = e?.response?.data?.errors;
      const first = errs && typeof errs === "object" ? (Object.values(errs)[0] as any) : null;
      showToast((Array.isArray(first) ? first[0] : null) || e?.response?.data?.message || (isAr ? "تعذّر الإرسال" : "Send failed"), "error");
      refreshSummary(true);
    } finally {
      setSending(false);
    }
  };

  const label: CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 };
  const input: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid " + C.brd,
    background: C.inp,
    color: C.txt,
    fontFamily: FONT_FAMILY,
    fontSize: 13.5,
    outline: "none",
    boxSizing: "border-box",
  };

  if (isLoading && !summary) {
    return <div style={{ textAlign: "center", color: C.t2, padding: 40 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>;
  }
  if (!summary) {
    return <div style={{ textAlign: "center", color: C.t2, padding: 40 }}>{isAr ? "لا توجد تجربة مفعّلة لهذا الحساب." : "No trial is active for this account."}</div>;
  }

  // The trial a customer started themselves gets the dashboard from the signup design.
  if ((summary as any).selfServe) {
    return <SelfServeTrial summary={summary as any} />;
  }

  const usedPct = summary.messageCap > 0 ? Math.min(100, Math.round((summary.messagesUsed / summary.messageCap) * 100)) : 100;
  const items = list?.items ?? [];
  const meta = list?.meta;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{isAr ? "تجربة إرسال واتساب" : "WhatsApp send trial"}</div>
            <div style={{ fontSize: 13, color: active ? C.ok : C.warn, marginTop: 4, fontWeight: 600 }}>
              {STATUS_COPY[summary.status][isAr ? "ar" : "en"]}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Stat label={isAr ? "الرسائل المتبقّية" : "Messages left"} value={`${summary.remaining} / ${summary.messageCap}`} />
            <Stat label={isAr ? "الأيّام المتبقّية" : "Days left"} value={String(summary.daysLeft)} />
            <Stat label={isAr ? "تنتهي في" : "Ends"} value={fmtDate(summary.expiresAt)} />
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: C.inp, marginTop: 14, overflow: "hidden" }}>
          <div style={{ width: usedPct + "%", height: "100%", background: usedPct >= 100 ? C.err : C.pri, transition: "width .3s" }} />
        </div>
        <div style={{ fontSize: 12, color: C.t3, marginTop: 10, lineHeight: 1.7 }}>
          {isAr
            ? "الرسائل تُرسل من رقم واتساب كوربت المعتمد وبقوالب تجريبيّة معتمدة مسبقاً، إلى أرقام الاختبار المحدّدة لحسابك فقط. يتوقّف الإرسال تلقائيّاً عند بلوغ السقف أو انتهاء المدّة، أيّهما أسبق."
            : "Messages are sent from Corbit's verified WhatsApp number using pre-approved trial templates, to your account's test numbers only. Sending stops automatically at the message limit or the end date, whichever comes first."}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        {/* Send form */}
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>{isAr ? "إرسال رسالة اختبار" : "Send a test message"}</div>

          <label style={label}>{isAr ? "رقم الاختبار" : "Test number"}</label>
          <select value={phone} onChange={(e) => setPhone(e.target.value)} style={{ ...input, marginBottom: 14 }} dir="ltr">
            {summary.allowedPhones.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <label style={label}>{isAr ? "القالب" : "Template"}</label>
          {summary.templates.length === 0 ? (
            <div style={{ fontSize: 13, color: C.t2, marginBottom: 14 }}>
              {isAr ? "لا توجد قوالب تجريبيّة متاحة حالياً." : "No trial templates are available right now."}
            </div>
          ) : (
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={{ ...input, marginBottom: 14 }}>
              {summary.templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {template && template.variablesCount > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={label}>{isAr ? "قيم المتغيّرات" : "Variable values"}</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {vars.map((v, i) => (
                  <input
                    key={i}
                    value={v}
                    maxLength={200}
                    placeholder={`{{${i + 1}}}`}
                    onChange={(e) => setVars((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    style={input}
                  />
                ))}
              </div>
            </div>
          )}

          <Button primary disabled={!canSend} onClick={send} style={{ width: "100%", justifyContent: "center", padding: "11px 18px", fontSize: 13.5 }}>
            <Icon name={sending ? "loader" : "send"} size={15} />
            {sending ? (isAr ? "جاري الإرسال..." : "Sending...") : isAr ? "إرسال" : "Send"}
          </Button>
        </Card>

        {/* Preview */}
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>{isAr ? "معاينة الرسالة" : "Preview"}</div>
          <div style={{ background: "#E5DDD5", borderRadius: 12, padding: 16, minHeight: 160 }}>
            {template ? (
              <div
                dir="auto"
                style={{
                  background: "#fff",
                  color: "#111",
                  borderRadius: 10,
                  padding: "10px 12px",
                  maxWidth: 320,
                  boxShadow: "0 1px 1px rgba(0,0,0,.1)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontSize: 13.5,
                }}
              >
                {template.header && <div style={{ fontWeight: 700, marginBottom: 4 }}>{template.header}</div>}
                <div>{render(template.body, vars)}</div>
                {template.footer && <div style={{ fontSize: 11.5, color: "#667", marginTop: 6 }}>{template.footer}</div>}
              </div>
            ) : (
              <div style={{ color: "#555", fontSize: 13 }}>{isAr ? "اختر قالباً" : "Choose a template"}</div>
            )}
          </div>
        </Card>
      </div>

      {/* Messages */}
      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid " + C.brd }}>
          <div style={{ fontWeight: 700 }}>{isAr ? "رسائلي التجريبيّة" : "My test messages"}</div>
          <button
            onClick={() => refreshList(true)}
            style={{ border: "none", background: "transparent", color: C.t2, cursor: "pointer", display: "inline-flex" }}
            aria-label={isAr ? "تحديث" : "Refresh"}
          >
            <Icon name="refresh" size={16} />
          </button>
        </div>
        {items.length === 0 ? (
          <div style={{ padding: 28, textAlign: "center", color: C.t2, fontSize: 13 }}>
            {isAr ? "لم تُرسل أيّ رسالة اختبار بعد." : "No test messages yet."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
              <thead>
                <tr style={{ color: C.t2, textAlign: "start" }}>
                  {[isAr ? "الرقم" : "Number", isAr ? "القالب" : "Template", isAr ? "الحالة" : "Status", isAr ? "وقت الإرسال" : "Sent at", isAr ? "التفاصيل" : "Details"].map((h) => (
                    <th key={h} style={{ padding: "10px 18px", fontWeight: 600, textAlign: "start", fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((m) => {
                  const st = MSG_STATUS[m.status] ?? MSG_STATUS.sent;
                  return (
                    <tr key={m.id} style={{ borderTop: "1px solid " + C.brdL }}>
                      <td style={{ padding: "10px 18px" }} dir="ltr">{m.phone}</td>
                      <td style={{ padding: "10px 18px" }}>
                        <div style={{ fontWeight: 600 }}>{m.templateName}</div>
                        {m.body && (
                          <div style={{ color: C.t3, fontSize: 12, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.body}>
                            {m.body}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 18px" }}>
                        <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: st.color, background: st.color + "1F" }}>
                          {isAr ? st.ar : st.en}
                        </span>
                      </td>
                      <td style={{ padding: "10px 18px", color: C.t2, whiteSpace: "nowrap" }}>{fmtDate(m.sentAt)}</td>
                      <td style={{ padding: "10px 18px", color: m.status === "failed" ? C.err : C.t3, fontSize: 12 }}>
                        {m.status === "failed"
                          ? m.error || "—"
                          : m.readAt
                            ? (isAr ? "قُرئت " : "Read ") + fmtDate(m.readAt)
                            : m.deliveredAt
                              ? (isAr ? "وصلت " : "Delivered ") + fmtDate(m.deliveredAt)
                              : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.lastPage > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, padding: 12, borderTop: "1px solid " + C.brd }}>
            <Button small outline disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{isAr ? "السابق" : "Previous"}</Button>
            <span style={{ fontSize: 12, color: C.t2 }}>{meta.currentPage} / {meta.lastPage}</span>
            <Button small outline disabled={page >= meta.lastPage} onClick={() => setPage((p) => p + 1)}>{isAr ? "التالي" : "Next"}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors: C } = useTheme();
  return (
    <div style={{ background: C.inp, borderRadius: 10, padding: "8px 14px", minWidth: 110 }}>
      <div style={{ fontSize: 11.5, color: C.t2 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}
