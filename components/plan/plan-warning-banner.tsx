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

type Banner = {
  variant: 'expired' | 'expiring' | 'overflow' | 'danger' | 'warn';
  messageAr: string;
  messageEn: string;
  /** Expired banners can't be dismissed — the operator must see it */
  dismissible: boolean;
  ctaAr: string;
  ctaEn: string;
};

export function PlanWarningBanner() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { data } = usePlanUsage();
  const [dismissed, setDismissed] = useState(false);

  const usage  = ((data as any)?.usage  ?? {}) as Record<string, number>;
  const limits = ((data as any)?.limits ?? {}) as Record<string, number>;
  const expiry = (data as any)?.expiry as { expiresAt: string|null; daysLeft: number|null; isActive: boolean; expiringSoon: boolean } | undefined;

  // Banner priority is intentional: expiry > overflow > danger > warn.
  // Expiry trumps usage because an expired plan locks every premium
  // feature regardless of how much room you've left in your usage caps,
  // so showing "70% campaigns used" while the plan is dead would confuse
  // the operator about why nothing's sending.
  const banner: Banner | null = (() => {
    // 1) Plan expired — non-dismissible, takes the screen.
    if (expiry && expiry.isActive === false) {
      return {
        variant: 'expired',
        messageAr: 'انتهت صلاحيّة باقتك. الإرسال عبر واتساب موقوف. لتجديد الاشتراك تواصل مع المبيعات.',
        messageEn: 'Your plan has expired. WhatsApp sending is suspended. Contact sales to renew.',
        dismissible: false,
        ctaAr: 'تجديد الاشتراك',
        ctaEn: 'Renew',
      };
    }

    // 2) Expiring within the warning window (default 7 days).
    if (expiry && expiry.expiringSoon && expiry.daysLeft !== null) {
      const days = expiry.daysLeft;
      const dayWordAr = days === 1 ? 'يوم' : 'أيّام';
      const dayWordEn = days === 1 ? 'day' : 'days';
      return {
        variant: 'expiring',
        messageAr: `ستنتهي صلاحيّة باقتك خلال ${days} ${dayWordAr}. جدّد الآن لتجنّب توقّف الخدمة.`,
        messageEn: `Your plan expires in ${days} ${dayWordEn}. Renew now to avoid service interruption.`,
        dismissible: true,
        ctaAr: 'التجديد',
        ctaEn: 'Renew',
      };
    }

    // 3) Fall through to feature usage warnings.
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
    const overflowed = top.pct >= 100;
    const danger = top.pct >= DANGER_PCT;
    const featureLabel = isAr ? top.feature.labelAr : top.feature.labelEn;

    if (overflowed) {
      return {
        variant: 'overflow',
        messageAr: `تجاوزت حدّ ${featureLabel} في باقتك (${top.used.toLocaleString()} / ${top.limit.toLocaleString()}). الخدمة مستمرّة، لكن رقّ الباقة لتجنّب توقّفها لاحقاً.`,
        messageEn: `You've exceeded your plan's ${featureLabel} cap (${top.used.toLocaleString()} / ${top.limit.toLocaleString()}). Service continues — upgrade to avoid a future cutoff.`,
        dismissible: true,
        ctaAr: 'ترقية الآن',
        ctaEn: 'Upgrade now',
      };
    }
    if (danger) {
      return {
        variant: 'danger',
        messageAr: `تبقّى لك ${(top.limit - top.used).toLocaleString()} من ${featureLabel} (${Math.round(top.pct)}% مستهلك).`,
        messageEn: `${(top.limit - top.used).toLocaleString()} ${featureLabel} remaining (${Math.round(top.pct)}% used).`,
        dismissible: true,
        ctaAr: 'ترقية الآن',
        ctaEn: 'Upgrade now',
      };
    }
    return {
      variant: 'warn',
      messageAr: `تستهلك ${Math.round(top.pct)}% من ${featureLabel} في باقتك.`,
      messageEn: `You've used ${Math.round(top.pct)}% of your ${featureLabel}.`,
      dismissible: true,
      ctaAr: 'ترقية الآن',
      ctaEn: 'Upgrade now',
    };
  })();

  if (!banner) return null;
  if (dismissed && banner.dismissible) return null;

  const isRed = banner.variant === 'expired' || banner.variant === 'overflow' || banner.variant === 'danger';
  const color = isRed ? '#ef4444' : '#f59e0b';
  const bg    = isRed ? '#fee2e2' : '#fef3c7';
  const txt   = isRed ? '#991b1b' : '#92400e';
  const iconName = banner.variant === 'expired' ? 'ban' : isRed ? 'siren' : 'alert';

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
      <span style={{ color, display: "inline-flex" }}><Icon name={iconName} size={16} /></span>
      <span style={{ flex: 1, minWidth: 200 }}>
        {isAr ? banner.messageAr : banner.messageEn}
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
        {isAr ? banner.ctaAr : banner.ctaEn}
      </Link>
      {banner.dismissible && (
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
      )}
    </div>
  );
}
