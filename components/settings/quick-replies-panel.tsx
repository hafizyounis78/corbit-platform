"use client";

import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useQuickReplies } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";
import api from "@/lib/api/client";

type QuickReply = {
  id: string;
  text: string | null;
  text_ar: string | null;
  category: string | null;
};

const CATEGORIES = [
  { key: "greeting",  label_ar: "ترحيب",       label_en: "Greeting" },
  { key: "thanks",    label_ar: "شكر",         label_en: "Thanks" },
  { key: "info",      label_ar: "معلومات",     label_en: "Info" },
  { key: "followup",  label_ar: "متابعة",      label_en: "Follow-up" },
  { key: "closing",   label_ar: "إغلاق",       label_en: "Closing" },
  { key: "other",     label_ar: "أخرى",        label_en: "Other" },
];

/**
 * Settings tab for managing the org's quick reply library. Admin
 * adds / edits / removes canned replies; every agent in the same
 * org sees the same list inside the inbox composer.
 *
 * Quick replies are PURELY internal text — they're pasted into the
 * agent's composer for the agent to edit before sending. They never
 * bypass Meta's 24h window or template rules; the inbox send path
 * still enforces all of those at dispatch time.
 */
export function QuickRepliesPanel() {
  const { colors: C, isDark: dk } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const { data, mutate, isLoading } = useQuickReplies();
  const replies: QuickReply[] = Array.isArray(data) ? data : [];

  const [form, setForm] = useState<QuickReply | null>(null);  // null = closed; otherwise edit-or-create form
  const [busy, setBusy] = useState(false);

  const startCreate = () => setForm({ id: "", text: "", text_ar: "", category: "other" });
  const startEdit = (r: QuickReply) => setForm({ ...r });
  const cancel = () => setForm(null);

  const handleSave = async () => {
    if (!form) return;
    const ar = (form.text_ar || "").trim();
    const en = (form.text || "").trim();
    if (!ar && !en) {
      showToast(isAr ? "أدخل النصّ بالعربي أو الإنجليزي على الأقلّ" : "Enter the reply text in Arabic or English at minimum", "error");
      return;
    }
    setBusy(true);
    try {
      if (form.id) {
        await api.patch(`/quick-replies/${form.id}`, {
          text: en,
          text_ar: ar,
          category: form.category,
        });
        showToast(isAr ? "تمّ التحديث" : "Updated");
      } else {
        await api.post(`/quick-replies`, {
          text: en || ar,  // backend requires text (English fallback to Arabic)
          text_ar: ar,
          category: form.category,
        });
        showToast(isAr ? "تمّ الإضافة" : "Added");
      }
      setForm(null);
      mutate();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? "فشل الحفظ" : "Save failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? "حذف هذا الردّ السريع؟" : "Delete this quick reply?")) return;
    try {
      await api.delete(`/quick-replies/${id}`);
      showToast(isAr ? "تمّ الحذف" : "Deleted");
      mutate();
    } catch (e: any) {
      showToast(isAr ? "فشل الحذف" : "Delete failed", "error");
    }
  };

  const catLabel = (key: string | null) => {
    const c = CATEGORIES.find((x) => x.key === key);
    return c ? (isAr ? c.label_ar : c.label_en) : "—";
  };

  return (
    <Card style={{ padding: 20, marginBottom: 16, fontFamily: FONT_FAMILY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="zap" size={15} />
            <span>{isAr ? "الردود السريعة" : "Quick Replies"}</span>
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: C.t2, lineHeight: 1.6 }}>
            {isAr
              ? "ردود محفوظة يلصقها الوكيل في صندوق الدردشة بضغطة. قابلة للتعديل قبل الإرسال."
              : "Saved snippets agents paste into the composer in one click. Editable before sending."}
          </p>
        </div>
        {!form && (
          <Button primary onClick={startCreate}>
            <Icon name="plus" size={12} />
            {isAr ? " إضافة ردّ" : " Add reply"}
          </Button>
        )}
      </div>

      {/* Edit / create form */}
      {form && (
        <Card style={{ padding: 14, marginBottom: 14, background: C.inp, border: `1px dashed ${C.brd}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                {isAr ? "النصّ بالعربي" : "Arabic text"}
              </label>
              <textarea
                value={form.text_ar || ""}
                onChange={(e) => setForm({ ...form, text_ar: e.target.value })}
                rows={3}
                maxLength={500}
                placeholder={isAr ? "مثال: أهلاً بك! كيف يمكنني مساعدتك؟" : "أهلاً بك! كيف يمكنني مساعدتك؟"}
                dir="rtl"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  border: `1px solid ${C.brd}`, background: C.card,
                  color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY,
                  resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                {isAr ? "النصّ بالإنجليزي (اختياري)" : "English text (optional)"}
              </label>
              <textarea
                value={form.text || ""}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={3}
                maxLength={500}
                placeholder="Welcome! How can I help?"
                dir="ltr"
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  border: `1px solid ${C.brd}`, background: C.card,
                  color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY,
                  resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                {isAr ? "الفئة" : "Category"}
              </label>
              <select
                value={form.category || "other"}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{
                  padding: "6px 10px", borderRadius: 8,
                  border: `1px solid ${C.brd}`, background: C.card,
                  color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY,
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{isAr ? c.label_ar : c.label_en}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button onClick={cancel} disabled={busy}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button primary onClick={handleSave} disabled={busy}>
                {busy ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 20, color: C.t2, fontSize: 13 }}>
          {isAr ? "جارٍ التحميل..." : "Loading..."}
        </div>
      ) : replies.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: C.t2, fontSize: 13, lineHeight: 1.7, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Icon name="inbox" size={20} />
          <span>{isAr
            ? "لا توجد ردود محفوظة بعد. اضغط 'إضافة ردّ' لتبدأ بناء مكتبة الفريق."
            : "No saved replies yet. Click 'Add reply' to start building the team library."}</span>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {replies.map((r) => (
            <div
              key={r.id}
              style={{
                padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${dk ? C.brd : "#E0DDD8"}`,
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 4, background: `${C.pri}15`, color: C.pri, fontWeight: 600 }}>
                    {catLabel(r.category)}
                  </span>
                </div>
                {r.text_ar && (
                  <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.6, direction: "rtl", textAlign: "right" }}>
                    {r.text_ar}
                  </div>
                )}
                {r.text && r.text !== r.text_ar && (
                  <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6, marginTop: 4, direction: "ltr" }}>
                    {r.text}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <Button small outline onClick={() => startEdit(r)}>
                  <Icon name="pencil" size={12} />
                </Button>
                <Button small outline onClick={() => handleDelete(r.id)}>
                  <Icon name="x" size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
