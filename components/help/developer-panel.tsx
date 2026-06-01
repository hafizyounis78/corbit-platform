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

  const [section, setSection] = useState<"intro" | "api" | "webhooks" | "events" | "security">("intro");

  const sections: Array<{ key: typeof section; label_ar: string; label_en: string; show: boolean }> = [
    { key: "intro",    label_ar: "نظرة عامّة", label_en: "Overview",   show: true },
    { key: "api",      label_ar: "REST API",   label_en: "REST API",   show: apiEnabled },
    { key: "webhooks", label_ar: "Webhooks",   label_en: "Webhooks",   show: webhooksEnabled },
    { key: "events",   label_ar: "الأحداث",    label_en: "Events",     show: webhooksEnabled },
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
            ? "أنت تطلب من Corbit: ابعت رسالة، اجلب جهات، اقرأ المحادثات. كل request منك يبدأ."
            : "You call Corbit: send a message, fetch contacts, read conversations. Every request originates from your code."}
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

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "إرسال رسالة" : "Send a message"}
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
        {isAr ? "جلب جهات الاتصال" : "List contacts"}
      </h3>
      <DocBlock
        code={`curl "${API_BASE}/api/v1/contacts?page=1&limit=50" \\
  -H "Authorization: Bearer YOUR_KEY"`}
      />

      <h3 style={{ margin: "20px 0 6px", fontSize: 14, fontWeight: 700 }}>
        {isAr ? "جلب المحادثات" : "List conversations"}
      </h3>
      <DocBlock
        code={`curl "${API_BASE}/api/v1/conversations?status=open&limit=50" \\
  -H "Authorization: Bearer YOUR_KEY"`}
      />
    </Card>
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
