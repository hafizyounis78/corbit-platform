/**
 * Translates raw Meta WhatsApp Business API error payloads into
 * tenant-friendly Arabic messages.
 *
 * Meta returns errors in a few shapes:
 *   { error: { message, code, error_subcode, error_user_msg, ... } }
 *   { message, code }
 *   raw string ("Invalid parameter")
 *
 * The translator walks each shape, picks the highest-fidelity field
 * available (error_user_msg > message > generic), then runs it
 * through a pattern-matching dictionary keyed off the most common
 * rejection reasons we've seen in the wild. Anything that doesn't
 * match falls back to the original message — better to show
 * something readable than nothing.
 */

export type MetaErrorPayload =
  | string
  | {
      error?: {
        message?: string;
        code?: number;
        error_subcode?: number;
        error_user_msg?: string;
        error_user_title?: string;
        error_data?: Record<string, any>;
        type?: string;
      };
      message?: string;
      code?: number;
      raw?: any;
    }
  | null
  | undefined;

type Pattern = {
  /** Regex to match against the lowercase original message */
  match: RegExp;
  /** Friendly Arabic message */
  ar: string;
  /** Friendly English message */
  en: string;
};

/**
 * Pattern dictionary — ordered by specificity. The first match wins,
 * so put narrower patterns first. Keep messages action-oriented:
 * the operator should know WHAT to change, not just that something
 * is wrong.
 */
const PATTERNS: Pattern[] = [
  // — Authentication-template specifics —
  {
    match: /authentication.*button.*variable|button.*authentication.*variable/i,
    ar: "قوالب المصادقة لا تسمح بالأزرار التي تحوي متغيّرات. احذف الـ {{1}} من نصّ الزرّ.",
    en: "Authentication templates don't allow buttons with variables. Remove {{1}} from the button text.",
  },
  {
    match: /authentication.*emoji|emoji.*authentication/i,
    ar: "قوالب المصادقة لا تسمح بالايموجي. احذف كلّ الايموجي من النصّ.",
    en: "Authentication templates don't allow emojis. Remove all emojis from the text.",
  },
  {
    match: /authentication.*one.button|only one button/i,
    ar: "قوالب المصادقة تسمح بزرّ واحد فقط (نسخ الرمز). احذف الأزرار الإضافيّة.",
    en: "Authentication templates allow only one button (copy code). Remove the extra buttons.",
  },

  // — Name / format issues —
  {
    match: /invalid.*name|template.*name.*invalid|name.*format/i,
    ar: "اسم القالب يجب أن يكون أحرف إنجليزيّة صغيرة + أرقام + شرطة سفليّة فقط (مثال: order_confirmation).",
    en: "Template name must contain only lowercase letters, digits, and underscores (e.g. order_confirmation).",
  },
  {
    match: /name.*already.*exist|duplicate.*name/i,
    ar: "اسم القالب مستخدم مسبقاً. اختر اسماً مختلفاً.",
    en: "A template with this name already exists. Pick a different name.",
  },

  // — Content / policy —
  {
    match: /promotional.*content.*not.*allowed|forbidden.*content|prohibited/i,
    ar: "النصّ يحوي محتوى محظور (مثل: قمار، أدوية، بنوك بدون ترخيص). راجع النصّ وأزل الكلمات المحظورة.",
    en: "Body contains prohibited content (e.g. gambling, pharma, unlicensed financial). Review and remove banned terms.",
  },
  {
    match: /opt.?out|unsubscribe/i,
    ar: "القالب التسويقي يجب أن يحوي طريقة إلغاء اشتراك (مثل: \"للإيقاف أرسل STOP\") في التذييل.",
    en: "Marketing templates must include an opt-out method (e.g. 'Reply STOP to unsubscribe') in the footer.",
  },
  {
    match: /missing.*example|example.*required|placeholder.*example/i,
    ar: "بعض المتغيّرات {{1}}, {{2}}... تحتاج أمثلة. أضف نموذجاً لكل متغيّر في الحقول.",
    en: "Some {{1}}, {{2}}... variables need examples. Provide a sample for each placeholder.",
  },

  // — Variable / parameter issues —
  {
    match: /invalid.*parameter|param.*invalid/i,
    ar: "أحد البارامترات في القالب غير صالح. تحقّق من الـ headers والأزرار.",
    en: "One of the template parameters is invalid. Check the header and buttons sections.",
  },
  {
    match: /variable.*mismatch|param.*count|number of variables/i,
    ar: "عدد المتغيّرات في النصّ لا يطابق عدد الأمثلة المُقدَّمة. تأكّد {{1}}, {{2}}... كلّها لها مثال.",
    en: "Number of variables in body doesn't match the examples provided. Make sure each {{N}} has a sample.",
  },

  // — Buttons —
  {
    match: /button.*url.*invalid|invalid.*url/i,
    ar: "رابط زرّ URL غير صالح. تأكّد أنّه يبدأ بـ https:// وأنّه عام.",
    en: "Button URL is invalid. Make sure it starts with https:// and is publicly accessible.",
  },
  {
    match: /button.*phone.*invalid|invalid.*phone/i,
    ar: "رقم الهاتف في الزرّ غير صالح. استخدم صيغة دوليّة (+966...).",
    en: "Phone number in button is invalid. Use international format (+966...).",
  },
  {
    match: /more.*than.*3.*button|too many buttons/i,
    ar: "Meta تسمح بحدّ أقصى 3 أزرار CTA (URL/هاتف) أو 10 أزرار quick reply.",
    en: "Meta allows max 3 CTA buttons (URL/phone) or 10 quick reply buttons.",
  },

  // — Header / media —
  {
    match: /header.*media.*invalid|invalid.*header.*format/i,
    ar: "تنسيق وسائط الـ header غير صالح. استخدم: JPEG/PNG للصور، MP4 للفيديو، PDF للملفات.",
    en: "Header media format invalid. Use: JPEG/PNG for images, MP4 for video, PDF for documents.",
  },
  {
    match: /header.*size|file.*too.*large/i,
    ar: "حجم ملف الـ header يتجاوز الحدّ. الحدّ: صور 5 ميجا، فيديو 16 ميجا، PDF 100 ميجا.",
    en: "Header file too large. Limits: image 5 MB, video 16 MB, PDF 100 MB.",
  },

  // — Quality / rate limit —
  {
    match: /quality.*rating|low.*quality|message.*flagged/i,
    ar: "تمّ تقييد الرقم بسبب جودة الرسائل المنخفضة (block rate عالية). راجع المحتوى وقلّل الإرسال.",
    en: "Number is rate-limited due to low quality / high block rate. Review content and slow sending.",
  },
  {
    match: /rate.*limit|too.*many.*request/i,
    ar: "تجاوزت حدّ الإرسال اللحظي. انتظر دقيقة وحاول مجدّداً، أو راجع Tier الحالي.",
    en: "Rate limit exceeded. Wait a minute and retry, or check your current Tier.",
  },

  // — Generic OAuth / auth —
  {
    match: /oauth|access.*token|invalid.*token|unauthorized/i,
    ar: "خطأ في صلاحيّات الاتصال مع Meta. تحقّق من ربط حساب 360dialog/Meta.",
    en: "Authentication error with Meta. Verify your 360dialog/Meta connection.",
  },
];

/**
 * Pulls the most useful error string out of a Meta payload.
 */
function extractMessage(payload: MetaErrorPayload): string {
  if (!payload) return "";
  if (typeof payload === "string") return payload;

  // Walk known fields by fidelity. error_user_msg is Meta's own
  // friendly version when they bother to include one.
  return (
    payload.error?.error_user_msg ||
    payload.error?.message ||
    payload.message ||
    (payload as any).error?.error_user_title ||
    ""
  );
}

/**
 * Pulls the Meta error code if available — useful for the support
 * team when an error doesn't translate well.
 */
export function extractMetaCode(payload: MetaErrorPayload): number | null {
  if (!payload || typeof payload === "string") return null;
  return payload.error?.code ?? payload.code ?? null;
}

/**
 * Main translator. Returns a friendly message in the requested
 * locale, falls back to the original message if no pattern matches.
 *
 * Usage:
 *   const friendly = translateMetaError(template.provider_error_details, isAr);
 */
export function translateMetaError(payload: MetaErrorPayload, isAr: boolean = true): string {
  const original = extractMessage(payload);
  if (!original) {
    return isAr ? "لم يتمّ توفير تفاصيل الخطأ." : "No error details available.";
  }

  for (const p of PATTERNS) {
    if (p.match.test(original)) {
      return isAr ? p.ar : p.en;
    }
  }

  // No pattern hit — return the original message but prefix it so
  // the operator knows it's untranslated provider text rather than
  // platform copy.
  const prefix = isAr ? "ميتا: " : "Meta: ";
  return prefix + original;
}

/**
 * Returns true when the payload carries enough structure to render
 * the "Show technical details" toggle in the UI. We hide the raw
 * JSON behind a click since most operators don't want to see it.
 */
export function hasMetaTechnicalDetails(payload: MetaErrorPayload): boolean {
  if (!payload || typeof payload === "string") return false;
  return !!(payload.error || payload.raw || payload.code);
}
