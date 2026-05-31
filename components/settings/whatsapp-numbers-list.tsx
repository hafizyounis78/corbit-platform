"use client";

/**
 * Multi-WhatsApp-numbers panel.
 *
 * Surfaces ONLY when the org's plan allows more than one number
 * (Enterprise = 5). On lower tiers the panel hides itself — the
 * single-number connection lives in <WhatsAppConnect/> above and
 * showing an empty "Additional numbers" panel would just confuse.
 *
 * Backed by the three endpoints the gate work in da8c065 / f369f4e
 * built on top of:
 *
 *   GET    /api/settings/whatsapp/numbers
 *   POST   /api/settings/whatsapp/numbers     ← plan-gated
 *   DELETE /api/settings/whatsapp/numbers/{id}
 *
 * The POST path is double-guarded: the "+ Add number" button only
 * renders when usage < limit, AND the backend rejects with a
 * structured 403 if the gate fires anyway (race / stale UI). The
 * rejection message is rendered verbatim in the toast.
 */

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { usePlanUsage } from "@/lib/api/hooks";
import api from "@/lib/api/client";

type WhatsappNumber = {
  id: string;
  phone_number: string;
  display_name: string;
  display_name_ar?: string | null;
  is_verified: boolean;
  status: string;
};

export function WhatsAppNumbersList() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const { data: planData } = usePlanUsage();

  // Plan gate — Basic/Starter/Business cap at 1, only Enterprise
  // gets multi-number. Hide the whole panel below the threshold
  // so the page doesn't look broken for the 99% case.
  const limit = (planData?.limits?.max_whatsapp_numbers as number | undefined) ?? 1;
  const showPanel = limit === -1 || limit > 1;

  const [numbers, setNumbers] = useState<WhatsappNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Confirm-delete uses a custom Modal (matches the rest of the UI)
  // instead of window.confirm — browser dialogs break theming and
  // were ruled out as a UX standard.
  const [confirmDelete, setConfirmDelete] = useState<WhatsappNumber | null>(null);
  const [form, setForm] = useState({ phone_number: "", display_name: "", display_name_ar: "" });

  const used = numbers.length;
  const remaining = limit === -1 ? Infinity : Math.max(0, limit - used);
  const canAdd = remaining > 0;

  const reset = () => setForm({ phone_number: "", display_name: "", display_name_ar: "" });

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/whatsapp/numbers');
      setNumbers((res.data?.data || []) as WhatsappNumber[]);
    } catch (e: any) {
      // List failure isn't a blocker for the rest of the settings
      // page; surface as a toast and leave the table empty.
      showToast(isAr ? "تعذّر تحميل الأرقام" : "Failed to load numbers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showPanel) fetchNumbers();
  }, [showPanel]);

  const handleAdd = async () => {
    if (!form.phone_number.trim() || !form.display_name.trim()) {
      showToast(
        isAr ? "أدخل الرقم والاسم التعريفي" : "Enter phone number and display name",
        "error"
      );
      return;
    }
    setAdding(true);
    try {
      await api.post('/settings/whatsapp/numbers', {
        phone_number: form.phone_number.trim(),
        display_name: form.display_name.trim(),
        display_name_ar: form.display_name_ar.trim() || undefined,
      });
      showToast(isAr ? "تمّت إضافة الرقم" : "Number added", "success");
      setShowAdd(false);
      reset();
      fetchNumbers();
    } catch (e: any) {
      // Backend gate (PLAN_LIMIT_EXCEEDED) returns 403 with an Arabic
      // message — surface it as-is so the user sees the same wording
      // wherever the limit hits.
      const msg = e?.response?.data?.message || e?.message || "Add failed";
      showToast(msg, "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setDeletingId(id);
    try {
      await api.delete(`/settings/whatsapp/numbers/${id}`);
      showToast(isAr ? "تمّ الحذف" : "Deleted", "success");
      setConfirmDelete(null);
      fetchNumbers();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Delete failed";
      showToast(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (!showPanel) return null;

  return (
    <Card style={{ padding: 20, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="phone" size={15} />
              <span>{isAr ? "الأرقام الإضافيّة" : "Additional numbers"}</span>
            </span>
          </h3>
          <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>
            {isAr
              ? `الباقة تسمح بـ ${limit === -1 ? "عدد غير محدود" : limit} أرقام. مستخدم ${used}.`
              : `Plan allows ${limit === -1 ? "unlimited" : limit} numbers. ${used} used.`}
          </p>
        </div>
        <Button
          primary
          disabled={!canAdd}
          onClick={() => { reset(); setShowAdd(true); }}
        >
          {isAr ? "إضافة رقم" : "Add number"}
        </Button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: C.t2 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
      ) : numbers.length === 0 ? (
        <div style={{ fontSize: 13, color: C.t2, padding: 12, background: C.bg, borderRadius: 8 }}>
          {isAr ? "لا توجد أرقام بعد." : "No numbers yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {numbers.map((n) => (
            <div
              key={n.id}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                padding: 12, borderRadius: 8, border: `1px solid ${C.brd}`, flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 13.5, color: C.txt }}>
                    {(isAr && n.display_name_ar) || n.display_name}
                  </strong>
                  <Badge color={n.status === "active" ? "#10b981" : "#f59e0b"}>
                    {n.status === "active"
                      ? (isAr ? "نشط" : "Active")
                      : (isAr ? "غير نشط" : "Inactive")}
                  </Badge>
                  {n.is_verified && (
                    <Badge color="#3b82f6">{isAr ? "موثّق" : "Verified"}</Badge>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.t2, fontFamily: "monospace", direction: "ltr" }}>
                  +{n.phone_number}
                </div>
              </div>
              <Button
                onClick={() => setConfirmDelete(n)}
                disabled={deletingId === n.id}
              >
                {deletingId === n.id
                  ? (isAr ? "جاري الحذف..." : "Deleting...")
                  : (isAr ? "حذف" : "Delete")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); reset(); }}
        title={isAr ? "إضافة رقم واتساب" : "Add WhatsApp Number"}
        submitLabel={adding ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة" : "Add")}
        onSubmit={handleAdd}
        submitLoading={adding}
        submitDisabled={adding}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field
            label={isAr ? "رقم الجوال" : "Phone Number"}
            required
            helper={isAr ? "بدون + أو 00 (مثال: 966500000000)" : "Without + or 00 (e.g. 966500000000)"}
          >
            <input
              type="text"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="966500000000"
              style={inputStyle(C)}
            />
          </Field>
          <Field
            label={isAr ? "الاسم التعريفي (إنجليزي)" : "Display Name (English)"}
            required
          >
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="Sales Team"
              style={inputStyle(C)}
            />
          </Field>
          <Field
            label={isAr ? "الاسم التعريفي (عربي) — اختياري" : "Display Name (Arabic) — optional"}
          >
            <input
              type="text"
              value={form.display_name_ar}
              onChange={(e) => setForm({ ...form, display_name_ar: e.target.value })}
              placeholder={isAr ? "فريق المبيعات" : "فريق المبيعات"}
              style={inputStyle(C)}
            />
          </Field>
          <div style={{ fontSize: 11.5, color: C.t2, padding: 10, background: C.bg, borderRadius: 8, lineHeight: 1.7 }}>
            {isAr
              ? "ملاحظة: الإضافة هنا تسجّل الرقم في حسابك. اكتمال الربط مع Meta + 360dialog يتمّ عبر فريق Corbit (لا تنشأ مفاتيح API تلقائياً)."
              : "Note: adding the number registers it on your account. Full Meta + 360dialog provisioning is completed by the Corbit team (no API keys are auto-generated)."}
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={isAr ? "تأكيد حذف الرقم" : "Confirm Delete Number"}
        submitLabel={
          deletingId
            ? (isAr ? "جاري الحذف..." : "Deleting...")
            : (isAr ? "نعم، احذف" : "Yes, delete")
        }
        onSubmit={handleDelete}
        submitLoading={deletingId !== null}
        submitDisabled={deletingId !== null}
      >
        <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.7 }}>
          {isAr ? (
            <>
              سيتمّ حذف الرقم{" "}
              <strong style={{ fontFamily: "monospace", direction: "ltr", display: "inline-block" }}>
                +{confirmDelete?.phone_number}
              </strong>{" "}
              ({(confirmDelete && (confirmDelete.display_name_ar || confirmDelete.display_name)) ?? ""}).
              ستتوقّف Corbit عن استقبال الرسائل عليه. تاريخ المحادثات يظلّ محفوظاً وتقدر تربطه مرّة ثانية لاحقاً.
            </>
          ) : (
            <>
              The number{" "}
              <strong style={{ fontFamily: "monospace" }}>+{confirmDelete?.phone_number}</strong>{" "}
              ({confirmDelete?.display_name}) will be removed. Corbit will stop receiving messages for it.
              Conversation history is kept and you can reconnect it later.
            </>
          )}
        </div>
      </Modal>
    </Card>
  );
}

function Field({
  label, required, helper, children,
}: { label: string; required?: boolean; helper?: string; children: React.ReactNode }) {
  const { colors: C } = useTheme();
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
      {helper && (
        <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>{helper}</div>
      )}
    </div>
  );
}

function inputStyle(C: any): React.CSSProperties {
  return {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
    fontSize: 13, outline: "none",
  };
}
