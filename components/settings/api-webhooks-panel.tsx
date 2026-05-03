"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, Badge, Modal, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api/client";

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

  // New-key modal
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyResult, setNewKeyResult] = useState<ApiKey | null>(null);
  const [busy, setBusy] = useState(false);

  // New-webhook modal
  const [showNewHook, setShowNewHook] = useState(false);
  const [hookForm, setHookForm] = useState<{ url: string; events: string[] }>({ url: "", events: [] });
  const [newHookResult, setNewHookResult] = useState<Webhook | null>(null);

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
          <Button primary small onClick={() => setShowNewKey(true)}>+ {ar ? "إنشاء مفتاح" : "Generate"}</Button>
        </div>
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
                <div style={{ display: "flex", gap: 6 }}>
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
          <Button primary small onClick={() => setShowNewHook(true)}>+ {ar ? "إضافة" : "Add"}</Button>
        </div>
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
                    🧪 {ar ? "اختبار" : "Test"}
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
          <div style={{ padding: "10px 12px", borderRadius: 10, background: `${C.warn}10`, border: `1px solid ${C.warn}25`, fontSize: 11.5, color: C.t2, lineHeight: 1.6 }}>
            ⚠️ {ar
              ? "ستُعرض القيمة الكاملة مرّة واحدة فقط بعد الإنشاء. احفظها في مكان آمن — لا يمكن استرجاعها لاحقاً."
              : "The full key value is shown once on creation. Store it somewhere safe — it can't be retrieved later."}
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
            <div style={{ padding: "10px 12px", borderRadius: 10, background: `${C.err}10`, border: `1px solid ${C.err}30`, fontSize: 11.5, color: C.err, fontWeight: 600 }}>
              ⚠️ {ar
                ? "هذه آخر مرّة ترى فيها القيمة الكاملة. انسخها الآن!"
                : "This is the last time the full value is visible. Copy it now!"}
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
            <div style={{ padding: "10px 12px", borderRadius: 10, background: `${C.warn}10`, border: `1px solid ${C.warn}30`, fontSize: 11.5, color: C.t2, lineHeight: 1.6 }}>
              💡 {ar
                ? "احفظ السرّ التالي — تستخدمه للتحقّق من توقيع HMAC في الطلبات الواردة."
                : "Save this secret — use it to verify the HMAC signature on incoming requests."}
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
    </div>
  );
}
