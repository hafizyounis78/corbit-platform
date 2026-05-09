import type { Metadata } from "next";
import { FONT_FAMILY, FONT_LATIN } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { WhatsBitIcon } from "@/components/shared/whatsbit-logo";

export const metadata: Metadata = {
  title: "شروط الاستخدام — WhatsBit",
  description: "شروط استخدام منصة WhatsBit (من Corbit) لخدمات واتساب الأعمال.",
};

export default function TermsPage() {
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
          <h1 style={{ marginTop: 22, marginBottom: 6, fontSize: 28 }}>شروط الاستخدام</h1>
          <div style={{ color: "#8B99AD", fontSize: 13 }}>آخر تحديث: 9 مايو 2026</div>
        </header>

        <Section title="1 — مقدّمة وقبول الشروط">
          مرحباً بك في منصّة <b>WhatsBit</b> (من Corbit). باستخدامك للمنصّة فإنّك تُقرّ بأنّك
          قرأت ووافقت على جميع الشروط الواردة أدناه، إضافةً إلى
          {" "}<Link href="https://business.whatsapp.com/policy">سياسة واتساب للأعمال</Link>{" "}
          و{" "}<Link href="https://developers.facebook.com/devpolicy/">سياسة مطوّري Meta</Link>{" "}
          وسياسة الخصوصيّة المنشورة في <Link href="/privacy">/privacy</Link> واتفاقيّة معالجة البيانات في
          {" "}<Link href="/dpa">/dpa</Link>. إذا لم توافق على أيّ منها، يجب عليك التوقّف عن استخدام المنصّة فوراً.
        </Section>

        <Section title="2 — طبيعة الخدمة">
          Corbit هي منصّة SaaS تتيح للشركات إدارة محادثات عملائها عبر واتساب
          (قنوات BSP المعتمدة من Meta و Meta Cloud API)، وإرسال قوالب معتمدة،
          وإطلاق حملات تسويقيّة، وتشغيل وكلاء ذكاء اصطناعي للردّ التلقائي،
          وإرسال رسائل SMS عبر مزوّد محلّي. نحن نعمل كـ <b>مزوّد تقني (Tech Provider)</b>
          نيابةً عن الشركة المشتركة، وهي تظلّ <b>المتحكّم بالبيانات</b> فيما يخصّ بيانات عملائها.
        </Section>

        <Section title="3 — أهليّة الاستخدام">
          <ul style={ulStyle}>
            <li>المستخدم لازم 18 عاماً فأكثر، يتمتّع بالأهليّة القانونيّة الكاملة.</li>
            <li>الحساب لازم باسم كيان تجاري حقيقي (سجلّ تجاري ساري في المملكة أو خليجي معتمد).</li>
            <li>الشخص اللي ينشئ الحساب يقرّ أنّ له الصلاحيّة لإلزام الكيان بهذي الشروط.</li>
          </ul>
        </Section>

        <Section title="4 — مسؤوليّات المشترك">
          <ul style={ulStyle}>
            <li>الحصول على موافقة صريحة (Opt-In) من كلّ جهة اتّصال قبل إرسال أيّ رسالة إليها (اشتراط Meta + PDPL).</li>
            <li>احترام طلبات إلغاء الاشتراك فوراً (كلمة STOP، إلغاء، أو أيّ قناة أخرى).</li>
            <li>عدم إرسال محتوى مضلّل، مخادع، احتيالي، أو مخالف للقوانين السعوديّة.</li>
            <li>عدم إرسال بيانات ماليّة حسّاسة (أرقام بطاقات، CVV، IBAN كامل، كلمات مرور) عبر القنوات.</li>
            <li>عدم استخدام المنصّة لرسائل جماعيّة غير مرغوبة (Spam) أو محتوى رعاية صحّيّة مباشرة بين طبيب ومريض دون ترخيص.</li>
            <li>عدم محاولة اختراق أو هندسة عكسيّة للمنصّة، ولا تجاوز حدود المعدّل (rate limits) عبر أيّ وسيلة.</li>
            <li>الحفاظ على سرّيّة بيانات الدخول وعدم مشاركتها — الحساب مسؤوليّتك حتى عند تسريبه.</li>
            <li>الامتثال للوائح هيئة الاتّصالات والفضاء والتقنية (CST) السعوديّة فيما يخصّ رسائل SMS التجاريّة.</li>
          </ul>
        </Section>

        <Section title="5 — الامتثال لسياسة Meta">
          <p style={pStyle}>
            أنت تقرّ بأنّ Meta تحتفظ بحقّ إيقاف أو تعليق أيّ رقم واتساب لا يلتزم بسياساتها،
            وأنّ Corbit غير مسؤولة عن أيّ إيقاف ناتج عن مخالفات من جانب المشترك، بما في ذلك:
          </p>
          <ul style={ulStyle}>
            <li>ارتفاع معدّل الحظر (Block Rate) من قِبَل المستقبلين.</li>
            <li>رفض القوالب المتكرّر من Meta.</li>
            <li>عدم اعتماد اسم العرض (Display Name) أو سحبه.</li>
            <li>إرسال محتوى ضمن الفئات المحظورة (أسلحة، مخدّرات، عملات مشفّرة بدون ترخيص، ادّعاءات طبّيّة غير مدعومة، إلخ).</li>
            <li>تجاوز حدود التكرار (Frequency Cap) أو نوافذ الإرسال (Send Window) المحدّدة من Meta.</li>
          </ul>
        </Section>

        <Section title="6 — الفوترة والدفع">
          <p style={pStyle}>
            تتكوّن الرسوم من شقّين منفصلَين:
          </p>
          <ul style={ulStyle}>
            <li><b>اشتراك شهري ثابت</b> حسب الباقة المختارة (Starter / Pro / Business / Enterprise) — يُدفع مقدّماً عبر تحويل بنكي.</li>
            <li><b>محفظة Pay-as-you-go</b> لتغطية:
              <ul style={{ ...ulStyle, marginTop: 6 }}>
                <li>تكلفة محادثات Meta القابلة للفوترة (marketing/utility/authentication) وفق تسعير Meta الرسمي + هامش Corbit.</li>
                <li>تكلفة استدعاءات الذكاء الاصطناعي عند تفعيلها (لكلّ ردّ آلي).</li>
                <li>تكلفة رسائل SMS عبر مزوّد مدار.</li>
              </ul>
            </li>
            <li>الرصيد يُخصم تلقائياً عند كلّ عمليّة قابلة للفوترة. يقدر المشترك يضع حدّ صارم (Hard Cap) لمنع الإرسال عند نفاذ الرصيد.</li>
            <li>الفواتير تُصدَر شهرياً بصيغة ZATCA-compliant مع إضافة ضريبة القيمة المضافة 15%.</li>
            <li><b>عدم الاسترداد</b>: الاشتراكات الشهريّة المدفوعة غير قابلة للاسترداد عند الإنهاء المبكّر إلّا بقرار خاصّ من Corbit.</li>
            <li><b>التأخّر في الدفع</b>: عند انتهاء الباقة بدون تجديد، يُعلَّق الإرسال خلال 7 أيّام، ويُعطى المشترك 90 يوم لتسوية الدفع قبل تجميد الحساب وإتاحة تصدير البيانات فقط.</li>
          </ul>
        </Section>

        <Section title="7 — الملكيّة الفكريّة وملكيّة البيانات">
          <ul style={ulStyle}>
            <li><b>ملكيّة Corbit</b>: جميع حقوق الكود المصدري، الواجهات، العلامة التجاريّة، الشعارات، التصاميم — حصراً لشركة Corbit.</li>
            <li><b>ملكيّة المشترك</b>: بيانات المشترك وعملائه + المحتوى الذي يدخله (قوالب، حملات، مستندات قاعدة المعرفة) ملك المشترك. Corbit له ترخيص محدود لمعالجتها بهدف تشغيل الخدمة فقط.</li>
            <li><b>الترخيص العكسي</b>: المشترك يمنح Corbit ترخيصاً غير حصري لاستخدام بيانات الاستخدام المُجمَّعة (Aggregated, anonymized) لتحسين الخدمة، دون التعرّف على هويّة أيّ مشترك.</li>
          </ul>
        </Section>

        <Section title="8 — مستوى الخدمة (SLA) وعدم التعهّد">
          <p style={pStyle}>
            تعمل Corbit على ضمان أعلى مستوى توافر ممكن، لكن <b>لا تتعهّد بضمان توافر 100%</b>.
            الخدمة مرتبطة بمزوّدين خارجيّين (Meta، 360dialog، Forge، شبكات الإنترنت) خارج
            سيطرتها المباشرة. لا يتمّ تعويض المشترك عن أيّ انقطاع ما لم يكن:
          </p>
          <ul style={ulStyle}>
            <li>ناتج مباشر عن إهمال جسيم من Corbit.</li>
            <li>تجاوز 24 ساعة متّصلة في شهر واحد، عندئذ يحقّ للمشترك طلب credit في محفظته بنسبة الانقطاع.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            الخدمة تُقدَّم "كما هي" (As-Is) بدون أيّ ضمانات صريحة أو ضمنيّة بالملاءمة لغرض معيّن.
          </p>
        </Section>

        <Section title="9 — حدود المسؤوليّة">
          <p style={pStyle}>
            باستثناء حالات الإهمال الجسيم أو الفعل المتعمّد:
          </p>
          <ul style={ulStyle}>
            <li>لا تتجاوز مسؤوليّة Corbit الإجماليّة في أيّ سنة تعاقديّة <b>إجمالي الرسوم المدفوعة فعلياً من المشترك خلال تلك السنة</b>.</li>
            <li>لا تشمل المسؤوليّة الأضرار غير المباشرة (فقدان أرباح، فقدان عملاء، انقطاع أعمال، فقدان سمعة).</li>
            <li>المشترك مسؤول كاملاً عن أيّ غرامات تفرضها Meta أو سدايا أو CST نتيجة مخالفات من جانبه.</li>
          </ul>
        </Section>

        <Section title="10 — التعويض المتبادل (Indemnification)">
          <ul style={ulStyle}>
            <li><b>المشترك يعوّض Corbit</b> عن أيّ مطالبات من أطراف ثالثة (بما فيها عملاؤه) ناتجة عن: إرسال محتوى مخالف، عدم الحصول على Opt-In، انتهاك حقوق ملكيّة فكريّة لأطراف أخرى، خرق هذه الشروط.</li>
            <li><b>Corbit تعوّض المشترك</b> عن أيّ مطالبات ناتجة عن خرق Corbit الجسيم لالتزاماتها المتعلّقة بحماية البيانات أو الملكيّة الفكريّة للمنصّة.</li>
          </ul>
        </Section>

        <Section title="11 — القوّة القاهرة (Force Majeure)">
          لا يُعدّ أيّ من الطرفَين مخلّاً بالتزاماته بسبب أحداث خارجة عن سيطرته، تشمل بدون حصر:
          الكوارث الطبيعيّة، الحروب، الإضرابات، انقطاعات الإنترنت أو الكهرباء على نطاق إقليمي،
          قرارات حكوميّة جديدة تمنع تشغيل الخدمة، انقطاعات Meta أو سدايا الشاملة، الهجمات السيبرانيّة
          واسعة النطاق. على الطرف المتضرّر إخطار الآخر خلال 7 أيّام وبذل أقصى الجهد لاستئناف الخدمة.
        </Section>

        <Section title="12 — التعليق والإنهاء">
          <p style={pStyle}><b>إنهاء من Corbit</b>:</p>
          <ul style={ulStyle}>
            <li>فوري دون إشعار: عند مخالفة جسيمة لسياسات Meta أو القوانين السعوديّة أو هذه الشروط.</li>
            <li>بإشعار 30 يوم: لأيّ سبب آخر مع ردّ نسبة الاشتراك المدفوعة عن الفترة غير المستهلكة.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}><b>إنهاء من المشترك</b>:</p>
          <ul style={ulStyle}>
            <li>في أيّ وقت من إعدادات الحساب أو بمراسلة <Link href="mailto:support@corbit.sa">support@corbit.sa</Link>.</li>
            <li>الاشتراك الشهري المدفوع مسبقاً لا يُسترد، لكن الخدمة تستمرّ لنهاية الفترة المدفوعة.</li>
            <li>محفظة Pay-as-you-go: الرصيد المتبقّي بعد إنهاء الاشتراك يُسترد بطلب صريح خلال 30 يوماً، خصماً لأيّ رسوم إداريّة (5% بحدّ أقصى 100 ريال).</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            <b>بعد الإنهاء</b>: يُمنح المشترك 90 يوماً لتصدير بياناته. بعدها تُحذف نهائياً وفق سياسة الخصوصيّة.
          </p>
        </Section>

        <Section title="13 — التعديلات على هذه الشروط">
          يحقّ لـ Corbit تعديل هذه الشروط في أيّ وقت. التعديلات الجوهريّة (تتعلّق بالأسعار، النطاق،
          الحقوق) تُبلَّغ عبر البريد الإلكتروني وداخل المنصّة قبل 14 يوماً من سريانها، ومتاح للمشترك
          إنهاء الاشتراك خلال هذي الفترة بدون التزام إضافي. الاستمرار في الاستخدام بعد سريان التعديل
          يُعدّ موافقة عليه.
        </Section>

        <Section title="14 — القانون الحاكم وتسوية النزاعات">
          تخضع هذه الشروط لأنظمة المملكة العربيّة السعوديّة. الأطراف يتّفقان على بذل الجهد لتسوية
          أيّ نزاع ودّياً خلال 30 يوماً قبل اللجوء للقضاء. أيّ نزاع لا يُحلّ ودّياً تختصّ به محاكم
          مدينة الرياض. اللغة الرسميّة للنزاع هي العربيّة، والنسخة العربيّة من هذه الشروط هي المعتمدة
          في حال أيّ تعارض مع الترجمة.
        </Section>

        <Section title="15 — التواصل">
          <ul style={ulStyle}>
            <li><b>الدعم العامّ</b>: <Link href="mailto:support@corbit.sa">support@corbit.sa</Link></li>
            <li><b>الشؤون القانونيّة</b>: <Link href="mailto:legal@corbit.sa">legal@corbit.sa</Link></li>
            <li><b>الفوترة</b>: <Link href="mailto:billing@corbit.sa">billing@corbit.sa</Link></li>
          </ul>
        </Section>

        <footer style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #1E3350", fontSize: 12.5, color: "#8B99AD", textAlign: "center" }}>
          © {new Date().getFullYear()} Corbit. جميع الحقوق محفوظة. WhatsBit هو منتج من Corbit.
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
