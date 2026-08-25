import { COLORS } from "./colors";

/**
 * Lead attribution vocabulary — one definition shared by the contact
 * drawer, the contacts table and the analytics report, so a source
 * never reads as "إعلان" on one screen and "Ad" on another.
 *
 * Values mirror App\Models\LeadSource::TYPES on the backend. An
 * unknown type (a newer backend talking to an older bundle) falls
 * back to the neutral entry rather than rendering blank.
 */
export type LeadSourceType =
  | "ad"
  | "social_post"
  | "store"
  | "import"
  | "api"
  | "manual"
  | "direct";

interface LeadSourceMeta {
  ar: string;
  en: string;
  color: string;
  /** Icon key from components/icons/icon.tsx */
  icon: string;
}

export const LEAD_SOURCES: Record<LeadSourceType, LeadSourceMeta> = {
  ad:          { ar: "إعلان",                  en: "Ad",            color: COLORS.sec,  icon: "megaphone" },
  social_post: { ar: "منشور تواصل اجتماعي",    en: "Social post",   color: COLORS.info, icon: "users" },
  store:       { ar: "متجر إلكتروني",           en: "Online store",  color: COLORS.pri,  icon: "cart" },
  import:      { ar: "استيراد قائمة",           en: "Imported list", color: COLORS.warn, icon: "upload" },
  api:         { ar: "ربط برمجي",               en: "API",           color: COLORS.ai,   icon: "link" },
  manual:      { ar: "إدخال يدوي",              en: "Manual entry",  color: COLORS.navy, icon: "pencil" },
  direct:      { ar: "تواصل مباشر",             en: "Direct",        color: COLORS.wa,   icon: "msg" },
};

const UNKNOWN: LeadSourceMeta = {
  ar: "غير محدّد",
  en: "Unknown",
  color: "#9AA5B1",
  icon: "target",
};

export function leadSourceMeta(type?: string | null): LeadSourceMeta {
  if (!type) return UNKNOWN;
  return LEAD_SOURCES[type as LeadSourceType] ?? UNKNOWN;
}

export function leadSourceLabel(type: string | null | undefined, isAr: boolean): string {
  const meta = leadSourceMeta(type);
  return isAr ? meta.ar : meta.en;
}

/**
 * Ad platforms arrive from the referral URL and are already proper
 * nouns, so only the casing needs help.
 */
export function platformLabel(platform?: string | null): string | null {
  if (!platform) return null;
  const known: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    google: "Google",
    tiktok: "TikTok",
    snapchat: "Snapchat",
    linkedin: "LinkedIn",
  };
  return known[platform] ?? platform;
}
