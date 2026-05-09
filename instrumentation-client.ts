// Sentry initialization for the browser bundle. Loaded by Next.js
// automatically thanks to the file name (matches the Next.js
// `instrumentation-client` convention).
//
// We only enable error tracking — no performance traces, no replays —
// to keep the free tier headroom for actual issues. The Laravel
// backend uses Spatie Flare for its own error stream; Sentry here is
// the frontend-only counterpart.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Filter noise: in development we don't want every hot-reload error
  // landing in the dashboard. Only ship in production.
  enabled: process.env.NODE_ENV === "production",

  // Errors only. Performance + replays cost quota and we'd rather
  // turn them on intentionally once we know what we want to measure.
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Tag errors with the deploy environment so prod and preview
  // builds don't get mixed up in the dashboard.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
});

// Required hook for navigation tracing — even with traces off this
// keeps the Sentry SDK happy under Next.js routing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
