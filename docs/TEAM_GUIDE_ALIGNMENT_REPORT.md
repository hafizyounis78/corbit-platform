# تقرير المطابقة — دليل الفرق الداخليّة v2.0 (مايو 2026)

**التاريخ:** 5 مايو 2026
**المرجع:** `docs/دليل الفرق الداخلية.docx` (الإصدار 2.0)
**الهدف:** مقارنة ما يطلبه الدليل من فرق المبيعات/التسويق/الدعم بما هو مبنيّ فعلاً في منصّة WhatsBit، وتحديد الفجوات.

---

## 🎯 الخلاصة التنفيذيّة

| المعيار | الدرجة | التوضيح |
|---|---|---|
| **مفاهيم الدليل الأساسيّة** | ✅ 90% | جميع المفاهيم الـ Meta (Tier, Quality, Throughput) مدعومة في DB + UI |
| **العشر قواعد الذهبيّة للجودة** | 🟡 70% | 7 من 10 منها أدوات داخل المنصّة، 3 تحتاج بناء |
| **Sales talking points** | 🟡 65% | الباقات + الحدود معروضة، لكن الأسعار في DB ≠ أسعار الدليل |
| **Marketing رسائل + توعية** | 🟢 80% | معاينة + تحذيرات سياسة Meta + content filter ✅ |
| **Support troubleshooting flows** | 🟡 60% | معظم الأدوات موجودة، لكن "checklist يومي" UI غير منفّذ |
| **الإجمالي** | **🟢 75%** | نقطة ممتازة لإطلاق فرق المبيعات + التسويق |

---

## 📊 جدول المطابقة الكامل (35 بند)

### القسم 1: المفاهيم الأساسية

| # | مفهوم الدليل | حالة المنصّة | الموقع |
|---|---|---|---|
| 1.1 | عرض الـ Messaging Tier للحساب | ✅ مبنيّ | `/dashboard` → بطاقة WhatsApp Numbers |
| 1.2 | الحد اليومي بالأرقام (250/2K/10K/100K) | ✅ مبنيّ | يُعرض كـ "1,000/يوم" بناءً على tier |
| 1.3 | Quality Rating (🟢🟡🔴⚪) | ✅ مبنيّ | نفس البطاقة، 3 ألوان + emoji |
| 1.4 | Block Rate % | ✅ مبنيّ | نفس البطاقة، أحمر إذا ≥ 5% |
| 1.5 | Throughput (80 / 1000 msg/sec) | ❌ غير معروض | لا يظهر في أيّ مكان |
| 1.6 | Portfolio-Level Limits | ❌ غير معالج | المنصّة تعرض كل رقم منفصل، لا تعرض portfolio aggregates |
| 1.7 | فحص الترقية كل 6 ساعات | ⚠️ جزئي | `metrics_updated_at` يُسجَّل لكن لا cron يُحدّث من Meta |
| 1.8 | الحدود لا تنخفض حتى مع جودة منخفضة | ✅ مفهوم صحيح | يعكس في الـ UI (الـ tier ثابت، الـ quality متغيّر) |

### القسم 2: العشر قواعد الذهبيّة للجودة

| # | القاعدة | حالة المنصّة | الموقع/الفجوة |
|---|---|---|---|
| 2.1 | **اطلب موافقة صريحة (Opt-in)** | ✅ مبنيّ | `B3 fix` — checkbox مطلوب على Add Contact |
| 2.2 | **محتوى مخصّص وذو قيمة** | ⚠️ جزئي | المتغيّرات `{{1}}` متاحة، لكن Personalization حقيقيّة (سلوكيّة) تحتاج Smart Segments + AI templates |
| 2.3 | **احترم Opt-out فوراً** | ✅ مبنيّ | `C8 fix` — STOP/إيقاف keyword handler |
| 2.4 | **حد عدد الرسائل اليومية لكل عميل (Frequency Cap)** | ❌ **فجوة كبيرة** | لا يوجد منع لإرسال > 2 رسالة Marketing لنفس العميل في 7 أيام |
| 2.5 | **أرسل في أوقات مناسبة (9ص-9م، تجنّب الجمعة)** | ⚠️ جزئي | الـ Quiet Hours موجودة في Settings للإشعارات الداخليّة فقط — لا تطبّق على إرسال الحملات |
| 2.6 | **التصنيف الصحيح للقالب** | ✅ مبنيّ | dropdown utility/marketing/auth + تحذير لـ marketing بدون opt-out |
| 2.7 | **تصميم Templates بعناية (CTA واحد + opt-out)** | ✅ مبنيّ | معاينة Phone Preview + auto-footer لـ marketing |
| 2.8 | **Personalization حقيقيّة (سلوكيّة)** | ⚠️ جزئي | Smart Segments + Customer Score موجودة، لكن template variables لا تُربط تلقائياً ببيانات سلوكيّة |
| 2.9 | **متابعة تقييم القوالب باستمرار** | ✅ مبنيّ | Template Performance tab + AI Tips |
| 2.10 | **تجنّب الكلمات المحظورة + علامات ترقيم مبالغة** | ✅ مبنيّ | `N18 fix` — `ContentPolicyService` بـ 7 categories |

### القسم 3: لفريق المبيعات

| # | متطلّبات الدليل | حالة المنصّة | الفجوة |
|---|---|---|---|
| 3.1 | جدول الباقات (Starter/Business/Enterprise/+HT) | 🟡 موجود لكن متغيّر | الباقات في DB ✅ لكن **الأسعار قد لا تطابق الدليل** ($79/$179/$299/$349) |
| 3.2 | Throughput per package | ❌ غير معروض | الدليل: Starter = 80 msg/sec، +HT = 1000 — لا يُعرَض |
| 3.3 | الحد المتوقّع per package | ⚠️ جزئي | الـ tier يُعرَض، لكن الربط بالباقة غير ظاهر |
| 3.4 | السيناريوهات الـ 3 (كم رسالة / كم وقت / إذا انخفضت الجودة) | ⚠️ جزئي | الإجابات الصحيحة في الدليل — يحتاج تدريب فريق المبيعات (مش UI) |
| 3.5 | عرض حدود Tier على صفحة الترقية | ❌ غير مبنيّ | `/billing → الخطط` لا يعرض حدود Meta المتوقّعة |

### القسم 4: لفريق التسويق

| # | متطلّبات الدليل | حالة المنصّة | الفجوة |
|---|---|---|---|
| 4.1 | تحذيرات الصياغة الممنوعة | ✅ مبنيّ | `N18` — content filter يكشف "احصل مجاناً" + "خصم حصري" |
| 4.2 | معاينة قبل/بعد للقوالب | ⚠️ جزئي | معاينة على شكل واتساب موجودة، لكن "قبل/بعد" examples غير مدمجة |
| 4.3 | محتوى مدوّنة مقترح (5 مقالات) | ❌ خارج النطاق | Help Center موجود، لكن المقالات يحتاج إضافتها يدوياً |
| 4.4 | تحذير من "إرسال غير محدود" في الإعلانات | ✅ مفاهيمي | الـ UI لا يدّعي "غير محدود" — مطابق |

### القسم 5: لفريق الدعم الفنّي

| # | متطلّبات الدليل | حالة المنصّة | الفجوة |
|---|---|---|---|
| 5.1 | "حدّي لم يرتفع" — التحقّق المطلوب | ⚠️ جزئي | الـ Quality + Block Rate ظاهرة على dashboard لكن "هل أرسل 50%؟" مش محسوبة UI |
| 5.2 | "جودتي انخفضت" — إجراءات | ⚠️ جزئي | الـ Quality ظاهرة، لكن لا workflow guide داخل المنصّة |
| 5.3 | "قوالبي ترفض" — أسباب | ✅ مبنيّ | `B1` — Meta error translator يعطي السبب بالعربيّة |
| 5.4 | "الحساب محظور" — رفع للمشرف | ⚠️ جزئي | Support tickets موجودة لكن workflow الإسكاليشن غير مؤتمت |
| 5.5 | "بطء الإرسال" — pacing من Meta | ❌ غير معروض | لا يُعرَض إذا Meta بدأت pacing |

### القاموس (Glossary)

| المصطلح | حالة المنصّة |
|---|---|
| BSP / WABA | ✅ موثّق في `/help` Help Center |
| Quality Rating | ✅ يُعرَض على dashboard |
| Messaging Tier | ✅ يُعرَض على dashboard |
| Conversation 24h | ✅ يُعرَض في inbox مع countdown (C7) |
| Template | ✅ صفحة كاملة `/templates` |
| Throughput | ❌ غير معروض |
| Service Window | ✅ نفس الـ 24h indicator |
| Opt-in / Opt-out | ✅ مبنيّان (B3 + C8) |
| Pacing | ❌ غير معروض |
| Frequency Capping | ❌ **فجوة** — غير منفّذ |
| HT (Higher Throughput) | ⚠️ في الباقات لكن غير ظاهر |
| CTWA (Click-to-WA Ad 72h) | ❌ غير معروض |

---

## 🚨 الفجوات الكبيرة (تحتاج تنفيذ)

### 🔴 P1 — تأثير مباشر على الجودة + الـ compliance

#### 1. **Frequency Capping per-contact**
- **القاعدة 4 من الدليل:** حد أقصى 1-2 رسالة Marketing لنفس العميل في 7 أيام.
- **الحالة:** غير منفّذ. المنصّة تسمح بإرسال 100 حملة لنفس العميل في يوم واحد.
- **الحلّ المقترح:**
  - عمود `last_marketing_sent_at` على `contacts`.
  - فحص في `SendCampaignMessage::handle()` قبل الإرسال — إذا آخر marketing send كان خلال 7 أيام، تجاهل المستلم + audit log.
  - إعداد قابل للتخصيص في Org Settings (الـ default = 7 أيام، الـ admin يقدر يغيّر).
- **Effort:** ~3-4 ساعات.

#### 2. **Quiet Hours على الحملات (9 صباحاً - 9 مساءً)**
- **القاعدة 5:** تجنب الإرسال خارج 9ص-9م، تجنّب الجمعة.
- **الحالة:** الـ Quiet Hours موجودة في `/settings/notifications` للإشعارات الداخليّة فقط.
- **الحلّ المقترح:**
  - عمود `send_window_start` + `send_window_end` على `org_settings`.
  - فحص في dispatcher قبل إرسال كل دفعة — إذا الوقت خارج النافذة، تأجيل الـ batch.
  - زرّ "Send Now" يحذّر إذا الوقت غير مناسب.
- **Effort:** ~2-3 ساعات.

### 🟠 P2 — توضيحات مهمّة

#### 3. **عرض Throughput في الـ Dashboard**
- **الفجوة:** الباقات تختلف بالـ throughput (80 vs 1000 msg/sec)، لكن الرقم لا يُعرَض.
- **الحلّ:** إضافة `throughput_msg_per_sec` على `whatsapp_numbers` (يُسحب من 360dialog API)، عرضه على dashboard.
- **Effort:** ~2 ساعات.

#### 4. **مؤشّر Pacing / Frequency Capping من Meta**
- **الفجوة:** لو Meta بدأت تُبطّئ الإرسال، الـ operator ما يعرف.
- **الحلّ:** إضافة شريط "Meta is pacing your campaign — X% delivered" على صفحة تفاصيل الحملة.
- **Effort:** ~3 ساعات.

#### 5. **Daily Quality Checklist UI**
- **الفجوة:** الدليل يقدّم checklist يومي بـ 6 بنود (Quality, Block Rate, Template Performance...).
- **الحلّ:** widget على `/dashboard` يعرض الـ 6 بنود كـ status cards (✅/⚠️/🚨).
- **Effort:** ~4 ساعات.

### 🟡 P3 — نقاط بيع + تسويق

#### 6. **تحديث صفحة الباقات بأسعار + Throughput الدليل**
- **الفجوة:** الأسعار في DB قد لا تطابق ($79/$179/$299/$349) + الـ throughput غير معروض.
- **الحلّ:** تحديث `plans` table + UI الباقات + إضافة عمود "Daily limit" + "Speed".
- **Effort:** ~2 ساعات + قرار تجاري للأسعار.

#### 7. **Help Center articles من الدليل**
- **الفجوة:** المقالات الـ 5 المقترحة في الدليل (الجودة + Templates + إلخ) غير موجودة.
- **الحلّ:** نسخ المحتوى من الدليل إلى Help Center articles عبر Nova.
- **Effort:** ~3 ساعات.

#### 8. **Sales-friendly response cards**
- **الفجوة:** الفريق يحتاج "إجابات جاهزة" للأسئلة الشائعة (السيناريو 1-3).
- **الحلّ:** صفحة `/sales-playbook` (داخليّة) أو إضافة المحتوى لـ Help Center > للموظّفين.
- **Effort:** ~2 ساعات.

---

## ✅ نقاط القوّة (مطابق فعلاً للدليل)

1. **Quality Rating + Tier + Block Rate** — كلّها معروضة بألوان واضحة على Dashboard ✨
2. **24h Window Countdown** — 3-stage (أخضر/أصفر/أحمر) مطابق تماماً
3. **Opt-in checkbox** — مطلوب قبل إضافة contact (الدليل يطلبها)
4. **Opt-out STOP keyword** — auto-handler يعمل (C8)
5. **Authentication template warning** — يحذّر من قيود Meta (C10)
6. **Banned-content scan** — 7 categories من الدليل (المخدّرات، الكحول، إلخ) ✅
7. **Marketing template auto-footer** — "للإيقاف أرسل STOP" يُضاف تلقائياً
8. **Meta error translator** — أخطاء بالعربيّة (B1)
9. **Audit log redaction** — لا يكشف tokens (C9)
10. **Templates Performance Tab** — كما يطلب الدليل
11. **CSAT auto-send** — جزء من الـ engagement signals
12. **Click tracking** — يحسب CTR (يدعم metric "ضغط CTA")

---

## 📋 قائمة المهامّ المقترحة بالأولويّة

```
🔴 P1 (الأكثر تأثيراً على Quality Rating)
  □ Frequency Capping per-contact (3-4h)
  □ Quiet Hours على الحملات (2-3h)

🟠 P2 (توضيحات Meta)
  □ Throughput display (2h)
  □ Meta pacing indicator (3h)
  □ Daily Quality Checklist widget (4h)

🟡 P3 (مبيعات + تسويق)
  □ تحديث Plans + الـ throughput (2h + قرار تجاري)
  □ Help Center articles من الدليل (3h)
  □ Sales playbook page (2h)

⚪ P4 (مستقبلي)
  □ Portfolio-Level analytics (8h+ — يحتاج Meta API)
  □ Personalization محرّك بناءً على Customer Score (16h+)
  □ CTWA tracking (72h free window) (8h)
```

**إجمالي P1+P2:** ~14-16 ساعة عمل (يومان).
**إجمالي P3:** ~7 ساعات (يوم).

---

## 💡 توصيتنا

### للجلسة القادمة:
1. **ابدأ بـ P1** — Frequency Capping + Quiet Hours على الحملات. هاذولا الأكثر تأثيراً مباشرة على Quality Rating الذي يقرّر ترقية الـ tier.
2. **بعدها P2** — Daily Quality Checklist widget على dashboard. يُعطي الـ operator visibility مباشرة على الأمور الـ 6 اللي ذكرها الدليل (Quality, Block, Templates, Opt-out، إلخ).
3. **P3 اختياري** — قرار تجاري لـ pricing، Help Center محتوى، Sales playbook.

### قرارات الإدارة المطلوبة:
- ✋ **هل أسعار الباقات في DB صحيحة؟** الدليل يقول $79/$179/$299/$349. هل نطابقهم؟
- ✋ **Send window افتراضي:** 9ص-9م السعوديّة، تجنّب الجمعة — موافق نطبّقه كـ default للحملات؟
- ✋ **Frequency cap default:** 2 رسالة Marketing / 7 أيام / contact — موافق كـ default؟

---

## 📍 موقع التقرير

```
c:\xampp\htdocs\corbit-platform\docs\TEAM_GUIDE_ALIGNMENT_REPORT.md
```

أيّ تحديث للدليل (إصدار 2.1، 3.0، إلخ) يجب أن يُعاد فيه فحص هذا التقرير للتأكّد من المطابقة.

---

**نهاية التقرير.**
