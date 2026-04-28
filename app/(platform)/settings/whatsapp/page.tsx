"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { useWhatsAppStatus } from "@/lib/api/hooks";
import api from "@/lib/api/client";

type Status = {
  connected: boolean;
  phone_number?: string;
  display_phone_number?: string;
  display_name?: string;
  phone_number_id?: string;
  waba_id?: string;
  last_connected_at?: string | null;
  status?: string;
};

export default function WhatsAppOnboardingPage() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const { data: statusData, mutate } = useWhatsAppStatus();
  const status: Status = (statusData as any) || { connected: false };

  const [showForm, setShowForm] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<{ phone?: string; display_name?: string } | null>(null);

  const [form, setForm] = useState({
    api_key: "",
    phone_number_id: "",
    waba_id: "",
    phone_number: "",
  });

  const reset = () => {
    setForm({ api_key: "", phone_number_id: "", waba_id: "", phone_number: "" });
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!form.api_key || !form.phone_number_id) {
      showToast(isAr ? "أدخل الـ API Key و Phone Number ID" : "Enter API Key and Phone Number ID", "error");
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/onboarding/whatsapp/test', {
        api_key: form.api_key,
        phone_number_id: form.phone_number_id,
      });
      setTestResult(res.data?.data || {});
      showToast(isAr ? "✅ المفاتيح صالحة" : "✅ Credentials valid", "success");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message;
      showToast((isAr ? "فشل التحقّق: " : "Test failed: ") + msg, "error");
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!testResult) {
      showToast(isAr ? "اختبر المفاتيح أوّلاً" : "Test credentials first", "error");
      return;
    }
    if (!form.phone_number) {
      showToast(isAr ? "أدخل رقم الجوال" : "Enter the phone number", "error");
      return;
    }
    setConnecting(true);
    try {
      await api.post('/onboarding/whatsapp/connect', form);
      showToast(isAr ? "🎉 تمّ الربط بنجاح!" : "🎉 Connected successfully!", "success");
      setShowForm(false);
      reset();
      mutate();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message;
      showToast((isAr ? "فشل الربط: " : "Connect failed: ") + msg, "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.post('/onboarding/whatsapp/disconnect');
      showToast(isAr ? "تمّ فصل الربط" : "Disconnected", "success");
      setShowDisconnect(false);
      mutate();
    } catch (e: any) {
      showToast(isAr ? "فشل الفصل" : "Disconnect failed", "error");
    }
  };

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 };
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
    fontSize: 13, fontFamily: "monospace", outline: "none",
  };

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
          {isAr ? "ربط رقم واتساب الأعمال" : "Connect WhatsApp Business"}
        </h2>
        <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>
          {isAr
            ? "اربط رقم واتساب أعمالك بـ Corbit عبر 360dialog لتبدأ استقبال وإرسال الرسائل"
            : "Connect your WhatsApp Business number via 360dialog to start sending and receiving"}
        </p>
      </div>

      {/* Connection status banner */}
      {status.connected ? (
        <Card style={{ padding: 18, marginBottom: 18, borderRight: `4px solid #10b981` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Badge color="#10b981">{isAr ? "متصل" : "Connected"}</Badge>
                <strong style={{ fontSize: 14, color: C.txt }}>{status.display_name || status.phone_number}</strong>
              </div>
              <div style={{ fontSize: 12, color: C.t2, fontFamily: "monospace" }}>+{status.display_phone_number || status.phone_number}</div>
              {status.last_connected_at && (
                <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
                  {isAr ? "ربط منذ: " : "Connected: "}
                  {new Date(status.last_connected_at).toLocaleString(isAr ? "ar" : "en")}
                </div>
              )}
            </div>
            <Button onClick={() => setShowDisconnect(true)}>
              {isAr ? "فصل الربط" : "Disconnect"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 18, marginBottom: 18, borderRight: `4px solid #f59e0b` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Badge color="#f59e0b">{isAr ? "غير متصل" : "Not Connected"}</Badge>
          </div>
          <p style={{ fontSize: 13, color: C.t2, margin: "6px 0 12px" }}>
            {isAr
              ? "اتّبع الخطوات أدناه لربط رقمك. الربط يستغرق ~5 دقائق إذا حسابك على 360dialog جاهز."
              : "Follow the steps below to connect your number. Takes ~5 minutes if your 360dialog account is ready."}
          </p>
          <Button primary onClick={() => { reset(); setShowForm(true); }}>
            {isAr ? "ابدأ الربط" : "Start Connection"}
          </Button>
        </Card>
      )}

      {/* Step-by-step instructions */}
      <Card style={{ padding: 20, marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>
          {isAr ? "📋 خطوات الربط (مرّة واحدة)" : "📋 Connection Steps (one-time)"}
        </h3>

        <Step
          n={1}
          title={isAr ? "افتح حساب على 360dialog" : "Open a 360dialog account"}
          body={
            isAr
              ? "ادخل hub.360dialog.com وسجّل حساب جديد. اختر باقة Regular (49 USD/شهر). 360dialog هي مزوّد رسمي معتمد من Meta لـ WhatsApp Business API."
              : "Go to hub.360dialog.com and register. Choose the Regular plan (49 USD/month). 360dialog is an official Meta-approved WhatsApp BSP."
          }
          link={{ url: "https://hub.360dialog.com/auth/v2/register", label: isAr ? "افتح 360dialog" : "Open 360dialog" }}
        />
        <Step
          n={2}
          title={isAr ? "اربط رقم واتساب أعمالك" : "Connect your WhatsApp Business number"}
          body={
            isAr
              ? "في الـ Hub: اضغط Add Channel، أدخل رقم جوال خاص للأعمال (لا يكون مستخدماً في WhatsApp شخصي). اربطه مع Meta Business Manager. ستحتاج التحقّق من رقمك بكود SMS."
              : "In the Hub: click Add Channel, enter a dedicated business number (must NOT be in personal WhatsApp). Link it to your Meta Business Manager. You'll verify the number with an SMS code."
          }
        />
        <Step
          n={3}
          title={isAr ? "انتظر موافقة Meta" : "Wait for Meta approval"}
          body={
            isAr
              ? "Meta تتحقّق من نشاطك التجاري. تستغرق من ساعة لعدّة أيّام. ستحتاج صورة من السجل التجاري + ربط نطاق شركتك. ستصلك رسالة لمّا يُعتمد."
              : "Meta verifies your business. Takes hours to days. You'll need a copy of your commercial registration + linking your domain. You'll get a notification when approved."
          }
        />
        <Step
          n={4}
          title={isAr ? "احصل على المفاتيح من 360dialog Hub" : "Get the keys from 360dialog Hub"}
          body={
            isAr
              ? 'بعد الموافقة، في hub.360dialog.com:\n• اذهب إلى Channels → اختر قناتك\n• انسخ "Phone Number ID" (الرقم الطويل)\n• انسخ "WABA ID" من قسم Business Account\n• اذهب إلى API Keys → Generate API Key (اطلب جديد لو فقدت القديم)'
              : 'After approval, in hub.360dialog.com:\n• Go to Channels → select your channel\n• Copy "Phone Number ID" (long number)\n• Copy "WABA ID" from the Business Account section\n• Go to API Keys → Generate API Key (request new if lost)'
          }
        />
        <Step
          n={5}
          title={isAr ? "الصق المفاتيح هنا" : "Paste the keys here"}
          body={
            isAr
              ? 'اضغط زرّ "ابدأ الربط" أعلى الصفحة، الصق الـ 3 معلومات، اضغط "اختبار الاتّصال" للتأكّد، ثم "حفظ وتفعيل". ستبدأ تستقبل الرسائل في صندوق الوارد فوراً.'
              : 'Click "Start Connection" above, paste the 3 fields, click "Test Connection" to verify, then "Save & Activate". Messages will start arriving in your Inbox immediately.'
          }
        />
      </Card>

      {/* Common issues */}
      <Card style={{ padding: 20, marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>
          {isAr ? "❓ أخطاء شائعة" : "❓ Common Issues"}
        </h3>
        <FAQ
          q={isAr ? "رقمي مرفوض عند 360dialog" : "My number was rejected by 360dialog"}
          a={isAr ? "تأكّد إنّ الرقم غير مستخدم في WhatsApp شخصي. لو كان كذلك، احذفه من واتساب أوّلاً ثمّ أعد المحاولة." : "Make sure the number isn't in personal WhatsApp. If it is, delete it from WhatsApp first, then retry."}
        />
        <FAQ
          q={isAr ? "كم تستغرق موافقة Meta؟" : "How long does Meta approval take?"}
          a={isAr ? "عادة 1-3 ساعات للحسابات الموثّقة، وأحياناً تصل ليومين لو احتاجت Meta توثيق إضافي." : "Usually 1-3 hours for verified businesses, sometimes up to 2 days if Meta needs extra docs."}
        />
        <FAQ
          q={isAr ? "هل أدفع 360dialog مباشرة أم لكم؟" : "Do I pay 360dialog directly or you?"}
          a={isAr ? "تدفع 360dialog مباشرة (49$/شهر) لخدمة WhatsApp API. تدفع لـ Corbit اشتراك المنصّة." : "You pay 360dialog directly (49$/month) for WhatsApp API service. You pay Corbit for the platform subscription."}
        />
        <FAQ
          q={isAr ? "ماذا لو فقدت الـ API Key؟" : "What if I lose the API Key?"}
          a={isAr ? "ادخل 360dialog Hub → API Keys → Generate New API Key. ثمّ ارجع هنا، اضغط Disconnect ثمّ Connect بالـ key الجديد." : "Go to 360dialog Hub → API Keys → Generate New. Then come back, Disconnect and Connect with the new key."}
        />
      </Card>

      {/* Connection form modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); reset(); }}
        title={isAr ? "ربط 360dialog" : "Connect 360dialog"}
        submitLabel={connecting ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ وتفعيل" : "Save & Activate")}
        onSubmit={handleConnect}
        submitLoading={connecting}
        submitDisabled={!testResult || connecting}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>API Key <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="password"
              value={form.api_key}
              onChange={(e) => { setForm({ ...form, api_key: e.target.value }); setTestResult(null); }}
              placeholder="D7sAB..."
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
              {isAr ? "من 360dialog Hub → API Keys" : "From 360dialog Hub → API Keys"}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Phone Number ID <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="text"
              value={form.phone_number_id}
              onChange={(e) => { setForm({ ...form, phone_number_id: e.target.value }); setTestResult(null); }}
              placeholder="1056090950928231"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
              {isAr ? "من 360dialog Hub → Channels (الرقم الطويل)" : "From 360dialog Hub → Channels (the long ID)"}
            </div>
          </div>

          <div>
            <label style={labelStyle}>WABA ID</label>
            <input
              type="text"
              value={form.waba_id}
              onChange={(e) => setForm({ ...form, waba_id: e.target.value })}
              placeholder="2793198167707516"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
              {isAr ? "من 360dialog Hub → WhatsApp Business Account ID" : "From 360dialog Hub → WhatsApp Business Account ID"}
            </div>
          </div>

          <div>
            <label style={labelStyle}>{isAr ? "رقم الجوال" : "Phone Number"} <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type="text"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="966148213721"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
              {isAr ? "بدون + أو 00 (الرقم اللي يظهر في الـ Hub أعلى صفحة Channel)" : "Without + or 00 (the number shown at the top of the Hub Channel page)"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button onClick={handleTest} disabled={testing}>
              {testing ? (isAr ? "جاري الاختبار..." : "Testing...") : (isAr ? "اختبار الاتّصال" : "Test Connection")}
            </Button>
            {testResult && (
              <div style={{ fontSize: 12, color: "#10b981" }}>
                ✅ {testResult.display_name || testResult.phone}
              </div>
            )}
          </div>

          {testResult && (
            <div style={{ padding: 12, borderRadius: 8, background: "#10b98115", border: "1px solid #10b98140", fontSize: 12 }}>
              <div style={{ marginBottom: 4, fontWeight: 600, color: "#10b981" }}>
                {isAr ? "تمّ التحقّق:" : "Verified:"}
              </div>
              <div style={{ color: C.txt }}>
                {isAr ? "الرقم: " : "Phone: "}<strong style={{ fontFamily: "monospace" }}>+{testResult.phone}</strong>
              </div>
              {testResult.display_name && (
                <div style={{ color: C.txt }}>
                  {isAr ? "الاسم: " : "Name: "}<strong>{testResult.display_name}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={showDisconnect}
        onClose={() => setShowDisconnect(false)}
        title={isAr ? "تأكيد فصل الربط" : "Confirm Disconnect"}
        submitLabel={isAr ? "نعم، افصل" : "Yes, Disconnect"}
        onSubmit={handleDisconnect}
      >
        <p style={{ fontSize: 13, color: C.txt, lineHeight: 1.6 }}>
          {isAr
            ? "بعد الفصل ستتوقّف Corbit عن استقبال أو إرسال رسائل لهذا الرقم. سيظلّ تاريخ المحادثات محفوظاً، تقدر تربط مرّة ثانية في أيّ وقت."
            : "After disconnecting, Corbit will stop receiving and sending messages on this number. Conversation history is kept, and you can reconnect anytime."}
        </p>
      </Modal>
    </div>
  );
}

function Step({ n, title, body, link }: { n: number; title: string; body: string; link?: { url: string; label: string } }) {
  const { colors: C } = useTheme();
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.brd}` }}>
      <div style={{
        flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
        background: C.pri, color: "#fff", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 13,
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.7, whiteSpace: "pre-line" }}>{body}</div>
        {link && (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: C.pri, textDecoration: "underline" }}
          >
            {link.label} ↗
          </a>
        )}
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const { colors: C } = useTheme();
  return (
    <details style={{ marginBottom: 8, padding: "8px 0", borderBottom: `1px solid ${C.brd}` }}>
      <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.txt }}>{q}</summary>
      <div style={{ fontSize: 12.5, color: C.t2, marginTop: 6, lineHeight: 1.7, paddingInlineStart: 6 }}>{a}</div>
    </details>
  );
}
