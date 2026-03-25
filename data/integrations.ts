import type { Locale } from "@/types/common";

export interface Integration {
  id: string;
  name: string;
  cat: string;
  desc: string;
  icon: string;
  color: string;
  popular?: boolean;
  features: string[];
}

export function getIntegrations(lang: Locale): Integration[] {
  const ar = lang === "ar";
  return [
    { id: "shopify", name: "Shopify", cat: "ecommerce", desc: ar ? "مزامنة المنتجات والطلبات" : "Sync products & orders", icon: "\uD83D\uDED2", color: "#96BF48", popular: true, features: ar ? ["مزامنة تلقائية", "إشعارات الطلبات", "تتبع الشحن", "سلة متروكة"] : ["Auto sync", "Order notifications", "Shipping tracking", "Cart recovery"] },
    { id: "hubspot", name: "HubSpot", cat: "crm", desc: ar ? "مزامنة جهات الاتصال والصفقات" : "Sync contacts & deals", icon: "\uD83D\uDD36", color: "#FF7A59", popular: true, features: ar ? ["مزامنة ثنائية", "إنشاء صفقات", "تسجيل النشاط"] : ["Two-way sync", "Create deals", "Activity logging"] },
    { id: "zapier", name: "Zapier", cat: "automation", desc: ar ? "اربط مع 5000+ تطبيق" : "Connect 5000+ apps", icon: "\u26A1", color: "#FF4A00", popular: true, features: ar ? ["5000+ تكامل", "أتمتة بدون كود", "مشغلات واتساب"] : ["5000+ integrations", "No-code", "WhatsApp triggers"] },
    { id: "sheets", name: "Google Sheets", cat: "automation", desc: ar ? "تصدير البيانات تلقائياً" : "Auto-export data", icon: "\uD83D\uDCCA", color: "#0F9D58", features: ar ? ["تصدير جهات الاتصال", "تقارير", "تحديث تلقائي"] : ["Export contacts", "Reports", "Auto-update"] },
    { id: "salesforce", name: "Salesforce", cat: "crm", desc: ar ? "تكامل CRM للمؤسسات" : "Enterprise CRM", icon: "\u2601\uFE0F", color: "#00A1E0", popular: true, features: ar ? ["مزامنة العملاء", "تحديث الفرص", "تقارير مخصصة"] : ["Lead sync", "Opportunity updates", "Custom reports"] },
    { id: "stripe", name: "Stripe", cat: "payment", desc: ar ? "معالجة المدفوعات" : "Process payments", icon: "\uD83D\uDCB3", color: "#635BFF", popular: true, features: ar ? ["روابط دفع", "إيصالات تلقائية", "اشتراكات"] : ["Payment links", "Auto receipts", "Subscriptions"] },
    { id: "slack", name: "Slack", cat: "productivity", desc: ar ? "إشعارات الفريق" : "Team notifications", icon: "\uD83D\uDCAC", color: "#4A154B", features: ar ? ["إشعارات", "تنبيهات VIP", "تقارير يومية"] : ["Alerts", "VIP alerts", "Daily reports"] },
  ];
}

export const integrationCategories = [
  { key: "all", labelAr: "الكل", labelEn: "All" },
  { key: "ecommerce", labelAr: "متاجر", labelEn: "E-com" },
  { key: "crm", labelAr: "CRM", labelEn: "CRM" },
  { key: "automation", labelAr: "أتمتة", labelEn: "Auto" },
  { key: "payment", labelAr: "مدفوعات", labelEn: "Pay" },
  { key: "productivity", labelAr: "إنتاجية", labelEn: "Prod" },
];
