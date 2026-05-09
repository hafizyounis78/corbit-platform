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
          <div style={{ color: "#8B99AD", fontSize: 13 }}>آخر تحديث: 9 مايو 2026</div>
        </header>

        <Section title="1 — مقدّمة">
          في <b>WhatsBit</b> (من Corbit) نلتزم بحماية بيانات المشتركين وعملائهم وفقاً
          لنظام حماية البيانات الشخصيّة السعوديّ (PDPL) ولوائحه التنفيذيّة الصادرة
          عن الهيئة السعوديّة للبيانات والذكاء الاصطناعي (سدايا)، وبما يتوافق مع
          سياسات Meta للشركات. توضّح هذه السياسة أنواع البيانات التي نجمعها،
          الأساس القانوني لكلّ معالجة، طريقة استخدامها، ومن يمكنه الوصول إليها.
        </Section>

        <Section title="2 — البيانات التي نجمعها">
          <ul style={ulStyle}>
            <li><b>بيانات المشترك (الشركة):</b> اسم الشركة، الرقم الضريبي/السجل التجاري، البريد، رقم الجوال، عنوان IP، بيانات الفوترة، وقت قبول الشروط.</li>
            <li><b>بيانات المستخدمين داخل الشركة:</b> الاسم، البريد، الجوال، الدور (admin/supervisor/agent)، تسجيلات الدخول، إعدادات 2FA.</li>
            <li><b>بيانات جهات الاتصال (عملاء الشركة):</b> الاسم، رقم الواتساب، البريد (اختياري)، اللغة، المدينة، محتوى الرسائل (نصّ/صور/صوت/مستندات)، توقيتات الإرسال والاستلام والقراءة، تاريخ ومصدر الموافقة (Opt-In)، تاريخ ومصدر إلغاء الاشتراك (Opt-Out).</li>
            <li><b>بيانات سلوكيّة محسوبة:</b> Customer Score، Sentiment، Intent، نقرات روابط الحملات، معدّلات الردّ — كلّها مولّدة من تفاعل العميل مع المشترك ومحفوظة لتحليلات المشترك فقط.</li>
            <li><b>بيانات فنّيّة:</b> سجلات webhook من Meta/360dialog، معرّفات الرسائل (wamid)، أحداث التسليم، logs الأخطاء (مجهولة الهويّة عبر Sentry/Flare).</li>
          </ul>
        </Section>

        <Section title="3 — الأساس القانوني للمعالجة">
          <p style={pStyle}>
            وفقاً للمادّة الخامسة من نظام PDPL، لكلّ نشاط معالجة أساس قانوني واضح:
          </p>
          <ul style={ulStyle}>
            <li><b>تنفيذ عقد:</b> تشغيل المنصّة، إرسال/استقبال الرسائل، الفوترة، الدعم — كلّها نتيجة مباشرة لعقد الاشتراك.</li>
            <li><b>المصلحة المشروعة:</b> سجلّات الأمان (Audit Log)، حماية المنصّة من الاحتيال، تحليلات الأداء التشغيلي.</li>
            <li><b>الموافقة الصريحة:</b> تفعيل وكلاء الذكاء الاصطناعي، تتبّع نقرات الروابط، نشرات تحديثات Corbit التسويقيّة (إن طُلبت).</li>
            <li><b>الالتزام النظامي:</b> الاحتفاظ بسجلّات الفوترة (5 سنوات لأغراض زكويّة/ضريبيّة)، إجابة طلبات الجهات الحكوميّة المختصّة وفق الإجراءات النظاميّة.</li>
          </ul>
        </Section>

        <Section title="4 — كيف نستخدم بياناتك">
          <ul style={ulStyle}>
            <li>تشغيل خدمة واتساب الأعمال لصالح الشركة المشتركة عبر مزوّد BSP المعتمد.</li>
            <li>إرسال واستقبال الرسائل عبر Meta WhatsApp Business API.</li>
            <li>تحليلات الأداء (معدّل التسليم، القراءة، الردّ، التحويل) — تظهر للشركة المشتركة فقط، لا تُجمَع عبر شركات.</li>
            <li>تشغيل وكلاء الذكاء الاصطناعي للردّ التلقائي عند تفعيلها صراحةً من المشترك.</li>
            <li>إصدار الفواتير وإدارة محفظة الاشتراك (Pay-as-you-go).</li>
            <li>الالتزام بالمتطلّبات القانونيّة والتنظيميّة عند الحاجة (الزكاة والضريبة، النيابة العامّة، سدايا).</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            <b>لا نبيع بيانات العملاء أبداً،</b> ولا نستخدمها لتدريب نماذج ذكاء اصطناعي عامّة،
            ولا لأيّ غرض تسويقي خارج نطاق خدمات المشترك المباشر.
          </p>
        </Section>

        <Section title="5 — معالجي البيانات الفرعيّون (Sub-processors)">
          <p style={pStyle}>نشارك الحدّ الأدنى الضروري من البيانات مع المزوّدين التالين:</p>
          <ul style={ulStyle}>
            <li><b>Meta Platforms Ireland Ltd. (WhatsApp Business API)</b> — استضافة الرسائل أثناء الإرسال/الاستقبال. الموقع: الاتحاد الأوروبي.</li>
            <li><b>360dialog GmbH (BSP)</b> — وسيط تقني لإرسال الرسائل عبر WhatsApp. الموقع: ألمانيا.</li>
            <li><b>Laravel Forge (DigitalOcean / AWS)</b> — استضافة الـ backend والـ frontend. الموقع: المنطقة المختارة (افتراضياً الشرق الأوسط).</li>
            <li><b>Alibaba Cloud OSS</b> — تخزين المرفقات (إيصالات التحويل البنكي، مستندات قاعدة المعرفة). الموقع: مناطق الشرق الأوسط.</li>
            <li><b>OpenAI L.L.C. أو Anthropic PBC</b> — معالجة محتوى المحادثات عند تفعيل وكلاء AI. لا تُستخدم البيانات لتدريب نماذج عامّة. الموقع: الولايات المتحدة.</li>
            <li><b>mobile.net.sa (مدار)</b> — إرسال رسائل SMS النظاميّة (OTP، إشعارات الحساب). الموقع: المملكة العربيّة السعوديّة.</li>
            <li><b>Spatie Flare (مراقبة الأخطاء — Backend)</b> — معالجة logs الأخطاء فقط، بدون محتوى رسائل. الموقع: الاتحاد الأوروبي.</li>
            <li><b>Functional Software Inc. (Sentry — مراقبة الأخطاء — Frontend)</b> — معالجة logs الأخطاء على متصفّح المستخدم فقط. الموقع: ألمانيا.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            عند إضافة معالج فرعي جديد نُخطر المشتركين قبل 30 يوماً من التفعيل، ولهم حقّ الاعتراض.
            القائمة المحدّثة دائماً متاحة في صفحة DPA.
          </p>
        </Section>

        <Section title="6 — نقل البيانات خارج المملكة">
          <p style={pStyle}>
            البيانات الأساسيّة (المحادثات، الفوترة، الإعدادات) <b>محفوظة على خوادم Forge في المنطقة المختارة</b>.
            النقل خارج المملكة يقع فقط في الحالات التالية، ويتمّ بضمانات تعاقديّة مناسبة (Standard Contractual Clauses)
            وتشفير TLS 1.3 طوال الرحلة:
          </p>
          <ul style={ulStyle}>
            <li><b>Meta Cloud API:</b> إرسال نصّ الرسائل لمعالجتها وتسليمها (مطلب فنّي للخدمة).</li>
            <li><b>OpenAI / Anthropic:</b> عند تفعيل AI فقط، يُرسل نصّ المحادثة لتوليد الردّ ثمّ يُحذف من جانب المزوّد خلال 30 يوماً.</li>
            <li><b>360dialog / Spatie Flare / Sentry:</b> معالجة فنّيّة (إرسال، logs).</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            جميع عمليّات النقل تتمّ وفقاً للمواد 29-31 من نظام PDPL.
          </p>
        </Section>

        <Section title="7 — مدّة الاحتفاظ بالبيانات">
          <ul style={ulStyle}>
            <li><b>المحادثات والرسائل:</b> سنة واحدة من تاريخ إغلاق المحادثة، ثمّ تُحذف تلقائياً.</li>
            <li><b>سجلّات استخدام الذكاء الاصطناعي:</b> 6 أشهر.</li>
            <li><b>سجلّات webhook من Meta/360dialog:</b> 90 يوماً.</li>
            <li><b>بيانات الحساب والفوترة:</b> طوال فترة الاشتراك + 5 سنوات بعد الإنهاء (متطلّب زكوي/ضريبي سعودي).</li>
            <li><b>سجلّات الـ Audit Log الأمنيّة:</b> سنتان.</li>
            <li><b>قوائم Opt-Out / blocked:</b> تُحفظ كـ سجلّ منع لضمان عدم إرسال حملات لاحقة، ولا تُحذف نهائياً إلّا بطلب صريح.</li>
            <li><b>عند إنهاء الاشتراك:</b> يُمنح المشترك 90 يوماً لتصدير بياناته، بعدها تُحذف نهائياً (باستثناء البنود النظاميّة أعلاه).</li>
          </ul>
        </Section>

        <Section title="8 — حقوق أصحاب البيانات (PDPL)">
          <p style={pStyle}>يحقّ لكلّ صاحب بيانات (مشترك أو عميل المشترك)، وفقاً لنظام PDPL السعودي:</p>
          <ul style={ulStyle}>
            <li><b>الوصول:</b> الحصول على نسخة من بياناته الشخصيّة المخزّنة لدينا.</li>
            <li><b>التصحيح:</b> تعديل أيّ بيانات غير دقيقة أو ناقصة.</li>
            <li><b>الحذف (الحقّ في النسيان):</b> طلب حذف بياناته (يُنفَّذ خلال 30 يوم عمل، باستثناء ما يلزم الاحتفاظ به نظامياً).</li>
            <li><b>سحب الموافقة:</b> إلغاء موافقة المعالجة في أيّ وقت، عبر كلمة STOP/إلغاء على واتساب أو عبر إعدادات الحساب.</li>
            <li><b>نقل البيانات (Data Portability):</b> الحصول على نسخة من البيانات بصيغة قابلة للقراءة آلياً.</li>
            <li><b>تقييد المعالجة:</b> طلب إيقاف معالجة محدّدة مع الاحتفاظ بالبيانات.</li>
            <li><b>الاعتراض:</b> الاعتراض على معالجة قائمة على المصلحة المشروعة.</li>
            <li><b>الشكوى:</b> تقديم شكوى للهيئة السعوديّة للبيانات والذكاء الاصطناعي (سدايا) على{" "}
              <Link href="https://sdaia.gov.sa">sdaia.gov.sa</Link>.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 10 }}>
            لممارسة أيّ من هذه الحقوق: راسلنا على{" "}
            <Link href="mailto:privacy@corbit.sa">privacy@corbit.sa</Link>{" "}
            ونردّ خلال 30 يوماً كحدّ أقصى.
          </p>
        </Section>

        <Section title="9 — اتّخاذ القرار التلقائي / الذكاء الاصطناعي">
          <p style={pStyle}>
            عند تفعيل المشترك لميزة وكلاء الذكاء الاصطناعي، يقوم النظام بتوليد ردود تلقائيّة
            على رسائل العميل بناءً على نموذج OpenAI أو Anthropic. هذه المعالجة:
          </p>
          <ul style={ulStyle}>
            <li>لا تُنتج قرارات قانونيّة أو ماليّة مؤثّرة (لا منح/منع، لا تسعير ديناميكي للعميل).</li>
            <li>المشترك يحتفظ بالقدرة على تجاوز الردّ التلقائي والتدخّل يدوياً في أيّ لحظة.</li>
            <li>العميل يقدر يطلب التحدّث مع موظّف بشري في أيّ وقت بكلمة "موظّف"/"agent"/"إنسان".</li>
            <li>محتوى المحادثة لا يُستخدم لتدريب نماذج AI عامّة (شرط تعاقدي مع المزوّد).</li>
          </ul>
        </Section>

        <Section title="10 — أمن البيانات">
          <ul style={ulStyle}>
            <li>جميع الاتّصالات مشفّرة عبر TLS 1.3.</li>
            <li>كلمات المرور مخزّنة بـ hash (bcrypt) مع salt فريد، لا يمكن عكسها.</li>
            <li>مفاتيح API الخارجيّة (360dialog، OpenAI، إلخ) مخزّنة مشفّرة في قاعدة البيانات.</li>
            <li>التوكنات (Sanctum) قابلة للإبطال الفوري.</li>
            <li>صلاحيّات المستخدمين معزولة عبر RBAC (admin / supervisor / agent / member).</li>
            <li>عزل المستأجرين Multi-tenancy على مستوى كلّ استعلام (tenant scoping إجباري).</li>
            <li>نسخ احتياطيّة مشفّرة يومياً، تُحفظ 30 يوماً، تُختبر استعادتها شهرياً.</li>
            <li>مراقبة الأخطاء عبر Spatie Flare (backend) و Sentry (frontend).</li>
            <li>Rate limiting على نقاط حسّاسة (تسجيل دخول، OTP، استرداد كلمة مرور، webhook).</li>
            <li>سجل تدقيق (Audit Log) لكلّ عمليّة حسّاسة (login، تغيير صلاحيّة، اعتماد تحويل بنكي).</li>
          </ul>
        </Section>

        <Section title="11 — الإخطار بخرق البيانات">
          <p style={pStyle}>
            في حال اكتشاف خرق بيانات يؤثّر على بيانات شخصيّة، نلتزم بـ:
          </p>
          <ul style={ulStyle}>
            <li>إخطار سدايا خلال <b>72 ساعة</b> من اكتشاف الخرق (وفق المادّة 27 من PDPL).</li>
            <li>إخطار المشترك المتضرّر دون تأخير غير مبرّر.</li>
            <li>إخطار أصحاب البيانات المتضرّرين بشكل مباشر إذا كان الخرق يحمل خطراً مرتفعاً.</li>
            <li>توثيق الحادث وإجراءات الاحتواء وتقديم تقرير شامل بطلب الجهات المختصّة.</li>
          </ul>
        </Section>

        <Section title="12 — ملفات تعريف الارتباط (Cookies)">
          نستخدم Cookies ضروريّة فقط لتسجيل الدخول والحفاظ على جلسة المستخدم وحماية الـ CSRF.
          لا نستخدم Cookies تتبّع، ولا إعلانات، ولا نشارك بياناتك مع شبكات إعلانيّة.
        </Section>

        <Section title="13 — الأطفال">
          منصّة Corbit موجّهة للأعمال فقط. لا نستقبل ولا نعالج عن قصد بيانات أيّ شخص دون سنّ
          18 عاماً. إذا اكتشفنا أنّ بيانات قاصر دخلت المنصّة، نحذفها فوراً.
        </Section>

        <Section title="14 — التعديلات على هذه السياسة">
          نحتفظ بحقّ تحديث هذه السياسة. أيّ تغيير جوهري يُبلَّغ به المشتركون قبل 7 أيّام على الأقلّ
          عبر البريد الإلكتروني ورسالة داخل المنصّة. التغييرات غير الجوهريّة (تصحيحات لغويّة،
          تحديث روابط) تُنشر مباشرة مع تحديث تاريخ "آخر تحديث" أعلاه.
        </Section>

        <Section title="15 — التواصل">
          <ul style={ulStyle}>
            <li><b>طلبات الخصوصيّة وحقوق أصحاب البيانات:</b> <Link href="mailto:privacy@corbit.sa">privacy@corbit.sa</Link></li>
            <li><b>مسؤول حماية البيانات (DPO):</b> <Link href="mailto:dpo@corbit.sa">dpo@corbit.sa</Link></li>
            <li><b>الدعم العامّ:</b> <Link href="mailto:support@corbit.sa">support@corbit.sa</Link></li>
            <li><b>الجهة الرقابيّة:</b> الهيئة السعوديّة للبيانات والذكاء الاصطناعي (سدايا) — <Link href="https://sdaia.gov.sa">sdaia.gov.sa</Link></li>
          </ul>
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
