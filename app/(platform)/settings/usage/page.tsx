"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { PlanUsageCard } from "@/components/plan/plan-usage-card";

export default function UsagePage() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ marginBottom: 18 }}>
        <Link href="/billing" style={{ fontSize: 12, color: C.t2, textDecoration: "none" }}>
          {isAr ? "← العودة للفوترة" : "← Back to billing"}
        </Link>
        <h2 style={{ margin: "6px 0 4px", fontSize: 20, fontWeight: 700 }}>
          {isAr ? "استهلاك الباقة" : "Plan Usage"}
        </h2>
        <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>
          {isAr
            ? "اطّلع على ما استخدمته من حدود باقتك الحاليّة. لو وصلت للحدّ الأعلى، رقّ الباقة."
            : "See how much of your current plan's limits you've used. Upgrade when you hit the cap."}
        </p>
      </div>

      <PlanUsageCard />
    </div>
  );
}
