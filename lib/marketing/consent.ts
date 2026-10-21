// Cookie consent shared by every *.corbit.sa site (corbit.sa, the portal,
// SchoolBit): one `cookie-consent` cookie on the parent domain, so a visitor
// who answered the banner on corbit.sa is not asked again here.
//   accepted  → analytics + ads cookies allowed
//   necessary → only what the site needs to work; tags run cookieless
// Unanswered counts as "necessary" (Google Consent Mode v2 default = denied).
export type ConsentLevel = "accepted" | "necessary";

export const CONSENT_KEY = "cookie-consent";
export const CONSENT_EVENT = "cookie-consent-changed";
const MAX_AGE = 60 * 60 * 24 * 365;

// `.corbit.sa` in production so all sub-sites share it; host-only locally.
export function parentCookieDomain(): string {
  const host = window.location.hostname;
  return host === "corbit.sa" || host.endsWith(".corbit.sa") ? "; domain=.corbit.sa" : "";
}

export function readCookie(name: string): string | null {
  const row = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : null;
}

export function getConsent(): ConsentLevel | null {
  if (typeof window === "undefined") return null;
  const value = readCookie(CONSENT_KEY);
  if (value === "accepted" || value === "necessary") return value;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted" || stored === "necessary") return stored;
  } catch {
    // storage blocked: treat as unanswered
  }
  return null;
}

export function hasMarketingConsent(): boolean {
  return getConsent() === "accepted";
}

export function setConsent(level: ConsentLevel): void {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${CONSENT_KEY}=${level}; path=/; max-age=${MAX_AGE}; samesite=lax${parentCookieDomain()}${secure}`;
  try {
    localStorage.setItem(CONSENT_KEY, level);
  } catch {
    // the cookie alone is enough
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: level }));
}
