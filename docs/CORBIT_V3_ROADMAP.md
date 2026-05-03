# Corbit V3 — Roadmap & Implementation Plan

**التاريخ:** 2026-05-03
**آخر تحديث:** 2026-05-03 (بعد جلسة Autonomous push)
**المرجع البصري:** `docs/corbit-platform 3.jsx`
**القرارات في memory:** `project_v3_roadmap.md` + `project_ai_billing_v2.md` + `project_session_2026_05_03_v3_kickoff.md`

---

## ✅ ملخّص ما تنفّذ ورُفع (2026-05-03)

### Production Bugs (3 — كاملة)
- ✅ Bug-1: عدّاد unread يختفي بعد القراءة (backend + frontend)
- ✅ Bug-2: Inbox live polling (8s convos، 4s messages، visibility-aware)
- ✅ Bug-3: Bot creation surface real errors

### AI Billing V2 (P1 — كامل)
- ✅ Backend: `BillingModeResolver` + AiAutoReply flag + migration
- ✅ Nova: Select toggle على PlatformPricingSetting
- ✅ Frontend: notice banner على billing page
- ⚠️ **مطلوب على Forge:** `php artisan migrate` لإضافة `ai_billing_mode` column

### P3 Small Features (3 — كاملة)
- ✅ A6+A7: header buttons (⭐ CSAT + 🌐 translate-all) في inbox
- ✅ A12: Top-up calculator في top-up modal
- ✅ CSAT backend endpoint stub (audit log entry)

### P3+P4 Polish Pass (8 — كاملة، 2026-05-03 part 2)
- ✅ A17: Channel Comparison cards
- ✅ A18: Plans Tab — popular badge + limits panel + sales CTA
- ✅ A5: Inbox Assignment drawer مع team/agent search
- ✅ A11: Reusable AiInsightsBar + Templates/Bots adoption
- ✅ A4: Campaign Builder presets (تأكّد فقط — كان مبني من قبل)
- ✅ A16: Quiet Hours window + Auto Reports frequency wired
- ✅ A13: Team Services Catalog (column + chips editor + display)
- ✅ A14: Real API Keys + Webhooks management + HMAC test flow

---

## 🛑 ميزات مؤجَّلة (تحتاج موافقة المستخدم قبل البدء)

| # | الميزة | السبب | تقدير الوقت |
|---|---|---|---|
| A1 | Help Center (5 tabs) | كبير + يندمج tickets | 3-5 أيام |
| A2 | Bot Visual Flow Editor | كبير، canvas + drag/drop | 5+ أيام |
| A3 | SMS Channel + Fallback | محتاج Unifonic credentials (blocked) | 3-4 أيام |
| M10 | Global Search | محتاج UX قرارات | 2-3 أيام |
| M5 | Templates Image Header | محتاج Meta API + columns جديدة | 2 يوم |

---

## نظرة عامّة (الخطّة الأصليّة)

هذا الـ roadmap بيمثّل التحديث الكبير لـ Corbit V3 بناءً على:
1. ملف تحديث Corbit-platform 3.jsx من الشركة (1779 سطر، تصميم بصري كامل)
2. ملاحظات اجتماع الإدارة 2026-05-03

العمل بيمشي حسب الأولويّات (P0 ← P4). ما تبدأ مرحلة قبل ما تخلص اللي قبلها.

---

## P0 — Production Bugs (يوم - يومين)

### Bug-1: عدّاد unread لا يختفي بعد القراءة
**الوصف:** لمّا المستخدم يفتح محادثة، الرقم اللي قدّامها (مثلاً `3`) لازم يصير `0` فوراً.

**نقاط التشخيص:**
- [ ] افحص `app/(platform)/inbox/page.tsx` — هل بيتم استدعاء `markAsRead` عند فتح محادثة؟
- [ ] افحص `corbit-backend` route `/conversations/{id}/read` — هل موجود؟
- [ ] افحص ConversationResource — `unread_count` بيتحدّث؟

**معيار القبول:**
- فتح محادثة فيها unread=3 → الرقم يختفي خلال ثانيتين كحد أقصى
- يبقى الرقم في sidebar للمحادثات الباقية اللي ما اتفتحت

---

### Bug-2: Inbox ما بيحدّث live
**الوصف:** الرسائل الجديدة من العميل ما بتظهر إلا بعد refresh يدوي.

**استراتيجيّة:** SWR auto-revalidate كل 5-10 ثواني (أبسط من WebSocket كبداية).

**خطوات:**
- [ ] في `useConversations` و `useMessages` hooks، خلّي `refreshInterval: 5000`
- [ ] لما المحادثة مفتوحة، interval = 3 ثواني
- [ ] لما الـ tab بـ background، interval = 30 ثانية
- [ ] أضف visual indicator (dot أخضر) لمّا last update يكون < 5 ثواني

**معيار القبول:**
- عميل يرسل رسالة → تظهر للمستخدم خلال 5 ثواني max بدون refresh

---

### Bug-3: إنشاء بوت فيه مشكلة
**الوصف:** المستخدم بلّغ إنّ إنشاء بوت جديد ما بيشتغل.

**نقاط التشخيص:**
- [ ] افتح `/bots/new` ولاحظ network tab
- [ ] اقرأ `app/(platform)/bots/page.tsx` ومسار الـ POST
- [ ] افحص validation rules في `BotController@store`
- [ ] افحص logs على Forge

**معيار القبول:**
- بوت جديد ينشأ بنجاح + يظهر في القائمة

---

## P1 — AI Billing V2 (نصف يوم)

### المرجع: `memory/project_ai_billing_v2.md`

**المهام:**

- [ ] أضف `AI_BILLING_MODE=replies_only` في `.env`
- [ ] أنشئ `config/billing.php` key:
  ```php
  'ai_mode' => env('AI_BILLING_MODE', 'replies_only'),
  ```
- [ ] عدّل `app/Services/Billing/AiUsageService.php` — أضف check قبل أيّ deduct:
  ```php
  if (config('billing.ai_mode') === 'replies_only' && $operation !== 'auto_reply') {
      return;
  }
  ```
- [ ] أضف Nova Resource/Settings page للـ `ai_billing_mode` (Select: replies_only / all_operations)
- [ ] راجع كل callsites لـ `AiUsageService` وتأكّد العملية مصنّفة صح:
  - `AiAutoReply` → `auto_reply`
  - `Sentiment*`, `Intent*`, `Classifier*`, `KbLookup`, `SmartSegment*`, `CustomerScore*` → `analytics`
- [ ] في UI الفوترة، اعرض رسالة واضحة: "تحليلات AI مجانيّة، فقط ردود AI التلقائيّة محسوبة"

**معيار القبول:**
- في الـ default mode، إرسال 100 رسالة sentiment analysis لا يخصم شيء من wallet
- إرسال 1 auto-reply يخصم القيمة المعتادة
- super-admin يقدر يبدّل الوضع من Nova بضغطة

---

## P2 — Major Features (3-5 أيام لكل وحدة)

### Feature A1: Help Center كامل

**المرجع البصري:** `corbit-platform 3.jsx` السطر 1517-1674 (`HelpPg`)

**هيكل الـ tabs (بنفس ترتيب الملف):**
1. **📖 Guides** — أدلّة استخدام (Bot/Inbox/Templates/Campaigns…) كل دليل: عنوان، أيقونة، خطوات (كل خطوة لها عنوان + وصف + tip + visual icon + رابط للصفحة)
2. **❓ FAQ** — أسئلة شائعة (8 أسئلة جاهزة في الملف)
3. **🎫 Tickets** — **هذا = نظام الدعم الحالي** (بنفس API/data، شكل محسّن)
4. **💬 Live Chat** — محادثة دعم فورية (placeholder الآن، فعلياً بعدين)
5. **📞 Contact** — WhatsApp + Phone + Email cards

**Floating Help Button:** زر `?` ثابت يمين/يسار أسفل الشاشة (راجع السطر 1733)

**نقاط مهمّة:**
- Tickets tab يستخدم نفس `/api/support-tickets` الموجود
- Guides داتا static في frontend (ما يحتاج backend)
- FAQ static
- Live Chat = "قريباً" placeholder

**معيار القبول:**
- زر ? عائم يفتح drawer
- 5 tabs تشتغل
- Tickets tab بيعرض/ينشئ تذاكر زي قبل
- Guides drill-down يشتغل (open guide → see steps → navigate to page)

---

### Feature A2: Bot Visual Flow Editor

**المرجع البصري:** `corbit-platform 3.jsx` السطر 1027-1085 (`BotPg` edit mode)

**9 أنواع عقد:**
| النوع | الأيقونة | الـ config |
|---|---|---|
| trigger | ⚡ | keywords (CSV) |
| message | 💬 | text + image/button/variable |
| buttons | 🔘 | array of buttons |
| input | ✏️ | input type (text/number/email/phone) + prompt |
| condition | 🛡️ | true/false branches |
| ai | 🧠 | KB + context + threshold |
| api | 🔗 | method + URL + headers |
| transfer | 👥 | team/agent selector |
| end | ✓ | (no config) |

**المتطلّبات:**
- Canvas drag/drop (يقدر nodes تتحرّك)
- خطوط ربط بين nodes (SVG)
- panel جانبي يفتح لمّا تختار node
- Save flow as JSON in `bots.flow_json` column
- Test mode: chat preview بيمشي على الـ flow

**هذا feature كبير — قسّمه على sub-tasks:**
- [ ] Step 1: Canvas + nodes فقط (بدون drag) — عرض read-only
- [ ] Step 2: Click node → side panel
- [ ] Step 3: Edit node config + save
- [ ] Step 4: Drag/drop nodes
- [ ] Step 5: Add new node from toolbar
- [ ] Step 6: Connect nodes (drag from output to input)
- [ ] Step 7: Test mode

**معيار القبول:**
- إنشاء bot من الصفر بـ 5 nodes متّصلة + حفظ + اختبار

---

### Feature A3: SMS Channel + Fallback

**القرار:** SMS كقناة لإرسال رسائل **للعميل النهائي**، ليس للإشعارات الإداريّة.

**3 أوضاع التشغيل:**
1. **WhatsApp Only** (افتراضي)
2. **Fallback** (WA → SMS): إذا فشل WhatsApp، يرسل SMS تلقائياً
3. **Dual**: يرسل على القناتين معاً

**Provider integration:**
- ابدأ بـ Unifonic (الأكثر استخداماً في السعوديّة)
- أضف Twilio و Taqnyat كـ options لاحقاً

**المرجع البصري:** السطر 1471-1485

**خطوات:**
- [ ] DB migration: `sms_settings` table + `messages.channel` enum (whatsapp/sms)
- [ ] `app/Services/Messaging/SmsService.php` (بـ Unifonic)
- [ ] config/sms.php
- [ ] Settings UI (channels tab) — toggle SMS + provider config + balance
- [ ] Channel preference per message type (Campaign/Notif/Order/OTP)
- [ ] Channel comparison card (read rate, cost, media support)
- [ ] Fallback logic في `SendCampaignMessage` job

**معيار القبول:**
- إرسال حملة بـ Fallback mode → 90% via WA، الفاشلة via SMS
- Top up منفصل لـ SMS balance

---

### Feature M10: Global Search

**الوصف:** بحث موحّد عبر contacts + messages + templates + campaigns + bots.

**خطوات:**
- [ ] Endpoint جديد `GET /api/search?q=...&type=...`
- [ ] في كل موديل: `searchable()` scope
- [ ] Component جديد `<GlobalSearch />` في الـ navbar (Cmd+K shortcut)
- [ ] Results: tabs by type + result preview + click to navigate

**معيار القبول:**
- Cmd+K يفتح search modal
- بحث "محمد" يعرض contacts + conversations + templates فيها "محمد"
- Click result → ينقل للصفحة مع highlight

---

## P3 — Medium Features (يوم لكل وحدة)

### A4: AI Campaign Builder
**المرجع:** السطر 515-533. 6 templates: Retarget/Cart/Birthday/Upsell/WinBack/Loyalty + nl-prompt → AI generates draft.

### A6+A7: Inbox Translate (🌐) + Report (⚑) Buttons
**المرجع:** السطر 354-355 (header) + 365 (per-message).
- 🌐 header → ترجم كل المحادثة
- 🌐 per message → ترجم رسالة واحدة
- ⚑ per message → بلاغ + يصل لـ Nova review queue

### A12: Top Up Calculator
**المرجع:** السطر 1372-1382. 5 خانات (Marketing/Utility/OTP/Service/SMS) بأسعار + total auto-calc.

### A13: Service Catalog per Team
**المرجع:** السطر 1363. حقل JSON على `teams.services_catalog` يحدّد قائمة الخدمات → routing تلقائي.

### A14: API Request Log + Webhooks UI
**المرجع:** السطر 1503-1512. عرض آخر API calls + webhooks management (URL + events + on/off).

### A16: Quiet Hours + Auto Reports
**المرجع:** السطر 1455-1456. quiet hours (from-to) + Daily/Weekly/Monthly reports email.

---

## P4 — Small Features (ساعات)

### A5: Take Over + Assignment Drawer
**المرجع:** السطر 352. إسناد drawer مع بحث teams/agents.

### A11: AI Insights Cards
**المرجع:** متعدّد. Cards على كل صفحة (Campaign/Contact/Template/Bot) تعرض score + tips.

### A17: Channel Comparison Card
**المرجع:** السطر 1488. WA vs SMS (read rate, cost, media).

### A18: Plans Tab in Billing
**المرجع:** السطر 1279. عرض 3 خطط + ميزات + زر ترقية.

### M5: Templates Image Attachment
**المرجع:** السطر 781 (header:"صورة"). تفعيل header type=image في إنشاء/تعديل قالب.

### M12: CSAT Request Button
**المرجع:** السطر 354. زر ⭐ في header المحادثة → يرسل قالب CSAT للعميل + يخزّن النتيجة.

---

## الترتيب التنفيذي (Sprint Plan)

### Sprint 1 — Stabilize (3-4 أيام)
- P0 (3 bugs)
- P1 (AI billing V2)
- M5 (template image)
- M12 (CSAT button)

### Sprint 2 — Help Center + Bot Editor (5-7 أيام)
- A1 (Help Center)
- A2 (Bot Visual Editor) — قسّم لـ 7 sub-tasks

### Sprint 3 — SMS + Global Search (4-5 أيام)
- A3 (SMS)
- M10 (Global Search)

### Sprint 4 — Polish (3-4 أيام)
- P3 features (A4, A6+A7, A12, A13, A14, A16)
- P4 features (A5, A11, A17, A18)

---

## ملاحظات هامّة

- **WhatsApp-First مازال:** للإشعارات الإداريّة (الـ tenant admin notifications) ما زال WhatsApp فقط. SMS فقط لإرسال للعملاء النهائيين.
- **AI Billing:** قبل ما يخلص P1، لا تعتمد على أيّ لوجيك خصم تحليلات.
- **اقرأ الكود الموجود:** قبل ما تبني A1 أو A2، اقرأ `app/(platform)/help` (لو موجود) و `app/(platform)/bots`. ربّما في كود قديم نقدر نطوّره.
- **اختبر كل ميزة قبل ما تنتقل للي بعدها** — ما تفتح كذا feature بنفس الوقت.
