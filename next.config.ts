import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Sentry build-time integration: uploads source maps so production
// stack traces are unminified in the dashboard, and silences the SDK's
// build chatter. Org/project come from the dashboard URL.
export default withSentryConfig(nextConfig, {
  org: "corbit-1o",
  project: "whatsbit-nextjs",

  // Quiet the build output — the SDK is loud by default.
  silent: !process.env.CI,

  // Only upload source maps from CI/Vercel — local dev builds skip
  // the upload to keep `npm run build` fast.
  widenClientFileUpload: true,

  // Auto-instrumentation of Vercel cron jobs. Off because we don't
  // currently have any.
  automaticVercelMonitors: false,

  // The SENTRY_AUTH_TOKEN env var is what authorises source-map
  // uploads to Sentry; if it's missing, we skip the upload step
  // gracefully instead of failing the build.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
