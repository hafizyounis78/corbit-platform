"use client";

import { useMemo, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal, TabBar, Toggle } from "@/components/ui";
import {
  useOdooStatus,
  useOdooEvents,
  connectOdoo,
  rotateOdooUrl,
  updateOdooSettings,
  disconnectOdoo,
  type OdooEvent,
  type OdooEligibleTemplate,
} from "@/lib/api/odoo";

// Odoo brand plum, used the way the Shopify page uses Shopify green —
// so the tenant recognises the page before reading a word of it.
const ODOO_PLUM = "#714B67";

/**
 * /integrations/odoo — self-service setup for the Odoo quotation
 * webhook.
 *
 * Odoo has no OAuth for outbound webhooks, so "connecting" is not a
 * redirect: we mint a URL and the tenant pastes it into their own
 * automation rule. That inverts the usual integration page in two
 * ways, and both drive the layout below.
 *
 * First, the credential is ours to show and theirs to keep. It is
 * returned once, by connect and rotate, and never again — only its
 * hash is stored. So it appears in a modal the user must actively
 * dismiss, with a copy button, rather than in a field they can come
 * back to.
 *
 * Second, the remaining work happens in Odoo, not here. The Setup tab
 * therefore carries the full click-path instead of linking to a
 * document — a tenant who has to go find a PDF has already been let
 * down by the screen.
 */
export default function OdooIntegrationPage() {
  const { colors: C } = useTheme();
  const { isAr: ar } = useLocale();
  const { showToast } = useToast();

  const { data, isLoading, mutate } = useOdooStatus();
  const { data: eventsData, mutate: mutateEvents } = useOdooEvents();

  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState<string | null>(null);

  // The one-time URL. Held in state only long enough to show it.
  const [credential, setCredential] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [confirmRotate, setConfirmRotate] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const integration = data?.integration ?? null;
  const connected = !!data?.connected;
  const templates = data?.eligible_templates ?? [];

  // ── Form state ───────────────────────────────────────────────
  // Seeded from the server on first render and thereafter owned by the
  // user, so a background refetch never yanks a half-typed URL away.
  const [form, setForm] = useState<{
    base_url: string;
    template_name: string;
    dedupe_minutes: number;
  } | null>(null);

  const values = useMemo(
    () =>
      form ?? {
        base_url: integration?.base_url ?? "",
        template_name: integration?.template_name ?? templates[0]?.name ?? "",
        dedupe_minutes: integration?.dedupe_minutes ?? 10,
      },
    [form, integration, templates],
  );

  const set = (patch: Partial<typeof values>) => setForm({ ...values, ...patch });

  // ── Actions ──────────────────────────────────────────────────

  /**
   * Surfaces the backend's own sentence. Those messages name the
   * template and the variable count, which is exactly what the tenant
   * needs; replacing them with a generic failure would send them to
   * support for something they can fix in a minute.
   */
  const fail = (e: any) =>
    showToast(
      e?.response?.data?.message ||
        (ar ? "تعذّر إتمام العملية" : "That didn't go through"),
      "error",
    );

  const doConnect = async () => {
    setBusy("connect");
    try {
      const res = await connectOdoo({
        base_url: values.base_url.trim(),
        template_name: values.template_name,
        template_language: templates.find((t) => t.name === values.template_name)?.language || "ar",
        dedupe_minutes: values.dedupe_minutes,
      });
      setCredential(res.webhook_url);
      setCopied(false);
      setForm(null);
      await mutate();
      setTab("setup");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const doSave = async () => {
    setBusy("save");
    try {
      await updateOdooSettings({
        base_url: values.base_url.trim(),
        template_name: values.template_name,
        dedupe_minutes: values.dedupe_minutes,
      });
      setForm(null);
      await mutate();
      showToast(ar ? "تم الحفظ" : "Saved");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const doToggle = async (on: boolean) => {
    setBusy("toggle");
    try {
      await updateOdooSettings({ is_enabled: on });
      await mutate();
      showToast(
        on
          ? ar
            ? "التكامل يعمل الآن"
            : "Integration resumed"
          : ar
            ? "تمّ إيقاف التكامل مؤقّتاً"
            : "Integration paused",
      );
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const doRotate = async () => {
    setBusy("rotate");
    try {
      const res = await rotateOdooUrl();
      setCredential(res.webhook_url);
      setCopied(false);
      setConfirmRotate(false);
      await mutate();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const doDisconnect = async () => {
    setBusy("disconnect");
    try {
      await disconnectOdoo();
      setConfirmDisconnect(false);
      setForm(null);
      await mutate();
      showToast(ar ? "تمّ فصل التكامل" : "Disconnected");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const copyUrl = async () => {
    if (!credential) return;
    try {
      await navigator.clipboard.writeText(credential);
      setCopied(true);
    } catch {
      // Clipboard is blocked in some embedded browsers. The URL is on
      // screen and selectable, so this is a downgrade, not a failure.
      showToast(ar ? "انسخ الرابط يدوياً" : "Copy the link manually", "error");
    }
  };

  // ── Shared styles ────────────────────────────────────────────

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1px solid ${C.brd}`,
    background: C.inp,
    color: C.txt,
    fontSize: 13,
  } as const;

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: C.t2,
    marginBottom: 6,
  } as const;

  if (isLoading && !data) {
    return (
      <div style={{ padding: 24, color: C.t2 }}>
        {ar ? "جارٍ التحميل…" : "Loading…"}
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: `${ODOO_PLUM}1A`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          🧾
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 19, fontWeight: 700, color: C.txt, margin: 0 }}>Odoo</h1>
          <p style={{ fontSize: 12.5, color: C.t2, margin: "3px 0 0" }}>
            {ar
              ? "أرسل رابط الدفع في واتساب تلقائياً عند إرسال عرض السعر"
              : "Send the payment link on WhatsApp when a quotation goes out"}
          </p>
        </div>
        {connected && (
          <Badge color={integration?.is_enabled ? C.ok : C.warn}>
            {integration?.is_enabled
              ? ar
                ? "متّصل"
                : "Connected"
              : ar
                ? "موقوف"
                : "Paused"}
          </Badge>
        )}
      </div>

      {!connected ? (
        <ConnectPanel />
      ) : (
        <>
          <TabBar
            tabs={[
              { key: "overview", label: ar ? "الحالة" : "Overview" },
              { key: "setup", label: ar ? "خطوات الإعداد" : "Setup steps" },
              { key: "history", label: ar ? "السجلّ" : "History" },
              { key: "settings", label: ar ? "الإعدادات" : "Settings" },
            ]}
            active={tab}
            onChange={setTab}
          />
          <div style={{ marginTop: 16 }}>
            {tab === "overview" && <OverviewPanel />}
            {tab === "setup" && <SetupPanel />}
            {tab === "history" && <HistoryPanel />}
            {tab === "settings" && <SettingsPanel />}
          </div>
        </>
      )}

      {/* ── One-time credential ────────────────────────────── */}
      <Modal
        open={!!credential}
        onClose={() => setCredential(null)}
        title={ar ? "رابط الويبهوك — يظهر مرّة واحدة" : "Webhook URL — shown once"}
        wide
        submitLabel={ar ? "نسخته، أغلق" : "I've copied it, close"}
        onSubmit={() => setCredential(null)}
        submitDisabled={!copied}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: `${C.warn}14`,
            border: `1px solid ${C.warn}40`,
            color: C.txt,
            fontSize: 12.5,
            lineHeight: 1.7,
            marginBottom: 14,
          }}
        >
          {ar
            ? "لا نحتفظ بنسخة من هذا الرابط — نخزّن بصمته المشفّرة فقط. انسخه الآن والصقه في قاعدة الأتمتة داخل Odoo. إن ضاع، أنشئ رابطاً جديداً (ويتوقّف هذا فوراً)."
            : "We keep no copy of this link — only its hash. Copy it now and paste it into your Odoo automation rule. If it's lost, generate a new one (this one stops working immediately)."}
        </div>

        <div
          dir="ltr"
          style={{
            padding: 12,
            borderRadius: 8,
            background: C.inp,
            border: `1px solid ${C.brd}`,
            color: C.txt,
            fontSize: 12,
            fontFamily: "monospace",
            wordBreak: "break-all",
            userSelect: "all",
            marginBottom: 12,
          }}
        >
          {credential}
        </div>

        <Button primary onClick={copyUrl}>
          {copied
            ? ar
              ? "✓ تم النسخ"
              : "✓ Copied"
            : ar
              ? "نسخ الرابط"
              : "Copy link"}
        </Button>
      </Modal>

      {/* ── Rotate confirmation ────────────────────────────── */}
      <Modal
        open={confirmRotate}
        onClose={() => setConfirmRotate(false)}
        title={ar ? "إنشاء رابط جديد؟" : "Generate a new link?"}
        submitLabel={ar ? "نعم، أنشئ رابطاً جديداً" : "Yes, generate"}
        onSubmit={doRotate}
        submitLoading={busy === "rotate"}
      >
        <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.8, margin: 0 }}>
          {ar
            ? "الرابط الحالي سيتوقّف فوراً، وعروض الأسعار لن تُرسَل حتى تحدّث الرابط داخل Odoo. لا تفعل هذا إلا إذا تسرّب الرابط أو ضاع منك."
            : "The current link stops working immediately, and quotations will not send until you update it inside Odoo. Only do this if the link leaked or was lost."}
        </p>
      </Modal>

      {/* ── Disconnect confirmation ────────────────────────── */}
      <Modal
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        title={ar ? "فصل تكامل Odoo؟" : "Disconnect Odoo?"}
        submitLabel={ar ? "نعم، افصل" : "Yes, disconnect"}
        onSubmit={doDisconnect}
        submitLoading={busy === "disconnect"}
      >
        <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.8, margin: 0 }}>
          {ar
            ? "سيتوقّف إرسال عروض الأسعار فوراً ويُحذف الرابط. سجلّ الرسائل المُرسَلة يبقى كما هو. تحتاج إعداداً جديداً كاملاً للعودة."
            : "Quotations stop sending immediately and the link is deleted. Your delivery history is kept. Reconnecting means setting up again from scratch."}
        </p>
      </Modal>
    </div>
  );

  // ── Panels ───────────────────────────────────────────────────

  function ConnectPanel() {
    const noTemplates = templates.length === 0;

    return (
      <Card>
        <div style={{ padding: 4 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.txt, margin: "0 0 6px" }}>
            {ar ? "ابدأ الربط" : "Get connected"}
          </h2>
          <p style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.8, margin: "0 0 18px" }}>
            {ar
              ? "لا تحتاج مديولاً ولا مبرمجاً. املأ الحقول أدناه، وسنعطيك رابطاً تلصقه في قاعدة أتمتة داخل Odoo."
              : "No module, no developer. Fill this in and we'll hand you a link to paste into an Odoo automation rule."}
          </p>

          {noTemplates ? (
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: `${C.warn}14`,
                border: `1px solid ${C.warn}40`,
                fontSize: 12.5,
                color: C.txt,
                lineHeight: 1.8,
              }}
            >
              <strong>{ar ? "تحتاج قالباً أوّلاً." : "You need a template first."}</strong>
              <div style={{ marginTop: 6 }}>
                {ar
                  ? "أنشئ قالب واتساب من فئة Utility فيه أربعة متغيّرات بالترتيب: {{1}} اسم العميل، {{2}} رقم العرض، {{3}} المبلغ، {{4}} رابط الدفع — ثمّ انتظر اعتماد Meta وارجع هنا."
                  : "Create a Utility template with exactly four variables, in order: {{1}} customer, {{2}} reference, {{3}} amount, {{4}} payment link — then wait for Meta's approval and come back."}
              </div>
              <div style={{ marginTop: 12 }}>
                <Button small onClick={() => (window.location.href = "/templates")}>
                  {ar ? "الذهاب إلى القوالب" : "Go to templates"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <FormFields />
              <div style={{ marginTop: 18 }}>
                <Button
                  primary
                  disabled={busy === "connect" || !values.base_url.trim() || !values.template_name}
                  onClick={doConnect}
                >
                  {busy === "connect"
                    ? ar
                      ? "جارٍ…"
                      : "Working…"
                    : ar
                      ? "إنشاء رابط الربط"
                      : "Generate the link"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  }

  function FormFields() {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={labelStyle}>
            {ar ? "عنوان Odoo لديك" : "Your Odoo address"}
          </label>
          <input
            type="text"
            dir="ltr"
            value={values.base_url}
            onChange={(e) => set({ base_url: e.target.value })}
            placeholder="https://acme.odoo.com"
            style={{ ...inputStyle, textAlign: "left" }}
          />
          <p style={{ fontSize: 11.5, color: C.t3, margin: "6px 0 0", lineHeight: 1.6 }}>
            {ar
              ? "نستخدمه لتحويل مسار رابط الدفع الذي يرسله Odoo إلى رابط كامل يفتحه العميل."
              : "Used to turn the portal path Odoo sends into a full link your customer can open."}
          </p>
        </div>

        <div>
          <label style={labelStyle}>
            {ar ? "قالب الرسالة" : "Message template"}
          </label>
          <select
            value={values.template_name}
            onChange={(e) => set({ template_name: e.target.value })}
            style={inputStyle}
          >
            {templates.map((t: OdooEligibleTemplate) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          {templates.find((t) => t.name === values.template_name)?.body && (
            <div
              style={{
                marginTop: 8,
                padding: 10,
                borderRadius: 8,
                background: C.inp,
                border: `1px solid ${C.brd}`,
                fontSize: 12,
                color: C.t2,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
              }}
            >
              {templates.find((t) => t.name === values.template_name)?.body}
            </div>
          )}
          <p style={{ fontSize: 11.5, color: C.t3, margin: "6px 0 0", lineHeight: 1.6 }}>
            {ar
              ? "تُعرض فقط القوالب المعتمدة التي تحوي أربعة متغيّرات بالضبط."
              : "Only approved templates with exactly four variables are listed."}
          </p>
        </div>

        <div>
          <label style={labelStyle}>
            {ar ? "منع التكرار (بالدقائق)" : "Duplicate window (minutes)"}
          </label>
          <input
            type="number"
            min={0}
            max={1440}
            value={values.dedupe_minutes}
            onChange={(e) => set({ dedupe_minutes: Number(e.target.value) })}
            style={inputStyle}
          />
          <p style={{ fontSize: 11.5, color: C.t3, margin: "6px 0 0", lineHeight: 1.6 }}>
            {ar
              ? "إعادة إرسال نفس العرض بلا تغيير خلال هذه المدّة تُتجاهَل. لو تغيّر المبلغ أو الرابط تُرسَل رسالة جديدة. صفر = تعطيل."
              : "Re-sending the same unchanged quotation inside this window is ignored. A changed amount or link always sends. Zero disables it."}
          </p>
        </div>
      </div>
    );
  }

  function OverviewPanel() {
    const rows: Array<[string, string]> = [
      [
        ar ? "عنوان Odoo" : "Odoo address",
        integration?.base_url || "—",
      ],
      [
        ar ? "القالب" : "Template",
        `${integration?.template_name} (${integration?.template_language})`,
      ],
      [
        ar ? "آخر طلب وصلنا" : "Last webhook received",
        fmt(integration?.last_received_at),
      ],
      [
        ar ? "آخر رسالة أُرسلت" : "Last message sent",
        fmt(integration?.last_sent_at),
      ],
    ];

    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: 4,
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.txt }}>
                {ar ? "استقبال عروض الأسعار" : "Accept quotations"}
              </div>
              <div style={{ fontSize: 12, color: C.t2, marginTop: 3 }}>
                {ar
                  ? "أوقفه مؤقّتاً دون فقدان الرابط أو الإعدادات."
                  : "Pause without losing the link or your settings."}
              </div>
            </div>
            <Toggle
              on={!!integration?.is_enabled}
              onToggle={() => doToggle(!integration?.is_enabled)}
            />
          </div>
        </Card>

        {integration?.last_error && (
          <Card>
            <div style={{ padding: 4 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.err, marginBottom: 6 }}>
                {ar ? "آخر خطأ" : "Last error"}
              </div>
              <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.8, wordBreak: "break-word" }}>
                {integration.last_error}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div style={{ padding: 4 }}>
            {rows.map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "9px 0",
                  borderBottom: `1px solid ${C.brdL}`,
                  fontSize: 12.5,
                }}
              >
                <span style={{ color: C.t2 }}>{label}</span>
                <span style={{ color: C.txt, fontWeight: 600, textAlign: "end", wordBreak: "break-all" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function SetupPanel() {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Card>
          <div style={{ padding: 4 }}>
            <Step n={1} title={ar ? "فعّل وضع المطوّر في Odoo" : "Turn on developer mode in Odoo"}>
              {ar
                ? "الإعدادات ← أدوات المطوّر ← Activate the developer mode."
                : "Settings → Developer Tools → Activate the developer mode."}
            </Step>

            <Step
              n={2}
              title={ar ? "أضف حقل الجوّال إلى عرض السعر" : "Add a phone field to the quotation"}
            >
              {ar
                ? "عرض السعر في Odoo لا يحمل جوّال العميل — الجوّال على بطاقة العميل. أضف حقلاً مرتبطاً واحداً:"
                : "An Odoo quotation doesn't carry the customer's phone — it lives on the contact. Add one related field:"}
              <KeyValues
                rows={[
                  [ar ? "المسار" : "Where", "Settings → Technical → Models → sale.order → Fields"],
                  ["Field Name", "x_corbit_phone"],
                  ["Field Type", "Char"],
                  ["Related Field", "partner_id.mobile"],
                ]}
              />
              <Note>
                {ar
                  ? "إن كنت تحفظ الأرقام في حقل phone بدل mobile، اجعل الربط partner_id.phone. ولو عندك Odoo Studio تقدر تضيفه من هناك بدل الشاشة الفنّيّة."
                  : "If you store numbers in phone rather than mobile, relate to partner_id.phone instead. With Odoo Studio you can add it there instead of the technical screen."}
              </Note>
            </Step>

            <Step n={3} title={ar ? "أنشئ قاعدة الأتمتة" : "Create the automation rule"}>
              {ar
                ? "الإعدادات ← Technical ← Automation Rules ← New:"
                : "Settings → Technical → Automation Rules → New:"}
              <KeyValues
                rows={[
                  ["Model", "Sales Order (sale.order)"],
                  ["Trigger", "On Save"],
                  ["Trigger Fields", "Status"],
                  ["Apply on", "Status = Quotation Sent"],
                  ["Action To Do", "Send Webhook Notification"],
                  ["URL", ar ? "الرابط الذي نسخته" : "the link you copied"],
                ]}
              />
            </Step>

            <Step n={4} title={ar ? "اختر الحقول المُرسَلة" : "Pick the fields to send"}>
              {ar
                ? "في خانة Webhook Fields اختر بالضبط:"
                : "Under Webhook Fields, tick exactly these:"}
              <KeyValues
                rows={[
                  ["x_corbit_phone", ar ? "جوّال العميل — إلزامي" : "customer phone — required"],
                  ["access_url", ar ? "مسار رابط الدفع — إلزامي" : "payment link path — required"],
                  ["access_token", ar ? "توكن الوصول — إلزامي" : "portal token — required"],
                  ["name", ar ? "رقم عرض السعر" : "quotation reference"],
                  ["partner_id", ar ? "اسم العميل" : "customer name"],
                  ["amount_total", ar ? "المبلغ" : "amount"],
                  ["currency_id", ar ? "العملة" : "currency"],
                ]}
              />
              <Note>
                {ar
                  ? "لو عندك رابط دفع جاهز من بوّابة أخرى، أنشئ حقلاً باسم x_corbit_payment_url يحوي الرابط الكامل واختره بدل access_url و access_token."
                  : "If you already generate a full payment link elsewhere, create a field named x_corbit_payment_url holding it and tick that instead of access_url and access_token."}
              </Note>
            </Step>

            <Step n={5} title={ar ? "جرّب" : "Try it"} last>
              {ar
                ? "افتح عرض سعر لعميل عنده جوّال مسجّل، واضغط Send by Email. تصل رسالة الواتساب خلال ثوانٍ، وتظهر في تبويب السجلّ هنا."
                : "Open a quotation for a customer who has a mobile number, then press Send by Email. The WhatsApp message arrives within seconds and shows up in the History tab here."}
            </Step>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 8 }}>
              {ar ? "أمر مهم" : "One thing to know"}
            </div>
            <p style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.9, margin: 0 }}>
              {ar
                ? "Odoo يقطع الاتّصال بعد ثانية واحدة ولا يعيد المحاولة أبداً. لذلك نستقبل الطلب ونردّ فوراً ثمّ نرسل الرسالة. معنى ذلك أنّ نجاح القاعدة داخل Odoo لا يعني بالضرورة وصول الرسالة — تبويب السجلّ هنا هو المرجع الحقيقي."
                : "Odoo cuts the connection after one second and never retries. So we accept the call, answer immediately, and send afterwards. A green run inside Odoo therefore does not by itself mean the message arrived — the History tab here is the real record."}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  function HistoryPanel() {
    const events: OdooEvent[] = eventsData?.events ?? [];

    if (events.length === 0) {
      return (
        <Card>
          <div style={{ padding: 26, textAlign: "center", color: C.t2, fontSize: 13 }}>
            {ar
              ? "لم يصل أي طلب من Odoo بعد. أرسل عرض سعر تجريبياً."
              : "Nothing has arrived from Odoo yet. Send a test quotation."}
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <div style={{ padding: 4 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <Button small onClick={() => mutateEvents()}>
              {ar ? "تحديث" : "Refresh"}
            </Button>
          </div>

          {events.map((e) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
                padding: "11px 0",
                borderBottom: `1px solid ${C.brdL}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>
                  {e.reference || "—"}
                  <span style={{ color: C.t3, fontWeight: 400, marginInlineStart: 8 }} dir="ltr">
                    {e.phone}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: C.t3, marginTop: 3 }}>
                  {fmt(e.created_at)}
                </div>
                {e.error && (
                  <div style={{ fontSize: 11.5, color: C.err, marginTop: 5, lineHeight: 1.6 }}>
                    {e.error}
                  </div>
                )}
              </div>
              <Badge color={statusColor(e.status)}>{statusLabel(e.status)}</Badge>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function SettingsPanel() {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Card>
          <div style={{ padding: 4 }}>
            <FormFields />
            <div style={{ marginTop: 18 }}>
              <Button primary disabled={busy === "save"} onClick={doSave}>
                {busy === "save" ? (ar ? "جارٍ…" : "Saving…") : ar ? "حفظ" : "Save"}
              </Button>
            </div>
            <p style={{ fontSize: 11.5, color: C.t3, margin: "10px 0 0", lineHeight: 1.6 }}>
              {ar
                ? "تعديل هذه الإعدادات لا يغيّر رابط الويبهوك — ما لصقته في Odoo يبقى شغّالاً."
                : "Changing these does not change your webhook link — what you pasted into Odoo keeps working."}
            </p>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 6 }}>
              {ar ? "رابط الويبهوك" : "Webhook link"}
            </div>
            <p style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.8, margin: "0 0 12px" }}>
              {ar
                ? `الرابط النشط يبدأ بـ ${integration?.token_prefix}… — لا يمكننا عرضه كاملاً مرّة أخرى لأنّنا لا نخزّنه. إن ضاع منك أو تسرّب، أنشئ رابطاً جديداً.`
                : `The active link starts with ${integration?.token_prefix}… — we can't show it again because we don't store it. If it was lost or leaked, generate a new one.`}
            </p>
            <Button onClick={() => setConfirmRotate(true)}>
              {ar ? "إنشاء رابط جديد" : "Generate a new link"}
            </Button>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.err, marginBottom: 6 }}>
              {ar ? "فصل التكامل" : "Disconnect"}
            </div>
            <p style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.8, margin: "0 0 12px" }}>
              {ar
                ? "يوقف الإرسال ويحذف الرابط. لإيقاف مؤقّت فقط، استخدم المفتاح في تبويب الحالة."
                : "Stops sending and deletes the link. To pause temporarily, use the switch in Overview instead."}
            </p>
            <Button onClick={() => setConfirmDisconnect(true)}>
              {ar ? "فصل" : "Disconnect"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Small presentational helpers ─────────────────────────────

  function Step({
    n,
    title,
    children,
    last,
  }: {
    n: number;
    title: string;
    children: React.ReactNode;
    last?: boolean;
  }) {
    return (
      <div
        style={{
          display: "flex",
          gap: 12,
          paddingBottom: last ? 0 : 18,
          marginBottom: last ? 0 : 18,
          borderBottom: last ? "none" : `1px solid ${C.brdL}`,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: `${ODOO_PLUM}1A`,
            color: ODOO_PLUM,
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {n}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.txt, marginBottom: 6 }}>
            {title}
          </div>
          <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.9 }}>{children}</div>
        </div>
      </div>
    );
  }

  function KeyValues({ rows }: { rows: Array<[string, string]> }) {
    return (
      <div
        style={{
          marginTop: 10,
          borderRadius: 8,
          border: `1px solid ${C.brd}`,
          overflow: "hidden",
        }}
      >
        {rows.map(([k, v], i) => (
          <div
            key={k}
            style={{
              display: "flex",
              gap: 12,
              padding: "8px 11px",
              background: i % 2 ? "transparent" : C.inp,
              fontSize: 12,
            }}
          >
            <span
              dir="ltr"
              style={{
                fontFamily: "monospace",
                color: C.txt,
                fontWeight: 600,
                minWidth: 130,
                wordBreak: "break-all",
              }}
            >
              {k}
            </span>
            <span style={{ color: C.t2 }}>{v}</span>
          </div>
        ))}
      </div>
    );
  }

  function Note({ children }: { children: React.ReactNode }) {
    return (
      <div
        style={{
          marginTop: 10,
          padding: "9px 11px",
          borderRadius: 8,
          background: `${C.info}12`,
          borderInlineStart: `3px solid ${C.info}`,
          fontSize: 11.5,
          color: C.t2,
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
    );
  }

  function fmt(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(ar ? "ar-SA" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function statusColor(status: OdooEvent["status"]) {
    if (status === "sent") return C.ok;
    if (status === "queued") return C.info;
    if (status === "duplicate") return C.t3;
    return C.err;
  }

  function statusLabel(status: OdooEvent["status"]) {
    const map: Record<OdooEvent["status"], [string, string]> = {
      sent: ["أُرسلت", "Sent"],
      queued: ["في الطابور", "Queued"],
      failed: ["فشلت", "Failed"],
      duplicate: ["مكرّرة — تُجوهلت", "Duplicate"],
      rejected: ["مرفوضة", "Rejected"],
    };
    return ar ? map[status][0] : map[status][1];
  }
}
