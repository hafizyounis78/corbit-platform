/**
 * Plan copy and trial values for signup steps 3–4, taken as-is from the
 * approved design («باقات WhatsBit 2026» / «رحلة عملاء كوربت»).
 *
 * Prices are NOT here: they come from GET /subscription/catalog, and the
 * amount that is charged is computed by the backend. This file only
 * holds the words shown next to them.
 */

export type PlanKey = "basic" | "starter" | "business" | "enterprise";

export const PLAN_COPY: Record<PlanKey, { n: string; en: string; hot?: boolean; keys: string[]; f: string[] }> = {
  basic: {
    n: "الأساسية", en: "BASIC",
    keys: ["2,000 بث + 1,000 محادثة", "مستخدمان + رقم واتساب"],
    f: ["2,000 رسالة بث شهريًا", "1,000 محادثة خدمية", "مستخدمان + رقم واتساب", "قوالب غير محدودة", "ردود تلقائية بقواعد", "امتثال PDPL + ZATCA", "دعم بريد خلال 24 ساعة"],
  },
  starter: {
    n: "البداية", en: "STARTER",
    keys: ["10,000 بث + 2,500 محادثة", "5 مستخدمين"],
    f: ["كل مميزات الأساسية", "10,000 بث + 2,500 محادثة", "شات بوت ذكي (5,000 رسالة)", "5 مستخدمين", "قوالب غير محدودة", "تكامل سلة وزد و Shopify", "API محدود (5,000 طلب)", "دعم خلال 4 ساعات"],
  },
  business: {
    n: "الأعمال", en: "BUSINESS", hot: true,
    keys: ["25,000 بث + 5,000 محادثة", "15 مستخدمًا"],
    f: ["كل مميزات البداية", "25,000 بث + 5,000 محادثة", "بوت غير محدود + رسائل الذكاء (10,000)", "15 مستخدمًا", "قوالب غير محدودة", "API كامل (50,000 طلب) + Webhooks", "مدير حساب + تدريب البوت", "دعم هاتف خلال ساعتين"],
  },
  enterprise: {
    n: "المؤسسات", en: "ENTERPRISE",
    keys: ["50,000 بث + 10,000 محادثة", "40 مستخدمًا"],
    f: ["كل مميزات الأعمال", "50,000 بث + 10,000 محادثة", "بوت غير محدود + رسائل الذكاء (50,000)", "40 مستخدمًا", "API مفتوح غير محدود + SDKs", "نماذج LLM متعددة", "SLA 99.9% مخصص", "دعم أولوية 24/7 خلال ساعة"],
  },
};

/** Meta's per-message fees, billed separately by usage. */
export const META_FEES: { k: string; v: string; u: string; n?: string }[] = [
  { k: "Marketing", v: "0.2159", u: "ر.س للرسالة" },
  { k: "Utility", v: "0.0401", u: "ر.س للرسالة" },
  { k: "Service", v: "0.0401", u: "ر.س للرسالة", n: "أول 1,000 شهريًا مجانًا لكل رقم" },
  { k: "توثيق محلي OTP", v: "0.0401", u: "ر.س للرسالة" },
  { k: "الرسائل الواردة", v: "مجانًا", u: "بلا رسوم" },
];

/** Free trial limits. */
export const TRIAL = { total: 20, day: 10, days: 7, inv: 5, ext: 3 } as const;

/** One plan as the catalog endpoint returns it. */
export type CatalogPlan = {
  key: PlanKey;
  name: string;
  price: number;
  verification_fee: number;
  setup_fee: number;
  users: number;
  extra_user_price: number;
  extra_users_max: number | null;
};

export type Catalog = {
  vat_percent: number;
  yearly_discount_percent: number;
  plans: CatalogPlan[];
  payment: { available: boolean };
};

export type Quote = {
  months: number; monthlyH: number; planH: number; planInclH: number; extraH: number; onceH: number; subH: number; vatH: number; totH: number;
};

/**
 * The same arithmetic as the backend's SubscriptionPricing, in halalas,
 * so the page can update instantly. Display only — the backend's figure
 * is what gets charged.
 */
export function quote(p: CatalogPlan, yearly: boolean, extraUsers: number, c: Pick<Catalog, "vat_percent" | "yearly_discount_percent">): Quote {
  const months = yearly ? 12 : 1;
  const monthlyH = yearly ? Math.round(p.price * (100 - c.yearly_discount_percent)) : p.price * 100;
  const planH = monthlyH * months;
  const extraH = extraUsers * p.extra_user_price * 100 * months;
  const onceH = (p.verification_fee + p.setup_fee) * 100;
  const subH = planH + extraH + onceH;
  const vatH = Math.round((subH * c.vat_percent) / 100);
  return { months, monthlyH, planH, planInclH: planH + Math.round((planH * c.vat_percent) / 100), extraH, onceH, subH, vatH, totH: subH + vatH };
}

export const money = (h: number) => (h / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const price = (h: number) => (h % 100 === 0 ? (h / 100).toLocaleString("en-US") : money(h));
export const usersLabel = (n: number) => (n === 1 ? "مستخدم واحد" : n === 2 ? "مستخدمان" : n >= 3 && n <= 10 ? `${n} مستخدمين` : `${n.toLocaleString("en-US")} مستخدمًا`);

export type Line = { k: string; sub?: string; once?: boolean; v: string; sep?: boolean };

/** The order lines shown in the side summary and on the payment step. */
export function orderLines(p: CatalogPlan, yearly: boolean, extraUsers: number, q: Quote, vatPercent: number): Line[] {
  const lines: (Line | null)[] = [
    { k: `باقة ${PLAN_COPY[p.key].n} — ${yearly ? "سنوي" : "شهري"}`, sub: yearly ? `${price(q.monthlyH)} ر.س × 12 شهرًا` : "", v: money(q.planH) },
    extraUsers ? { k: "مستخدمون إضافيون", sub: `${extraUsers} × ${p.extra_user_price} ر.س${yearly ? " × 12 شهرًا" : " شهريًا"}`, v: money(q.extraH) } : null,
    { k: "رسوم التوثيق", once: true, v: money(p.verification_fee * 100) },
    { k: "رسوم الإعداد", once: true, v: money(p.setup_fee * 100) },
    { k: "المجموع قبل الضريبة", v: money(q.subH), sep: true },
    { k: `ضريبة القيمة المضافة ${vatPercent}%`, v: money(q.vatH) },
  ];
  return lines.filter(Boolean) as Line[];
}
