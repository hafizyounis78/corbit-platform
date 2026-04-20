# CORBIT — الأعمال المتبقّية للإطلاق

> **مكمّل لـ [LAUNCH_PLAN.md](LAUNCH_PLAN.md).** هذا الملف يعرض فقط ما لم يُنجَز. ما أُنجز في الجولة الأولى موثّق في LAUNCH_PLAN.md + commits `c41edd5` (backend) و `6232b6b` (frontend).
> **آخر تحديث:** 2026-04-20

---

## ✅ ما أُنجز (للمرجع السريع)

- Migration: `phone` + `is_super_admin` + `must_change_password` + `org_id` nullable
- `AccountNotificationService` مع adapter pattern (`LogChannel` + `WhatsAppChannel`)
- Super-Admin endpoints (`/api/super-admin/organizations` — GET/POST/PATCH)
- Middlewares: `EnsureSuperAdmin` + `ForcePasswordChange`
- `POST /api/auth/change-password`
- `POST /api/teams/members` يقبل `phone` + `password` ويرجع الباسورد
- `MoyasarService` + webhook handler (scaffolding)
- `SuperAdminSeeder`
- Frontend: `/super-admin` + `/auth/change-password` + `CredentialsModal` + تعديل modal الأعضاء + sidebar guard

---

## 🔴 المتبقّي

### 1. النشر على Forge
- [ ] تحديث `.env` على السيرفر بالمتغيّرات الجديدة من `.env.example`:
  ```
  ACCOUNT_NOTIFICATION_DRIVER=log
  ACCOUNT_WELCOME_ADMIN_TEMPLATE=corbit_welcome_admin
  ACCOUNT_WELCOME_MEMBER_TEMPLATE=corbit_welcome_member
  ACCOUNT_WELCOME_TEMPLATE_LANG=ar
  FRONTEND_URL=https://app.corbit.sa
  MOYASAR_ENV=sandbox
  MOYASAR_PUBLISHABLE_KEY=
  MOYASAR_SECRET_KEY=
  MOYASAR_WEBHOOK_SECRET=
  ```
- [ ] `php artisan migrate` — تشغيل migration الجديدة.
- [ ] وضع بيانات السوبر أدمن الأولى:
  ```
  SUPER_ADMIN_EMAIL=abdulmajeed@corbit.sa
  SUPER_ADMIN_PASSWORD=<كلمة قوية>
  SUPER_ADMIN_NAME=<الاسم>
  SUPER_ADMIN_PHONE=9665xxxxxxxx
  ```
- [ ] `php artisan db:seed --class=SuperAdminSeeder`.
- [ ] التأكّد من: Supervisor يعيد queue workers + Reverb، و `php artisan config:cache`.

### 2. شراء الحسابات الخارجيّة

#### 360dialog Partner (WhatsApp)
- [ ] شراء حساب **Partner** (ليس Regular).
- [ ] تسجيل **رقم Corbit الخاص** للإشعارات (منفصل عن أرقام العملاء).
- [ ] استخراج `WHATSAPP_360_API_KEY` ووضعها في `.env`.
- [ ] تسجيل webhook على 360dialog: `https://api.corbit.sa/api/webhook/whatsapp`.

#### قوالب Meta (لازمة لتفعيل قناة واتساب)
- [ ] تقديم قالب `corbit_welcome_admin` (4 متغيّرات: اسم الشركة، الإيميل، الباسورد، الرابط).
- [ ] تقديم قالب `corbit_welcome_member` (5 متغيّرات: اسم الموظف، اسم الشركة، الإيميل، الباسورد، الرابط).
- [ ] انتظار اعتماد Meta (1-24 ساعة).
- [ ] بعد الاعتماد: `ACCOUNT_NOTIFICATION_DRIVER=whatsapp`.

#### Anthropic (Claude)
- [ ] شراء مفتاح ووضعه:
  ```
  AI_PROVIDER=anthropic
  ANTHROPIC_API_KEY=sk-ant-...
  ANTHROPIC_MODEL=claude-sonnet-4-6
  ```

#### Moyasar
- [ ] تسجيل حساب sandbox، استخراج المفاتيح.
- [ ] تسجيل webhook: `https://api.corbit.sa/api/webhooks/moyasar`.
- [ ] اختيار `MOYASAR_WEBHOOK_SECRET` عشوائي وتسجيله في لوحة Moyasar.

### 3. أعمال برمجيّة ناقصة

#### Moyasar: إتمام الواجهات (حاليّاً webhook فقط)
- [ ] **Backend:** `POST /api/billing/moyasar/create-payment` يرجع `checkout_url` أو بيانات Moyasar.js.
- [ ] **Frontend:** صفحة `/billing` — زر "شحن الرصيد" → إدخال المبلغ → استدعاء Moyasar.js → redirect.
- [ ] **Frontend:** صفحة callback `/billing/payment/callback` تعرض نجاح/فشل.
- [ ] **اختبار end-to-end** في sandbox: دفع ببطاقة تجريبيّة → webhook → `wallet_balance` يُحدَّث → `transactions` + `invoices` تُنشأ.

#### 2FA للسوبر أدمن
المسارات معرَّفة في `routes/api.php` لكن methods `setup2fa/verify2fa` غير موجودة في `AuthController`.
- [ ] `POST /api/auth/2fa/setup` — توليد TOTP secret + QR.
- [ ] `POST /api/auth/2fa/verify` — تحقّق OTP وتفعيل.
- [ ] middleware يفرض 2FA على `/api/super-admin/*` فقط.
- [ ] صفحة UI في إعدادات السوبر أدمن.

### 4. اختبارات يدويّة قبل الإطلاق
- [ ] سجّل دخول سوبر أدمن → أنشئ مؤسسة ببيانات تجريبيّة → انسخ الباسورد.
- [ ] سجّل دخول بالأدمن الجديد → تأكّد من التحويل لـ `/auth/change-password`.
- [ ] غيّر الباسورد → تأكّد أن باقي الـ API يعمل.
- [ ] أضف عضو فريق → تأكّد من modal البيانات + جرّب تسجيل الدخول بها.
- [ ] (بعد تفعيل قناة واتساب) تحقّق من استقبال القالبين على رقم واتساب حقيقي.

### 5. قرارات داخليّة مطلوبة منك

- [ ] **Super-Admin الأوّل:** الاسم / الإيميل / رقم الواتساب.
- [ ] **الدومين:** `app.corbit.sa` / `api.corbit.sa` / `ws.corbit.sa` أم تعديل؟
- [ ] **2FA للسوبر أدمن:** نفعّلها من اليوم الأول أم نؤجّلها؟
- [ ] **مدّة الجلسة:** 120 دقيقة (الحالية) أم 8 ساعات (ساعات دوام)؟
- [ ] **اسم المنتج عند Meta Business** لاعتماد القوالب.
