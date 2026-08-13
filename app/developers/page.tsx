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
 * Written in English, unlike the rest of the product. The reader is the
 * integrator on the customer's side — often a contractor or an offshore
 * team — not the Arabic-speaking operator the app itself serves. The
 * in-app Help Center → Developers panel stays bilingual for the tenant.
 *
 * KEEP IN STEP WITH THE ENGINE. Every endpoint, limit and error code below
 * is a promise to an integrator. When routes/api.php or the v1 request
 * classes change, this page changes with them.
 */

const API_BASE = process.env.NEXT_PUBLIC_PUBLIC_API_URL ?? "https://api.whatsbit.corbit.sa";

export const metadata: Metadata = {
  title: "WhatsBit API — Developer Reference",
  description:
    "Integrate WhatsApp Business into your own systems: send messages, templates and documents, issue one-time passcodes, download inbound media, and track delivery through webhooks.",
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
        direction: "ltr",
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
            API reference
          </h1>
          <p style={{ margin: 0, color: MUTED, fontSize: 15, lineHeight: 1.9, maxWidth: 680 }}>
            Connect your own system — ERP, CRM, storefront or service portal — to your WhatsApp
            Business account: send messages, templates and documents, issue one-time passcodes,
            download what customers send you, and track the state of every message in real time.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <Pill label="Base URL" value={API_BASE} mono />
            <Pill label="Version" value="v1" />
            <Pill label="Format" value="JSON · UTF-8" />
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
            ["#auth", "Authentication"],
            ["#limits", "Limits"],
            ["#envelope", "Response shape"],
            ["#send", "Send a message"],
            ["#status", "Message status"],
            ["#media", "Upload a document"],
            ["#inbound-media", "Receive media"],
            ["#templates", "Templates"],
            ["#lists", "Contacts & conversations"],
            ["#otp", "One-time passcodes"],
            ["#webhooks", "Webhooks"],
            ["#events", "Events"],
            ["#signature", "Signature verification"],
            ["#errors", "Error codes"],
            ["#rules", "WhatsApp rules"],
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

        {/* ═══ Auth ═══ */}
        <Section id="auth" title="Authentication">
          <p style={pStyle}>
            Every request carries an organisation key in the <Code>Authorization</Code> header. The
            key represents the whole account — it is not tied to a particular user and does not
            expire when someone&apos;s session does.
          </p>
          <Steps
            items={[
              <>In the WhatsBit dashboard open <b>Settings → API</b>.</>,
              <>Click <b>Create key</b> and name it after the system connecting (e.g. &ldquo;ERP integration&rdquo;).</>,
              <>Copy the full value immediately — it is shown <b>once</b>, then stored hashed and cannot be retrieved.</>,
              <>Keep it in your environment variables, never in source code or a repository.</>,
            ]}
          />
          <CodeBlock label="Headers">{`Authorization: Bearer sk_live_corbit_xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json`}</CodeBlock>
          <p style={pStyle}>
            If a key leaks, <b>Regenerate</b> on the same page revokes the old one immediately and
            issues a replacement.
          </p>
          <Note>
            <b>Plans:</b> REST API access starts on <b>Starter</b>; Webhooks start on{" "}
            <b>Business</b>.
          </Note>
        </Section>

        {/* ═══ Limits ═══ */}
        <Section id="limits" title="Limits and quotas">
          <Table
            head={["Limit", "Value", "When exceeded"]}
            rows={[
              ["Burst rate", "60 requests / minute", "429 — retry after a few seconds"],
              ["Monthly quota — Starter", "5,000 requests", "429 with API_QUOTA_EXCEEDED"],
              ["Monthly quota — Business", "50,000 requests", "Counter resets on the 1st"],
              ["Monthly quota — Enterprise", "Unlimited", "—"],
            ]}
          />
          <p style={pStyle}>
            Every successful response carries your remaining allowance in headers, so you never need
            a separate endpoint to read it:
          </p>
          <CodeBlock>{`X-RateLimit-Limit: 50000
X-RateLimit-Remaining: 48213
X-RateLimit-Reset: 1756684800   // start of next month (Unix)`}</CodeBlock>
        </Section>

        {/* ═══ Envelope ═══ */}
        <Section id="envelope" title="Response shape">
          <p style={pStyle}>
            Every response — success or failure — uses the same envelope. Branch your logic on{" "}
            <Code>errors.code</Code>, never on the <Code>message</Code> text: the text is free to
            change and to be translated.
          </p>
          <CodeBlock label="Success">{`{
  "success": true,
  "message": "Message accepted",
  "data": { /* operation payload */ }
}`}</CodeBlock>
          <CodeBlock label="Failure">{`{
  "success": false,
  "message": "Template is not approved by Meta (status: pending).",
  "errors": { "code": "TEMPLATE_NOT_APPROVED" }
}`}</CodeBlock>
        </Section>

        {/* ═══ Send ═══ */}
        <Section id="send" title="Send a message">
          <Endpoint method="POST" path="/api/v1/messages" />
          <p style={pStyle}>
            One endpoint, three kinds of message, selected by the <Code>type</Code> field. A{" "}
            <Code>202</Code> means WhatsBit accepted the request and dispatched it — actual delivery
            arrives over a webhook, or by asking for the message status.
          </p>

          <SubTitle>Common fields</SubTitle>
          <Table
            head={["Field", "Required", "Description"]}
            rows={[
              ["to", "Yes", "International format 966501234567 — symbols and + are stripped for you"],
              ["type", "Optional", "text (default) · template · document"],
            ]}
            monoFirst
          />

          <SubTitle>1) Free-text message</SubTitle>
          <p style={pStyle}>
            Delivered only if the customer messaged you within the last 24 hours. 4,096 characters
            maximum. The body is UTF-8, so Arabic and emoji need nothing special.
          </p>
          <CodeBlock>{`curl -X POST ${API_BASE}/api/v1/messages \\
  -H "Authorization: Bearer $CORBIT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "to": "966501234567", "text": "Order 4821 is ready for pickup" }'`}</CodeBlock>

          <SubTitle>2) Approved template</SubTitle>
          <p style={pStyle}>
            The only way to reach a customer outside the 24-hour window. Entries in{" "}
            <Code>parameters</Code> fill <Code>{"{{1}}"}</Code>, <Code>{"{{2}}"}</Code> and so on, in
            order.
          </p>
          <Table
            head={["Field", "Required", "Description"]}
            rows={[
              ["template_name", "Yes", "The template name exactly as Meta approved it"],
              ["language", "Optional", "ar or en — defaults to the template's own language"],
              ["parameters", "Optional", "Up to 20 entries, each up to 1,024 characters"],
            ]}
            monoFirst
          />
          <CodeBlock>{`{
  "to": "966501234567",
  "type": "template",
  "template_name": "order_ready",
  "language": "en",
  "parameters": ["Mohammed", "4821"]
}`}</CodeBlock>

          <SubTitle>3) Document (certificate / invoice / statement)</SubTitle>
          <p style={pStyle}>
            Either a <Code>document_id</Code> from the upload endpoint (recommended), or a{" "}
            <Code>document_url</Code> you host yourself on public HTTPS.
          </p>
          <Table
            head={["Field", "Required", "Description"]}
            rows={[
              ["document_id", "Either", "The id returned by POST /v1/media"],
              ["document_url", "Either", "Starts with https:// and reachable by Meta's servers"],
              ["filename", "Optional", "The name the recipient sees"],
              ["caption", "Optional", "Text shown alongside the file"],
            ]}
            monoFirst
          />

          <CodeBlock label="202 response">{`{
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
            If the contact does not exist it is created, and a conversation opens in the shared
            inbox — so your support team sees what the system sent before they reply.
          </p>
        </Section>

        {/* ═══ Status ═══ */}
        <Section id="status" title="Message status">
          <Endpoint method="GET" path="/api/v1/messages/{id}" />
          <p style={pStyle}>
            Accepts either the <Code>message_id</Code> returned by the send, or WhatsApp&apos;s own{" "}
            <Code>wamid</Code> — a system correlating webhook payloads usually has only the latter.
          </p>
          <CodeBlock>{`curl "${API_BASE}/api/v1/messages/9f1c…" \\
  -H "Authorization: Bearer $CORBIT_KEY"

// 200
{ "data": { "status": "delivered", "error": null,
            "updated_at": "2026-08-13T09:14:22+03:00" } }`}</CodeBlock>
          <p style={pStyle}>
            Possible <Code>status</Code> values: <Code>sent</Code> · <Code>delivered</Code> ·{" "}
            <Code>read</Code> · <Code>failed</Code>. On failure the <Code>error</Code> field carries
            the reason.
          </p>
          <Note>
            Polling every message is expensive. Subscribe to <Code>message.delivered</Code> and{" "}
            <Code>message.failed</Code> instead.
          </Note>
        </Section>

        {/* ═══ Upload ═══ */}
        <Section id="media" title="Upload a document">
          <Endpoint method="POST" path="/api/v1/media" />
          <p style={pStyle}>
            Upload the file first, then send it by id. It is stored on a private disk, and each send
            mints a signed URL valid for <b>15 minutes</b> only — a personal record never sits behind
            a permanent link.
          </p>
          <CodeBlock>{`curl -X POST ${API_BASE}/api/v1/media \\
  -H "Authorization: Bearer $CORBIT_KEY" \\
  -F "file=@certificate.pdf" \\
  -F "filename=completion-certificate-2026.pdf"

// 201
{ "data": { "document_id": "7c2e…", "size_bytes": 184320,
            "retain_until": "2026-08-20T…" } }`}</CodeBlock>
          <Table
            head={["Constraint", "Value"]}
            rows={[
              ["Request format", "multipart/form-data"],
              ["Maximum file size", "20 MB"],
              ["Retention", "7 days, then purged automatically"],
              ["Signed URL lifetime", "15 minutes per send"],
            ]}
          />
          <p style={pStyle}>
            After the purge the audit record (what was sent, to whom, when) survives while the bytes
            are deleted. Re-upload to send the same file again later.
          </p>
        </Section>

        {/* ═══ Inbound media ═══ */}
        <Section id="inbound-media" title="Receive media a customer sent">
          <Endpoint method="GET" path="/api/v1/messages/{id}/media" />
          <p style={pStyle}>
            When a customer sends an <b>image, video, voice note or file</b>, WhatsApp does not push
            you the bytes — it hands out a reference that expires and is signed against our WhatsApp
            provider credentials. So WhatsBit copies every inbound attachment into its own storage
            the moment it arrives, and serves it back to you here, authenticated with nothing but
            your API key.
          </p>

          <SubTitle>How it works</SubTitle>
          <Steps
            items={[
              <>The customer sends a photo. You receive <Code>message.received</Code> immediately, with{" "}
                <Code>media.status: &quot;pending&quot;</Code> — the file is still being copied.</>,
              <>Seconds later the copy completes and you receive <Code>message.media_ready</Code>,
                carrying the mime type, the byte size and a <Code>download_url</Code>.</>,
              <>You <Code>GET</Code> that URL with your API key. It answers <Code>302</Code> to a
                signed storage link valid 15 minutes; your HTTP client follows it and streams the
                bytes.</>,
            ]}
          />
          <Note tone="warn">
            <b>Subscribe to <Code>message.media_ready</Code> — do not fetch on{" "}
            <Code>message.received</Code>.</b> The latter fires the instant the message lands, before
            the copy finishes, so fetching then returns <Code>409</Code>. The former is the event
            that means &ldquo;the file is downloadable now&rdquo;.
          </Note>

          <SubTitle>Download the bytes</SubTitle>
          <p style={pStyle}>
            Make sure your HTTP client follows redirects (<Code>curl -L</Code>, <Code>allow_redirects</Code>{" "}
            in requests, <Code>redirect: &quot;follow&quot;</Code> in fetch). The bytes stream from
            object storage directly, so a 16&nbsp;MB video never passes through our web tier.
          </p>
          <CodeBlock>{`curl -L "${API_BASE}/api/v1/messages/MESSAGE_ID/media" \\
  -H "Authorization: Bearer $CORBIT_KEY" -o photo.jpg`}</CodeBlock>

          <SubTitle>Or take the link and its metadata</SubTitle>
          <p style={pStyle}>
            Add <Code>?as=json</Code> when you would rather hand the download to another process, a
            queue worker or a storage service instead of reading the bytes yourself.
          </p>
          <CodeBlock>{`curl "${API_BASE}/api/v1/messages/MESSAGE_ID/media?as=json" \\
  -H "Authorization: Bearer $CORBIT_KEY"

// 200
{ "data": { "message_id": "9f1c…", "type": "image",
            "mime_type": "image/jpeg", "file_size": 184320,
            "filename": "9f1c….jpg",
            "download_url": "https://…",
            "expires_at": "2026-08-13T09:29:22+03:00" } }`}</CodeBlock>

          <SubTitle>A complete receiver</SubTitle>
          <CodeBlock label="Node.js (Express)">{`app.post('/corbit-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // verify the signature first — see "Signature verification"
    res.sendStatus(200);                     // reply before doing work

    const body = JSON.parse(req.body);
    if (body.event !== 'message.media_ready') return;

    const { download_url, mime_type, filename } = body.data.media;

    const file = await fetch(download_url, {
      headers: { Authorization: \`Bearer \${process.env.CORBIT_KEY}\` },
      redirect: 'follow',
    });

    await saveToDisk(filename, Buffer.from(await file.arrayBuffer()), mime_type);
  });`}</CodeBlock>

          <SubTitle>Status codes</SubTitle>
          <Table
            head={["Status", "Meaning", "What to do"]}
            rows={[
              ["302", "The file is ready", "Follow the redirect and read the bytes"],
              ["409", "Still being copied from WhatsApp", "Retry in a few seconds, or wait for message.media_ready"],
              ["422", "The copy failed and will not be retried", "Do not retry — this attachment is unavailable"],
              ["410", "The bytes were deleted from storage", "Not recoverable"],
              ["404", "No such message, or it carries no attachment", "Check the id and the message type"],
            ]}
          />

          <SubTitle>Worth knowing</SubTitle>
          <ul style={ulStyle}>
            <li>
              <b>Every call mints a fresh signed link.</b> Processing an event an hour late works
              exactly as well as processing it instantly — nothing in the payload expires.
            </li>
            <li>
              <b>This call is free of quota.</b> Receiving the message was already counted once, and
              fetching its attachment is part of receiving it — an account whose customers send
              photos does not burn twice the allowance of one whose customers send text.
            </li>
            <li>
              <b>Both id forms work.</b> Pass our <Code>message_id</Code> or the{" "}
              <Code>whatsapp_message_id</Code>, whichever your side kept.
            </li>
            <li>
              <b>Images, videos, voice notes, documents and stickers</b> all follow this same path.
            </li>
          </ul>
        </Section>

        {/* ═══ Templates ═══ */}
        <Section id="templates" title="Approved templates">
          <Endpoint method="GET" path="/api/v1/templates" />
          <p style={pStyle}>
            Returns Meta-approved templates only — nothing else can be sent. The{" "}
            <Code>variables</Code> field tells you how many entries <Code>parameters</Code> must
            carry.
          </p>
          <CodeBlock>{`{ "data": { "data": [
  { "name": "order_ready", "category": "utility",
    "language": "en", "header_format": null,
    "body": "Hi {{1}}, your order {{2}} is ready.", "variables": 2 }
] } }`}</CodeBlock>
        </Section>

        {/* ═══ Lists ═══ */}
        <Section id="lists" title="Contacts and conversations">
          <Endpoint method="GET" path="/api/v1/contacts?page=1&limit=50" />
          <p style={pStyle}>
            A paginated list of your account&apos;s contacts, newest first. <Code>limit</Code> is
            between 1 and 200 (default 50).
          </p>
          <CodeBlock>{`{
  "data": {
    "data": [ { "id": "…", "name": "Mohammed", "phone": "966501234567" } ],
    "meta": { "current_page": 1, "last_page": 9,
              "per_page": 50, "total": 412 }
  }
}`}</CodeBlock>

          <div style={{ marginTop: 18 }}>
            <Endpoint method="GET" path="/api/v1/conversations?status=open&limit=50" />
          </div>
          <p style={pStyle}>
            Ordered by last message. The <Code>status</Code> filter accepts <Code>open</Code> ·{" "}
            <Code>pending</Code> · <Code>resolved</Code> · <Code>closed</Code>; any other value is
            ignored rather than returning an error.
          </p>
        </Section>

        {/* ═══ OTP ═══ */}
        <Section id="otp" title="One-time passcodes (OTP)">
          <p style={pStyle}>
            WhatsBit generates the code, delivers it and verifies it on your behalf. The code appears
            in no response, no log and no inbox — it is stored hashed only, so an agent reading the
            conversation cannot see it.
          </p>

          <Endpoint method="POST" path="/api/v1/otp/send" />
          <CodeBlock>{`{
  "to": "966501234567",
  "template_name": "verification_code",
  "language": "en",
  "has_copy_code_button": true
}

// 202
{ "data": { "otp_id": "…", "expires_in": 300, "status": "sent" } }`}</CodeBlock>
          <p style={pStyle}>
            The template must be in the <b>authentication</b> category and approved by Meta,
            otherwise the send is rejected. Set <Code>has_copy_code_button</Code> to match how the
            template was actually approved — a mismatch is rejected by Meta.
          </p>

          <div style={{ marginTop: 18 }}>
            <Endpoint method="POST" path="/api/v1/otp/verify" />
          </div>
          <CodeBlock>{`{ "to": "966501234567", "code": "481502" }

// 200
{ "data": { "verified": true,
            "verified_at": "2026-08-13T09:20:11+03:00" } }`}</CodeBlock>

          <Table
            head={["Policy", "Value"]}
            rows={[
              ["Code length", "6 digits"],
              ["Lifetime", "5 minutes"],
              ["Wrong attempts per code", "5, then the code is burned"],
              ["Cooldown between sends to one number", "30 seconds"],
              ["Hourly ceiling per number", "5 sends"],
            ]}
          />
          <p style={pStyle}>
            Verification is <b>single-use</b>: a code that succeeded is never accepted again. And the
            response does not distinguish &ldquo;wrong code&rdquo; from &ldquo;no code at all&rdquo;,
            so an attacker cannot learn which numbers have a code in flight.
          </p>
        </Section>

        {/* ═══ Webhooks ═══ */}
        <Section id="webhooks" title="Webhooks — real-time delivery">
          <p style={pStyle}>
            Instead of polling, WhatsBit sends a <Code>POST</Code> to your endpoint the moment an
            event occurs.
          </p>
          <Steps
            items={[
              <>In <b>Settings → API → Webhooks</b> add an <Code>HTTPS</Code> URL and pick the events.</>,
              <>Copy the <b>HMAC secret</b> shown once — you need it to verify every incoming request.</>,
              <>Hit <b>Test</b> to confirm delivery before you depend on it.</>,
            ]}
          />
          <CodeBlock label="Request">{`POST https://your-system.com/corbit-webhook
X-Webhook-Signature: 3f8c9a…      // HMAC SHA-256 of the raw body
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
            <b>Answer 2xx quickly.</b> The timeout is 15 seconds, and any unsuccessful reply is
            retried <b>3 times</b> at 30 seconds, 5 minutes, then 15 minutes, after which it stops.
            Take the payload, put it on your own queue, and reply immediately.
          </Note>
          <p style={pStyle}>
            A retry means you may see the same event more than once — make handling{" "}
            <b>idempotent</b> on <Code>data.message.id</Code>.
          </p>
        </Section>

        {/* ═══ Events ═══ */}
        <Section id="events" title="Event list">
          <Table
            head={["Event", "Fires when"]}
            monoFirst
            rows={[
              ["message.received", "A customer sent a message to your number"],
              ["message.sent", "Your system, a bot or an agent sent one out"],
              ["message.delivered", "It reached the recipient's device"],
              ["message.read", "The recipient opened it"],
              ["message.failed", "The send failed — the reason is in data.failure"],
              ["message.media_ready", "An inbound attachment is downloadable — data.media.download_url"],
              ["conversation.opened", "A new conversation was opened"],
              ["conversation.assigned", "A conversation was assigned to an agent"],
              ["conversation.closed", "A conversation was closed"],
              ["contact.created", "A new contact was created"],
              ["campaign.completed", "A campaign finished sending"],
            ]}
          />
          <p style={pStyle}>
            An inbound message with an attachment produces two events:{" "}
            <Code>message.received</Code> straight away, carrying{" "}
            <Code>media.status: &quot;pending&quot;</Code>, then <Code>message.media_ready</Code>{" "}
            once the file is downloadable. No payload ever contains a direct link to the bytes — it
            carries the endpoint that mints a signed link on demand, so nothing expires while the
            payload waits in your processing queue.
          </p>
          <CodeBlock label="message.media_ready payload">{`{
  "event": "message.media_ready",
  "timestamp": "2026-08-13T09:14:31+03:00",
  "data": {
    "message": { "id": "9f1c…", "conversation_id": "3ab7…",
                 "message_type": "image",
                 "whatsapp_message_id": "wamid.HBgM…" },
    "conversation": { "id": "3ab7…", "contact_id": "a91d…" },
    "media": { "type": "image", "mime_type": "image/jpeg",
               "file_size": 184320, "status": "ready",
               "download_url": "${API_BASE}/api/v1/messages/9f1c…/media" }
  },
  "organization": { "id": "…" },
  "attempt": 1
}`}</CodeBlock>
        </Section>

        {/* ═══ Signature ═══ */}
        <Section id="signature" title="Signature verification">
          <p style={pStyle}>
            Compute <Code>HMAC SHA-256</Code> over the <b>raw body exactly as received</b> — before
            any parsing or JSON re-encoding — using the webhook secret, and compare it against the{" "}
            <Code>X-Webhook-Signature</Code> header in constant time. Reject anything that does not
            match.
          </p>
          <CodeBlock label="PHP">{`$raw = file_get_contents('php://input');
$expected = hash_hmac('sha256', $raw, $secret);

if (! hash_equals($expected, $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '')) {
    http_response_code(401);
    exit;
}
http_response_code(200);   // reply first, process afterwards`}</CodeBlock>
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
    queue.push(JSON.parse(req.body));   // process after replying
  });`}</CodeBlock>
        </Section>

        {/* ═══ Errors ═══ */}
        <Section id="errors" title="Error codes">
          <Table
            head={["code", "HTTP", "Meaning", "What to do"]}
            monoFirst
            rows={[
              ["INVALID_API_KEY", "401", "Key missing, invalid or revoked", "Check the header, or issue a new key"],
              ["API_QUOTA_EXCEEDED", "429", "Monthly plan quota is spent", "Wait for the 1st, or upgrade the plan"],
              ["INVALID_PHONE", "422", "The number is not valid", "Send it in full international format"],
              ["UNSUPPORTED_TYPE", "422", "Unknown type value", "Use text, template or document"],
              ["TEMPLATE_NOT_FOUND", "404", "No template by that name on the account", "Check GET /v1/templates"],
              ["TEMPLATE_NOT_APPROVED", "422", "Meta has not approved it yet", "Wait for approval before relying on it"],
              ["TEMPLATE_NOT_AUTHENTICATION", "422", "OTP requires an authentication template", "Create one in the right category"],
              ["DOCUMENT_NOT_FOUND", "404", "No document with that id", "Upload it again"],
              ["MESSAGE_HAS_NO_MEDIA", "404", "The message is text — no attachment", "Check message_type before asking"],
              ["MEDIA_NOT_READY", "409", "Still copying the attachment from WhatsApp", "Wait for message.media_ready, or retry shortly"],
              ["MEDIA_UNAVAILABLE", "422", "The attachment could not be retrieved at all", "Do not retry"],
              ["MEDIA_DELETED", "410", "The stored bytes were deleted", "Not recoverable"],
              ["DOCUMENT_EXPIRED", "422", "Past its retention window and purged", "Re-upload, then send"],
              ["OTP_INVALID", "422", "Code wrong, expired or already used", "Request a new one after the cooldown"],
              ["OTP_COOLDOWN", "429", "Resend requested before the cooldown ended", "Wait retry_after seconds"],
              ["OTP_RATE_LIMITED", "429", "Hourly ceiling for this number reached", "Review your retry logic"],
              ["SEND_FAILED", "422", "Rejected by WhatsApp", "Read message — it carries Meta's reason"],
            ]}
          />
        </Section>

        {/* ═══ Rules ═══ */}
        <Section id="rules" title="WhatsApp rules that shape any integration">
          <p style={pStyle}>
            These are Meta policies, not WhatsBit restrictions, and WhatsApp enforces them directly
            against your number:
          </p>
          <ul style={ulStyle}>
            <li>
              <b>The 24-hour window:</b> a free-text message is delivered only if the customer
              messaged you within the last 24 hours. Outside it, use an approved template — that
              covers notifications, invoices, certificates and passcodes alike.
            </li>
            <li>
              <b>Templates are approved in advance:</b> approval takes minutes to hours, and a
              template under review cannot be sent. Prepare yours before launch day.
            </li>
            <li>
              <b>Passcodes need an authentication template:</b> sending a code through a utility or
              marketing template is an explicit violation, so the platform rejects it before it ever
              reaches Meta.
            </li>
            <li>
              <b>Number quality:</b> block reports from recipients lower your number&apos;s rating
              and can shrink your daily sending limit. Message people who actually asked.
            </li>
          </ul>
          <Note>
            Every message sent through the API also appears in the WhatsBit inbox inside the
            customer&apos;s conversation, so your support team sees the full context before replying.
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
          © {new Date().getFullYear()} Corbit. All rights reserved. WhatsBit is a Corbit product.
          <br />
          Support: <ExtLink href="mailto:support@corbit.sa">support@corbit.sa</ExtLink>
          {" · "}
          <ExtLink href="/privacy">Privacy Policy</ExtLink>
          {" · "}
          <ExtLink href="/terms">Terms of Use</ExtLink>
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
 * Snippets keep an explicit dir="ltr" even on an LTR page: a sample may
 * still contain an Arabic string, and without it the browser reorders the
 * surrounding punctuation and the snippet becomes uncopyable.
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
  // Logical, not physical: the page reads LTR now, and paddingRight put
  // the bullet indent on the wrong side of the list.
  paddingInlineStart: 22,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};
