"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge } from "@/components/ui";
import { FONT_FAMILY } from "@/lib/constants/font";
import api from "@/lib/api/client";

interface SmsTestResult {
  resolved_channel: string;
  configured_driver: string;
  sms_config: { url: string; sender: string; token_present: boolean };
  send_result: { sent: boolean; channel: string; detail?: string };
}

export default function SmsWelcomePage() {
  const { colors: C } = useTheme();
  const { isAr: ar } = useLocale();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SmsTestResult | null>(null);

  useEffect(() => {
    if (!authLoading && user && !user.isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleSend = async () => {
    if (!phone.trim()) {
      showToast(ar ? "أدخل رقم جوال" : "Enter a phone number");
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await api.post("/super-admin/debug/send-test-sms", { phone: phone.trim() });
      setResult(res.data?.data || null);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "error";
      showToast(msg);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || !user) {
    return <div style={{ padding: 24, color: C.t2 }}>{ar ? "جاري التحميل..." : "Loading..."}</div>;
  }
  if (!user.isSuperAdmin) return null;

  return (
    <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY, maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.txt, margin: 0 }}>
          {ar ? "إرسال رسائل SMS ترحيبيّة" : "Welcome SMS"}
        </h1>
        <div style={{ fontSize: 12.5, color: C.t2, marginTop: 4 }}>
          {ar
            ? "اختبر بوّابة SMS قبل إنشاء مستخدم جديد — يصلك SMS تجريبيّة على الرقم المدخل"
            : "Test the SMS gateway before creating users — a test SMS will be sent to the entered number"}
        </div>
      </div>

      <Card style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
            {ar ? "رقم الجوال" : "Phone"}
          </label>
          <input
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9665xxxxxxxx"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${C.brd}`,
              background: C.inp,
              color: C.txt,
              fontSize: 13,
              fontFamily: FONT_FAMILY,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 11, color: C.t3, marginTop: 6 }}>
            {ar ? "اكتب الرقم بالصيغة الدوليّة بدون +" : "International format without +"}
          </div>
        </div>

        <Button primary onClick={handleSend} disabled={sending || !phone.trim()}>
          {sending ? (ar ? "جارٍ الإرسال..." : "Sending...") : (ar ? "إرسال رسالة تجريبيّة" : "Send Test Message")}
        </Button>

        {result ? (
          <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: C.bg, border: `1px solid ${C.brd}`, fontSize: 12.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: C.txt }}>{ar ? "النتيجة:" : "Result:"}</span>
              {result.send_result.sent ? (
                <Badge color="#34C77B">{ar ? "تم الإرسال بنجاح ✓" : "Sent ✓"}</Badge>
              ) : (
                <Badge color="#E84855">{ar ? "فشل الإرسال ✗" : "Failed ✗"}</Badge>
              )}
            </div>

            <KV label={ar ? "القناة المستخدمة" : "Channel class"} value={result.resolved_channel} C={C} />
            <KV label={ar ? "Driver من .env" : "Configured driver"} value={result.configured_driver} C={C} />
            <KV label={ar ? "اسم المرسل" : "Sender"} value={result.sms_config.sender || "—"} C={C} />
            <KV label="URL" value={result.sms_config.url} C={C} />
            <KV
              label={ar ? "Token موجود؟" : "Token present"}
              value={result.sms_config.token_present ? (ar ? "نعم" : "yes") : (ar ? "لا" : "no")}
              C={C}
            />
            {result.send_result.detail ? (
              <KV
                label={ar ? "رسالة المزوّد" : "Provider detail"}
                value={result.send_result.detail}
                C={C}
                highlight={!result.send_result.sent}
              />
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function KV({ label, value, C, highlight }: { label: string; value: string; C: any; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px dashed ${C.brd}` }}>
      <div style={{ minWidth: 160, color: C.t3, fontWeight: 600 }}>{label}:</div>
      <div style={{ flex: 1, color: highlight ? "#E84855" : C.txt, fontFamily: "ui-monospace, Menlo, monospace", wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}
