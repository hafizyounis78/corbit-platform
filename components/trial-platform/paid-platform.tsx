"use client";

import "@/app/register/register.css";
import "./platform.css";
import { PlatformView } from "./platform-view";
import { usePaidPlatform, type PaidSummary } from "./use-paid-platform";

/**
 * The dashboard a customer lands on after paying (signup step 4 → «نجهّز
 * حسابك»): the receipt and the connect-your-number wizard. Same approved
 * shell as the trial dashboard (platform-view.tsx), in its paid state.
 */
export function PaidPlatform({ summary }: { summary: PaidSummary }) {
  const vm = usePaidPlatform(summary);

  return (
    <div className="wr pfm" dir="rtl" lang="ar" style={{ position: "fixed", inset: 0, zIndex: 60, height: "100dvh" }}>
      <PlatformView vm={vm} />
    </div>
  );
}
