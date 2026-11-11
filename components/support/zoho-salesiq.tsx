"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * Zoho SalesIQ live-support widget.
 *
 * The widget code is public by design — it ships in the page source of
 * every site running SalesIQ — so it is checked in rather than injected
 * at deploy time. That is deliberate: NEXT_PUBLIC_* values are inlined
 * at *build* time, so an env-only setup silently renders nothing whenever
 * the server rebuilds without the variable present, which is exactly how
 * the first deploy of this widget failed.
 *
 * Access is gated by Zoho on the referring domain, not by the code being
 * secret: the portal serves the real loader to *.corbit.sa and a no-op
 * stub to everything else (localhost included). So a checked-in code
 * cannot be abused from another site, and local dev still never opens a
 * support chat — the stub does nothing.
 *
 * Set NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_CODE only to point a deployment at
 * a different portal, or to "" to switch the widget off entirely.
 *
 * The float button is pinned to the bottom corner; FloatingHelpButton
 * sits above it (see its `bottom`) so the two never overlap.
 */

const DEFAULT_WIDGET_CODE =
  "0f6965f78c75132b240078b22b61c42a054bc86c32ebfd4fdf53fb521e2ffbef";

const WIDGET_CODE =
  process.env.NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_CODE ?? DEFAULT_WIDGET_CODE;
// Corbit's portal lives in Zoho's Saudi data centre; other DCs use a
// different host (salesiq.zoho.com, salesiq.zoho.eu, ...). The .sa DC
// answers on both salesiq.zohopublic.sa and salesiq.zoho.sa with a
// byte-identical loader.
const DOMAIN = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_DOMAIN || "https://salesiq.zohopublic.sa";

type SalesIqUser = { id: string; name: string; email: string; phone: string | null; role: string; team: string | null } | null;

/**
 * Hand the signed-in user's identity to SalesIQ so the support agent
 * sees who they're talking to instead of "Visitor 42". Wrapped in
 * try/catch: SalesIQ's API surface shifts between widget versions and a
 * chat widget must never take the dashboard down with it.
 */
function applyVisitor(user: SalesIqUser, lang: string) {
  const siq = (window as any).$zoho?.salesiq;
  if (!siq) return;
  try {
    siq.language?.(lang);
    if (!user) return;
    siq.visitor?.name?.(user.name);
    siq.visitor?.email?.(user.email);
    if (user.phone) siq.visitor?.contactnumber?.(user.phone);
    siq.visitor?.info?.({
      "User ID": user.id,
      Role: user.role,
      ...(user.team ? { Team: user.team } : {}),
    });
  } catch {
    /* never break the page over the chat widget */
  }
}

/**
 * `hideLauncher` keeps the chat available but hides SalesIQ's floating
 * bubble — for screens that open the chat from their own button (the
 * auth screens' «تحدث معنا»). The rule unmounts with the screen, so the
 * bubble is back as soon as the user reaches the platform.
 */
export function ZohoSalesIq({ hideLauncher = false }: { hideLauncher?: boolean } = {}) {
  const { user, isAuthenticated } = useAuth();
  const { lang } = useLocale();

  // The ready callback fires once, whenever the remote script finishes
  // loading — which may be before or after we know who the user is. A
  // ref keeps it reading the current value rather than a stale closure.
  const latest = useRef<{ user: SalesIqUser; lang: string }>({ user: null, lang });
  latest.current = { user: isAuthenticated ? (user as SalesIqUser) : null, lang };

  // Bootstrap the global the loader expects, and register `ready` before
  // the script lands so identity is set on the very first chat.
  useEffect(() => {
    if (!WIDGET_CODE) return;
    const w = window as any;
    w.$zoho = w.$zoho || {};
    w.$zoho.salesiq = w.$zoho.salesiq || { ready: () => {} };
    w.$zoho.salesiq.ready = () => applyVisitor(latest.current.user, latest.current.lang);
  }, []);

  // Re-apply on login, user switch, or language toggle, for the case
  // where the script is already up and `ready` has long since fired.
  useEffect(() => {
    if (!WIDGET_CODE) return;
    applyVisitor(isAuthenticated ? (user as SalesIqUser) : null, lang);
  }, [user, isAuthenticated, lang]);

  if (!WIDGET_CODE) return null;

  return (
    <>
      {/* SalesIQ positions its own bubble with inline styles, so pinning
          it takes !important. Logical props keep it on the same side as
          the rest of the chrome when the locale flips to English. */}
      <style>{`
        #zsiq_float, .zsiq_floatmain {
          inset-inline-end: 24px !important;
          inset-inline-start: auto !important;
          bottom: 24px !important;
        }
      `}</style>
      {hideLauncher && <style>{`#zsiq_float, .zsiq_floatmain { display: none !important; }`}</style>}
      <Script
        id="zsiqscript"
        src={`${DOMAIN}/widget?wc=${WIDGET_CODE}`}
        strategy="afterInteractive"
      />
    </>
  );
}
