"use client";

/**
 * Plan support SLA card — sits at the top of the Help / Contact tab
 * so the tenant sees the support-response SLA their plan entitles
 * them to BEFORE they pick a contact channel.
 *
 * Reads support_sla_hours from the plan's features JSON (surfaced
 * via PlanService::limitsFor). On Basic/Starter we hint at the
 * upgrade path — Business and Enterprise just get a confident
 * "guaranteed response within X" message.
 *
 * This is the SUPPORT SLA (Corbit → tenant), not the operational
 * SLA (tenant → end customer) which lives in /settings → Team and
 * is configured separately.
 */

import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { usePlanUsage } from "@/lib/api/hooks";

export function PlanSupportCard() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { data: planData } = usePlanUsage();

  const planName = planData?.plan?.name;
  const planNameAr = planData?.plan?.name_ar;
  const slaHours = (planData?.limits?.support_sla_hours as number | undefined) ?? 24;

  // Map SLA hours to a tier accent. Lower = tighter SLA = better tier.
  const accent =
    slaHours <= 1  ? "#10b981" :  // Enterprise — green
    slaHours <= 2  ? "#3b82f6" :  // Business   — blue
    slaHours <= 4  ? "#f59e0b" :  // Starter    — amber
                     C.t2;        // Basic / unknown

  const slaLabelAr =
    slaHours === 1 ? "ساعة واحدة" :
    slaHours === 2 ? "ساعتان" :
    `${slaHours} ساعات`;

  const slaLabelEn =
    slaHours === 1 ? "1 hour" :
    `${slaHours} hours`;

  const planLabel = (isAr ? planNameAr || planName : planName) ?? (isAr ? "افتراضي" : "Default");

  return (
    <Card style={{ padding: 18, marginBottom: 14, borderRight: `4px solid ${accent}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${accent}18`, color: accent,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name="clock" size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.txt }}>
              {isAr ? "وقت استجابة الدعم لباقتك" : "Your plan's support SLA"}
            </h3>
            <Badge color={accent}>{planLabel}</Badge>
          </div>
          <div style={{ fontSize: 13.5, color: C.t2, lineHeight: 1.7 }}>
            {isAr ? (
              <>
                نضمن الردّ على تذاكرك خلال{" "}
                <strong style={{ color: accent, fontSize: 15 }}>{slaLabelAr}</strong>{" "}
                من ساعة فتح التذكرة. تذاكر الأولويّة العالية تُعالَج أسرع.
              </>
            ) : (
              <>
                We guarantee a response to your tickets within{" "}
                <strong style={{ color: accent, fontSize: 15 }}>{slaLabelEn}</strong>{" "}
                of opening. High-priority tickets are handled faster.
              </>
            )}
          </div>
          {slaHours > 2 && (
            <div style={{ fontSize: 12, color: C.t2, marginTop: 8, lineHeight: 1.6 }}>
              {isAr
                ? "تبيب استجابة أسرع؟ ترقية الباقة إلى Business (ساعتان) أو Enterprise (ساعة)."
                : "Need a faster response? Upgrade to Business (2 hours) or Enterprise (1 hour)."}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
