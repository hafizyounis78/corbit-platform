import type { Metadata } from "next";
import { FONT_FAMILY, FONT_LATIN } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { WhatsBitIcon } from "@/components/shared/whatsbit-logo";

export const metadata: Metadata = {
  title: "اتفاقية معالجة البيانات (DPA) — WhatsBit",
  description: "Data Processing Agreement بين Corbit والمشترك B2B — كيف نعالج بيانات عملاء المشترك بصفتنا Processor.",
};

/**
 * Data Processing Agreement (DPA) — مطلوب من كثير من العملاء B2B
 * (خاصةً المؤسسات الكبيرة والقطاعات المنظّمة) قبل ما يثقوا منصّة
 * تتعامل مع بيانات عملائهم. أيضاً مطلب صريح لـ Meta WhatsApp Business
 * Policy وللقانون السعودي PDPL لمّا تكون شركة (Controller) تستعمل
 * مزوّد خدمة (Processor).
 *
 * بنيت بنفس قالب /privacy + /terms — زرقاء داكنة، خط IBM Plex
 * Sans Arabic، أقسام مرقّمة. الهدف: العميل B2B يقدر يطبعها أو
 * يرسلها للقسم القانوني عنده مباشرة.
 */
export default function DpaPage() {
  return (
    <div
      style={{
        background: "#0B1D3A",
        minHeight: "100vh",
        fontFamily: FONT_FAMILY,
        direction: "rtl",
        color: "#E8ECF0",
        padding: "40px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <header style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: GRADIENT,
              padding: "10px 18px",
              borderRadius: 12,
              letterSpacing: -0.5,
            }}
          >
            <WhatsBitIcon size={28} variant="light" />
            <span style={{ fontFamily: FONT_LATIN, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>
              <span style={{ color: "#fff" }}>Whats</span>
              <span style={{ color: "#2ECC71" }}>Bit</span>
            </span>
          </div>
          <h1 style={{ marginTop: 22, marginBottom: 6, fontSize: 28 }}>
            اتفاقية معالجة البيانات (DPA)
          </h1>
          <div style={{ color: "#8B99AD", fontSize: 13 }}>
            Data Processing Agreement · آخر تحديث: 5 مايو 2026
          </div>
        </header>

        <div style={{
          background: "#0F2A52",
          border: "1px solid #1E4A82",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 18,
          fontSize: 13,
          lineHeight: 1.8,
          color: "#B8C4D5",
        }}>
          <b style={{ color: "#FFD86E" }}>📋 ملخّص للمسؤولين:</b>{" "}
          أنت <b>المتحكّم (Controller)</b> ببيانات عملائك. <b>Corbit</b> هو
          <b> المعالج (Processor)</b> الذي ينفّذ تعليماتك فقط. هذه الوثيقة تُحدّد
          الأدوار، حدود المعالجة، الأمان، الإشعار عند الحوادث، وحقوق الإنهاء.
          ينطبق DPA تلقائياً على كلّ مشترك في خطّة Business أو Enterprise،
          ويمكن طلب نسخة موقّعة عبر <Link href="mailto:legal@corbit.sa">legal@corbit.sa</Link>.
        </div>

        <Section title="1 — الأطراف">
          <ul style={ulStyle}>
            <li><b>المتحكّم بالبيانات (Data Controller):</b> الشركة المشتركة في WhatsBit (يُشار إليها بـ "المشترك" / "أنت").</li>
            <li><b>المعالج (Data Processor):</b> شركة Corbit للحلول التقنيّة، السجل التجاري السعودي، المملكة العربيّة السعوديّة.</li>
            <li>
              <b>المعالج الفرعي (Sub-processors):</b>
              Meta Platforms (WhatsApp Business API) ·
              Laravel Forge (استضافة) ·
              Vercel (واجهة) ·
              360dialog (BSP) ·
              mobile.net.sa (SMS) ·
              Anthropic (اختياري — عند تفعيل AI).
            </li>
          </ul>
        </Section>

        <Section title="2 — موضوع المعالجة ونطاقها">
          <p style={pStyle}>تعالج Corbit البيانات الشخصيّة التي يقدّمها المشترك أو يجمعها عبر المنصّة بصفته Controller، وذلك حصراً لأغراض:</p>
          <ul style={ulStyle}>
            <li>إيصال رسائل واتساب SMS من المشترك إلى عملائه (Customers).</li>
            <li>استقبال ردود العملاء وعرضها للمشترك في الـ Inbox.</li>
            <li>توليد ردود ذكاء اصطناعي تلقائيّة عند تفعيل المشترك للميزة.</li>
            <li>إصدار تحليلات + تقارير أداء داخل حساب المشترك فقط.</li>
            <li>إدارة الفوترة والاشتراك.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            لا تستخدم Corbit أيّ بيانات لأغراض خارج هذا النطاق ولا تشاركها مع
            أيّ طرف ثالث خارج قائمة المعالجين الفرعيّين أعلاه دون إذن صريح من المشترك.
          </p>
        </Section>

        <Section title="3 — أنواع البيانات وفئات الأشخاص المعنيّين">
          <p style={pStyle}><b>فئات البيانات الشخصيّة المعالجة:</b></p>
          <ul style={ulStyle}>
            <li>بيانات تعريفيّة: الاسم، رقم الواتساب، البريد الإلكتروني، المدينة.</li>
            <li>بيانات اتصال: محتوى الرسائل (نصّ، صور، صوت)، تواريخ الإرسال والاستلام والقراءة.</li>
            <li>بيانات سلوكيّة: clicks على روابط الحملات، Customer Score، الـ sentiment المُحسوب.</li>
            <li>بيانات الموافقة: تاريخ ومصدر Opt-In وOpt-Out.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}><b>فئات الأشخاص المعنيّين:</b></p>
          <ul style={ulStyle}>
            <li>عملاء المشترك (B2C / B2B contacts).</li>
            <li>موظّفو المشترك المستخدمون لـ WhatsBit (admin / supervisor / agent).</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10, color: "#FFD86E" }}>
            ❌ لا تعالج المنصّة أيّ بيانات حسّاسة (صحيّة، دينيّة، عرقيّة، بيومتريّة، أطفال) — مسؤوليّة المشترك ألّا يدخلها.
          </p>
        </Section>

        <Section title="4 — التزامات Corbit بصفتها Processor">
          <ul style={ulStyle}>
            <li>المعالجة فقط بناءً على تعليمات موثّقة من المشترك (الإعدادات + الـ API + الإجراءات داخل المنصّة).</li>
            <li>ضمان أنّ كلّ موظّف يلمس البيانات ملتزم بسريّة موثّقة.</li>
            <li>تطبيق التدابير الفنّيّة + التنظيميّة المنصوص عليها في القسم 7 (الأمن).</li>
            <li>عدم تعيين معالج فرعيّ جديد دون إخطار المشترك مسبقاً (30 يوماً) مع حقّ الاعتراض.</li>
            <li>دعم المشترك في الردّ على طلبات أصحاب البيانات (PDPL Articles 18–22).</li>
            <li>إشعار المشترك بأيّ خرق بيانات خلال <b>72 ساعة</b> من اكتشافه.</li>
            <li>الحذف أو الإرجاع الكامل للبيانات عند انتهاء الخدمة (راجع القسم 9).</li>
          </ul>
        </Section>

        <Section title="5 — التزامات المشترك بصفته Controller">
          <ul style={ulStyle}>
            <li>الحصول على موافقة قانونيّة (Opt-In) من كل عميل قبل إدخاله للمنصّة.</li>
            <li>عدم إدخال بيانات حسّاسة أو محظورة قانونياً.</li>
            <li>الردّ على طلبات أصحاب البيانات في الفترة المنصوص عليها بنظام PDPL (30 يوماً).</li>
            <li>إدارة دورة حياة الموافقة (Opt-In/Opt-Out) — Corbit توفّر الأدوات (مثل تتبّع كلمة STOP)؛ الالتزام يبقى على المشترك.</li>
            <li>إعلام Corbit إذا أصبحت البيانات تخضع لقيود إقليميّة جديدة (Data Residency).</li>
          </ul>
        </Section>

        <Section title="6 — نقل البيانات الدوليّة">
          <p style={pStyle}>
            البيانات الأساسيّة (المحادثات، الفوترة، الإعدادات) <b>محفوظة داخل المملكة العربيّة السعوديّة</b> على
            خوادم Forge. النقل خارج المملكة يحدث في الحالات التالية فقط:
          </p>
          <ul style={ulStyle}>
            <li>إرسال الرسائل إلى Meta WhatsApp Cloud API (مطلب فنّي للخدمة، خوادم Meta في الاتحاد الأوروبي).</li>
            <li>عند تفعيل AI: استدعاءات مؤقّتة لـ Anthropic API (المحتوى يُعالج ثم يُحذف من جانب Anthropic بعد 30 يوماً، لا يستخدم لتدريب نماذج).</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            جميع عمليّات النقل محميّة بـ Standard Contractual Clauses (SCCs)
            وتشفير TLS 1.3 طوال الرحلة.
          </p>
        </Section>

        <Section title="7 — التدابير الفنّية والتنظيميّة (Security)">
          <ul style={ulStyle}>
            <li><b>التشفير أثناء النقل:</b> TLS 1.3 لكلّ الـ APIs والـ webhooks.</li>
            <li><b>التشفير على القرص:</b> بيانات قاعدة البيانات + النسخ الاحتياطيّة مشفّرة AES-256.</li>
            <li><b>كلمات المرور:</b> bcrypt مع salt فريد لكلّ مستخدم.</li>
            <li><b>التحقّق الثنائي (2FA):</b> متاح للمشترك واختياري حسب سياسته.</li>
            <li><b>عزل المستأجرين (Multi-tenancy):</b> كلّ org يصل فقط إلى بياناته (RBAC + tenant scoping على كلّ استعلام).</li>
            <li><b>Webhook signing:</b> HMAC SHA-256 على كلّ webhook صادر.</li>
            <li><b>Audit Log:</b> كلّ عمليّة حسّاسة (login، تغيير صلاحيّة، قبول تحويل) مسجّلة لمدّة سنتين.</li>
            <li><b>Pen-testing:</b> اختبار اختراق سنويّ من جهة خارجيّة معتمدة.</li>
            <li><b>النسخ الاحتياطي:</b> يومي مشفّر، يُحفظ 30 يوماً، يُختبر استعادته شهريّاً.</li>
          </ul>
        </Section>

        <Section title="8 — مدّة الاحتفاظ والحذف">
          <ul style={ulStyle}>
            <li>أثناء الاشتراك: نحتفظ بالبيانات حسب الإعدادات + الحدود التقنيّة (المحادثات 24 شهراً).</li>
            <li>بعد إنهاء الاشتراك: يُمنح المشترك 30 يوماً لتصدير بياناته.</li>
            <li>بعد الـ 30 يوماً: تُحذف كل البيانات نهائياً، باستثناء:
              <ul style={{ ...ulStyle, marginTop: 6 }}>
                <li>سجلات الفوترة (5 سنوات — متطلّب زكوي/ضريبي سعودي).</li>
                <li>سجلات الـ Audit Log (سنتان — متطلّب امتثال).</li>
                <li>قوائم Opt-Out (لمنع إرسال حملات لاحقة لأصحاب القرار).</li>
              </ul>
            </li>
            <li>الحذف الفوري متاح بطلب صريح عبر <Link href="mailto:privacy@corbit.sa">privacy@corbit.sa</Link>.</li>
          </ul>
        </Section>

        <Section title="9 — حقوق التدقيق">
          <p style={pStyle}>للمشترك الحقّ في:</p>
          <ul style={ulStyle}>
            <li>طلب نسخة من تقرير SOC 2 / ISO 27001 (عند توفّرها).</li>
            <li>تنفيذ تدقيق سنويّ على إجراءات Corbit بعد إخطار خطّي قبل 30 يوماً (تكاليف التدقيق على المشترك).</li>
            <li>طلب تقرير حوادث أمنيّة سنويّ.</li>
          </ul>
        </Section>

        <Section title="10 — المسؤوليّة والتعويض">
          <p style={pStyle}>
            كلّ طرف مسؤول عن أيّ ضرر نتج عن خرقه لهذه الاتفاقية.
            مسؤوليّة Corbit الإجماليّة في أيّ سنة تعاقديّة لا تتجاوز إجمالي الرسوم المدفوعة من المشترك في تلك السنة.
            هذا الحدّ لا ينطبق على الإهمال الجسيم أو الفعل المتعمّد.
          </p>
        </Section>

        <Section title="11 — الإنهاء">
          <p style={pStyle}>
            ينتهي الـ DPA تلقائياً بانتهاء الاشتراك في WhatsBit. يحقّ لأيّ طرف إنهاء العقد فوراً عند:
          </p>
          <ul style={ulStyle}>
            <li>خرق جوهري لشروط هذه الاتفاقية لم يُصلَح خلال 30 يوماً من الإخطار.</li>
            <li>عدم القدرة على تحقيق متطلّبات قانونيّة جديدة.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            الالتزامات بحماية البيانات + الحذف + السرّيّة تظلّ سارية بعد الإنهاء.
          </p>
        </Section>

        <Section title="12 — القانون المُطبّق">
          تخضع هذه الاتفاقية لقوانين المملكة العربيّة السعوديّة، خاصّة نظام
          حماية البيانات الشخصيّة (PDPL) ولوائحه التنفيذيّة. أيّ نزاع يُحال إلى
          محاكم مدينة الرياض.
        </Section>

        <Section title="13 — التواصل">
          <ul style={ulStyle}>
            <li><b>مسؤول حماية البيانات (DPO):</b> <Link href="mailto:dpo@corbit.sa">dpo@corbit.sa</Link></li>
            <li><b>الشؤون القانونيّة:</b> <Link href="mailto:legal@corbit.sa">legal@corbit.sa</Link></li>
            <li><b>طلبات الخصوصيّة:</b> <Link href="mailto:privacy@corbit.sa">privacy@corbit.sa</Link></li>
            <li><b>للحصول على نسخة موقّعة:</b> راسل القسم القانوني وسنُعدّ نسخة بالـ counterparty الرسمي خلال 5 أيام عمل.</li>
          </ul>
        </Section>

        <footer style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #1E3350", fontSize: 12.5, color: "#8B99AD", textAlign: "center" }}>
          © {new Date().getFullYear()} Corbit. جميع الحقوق محفوظة. WhatsBit هو منتج من Corbit.
          {" · "}
          <Link href="/privacy">سياسة الخصوصية</Link>
          {" · "}
          <Link href="/terms">شروط الاستخدام</Link>
          {" · "}
          <Link href="/register">إنشاء حساب</Link>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "#112240",
        border: "1px solid #1E3350",
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 14,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 17, color: "#fff" }}>{title}</h2>
      <div style={{ color: "#B8BAC3", fontSize: 14, lineHeight: 1.9 }}>{children}</div>
    </section>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http") || href.startsWith("mailto");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      style={{ color: "#16A34A", textDecoration: "none", fontWeight: 600 }}
    >
      {children}
    </a>
  );
}

const pStyle: React.CSSProperties = { margin: "0 0 10px" };
const ulStyle: React.CSSProperties = { margin: 0, paddingRight: 22, display: "flex", flexDirection: "column", gap: 6 };
