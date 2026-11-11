"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api/client";
import { PaidPlatform } from "@/components/trial-platform/paid-platform";
import type { PaidSummary } from "@/components/trial-platform/use-paid-platform";

/**
 * /setup — the paid dashboard right after a self-serve purchase: the
 * payment receipt and the wizard that connects the customer's own
 * WhatsApp Business number. The platform layout sends a newly paid
 * account here instead of /dashboard until the wizard is finished.
 */
export default function SetupPage() {
  const [summary, setSummary] = useState<PaidSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get("/subscription/onboarding")
      .then((r) => setSummary(r.data.data))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontSize: 15 }}>
        تعذّر تحميل الصفحة. <a href="/setup" style={{ textDecoration: "underline" }}>أعد المحاولة</a>
      </div>
    );
  }
  if (!summary) return null;

  return <PaidPlatform summary={summary} />;
}
