"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { BrandIcon } from "@/components/icons/brand-icon";
import {
  useSallaStatus,
  useSallaWebhookEvents,
  useSallaOrders,
  startSallaConnect,
  disconnectSalla,
  triggerSallaSync,
} from "@/lib/api/salla";

/**
 * /integrations/salla — the Salla integration management page.
 *
 * Three states:
 *   1. Feature disabled at platform level → static info card
 *   2. Not connected → "Connect your store" CTA that fires OAuth
 *   3. Connected → status panel + tabs for settings, conversions, etc.
 *
 * The OAuth callback lands on /integrations/salla?salla_status=connected
 * (or =error / =declined) — we read those params on mount and surface
 * a toast.
 */
export default function SallaIntegrationPage() {
  return (
    <Suspense fallback={null}>
      <SallaIntegrationInner />
    </Suspense>
  );
}

function SallaIntegrationInner() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const ar = isAr;
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Poll every 15s while connecting so the user sees status flip from
  // 'connecting' to 'active' once the OAuth callback completes.
  const { data, isLoading, mutate } = useSallaStatus(15000);

  // ── OAuth callback toast ─────────────────────────────────────
  useEffect(() => {
    const status = searchParams.get("salla_status");
    if (!status) return;

    if (status === "connected") {
      showToast(ar ? "تمّ ربط متجر سلّة بنجاح ✅" : "Salla store connected ✅");
    } else if (status === "declined") {
      showToast(
        ar ? "ألغيت عمليّة الربط من جانب سلّة" : "Connection cancelled on Salla side",
        "error",
      );
    } else if (status === "error") {
      const msg = searchParams.get("salla_message");
      showToast(
        msg || (ar ? "تعذّر إكمال الربط — حاول مرّة أخرى" : "Connection failed — please retry"),
        "error",
      );
    }

    // Clear the query string so a refresh doesn't re-toast.
    router.replace("/integrations/salla");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Connect / disconnect / sync handlers ─────────────────────
  const [busy, setBusy] = useState<"" | "connect" | "disconnect" | "sync">("");

  const handleConnect = async () => {
    setBusy("connect");
    try {
      const url = await startSallaConnect();
      if (url) {
        // Full redirect to Salla — user lands back via OAuth callback.
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

  const handleDisconnect = async () => {
    if (!confirm(ar
      ? "هل أنت متأكّد؟ سيتوقّف تتبّع التحويلات وإشعارات الطلبات."
      : "Are you sure? This stops conversion tracking and order notifications."
    )) return;
    setBusy("disconnect");
    try {
      await disconnectSalla();
      showToast(ar ? "تمّ فصل سلّة" : "Salla disconnected");
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
      await triggerSallaSync();
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
          <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.txt }}>
            {ar ? "تكامل سلّة قيد التحضير" : "Salla integration is being prepared"}
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

  // Connected state
  if (data?.connected && data.integration) {
    return (
      <ConnectedPanel
        integration={data.integration}
        ar={ar}
        C={C}
        busy={busy}
        onDisconnect={handleDisconnect}
        onSync={handleSync}
      />
    );
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
        { icon: "users", t: "مزامنة العملاء", d: "كلّ عملائك في سلّة يدخلون Corbit تلقائياً" },
      ]
    : [
        { icon: "chart", t: "Real conversion tracking", d: "Accurate ROI per campaign, not estimated" },
        { icon: "bell",  t: "Auto order notifications", d: "Confirmation, shipping, delivery — on WhatsApp" },
        { icon: "cart",  t: "Cart abandonment recovery", d: "Reminder after 30 minutes" },
        { icon: "users", t: "Customer sync", d: "Every Salla customer auto-imported to Corbit" },
      ];

  return (
    <div style={{ padding: "0 24px 24px", maxWidth: 720, margin: "0 auto" }}>
      <BackLink ar={ar} C={C} />
      <Card style={{ padding: 28, marginTop: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", color: "#9B45D8" }}><BrandIcon name="salla" size={48} /></div>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: C.txt }}>
            {ar ? "اربط متجرك على سلّة" : "Connect your Salla store"}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: C.t2, lineHeight: 1.7 }}>
            {ar
              ? "اربط متجرك على منصّة سلّة بنقرة واحدة لتفعيل تتبّع التحويلات وإشعارات الطلبات الذكيّة."
              : "Connect your Salla store in one click to enable conversion tracking and smart order notifications."}
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
              ? (ar ? "جارٍ التحويل لسلّة..." : "Redirecting to Salla...")
              : (ar ? "ربط متجر سلّة الآن" : "Connect Salla store now")}
          </Button>
          <p style={{ margin: "12px 0 0", fontSize: 11, color: C.t3 }}>
            {ar
              ? "ستُحوَّل لصفحة سلّة لتأكيد الربط، ثمّ تعود لهنا تلقائياً."
              : "You'll be redirected to Salla to confirm, then back here automatically."}
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
  const [tab, setTab] = useState<"overview" | "conversions" | "events">("overview");

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
            🛒
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.txt }}>
                {integration.store_name || (ar ? "متجر سلّة" : "Salla Store")}
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
    { lblAr: "المعرّف على سلّة", lblEn: "Salla Store ID", val: integration.salla_store_id },
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
  // useApi auto-unwraps res.data.data into the result; for paginated
  // endpoints that means `data` is the orders array itself, not the
  // full Laravel paginator object. Trying `data?.data` was returning
  // undefined and rendering the empty state on top of 9 real orders.
  const { data, isLoading } = useSallaOrders(15000);
  const orders = Array.isArray(data) ? data : [];
  const total = orders.length;

  // Revenue summary across the page of orders we have. Sum on the
  // server side would be more accurate for huge stores, but for the
  // typical Saudi tenant (hundreds-thousands of orders/month) this
  // is good enough to surface the headline number.
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
              ? "اضغط زرّ \"مزامنة\" أعلى الصفحة لجلب الطلبات الحاليّة من Salla. يتمّ السحب التلقائي كلّ ساعة كذلك."
              : "Press the \"Sync\" button above to pull current orders from Salla. Automatic sync also runs hourly."}
          </p>
        </div>
      </Card>
    );
  }

  const fmtMoney = (n: number) => `${n.toFixed(2)} ${ar ? "ر.س" : "SAR"}`;
  const statusLabel = (s: string) => {
    if (s === "draft") return ar ? "مسودة" : "Draft";
    if (s === "completed") return ar ? "مكتمل" : "Completed";
    if (s === "cancelled") return ar ? "ملغي" : "Cancelled";
    if (s === "shipped") return ar ? "مشحون" : "Shipped";
    if (s === "delivered") return ar ? "تم التسليم" : "Delivered";
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
                  <td style={{ padding: "10px 12px", color: C.txt, fontFamily: "monospace", fontSize: 12 }}>{o.salla_order_id}</td>
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
  // Polls every 5s so a webhook fired by Salla shows up almost
  // immediately without the operator needing to refresh — the
  // typical use is "I just placed a test order, where is it?"
  const { data, isLoading } = useSallaWebhookEvents(5000);
  // Same useApi unwrap quirk as ConversionsTab — see comment there.
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
              ? "ستظهر أحداث Salla هنا فور وصولها (طلبات جديدة، عملاء، سلال متروكة). افتح متجرك التجريبي وأنشئ طلباً أو عميلاً للاختبار."
              : "Salla events will appear here as they arrive. Place a test order or customer in your demo store to verify."}
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
