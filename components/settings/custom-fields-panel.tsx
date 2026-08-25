"use client";

import { useState } from "react";
import { Card, Button, Modal, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useCustomFields } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";
import api from "@/lib/api/client";
import type { CustomFieldDef } from "@/components/contacts/custom-field-inputs";

const TYPES = [
  { key: "text",     ar: "نصّ",            en: "Text" },
  { key: "textarea", ar: "نصّ طويل",       en: "Long text" },
  { key: "number",   ar: "رقم",            en: "Number" },
  { key: "date",     ar: "تاريخ",          en: "Date" },
  { key: "select",   ar: "قائمة اختيارات", en: "Dropdown" },
  { key: "phone",    ar: "هاتف",           en: "Phone" },
  { key: "email",    ar: "بريد إلكتروني",  en: "Email" },
  { key: "url",      ar: "رابط",           en: "URL" },
];

interface FormState {
  id: string;
  label: string;
  label_en: string;
  type: string;
  options: string;
  is_required: boolean;
  show_in_list: boolean;
}

const EMPTY: FormState = {
  id: "", label: "", label_en: "", type: "text",
  options: "", is_required: false, show_in_list: false,
};

/**
 * Settings tab where an admin adds the fields their business actually
 * uses — company name, department, follow-up date — without waiting on
 * a release.
 *
 * The field's machine key is derived from the label on the backend and
 * is immutable afterwards; the label is what an admin edits when they
 * want different wording, so the key is shown read-only as a reminder
 * that message placeholders point at it.
 */
export function CustomFieldsPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const { data, mutate, isLoading } = useCustomFields();
  const fields: CustomFieldDef[] = Array.isArray(data) ? data : [];

  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CustomFieldDef | null>(null);

  const startCreate = () => setForm({ ...EMPTY });
  const startEdit = (f: CustomFieldDef) => setForm({
    id: f.id || "",
    label: f.label,
    label_en: f.labelEn || "",
    type: f.type,
    options: (f.options || []).join("، "),
    is_required: !!f.required,
    show_in_list: !!f.showInList,
  });

  const typeLabel = (key: string) => {
    const t = TYPES.find((x) => x.key === key);
    return t ? (isAr ? t.ar : t.en) : key;
  };

  const handleSave = async () => {
    if (!form) return;
    const label = form.label.trim();
    if (!label) {
      showToast(isAr ? "أدخل اسم الحقل" : "Enter a field name", "error");
      return;
    }

    // Options accept both an Arabic comma and a Latin one — operators
    // type whichever their keyboard is on.
    const options = form.type === "select"
      ? form.options.split(/[,،]/).map((o) => o.trim()).filter(Boolean)
      : [];

    if (form.type === "select" && options.length === 0) {
      showToast(isAr ? "أضف خيارًا واحدًا على الأقلّ للقائمة" : "Add at least one option", "error");
      return;
    }

    const payload = {
      label,
      label_en: form.label_en.trim() || null,
      type: form.type,
      options,
      is_required: form.is_required,
      show_in_list: form.show_in_list,
    };

    setBusy(true);
    try {
      if (form.id) {
        await api.patch(`/custom-fields/${form.id}`, payload);
        showToast(isAr ? "تمّ التحديث" : "Updated");
      } else {
        await api.post(`/custom-fields`, payload);
        showToast(isAr ? "تمّت إضافة الحقل" : "Field added");
      }
      setForm(null);
      mutate();
    } catch (e: any) {
      const d = e?.response?.data;
      const fieldError = d?.errors && Object.values(d.errors as Record<string, string[]>)[0]?.[0];
      showToast(fieldError || d?.message || (isAr ? "فشل الحفظ" : "Save failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete?.id) return;
    setBusy(true);
    try {
      await api.delete(`/custom-fields/${pendingDelete.id}`);
      showToast(isAr ? "تمّ حذف الحقل" : "Field deleted");
      setPendingDelete(null);
      mutate();
    } catch {
      showToast(isAr ? "تعذّر الحذف" : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: `1px solid ${C.brd}`, background: C.card,
    color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY,
    boxSizing: "border-box" as const,
  };

  return (
    <Card style={{ padding: 20, marginBottom: 16, fontFamily: FONT_FAMILY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="list" size={15} />
            <span>{isAr ? "حقول جهات الاتصال" : "Contact fields"}</span>
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: C.t2, lineHeight: 1.6 }}>
            {isAr
              ? "أضف الحقول التي يحتاجها عملك — اسم الشركة، القسم، تاريخ المتابعة — وستظهر في نموذج جهة الاتصال لكلّ الوكلاء."
              : "Add the fields your business needs — company, department, follow-up date — and they appear on the contact form for every agent."}
          </p>
        </div>
        {!form && (
          <Button primary onClick={startCreate}>
            <Icon name="plus" size={12} />
            {isAr ? " إضافة حقل" : " Add field"}
          </Button>
        )}
      </div>

      {form && (
        <Card style={{ padding: 14, marginBottom: 14, background: C.inp, border: `1px dashed ${C.brd}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                {isAr ? "اسم الحقل (عربي)" : "Field name (Arabic)"}
              </label>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                maxLength={120}
                placeholder={isAr ? "مثال: اسم الشركة" : "e.g. اسم الشركة"}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                {isAr ? "الاسم بالإنجليزي (اختياري)" : "English name (optional)"}
              </label>
              <input
                value={form.label_en}
                onChange={(e) => setForm({ ...form, label_en: e.target.value })}
                maxLength={120}
                placeholder="Company"
                dir="ltr"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                {isAr ? "النوع" : "Type"}
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{isAr ? t.ar : t.en}</option>
                ))}
              </select>
            </div>
            {form.type === "select" && (
              <div>
                <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                  {isAr ? "الخيارات (مفصولة بفاصلة)" : "Options (comma separated)"}
                </label>
                <input
                  value={form.options}
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                  placeholder={isAr ? "المبيعات، الدعم، المحاسبة" : "Sales, Support, Finance"}
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: C.t2 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.is_required}
                  onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
                />
                {isAr ? "مطلوب عند الإضافة" : "Required on create"}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.show_in_list}
                  onChange={(e) => setForm({ ...form, show_in_list: e.target.checked })}
                />
                {isAr ? "إظهار في الجدول" : "Show in table"}
              </label>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button onClick={() => setForm(null)} disabled={busy}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button primary onClick={handleSave} disabled={busy}>
                {busy ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
              </Button>
            </div>
          </div>

          {form.is_required && (
            <p style={{ margin: "10px 0 0", fontSize: 11.5, color: C.t3, lineHeight: 1.6 }}>
              {isAr
                ? "«مطلوب» يسري على نموذج إضافة جهة الاتصال فقط — العملاء الذين يراسلونك على الواتساب يُضافون دائمًا دون أي شرط."
                : "\"Required\" applies to the contact form only — customers who message you on WhatsApp are always added regardless."}
            </p>
          )}
        </Card>
      )}

      {isLoading ? (
        <p style={{ fontSize: 12.5, color: C.t2 }}>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
      ) : fields.length === 0 ? (
        <div style={{ padding: "26px 10px", textAlign: "center", fontSize: 12.5, color: C.t2 }}>
          {isAr ? "لا توجد حقول مخصّصة بعد" : "No custom fields yet"}
        </div>
      ) : (
        fields.map((f) => (
          <div
            key={f.key}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 8,
              background: C.inp, marginBottom: 6,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>
                {f.label}
                {f.required && (
                  <span style={{ marginInlineStart: 6 }}>
                    <Badge color={C.warn}>{isAr ? "مطلوب" : "Required"}</Badge>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.t3, direction: "ltr", textAlign: isAr ? "right" : "left" }}>
                {typeLabel(f.type)} · {`{{${f.key}}}`}
              </div>
            </div>
            <Button onClick={() => startEdit(f)}>
              <Icon name="pencil" size={12} />
            </Button>
            <Button onClick={() => setPendingDelete(f)}>
              <Icon name="trash" size={12} />
            </Button>
          </div>
        ))
      )}

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={isAr ? "حذف الحقل" : "Delete field"}
        submitLabel={isAr ? "حذف" : "Delete"}
        onSubmit={handleDelete}
        submitDisabled={busy}
        submitLoading={busy}
      >
        <p style={{ fontSize: 13, color: C.txt, lineHeight: 1.8, margin: 0 }}>
          {isAr
            ? `سيُحذف الحقل «${pendingDelete?.label}» مع كلّ القيم المخزّنة فيه لدى جميع جهات الاتصال. لا يمكن التراجع.`
            : `The field "${pendingDelete?.label}" and every value stored in it across all contacts will be deleted. This cannot be undone.`}
        </p>
      </Modal>
    </Card>
  );
}
