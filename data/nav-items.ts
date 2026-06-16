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
  /**
   * Optional plan feature flag (key under plan-usage `limits`). When set,
   * the item only shows if that flag is true — so Enterprise-only links
   * (multi-agent, sandbox) stay hidden from tenants on lower plans.
   */
  planFlag?: string;
}

export const navItems: NavItem[] = [
  { key: "dashboard",    path: "/dashboard",    labelKey: "dashboard",    icon: "dashboard" },
  { key: "inbox",        path: "/inbox",        labelKey: "inbox",        icon: "inbox", badge: 0 },
  { key: "campaigns",    path: "/campaigns",    labelKey: "campaigns",    icon: "megaphone", roles: ["admin", "supervisor"] },
  { key: "contacts",     path: "/contacts",     labelKey: "contacts",     icon: "users" },
  { key: "templates",    path: "/templates",    labelKey: "templates",    icon: "file", roles: ["admin"] },
  { key: "bot-builder",  path: "/bot-builder",  labelKey: "botBuilder",   icon: "bot", roles: ["admin"] },
  { key: "ai-center",    path: "/ai-center",    labelKey: "aiCenter",     icon: "brain", roles: ["admin"] },
  { key: "ai-agents",    path: "/ai-agents",    labelKey: "aiAgents",     icon: "sparkles", roles: ["admin"], planFlag: "multi_agent_ai_enabled" },
  { key: "analytics",    path: "/analytics",    labelKey: "analytics",    icon: "chart", roles: ["admin", "supervisor"] },
  { key: "integrations", path: "/integrations", labelKey: "integrations", icon: "link", roles: ["admin"] },
  { key: "teams",        path: "/teams",        labelKey: "teams",        icon: "team", roles: ["admin", "supervisor"] },
  { key: "billing",      path: "/billing",      labelKey: "billing",      icon: "card", roles: ["admin"] },
  { key: "support",      path: "/support",      labelKey: "support",      icon: "book" },
  { key: "sandbox",      path: "/sandbox",      labelKey: "sandbox",      icon: "code", roles: ["admin"], planFlag: "sandbox_enabled" },
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
