"use client";

import { PlatformFrame } from "./platform-frame";
import { useTrialPlatform, type TrialSummary } from "./use-trial-platform";

/**
 * The trial dashboard a customer lands on after «ابدأ التجربة المجانية»
 * (signup step 3). The markup is the approved design's platform shell
 * (platform-view.tsx, generated from it); the data is the real trial.
 *
 * It covers the whole screen: a trial account has no other page, and
 * the design's shell brings its own sidebar and top bar.
 */
export function SelfServeTrial({ summary }: { summary: TrialSummary }) {
  const vm = useTrialPlatform(summary);

  return <PlatformFrame vm={vm} />;
}
