"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Button, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { usePlanUsage } from "@/lib/api/hooks";
import api from "@/lib/api/client";

/**
 * Shown on every page when the logged-in org is a sandbox. Surfaces the
 * inbound-message simulator so an operator can fire a fake customer
 * message and watch the bots / AI agents reply live in the inbox — the
 * thing that turns the sandbox from a safe staging area into a real
 * end-to-end test environment.
 */
export function SandboxBanner() {
  const { colors: C } = useTheme();
  const { isAr: ar } = useLocale();
  const { showToast } = useToast();
  const { data } = usePlanUsage();

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [phone, setPhone] = useState("+966555000001");
  const [name, setName] = useState("عميل تجريبي");
  const [text, setText] = useState("");

  // Only sandboxes get the banner.
  if (!(data as any)?.is_sandbox) return null;

  const send = async () => {
    if (!text.trim()) { showToast(ar ? "اكتب نصّ الرسالة" : "Enter a message", "error"); return; }
    if (!phone.trim()) { showToast(ar ? "اكتب رقم العميل" : "Enter a phone", "error"); return; }
    setSending(true);
    try {
      await api.post("/sandbox/simulate-inbound", { phone: phone.trim(), name: name.trim() || null, text: text.trim() });
      showToast(ar ? "تمّ الإرسال — تابع الردّ في صندوق الوارد ✓" : "Sent — watch the reply in the inbox ✓");
      setText("");
      setOpen(false);
    } catch (e: any) {
      showToast(e?.response?.data?.message || (ar ? "تعذّر إرسال الرسالة" : "Failed to send"), "error");
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`,
    background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 6, display: "block" };

  const accent = "#8b5cf6"; // sandbox purple — visually distinct from prod chrome

  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        padding: "8px 16px", background: `${accent}14`, borderBottom: `1px solid ${accent}40`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.txt }}>
          <span style={{ color: accent, display: "inline-flex" }}><Icon name="code" size={15} /></span>
          <strong>{ar ? "بيئة الاختبار" : "Sandbox"}</strong>
          <span style={{ color: C.t2 }}>
            {ar ? "— كل الإرسال محاكى، لا يصل أي عميل حقيقي." : "— all sending is simulated; no real customer is reached."}
          </span>
        </div>
        <Button small primary onClick={() => setOpen(true)}>
          {ar ? "محاكاة رسالة واردة" : "Simulate inbound message"}
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={ar ? "محاكاة رسالة عميل واردة" : "Simulate inbound customer message"}
        submitLabel={sending ? (ar ? "جاري الإرسال..." : "Sending...") : (ar ? "إرسال" : "Send")}
        submitLoading={sending}
        onSubmit={send}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 12.5, color: C.t2, margin: 0, lineHeight: 1.6 }}>
            {ar
              ? "تدخل الرسالة بنفس مسار الواتساب الحقيقي وتشغّل البوت والذكاء والتوجيه. تابع الردّ في صندوق الوارد."
              : "The message runs through the real WhatsApp pipeline — triggering bots, AI and routing. Watch the reply in the inbox."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>{ar ? "رقم العميل" : "Customer phone"}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{ar ? "اسم العميل (اختياري)" : "Customer name (optional)"}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>{ar ? "نصّ الرسالة" : "Message text"}</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={ar ? "مثال: أبغى أعرف سعر الباقة" : "e.g. I want to know the plan price"}
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>
          <Link href="/inbox" onClick={() => setOpen(false)} style={{ fontSize: 12, color: C.pri, textDecoration: "none" }}>
            {ar ? "افتح صندوق الوارد ←" : "Open inbox →"}
          </Link>
        </div>
      </Modal>
    </>
  );
}
