# Corbit Smoke Test — 2026-05-03

خطّة فحص E2E شاملة لكل اللي بُني خلال آخر يومين+ (50+ commit عبر 3 repos). نمشي بترتيب من الأبسط للأعقد، نسجّل نتيجة كل خطوة قبل ما ننتقل للتالية.

## الـ Org الفعلي للاختبار

```
org_id:  a0bd979b-9981-442b-a3c7-5def25e39846   (المدار / Corbit hosted)
admin:   hafiz@corbit.sa
inbox:   https://whatsbit.corbit.sa/inbox
nova:    https://whatsbit-admin.corbit.sa/cpanel
```

> ⚠️ **لا تخلط** بين الـ org الحقيقي و `019db67b-...` (مؤسّسة اختبار فاضية أُنشئت بالغلط).

## أدوات تشخيص جاهزة

```bash
# على backend (whatsbit.corbit.sa) عبر Forge → Commands:
php artisan ai:debug-kb a0bd979b-9981-442b-a3c7-5def25e39846
php artisan ai:test-retrieve a0bd979b-9981-442b-a3c7-5def25e39846 "السؤال"
php artisan conv:show <conversation-id>
php artisan kb:process-pending
php artisan schedule:list
```

---

## التشيك ليست (نملأها أثناء الفحص)

### A. AI Center

- [ ] A1. Toggle suggest_reply (أو "مساعد الردود") on → الـ AI يقترح
- [ ] A2. Toggle suggest_reply off → endpoint يرجع suggestion فاضية
- [ ] A3. Toggle classify off → AnalyzeConversationContext ما يُنفّذ classify
- [ ] A4. Toggle sentiment off → AnalyzeConversationContext ما يُنفّذ sentiment
- [ ] A5. Toggle summary off → aiSummary endpoint يرجع summary فاضي
- [ ] A6. Toggle smart_routing off → SmartRoutingService يخرج بدون فعل
- [ ] A7. Toggle translate off → endpoint يرجع 403
- [ ] A8. KB accuracy live: ارفع KB، اعمل suggest_reply، اقبل → accuracy يصير 100%
- [ ] A9. Smart Routing: عميل يرسل "أبي أشتري" → المحادثة تنسند لفريق المبيعات
- [ ] A10. Translation: زرّ الترجمة في الـ inbox يرجع نص بلغة مختلفة

### B. Nova Admin Dashboard

- [ ] B1. ActiveTenants metric يعرض رقم صحيح
- [ ] B2. SuspendedTenants metric يعرض 0 (أو الرقم الصحيح)
- [ ] B3. MonthlyRecurringRevenue يحسب SUM(plan.price_monthly) للنشطين
- [ ] B4. OpenAiCostThisMonth يعرض المبلغ بالدولار
- [ ] B5. LowBalanceTenants يعدّ المؤسّسات بـ wallet < 50
- [ ] B6. TopOrgsByAiCalls Partition يعرض top 5
- [ ] B7. OrgsNeedingAttentionCount card في الزاوية الأولى
- [ ] B8. Lens "OrgsNeedingAttention" يعرض القائمة بتفاصيل التنبيهات

### C. Per-Tenant Drill-Down (Nova)

- [ ] C1. افتح مؤسّسة → 🚨 panel يظهر (لو في تنبيهات) أو يقول "لا توجد"
- [ ] C2. 📊 Activity panel يعرض 30-day metrics
- [ ] C3. 💰 Billing panel يعرض wallet + OpenAI MTD + last transfer + plan expiry
- [ ] C4. Action: AddWalletBalance يضيف رصيد + يكتب transaction
- [ ] C5. Action: ExtendPlan يمدّد plan_expires_at
- [ ] C6. Action: ConnectWhatsAppNumber يربط رقم 360dialog
- [ ] C7. Action: SetBusinessHours يحفظ النمط
- [ ] C8. Action: UploadKnowledgeBase يرفع KB + cron يلتقطه

### D. WhatsApp Broadcast Extension

- [ ] D1. BroadcastAnnouncement → checkbox "أرسل عبر واتساب" يظهر
- [ ] D2. تفعيل الـ checkbox → الإيميل يُرسَل + الواتساب يُرسَل
- [ ] D3. Help text يعرض ✅ المسموح + ❌ الممنوع
- [ ] D4. SendUserNotification نفس السلوك

### E. Onboarding Wizard (Tenant)

- [ ] E1. /api/onboarding/status يرجع 6 steps + completed/total
- [ ] E2. dashboard يعرض البنر إذا completed < total
- [ ] E3. كل خطوة عند الإنجاز تصير ✓
- [ ] E4. زرّ X → /api/onboarding/dismiss → البنر يختفي + dismissed_at يُحفَظ
- [ ] E5. لمّا 6/6 → البنر يختفي تلقائياً

### F. A/B Testing

- [ ] F1. Create campaign + ☐ enable A/B → يكشف 2 textareas + sliders
- [ ] F2. Validation: same-text variants → error "النسختان متطابقتان"
- [ ] F3. Submit → campaign created + ab-test configured
- [ ] F4. Send to 20+ test contacts → split 50/50 + 30% test pool
- [ ] F5. campaign_sends rows: 6 a's + 6 b's + 8 holdouts (variant=null)
- [ ] F6. كل recipient يستلم الـ variant body الصحيح في {{1}}
- [ ] F7. Detail panel "🧪 نتائج A/B Testing" يظهر
- [ ] F8. الجدول يقارن A vs B + الفائزة بخلفيّة خضراء
- [ ] F9. زرّ "أرسل النسخة X للباقين" يدفع batch للـ holdout
- [ ] F10. بعد promote → البنر يصير "✅ تمّ ترقية النسخة"
- [ ] F11. زرّ promote ثاني مرّة → idempotent (0/0)

### G. Recent Fixes (Today)

- [ ] G1. human_redirect: عميل يقول "حوّلني لمدير" → AI يضع `[LOW_CONFIDENCE]` → ai_agent_enabled=false + ConversationNote
- [ ] G2. human_redirect: عميل يقول "موظف خدمة عملاء" → نفس السلوك
- [ ] G3. Email throttle: 4 رسائل من نفس العميل خلال دقيقة → email واحد فقط (الباقي يتخطّى throttle)
- [ ] G4. Log spam: production.log ما يحوي "[AccountNotifications] channel resolved"
- [ ] G5. Bot keywords: في bot-builder، كل keyword عنده ✕ يحذفه
- [ ] G6. KB Upload: ارفع TXT من Nova → خلال دقيقتين status: completed
- [ ] G7. Schedule: `php artisan schedule:list` يعرض kb:process-pending

### H. Regressions (تأكّد القديم ما اتكسر)

- [ ] H1. Inbox: عميل جديد يرسل → welcome auto-message يُرسَل
- [ ] H2. AiAutoReply: عميل يرسل سؤال عام → AI يردّ من KB
- [ ] H3. Bot rule: keyword يطابق → response ثابت يُرسَل (مش الـ AI)
- [ ] H4. Window status: 24h timer يحسب صح
- [ ] H5. Plan expiry: org بـ plan منتهي → middleware يبلوك
- [ ] H6. Bank transfer: تحويل جديد → يظهر في Nova للموافقة
- [ ] H7. Suspend: org يُعلَّق → resolveApiKey يبلوك الإرسال
- [ ] H8. Audit log: كل action يُسجَّل (ApproveTransfer, SetStatus, إلخ)

---

## نموذج تسجيل النتائج

لكل خطوة:
- ✅ نجحت → اشطب
- ❌ فشلت → سجّل: السلوك المتوقّع، السلوك الفعلي، رقم الخطأ من logs
- ⚠️ شغّالة جزئياً → سجّل ايش يشتغل وايش لا

في النهاية، أيّ ❌ يصير task جديد للإصلاح قبل ما نضيف فوقه.

---

## ابدأ من هنا

**القسم A** أوّل قسم — أبسط وأسرع. نمشي خطوة-خطوة ولا ننتقل للتالي إلا بعد ✓.
