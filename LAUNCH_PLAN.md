# CORBIT — خطّة الإطلاق كـ SaaS

> **الغرض:** مرجعيّة موحّدة لتفعيل المنصّة تجاريّاً، وبيع حسابات للعملاء، وإضافة موظفين داخل كل مؤسسة.
> **آخر تحديث:** 2026-04-20

---

## 1. الرؤية المعماريّة

المنصّة **SaaS متعدّد المستأجرين (Multi-Tenant)**. كل عميل = `organization` مستقلّة ببياناتها.

```
Organization (الشركة العميلة)
   ├── Plan (خطة اشتراك)
   ├── Wallet (رصيد)
   └── Users (موظفو الشركة)
         ├── admin      (المدير)
         ├── supervisor (المشرف)
         └── agent      (الوكيل)

Super-Admin (Corbit)
   └── يُنشئ Organizations + أوّل admin لكل واحدة
```

### الخطط (من `BACKEND_DOCUMENTATION.md`)

| الخطة | السعر | الوكلاء | المحادثات | AI |
|-------|-------|--------|----------|-----|
| Starter | 299 ر.س | 3 | 1,000 | 500 |
| Business | 799 ر.س | 10 | 5,000 | 2,000 |
| Enterprise | 1,999 ر.س | 50 | 25,000 | 10,000 |

---

## 2. القرار الجوهريّ: الإشعارات عبر واتساب فقط

**لا إيميل، لا SMS.** كل بيانات الدخول (بعد إنشاء المؤسسة أو إضافة موظف) تُرسل عبر **WhatsApp Business API**.

### قاعدة الـ 24 ساعة من Meta
لا يمكن إرسال رسالة حرّة لشخص لم يراسلنا خلال 24 ساعة → **إلزامي استخدام قوالب معتمدة**.

### القوالب المطلوبة من Meta Business
1. **`corbit_welcome_admin`** — يُرسله Super-Admin للأدمن الجديد
   - متغيّرات: `{{1}}` اسم الشركة، `{{2}}` الإيميل، `{{3}}` الباسورد، `{{4}}` رابط الدخول
2. **`corbit_welcome_member`** — يُرسله أدمن المؤسسة للموظف الجديد
   - متغيّرات: `{{1}}` اسم الموظف، `{{2}}` اسم الشركة، `{{3}}` الإيميل، `{{4}}` الباسورد، `{{5}}` الرابط

⏱️ اعتماد القوالب يأخذ 1-24 ساعة. حتى الاعتماد، **يُعرض الباسورد في الواجهة كنسخة احتياطيّة دائماً**.

### الأرقام المطلوبة
| الرقم | الاستخدام |
|-------|-----------|
| **رقم Corbit الرسمي** | إشعارات Super-Admin (ترحيب بالعملاء الجدد) |
| **رقم لكل عميل (org)** | العميل يستخدمه للتواصل مع جمهوره ولإرسال بيانات الموظفين |

**توصية:** حساب 360dialog **Partner** (ليس Regular) للتحكم بعدّة أرقام للعملاء.

---

## 3. الفجوة بين التصميم والمبنيّ

| المطلوب | الحالة |
|---|---|
| endpoint لإنشاء organization | ❌ غير موجود |
| صفحة super-admin panel | ❌ غير موجودة |
| إرسال واتساب لبيانات الدخول | ❌ الكود يولّد باسورد لكن **لا يرسل** |
| إجبار تغيير الباسورد أول دخول | ❌ غير مطبّق |
| Moyasar payment gateway | ❌ مذكور بالتوثيق فقط |
| خطط الاشتراك في DB (PlanSeeder) | ✅ موجود |
| Login + إدارة أعضاء داخل org | ✅ مبني |
| `WhatsAppService::sendTemplate()` | ✅ مبني |

---

## 4. خطّة التنفيذ (مُرتّبة)

### 4.1 قاعدة البيانات — Migration واحدة
```sql
users:
  + phone                 VARCHAR(20)  NOT NULL       // رقم الواتساب
  + is_super_admin        BOOLEAN DEFAULT false
  + must_change_password  BOOLEAN DEFAULT false
  ~ org_id                NULLABLE                    // ليوجد super-admin بدون org
```

### 4.2 Notification Service (Adapter Pattern)
```
app/Services/Notifications/
  ├── NotificationService.php          (entry point)
  └── Channels/
       ├── WhatsAppChannel.php         (يستخدم WhatsAppService::sendTemplate)
       └── LogChannel.php              (fallback — يكتب في storage/logs)
```

في `.env`:
```
NOTIFICATION_DRIVER=log          # log | whatsapp
CORBIT_WHATSAPP_NUMBER=
CORBIT_WHATSAPP_CHANNEL_ID=
WELCOME_ADMIN_TEMPLATE=corbit_welcome_admin
WELCOME_MEMBER_TEMPLATE=corbit_welcome_member
```

### 4.3 Backend Endpoints
**جديدة (Super-Admin):**
```
POST   /api/super-admin/organizations        { name, plan_id, admin:{name, email, phone, password?}, wallet_balance? }
GET    /api/super-admin/organizations
PATCH  /api/super-admin/organizations/{id}
```

**تعديل موجود:**
```
POST   /api/teams/members    → يقبل phone (إلزامي) + password (اختياري)
                                يرجع الباسورد في الـ response
```

**Middlewares:**
- `EnsureSuperAdmin` — يحمي `/api/super-admin/*`
- `ForcePasswordChange` — يمنع API إلا `/auth/change-password` لو `must_change_password=true`

### 4.4 Frontend
1. **صفحة `/super-admin`** (إدارة كل العملاء):
   - جدول المؤسسات + زر إنشاء جديدة
   - Modal الإنشاء: اسم الشركة / الخطة / اسم الأدمن / إيميله / هاتفه / باسورد (اختياري — تُولَّد عشوائيّاً لو فارغة) / رصيد افتتاحيّ
   - Modal النجاح: يعرض الباسورد للنسخ + تنبيه "لن تظهر مجدداً" + حالة إرسال الواتساب

2. **تعديل modal إضافة عضو** في [app/(platform)/teams/page.tsx:397](app/(platform)/teams/page.tsx#L397):
   - إضافة حقل **رقم الجوال** (إلزامي) + حقل **كلمة المرور** (اختياري)
   - Modal النجاح: نفس المنطق (عرض + نسخ + حالة واتساب)

3. **صفحة `/auth/change-password`** للإجبار أوّل دخول.

4. **Route guard** لإخفاء `/super-admin` من غير السوبر أدمن.

### 4.5 Seeders
- `SuperAdminSeeder` — ينشئ حساب Corbit الأوّل

---

## 5. البنية التحتيّة — الحسابات الخارجيّة

| # | الخدمة | الحالة | ملاحظات |
|---|--------|--------|---------|
| 1 | **WhatsApp Business (360dialog Partner)** | 🛒 سيُشترى اليوم | رقمان: Corbit + أوّل عميل |
| 2 | **Anthropic (Claude)** | 🛒 سيُشترى اليوم | `claude-sonnet-4-6` للجودة، `claude-haiku-4-5-20251001` للبلك |
| 3 | **Forge VPS (Backend)** | ✅ موجود | Laravel + Reverb |
| 4 | **قاعدة البيانات الإنتاجيّة** | ✅ موجودة | على سيرفر الشركة |
| 5 | **S3-Compatible Storage** | ✅ موجود | |
| 6 | **Redis** | ✅ موجود | |
| 7 | **Domain + SSL** | ⏳ سيُجهَّز على سيرفر الشركة | |
| 8 | **Moyasar (Sandbox ثم Live)** | 🛒 سيُشترى — نبدأ بـ sandbox | |
| 9 | **Sentry/Bugsnag** | ❌ غير مطلوب | اللوج من Forge يكفي |
| 10 | **Email / SMS** | ❌ غير مطلوب | البدائل عبر واتساب |

### متغيّرات `.env` للإنتاج
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.corbit.sa        # مؤقّت — بديل فعلي من الشركة

# DB
DB_CONNECTION=mysql
DB_HOST=
DB_PORT=3306
DB_DATABASE=corbit_production
DB_USERNAME=
DB_PASSWORD=

# Redis
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=
QUEUE_CONNECTION=redis
CACHE_STORE=redis
SESSION_DRIVER=redis

# S3
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=me-south-1
AWS_BUCKET=
AWS_ENDPOINT=                         # لو الخدمة R2/Backblaze/MinIO

# WhatsApp
WHATSAPP_PROVIDER=360dialog
WHATSAPP_VERIFY_TOKEN=corbit_webhook_2026_xyz
WHATSAPP_360_API_KEY=
CORBIT_WHATSAPP_NUMBER=
CORBIT_WHATSAPP_CHANNEL_ID=

# AI
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6

# Moyasar
MOYASAR_ENV=sandbox
MOYASAR_PUBLISHABLE_KEY=
MOYASAR_SECRET_KEY=
MOYASAR_WEBHOOK_SECRET=

# Notifications
NOTIFICATION_DRIVER=log               # يُبدَّل لـ whatsapp بعد اعتماد القوالب
WELCOME_ADMIN_TEMPLATE=corbit_welcome_admin
WELCOME_MEMBER_TEMPLATE=corbit_welcome_member
```

### Webhooks
- WhatsApp: `https://api.corbit.sa/api/webhooks/whatsapp`
- Moyasar: `https://api.corbit.sa/api/webhooks/moyasar`

---

## 6. قرارات داخليّة مطلوبة من المالك

- [ ] بيانات Super-Admin الأوّل: الاسم / الإيميل / رقم الواتساب
- [ ] الدومين النهائي: `app.corbit.sa` للفرونت، `api.corbit.sa` للباك، `ws.corbit.sa` للـ Reverb (تعديل حسب المتاح)
- [ ] تفعيل 2FA للسوبر أدمن من اليوم الأول؟ (مُوصى به: نعم)
- [ ] مدّة انتهاء الجلسة: 120 دقيقة (الحالية) أم 8 ساعات؟
- [ ] اسم المنتج عند Meta Business (لاعتماد القوالب)

---

## 7. مبدأ ثابت

> **كل بيانات دخول جديدة تُعرض في modal على الشاشة ليتمكّن الأدمن من النسخ**، حتى بعد تفعيل واتساب — كنسخة احتياطيّة لو القالب ما اعتُمد، الرقم غلط، أو الإرسال فشل.

---

## 8. ترتيب الخطوات القابل للتنفيذ

| # | الخطوة | يمكن اختبارها مستقلّة؟ |
|---|--------|----------------------|
| 1 | Migration (phone + flags) | ✅ |
| 2 | NotificationService + LogChannel | ✅ |
| 3 | تعديل `POST /api/teams/members` | ✅ |
| 4 | تعديل modal أعضاء + modal النجاح | ✅ نقطة اختبار كبرى |
| 5 | Super-Admin endpoints | ✅ |
| 6 | صفحة `/super-admin` في الفرونت | ✅ |
| 7 | Middlewares (SuperAdmin + ForcePasswordChange) | ✅ |
| 8 | صفحة تغيير الباسورد الإجباريّ | ✅ |
| 9 | Seeder سوبر أدمن | ✅ |
| 10 | تقديم قوالب Meta للاعتماد (بالتوازي) | ⏱️ انتظار Meta |
| 11 | ربط `WhatsAppChannel` + تبديل `NOTIFICATION_DRIVER=whatsapp` | ✅ |
| 12 | Moyasar sandbox | ✅ |
