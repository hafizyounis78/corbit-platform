"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";

interface GuideStep {
  title: string;
  desc: string;
  tip?: string;
  /** Page to open when the user clicks the step's link button. */
  linkPath?: string;
  /** Visual cue emoji rendered next to the step. */
  visual?: string;
}

interface Guide {
  id: string;
  title: string;
  icon: string;
  color: string;
  /** Tags drive the search filter on the guides list. */
  tags: string[];
  steps: GuideStep[];
}

/**
 * Static onboarding guides. The data lives in the frontend bundle —
 * no backend endpoint — so editing copy is a one-line PR. Each guide
 * is a sequence of 5–6 steps with visual cues + optional cross-links
 * back into the platform pages they describe (Settings, Templates, …).
 */
function buildGuides(isAr: boolean, C: any): Guide[] {
  return [
    {
      id: "start",
      title: isAr ? "بدء الاستخدام" : "Getting Started",
      icon: "🚀",
      color: C.pri,
      tags: ["setup", "account", "whatsapp", "إعداد", "حساب"],
      steps: isAr
        ? [
            { title: "إنشاء الحساب", desc: "سجّل في Corbit وأكمل بيانات شركتك (الاسم، البريد، رقم الهاتف).", tip: "💡 استخدم بريد الشركة الرسمي.", visual: "📋", linkPath: "/settings" },
            { title: "ربط رقم واتساب", desc: "اذهب للإعدادات > القنوات > إضافة رقم. اتبع خطوات التحقّق من 360dialog.", tip: "⚠️ تأكّد أنّ الرقم غير مستخدم على واتساب عادي.", visual: "🔗", linkPath: "/settings?tab=channels" },
            { title: "إعداد ملف الأعمال", desc: "اضبط اسم العرض، الوصف، العنوان، والموقع. هذه تظهر للعميل عند فتح المحادثة.", tip: "💡 أضف شعار 640×640 بكسل على الأقل.", visual: "🏢", linkPath: "/settings" },
            { title: "إضافة الفريق", desc: "افتح قسم الفرق وأضف الأعضاء. حدّد لكل واحد دوره (مدير/مشرف/وكيل) والفريق المنتمي إليه.", tip: "💡 ابدأ بمشرف واحد ثم أضف الوكلاء.", visual: "👥", linkPath: "/teams" },
            { title: "إنشاء أوّل قالب", desc: "اذهب للقوالب > إنشاء. اختر الفئة، اللغة، أضف المتغيّرات والأزرار، ثمّ أرسل للمراجعة.", tip: "⚠️ المراجعة 24-48 ساعة. لا تعدّل بعد الاعتماد.", visual: "📝", linkPath: "/templates" },
            { title: "إرسال أوّل حملة", desc: "بعد اعتماد القالب، اذهب للحملات > إنشاء. اختر القالب والشريحة ثمّ أرسل!", tip: "💡 جرّب الإرسال على رقمك أوّلاً.", visual: "📢", linkPath: "/campaigns" },
          ]
        : [
            { title: "Create Account", desc: "Sign up and fill company details.", tip: "💡 Use official company email.", visual: "📋", linkPath: "/settings" },
            { title: "Connect WhatsApp", desc: "Settings > Channels > Add Number. Follow 360dialog verification.", tip: "⚠️ Number must not be on regular WhatsApp.", visual: "🔗", linkPath: "/settings?tab=channels" },
            { title: "Setup Business Profile", desc: "Customise display name, about, address, website.", tip: "💡 Logo at least 640×640 px.", visual: "🏢", linkPath: "/settings" },
            { title: "Add Team", desc: "Teams > add members with roles (admin/supervisor/agent) and team assignment.", tip: "💡 Start with one supervisor.", visual: "👥", linkPath: "/teams" },
            { title: "First Template", desc: "Templates > Create. Pick category, language, add variables + buttons, submit.", tip: "⚠️ Review takes 24–48h. Don't edit after approval.", visual: "📝", linkPath: "/templates" },
            { title: "First Campaign", desc: "Once approved, Campaigns > Create. Pick template + segment, send.", tip: "💡 Test on your own number first.", visual: "📢", linkPath: "/campaigns" },
        ],
    },
    {
      id: "inbox",
      title: isAr ? "إدارة المحادثات" : "Managing Conversations",
      icon: "💬",
      color: "#25D366",
      tags: ["inbox", "chat", "assign", "AI", "محادثة", "إسناد"],
      steps: isAr
        ? [
            { title: "صندوق الوارد الموحّد", desc: "كل المحادثات في مكان واحد. استخدم الفلاتر للتنقّل.", tip: "💡 المحادثات غير المسندة تظهر ⏳.", visual: "📥", linkPath: "/inbox" },
            { title: "الردّ على العملاء", desc: "اضغط المحادثة لفتحها، اكتب الردّ وأرسل. يمكنك إرفاق صور ومستندات.", tip: "💡 استخدم اقتراحات AI للردّ بضغطة.", visual: "💬" },
            { title: "إسناد المحادثة", desc: "اضغط 'إسناد ▾' واختر القسم أو الوكيل. الاسم يظهر مباشرة على بطاقة المحادثة.", tip: "💡 إسناد لقسم يوزّع تلقائياً.", visual: "🔄" },
            { title: "تفعيل وكيل AI", desc: "اضغط زرّ AI لتفعيل الردّ التلقائي. يردّ بناءً على قاعدة المعرفة والتعليمات.", tip: "⚠️ راقب الردود أوّلاً، استخدم 🚩 للإبلاغ.", visual: "🧠" },
            { title: "الترجمة والإبلاغ", desc: "🌐 تترجم رسالة. 🚩 يبلّغ عن محتوى مخالف.", tip: "💡 زرّ 🌐 في الـ header يترجم كل المحادثة.", visual: "🌐" },
          ]
        : [
            { title: "Unified Inbox", desc: "All conversations in one place. Use filters to navigate.", tip: "💡 Unassigned shows ⏳.", visual: "📥", linkPath: "/inbox" },
            { title: "Reply", desc: "Click a chat, type, send. Attach media as needed.", tip: "💡 Use AI quick-reply suggestions.", visual: "💬" },
            { title: "Assign", desc: "Click Assign ▾, search teams/agents.", tip: "💡 Team assign auto-distributes.", visual: "🔄" },
            { title: "AI Agent", desc: "Toggle AI for auto-reply from knowledge base.", tip: "⚠️ Monitor first. Use 🚩 to report.", visual: "🧠" },
            { title: "Translate & Report", desc: "🌐 translate, 🚩 report content.", tip: "💡 Header 🌐 translates entire thread.", visual: "🌐" },
        ],
    },
    {
      id: "campaigns",
      title: isAr ? "إنشاء الحملات" : "Campaigns",
      icon: "📢",
      color: "#F5A623",
      tags: ["campaign", "send", "schedule", "حملة", "جدولة"],
      steps: isAr
        ? [
            { title: "إنشاء حملة", desc: "+ إنشاء حملة. الاسم، القالب المعتمد، الشريحة المستهدفة.", tip: "💡 جرّب AI Builder لقوالب جاهزة.", visual: "📢", linkPath: "/campaigns" },
            { title: "اختيار القناة", desc: "واتساب 📱 / SMS 💬 / كلاهما. التكلفة تتغيّر تلقائياً.", tip: "💡 SMS Fallback أوفر — يرسل SMS فقط عند فشل واتساب.", visual: "📡" },
            { title: "الجدولة", desc: "فوري، مجدول (تاريخ/وقت)، أو متكرّر.", tip: "💡 أفضل وقت: 10ص–12ظ أو 7م–9م.", visual: "⏰" },
            { title: "اختبار A/B", desc: "نسختين مختلفتين. العيّنة 10–20%، الأفضل للبقيّة.", tip: "💡 غيّر عنصراً واحداً فقط بين النسختين.", visual: "🔬" },
            { title: "متابعة الأداء", desc: "مرسل ← وصل ← مقروء ← نقر ← تحويل. AI يقترح تحسينات.", tip: "💡 معدّل قراءة جيّد لواتساب: 70%+.", visual: "📊", linkPath: "/analytics" },
          ]
        : [
            { title: "Create", desc: "Name, approved template, target segment.", tip: "💡 Try the AI Builder for presets.", visual: "📢", linkPath: "/campaigns" },
            { title: "Channel", desc: "WhatsApp / SMS / both. Cost updates live.", tip: "💡 Fallback is cheaper.", visual: "📡" },
            { title: "Schedule", desc: "Now, scheduled, or recurring.", tip: "💡 Best windows: 10AM–12PM, 7–9PM.", visual: "⏰" },
            { title: "A/B Test", desc: "2 variants, 10–20% sample, winner to rest.", tip: "💡 Change one element only.", visual: "🔬" },
            { title: "Performance", desc: "Funnel + AI recommendations.", tip: "💡 Good WA: 70%+ read.", visual: "📊", linkPath: "/analytics" },
        ],
    },
    {
      id: "templates",
      title: isAr ? "بناء القوالب" : "Templates",
      icon: "📝",
      color: "#4A9EFF",
      tags: ["template", "Meta", "approve", "قالب", "اعتماد"],
      steps: isAr
        ? [
            { title: "إنشاء قالب", desc: "الاسم، الفئة (تسويقي/خدمي/مصادقة)، اللغة.", tip: "💡 الخدمي أرخص من التسويقي.", visual: "📝", linkPath: "/templates" },
            { title: "المتغيّرات", desc: "{{1}} {{2}} {{3}} في النص. أضف قيمة تجريبيّة لكل متغيّر.", tip: "💡 {{1}} عادةً للاسم.", visual: "{}" },
            { title: "الأزرار", desc: "حتى 3 أزرار: رابط URL، اتصال، ردّ سريع. ترفع التفاعل 40%.", tip: "💡 زرّ CTA واحد واضح أفضل من 3.", visual: "🔘" },
            { title: "المعاينة", desc: "شاهد القالب كما سيظهر للعميل مع تلوين المتغيّرات.", tip: "💡 تأكّد من الوضوح على الجوّال.", visual: "👁️" },
            { title: "الإرسال للمراجعة", desc: "Meta تراجع خلال 24–48 ساعة. الحالة تتحدّث في القائمة.", tip: "⚠️ لا تعدّل القالب بعد الاعتماد!", visual: "📤" },
          ]
        : [
            { title: "Create", desc: "Name, category, language.", tip: "💡 Utility cheaper.", visual: "📝", linkPath: "/templates" },
            { title: "Variables", desc: "{{1}} {{2}} with sample values.", tip: "💡 {{1}} usually name.", visual: "{}" },
            { title: "Buttons", desc: "Up to 3. +40% engagement.", tip: "💡 One clear CTA.", visual: "🔘" },
            { title: "Preview", desc: "See as customer sees it.", tip: "💡 Check on mobile.", visual: "👁️" },
            { title: "Submit", desc: "Meta reviews 24-48h.", tip: "⚠️ Don't edit after!", visual: "📤" },
        ],
    },
    {
      id: "bots",
      title: isAr ? "بناء البوتات" : "Bots",
      icon: "🤖",
      color: "#7C3AED",
      tags: ["bot", "flow", "automation", "بوت", "أتمتة"],
      steps: isAr
        ? [
            { title: "إنشاء بوت", desc: "الاسم، الكلمة المفتاحيّة (مرحبا، hi)، رسالة الترحيب.", tip: "💡 كلمات مفتاحيّة متعدّدة بفاصلة.", visual: "🤖", linkPath: "/bot-builder" },
            { title: "بناء التدفّق", desc: "9 أنواع عقد: ترحيب، رسالة، سؤال، أزرار، شرط، API، AI، تأخير، تحويل لوكيل.", tip: "💡 ابدأ بسيطاً ثمّ وسّع.", visual: "🔧" },
            { title: "ربط العقد", desc: "اسحب خطوطاً بين العقد. أنشئ تفرّعات حسب ردود العميل.", tip: "💡 كل مسار ينتهي إمّا بحلّ أو تحويل.", visual: "🔀" },
            { title: "التفعيل والاختبار", desc: "فعّل من القائمة وجرّب بكلمة المحفّز.", tip: "⚠️ جرّب كل الفروع قبل التفعيل.", visual: "🧪" },
          ]
        : [
            { title: "Create", desc: "Name, keywords, welcome message.", tip: "💡 Multiple keywords comma-separated.", visual: "🤖", linkPath: "/bot-builder" },
            { title: "Build Flow", desc: "9 nodes: welcome, message, question, buttons, condition, API, AI, delay, handoff.", tip: "💡 Start simple.", visual: "🔧" },
            { title: "Connect", desc: "Drag lines between nodes.", tip: "💡 Every path ends in resolution or handoff.", visual: "🔀" },
            { title: "Test", desc: "Enable + try the trigger keyword.", tip: "⚠️ Test all branches.", visual: "🧪" },
        ],
    },
    {
      id: "billing",
      title: isAr ? "الفوترة والمحفظة" : "Billing & Wallet",
      icon: "💳",
      color: "#34C77B",
      tags: ["billing", "wallet", "topup", "فوترة", "شحن"],
      steps: isAr
        ? [
            { title: "الرصيد الحالي", desc: "افتح صفحة الفوترة لمشاهدة رصيد المحفظة وحدود الباقة.", tip: "💡 ستصلك تنبيهات لو الرصيد قلّ.", visual: "💰", linkPath: "/billing" },
            { title: "حاسبة الشحن", desc: "افتح modal الشحن واضغط '🧮 حاسبة الرصيد'. أدخل عدد الرسائل المتوقّع لتعرف المبلغ.", tip: "💡 الأسعار تقريبيّة، الفعليّة تُحسب لكل مؤسّسة.", visual: "🧮" },
            { title: "تحويل بنكي", desc: "Corbit يقبل التحويلات البنكيّة فقط. ارفع إيصال التحويل وسيُؤكَّد خلال 24 ساعة عمل.", tip: "⚠️ اكتب رقم المرجع في خانة 'تفاصيل التحويل'.", visual: "🏦", linkPath: "/billing" },
            { title: "ترقية الباقة", desc: "افتح تاب الخطط. الترقية تتمّ عبر فريق المبيعات بتحويل بنكي معتمد.", tip: "💡 الباقة الأكثر اختياراً عليها ⭐.", visual: "📈", linkPath: "/billing" },
          ]
        : [
            { title: "Current Balance", desc: "See wallet + plan limits in the Billing page.", tip: "💡 Low-balance alerts auto-fire.", visual: "💰", linkPath: "/billing" },
            { title: "Top-up Calculator", desc: "Open the Top Up modal and expand '🧮 Calculator'. Plug expected message volume to estimate.", tip: "💡 Estimates only — actual rates resolve per-org.", visual: "🧮" },
            { title: "Bank Transfer", desc: "Bank transfer is the only payment method. Upload the receipt; confirmed within 24 business hours.", tip: "⚠️ Include the reference number.", visual: "🏦", linkPath: "/billing" },
            { title: "Upgrade Plan", desc: "Plans tab. Upgrades go through sales via approved bank transfer.", tip: "💡 The Most Popular tier carries a ⭐.", visual: "📈", linkPath: "/billing" },
        ],
    },
  ];
}

export function GuidesPanel({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { colors: C, isDark: dk } = useTheme();
  const { isAr } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const guides = buildGuides(isAr, C);
  const q = search.trim().toLowerCase();
  const filtered = guides.filter((g) => {
    if (!q) return true;
    if (g.title.toLowerCase().includes(q)) return true;
    if (g.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (g.steps.some((s) => s.title.toLowerCase().includes(q))) return true;
    return false;
  });

  // Detail view — selected guide opens with its full step list.
  if (openId) {
    const guide = guides.find((g) => g.id === openId);
    if (!guide) {
      setOpenId(null);
      return null;
    }
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenId(null)}
          style={{
            background: "none", border: "none", color: C.pri,
            fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 600,
            cursor: "pointer", marginBottom: 16, padding: 0,
          }}
        >
          {isAr ? "← العودة للأدلّة" : "← Back to Guides"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${guide.color}15`, color: guide.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
          }}>
            {guide.icon}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{guide.title}</h2>
            <div style={{ fontSize: 12.5, color: C.t2, marginTop: 4 }}>
              {guide.steps.length} {isAr ? "خطوة" : "steps"}
            </div>
          </div>
        </div>

        <div>
          {guide.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 16,
                  background: guide.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14,
                }}>
                  {i + 1}
                </div>
                {i < guide.steps.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: `${guide.color}25`, marginTop: 4 }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: C.txt }}>{step.title}</div>
                <div style={{
                  padding: "12px 16px", borderRadius: 12, background: C.inp,
                  fontSize: 13, color: C.t2, lineHeight: 1.7,
                }}>
                  {step.desc}
                </div>
                {step.tip && (
                  <div style={{
                    marginTop: 8, padding: "8px 14px", borderRadius: 8,
                    background: step.tip.startsWith("⚠") ? `${C.warn}10` : `${C.pri}06`,
                    border: `1px solid ${step.tip.startsWith("⚠") ? C.warn + "25" : C.pri + "15"}`,
                    fontSize: 12, color: step.tip.startsWith("⚠") ? C.warn : C.pri, lineHeight: 1.6,
                  }}>
                    {step.tip}
                  </div>
                )}
                {step.linkPath && (
                  <button
                    type="button"
                    onClick={() => onNavigate(step.linkPath!)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      marginTop: 10, padding: "6px 14px", borderRadius: 8,
                      background: `${C.info}10`, border: `1px solid ${C.info}30`,
                      color: C.info, fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    📎 {isAr ? "افتح هذه الصفحة" : "Open this page"} →
                  </button>
                )}
              </div>
              {step.visual && (
                <div style={{
                  width: 60, flexShrink: 0, display: "flex",
                  alignItems: "flex-start", justifyContent: "center", paddingTop: 4,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: `${guide.color}10`,
                    border: `1px dashed ${guide.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>
                    {step.visual}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List view — cards of all guides with a search box.
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 12, background: C.inp,
        marginBottom: 16,
      }}>
        <span style={{ fontSize: 14 }}>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? "ابحث في الأدلّة..." : "Search guides..."}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: FONT_FAMILY, fontSize: 13, color: C.txt,
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 14 }}
          >×</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "40px 18px", textAlign: "center", color: C.t3, fontSize: 13 }}>
          🔎 {isAr ? `لا توجد نتائج لـ "${search}"` : `No matches for "${search}"`}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map((g) => (
            <Card
              key={g.id}
              style={{
                cursor: "pointer", padding: 20,
                border: `1px solid ${dk ? C.brd : "#EAE7E2"}`,
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onClick={() => setOpenId(g.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${g.color}15`, color: g.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {g.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{g.title}</div>
                  <div style={{ fontSize: 11.5, color: C.t2 }}>
                    {g.steps.length} {isAr ? "خطوة" : "steps"}
                  </div>
                </div>
              </div>
              {/* Step progress placeholder bars */}
              <div style={{ display: "flex", gap: 3 }}>
                {g.steps.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: `${g.color}30` }} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
