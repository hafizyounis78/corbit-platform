import type { Locale } from "@/types/common";

export interface Contact {
  id: number;
  name: string;
  ph: string;
  email: string;
  tags: string[];
  st: string;
  score: number;
  ltv: number;
  orders: number;
  lastActive: string;
  joined: string;
  city: string;
  // Consent tracking — populated by the backend's contacts API. The
  // four fields together let us prove (per Meta + GDPR) when and how
  // a contact agreed to receive messages, and when they opted out.
  // st === 'blocked' means the contact has opted out.
  opted_in_at?: string | null;
  opt_in_source?: 'manual' | 'import' | 'inbound_message' | 'web_form' | 'api' | string | null;
  opted_out_at?: string | null;
  opt_out_source?: 'whatsapp_keyword' | 'manual' | 'import' | string | null;
}

export function getContacts(lang: Locale): Contact[] {
  const ar = lang === "ar";
  return [
    { id: 0, name: ar ? "أحمد العتيبي" : "Ahmed", ph: "+966551234567", email: "ahmed@ex.com", tags: ["VIP", ar ? "مبيعات" : "Sales"], st: "active", score: 92, ltv: 12400, orders: 18, lastActive: "2026-02-21", joined: "2024-06", city: ar ? "الرياض" : "Riyadh" },
    { id: 1, name: ar ? "سارة" : "Sara", ph: "+966501234567", email: "sara@ex.com", tags: [ar ? "دعم" : "Support"], st: "active", score: 78, ltv: 4200, orders: 6, lastActive: "2026-02-20", joined: "2025-01", city: ar ? "جدة" : "Jeddah" },
    { id: 2, name: ar ? "عبدالله" : "Abdullah", ph: "+966541234567", email: "abd@ex.com", tags: [ar ? "جديد" : "New"], st: "active", score: 45, ltv: 800, orders: 2, lastActive: "2026-02-21", joined: "2025-02", city: ar ? "الدمام" : "Dammam" },
    { id: 3, name: ar ? "منى" : "Mona", ph: "+966561234567", email: "mona@ex.com", tags: ["VIP"], st: "active", score: 88, ltv: 9600, orders: 14, lastActive: "2026-02-19", joined: "2024-08", city: ar ? "الرياض" : "Riyadh" },
    { id: 4, name: ar ? "فيصل" : "Faisal", ph: "+966531234567", email: "faisal@ex.com", tags: [ar ? "مبيعات" : "Sales"], st: "inactive", score: 32, ltv: 1200, orders: 3, lastActive: "2026-01-15", joined: "2024-12", city: ar ? "مكة" : "Makkah" },
  ];
}
