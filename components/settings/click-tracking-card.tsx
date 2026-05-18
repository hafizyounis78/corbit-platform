"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import api from "@/lib/api/client";
import { FONT_FAMILY } from "@/lib/constants/font";

/**
 * Org-wide click-tracking opt-out.
 *
 * When ON (default): SendCampaignMessage wraps every URL in outgoing
 * campaigns through corbit.sa/track/{code} so we can attribute taps
 * back to specific recipients on the campaign analytics screen.
 *
 * When OFF: URLs go out exactly as the operator typed them in the
 * template. Recommended for tenants who want strict alignment with
 * the URL Meta approved on the WhatsApp template — wrapped URLs
 * differ from the approved content and can occasionally trigger
 * Meta spot-check warnings, even though the platform routes them
 * via parameter values rather than body edits.
 */
export function ClickTrackingCard() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get("/settings/click-tracking")
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        if (typeof data?.click_tracking_enabled === "boolean") {
          setEnabled(data.click_tracking_enabled);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleToggle = async (next: boolean) => {
    setEnabled(next);  // optimistic
    setSaving(true);
    try {
      await api.patch("/settings/click-tracking", {
        click_tracking_enabled: next,
      });
      showToast(
        next
          ? (isAr ? "تمّ تفعيل تتبّع النقرات" : "Click tracking enabled")
          : (isAr ? "تمّ إيقاف تتبّع النقرات" : "Click tracking disabled"),
      );
    } catch {
      // Roll back optimistic flip
      setEnabled(! next);
      showToast(isAr ? "تعذّر الحفظ، حاول لاحقاً" : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ padding: 20, fontFamily: FONT_FAMILY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>
            {isAr ? "تتبّع النقرات في الحملات" : "Campaign Click Tracking"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="link" size={16} />
            <span>{isAr ? "تتبّع النقرات (Click Tracking)" : "Click Tracking"}</span>
          </div>
          <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.75 }}>
            {isAr
              ? "عند التفعيل: نلفّ الروابط في حملاتك حتى نقدر نقيس عدد النقرات لكلّ مستلم."
              : "When ON: we wrap URLs in your campaigns to measure clicks per recipient."}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <Toggle on={enabled} onToggle={() => !saving && !loading && handleToggle(! enabled)} />
          <span style={{ fontSize: 11, color: enabled ? C.ok : C.t3, fontWeight: 600 }}>
            {loading
              ? (isAr ? "..." : "...")
              : enabled
                ? (isAr ? "مفعّل" : "ON")
                : (isAr ? "موقوف" : "OFF")}
          </span>
        </div>
      </div>

      {/* Trade-off note */}
      <div style={{
        marginTop: 14, padding: "10px 12px", borderRadius: 8,
        background: `${C.info}08`, border: `1px solid ${C.info}25`,
        fontSize: 11.5, color: C.t2, lineHeight: 1.7,
      }}>
        <strong style={{ color: C.info }}>ℹ️ {isAr ? "ملاحظة" : "Note"}:</strong>{" "}
        {isAr
          ? "إيقافه يجعل الروابط تُرسَل كما هي بدون تعديل — مفيد للالتزام الكامل بسياسات Meta. التفعيل يعطيك تحليلات دقيقة للنقرات لكلّ حملة، لكنّك تخسر التقارير لو أوقفته."
          : "Turning it OFF sends URLs untouched — useful for the strictest Meta-policy alignment. Leaving it ON gives you accurate per-campaign click analytics."}
      </div>
    </Card>
  );
}
