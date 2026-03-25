import type { TranslationKey } from "@/lib/i18n/translations";

export interface NavItem {
  key: string;
  path: string;
  labelKey: TranslationKey;
  icon: string;
  badge?: number;
}

export const navItems: NavItem[] = [
  { key: "dashboard", path: "/dashboard", labelKey: "dashboard", icon: "dashboard" },
  { key: "inbox", path: "/inbox", labelKey: "inbox", icon: "inbox", badge: 16 },
  { key: "campaigns", path: "/campaigns", labelKey: "campaigns", icon: "megaphone" },
  { key: "contacts", path: "/contacts", labelKey: "contacts", icon: "users" },
  { key: "templates", path: "/templates", labelKey: "templates", icon: "file" },
  { key: "bot-builder", path: "/bot-builder", labelKey: "botBuilder", icon: "bot" },
  { key: "ai-center", path: "/ai-center", labelKey: "aiCenter", icon: "brain" },
  { key: "analytics", path: "/analytics", labelKey: "analytics", icon: "chart" },
  { key: "integrations", path: "/integrations", labelKey: "integrations", icon: "link" },
  { key: "teams", path: "/teams", labelKey: "teams", icon: "team" },
  { key: "billing", path: "/billing", labelKey: "billing", icon: "card" },
  { key: "settings", path: "/settings", labelKey: "settings", icon: "gear" },
];
