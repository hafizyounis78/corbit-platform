// نقطة واحدة لأحداث التسويق: تُدفع إلى dataLayer الخاص بـ GTM، وهو من يحوّلها إلى
// GA4 / Google Ads / Meta. كل حدث يحمل مصدر الزائر الإعلاني ليُقرأ كمتغيّر Data Layer
// (attribution.last.utm_source ...). لا يفعل شيئاً على الخادم ولا يكسر الصفحة أبداً.
import { getAttribution } from "./attribution";

export type TrackItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
};

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

function push(entry: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(entry);
}

export function track(event: string, params: Record<string, unknown> = {}): void {
  try {
    push({ event, product: "whatsbit", attribution: getAttribution() ?? {}, ...params });
  } catch {
    // التتبع لا يكسر الصفحة أبداً
  }
}

// أحداث GA4 التجارية (begin_checkout, purchase): يُمسح كائن ecommerce السابق أولاً كما تطلب GA4.
export function trackEcommerce(
  event: string,
  ecommerce: { value: number; items: TrackItem[]; [key: string]: unknown },
  params: Record<string, unknown> = {},
): void {
  try {
    push({ ecommerce: null });
    push({
      event,
      product: "whatsbit",
      attribution: getAttribution() ?? {},
      ...params,
      ecommerce: { currency: "SAR", ...ecommerce },
    });
  } catch {
    // التتبع لا يكسر الصفحة أبداً
  }
}

const SENT_PURCHASES = "wb_sent_purchases";

// purchase مرة واحدة لكل دفعة، ولو أُعيد تحميل صفحة النجاح.
export function trackPurchaseOnce(purchase: {
  transaction_id: string;
  value: number;
  items: TrackItem[];
  payment_type?: string;
}): void {
  try {
    const sent: string[] = JSON.parse(localStorage.getItem(SENT_PURCHASES) || "[]");
    if (sent.includes(purchase.transaction_id)) return;
    trackEcommerce("purchase", purchase);
    localStorage.setItem(SENT_PURCHASES, JSON.stringify([...sent, purchase.transaction_id].slice(-50)));
  } catch {
    // تجاهل
  }
}
