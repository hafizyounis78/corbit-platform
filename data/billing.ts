import type { Locale } from "@/types/common";

export interface Plan {
  id: number;
  name: string;
  price: number;
  agents: number;
  convos: string;
  ai: string;
  features: string[];
  current: boolean;
}

export interface Transaction {
  type: string;
  desc: string;
  amount: number;
  date: string;
  ref: string;
}

export function getPlans(lang: Locale): Plan[] {
  const ar = lang === "ar";
  return [
    { id: 0, name: ar ? "المبتدئ" : "Starter", price: 299, agents: 3, convos: "1,000", ai: "500", features: ar ? ["3 وكلاء", "1,000 محادثة", "بوت بسيط", "تقارير أساسية"] : ["3 agents", "1,000 conversations", "Basic bot", "Basic reports"], current: false },
    { id: 1, name: ar ? "الأعمال" : "Business", price: 799, agents: 10, convos: "5,000", ai: "2,000", features: ar ? ["10 وكلاء", "5,000 محادثة", "بوت متقدم", "تحليلات", "تكاملات"] : ["10 agents", "5,000 conversations", "Advanced bot", "Analytics", "Integrations"], current: false },
    { id: 2, name: ar ? "المؤسسات" : "Enterprise", price: 1999, agents: 50, convos: "25,000", ai: "10,000", features: ar ? ["50 وكيل", "25,000 محادثة", "AI متقدم", "تحليلات كاملة", "دعم مخصص", "SLA مضمون"] : ["50 agents", "25,000 conversations", "Advanced AI", "Full analytics", "Dedicated support", "SLA guaranteed"], current: true },
  ];
}

export function getTransactions(lang: Locale): Transaction[] {
  const ar = lang === "ar";
  return [
    { type: "charge", desc: ar ? "واتساب" : "WhatsApp", amount: -2450, date: "2026-02-20", ref: "TXN-001" },
    { type: "payment", desc: ar ? "شحن" : "Top up", amount: 5000, date: "2026-02-18", ref: "TXN-002" },
    { type: "charge", desc: "AI", amount: -320, date: "2026-02-17", ref: "TXN-003" },
    { type: "refund", desc: ar ? "استرداد" : "Refund", amount: 150, date: "2026-02-15", ref: "TXN-004" },
    { type: "charge", desc: ar ? "اشتراك" : "Sub", amount: -1200, date: "2026-02-01", ref: "TXN-005" },
  ];
}
