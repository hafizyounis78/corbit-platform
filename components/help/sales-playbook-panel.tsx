"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";

type Plan = {
  key: string;
  name_ar: string;
  name_en: string;
  monthly_usd: number;
  monthly_sar: number;
  throughput: string;
  conversations: string;
  bestFor_ar: string;
  bestFor_en: string;
  popular?: boolean;
};

type Scenario = {
  id: string;
  customer_ar: string;
  customer_en: string;
  pitch_ar: string;
  pitch_en: string;
  recommend: string;
  objection_ar?: string;
  objection_en?: string;
  reply_ar?: string;
  reply_en?: string;
};

const PLANS: Plan[] = [
  {
    key: "starter",
    name_ar: "Starter",
    name_en: "Starter",
    monthly_usd: 79,
    monthly_sar: 296,
    throughput: "80 msg/sec",
    conversations: "1,000 / day",
    bestFor_ar: "محلّ صغير، عيادة فردية، مكتب 1-3 موظّفين.",
    bestFor_en: "Small shop, single-clinic, 1-3 person office.",
  },
  {
    key: "growth",
    name_ar: "Growth",
    name_en: "Growth",
    monthly_usd: 179,
    monthly_sar: 671,
    throughput: "80 msg/sec",
    conversations: "10,000 / day",
    bestFor_ar: "متوسّطة الحجم، فريق دعم 5-15، مبيعات يوميّة.",
    bestFor_en: "Mid-market, 5-15 support agents, daily sales motion.",
    popular: true,
  },
  {
    key: "business",
    name_ar: "Business",
    name_en: "Business",
    monthly_usd: 299,
    monthly_sar: 1121,
    throughput: "80 msg/sec",
    conversations: "100,000 / day",
    bestFor_ar: "سلسلة فروع، تجارة إلكترونية متوسّطة، تأمين/تمويل.",
    bestFor_en: "Multi-branch chain, mid e-commerce, insurance/finance.",
  },
  {
    key: "enterprise-ht",
    name_ar: "Enterprise + HT",
    name_en: "Enterprise + HT",
    monthly_usd: 349,
    monthly_sar: 1308,
    throughput: "1,000 msg/sec (HT)",
    conversations: "Unlimited",
    bestFor_ar: "بنوك، اتّصالات، تجزئة كبرى، أيّ بثّ > 100k رسالة/ساعة.",
    bestFor_en: "Banks, telcos, large retail, any > 100k msg/hour blast.",
  },
];

const SCENARIOS: Scenario[] = [
  {
    id: "ecom-small",
    customer_ar: "متجر إلكتروني — 500 طلب/شهر، يستخدم WhatsApp شخصي",
    customer_en: "Small e-commerce — 500 orders/month, on personal WhatsApp",
    pitch_ar:
      "ابدأ بـ Starter. يكفي لإرسال تأكيدات الطلبات + ردود تلقائيّة + حملة شهرية. لمّا تصل لـ 1500 طلب/شهر ننقلك لـ Growth.",
    pitch_en:
      "Start with Starter. Covers order confirms + auto-replies + one monthly campaign. Move to Growth at ~1.5k orders/month.",
    recommend: "starter",
    objection_ar: "لازم نشتري SaaS كل شهر؟ نقدر نسوّيها بأنفسنا.",
    objection_en: "Do we really need a SaaS subscription? Can we DIY?",
    reply_ar:
      "DIY يعني WhatsApp شخصي = بدون قوالب معتمدة، ممنوع البثّ، ولا يوجد API. أوّل حظر يقفل الرقم. Corbit يضمن لك حساب رسمي + قنوات قانونيّة.",
    reply_en:
      "DIY = personal WhatsApp = no approved templates, no broadcast, no API. First block freezes the number. Corbit gives you an official account + legal channels.",
  },
  {
    id: "clinic",
    customer_ar: "عيادة طبيّة — مواعيد + تذكير مرضى",
    customer_en: "Medical clinic — appointments + patient reminders",
    pitch_ar:
      "Starter كافٍ، رسائل التذكير Utility (سعر مخفّض). أضف بوت بسيط يجاوب على 'متى موعدي القادم'.",
    pitch_en:
      "Starter is enough. Reminders are Utility-class (cheap). Add a simple bot for 'when is my next appointment?' queries.",
    recommend: "starter",
    objection_ar: "خصوصيّة بيانات المرضى — هل آمنة؟",
    objection_en: "Patient data privacy — is it secure?",
    reply_ar:
      "البيانات على بنية تحتيّة عربيّة (Alibaba Cloud KSA)، تشفير end-to-end من Meta، ولا تُشارَك خارج حسابك.",
    reply_en:
      "Data sits on KSA infrastructure (Alibaba Cloud), Meta E2E encryption, never shared outside your tenant.",
  },
  {
    id: "retail-chain",
    customer_ar: "سلسلة 12 فرع — حملات أسبوعيّة + خدمة عملاء",
    customer_en: "12-branch retail chain — weekly campaigns + support",
    pitch_ar:
      "Business مع Frequency Cap مرفوع لـ 3/7 يوم (مع موافقة Meta). فرّق فرق الدعم في النظام، كل فرع له فلتر منفصل.",
    pitch_en:
      "Business with frequency cap raised to 3/7 days (with Meta sign-off). Split teams in-app — each branch gets its own filter.",
    recommend: "business",
    objection_ar: "لدينا CRM. كيف يتكامل؟",
    objection_en: "We already have a CRM. Does it integrate?",
    reply_ar:
      "Webhooks للـ events (رسالة جديدة، ردّ عميل، فشل إرسال) + REST API للقوالب والحملات. Salesforce/HubSpot جاهزين بـ Zapier.",
    reply_en:
      "Webhooks for events (new message, reply, send failure) + REST API for templates and campaigns. Salesforce/HubSpot via Zapier.",
  },
  {
    id: "bank-large",
    customer_ar: "بنك — 200k عميل، إشعارات OTP + معاملات لحظيّة",
    customer_en: "Bank — 200k customers, OTP + real-time txn alerts",
    pitch_ar:
      "Enterprise + HT (1,000 msg/sec). إلزامي لأنّ الـ throughput الافتراضي 80/ثانية لا يكفي البثّ اللحظي للـ OTP. + SLA مخصّص.",
    pitch_en:
      "Enterprise + HT (1,000 msg/sec). Mandatory — default 80/sec can't handle real-time OTP burst. Custom SLA included.",
    recommend: "enterprise-ht",
    objection_ar: "هل الـ HT يلتزم بأنظمة المصارف؟",
    objection_en: "Is HT compliant with banking regulations?",
    reply_ar:
      "نعم — ISO 27001، SOC 2، تشفير في الاستراحة وفي النقل. عقد NDA + DPA متاحان. الـ logs قابلة للتصدير لجهات التدقيق.",
    reply_en:
      "Yes — ISO 27001, SOC 2, encryption at rest + in transit. NDA + DPA available. Logs exportable for audits.",
  },
  {
    id: "ngo",
    customer_ar: "جمعيّة خيريّة — تواصل دوري مع 5k متبرّع",
    customer_en: "NGO — periodic outreach to 5k donors",
    pitch_ar:
      "Growth. ركّز على Utility templates (شكر، تأكيد استلام، تقرير شهري). تجنّب الـ Marketing لحماية تقييم Meta.",
    pitch_en:
      "Growth. Lean on Utility (thanks, receipts, monthly reports). Avoid Marketing to protect Meta quality.",
    recommend: "growth",
    objection_ar: "ميزانيّتنا محدودة — هل في خصم؟",
    objection_en: "Our budget is tight — any discount?",
    reply_ar:
      "خصم 20% للجمعيّات المسجّلة + 3 شهور مجانيّة عند الدفع السنوي. تواصل مع المبيعات بشهادة التسجيل.",
    reply_en:
      "20% off for registered NGOs + 3 free months on annual prepay. Send the registration cert to sales.",
  },
];

/**
 * Internal-facing Sales Playbook. The public Help Center is for the
 * tenant's own end-users; this surface is for Corbit sales/support
 * staff making the pitch.
 *
 * Source: docs/دليل الفرق الداخلية.docx — §5 Plans + §6 Sales scenarios.
 *
 * Hidden behind a role check in the support page so it never leaks
 * into the customer's own help center.
 */
export function SalesPlaybookPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const [openScenario, setOpenScenario] = useState<string | null>(null);

  const planFor = (key: string) => PLANS.find((p) => p.key === key);

  return (
    <div style={{ fontFamily: FONT_FAMILY }}>
      {/* Header */}
      <Card style={{ padding: 20, marginBottom: 20, background: `linear-gradient(135deg, ${C.pri}10, ${C.ai}10)` }}>
        <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, letterSpacing: 0.5 }}>
          {isAr ? "للموظّفين فقط — مبيعات/دعم" : "INTERNAL — Sales / Support"}
        </div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.txt }}>
          📚 {isAr ? "دليل المبيعات" : "Sales Playbook"}
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: C.t2, lineHeight: 1.6 }}>
          {isAr
            ? "اختر الخطّة الصحيحة لكل عميل، وردّ على اعتراضاته بأسلوب موحّد."
            : "Pick the right plan for each lead, and answer objections with a consistent voice."}
        </p>
      </Card>

      {/* Plans table */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: C.txt }}>
          {isAr ? "💼 الخطط" : "💼 Plans"}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {PLANS.map((p) => (
            <Card
              key={p.key}
              style={{
                padding: 18,
                border: p.popular ? `2px solid ${C.pri}` : `1px solid ${C.brd}`,
                position: "relative",
              }}
            >
              {p.popular && (
                <div style={{
                  position: "absolute", top: -10, [isAr ? "right" : "left"]: 14,
                  padding: "2px 10px", borderRadius: 10,
                  background: C.pri, color: "#fff",
                  fontSize: 10, fontWeight: 700,
                }}>
                  ⭐ {isAr ? "الأكثر اختياراً" : "Most picked"}
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 15, color: C.txt, marginBottom: 6 }}>
                {isAr ? p.name_ar : p.name_en}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.pri, marginBottom: 2 }}>
                ${p.monthly_usd}<span style={{ fontSize: 11, color: C.t2, fontWeight: 500 }}> / {isAr ? "شهر" : "mo"}</span>
              </div>
              <div style={{ fontSize: 11, color: C.t3, marginBottom: 12 }}>
                ≈ {p.monthly_sar.toLocaleString()} {isAr ? "ريال" : "SAR"}
              </div>
              <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: 10, fontSize: 12, color: C.t2, lineHeight: 1.7 }}>
                <div>⚡ {p.throughput}</div>
                <div>💬 {p.conversations}</div>
                <div style={{ marginTop: 8, color: C.txt, fontSize: 11.5, lineHeight: 1.5 }}>
                  {isAr ? p.bestFor_ar : p.bestFor_en}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11.5, color: C.t3 }}>
          💡 {isAr
            ? "الأسعار قابلة للتعديل من Nova > Plans. ما هو معروض هنا = القيم الافتراضيّة."
            : "Prices are editable from Nova > Plans. The values shown here are the defaults."}
        </div>
      </div>

      {/* Scenarios */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: C.txt }}>
          {isAr ? "🎯 سيناريوهات شائعة" : "🎯 Common Scenarios"}
        </h3>
        <div style={{ display: "grid", gap: 10 }}>
          {SCENARIOS.map((s) => {
            const isOpen = openScenario === s.id;
            const plan = planFor(s.recommend);
            return (
              <Card key={s.id} style={{ padding: 0, overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setOpenScenario(isOpen ? null : s.id)}
                  style={{
                    width: "100%", padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 12,
                    background: "none", border: "none", cursor: "pointer",
                    textAlign: isAr ? "right" : "left",
                    fontFamily: FONT_FAMILY, color: C.txt,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2 }}>
                      {isAr ? s.customer_ar : s.customer_en}
                    </div>
                    {plan && (
                      <div style={{ fontSize: 11.5, color: C.pri, fontWeight: 600 }}>
                        → {isAr ? plan.name_ar : plan.name_en} (${plan.monthly_usd}/{isAr ? "شهر" : "mo"})
                      </div>
                    )}
                  </div>
                  <span style={{ color: C.t3, fontSize: 14 }}>{isOpen ? "▾" : (isAr ? "◂" : "▸")}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.brd}`, background: C.inp }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: C.t2, fontWeight: 700, marginBottom: 4, letterSpacing: 0.3 }}>
                        🗣️ {isAr ? "الطرح" : "PITCH"}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.txt, lineHeight: 1.7 }}>
                        {isAr ? s.pitch_ar : s.pitch_en}
                      </div>
                    </div>
                    {s.objection_ar && (
                      <div style={{ paddingTop: 10, borderTop: `1px dashed ${C.brd}` }}>
                        <div style={{ fontSize: 11, color: C.warn, fontWeight: 700, marginBottom: 4, letterSpacing: 0.3 }}>
                          🛡️ {isAr ? "اعتراض شائع" : "COMMON OBJECTION"}
                        </div>
                        <div style={{ fontSize: 12.5, color: C.t2, fontStyle: "italic", marginBottom: 8 }}>
                          "{isAr ? s.objection_ar : s.objection_en}"
                        </div>
                        <div style={{ fontSize: 11, color: C.pri, fontWeight: 700, marginBottom: 4, letterSpacing: 0.3 }}>
                          ✅ {isAr ? "ردّ مقترح" : "SUGGESTED REPLY"}
                        </div>
                        <div style={{ fontSize: 12.5, color: C.txt, lineHeight: 1.7 }}>
                          {isAr ? s.reply_ar : s.reply_en}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <Card style={{ padding: 16, marginTop: 20, background: C.inp, border: `1px dashed ${C.brd}` }}>
        <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.7 }}>
          <strong style={{ color: C.txt }}>📖 {isAr ? "تذكير:" : "Reminder:"}</strong>{" "}
          {isAr
            ? "هذا الدليل مرجع داخلي — لا تشاركه مع العملاء كما هو. اقتبس منه ما يناسب ولكن صياغة الردود خارجياً يجب أن تكون مخصّصة."
            : "This is an internal reference — don't share it as-is with customers. Quote what fits, but external replies should be tailored."}
        </div>
      </Card>
    </div>
  );
}
