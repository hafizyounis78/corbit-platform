"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Toggle } from "@/components/ui";
import { useCsatSettings } from "@/lib/api/hooks";
import api from "@/lib/api/client";

type Template = { id: string; name: string; language: string; category?: string };

/**
 * Customer Satisfaction settings.
 *
 * Three knobs:
 *   - enabled: master toggle. Off = no surveys ever go out.
 *   - template_name + template_lang: which approved Meta template
 *     fires as the survey. Drop-down populated from the org's own
 *     approved templates list (returned by the same endpoint so we
 *     don't double-fetch).
 *   - auto_send_on_resolve: when on, agent clicking "إغلاق" auto-
 *     sends the survey. When off, the agent has to click the manual
 *     "request CSAT" button. Both paths share the same idempotency
 *     window so toggling between them never causes double-sends.
 *
 * The frontend warns when enabled=true with no template selected —
 * the backend won't 422 (a partial config saves fine), but the
 * survey would silently never fire, so we surface that here.
 */
export function CsatSettingsPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const { data: resp, mutate } = useCsatSettings();

  const data = (resp as any)?.data ?? resp;
  const approvedTemplates: Template[] = data?.approved_templates ?? [];

  const [enabled, setEnabled] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateLang, setTemplateLang] = useState("ar");
  const [autoSend, setAutoSend] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(!!data.enabled);
    setTemplateName(data.template_name ?? "");
    setTemplateLang(data.template_lang ?? "ar");
    setAutoSend(data.auto_send_on_resolve !== false);
  }, [data]);

  const onTemplateChange = (id: string) => {
    const tmpl = approvedTemplates.find((t) => t.id === id);
    if (tmpl) {
      setTemplateName(tmpl.name);
      setTemplateLang(tmpl.language || "ar");
    } else {
      setTemplateName("");
    }
  };

  const selectedId = approvedTemplates.find((t) => t.name === templateName)?.id ?? "";
  const enabledWithoutTemplate = enabled && !templateName;

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/settings/csat", {
        enabled,
        template_name: templateName || null,
        template_lang: templateLang || "ar",
        auto_send_on_resolve: autoSend,
      });
      showToast(isAr ? "تمّ حفظ إعدادات التقييم" : "CSAT settings saved");
      mutate();
    } catch {
      showToast(isAr ? "تعذّر الحفظ، حاول لاحقاً" : "Save failed, please retry", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>
          {isAr ? "تقييم العملاء (CSAT)" : "Customer Satisfaction (CSAT)"}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>
          ⭐ {isAr ? "إعدادات استبيان التقييم" : "Satisfaction survey settings"}
        </div>
        <div style={{ fontSize: 12, color: C.t2, marginTop: 6, lineHeight: 1.6 }}>
          {isAr
            ? "بعد إغلاق المحادثة، يُرسَل قالب واتساب معتمد للعميل بأزرار تقييم 1-5. ردّ العميل يُسجَّل تلقائياً في customer_score ويظهر في تقارير الفريق."
            : "When a conversation is resolved, an approved WhatsApp template is sent to the customer with 1–5 rating buttons. Their reply is captured automatically and surfaced in team reports."}
        </div>
      </div>

      {/* Master toggle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.brd}`,
        marginBottom: 14,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>
            {isAr ? "تفعيل ميزة التقييم" : "Enable CSAT"}
          </div>
          <div style={{ fontSize: 11, color: C.t3 }}>
            {isAr ? "إذا أُطفئت، لن يُرسَل أيّ استبيان" : "When off, no surveys are ever sent"}
          </div>
        </div>
        <Toggle on={enabled} onToggle={() => setEnabled(!enabled)} />
      </div>

      {/* Template picker */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
          {isAr ? "قالب التقييم" : "CSAT Template"}
        </label>
        <select
          value={selectedId}
          onChange={(e) => onTemplateChange(e.target.value)}
          disabled={!enabled}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: `1px solid ${enabledWithoutTemplate ? "#f59e0b" : C.brd}`,
            background: C.inp, color: C.txt, fontSize: 13,
            opacity: enabled ? 1 : 0.55,
          }}
        >
          <option value="">
            {approvedTemplates.length === 0
              ? (isAr ? "لا توجد قوالب معتمدة بعد" : "No approved templates yet")
              : (isAr ? "اختر قالباً معتمداً..." : "Select an approved template...")}
          </option>
          {approvedTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.language}
              {t.category ? ` · ${t.category}` : ""}
            </option>
          ))}
        </select>
        {enabledWithoutTemplate && (
          <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>
            ⚠️ {isAr
              ? "الميزة مفعّلة بدون قالب — لن يُرسَل أيّ استبيان حتى تختار قالباً."
              : "Feature is on but no template selected — no surveys will be sent."}
          </div>
        )}
        <div style={{ fontSize: 11, color: C.t3, marginTop: 6, lineHeight: 1.6 }}>
          {isAr
            ? "💡 يجب أن يحتوي القالب على Quick-Reply buttons بأرقام 1-5 (أو يحوي نصّ يبدأ بـ 1-5). المُحلّل يلتقط أول رقم 1-5 في ردّ العميل."
            : "💡 The template should have Quick-Reply buttons labelled 1–5 (or text starting with 1–5). The parser picks up the first 1–5 digit in the customer's reply."}
        </div>
      </div>

      {/* Auto-send toggle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.brd}`,
        opacity: enabled ? 1 : 0.55,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>
            {isAr ? "إرسال تلقائي عند إغلاق المحادثة" : "Auto-send on resolve"}
          </div>
          <div style={{ fontSize: 11, color: C.t3 }}>
            {isAr
              ? "حين الوكيل يضغط 'إغلاق'، يُرسَل الاستبيان فوراً. الإيقاف يجعل الإرسال يدوياً فقط."
              : "When the agent resolves a conversation, fire the survey immediately. Off = manual send only."}
          </div>
        </div>
        <Toggle on={autoSend} onToggle={() => setAutoSend(!autoSend)} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Button primary onClick={save} disabled={saving}>
          {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
        </Button>
      </div>
    </Card>
  );
}
