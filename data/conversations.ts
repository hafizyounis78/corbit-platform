import type { Locale } from "@/types/common";

export interface Conversation {
  id?: string;
  name: string;
  ph: string;
  email: string;
  msg: string;
  time: string;
  unread: number;
  st: string;
  pri: string;
  tag: string;
  sentiment: string;
  intent: string;
  online: boolean;
  orders: number;
  joined: string;
  notes: string;
  /** True when the AI auto-reply is currently handling this conversation. */
  aiEnabled?: boolean;
  /** Resolved assignment from the API — present when a team or agent
   *  has been picked for this conversation. Used by the inbox list and
   *  chat header to show "👤 [name]" or an "Unassigned" pill. */
  assignedUser?: { id: string; name: string } | null;
  assignedTeam?: { id: string; name: string } | null;
}

export function getConversations(lang: Locale): Conversation[] {
  const ar = lang === "ar";
  return [
    { name: ar ? "أحمد" : "Ahmed", ph: "+966 55 XXX", email: "ahmed@ex.com", msg: ar ? "استفسار عن العروض" : "About offers", time: "2:30 PM", unread: 3, st: "open", pri: "high", tag: ar ? "مبيعات" : "Sales", sentiment: "positive", intent: ar ? "استفسار عروض" : "Offer inquiry", online: true, orders: 5, joined: "2024-06", notes: ar ? "عميل VIP" : "VIP" },
    { name: ar ? "فاطمة" : "Fatima", ph: "+966 50 XXX", email: "f@ex.com", msg: ar ? "شكراً" : "Thanks", time: "1:45 PM", unread: 0, st: "solved", pri: "low", tag: ar ? "دعم" : "Support", sentiment: "positive", intent: ar ? "شكر" : "Thanks", online: false, orders: 2, joined: "2025-01", notes: "" },
    { name: ar ? "محمد" : "Mohammed", ph: "+966 54 XXX", email: "m@ex.com", msg: ar ? "متى التسليم؟" : "Delivery?", time: "12:20 PM", unread: 1, st: "pending", pri: "medium", tag: ar ? "طلبات" : "Orders", sentiment: "negative", intent: ar ? "استفسار شحن" : "Shipping", online: true, orders: 8, joined: "2024-11", notes: ar ? "يتابع بشكل متكرر" : "Frequent" },
    { name: ar ? "نورة" : "Noura", ph: "+966 56 XXX", email: "n@ex.com", msg: ar ? "مساعدة" : "Help", time: "11:05 AM", unread: 2, st: "open", pri: "high", tag: ar ? "دعم فني" : "Tech", sentiment: "neutral", intent: ar ? "تغيير عنوان" : "Address change", online: true, orders: 1, joined: "2025-02", notes: "" },
    { name: "James", ph: "+966 59 XXX", email: "j@ex.com", msg: "Cancel subscription", time: "10:15 AM", unread: 1, st: "open", pri: "medium", tag: ar ? "فوترة" : "Billing", sentiment: "negative", intent: ar ? "إلغاء" : "Cancel", online: false, orders: 12, joined: "2024-08", notes: "English" },
  ];
}

export interface ChatMessage {
  id?: string;
  from: "customer" | "bot" | "agent";
  text: string;
  time: string;
}

export function getChatMessages(lang: Locale): ChatMessage[] {
  const ar = lang === "ar";
  return [
    { from: "customer", text: ar ? "السلام عليكم، عندكم عروض رمضان؟" : "Hello, Ramadan offers?", time: "2:25 PM" },
    { from: "bot", text: ar ? "مرحباً بك! كيف أساعدك؟" : "Welcome! How can I help?", time: "2:25 PM" },
    { from: "customer", text: ar ? "تفاصيل باقة المؤسسات" : "Enterprise details", time: "2:27 PM" },
    { from: "agent", text: ar ? "باقة المؤسسات تشمل 50 وكيل + 10 أرقام" : "Enterprise: 50 agents + 10 numbers", time: "2:30 PM" },
    { from: "customer", text: ar ? "ممتاز! خصم سنوي؟" : "Great! Annual discount?", time: "2:32 PM" },
  ];
}
