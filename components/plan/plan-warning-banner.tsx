"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Icon } from "@/components/icons/icon";
import { usePlanUsage } from "@/lib/api/hooks";

type FeatureCheck = {
  key: string;
  labelAr: string;
  labelEn: string;
  usageKey: string;
  limitKey: string;
};

const FEATURES: FeatureCheck[] = [
  { key: "conversations", labelAr: "المحادثات الشهريّة", labelEn: "monthly conversations", usageKey: "conversations",     limitKey: "max_conversations" },
  { key: "agents",        labelAr: "الوكلاء",            labelEn: "agents",                usageKey: "agents",            limitKey: "max_agents" },
  { key: "campaigns",     labelAr: "الحملات الشهريّة",   labelEn: "monthly campaigns",     usageKey: "campaigns_monthly", limitKey: "max_campaigns_monthly" },
  { key: "templates",     labelAr: "القوالب",            labelEn: "templates",             usageKey: "templates",         limitKey: "max_templates" },
  { key: "bots",          labelAr: "البوتات",            labelEn: "bots",                  usageKey: "bots",              limitKey: "max_bots" },
];

const WARN_PCT = 70;
const DANGER_PCT = 90;

export function PlanWarningBanner() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { data } = usePlanUsage();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const usage  = ((data as any)?.usage  ?? {}) as Record<string, number>;
  const limits = ((data as any)?.limits ?? {}) as Record<string, number>;

  // Find the feature with the highest usage % (only ones with a real cap)
  const breaches = FEATURES
    .map((f) => {
      const used  = Number(usage[f.usageKey] ?? 0);
      const limit = Number(limits[f.limitKey] ?? 0);
      if (limit === -1 || limit === 0) return null;
      const pct = (used / limit) * 100;
      return { feature: f, used, limit, pct };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null && x.pct >= WARN_PCT)
    .sort((a, b) => b.pct - a.pct);

  if (breaches.length === 0) return null;

  const top = breaches[0];
  const danger = top.pct >= DANGER_PCT;
  const overflowed = top.pct >= 100;

  const color = danger ? "#ef4444" : "#f59e0b";
  const bg    = danger ? "#fee2e2" : "#fef3c7";
  const txt   = danger ? "#991b1b" : "#92400e";

  const featureLabel = isAr ? top.feature.labelAr : top.feature.labelEn;

  let messageAr: string;
  let messageEn: string;

  if (overflowed) {
    messageAr = `تجاوزت حدّ ${featureLabel} في باقتك (${top.used.toLocaleString()} / ${top.limit.toLocaleString()}). الخدمة مستمرّة، لكن رقّ الباقة لتجنّب توقّفها لاحقاً.`;
    messageEn = `You've exceeded your plan's ${featureLabel} cap (${top.used.toLocaleString()} / ${top.limit.toLocaleString()}). Service continues — upgrade to avoid a future cutoff.`;
  } else if (danger) {
    messageAr = `تبقّى لك ${(top.limit - top.used).toLocaleString()} من ${featureLabel} (${Math.round(top.pct)}% مستهلك).`;
    messageEn = `${(top.limit - top.used).toLocaleString()} ${featureLabel} remaining (${Math.round(top.pct)}% used).`;
  } else {
    messageAr = `تستهلك ${Math.round(top.pct)}% من ${featureLabel} في باقتك.`;
    messageEn = `You've used ${Math.round(top.pct)}% of your ${featureLabel}.`;
  }

  return (
    <div
      style={{
        background: bg,
        color: txt,
        borderBottom: `1px solid ${color}40`,
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 16 }}>{danger ? "🚨" : "⚠️"}</span>
      <span style={{ flex: 1, minWidth: 200 }}>
        {isAr ? messageAr : messageEn}
      </span>
      <Link
        href="/billing"
        style={{
          padding: "6px 14px",
          borderRadius: 8,
          background: color,
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {isAr ? "ترقية الآن" : "Upgrade now"}
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="dismiss"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: txt,
          padding: 4,
          opacity: 0.7,
        }}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
