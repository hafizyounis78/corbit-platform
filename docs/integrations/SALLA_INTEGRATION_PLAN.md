# خطّة تكامل Corbit مع سلّة v2.0 — مستند تصميم نهائي قابل للتنفيذ
**التاريخ**: 2026-05-09
**النوع**: Final Implementation Plan
**الحالة**: 🟢 **9 من 11 phase خلصت — ينتظر credentials للـ Phase 0 + 10**
**التقدير**: **11 يوم عمل (88 ساعة)**، الفعلي حتى الآن: **يوم واحد** (Phases 1-9 على branch `salla`)
**النسخة**: v2.0 (دمج المراجعة الهندسيّة + الخطّة الأصليّة)

---

## 🎯 ملخّص الحالة (محدّث 2026-05-09 آخر النهار)

### ✅ مُنجَز — على branch `salla` في كلا الـ repos
| Phase | Commit | الموضوع | الحالة |
|---|---|---|---|
| **1** | `742177e` | Foundation (9 migrations + 6 models + config) | ✅ |
| **2** | `18d4174` | OAuth flow كامل (start/exchange/refresh/revoke) | ✅ |
| **3** | `a000ab7` | API Client + Sync services + 3 jobs + scheduler | ✅ |
| **4** | `d2452ce` | Webhook receiver + race-condition handler | ✅ |
| **5** | `18c327e` | ConversionAttributionService + 10 edge cases | ✅ |
| **6** | `478dcb2` (frontend) | Frontend (Salla page + hub special-case) | ✅ |
| **7** | `2f4cac2` | Order notifications + cart recovery + opt-in gate | ✅ |
| **8** | `9a261a0` | PDPL endpoints (audit log + customer purge + reports) | ✅ |
| **9** | `e73c083` | Cleanup crons (90d webhook, 2y audit) + runbook | ✅ |

**نتائج الـ tests**: 77 test pass، 195 assertion، صفر regression.
**الـ feature flag**: `SALLA_INTEGRATION_ENABLED=false` افتراضياً → الكود نائم 100% بدون تأثير.
**main لم يتأثّر** — Forge لا ينشر، prod مستقرّ.

### 🐛 4 Bugs خفيّة اكتُشفت بفضل الـ tests
1. `SallaIntegration::find($org_id)` كان يبحث بالـ id بدل org_id
2. `CampaignSend.converted_at` ناقص من `$fillable` (Eloquent يتجاهل الكتابة بصمت)
3. `Contact.whatsapp_marketing_opt_in_*` ناقصة من `$fillable`
4. `OrgSettings.salla_*` ناقصة من `$fillable`

### ⏸️ متبقّي — يحتاج credentials من Hafiz

#### Phase 0 — Salla Sandbox Discovery (6 ساعات)
- التحقّق من Salla docs vs الواقع
- التقاط fixtures حقيقيّة في `tests/fixtures/salla/`
- إصلاح أيّ `// VERIFY IN PHASE 0` markers في الكود
- توثيق الفروق في `docs/salla-api-reality.md`

#### Phase 10 — Beta + Documentation (8 ساعات)
- اختبار live على **Corbit master account** (ليس Yasref)
- 3 Help Center articles
- إضافة Salla كـ sub-processor في Privacy Policy + DPA
- تحديث `LAWYER_REVIEW_CHECKLIST.md`

### 📋 ما يلزم منك (Hafiz) غداً للاستكمال

1. **سجّل Partner account** على https://salla.partners (5 دقائق، مجّاني، لا يحتاج CR)
2. **أنشئ Sandbox App** — ضع فيها:
   - Redirect URI: `https://corbit-whatsapp-backend.corbit.sa/api/integrations/salla/oauth/callback`
   - Webhook URL: `https://corbit-whatsapp-backend.corbit.sa/api/webhooks/salla`
   - Scopes: `customers.read`, `orders.read`, `webhooks.read_write`, `app.store.uninstall.read`
3. **ابعتلي**:
   - `SALLA_CLIENT_ID` (sandbox)
   - `SALLA_CLIENT_SECRET` (sandbox)
   - الـ scopes الموافَق عليها
4. **اقرر** إذا تبي الـ branch يُربط بـ Forge قبل الـ merge (اختياري)

بعدها أكمل Phase 0 + 10 وأدمج لـ main.

---

---

## 📋 ملخّص التغييرات من v1.0

بعد مراجعة هندسيّة مستقلّة، تمّ:

### 🔴 إصلاح bugs حرجة كانت ستُسبّب failures في الإنتاج
1. **Multi-currency bug** — `total_sar` مع `currency` متناقضَين. أُعيدت هيكلة الـ schema بـ `total_amount` (raw) + `total_amount_sar` (converted) + `fx_rate_used`.
2. **Race conditions في webhooks** — `order.payment.updated` قد يصل قبل `order.created`. أُضيفت آليّة re-queue + fallback fetch.
3. **WhatsApp marketing opt-in مفقود** — قالب cart recovery كان سيُرسَل بدون opt-in (مخالفة Meta). أُضيف tracking كامل لـ marketing consent.

### 🟡 إضافات حرجة كانت ناقصة
4. **Phase 0 — Salla Sandbox Discovery** — اكتشاف الفروق بين الـ docs والواقع قبل بناء الكود.
5. **PDPL Compliance Hardening** — Audit log، Right to be Forgotten، Data Residency، SDAIA registration check.
6. **Attribution edge cases** — Refund handling، cancellation reversal، multi-buyer counting.
7. **Operational Readiness** — Monitoring، SLOs، runbook، stress tests.
8. **Backfill strategy واضحة** — لا تُنسَب طلبات سابقة لحملات سابقة.

### 🟢 تغييرات نطاق
9. **Coupon Distribution** → مُؤجَّل لـ v2 Roadmap (لا قيمة MVP).
10. **Multi-store support** → v1 single-store، v1.5 multi-store.
11. **Pricing model** → مستبعَد من هذي الوثيقة (قرار تجاري منفصل).

### ⏱️ تعديل التقدير
- v1.0: **5 أيّام (40 ساعة)** — كان متفائلاً
- v2.0: **11 يوم (88 ساعة)** — واقعي مع buffer لمفاجآت Salla API

---

## 📖 جدول المحتويات

0. [Phase 0 — Salla Sandbox Discovery](#0)
1. [لماذا التكامل مع سلّة؟](#1)
2. [ما الذي سنحقّقه (Use Cases)](#2)
3. [خدمات سلّة التي سنستخدمها](#3)
4. [قواعد البيانات الجديدة](#4)
5. [الـ Models](#5)
6. [الـ Services](#6)
7. [الـ Controllers + Routes](#7)
8. [الـ Background Jobs](#8)
9. [الصفحات الأماميّة (Frontend)](#9)
10. [الإعدادات والـ Environment](#10)
11. [الـ Templates التي يحتاجها العميل](#11)
12. [خطّة التنفيذ بالـ Phases (12 phase)](#12)
13. [المخاطر والمعالجات](#13)
14. [التحديثات القانونيّة المطلوبة (PDPL)](#14)
15. [Operational Readiness — Monitoring + SLOs](#15)
16. [مرحلة ما بعد التنفيذ — Salla App Marketplace](#16)
17. [v2 Roadmap (مُؤجَّل بقرار)](#17)

---

<a id="0"></a>
## ٠. Phase 0 — Salla Sandbox Discovery (نصف يوم — قبل أيّ كود)

**الهدف**: اكتشاف الفروق بين توثيق Salla والواقع قبل البناء.

### المهام (6 ساعات)
- [ ] إنشاء Salla Sandbox account على https://salla.partners
- [ ] إنشاء Test App + الحصول على credentials (CLIENT_ID/SECRET)
- [ ] الاشتراك في كل الـ webhooks المذكورة في القسم 3.4
- [ ] توليد بيانات اختبار حقيقيّة:
  - 5 طلبات بحالات مختلفة (paid/shipped/delivered/cancelled)
  - 1 طلب مع refund (full + partial)
  - 1 abandoned cart
  - 2 customers مختلفَين
- [ ] **التقاط الـ payloads الفعليّة** وحفظها كـ fixtures للاختبارات:
  ```
  tests/fixtures/salla/
    ├── webhook.order_created.json
    ├── webhook.order_payment_updated.json
    ├── webhook.order_status_updated.json
    ├── webhook.order_cancelled.json
    ├── webhook.order_refunded.json
    ├── webhook.customer_created.json
    ├── webhook.cart_abandoned.json
    ├── webhook.app_uninstall.json
    └── api.store_info.json
  ```
- [ ] التحقّق من النقاط الحرجة التالية وتوثيقها:
  | السؤال | الإجابة الفعليّة |
  |---|---|
  | API base URL الصحيح | `api.salla.dev/admin/v2/` ولا `api.salla.sa/admin/v2/`؟ |
  | OAuth endpoints exact paths | `/oauth2/token` ولا `/oauth2/auth/token`؟ |
  | الـ events asma بالضبط | `order.created` ولا `app.order.created`؟ |
  | الـ scopes المطلوبة | لكل endpoint |
  | شكل webhook signature header | `x-salla-signature` بأيّ خوارزميّة؟ |
  | Phone format في الـ payload | `+9665xxxx` ولا `9665xxxx` ولا `05xxxx`؟ |
  | Currency في الـ multi-currency stores | كيف تظهر؟ |

### Deliverable
**ملف `corbit-backend/docs/salla-api-reality.md`** يوثّق كل الفروق بين Salla docs والواقع. يصير المرجع لكل phase تالي.

### لماذا هذي الـ Phase حرجة
معظم تكامل APIs يفشل بسبب assumptions خاطئة من الـ docs. ساعة هنا توفّر يومَين لاحقاً.

---

<a id="1"></a>
## ١. لماذا التكامل مع سلّة؟

### الواقع السوقي
- **70-80% من تجّار التجزئة الإلكترونيّين السعوديّين على سلّة**
- المنافسون (Wati، Zoko) عندهم Salla integration → يفوز عليهم Corbit في كلّ شي إلا هذا
- بدون Salla integration: **conversion tracking خاطئ** (نُقدِّر الإيرادات بدل قياسها فعلياً)

### المشكلة التي يحلّها
الآن لو Corbit أرسلت حملة لـ 1000 عميل، نعرف:
- ✅ كم سُلِّمت
- ✅ كم قُرئت
- ✅ كم نقروا الرابط
- ❌ كم اشتروا فعلياً (هذا أهمّ شي للـ ROI)

بعد التكامل:
- ✅ **كم اشتروا فعلياً + قيمة الطلب**
- ✅ ROI حقيقي (= revenue / campaign cost)
- ✅ تحليل قطاع العملاء بناءً على سلوك الشراء

---

<a id="2"></a>
## ٢. ما الذي سنحقّقه (Use Cases)

### الأولويّة الأولى (MVP — Phase 1-7)
| # | السيناريو | الوصف |
|---|---|---|
| 1 | **Conversion Tracking** | لمّا عميل يستلم رسالة Corbit ثمّ يشتري على سلّة، نربط الطلب بالحملة |
| 2 | **Customer Sync** | جلب العملاء من سلّة → تنشئ Contacts في Corbit تلقائياً |
| 3 | **Order Status Notifications** | لمّا الطلب يتغيّر (مدفوع/مشحون/مُسلَّم)، Corbit يرسل قالب WhatsApp |
| 4 | **Cart Abandonment Recovery** (مع opt-in check) | لمّا عميل يترك سلّة بدون دفع، Corbit يرسل تذكير — **فقط لمن وافق على marketing** |
| 5 | **Refund/Cancellation Handling** | عند إلغاء/استرداد طلب، الـ attribution يُعكَس تلقائياً |

### مُؤجَّل لـ v2 Roadmap (راجع القسم 17)
- Coupon Distribution
- AI Order Lookup
- Product Sharing
- Multi-touch attribution
- Two-way sync (Corbit → Salla)

---

<a id="3"></a>
## ٣. خدمات سلّة التي سنستخدمها

### ٣.١ المنصّة الرسميّة
- **Salla Developer Portal**: https://salla.dev
- **Salla App Store**: https://apps.salla.sa
- **API Docs**: https://docs.salla.dev
- **Partner Dashboard**: https://salla.partners

### ٣.٢ مسار التكامل (نختار واحد)

#### الخيار أ — **Salla App عبر OAuth 2.0** (مُعتمد ✅)
- ننشر Corbit كـ "App" في Salla App Store
- العميل يضغط "تثبيت" من لوحة سلّة → OAuth → يرجع لـ Corbit
- نحصل على access_token + refresh_token
- **مزايا**: UX ممتاز، Salla App Store يجلب traffic، احترافيّة
- **عيوب**: يحتاج موافقة Salla على نشر التطبيق (~2 أسبوع review)

#### الخيار ب — **Private API Key** (Fallback مؤقّت)
- العميل يولّد API key في إعدادات سلّة → يلصقه في Corbit
- **مزايا**: بسيط، ما يحتاج موافقة سلّة
- **عيوب**: UX سيّئ، يدوي

**القرار**: نبني الخيار (أ) كأساس + (ب) كـ fallback أثناء انتظار موافقة Salla App.

### ٣.٣ الـ APIs التي سنستخدمها

#### Authentication
- `POST /oauth2/token` — تبديل authorization code لـ access_token
- `POST /oauth2/token/refresh` — تجديد التوكن قبل انتهاء صلاحيّته

> **ملاحظة**: الـ paths الفعليّة تُؤكَّد في Phase 0.

#### Resources (REST API)
| Endpoint | الاستخدام |
|---|---|
| `GET /admin/v2/store/info` | معلومات المتجر (اسم، عملة، URL) |
| `GET /admin/v2/customers` | قائمة العملاء (paginated) |
| `GET /admin/v2/customers/{id}` | تفاصيل عميل |
| `GET /admin/v2/orders` | قائمة الطلبات (paginated، filterable) |
| `GET /admin/v2/orders/{id}` | تفاصيل طلب (يُستخدم في race condition fallback) |
| `GET /admin/v2/products` | قائمة المنتجات |
| `GET /admin/v2/abandoned-carts` | السلال المتروكة |

#### Rate Limits
سلّة تسمح: **120 طلب/دقيقة** لكلّ store. سنحتاج backoff strategy + cache.

### ٣.٤ الـ Webhooks (الأهمّ)

سلّة ترسل webhook عند الأحداث التالية:

| الحدث (Event) | لماذا نشترك فيه |
|---|---|
| `order.created` | conversion attribution + إرسال "تأكيد الطلب" |
| `order.payment.updated` | عند نجاح الدفع، نُسجّل `paid_at` |
| `order.status.updated` | عند الشحن/التسليم، نرسل تنبيه WA |
| `order.cancelled` | **عكس الـ attribution** + إرسال طلب استرداد |
| `order.refunded` | **عكس الـ attribution** جزئياً أو كلّياً |
| `customer.created` | نُنشئ Contact في Corbit |
| `customer.updated` | نُحدِّث الـ Contact |
| `customer.deleted` | **PDPL compliance** — حذف PII فوراً |
| `cart.abandoned` | trigger للـ cart recovery flow |
| `app.store.authorize` | لمّا متجر يثبّت Corbit (تأكيد الـ OAuth) |
| `app.store.uninstall` | لمّا متجر يحذف Corbit (نُعطّل التكامل) |

**الأمن**: كلّ webhook موقّع بـ HMAC SHA-256 — **يجب التحقّق قبل المعالجة**.

---

<a id="4"></a>
## ٤. قواعد البيانات الجديدة

### ٤.١ جدول `salla_integrations` (الأساسي)

| العمود | النوع | الوصف |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → organizations.id |
| `salla_store_id` | string(64) | معرّف المتجر على سلّة |
| `store_name` | string(255) | اسم المتجر |
| `store_url` | string(255) | رابط المتجر |
| `store_currency` | string(8) | SAR / AED / إلخ |
| `access_token` | text (**encrypted**) | OAuth access token |
| `refresh_token` | text (**encrypted**) | OAuth refresh token |
| `token_expires_at` | timestamp | متى ينتهي الـ access_token |
| `webhook_secret` | string (**encrypted**) | للتحقّق من webhooks |
| `scopes` | json | الصلاحيّات الممنوحة |
| `status` | enum | `active`, `disconnected`, `expired`, `error` |
| `last_synced_at` | timestamp nullable | آخر مزامنة |
| `error_message` | text nullable | إذا status=error |
| `connected_at` | timestamp | متى اتّصل المتجر أوّل مرّة |
| `disconnected_at` | timestamp nullable | متى انفصل |
| `created_at`, `updated_at` | timestamps | |

**Indexes**:
- `(org_id)` UNIQUE — متجر واحد لكل org (v1)
- `(salla_store_id)` UNIQUE — للبحث عند webhook
- `(status)`

> **ملاحظة multi-store**: الـ `(org_id, salla_store_id)` UNIQUE في v1.5 سيُغيَّر لدعم multiple stores per org. حالياً single-store.

---

### ٤.٢ جدول `salla_orders` — **مُعدَّل لـ multi-currency**

| العمود | النوع | الوصف |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → organizations.id |
| `salla_order_id` | string(64) | معرّف الطلب على سلّة |
| `salla_customer_id` | string(64) nullable | معرّف العميل على سلّة |
| `customer_phone` | string(32) | الجوال (مُطبَّع — `+9665xxxx`) |
| `customer_email` | string(255) nullable | |
| `customer_name` | string(255) nullable | |
| **`total_amount`** | **decimal(10,2)** | الإجمالي بالعملة الأصليّة |
| **`total_amount_sar`** | **decimal(10,2)** | محسوب بـ FX rate (موحّد للتقارير) |
| **`subtotal_amount`** | **decimal(10,2)** | قبل الضريبة بالعملة الأصليّة |
| **`subtotal_amount_sar`** | **decimal(10,2)** | محسوب |
| **`fx_rate_used`** | **decimal(10,6)** | سعر صرف وقت الطلب (1.0 لو SAR) |
| **`refunded_amount`** | **decimal(10,2) DEFAULT 0** | مبلغ مسترد بالعملة الأصليّة |
| **`refunded_at`** | **timestamp nullable** | متى رُدّ |
| `currency` | string(8) | SAR/AED |
| `status` | string(32) | pending/paid/shipped/delivered/cancelled |
| `payment_status` | string(32) | pending/paid/failed/refunded |
| `payment_method` | string(64) nullable | mada/visa/cod/إلخ |
| `items_count` | smallint | عدد المنتجات |
| `items` | json | snapshot للمنتجات |
| `tracking_number` | string(64) nullable | رقم الشحنة |
| `shipping_company` | string(64) nullable | aramex/smsa/إلخ |
| `placed_at` | timestamp | متى أُنشئ |
| `paid_at` | timestamp nullable | متى دُفع |
| `shipped_at` | timestamp nullable | متى شُحن |
| `delivered_at` | timestamp nullable | متى وصل |
| `cancelled_at` | timestamp nullable | متى أُلغي |
| `attributed_campaign_id` | uuid nullable | FK → campaigns.id |
| `attributed_campaign_send_id` | uuid nullable | FK → campaign_sends.id |
| `attribution_window_days` | tinyint | (7 افتراضياً) |
| `raw_payload` | json | للـ debugging |
| `created_at`, `updated_at` | timestamps | |

**Indexes**:
- `(org_id, customer_phone, placed_at)` — للـ attribution lookup
- `(org_id, status)` — للتقارير
- `(salla_order_id, org_id)` UNIQUE — منع التكرار
- `(org_id, salla_store_id, customer_phone, placed_at)` — جاهز لـ v1.5 multi-store

---

### ٤.٣ جدول `salla_customers`

| العمود | النوع | الوصف |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK |
| `salla_customer_id` | string(64) | |
| `contact_id` | uuid nullable | FK → contacts.id |
| `phone` | string(32) | |
| `email` | string(255) nullable | |
| `name` | string(255) | |
| `total_orders` | int | عدد الطلبات الكلّي |
| **`total_spent_amount`** | **decimal(12,2)** | بالعملة الأصليّة |
| **`total_spent_amount_sar`** | **decimal(12,2)** | موحّد |
| `last_order_at` | timestamp nullable | |
| `salla_synced_at` | timestamp | آخر sync |
| `created_at`, `updated_at` | timestamps | |

**Indexes**: `(org_id, phone)`, `(salla_customer_id, org_id)` UNIQUE

---

### ٤.٤ جدول `salla_webhook_events` (idempotency log)

| العمود | النوع | الوصف |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid nullable | FK (nullable لأنّ webhook قد يصل قبل ربط الـ org) |
| `salla_event_id` | string(64) | UUID من سلّة (للـ idempotency) |
| `event` | string(64) | نوع الحدث |
| `salla_store_id` | string(64) | للبحث عن الـ org |
| `payload` | json | الـ payload الكامل |
| `signature_valid` | boolean | هل التوقيع صحيح |
| `processed_at` | timestamp nullable | nullable حتى المعالجة |
| `processing_error` | text nullable | لو فشلت |
| `attempts` | tinyint | عدد محاولات المعالجة |
| **`waiting_for_dependency`** | **string(64) nullable** | (ID الحدث المُنتظَر — للـ race condition handling) |
| **`requeue_after`** | **timestamp nullable** | (متى نعيد المحاولة) |
| `created_at` | timestamp | متى استلمنا |

**Indexes**:
- `(salla_event_id)` UNIQUE — idempotency
- `(org_id, processed_at)` — لمراقبة المعالجة
- `(event)` — للبحث
- `(processed_at, requeue_after)` — للـ requeue scanner

**Retention**: 90 يوم (cron يحذف الأقدم)

---

### ٤.٥ جدول `salla_abandoned_carts` — **مُعدَّل لـ multi-currency**

| العمود | النوع | الوصف |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK |
| `salla_cart_id` | string(64) | |
| `customer_phone` | string(32) | |
| **`total_amount`** | **decimal(10,2)** | بالعملة الأصليّة |
| **`total_amount_sar`** | **decimal(10,2)** | موحّد |
| **`fx_rate_used`** | **decimal(10,6)** | |
| `currency` | string(8) | |
| `items_count` | smallint | |
| `items` | json | |
| `cart_url` | string(500) | رابط استكمال الشراء |
| `abandoned_at` | timestamp | |
| `reminder_sent_at` | timestamp nullable | |
| `reminder_campaign_send_id` | uuid nullable | FK → campaign_sends |
| `reminder_skip_reason` | string(64) nullable | لو ما اتبعت (no_opt_in / outside_window / إلخ) |
| `recovered_at` | timestamp nullable | (لو تحوّل لطلب) |
| `recovered_order_id` | uuid nullable | FK → salla_orders |
| `created_at`, `updated_at` | timestamps | |

---

### ٤.٦ جدول `salla_integration_audit_log` — **جديد لـ PDPL**

| العمود | النوع | الوصف |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK |
| `integration_id` | uuid | FK → salla_integrations |
| `action` | string(64) | `connected`, `disconnected`, `settings_changed`, `manual_sync`, `token_refreshed`, `customer_data_purged` |
| `performed_by_user_id` | uuid nullable | (nullable للأحداث التلقائيّة) |
| `performed_at` | timestamp | |
| `ip_address` | string(45) nullable | IPv4/IPv6 |
| `user_agent` | string(500) nullable | |
| `details` | json | meta للحدث |

**Indexes**: `(org_id, performed_at)`, `(action)`

---

### ٤.٧ تعديلات على جداول قائمة

#### `contacts`
- `salla_customer_id` string(64) nullable INDEX
- **`whatsapp_marketing_opt_in`** boolean DEFAULT false
- **`whatsapp_marketing_opt_in_at`** timestamp nullable
- **`whatsapp_marketing_opt_in_source`** enum(`manual`, `web_form`, `api`, `imported`, `salla_checkout`) nullable

#### `org_settings`
- `salla_order_notifications_enabled` boolean default false
- `salla_cart_recovery_enabled` boolean default false
- `salla_cart_recovery_delay_minutes` int default 30
- `salla_order_confirmed_template_id` uuid nullable
- `salla_order_shipped_template_id` uuid nullable
- `salla_order_delivered_template_id` uuid nullable
- `salla_cart_recovery_template_id` uuid nullable

#### `campaigns`
- **`unique_buyers_count`** int DEFAULT 0
- **`total_refunded_sar`** decimal(10,2) DEFAULT 0
- **`total_orders_count`** int DEFAULT 0 (عدد الطلبات المنسوبة، ممكن تتجاوز unique_buyers لأن نفس العميل يشتري مرّتين)

#### `campaign_sends` (الموجود — تعديل بسيط)
- `attribution_source` enum(`salla`, `manual`, `other`) nullable
- (`converted_at`, `conversion_value_sar` ✅ موجود)

---

<a id="5"></a>
## ٥. الـ Models

### ٥.١ `App\Models\SallaIntegration`
- Casts: tokens encrypted، scopes array، dates datetime
- Helpers: `isActive()`, `isExpired()`, `needsRefresh($buffer = 30)`, `markDisconnected($reason)`, `recordSync()`
- Relations: belongsTo Organization، hasMany SallaOrder، hasMany SallaWebhookEvent، hasMany SallaIntegrationAuditLog

### ٥.٢ `App\Models\SallaOrder`
- Casts: amount decimals, items/raw_payload json, dates datetime
- Helpers: `isPaid()`, `isAttributed()`, `isFullyRefunded()`, `netAmount()`, `normalizedPhone()`
- Relations: belongsTo Organization، belongsTo Campaign، belongsTo CampaignSend، belongsTo SallaIntegration

### ٥.٣ `App\Models\SallaCustomer`
- Relations: belongsTo Organization، belongsTo Contact، hasMany SallaOrder

### ٥.٤ `App\Models\SallaWebhookEvent`
- Helpers: `markProcessed()`, `markFailed($error)`, `requeueAfter(Carbon $when, ?string $waitingFor = null)`, `canRetry($max = 5)`
- Relations: belongsTo Organization

### ٥.٥ `App\Models\SallaAbandonedCart`
- Helpers: `isRecovered()`, `shouldSendReminder($delayMinutes)`, `skipWithReason($reason)`
- Relations: belongsTo Organization، belongsTo SallaOrder، belongsTo CampaignSend

### ٥.٦ `App\Models\SallaIntegrationAuditLog` — **جديد**
- Helpers: `static log(string $action, $integration, ?User $user, array $details)` — factory method
- Relations: belongsTo Organization، belongsTo SallaIntegration، belongsTo User (nullable)

---

<a id="6"></a>
## ٦. الـ Services (Business Logic)

### ٦.١ `App\Services\Salla\SallaOAuthService`
```
Methods:
- buildAuthorizationUrl(string $orgId): string
- exchangeCodeForToken(string $code, string $state): SallaIntegration
- refreshToken(SallaIntegration $integration): void
- revoke(SallaIntegration $integration, ?string $reason): void
```
- يُسجّل في `salla_integration_audit_log` لكل عمليّة

### ٦.٢ `App\Services\Salla\SallaApiClient`
HTTP wrapper مع:
- `ensureFreshToken()` — refresh لو needsRefresh
- `handleRateLimit()` — exponential backoff
- `handleErrors()` — throw specific exceptions
- Resource methods: getStoreInfo، listCustomers (paginated)، getCustomer، listOrders (paginated, filterable)، getOrder، listAbandonedCarts، getStoreCurrencyFx (للـ FX rates)

### ٦.٣ `App\Services\Salla\SallaWebhookProcessor` — **مُعدَّل لـ race conditions**
```
Methods:
- handle(array $payload, string $signature, string $sallaStoreId): void
    1. تحقّق HMAC SHA-256
    2. UNIQUE check على salla_event_id
    3. dispatch ProcessSallaWebhookJob

Per-event handlers:
- handleOrderCreated(...)
- handleOrderPaymentUpdated(...) ← مع dependency check
- handleOrderStatusUpdated(...) ← مع dependency check
- handleOrderCancelled(...) ← يستدعي ConversionAttributionService::reverseAttribution
- handleOrderRefunded(...) ← partial/full refund handling
- handleCustomerCreated(...)
- handleCustomerDeleted(...) ← PDPL — يستدعي PurgeSallaCustomerDataJob
- handleCartAbandoned(...) ← مع opt-in check
- handleAppUninstall(...)

Race condition strategy:
- لو event على order مجهول:
  Strategy A (default): re-queue الـ event بـ delay (5s, 15s, 30s — max 3 attempts)
  Strategy B (fallback): استدعِ GET /orders/{id} مباشرة لو الـ retries استُهلكت
- يحفظ event.waiting_for_dependency لتتبّع الانتظار
```

### ٦.٤ `App\Services\Salla\SallaCustomerSyncService`
- `syncAll($integration)` — paginated
- `syncOne($integration, $sallaCustomerId)`
- `linkToContact($sc)` — يبحث عن Contact بنفس الجوال أو ينشئ
- `purgeCustomerData($sallaCustomerId)` — لـ PDPL right-to-be-forgotten

### ٦.٥ `App\Services\Salla\SallaOrderSyncService`
- `backfillRecent($integration, $days = 90)` — initial pull
- `syncOrder($integration, $orderPayload)` — upsert + يستدعي ConversionAttributionService

> **مهمّ — Backfill behavior**:
> الـ orders المسحوبة في الـ initial backfill (90 يوم سابقة) **لا تُنسَب** لحملات سابقة. `attributed_campaign_id = NULL` لكلّ ما هو قبل `salla_integrations.connected_at`. الـ UI يعرض banner: **"Conversion tracking يبدأ من تاريخ الربط"**.

### ٦.٦ `App\Services\Salla\ConversionAttributionService` — **مُعدَّل لكلّ edge cases**

```
Methods:

attributeOrder(SallaOrder $order): ?CampaignSend
    1. ابحث عن campaign_sends:
       - بنفس الجوال (normalized)
       - status = 'sent'
       - sent_at <= placed_at
       - sent_at >= placed_at - 7 days
    2. اختر آخر send (last-touch)
    3. إذا وُجد:
       a. campaign_sends.converted_at = order.placed_at
       b. campaign_sends.conversion_value_sar = order.total_amount_sar
       c. campaign_sends.attribution_source = 'salla'
       d. salla_orders.attributed_campaign_id = campaign.id
       e. salla_orders.attributed_campaign_send_id = send.id
       f. campaigns.total_revenue_sar += order.total_amount_sar
       g. campaigns.total_orders_count += 1
       h. campaigns.unique_buyers_count += 1 (لو هذا أول طلب من العميل لهذي الحملة)
    4. ارجع الـ CampaignSend أو null

reverseAttribution(SallaOrder $order, ?float $partialAmount = null): void
    لو partial = null → reverse كامل (الإلغاء)
    لو partial = 100.0 → خصم 100 SAR من إيرادات الحملة
    1. campaigns.total_revenue_sar -= reverse_amount
    2. campaigns.total_refunded_sar += reverse_amount
    3. لو full reverse:
       - campaign_sends.converted_at = null
       - campaign_sends.conversion_value_sar = 0
       - salla_orders.attributed_campaign_id = null
       - campaigns.total_orders_count -= 1
       - re-evaluate unique_buyers_count

recalculateForCampaign($campaignId): void
    re-run attribution لكلّ sends في campaign (للـ admin tooling)

normalizePhone(string $raw): string
    تطبيع موحّد: 05xxx → +9665xxx، 9665xxx → +9665xxx، 00966xxx → +9665xxx
    يُختبَر بـ unit tests على 8+ scenarios
```

### ٦.٧ `App\Services\Salla\SallaTemplateScaffolder`
- `scaffoldOrderTemplates(string $orgId): array`
- ينشئ 4 قوالب مسوّدة + يرفعها لـ Meta عبر WhatsAppService::submitTemplate

### ٦.٨ `App\Services\Salla\WhatsAppMarketingConsentService` — **جديد**
```
Methods:
- canSendMarketing(Contact $contact): bool
- requestOptIn(Contact $contact, string $source): void
- recordOptIn(Contact $contact, string $source): void
- recordOptOut(Contact $contact): void
```
يُستدعى من `SendCartAbandonmentReminderJob` قبل أيّ إرسال.

---

<a id="7"></a>
## ٧. الـ Controllers + Routes

### ٧.١ `App\Http\Controllers\Api\SallaController` (لـ tenants)

| Method | Route | الوصف |
|---|---|---|
| `status` | `GET /api/integrations/salla` | حالة التكامل |
| `startConnect` | `POST /api/integrations/salla/connect` | يبدأ OAuth |
| `disconnect` | `POST /api/integrations/salla/disconnect` | يلغي الربط |
| `triggerSync` | `POST /api/integrations/salla/sync` | sync يدوي |
| `getOrders` | `GET /api/integrations/salla/orders` | قائمة طلبات (paginated) |
| `getConversions` | `GET /api/integrations/salla/conversions` | تقرير الـ conversions |
| `updateSettings` | `PUT /api/integrations/salla/settings` | toggle notifications + cart recovery |
| `scaffoldTemplates` | `POST /api/integrations/salla/scaffold-templates` | إنشاء قوالب |
| `getAuditLog` | `GET /api/integrations/salla/audit-log` | **PDPL — سجل التدقيق للتكامل** |
| `requestDataPurge` | `POST /api/integrations/salla/customers/{id}/purge` | **PDPL — حذف بيانات عميل** |

### ٧.٢ `App\Http\Controllers\Api\SallaOAuthController` (public)
| Method | Route | الوصف |
|---|---|---|
| `callback` | `GET /api/integrations/salla/oauth/callback` | OAuth redirect target |

### ٧.٣ `App\Http\Controllers\Api\SallaWebhookController` (public, signature-verified)
| Method | Route | الوصف |
|---|---|---|
| `handle` | `POST /api/webhooks/salla` | يستقبل أحداث سلّة |

### ٧.٤ Admin endpoints (Nova/Internal)
| Method | Route | الوصف |
|---|---|---|
| `listIntegrations` | `GET /api/admin/integrations/salla` | قائمة كل integrations عبر tenants |
| `getFailedWebhooks` | `GET /api/admin/integrations/salla/failed-webhooks` | للـ retry |
| `replayWebhook` | `POST /api/admin/integrations/salla/webhooks/{id}/replay` | manual replay |

---

<a id="8"></a>
## ٨. الـ Background Jobs (Queue — Redis/Horizon)

| Job | Trigger | المسؤوليّة |
|---|---|---|
| `RefreshSallaTokenJob` | cron كل ساعة | يجدّد tokens القاربة على الانتهاء (< 30min) |
| `SyncSallaCustomersJob` | عند الـ connect أو manual | paginated pull |
| `SyncSallaOrdersInitialJob` | عند الـ connect (مرّة واحدة) | pull آخر 90 يوم — **بدون attribution** |
| `ProcessSallaWebhookJob` | عند استلام webhook | يعالج الحدث، throttled، **مع race condition handling** |
| `RequeueWebhookEventsJob` | كل دقيقة | يفحص events بـ requeue_after <= now() ويعيد dispatch |
| `AttributeOrderToCampaignJob` | بعد order webhook | ConversionAttributionService::attributeOrder |
| `ReverseAttributionJob` | بعد cancel/refund | ConversionAttributionService::reverseAttribution |
| `SendOrderStatusNotificationJob` | بعد order status update | يرسل قالب WA — **لا يحتاج marketing opt-in** (utility) |
| `SendCartAbandonmentReminderJob` | بعد 30 دقيقة من cart_abandoned | **يفحص opt-in قبل الإرسال** — لو لا opt-in: skip + log |
| `PurgeSallaCustomerDataJob` | عند customer.deleted webhook | **PDPL** — حذف PII من salla_customers + abandoned_carts، anonymize في salla_orders |
| `CleanupSallaWebhookEventsJob` | cron يومي | يحذف events > 90 يوم |
| `CleanupSallaAuditLogJob` | cron يومي | يحذف audit logs > 2 سنة |

---

<a id="9"></a>
## ٩. الصفحات الأماميّة (Frontend — Next.js)

### ٩.١ `/integrations` — تحديث (موجودة)
نضيف "كرت سلّة": شعار، حالة، زرّ "إعداد".

### ٩.٢ `/integrations/salla` — جديدة

#### إذا غير مربوط
```
[شعار سلّة]
ربط متجرك على سلّة
- [✓] Conversion tracking (ROI الحقيقي)
- [✓] إشعارات الطلبات تلقائياً
- [✓] استرداد السلّات المتروكة
- [✓] مزامنة العملاء

[ زرّ: ربط متجر سلّة الآن ]
   → Full redirect أو popup OAuth
```

#### إذا مربوط — 4 تبويبات
```
✅ متجرك "اسم المتجر" مربوط
   - URL، العملة، تاريخ الاتّصال، آخر مزامنة
   - [زرّ: مزامنة الآن]

[Tabs]
1. نظرة عامّة
2. إعدادات الإشعارات
3. تقارير Conversion
4. سجل الأحداث (مع failed webhooks + retry)
5. سجل التدقيق (PDPL audit log)

[ زرّ: فصل التكامل ] (مع تأكيد)
```

#### Tab "إعدادات الإشعارات"
```
□ تفعيل إشعارات الطلبات
   - قالب "تأكيد الطلب": [Dropdown / إنشاء قالب جاهز]
   - قالب "تمّ الشحن"
   - قالب "تمّ التسليم"

□ تفعيل استرداد السلال المتروكة
   ⚠️ ملاحظة: cart recovery هو رسالة marketing.
      تُرسَل **فقط** للعملاء اللي وافقوا على marketing عبر:
      - تسجيل في صفحتك على Salla مع checkbox
      - opt-in عبر WhatsApp keyword
   - الإرسال بعد كم دقيقة من الترك: [30]
   - قالب التذكير
```

#### Tab "تقارير Conversion"
```
[فلتر: الحملة | الفترة]

📊 ملخّص:
- إجمالي conversions
- إجمالي القيمة (SAR)
- ROI
- معدّل التحويل
- إجمالي مستردّ (refunded)

[Banner لو الـ integration حديث]
"Conversion tracking يبدأ من 5 مايو 2026 (تاريخ ربط المتجر).
الطلبات السابقة لهذا التاريخ غير منسوبة."

[جدول]
[Export CSV]
```

#### Tab "سجل الأحداث"
```
[جدول webhook events]
- التاريخ | الحدث | الحالة | الـ retries | [زرّ: retry لو فشل]

[فلاتر: نجح/فشل/معلّق، نوع الحدث]
```

### ٩.٣ تحديث `/campaigns/[id]`
Widget جديد:
```
💰 Conversions من سلّة
- 23 طلب منسوب لهذي الحملة (18 buyer فريد)
- 6,200 ريال إيرادات
- 200 ريال مسترد
- صافي: 6,000 ريال
- ROI: 410% (cost: 1,460)
[رابط: عرض الطلبات]
```

### ٩.٤ تحديث `/contacts/[id]`
Drawer:
```
🛒 طلبات سلّة
- آخر طلب، إجمالي طلبات، إجمالي إنفاق

✉️ Marketing Opt-in
- الحالة: ✅ موافق / ❌ غير موافق
- المصدر: salla_checkout
- التاريخ: قبل 12 يوم
[زرّ: طلب opt-in عبر رسالة]
```

---

<a id="10"></a>
## ١٠. الإعدادات والـ Environment

### Backend `.env`
```
SALLA_CLIENT_ID=
SALLA_CLIENT_SECRET=
SALLA_REDIRECT_URI=https://corbit-whatsapp-backend.corbit.sa/api/integrations/salla/oauth/callback
SALLA_API_BASE_URL=https://api.salla.dev/admin/v2
SALLA_OAUTH_BASE_URL=https://accounts.salla.sa/oauth2
SALLA_WEBHOOK_TIMEOUT=10
SALLA_TOKEN_REFRESH_BUFFER_MINUTES=30
SALLA_ATTRIBUTION_WINDOW_DAYS=7
SALLA_RACE_CONDITION_MAX_RETRIES=3
SALLA_RACE_CONDITION_DELAYS=5,15,30
```

### `config/services.php` salla block
(كما في v1.0 + الإضافات أعلاه)

---

<a id="11"></a>
## ١١. الـ Templates التي يحتاجها العميل

| Template | Variables | Category | Marketing Opt-in؟ |
|---|---|---|---|
| `salla_order_confirmed` | name، رقم، إجمالي، طريقة دفع | utility | ❌ لا |
| `salla_order_shipped` | رقم، شركة، رقم تتبّع | utility | ❌ لا |
| `salla_order_delivered` | رقم | utility | ❌ لا |
| `salla_cart_recovery` | عدد منتجات، إجمالي | **marketing** | ✅ **نعم** |

> **مهمّ — Meta 24h window**:
> الـ utility templates يمكن إرسالها خارج الـ 24h window (تأكيد طلب، شحن).
> الـ marketing template (cart_recovery) يحتاج موافقة + لا يُرسَل لمن قطع الـ session.

### Template designs (نفس v1.0 — راجع للتفاصيل)
- ar order_confirmed: مرحباً {{1}} 👋 ، تأكيد طلبك...
- ar order_shipped: طلبك في الطريق 🚚 ...
- ar order_delivered: وصل طلبك ✅ ...
- ar cart_recovery: لاحظنا أنّك تركت سلّة 🛒...

---

<a id="12"></a>
## ١٢. خطّة التنفيذ بالـ Phases (12 phase / 11 يوم)

### Phase 0 — Salla Sandbox Discovery (يوم 1 — 6 ساعات)
انظر القسم 0 أعلاه.
**Deliverable**: `docs/salla-api-reality.md` + 9 ملفّات fixtures

---

### Phase 1 — Foundation + Migrations (يوم 2 — 8 ساعات)
- [ ] 6 migrations:
  - `create_salla_integrations_table`
  - `create_salla_orders_table` (مع multi-currency)
  - `create_salla_customers_table`
  - `create_salla_webhook_events_table` (مع race condition fields)
  - `create_salla_abandoned_carts_table`
  - `create_salla_integration_audit_log_table`
- [ ] 3 migrations لتعديل جداول قائمة:
  - `add_salla_to_contacts` (salla_customer_id + opt-in fields)
  - `add_salla_to_org_settings` (7 columns)
  - `add_attribution_aggregates_to_campaigns` (unique_buyers، total_refunded، total_orders)
- [ ] 6 Models مع casts + relationships
- [ ] config/services.php salla block
- [ ] Update `.env.example`
- [ ] Run migrations on sqlite → ✅

**Deliverable**: schema جاهز محلّياً + tests القديمة لسّه تمرّ

---

### Phase 2 — OAuth Flow (يوم 3 — 6 ساعات)
- [ ] `SallaOAuthService` (start, callback, refresh, revoke)
- [ ] `SallaOAuthController` callback
- [ ] State parameter للـ CSRF (cache 10min)
- [ ] صفحة `/integrations/salla/oauth/error` للحالات الفاشلة
- [ ] Audit log entries لكلّ event
- [ ] Tests: state validation، token persistence

**Deliverable**: العميل يقدر يضغط "Connect" + يرجع متّصل + audit log entry موجود

---

### Phase 3 — API Client + Initial Sync (يوم 4 — 8 ساعات)
- [ ] `SallaApiClient` مع retry + rate limit + token refresh
- [ ] Resource methods الـ 7
- [ ] `SallaCustomerSyncService::syncAll`
- [ ] `SallaOrderSyncService::backfillRecent` (90 يوم، بدون attribution)
- [ ] Jobs: `SyncSallaCustomersJob`، `SyncSallaOrdersInitialJob`، `RefreshSallaTokenJob`
- [ ] `SallaController::triggerSync` للـ manual
- [ ] Tests: pagination، rate limit handling

**Deliverable**: ربط متجر يجلب 90 يوم طلبات + كلّ العملاء بدون attribution

---

### Phase 4 — Webhooks + Race Conditions (يوم 5 — 10 ساعات)
- [ ] `SallaWebhookController::handle` (signature verify)
- [ ] Route + middleware
- [ ] Idempotency table check
- [ ] `SallaWebhookProcessor` dispatcher
- [ ] `ProcessSallaWebhookJob` per-event مع race condition logic:
  - Out-of-order detection
  - `requeueAfter` strategy (5s/15s/30s)
  - Fallback fetch (`GET /orders/{id}`)
- [ ] `RequeueWebhookEventsJob` (cron كل دقيقة)
- [ ] Handlers لـ 11 events (order.*, customer.*, cart.*, app.*)
- [ ] Cleanup cron `CleanupSallaWebhookEventsJob`
- [ ] Tests: signature، idempotency، race conditions، out-of-order

**Deliverable**: webhooks تُستقبل، تُتحقّق، تُعالَج مع معالجة out-of-order

---

### Phase 5 — Conversion Attribution + Edge Cases (يوم 6 — 8 ساعات)
- [ ] `ConversionAttributionService::attributeOrder` (last-touch، 7-day window)
- [ ] `ConversionAttributionService::reverseAttribution` (cancel + partial/full refund)
- [ ] `ConversionAttributionService::recalculateForCampaign` (admin tooling)
- [ ] `normalizePhone` مع 8+ test cases
- [ ] `AttributeOrderToCampaignJob`، `ReverseAttributionJob`
- [ ] Update `campaigns.total_revenue_sar`، `unique_buyers_count`، `total_orders_count`، `total_refunded_sar`
- [ ] Endpoint `GET /api/integrations/salla/conversions`
- [ ] PHPUnit tests (8 cases):
  1. Phone match within 7 days → attributed
  2. Phone match outside 7 days → not attributed
  3. Order before campaign send → not attributed
  4. Cancellation → attribution reversed
  5. Partial refund → revenue reduced proportionally
  6. Full refund → attribution removed
  7. Multi-order same buyer → unique_buyers correct
  8. Phone normalization (05xxx, 9665xxx, +9665xxx)

**Deliverable**: أوّل طلب من webhook ينعكس في تقرير الحملة + cancellations تعكس attribution

---

### Phase 6 — Frontend (يوم 7 + يوم 8 — 14 ساعة)

**يوم 7 (8 ساعات)**:
- [ ] `/integrations/salla` page (3 حالات)
- [ ] OAuth start (full redirect)
- [ ] Status + sync widget
- [ ] Tab "نظرة عامّة"
- [ ] Tab "إعدادات الإشعارات" (مع opt-in warning)

**يوم 8 (6 ساعات)**:
- [ ] Tab "تقارير Conversion" (مع backfill banner)
- [ ] Tab "سجل الأحداث" (مع manual retry)
- [ ] Tab "سجل التدقيق" (PDPL)
- [ ] Disconnect (with confirm)
- [ ] تحديث `/campaigns/[id]` (Conversions widget مع refunds)
- [ ] تحديث `/contacts/[id]` drawer (Salla orders + opt-in status)

**Deliverable**: تجربة كاملة من Connect إلى رؤية ROI

---

### Phase 7 — Notifications + Cart Recovery + WA Compliance (يوم 9 — 8 ساعات)
- [ ] `SallaTemplateScaffolder::scaffoldOrderTemplates`
- [ ] زرّ "Scaffold templates" في settings
- [ ] `SendOrderStatusNotificationJob` (utility templates، لا opt-in needed)
- [ ] `WhatsAppMarketingConsentService` (opt-in checking)
- [ ] `SendCartAbandonmentReminderJob` مع opt-in check قبل الإرسال
- [ ] UI: opt-in management في `/contacts/[id]`
- [ ] Tests: opt-in enforcement، utility vs marketing distinction

**Deliverable**: تنبيهات تلقائيّة + cart recovery يحترم opt-in

---

### Phase 8 — PDPL Compliance Hardening (يوم 10 — 6 ساعات)
- [ ] Data residency documentation في `/dpa` (السيرفر فعلياً وين)
- [ ] `customer.deleted` webhook handler → `PurgeSallaCustomerDataJob`
- [ ] `PurgeSallaCustomerDataJob`:
  - Delete من `salla_customers`
  - Delete من `salla_abandoned_carts`
  - Anonymize في `salla_orders` (احتفظ بالمحاسبة بدون PII)
  - Delete contact link
- [ ] Audit log لكلّ purge operation
- [ ] UI: Tab "سجل التدقيق" في `/integrations/salla`
- [ ] Update `/privacy` لإضافة Salla كـ sub-processor (راجع القسم 14)
- [ ] Update `/dpa` للنفس
- [ ] SDAIA registration check مضاف لـ `LAWYER_REVIEW_CHECKLIST.md`

**Deliverable**: PDPL compliance كامل + audit trail جاهز

---

### Phase 9 — Operational Readiness + Stress Tests (يوم 11 صباحاً — 5 ساعات)
- [ ] Sentry integration للـ webhook failures (alerts على > 5% failure rate)
- [ ] SLO definitions في monitoring:
  - Webhook processing p95 < 5s
  - OAuth callback p95 < 2s
  - Attribution latency p95 < 10s
- [ ] Admin dashboard في `/admin/integrations/salla`:
  - Active integrations count
  - Webhook events/hour
  - Failed webhooks (manual retry)
  - Token expiry alerts
- [ ] Runbook في `corbit-backend/docs/runbooks/salla.md`:
  - Salla API outage procedure
  - Rollback procedure
  - Salla developer support contacts
- [ ] **Stress tests** (k6 scripts في `corbit-backend/tests/stress/salla/`):
  - 1000 webhook/min for 5 min
  - 50 concurrent OAuth flows
  - 100 concurrent token refresh
  - 500 order webhook/min for 10 min

**Deliverable**: monitoring + alerts + runbook + stress tested

---

### Phase 10 — Beta + Documentation (يوم 11 مساءً + يوم 12 — 8 ساعات)
- [ ] Help Center article: "كيف تربط متجرك على سلّة"
- [ ] Help Center article: "ما هو conversion tracking؟"
- [ ] Help Center article: "كيف تفعّل cart recovery بشكل قانوني؟"
- [ ] Video tutorial (~5 min) — اختياري
- [ ] **Beta testing** على حساب **Corbit نفسه أوّلاً** (ليس Yasref — Yasref عميل دافع production لا يُجرَّب عليه). بعد استقرار Corbit لأسبوعَين، نفتح لباقي العملاء.
- [ ] جمع feedback + إصلاحات
- [ ] Update LAWYER_REVIEW_CHECKLIST.md مع Salla questions
- [ ] PR review check + merge to main

**Deliverable**: ready for production launch

---

### إجمالي وقت التنفيذ: **88 ساعة (11 يوم عمل)**
**النطاق المحتمل**: 10-12 يوم (depending on Salla API surprises in Phase 0)

---

<a id="13"></a>
## ١٣. المخاطر والمعالجات (مُحدَّثة)

| المخاطرة | الاحتمال | الأثر | المعالجة |
|---|---|---|---|
| **Multi-currency calculation errors** | متوسّط | متوسّط | `total_amount` + `total_amount_sar` + `fx_rate_used` snapshot وقت الطلب |
| **Race condition (event arrives out of order)** | عالي | عالي | re-queue strategy (5s/15s/30s) + fallback `GET /orders/{id}` |
| **Marketing send بدون opt-in (مخالفة Meta)** | عالي بدون الحماية | كارثي | `WhatsAppMarketingConsentService` يفحص قبل أيّ marketing send |
| **Salla rate limit (120/min)** | عالي | متوسّط | exponential backoff + queue throttling + cache store info لـ 1 ساعة |
| **Token expired أثناء عمليّة طويلة** | متوسّط | متوسّط | cron يجدّد قبل 30 دقيقة + retry logic |
| **Webhook دفعة مرّتين (network glitch)** | عالي | متوسّط | UNIQUE على salla_event_id + processed_at check |
| **تنسيقات الجوال متعدّدة** | عالي | عالي | `normalizePhone()` موحّد + tests لـ 8+ scenarios |
| **PDPL right-to-be-forgotten ignored** | منخفض | كارثي قانونياً | `customer.deleted` webhook → automatic purge + audit log |
| **Multiple campaign attribution** | متوسّط | متوسّط | last-touch attribution، 7-day window صراحة |
| **تأخّر اعتماد Salla App** | عالي | متوسّط | private API key fallback متاح |
| **Salla API breaking change** | منخفض | عالي | pin to v2 صراحةً + monitor changelog |
| **عميل يفصل من Salla side → tokens dead** | عالي | منخفض | webhook `app.store.uninstall` يُحدّث status فوراً |
| **Stress test failure (Black Friday)** | متوسّط | عالي | Phase 9 stress tests + horizontal scaling plan |
| **Refund attribution not reversed** | متوسّط | عالي | `order.refunded` handler + `ReverseAttributionJob` |

---

<a id="14"></a>
## ١٤. التحديثات القانونيّة المطلوبة (PDPL)

### Privacy Policy
أضف في `/privacy` § 5:
> **Salla Trading Co. (متجر العميل على سلّة)** — نقرأ بيانات العملاء والطلبات لتنفيذ التكامل، حصراً للـ tenants الذين يُفعّلون التكامل. الموقع: المملكة العربيّة السعوديّة. سياسة سلّة: https://salla.sa/privacy

### DPA
أضف نفس الإضافة في DPA § 1.

### Terms of Service
بند جديد في § 4:
> 4.x — عند تفعيل تكامل سلّة، المشترك يقرّ بأنّ بيانات العملاء المنقولة من سلّة إلى Corbit مشمولة بسياسة خصوصيّة Corbit وشروطها، وأنّه (المشترك) المتحكّم بهذي البيانات.

### LAWYER_REVIEW_CHECKLIST.md — أسئلة جديدة
1. هل التكامل مع سلّة كـ sub-processor إضافي يحتاج إخطار العملاء الحاليّين قبل تفعيله؟
2. هل Corbit مُلزَم بتسجيل في SDAIA كـ Data Controller أو Processor عند معالجة بيانات Salla؟
3. WhatsApp marketing opt-in via Salla checkbox — هل يحقّق متطلّبات Meta + PDPL؟
4. آليّة Right to be Forgotten عبر `customer.deleted` webhook — هل التطبيق يحقّق متطلّبات PDPL Article 21؟
5. Audit log retention period (سنتان مقترحة) — هل ملائم؟

---

<a id="15"></a>
## ١٥. Operational Readiness — Monitoring + SLOs

### SLOs المُعتمَدة
| المقياس | الهدف | كيف يُقاس |
|---|---|---|
| Webhook success rate | > 99% | Sentry success/failure ratio |
| Webhook processing p95 | < 5s | Job duration metric |
| OAuth callback success | > 99.5% | Sentry transaction |
| Attribution latency p95 | < 10s | Time from order webhook to attribution stamped |
| Token refresh success | > 99.9% | Cron job logs |

### Alerts (Slack/Email)
- ❗ Webhook success rate < 95% خلال ساعة
- ❗ Token refresh failures > 3 in 5 min
- ❗ Attribution rate drop > 30% from 7-day baseline
- ❗ Stress test thresholds breached
- ⚠️ Active integrations count drops sharply (mass disconnects)

### Admin Dashboard `/admin/integrations/salla`
- Active integrations count + status breakdown
- Webhook events/hour (rolling chart)
- Failed webhooks list (with manual retry button)
- Token expiry warnings (integrations needing refresh)
- Conversion attribution rate per tenant
- Top earners (revenue from Salla integration)

### Runbook (`corbit-backend/docs/runbooks/salla.md`)
محتوى الـ runbook:
1. **Salla API outage** — كيف نوقف retries مؤقّتاً، إخطار tenants
2. **Mass token expiry** — bulk refresh procedure
3. **Webhook flood** — Horizon throttling adjustment
4. **PDPL data request** — manual purge procedure
5. **Salla developer support** — contacts، escalation path
6. **Rollback** — disable integration via feature flag

---

<a id="16"></a>
## ١٦. مرحلة ما بعد التنفيذ — Salla App Marketplace

بعد ما يستقرّ التكامل (شهر تشغيل + 5 عملاء على الأقل):

1. **حساب Salla Partner** على https://salla.partners
2. تقديم App بـ:
   - شعار + screenshots + وصف عربي/إنجليزي
   - Privacy URL + Support URL
   - Pricing model (يُحدَّد بقرار تجاري منفصل)
3. مراجعة Salla (~2 أسبوع)
4. الإطلاق على Salla App Store

**التقدير**: تجهيز التطبيق + التقديم = **يومين**. الانتظار = **2-3 أسابيع**.

---

<a id="17"></a>
## ١٧. v2 Roadmap (مُؤجَّل بقرار)

| البند | الأولويّة | التقدير |
|---|---|---|
| **Coupon Distribution** (Use Case #5 الأصلي) | متوسّطة | 6 ساعات |
| **AI Order Lookup** ("وين طلبي؟" via WhatsApp) | عالية | يومين |
| **Product Sharing** (الوكيل يشارك منتج عبر WA) | متوسّطة | يوم |
| **Multi-store support per org** | متوسّطة | 3 أيّام |
| **Two-way sync** (Corbit segments → Salla tags) | منخفضة | 3 أيّام |
| **Multi-touch attribution model** (vs current last-touch) | منخفضة | 4 أيّام |
| **Webhook retry UI** (manual replay مع conditions) | متوسّطة | يوم |
| **Advanced segmentation** (purchase behavior) | متوسّطة | 3 أيّام |
| **Salla App Store listing** | عالية | يومين |

---

## 🎯 الخلاصة — ايش يلزم منك قبل البدء

### ما يلزم قبل Phase 0
- [ ] التسجيل على https://salla.partners كـ partner (5 دقائق)
- [ ] إنشاء Salla **Sandbox App** للتطوير (5 دقائق)
- [ ] الحصول على credentials (sandbox):
  - `SALLA_CLIENT_ID`
  - `SALLA_CLIENT_SECRET`
- [ ] إعداد Webhook URL في Salla Sandbox App: `https://corbit-whatsapp-backend.corbit.sa/api/webhooks/salla`
- [ ] إعداد Redirect URI: `https://corbit-whatsapp-backend.corbit.sa/api/integrations/salla/oauth/callback`
- [ ] اختيار الـ scopes (نوصي): `customers.read`, `orders.read`, `webhooks.read_write`, `app.store.uninstall.read`

### بعد جاهزيّة الـ credentials
أرسل لي:
1. `CLIENT_ID` (sandbox)
2. `CLIENT_SECRET` (sandbox)
3. الـ scopes المعتمدة

وأبدأ Phase 0 مباشرة.

---

## 📌 أسئلة تحتاج قرار منك

1. **التقدير الجديد 11 يوم بدلاً من 5** — موافق؟ (السابق كان متفائل، الجديد محسوب)
2. **Coupon Distribution مؤجَّل لـ v2** — موافق؟
3. **Multi-store: v1 = single-store، v1.5 = multi** — موافق؟ (لو عندك عميل يحتاج multi-store من البداية، التقدير يصير 13-14 يوم)
4. **Data Residency**: حالياً Forge على المنطقة الافتراضيّة. هل ترغب نقل DB لـ STC Cloud / Mobily Cloud / AWS Bahrain لتعزيز PDPL؟ (يحتاج migration منفصل ~يومين)
5. **Beta testing**: عندك 2-3 عملاء جاهزين للـ beta قبل الـ App Store listing؟ — **ملاحظة**: التجارب الأوّليّة على حساب Corbit نفسه، ليس Yasref. Yasref عميل دافع production.
6. **Pricing model للـ Salla integration**: قرار تجاري — مجّاني للجميع، add-on Pro+، أم module منفصل؟ (سؤال للـ business team، لا يؤثّر على التنفيذ التقني)

---

**— خطّة Corbit × Salla Integration v2.0 (نهائيّة، قابلة للتنفيذ)**
**التقدير**: 11 يوم عمل (88 ساعة) بعد توفّر sandbox credentials
**التواريخ المقترحة**: تبدأ بعد إكمال legal review (الأسبوع القادم)
**الحالة**: ⏸️ ينتظر credentials للبدء
