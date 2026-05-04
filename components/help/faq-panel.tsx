"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";

/**
 * 8 baked-in answers to the most common questions. Static content
 * lives in code so editing copy is a one-line PR — there's no
 * point putting these in DB until we have an admin editor for FAQ.
 */
function buildFaqs(isAr: boolean) {
  return isAr
    ? [
        {
          q: "كيف أربط رقم واتساب جديد؟",
          a: "اذهب للإعدادات > القنوات > إضافة رقم. ستحتاج حساب Facebook Business Manager وصلاحيّات مدير. اتبع خطوات التحقّق من 360dialog (اختيار الرقم، إدخال كود التحقّق، ربط الحساب). الرقم يجب ألّا يكون مستخدماً على واتساب عادي.",
        },
        {
          q: "ما الفرق بين SMS Fallback و Dual Channel؟",
          a: "Fallback: يحاول إرسال واتساب أوّلاً، وإذا فشل (العميل ما عنده واتساب مثلاً) يرسل SMS تلقائياً. Dual: يرسل على القناتين معاً. Fallback أرخص لأنّه ما يرسل SMS إلا عند الحاجة.",
        },
        {
          q: "كم تكلفة وكيل AI؟ وما الفرق عن تحليلات AI؟",
          a: "الردود التلقائيّة من وكيل AI (تخرج للعميل) تُخصم من المحفظة. التحليلات (sentiment، classify، summary، translate، اقتراحات الردّ للوكيل) مجانيّة بالكامل تحت الإعداد الافتراضي 'replies_only'. الأدمن في Nova يقدر يبدّل هذا السلوك.",
        },
        {
          q: "هل يمكن إرسال رسالة لعميل جديد بدون قالب؟",
          a: "عبر واتساب: لا. Meta تتطلّب قالباً معتمداً لبدء أيّ محادثة. بعد ردّ العميل، يمكنك الردّ بنصّ حرّ خلال 24 ساعة. عبر SMS: نعم، يمكنك إرسال نصّ حرّ لأيّ رقم.",
        },
        {
          q: "كيف أنقل محادثة لزميل وكيف أعرف من يديرها؟",
          a: "اضغط 'إسناد ▾' في رأس المحادثة. ابحث واختر القسم أو الوكيل. بعد الإسناد يظهر اسم المسؤول (👤 سعد) أو القسم (👥 فريق الدعم) على بطاقة المحادثة. المحادثات غير المسندة تظهر ⏳.",
        },
        {
          q: "كيف أبلّغ عن رسالة مخالفة من وكيل AI؟",
          a: "اضغط على 🚩 بجانب أي رسالة (سواء من العميل أو البوت أو الوكيل). يصلنا بلاغ مع نسخة من الرسالة. يمكنك أيضاً رفع تذكرة دعم من نوع 'إبلاغ عن محتوى AI' من تاب التذاكر.",
        },
        {
          q: "ما أنواع البوتات المتاحة؟",
          a: "9 أنواع عقد: ترحيب، رسالة، سؤال (مع خيارات)، أزرار، شرط (if/else)، استدعاء API، ردّ AI ذكي، تأخير، وتحويل لوكيل بشري. اربطها بصرياً لبناء أيّ تدفّق محادثة.",
        },
        {
          q: "كيف أشحن رصيد المحفظة؟",
          a: "افتح صفحة الفوترة واضغط 'شحن الرصيد'. اختر مبلغاً سريعاً أو افتح '🧮 حاسبة الرصيد' لتقديره من عدد الرسائل. ادفع بتحويل بنكي وارفع الإيصال — يُؤكَّد خلال 24 ساعة عمل.",
        },
      ]
    : [
        {
          q: "How do I connect a new WhatsApp number?",
          a: "Settings > Channels > Add Number. You need a Facebook Business Manager and admin access. Follow 360dialog verification (select number, enter code, link account). The number must not be on regular WhatsApp.",
        },
        {
          q: "What's the difference between SMS Fallback and Dual Channel?",
          a: "Fallback: tries WhatsApp first, then sends SMS if it fails (e.g. customer has no WhatsApp). Dual: sends on both channels at once. Fallback is cheaper because SMS only fires when needed.",
        },
        {
          q: "What's the cost of AI Agent vs AI Analytics?",
          a: "AI auto-replies that ship to the customer cost wallet credits. Analytics (sentiment, classify, summary, translate, agent reply suggestions) are completely free under the default 'replies_only' billing mode. Admins can flip this from Nova.",
        },
        {
          q: "Can I message a new customer without a template?",
          a: "WhatsApp: no. Meta requires an approved template to start any conversation. After the customer replies, you can send free text within 24 hours. SMS: yes, free text to any number.",
        },
        {
          q: "How do I transfer a chat and see who handles it?",
          a: "Click 'Assign ▾' in the chat header. Search and pick a team or agent. After assignment the handler's name appears on the conversation card (👤 Saad or 👥 Support Team). Unassigned conversations show ⏳.",
        },
        {
          q: "How do I report a problematic AI message?",
          a: "Click 🚩 next to any message (customer, bot, or agent). We get a report with a copy of the message. You can also open a 'AI Content Report' ticket from the Tickets tab.",
        },
        {
          q: "What bot node types are available?",
          a: "9 types: welcome, message, question (with options), buttons, condition (if/else), API call, AI smart reply, delay, and human handoff. Connect them visually to build any conversation flow.",
        },
        {
          q: "How do I top up my wallet?",
          a: "Go to Billing and click Top Up. Pick a quick amount or expand '🧮 Calculator' to estimate from message volume. Pay by bank transfer and upload the receipt — confirmed within 24 business hours.",
        },
      ];
}

export function FaqPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = buildFaqs(isAr);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {faqs.map((f, i) => {
        const open = openIdx === i;
        return (
          <div
            key={i}
            style={{
              borderRadius: 12, background: C.inp, overflow: "hidden",
              transition: "background 0.15s",
            }}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              style={{
                width: "100%", padding: "14px 18px",
                background: "transparent", border: "none",
                cursor: "pointer", fontFamily: FONT_FAMILY,
                display: "flex", alignItems: "center", gap: 10,
                textAlign: "start" as const,
              }}
            >
              <span style={{
                color: C.pri, transition: "transform 0.2s",
                transform: open ? "rotate(90deg)" : "none",
                fontSize: 12, fontWeight: 700,
              }}>▸</span>
              <span style={{
                fontWeight: 600, fontSize: 13, color: C.txt,
                flex: 1, textAlign: "start" as const,
              }}>
                {f.q}
              </span>
            </button>
            {open && (
              <div style={{
                padding: "0 18px 16px 40px",
                fontSize: 12.5, color: C.t2, lineHeight: 1.85,
              }}>
                {f.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
