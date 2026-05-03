# Corbit Smoke Test — 2026-05-03 (الإصدار الشامل)

خطّة فحص E2E **شاملة** لكل صفحات لوحة العميل + لوحة الإدارة + الـ regressions. كل بند فيه pass/fail واضح.

## الـ Org الفعلي للاختبار

```
org_id:  a0bd979b-9981-442b-a3c7-5def25e39846   (المدار / Corbit hosted)
admin:   hafiz@corbit.sa
tenant:  https://whatsbit.corbit.sa
nova:    https://whatsbit-admin.corbit.sa/cpanel
```

## أدوات تشخيص جاهزة (Forge → backend → Commands)

```bash
php artisan ai:debug-kb a0bd979b-9981-442b-a3c7-5def25e39846
php artisan ai:test-retrieve a0bd979b-9981-442b-a3c7-5def25e39846 "السؤال"
php artisan conv:show <conversation-id>
php artisan kb:process-pending
php artisan schedule:list
```

---

# 🟩 الجزء الأوّل: لوحة العميل (whatsbit.corbit.sa)

## A. Dashboard (/dashboard)

- [ ] A1. صفحة تفتح بدون أخطاء
- [ ] A2. Onboarding Wizard يظهر لو في خطوات غير مكتملة
- [ ] A3. كل خطوة تتحقّق تلقائياً (✓ لو مكتملة، رقم لو لا)
- [ ] A4. زرّ "ابدأ ←" ينقلك للصفحة المعنيّة
- [ ] A5. زرّ X يخفي البنر دائماً (dismiss)
- [ ] A6. الـ stat cards (Total Conv، Active Agents، Avg Response، Camp Sent) تعرض أرقام فعلية
- [ ] A7. الـ sparklines ترسم خطوط (مش فاضية)
- [ ] A8. Mobile responsive (قلّب التليفون)

## B. Inbox (/inbox)

### B-Layout
- [ ] B1. قائمة المحادثات في اليمين تعرض كل المحادثات
- [ ] B2. tabs (الكل / جديدة / مفتوحة) تفلتر
- [ ] B3. البحث يعمل
- [ ] B4. اختيار محادثة تفتح المحادثة في الوسط
- [ ] B5. قسم detail في اليسار يعرض معلومات العميل
- [ ] B6. Mobile: drawer للقائمة + back button

### B-Composer Icons (tooltips جديدة)
- [ ] B7. 📎 clip → tooltip "إرفاق ملف"
- [ ] B8. 😀 smile → tooltip "إيموجي"
- [ ] B9. 🔖 bookmark → tooltip "ردود سريعة"
- [ ] B10. ✨ sparkles → tooltip "اقترح ردًّا"
- [ ] B11. 🤖 bot → tooltip ديناميكي حسب AI on/off
- [ ] B12. ➤ send → tooltip "إرسال"

### B-Composer States
- [ ] B13. AI on: clip/emoji/bookmark/input/send كلهم disabled (40% opacity + cursor:not-allowed)
- [ ] B14. AI on: ✨ + 🤖 يبقوا clickable
- [ ] B15. AI off: كل شي مفتوح
- [ ] B16. Window closed: نفس سلوك AI on (disabled) + بنر "النافذة مغلقة" + زرّ "إرسال قالب"

### B-Actions
- [ ] B17. ✨ Suggest يولّد نصّ مقترح في حقل الكتابة + toast
- [ ] B18. 🔖 Quick Replies dropdown يفتح + اختيار يعبّى الحقل
- [ ] B19. 😀 Emoji picker يفتح + اختيار يضيف للحقل
- [ ] B20. إرسال نصّ عادي يصل العميل + يظهر في الـ thread
- [ ] B21. إرسال قالب من Template Picker يعمل
- [ ] B22. زرّ "استلام المحادثة" يطفّي AI + يفتح composer
- [ ] B23. زرّ "حلّ" يحوّل status لـ solved
- [ ] B24. زرّ "إسناد" يفتح modal اختيار agent
- [ ] B25. تبديل priority (low/medium/high) يعمل

### B-AI Features
- [ ] B26. ملخّص AI: زرّ "عرض" يولّد ملخّص للمحادثة
- [ ] B27. تحديث Intent + Sentiment (تظهر في الـ header)
- [ ] B28. زرّ ترجمة 🌐 على كل رسالة (لو Translation toggle ON)
- [ ] B29. زرّ تبليغ 🚩 على كل رسالة → Report Modal

### B-Notes
- [ ] B30. تبويب "ملاحظات" يعرض الملاحظات
- [ ] B31. إضافة ملاحظة جديدة + حفظ
- [ ] B32. ملاحظات النظام (AI redirect) تظهر بدون author

### B-Hybrid Bot/AI
- [ ] B33. Bot rule keyword → ردّ ثابت (مش AI)
- [ ] B34. AI رد على سؤال خارج Bot rules
- [ ] B35. human_redirect → AI يحوّل + يبعت acknowledgement (المُصلح اليوم)

## C. Campaigns (/campaigns)

### C-List
- [ ] C1. قائمة الحملات تظهر
- [ ] C2. Tabs (All/Active/Scheduled/Draft/Completed) تفلتر
- [ ] C3. كل حملة تعرض: الاسم، الحالة، عدد المستلمين، delivery rate

### C-Create
- [ ] C4. زرّ "حملة جديدة" يفتح modal
- [ ] C5. اختيار قالب من القائمة
- [ ] C6. اختيار شريحة (segment)
- [ ] C7. تحديد جدولة (الآن / مجدولة)
- [ ] C8. ميزانية اختياريّة
- [ ] C9. ☐ تفعيل A/B Testing → 2 textareas + 2 sliders تظهر
- [ ] C10. validation: variants متطابقتين → error
- [ ] C11. submit → الحملة تُنشأ + ab-test يُعدّ

### C-Detail
- [ ] C12. اختيار حملة يفتح صفحة Detail
- [ ] C13. KPI cards (sent/delivered/read/replied) تعرض أرقام
- [ ] C14. Behavior Funnel chart يرسم
- [ ] C15. AI Insights cards تظهر (V2 rule-based)
- [ ] C16. زرّ "Refresh Insights" يعيد التوليد
- [ ] C17. زرّ "Retarget Non-openers" يفتح confirm + ينشئ حملة متابعة

### C-A/B Results (لو الحملة A/B)
- [ ] C18. بطاقة "🧪 نتائج A/B" تظهر
- [ ] C19. الجدول يقارن A vs B
- [ ] C20. الفائزة تظهر بخلفيّة خضراء + ⭐
- [ ] C21. زرّ "أرسل الفائز للباقين" يدفع batch للـ holdout
- [ ] C22. promote ثاني مرّة → idempotent (0/0)

### C-Pause/Resume
- [ ] C23. زرّ Pause يوقف الحملة
- [ ] C24. زرّ Resume يكمل من حيث وقفت
- [ ] C25. live progress polling (الـ counters تتحدّث كل 5 ثواني)

### C-AI Builder
- [ ] C26. زرّ "AI Builder" يفتح modal
- [ ] C27. 6 presets cards
- [ ] C28. NL textarea للوصف الحرّ
- [ ] C29. preview screen + apply

## D. Contacts (/contacts)

- [ ] D1. قائمة جهات الاتصال تظهر
- [ ] D2. البحث + الفلاتر تعمل
- [ ] D3. Smart Segments tiles فوق (8 segments) تعرض counts صحيحة
- [ ] D4. Tags filter يعمل
- [ ] D5. Customer Score column تعرض الرقم
- [ ] D6. اختيار عميل يفتح Drawer مع: Profile + Behavior + AI Notes + Timeline
- [ ] D7. زرّ "إنشاء حملة من هذي الشريحة"
- [ ] D8. Import CSV يعمل
- [ ] D9. Export CSV يعمل
- [ ] D10. Pagination

## E. Templates (/templates)

- [ ] E1. قائمة القوالب من 360dialog
- [ ] E2. حالة كل قالب (approved/rejected/pending)
- [ ] E3. Phone Preview Component يعرض بشكل WhatsApp realistic
- [ ] E4. زرّ Sync Templates يحدّث القائمة
- [ ] E5. زرّ AI Analyze على قالب → يحلّل ويعطي توصيات
- [ ] E6. إنشاء قالب جديد + إرسال للموافقة من Meta

## F. Bot Builder (/bot-builder)

- [ ] F1. قائمة البوتات الحاليّة
- [ ] F2. إنشاء بوت جديد
- [ ] F3. Visual editor (drag/drop nodes)
- [ ] F4. Trigger node: keywords → كل keyword chip + ✕ يحذفها (مُصلح اليوم)
- [ ] F5. Message node: text + image
- [ ] F6. Condition / Action / Wait nodes
- [ ] F7. حفظ + تفعيل البوت
- [ ] F8. اختبار البوت من رسالة واتساب جاية

## G. AI Center (/ai-center)

### G-Overview
- [ ] G1. tab نظرة عامّة → 5 metrics
- [ ] G2. الـ accuracy bars محسوبة من ai_action_logs (real)

### G-Models tab
- [ ] G3. 6 models موجودة مع toggles
- [ ] G4. Toggle suggest_reply OFF → ✨ يرجع suggestion فاضي
- [ ] G5. Toggle classify OFF → intent يبقى unknown
- [ ] G6. Toggle sentiment OFF → sentiment فاضي
- [ ] G7. Toggle summary OFF → ملخّص فاضي
- [ ] G8. Toggle smart_routing OFF → ما في routing
- [ ] G9. Toggle translate OFF → زرّ الترجمة → 403
- [ ] G10. أرجع كل التogglز ON بعد الاختبار

### G-Knowledge tab
- [ ] G11. قائمة الـ KB documents
- [ ] G12. زرّ "رفع مستندات" يقبل TXT/PDF
- [ ] G13. الـ doc يظهر بـ status: pending → completed خلال دقيقة
- [ ] G14. statistics: queries + accuracy تتحدّث
- [ ] G15. زرّ "حذف" doc

### G-Tone tab
- [ ] G16. اختيار tone (friendly/formal/casual/sales)
- [ ] G17. textarea custom_instructions يحفظ
- [ ] G18. Active badge يظهر على الـ tone المختار

### G-Guardrails tab
- [ ] G19. 5 toggles موجودة
- [ ] G20. تفعيل/تعطيل يحفظ في DB

## H. Analytics (/analytics)

- [ ] H1. صفحة تفتح
- [ ] H2. charts ترسم
- [ ] H3. date range picker يعمل
- [ ] H4. export

## I. Apps / Integrations (/apps أو /integrations)

- [ ] I1. قائمة integrations المتاحة
- [ ] I2. Connect/Disconnect يعمل
- [ ] I3. Webhooks settings (لو موجود)

## J. Teams (/teams أو /settings/team)

- [ ] J1. قائمة الفرق
- [ ] J2. إنشاء فريق جديد
- [ ] J3. إضافة أعضاء
- [ ] J4. تعيين lead
- [ ] J5. حذف عضو/فريق

## K. Billing (/billing)

- [ ] K1. عرض الباقة الحاليّة
- [ ] K2. عرض الرصيد
- [ ] K3. تاريخ المعاملات
- [ ] K4. زرّ "شحن المحفظة" يفتح Bank Transfer flow
- [ ] K5. رفع إيصال + تفاصيل التحويل
- [ ] K6. حالة التحويل (pending/approved/rejected)

## L. Settings (8 tabs)

### L-WhatsApp
- [ ] L1. عرض الرقم المربوط
- [ ] L2. حقل API key (لو BYO mode)
- [ ] L3. زرّ Connect (لو Partner mode)

### L-Business Hours
- [ ] L4. 7 days editor (open/close/closed)
- [ ] L5. حفظ + يطبّق على business_status

### L-AI Tone
- [ ] L6. (مكرّر مع AI Center → Tone tab)

### L-Notifications
- [ ] L7. preferences لكل event type (in_app, email, sms)
- [ ] L8. حفظ

### L-Team
- [ ] L9. (مكرّر مع /teams)

### L-Security
- [ ] L10. تغيير كلمة المرور
- [ ] L11. 2FA toggle (لو مبني)
- [ ] L12. Audit Log viewer

### L-Knowledge Base
- [ ] L13. (مكرّر مع AI Center → Knowledge tab)

### L-Templates
- [ ] L14. (مكرّر مع /templates)

## M. Support (/support أو /help)

- [ ] M1. قائمة الـ tickets
- [ ] M2. إنشاء ticket جديد
- [ ] M3. Reply to ticket
- [ ] M4. حالة (open/in-progress/resolved)

---

# 🟦 الجزء الثاني: لوحة الإدارة (Nova)

## N. Main Dashboard

- [ ] N1. 🚨 OrgsNeedingAttention card (أوّل بطاقة)
- [ ] N2. ActiveTenants
- [ ] N3. MonthlyRecurringRevenue
- [ ] N4. OpenAiCostThisMonth
- [ ] N5. LowBalanceTenants
- [ ] N6. PendingTransfers + SuspendedTenants + TotalOrganizations + WalletBalanceTotal
- [ ] N7. Trends (NewOrganizations + Messages)
- [ ] N8. Partitions (TopOrgsByAiCalls + ByPlan + CampaignsByStatus)

## O. Organizations Resource

- [ ] O1. قائمة المؤسّسات تظهر
- [ ] O2. 3 فلاتر: Status / Plan / Expiry
- [ ] O3. Suspend badge على المعلّقات
- [ ] O4. اختيار مؤسّسة → Detail page

### O-Drill-Down Panels
- [ ] O5. 🚨 Health Alerts banner (لو في تنبيهات)
- [ ] O6. 📊 Activity panel (30-day metrics)
- [ ] O7. 💰 Billing panel (wallet/MTD/transfer/expiry)

## P. Lenses

- [ ] P1. زرّ Lenses → "OrgsNeedingAttention"
- [ ] P2. القائمة تعرض المؤسّسات بمشاكل
- [ ] P3. تفاصيل التنبيهات ملوّنة
- [ ] P4. اسم المؤسّسة قابل للضغط
- [ ] P5. Actions في الـ Lens (AddWalletBalance + ExtendPlan)

## Q. Actions (5)

- [ ] Q1. BroadcastAnnouncement (مع ☐ "أرسل عبر واتساب")
- [ ] Q2. SetOrganizationStatus (suspend/activate)
- [ ] Q3. AddWalletBalance
- [ ] Q4. ExtendPlan
- [ ] Q5. ConnectWhatsAppNumber
- [ ] Q6. SetBusinessHours
- [ ] Q7. UploadKnowledgeBase

## R. Other Resources

- [ ] R1. Plans (CRUD)
- [ ] R2. Transactions (موافقة BankTransfer)
- [ ] R3. Bank Accounts
- [ ] R4. Templates (read-only من 360dialog)
- [ ] R5. Campaigns (read)
- [ ] R6. Conversations (read)
- [ ] R7. Messages (read)
- [ ] R8. Contacts (read)
- [ ] R9. Users (CRUD + SendUserNotification action)
- [ ] R10. Support Tickets (مع ReplyToTicket + SetTicketStatus actions)
- [ ] R11. AuditLog viewer (read-only) + 2 فلاتر
- [ ] R12. PlatformPricingSetting
- [ ] R13. Admin (super-admin users)

## S. Sidebar

- [ ] S1. كل sections تظهر بالعربي
- [ ] S2. الـ groups مرتّبة (Customer Mgmt / Billing / System Mgmt)
- [ ] S3. صلاحيّات: super-admin يشوف كل شي

---

# 🟥 الجزء الثالث: Regression Checks (المهمّ!)

## T. Backend Cron Jobs

- [ ] T1. `php artisan schedule:list` يعرض كل الـ commands
- [ ] T2. `kb:process-pending` كل دقيقة
- [ ] T3. `corbit:expire-plans` يومياً
- [ ] T4. `corbit:notify-low-balance` يومياً
- [ ] T5. `corbit:notify-sla-warning` كل ساعة
- [ ] T6. `corbit:cleanup-old-messages` يومياً
- [ ] T7. `corbit:recompute-contact-scores` يومياً
- [ ] T8. `corbit:sync-templates` كل 5 دقائق

## U. Plan Expiry Kill Switch

- [ ] U1. مؤسّسة بـ plan منتهي → middleware يبلوك endpoints
- [ ] U2. WhatsAppService::resolveApiKey يبلوك الإرسال

## V. Bank Transfer Flow

- [ ] V1. tenant يرفع تحويل → يظهر في Nova pending
- [ ] V2. admin يضغط Approve → wallet ينضاف + audit log
- [ ] V3. admin يضغط Reject → reason mandatory + notify tenant

## W. Suspend / Activate

- [ ] W1. Nova action SetOrganizationStatus → suspended
- [ ] W2. tenant يحاول استخدام النظام → blocked
- [ ] W3. activate → restored + audit log

## X. Email Throttling

- [ ] X1. 4 رسائل من نفس العميل خلال دقيقة → email واحد فقط
- [ ] X2. new_conversation → email
- [ ] X3. new_message → email أوّل ثم 30 دقيقة silence

## Y. Logs

- [ ] Y1. production.log ما فيه `[AccountNotifications] channel resolved` (debug level)
- [ ] Y2. أيّ error جديد → لازم نتعقّبه

## Z. Performance

- [ ] Z1. صفحات تفتح < 3 ثواني
- [ ] Z2. Nova Dashboard < 5 ثواني
- [ ] Z3. inbox real-time updates يشتغل
- [ ] Z4. mobile responsive يشتغل

---

## نموذج التقييم

لكل خطوة:
- ✅ نجحت
- ❌ فشلت (سجّل المشكلة + كيف نعيد إنتاجها)
- ⚠️ شغّالة جزئياً (سجّل ايش يشتغل وايش لا)
- ⏭️ تخطّيت (سجّل السبب)

في النهاية، أيّ ❌ يصير task جديد للإصلاح.

---

## ابدأ من حيث وقفنا

**القسم B (Inbox)** ثم نمشي بالترتيب. كل قسم نعطيه ٥-١٥ دقيقة. الإجمالي ~3-4 ساعات للفحص الشامل.

**القسم A (AI Center) خلصت:** 4 إصلاحات اليوم (greeting, identity question, transfer ack, dedup notes).
