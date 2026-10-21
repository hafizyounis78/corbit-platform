// Ad source of the visitor (UTM / click ids / external referrer), kept from the
// first page they land on until they sign up or pay, then sent to the backend
// with the school signup and the checkout (marketing_attributions table).
//
//   first = where they came from the very first time (never replaced)
//   last  = the latest campaign / external site that brought them back
//
// Before cookie consent it lives in sessionStorage (this tab only); after
// "accept all" in the `cb_attr` cookie on .corbit.sa for 90 days, shared with
// corbit.sa and the messaging portal (same format as corbit-ui).
import { CONSENT_EVENT, hasMarketingConsent, parentCookieDomain, readCookie } from "./consent";

export type Touch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  sccid?: string;
  referrer?: string;
  landing_page?: string;
  ts?: number;
};

export type Attribution = { first?: Touch; last?: Touch };

const KEY = "cb_attr";
const MAX_AGE = 60 * 60 * 24 * 90;

// URL parameter → stored field. Snapchat sends ScCid.
const PARAMS: Record<string, keyof Touch> = {
  utm_source: "utm_source",
  utm_medium: "utm_medium",
  utm_campaign: "utm_campaign",
  utm_content: "utm_content",
  utm_term: "utm_term",
  gclid: "gclid",
  fbclid: "fbclid",
  ttclid: "ttclid",
  ScCid: "sccid",
  sccid: "sccid",
};

// Referrers that are part of our own journey, not a traffic source: our sites
// and the payment pages the customer returns from.
const INTERNAL_REFERRERS = [/(^|\.)corbit\.sa$/, /(^|\.)mobile\.net\.sa$/, /paytabs/, /edaat/];

function externalReferrer(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    if (host === window.location.hostname) return undefined;
    if (INTERNAL_REFERRERS.some((re) => re.test(host))) return undefined;
    return document.referrer.slice(0, 500);
  } catch {
    return undefined;
  }
}

function touchFromLocation(): Touch | null {
  const query = new URLSearchParams(window.location.search);
  const touch: Touch = {};
  for (const [param, field] of Object.entries(PARAMS)) {
    const value = query.get(param);
    if (value) (touch as Record<string, string>)[field] = value.slice(0, 255);
  }
  const referrer = externalReferrer();
  if (referrer) touch.referrer = referrer;
  if (Object.keys(touch).length === 0) return null;

  touch.landing_page = (window.location.origin + window.location.pathname).slice(0, 500);
  touch.ts = Date.now();
  return touch;
}

function parse(raw: string | null): Attribution | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? (value as Attribution) : null;
  } catch {
    return null;
  }
}

export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  const fromCookie = parse(readCookie(KEY));
  if (fromCookie) return fromCookie;
  try {
    return parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

function save(attribution: Attribution): void {
  const json = JSON.stringify(attribution);
  try {
    sessionStorage.setItem(KEY, json);
  } catch {
    // ignore
  }
  if (hasMarketingConsent()) {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${KEY}=${encodeURIComponent(json)}; path=/; max-age=${MAX_AGE}; samesite=lax${parentCookieDomain()}${secure}`;
  }
}

// Called once per page load. A visit with no campaign and no external referrer
// (typed URL, bookmark, internal link) keeps the stored source.
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const touch = touchFromLocation();
  const current = getAttribution() ?? {};
  if (touch) {
    save({ first: current.first ?? touch, last: touch });
  } else if (current.first && hasMarketingConsent() && !readCookie(KEY)) {
    // Consent given after landing: move the tab's source into the cookie.
    save(current);
  }
}

// Persists the tab's source as soon as the visitor accepts cookies.
export function watchConsentForAttribution(): () => void {
  const onChange = () => captureAttribution();
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}

// GA4 client id from the `_ga` cookie ("GA1.1.123456789.1700000000").
export function getGaClientId(): string | null {
  const match = readCookie("_ga")?.match(/^GA\d\.\d\.(\d+\.\d+)$/);
  return match ? match[1] : null;
}

// Body for the backend `attribution` field, or null when there is nothing.
export function attributionPayload(): Record<string, unknown> | null {
  const attribution = getAttribution();
  if (!attribution?.first && !attribution?.last) return null;
  return {
    product: "whatsbit",
    ga_client_id: getGaClientId(),
    first: attribution.first,
    last: attribution.last,
  };
}
