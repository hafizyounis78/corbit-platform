"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Card, Badge } from "@/components/ui";
import { usePlanUsage } from "@/lib/api/hooks";
import Link from "next/link";

type FeatureRow = {
  key: string;
  labelAr: string;
  labelEn: string;
  usageKey: string;
  limitKey: string;
};

const FEATURES: FeatureRow[] = [
  { key: "agents",        labelAr: "الوكلاء",            labelEn: "Agents",            usageKey: "agents",            limitKey: "max_agents" },
  { key: "conversations", labelAr: "المحادثات هذا الشهر", labelEn: "Conversations (mo)", usageKey: "conversations",     limitKey: "max_conversations" },
  { key: "campaigns",     labelAr: "حملات هذا الشهر",     labelEn: "Campaigns (mo)",     usageKey: "campaigns_monthly", limitKey: "max_campaigns_monthly" },
  { key: "templates",     labelAr: "القوالب",            labelEn: "Templates",          usageKey: "templates",         limitKey: "max_templates" },
  { key: "contacts",      labelAr: "جهات الاتصال",       labelEn: "Contacts",           usageKey: "contacts",          limitKey: "max_contacts" },
  { key: "bots",          labelAr: "البوتات",            labelEn: "Bots",               usageKey: "bots",              limitKey: "max_bots" },
  { key: "kb",            labelAr: "ملفات قاعدة المعرفة", labelEn: "KB Docs",            usageKey: "kb_docs",           limitKey: "kb_docs_max" },
];

export function PlanUsageCard() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { data, isLoading } = usePlanUsage();

  if (isLoading) {
    return (
      <Card style={{ padding: 18 }}>
        <span style={{ color: C.t2, fontSize: 13 }}>{isAr ? "جاري التحميل..." : "Loading..."}</span>
      </Card>
    );
  }

  const plan  = (data as any)?.plan;
  const usage = ((data as any)?.usage ?? {}) as Record<string, number>;
  const limits = ((data as any)?.limits ?? {}) as Record<string, number | boolean>;

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>
            {isAr ? "الباقة الحاليّة" : "Current plan"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.txt }}>
            {plan ? (isAr ? plan.name_ar || plan.name : plan.name) : (isAr ? "بدون باقة" : "No plan")}
            {plan && (
              <span style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginInlineStart: 8 }}>
                {plan.price} {isAr ? "ر.س/شهر" : "SAR/mo"}
              </span>
            )}
          </div>
        </div>
        <Link href="/billing" style={{ textDecoration: "none", fontSize: 12, color: C.pri }}>
          {isAr ? "ترقية الباقة ←" : "Upgrade →"}
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {FEATURES.map((f) => {
          const used  = Number(usage[f.usageKey] ?? 0);
          const limit = Number(limits[f.limitKey] ?? 0);
          const unlimited = limit === -1;
          const pct = unlimited || limit === 0 ? 0 : Math.min(100, (used / limit) * 100);
          const danger = !unlimited && pct >= 90;
          const warn   = !unlimited && pct >= 70 && pct < 90;
          const barColor = danger ? "#ef4444" : warn ? "#f59e0b" : "#10b981";

          return (
            <div key={f.key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: C.txt }}>{isAr ? f.labelAr : f.labelEn}</span>
                <span style={{ color: C.t2, fontFamily: "monospace" }}>
                  {used.toLocaleString()} / {unlimited ? "∞" : limit.toLocaleString()}
                </span>
              </div>
              <div style={{
                height: 6,
                background: C.brd,
                borderRadius: 3,
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: unlimited ? "10%" : `${pct}%`,
                  background: unlimited ? `${barColor}40` : barColor,
                  transition: "width 0.3s",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
