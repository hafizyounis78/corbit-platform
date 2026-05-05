# دليل الفحص الشامل (Smoke Testing Guide) — Corbit Platform

**آخر تحديث:** 2026-05-05
**المدّة المتوقّعة:** 90-120 دقيقة لفحص كامل
**الجمهور:** فريق QA، مطوّرون، ومدير المنتج

> هذا المستند هو المرجع المعتمد لفحص كل ميزة في Corbit. كل صفحة موثّقة هنا بـ:
> - URL والوصول
> - الميزات الموجودة
> - خطوات الفحص (steps)
> - النتيجة المتوقّعة (expected result)
> - الـ endpoints المرتبطة

---

## 📑 جدول المحتويات

| # | القسم | الصفحات |
|---|---|---|
| 0 | [قبل البدء](#0-pre-flight) | Pre-flight checks |
| 1 | [الصفحات العامّة](#1-public-pages) | `/`, `/login`, `/register`, `/privacy`, `/terms` |
| 2 | [تسجيل الدخول والمصادقة](#2-auth-flow) | `/login`, `/auth/otp`, `/auth/change-password` |
| 3 | [Dashboard](#3-dashboard) | `/dashboard` |
| 4 | [الـ Inbox والمحادثات](#4-inbox) | `/inbox` |
| 5 | [الحملات](#5-campaigns) | `/campaigns` |
| 6 | [القوالب](#6-templates) | `/templates` |
| 7 | [جهات الاتصال والشرائح](#7-contacts) | `/contacts` |
| 8 | [البوتات](#8-bots) | `/bot-builder` |
| 9 | [مركز الذكاء الاصطناعي](#9-ai-center) | `/ai-center` |
| 10 | [الفوترة والاشتراكات](#10-billing) | `/billing` |
| 11 | [الإعدادات](#11-settings) | `/settings` (9 تابات) |
| 12 | [الفريق](#12-teams) | `/teams` |
| 13 | [التحليلات](#13-analytics) | `/analytics` |
| 14 | [التكاملات](#14-integrations) | `/integrations` |
| 15 | [الدعم الفنّي](#15-support) | `/support` |
| 16 | [Super Admin](#16-super-admin) | `/super-admin/*` |
| 17 | [Nova Admin](#17-nova-admin) | `corbit.sa/admin` |
| 18 | [Background Jobs](#18-background-jobs) | crons + scheduler |
| 19 | [Bug Reporting Template](#19-bug-template) | كيفيّة توثيق المشاكل |

---

<a id="0-pre-flight"></a>
## 0️⃣ Pre-flight Checks (قبل البدء)

**تنفّذها مرّة واحدة قبل أيّ test session.**

### 0.1 على Forge SSH (Backend)

```bash
# 1. تأكّد كل الـ migrations طبّقت
php artisan migrate:status | tail -15

# 2. تأكّد لا في pending
# لو ظهر "Pending" → نفّذ:
php artisan migrate --force

# 3. تأكّد scheduler يعمل (للـ DLR poller + plan expiry + إلخ)
php artisan schedule:list

# 4. تأكّد Horizon يعمل (لـ campaign queue)
php artisan horizon:list

# 5. ابحث عن أيّ critical error في الـ logs
tail -100 storage/logs/laravel.log | grep -iE "error|critical|exception" | head -20
```

**النتيجة المتوقّعة:**
- ✅ كل الـ migrations: `Ran` (آخرها: `2026_05_05_120000_add_whatsapp_channel_to_notifications`)
- ✅ Schedule list يحوي: `sms:poll-status`, `corbit:expire-plans`, `corbit:notify-low-balance`, `corbit:sync-templates`, `kb:process-pending`, `corbit:notify-sla-warning`, `corbit:recompute-contact-scores`
- ✅ لا critical errors في logs

### 0.2 Browser Console

افتح DevTools على كل تبويب صفحة، تحقّق من:
- لا 500 errors في Network tab.
- لا React errors في Console (errors بأرقام مثل #31, #185).
- لا CORS errors.

---

<a id="1-public-pages"></a>
## 1️⃣ الصفحات العامّة

### 1.1 الصفحة الرئيسيّة `/`

| الميزة | خطوات الفحص | المتوقّع |
|---|---|---|
| Hero section | افتح `corbit.sa` بدون login | شعار + شرح + زرّ "ابدأ الآن" |
| CTA "ابدأ الآن" | اضغط الزرّ | يحوّل لـ `/register` |
| Footer roman | تحقّق روابط | Privacy + Terms + WhatsApp تواصل |

### 1.2 صفحة الخصوصيّة `/privacy`

| الميزة | المتوقّع |
|---|---|
| النصّ كامل بالعربيّة | يظهر بدون أخطاء UTF-8 |
| تواريخ التحديث | "آخر تحديث: 2026-04-30" أو أحدث |

### 1.3 صفحة الشروط `/terms`

| الميزة | المتوقّع |
|---|---|
| النصّ كامل | يظهر صحيح |
| Terms acceptance | مذكور في عمليّة التسجيل |

---

<a id="2-auth-flow"></a>
## 2️⃣ تسجيل الدخول والمصادقة

### 2.1 صفحة `/login`

**الميزات:**
- إيميل + باسورد + Remember Me
- زرّ "نسيت كلمة المرور؟"
- زرّ "أنشئ حسابك الآن"

**خطوات الفحص:**

| # | الخطوة | المتوقّع |
|---|---|---|
| 2.1.1 | إيميل + باسورد صحيحَين | يدخل لـ `/dashboard` |
| 2.1.2 | إيميل غير موجود | "بيانات الدخول غير صحيحة" |
| 2.1.3 | باسورد خاطئ | نفس الرسالة (لا يكشف هل الإيميل موجود) |
| 2.1.4 | حقل فارغ | تحقّق client-side validation |
| 2.1.5 | حساب بـ 2FA مفعّل | يحوّل لـ `/auth/otp` |
| 2.1.6 | اضغط "نسيت كلمة المرور" | modal أو صفحة طلب reset |

**Endpoint:** `POST /api/auth/login`

### 2.2 صفحة `/auth/otp`

| الميزة | المتوقّع |
|---|---|
| 6-digit input | يطلب الرمز |
| رمز صحيح | يدخل |
| رمز منتهٍ (>10 د) | "الرمز منتهٍ" |
| Resend بعد 30 ثانية | يُرسل رمز جديد |
| Resend قبل 30 ثانية | "انتظر X ثانية" |

**Endpoint:** `POST /api/auth/otp/verify`

### 2.3 صفحة `/auth/change-password`

| الميزة | المتوقّع |
|---|---|
| ظهور تلقائي بعد login لأوّل مرّة | لو `must_change_password=true` |
| باسورد جديد + تأكيد | احفظ → `must_change_password=false` |

### 2.4 صفحة `/register`

| الميزة | المتوقّع |
|---|---|
| الحقول الأساسيّة | اسم، إيميل، باسورد، رقم جوّال |
| اسم الشركة | حقل مطلوب |
| Terms checkbox | لازم يُقبل قبل المتابعة |
| Submit | ينشئ org + admin user → SMS welcome → login |

**Endpoint:** `POST /api/auth/register`

---

<a id="3-dashboard"></a>
## 3️⃣ Dashboard `/dashboard`

**الميزات:**
- KPIs cards (المحادثات، الردود، التحويل، الكلفة)
- Real-time activity feed
- Quick actions
- Onboarding wizard (للحسابات الجديدة)

| # | الميزة | الفحص |
|---|---|---|
| 3.1 | KPI: محادثات اليوم | تحقّق الرقم يطابق `/inbox` |
| 3.2 | KPI: معدّل الردّ | متوسّط زمن الـ first response |
| 3.3 | KPI: تحويلات | عدد المحادثات بـ outcome=conversion |
| 3.4 | Activity feed | يظهر آخر 10 events |
| 3.5 | Onboarding wizard | للحسابات بـ < 7 أيام، توجيهات لربط واتساب + الفريق |
| 3.6 | Sidebar badge | لو في unread، يظهر رقم |

---

<a id="4-inbox"></a>
## 4️⃣ Inbox والمحادثات `/inbox`

### 4.1 القائمة (Conversation list)

| الميزة | الفحص |
|---|---|
| Tabs: الكل / مفتوح / محلول / مهمل / مكتوم | كل tab يفلتر |
| Search | بالاسم أو الرقم |
| Sort | بالأحدث / الأقدم |
| Avatar + اسم | يظهر صحيح (`name_ar` أوّلاً) |
| Last message preview | آخر رسالة من العميل |
| Unread badge | عدد الرسائل غير المقروءة |
| Sentiment chip | (😊/😐/😞) للمحادثات الحديثة |
| Customer score | نجوم 1-5 (من CSAT responses) |

### 4.2 عرض المحادثة

| # | الميزة | الفحص |
|---|---|---|
| 4.2.1 | استلام رسالة جديدة | تظهر فوراً (real-time WebSocket) |
| 4.2.2 | إرسال رسالة نصّيّة | تصل للعميل في الواتساب |
| 4.2.3 | إرفاق صورة | upload + send |
| 4.2.4 | إرفاق ملف | upload + send |
| 4.2.5 | تسجيل صوتي | record + send |
| 4.2.6 | Quick reply | dropdown يعرض القوالب |
| 4.2.7 | Internal note | لا تُرسَل للعميل، تظهر بلون مختلف |
| 4.2.8 | إرسال template | dropdown قوالب معتمدة |

### 4.3 Side panel (Contact info)

| الميزة | الفحص |
|---|---|
| Contact details | اسم، رقم، أوّل تواصل، tags |
| Conversation history | عدد المحادثات السابقة |
| Customer score | يظهر الرقم |
| Order history | (لو متكامل مع shop) |

### 4.4 AI Features

| الميزة | الفحص |
|---|---|
| **AI Suggest reply** | اضغط زرّ → يولّد ردّاً → اقبل/ارفض |
| **AI Summary** | لمحادثة طويلة → يلخّصها |
| **Auto-reply (bot/AI/hybrid)** | حسب reply_mode في org settings |

### 4.5 Conversation Actions

| # | Action | الفحص |
|---|---|---|
| 4.5.1 | **Assign** | اختر agent → يُعيَّن، notification يُرسَل |
| 4.5.2 | **Re-assign** | اختر آخر |
| 4.5.3 | **Resolve (إغلاق)** | الحالة → solved، **CSAT auto-send** يُطلق (لو مفعّل) |
| 4.5.4 | **Re-open** | محادثة محلولة → فتح مجدّداً |
| 4.5.5 | **Archive** | تختفي من القائمة الرئيسيّة |
| 4.5.6 | **Mute** | لا notifications من هذه المحادثة |
| 4.5.7 | **Block contact** | يحظر |
| 4.5.8 | **Request CSAT (Manual)** | اضغط ⭐ → القالب يُرسَل (لو CSAT مفعّل) |

### 4.6 CSAT Flow (الجديد — اختبار شامل)

| # | الخطوة | المتوقّع |
|---|---|---|
| 4.6.1 | فعّل CSAT في `/settings/csat` | اختر قالب + auto-send=on |
| 4.6.2 | أغلق محادثة (4.5.3) | القالب يُرسَل تلقائياً للعميل |
| 4.6.3 | في الواتساب: اضغط زرّ "⭐⭐⭐⭐⭐" | الردّ يصل للـ webhook |
| 4.6.4 | تحقّق `customer_score` على الـ contact | تحدّث للقيمة (5) |
| 4.6.5 | تحقّق row في `csat_pending` | `responded_at` + `score` = 5 |
| 4.6.6 | أغلق نفس المحادثة مرّتين خلال 24h | الإرسال الثاني يُتجاهل (idempotency) |

---

<a id="5-campaigns"></a>
## 5️⃣ الحملات `/campaigns`

### 5.1 القائمة

| الميزة | الفحص |
|---|---|
| Tabs (الكل/نشطة/مكتملة/مجدولة/مسوّدة/متوقّفة) | كل tab يفلتر |
| Stats top bar | active, completed, totalRoi, avgOpen, convRate |
| Search | باسم الحملة |
| Pagination | 50 per page |

### 5.2 إنشاء حملة (Create Modal)

| الحقل | الفحص |
|---|---|
| Name | required |
| Template | dropdown قوالب معتمدة فقط |
| Segment | dropdown أو "كل المستلمين" |
| **Channel Mode (الجديد)** | 4 buttons (📱/💬/🔁/📡) — SMS-touching modes معطّلة لو SMS غير مربوط |
| **Cost Preview (الجديد)** | بصفّ لكل قناة (WA + SMS) + إجمالي |
| Send Now / Schedule | radio |
| Date + Time | لو scheduled |
| Budget (اختياري) | رقم |
| **A/B Testing** | toggle → variantA + variantB + split + testSize |

### 5.3 4 أوضاع القنوات (الميزة الكبرى)

| # | الوضع | الفحص |
|---|---|---|
| 5.3.1 | **wa_only** | حملة عاديّة → كل واتساب |
| 5.3.2 | **sms_only** (يحتاج SMS مربوط) | كل المستلمين عبر SMS |
| 5.3.3 | **wa_sms** (Fallback) | WA أوّلاً، SMS عند الفشل فقط |
| 5.3.4 | **dual** | كل مستلم يستلم رسالتين (WA + SMS) |

**اختبار dual:**
- Cost Preview: WA = N × سعر، SMS = N × 0.15، Total = WA + SMS.
- بعد الإرسال: Channel Breakdown card يظهر بصفّين منفصلين.

**اختبار wa_sms:**
- أنشئ حملة بـ contacts، بعضهم بأرقام WA خاطئة.
- بعد الإرسال: للأرقام الخاطئة، صفّ SMS يُبذر تلقائياً + يُرسَل.

### 5.4 تفاصيل الحملة (Detail View)

| Section | الميزة |
|---|---|
| Header | الاسم + الحالة + الإجراءات |
| Behavior Funnel | sent → delivered → read → replied → clicked → converted |
| **Channel Breakdown (الجديد)** | يظهر فقط لو في > 1 قناة |
| Segment Performance | لو حملة شريحة معيّنة |
| AI Insights | كاردات تحليل |
| Cost panel | wa cost + sms cost + total + ROI |

### 5.5 Click Tracking (الجديد)

| # | الفحص | المتوقّع |
|---|---|---|
| 5.5.1 | أنشئ حملة بنصّ يحوي `https://example.com/test` | الـ URL يُلفّ تلقائياً |
| 5.5.2 | أرسل لرقمك | تستلم: `corbit.sa/c/abc123?p=966...` |
| 5.5.3 | اضغط الرابط في الواتساب | يحوّل لـ `example.com/test` |
| 5.5.4 | تحقّق `campaign_click_links.click_count` | تحدّث لـ 1 |
| 5.5.5 | تحقّق `campaign_sends.clicked_at` لرقمك | يحدّث |
| 5.5.6 | اضغط الرابط مرّتين | clicked_at لا يتحدّث (first-click wins) |

### 5.6 Actions على حملة

| Action | الفحص |
|---|---|
| Send | active |
| Pause | متوقّفة، الـ jobs تتوقّف |
| Resume | تكمل |
| Duplicate | ينشئ مسوّدة نسخة |
| Archive | تختفي |
| Retarget Non-Openers | ينشئ مسوّدة جديدة |
| A/B Promote Winner | يُرسل النسخة الفائزة للـ holdout |
| Export CSV | تحميل تقرير |

### 5.7 AI Builder (في الموديل العلوي)

| الميزة | الفحص |
|---|---|
| Presets (6 cards) | فوريّة، لا تستهلك AI quota |
| Free-text prompt | يحتاج AI quota، يولّد draft |

### 5.8 Scheduler / Crons المرتبطة

- `corbit:dispatch-scheduled` — يُطلق الحملات المجدولة في وقتها.
- `sms:poll-status` (كل 5 د) — يحدّث `delivered_at` لـ SMS.

---

<a id="6-templates"></a>
## 6️⃣ القوالب `/templates`

### 6.1 القائمة

| الميزة | الفحص |
|---|---|
| Filters: status, category | يعملان |
| Search | بالاسم |
| Status badges | approved (أخضر) / pending (أصفر) / rejected (أحمر) |
| Sync button | يجلب من 360dialog/Meta |

### 6.2 إنشاء قالب

| الحقل | الفحص |
|---|---|
| Name (lowercase + underscore) | regex validation |
| Category (utility/marketing/auth) | dropdown |
| Language (ar/en/ar+en) | radio |
| Body (max 1024) | required |
| Header type (الجديد) | 5 buttons: 🚫/📝/🖼️/🎥/📄 |
| Footer (max 60) | اختياري |
| Buttons (up to 10) | quick_reply / url / phone |

### 6.3 M5 — Media Headers (الميزة الكبرى الجديدة)

#### 6.3.1 IMAGE Header

| # | الخطوة | المتوقّع |
|---|---|---|
| a | اختر "🖼️ صورة" | يظهر file input |
| b | ارفع JPEG ≤5MB | upload يبدأ، preview يظهر |
| c | حالة بعد الرفع | إمّا "✓ جاهز" (أخضر) أو "⚠️ في انتظار التفعيل" (أصفر) |
| d | لو "ready": احفظ → submit لـ Meta | status='pending' في القائمة |
| e | لو "pending_handle": احفظ كمسوّدة | لا تُرسَل لـ Meta حتى الـ retry |

#### 6.3.2 VIDEO Header

| # | الخطوة | المتوقّع |
|---|---|---|
| a | اختر "🎥 فيديو" | accept=video/mp4 |
| b | ارفع MP4 ≤16MB | preview بـ video player |

#### 6.3.3 DOCUMENT Header

| # | الخطوة | المتوقّع |
|---|---|---|
| a | اختر "📄 ملف" | accept=application/pdf |
| b | ارفع PDF ≤100MB | preview بأيقونة + رابط فتح |

#### 6.3.4 Retry Button (الجديد)

| # | الخطوة | المتوقّع |
|---|---|---|
| a | في القائمة، قالب بـ status="pending_handle" | كارد أصفر يظهر |
| b | اضغط "إعادة المحاولة" | API call → success or error |
| c | لو نجح | status → ready، يُرسَل لـ Meta |
| d | لو فشل | الكارد يبقى أصفر مع رسالة الخطأ |

### 6.4 CSAT Template Scaffold (الجديد)

| # | الخطوة | المتوقّع |
|---|---|---|
| a | افتح `/settings/csat` | الـ panel يظهر |
| b | اضغط "✨ إنشاء قالب جاهز" | API call → 5 quick_reply buttons (1-5) |
| c | تحقّق في `/templates` | قالب اسمه `corbit_csat` بحالة pending |
| d | بعد موافقة Meta (24h) | tab CSAT يربط القالب تلقائياً |

### 6.5 تفاصيل قالب

| Section | الميزة |
|---|---|
| Phone Preview | محاكاة شكل الرسالة |
| Performance | uses + open + click rates |
| AI Tips | اقتراحات تحسين |

### 6.6 Actions

| Action | الفحص |
|---|---|
| Edit | (لو draft فقط) |
| Duplicate | نسخة جديدة |
| Resubmit | لقالب rejected → submit جديد |
| Delete | بعد تأكيد |
| Send Campaign | يفتح create modal مع template مختار |

---

<a id="7-contacts"></a>
## 7️⃣ جهات الاتصال `/contacts`

### 7.1 القائمة

| الميزة | الفحص |
|---|---|
| Search by name/phone | يعمل |
| Filter by tag | dropdown |
| Sort by created_at / last_active | dropdown |
| Customer score column | نجوم |
| Sentiment column | emoji |

### 7.2 Actions

| Action | الفحص |
|---|---|
| Add manually | name + phone + email + tags |
| Import CSV | upload → preview → confirm |
| Export CSV | تحميل |
| Bulk tag | حدّد + اختر tag |
| Bulk delete | حدّد + احذف |
| Block | بعد تأكيد |

### 7.3 Contact Detail

| Section | الميزة |
|---|---|
| Profile | الحقول الأساسيّة |
| Tags | إضافة/حذف |
| Conversations | قائمة المحادثات السابقة |
| Behaviors | clicks, opens, conversions |
| Timeline | تاريخ الأحداث |
| Customer Score history | متى تغيّرت النتيجة |

### 7.4 Smart Segments (في تاب منفصل)

| الميزة | الفحص |
|---|---|
| Predefined: VIP / new / active / inactive | عدد المطابقين |
| Custom segments | filter builder |
| AI Segments | يولّد segment من prompt |

---

<a id="8-bots"></a>
## 8️⃣ Bot Builder `/bot-builder`

### 8.1 قائمة البوتات

| الميزة | الفحص |
|---|---|
| List | اسم + status (active/draft) |
| Trigger type | keyword / button / always |
| Actions: Edit / Activate / Delete |

### 8.2 Visual Editor

| الميزة | الفحص |
|---|---|
| Drag-and-drop nodes | message / buttons / ai / condition |
| Connect nodes | drag arrow |
| Save as draft | persist |
| Test (preview) | يحاكي محادثة |
| Connect to trigger | keyword input |
| Activate | يصبح live |

### 8.3 Bot Execution

| # | الفحص | المتوقّع |
|---|---|---|
| a | أرسل keyword من رقم خارجي | البوت يردّ |
| b | اضغط زرّ في الردّ | الـ next node يُفعَّل |
| c | في حالة condition node | يفرّع حسب الإجابة |
| d | في حالة AI node | يستدعي OpenAI/Anthropic |

---

<a id="9-ai-center"></a>
## 9️⃣ مركز الذكاء الاصطناعي `/ai-center`

### 9.1 Overview tab

| الميزة | الفحص |
|---|---|
| Donut chart | استهلاك credits |
| Daily series | آخر 30 يوم |
| Quota indicator | المتبقّي من الباقة |
| Cost summary | الكلفة الشهريّة |

### 9.2 Models tab

| الميزة | الفحص |
|---|---|
| List models (gpt-4o-mini, claude-haiku, إلخ) | يظهرون |
| Per-org pricing | tooltip |
| Toggle active | يفعّل/يعطّل |

### 9.3 Knowledge Base tab

| الميزة | الفحص |
|---|---|
| Upload PDF | embedding يبدأ |
| Status: pending → ready | خلال 30s |
| Download | للـ admin |
| Delete | بعد تأكيد |
| Accepted queries | تظهر بعد الـ embedding |

### 9.4 Tone tab (الجديد: Cost Estimate)

| الميزة | الفحص |
|---|---|
| Tone selector (friendly/formal/casual/sales) | radio |
| Custom instructions textarea | يحفظ |
| **💰 احسب الكلفة (الجديد)** | اضغط → input tokens + cost + max ceiling |
| Save | persist |

### 9.5 Guardrails tab

| الميزة | الفحص |
|---|---|
| List | اسم + وصف + toggle |
| Toggle | فعّل/عطّل |

---

<a id="10-billing"></a>
## 10️⃣ الفوترة `/billing`

### 10.1 Overview tab

| Section | الفحص |
|---|---|
| Wallet card | الرصيد بالـ ر.س |
| Top Up button | يفتح modal |
| Current plan card | اسم + سعر |
| Monthly cost | **per channel** breakdown (الجديد) |
| Daily WA usage chart | آخر 30 يوم |
| Daily AI usage chart | آخر 30 يوم |

### 10.2 Usage tab

| Component | الفحص |
|---|---|
| `<PlanUsageCard />` | حدود الباقة (agents, conversations, إلخ) |
| **`<SmsUsageWidget />` (الجديد)** | لو SMS مربوط: 3 tiles (count + cost + balance) |
| **`<SpendAlertsCard />` (الجديد)** | 3 inputs: WA + SMS + AI thresholds |

**اختبار Spend Alert:**
1. ضع WhatsApp threshold = 1 ر.س.
2. احفظ.
3. أرسل رسائل WA حتى تتجاوز 1 ر.س.
4. تحقّق ظهور bell notification "وصل إنفاق واتساب لـ 1.X ر.س — متجاوزاً الحدّ".

### 10.3 Transactions tab (الجديد: Filter Chips)

| الميزة | الفحص |
|---|---|
| **5 chips** (📋 الكل/📱 WA/💬 SMS/🤖 AI/💰 شحن) | كل واحد يفلتر |
| عمود "القناة" | لون مختلف لكل category |
| Pagination | يعمل |
| **عمود amount** | + للـ credit، - للـ debit |
| Reset filter chip | يظهر لو في فلتر مفعّل |

### 10.4 Top Up Modal

| Method | الفحص |
|---|---|
| **تحويل بنكي** | اختر بنك → أدخل اسم + مرجع → ارفع إيصال → submit (تنتقل لـ pending review) |
| **بطاقة (Moyasar)** | (إذا مفعّل) — Moyasar redirect |

### 10.5 Plans tab (مخفيّ حاليّاً)

- Hidden في v3 — Plans عبر sales contact فقط.
- لو ظهر: قائمة الخطط + زرّ "ترقية" يفتح WhatsApp sales.

---

<a id="11-settings"></a>
## 11️⃣ الإعدادات `/settings`

**9 تابات:** General, Notifications, Security, Channels, **CSAT**, WhatsApp, **SMS**, Team, API.

### 11.1 General tab

| الحقل | الفحص |
|---|---|
| اسم الشركة | احفظ |
| Logo | upload + preview |
| Timezone | dropdown (Asia/Riyadh) |
| Currency | dropdown (SAR) |
| Language | ar/en/ar+en |

### 11.2 Notifications tab (الجديد: WhatsApp Channel)

| Section | الفحص |
|---|---|
| Notification types (6) | toggle لكل واحد |
| **Channel toggles**: 📧 إيميل / 📱 SMS / 💬 **واتساب (الجديد)** | كل واحد يحفظ منفصل |
| WhatsApp template name (يظهر لو فعّلت WA) | inline input |
| Quiet hours | toggle + time range |
| Auto reports | toggle + frequency |

**اختبار WA notification:**
1. فعّل قناة "💬 واتساب".
2. أدخل اسم قالب معتمد (مثل `corbit_alert`).
3. احفظ.
4. تحقّق: low_balance / spend_alert / إلخ → القالب يُرسَل لجوّالك.

### 11.3 Security tab (الجديد: Audit Log Filters)

| Section | الفحص |
|---|---|
| Change password | inline form |
| 2FA toggle | يحتاج رقم جوّال على الحساب |
| Active sessions | قائمة + حذف |
| IP whitelist | قائمة + إضافة |
| **Audit Log (الجديد)** | 4 filters (action / user / date_from / date_to) + auto-populated dropdowns |

**اختبار Audit Filters:**
1. dropdown "كل الإجراءات" → يحوي actions حقيقيّة من DB.
2. اختر action معيّن → السجلّ يفلتر.
3. اختر user → فلتر.
4. اختر date range → فلتر.
5. اضغط "✕ مسح المرشّحات" → الكلّ يرجع.

### 11.4 Channels tab (Conversation settings)

| الحقل | الفحص |
|---|---|
| Auto-close after X | minutes |
| Auto-assign | round-robin / load-balanced |
| Customer takeover | toggle |
| Post-conversation survey | toggle |
| Reply mode | bot / ai / hybrid |

### 11.5 CSAT tab (الجديد بالكامل) ⭐

| Field | الفحص |
|---|---|
| Master enable toggle | off/on |
| Template dropdown | يحوي القوالب المعتمدة |
| **"✨ إنشاء قالب جاهز" button (الجديد)** | يستدعي scaffold endpoint |
| Auto-send-on-resolve toggle | إرسال تلقائي عند إغلاق محادثة |
| Warning بنفس tab | لو "enabled=true" بدون template |

### 11.6 WhatsApp tab

| الميزة | الفحص |
|---|---|
| الحالة الحاليّة (مربوط / غير مربوط) | يظهر |
| Connect via 360dialog Embedded Signup | يفتح popup |
| Connect via Partner | (لو credentials موجودة) |
| Disconnect | confirm + remove |

### 11.7 SMS tab (الجديد بالكامل) 📱

| Field | الفحص |
|---|---|
| Big balance card | الرصيد الحيّ |
| API token input | masked preview بعد الحفظ |
| **🔍 فحص** button | يستدعي test endpoint → يعرض الرصيد + senders |
| Sender dropdown (auto-populated) | يظهر senders المعتمدة |
| 💾 حفظ + توثيق | يحفظ في DB encrypted |
| Toggle نشط | فعّل/عطّل |
| Disconnect | confirm + remove |
| Low balance threshold | input |

### 11.8 Team tab

| Section | الفحص |
|---|---|
| Roles & Permissions | قائمة الأدوار |
| Members | قائمة + edit/delete |
| Add member modal | name + email + phone + role + skills + schedules |

### 11.9 API tab

| Section | الفحص |
|---|---|
| API Keys list | اسم + token preview + scopes |
| Create new | name + scopes → ينشئ + يعرض الـ token مرّة واحدة |
| Revoke | بعد تأكيد |
| Webhooks | list + add (URL + events) |

---

<a id="12-teams"></a>
## 12️⃣ الفريق `/teams`

| الميزة | الفحص |
|---|---|
| Departments list | اسم + members count |
| Create department | name + leader + working_hours |
| Routing rules | تعيين تلقائي حسب tag/keyword/segment |
| Service catalog (الجديد) | قائمة الخدمات |
| Member skills | tag-based routing |
| Schedules | working hours per member |

---

<a id="13-analytics"></a>
## 13️⃣ التحليلات `/analytics`

| Tab | الفحص |
|---|---|
| Overview | KPIs + trends |
| Conversations | volume + categories + sentiment distribution |
| Campaigns | per-campaign comparison |
| Agents | per-agent performance |
| Customers | top customers + churn risk |

---

<a id="14-integrations"></a>
## 14️⃣ التكاملات `/integrations`

| Integration | الحالة |
|---|---|
| Salla | (placeholder) |
| Zid | (placeholder) |
| Shopify | (placeholder) |
| Custom Webhook | يعمل (إنشاء + receive) |
| API access | dashboard للـ external apps |

---

<a id="15-support"></a>
## 15️⃣ الدعم `/support`

### 15.1 قائمة التذاكر

| الميزة | الفحص |
|---|---|
| List by status (open/in_progress/closed) | filter |
| Priority badges | low/normal/high/urgent |
| Last update | تاريخ |

### 15.2 إنشاء تذكرة

| الحقل | الفحص |
|---|---|
| Subject | required |
| Body | required |
| Priority | dropdown |
| Context (conversation/campaign/etc) | اختياري |

### 15.3 صفحة تذكرة `/support/[id]`

| Section | الفحص |
|---|---|
| Thread (messages) | timeline |
| Reply | يضيف رسالة |
| Status change | open → in_progress → closed |
| Internal note (للـ admin) | لا تظهر للعميل |

---

<a id="16-super-admin"></a>
## 16️⃣ Super Admin `/super-admin/*`

**فقط للـ super admin (admin@corbit.sa).**

### 16.1 `/super-admin`

| الميزة | الفحص |
|---|---|
| Cross-tenant overview | عدد orgs + active users + total revenue |
| Health alerts | tenants بمشاكل (low balance, near quota, إلخ) |
| Recent signups | آخر 10 |

### 16.2 `/super-admin/sms-welcome`

| الميزة | الفحص |
|---|---|
| Test SMS form | phone + message → يستدعي debugSendTestSms endpoint |
| Config snapshot | يعرض حالة config الحاليّة (token / sender / url) |

---

<a id="17-nova-admin"></a>
## 17️⃣ Nova Admin `corbit.sa/admin`

### 17.1 Dashboard

- Cross-tenant KPIs
- Active campaigns count
- Recent transactions

### 17.2 Resources (CRUD لكل واحد)

| Resource | الـ Actions |
|---|---|
| Organizations | suspend / activate / view drilldown |
| Users | reset password / change role |
| Plans | edit limits + pricing |
| Bank Accounts | active toggle |
| Transactions | approve / reject (لـ bank transfers) |
| Knowledge Base Docs | retry pending |
| OrgSmsSetting | refresh balance |
| AuditLog viewer | filter + search |
| AiActionLogs | per-call cost analysis |

### 17.3 Custom Pages

| Page | الفحص |
|---|---|
| Tenant Drill-down | اختر org → users + conversations + campaigns + spending |
| Suspension flow | suspend org + reason → org يُمنَع من login |
| Provisioning Actions | (للـ Partner) — provision/disconnect WA number |

---

<a id="18-background-jobs"></a>
## 18️⃣ Background Jobs / Crons

### 18.1 Schedule List

```bash
php artisan schedule:list
```

**يجب يحوي:**

| Cron | التوقيت | الوظيفة |
|---|---|---|
| `corbit:sync-templates` | كل 5 د | sync templates from Meta |
| `corbit:cleanup-old-messages` | يوميّاً 03:00 | retention 24 شهر |
| `corbit:expire-plans` | يوميّاً 02:30 | expire + downgrade |
| `corbit:notify-low-balance` | يوميّاً 09:00 | alerts |
| `corbit:notify-sla-warning` | hourly | SLA breaches |
| `corbit:recompute-contact-scores` | يوميّاً 04:00 | customer score |
| `kb:process-pending` | كل دقيقة | KB embedding queue |
| **`sms:poll-status` (الجديد)** | كل 5 د | DLR polling |

### 18.2 اختبار يدوي

```bash
# جرّب الـ DLR poller الآن
php artisan sms:poll-status

# جرّب CSAT scaffold
# (من UI)

# جرّب templates retry
php artisan templates:retry-pending-uploads

# جرّب password reset
php artisan users:reset-password test@example.com --random
```

### 18.3 Horizon (Redis queue)

```bash
php artisan horizon:status
php artisan horizon:list
```

| Supervisor | المهام |
|---|---|
| campaigns | SendCampaignMessage |
| default | باقي الـ jobs (notifications, AI, إلخ) |

---

<a id="19-bug-template"></a>
## 19️⃣ Bug Reporting Template

عند اكتشاف bug، وثّقه بهذا الشكل:

```markdown
### 🐛 Bug #X — [اسم مختصر]

**الصفحة:** /campaigns
**الميزة:** Click Tracking
**Browser:** Chrome 130 / Firefox 122 / Safari 17
**Device:** Desktop / Mobile (specify)
**Severity:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

**خطوات إعادة الإنتاج:**
1. ...
2. ...
3. ...

**المتوقّع:** ...
**الفعلي:** ...

**Screenshot/Video:** [link]

**Console errors:**
```
[paste from DevTools console]
```

**Network errors:**
```
[paste failing requests from DevTools network tab]
```

**Backend logs:**
```bash
tail -50 storage/logs/laravel.log | grep -A 5 "[timestamp]"
```
```

---

## 📊 Test Run Tracking

عند تنفيذ الـ smoke test، استخدم spreadsheet أو sheet داخل المستند:

| Section | Status | Tester | Time | Issues Found |
|---|---|---|---|---|
| 0. Pre-flight | ✅ / ❌ | hafiz | 09:00 | 0 |
| 1. Public pages | ✅ / ❌ | hafiz | 09:05 | 0 |
| 2. Auth flow | ✅ / ❌ | ... | ... | ... |
| 3. Dashboard | ... | ... | ... | ... |
| ... | ... | ... | ... | ... |
| 18. Background jobs | ✅ / ❌ | ... | ... | ... |
| **TOTAL** | **% PASS** | | | **N bugs** |

---

## 🎯 معايير القبول (Acceptance Criteria)

✅ **Production Ready** عند:
- 0 critical bugs (🔴).
- ≤ 3 high bugs (🟠) موثّقة بحلول واضحة.
- جميع الميزات الجديدة (✓) محدّدة كـ `passing`.
- 0 طلبات API ترجع 500.
- Horizon dashboard لا يُظهر failed jobs بأكثر من 5%.

🔄 **يحتاج إصلاح** عند:
- ≥ 1 critical bug.
- ≥ 5 high bugs.
- أيّ ميزة جديدة لا تعمل.

---

## 🔗 ملاحق

### إيميلات الاختبار

| الدور | الإيميل | الباسورد |
|---|---|---|
| Super Admin | `admin@corbit.sa` | (reset عبر `users:reset-password`) |
| Tenant Admin (Yasref) | `yasref@whatsbit.corbit.sa` | (reset عبر artisan) |
| Personal | `hafizyounis8@gmail.com` | (إنت تعرفه) |

### رقم اختبار للحملات
- استخدم رقم جوّالك الخاص.

### Endpoints المرجعيّة

```
GET  /api/dashboard/stats
GET  /api/conversations?status=all&page=1
POST /api/conversations/{id}/csat-request
POST /api/conversations/{id}/resolve
GET  /api/campaigns?status=all
POST /api/campaigns
GET  /api/campaigns/estimate?segment=X&channel_mode=Y
GET  /api/campaigns/{id}/funnel
GET  /api/campaigns/{id}/channel-breakdown
POST /api/campaigns/{id}/send
GET  /api/templates
POST /api/templates
POST /api/templates/upload-header-media
POST /api/templates/{id}/retry-header-upload
GET  /api/billing/overview
GET  /api/billing/usage
GET  /api/billing/transactions?category=whatsapp|sms|ai|topup
GET  /api/billing/alert-thresholds
PUT  /api/billing/alert-thresholds
GET  /api/settings/csat
PATCH /api/settings/csat
POST /api/settings/csat/scaffold-template
GET  /api/settings/sms
GET  /api/settings/notifications
PATCH /api/settings/notifications
GET  /api/settings/security/audit-log?action=&user_id=&date_from=&date_to=
POST /api/ai/estimate-tokens
GET  /track/{code}  (public click redirect)
```

### Artisan Commands المرجعيّة

```bash
# Pre-flight
php artisan migrate:status
php artisan migrate --force
php artisan schedule:list
php artisan horizon:status

# Recovery
php artisan users:list-admins [--org-name=X]
php artisan users:reset-password EMAIL [--random|PASSWORD]

# Operations
php artisan sms:poll-status [--hours=24] [--limit=500] [--org=ID]
php artisan templates:retry-pending-uploads [--org=ID]
php artisan sms:test --balance | --phone=X --org=Y

# Health checks
php artisan corbit:expire-plans
php artisan corbit:notify-low-balance
php artisan corbit:recompute-contact-scores
```

---

**نهاية الدليل.** أيّ سؤال أو نقطة مبهمة، تواصل مع dev team.
