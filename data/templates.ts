import type { Locale } from "@/types/common";

export interface Template {
  id: number;
  name: string;
  cat: string;
  ln: string;
  st: string;
  uses: number;
  open: number;
  click: number;
  body: string;
  vars: string[];
  header: string;
  footer: string;
  buttons: { text: string; type: string }[];
  aiScore: number;
  aiTips: string[];
  sent: number;
  delivered: number;
  read: number;
  replied: number;
}

export function getTemplates(lang: Locale): Template[] {
  const ar = lang === "ar";
  return [
    { id: 0, name: ar ? "ترحيب" : "Welcome", cat: "utility", ln: "ar+en", st: "approved", uses: 12450, open: 89, click: 34, body: ar ? "مرحباً {{1}}! شكراً لانضمامك. استخدم كود {{2}} للحصول على خصم 15%" : "Hi {{1}}! Thanks for joining. Use code {{2}} for 15% off", vars: [ar ? "الاسم" : "Name", ar ? "الكود" : "Code"], header: ar ? "أهلاً بك" : "Welcome", footer: ar ? "كوربت" : "CORBIT", buttons: [{ text: ar ? "تصفح المنتجات" : "Browse Products", type: "url" }, { text: ar ? "تواصل معنا" : "Contact Us", type: "phone" }], aiScore: 92, aiTips: ar ? ["أضف إيموجي لرفع معدل الفتح", "اجعل CTA أكثر وضوحاً"] : ["Add emoji for higher open rate", "Make CTA more prominent"], sent: 14200, delivered: 13900, read: 12638, replied: 2130 },
    { id: 1, name: ar ? "تأكيد" : "Confirm", cat: "utility", ln: "ar", st: "approved", uses: 8900, open: 95, click: 12, body: ar ? "تم تأكيد طلبك رقم {{1}}. سيتم التسليم خلال {{2}} أيام عمل." : "Order {{1}} confirmed. Delivery in {{2}} business days.", vars: [ar ? "رقم الطلب" : "Order#", ar ? "المدة" : "Days"], header: "", footer: "", buttons: [{ text: ar ? "تتبع الطلب" : "Track Order", type: "url" }], aiScore: 88, aiTips: [], sent: 9200, delivered: 9100, read: 8740, replied: 1104 },
    { id: 2, name: ar ? "عرض" : "Offer", cat: "marketing", ln: "ar+en", st: "approved", uses: 15200, open: 76, click: 42, body: ar ? "عرض خاص لك {{1}}! خصم {{2}}% على جميع المنتجات لفترة محدودة" : "Special offer {{1}}! {{2}}% off all products for limited time", vars: [ar ? "الاسم" : "Name", ar ? "النسبة" : "Percent"], header: ar ? "عرض حصري" : "Exclusive Offer", footer: "", buttons: [{ text: ar ? "تسوق الآن" : "Shop Now", type: "url" }], aiScore: 85, aiTips: ar ? ["أضف عنصر الإلحاح"] : ["Add urgency element"], sent: 18500, delivered: 17900, read: 14060, replied: 3420 },
    { id: 3, name: ar ? "تذكير" : "Reminder", cat: "utility", ln: "ar", st: "pending", uses: 0, open: 0, click: 0, body: ar ? "تذكير: لديك فاتورة بقيمة {{1}} ر.س مستحقة بتاريخ {{2}}" : "Reminder: Invoice {{1}} SAR due {{2}}", vars: [ar ? "المبلغ" : "Amount", ar ? "التاريخ" : "Date"], header: "", footer: "", buttons: [], aiScore: 72, aiTips: ar ? ["أضف زر دفع مباشر"] : ["Add direct payment button"], sent: 0, delivered: 0, read: 0, replied: 0 },
    { id: 4, name: "OTP", cat: "authentication", ln: "ar+en", st: "approved", uses: 34000, open: 99, click: 0, body: ar ? "رمز التحقق الخاص بك هو {{1}}. صالح لمدة 5 دقائق." : "Your verification code is {{1}}. Valid for 5 minutes.", vars: [ar ? "الرمز" : "Code"], header: "", footer: "", buttons: [{ text: ar ? "نسخ الرمز" : "Copy Code", type: "quick" }], aiScore: 95, aiTips: [], sent: 89000, delivered: 88500, read: 88100, replied: 450 },
    { id: 5, name: ar ? "استبيان" : "Survey", cat: "marketing", ln: "ar", st: "rejected", uses: 0, open: 0, click: 0, body: ar ? "نقدر رأيك {{1}}! شاركنا تجربتك" : "We value your feedback {{1}}! Share your experience", vars: [ar ? "الاسم" : "Name"], header: "", footer: "", buttons: [{ text: ar ? "ابدأ الاستبيان" : "Start Survey", type: "url" }], aiScore: 60, aiTips: ar ? ["أعد صياغة الرسالة", "أضف حافز للمشاركة"] : ["Rephrase message", "Add incentive"], sent: 0, delivered: 0, read: 0, replied: 0 },
  ];
}
