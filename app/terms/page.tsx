import type { Metadata } from "next";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";

export const metadata: Metadata = {
  title: "شروط الاستخدام — Corbit",
  description: "شروط استخدام منصة Corbit لخدمات واتساب الأعمال.",
};

export default function TermsPage() {
  return (
    <div
      style={{
        background: "#0C0E14",
        minHeight: "100vh",
        fontFamily: FONT_FAMILY,
        direction: "rtl",
        color: "#E8E6E3",
        padding: "40px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <header style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-block",
              background: GRADIENT,
              padding: "10px 18px",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 20,
              color: "#fff",
              letterSpacing: -0.5,
            }}
          >
            CORBIT
          </div>
          <h1 style={{ marginTop: 22, marginBottom: 6, fontSize: 28 }}>شروط الاستخدام</h1>
          <div style={{ color: "#8B8D97", fontSize: 13 }}>آخر تحديث: 22 أبريل 2026</div>
        </header>

        <Section title="1 — مقدّمة">
          مرحباً بك في منصّة <b>Corbit</b> (المدار). باستخدامك للمنصّة فإنك تُقرّ بأنك
          قرأت ووافقت على جميع الشروط الواردة أدناه، إضافةً إلى
          {" "}<Link href="https://business.whatsapp.com/policy">سياسة واتساب للأعمال</Link>{" "}
          و{" "}<Link href="https://developers.facebook.com/devpolicy/">سياسة مطوّري Meta</Link>.
          إذا لم توافق على أي منها، يجب عليك التوقف عن استخدام المنصّة فوراً.
        </Section>

        <Section title="2 — طبيعة الخدمة">
          Corbit هي منصّة SaaS تتيح للشركات إدارة محادثات عملائها عبر واتساب
          (قنوات BSP مثل 360dialog / Meta Cloud API)، وإرسال قوالب معتمدة،
          وإطلاق حملات تسويقية، وتشغيل وكلاء ذكاء اصطناعي للرد التلقائي.
          نحن نعمل كمزوّد تقني (Tech Provider) نيابةً عن الشركة المشتركة.
        </Section>

        <Section title="3 — مسؤوليات المشترك">
          <ul style={ulStyle}>
            <li>الحصول على موافقة صريحة (Opt-In) من كل جهة اتصال قبل إرسال أي رسالة إليها.</li>
            <li>احترام طلبات إلغاء الاشتراك فوراً (سواء عبر كلمة STOP أو أي قناة أخرى).</li>
            <li>عدم إرسال محتوى مضلّل، مخادع، أو مخالف للقوانين المحلية في المملكة العربية السعودية.</li>
            <li>عدم إرسال بيانات مالية حساسة (أرقام بطاقات، CVV) عبر واتساب.</li>
            <li>عدم استخدام المنصّة لرسائل جماعية (Spam) أو محتوى رعاية صحية مباشر بين الطبيب والمريض.</li>
            <li>الحفاظ على سريّة بيانات الدخول وعدم مشاركتها مع أي طرف آخر.</li>
          </ul>
        </Section>

        <Section title="4 — الامتثال لسياسة Meta">
          <p style={pStyle}>
            أنت تقرّ بأن Meta تحتفظ بحق إيقاف أو تعليق أي رقم واتساب لا يلتزم بسياساتها،
            وأن Corbit غير مسؤولة عن أي إيقاف ناتج عن مخالفات من جانب المشترك، بما في ذلك:
          </p>
          <ul style={ulStyle}>
            <li>ارتفاع معدّل الحظر (Block Rate) من قِبَل المستقبلين.</li>
            <li>رفض القوالب المتكرّر من Meta.</li>
            <li>عدم اعتماد اسم العرض (Display Name) أو سحبه.</li>
            <li>إرسال محتوى ضمن الفئات المحظورة (أسلحة، مخدرات، ادّعاءات طبية غير مدعومة، ...).</li>
          </ul>
        </Section>

        <Section title="5 — الفوترة والدفع">
          يتم احتساب رسوم استخدام المنصّة بموجب خطّة الاشتراك المختارة،
          إضافةً إلى تكاليف Meta/360dialog على كل محادثة قابلة للفوترة وفق تسعير Meta الرسمي.
          الرصيد يُخصم تلقائياً من محفظة المشترك عند كل حملة أو رسالة قابلة للفوترة.
        </Section>

        <Section title="6 — الملكية الفكرية">
          جميع حقوق الكود المصدري، الواجهات، العلامة التجارية، والشعارات محفوظة لشركة
          Corbit. يُمنع نسخ أو إعادة استخدام أي جزء منها خارج نطاق الاستخدام المشروع للمنصّة.
        </Section>

        <Section title="7 — إنهاء الخدمة">
          يحق لـ Corbit تعليق أو إنهاء حساب المشترك فور اكتشاف مخالفة لسياسة Meta
          أو لقوانين المملكة العربية السعودية، دون الإخلال بحق Corbit في المطالبة بأي
          تعويض عن الأضرار الناتجة عن المخالفة.
        </Section>

        <Section title="8 — التعديلات">
          يحق لـ Corbit تعديل هذه الشروط في أي وقت. سيتم إشعار المشتركين بأي تعديل جوهري
          عبر البريد الإلكتروني أو داخل المنصّة قبل 7 أيام من سريانه.
        </Section>

        <Section title="9 — القانون الحاكم">
          تخضع هذه الشروط لأنظمة المملكة العربية السعودية. أي نزاع ينشأ عن تطبيقها
          تختصّ به المحاكم السعودية في مدينة الرياض.
        </Section>

        <Section title="10 — التواصل">
          لأي استفسار بخصوص هذه الشروط، راسلنا على
          {" "}<Link href="mailto:support@corbit.sa">support@corbit.sa</Link>.
        </Section>

        <footer style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #1E2233", fontSize: 12.5, color: "#8B8D97", textAlign: "center" }}>
          © {new Date().getFullYear()} Corbit (المدار). جميع الحقوق محفوظة.
          {" · "}
          <Link href="/privacy">سياسة الخصوصية</Link>
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
        background: "#141721",
        border: "1px solid #1E2233",
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
      style={{ color: "#E8713A", textDecoration: "none", fontWeight: 600 }}
    >
      {children}
    </a>
  );
}

const pStyle: React.CSSProperties = { margin: "0 0 10px" };
const ulStyle: React.CSSProperties = { margin: 0, paddingRight: 22, display: "flex", flexDirection: "column", gap: 6 };
