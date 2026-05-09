// Sentry initialization for the Node.js runtime (Server Components,
// API routes, server actions). Mirrors instrumentation-client.ts but
// runs server-side.
//
// Note: most server-side errors actually originate from the Laravel
// backend, which has its own Flare stream. What this catches is
// Next.js itself blowing up — render errors, server-side fetch
// failures, broken middleware — i.e. the bugs Flare can't see.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
});
