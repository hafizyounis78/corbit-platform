# CORBIT Platform — Backend Documentation
## دليل بناء الباك إند الكامل لمنصة كوربت

> هذا المستند يوثّق كل ما يحتاجه مطور الباك إند (أو ذكاء اصطناعي) لبناء باك إند متوافق 100% مع الفرونت إند الحالي.

---

## 1. نظرة عامة على المشروع

**CORBIT** (منصة المدار) هي منصة واتساب بزنس متكاملة (SaaS) تشمل:
- إدارة محادثات واتساب (Inbox) مع دعم وكيل AI
- حملات تسويقية مع تحليلات سلوكية
- إدارة جهات اتصال مع تسجيل نقاط (scoring) وتجزئة ذكية
- بناء بوتات بصري (Visual Flow Builder)
- مركز ذكاء اصطناعي (نماذج، قاعدة معرفة، نبرة، حواجز أمان)
- إدارة قوالب رسائل واتساب
- تحليلات وتقارير شاملة
- إدارة فرق ووكلاء مع توجيه ذكي
- فوترة واشتراكات ومحفظة
- تكاملات مع أنظمة خارجية (Shopify, HubSpot, Zapier...)
- إعدادات شاملة (عام، أمان، إشعارات، API، Webhooks، واتساب)

**التقنيات الحالية (Frontend):**
- Next.js 16.1.6 (App Router)
- React 19.2.3 + TypeScript 5
- لا يوجد أي CSS framework - كل الـ styling هو inline
- دعم ثنائي اللغة (عربي/إنجليزي) مع RTL
- ثيم داكن/فاتح

**المطلوب من الباك إند:**
- REST API (أو GraphQL) متوافقة مع كل البيانات الموجودة
- WebSocket للمحادثات الحية
- مصادقة وتفويض (Auth)
- تخزين ملفات (S3 أو مشابه)
- تكامل WhatsApp Business API
- خدمات AI (أو تكامل مع Claude/GPT)
- نظام Webhooks
- جدولة مهام (Cron Jobs)

---

## 2. هيكل قاعدة البيانات (Database Schema)

### 2.1 جدول `organizations`
المنظمة/الشركة التي تملك الحساب.

| العمود | النوع | الوصف | مطلوب | قيمة افتراضية |
|--------|------|-------|-------|--------------|
| id | UUID | المعرف الفريد | ✅ | auto |
| name | VARCHAR(255) | اسم الشركة | ✅ | - |
| logo_url | VARCHAR(500) | رابط الشعار | ❌ | null |
| timezone | VARCHAR(50) | المنطقة الزمنية | ✅ | "Asia/Riyadh" |
| currency | VARCHAR(3) | العملة | ✅ | "SAR" |
| language | ENUM('ar','en') | اللغة الافتراضية | ✅ | "ar" |
| description | TEXT | وصف الشركة | ❌ | null |
| plan_id | FK → plans.id | الخطة الحالية | ✅ | - |
| wallet_balance | DECIMAL(12,2) | رصيد المحفظة | ✅ | 0 |
| created_at | TIMESTAMP | تاريخ الإنشاء | ✅ | now() |
| updated_at | TIMESTAMP | تاريخ التحديث | ✅ | now() |

---

### 2.2 جدول `users` (أعضاء الفريق / الوكلاء)

| العمود | النوع | الوصف | مطلوب | ملاحظات |
|--------|------|-------|-------|---------|
| id | UUID | المعرف الفريد | ✅ | - |
| org_id | FK → organizations.id | المنظمة | ✅ | - |
| name | VARCHAR(255) | الاسم | ✅ | - |
| email | VARCHAR(255) | البريد الإلكتروني | ✅ | unique per org |
| password_hash | VARCHAR(255) | كلمة المرور المشفرة | ✅ | bcrypt |
| role | ENUM('admin','supervisor','agent') | الدور | ✅ | "agent" |
| team_id | FK → teams.id | الفريق | ❌ | null |
| avatar_url | VARCHAR(500) | الصورة الشخصية | ❌ | null |
| is_online | BOOLEAN | حالة الاتصال | ✅ | false |
| status | ENUM('online','offline','busy') | الحالة التفصيلية | ✅ | "offline" |
| two_factor_enabled | BOOLEAN | المصادقة الثنائية | ✅ | false |
| two_factor_secret | VARCHAR(255) | سر 2FA | ❌ | null |
| last_active_at | TIMESTAMP | آخر نشاط | ❌ | null |
| created_at | TIMESTAMP | تاريخ الإنشاء | ✅ | now() |
| updated_at | TIMESTAMP | تاريخ التحديث | ✅ | now() |

---

### 2.3 جدول `user_schedules` (جدول العمل)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| user_id | FK → users.id | المستخدم |
| day_of_week | ENUM('sun','mon','tue','wed','thu','fri','sat') | اليوم |
| is_available | BOOLEAN | متاح |
| start_time | TIME | بداية الدوام (اختياري) |
| end_time | TIME | نهاية الدوام (اختياري) |

---

### 2.4 جدول `user_skills` (مهارات الوكيل)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| user_id | FK → users.id | المستخدم |
| skill | VARCHAR(100) | المهارة (مثل: "Sales", "Technical", "Billing") |

---

### 2.5 جدول `teams`

| العمود | النوع | الوصف | ملاحظات |
|--------|------|-------|---------|
| id | UUID | المعرف | - |
| org_id | FK → organizations.id | المنظمة | - |
| name | VARCHAR(255) | اسم الفريق | - |
| name_ar | VARCHAR(255) | الاسم بالعربي | - |
| color | VARCHAR(7) | لون الفريق | hex مثل "#4A9EFF" |
| lead_id | FK → users.id | قائد الفريق | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

---

### 2.6 جدول `team_routing_rules` (قواعد التوجيه)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| team_id | FK → teams.id | الفريق |
| rule_type | ENUM('round_robin','skill_based','vip_priority','auto_escalation','ai_first') | نوع القاعدة |
| is_enabled | BOOLEAN | مفعّل |
| config | JSONB | إعدادات إضافية (مثل: timeout للتصعيد) |
| priority | INT | ترتيب الأولوية |

---

### 2.7 جدول `contacts` (جهات الاتصال / العملاء)

| العمود | النوع | الوصف | ملاحظات |
|--------|------|-------|---------|
| id | UUID | المعرف | - |
| org_id | FK → organizations.id | المنظمة | - |
| name | VARCHAR(255) | الاسم | - |
| phone | VARCHAR(20) | رقم الهاتف | E.164 format, unique per org |
| email | VARCHAR(255) | البريد | ❌ |
| city | VARCHAR(100) | المدينة | ❌ |
| country | VARCHAR(2) | كود الدولة | "SA" |
| language | ENUM('ar','en') | لغة العميل المفضلة | "ar" |
| source | VARCHAR(50) | مصدر العميل | "ad", "whatsapp", "search", "referral", "linkedin" |
| status | ENUM('active','inactive','blocked') | الحالة | "active" |
| engagement_score | INT | نقاط التفاعل (0-100) | 0 |
| lifetime_value | DECIMAL(12,2) | القيمة الإجمالية | 0 |
| total_orders | INT | عدد الطلبات | 0 |
| avg_order_value | DECIMAL(12,2) | متوسط قيمة الطلب | 0 |
| notes | TEXT | ملاحظات | ❌ |
| is_online | BOOLEAN | متصل الآن | false |
| last_active_at | TIMESTAMP | آخر نشاط | ❌ |
| joined_at | TIMESTAMP | تاريخ الانضمام | now() |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

---

### 2.8 جدول `contact_tags`

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| contact_id | FK → contacts.id | جهة الاتصال |
| tag | VARCHAR(100) | الوسم (مثل: "VIP", "Sales", "New") |

---

### 2.9 جدول `contact_behavior` (سلوك العميل - إحصائيات مجمّعة)

| العمود | النوع | الوصف |
|--------|------|-------|
| contact_id | FK → contacts.id | PK |
| open_rate | DECIMAL(5,2) | معدل الفتح % |
| click_rate | DECIMAL(5,2) | معدل النقر % |
| reply_rate | DECIMAL(5,2) | معدل الرد % |
| total_purchases | INT | عدد المشتريات |
| last_campaign_result | VARCHAR(255) | نتيجة آخر حملة |

---

### 2.10 جدول `contact_timeline` (سجل نشاط العميل)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| contact_id | FK → contacts.id | جهة الاتصال |
| event_type | ENUM('campaign','order','chat','system') | نوع الحدث |
| description | VARCHAR(500) | وصف الحدث |
| description_ar | VARCHAR(500) | الوصف بالعربي |
| metadata | JSONB | بيانات إضافية |
| created_at | TIMESTAMP | وقت الحدث |

---

### 2.11 جدول `conversations` (المحادثات)

| العمود | النوع | الوصف | ملاحظات |
|--------|------|-------|---------|
| id | UUID | المعرف | - |
| org_id | FK → organizations.id | المنظمة | - |
| contact_id | FK → contacts.id | العميل | - |
| assigned_user_id | FK → users.id | الوكيل المسند إليه | ❌ null = غير مسند |
| assigned_team_id | FK → teams.id | الفريق المسند إليه | ❌ |
| status | ENUM('open','pending','solved','closed') | الحالة | "open" |
| priority | ENUM('high','medium','low') | الأولوية | "medium" |
| channel | ENUM('whatsapp','web','api') | القناة | "whatsapp" |
| tag | VARCHAR(100) | الوسم/الفئة | ❌ مثل "Sales", "Support" |
| sentiment | ENUM('positive','negative','neutral') | تحليل المشاعر (AI) | ❌ |
| intent | VARCHAR(255) | نية العميل (AI) | ❌ مثل "Offer inquiry" |
| ai_agent_enabled | BOOLEAN | وكيل AI نشط | false |
| ai_confidence | DECIMAL(5,2) | ثقة AI | ❌ |
| ai_replies_count | INT | عدد ردود AI | 0 |
| unread_count | INT | الرسائل غير المقروءة | 0 |
| last_message_at | TIMESTAMP | وقت آخر رسالة | - |
| resolved_at | TIMESTAMP | وقت الحل | ❌ |
| first_response_at | TIMESTAMP | وقت أول رد | ❌ |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

---

### 2.12 جدول `messages` (رسائل المحادثة)

| العمود | النوع | الوصف | ملاحظات |
|--------|------|-------|---------|
| id | UUID | المعرف | - |
| conversation_id | FK → conversations.id | المحادثة | - |
| sender_type | ENUM('customer','agent','bot','system') | نوع المرسل | - |
| sender_id | UUID | معرف المرسل | user_id أو contact_id أو bot_id |
| content | TEXT | نص الرسالة | - |
| message_type | ENUM('text','image','video','audio','document','location','template','buttons','quick_reply') | نوع الرسالة | "text" |
| media_url | VARCHAR(500) | رابط الوسائط | ❌ |
| media_mime_type | VARCHAR(100) | نوع الملف | ❌ |
| whatsapp_message_id | VARCHAR(100) | معرف واتساب | ❌ للتتبع |
| status | ENUM('sent','delivered','read','failed') | حالة التسليم | "sent" |
| metadata | JSONB | بيانات إضافية | buttons, quick_replies, etc. |
| created_at | TIMESTAMP | وقت الإرسال | - |

---

### 2.13 جدول `quick_replies` (ردود سريعة معدّة مسبقاً)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| text | VARCHAR(500) | نص الرد |
| text_ar | VARCHAR(500) | النص بالعربي |
| category | VARCHAR(100) | الفئة |
| created_at | TIMESTAMP | - |

---

### 2.14 جدول `campaigns` (الحملات)

| العمود | النوع | الوصف | ملاحظات |
|--------|------|-------|---------|
| id | UUID | المعرف | - |
| org_id | FK → organizations.id | المنظمة | - |
| name | VARCHAR(255) | اسم الحملة | - |
| name_ar | VARCHAR(255) | الاسم بالعربي | ❌ |
| status | ENUM('draft','scheduled','active','completed','paused') | الحالة | "draft" |
| template_id | FK → templates.id | القالب المستخدم | ❌ |
| segment_filter | JSONB | فلتر الشريحة المستهدفة | مثل: {"tags": ["VIP"], "status": "active"} |
| segment_name | VARCHAR(255) | اسم الشريحة | - |
| segment_id | FK → segments.id | الشريحة المحفوظة (اختياري) | ❌ |
| scheduled_at | TIMESTAMP | وقت الإرسال المجدول | ❌ |
| scheduled_time | VARCHAR(10) | وقت الإرسال (HH:MM) | ❌ |
| total_recipients | INT | عدد المستلمين | 0 |
| delivery_rate | DECIMAL(5,2) | معدل التسليم % | 0 |
| read_rate | DECIMAL(5,2) | معدل القراءة % | 0 |
| reply_rate | DECIMAL(5,2) | معدل الرد % | 0 |
| cost | DECIMAL(12,2) | التكلفة | 0 |
| roi | VARCHAR(20) | العائد على الاستثمار | ❌ مثل "+340%" |
| started_at | TIMESTAMP | وقت البدء الفعلي | ❌ |
| completed_at | TIMESTAMP | وقت الاكتمال | ❌ |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

---

### 2.15 جدول `campaign_behavior` (مقاييس سلوكية للحملة)

| العمود | النوع | الوصف |
|--------|------|-------|
| campaign_id | FK → campaigns.id | PK |
| opened | INT | عدد من فتحوا |
| clicked | INT | عدد من نقروا |
| replied | INT | عدد من ردوا |
| converted | INT | عدد التحويلات |
| unsubscribed | INT | عدد إلغاء الاشتراك |

---

### 2.16 جدول `campaign_segments` (أداء حسب الشريحة)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| campaign_id | FK → campaigns.id | الحملة |
| segment_name | VARCHAR(255) | اسم الشريحة |
| sent | INT | عدد المرسل |
| open_rate | DECIMAL(5,2) | معدل الفتح % |
| click_rate | DECIMAL(5,2) | معدل النقر % |
| conversion_rate | DECIMAL(5,2) | معدل التحويل % |

---

### 2.17 جدول `campaign_timeline` (الأحداث الزمنية للحملة)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| campaign_id | FK → campaigns.id | الحملة |
| event_time | VARCHAR(10) | الوقت (HH:MM) |
| event_description | VARCHAR(255) | وصف الحدث |
| event_description_ar | VARCHAR(255) | الوصف بالعربي |
| metric_value | INT | القيمة |

---

### 2.18 جدول `campaign_ai_insights` (رؤى AI للحملة)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| campaign_id | FK → campaigns.id | الحملة |
| insight_text | TEXT | النص بالإنجليزي |
| insight_text_ar | TEXT | النص بالعربي |
| insight_type | ENUM('tip','suggestion','warning') | النوع |
| created_at | TIMESTAMP | - |

---

### 2.19 جدول `templates` (قوالب رسائل واتساب)

| العمود | النوع | الوصف | ملاحظات |
|--------|------|-------|---------|
| id | UUID | المعرف | - |
| org_id | FK → organizations.id | المنظمة | - |
| name | VARCHAR(255) | اسم القالب | - |
| name_ar | VARCHAR(255) | الاسم بالعربي | ❌ |
| category | ENUM('utility','marketing','authentication') | الفئة | - |
| language | VARCHAR(10) | اللغات المدعومة | "ar+en", "ar", "en" |
| status | ENUM('approved','pending','rejected') | حالة الموافقة | "pending" |
| body | TEXT | نص القالب مع {{N}} placeholders | - |
| body_ar | TEXT | النص بالعربي | ❌ |
| header | VARCHAR(255) | العنوان | ❌ |
| header_ar | VARCHAR(255) | العنوان بالعربي | ❌ |
| footer | VARCHAR(255) | التذييل | ❌ |
| footer_ar | VARCHAR(255) | التذييل بالعربي | ❌ |
| variables | JSONB | قائمة المتغيرات | ["name", "code", "amount"] |
| buttons | JSONB | الأزرار | [{"text": "Shop", "text_ar": "تسوق", "type": "url"}] |
| whatsapp_template_id | VARCHAR(100) | معرف القالب في واتساب | ❌ |
| total_uses | INT | عدد مرات الاستخدام | 0 |
| open_rate | DECIMAL(5,2) | معدل الفتح % | 0 |
| click_rate | DECIMAL(5,2) | معدل النقر % | 0 |
| ai_score | INT | تقييم AI (0-100) | 0 |
| rejection_reason | TEXT | سبب الرفض | ❌ |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

---

### 2.20 جدول `template_performance` (أداء القالب التفصيلي)

| العمود | النوع | الوصف |
|--------|------|-------|
| template_id | FK → templates.id | PK |
| sent | INT | عدد المرسل |
| delivered | INT | عدد الوصول |
| read | INT | عدد القراءة |
| replied | INT | عدد الرد |
| failed | INT | عدد الفشل |

---

### 2.21 جدول `template_ai_tips` (توصيات AI للقالب)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| template_id | FK → templates.id | القالب |
| tip_text | TEXT | النص بالإنجليزي |
| tip_text_ar | TEXT | النص بالعربي |

---

### 2.22 جدول `bots` (البوتات)

| العمود | النوع | الوصف | ملاحظات |
|--------|------|-------|---------|
| id | UUID | المعرف | - |
| org_id | FK → organizations.id | المنظمة | - |
| name | VARCHAR(255) | اسم البوت | - |
| name_ar | VARCHAR(255) | الاسم بالعربي | ❌ |
| description | TEXT | الوصف | ❌ |
| description_ar | TEXT | الوصف بالعربي | ❌ |
| status | ENUM('published','testing','unpublished','draft') | الحالة | "draft" |
| trigger_keywords | TEXT | الكلمات المحفّزة (مفصولة بفاصلة) | - |
| trigger_keywords_ar | TEXT | الكلمات بالعربي | ❌ |
| is_ai_enabled | BOOLEAN | يستخدم AI | false |
| total_conversations | INT | عدد المحادثات الكلي | 0 |
| total_sessions | INT | عدد الجلسات | 0 |
| completed_sessions | INT | الجلسات المكتملة | 0 |
| dropped_sessions | INT | الجلسات المنسحبة | 0 |
| avg_session_time | VARCHAR(20) | متوسط وقت الجلسة | ❌ |
| satisfaction_score | INT | تقييم الرضا (0-100 نسبة مئوية) | 0 |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

---

### 2.23 جدول `bot_flow_nodes` (عُقد تدفق البوت)

| العمود | النوع | الوصف | ملاحظات |
|--------|------|-------|---------|
| id | UUID | المعرف | - |
| bot_id | FK → bots.id | البوت | - |
| node_id | VARCHAR(50) | معرف العقدة داخل التدفق | مثل "n1", "n2" |
| type | ENUM('trigger','message','buttons','input','condition','ai','api','transfer','end') | نوع العقدة | - |
| label | VARCHAR(255) | التسمية | - |
| label_ar | VARCHAR(255) | التسمية بالعربي | ❌ |
| position_x | INT | الموقع الأفقي (%) | للعرض في الكانفاس |
| position_y | INT | الموقع العمودي (px) | للعرض في الكانفاس |
| next_nodes | JSONB | العقد التالية | ["n2", "n3"] |
| config | JSONB | إعدادات العقدة | يختلف حسب النوع - انظر أدناه |

**إعدادات config حسب نوع العقدة:**

```jsonc
// trigger
{ "keywords": "hello, hi, hey" }

// message
{ "text": "Welcome! How can I help?", "image_url": null }

// buttons
{ "buttons": ["Products", "Support", "Track Order"] }

// input
{ "input_type": "text|number|email|phone", "prompt": "Enter your choice" }

// condition
{ "expression": "Order success?", "true_node": "n10", "false_node": "n11" }

// ai
{ "knowledge_base": true, "conversation_context": true, "auto_escalate": false, "confidence_threshold": 80 }

// api
{ "method": "GET|POST|PUT|DELETE", "url": "/api/products", "headers": {} }

// transfer
{ "target_team": "Support", "target_user_id": null }

// end
{}
```

---

### 2.24 جدول `ai_models` (نماذج AI)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| name | VARCHAR(255) | اسم النموذج |
| name_ar | VARCHAR(255) | الاسم بالعربي |
| description | VARCHAR(500) | الوصف |
| description_ar | VARCHAR(500) | الوصف بالعربي |
| is_active | BOOLEAN | مفعّل |
| accuracy | DECIMAL(5,2) | نسبة الدقة % |
| daily_usage | INT | الاستخدام اليومي |

**النماذج المطلوبة (6 نماذج):**
1. **Reply Assist** (مساعد الردود) - يقترح ردود ذكية للوكيل
2. **Summarization** (التلخيص) - تلخيص تلقائي للمحادثات
3. **Classifier** (التصنيف) - تصنيف الرسائل تلقائياً
4. **Sentiment Analysis** (تحليل المشاعر) - تحليل مشاعر العميل
5. **Smart Routing** (التوجيه الذكي) - توجيه المحادثة للفريق المناسب
6. **Translation** (الترجمة) - ترجمة فورية عربي↔إنجليزي

---

### 2.25 جدول `knowledge_base_docs` (قاعدة المعرفة)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| name | VARCHAR(255) | اسم المستند |
| name_ar | VARCHAR(255) | الاسم بالعربي |
| file_url | VARCHAR(500) | رابط الملف |
| file_type | ENUM('pdf','doc','txt','csv') | نوع الملف |
| page_count | INT | عدد الصفحات |
| total_queries | INT | عدد الاستعلامات |
| accuracy | DECIMAL(5,2) | نسبة الدقة % |
| embedding_status | ENUM('pending','processing','completed','failed') | حالة المعالجة |
| created_at | TIMESTAMP | - |

---

### 2.26 جدول `ai_tone_settings` (إعدادات نبرة AI)

| العمود | النوع | الوصف |
|--------|------|-------|
| org_id | FK → organizations.id | PK |
| tone | ENUM('friendly','formal','casual','sales') | النبرة المختارة |
| custom_instructions | TEXT | تعليمات مخصصة |

---

### 2.27 جدول `ai_guardrails` (حواجز أمان AI)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| rule_type | VARCHAR(100) | نوع القاعدة |
| description | VARCHAR(500) | الوصف |
| description_ar | VARCHAR(500) | الوصف بالعربي |
| is_enabled | BOOLEAN | مفعّل |

**القواعد المطلوبة:**
1. `profanity_filter` - فلتر الألفاظ غير اللائقة
2. `competitor_guard` - عدم ذكر المنافسين
3. `data_protection` - عدم طلب بيانات حساسة
4. `human_redirect` - تحويل للموظف عند عدم اليقين
5. `language_detection` - الرد بنفس لغة العميل

---

### 2.28 جدول `integrations` (التكاملات)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | VARCHAR(50) | المعرف (مثل "shopify") |
| name | VARCHAR(255) | اسم العلامة التجارية |
| category | ENUM('ecommerce','crm','automation','payment','productivity') | الفئة |
| description | TEXT | الوصف |
| description_ar | TEXT | الوصف بالعربي |
| icon | VARCHAR(10) | إيموجي الأيقونة |
| color | VARCHAR(7) | اللون |
| is_popular | BOOLEAN | مميز |
| features | JSONB | قائمة المميزات |
| features_ar | JSONB | المميزات بالعربي |

---

### 2.29 جدول `org_integrations` (تكاملات المنظمة)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| integration_id | FK → integrations.id | التكامل |
| is_connected | BOOLEAN | مربوط |
| config | JSONB | إعدادات الربط (API keys, URLs, etc.) |
| last_sync_at | TIMESTAMP | آخر مزامنة |
| created_at | TIMESTAMP | - |

---

### 2.30 جدول `plans` (خطط الاشتراك)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| name | VARCHAR(100) | الاسم |
| name_ar | VARCHAR(100) | الاسم بالعربي |
| price_monthly | DECIMAL(10,2) | السعر الشهري |
| max_agents | INT | أقصى عدد وكلاء |
| max_conversations | INT | أقصى عدد محادثات |
| max_ai_credits | INT | أقصى عدد رصيد AI |
| features | JSONB | قائمة المميزات |
| features_ar | JSONB | المميزات بالعربي |
| is_active | BOOLEAN | متاح للاشتراك |

**الخطط المطلوبة:**

| الخطة | السعر | الوكلاء | المحادثات | AI |
|-------|-------|--------|----------|-----|
| Starter (المبتدئ) | 299 SAR | 3 | 1,000 | 500 |
| Business (الأعمال) | 799 SAR | 10 | 5,000 | 2,000 |
| Enterprise (المؤسسات) | 1,999 SAR | 50 | 25,000 | 10,000 |

---

### 2.31 جدول `transactions` (المعاملات المالية)

| العمود | النوع | الوصف | ملاحظات |
|--------|------|-------|---------|
| id | UUID | المعرف | - |
| org_id | FK → organizations.id | المنظمة | - |
| type | ENUM('charge','payment','refund') | النوع | - |
| description | VARCHAR(255) | الوصف | - |
| description_ar | VARCHAR(255) | الوصف بالعربي | ❌ |
| amount | DECIMAL(12,2) | المبلغ | موجب أو سالب |
| reference | VARCHAR(50) | رقم المرجع | مثل "TXN-001" |
| created_at | TIMESTAMP | - | - |

---

### 2.32 جدول `invoices` (الفواتير)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | VARCHAR(50) | رقم الفاتورة (INV-YYYY-NNN) |
| org_id | FK → organizations.id | المنظمة |
| amount | DECIMAL(12,2) | المبلغ |
| status | ENUM('paid','unpaid','overdue') | الحالة |
| description | VARCHAR(255) | الوصف |
| description_ar | VARCHAR(255) | الوصف بالعربي |
| period_start | DATE | بداية الفترة |
| period_end | DATE | نهاية الفترة |
| created_at | TIMESTAMP | - |

---

### 2.33 جدول `usage_tracking` (تتبع الاستهلاك اليومي)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| date | DATE | التاريخ |
| conversations_used | INT | المحادثات المستخدمة |
| ai_credits_used | INT | رصيد AI المستخدم |
| messages_sent | INT | الرسائل المرسلة |
| messages_delivered | INT | الرسائل الواصلة |
| messages_read | INT | الرسائل المقروءة |
| messages_replied | INT | الرسائل المردود عليها |

---

### 2.34 جدول `api_keys` (مفاتيح API)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| key_hash | VARCHAR(255) | المفتاح المشفر |
| key_prefix | VARCHAR(10) | أول أحرف المفتاح (للعرض) |
| name | VARCHAR(100) | اسم المفتاح |
| is_active | BOOLEAN | نشط |
| last_used_at | TIMESTAMP | آخر استخدام |
| created_at | TIMESTAMP | - |

---

### 2.35 جدول `webhooks`

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| url | VARCHAR(500) | رابط الـ webhook |
| events | JSONB | الأحداث المشترك فيها |
| is_active | BOOLEAN | نشط |
| secret | VARCHAR(255) | سر التحقق |
| last_triggered_at | TIMESTAMP | آخر تنفيذ |
| created_at | TIMESTAMP | - |

---

### 2.36 جدول `whatsapp_numbers` (أرقام واتساب)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| phone_number | VARCHAR(20) | الرقم |
| display_name | VARCHAR(100) | الاسم المعروض |
| display_name_ar | VARCHAR(100) | الاسم بالعربي |
| whatsapp_business_id | VARCHAR(100) | معرف واتساب بزنس |
| is_verified | BOOLEAN | موثق |
| status | ENUM('active','inactive') | الحالة |

---

### 2.37 جدول `notifications`

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| user_id | FK → users.id | المستخدم (❌ = للجميع) |
| title | VARCHAR(255) | العنوان |
| title_ar | VARCHAR(255) | العنوان بالعربي |
| message | TEXT | الرسالة |
| message_ar | TEXT | الرسالة بالعربي |
| icon | VARCHAR(50) | اسم الأيقونة |
| color | VARCHAR(7) | اللون |
| is_read | BOOLEAN | مقروء |
| created_at | TIMESTAMP | - |

---

### 2.38 جدول `sessions` (جلسات المستخدمين)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| user_id | FK → users.id | المستخدم |
| token_hash | VARCHAR(255) | التوكن المشفر |
| ip_address | VARCHAR(45) | عنوان IP |
| user_agent | TEXT | المتصفح |
| expires_at | TIMESTAMP | وقت الانتهاء |
| created_at | TIMESTAMP | - |

---

### 2.39 جدول `audit_logs` (سجل التدقيق)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| user_id | FK → users.id | المنفذ |
| action | VARCHAR(100) | الإجراء |
| resource_type | VARCHAR(100) | نوع المورد |
| resource_id | UUID | معرف المورد |
| details | JSONB | التفاصيل |
| ip_address | VARCHAR(45) | IP |
| created_at | TIMESTAMP | - |

---

> **تم استبدال هذا الجدول.** انظر القسم 18.9 للهيكل النهائي المعتمد.

### 2.40 جدول `notification_preferences` (تفضيلات الإشعارات)

| العمود | النوع | الوصف |
|--------|------|-------|
| user_id | FK → users.id | PK |
| email_orders | BOOLEAN | إشعار طلبات بريدية |
| email_feedback | BOOLEAN | إشعار تقييمات |
| email_team_alerts | BOOLEAN | تنبيهات الفريق |
| sms_enabled | BOOLEAN | إشعارات SMS |
| slack_enabled | BOOLEAN | إشعارات Slack |
| slack_webhook_url | VARCHAR(500) | رابط Slack |

---

## 3. واجهات API المطلوبة (REST Endpoints)

### 3.1 المصادقة (Authentication)

```
POST   /api/auth/login              → { email, password } → { token, user, org }
POST   /api/auth/logout             → invalidate token
POST   /api/auth/refresh            → refresh JWT token
POST   /api/auth/forgot-password    → { email }
POST   /api/auth/reset-password     → { token, newPassword }
POST   /api/auth/2fa/setup          → إعداد المصادقة الثنائية
POST   /api/auth/2fa/verify         → التحقق من رمز 2FA
```

---

### 3.2 Dashboard

```
GET    /api/dashboard/stats         → إحصائيات عامة
```

**الاستجابة المطلوبة:**
```json
{
  "totalConversations": { "value": 1247, "change": "+12%", "sparkline": [3,5,4,7,6,8,9,7,10,8] },
  "activeAgents": { "value": 24, "change": "+2", "sparkline": [...] },
  "avgResponseTime": { "value": "3.2 min", "change": "-18%", "sparkline": [...] },
  "campaignsSent": { "value": 38, "change": "+5", "sparkline": [...] },
  "sla": { "value": 94, "percentage": true },
  "csat": { "value": 4.3, "max": 5 },
  "walletBalance": 12450,
  "aiUsage": { "suggestions": 342, "accepted": "68%", "credits": 1240 },
  "whatsappNumbers": [
    { "name": "Main", "nameAr": "الرئيسي", "number": "+966 55 123 4567", "status": "connected" }
  ],
  "recentConversations": [ /* أول 4 محادثات */ ]
}
```

---

### 3.3 المحادثات (Conversations / Inbox)

```
GET    /api/conversations                → قائمة المحادثات
       ?status=open|pending|solved|closed
       ?filter=all|unread|open
       ?search=text
       ?page=1&limit=50

GET    /api/conversations/:id            → تفاصيل محادثة واحدة
GET    /api/conversations/:id/messages   → رسائل المحادثة
       ?page=1&limit=50

POST   /api/conversations/:id/messages   → إرسال رسالة جديدة
       { content, messageType, mediaUrl }

PATCH  /api/conversations/:id            → تحديث المحادثة
       { status, priority, assignedUserId, assignedTeamId, aiAgentEnabled }

POST   /api/conversations/:id/resolve    → حل المحادثة
POST   /api/conversations/:id/assign     → إسناد المحادثة { userId, teamId }
POST   /api/conversations/:id/ai/toggle  → تشغيل/إيقاف وكيل AI
POST   /api/conversations/:id/ai/suggest → طلب اقتراح AI
POST   /api/conversations/:id/notes      → إضافة ملاحظة { text }
```

**WebSocket Events (للمحادثات الحية):**
```
// Client → Server
ws:join_conversation    { conversationId }
ws:leave_conversation   { conversationId }
ws:send_message         { conversationId, content, type }
ws:typing               { conversationId }

// Server → Client
ws:new_message          { message }
ws:message_status       { messageId, status: "delivered"|"read" }
ws:conversation_updated { conversation }
ws:typing_indicator     { conversationId, senderType, isTyping }
ws:ai_response          { conversationId, suggestion }
ws:contact_online       { contactId, isOnline }
```

---

### 3.4 الحملات (Campaigns)

```
GET    /api/campaigns                    → قائمة الحملات
       ?status=all|active|completed|scheduled|draft|paused
       ?page=1&limit=20

GET    /api/campaigns/:id                → تفاصيل حملة (مع behavior, segments, timeline, aiInsights)
POST   /api/campaigns                    → إنشاء حملة جديدة
PATCH  /api/campaigns/:id                → تعديل حملة
DELETE /api/campaigns/:id                → أرشفة حملة
POST   /api/campaigns/:id/duplicate      → تكرار حملة
POST   /api/campaigns/:id/send           → بدء إرسال الحملة
POST   /api/campaigns/:id/pause          → إيقاف مؤقت
POST   /api/campaigns/:id/resume         → استئناف
GET    /api/campaigns/:id/export         → تصدير التقرير (CSV)
POST   /api/campaigns/:id/retarget       → إعادة استهداف من لم يفتحوا

GET    /api/campaigns/stats              → إحصائيات عامة
       { active: 3, completed: 18, scheduled: 3, totalRoi: "+320%", avgOpen: "92.4%", convRate: "18.6%" }

POST   /api/campaigns/ai/generate        → AI Campaign Builder
       { type: "retarget"|"abandoned_cart"|"occasion"|"upsell"|"winback"|"loyalty", description }
       → يُرجع مسودة حملة

GET    /api/campaigns/ai/insights        → رؤى AI سريعة
```

---

### 3.5 جهات الاتصال (Contacts)

```
GET    /api/contacts                     → قائمة جهات الاتصال
       ?status=all|active|inactive|vip (vip ليس حالة بل يُفلتر بوسم VIP في tags)
       ?search=text (بالاسم أو الرقم)
       ?tags=VIP,Sales (فلتر بالوسوم)
       ?page=1&limit=50

GET    /api/contacts/:id                 → تفاصيل جهة اتصال (مع behavior, timeline, aiNotes)
POST   /api/contacts                     → إضافة جهة اتصال
PATCH  /api/contacts/:id                 → تعديل
DELETE /api/contacts/:id                 → حذف

POST   /api/contacts/:id/tags           → إضافة وسم { tag }
DELETE /api/contacts/:id/tags/:tag      → إزالة وسم

POST   /api/contacts/:id/block          → حظر
POST   /api/contacts/:id/unblock        → فك الحظر

POST   /api/contacts/:id/message        → إرسال رسالة مباشرة
POST   /api/contacts/:id/add-to-campaign → إضافة لحملة { campaignId }

POST   /api/contacts/import              → استيراد (CSV file upload)
GET    /api/contacts/export              → تصدير (CSV download)

GET    /api/contacts/stats               → إحصائيات
       { total, active, vip, newThisMonth, atRisk, avgScore }

GET    /api/contacts/tags                → جميع الوسوم المتاحة

POST   /api/contacts/ai/segments         → شرائح AI ذكية
       → يُرجع قائمة شرائح تلقائية مع أعدادها

GET    /api/contacts/ai/insights         → رؤى AI للعملاء
```

---

### 3.6 القوالب (Templates)

```
GET    /api/templates                    → قائمة القوالب
       ?status=all|approved|pending|rejected
       ?category=utility|marketing|authentication
       ?search=text
       ?page=1&limit=20

GET    /api/templates/:id                → تفاصيل قالب (مع performance, aiTips)
POST   /api/templates                    → إنشاء قالب
PATCH  /api/templates/:id                → تعديل قالب
DELETE /api/templates/:id                → حذف قالب
POST   /api/templates/:id/duplicate      → تكرار قالب
POST   /api/templates/:id/resubmit       → إعادة تقديم (بعد الرفض)
POST   /api/templates/:id/send-campaign  → إرسال حملة بهذا القالب

GET    /api/templates/stats              → إحصائيات
       { total, approved, pending, rejected, totalUses, avgOpen }

POST   /api/templates/ai/generate        → AI Template Builder
       { type, description }
       → يُرجع مسودة قالب

POST   /api/templates/ai/analyze         → تحليل AI لقالب
       { body, category }
       → يُرجع { aiScore, tips[] }
```

---

### 3.7 البوتات (Bot Builder)

```
GET    /api/bots                         → قائمة البوتات
       ?status=all|published|testing|unpublished|draft

GET    /api/bots/:id                     → تفاصيل بوت (مع stats)
POST   /api/bots                         → إنشاء بوت
PATCH  /api/bots/:id                     → تعديل بوت
DELETE /api/bots/:id                     → حذف بوت

GET    /api/bots/:id/flow                → الحصول على التدفق (كل العقد)
PUT    /api/bots/:id/flow                → حفظ التدفق بالكامل (مصفوفة عقد)

POST   /api/bots/:id/flow/nodes          → إضافة عقدة
PATCH  /api/bots/:id/flow/nodes/:nodeId  → تعديل عقدة
DELETE /api/bots/:id/flow/nodes/:nodeId  → حذف عقدة

POST   /api/bots/:id/publish             → نشر البوت
POST   /api/bots/:id/test                → اختبار البوت
POST   /api/bots/:id/unpublish           → إلغاء النشر
GET    /api/bots/:id/export              → تصدير التدفق (JSON)

GET    /api/bots/:id/stats               → إحصائيات البوت
       { sessions, completed, dropped, avgTime, satisfaction }

GET    /api/bots/:id/ai/recommendations  → توصيات AI للتحسين

GET    /api/bots/stats                   → إحصائيات عامة
```

---

### 3.8 مركز الذكاء الاصطناعي (AI Center)

```
GET    /api/ai/overview                  → نظرة عامة
       { suggestions, accepted, accuracy, credits, timeSaved, activeModels }

GET    /api/ai/models                    → قائمة النماذج
PATCH  /api/ai/models/:id               → تفعيل/تعطيل نموذج { isActive }

GET    /api/ai/knowledge-base            → قائمة مستندات قاعدة المعرفة
POST   /api/ai/knowledge-base/upload     → رفع مستند (multipart/form-data)
DELETE /api/ai/knowledge-base/:id        → حذف مستند

GET    /api/ai/tone                      → إعدادات النبرة الحالية
PATCH  /api/ai/tone                      → تحديث النبرة { tone, customInstructions }

GET    /api/ai/guardrails                → حواجز الأمان
PATCH  /api/ai/guardrails/:id            → تفعيل/تعطيل قاعدة { isEnabled }

GET    /api/ai/credits                   → رصيد AI { used, remaining, total }
```

---

### 3.9 التحليلات (Analytics)

```
GET    /api/analytics/overview           → نظرة عامة
       ?range=daily|weekly|monthly
       → { kpis[], categories[], hourlyDistribution[], aiInsights[] }

GET    /api/analytics/conversations      → تحليلات المحادثات
       ?range=daily|weekly|monthly
       → { total, open, resolved, avgPerDay, trend[], resolutionTrend[], topTopics[] }

GET    /api/analytics/agents             → أداء الوكلاء
       ?range=daily|weekly|monthly
       → [{ name, status, conversations, frt, resTime, csat, load }]

GET    /api/analytics/ai                 → تحليلات AI
       ?range=daily|weekly|monthly
       → { totalActions, accepted%, modified%, rejected%, timeSaved, modelPerformance[], acceptanceTrend }

GET    /api/analytics/export             → تصدير (CSV)
       ?type=conversations|agents|ai
       ?range=daily|weekly|monthly
```

**بنية KPI المرجعة:**
```json
{
  "label": "Total Conversations",
  "labelAr": "إجمالي المحادثات",
  "value": "12,847",
  "change": "+12%",
  "color": "#E8713A",
  "sparkline": [80, 95, 88, 120, 105, 140, 130, 155, 148, 170, 162, 185]
}
```

---

### 3.10 التكاملات (Integrations)

```
GET    /api/integrations                 → التكاملات المتاحة
       ?category=all|ecommerce|crm|automation|payment|productivity
       ?search=text

GET    /api/integrations/:id             → تفاصيل تكامل

POST   /api/integrations/:id/connect     → ربط تكامل { config }
POST   /api/integrations/:id/disconnect  → فصل تكامل
PATCH  /api/integrations/:id/config      → تحديث إعدادات الربط
POST   /api/integrations/:id/sync        → مزامنة يدوية
POST   /api/integrations/:id/test        → اختبار الاتصال

GET    /api/integrations/categories      → قائمة الفئات
GET    /api/integrations/connected       → التكاملات المربوطة فقط
```

---

### 3.11 الفرق (Teams)

```
GET    /api/teams                        → قائمة الفرق (مع أعضاء وإحصائيات)
POST   /api/teams                        → إنشاء فريق
PATCH  /api/teams/:id                    → تعديل فريق
DELETE /api/teams/:id                    → حذف فريق

GET    /api/teams/members                → قائمة أعضاء الفريق
POST   /api/teams/members                → إضافة عضو
PATCH  /api/teams/members/:id            → تعديل عضو
DELETE /api/teams/members/:id            → حذف عضو

GET    /api/teams/members/:id/stats      → إحصائيات عضو
GET    /api/teams/members/:id/schedule   → جدول عمل العضو
PATCH  /api/teams/members/:id/schedule   → تحديث الجدول

GET    /api/teams/routing                → قواعد التوجيه
PATCH  /api/teams/routing/:ruleId        → تحديث قاعدة { isEnabled, config }

GET    /api/teams/schedule               → جدول العمل العام (كل الأعضاء)
```

---

### 3.12 الفوترة (Billing)

```
GET    /api/billing/overview             → نظرة عامة { wallet, currentPlan, monthCost, usage }

GET    /api/billing/plans                → الخطط المتاحة
POST   /api/billing/plans/upgrade        → ترقية خطة { planId }
POST   /api/billing/plans/downgrade      → تخفيض خطة { planId }

GET    /api/billing/usage                → الاستهلاك
       { conversations: { used, total, daily[] }, ai: { used, total, daily[] }, messages: { sent, delivered, read, replied }, cost: { wa, ai, sub, total } }

POST   /api/billing/top-up               → شحن المحفظة { amount, paymentMethod }

GET    /api/billing/transactions          → المعاملات المالية ?page=1&limit=20
GET    /api/billing/invoices              → الفواتير ?page=1&limit=20
GET    /api/billing/invoices/:id/download → تحميل فاتورة (PDF)

GET    /api/billing/ai/insights          → رؤى AI للفوترة
```

---

### 3.13 الإعدادات (Settings)

```
# عام
GET    /api/settings/general             → الإعدادات العامة
PATCH  /api/settings/general             → تحديث { name, timezone, currency, language, description }
POST   /api/settings/general/logo        → رفع شعار (multipart/form-data)

# الأمان
GET    /api/settings/security            → إعدادات الأمان
PATCH  /api/settings/security            → تحديث
POST   /api/settings/security/change-password  → تغيير كلمة المرور { current, new }
GET    /api/settings/security/sessions   → الجلسات النشطة
DELETE /api/settings/security/sessions/:id → إنهاء جلسة
DELETE /api/settings/security/sessions/all → إنهاء كل الجلسات (عدا الحالية)
POST   /api/settings/security/2fa/enable  → تفعيل 2FA
POST   /api/settings/security/2fa/disable → تعطيل 2FA
GET    /api/settings/security/ip-whitelist → قائمة IP المسموح بها
PATCH  /api/settings/security/ip-whitelist → تحديث القائمة

# الإشعارات
GET    /api/settings/notifications       → تفضيلات الإشعارات
PATCH  /api/settings/notifications       → تحديث

# API
GET    /api/settings/api-keys            → مفاتيح API
POST   /api/settings/api-keys            → إنشاء مفتاح جديد
DELETE /api/settings/api-keys/:id        → حذف مفتاح
POST   /api/settings/api-keys/:id/regenerate → إعادة إنشاء

# Webhooks
GET    /api/settings/webhooks            → الـ webhooks
POST   /api/settings/webhooks            → إضافة webhook { url, events }
PATCH  /api/settings/webhooks/:id        → تعديل
DELETE /api/settings/webhooks/:id        → حذف
POST   /api/settings/webhooks/:id/test   → اختبار

# واتساب
GET    /api/settings/whatsapp            → إعدادات واتساب
PATCH  /api/settings/whatsapp            → تحديث
GET    /api/settings/whatsapp/numbers    → الأرقام المسجلة
POST   /api/settings/whatsapp/numbers    → إضافة رقم
DELETE /api/settings/whatsapp/numbers/:id → حذف رقم
```

---

### 3.14 الإشعارات (Notifications)

```
GET    /api/notifications                → قائمة الإشعارات (مع is_read)
PATCH  /api/notifications/:id/read       → تحديد كمقروء
PATCH  /api/notifications/read-all       → تحديد الكل كمقروء
GET    /api/notifications/unread-count    → عدد غير المقروءة
```

---

## 4. المصادقة والتفويض (Authentication & Authorization)

### 4.1 نوع المصادقة
- **JWT (JSON Web Token)** مع refresh token
- الـ token يُرسل في header: `Authorization: Bearer <token>`
- Refresh token في httpOnly cookie

### 4.2 الأدوار والصلاحيات

| الإجراء | Admin | Supervisor | Agent |
|---------|-------|-----------|-------|
| عرض Dashboard | ✅ | ✅ | ✅ |
| إدارة المحادثات | ✅ | ✅ | ✅ (المسندة فقط) |
| إنشاء/تعديل الحملات | ✅ | ✅ | ❌ |
| إدارة جهات الاتصال | ✅ | ✅ | قراءة فقط |
| إنشاء/تعديل القوالب | ✅ | ✅ | ❌ |
| إدارة البوتات | ✅ | ✅ | ❌ |
| إعدادات AI | ✅ | ❌ | ❌ |
| عرض التحليلات | ✅ | ✅ | محدود |
| إدارة التكاملات | ✅ | ❌ | ❌ |
| إدارة الفرق | ✅ | فريقه فقط | ❌ |
| الفوترة | ✅ | ❌ | ❌ |
| الإعدادات | ✅ | محدود | ❌ |

### 4.3 Multi-tenancy
- كل organization معزولة بالكامل
- كل query يجب أن تتضمن `org_id` filter
- لا يمكن لمنظمة الوصول لبيانات منظمة أخرى

---

## 5. WebSocket (المحادثات الحية)

### 5.1 الاتصال
```
ws://api.corbit.sa/ws?token=JWT_TOKEN
```

### 5.2 الأحداث

**من العميل:**
```json
{ "event": "join_conversation", "data": { "conversationId": "uuid" } }
{ "event": "leave_conversation", "data": { "conversationId": "uuid" } }
{ "event": "send_message", "data": { "conversationId": "uuid", "content": "text", "type": "text" } }
{ "event": "typing", "data": { "conversationId": "uuid" } }
{ "event": "stop_typing", "data": { "conversationId": "uuid" } }
```

**من السيرفر:**
```json
{ "event": "new_message", "data": { /* message object */ } }
{ "event": "message_status_update", "data": { "messageId": "uuid", "status": "delivered" } }
{ "event": "conversation_updated", "data": { /* conversation object */ } }
{ "event": "typing_indicator", "data": { "conversationId": "uuid", "senderType": "customer", "isTyping": true } }
{ "event": "ai_suggestion", "data": { "conversationId": "uuid", "suggestion": "text", "confidence": 94 } }
{ "event": "contact_status", "data": { "contactId": "uuid", "isOnline": true } }
{ "event": "notification", "data": { /* notification object */ } }
{ "event": "agent_status_changed", "data": { "userId": "uuid", "status": "online" } }
```

---

## 6. تكامل WhatsApp Business API

### 6.1 المطلوب
- تكامل مع **WhatsApp Cloud API** (Meta)
- أو **WhatsApp Business Solution Provider** (مثل Twilio, MessageBird)

### 6.2 الأحداث المطلوبة
```
# Incoming (Webhook from WhatsApp)
- message.received     → رسالة جديدة من عميل
- message.delivered     → تم تسليم الرسالة
- message.read          → تم قراءة الرسالة
- message.failed        → فشل الإرسال

# Outgoing (API calls to WhatsApp)
- Send text message
- Send template message (with variables)
- Send media message (image, video, document, audio)
- Send buttons/quick replies
- Mark as read
```

### 6.3 معالجة الرسائل الواردة
```
1. رسالة جديدة من واتساب →
2. البحث عن/إنشاء Contact بالرقم →
3. البحث عن/إنشاء Conversation مفتوحة →
4. حفظ Message →
5. تحليل AI (sentiment, intent, classification) →
6. إذا ai_agent_enabled: إنشاء رد AI →
7. إرسال عبر WebSocket للوكيل →
8. تحديث unread_count →
9. إرسال إشعار (إذا لزم)
```

---

## 7. خدمات AI المطلوبة

### 7.1 التكامل المقترح
- **Claude API** أو **OpenAI API** للنماذج اللغوية
- **Vector Database** (مثل Pinecone, Weaviate) لقاعدة المعرفة (RAG)

### 7.2 الوظائف المطلوبة

1. **Reply Suggestions** (اقتراح ردود)
   - Input: آخر 5-10 رسائل + سياق العميل + قاعدة المعرفة
   - Output: 1-3 اقتراحات ردود

2. **Conversation Summary** (تلخيص)
   - Input: كل رسائل المحادثة
   - Output: ملخص في 2-3 جمل

3. **Message Classification** (تصنيف)
   - Input: نص الرسالة
   - Output: الفئة (sales, support, billing, orders, etc.)

4. **Sentiment Analysis** (تحليل المشاعر)
   - Input: نص الرسالة
   - Output: positive | negative | neutral + confidence score

5. **Intent Detection** (كشف النية)
   - Input: نص الرسالة + سياق
   - Output: النية (مثل: "price inquiry", "order tracking", "complaint")

6. **Smart Routing** (توجيه ذكي)
   - Input: التصنيف + النية + حالة الوكلاء
   - Output: الفريق/الوكيل الأنسب

7. **Template AI Analysis** (تحليل القوالب)
   - Input: نص القالب
   - Output: aiScore (0-100) + tips[]

8. **Campaign AI Insights** (رؤى الحملات)
   - Input: بيانات أداء الحملة
   - Output: insights[] + recommendations[]

9. **Contact AI Notes** (ملاحظات AI للعملاء)
   - Input: سجل نشاط العميل + مشترياته
   - Output: ملاحظات وتوقعات (مثل: "احتمال الشراء 87%")

10. **AI Campaign Builder** (منشئ حملات AI)
    - Input: نوع الحملة أو وصف نصي
    - Output: مسودة حملة كاملة (اسم, محتوى, شريحة, وقت)

11. **AI Template Builder** (منشئ قوالب AI)
    - Input: نوع القالب أو وصف
    - Output: مسودة قالب (body, header, footer, buttons, variables)

12. **AI Smart Segments** (شرائح ذكية)
    - Input: بيانات العملاء
    - Output: شرائح تلقائية مع أعدادها وأوصافها

---

## 8. رفع الملفات (File Upload)

### 8.1 الأنواع المطلوبة
| المكان | الأنواع المسموحة | الحجم الأقصى |
|--------|-----------------|-------------|
| رسائل المحادثة | image/*, video/*, audio/*, pdf, doc | 16MB |
| قاعدة المعرفة AI | pdf, doc, txt, csv | 50MB |
| شعار المنظمة | image/png, image/jpeg | 2MB |
| صور الوكلاء | image/png, image/jpeg | 2MB |
| استيراد جهات اتصال | csv | 10MB |

### 8.2 التخزين
- **S3** أو **Cloudflare R2** أو **مشابه**
- إرجاع URL عام أو موقّع

---

## 9. المهام المجدولة (Cron Jobs / Background Tasks)

| المهمة | التكرار | الوصف |
|--------|--------|-------|
| إرسال الحملات المجدولة | كل دقيقة | فحص الحملات المجدولة وبدء الإرسال |
| تحديث إحصائيات الحملات | كل 5 دقائق | تحديث معدلات الفتح/النقر/الرد |
| حساب engagement_score | يومياً | إعادة حساب نقاط التفاعل لجميع العملاء |
| تحديث analytics | كل ساعة | تجميع بيانات التحليلات |
| تنظيف الجلسات المنتهية | يومياً | حذف الجلسات المنتهية |
| تحديث حالة الاتصال | كل 5 دقائق | تحديث is_online للعملاء والوكلاء |
| مزامنة التكاملات | كل 15 دقيقة | مزامنة البيانات مع التطبيقات المربوطة |
| إرسال تذكيرات الدفع | يومياً | إشعارات انتهاء الاشتراك |
| تقرير الاستهلاك اليومي | يومياً 00:00 | حساب وتخزين usage_tracking |
| فحص أرصدة منخفضة | كل ساعة | إرسال إشعار عند الرصيد المنخفض |
| Auto-escalation | كل دقيقة | تصعيد المحادثات التي تجاوزت SLA |

---

## 10. نظام Webhooks الصادرة

### 10.1 الأحداث المدعومة
```
conversation.created
conversation.resolved
conversation.assigned
message.received
message.sent
contact.created
contact.updated
campaign.started
campaign.completed
bot.triggered
payment.received
```

### 10.2 شكل الـ Payload
```json
{
  "event": "message.received",
  "timestamp": "2026-03-14T10:30:00Z",
  "data": { /* event-specific data */ },
  "organization_id": "uuid"
}
```

### 10.3 التوقيع
- Header: `X-Webhook-Signature: HMAC-SHA256(payload, secret)`

---

## 11. التدويل (i18n)

### 11.1 القاعدة
- كل الاستجابات يجب أن تدعم اللغتين (عربي + إنجليزي)
- يتم تحديد اللغة عبر: `Accept-Language: ar` أو `Accept-Language: en`
- أو عبر parameter: `?lang=ar`

### 11.2 نمط الاستجابة
للحقول المترجمة، يمكن استخدام أحد الأسلوبين:

**أسلوب 1: حقول مزدوجة (مفضّل للبيانات المخزنة)**
```json
{
  "name": "Welcome Bot",
  "name_ar": "بوت الترحيب"
}
```

**أسلوب 2: حسب اللغة المطلوبة (للاستجابات الديناميكية)**
```json
// GET /api/dashboard/stats?lang=ar
{ "label": "إجمالي المحادثات" }

// GET /api/dashboard/stats?lang=en
{ "label": "Total Conversations" }
```

---

## 12. الأنواع المشتركة (Shared Types)

هذه الأنواع المستخدمة في الفرونت إند ويجب أن يتوافق معها الباك إند:

```typescript
type Status = "open" | "active" | "published" | "online" | "pending" | "testing" |
              "busy" | "scheduled" | "solved" | "completed" | "approved" |
              "rejected" | "closed" | "draft" | "unpublished" | "offline";

type Priority = "high" | "medium" | "low";
type Sentiment = "positive" | "negative" | "neutral";
type Locale = "ar" | "en";
type Theme = "dark" | "light"; // frontend only

type UserRole = "admin" | "supervisor" | "agent";
type MessageSenderType = "customer" | "agent" | "bot" | "system";
type MessageStatus = "sent" | "delivered" | "read" | "failed";
type TemplateCategory = "utility" | "marketing" | "authentication";
type TemplateStatus = "approved" | "pending" | "rejected";
type BotStatus = "published" | "testing" | "unpublished" | "draft";
type CampaignStatus = "draft" | "scheduled" | "active" | "completed" | "paused";
type ContactStatus = "active" | "inactive" | "blocked";
type TransactionType = "charge" | "payment" | "refund";
type IntegrationCategory = "ecommerce" | "crm" | "automation" | "payment" | "productivity";
type BotNodeType = "trigger" | "message" | "buttons" | "input" | "condition" | "ai" | "api" | "transfer" | "end";
type AiTone = "friendly" | "formal" | "casual" | "sales";
type EventType = "campaign" | "order" | "chat" | "system";
```

---

## 13. متطلبات البنية التحتية

### 13.1 التقنيات المقترحة
| المكون | الخيارات المقترحة |
|--------|------------------|
| اللغة | Node.js (TypeScript) أو Python (FastAPI) |
| قاعدة البيانات | PostgreSQL |
| Cache | Redis |
| WebSocket | Socket.io أو ws |
| Queue | BullMQ (Redis) أو RabbitMQ |
| File Storage | AWS S3 / Cloudflare R2 |
| AI | Claude API / OpenAI API |
| Vector DB | Pinecone / Weaviate / pgvector |
| Search | PostgreSQL Full Text أو Elasticsearch |
| Email | SendGrid / AWS SES |
| SMS | Twilio |

### 13.2 Environment Variables المطلوبة
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/corbit

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# WhatsApp
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...

# AI
AI_PROVIDER=claude  # or openai
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Storage
S3_BUCKET=corbit-files
S3_REGION=me-south-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Email
SENDGRID_API_KEY=...

# General
APP_URL=https://app.corbit.sa
API_URL=https://api.corbit.sa
NODE_ENV=production
PORT=3001
```

---

## 14. خريطة العلاقات بين الكيانات (Entity Relationship)

```
Organization
├── Users (team members/agents)
│   ├── User Schedules
│   ├── User Skills
│   └── Sessions
├── Teams
│   ├── Team Routing Rules
│   └── Users (belongs to)
├── Contacts (customers)
│   ├── Contact Tags
│   ├── Contact Behavior
│   ├── Contact Timeline
│   └── Conversations
│       └── Messages
├── Campaigns
│   ├── Campaign Behavior
│   ├── Campaign Segments
│   ├── Campaign Timeline
│   └── Campaign AI Insights
├── Templates
│   ├── Template Performance
│   └── Template AI Tips
├── Bots
│   └── Bot Flow Nodes
├── AI Models
├── Knowledge Base Docs
├── AI Tone Settings
├── AI Guardrails
├── Org Integrations
├── Plans (subscription)
├── Transactions
├── Invoices
├── Usage Tracking
├── API Keys
├── Webhooks
├── WhatsApp Numbers
├── Notifications
├── Notification Preferences
└── Audit Logs
```

---

## 15. ملاحظات مهمة للتنفيذ

### 15.1 الأداء
- استخدام **pagination** لكل القوائم (default: 20, max: 100)
- **Index** على: org_id, status, created_at, contact.phone, contact.email
- **Cache** للإحصائيات المجمّعة (5 دقائق)
- **WebSocket rooms** لكل محادثة

### 15.2 الأمان
- Rate limiting: 100 req/min للـ API العام، 1000 req/min للـ API الداخلي
- Input validation على كل endpoint
- SQL injection prevention (استخدام ORM)
- XSS prevention (تنظيف المدخلات)
- CORS configuration
- Webhook signature verification

### 15.3 التوافق مع الفرونت
- الفرونت يستدعي بيانات محلية من ملفات `data/*.ts` بدالات مثل `getConversations(lang)`
- يجب أن يُرجع الـ API نفس البنية بالضبط
- الفرونت يدعم RTL - لا حاجة لأي تعديل في الباك إند
- الفرونت يتعامل مع الثيم (dark/light) محلياً - لا حاجة لدعمه في الباك إند

### 15.4 Seed Data (بيانات أولية)
يجب إنشاء بيانات أولية عند الـ setup:
- 3 خطط اشتراك (Starter, Business, Enterprise)
- 7 تكاملات (Shopify, HubSpot, Zapier, Google Sheets, Stripe, Slack, Salesforce)
- 6 نماذج AI
- 5 حواجز أمان AI
- فئات التكاملات (ecommerce, crm, automation, payment, productivity)
- منظمة demo مع بيانات تجريبية

---

## 16. ترتيب التنفيذ المقترح

1. **المرحلة 1 - الأساسيات:**
   - Database schema + migrations
   - Authentication (JWT + 2FA)
   - Organizations + Users + Teams
   - Basic CRUD for all entities

2. **المرحلة 2 - المحادثات:**
   - WhatsApp Business API integration
   - Conversations + Messages CRUD
   - WebSocket for real-time chat
   - Quick replies

3. **المرحلة 3 - الحملات والقوالب:**
   - Templates CRUD + WhatsApp approval
   - Campaigns CRUD + scheduling
   - Campaign execution engine (queue-based)
   - Performance tracking

4. **المرحلة 4 - البوتات:**
   - Bot CRUD + Flow editor API
   - Bot execution engine
   - Bot analytics

5. **المرحلة 5 - AI:**
   - AI service integration (Claude/GPT)
   - Knowledge base (RAG with vector DB)
   - Reply suggestions, classification, sentiment
   - AI agent for conversations

6. **المرحلة 6 - التحليلات والفوترة:**
   - Analytics aggregation + API
   - Billing + Wallet + Plans
   - Invoices + Transactions

7. **المرحلة 7 - التكاملات والإعدادات:**
   - Integration framework
   - Settings API
   - Webhooks system
   - API keys management

---

## 17. ملحق: تصحيحات وإضافات (Addendum)

> **ملاحظة مهمة:** عند وجود تعارض بين الأقسام 17-18 والأقسام السابقة (1-16)، يُعتمد ما في الأقسام 17-18 كمرجع نهائي.

> هذا القسم يُكمل الأقسام السابقة بالتفاصيل الناقصة لضمان توافق 100%.

### 17.1 تنبيه مهم: أسماء الحقول في الـ API Response

الفرونت إند يستخدم أسماء حقول مختصرة. يجب أن يُرجع الباك إند **نفس الأسماء** التالية في JSON responses:

**Conversation Response:**
```json
{
  "id": "uuid",
  "name": "أحمد",          // من contact.name
  "ph": "+966 55 XXX",     // من contact.phone
  "email": "ahmed@ex.com", // من contact.email
  "msg": "آخر رسالة...",   // آخر رسالة مختصرة
  "time": "2:30 PM",       // وقت آخر رسالة (formatted)
  "unread": 3,
  "st": "open",            // الحالة (ليس "status")
  "pri": "high",           // الأولوية (ليس "priority")
  "tag": "مبيعات",
  "sentiment": "positive",
  "intent": "استفسار عروض",
  "online": true,          // من contact.is_online
  "orders": 5,             // من contact.total_orders
  "joined": "2024-06",     // من contact.joined_at (formatted YYYY-MM)
  "notes": "عميل VIP"
}
```

**Message Response:**
```json
{
  "from": "customer",      // (ليس "sender_type") - "customer" | "bot" | "agent" | "system"
  "text": "نص الرسالة",    // (ليس "content")
  "time": "2:25 PM"        // (ليس "created_at") - formatted
}
```

**Contact Response:**
```json
{
  "id": 0,                  // integer (ليس UUID) - أو يمكن UUID لكن الفرونت يتعامل معه كرقم
  "name": "أحمد العتيبي",
  "ph": "+966551234567",    // (ليس "phone")
  "email": "ahmed@ex.com",
  "tags": ["VIP", "مبيعات"], // inline array (ليس جدول منفصل في الاستجابة)
  "st": "active",           // (ليس "status")
  "score": 92,              // (ليس "engagement_score")
  "ltv": 12400,             // (ليس "lifetime_value")
  "orders": 18,
  "lastActive": "2026-02-21", // (ليس "last_active_at")
  "joined": "2024-06",       // (ليس "joined_at") - format YYYY-MM
  "city": "الرياض"
}
```

**Campaign Response:**
```json
{
  "id": 0,
  "name": "حملة رمضان",
  "st": "active",
  "recipients": 12500,      // (ليس "total_recipients")
  "delivery": 96.2,         // (ليس "delivery_rate")
  "readRate": 72.1,          // camelCase (ليس "read_rate")
  "replyRate": 18.4,
  "cost": 3750,
  "roi": "+340%",
  "date": "2025-03-01",
  "template": "عرض رمضان",   // اسم القالب (ليس template_id)
  "segment": "جميع العملاء",
  "behavior": { "opened": 9012, "clicked": 2300, "replied": 1450, "converted": 580, "unsubscribed": 32 },
  "segments": [{ "name": "VIP", "sent": 2500, "open": 98, "click": 45, "conv": 28 }],
  "timeline": [{ "time": "09:00", "event": "بدء الإرسال", "value": 0 }],
  "aiInsights": ["أفضل وقت إرسال: 9 صباحاً"]
}
```

**Template Response:**
```json
{
  "id": 0,
  "name": "ترحيب",
  "cat": "utility",          // (ليس "category")
  "ln": "ar+en",             // (ليس "language")
  "st": "approved",          // (ليس "status")
  "uses": 3240,              // (ليس "total_uses")
  "open": 94.2,              // (ليس "open_rate")
  "click": 38.5,             // (ليس "click_rate")
  "body": "مرحباً {{1}}!...",
  "vars": ["name", "phone"], // (ليس "variables")
  "header": "صورة",
  "footer": "CORBIT",
  "buttons": [{ "text": "تصفح", "type": "url" }],
  "aiScore": 92,             // (ليس "ai_score")
  "aiTips": ["معدل فتح ممتاز"],
  "sent": 3240,              // inline (ليس جدول منفصل)
  "delivered": 3190,
  "read": 3005,
  "replied": 1215
}
```

**Bot Response:**
```json
{
  "id": 0,
  "name": "بوت ترحيب",
  "st": "published",
  "nodes": 8,                // عدد العقد (computed)
  "trigger": "مرحبا",        // (ليس "trigger_keywords")
  "conversations": 1240,     // (ليس "total_conversations")
  "ai": true,                // (ليس "is_ai_enabled")
  "desc": "يرحب بالعملاء",   // (ليس "description")
  "stats": {
    "sessions": 1240,
    "completed": 1050,
    "dropped": 190,
    "avgTime": "2.5m",
    "satisfaction": 88       // نسبة مئوية 0-100 (ليس /5)
  },
  "flow": [
    { "id": "n1", "type": "trigger", "label": "بداية", "x": 50, "y": 30, "next": ["n2"], "config": {"keywords": "مرحبا"} }
  ]
}
```

**Team Response:**
```json
{
  "id": 0,
  "name": "الدعم",
  "color": "#4A9EFF",
  "lead": "سعد",             // اسم القائد (ليس lead_id)
  "convos": 30,              // computed
  "csat": 97,                // computed
  "online": 2,               // computed
  "total": 3,                // computed
  "rules": ["توزيع Round-Robin", "أولوية VIP"]  // أسماء نصية (ليس كائنات)
}
```

**TeamMember Response:**
```json
{
  "id": 0,
  "name": "سعد",
  "email": "saad@corbit.sa",
  "role": "supervisor",
  "team": "الدعم",            // اسم الفريق (ليس team_id)
  "online": true,
  "stats": {
    "convos": 12,             // computed - المحادثات النشطة
    "frt": "1.2m",            // computed - وقت الاستجابة الأولى
    "res": "8m",              // computed - وقت الحل
    "csat": 97,               // computed
    "load": 75                // computed - نسبة التحميل %
  },
  "schedule": { "sun": true, "mon": true, "tue": true, "wed": true, "thu": true, "fri": false, "sat": false },
  "skills": ["دعم فني", "طلبات"]
}
```

**Plan Response:**
```json
{
  "id": 0,
  "name": "المبتدئ",
  "price": 299,              // (ليس "price_monthly")
  "agents": 3,               // (ليس "max_agents")
  "convos": "1,000",         // string formatted (ليس integer)
  "ai": "500",               // string formatted
  "features": ["3 وكلاء", "1,000 محادثة", "بوت واحد"],
  "current": false            // هل هي الخطة الحالية للمنظمة
}
```

**Transaction Response:**
```json
{
  "type": "charge",
  "desc": "واتساب",           // (ليس "description")
  "amount": -2450,
  "date": "2026-02-20",       // formatted (ليس "created_at")
  "ref": "TXN-001"            // (ليس "reference")
}
```

### 17.2 جداول ناقصة يجب إضافتها

#### جدول `conversation_notes` (ملاحظات المحادثة)
| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| conversation_id | FK → conversations.id | المحادثة |
| user_id | FK → users.id | كاتب الملاحظة |
| text | TEXT | نص الملاحظة |
| created_at | TIMESTAMP | - |

#### جدول `auto_messages` (الرسائل التلقائية)
| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| type | ENUM('welcome','away','queue') | النوع |
| text | TEXT | النص بالإنجليزي |
| text_ar | TEXT | النص بالعربي |
| is_enabled | BOOLEAN | مفعّل |

#### جدول `business_hours` (ساعات العمل)
| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| day_of_week | ENUM('sun','mon','tue','wed','thu','fri','sat') | اليوم |
| is_open | BOOLEAN | مفتوح |
| open_time | TIME | وقت الفتح |
| close_time | TIME | وقت الإغلاق |

#### جدول `org_settings` (إعدادات المنظمة المتقدمة)
| العمود | النوع | الوصف |
|--------|------|-------|
| org_id | FK → organizations.id | PK |
| channel_mode | ENUM('wa_only','wa_sms','dual') | وضع القنوات |
| auto_close_hours | INT | إغلاق تلقائي بعد X ساعة |
| auto_assign | BOOLEAN | إسناد تلقائي |
| auto_assign_algorithm | ENUM('round_robin','least_load','random') | خوارزمية الإسناد |
| max_conversations_per_agent | INT | أقصى محادثات للوكيل |
| customer_can_reopen | BOOLEAN | العميل يستطيع إعادة الفتح |
| post_close_survey | BOOLEAN | استبيان بعد الإغلاق |
| sla_first_response_minutes | INT | SLA وقت الاستجابة الأولى |
| sla_resolution_minutes | INT | SLA وقت الحل |
| sla_escalation_warning | BOOLEAN | تحذير التصعيد |
| sla_vip_priority | BOOLEAN | أولوية VIP |
| quiet_hours_enabled | BOOLEAN | ساعات الهدوء |
| quiet_hours_from | TIME | بداية الهدوء |
| quiet_hours_to | TIME | نهاية الهدوء |
| auto_report_frequency | ENUM('daily','weekly','monthly','none') | تكرار التقارير |
| password_policy | ENUM('basic','medium','strong') | سياسة كلمة المرور |
| sms_provider | ENUM('unifonic','twilio','nexmo') | مزود SMS |
| sms_sender_id | VARCHAR(20) | معرف المرسل SMS |
| sms_balance | DECIMAL(12,2) | رصيد SMS |

> **ملاحظة:** حقول SLA تم نقلها لجدول `sla_settings` (18.3)، حقول المحادثات لجدول `conversation_settings` (18.4)، حقول SMS لجدول `sms_settings` (18.5). يُحذف من `org_settings` الحقول المنقولة ويُبقى فقط: `channel_mode`, `quiet_hours_enabled`, `quiet_hours_from`, `quiet_hours_to`, `auto_report_frequency`, `password_policy`.

> **ملاحظة:** جدول الشرائح (`segments`) موثّق بالتفصيل في القسم 18.2 مع الـ endpoints الكاملة.

### 17.3 Endpoints ناقصة يجب إضافتها

```
# المستخدم الحالي
GET    /api/auth/me                      → معلومات المستخدم الحالي { user, org }

# بحث عام
GET    /api/search?q=text               → بحث شامل في المحادثات والعملاء والحملات

# ملاحظات المحادثة
GET    /api/conversations/:id/notes      → قائمة الملاحظات
POST   /api/conversations/:id/notes      → إضافة ملاحظة { text }

# ملخص AI للمحادثة
GET    /api/conversations/:id/ai/summary → الحصول على ملخص AI (يُنشأ تلقائياً إذا لم يكن موجوداً)

# رفع مرفقات المحادثة
POST   /api/conversations/:id/attachments → رفع ملف (multipart/form-data)

# الردود السريعة
GET    /api/quick-replies                → قائمة الردود السريعة للمنظمة
POST   /api/quick-replies               → إضافة رد سريع
DELETE /api/quick-replies/:id            → حذف رد سريع

# شرائح العملاء (مفصّل في القسم 18.2 تحت /api/segments)

# A/B Test للحملات (مفصّل في القسم 18.7)

# رؤى AI للتكاملات
GET    /api/integrations/:id/ai-tips     → توصيات AI لتكامل محدد

# عدد الإشعارات في الـ navigation
GET    /api/nav/badges                   → { inbox: 16, ... }

# سجل Webhooks
GET    /api/settings/webhooks/:id/logs   → سجل تنفيذ الـ webhook

# الرسائل التلقائية
GET    /api/settings/auto-messages       → الرسائل التلقائية (welcome, away, queue)
PATCH  /api/settings/auto-messages       → تحديث

# ساعات العمل
GET    /api/settings/business-hours      → ساعات العمل
PATCH  /api/settings/business-hours      → تحديث

# إعدادات المحادثات
GET    /api/settings/conversations        → إعدادات المحادثات (auto-close, auto-assign)
PATCH  /api/settings/conversations        → تحديث

# إعدادات SMS
GET    /api/settings/sms                 → إعدادات SMS
PATCH  /api/settings/sms                 → تحديث
```

### 17.4 قواعد التحقق (Validation Rules)

| الحقل | القاعدة |
|-------|--------|
| Contact phone | E.164 format: `^\+[1-9]\d{1,14}$` |
| Template body | max 1024 حرف (حد واتساب) |
| Template variables | format `{{N}}` حيث N رقم من 1+ |
| Campaign name | max 255 حرف |
| Bot trigger keywords | مفصولة بفاصلة, max 500 حرف |
| Wallet low balance | تنبيه عند < 500 SAR |
| Password (basic) | 8+ أحرف |
| Password (medium) | 8+ أحرف + حرف كبير + رقم |
| Password (strong) | 12+ أحرف + حرف كبير + رقم + رمز خاص |
| API key format | prefix: `sk_live_corbit_` أو `sk_test_corbit_` |
| Webhook URL | يجب أن يبدأ بـ `https://` |
| File upload sizes | صور: 16MB, PDF: 50MB, CSV: 10MB, شعار: 2MB |
| Pagination | default limit=20, max limit=100 |
| Message text | max 4096 حرف |
| Search query | min 1 حرف, max 100 حرف |

### 17.5 بيانات الخطط

> تم تصحيح بيانات الخطط في القسم 2.30 مباشرة. القيم هناك هي المرجع النهائي.

### 17.6 إعدادات الإشعارات التفصيلية

> **تم استبدال هذا الهيكل.** انظر القسم 18.9 للجدول النهائي المعتمد (normalized approach).

الفرونت إند يعرض 6 أنواع إشعارات × 4 قنوات:

**أنواع الإشعارات:**
1. `new_conversation` - محادثة جديدة
2. `new_message` - رسالة جديدة
3. `assignment` - إسناد محادثة
4. `escalation` - تصعيد
5. `sla_warning` - تحذير SLA
6. `low_balance` - رصيد منخفض

**قنوات التوصيل:**
1. `browser` - إشعار المتصفح
2. `email` - بريد إلكتروني
3. `sound` - صوت
4. `mobile` - الهاتف

يجب تحديث جدول `notification_preferences` ليشمل هذه القيم:

| العمود | النوع |
|--------|------|
| user_id | FK → users.id (PK) |
| new_conversation_browser | BOOLEAN |
| new_conversation_email | BOOLEAN |
| new_conversation_sound | BOOLEAN |
| new_conversation_mobile | BOOLEAN |
| new_message_browser | BOOLEAN |
| new_message_email | BOOLEAN |
| new_message_sound | BOOLEAN |
| new_message_mobile | BOOLEAN |
| assignment_browser | BOOLEAN |
| assignment_email | BOOLEAN |
| assignment_sound | BOOLEAN |
| assignment_mobile | BOOLEAN |
| escalation_browser | BOOLEAN |
| escalation_email | BOOLEAN |
| escalation_sound | BOOLEAN |
| escalation_mobile | BOOLEAN |
| sla_warning_browser | BOOLEAN |
| sla_warning_email | BOOLEAN |
| sla_warning_sound | BOOLEAN |
| sla_warning_mobile | BOOLEAN |
| low_balance_browser | BOOLEAN |
| low_balance_email | BOOLEAN |
| low_balance_sound | BOOLEAN |
| low_balance_mobile | BOOLEAN |

أو بديل أبسط: جدول `notification_preferences` مع `notification_type` و `channel` كـ composite key.

### 17.7 ثوابت الفرونت إند (Frontend-Only Constants)

هذه ثوابت في الفرونت فقط ولا تحتاج endpoints:

1. **`nodeTypes`** (9 أنواع عقد البوت): trigger, message, buttons, input, condition, ai, api, transfer, end - مع ألوان وأيقونات لكل نوع
2. **`integrationCategories`** (6 فئات): all, ecommerce, crm, automation, payment, productivity - مع labels بالعربي والإنجليزي
3. **`navItems`** (12 عنصر قائمة): dashboard, inbox, campaigns, contacts, templates, bot-builder, ai-center, analytics, integrations, teams, billing, settings
4. **Theme colors**: pri, sec, ok, warn, err, info, wa, ai + dark/light variants
5. **Translations**: 200+ مفتاح ترجمة بالعربي والإنجليزي

### 17.8 تصحيح: إعدادات Settings Tabs

الفرونت إند يستخدم هذه التبويبات في صفحة الإعدادات:
1. `general` - عام (اسم الشركة، البريد، الهاتف، الموقع، المنطقة الزمنية، العملة، الوصف)
2. `notifications` - الإشعارات (6 أنواع × 4 قنوات + ساعات هدوء + تقارير تلقائية)
3. `security` - الأمان (2FA، سياسة كلمة المرور، IP whitelist، الجلسات، SSO)
4. `channels` - القنوات (واتساب + SMS + إعدادات التوجيه + الرسائل التلقائية + ساعات العمل)
5. `team` - الفريق (إعدادات المحادثات، SLA، الأدوار)
6. `api` - API (مفاتيح API + Webhooks + السجلات)

---

## 18. ملحق 2: تغطية الفجوات النهائية (Final Gap Coverage)

### 18.1 أعمدة ناقصة في جدول `organizations`

يجب إضافة هذه الأعمدة لجدول `organizations` (القسم 2.1):

| العمود | النوع | الوصف |
|--------|------|-------|
| email | VARCHAR(255) | بريد الشركة |
| phone | VARCHAR(20) | هاتف الشركة |
| website | VARCHAR(500) | موقع الشركة |

### 18.2 جدول `segments` (شرائح العملاء المحفوظة)

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| org_id | FK → organizations.id | المنظمة |
| name | VARCHAR(255) | اسم الشريحة |
| filters | JSONB | معايير الفلترة |
| contact_count | INT | عدد المطابقين (computed) |
| created_at | TIMESTAMP | - |
| updated_at | TIMESTAMP | - |

**بنية `filters` (JSONB):**
```json
{
  "status": "active",
  "tags": ["VIP", "Sales"],
  "scoreMin": 50,
  "scoreMax": 100,
  "city": "Riyadh",
  "orderMin": 3
}
```

**Endpoints:**
```
GET    /api/segments                    → قائمة الشرائح المحفوظة
POST   /api/segments                    → إنشاء شريحة { name, filters }
GET    /api/segments/:id                → تفاصيل شريحة مع عدد المطابقين
PATCH  /api/segments/:id                → تعديل شريحة
DELETE /api/segments/:id                → حذف شريحة
GET    /api/segments/:id/contacts       → جهات الاتصال المطابقة
POST   /api/segments/preview            → معاينة عدد المطابقين { filters } → { count }
```

### 18.3 جدول `sla_settings` (إعدادات SLA)

| العمود | النوع | الوصف |
|--------|------|-------|
| org_id | FK → organizations.id | PK |
| first_response_minutes | INT | وقت الاستجابة الأولى (دقائق) |
| resolution_minutes | INT | وقت الحل (دقائق) |
| escalation_warning_minutes | INT | تحذير التصعيد (دقائق) |
| vip_priority | BOOLEAN | أولوية VIP |

**Endpoint:** `GET/PATCH /api/settings/sla`

### 18.4 جدول `conversation_settings` (إعدادات المحادثات)

| العمود | النوع | الوصف |
|--------|------|-------|
| org_id | FK → organizations.id | PK |
| auto_close_enabled | BOOLEAN | إغلاق تلقائي |
| auto_close_hours | INT | بعد كم ساعة |
| auto_assign_enabled | BOOLEAN | إسناد تلقائي |
| auto_assign_algorithm | ENUM('least_load','round_robin','random') | خوارزمية |
| max_per_agent | INT | أقصى محادثات للوكيل |
| customer_can_reopen | BOOLEAN | العميل يعيد الفتح |
| post_close_survey | BOOLEAN | استبيان بعد الإغلاق |

**Endpoint:** `GET/PATCH /api/settings/conversations`

### 18.5 جدول `sms_settings` (إعدادات SMS)

| العمود | النوع | الوصف |
|--------|------|-------|
| org_id | FK → organizations.id | PK |
| enabled | BOOLEAN | مفعّل |
| provider | ENUM('unifonic','twilio','nexmo') | المزود |
| sender_id | VARCHAR(20) | معرف المرسل |
| balance | DECIMAL(12,2) | الرصيد |
| channel_mode | ENUM('wa_only','wa_sms','dual') | وضع القنوات |

**Endpoint:** `GET/PATCH /api/settings/sms`

### 18.6 عمود `action_url` في جدول `notifications`

إضافة لجدول `notifications` (القسم 2.37):

| العمود | النوع | الوصف |
|--------|------|-------|
| action_url | VARCHAR(255) | رابط التنقل عند الضغط (مثل "/billing", "/inbox") |

### 18.7 Endpoints ناقصة إضافية

```
# تقدير المستلمين للحملة
GET    /api/campaigns/estimate?segment=vip  → { count: 1248, estimatedCost: 374 }

# اختبار A/B للحملات
POST   /api/campaigns/:id/ab-test           → { variantA: {}, variantB: {} }
GET    /api/campaigns/:id/ab-test/results    → نتائج الاختبار

# أرشفة حملة (بدل DELETE)
POST   /api/campaigns/:id/archive           → أرشفة (ليس حذف نهائي)

# بحث عام
GET    /api/search?q=text                   → { conversations: [], contacts: [], campaigns: [], templates: [] }

# ملخص AI للمحادثة
GET    /api/conversations/:id/ai/summary    → { summary: "..." }

# سجل التدقيق
GET    /api/settings/security/audit-log?page=1&limit=20 → قائمة سجلات التدقيق
```

### 18.8 تفاصيل Payload لإنشاء الكيانات

**POST /api/campaigns (إنشاء حملة):**
```json
{
  "name": "حملة رمضان",
  "template": "عرض رمضان",
  "segment": "all|vip|new|active|inactive",
  "segment_id": "uuid (اختياري - شريحة محفوظة)",
  "sendNow": true,
  "scheduledDate": "2026-03-20",
  "scheduledTime": "09:00"
}
```

**POST /api/templates (إنشاء قالب):**
```json
{
  "name": "ترحيب العملاء",
  "category": "utility|marketing|authentication",
  "language": "ar+en|ar|en",
  "header": "أهلاً بك",
  "body": "مرحباً {{1}}! استخدم كود {{2}} للخصم",
  "footer": "CORBIT",
  "buttons": [
    { "text": "تصفح المنتجات", "type": "url" },
    { "text": "تواصل معنا", "type": "phone" }
  ]
}
```
- الأزرار: حد أقصى 3 أزرار
- النص: حد أقصى 1024 حرف
- المتغيرات: format `{{N}}` حيث N عدد صحيح يبدأ من 1

**POST /api/contacts (إضافة جهة اتصال):**
```json
{
  "name": "أحمد العتيبي",
  "phone": "+966551234567",
  "email": "ahmed@ex.com",
  "city": "الرياض",
  "tags": ["VIP", "مبيعات"]
}
```
- **سلوك إضافي:** عند الإنشاء، يُرسل الباك إند تلقائياً رسالة ترحيب عبر واتساب (إذا كانت رسالة الترحيب مفعّلة في `auto_messages`)

**POST /api/bots (إنشاء بوت):**
```json
{
  "name": "بوت ترحيب",
  "description": "يرحب بالعملاء الجدد",
  "trigger": "مرحبا, السلام, هلا",
  "aiEnabled": true,
  "startNode": "welcome|buttons|ai"
}
```
- **سلوك:** الباك إند ينشئ تلقائياً 3 عقد أولية:
  - عقدة Trigger بالكلمات المحفّزة
  - عقدة البداية حسب `startNode` (message/buttons/ai)
  - عقدة End

**POST /api/teams/members (إضافة عضو):**
```json
{
  "name": "سعد الغامدي",
  "email": "saad@corbit.sa",
  "role": "agent|supervisor|admin",
  "team": "الدعم",
  "skills": ["مبيعات", "دعم فني"],
  "schedule": {
    "sun": true, "mon": true, "tue": true,
    "wed": true, "thu": true, "fri": false, "sat": false
  }
}
```
- **سلوك:** الباك إند يُنشئ المستخدم بكلمة مرور مؤقتة ويُرسل دعوة بالبريد الإلكتروني

**POST /api/billing/top-up (شحن الرصيد):**
```json
{
  "amount": 1000,
  "paymentMethod": "card|bank|wallet"
}
```
- **الاستجابة:**
```json
{
  "subtotal": 1000,
  "vat": 150,
  "total": 1150,
  "currency": "SAR",
  "transactionId": "TXN-006",
  "status": "completed",
  "newBalance": 13450
}
```
- VAT 15% يُحسب في الباك إند
- بوابات الدفع المقترحة: Moyasar (للسعودية)، Stripe، أو HyperPay

### 18.9 تحديث جدول `notification_preferences`

استبدال الجدول الحالي (القسم 2.40) بالتالي:

| العمود | النوع | الوصف |
|--------|------|-------|
| id | UUID | المعرف |
| user_id | FK → users.id | المستخدم |
| notification_type | ENUM('new_conversation','new_message','assignment','escalation','sla_warning','low_balance') | نوع الإشعار |
| browser | BOOLEAN | إشعار المتصفح |
| email | BOOLEAN | بريد إلكتروني |
| sound | BOOLEAN | صوت |
| mobile | BOOLEAN | الهاتف |

**إعدادات إضافية في `org_settings`:**
- `quiet_hours_enabled` BOOLEAN
- `quiet_hours_from` TIME
- `quiet_hours_to` TIME
- `auto_report_enabled` BOOLEAN
- `auto_report_frequency` ENUM('daily','weekly','monthly','none')

### 18.10 تدفق دعوة العضو الجديد

عند `POST /api/teams/members`:
1. إنشاء المستخدم بكلمة مرور مؤقتة عشوائية
2. إنشاء جدول العمل من `schedule`
3. إنشاء المهارات من `skills`
4. إرسال بريد دعوة يحتوي:
   - رابط تسجيل الدخول
   - كلمة المرور المؤقتة
   - طلب تغيير كلمة المرور عند أول تسجيل
5. تسجيل الحدث في `audit_logs`

### 18.11 تدفق معالجة الدفع (Top Up)

عند `POST /api/billing/top-up`:
1. التحقق من المبلغ (> 0)
2. حساب VAT 15%
3. إنشاء طلب دفع في بوابة الدفع (Moyasar/Stripe)
4. عند نجاح الدفع:
   - تحديث `organizations.wallet_balance`
   - إنشاء سجل في `transactions` (type: "payment")
   - إنشاء سجل في `invoices`
5. عند فشل الدفع: إرجاع خطأ مع سبب الفشل
6. تسجيل الحدث في `audit_logs`

---

*تم إنشاء هذا المستند بتاريخ: 2026-03-14*
*الإصدار: 1.0*
*المنصة: CORBIT - منصة واتساب الأعمال المتكاملة*
