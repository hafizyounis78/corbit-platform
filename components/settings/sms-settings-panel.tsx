"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useSmsConfig } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";
import api from "@/lib/api/client";

interface SmsConfig {
  connected: boolean;
  token_set: boolean;
  token_preview?: string;
  sender_name: string | null;
  is_active: boolean;
  balance: number | null;
  balance_at: string | null;
  last_test_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
  low_balance_threshold: number;
}

/**
 * SMS settings panel rendered inside /settings under its own tab.
 * Big balance card on top, then connection form. Inspired by the
 * schoolBit reference but with encrypted-token storage, masked
 * preview, and audit-logged config changes on the backend.
 */
export function SmsSettingsPanel() {
  const { colors: C, isDark: dk } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const { data, isLoading, mutate } = useSmsConfig();
  const config = data as SmsConfig | null;

  const [tokenInput, setTokenInput] = useState("");
  const [senderInput, setSenderInput] = useState("");
  const [availableSenders, setAvailableSenders] = useState<string[]>([]);
  const [previewBalance, setPreviewBalance] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<"test" | "save" | "refresh" | "toggle" | "disconnect" | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Hydrate sender input from saved config so the form doesn't blank
  // out the choice on every render. Token stays empty — we never
  // surface the saved value, only its masked preview.
  useEffect(() => {
    if (config?.sender_name) setSenderInput(config.sender_name);
  }, [config?.sender_name]);

  const probeOnly = useCallback(async () => {
    if (!tokenInput.trim() || tokenInput.length < 20) {
      showToast(isAr ? "ألصق التوكن أوّلاً (20 حرف على الأقلّ)" : "Paste a token first (min 20 chars)", "error");
      return;
    }
    setBusyAction("test");
    try {
      const res = await api.post("/sms/test", { token: tokenInput });
      const payload = res.data?.data ?? res.data;
      if (payload?.ok) {
        const senders = Array.isArray(payload.senders) ? payload.senders : [];
        setAvailableSenders(senders);
        setPreviewBalance(typeof payload.balance === "number" ? payload.balance : null);
        // Auto-pick the only sender if the API returned exactly one.
        if (senders.length === 1) setSenderInput(senders[0]);
        showToast(
          isAr ? `الاتصال ناجح ✓ الرصيد ${payload.balance ?? "—"}` : `Connection OK ✓ Balance ${payload.balance ?? "—"}`,
        );
      } else {
        showToast(payload?.error || (isAr ? "فشل التحقّق" : "Test failed"), "error");
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || (isAr ? "فشل التحقّق" : "Test failed"), "error");
    } finally {
      setBusyAction(null);
    }
  }, [tokenInput, isAr, showToast]);

  const saveAndVerify = useCallback(async () => {
    if (!tokenInput.trim()) {
      showToast(isAr ? "ألصق التوكن أوّلاً" : "Paste the token first", "error");
      return;
    }
    setBusyAction("save");
    try {
      await api.put("/sms/config", {
        token: tokenInput,
        sender_name: senderInput || null,
      });
      showToast(isAr ? "تمّ الحفظ والاتصال ✓" : "Saved + connected ✓");
      setTokenInput("");
      setEditMode(false);
      setAvailableSenders([]);
      setPreviewBalance(null);
      mutate();
    } catch (err: any) {
      showToast(err?.response?.data?.message || (isAr ? "فشل الحفظ" : "Save failed"), "error");
    } finally {
      setBusyAction(null);
    }
  }, [tokenInput, senderInput, isAr, showToast, mutate]);

  const refreshBalance = useCallback(async () => {
    setBusyAction("refresh");
    try {
      const res = await api.post("/sms/refresh-balance");
      const balance = res.data?.data?.balance;
      showToast(isAr ? `الرصيد محدّث: ${balance}` : `Balance refreshed: ${balance}`);
      mutate();
    } catch (err: any) {
      showToast(err?.response?.data?.message || (isAr ? "تعذّر التحديث" : "Refresh failed"), "error");
    } finally {
      setBusyAction(null);
    }
  }, [isAr, showToast, mutate]);

  const toggleActive = useCallback(async () => {
    if (!config) return;
    setBusyAction("toggle");
    try {
      await api.post("/sms/toggle", { active: !config.is_active });
      showToast(isAr ? "تمّ التحديث ✓" : "Updated ✓");
      mutate();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed", "error");
    } finally {
      setBusyAction(null);
    }
  }, [config, isAr, showToast, mutate]);

  const disconnect = useCallback(async () => {
    if (!confirm(isAr ? "تأكيد فصل حساب SMS؟ سيتمّ مسح التوكن المحفوظ." : "Disconnect SMS account? The saved token will be removed.")) return;
    setBusyAction("disconnect");
    try {
      await api.delete("/sms/config");
      showToast(isAr ? "تمّ الفصل" : "Disconnected");
      setTokenInput("");
      setSenderInput("");
      setEditMode(false);
      setAvailableSenders([]);
      mutate();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed", "error");
    } finally {
      setBusyAction(null);
    }
  }, [isAr, showToast, mutate]);

  if (isLoading) {
    return <div style={{ padding: 30, textAlign: "center", color: C.t3 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>;
  }

  const isConnected = !!config?.connected;
  const balance = config?.balance;
  const lowBalance = typeof balance === "number" && config && balance < config.low_balance_threshold;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: FONT_FAMILY }}>
      {/* ── Big balance card ── */}
      <Card style={{
        padding: 28,
        textAlign: "center",
        background: isConnected
          ? (lowBalance ? `linear-gradient(135deg, ${C.warn}15, ${C.warn}06)` : `linear-gradient(135deg, ${C.ok}15, ${C.ok}06)`)
          : C.inp,
        border: `1.5px solid ${isConnected ? (lowBalance ? C.warn : C.ok) : C.brd}40`,
        position: "relative",
      }}>
        {/* Connection dot */}
        <div style={{
          position: "absolute", top: 16, insetInlineStart: 16,
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 20,
          background: isConnected ? `${C.ok}15` : `${C.t3}15`,
          color: isConnected ? C.ok : C.t3,
          fontSize: 11.5, fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: isConnected ? C.ok : C.t3 }} />
          {isConnected ? (isAr ? "متّصل" : "Connected") : (isAr ? "غير متّصل" : "Not connected")}
        </div>

        {/* Refresh button */}
        {isConnected && (
          <button
            type="button"
            onClick={refreshBalance}
            disabled={busyAction === "refresh"}
            style={{
              position: "absolute", top: 16, insetInlineEnd: 16,
              padding: "5px 12px", borderRadius: 8,
              border: `1px solid ${C.brd}`, background: C.card,
              color: C.t2, fontFamily: FONT_FAMILY, fontSize: 11.5, fontWeight: 600,
              cursor: busyAction === "refresh" ? "wait" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}
          >
            {busyAction === "refresh" ? "..." : <Icon name="refresh" size={12} />} <span>{isAr ? "تحديث" : "Refresh"}</span>
          </button>
        )}

        <div style={{ fontSize: 12.5, color: C.t2, marginBottom: 6 }}>
          {isAr ? "رصيدك الحالي" : "Current Balance"}
        </div>
        <div style={{ fontSize: 42, fontWeight: 800, color: lowBalance ? C.warn : C.txt, fontFamily: "monospace" }}>
          {balance !== null && balance !== undefined ? Number(balance).toLocaleString() : "—"}
        </div>
        <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>
          {isAr ? "رسالة متبقّية" : "messages remaining"}
        </div>

        {lowBalance && (
          <div style={{
            marginTop: 14, padding: "8px 14px", borderRadius: 8,
            background: `${C.warn}15`, border: `1px solid ${C.warn}40`,
            fontSize: 12, color: C.warn, fontWeight: 600,
            display: "inline-block",
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Icon name="alert" size={13} />
              <span>{isAr ? `الرصيد تحت الحدّ المنخفض (${config?.low_balance_threshold} رسالة)` : `Balance below threshold (${config?.low_balance_threshold} messages)`}</span>
            </span>
          </div>
        )}

        {config?.balance_at && (
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 8 }}>
            {isAr ? "آخر تحديث: " : "Last updated: "}
            {new Date(config.balance_at).toLocaleString(isAr ? "ar-SA" : "en-US")}
          </div>
        )}
      </Card>

      {/* ── Provider config card ── */}
      <Card style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ color: C.pri, display: "inline-flex" }}><Icon name="key" size={20} /></span>
          <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700 }}>
            {isAr ? "بيانات مزوّد SMS" : "SMS Provider Settings"}
          </h3>
          {config?.token_set && !editMode && (
            <span style={{ fontSize: 11, color: C.ok, fontWeight: 600, marginInlineStart: "auto" }}>
              ✓ {isAr ? "محفوظ" : "Saved"}
            </span>
          )}
        </div>

        {/* Saved-state view: token masked + edit/disconnect */}
        {config?.token_set && !editMode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11.5, color: C.t2, display: "block", marginBottom: 4 }}>
                {isAr ? "Token (مزوّد SMS)" : "SMS Provider Token"}
              </label>
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: C.inp, border: `1px solid ${C.brd}`,
                fontFamily: "monospace", fontSize: 13, color: C.t2,
                direction: "ltr",
              }}>
                {config.token_preview || "•••••••• ••••"}
              </div>
            </div>

            {config.sender_name && (
              <div>
                <label style={{ fontSize: 11.5, color: C.t2, display: "block", marginBottom: 4 }}>
                  {isAr ? "اسم المرسِل (Sender Name)" : "Sender Name"}
                </label>
                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: C.inp, border: `1px solid ${C.brd}`,
                  fontSize: 13, fontWeight: 600,
                }}>
                  {config.sender_name}
                </div>
              </div>
            )}

            {/* Active toggle */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: 12, borderRadius: 10, background: C.inp,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                  {isAr ? "تفعيل الإرسال" : "Enable sending"}
                </div>
                <div style={{ fontSize: 11, color: C.t2 }}>
                  {isAr ? "إيقافها يحفظ الإعدادات لكن يمنع الإرسال" : "Pauses sending without losing the saved config"}
                </div>
              </div>
              <Toggle
                on={!!config.is_active}
                onToggle={toggleActive}
              />
            </div>

            {/* Last test result */}
            {config.last_test_at && (
              <div style={{
                padding: 10, borderRadius: 8,
                background: config.last_test_ok ? `${C.ok}10` : `${C.err}10`,
                border: `1px solid ${config.last_test_ok ? C.ok : C.err}25`,
                fontSize: 11.5, color: config.last_test_ok ? C.ok : C.err,
              }}>
                {config.last_test_ok ? "✓" : <Icon name="alert" size={11} />} {isAr ? "آخر اختبار: " : "Last test: "}
                {new Date(config.last_test_at).toLocaleString(isAr ? "ar-SA" : "en-US")}
                {!config.last_test_ok && config.last_test_message && (
                  <div style={{ marginTop: 4 }}>{config.last_test_message}</div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button outline onClick={() => { setEditMode(true); setTokenInput(""); }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Icon name="pencil" size={13} />
                  <span>{isAr ? "تعديل التوكن" : "Edit Token"}</span>
                </span>
              </Button>
              <Button
                outline
                onClick={disconnect}
                style={{ color: C.err, borderColor: C.err }}
              >
                {busyAction === "disconnect" ? "..." : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Icon name="plug" size={13} />
                    <span>{isAr ? "فصل الحساب" : "Disconnect"}</span>
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Edit / first-connect form */}
        {(!config?.token_set || editMode) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, color: C.t2, display: "block", marginBottom: 4 }}>
                {isAr ? "Token (من بوّابة mobile.net.sa)" : "Token (from mobile.net.sa portal)"}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder={isAr ? "ألصق التوكن هنا..." : "Paste your token here..."}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 10,
                    border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
                    fontFamily: "monospace", fontSize: 13, outline: "none", direction: "ltr",
                  }}
                />
                <Button
                  primary
                  onClick={probeOnly}
                  disabled={busyAction === "test"}
                  style={{ background: C.info, borderColor: C.info }}
                >
                  {busyAction === "test" ? "..." : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Icon name="search" size={13} />
                      <span>{isAr ? "فحص" : "Test"}</span>
                    </span>
                  )}
                </Button>
              </div>
              <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
                ⓘ {isAr ? "اضغط فحص للتحقّق من التوكن قبل الحفظ. سيتمّ جلب الرصيد وقائمة المرسِلين تلقائيّاً." : "Click Test to verify before saving. Balance + sender list auto-loaded."}
              </div>
            </div>

            {/* Sender dropdown — populated from probe response */}
            {availableSenders.length > 0 && (
              <div>
                <label style={{ fontSize: 11.5, color: C.t2, display: "block", marginBottom: 4 }}>
                  {isAr ? `اسم المرسِل (${availableSenders.length} متاح من API)` : `Sender Name (${availableSenders.length} available from API)`}
                </label>
                <select
                  value={senderInput}
                  onChange={(e) => setSenderInput(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
                    fontFamily: FONT_FAMILY, fontSize: 13, outline: "none",
                  }}
                >
                  <option value="">{isAr ? "اختر مرسِل" : "Pick a sender"}</option>
                  {availableSenders.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Manual sender entry when probe didn't return any */}
            {availableSenders.length === 0 && (
              <div>
                <label style={{ fontSize: 11.5, color: C.t2, display: "block", marginBottom: 4 }}>
                  {isAr ? "اسم المرسِل (Sender Name)" : "Sender Name"}
                </label>
                <input
                  value={senderInput}
                  onChange={(e) => setSenderInput(e.target.value)}
                  placeholder={isAr ? "مثال: BarakahRest" : "e.g. BarakahRest"}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
                    fontFamily: FONT_FAMILY, fontSize: 13, outline: "none",
                  }}
                />
                <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
                  ⓘ {isAr ? "يجب أن يكون معتمَداً من CITC و mobile.net.sa." : "Must be approved by CITC and mobile.net.sa."}
                </div>
              </div>
            )}

            {/* Preview balance after probe */}
            {previewBalance !== null && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: `${C.ok}10`, border: `1px solid ${C.ok}25`,
                fontSize: 12, color: C.ok, fontWeight: 600,
              }}>
                ✓ {isAr ? `الرصيد المتوقّع بعد الحفظ: ${previewBalance.toLocaleString()} ر.س` : `Verified balance: ${previewBalance.toLocaleString()} SAR`}
              </div>
            )}

            {/* Save button */}
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                primary
                onClick={saveAndVerify}
                disabled={busyAction === "save" || !tokenInput.trim()}
                style={{ flex: 1, justifyContent: "center" }}
              >
                {busyAction === "save"
                  ? (isAr ? "...جاري الحفظ" : "Saving...")
                  : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Icon name="check" size={14} />
                      <span>{isAr ? "حفظ وتحقّق من الاتصال" : "Save + Verify"}</span>
                    </span>
                  )}
              </Button>
              {editMode && (
                <Button outline onClick={() => { setEditMode(false); setTokenInput(""); }}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── Help / how to get a token ── */}
      <Card style={{ padding: 16, background: `${C.info}08`, border: `1px solid ${C.info}25` }}>
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.7 }}>
          <strong style={{ color: C.info, display: "inline-flex", alignItems: "center", gap: 4, marginInlineEnd: 4 }}>
            <Icon name="sparkles" size={13} />
            <span>{isAr ? "تحتاج توكن جديد؟" : "Need a token?"}</span>
          </strong>{" "}
          {isAr
            ? "ادخل بوّابة mobile.net.sa، أنشئ API Token، وفعّل كلّ الصلاحيّات (send, send-bulk, get-balance, get-message-status, get-sender-name)."
            : "Log into the mobile.net.sa portal, create an API Token, and enable all abilities (send, send-bulk, get-balance, get-message-status, get-sender-name)."}
          <br />
          {isAr
            ? "إذا ما عندك حساب، تواصل مع فريق Corbit وسنساعدك."
            : "No account yet? Contact the Corbit team for help."}
        </div>
      </Card>
    </div>
  );
}
