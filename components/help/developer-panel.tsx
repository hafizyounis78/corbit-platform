"use client";

/**
 * Developer docs panel — lives behind the "للمطوّرين" / "Developers"
 * tab in Help Center, surfaced only when the tenant's plan exposes
 * either api_enabled OR webhooks_enabled. Basic tenants don't see it
 * so they aren't distracted by integration details that don't apply.
 *
 * Hand-rolled docs (not pulled from /api/help/guides) because the
 * content is tightly coupled to the live engine — curl examples,
 * event payloads, signature verification snippets. Updating it on
 * the deploy cadence is the right granularity; CMS round-trips
 * would be overkill.
 */

import { useState } from "react";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { usePlanUsage } from "@/lib/api/hooks";

// Branded public-API host. The same backend serves the internal SPA
// (corbit-whatsapp-backend.corbit.sa) but tenants should only ever
// see and copy-paste the api.whatsbit subdomain — that's the URL we
// promise to keep stable. Env override mirrors the tester so staging
// docs can point elsewhere without a code change.
const API_BASE = process.env.NEXT_PUBLIC_PUBLIC_API_URL
  ?? "https://api.whatsbit.corbit.sa";

const EVENTS = [
  { key: "message.received",    desc_ar: "رسالة جديدة من عميل وصلت لرقمك",            desc_en: "A new inbound message from a customer" },
  { key: "message.sent",        desc_ar: "رسالة صدرت من الـ bot أو الـ agent أو الـ system", desc_en: "An outbound message left your account" },
  { key: "conversation.opened", desc_ar: "محادثة جديدة افتُتحت",                       desc_en: "A new conversation was opened" },
  { key: "conversation.assigned", desc_ar: "محادثة عُيّنت لعضو فريق",                  desc_en: "A conversation was assigned to an agent" },
  { key: "conversation.closed", desc_ar: "محادثة أُغلقت",                              desc_en: "A conversation was closed" },
  { key: "contact.created",     desc_ar: "جهة اتصال جديدة أُضيفت",                     desc_en: "A new contact was created" },
  { key: "campaign.completed",  desc_ar: "حملة انتهت من الإرسال",                      desc_en: "A campaign finished delivering" },
];

export function DeveloperPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { data: planData } = usePlanUsage();

  const apiEnabled      = (planData?.limits?.api_enabled       as boolean | undefined) ?? false;
  const webhooksEnabled = (planData?.limits?.webhooks_enabled  as boolean | undefined) ?? false;
  const makeEnabled     = (planData?.limits?.make_enabled      as boolean | undefined) ?? false;

  const [section, setSection] = useState<"intro" | "api" | "webhooks" | "events" | "security" | "make">("intro");

  const sections: Array<{ key: typeof section; label_ar: string; label_en: string; show: boolean }> = [
    { key: "intro",    label_ar: "نظرة عامّة", label_en: "Overview",   show: true },
    { key: "api",      label_ar: "REST API",   label_en: "REST API",   show: apiEnabled },
    { key: "webhooks", label_ar: "Webhooks",   label_en: "Webhooks",   show: webhooksEnabled },
    { key: "events",   label_ar: "الأحداث",    label_en: "Events",     show: webhooksEnabled },
    // Make.com is a no-code automation runner that subscribes to
    // any HTTPS endpoint as a webhook trigger — Corbit's webhook
    // engine speaks to it natively. Show the tutorial whenever
    // either Webhooks (the engine that powers it) or Make is
    // enabled on the plan; the tutorial section itself explains
    // when each path applies.
    { key: "make",     label_ar: "Make.com",   label_en: "Make.com",   show: webhooksEnabled || makeEnabled },
    { key: "security", label_ar: "التحقّق + الأمان", label_en: "Security",  show: webhooksEnabled || apiEnabled },
  ];

  const visibleSections = sections.filter((s) => s.show);

  // If the tenant has neither enabled (this panel was rendered by
  // mistake), render a soft upgrade hint instead of an empty UI.
  if (! apiEnabled && ! webhooksEnabled) {
    return (
      <Card style={{ padding: 24, textAlign: "center" }}>
        <Icon name="lock" size={28} />
        <h3 style={{ margin: "12px 0 6px", fontSize: 15, fontWeight: 700 }}>
          {isAr ? "للمطوّرين — غير متاح في باقتك" : "Developer access not in your plan"}
        </h3>
        <p style={{ fontSize: 13, color: C.t2 }}>
          {isAr
            ? "وصول API و Webhooks متاح ابتداء من باقة Starter (API) و Business (Webhooks)."
            : "API access starts on Starter, Webhooks on Business."}
        </p>
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 18 }}>
      {/* Section nav (left sidebar) */}
      <Card style={{ padding: 12, alignSelf: "flex-start", position: "sticky", top: 12 }}>
        {visibleSections.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            style={{
              display: "block", width: "100%", textAlign: isAr ? "right" : "left",
              padding: "10px 12px", borderRadius: 8, marginBottom: 4,
              border: "none",
              background: section === s.key ? `${C.pri}15` : "transparent",
              color: section === s.key ? C.pri : C.txt,
              fontWeight: section === s.key ? 700 : 500,
              fontSize: 13, cursor: "pointer",
            }}
          >
            {isAr ? s.label_ar : s.label_en}
          </button>
        ))}
      </Card>

      {/* Section content */}
      <div>
        {section === "intro"    && <IntroSection apiEnabled={apiEnabled} webhooksEnabled={webhooksEnabled} />}
        {section === "api"      && <ApiSection />}
        {section === "webhooks" && <WebhooksSection />}
        {section === "events"   && <EventsSection />}
        {section === "make"     && <MakeSection />}
        {section === "security" && <SecuritySection />}
      </div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────

function IntroSection({ apiEnabled, webhooksEnabled }: { apiEnabled: boolean; webhooksEnabled: boolean }) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700 }}>
        {isAr ? "ابدأ هنا" : "Start here"}
      </h2>
      <p style={{ fontSize: 13.5, color: C.t2, lineHeight: 1.8, margin: "0 0 14px" }}>
        {isAr ? (
          <>Corbit يعرض طريقتين للتكامل مع نظامك:</>
        ) : (
          <>Corbit exposes two integration paths:</>
        )}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FeatureCard
          icon="rocket"
          available={apiEnabled}
          title={isAr ? "REST API (Pull)" : "REST API (Pull)"}
          desc={isAr
            ? "أنت تطلب من Corbit: ابعت رسالة أو قالباً أو مستنداً، أرسل رمز تحقّق، اقرأ حالة التسليم، اجلب الجهات والمحادثات. كل request منك يبدأ."
            : "You call Corbit: send a message, template or document, issue a verification code, read delivery status, fetch contacts and conversations. Every request originates from your code."}
        />
        <FeatureCard
          icon="bell"
          available={webhooksEnabled}
          title={isAr ? "Webhooks (Push)" : "Webhooks (Push)"}
          desc={isAr
            ? "Corbit يبعتلك: لمّا يحصل حدث (رسالة جديدة، محادثة افتتحت)، نبعت POST لـ URL تحدّده."
            : "Corbit calls you: when an event fires (message received, conversation opened) we POST to a URL you supply."}
        />
      </div>

      <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: C.inp, fontSize: 12.5, color: C.t2, lineHeight: 1.7 }}>
        {isAr
          ? "اختر REST API لو نظامك مبادر (أنت تقرّر متى تتواصل). اختر Webhooks لو تريد reactions فوريّة لكلّ حدث. كثير من العملاء يستخدم الاثنين معاً."
          : "Use REST API when your system initiates (you decide when to talk). Use Webhooks when you want real-time reactions to every event. Many integrators combine both."}
      </div>
    </Card>
  );
}

function FeatureCard({ icon, available, title, desc }: { icon: string; available: boolean; title: string; desc: string }) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  return (
    <Card style={{ padding: 14, borderRight: `4px solid ${available ? C.ok : C.t3}`, opacity: available ? 1 : 0.7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon name={icon} size={18} />
        <strong style={{ fontSize: 14 }}>{title}</strong>
        <Badge color={available ? C.ok : C.t3}>
          {available
            ? (isAr ? "متاح" : "Enabled")
            : (isAr ? "غير متاح" : "Not in plan")}
        </Badge>
      </div>
      <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>{desc}</div>
    </Card>
  );
}

function ApiSection() {
  const { isAr } = useLocale();
  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>REST API</h2>
      <p style={{ fontSize: 13, color: "inherit", marginBottom: 18, lineHeight: 1.7 }}>
        {isAr
          ? "ابدأ بإنشاء مفتاح API من الإعدادات → واجهة API. كل request يحمل المفتاح في الـ Authorization header."
          : "Start by generating an API key in Settings → API. Every request carries the key in the Authorization header."}
      </p>

      <DocBlock
        title={isAr ? "المصادقة" : "Authentication"}
        code={`Authorization: Bearer sk_live_corbit_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
      />

      <Callout>
        {isAr
          ? "مهم: رسالة نصّية عاديّة تصل فقط إذا راسلك العميل خلال آخر 24 ساعة (نافذة خدمة العملاء عند Meta). لأي إشعار خدمي أو فاتورة أو شهادة أو رمز تحقّق تبدأ أنت به، استخدم قالباً معتمداً — type: template."
          : "Important: a plain text message only reaches a contact who messaged you in the last 24 hours (Meta's customer service window). For any service notification, invoice, certificate or verification code that YOU initiate, use an approved template — type: template."}
      </Callout>

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "1) رسالة نصّية" : "1) Text message"}
      </h3>
      <DocBlock
        code={`curl -X POST ${API_BASE}/api/v1/messages \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "966500000000", "text": "مرحبا من API"}'`}
      />
      <div style={{ fontSize: 12, color: "inherit", marginBottom: 14 }}>
        {isAr
          ? "الرّد: 202 Accepted + message_id + conversation_id + whatsapp_id"
          : "Response: 202 Accepted with message_id, conversation_id, whatsapp_id"}
      </div>

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "2) رسالة بقالب (خارج نافذة 24 ساعة)" : "2) Template message (outside the 24h window)"}
      </h3>
      <DocBlock
        code={`curl -X POST ${API_BASE}/api/v1/messages \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "966500000000",
    "type": "template",
    "template_name": "invoice_ready",
    "parameters": ["INV-2026-001", "1,250 SAR"]
  }'`}
      />
      <div style={{ fontSize: 12, color: "inherit", marginBottom: 14 }}>
        {isAr
          ? "parameters تملأ {{1}} و {{2}} بالترتيب. استخدم GET /v1/templates لمعرفة القوالب المعتمدة وعدد متغيّرات كلّ قالب."
          : "parameters fill {{1}}, {{2}} in order. Use GET /v1/templates to discover approved templates and how many variables each needs."}
      </div>

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "3) إرسال مستند (شهادة / فاتورة)" : "3) Send a document (certificate / invoice)"}
      </h3>
      <div style={{ fontSize: 12.5, color: "inherit", marginBottom: 10, lineHeight: 1.7 }}>
        {isAr
          ? "خطوتان: ارفع الملف، ثم أرسله بالـ document_id. الملف يُخزَّن على قرص خاص، وكل إرسال يولّد رابطاً موقّعاً صالحاً 15 دقيقة فقط — لا يوجد رابط دائم لمستند شخصي."
          : "Two steps: upload the file, then send it by document_id. The file is stored on a private disk and each send mints a signed URL valid for 15 minutes only — no permanent link to a personal record ever exists."}
      </div>
      <DocBlock
        title={isAr ? "الخطوة 1 — رفع الملف" : "Step 1 — upload"}
        code={`curl -X POST ${API_BASE}/api/v1/media \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -F "file=@certificate.pdf" \\
  -F "filename=شهادة-2026.pdf"

# 201 → { "data": { "document_id": "…", "retain_until": "…" } }`}
      />
      <DocBlock
        title={isAr ? "الخطوة 2 — الإرسال" : "Step 2 — send"}
        code={`curl -X POST ${API_BASE}/api/v1/messages \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "966500000000",
    "type": "document",
    "document_id": "THE_ID_FROM_STEP_1",
    "caption": "شهادتك جاهزة"
  }'`}
      />
      <div style={{ fontSize: 12, color: "inherit", marginBottom: 14 }}>
        {isAr
          ? "الملفّات تُحفَظ 7 أيّام ثم تُمسَح تلقائيّاً (يبقى سجلّ التدقيق). إن كنت تستضيف الملف بنفسك على رابط HTTPS عامّ، استخدم document_url بدل document_id."
          : "Files are retained for 7 days then purged automatically (the audit record is kept). If you host the file yourself at a public HTTPS URL, use document_url instead of document_id."}
      </div>

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "4) حالة التسليم" : "4) Delivery status"}
      </h3>
      <DocBlock
        code={`curl "${API_BASE}/api/v1/messages/MESSAGE_ID" \\
  -H "Authorization: Bearer YOUR_KEY"

# status: sent | delivered | read | failed`}
      />
      <div style={{ fontSize: 12, color: "inherit", marginBottom: 14 }}>
        {isAr
          ? "يقبل معرّف الرسالة عندنا أو الـ whatsapp_id — مفيد عند الربط مع أحداث الـ webhook."
          : "Accepts either our message id or the whatsapp_id — useful when correlating with webhook events."}
      </div>

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "5) القوالب المعتمدة" : "5) Approved templates"}
      </h3>
      <DocBlock
        code={`curl "${API_BASE}/api/v1/templates" \\
  -H "Authorization: Bearer YOUR_KEY"

# → name, category, language, header_format, variables`}
      />

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "6) رمز التحقّق (OTP)" : "6) One-time passcode (OTP)"}
      </h3>
      <div style={{ fontSize: 12.5, color: "inherit", marginBottom: 10, lineHeight: 1.7 }}>
        {isAr
          ? "نحن نولّد الرمز ونرسله ونتحقّق منه — أنت لا ترسل الرمز ولا تستقبله أبداً. يتطلّب قالباً معتمداً من فئة authentication."
          : "We generate, deliver and verify the code — you never send or receive it. Requires an approved authentication-category template."}
      </div>
      <DocBlock
        title={isAr ? "إرسال الرمز" : "Send the code"}
        code={`curl -X POST ${API_BASE}/api/v1/otp/send \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "966500000000", "template_name": "login_code"}'

# 202 → { "data": { "otp_id": "…", "expires_in": 300 } }`}
      />
      <DocBlock
        title={isAr ? "التحقّق من الرمز" : "Verify the code"}
        code={`curl -X POST ${API_BASE}/api/v1/otp/verify \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "966500000000", "code": "482913"}'

# 200 → { "data": { "verified": true } }`}
      />
      <div style={{ fontSize: 12, color: "inherit", marginBottom: 14 }}>
        {isAr
          ? "الرمز صالح 5 دقائق، يُستخدم مرّة واحدة، وله سقف محاولات — بعد استنفاده يُلغى الرمز حتى لو أُدخل صحيحاً. بين كل إرسالين مهلة 30 ثانية، وبحدّ أقصى 5 إرسالات للرقم في الساعة."
          : "Codes live 5 minutes, are single-use, and have an attempt cap — once spent the code is burned even if entered correctly. There is a 30-second cooldown between sends and a ceiling of 5 sends per number per hour."}
      </div>

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "7) جهات الاتصال والمحادثات" : "7) Contacts and conversations"}
      </h3>
      <DocBlock
        code={`curl "${API_BASE}/api/v1/contacts?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_KEY"

curl "${API_BASE}/api/v1/conversations?status=open&limit=50" \\
  -H "Authorization: Bearer YOUR_KEY"`}
      />

      <ErrorCodesTable />
    </Card>
  );
}

/**
 * Documented failure codes for /v1. Every error response carries the
 * same envelope — { success: false, message, errors.code } — so an
 * integrator branches on errors.code and never on the message text,
 * which is localised and may change.
 */
const ERROR_CODES: Array<{ code: string; http: string; ar: string; en: string }> = [
  { code: "INVALID_API_KEY",   http: "401", ar: "المفتاح غير صالح أو غير مُرسَل",              en: "Key missing, malformed or revoked" },
  { code: "API_QUOTA_EXCEEDED", http: "429", ar: "تجاوزت سقف الطلبات الشهري لباقتك",           en: "Monthly request quota for your plan is spent" },
  { code: "INVALID_PHONE",     http: "422", ar: "رقم الجوّال غير صالح",                        en: "Phone number is not usable" },
  { code: "UNSUPPORTED_TYPE",  http: "422", ar: "قيمة type غير معروفة",                        en: "Unknown value for type" },
  { code: "TEMPLATE_NOT_FOUND", http: "404", ar: "لا يوجد قالب بهذا الاسم في حسابك",           en: "No template by that name on your account" },
  { code: "TEMPLATE_NOT_APPROVED", http: "422", ar: "القالب لم تعتمده Meta بعد",               en: "Template is not approved by Meta yet" },
  { code: "TEMPLATE_NOT_AUTHENTICATION", http: "422", ar: "رمز التحقّق يتطلّب قالب فئة authentication", en: "OTP requires an authentication-category template" },
  { code: "DOCUMENT_NOT_FOUND", http: "404", ar: "لا يوجد مستند بهذا المعرّف في حسابك",        en: "No document by that id on your account" },
  { code: "DOCUMENT_EXPIRED",  http: "422", ar: "المستند تجاوز مدّة الاحتفاظ ومُسح",           en: "Document passed its retention window and was purged" },
  { code: "OTP_INVALID",       http: "422", ar: "الرمز خاطئ أو منتهٍ أو مستخدَم",              en: "Code is wrong, expired or already used" },
  { code: "OTP_COOLDOWN",      http: "429", ar: "طلب إعادة إرسال قبل انتهاء المهلة",           en: "Resend requested before the cooldown elapsed" },
  { code: "OTP_RATE_LIMITED",  http: "429", ar: "تجاوزت سقف الإرسال بالساعة لهذا الرقم",       en: "Hourly send ceiling for this number reached" },
  { code: "SEND_FAILED",       http: "422", ar: "رفض من واتساب — راجع message للسبب",          en: "Rejected upstream — see message for the reason" },
];

function ErrorCodesTable() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  return (
    <>
      <h3 style={{ margin: "26px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "رموز الأخطاء" : "Error codes"}
      </h3>
      <div style={{ fontSize: 12.5, color: C.t2, marginBottom: 10, lineHeight: 1.7 }}>
        {isAr
          ? "كل خطأ يعود بنفس الشكل: { success: false, message, errors.code }. اعتمد على errors.code في منطقك — نصّ message مترجَم وقد يتغيّر."
          : "Every failure returns the same shape: { success: false, message, errors.code }. Branch on errors.code — the message text is localised and may change."}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.inp }}>
              <th style={{ padding: "8px 10px", textAlign: isAr ? "right" : "left", fontWeight: 700 }}>
                {isAr ? "الرمز" : "Code"}
              </th>
              <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, width: 60 }}>HTTP</th>
              <th style={{ padding: "8px 10px", textAlign: isAr ? "right" : "left", fontWeight: 700 }}>
                {isAr ? "المعنى" : "Meaning"}
              </th>
            </tr>
          </thead>
          <tbody>
            {ERROR_CODES.map((e) => (
              <tr key={e.code} style={{ borderTop: `1px solid ${C.brd}` }}>
                <td style={{ padding: "8px 10px", fontFamily: "monospace", direction: "ltr", textAlign: "left" }}>
                  {e.code}
                </td>
                <td style={{ padding: "8px 10px", textAlign: "center", color: C.t2 }}>{e.http}</td>
                <td style={{ padding: "8px 10px", color: C.t2 }}>{isAr ? e.ar : e.en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  const { colors: C } = useTheme();
  return (
    <div style={{
      padding: 12,
      borderRadius: 10,
      background: `${C.warn}12`,
      border: `1px solid ${C.warn}40`,
      fontSize: 12.5,
      lineHeight: 1.7,
      marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function WebhooksSection() {
  const { isAr } = useLocale();
  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>Webhooks</h2>
      <p style={{ fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>
        {isAr
          ? "أضف URL مستقبِل في الإعدادات → واجهة API → الويب هوكس. عند كل حدث مشترك فيه، نرسل POST بـ JSON إلى الـ URL."
          : "Add a receiving URL in Settings → API → Webhooks. For each subscribed event, we POST a JSON body to your URL."}
      </p>

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "شكل الـ Request" : "Request shape"}
      </h3>
      <DocBlock code={`POST <your-url>
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256>
X-Webhook-Event: message.received
X-Webhook-Attempt: 1
User-Agent: CorbitWebhooks/1.0

{
  "event": "message.received",
  "timestamp": "2026-06-01T08:23:14Z",
  "data": { /* event-specific payload */ },
  "organization": { "id": "..." },
  "attempt": 1
}`} />

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "السلوك" : "Behavior"}
      </h3>
      <ul style={{ fontSize: 13, lineHeight: 1.9, paddingInlineStart: 18, margin: 0 }}>
        <li>{isAr ? "Timeout: 15 ثانية" : "Timeout: 15 seconds"}</li>
        <li>{isAr ? "المحاولات: 3 محاولات بترتيب 30 ثانية → 5 دقائق → 15 دقيقة" : "Retries: 3 attempts at 30s → 5min → 15min backoff"}</li>
        <li>{isAr ? "نجاح: أيّ كود 2xx" : "Success: any 2xx response code"}</li>
        <li>{isAr ? "كل محاولة تُسجَّل وتُعرَض في صفحة الـ logs لكل webhook" : "Each attempt is logged and visible in the per-webhook logs page"}</li>
      </ul>
    </Card>
  );
}

function EventsSection() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700 }}>
        {isAr ? "الأحداث المتاحة" : "Available events"}
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.brd}`, textAlign: isAr ? "right" : "left" }}>
            <th style={{ padding: "8px 4px", fontWeight: 700 }}>{isAr ? "الحدث" : "Event"}</th>
            <th style={{ padding: "8px 4px", fontWeight: 700 }}>{isAr ? "الوصف" : "Description"}</th>
          </tr>
        </thead>
        <tbody>
          {EVENTS.map((e) => (
            <tr key={e.key} style={{ borderBottom: `1px solid ${C.brd}` }}>
              <td style={{ padding: "10px 4px", fontFamily: "monospace", color: C.pri }}>{e.key}</td>
              <td style={{ padding: "10px 4px", color: C.t2 }}>{isAr ? e.desc_ar : e.desc_en}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function MakeSection() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
        {isAr ? "ربط Corbit مع Make.com" : "Connect Corbit to Make.com"}
      </h2>
      <p style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
        {isAr
          ? "Make.com (سابقاً Integromat) منصّة أتمتة بدون كود. لا يحتاج تكامل مخصّص — استخدم webhooks Corbit الموجودة كـ trigger داخل أيّ scenario."
          : "Make.com (formerly Integromat) is a no-code automation platform. No custom integration needed — use Corbit's existing webhooks as a trigger in any scenario."}
      </p>

      <h3 style={{ margin: "20px 0 8px", fontSize: 14.5, fontWeight: 700 }}>
        {isAr ? "الخطوات" : "Steps"}
      </h3>
      <ol style={{ paddingInlineStart: 18, fontSize: 13, lineHeight: 1.9, margin: 0 }}>
        <li>
          {isAr
            ? "في Make.com → أنشئ scenario جديد. أضف وحدة \"Webhooks → Custom webhook\" كنقطة البداية."
            : "In Make.com → create a new scenario. Add a \"Webhooks → Custom webhook\" module as the starting trigger."}
        </li>
        <li>
          {isAr
            ? "اضغط \"Add\" → \"Save\" → انسخ الـ URL الناتج (يبدأ بـ hook.eu1.make.com أو us1.make.com)."
            : "Click \"Add\" → \"Save\" → copy the resulting URL (starts with hook.eu1.make.com or us1.make.com)."}
        </li>
        <li>
          {isAr
            ? "في Corbit → الإعدادات → واجهة API → الويب هوكس → \"+ إضافة\". الصق الـ URL واختر الأحداث (مثلاً message.received)."
            : "In Corbit → Settings → API → Webhooks → \"+ Add\". Paste the URL and pick the events you want (e.g. message.received)."}
        </li>
        <li>
          {isAr
            ? "احفظ الـ HMAC secret الذي يظهر مرّة واحدة — ستحتاجه في Make للتحقّق من التوقيع."
            : "Save the one-time HMAC secret — you'll need it in Make to verify the signature."}
        </li>
        <li>
          {isAr
            ? "في Corbit → ابعت رسالة واتساب test → Make.com سيظهر الـ payload في تبويب \"Run history\". وحدة الـ webhook الآن تستلم بنية بيانات Corbit الكاملة."
            : "In Corbit → send a test WhatsApp message → Make.com will show the payload in the \"Run history\" tab. The webhook module now has Corbit's full data structure."}
        </li>
        <li>
          {isAr
            ? "أضف وحدات تالية في الـ scenario — Google Sheets / Slack / HubSpot / أيّ تطبيق من 1500+ تطبيق يدعمه Make."
            : "Chain more modules in the scenario — Google Sheets / Slack / HubSpot / any of Make's 1,500+ apps."}
        </li>
      </ol>

      <h3 style={{ margin: "24px 0 8px", fontSize: 14.5, fontWeight: 700 }}>
        {isAr ? "أمثلة سيناريوهات شائعة" : "Common scenarios"}
      </h3>
      <ul style={{ paddingInlineStart: 18, fontSize: 13, lineHeight: 1.9, margin: 0 }}>
        <li>
          <strong>{isAr ? "تنبيه Slack" : "Slack alert"}:</strong>{" "}
          {isAr
            ? "كل message.received من عميل VIP → رسالة فوريّة في قناة Slack المبيعات."
            : "Every message.received from a VIP customer → instant message to a Slack sales channel."}
        </li>
        <li>
          <strong>{isAr ? "Google Sheets log" : "Google Sheets log"}:</strong>{" "}
          {isAr
            ? "كل conversation.closed → صفّ جديد في Sheet يحوي العميل + الوكيل + المدّة + الـ tags."
            : "Every conversation.closed → new row in a Sheet with customer + agent + duration + tags."}
        </li>
        <li>
          <strong>{isAr ? "HubSpot CRM sync" : "HubSpot CRM sync"}:</strong>{" "}
          {isAr
            ? "كل contact.created → بحث في HubSpot — إنشاء contact إن لم يكن موجوداً، أو تحديث آخر تواصل."
            : "Every contact.created → search HubSpot — create the contact if missing, or update last-contacted."}
        </li>
        <li>
          <strong>{isAr ? "Notion / ClickUp ticket" : "Notion / ClickUp ticket"}:</strong>{" "}
          {isAr
            ? "كل message.received بكلمة \"شكوى\" → ticket جديد تلقائياً في نظام المهام عندك."
            : "Every message.received containing \"complaint\" → new ticket in your task system automatically."}
        </li>
      </ul>

      <div style={{
        marginTop: 20, padding: 14, borderRadius: 10,
        background: `${C.info}10`, border: `1px solid ${C.info}30`,
        fontSize: 12.5, color: C.t2, lineHeight: 1.7,
      }}>
        <strong style={{ color: C.info }}>
          {isAr ? "💡 نصيحة:" : "💡 Tip:"}
        </strong>{" "}
        {isAr
          ? "Make.com مجاني حتى 1000 عمليّة شهرياً — كافٍ لمعظم الـ scenarios. خطّة Core $9/شهر للحجم الأكبر. أحد أرخص طرق ربط Corbit مع باقي أدواتك بدون مطوّر."
          : "Make.com is free up to 1,000 operations/month — enough for most scenarios. Core plan starts at $9/mo for higher volume. Cheapest way to connect Corbit to your other tools without a developer."}
      </div>

      <h3 style={{ margin: "24px 0 8px", fontSize: 14.5, fontWeight: 700 }}>
        {isAr ? "التحقّق من توقيع HMAC في Make" : "Verify HMAC signature in Make"}
      </h3>
      <p style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.7 }}>
        {isAr
          ? "أضف وحدة \"Tools → Set variable\" بعد الـ webhook. احسب HMAC وقارنه بـ X-Webhook-Signature header. لو لا يطابق، استخدم \"Router\" + filter لـ تجاهل الـ request."
          : "After the webhook module, add a \"Tools → Set variable\" step. Compute HMAC and compare to the X-Webhook-Signature header. If they differ, use a \"Router\" + filter to discard the request."}
      </p>
      <DocBlock code={`// Make.com formula for HMAC SHA-256 verification
{{sha256(1.body; "YOUR_WEBHOOK_SECRET")}}

// Compare to:
{{1.headers.\`x-webhook-signature\`}}

// Filter (next module): pass only when equal`} />
    </Card>
  );
}

function SecuritySection() {
  const { isAr } = useLocale();
  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
        {isAr ? "التحقّق من توقيع HMAC" : "Verifying the HMAC signature"}
      </h2>
      <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>
        {isAr
          ? "كلّ POST من webhook يحمل header X-Webhook-Signature يحوي HMAC-SHA256 للـ body كاملاً، باستخدام الـ secret اللي ظهر مرّة واحدة وقت إنشاء الـ webhook. تحقّق منه قبل تنفيذ أيّ منطق."
          : "Every webhook POST carries an X-Webhook-Signature header containing the HMAC-SHA256 of the raw body, using the secret you received once at webhook creation. Verify it before acting."}
      </p>

      <h3 style={{ margin: "16px 0 6px", fontSize: 14, fontWeight: 700 }}>PHP</h3>
      <DocBlock code={`$body = file_get_contents('php://input');
$expected = hash_hmac('sha256', $body, $YOUR_SECRET);
$received = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';

if (! hash_equals($expected, $received)) {
    http_response_code(401);
    exit('invalid signature');
}

$payload = json_decode($body, true);
// safe to process now`} />

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>Node.js</h3>
      <DocBlock code={`import crypto from 'crypto';

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const expected = crypto
    .createHmac('sha256', YOUR_SECRET)
    .update(req.body)
    .digest('hex');

  const received = req.get('X-Webhook-Signature') || '';

  if (! crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
    return res.status(401).send('invalid signature');
  }

  const payload = JSON.parse(req.body);
  // safe to process now
  res.status(200).send('ok');
});`} />

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>Python</h3>
      <DocBlock code={`import hmac, hashlib
from flask import Flask, request, abort

@app.post('/webhook')
def webhook():
    body = request.get_data()
    expected = hmac.new(
        YOUR_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    received = request.headers.get('X-Webhook-Signature', '')

    if not hmac.compare_digest(expected, received):
        abort(401)

    payload = request.json
    # safe to process now
    return 'ok'`} />
    </Card>
  );
}

function DocBlock({ title, code }: { title?: string; code: string }) {
  const { colors: C } = useTheme();
  return (
    <div style={{ marginBottom: 12 }}>
      {title && (
        <div style={{ fontSize: 12, color: C.t2, marginBottom: 6, fontWeight: 600 }}>
          {title}
        </div>
      )}
      <pre style={{
        margin: 0,
        padding: 14,
        borderRadius: 10,
        background: C.inp,
        border: `1px solid ${C.brd}`,
        color: C.txt,
        fontSize: 12,
        fontFamily: "monospace",
        overflow: "auto",
        direction: "ltr",
        textAlign: "left",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>{code}</pre>
    </div>
  );
}
