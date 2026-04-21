import type { TranslationKey } from "@/lib/i18n/translations";

export type NavRole = "admin" | "supervisor" | "agent";

export interface NavItem {
  key: string;
  path: string;
  labelKey: TranslationKey;
  icon: string;
  badge?: number;
  /** Which roles can see this item. Omitted = visible to any authenticated user. */
  roles?: NavRole[];
}

export const navItems: NavItem[] = [
  { key: "dashboard",    path: "/dashboard",    labelKey: "dashboard",    icon: "dashboard" },
  { key: "inbox",        path: "/inbox",        labelKey: "inbox",        icon: "inbox", badge: 16 },
  { key: "campaigns",    path: "/campaigns",    labelKey: "campaigns",    icon: "megaphone", roles: ["admin", "supervisor"] },
  { key: "contacts",     path: "/contacts",     labelKey: "contacts",     icon: "users" },
  { key: "templates",    path: "/templates",    labelKey: "templates",    icon: "file", roles: ["admin"] },
  { key: "bot-builder",  path: "/bot-builder",  labelKey: "botBuilder",   icon: "bot", roles: ["admin"] },
  { key: "ai-center",    path: "/ai-center",    labelKey: "aiCenter",     icon: "brain", roles: ["admin"] },
  { key: "analytics",    path: "/analytics",    labelKey: "analytics",    icon: "chart", roles: ["admin", "supervisor"] },
  { key: "integrations", path: "/integrations", labelKey: "integrations", icon: "link", roles: ["admin"] },
  { key: "teams",        path: "/teams",        labelKey: "teams",        icon: "team", roles: ["admin", "supervisor"] },
  { key: "billing",      path: "/billing",      labelKey: "billing",      icon: "card", roles: ["admin"] },
  { key: "settings",     path: "/settings",     labelKey: "settings",     icon: "gear", roles: ["admin"] },
];

/**
 * Returns true when the user's role is allowed to see/navigate a given nav item.
 */
export function canAccessNav(item: NavItem, role: string | undefined | null): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  if (!role) return false;
  return (item.roles as string[]).includes(role);
}
