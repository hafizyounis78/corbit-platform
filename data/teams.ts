import type { Locale } from "@/types/common";

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  team: string;
  online: boolean;
  stats: { convos: number; frt: string; res: string; csat: number; load: number };
  schedule: Record<string, boolean>;
  skills: string[];
}

export interface Team {
  id: number;
  name: string;
  color: string;
  lead: string;
  convos: number;
  csat: number;
  online: number;
  total: number;
  rules: string[];
}

export function getTeamMembers(lang: Locale): TeamMember[] {
  const ar = lang === "ar";
  return [
    { id: 0, name: ar ? "سعد" : "Saad", email: "saad@corbit.sa", role: "supervisor", team: ar ? "الدعم" : "Support", online: true, stats: { convos: 12, frt: "1.2m", res: "8m", csat: 96, load: 60 }, schedule: { sun: true, mon: true, tue: true, wed: true, thu: true, fri: false, sat: false }, skills: [ar ? "دعم" : "Support", ar ? "تقني" : "Technical"] },
    { id: 1, name: ar ? "هند" : "Hind", email: "hind@corbit.sa", role: "agent", team: ar ? "الدعم" : "Support", online: true, stats: { convos: 8, frt: "2.1m", res: "12m", csat: 92, load: 45 }, schedule: { sun: true, mon: true, tue: true, wed: true, thu: true, fri: false, sat: false }, skills: [ar ? "دعم" : "Support"] },
    { id: 2, name: ar ? "ماجد" : "Majed", email: "majed@corbit.sa", role: "agent", team: ar ? "الدعم" : "Support", online: false, stats: { convos: 10, frt: "1.8m", res: "10m", csat: 89, load: 75 }, schedule: { sun: true, mon: true, tue: true, wed: true, thu: true, fri: false, sat: false }, skills: [ar ? "دعم" : "Support", ar ? "فوترة" : "Billing"] },
    { id: 3, name: ar ? "ليلى" : "Laila", email: "laila@corbit.sa", role: "supervisor", team: ar ? "المبيعات" : "Sales", online: true, stats: { convos: 6, frt: "0.8m", res: "5m", csat: 97, load: 30 }, schedule: { sun: true, mon: true, tue: true, wed: true, thu: true, fri: false, sat: false }, skills: [ar ? "مبيعات" : "Sales", "VIP"] },
    { id: 4, name: ar ? "طارق" : "Tariq", email: "tariq@corbit.sa", role: "agent", team: ar ? "المبيعات" : "Sales", online: false, stats: { convos: 0, frt: "—", res: "—", csat: 0, load: 0 }, schedule: { sun: true, mon: true, tue: false, wed: true, thu: true, fri: false, sat: false }, skills: [ar ? "مبيعات" : "Sales"] },
  ];
}

export function getTeams(lang: Locale): Team[] {
  const ar = lang === "ar";
  return [
    { id: 0, name: ar ? "الدعم" : "Support", color: "#4A9EFF", lead: ar ? "سعد" : "Saad", convos: 30, csat: 93, online: 2, total: 3, rules: [ar ? "توزيع تلقائي" : "Auto-assign", ar ? "أولوية VIP" : "VIP priority"] },
    { id: 1, name: ar ? "المبيعات" : "Sales", color: "#34C77B", lead: ar ? "ليلى" : "Laila", convos: 6, csat: 97, online: 1, total: 2, rules: [ar ? "توزيع يدوي" : "Manual assign"] },
    { id: 2, name: ar ? "الفوترة" : "Billing", color: "#F5A623", lead: ar ? "نواف" : "Nawaf", convos: 4, csat: 90, online: 1, total: 1, rules: [ar ? "توزيع تلقائي" : "Auto-assign"] },
  ];
}
