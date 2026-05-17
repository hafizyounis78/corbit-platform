"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal } from "@/components/ui";
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
  has_api_key?: boolean;
  // 'api_key_decrypt_failed' = the encrypted blob is in DB but the
  // current APP_KEY can't decrypt it (key was rotated). The customer
  // must reconnect so the api_key gets re-encrypted with the new key.
  key_error?: string | null;
  // Meta WABA health metrics — populated by the daily sync job that
  // polls 360dialog. Null on a fresh number until the first sync.
  quality_rating?: string | null;
  messaging_tier?: string | null;
  daily_send_cap?: number | null;
  used_today?: number | null;
  metrics_updated_at?: string | null;
};

const QUALITY_COLOR: Record<string, string> = {
  green:  '#10b981',
  yellow: '#f59e0b',
  red:    '#ef4444',
  unknown:'#9ca3af',
};

// Normalized tier (tier_0..tier_4) → human-readable daily cap label.
const TIER_LABEL: Record<string, { en: string; ar: string }> = {
  tier_0: { en: '250/day',     ar: '250/يوم' },
  tier_1: { en: '1,000/day',   ar: '1,000/يوم' },
  tier_2: { en: '10,000/day',  ar: '10,000/يوم' },
  tier_3: { en: '100,000/day', ar: '100,000/يوم' },
  tier_4: { en: 'Unlimited',   ar: 'غير محدود' },
};

export function WhatsAppConnect({ showHeader = true }: { showHeader?: boolean }) {
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
    <div>
      {showHeader && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
            {isAr ? "ربط رقم واتساب الأعمال" : "Connect WhatsApp Business"}
          </h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>
            {isAr
              ? "اربط رقم واتساب أعمالك بـ Corbit لتبدأ استقبال وإرسال الرسائل"
              : "Connect your WhatsApp Business number to Corbit to start sending and receiving"}
          </p>
        </div>
      )}

      {/* APP_KEY rotation banner — the encrypted blob is in DB but
          can't be decrypted with the current key, so sends will fail
          with "WhatsApp number not connected". The fix is one click:
          disconnect + reconnect. Surfaced as its own banner so the
          customer sees a clear explanation instead of generic "Not
          Connected" or a confused "Connected but nothing works". */}
      {!status.connected && status.key_error === 'api_key_decrypt_failed' && (
        <Card style={{ padding: 16, marginBottom: 14, borderRight: `4px solid #ef4444`, background: `#ef444410` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>🔐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, marginBottom: 4 }}>
                {isAr ? "مفتاح التشفير لا يطابق الربط القديم" : "Encryption key mismatch"}
              </div>
              <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.7, marginBottom: 10 }}>
                {isAr
                  ? "الربط محفوظ لكن لا يمكن قراءة مفتاح API بشكل صحيح. اضغط 'فصل الربط' ثم أعد الربط بنفس المفاتيح من 360dialog Hub — العمليّة تستغرق دقيقة."
                  : "Your connection is saved, but the API key can't be decrypted. Click Disconnect, then reconnect with the same 360dialog Hub keys — takes about a minute."}
              </div>
              <Button onClick={() => setShowDisconnect(true)}>
                {isAr ? "فصل الربط الآن" : "Disconnect Now"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {status.connected ? (
        <Card style={{ padding: 18, marginBottom: 18, borderRight: `4px solid #10b981` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <Badge color="#10b981">{isAr ? "متصل" : "Connected"}</Badge>
                {status.quality_rating && status.quality_rating !== 'unknown' && (
                  <Badge color={QUALITY_COLOR[status.quality_rating] ?? C.t2}>
                    {isAr ? "الجودة: " : "Quality: "}{status.quality_rating.toUpperCase()}
                  </Badge>
                )}
                {status.messaging_tier && TIER_LABEL[status.messaging_tier] && (
                  <Badge color="#6366f1">
                    {isAr ? "الحدّ: " : "Tier: "}
                    {isAr ? TIER_LABEL[status.messaging_tier].ar : TIER_LABEL[status.messaging_tier].en}
                  </Badge>
                )}
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

          {/* 24h messaging window usage — unique outbound recipients counted
              over the last 24h, matching Meta's tier quota model. Hidden on
              unlimited tier (cap === -1) or before metrics first sync. */}
          {typeof status.daily_send_cap === 'number' && status.daily_send_cap > 0 && (
            (() => {
              const cap = status.daily_send_cap;
              const used = status.used_today ?? 0;
              const pct = Math.min(100, Math.round((used / cap) * 100));
              const warn = pct >= 80;
              const barColor = warn ? '#ef4444' : '#10b981';
              return (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.brd}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.t2, fontWeight: 600 }}>
                      {isAr ? 'المُرسَل خلال 24 ساعة' : 'Sent in last 24h'}
                    </span>
                    <span style={{ fontSize: 12.5, color: C.txt, fontFamily: 'monospace', direction: 'ltr' }}>
                      {used.toLocaleString()} / {cap.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 8, background: C.brd, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 300ms' }} />
                  </div>
                  {status.metrics_updated_at && (
                    <div style={{ fontSize: 10.5, color: C.t2, marginTop: 6 }}>
                      {isAr ? 'آخر تحديث للجودة: ' : 'Quality updated: '}
                      {new Date(status.metrics_updated_at).toLocaleString(isAr ? 'ar' : 'en')}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </Card>
      ) : (
        <Card style={{ padding: 18, marginBottom: 18, borderRight: `4px solid #f59e0b` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Badge color="#f59e0b">{isAr ? "غير متصل" : "Not Connected"}</Badge>
          </div>
          <p style={{ fontSize: 13, color: C.t2, margin: "6px 0 12px" }}>
            {isAr
              ? "اتّبع الخطوات أدناه لربط رقمك. الربط يستغرق ~5 دقائق إذا كانت مفاتيحك جاهزة."
              : "Follow the steps below to connect your number. Takes ~5 minutes once your keys are ready."}
          </p>
          <Button primary onClick={() => { reset(); setShowForm(true); }}>
            {isAr ? "ابدأ الربط" : "Start Connection"}
          </Button>
        </Card>
      )}

      <Card style={{ padding: 20, marginBottom: 18 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>
          {isAr ? "📋 خطوات الربط (مرّة واحدة)" : "📋 Connection Steps (one-time)"}
        </h3>

        <Step n={1}
          title={isAr ? "اربط رقم واتساب أعمالك" : "Connect your WhatsApp Business number"}
          body={isAr
            ? "في الـ Hub: اضغط Add Channel، أدخل رقم جوال خاص للأعمال (لا يكون مستخدماً في WhatsApp شخصي). اربطه مع Meta Business Manager. ستحتاج التحقّق من رقمك بكود SMS."
            : "In the Hub: click Add Channel, enter a dedicated business number (must NOT be in personal WhatsApp). Link it to your Meta Business Manager. You'll verify the number with an SMS code."}
        />
        <Step n={2}
          title={isAr ? "انتظر موافقة Meta" : "Wait for Meta approval"}
          body={isAr
            ? "Meta تتحقّق من نشاطك التجاري. تستغرق من ساعة لعدّة أيّام. ستحتاج صورة من السجل التجاري + ربط نطاق شركتك. ستصلك رسالة لمّا يُعتمد."
            : "Meta verifies your business. Takes hours to days. You'll need a copy of your commercial registration + linking your domain. You'll get a notification when approved."}
        />
        <Step n={3}
          title={isAr ? "الصق المفاتيح هنا" : "Paste the keys here"}
          body={isAr
            ? 'اضغط زرّ "ابدأ الربط" أعلى الصفحة، الصق الـ 4 معلومات، اضغط "اختبار الاتّصال" للتأكّد، ثم "حفظ وتفعيل". ستبدأ تستقبل الرسائل في صندوق الوارد فوراً.'
            : 'Click "Start Connection" above, paste the 4 fields, click "Test Connection" to verify, then "Save & Activate". Messages will start arriving in your Inbox immediately.'}
        />
      </Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); reset(); }}
        title={isAr ? "ربط رقم واتساب" : "Connect WhatsApp Number"}
        submitLabel={connecting ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ وتفعيل" : "Save & Activate")}
        onSubmit={handleConnect} submitLoading={connecting} submitDisabled={!testResult || connecting}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>API Key <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="password" value={form.api_key}
              onChange={(e) => { setForm({ ...form, api_key: e.target.value }); setTestResult(null); }}
              placeholder="D7sAB..." style={inputStyle} />
            <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
              {isAr ? "من لوحة المزوّد → API Keys" : "From the provider Hub → API Keys"}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Phone Number ID <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="text" value={form.phone_number_id}
              onChange={(e) => { setForm({ ...form, phone_number_id: e.target.value }); setTestResult(null); }}
              placeholder="1056090950928231" style={inputStyle} />
            <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
              {isAr ? "من لوحة المزوّد → Channels (الرقم الطويل)" : "From the provider Hub → Channels (the long ID)"}
            </div>
          </div>
          <div>
            <label style={labelStyle}>WABA ID</label>
            <input type="text" value={form.waba_id}
              onChange={(e) => setForm({ ...form, waba_id: e.target.value })}
              placeholder="2793198167707516" style={inputStyle} />
            <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
              {isAr ? "من لوحة المزوّد → WhatsApp Business Account ID" : "From the provider Hub → WhatsApp Business Account ID"}
            </div>
          </div>
          <div>
            <label style={labelStyle}>{isAr ? "رقم الجوال" : "Phone Number"} <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="text" value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="966148213721" style={inputStyle} />
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

      <Modal open={showDisconnect} onClose={() => setShowDisconnect(false)}
        title={isAr ? "تأكيد فصل الربط" : "Confirm Disconnect"}
        submitLabel={isAr ? "نعم، افصل" : "Yes, Disconnect"} onSubmit={handleDisconnect}
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

function Step({ n, title, body }: { n: number; title: string; body: string }) {
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
      </div>
    </div>
  );
}
