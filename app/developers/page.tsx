import type { Metadata } from "next";
import { FONT_FAMILY, FONT_LATIN } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { WhatsBitIcon } from "@/components/shared/whatsbit-logo";

/**
 * Public developer reference — /developers
 *
 * Deliberately outside the authenticated app: sales and support hand this
 * URL to a customer's development team before any account exists, so it
 * must render without a session, a plan, or a locale provider. Follows the
 * same standalone-page pattern as /privacy, /terms and /dpa (fixed brand
 * palette, no theme context) for exactly that reason.
 *
 * The in-app Help Center → Developers panel stays the tenant-facing copy —
 * it knows the reader's plan and can gate sections. This page is the copy
 * you can send in a WhatsApp message.
 *
 * KEEP IN STEP WITH THE ENGINE. Every endpoint, limit and error code below
 * is a promise to an integrator. When routes/api.php or the v1 request
 * classes change, this page changes with them.
 */

const API_BASE = process.env.NEXT_PUBLIC_PUBLIC_API_URL ?? "https://api.whatsbit.corbit.sa";

export const metadata: Metadata = {
  title: "واجهة كوربت البرمجية — WhatsBit API",
  description:
    "دليل الربط الكامل لواجهة WhatsBit البرمجية: إرسال الرسائل والقوالب والمستندات، رموز التحقّق، وتتبّع التسليم عبر Webhooks.",
};

// ── Brand palette (mirrors /privacy, /terms, /dpa) ──────────────
const BG = "#0B1D3A";
const CARD = "#112240";
const LINE = "#1E3350";
const CODE_BG = "#071426";
const TXT = "#E8ECF0";
const MUTED = "#B8BAC3";
const FAINT = "#8B99AD";
const GREEN = "#16A34A";
const MONO = "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace";

export default function DevelopersPage() {
  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        fontFamily: FONT_FAMILY,
        direction: "rtl",
        color: TXT,
        padding: "40px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* ── Masthead ── */}
        <header style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: GRADIENT,
              padding: "10px 18px",
              borderRadius: 12,
              letterSpacing: -0.5,
            }}
          >
            <WhatsBitIcon size={28} variant="light" />
            <span style={{ fontFamily: FONT_LATIN, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>
              <span style={{ color: "#fff" }}>Whats</span>
              <span style={{ color: "#2ECC71" }}>Bit</span>
            </span>
          </div>

          <h1 style={{ marginTop: 22, marginBottom: 10, fontSize: 28, lineHeight: 1.35 }}>
            واجهة برمجية للربط مع أنظمتك
          </h1>
          <p style={{ margin: 0, color: MUTED, fontSize: 15, lineHeight: 1.9, maxWidth: 680 }}>
            اربط نظامك — ERP أو CRM أو متجر أو بوّابة خدمات — بحساب واتساب الأعمال لديك:
            أرسل الرسائل والقوالب والمستندات، أصدر رموز تحقّق، وتتبّع حالة كلّ رسالة لحظياً.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <Pill label="العنوان الأساسي" value={API_BASE} mono />
            <Pill label="الإصدار" value="v1" />
            <Pill label="الصيغة" value="JSON · UTF-8" />
          </div>
        </header>

        {/* ── Quick nav ── */}
        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: "14px 16px",
            background: CARD,
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            marginBottom: 22,
          }}
        >
          {[
            ["#auth", "المصادقة"],
            ["#limits", "الحدود"],
            ["#envelope", "شكل الاستجابة"],
            ["#send", "إرسال رسالة"],
            ["#status", "حالة الرسالة"],
            ["#media", "رفع مستند"],
            ["#templates", "القوالب"],
            ["#lists", "الجهات والمحادثات"],
            ["#otp", "رمز التحقّق"],
            ["#webhooks", "Webhooks"],
            ["#events", "الأحداث"],
            ["#signature", "التحقّق من التوقيع"],
            ["#errors", "رموز الأخطاء"],
            ["#rules", "قواعد واتساب"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              style={{
                color: MUTED,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 8,
                border: `1px solid ${LINE}`,
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* ═══ المصادقة ═══ */}
        <Section id="auth" title="المصادقة">
          <p style={pStyle}>
            كلّ طلب يحمل مفتاح المؤسّسة في ترويسة <Code>Authorization</Code>. المفتاح يمثّل الحساب
            كاملاً — لا يرتبط بمستخدم بعينه ولا ينتهي بانتهاء جلسته.
          </p>
          <Steps
            items={[
              <>من لوحة WhatsBit افتح <b>الإعدادات ← واجهة API</b>.</>,
              <>اضغط <b>إنشاء مفتاح</b> وسمِّه باسم النظام الرابط (مثال: «ربط ERP»).</>,
              <>انسخ القيمة الكاملة فوراً — تُعرض <b>مرّة واحدة فقط</b> ثمّ تُخزَّن مشفّرة ولا يمكن استرجاعها.</>,
              <>خزّنها في متغيّرات بيئة نظامك، لا داخل الشيفرة ولا في مستودعها.</>,
            ]}
          />
          <CodeBlock label="الترويسات">{`Authorization: Bearer sk_live_corbit_xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json`}</CodeBlock>
          <p style={pStyle}>
            لو تسرّب المفتاح: <b>إعادة إنشاء</b> من نفس الصفحة تُبطل القديم فوراً وتصدر بديلاً.
          </p>
          <Note>
            <b>الباقات:</b> وصول REST API متاح من باقة <b>Starter</b> فأعلى، و Webhooks من باقة{" "}
            <b>Business</b> فأعلى.
          </Note>
        </Section>

        {/* ═══ الحدود ═══ */}
        <Section id="limits" title="الحدود والحصص">
          <Table
            head={["الحدّ", "القيمة", "عند التجاوز"]}
            rows={[
              ["معدّل لحظي", "60 طلب / دقيقة", "429 — أعد المحاولة بعد ثوانٍ"],
              ["الحصّة الشهرية — Starter", "5,000 طلب", "429 مع API_QUOTA_EXCEEDED"],
              ["الحصّة الشهرية — Business", "50,000 طلب", "العدّاد يصفّر مع أوّل الشهر"],
              ["الحصّة الشهرية — Enterprise", "بلا حدّ", "—"],
            ]}
          />
          <p style={pStyle}>
            كلّ استجابة ناجحة تحمل رصيدك الحالي في الترويسات، فلا تحتاج نقطة نهاية منفصلة لقراءته:
          </p>
          <CodeBlock>{`X-RateLimit-Limit: 50000
X-RateLimit-Remaining: 48213
X-RateLimit-Reset: 1756684800   // بداية الشهر القادم (Unix)`}</CodeBlock>
        </Section>

        {/* ═══ الاستجابة ═══ */}
        <Section id="envelope" title="شكل الاستجابة">
          <p style={pStyle}>
            كلّ استجابة — نجحت أو فشلت — تأتي بنفس الغلاف. اعتمد في منطق نظامك على{" "}
            <Code>errors.code</Code> لا على نصّ <Code>message</Code>، فالنصّ قابل للتغيير والترجمة.
          </p>
          <CodeBlock label="نجاح">{`{
  "success": true,
  "message": "Message accepted",
  "data": { /* حمولة العملية */ }
}`}</CodeBlock>
          <CodeBlock label="فشل">{`{
  "success": false,
  "message": "Template is not approved by Meta (status: pending).",
  "errors": { "code": "TEMPLATE_NOT_APPROVED" }
}`}</CodeBlock>
        </Section>

        {/* ═══ إرسال ═══ */}
        <Section id="send" title="إرسال رسالة">
          <Endpoint method="POST" path="/api/v1/messages" />
          <p style={pStyle}>
            نقطة نهاية واحدة لثلاثة أنواع يحدّدها الحقل <Code>type</Code>. الاستجابة{" "}
            <Code>202</Code> تعني أنّ WhatsBit قبل الطلب وأرسله — حالة التسليم الفعليّة تصلك عبر
            Webhook أو بالاستعلام عن حالة الرسالة.
          </p>

          <SubTitle>الحقول المشتركة</SubTitle>
          <Table
            head={["الحقل", "الإلزام", "الوصف"]}
            rows={[
              ["to", "مطلوب", "رقم بصيغة دوليّة 966501234567 — الرموز وعلامة + تُزال تلقائياً"],
              ["type", "اختياري", "text (الافتراضي) · template · document"],
            ]}
            monoFirst
          />

          <SubTitle>1) رسالة نصّية</SubTitle>
          <p style={pStyle}>
            تصل فقط إذا راسلك العميل خلال آخر 24 ساعة. الحدّ 4096 حرفاً.
          </p>
          <CodeBlock>{`curl -X POST ${API_BASE}/api/v1/messages \\
  -H "Authorization: Bearer $CORBIT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "to": "966501234567", "text": "طلبك رقم 4821 جاهز للاستلام" }'`}</CodeBlock>

          <SubTitle>2) قالب معتمد</SubTitle>
          <p style={pStyle}>
            الطريقة الوحيدة لمراسلة عميل خارج نافذة الـ 24 ساعة. عناصر <Code>parameters</Code> تملأ{" "}
            <Code>{"{{1}}"}</Code> و <Code>{"{{2}}"}</Code> بالترتيب.
          </p>
          <Table
            head={["الحقل", "الإلزام", "الوصف"]}
            rows={[
              ["template_name", "مطلوب", "اسم القالب كما اعتمدته Meta"],
              ["language", "اختياري", "ar أو en — الافتراضي لغة القالب"],
              ["parameters", "اختياري", "حتى 20 عنصراً، كلّ عنصر حتى 1024 حرفاً"],
            ]}
            monoFirst
          />
          <CodeBlock>{`{
  "to": "966501234567",
  "type": "template",
  "template_name": "order_ready",
  "language": "ar",
  "parameters": ["محمد", "4821"]
}`}</CodeBlock>

          <SubTitle>3) مستند (شهادة / فاتورة / كشف حساب)</SubTitle>
          <p style={pStyle}>
            إمّا <Code>document_id</Code> من نقطة الرفع (المُوصى به)، أو <Code>document_url</Code>{" "}
            برابط HTTPS عامّ تستضيفه أنت.
          </p>
          <Table
            head={["الحقل", "الإلزام", "الوصف"]}
            rows={[
              ["document_id", "أحدهما", "المعرّف العائد من POST /v1/media"],
              ["document_url", "أحدهما", "يبدأ بـ https:// ويكون متاحاً لخوادم Meta"],
              ["filename", "اختياري", "الاسم الذي يراه المستلم"],
              ["caption", "اختياري", "تعليق مرافق للملف"],
            ]}
            monoFirst
          />

          <CodeBlock label="استجابة 202">{`{
  "success": true,
  "data": {
    "message_id": "9f1c…",
    "conversation_id": "3ab7…",
    "whatsapp_id": "wamid.HBgMOTY2…",
    "type": "template",
    "status": "sent"
  }
}`}</CodeBlock>
          <p style={pStyle}>
            إن لم تكن جهة الاتصال موجودة، تُنشأ تلقائياً وتُفتح لها محادثة في صندوق الوارد — فيظلّ
            فريقك على اطّلاع بما يرسله النظام.
          </p>
        </Section>

        {/* ═══ حالة ═══ */}
        <Section id="status" title="حالة رسالة">
          <Endpoint method="GET" path="/api/v1/messages/{id}" />
          <p style={pStyle}>
            يقبل المعرّف <Code>message_id</Code> العائد من الإرسال، أو <Code>wamid</Code> الخاص
            بواتساب — لأنّ النظام الذي يربط حمولات الـ Webhook لا يملك غالباً إلّا الثاني.
          </p>
          <CodeBlock>{`curl "${API_BASE}/api/v1/messages/9f1c…" \\
  -H "Authorization: Bearer $CORBIT_KEY"

// 200
{ "data": { "status": "delivered", "error": null,
            "updated_at": "2026-08-13T09:14:22+03:00" } }`}</CodeBlock>
          <p style={pStyle}>
            القيم الممكنة لـ <Code>status</Code>: <Code>sent</Code> · <Code>delivered</Code> ·{" "}
            <Code>read</Code> · <Code>failed</Code>. وعند الفشل يحمل الحقل <Code>error</Code> السبب.
          </p>
          <Note>
            الاستعلام الدوري لكلّ رسالة مكلف. اشترك في حدثَي <Code>message.delivered</Code> و{" "}
            <Code>message.failed</Code> بدلاً منه.
          </Note>
        </Section>

        {/* ═══ رفع ═══ */}
        <Section id="media" title="رفع مستند">
          <Endpoint method="POST" path="/api/v1/media" />
          <p style={pStyle}>
            ارفع الملف أوّلاً ثمّ أرسله بمعرّفه. الملف يُحفظ على قرص خاص، وكلّ عمليّة إرسال تولّد
            رابطاً موقّعاً صالحاً <b>15 دقيقة</b> فقط — فلا يوجد رابط دائم لمستند شخصي.
          </p>
          <CodeBlock>{`curl -X POST ${API_BASE}/api/v1/media \\
  -H "Authorization: Bearer $CORBIT_KEY" \\
  -F "file=@certificate.pdf" \\
  -F "filename=شهادة-إتمام-2026.pdf"

// 201
{ "data": { "document_id": "7c2e…", "size_bytes": 184320,
            "retain_until": "2026-08-20T…" } }`}</CodeBlock>
          <Table
            head={["القيد", "القيمة"]}
            rows={[
              ["صيغة الطلب", "multipart/form-data"],
              ["حجم الملف الأقصى", "20 ميجابايت"],
              ["مدّة الاحتفاظ", "7 أيّام ثمّ يُمسَح تلقائياً"],
              ["صلاحيّة الرابط الموقّع", "15 دقيقة لكلّ إرسال"],
            ]}
          />
          <p style={pStyle}>
            بعد المسح يبقى سجلّ التدقيق (متى أُرسل ولمن) بينما تُحذف البايتات. أعد الرفع لإرسال نفس
            الملف بعد انقضاء المدّة.
          </p>
        </Section>

        {/* ═══ قوالب ═══ */}
        <Section id="templates" title="القوالب المعتمدة">
          <Endpoint method="GET" path="/api/v1/templates" />
          <p style={pStyle}>
            يعيد القوالب المعتمدة من Meta فقط — وهي وحدها القابلة للإرسال. الحقل{" "}
            <Code>variables</Code> يخبرك بعدد العناصر المطلوبة في <Code>parameters</Code>.
          </p>
          <CodeBlock>{`{ "data": { "data": [
  { "name": "order_ready", "category": "utility",
    "language": "ar", "header_format": null,
    "body": "مرحباً {{1}}، طلبك رقم {{2}} جاهز.", "variables": 2 }
] } }`}</CodeBlock>
        </Section>

        {/* ═══ القوائم ═══ */}
        <Section id="lists" title="جهات الاتصال والمحادثات">
          <Endpoint method="GET" path="/api/v1/contacts?page=1&limit=50" />
          <p style={pStyle}>
            قائمة مرقّمة بجهات اتصال حسابك، الأحدث أوّلاً. <Code>limit</Code> بين 1 و 200 (الافتراضي
            50).
          </p>
          <CodeBlock>{`{
  "data": {
    "data": [ { "id": "…", "name": "محمد", "phone": "966501234567" } ],
    "meta": { "current_page": 1, "last_page": 9,
              "per_page": 50, "total": 412 }
  }
}`}</CodeBlock>

          <div style={{ marginTop: 18 }}>
            <Endpoint method="GET" path="/api/v1/conversations?status=open&limit=50" />
          </div>
          <p style={pStyle}>
            مرتّبة بآخر رسالة. الفلتر <Code>status</Code> يقبل <Code>open</Code> ·{" "}
            <Code>pending</Code> · <Code>resolved</Code> · <Code>closed</Code>، وأيّ قيمة أخرى
            تُتجاهَل بدل أن تُرجِع خطأ.
          </p>
        </Section>

        {/* ═══ OTP ═══ */}
        <Section id="otp" title="رمز التحقّق (OTP)">
          <p style={pStyle}>
            WhatsBit يولّد الرمز ويرسله ويتحقّق منه نيابةً عنك. لا يظهر الرمز في أيّ استجابة ولا في
            السجلّات ولا في صندوق الوارد — يُخزَّن مشفّراً فقط، فلا يمكن لموظّف يقرأ المحادثة أن
            يراه.
          </p>

          <Endpoint method="POST" path="/api/v1/otp/send" />
          <CodeBlock>{`{
  "to": "966501234567",
  "template_name": "verification_code",
  "language": "ar",
  "has_copy_code_button": true
}

// 202
{ "data": { "otp_id": "…", "expires_in": 300, "status": "sent" } }`}</CodeBlock>
          <p style={pStyle}>
            القالب يجب أن يكون فئة <b>authentication</b> ومعتمداً من Meta، وإلّا رُفض الإرسال. واضبط{" "}
            <Code>has_copy_code_button</Code> بحسب اعتماد القالب فعلياً — عدم التطابق ترفضه Meta.
          </p>

          <div style={{ marginTop: 18 }}>
            <Endpoint method="POST" path="/api/v1/otp/verify" />
          </div>
          <CodeBlock>{`{ "to": "966501234567", "code": "481502" }

// 200
{ "data": { "verified": true,
            "verified_at": "2026-08-13T09:20:11+03:00" } }`}</CodeBlock>

          <Table
            head={["السياسة", "القيمة"]}
            rows={[
              ["طول الرمز", "6 أرقام"],
              ["مدّة الصلاحيّة", "5 دقائق"],
              ["محاولات تحقّق خاطئة لكلّ رمز", "5 ثمّ يُحرق الرمز"],
              ["المهلة بين إرسالين لنفس الرقم", "30 ثانية"],
              ["سقف الإرسال لنفس الرقم", "5 في الساعة"],
            ]}
          />
          <p style={pStyle}>
            التحقّق يتمّ <b>مرّة واحدة</b>: الرمز الناجح لا يُقبل مجدّداً. ولا تفرّق الاستجابة بين
            «رمز خاطئ» و«لا يوجد رمز» — حتى لا يستدلّ مهاجم على الأرقام التي لديها رمز نشط.
          </p>
        </Section>

        {/* ═══ Webhooks ═══ */}
        <Section id="webhooks" title="Webhooks — الاستقبال اللحظي">
          <p style={pStyle}>
            بدل الاستعلام الدوري، يرسل WhatsBit طلب <Code>POST</Code> إلى عنوانك فور وقوع الحدث.
          </p>
          <Steps
            items={[
              <>من <b>الإعدادات ← واجهة API ← الويب هوكس</b> أضف عنوان <Code>HTTPS</Code> واختر الأحداث.</>,
              <>انسخ <b>السرّ (HMAC Secret)</b> الظاهر مرّة واحدة — تحتاجه للتحقّق من كلّ طلب وارد.</>,
              <>اضغط <b>اختبار</b> للتأكّد من وصول الطلب قبل الاعتماد عليه.</>,
            ]}
          />
          <CodeBlock label="حمولة الطلب">{`POST https://your-system.com/corbit-webhook
X-Webhook-Signature: 3f8c9a…      // HMAC SHA-256 للجسم الخام
X-Webhook-Event: message.delivered
X-Webhook-Attempt: 1
User-Agent: CorbitWebhooks/1.0

{
  "event": "message.delivered",
  "timestamp": "2026-08-13T09:14:22+03:00",
  "data": {
    "message": { "id": "9f1c…", "status": "delivered",
                 "whatsapp_message_id": "wamid.HBgM…" },
    "conversation": { "id": "3ab7…", "contact_id": "a91d…" }
  },
  "organization": { "id": "…" },
  "attempt": 1
}`}</CodeBlock>
          <Note tone="warn">
            <b>أعد 2xx بسرعة.</b> المهلة 15 ثانية، وأيّ ردّ غير ناجح يعيد المحاولة <b>3 مرّات</b>{" "}
            بفواصل 30 ثانية ثمّ 5 دقائق ثمّ 15 دقيقة، ثمّ يتوقّف. استقبل الحمولة، ضعها في طابور
            معالجة لديك، وردّ فوراً.
          </Note>
          <p style={pStyle}>
            قد يصلك الحدث نفسه أكثر من مرّة عند إعادة المحاولة — اجعل المعالجة <b>idempotent</b>{" "}
            بالاعتماد على <Code>data.message.id</Code>.
          </p>
        </Section>

        {/* ═══ الأحداث ═══ */}
        <Section id="events" title="قائمة الأحداث">
          <Table
            head={["الحدث", "يقع عندما"]}
            monoFirst
            rows={[
              ["message.received", "وصلت رسالة جديدة من عميل إلى رقمك"],
              ["message.sent", "صدرت رسالة من نظامك أو البوت أو أحد الموظّفين"],
              ["message.delivered", "وصلت الرسالة إلى جهاز المستلم"],
              ["message.read", "فتح المستلم الرسالة"],
              ["message.failed", "فشل الإرسال — السبب في data.failure"],
              ["conversation.opened", "افتُتحت محادثة جديدة"],
              ["conversation.assigned", "أُسندت محادثة إلى موظّف"],
              ["conversation.closed", "أُغلقت محادثة"],
              ["contact.created", "أُضيفت جهة اتصال جديدة"],
              ["campaign.completed", "انتهت حملة من الإرسال"],
            ]}
          />
        </Section>

        {/* ═══ التوقيع ═══ */}
        <Section id="signature" title="التحقّق من التوقيع">
          <p style={pStyle}>
            احسب <Code>HMAC SHA-256</Code> على <b>الجسم الخام كما وصل</b> — قبل أيّ تحليل أو إعادة
            ترميز JSON — باستخدام سرّ الويب هوك، وقارنه بترويسة <Code>X-Webhook-Signature</Code>{" "}
            بمقارنة ثابتة الزمن. وأيّ طلب لا يطابق يُرفض.
          </p>
          <CodeBlock label="PHP">{`$raw = file_get_contents('php://input');
$expected = hash_hmac('sha256', $raw, $secret);

if (! hash_equals($expected, $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '')) {
    http_response_code(401);
    exit;
}
http_response_code(200);   // ردّ أوّلاً، ثمّ عالج في الخلفيّة`}</CodeBlock>
          <CodeBlock label="Node.js (Express)">{`const crypto = require('crypto');

app.post('/corbit-webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const expected = crypto.createHmac('sha256', SECRET)
                           .update(req.body).digest('hex');
    const got = req.get('X-Webhook-Signature') || '';

    if (expected.length !== got.length ||
        !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got))) {
      return res.sendStatus(401);
    }

    res.sendStatus(200);
    queue.push(JSON.parse(req.body));   // المعالجة بعد الردّ
  });`}</CodeBlock>
        </Section>

        {/* ═══ الأخطاء ═══ */}
        <Section id="errors" title="رموز الأخطاء">
          <Table
            head={["code", "HTTP", "المعنى", "الإجراء"]}
            monoFirst
            rows={[
              ["INVALID_API_KEY", "401", "المفتاح ناقص أو غير صالح أو مُبطَل", "راجع الترويسة أو أنشئ مفتاحاً جديداً"],
              ["API_QUOTA_EXCEEDED", "429", "انتهت الحصّة الشهريّة لباقتك", "انتظر أوّل الشهر أو رقِّ الباقة"],
              ["INVALID_PHONE", "422", "الرقم غير صالح", "أرسله بصيغة دوليّة كاملة"],
              ["UNSUPPORTED_TYPE", "422", "قيمة type غير معروفة", "استخدم text أو template أو document"],
              ["TEMPLATE_NOT_FOUND", "404", "لا قالب بهذا الاسم في حسابك", "راجع GET /v1/templates"],
              ["TEMPLATE_NOT_APPROVED", "422", "القالب لم تعتمده Meta بعد", "انتظر الاعتماد قبل الاعتماد عليه"],
              ["TEMPLATE_NOT_AUTHENTICATION", "422", "رمز التحقّق يتطلّب قالب authentication", "أنشئ قالباً بالفئة الصحيحة"],
              ["DOCUMENT_NOT_FOUND", "404", "لا مستند بهذا المعرّف", "أعد الرفع"],
              ["DOCUMENT_EXPIRED", "422", "تجاوز المستند مدّة الاحتفاظ ومُسح", "أعد الرفع ثمّ أرسل"],
              ["OTP_INVALID", "422", "الرمز خاطئ أو منتهٍ أو مستخدَم", "اطلب رمزاً جديداً بعد المهلة"],
              ["OTP_COOLDOWN", "429", "طلب إعادة إرسال قبل انتهاء المهلة", "انتظر retry_after ثانية"],
              ["OTP_RATE_LIMITED", "429", "تجاوزت سقف الساعة لهذا الرقم", "راجع منطق إعادة المحاولة لديك"],
              ["SEND_FAILED", "422", "رفض من واتساب", "اقرأ message — يحمل سبب Meta"],
            ]}
          />
        </Section>

        {/* ═══ قواعد ═══ */}
        <Section id="rules" title="قواعد واتساب التي تحكم الربط">
          <p style={pStyle}>
            هذه سياسات Meta لا قيود WhatsBit، ومخالفتها ترفعها واتساب مباشرة على رقمك:
          </p>
          <ul style={ulStyle}>
            <li>
              <b>نافذة الـ 24 ساعة:</b> الرسالة النصّية الحرّة تصل فقط إذا راسلك العميل خلال آخر 24
              ساعة. خارج النافذة استخدم قالباً معتمداً — وهذا ينطبق على الإشعارات والفواتير والشهادات
              ورموز التحقّق.
            </li>
            <li>
              <b>القوالب تُعتمد مسبقاً:</b> الاعتماد يستغرق من دقائق إلى ساعات، ولا يمكن إرسال قالب
              قيد المراجعة. جهّز قوالبك قبل موعد الإطلاق.
            </li>
            <li>
              <b>رموز التحقّق بقالب authentication:</b> إرسال رمز عبر قالب utility أو marketing
              مخالفة صريحة، ولذلك يرفضها النظام قبل أن تصل Meta.
            </li>
            <li>
              <b>جودة الرقم:</b> بلاغات الحظر من المستلمين تخفض تصنيف رقمك وقد تقلّص حدّ الإرسال
              اليومي. أرسل لمن طلب فعلاً.
            </li>
          </ul>
          <Note>
            كلّ رسالة تُرسل عبر الـ API تظهر في صندوق وارد WhatsBit داخل محادثة العميل، فيرى فريق
            خدمة العملاء السياق كاملاً قبل أن يردّ.
          </Note>
        </Section>

        <footer
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: `1px solid ${LINE}`,
            fontSize: 12.5,
            color: FAINT,
            textAlign: "center",
            lineHeight: 2,
          }}
        >
          © {new Date().getFullYear()} Corbit. جميع الحقوق محفوظة. WhatsBit هو منتج من Corbit.
          <br />
          للدعم الفنّي: <ExtLink href="mailto:support@corbit.sa">support@corbit.sa</ExtLink>
          {" · "}
          <ExtLink href="/privacy">سياسة الخصوصيّة</ExtLink>
          {" · "}
          <ExtLink href="/terms">شروط الاستخدام</ExtLink>
        </footer>
      </div>
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      style={{
        background: CARD,
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 14,
        scrollMarginTop: 16,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: 19, color: "#fff" }}>{title}</h2>
      <div style={{ color: MUTED, fontSize: 14, lineHeight: 1.9 }}>{children}</div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ margin: "22px 0 8px", fontSize: 15, color: TXT, fontWeight: 700 }}>{children}</h3>
  );
}

/** Method + path header for one endpoint. */
function Endpoint({ method, path }: { method: "GET" | "POST"; path: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "10px 12px",
        background: CODE_BG,
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        marginBottom: 12,
        direction: "ltr",
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.8,
          padding: "3px 9px",
          borderRadius: 6,
          color: "#fff",
          background: method === "GET" ? "#2563A8" : GREEN,
        }}
      >
        {method}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 13.5, color: TXT, wordBreak: "break-all" }}>
        {path}
      </span>
    </div>
  );
}

/**
 * Code samples are LTR islands inside an RTL document — without the
 * explicit direction the browser reorders punctuation and the snippet
 * becomes uncopyable nonsense.
 */
function CodeBlock({ label, children }: { label?: string; children: string }) {
  return (
    <div style={{ margin: "12px 0" }}>
      {label && (
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1,
            color: FAINT,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      )}
      <pre
        dir="ltr"
        style={{
          margin: 0,
          background: CODE_BG,
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          padding: "14px 16px",
          overflowX: "auto",
          textAlign: "left",
          fontFamily: MONO,
          fontSize: 12.5,
          lineHeight: 1.7,
          color: "#CFE3D6",
          whiteSpace: "pre",
        }}
      >
        {children}
      </pre>
    </div>
  );
}

function Table({
  head,
  rows,
  monoFirst = false,
}: {
  head: string[];
  rows: string[][];
  monoFirst?: boolean;
}) {
  return (
    <div
      style={{
        overflowX: "auto",
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        margin: "12px 0",
      }}
    >
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "start",
                  padding: "9px 14px",
                  background: "#0E1E3A",
                  borderBottom: `1px solid ${LINE}`,
                  color: FAINT,
                  fontSize: 11.5,
                  letterSpacing: 0.6,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "9px 14px",
                    borderBottom: i === rows.length - 1 ? "none" : `1px solid ${LINE}`,
                    color: j === 0 ? TXT : MUTED,
                    verticalAlign: "top",
                    fontFamily: monoFirst && j === 0 ? MONO : undefined,
                    fontSize: monoFirst && j === 0 ? 12.5 : undefined,
                    fontVariantNumeric: "tabular-nums",
                    ...(monoFirst && j === 0 ? { direction: "ltr" as const, unicodeBidi: "embed" as const } : null),
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol
      style={{
        listStyle: "none",
        margin: "12px 0",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span
            style={{
              flexShrink: 0,
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: `1px solid ${GREEN}`,
              color: GREEN,
              fontFamily: MONO,
              fontSize: 11.5,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 3,
            }}
          >
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  const accent = tone === "warn" ? "#FF8A2A" : GREEN;
  return (
    <div
      style={{
        borderInlineStart: `3px solid ${accent}`,
        background: tone === "warn" ? "rgba(255,138,42,0.08)" : "rgba(22,163,74,0.10)",
        borderRadius: "0 10px 10px 0",
        padding: "12px 14px",
        margin: "12px 0",
        fontSize: 13.5,
        lineHeight: 1.9,
        color: MUTED,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: CARD,
        border: `1px solid ${LINE}`,
        borderRadius: 10,
        padding: "7px 12px",
        fontSize: 12.5,
      }}
    >
      <span style={{ color: FAINT }}>{label}</span>
      <span
        style={{
          color: TXT,
          fontWeight: 600,
          fontFamily: mono ? MONO : undefined,
          direction: mono ? "ltr" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: MONO,
        fontSize: 12.5,
        background: CODE_BG,
        border: `1px solid ${LINE}`,
        borderRadius: 5,
        padding: "1px 5px",
        color: "#CFE3D6",
        direction: "ltr",
        unicodeBidi: "embed",
        display: "inline-block",
      }}
    >
      {children}
    </code>
  );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http") || href.startsWith("mailto");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      style={{ color: GREEN, textDecoration: "none", fontWeight: 600 }}
    >
      {children}
    </a>
  );
}

const pStyle: React.CSSProperties = { margin: "0 0 10px" };
const ulStyle: React.CSSProperties = {
  margin: 0,
  paddingRight: 22,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
