"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge, Modal, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { useToast } from "@/hooks/use-toast";
import { usePlanUsage } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { ApiTesterModal } from "./api-tester-modal";

interface ApiKey {
  id: string;
  name: string;
  key_prefix?: string;
  is_active: boolean;
  last_used_at?: string | null;
  created_at?: string;
  // Only present right after create/regenerate
  key?: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at?: string | null;
  created_at?: string;
  // Only present right after create
  secret?: string;
}

const WEBHOOK_EVENTS = [
  "message.received",
  "message.sent",
  "conversation.opened",
  "conversation.assigned",
  "conversation.closed",
  "contact.created",
  "campaign.completed",
];

/**
 * API tab in Settings — exposes the API keys + outbound webhooks
 * the tenant can issue to integrate Corbit with their own systems.
 *
 * The freshly-generated raw key/secret is only shown once on
 * create/regenerate (the backend stores it hashed); the rest of
 * the time we render the prefix only. A new-secret modal makes
 * sure the operator copies it before navigating away.
 */
export function ApiAndWebhooksPanel({
  C,
  dk,
  ar,
  isMob,
}: {
  C: any;
  dk: boolean;
  ar: boolean;
  isMob: boolean;
}) {
  const { showToast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  // Plan-flag mirror so the UI hints/disables match the backend gate.
  //   api_enabled       → API keys section (Pro/Enterprise)
  //   webhooks_enabled  → Webhooks section (Business/Enterprise)
  // Existing keys/webhooks on lower plans still list/toggle/delete;
  // we only block the create flow.
  const { data: planData } = usePlanUsage();
  const apiEnabled = (planData?.limits?.api_enabled as boolean | undefined) ?? false;
  const webhooksEnabled = (planData?.limits?.webhooks_enabled as boolean | undefined) ?? false;

  // New-key modal
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyResult, setNewKeyResult] = useState<ApiKey | null>(null);
  const [busy, setBusy] = useState(false);

  // New-webhook modal
  const [showNewHook, setShowNewHook] = useState(false);
  const [hookForm, setHookForm] = useState<{ url: string; events: string[] }>({ url: "", events: [] });
  const [newHookResult, setNewHookResult] = useState<Webhook | null>(null);

  // API tester modal — open with optional prefilled key (used right
  // after Generate so the operator can verify the fresh key without
  // re-pasting it from the reveal modal).
  const [testerOpen, setTesterOpen] = useState(false);
  const [testerKey, setTesterKey] = useState<string | undefined>(undefined);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [k, w] = await Promise.all([
        api.get("/settings/api-keys"),
        api.get("/settings/webhooks"),
      ]);
      const ks = (k.data?.data ?? k.data) as ApiKey[];
      const ws = (w.data?.data ?? w.data) as Webhook[];
      setKeys(Array.isArray(ks) ? ks : []);
      setHooks(Array.isArray(ws) ? ws : []);
    } catch {
      // Endpoints may 404 on older deploys — leave the lists empty so
      // the empty-state UI explains itself instead of error-toasting.
      setKeys([]);
      setHooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ─── API key handlers ─────────────────────────────────────────
  const createKey = async () => {
    if (!newKeyName.trim()) {
      showToast(ar ? "أدخل اسم المفتاح" : "Enter a key name", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/settings/api-keys", { name: newKeyName.trim() });
      const created = (res.data?.data ?? res.data) as ApiKey;
      setNewKeyResult(created);
      setShowNewKey(false);
      setNewKeyName("");
      reload();
    } catch (err: any) {
      showToast(err?.response?.data?.message || (ar ? "تعذّر إنشاء المفتاح" : "Failed to create key"), "error");
    } finally {
      setBusy(false);
    }
  };

  const regenKey = async (k: ApiKey) => {
    if (!confirm(ar
      ? `سيتمّ إبطال المفتاح الحالي "${k.name}" — أيّ نظام يستخدمه سيتوقّف فوراً. متابعة؟`
      : `This will revoke "${k.name}" — anything using it stops working immediately. Continue?`)) return;
    setBusy(true);
    try {
      const res = await api.post(`/settings/api-keys/${k.id}/regenerate`);
      const next = (res.data?.data ?? res.data) as ApiKey;
      setNewKeyResult(next);
      reload();
    } catch (err: any) {
      showToast(err?.response?.data?.message || (ar ? "تعذّر إعادة الإنشاء" : "Failed to regenerate"), "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteKey = async (k: ApiKey) => {
    if (!confirm(ar
      ? `حذف "${k.name}" نهائي — تابع؟`
      : `Delete "${k.name}" permanently?`)) return;
    setBusy(true);
    try {
      await api.delete(`/settings/api-keys/${k.id}`);
      showToast(ar ? "تم الحذف ✓" : "Deleted ✓");
      reload();
    } catch (err: any) {
      showToast(err?.response?.data?.message || (ar ? "تعذّر الحذف" : "Delete failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  // ─── Webhook handlers ─────────────────────────────────────────
  const createHook = async () => {
    if (!hookForm.url.trim()) {
      showToast(ar ? "أدخل عنوان الـ URL" : "Enter a URL", "error");
      return;
    }
    if (hookForm.events.length === 0) {
      showToast(ar ? "اختر حدث واحد على الأقل" : "Pick at least one event", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/settings/webhooks", {
        url: hookForm.url.trim(),
        events: hookForm.events,
      });
      const created = (res.data?.data ?? res.data) as Webhook;
      setNewHookResult(created);
      setShowNewHook(false);
      setHookForm({ url: "", events: [] });
      reload();
    } catch (err: any) {
      showToast(err?.response?.data?.message || (ar ? "تعذّر إضافة الويب هوك" : "Failed to add webhook"), "error");
    } finally {
      setBusy(false);
    }
  };

  const toggleHookActive = async (w: Webhook) => {
    setBusy(true);
    try {
      await api.patch(`/settings/webhooks/${w.id}`, { is_active: !w.is_active });
      reload();
    } catch (err: any) {
      showToast(err?.response?.data?.message || (ar ? "تعذّر التحديث" : "Update failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const testHook = async (w: Webhook) => {
    setBusy(true);
    try {
      const res = await api.post(`/settings/webhooks/${w.id}/test`);
      const result = res.data?.data ?? res.data;
      if (result?.success) {
        showToast(ar ? `تم الإرسال — الحالة ${result.statusCode}` : `Sent — status ${result.statusCode}`);
      } else {
        showToast(ar ? `فشل الاختبار: ${result?.error || result?.statusCode}` : `Test failed: ${result?.error || result?.statusCode}`, "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || (ar ? "تعذّر الاختبار" : "Test failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteHook = async (w: Webhook) => {
    if (!confirm(ar ? `حذف ويب هوك "${w.url}"؟` : `Delete webhook "${w.url}"?`)) return;
    setBusy(true);
    try {
      await api.delete(`/settings/webhooks/${w.id}`);
      showToast(ar ? "تم الحذف ✓" : "Deleted ✓");
      reload();
    } catch (err: any) {
      showToast(err?.response?.data?.message || (ar ? "تعذّر الحذف" : "Delete failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(ar ? "تم النسخ ✓" : "Copied ✓");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 14 }}>
      {/* ── API Keys ── */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{ar ? "مفاتيح API" : "API Keys"}</h3>
          <div title={!apiEnabled
            ? (ar
                ? "وصول API متاح في باقات Starter وأعلى"
                : "API access is available on Starter and above")
            : undefined}
          >
            <Button
              primary
              small
              disabled={!apiEnabled}
              onClick={() => {
                if (!apiEnabled) {
                  showToast(
                    ar
                      ? "وصول API غير متاح في باقتك الحاليّة. رقّ الباقة لإنشاء مفتاح."
                      : "API access is not available in your plan. Upgrade to generate a key.",
                    "error",
                  );
                  return;
                }
                setShowNewKey(true);
              }}
            >+ {ar ? "إنشاء مفتاح" : "Generate"}</Button>
          </div>
        </div>
        {!apiEnabled && (
          <div style={{
            fontSize: 11.5, color: C.t2, padding: 10,
            background: C.inp, borderRadius: 8, marginBottom: 10, lineHeight: 1.7,
          }}>
            {ar
              ? "وصول REST API متاح بدءاً من باقة Starter. مفاتيح موجودة من باقة قديمة يمكن إدارتها هنا، لكن إنشاء مفتاح جديد يحتاج ترقية."
              : "REST API access starts on the Starter plan. Existing keys from a previous plan can be managed here, but creating a new one requires an upgrade."}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 10, lineHeight: 1.6 }}>
          {ar
            ? "استخدم هذه المفاتيح للوصول إلى REST API. تظهر القيمة كاملة مرّة واحدة فقط عند الإنشاء."
            : "Use these keys to access the REST API. The full value is shown only once at creation time."}
        </div>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: C.t3 }}>
            {ar ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : keys.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: C.t3, border: `1px dashed ${C.brd}`, borderRadius: 10 }}>
            {ar ? "لا توجد مفاتيح بعد" : "No keys yet"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {keys.map((k) => (
              <div key={k.id} style={{ padding: 12, borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{k.name}</span>
                  <Badge color={k.is_active ? C.ok : C.t3}>
                    {k.is_active ? (ar ? "نشط" : "Active") : (ar ? "مُعطّل" : "Inactive")}
                  </Badge>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.t2, marginBottom: 8 }}>
                  {k.key_prefix}…
                </div>
                <div style={{ fontSize: 10.5, color: C.t3, marginBottom: 8 }}>
                  {k.last_used_at
                    ? (ar ? `آخر استخدام: ${new Date(k.last_used_at).toLocaleString("ar")}` : `Last used: ${new Date(k.last_used_at).toLocaleString("en")}`)
                    : (ar ? "لم يُستخدم بعد" : "Never used")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { setTesterKey(undefined); setTesterOpen(true); }}
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.info}`, background: "transparent", color: C.info, fontFamily: FONT_FAMILY, fontSize: 11, cursor: busy ? "wait" : "pointer", fontWeight: 600 }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name="target" size={11} />
                      <span>{ar ? "اختبار" : "Test"}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => regenKey(k)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.warn}`, background: "transparent", color: C.warn, fontFamily: FONT_FAMILY, fontSize: 11, cursor: busy ? "wait" : "pointer", fontWeight: 600 }}
                  >
                    {ar ? "إعادة إنشاء" : "Regenerate"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteKey(k)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.err}`, background: "transparent", color: C.err, fontFamily: FONT_FAMILY, fontSize: 11, cursor: busy ? "wait" : "pointer", fontWeight: 600 }}
                  >
                    {ar ? "حذف" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Webhooks ── */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{ar ? "الويب هوكس" : "Webhooks"}</h3>
          {/* Plan-gated: Business/Enterprise create; lower tiers
              see the button disabled (existing hooks still manage). */}
          <div title={!webhooksEnabled
            ? (ar
                ? "إضافة Webhooks متاحة في باقات Business وأعلى"
                : "Adding Webhooks is available on Business and above")
            : undefined}
          >
            <Button
              primary
              small
              disabled={!webhooksEnabled}
              onClick={() => {
                if (!webhooksEnabled) {
                  showToast(
                    ar
                      ? "إنشاء Webhooks غير متاح في باقتك الحاليّة. رقّ الباقة (Business أو Enterprise) لإضافة Webhook جديد."
                      : "Adding webhooks is not available in your plan. Upgrade to Business or Enterprise.",
                    "error",
                  );
                  return;
                }
                setShowNewHook(true);
              }}
            >+ {ar ? "إضافة" : "Add"}</Button>
          </div>
        </div>
        {!webhooksEnabled && (
          <div style={{
            fontSize: 11.5, color: C.t2, padding: 10,
            background: C.inp, borderRadius: 8, marginBottom: 10, lineHeight: 1.7,
          }}>
            {ar
              ? "Webhooks متاحة في باقات Business وأعلى. لو عندك hooks موجودة من باقة قديمة، تقدر تختبرها أو تحذفها من هنا، لكن ما تقدر تضيف جديد."
              : "Webhooks are available on Business and above. Existing hooks from a previous plan can still be tested or deleted here, but no new ones can be added."}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 10, lineHeight: 1.6 }}>
          {ar
            ? "كل حدث يُرسَل بتوقيع HMAC SHA-256 في الـ header X-Webhook-Signature. اختبر قبل الاعتماد."
            : "Each event ships with an HMAC SHA-256 signature in the X-Webhook-Signature header. Test before relying on it."}
        </div>
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: C.t3 }}>
            {ar ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : hooks.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: C.t3, border: `1px dashed ${C.brd}`, borderRadius: 10 }}>
            {ar ? "لا توجد ويب هوكس بعد" : "No webhooks yet"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hooks.map((w) => (
              <div key={w.id} style={{ padding: 12, borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "monospace", fontSize: 11.5, color: C.txt, wordBreak: "break-all" }}>{w.url}</div>
                  </div>
                  <Toggle on={w.is_active} onToggle={() => toggleHookActive(w)} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {(w.events || []).map((ev) => (
                    <span key={ev} style={{ padding: "2px 8px", borderRadius: 6, background: `${C.pri}10`, color: C.pri, fontSize: 10, fontFamily: "monospace" }}>{ev}</span>
                  ))}
                </div>
                <div style={{ fontSize: 10.5, color: C.t3, marginBottom: 8 }}>
                  {w.last_triggered_at
                    ? (ar ? `آخر إرسال: ${new Date(w.last_triggered_at).toLocaleString("ar")}` : `Last fired: ${new Date(w.last_triggered_at).toLocaleString("en")}`)
                    : (ar ? "لم يُرسَل بعد" : "Never fired")}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => testHook(w)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.info}`, background: "transparent", color: C.info, fontFamily: FONT_FAMILY, fontSize: 11, cursor: busy ? "wait" : "pointer", fontWeight: 600 }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name="target" size={11} />
                      <span>{ar ? "اختبار" : "Test"}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => deleteHook(w)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.err}`, background: "transparent", color: C.err, fontFamily: FONT_FAMILY, fontSize: 11, cursor: busy ? "wait" : "pointer", fontWeight: 600 }}
                  >
                    {ar ? "حذف" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── New API Key Modal ── */}
      <Modal
        open={showNewKey}
        onClose={() => setShowNewKey(false)}
        title={ar ? "إنشاء مفتاح API جديد" : "Generate API Key"}
        submitLabel={busy ? (ar ? "جاري الإنشاء..." : "Generating...") : (ar ? "إنشاء" : "Generate")}
        submitLoading={busy}
        onSubmit={createKey}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: C.t2, marginBottom: 4 }}>
              {ar ? "اسم المفتاح" : "Key name"}
            </label>
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder={ar ? "مثال: تكامل CRM" : "e.g. CRM integration"}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 13 }}
            />
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 10, background: `${C.warn}10`, border: `1px solid ${C.warn}25`, fontSize: 11.5, color: C.t2, lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 6 }}>
            <span style={{ color: C.warn, display: "inline-flex", marginTop: 1, flexShrink: 0 }}><Icon name="alert" size={13} /></span>
            <span>{ar
              ? "ستُعرض القيمة الكاملة مرّة واحدة فقط بعد الإنشاء. احفظها في مكان آمن — لا يمكن استرجاعها لاحقاً."
              : "The full key value is shown once on creation. Store it somewhere safe — it can't be retrieved later."}</span>
          </div>
        </div>
      </Modal>

      {/* ── Show new key/secret modal ── */}
      <Modal
        open={!!newKeyResult}
        onClose={() => setNewKeyResult(null)}
        title={ar ? "تم إنشاء المفتاح ✓" : "Key Generated ✓"}
        submitLabel={ar ? "نسخت — متابعة" : "Copied — done"}
        onSubmit={() => setNewKeyResult(null)}
      >
        {newKeyResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "10px 12px", borderRadius: 10, background: `${C.err}10`, border: `1px solid ${C.err}30`, fontSize: 11.5, color: C.err, fontWeight: 600, display: "flex", alignItems: "flex-start", gap: 6 }}>
              <Icon name="alert" size={13} />
              <span>{ar
                ? "هذه آخر مرّة ترى فيها القيمة الكاملة. انسخها الآن!"
                : "This is the last time the full value is visible. Copy it now!"}</span>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: C.t2, marginBottom: 4 }}>
                {ar ? "الاسم" : "Name"}
              </label>
              <div style={{ padding: "8px 12px", borderRadius: 8, background: C.inp, fontSize: 13, fontWeight: 600 }}>{newKeyResult.name}</div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: C.t2, marginBottom: 4 }}>
                {ar ? "المفتاح" : "API Key"}
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  readOnly
                  value={newKeyResult.key || ""}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: "monospace", fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => newKeyResult.key && copyToClipboard(newKeyResult.key)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: C.pri, color: "#fff", fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  {ar ? "نسخ" : "Copy"}
                </button>
              </div>
            </div>

            {/* One-click jump into the tester with the fresh key
                pre-filled. Saves the "copy → open tester → paste"
                friction right when the operator has the key. */}
            <button
              type="button"
              onClick={() => {
                if (newKeyResult.key) {
                  setTesterKey(newKeyResult.key);
                  setTesterOpen(true);
                  setNewKeyResult(null);
                }
              }}
              style={{
                marginTop: 4,
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.info}`,
                background: `${C.info}10`,
                color: C.info,
                fontFamily: FONT_FAMILY,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Icon name="target" size={14} />
              {ar ? "اختبر المفتاح الآن (بدون ترك الصفحة)" : "Test this key now (no leaving the page)"}
            </button>
          </div>
        )}
      </Modal>

      {/* ── New Webhook Modal ── */}
      <Modal
        open={showNewHook}
        onClose={() => setShowNewHook(false)}
        title={ar ? "إضافة ويب هوك" : "Add Webhook"}
        submitLabel={busy ? (ar ? "جاري الإضافة..." : "Adding...") : (ar ? "إضافة" : "Add")}
        submitLoading={busy}
        onSubmit={createHook}
        wide
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: C.t2, marginBottom: 4 }}>URL</label>
            <input
              value={hookForm.url}
              onChange={(e) => setHookForm({ ...hookForm, url: e.target.value })}
              placeholder="https://api.your-system.com/webhook"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 13, direction: "ltr" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: C.t2, marginBottom: 6 }}>
              {ar ? "الأحداث" : "Events"}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {WEBHOOK_EVENTS.map((ev) => {
                const active = hookForm.events.includes(ev);
                return (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => setHookForm((prev) => ({
                      ...prev,
                      events: active ? prev.events.filter((e) => e !== ev) : [...prev.events, ev],
                    }))}
                    style={{
                      padding: "6px 12px", borderRadius: 8,
                      border: `1.5px solid ${active ? C.pri : C.brd}`,
                      background: active ? `${C.pri}12` : "transparent",
                      color: active ? C.pri : C.t2,
                      fontFamily: "monospace", fontSize: 11, fontWeight: active ? 600 : 500, cursor: "pointer",
                    }}
                  >
                    {active ? "✓ " : "+ "}{ev}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Show new webhook secret ── */}
      <Modal
        open={!!newHookResult}
        onClose={() => setNewHookResult(null)}
        title={ar ? "تم إضافة الويب هوك ✓" : "Webhook Added ✓"}
        submitLabel={ar ? "تمّ" : "Done"}
        onSubmit={() => setNewHookResult(null)}
      >
        {newHookResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "10px 12px", borderRadius: 10, background: `${C.warn}10`, border: `1px solid ${C.warn}30`, fontSize: 11.5, color: C.t2, lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ color: C.pri, display: "inline-flex", marginTop: 1, flexShrink: 0 }}><Icon name="sparkles" size={13} /></span>
              <span>{ar
                ? "احفظ السرّ التالي — تستخدمه للتحقّق من توقيع HMAC في الطلبات الواردة."
                : "Save this secret — use it to verify the HMAC signature on incoming requests."}</span>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: C.t2, marginBottom: 4 }}>
                {ar ? "السرّ (HMAC Secret)" : "HMAC Secret"}
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  readOnly
                  value={newHookResult.secret || ""}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: "monospace", fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => newHookResult.secret && copyToClipboard(newHookResult.secret)}
                  style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: C.pri, color: "#fff", fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  {ar ? "نسخ" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* API tester — lives at panel-root so any "Test" button on any
          key row, plus the post-create reveal modal, can pop it. */}
      <ApiTesterModal
        open={testerOpen}
        onClose={() => { setTesterOpen(false); setTesterKey(undefined); }}
        prefilledKey={testerKey}
      />
    </div>
  );
}
