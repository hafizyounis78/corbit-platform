import type { Locale } from "@/types/common";

export interface CampaignSegment {
  name: string;
  sent: number;
  open: number;
  click: number;
  conv: number;
}

export interface CampaignTimeline {
  time: string;
  event: string;
  value: number;
}

export interface Campaign {
  id: number;
  name: string;
  st: string;
  recipients: number;
  delivery: number;
  readRate: number;
  replyRate: number;
  cost: number;
  roi: string;
  date: string;
  template: string;
  segment: string;
  behavior: { opened: number; clicked: number; replied: number; converted: number; unsubscribed: number };
  segments: CampaignSegment[];
  timeline: CampaignTimeline[];
  aiInsights: string[];
}

export function getCampaigns(lang: Locale): Campaign[] {
  const ar = lang === "ar";
  return [
    { id: 0, name: ar ? "حملة رمضان" : "Ramadan Campaign", st: "active", recipients: 12500, delivery: 96.2, readRate: 72.1, replyRate: 18.4, cost: 3750, roi: "+340%", date: "2025-03-01", template: ar ? "عرض رمضان" : "Ramadan Offer", segment: ar ? "جميع العملاء" : "All Customers", behavior: { opened: 9012, clicked: 2300, replied: 1450, converted: 580, unsubscribed: 32 }, segments: [{ name: "VIP", sent: 2500, open: 98, click: 45, conv: 28 }, { name: ar ? "جدد" : "New", sent: 4000, open: 94, click: 22, conv: 12 }, { name: ar ? "غير نشطين" : "Inactive", sent: 3000, open: 88, click: 15, conv: 6 }, { name: ar ? "مكررين" : "Repeat", sent: 3000, open: 97, click: 38, conv: 22 }], timeline: [{ time: "09:00", event: ar ? "بدء الإرسال" : "Sending started", value: 0 }, { time: "09:30", event: ar ? "اكتمل الإرسال" : "Complete", value: 12500 }, { time: "10:00", event: ar ? "ذروة الفتح" : "Peak opens", value: 7200 }], aiInsights: ar ? ["أفضل وقت إرسال: 9 صباحاً - معدل فتح أعلى 23%", "شريحة VIP تحقق 3x معدل تحويل", "الرسائل المحتوية على إيموجي تحقق فتح أعلى 18%", "اقتراح: إعادة استهداف 3,488 من لم يفتحوا بعد 24 ساعة"] : ["Best send time: 9 AM - 23% higher open rate", "VIP segment has 3x conversion vs new", "Messages with emoji get 18% higher opens", "Suggest: Retarget 3,488 non-openers after 24h"] },
    { id: 1, name: ar ? "ترحيب العملاء" : "Welcome Series", st: "active", recipients: 850, delivery: 98.5, readRate: 85.3, replyRate: 42.1, cost: 255, roi: "+520%", date: "2025-02-15", template: ar ? "ترحيب" : "Welcome", segment: ar ? "عملاء جدد" : "New Customers", behavior: { opened: 722, clicked: 358, replied: 210, converted: 145, unsubscribed: 3 }, segments: [{ name: ar ? "مجانية" : "Free", sent: 500, open: 97, click: 40, conv: 15 }, { name: ar ? "مدفوعة" : "Paid", sent: 350, open: 99, click: 52, conv: 35 }], timeline: [], aiInsights: ar ? ["سلسلة الترحيب تحقق أعلى ROI", "المتابعة بعد 24 ساعة ترفع التحويل 35%", "اقتراح: إضافة خطوة ثالثة بعرض خاص"] : ["Welcome series has highest ROI", "24h follow-up boosts conversion 35%", "Suggest: Add 3rd step with special offer"] },
    { id: 2, name: ar ? "تذكير الدفع" : "Payment Reminder", st: "completed", recipients: 4200, delivery: 97.8, readRate: 68.4, replyRate: 12.3, cost: 1260, roi: "+180%", date: "2025-02-10", template: ar ? "تذكير" : "Reminder", segment: ar ? "متأخرين" : "Overdue", behavior: { opened: 3402, clicked: 517, replied: 320, converted: 890, unsubscribed: 8 }, segments: [{ name: ar ? "30 يوم" : "30 days", sent: 2000, open: 96, click: 18, conv: 25 }, { name: ar ? "60 يوم" : "60 days", sent: 1200, open: 94, click: 10, conv: 15 }], timeline: [], aiInsights: ar ? ["التذكير الثاني يحقق 2x تحويل أكثر", "أيام الأحد أفضل وقت لتذكير الدفع"] : ["2nd reminder gets 2x more conversions", "Sundays best for payment reminders"] },
    { id: 3, name: ar ? "عرض نهاية الأسبوع" : "Weekend Flash", st: "scheduled", recipients: 8000, delivery: 0, readRate: 0, replyRate: 0, cost: 2400, roi: "-", date: "2025-03-07", template: ar ? "عرض" : "Offer", segment: ar ? "نشطون" : "Active", behavior: { opened: 0, clicked: 0, replied: 0, converted: 0, unsubscribed: 0 }, segments: [{ name: ar ? "نشطون" : "Active", sent: 8000, open: 0, click: 0, conv: 0 }], timeline: [], aiInsights: ar ? ["الجمعة 10 صباحاً أفضل وقت لهذه الشريحة", "اقتراح: A/B اختبار بين عرض 20% vs هدية مجانية"] : ["Friday 10 AM best for this segment", "Suggest: A/B test 20% off vs free gift"] },
    { id: 4, name: ar ? "سلة متروكة" : "Abandoned Cart", st: "active", recipients: 1630, delivery: 95.1, readRate: 61.2, replyRate: 28.7, cost: 489, roi: "+680%", date: "2025-02-20", template: ar ? "سلة" : "Cart", segment: ar ? "سلة متروكة" : "Abandoned", behavior: { opened: 1378, clicked: 468, replied: 245, converted: 312, unsubscribed: 5 }, segments: [{ name: ar ? "أقل من 200" : "<200 SAR", sent: 800, open: 93, click: 25, conv: 15 }, { name: "200-500", sent: 530, open: 96, click: 32, conv: 22 }, { name: "500+", sent: 300, open: 98, click: 42, conv: 35 }], timeline: [], aiInsights: ar ? ["السلات فوق 500 ر.س تحقق أعلى معدل تحويل (35%)", "التذكير بعد ساعتين أفضل من 24 ساعة بـ 45%"] : ["Carts >500 SAR have highest conversion (35%)", "2h reminder 45% better than 24h"] },
  ];
}
