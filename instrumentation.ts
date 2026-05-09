// Next.js's register() hook for server-side instrumentation. Selects
// the Sentry config matching the runtime — keeping browser/server/edge
// configs separate prevents the SDK from pulling Node modules into
// the edge bundle and vice versa.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Required by @sentry/nextjs to capture errors from React Server
// Components and other server-rendered paths.
export const onRequestError = Sentry.captureRequestError;
