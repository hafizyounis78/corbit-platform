# CORBIT — الأعمال المتبقّية للإطلاق

> **الغرض:** ما تبقّى بعد جولة الأساسات. ما أُنجز (migration، super-admin، credentials modal، change-password، Moyasar scaffolding) لا يُعاد هنا.
> **آخر تحديث:** 2026-04-20

---

## 1. نشر ما تمّ برمجته (Deployment)

خطوات تشغيلية على سيرفر Forge للباك إند وعلى Vercel للفرونت:

### Backend (Forge)
- [ ] تحديث `.env` بالقيم الجديدة من `.env.example` (`ACCOUNT_NOTIFICATION_DRIVER=log`, `FRONTEND_URL`, `MOYASAR_*`).
- [ ] `php artisan migrate` — تشغيل migration `2026_04_20_100000_add_saas_launch_fields_to_users`.
- [ ] ضع متغيّرات السوبر أدمن في `.env`:
  ```
  SUPER_ADMIN_EMAIL=abdulmajeed@corbit.sa
  SUPER_ADMIN_PASSWORD=<كلمة قوية>
  SUPER_ADMIN_NAME=<الاسم>
  SUPER_ADMIN_PHONE=9665xxxxxxxx
  ```
- [ ] `php artisan db:seed --class=SuperAdminSeeder`.
- [ ] تأكّد أن queue worker + Reverb يعملان بعد التحديث.

### Frontend
- [ ] Vercel يتبنّى آخر commit تلقائياً؛ تحقّق من `/super-admin` و `/auth/change-password` بعد الـ deploy.

---

## 2. حسابات خارجيّة قيد الشراء / التفعيل

### 360dialog Partner (WhatsApp Business API)
- [ ] شراء حساب **Partner** (يسمح بإدارة أرقام العملاء من تحت حسابك).
- [ ] تسجيل **رقم Corbit الخاص** للإشعارات (غير أرقام العملاء).
- [ ] استخراج: `WHATSAPP_360_API_KEY` + `WHATSAPP_VERIFY_TOKEN` (قيمة تختارها) ووضعها في `.env`.
- [ ] تسجيل webhook: `https://api.corbit.sa/api/webhook/whatsapp` من لوحة 360dialog.

### قوالب Meta (لازمة لتفعيل قناة واتساب)
- [ ] إنشاء قالب `corbit_welcome_admin` — 4 متغيّرات (اسم الشركة، الإيميل، الباسورد، رابط الدخول).
- [ ] إنشاء قالب `corbit_welcome_member` — 5 متغيّرات (اسم الموظف، اسم الشركة، الإيميل، الباسورد، الرابط).
- [ ] الانتظار 1-24 ساعة للاعتماد. بعد الاعتماد:
  ```
  ACCOUNT_NOTIFICATION_DRIVER=whatsapp
  ```

### Anthropic (Claude)
- [ ] شراء مفتاح ووضعه في `.env`:
  ```
  AI_PROVIDER=anthropic
  ANTHROPIC_API_KEY=sk-ant-...
  ANTHROPIC_MODEL=claude-sonnet-4-6        # أو claude-haiku-4-5-20251001 للبلك
  ```

### Moyasar (بوّابة الدفع السعوديّة)
- [ ] تسجيل حساب — نبدأ بـ sandbox.
- [ ] وضع المفاتيح في `.env`:
  ```
  MOYASAR_ENV=sandbox
  MOYASAR_PUBLISHABLE_KEY=pk_test_...
  MOYASAR_SECRET_KEY=sk_test_...
  MOYASAR_WEBHOOK_SECRET=<random>
  ```
- [ ] تسجيل webhook: `https://api.corbit.sa/api/webhooks/moyasar`.

---

## 3. أعمال برمجيّة متبقّية

### Moyasar (scaffolding فقط — يلزم إكماله)
المبنيّ حالياً: `MoyasarService` + webhook handler يعتمد الدفع في wallet.
المتبقّي:
- [ ] **endpoint لإنشاء عملية دفع**: `POST /api/billing/moyasar/create-payment` يرجع `checkout_url` أو بيانات Moyasar.js.
- [ ] **صفحة واجهة** في `/billing`: زر "شحن الرصيد" → إدخال المبلغ → استدعاء Moyasar.js → redirect.
- [ ] **صفحة callback** `/billing/payment/callback` تعرض "نجح/فشل" بناءً على `status` من Moyasar.
- [ ] **اختبار كامل** في sandbox: دفع بطاقة تجريبيّة → webhook → wallet يتحدّث → transaction + invoice.

### 2FA للسوبر أدمن
مذكور في `BACKEND_DOCUMENTATION` لكن **غير مبني** في الكود.
- [ ] `POST /api/auth/2fa/setup` — توليد secret + QR.
- [ ] `POST /api/auth/2fa/verify` — تحقّق OTP وتفعيل.
- [ ] middleware يفرض 2FA على مسارات super-admin فقط.
- [ ] صفحة UI في الإعدادات.

> ملاحظة: مسارات 2FA موجودة في `routes/api.php` لكن AuthController فيه `setup2fa/verify2fa` كـ methods غير موجودة. لازم تُبنى.

### اختبارات يدويّة end-to-end
- [ ] سجّل دخول سوبر أدمن → أنشئ مؤسسة جديدة بباسورد يدويّة.
- [ ] سجّل دخول بالأدمن الجديد → تحقّق من تحويل إجباري لـ `/auth/change-password`.
- [ ] غيّر الباسورد → تأكّد أن API البقيّة تعمل.
- [ ] أنشئ عضو فريق → تحقّق من modal البيانات + سجّل دخول بها.
- [ ] بعد تفعيل `ACCOUNT_NOTIFICATION_DRIVER=whatsapp`: تحقّق من استقبال واتساب على الرقم.

---

## 4. قرارات داخليّة مطلوبة من المالك

- [ ] بيانات Super-Admin الأوّل (الاسم + الإيميل + رقم الواتساب) — تذهب مباشرة إلى seeder env.
- [ ] الدومين النهائي الثلاثي: `app.corbit.sa` (فرونت) / `api.corbit.sa` (باك) / `ws.corbit.sa` (Reverb).
- [ ] تفعيل 2FA للسوبر أدمن من اليوم الأول؟ — إن نعم، لازم نبني المسارات (انظر أعلاه).
- [ ] مدّة انتهاء الجلسة: 120 دقيقة (الحالية) أم 8 ساعات؟ — تعدَّل في `config/session.php`.
- [ ] اسم المنتج الذي سنسجّله عند Meta Business (لاعتماد القوالب).

---

## 5. مبادئ ثابتة

- **WhatsApp-First**: لا إيميل ولا SMS. كل الإشعارات الخارجيّة عبر WhatsApp API.
- **Credentials Fallback**: كل modal إنشاء حساب يعرض الباسورد للنسخ، حتى بعد تفعيل واتساب.
- **قنوات الإشعار**: driver واحد قابل للتبديل عبر `ACCOUNT_NOTIFICATION_DRIVER` (`log` → `whatsapp`) بدون تعديل كود.

---

## 6. مرجع سريع للـ commits المُنجَزة

- **Backend `c41edd5`**: migration + super-admin + AccountNotifications + middlewares + Moyasar service + SuperAdminSeeder.
- **Frontend `6232b6b`**: `/super-admin` + `/auth/change-password` + CredentialsModal + phone/password في modal الأعضاء + sidebar guard.
