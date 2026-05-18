"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useAlertThresholds } from "@/lib/api/hooks";
import api from "@/lib/api/client";

type Channel = "whatsapp" | "sms" | "ai";

const CHANNEL_META: Record<Channel, { icon: string; labelAr: string; labelEn: string; hintAr: string; hintEn: string }> = {
  whatsapp: { icon: "msg",   labelAr: "واتساب", labelEn: "WhatsApp", hintAr: "كل رسائل واتساب مجتمعة (تسويق + خدمة + تحقق + دعم)", hintEn: "All WhatsApp messages combined (marketing + utility + auth + service)" },
  sms:      { icon: "phone", labelAr: "SMS",     labelEn: "SMS",      hintAr: "رسائل SMS فقط — مستقلة عن واتساب",                  hintEn: "SMS only — independent of WhatsApp" },
  ai:       { icon: "bot",   labelAr: "الذكاء",  labelEn: "AI",       hintAr: "ردود الذكاء الاصطناعي التلقائيّة",                   hintEn: "AI auto-replies" },
};

/**
 * Per-channel monthly spend alert configuration.
 *
 * Each channel has its own threshold field — never a single combined
 * "total spend" cap. Saving 0 (or empty) clears that channel's alert.
 * The channel-level thresholds match how the dashboard breaks down
 * spending: every channel its own line, no merging.
 */
export function SpendAlertsCard() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const { data: resp, mutate } = useAlertThresholds();

  const [values, setValues] = useState<Record<Channel, string>>({ whatsapp: "", sms: "", ai: "" });
  const [saving, setSaving] = useState(false);

  // Hydrate the form when the API responds. We render saved values as
  // plain numbers (not "0" for null) so an unset channel reads as
  // empty — visually obvious that no alert is configured.
  useEffect(() => {
    const data = (resp as any)?.data ?? resp;
    if (!data) return;
    setValues({
      whatsapp: data.whatsapp != null ? String(data.whatsapp) : "",
      sms:      data.sms      != null ? String(data.sms)      : "",
      ai:       data.ai       != null ? String(data.ai)       : "",
    });
  }, [resp]);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, number | null> = {};
      (["whatsapp", "sms", "ai"] as Channel[]).forEach((k) => {
        const raw = values[k].trim();
        body[k] = raw === "" ? null : Number(raw);
      });
      await api.put("/billing/alert-thresholds", body);
      showToast(isAr ? "تمّ حفظ حدود التنبيه" : "Alert thresholds saved");
      mutate();
    } catch {
      showToast(isAr ? "تعذّر الحفظ، حاول لاحقاً" : "Save failed, please retry", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>
          {isAr ? "تنبيهات الإنفاق الشهري" : "Monthly spend alerts"}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="bell" size={16} />
          <span>{isAr ? "حدّ تنبيه لكل قناة" : "Per-channel thresholds"}</span>
        </div>
        <div style={{ fontSize: 12, color: C.t2, marginTop: 6, lineHeight: 1.6 }}>
          {isAr
            ? "اضبط حدّاً مستقلاً لكل قناة. عند تجاوز الحدّ خلال الشهر، تصلك إشعار مرّة واحدة. لا خلط بين الواتساب وSMS والذكاء — كل قناة محسوبة منفصلة."
            : "Set an independent threshold per channel. When this-month spend crosses the limit you get one notification — once per channel per month. WhatsApp, SMS, and AI are never combined into one number."}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(["whatsapp", "sms", "ai"] as Channel[]).map((ch) => {
          const meta = CHANNEL_META[ch];
          return (
            <div key={ch} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}` }}>
              <div style={{ width: 32, textAlign: "center", color: C.pri, display: "flex", justifyContent: "center" }}><Icon name={meta.icon} size={22} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>{isAr ? meta.labelAr : meta.labelEn}</div>
                <div style={{ fontSize: 11, color: C.t3 }}>{isAr ? meta.hintAr : meta.hintEn}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={isAr ? "بدون حدّ" : "no limit"}
                  value={values[ch]}
                  onChange={(e) => setValues({ ...values, [ch]: e.target.value })}
                  style={{
                    width: 100, padding: "6px 10px", fontSize: 13,
                    border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
                    borderRadius: 8, outline: "none", textAlign: "center",
                  }}
                />
                <span style={{ fontSize: 11, color: C.t2, minWidth: 30 }}>
                  {isAr ? "ر.س" : "SAR"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <Button primary onClick={save} disabled={saving}>
          {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
        </Button>
      </div>
    </Card>
  );
}
