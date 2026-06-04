"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import {
  useZidStatus,
  useZidWebhookEvents,
  useZidOrders,
  startZidConnect,
  disconnectZid,
  triggerZidSync,
} from "@/lib/api/zid";
import api from "@/lib/api/client";

/**
 * /integrations/zid — the Zid integration management page.
 *
 * Three states:
 *   1. Feature disabled at platform level → static info card
 *   2. Not connected → "Connect your store" CTA that fires OAuth
 *   3. Connected → status panel + tabs for settings, conversions, etc.
 *
 * The OAuth callback lands on /integrations/zid?zid_status=connected
 * (or =error / =declined) — we read those params on mount and surface
 * a toast.
 *
 * Mirrors /integrations/salla structure deliberately so operators
 * familiar with one can navigate the other. The one intentional
 * divergence: disconnect uses a themed Modal instead of window.confirm
 * (Salla still uses confirm() — a tech-debt item flagged for cleanup).
 */
export default function ZidIntegrationPage() {
  return (
    <Suspense fallback={null}>
      <ZidIntegrationInner />
    </Suspense>
  );
}

function ZidIntegrationInner() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const ar = isAr;
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Poll every 15s while connecting so the user sees status flip from
  // 'connecting' to 'active' once the OAuth callback completes.
  const { data, isLoading, mutate } = useZidStatus(15000);

  // ── OAuth callback toast ─────────────────────────────────────
  useEffect(() => {
    const status = searchParams.get("zid_status");
    if (!status) return;

    if (status === "connected") {
      showToast(ar ? "تمّ ربط متجر زد بنجاح ✅" : "Zid store connected ✅");
    } else if (status === "declined") {
      showToast(
        ar ? "ألغيت عمليّة الربط من جانب زد" : "Connection cancelled on Zid side",
        "error",
      );
    } else if (status === "error") {
      const msg = searchParams.get("zid_message");
      showToast(
        msg || (ar ? "تعذّر إكمال الربط — حاول مرّة أخرى" : "Connection failed — please retry"),
        "error",
      );
    }

    // Clear the query string so a refresh doesn't re-toast.
    router.replace("/integrations/zid");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Connect / disconnect / sync handlers ─────────────────────
  const [busy, setBusy] = useState<"" | "connect" | "disconnect" | "sync">("");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const handleConnect = async () => {
    setBusy("connect");
    try {
      const url = await startZidConnect();
      if (url) {
        window.location.href = url;
        return;
      }
      throw new Error("Missing authorize URL");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Unable to start connection";
      showToast(msg, "error");
      setBusy("");
    }
  };

  const doDisconnect = async () => {
    setConfirmDisconnect(false);
    setBusy("disconnect");
    try {
      await disconnectZid();
      showToast(ar ? "تمّ فصل زد" : "Zid disconnected");
      await mutate();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Disconnect failed", "error");
    } finally {
      setBusy("");
    }
  };

  const handleSync = async () => {
    setBusy("sync");
    try {
      await triggerZidSync();
      showToast(ar ? "بدأت المزامنة في الخلفيّة" : "Sync started in background");
      await mutate();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Sync failed", "error");
    } finally {
      setBusy("");
    }
  };

  // ── Render ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.t2, fontSize: 13 }}>
        {ar ? "جارٍ التحميل..." : "Loading..."}
      </div>
    );
  }

  // Platform-level disable
  if (data && data.enabled === false) {
    return (
      <div style={{ padding: "0 24px 24px", maxWidth: 720, margin: "0 auto" }}>
        <BackLink ar={ar} C={C} />
        <Card style={{ padding: 28, marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🛍️</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.txt }}>
            {ar ? "تكامل زد قيد التحضير" : "Zid integration is being prepared"}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: C.t2, lineHeight: 1.7 }}>
            {data.message || (ar
              ? "هذه الميزة لم تُفعَّل بعد على المنصّة. سنُبلّغك عند جاهزيّتها."
              : "This feature isn't enabled on the platform yet. We'll notify you when it's ready.")}
          </p>
        </Card>
      </div>
    );
  }

  // Connected state — always honour this regardless of plan_enabled.
  // A tenant who downgraded to Basic with a live integration keeps
  // the management UI (and the disconnect button) intact; the gate
  // only refuses NEW connections.
  if (data?.connected && data.integration) {
    return (
      <>
        <ConnectedPanel
          integration={data.integration}
          ar={ar}
          C={C}
          busy={busy}
          onDisconnect={() => setConfirmDisconnect(true)}
          onSync={handleSync}
        />
        <Modal
          open={confirmDisconnect}
          onClose={() => setConfirmDisconnect(false)}
          title={ar ? "تأكيد فصل زد" : "Disconnect Zid"}
          submitLabel={ar ? "فصل التكامل" : "Disconnect"}
          submitLoading={busy === "disconnect"}
          onSubmit={doDisconnect}
        >
          <p style={{ margin: 0, fontSize: 13, color: C.t2, lineHeight: 1.7 }}>
            {ar
              ? "سيتوقّف تتبّع التحويلات وإشعارات الطلبات. يمكنك الربط من جديد لاحقاً، لكن البيانات الجديدة لن تُنسَب لحملات سابقة."
              : "Conversion tracking and order notifications will stop. You can reconnect later, but new data won't be attributed to past campaigns."}
          </p>
        </Modal>
      </>
    );
  }

  // Plan-level disable — shown when the org has no integration AND
  // their plan doesn't include Zid. Swaps in for the Connect CTA.
  if (data && data.plan_enabled === false) {
    return <PlanGatedPanel ar={ar} C={C} />;
  }

  // Not connected — show CTA
  return (
    <NotConnectedPanel
      ar={ar}
      C={C}
      busy={busy}
      onConnect={handleConnect}
    />
  );
}

function PlanGatedPanel({ ar, C }: { ar: boolean; C: any }) {
  return (
    <div style={{ padding: "0 24px 24px", maxWidth: 720, margin: "0 auto" }}>
      <BackLink ar={ar} C={C} />
      <Card style={{
        padding: 28, marginTop: 16, textAlign: "center",
        borderRight: `4px solid ${C.info}`,
        background: `linear-gradient(135deg, ${C.info}08, transparent)`,
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🛍️</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.txt }}>
          {ar ? "تكامل زد — متاح من Starter وأعلى" : "Zid — available on Starter and above"}
        </h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: C.t2, lineHeight: 1.7 }}>
          {ar
            ? "لتمكين الربط مع متجر زد، استقبال الطلبات تلقائياً، وإرسال رسائل تأكيد للعملاء، رقّ باقتك."
            : "Connect a Zid store, receive orders automatically, and send confirmation messages to customers by upgrading your plan."}
        </p>
        <a
          href="/billing"
          style={{
            display: "inline-block",
            padding: "10px 22px",
            borderRadius: 10,
            background: C.pri,
            color: "#fff",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {ar ? "رقّ الباقة" : "Upgrade plan"}
        </a>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

function BackLink({ ar, C }: { ar: boolean; C: any }) {
  return (
    <a
      href="/integrations"
      style={{ fontSize: 13, color: C.t2, textDecoration: "none" }}
    >
      {ar ? "← العودة للتكاملات" : "← Back to integrations"}
    </a>
  );
}

function NotConnectedPanel({
  ar, C, busy, onConnect,
}: {
  ar: boolean; C: any; busy: string; onConnect: () => void;
}) {
  const benefits = ar
    ? [
        { icon: "chart", t: "تتبّع التحويلات الحقيقي", d: "ROI دقيق لكلّ حملة بدلاً من تقديري" },
        { icon: "bell",  t: "إشعارات الطلبات تلقائياً", d: "تأكيد، شحن، تسليم — كلّها على واتساب" },
        { icon: "cart",  t: "استرداد السلّات المتروكة", d: "تذكير العميل بعد 30 دقيقة من الترك" },
        { icon: "users", t: "مزامنة العملاء", d: "كلّ عملائك في زد يدخلون Corbit تلقائياً" },
      ]
    : [
        { icon: "chart", t: "Real conversion tracking", d: "Accurate ROI per campaign, not estimated" },
        { icon: "bell",  t: "Auto order notifications", d: "Confirmation, shipping, delivery — on WhatsApp" },
        { icon: "cart",  t: "Cart abandonment recovery", d: "Reminder after 30 minutes" },
        { icon: "users", t: "Customer sync", d: "Every Zid customer auto-imported to Corbit" },
      ];

  return (
    <div style={{ padding: "0 24px 24px", maxWidth: 720, margin: "0 auto" }}>
      <BackLink ar={ar} C={C} />
      <Card style={{ padding: 28, marginTop: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ marginBottom: 12, fontSize: 48 }}>🛍️</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: C.txt }}>
            {ar ? "اربط متجرك على زد" : "Connect your Zid store"}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: C.t2, lineHeight: 1.7 }}>
            {ar
              ? "اربط متجرك على منصّة زد بنقرة واحدة لتفعيل تتبّع التحويلات وإشعارات الطلبات الذكيّة."
              : "Connect your Zid store in one click to enable conversion tracking and smart order notifications."}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {benefits.map((b, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 10,
                background: C.inp,
                border: `1px solid ${C.brd}`,
              }}
            >
              <div style={{ marginBottom: 4, color: C.pri, display: "flex" }}><Icon name={b.icon} size={22} /></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 2 }}>
                {b.t}
              </div>
              <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.5 }}>
                {b.d}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <Button primary onClick={onConnect} disabled={busy === "connect"}>
            {busy === "connect"
              ? (ar ? "جارٍ التحويل لزد..." : "Redirecting to Zid...")
              : (ar ? "ربط متجر زد الآن" : "Connect Zid store now")}
          </Button>
          <p style={{ margin: "12px 0 0", fontSize: 11, color: C.t3 }}>
            {ar
              ? "ستُحوَّل لصفحة زد لتأكيد الربط، ثمّ تعود لهنا تلقائياً."
              : "You'll be redirected to Zid to confirm, then back here automatically."}
          </p>
        </div>
      </Card>

      <Card style={{ padding: 18, marginTop: 14 }}>
        <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.7 }}>
          <span style={{ color: C.t3, fontWeight: 600 }}>
            {ar ? "🔒 الخصوصيّة:" : "🔒 Privacy:"}
          </span>{" "}
          {ar
            ? "نقرأ بيانات العملاء والطلبات من متجرك حصراً لتنفيذ التكامل، ولا نشاركها مع أيّ طرف. تقدر تفصل التكامل في أيّ وقت."
            : "We read customer + order data strictly to power the integration. Never shared with third parties. Disconnect anytime."}{" "}
          <a href="/dpa" style={{ color: C.pri }}>
            {ar ? "DPA" : "DPA"}
          </a>
        </div>
      </Card>
    </div>
  );
}

function ConnectedPanel({
  integration, ar, C, busy, onDisconnect, onSync,
}: {
  integration: any; ar: boolean; C: any; busy: string;
  onDisconnect: () => void; onSync: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "conversions" | "events" | "settings">("overview");

  const statusColor = integration.status === "active" ? C.ok :
    integration.status === "expired" ? C.warn : C.danger;
  const statusLabel = ar
    ? ({ active: "نشط", expired: "منتهي", disconnected: "مفصول", error: "خطأ" } as any)[integration.status] ?? integration.status
    : integration.status;

  return (
    <div style={{ padding: "0 24px 24px", maxWidth: 960, margin: "0 auto" }}>
      <BackLink ar={ar} C={C} />

      {/* Header */}
      <Card style={{ padding: 20, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: 14,
              background: `${C.pri}12`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
            }}
          >
            🛍️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.txt }}>
                {integration.store_name || (ar ? "متجر زد" : "Zid Store")}
              </h2>
              <Badge color={statusColor}>{statusLabel}</Badge>
            </div>
            <div style={{ fontSize: 12, color: C.t2 }}>
              {integration.store_url ? (
                <a href={integration.store_url} target="_blank" rel="noreferrer" style={{ color: C.pri }}>
                  {integration.store_url}
                </a>
              ) : null}
              {integration.store_currency ? ` · ${integration.store_currency}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button outline onClick={onSync} disabled={busy === "sync"}>
              {busy === "sync" ? (ar ? "..." : "...") : (ar ? "🔄 مزامنة" : "🔄 Sync")}
            </Button>
            <Button outline onClick={onDisconnect} disabled={busy === "disconnect"}>
              {ar ? "فصل" : "Disconnect"}
            </Button>
          </div>
        </div>

        {integration.error_message && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 8,
              background: `${C.danger}10`,
              border: `1px solid ${C.danger}30`,
              fontSize: 12,
              color: C.danger,
            }}
          >
            ⚠️ {integration.error_message}
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginTop: 14, borderBottom: `1px solid ${C.brd}` }}>
        {[
          { key: "overview", labelAr: "نظرة عامّة", labelEn: "Overview" },
          { key: "conversions", labelAr: "التحويلات", labelEn: "Conversions" },
          { key: "events", labelAr: "سجل الأحداث", labelEn: "Events log" },
          { key: "settings", labelAr: "الإعدادات", labelEn: "Settings" },
        ].map((tt) => (
          <button
            key={tt.key}
            onClick={() => setTab(tt.key as any)}
            style={{
              padding: "10px 14px",
              background: "transparent",
              border: "none",
              borderBottom: tab === tt.key ? `2px solid ${C.pri}` : "2px solid transparent",
              color: tab === tt.key ? C.pri : C.t2,
              fontWeight: tab === tt.key ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {ar ? tt.labelAr : tt.labelEn}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ marginTop: 14 }}>
        {tab === "overview" && <OverviewTab integration={integration} ar={ar} C={C} />}
        {tab === "conversions" && <ConversionsTab ar={ar} C={C} />}
        {tab === "events" && <EventsTab ar={ar} C={C} />}
        {tab === "settings" && <SettingsTab ar={ar} C={C} />}
      </div>
    </div>
  );
}

function OverviewTab({ integration, ar, C }: { integration: any; ar: boolean; C: any }) {
  const fmt = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(ar ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const rows = [
    { lblAr: "المعرّف على زد", lblEn: "Zid Store ID", val: integration.zid_store_id },
    { lblAr: "متّصل منذ", lblEn: "Connected at", val: fmt(integration.connected_at) },
    { lblAr: "آخر مزامنة", lblEn: "Last synced", val: fmt(integration.last_synced_at) },
    { lblAr: "صلاحيّة التوكن", lblEn: "Token expires", val: fmt(integration.token_expires_at) },
  ];

  return (
    <Card style={{ padding: 20 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${C.brd}` : "none" }}>
              <td style={{ padding: "12px 8px", color: C.t2, fontWeight: 600, width: "40%" }}>
                {ar ? r.lblAr : r.lblEn}
              </td>
              <td style={{ padding: "12px 8px", color: C.txt }}>{r.val || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ConversionsTab({ ar, C }: { ar: boolean; C: any }) {
  const { data, isLoading } = useZidOrders(15000);
  const orders = Array.isArray(data) ? data : [];
  const total = orders.length;

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount_sar) || 0), 0);
  const attributedCount = orders.filter((o) => o.attributed_campaign_id).length;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  if (isLoading && orders.length === 0) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ textAlign: "center", color: C.t2, fontSize: 13 }}>
          {ar ? "جارٍ التحميل…" : "Loading…"}
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: C.txt }}>
            {ar ? "لا توجد طلبات بعد" : "No orders yet"}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: C.t2, lineHeight: 1.7 }}>
            {ar
              ? "اضغط زرّ \"مزامنة\" أعلى الصفحة لجلب الطلبات الحاليّة من Zid. يتمّ السحب التلقائي كلّ ساعة كذلك."
              : "Press the \"Sync\" button above to pull current orders from Zid. Automatic sync also runs hourly."}
          </p>
        </div>
      </Card>
    );
  }

  const fmtMoney = (n: number) => `${n.toFixed(2)} ${ar ? "ر.س" : "SAR"}`;
  // Zid status vocabulary (per docs.zid.sa): new, preparing, ready,
  // inDelivery, delivered, cancelled. Different slugs from Salla — we
  // localise here rather than at the backend so we don't lose the
  // original verbatim string in the DB row.
  const statusLabel = (s: string) => {
    const k = (s || "").toLowerCase();
    if (k === "new") return ar ? "جديد" : "New";
    if (k === "preparing") return ar ? "قيد التجهيز" : "Preparing";
    if (k === "ready") return ar ? "جاهز" : "Ready";
    if (k === "indelivery") return ar ? "قيد التوصيل" : "In delivery";
    if (k === "delivered") return ar ? "تم التسليم" : "Delivered";
    if (k === "cancelled") return ar ? "ملغي" : "Cancelled";
    return s;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <SummaryCard ar={ar} C={C} label={ar ? "إجمالي الطلبات" : "Total orders"} value={total.toLocaleString()} />
        <SummaryCard ar={ar} C={C} label={ar ? "إجمالي الإيرادات" : "Total revenue"} value={fmtMoney(totalRevenue)} />
        <SummaryCard ar={ar} C={C} label={ar ? "متوسّط قيمة الطلب" : "Avg order value"} value={fmtMoney(avgOrderValue)} />
        <SummaryCard ar={ar} C={C} label={ar ? "منسوب لحملات Corbit" : "Attributed to campaigns"} value={`${attributedCount} / ${orders.length}`} />
      </div>

      {/* Orders table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: C.bg2 || "#f5f5f5" }}>
              <tr>
                <th style={{ padding: "10px 12px", textAlign: "start", fontWeight: 600, color: C.t2, fontSize: 11 }}>{ar ? "رقم الطلب" : "Order ID"}</th>
                <th style={{ padding: "10px 12px", textAlign: "start", fontWeight: 600, color: C.t2, fontSize: 11 }}>{ar ? "العميل" : "Customer"}</th>
                <th style={{ padding: "10px 12px", textAlign: "start", fontWeight: 600, color: C.t2, fontSize: 11 }}>{ar ? "الجوّال" : "Phone"}</th>
                <th style={{ padding: "10px 12px", textAlign: "start", fontWeight: 600, color: C.t2, fontSize: 11 }}>{ar ? "المبلغ" : "Amount"}</th>
                <th style={{ padding: "10px 12px", textAlign: "start", fontWeight: 600, color: C.t2, fontSize: 11 }}>{ar ? "الحالة" : "Status"}</th>
                <th style={{ padding: "10px 12px", textAlign: "start", fontWeight: 600, color: C.t2, fontSize: 11 }}>{ar ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderTop: `1px solid ${C.bd}` }}>
                  <td style={{ padding: "10px 12px", color: C.txt, fontFamily: "monospace", fontSize: 12 }}>{o.zid_order_id}</td>
                  <td style={{ padding: "10px 12px", color: C.txt }}>{o.customer_name || "—"}</td>
                  <td style={{ padding: "10px 12px", color: C.t2, fontFamily: "monospace", fontSize: 12 }}>{o.customer_phone || "—"}</td>
                  <td style={{ padding: "10px 12px", color: C.txt, fontWeight: 600 }}>{fmtMoney(Number(o.total_amount_sar) || 0)}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: `${C.pri}15`, color: C.pri }}>
                      {statusLabel(o.status)}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: C.t2, fontSize: 12 }}>
                    {new Date(o.placed_at).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ ar: _ar, C, label, value }: { ar: boolean; C: any; label: string; value: string }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>{value}</div>
    </Card>
  );
}

function EventsTab({ ar, C }: { ar: boolean; C: any }) {
  // Polls every 5s so a webhook fired by Zid shows up almost
  // immediately without the operator needing to refresh.
  const { data, isLoading } = useZidWebhookEvents(5000);
  const events = Array.isArray(data) ? data : [];

  if (isLoading && events.length === 0) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ textAlign: "center", color: C.t2, fontSize: 13 }}>
          {ar ? "جارٍ التحميل…" : "Loading…"}
        </div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: C.txt }}>
            {ar ? "لا توجد أحداث بعد" : "No events yet"}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: C.t2, lineHeight: 1.7 }}>
            {ar
              ? "ستظهر أحداث Zid هنا فور وصولها (طلبات جديدة، عملاء، سلال متروكة). افتح متجرك التجريبي وأنشئ طلباً أو عميلاً للاختبار."
              : "Zid events will appear here as they arrive. Place a test order or customer in your demo store to verify."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.bd}`, fontSize: 12, color: C.t2 }}>
        {ar ? `إجمالي ${events.length} حدث` : `${events.length} total events`}
      </div>
      <div style={{ maxHeight: 600, overflowY: "auto" }}>
        {events.map((ev) => {
          const failed = !!ev.processing_error;
          const processed = !!ev.processed_at;
          const statusColor = failed ? "#DC2626" : processed ? "#16A34A" : "#D97706";
          const statusLabel = failed
            ? (ar ? "فشل" : "Failed")
            : processed
              ? (ar ? "تمّ" : "Processed")
              : (ar ? "بانتظار المعالجة" : "Pending");
          return (
            <div key={ev.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.bd}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.txt, marginBottom: 2 }}>
                  {ev.event}
                </div>
                <div style={{ fontSize: 11, color: C.t2 }}>
                  {new Date(ev.created_at).toLocaleString(ar ? "ar-SA" : "en-US")}
                  {ev.event_id && <span style={{ marginInlineStart: 8, opacity: 0.7 }}>· {ev.event_id}</span>}
                </div>
                {failed && (
                  <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4, wordBreak: "break-word" }}>
                    {ev.processing_error}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, padding: "2px 8px", borderRadius: 4, background: `${statusColor}15`, whiteSpace: "nowrap" }}>
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── SettingsTab ──────────────────────────────────────────────────
//
// Order/cart notification settings — same shape as Salla's. Without
// these toggles SendZidOrderStatusNotificationJob silently no-ops:
// every Zid webhook gets processed but the customer never receives a
// WhatsApp message. The template picker is filtered server-side to
// approved utility/authentication templates only, preventing a
// marketing template from getting paired with an automatic
// (non-opt-in) order notification.

interface ZidTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
}

interface ZidSettings {
  order_notifications_enabled: boolean;
  order_confirmed_template_id: string | null;
  order_shipped_template_id: string | null;
  order_delivered_template_id: string | null;
  cart_recovery_enabled: boolean;
  cart_recovery_delay_minutes: number;
  cart_recovery_template_id: string | null;
}

function SettingsTab({ ar, C }: { ar: boolean; C: any }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ZidSettings | null>(null);
  const [templates, setTemplates] = useState<ZidTemplate[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/integrations/zid/settings");
        setSettings(res.data.settings as ZidSettings);
        setTemplates((res.data.templates ?? []) as ZidTemplate[]);
      } catch {
        showToast(ar ? "تعذّر تحميل الإعدادات" : "Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = async (changes: Partial<ZidSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...changes };
    setSettings(next); // optimistic
    setSaving(true);
    try {
      const res = await api.patch("/integrations/zid/settings", changes);
      setSettings(res.data.settings as ZidSettings);
    } catch (e: any) {
      setSettings(settings); // rollback
      showToast(e?.response?.data?.message ?? (ar ? "فشل الحفظ" : "Save failed"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <Card style={{ padding: 32, textAlign: "center", fontSize: 13, color: C.t2 }}>
        {ar ? "جاري التحميل..." : "Loading..."}
      </Card>
    );
  }

  const hasNoTemplates = templates.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ZidQuickGuide ar={ar} C={C} />
      {hasNoTemplates && (
        <Card style={{ padding: 14, borderRight: `4px solid ${C.warn}`, background: `${C.warn}08` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: C.warn, display: "inline-flex" }}><Icon name="alert" size={18} /></span>
            <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.7 }}>
              {ar
                ? "لا توجد قوالب معتمدة من نوع Utility في حسابك. أنشئ قالباً معتمداً من Meta لاستخدامه كرسالة تأكيد الطلب."
                : "You don't have any approved Utility templates yet. Create a Meta-approved template to use for order confirmations."}
            </div>
          </div>
        </Card>
      )}

      {/* Order notifications block */}
      <Card style={{ padding: 18 }}>
        <SettingsHeader
          ar={ar} C={C}
          title={ar ? "إشعارات الطلبات" : "Order notifications"}
          desc={ar
            ? "تُرسَل تلقائياً عند كل طلب جديد أو تحديث حالة. هذه رسائل خدميّة (utility) — لا تتطلب موافقة تسويقيّة من العميل."
            : "Sent automatically on each new order or status change. These are utility messages — no marketing opt-in required."}
        />
        <Toggle
          ar={ar} C={C}
          checked={settings.order_notifications_enabled}
          onChange={(v) => patch({ order_notifications_enabled: v })}
          label={ar ? "تفعيل إشعارات الطلبات" : "Enable order notifications"}
        />

        {settings.order_notifications_enabled && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <TemplatePicker
              ar={ar} C={C}
              label={ar ? "قالب: تمّ تأكيد الطلب" : "Template: Order confirmed"}
              hint={ar ? "يُرسَل عند إنشاء الطلب" : "Fires on order.created"}
              expectedParams={[
                { num: 1, ar: "اسم العميل", en: "Customer name" },
                { num: 2, ar: "رقم الطلب", en: "Order number" },
                { num: 3, ar: "المبلغ بالريال", en: "Total amount (SAR)" },
                { num: 4, ar: "طريقة الدفع", en: "Payment method" },
              ]}
              value={settings.order_confirmed_template_id}
              templates={templates}
              onChange={(id) => patch({ order_confirmed_template_id: id })}
            />
            <TemplatePicker
              ar={ar} C={C}
              label={ar ? "قالب: تمّ الشحن" : "Template: Shipped"}
              hint={ar ? "يُرسَل عند تغيير الحالة إلى inDelivery" : "Fires when status becomes inDelivery"}
              expectedParams={[
                { num: 1, ar: "رقم الطلب", en: "Order number" },
                { num: 2, ar: "شركة الشحن", en: "Shipping company" },
                { num: 3, ar: "رقم التتبّع", en: "Tracking number" },
              ]}
              value={settings.order_shipped_template_id}
              templates={templates}
              onChange={(id) => patch({ order_shipped_template_id: id })}
            />
            <TemplatePicker
              ar={ar} C={C}
              label={ar ? "قالب: تمّ التسليم" : "Template: Delivered"}
              hint={ar ? "يُرسَل عند تغيير الحالة إلى delivered" : "Fires when status becomes delivered"}
              expectedParams={[
                { num: 1, ar: "رقم الطلب", en: "Order number" },
              ]}
              value={settings.order_delivered_template_id}
              templates={templates}
              onChange={(id) => patch({ order_delivered_template_id: id })}
            />
          </div>
        )}
      </Card>

      {/* Cart recovery block */}
      <Card style={{ padding: 18 }}>
        <SettingsHeader
          ar={ar} C={C}
          title={ar ? "استرداد العربات المتروكة" : "Abandoned cart recovery"}
          desc={ar
            ? "رسالة تذكير تلقائيّة عند ترك العميل عربة الشراء. تحترم خيار التسويق (opt-in) في جهة الاتصال."
            : "Auto-reminder when a customer leaves their cart. Respects the contact's marketing opt-in flag."}
        />
        <Toggle
          ar={ar} C={C}
          checked={settings.cart_recovery_enabled}
          onChange={(v) => patch({ cart_recovery_enabled: v })}
          label={ar ? "تفعيل استرداد العربات" : "Enable cart recovery"}
        />

        {settings.cart_recovery_enabled && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, color: C.t2, marginBottom: 6, fontWeight: 600 }}>
                {ar ? "التأخير قبل الإرسال (بالدقائق)" : "Delay before sending (minutes)"}
              </label>
              <input
                type="number"
                min={5}
                max={1440}
                value={settings.cart_recovery_delay_minutes}
                onChange={(e) => {
                  const v = Math.max(5, Math.min(1440, parseInt(e.target.value || "30", 10)));
                  patch({ cart_recovery_delay_minutes: v });
                }}
                style={{
                  width: 140, padding: "8px 12px", borderRadius: 8,
                  border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13,
                }}
              />
              <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
                {ar ? "بين 5 و 1440 دقيقة (24 ساعة)" : "Between 5 and 1440 minutes (24 hours)"}
              </div>
            </div>
            <TemplatePicker
              ar={ar} C={C}
              label={ar ? "قالب: تذكير العربة" : "Template: Cart reminder"}
              hint={ar ? "يحتاج موافقة تسويقيّة على جهة الاتصال" : "Requires marketing opt-in on the contact"}
              expectedParams={[
                { num: 1, ar: "اسم العميل", en: "Customer name" },
                { num: 2, ar: "قيمة العربة بالريال", en: "Cart total (SAR)" },
              ]}
              value={settings.cart_recovery_template_id}
              templates={templates}
              onChange={(id) => patch({ cart_recovery_template_id: id })}
            />
          </div>
        )}
      </Card>

      {saving && (
        <div style={{ fontSize: 11.5, color: C.t3, textAlign: "center" }}>
          {ar ? "جاري الحفظ..." : "Saving..."}
        </div>
      )}
    </div>
  );
}

function SettingsHeader({ ar: _ar, C, title, desc }: { ar: boolean; C: any; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 700, color: C.txt }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 12, color: C.t2, lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

function Toggle({
  ar, C, checked, onChange, label,
}: { ar: boolean; C: any; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? "#10b981" : C.brd,
          border: "none", cursor: "pointer", position: "relative",
          transition: "background 200ms",
        }}
      >
        <span style={{
          position: "absolute", top: 2,
          [ar ? "right" : "left"]: checked ? 20 : 2,
          width: 18, height: 18, borderRadius: 9,
          background: "#fff",
          transition: ar ? "right 200ms" : "left 200ms",
        }} />
      </button>
      <span style={{ fontSize: 13, color: C.txt }}>{label}</span>
    </label>
  );
}

function ZidQuickGuide({ ar, C }: { ar: boolean; C: any }) {
  const [open, setOpen] = useState(true);

  const steps = ar
    ? [
        {
          title: "1. أنشئ قالب واتساب من نوع Utility",
          body: "روح إلى تبويب \"القوالب\" → إنشاء قالب جديد. اختر النوع Utility (مش Marketing — رسائل الطلبات تلقائيّة بدون موافقة تسويقيّة). أرسلها لـ Meta للموافقة (دقائق إلى ساعات).",
        },
        {
          title: "2. اكتب القالب بالمتغيّرات المطلوبة",
          body: "كل مرحلة (تأكيد/شحن/تسليم) تحتاج عدد متغيّرات محدّد. القسم التالي يعرض المتغيّرات المطلوبة لكل مرحلة — انسخها بنفس الترتيب وإلّا Meta سترفض الإرسال.",
        },
        {
          title: "3. فعّل التبديل + اختر القالب",
          body: "بعد ما Meta تعتمد القالب، فعّل \"إشعارات الطلبات\" أعلاه واختر القالب المناسب لكل مرحلة من القائمة المنسدلة.",
        },
        {
          title: "4. اعمل طلب اختبار من متجر زد",
          body: "بنفس رقم جوّال موجود في جهات الاتصال. ستصل رسالة الواتساب خلال ثوانٍ — يمكن مراجعة الحالة في تبويب \"سجل الأحداث\".",
        },
      ]
    : [
        {
          title: "1. Create a Utility WhatsApp template",
          body: "Go to Templates → Create new. Pick Utility (not Marketing — order notifications fire automatically without an opt-in). Submit to Meta for approval (minutes to hours).",
        },
        {
          title: "2. Match the required placeholders",
          body: "Each stage (confirmed/shipped/delivered) needs a specific {{N}} count. The section below shows the required mapping per stage — copy it exactly or Meta will reject the send.",
        },
        {
          title: "3. Toggle on + pick the template",
          body: "Once Meta approves, switch \"Order notifications\" above on and select the matching template for each stage from the dropdown.",
        },
        {
          title: "4. Place a test order in Zid",
          body: "Use a phone number that exists in your contacts. The WhatsApp message arrives within seconds — verify in the Events log tab.",
        },
      ];

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "14px 18px",
          background: "transparent", border: "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>📖</span>
          <strong style={{ fontSize: 14, color: C.txt }}>
            {ar ? "كيف تشغّل الإشعارات؟ (دليل سريع)" : "How to turn notifications on (quick guide)"}
          </strong>
        </span>
        <span style={{ fontSize: 18, color: C.t2, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>⌃</span>
      </button>

      {open && (
        <div style={{ padding: "0 18px 18px" }}>
          <ol style={{ margin: 0, paddingInlineStart: 18, fontSize: 12.5, color: C.t2, lineHeight: 1.8 }}>
            {steps.map((s, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: C.txt, marginBottom: 2 }}>{s.title}</div>
                <div>{s.body}</div>
              </li>
            ))}
          </ol>
          <div style={{
            marginTop: 12, padding: 10,
            background: C.inp, borderRadius: 8,
            fontSize: 11.5, color: C.t2, lineHeight: 1.7,
          }}>
            {ar
              ? "💡 ملاحظة: الإشعارات تُرسَل فقط إلى أرقام موجودة في جهات الاتصال. لو زبون زد جديد، يُنشأ contact تلقائياً عند ربط متجره — لا يلزم استيراد يدوي."
              : "💡 Tip: notifications only fire to numbers that exist in Contacts. New Zid customers are auto-synced — no manual import needed."}
          </div>
        </div>
      )}
    </Card>
  );
}

interface ExpectedParam { num: number; ar: string; en: string; }

function TemplatePicker({
  ar, C, label, hint, value, templates, onChange, expectedParams,
}: {
  ar: boolean; C: any; label: string; hint: string;
  value: string | null;
  templates: ZidTemplate[];
  onChange: (id: string | null) => void;
  expectedParams?: ExpectedParam[];
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, color: C.t2, marginBottom: 6, fontWeight: 600 }}>
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 8,
          border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13,
        }}
      >
        <option value="">{ar ? "— لم يُحدَّد —" : "— Not selected —"}</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.category} · {t.language})
          </option>
        ))}
      </select>
      <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{hint}</div>

      {/* Required-placeholder hint — Meta returns #132000 when actual
          placeholder count doesn't match what we ship. The mapping
          shown inline is the cheapest way to prevent that rejection. */}
      {expectedParams && expectedParams.length > 0 && (
        <div style={{
          marginTop: 8, padding: "8px 10px", borderRadius: 8,
          background: `${C.info}10`, border: `1px solid ${C.info}30`,
          fontSize: 11, color: C.t2, lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 700, color: C.info, marginBottom: 4 }}>
            {ar
              ? `يجب أن يحوي القالب ${expectedParams.length} متغيّر${expectedParams.length > 1 ? "اً" : ""}:`
              : `Template must contain ${expectedParams.length} placeholder${expectedParams.length > 1 ? "s" : ""}:`}
          </div>
          {expectedParams.map((p) => (
            <div key={p.num} style={{ fontFamily: "monospace", direction: "ltr", textAlign: ar ? "right" : "left" }}>
              <strong>{`{{${p.num}}}`}</strong>
              {" "}
              <span style={{ fontFamily: "inherit" }}>— {ar ? p.ar : p.en}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
