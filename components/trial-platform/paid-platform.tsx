"use client";

import { PlatformFrame } from "./platform-frame";
import { usePaidPlatform, type PaidSummary } from "./use-paid-platform";

/**
 * The dashboard a customer lands on after paying (signup step 4 → «نجهّز
 * حسابك»): the receipt and the connect-your-number wizard. Same approved
 * shell as the trial dashboard (platform-view.tsx), in its paid state.
 */
export function PaidPlatform({ summary }: { summary: PaidSummary }) {
  const vm = usePaidPlatform(summary);

  return <PlatformFrame vm={vm} />;
}
