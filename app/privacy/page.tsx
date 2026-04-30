import type { Metadata } from "next";
import { FONT_FAMILY, FONT_LATIN } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { WhatsBitIcon } from "@/components/shared/whatsbit-logo";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — WhatsBit",
  description: "كيف تتعامل منصّة WhatsBit (من Corbit) مع بياناتك وبيانات عملائك.",
};

export default function PrivacyPage() {
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
          <h1 style={{ marginTop: 22, marginBottom: 6, fontSize: 28 }}>سياسة الخصوصية</h1>
          <div style={{ color: "#8B99AD", fontSize: 13 }}>آخر تحديث: 22 أبريل 2026</div>
        </header>

        <Section title="1 — مقدّمة">
          في <b>WhatsBit</b> (من Corbit) نلتزم بحماية بيانات المشتركين وعملائهم.
          توضّح هذه السياسة أنواع البيانات التي نجمعها، أسباب جمعها،
          طريقة استخدامها، ومن يمكنه الوصول إليها، تماشياً مع
          نظام حماية البيانات الشخصية السعودي (PDPL) وسياسات Meta.
        </Section>

        <Section title="2 — البيانات التي نجمعها">
          <ul style={ulStyle}>
            <li><b>بيانات المشترك (الشركة):</b> اسم الشركة، البريد، رقم الجوال، عنوان IP، بيانات الفوترة، وقت قبول الشروط.</li>
            <li><b>بيانات المستخدمين داخل الشركة:</b> الأسماء، الأدوار، تسجيلات الدخول.</li>
            <li><b>بيانات جهات الاتصال (عملاء الشركة):</b> الاسم، رقم الواتساب، محتوى الرسائل، وقت الاستلام، حالة الرسالة (مُسلّمة/مقروءة)، وقت موافقة العميل (Opt-In) ومصدرها.</li>
            <li><b>بيانات فنية:</b> سجلات webhook من Meta، معرّفات الرسائل، بيانات التسليم.</li>
          </ul>
        </Section>

        <Section title="3 — كيف نستخدم بياناتك">
          <ul style={ulStyle}>
            <li>تشغيل خدمة واتساب الأعمال لصالح الشركة المشتركة.</li>
            <li>إرسال واستقبال الرسائل عبر Meta.</li>
            <li>تحليلات الأداء (معدّل الفتح، الاستجابة، ...) للشركة المشتركة فقط.</li>
            <li>تشغيل وكلاء الذكاء الاصطناعي للرد التلقائي داخل محادثات العميل.</li>
            <li>الفوترة وإدارة الاشتراك.</li>
            <li>الالتزام بالمتطلّبات القانونية والتنظيمية عند الحاجة.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            <b>لا نبيع بيانات العملاء أبداً،</b> ولا نستخدمها لأغراض تسويق خارج نطاق خدمات المشترك المباشر.
          </p>
        </Section>

        <Section title="4 — مشاركة البيانات مع أطراف ثالثة">
          <p style={pStyle}>نشارك البيانات فقط مع المزوّدين الأساسيين لتشغيل المنصّة:</p>
          <ul style={ulStyle}>
            <li><b>Meta / WhatsApp Business API:</b> لإرسال واستقبال الرسائل.</li>
            <li><b>Laravel Forge / Vercel:</b> لاستضافة الخوادم والواجهة.</li>
            <li><b>Anthropic (اختياري):</b> عند تفعيل وكلاء الذكاء الاصطناعي.</li>
            <li><b>mobile.net.sa:</b> لإرسال رسائل SMS (بيانات الدخول للعملاء الجدد فقط).</li>
          </ul>
        </Section>

        <Section title="5 — مدّة الاحتفاظ بالبيانات">
          <ul style={ulStyle}>
            <li>بيانات الحساب والفوترة: طوال فترة الاشتراك + 5 سنوات بعد الإنهاء (متطلّبات زكوية/ضريبية).</li>
            <li>الرسائل والمحادثات: 24 شهراً، ثم تُحذف تلقائياً ما لم يطلب المشترك غير ذلك.</li>
            <li>سجلّات Webhook: 90 يوماً.</li>
            <li>بيانات جهات الاتصال الملغية الاشتراك: يتم الاحتفاظ بها كـ blocked لمنع إرسال الحملات إليها، ولا تُحذف نهائياً إلا بطلب صريح.</li>
          </ul>
        </Section>

        <Section title="6 — حقوق أصحاب البيانات">
          <p style={pStyle}>يحق لكل عميل أو مشترك، وفقاً لنظام PDPL السعودي:</p>
          <ul style={ulStyle}>
            <li>الوصول إلى بياناته الشخصية المخزّنة لدينا.</li>
            <li>طلب تصحيح أي بيانات غير دقيقة.</li>
            <li>طلب حذف بياناته (يُنفَّذ خلال 30 يوماً عمل).</li>
            <li>إلغاء موافقته (Opt-Out) في أي وقت عبر كلمة STOP / إلغاء على واتساب.</li>
            <li>نقل بياناته إلى مزوّد آخر (Data Portability).</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            لممارسة أي من هذه الحقوق: راسلنا على{" "}
            <Link href="mailto:privacy@corbit.sa">privacy@corbit.sa</Link>.
          </p>
        </Section>

        <Section title="7 — أمن البيانات">
          <ul style={ulStyle}>
            <li>جميع الاتصالات مشفّرة عبر TLS 1.3.</li>
            <li>كلمات المرور مخزّنة بـ hash (bcrypt)، لا يمكن عكسها.</li>
            <li>التوكنات (Sanctum) قابلة للإبطال الفوري.</li>
            <li>صلاحيات المستخدمين معزولة عبر RBAC (admin / supervisor / agent).</li>
            <li>نسخ احتياطية مشفّرة يومياً، يُحتفظ بها 30 يوماً.</li>
          </ul>
        </Section>

        <Section title="8 — ملفات تعريف الارتباط (Cookies)">
          نستخدم Cookies ضرورية فقط لتسجيل الدخول والحفاظ على جلسة المستخدم.
          لا نستخدم Cookies تتبّع أو إعلانات.
        </Section>

        <Section title="9 — الأطفال">
          منصّة Corbit موجّهة للأعمال فقط. لا نستقبل ولا نعالج بيانات أي شخص دون سن 18 عاماً.
        </Section>

        <Section title="10 — التعديلات">
          نحتفظ بحق تحديث هذه السياسة. أي تغيير جوهري يُبلَّغ به المشتركون قبل 7 أيام على الأقل
          عبر البريد الإلكتروني ورسالة داخل المنصّة.
        </Section>

        <Section title="11 — التواصل">
          للأسئلة أو طلبات الخصوصية:
          {" "}<Link href="mailto:privacy@corbit.sa">privacy@corbit.sa</Link>
          {" · "}
          للدعم العام: <Link href="mailto:support@corbit.sa">support@corbit.sa</Link>.
        </Section>

        <footer style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #1E3350", fontSize: 12.5, color: "#8B99AD", textAlign: "center" }}>
          © {new Date().getFullYear()} Corbit. جميع الحقوق محفوظة. WhatsBit هو منتج من Corbit.
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
