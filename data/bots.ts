import type { Locale } from "@/types/common";

export interface FlowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  next: string[];
  config: Record<string, string | string[]>;
}

export interface Bot {
  id: number;
  name: string;
  st: string;
  nodes: number;
  trigger: string;
  conversations: number;
  ai: boolean;
  desc: string;
  stats: { sessions: number; completed: number; dropped: number; avgTime: string; satisfaction: number };
  flow: FlowNode[];
}

export function getBots(lang: Locale): Bot[] {
  const ar = lang === "ar";
  return [
    { id: 0, name: ar ? "بوت الترحيب" : "Welcome Bot", st: "published", nodes: 8, trigger: ar ? "مرحبا" : "hello", conversations: 1240, ai: true, desc: ar ? "يرحب بالعملاء الجدد ويوجههم" : "Welcomes new customers and guides them", stats: { sessions: 1240, completed: 1050, dropped: 190, avgTime: "2.5m", satisfaction: 94 }, flow: [{ id: "1", type: "trigger", label: ar ? "بداية" : "Start", x: 15, y: 10, next: ["2"], config: { keywords: ar ? "مرحبا,هلا,السلام" : "hello,hi,hey" } }, { id: "2", type: "message", label: ar ? "ترحيب" : "Welcome", x: 15, y: 30, next: ["3"], config: { text: ar ? "مرحباً بك!" : "Welcome!" } }, { id: "3", type: "buttons", label: ar ? "خيارات" : "Options", x: 15, y: 50, next: ["4", "5"], config: { buttons: [ar ? "المنتجات" : "Products", ar ? "الدعم" : "Support"] } }, { id: "4", type: "ai", label: "AI", x: 5, y: 70, next: ["6"], config: {} }, { id: "5", type: "transfer", label: ar ? "تحويل" : "Transfer", x: 25, y: 70, next: [], config: { team: ar ? "الدعم" : "Support" } }, { id: "6", type: "end", label: ar ? "نهاية" : "End", x: 15, y: 90, next: [], config: {} }] },
    { id: 1, name: ar ? "بوت الطلبات" : "Order Bot", st: "published", nodes: 15, trigger: ar ? "طلب" : "order", conversations: 856, ai: false, desc: ar ? "يدير استفسارات الطلبات" : "Handles order inquiries", stats: { sessions: 856, completed: 720, dropped: 136, avgTime: "3.2m", satisfaction: 88 }, flow: [] },
    { id: 2, name: ar ? "بوت الدعم" : "Support Bot", st: "testing", nodes: 12, trigger: ar ? "مساعدة" : "help", conversations: 0, ai: true, desc: ar ? "يقدم الدعم الفني" : "Provides technical support", stats: { sessions: 0, completed: 0, dropped: 0, avgTime: "0", satisfaction: 0 }, flow: [] },
    { id: 3, name: ar ? "بوت الحجز" : "Booking Bot", st: "unpublished", nodes: 10, trigger: ar ? "حجز" : "book", conversations: 0, ai: false, desc: ar ? "يدير الحجوزات" : "Manages bookings", stats: { sessions: 0, completed: 0, dropped: 0, avgTime: "0", satisfaction: 0 }, flow: [] },
  ];
}

export const nodeTypes: Record<string, { label: { ar: string; en: string }; color: string; icon: string }> = {
  trigger: { label: { ar: "بداية", en: "Trigger" }, color: "#34C77B", icon: "zap" },
  message: { label: { ar: "رسالة", en: "Message" }, color: "#4A9EFF", icon: "msg" },
  buttons: { label: { ar: "أزرار", en: "Buttons" }, color: "#F5A623", icon: "list" },
  input: { label: { ar: "إدخال", en: "Input" }, color: "#D94F8A", icon: "pencil" },
  condition: { label: { ar: "شرط", en: "Condition" }, color: "#E84855", icon: "zap" },
  ai: { label: { ar: "ذكاء", en: "AI" }, color: "#7C3AED", icon: "brain" },
  api: { label: { ar: "API", en: "API" }, color: "#E8713A", icon: "plug" },
  transfer: { label: { ar: "تحويل", en: "Transfer" }, color: "#34C77B", icon: "users" },
  end: { label: { ar: "نهاية", en: "End" }, color: "#555764", icon: "x" },
};
