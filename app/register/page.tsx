"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import api from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import { track } from "@/lib/marketing/track";
import { attributionPayload } from "@/lib/marketing/attribution";
import { EyeIcon } from "@/components/auth/auth-shell";
import { OrderLines, PayStep, PlanStep, type PayState, type Selection } from "./plan-steps";
import { PLAN_COPY, TRIAL, money, orderLines, quote as calcQuote, type Catalog, type CatalogPlan, type PlanKey } from "./plan-data";
import "./register.css";

/**
 * Signup, in the new design.
 *
 * Step 1: the account (name, email, mobile, password), then the mobile
 * number is proven with a 6-digit SMS code. Step 2: the business
 * (name, sector, commercial registration, VAT, city, the WhatsApp
 * Business number to connect, display name). The account is created at
 * the end of step 2 and the user lands on the dashboard.
 *
 * The design's steps 3–4 (plan / self-service trial, payment) are not
 * built yet — they wait on pricing and payment decisions.
 */

const PRODUCT_URL = "https://corbit.sa/products/whatsapp";
const RESEND_SECONDS = 60;

const STEPS = [
  { t: "إنشاء الحساب", d: "بياناتك والتحقق من الجوال" },
  { t: "بيانات المنشأة", d: "السجل التجاري ورقم واتساب" },
  { t: "الباقة أو التجربة", d: "اشترك بباقة أو جرّب مجانًا" },
  { t: "الدفع", d: "مدى أو بطاقة ائتمانية أو Apple Pay" },
] as const;

const SECTORS = ["تجزئة ومتاجر إلكترونية", "مطاعم ومقاهٍ", "صحة وعيادات", "تعليم وتدريب", "خدمات مالية", "عقارات", "أخرى"];

type View = "1a" | "1b" | "2" | "3" | "4";
const ORDER: Record<View, number> = { "1a": 1, "1b": 1.5, "2": 2, "3": 3, "4": 4 };
const VIEW_STEP: Record<View, number> = { "1a": 1, "1b": 1, "2": 2, "3": 3, "4": 4 };

/** How long to keep asking for the bank's verdict after coming back from the payment page. */
const PAY_POLL_MS = 3000;
const PAY_POLL_TRIES = 20;

const FIELDS = {
  "1a": ["name", "email", "phone", "pass"],
  "2": ["biz", "sector", "cr", "vat", "city", "wa", "disp"],
} as const;
type Field = (typeof FIELDS)["1a"][number] | (typeof FIELDS)["2"][number];
const FIELD_VIEW: Record<Field, "1a" | "2"> = {
  name: "1a", email: "1a", phone: "1a", pass: "1a",
  biz: "2", sector: "2", cr: "2", vat: "2", city: "2", wa: "2", disp: "2",
};
const EMPTY: Record<Field, string> = { name: "", email: "", phone: "", pass: "", biz: "", sector: "", cr: "", vat: "", city: "", wa: "", disp: "" };

/** Backend field name → the form field it belongs to. */
const SERVER_FIELD: Record<string, Field> = {
  name: "name", email: "email", phone: "phone", password: "pass",
  companyName: "biz", sector: "sector", cr_number: "cr", vat_number: "vat", city: "city", wa_number: "wa", display_name: "disp",
};

/** Same policy the backend enforces: 8+ characters with an uppercase letter, a lowercase letter and a digit. */
const passwordOk = (p: string) => p.length >= 8 && p.length <= 72 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);

function errOf(k: Field, v: Record<Field, string>): string {
  const x = v[k] || "";
  switch (k) {
    case "name": return x.trim().length < 3 ? "اكتب اسمك الكامل" : "";
    case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x.trim()) ? "" : "اكتب بريدًا إلكترونيًا صحيحًا، مثل name@company.com";
    case "phone": return /^5\d{8}$/.test(x) ? "" : "رقم الجوال 9 أرقام ويبدأ بالرقم 5";
    case "pass": return passwordOk(x) ? "" : "استخدم 8 أحرف على الأقل، فيها حرف كبير وحرف صغير ورقم";
    case "biz": return x.trim().length < 2 ? "اكتب اسم المنشأة" : "";
    case "sector": return x ? "" : "اختر قطاع المنشأة";
    case "cr": return /^\d{10}$/.test(x) ? "" : "رقم السجل التجاري 10 أرقام";
    case "vat": return !x || /^3\d{13}3$/.test(x) ? "" : "الرقم الضريبي 15 رقمًا ويبدأ وينتهي بالرقم 3";
    case "city": return x.trim().length < 2 ? "اكتب مدينة المنشأة" : "";
    case "wa": return /^5\d{8}$/.test(x) ? "" : "رقم واتساب 9 أرقام ويبدأ بالرقم 5";
    case "disp": return x.trim().length < 2 ? "اكتب الاسم الذي سيظهر لعملائك" : "";
  }
}

/** Keep only what the field accepts (digits for numbers, national part for mobiles). */
function clean(k: Field, raw: string): string {
  if (k === "phone" || k === "wa") {
    let d = raw.replace(/\D/g, "");
    if (d.startsWith("966") && d.length > 9) d = d.slice(3);
    d = d.replace(/^0+/, "");
    return d.slice(0, 9);
  }
  if (k === "cr") return raw.replace(/\D/g, "").slice(0, 10);
  if (k === "vat") return raw.replace(/\D/g, "").slice(0, 15);
  return raw;
}

/** "5X XXX XXXX" */
const showPhone = (d: string) => [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(" ");
const mmss = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function strength(p: string): 0 | 1 | 2 | 3 | 4 {
  if (!p) return 0;
  if (!passwordOk(p)) return 1;
  const extra = (/[^A-Za-z0-9\s]/.test(p) ? 1 : 0) + (p.length >= 12 ? 1 : 0);
  return extra >= 2 ? 4 : extra === 1 ? 3 : 2;
}

const Check = ({ w = 2.6, cls }: { w?: number; cls?: string }) => (
  <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
const Shield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4" /></svg>
);
const Phone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
);

/** WhatsBit mark (the design uses an image; this is the same mark as the login screen). */
const Mark = () => (
  <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="wrArcA" x1="12" y1="62" x2="64" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FF8A1C" /><stop offset=".35" stopColor="#FF2D8F" /><stop offset="1" stopColor="#FF8A1C" /></linearGradient>
      <linearGradient id="wrArcB" x1="86" y1="55" x2="55" y2="86" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FF8A1C" /><stop offset="1" stopColor="#FF2D8F" /></linearGradient>
    </defs>
    <path d="M14.5 56.3A36 36 0 0 1 62.3 16.2" stroke="url(#wrArcA)" strokeWidth="3" strokeLinecap="round" />
    <path d="M85.5 56.3A36 36 0 0 1 56.3 85.5" stroke="url(#wrArcB)" strokeWidth="3" strokeLinecap="round" />
    <path d="M66 25.5A28 28 0 0 0 30.2 69.8L24 81l14-6.2A28 28 0 0 0 73.5 64" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="76" y="24" width="6.5" height="6.5" rx="1.2" fill="#FF5B5B" />
    <rect x="66" y="33.5" width="13" height="6.5" rx="1.4" fill="#28A745" /><rect x="56" y="38" width="6" height="4.5" rx="1.1" fill="#28A745" />
    <rect x="59" y="44" width="14.5" height="7" rx="1.4" fill="#28A745" /><rect x="79" y="42" width="8" height="4.8" rx="1.1" fill="#28A745" />
    <rect x="49" y="47.5" width="6" height="4.2" rx="1.1" fill="#28A745" /><rect x="39" y="55" width="7.5" height="5" rx="1.1" fill="#28A745" />
    <rect x="52" y="54.5" width="8.5" height="5" rx="1.1" fill="#28A745" /><rect x="66" y="53.5" width="12" height="5.8" rx="1.3" fill="#28A745" />
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [view, setView] = useState<View>("1a");
  const [leaving, setLeaving] = useState(false);
  const [back, setBack] = useState(false);
  const [maxDone, setMaxDone] = useState(0);

  const [v, setV] = useState<Record<Field, string>>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState<Partial<Record<"1a" | "2", boolean>>>({});
  const [serverErr, setServerErr] = useState<Partial<Record<Field, string>>>({});
  const [agree, setAgree] = useState(false);
  const [pw, setPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  // phone verification
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpErr, setOtpErr] = useState("");
  const [otpNote, setOtpNote] = useState("");
  const [cd, setCd] = useState(0);
  const [sentTo, setSentTo] = useState("");
  const [verified, setVerified] = useState<{ phone: string; token: string } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const working = useRef(false);
  const done = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // steps 3–4: the account exists from here on
  const [created, setCreated] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sel, setSel] = useState<Selection>({ path: "plan", yearly: false, plan: "business", extra: {} });
  const [pay, setPay] = useState<PayState>({ kind: "review" });
  // discount code: what is typed, and the backend's quote once it accepted the code
  const [promo, setPromo] = useState("");
  const [promoErr, setPromoErr] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [applied, setApplied] = useState<{ code: string; discountH: number; vatH: number; totH: number } | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Ask the backend what happened to an order until the bank has answered. */
  const pollOrder = useCallback((orderNo: string, attempt = 0) => {
    api.get(API.SUBSCRIPTION.ORDER(orderNo)).then((res) => {
      const o = res.data?.data ?? {};
      if (o.status === "paid") { setMaxDone(4); setPay({ kind: "paid", orderNo, method: o.payment_method }); return; }
      if (o.status === "failed") {
        // put the same selection back so the customer can simply try again
        const key = o.quote?.key as PlanKey | undefined;
        if (key) setSel((s) => ({ ...s, path: "plan", plan: key, yearly: o.period === "yearly", extra: { ...s.extra, [key]: o.extra_users ?? 0 } }));
        if (o.coupon_code) setPromo(o.coupon_code); // typed back in; «تطبيق» checks it again
        setPay({ kind: "failed", reason: o.failure_reason === "gateway_unavailable" ? "" : (o.failure_reason || "") });
        return;
      }
      if (attempt + 1 >= PAY_POLL_TRIES) { setPay({ kind: "late", orderNo }); return; }
      pollTimer.current = setTimeout(() => pollOrder(orderNo, attempt + 1), PAY_POLL_MS);
    }).catch((e) => {
      if (e?.response?.status === 404) { setPay({ kind: "review" }); return; }
      if (attempt + 1 >= PAY_POLL_TRIES) { setPay({ kind: "late", orderNo }); return; }
      pollTimer.current = setTimeout(() => pollOrder(orderNo, attempt + 1), PAY_POLL_MS);
    });
  }, []);

  // A signed-in visitor is either back from the payment page (?order=…), continuing at the
  // plan step (?step=plan, e.g. from the trial), or has no business here.
  useEffect(() => {
    if (isLoading || !isAuthenticated || done.current) return;
    const qs = new URLSearchParams(window.location.search);
    const orderNo = qs.get("order");
    if (orderNo) {
      done.current = true; setCreated(true); setMaxDone(3); setView("4"); setPay({ kind: "checking" });
      pollOrder(orderNo);
    } else if (qs.get("step") === "plan") {
      done.current = true; setCreated(true); setMaxDone(2); setView("3");
    } else router.replace("/dashboard");
  }, [isAuthenticated, isLoading, router, pollOrder]);

  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

  // A code is priced against one exact selection — change the selection and it must be applied again.
  useEffect(() => { setApplied(null); setPromoErr(""); }, [sel.plan, sel.yearly, sel.extra, sel.path]);

  // the price list, once the plan step is reached
  useEffect(() => {
    if ((view !== "3" && view !== "4") || catalog) return;
    let alive = true;
    api.get(API.SUBSCRIPTION.CATALOG).then((res) => {
      if (!alive) return;
      const c = res.data.data as Catalog;
      setCatalog(c);
      setSel((s) => (c.plans.some((p) => p.key === s.plan) || !c.plans.length ? s : { ...s, plan: c.plans[0].key }));
    }).catch(() => { if (alive) setFormErr("تعذّر تحميل الباقات. حدّث الصفحة وحاول مرة أخرى."); });
    return () => { alive = false; };
  }, [view, catalog]);

  // resend countdown
  useEffect(() => {
    if (cd <= 0) return;
    const id = setTimeout(() => setCd((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cd]);

  useEffect(() => () => { if (navTimer.current) clearTimeout(navTimer.current); }, []);

  const q = <T extends HTMLElement>(sel: string) => rootRef.current?.querySelector<T>(sel) ?? null;

  /** Switch step with the design's short fade, then move focus to the new step. */
  const go = useCallback((to: View) => {
    setView((cur) => {
      if (cur === to) return cur;
      setBack(ORDER[to] < ORDER[cur]);
      setLeaving(true);
      if (navTimer.current) clearTimeout(navTimer.current);
      navTimer.current = setTimeout(() => {
        setView(to);
        setLeaving(false);
        setTimeout(() => {
          const sc = q(".mscroll"); if (sc) sc.scrollTop = 0;
          const wide = typeof window !== "undefined" && window.matchMedia("(min-width: 860px) and (orientation: landscape)").matches;
          const el = to === "1b" ? q<HTMLElement>(".cell") : (wide ? q<HTMLElement>(".view input:not([type=checkbox])") : null);
          try { (el ?? q<HTMLElement>(".view h1"))?.focus({ preventScroll: true }); } catch { /* ignore */ }
        }, 60);
      }, 170);
      return cur;
    });
    // q reads a ref — stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setVal = (k: Field, raw: string) => {
    setV((s) => ({ ...s, [k]: clean(k, raw) }));
    if (serverErr[k]) setServerErr((s) => ({ ...s, [k]: "" }));
    if (formErr) setFormErr("");
  };

  const fld = (k: Field) => {
    const e = serverErr[k] || errOf(k, v);
    const show = !!e && !!(submitted[FIELD_VIEW[k]] || touched[k] || serverErr[k]);
    return {
      cls: "fld" + (show ? " bad" : "") + (!e && v[k] ? " ok" : ""),
      err: e,
      input: {
        value: k === "phone" || k === "wa" ? showPhone(v[k]) : v[k],
        onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setVal(k, ev.target.value),
        onBlur: () => { if (v[k] && !touched[k]) setTouched((t) => ({ ...t, [k]: true })); },
        "aria-invalid": show,
        "aria-describedby": `wr-${k}-e`,
      },
    };
  };

  const firstBad = () => setTimeout(() => { try { q<HTMLElement>(".fld.bad input, .fld.bad select")?.focus(); } catch { /* ignore */ } }, 40);
  const fullPhone = () => "966" + v.phone;

  /** A failed request → the message to show. Our own wording unless the server said something specific. */
  const netError = (e: any, fallback: string) => (!e?.response ? "تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى." : (e.response.data?.message || fallback));

  const requestCode = async (isResend: boolean) => {
    if (working.current) return;
    working.current = true; setBusy(true); setFormErr(""); setOtpErr(""); setOtpNote("");
    try {
      const res = await api.post(API.AUTH.REGISTER_PHONE_SEND, { phone: fullPhone() });
      setSentTo(v.phone);
      setOtp(["", "", "", "", "", ""]);
      setCd(Number(res.data?.data?.resend_in_seconds) || RESEND_SECONDS);
      if (isResend) { setOtpNote("أرسلنا رمزًا جديدًا"); setTimeout(() => q<HTMLElement>(".cell")?.focus(), 30); }
      else go("1b");
    } catch (e: any) {
      const msg = netError(e, "تعذّر إرسال الرمز الآن. حاول بعد قليل.");
      const field = e?.response?.status === 422 && e.response.data?.errors?.phone?.[0];
      if (isResend) setOtpErr(msg);
      else if (field) setServerErr((s) => ({ ...s, phone: String(field) }));
      else setFormErr(msg);
    } finally { working.current = false; setBusy(false); }
  };

  const verifyCode = async (cells: string[]) => {
    if (working.current) return;
    const code = cells.join("");
    if (code.length < 6) { setOtpErr("أدخل الرمز المكوّن من 6 أرقام"); return; }
    working.current = true; setBusy(true); setOtpErr(""); setOtpNote("");
    try {
      const res = await api.post(API.AUTH.REGISTER_PHONE_VERIFY, { phone: fullPhone(), code });
      setVerified({ phone: v.phone, token: res.data.data.phone_token });
      setMaxDone((m) => Math.max(m, 1));
      setCd(0);
      go("2");
    } catch (e: any) {
      setOtpErr(e?.response?.status === 422 ? "الرمز غير صحيح أو منتهٍ. تأكد منه أو اطلب رمزًا جديدًا." : netError(e, "تعذّر التحقق من الرمز. حاول مرة أخرى."));
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => q<HTMLElement>(".cell")?.focus(), 30);
    } finally { working.current = false; setBusy(false); }
  };

  const createAccount = async () => {
    if (working.current || !verified) return;
    working.current = true; setBusy(true); setFormErr("");
    // Same event name as the SMS portal and SchoolBit: a valid form was submitted.
    track("begin_registration");
    try {
      const res = await api.post(API.AUTH.REGISTER, {
        companyName: v.biz.trim(),
        name: v.name.trim(),
        email: v.email.trim(),
        phone: fullPhone(),
        phone_token: verified.token,
        password: v.pass,
        password_confirmation: v.pass,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        sector: v.sector,
        cr_number: v.cr,
        vat_number: v.vat || null,
        city: v.city.trim(),
        wa_number: "966" + v.wa,
        display_name: v.disp.trim(),
        // Ad source of the visitor (UTM/GCLID), stored with the organization.
        attribution: attributionPayload(),
      });
      const { token, user, trial } = res.data.data;
      done.current = true;
      track("sign_up", { method: "email" });
      if (trial?.days) track("start_trial", { trial_type: "signup", trial_days: trial.days });
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      // The account exists; the customer now chooses a plan or the trial.
      setCreated(true);
      setMaxDone((m) => Math.max(m, 2));
      working.current = false; setBusy(false);
      go("3");
      return;
    } catch (e: any) {
      const errors: Record<string, string[]> | undefined = e?.response?.status === 422 ? e.response.data?.errors : undefined;
      if (errors?.phone_token) {
        // The verification ran out (30 minutes) — verify the number again.
        setVerified(null); setSentTo("");
        setFormErr(String(errors.phone_token[0]));
        go("1a");
      } else if (errors) {
        const mapped: Partial<Record<Field, string>> = {};
        for (const [name, msgs] of Object.entries(errors)) { const k = SERVER_FIELD[name]; if (k && msgs?.[0]) mapped[k] = String(msgs[0]); }
        const keys = Object.keys(mapped) as Field[];
        if (keys.length) {
          setServerErr(mapped);
          if (keys.some((k) => FIELD_VIEW[k] === "1a")) go("1a");
          firstBad();
        } else setFormErr(netError(e, "تعذّر إنشاء الحساب. حاول مرة أخرى."));
      } else setFormErr(netError(e, "تعذّر إنشاء الحساب. حاول مرة أخرى."));
    }
    working.current = false; setBusy(false);
  };

  const enterPlatform = () => { window.location.href = "/dashboard"; };

  /** Open the PayTabs payment page for the selection. The backend prices it. */
  const startPayment = async () => {
    if (working.current || !catalog) return;
    working.current = true; setBusy(true); setFormErr("");
    try {
      const res = await api.post(API.SUBSCRIPTION.CHECKOUT, {
        plan: sel.plan, period: sel.yearly ? "yearly" : "monthly", extra_users: sel.extra[sel.plan] ?? 0,
        coupon: applied?.code ?? null,
      });
      const { redirect_url, order } = res.data.data;
      if (redirect_url) { window.location.href = redirect_url; return; } // stays busy while the browser leaves
      if (order?.status === "paid") { setMaxDone(4); setPay({ kind: "paid", orderNo: order.order_no, method: order.payment_method }); }
      else setFormErr("تعذّر فتح صفحة الدفع الآن. لم يُخصم أي مبلغ، حاول مرة أخرى بعد قليل.");
    } catch (e: any) {
      if (e?.response?.data?.errors?.code === "coupon_rejected") {
        // the code stopped applying between «تطبيق» and «ادفع» (e.g. its uses ran out)
        setApplied(null); setPromoErr(String(e.response.data.message || "رمز الخصم غير صالح"));
      } else setFormErr(netError(e, "تعذّر فتح صفحة الدفع الآن. لم يُخصم أي مبلغ، حاول مرة أخرى بعد قليل."));
    }
    working.current = false; setBusy(false);
  };

  /** «تطبيق»: the backend decides whether the code applies and prices the order with it. */
  const applyPromo = async () => {
    if (promoBusy) return;
    if (!promo) { setPromoErr("اكتب رمز الخصم أولًا"); return; }
    setPromoBusy(true); setPromoErr("");
    try {
      const res = await api.post(API.SUBSCRIPTION.QUOTE, {
        plan: sel.plan, period: sel.yearly ? "yearly" : "monthly", extra_users: sel.extra[sel.plan] ?? 0, coupon: promo,
      });
      const q = res.data.data;
      setApplied({ code: q.coupon_code, discountH: q.discount_halalas, vatH: q.vat_halalas, totH: q.total_halalas });
      setPromo(q.coupon_code);
    } catch (e: any) {
      setApplied(null);
      setPromoErr(e?.response?.status === 422 ? String(e.response.data?.message || "الرمز غير صالح") : netError(e, "تعذّر التحقق من الرمز. حاول مرة أخرى."));
    }
    setPromoBusy(false);
  };

  const submit = (ev?: React.SyntheticEvent) => {
    ev?.preventDefault();
    if (leaving || busy) return;
    if (view === "1b") { verifyCode(otp); return; }
    if (view === "3") {
      if (!catalog) return;
      if (sel.path === "trial") { enterPlatform(); return; }
      setMaxDone((m) => Math.max(m, 3)); setPay({ kind: "review" }); setFormErr("");
      go("4");
      return;
    }
    if (view === "4") { startPayment(); return; }
    const bad = FIELDS[view].some((k) => !!errOf(k, v)) || (view === "1a" && !agree);
    if (bad) { setSubmitted((s) => ({ ...s, [view]: true })); firstBad(); return; }
    if (view === "1a") {
      if (verified?.phone === v.phone) { setMaxDone((m) => Math.max(m, 1)); go("2"); }
      else if (sentTo === v.phone && cd > 0) go("1b"); // a code for this number is still fresh
      else requestCode(false);
    } else createAccount();
  };

  // --- OTP cells ---
  const otpInput = (k: number, raw: string, el: HTMLInputElement, paste: boolean) => {
    const o = otp.slice();
    let last = k;
    if (paste || raw.length >= 3) {
      const start = paste ? 0 : k;
      raw.slice(0, 6 - start).split("").forEach((ch, i) => { o[start + i] = ch; last = start + i; });
    } else o[k] = raw.slice(-1);
    setOtp(o); setOtpErr(""); setOtpNote("");
    const cells = el.parentElement?.querySelectorAll<HTMLInputElement>(".cell");
    if ((o[k] || paste) && cells?.length) cells[Math.min(last + 1, 5)]?.focus();
    if (o.join("").length === 6) setTimeout(() => verifyCode(o), 260);
  };
  const otpKey = (k: number, ev: React.KeyboardEvent<HTMLInputElement>) => {
    const cells = ev.currentTarget.parentElement?.querySelectorAll<HTMLInputElement>(".cell");
    if (!cells) return;
    if (ev.key === "Backspace" && !otp[k] && k > 0) { ev.preventDefault(); const o = otp.slice(); o[k - 1] = ""; setOtp(o); cells[k - 1].focus(); }
    else if (ev.key === "ArrowLeft" && k > 0) { ev.preventDefault(); cells[k - 1].focus(); }
    else if (ev.key === "ArrowRight" && k < 5) { ev.preventDefault(); cells[k + 1].focus(); }
  };

  if (isLoading) return (
    <div className="wr" style={{ display: "grid", gridTemplateColumns: "1fr", placeItems: "center" }} dir="rtl" lang="ar">
      <div style={{ color: "var(--ink2)", fontSize: 15 }}>جاري التحميل...</div>
    </div>
  );

  const step = VIEW_STEP[view];
  const isTrial = sel.path === "trial";
  const P: CatalogPlan | null = catalog?.plans.find((p) => p.key === sel.plan) ?? catalog?.plans[0] ?? null;
  const quoteOf = (p: CatalogPlan, extra = sel.extra[p.key] ?? 0) => calcQuote(p, sel.yearly, extra, catalog!);
  const xu = P ? sel.extra[P.key] ?? 0 : 0;
  const Q = P && catalog ? quoteOf(P, xu) : null;
  const baseLines = P && Q && catalog ? orderLines(P, sel.yearly, xu, Q, catalog.vat_percent) : [];
  // With a code applied the discount, VAT and total are the backend's figures.
  const lines = applied
    ? [...baseLines.slice(0, -1), { k: `خصم الرمز ${applied.code}`, v: `−${money(applied.discountH)}` }, { ...baseLines[baseLines.length - 1], v: money(applied.vatH) }]
    : baseLines;
  const total = applied ? money(applied.totH) : Q ? money(Q.totH) : "";
  const nothingToPay = !!applied && applied.totH === 0;
  const payBusy = pay.kind === "checking" || pay.kind === "paid" || pay.kind === "late";
  const f = Object.fromEntries((Object.keys(FIELD_VIEW) as Field[]).map((k) => [k, fld(k)])) as Record<Field, ReturnType<typeof fld>>;
  const agreeBad = !agree && !!submitted["1a"];
  const ps = strength(v.pass);
  const nm = v.name.trim() || (created ? (user?.name ?? "") : "");
  const email = v.email.trim() || (created ? (user?.email ?? "") : "");
  const bizName = v.biz.trim() || (created ? ((user as any)?.organization?.name ?? "") : "");
  const phoneShown = v.phone ? `+966 ${showPhone(v.phone)}` : (user?.phone ? `+${String(user.phone).replace(/\D/g, "")}` : "");
  // Once the account exists steps 1–2 are closed; the only way back is from payment to the plan step.
  const canBack = !busy && (created ? view === "4" && !payBusy : view !== "1a");
  const goBack = () => { if (!canBack) return; go(created ? "3" : "1a"); };
  const actLabel = view === "1a" ? "متابعة" : view === "1b" ? "تحقق ومتابعة" : view === "2" ? "متابعة"
    : view === "3" ? (isTrial ? "ابدأ التجربة المجانية" : "متابعة إلى الدفع") : nothingToPay ? "فعّل الاشتراك" : `ادفع ${total} ر.س`;

  return (
    <div className={`wr v${view}` + (leaving ? " leaving" : "") + (back ? " back" : "")} dir="rtl" lang="ar" ref={rootRef}>

      {/* ===== brand side panel (desktop) ===== */}
      <aside className="side" aria-label="خطوات إنشاء الحساب">
        <a className="brand" href={PRODUCT_URL} aria-label="WhatsBit — صفحة المنتج">
          <Mark />
          <span className="bw"><b>Whats<span className="g">Bit</span></b><small>منصة من كوربت</small></span>
        </a>
        <p className="s-lab">اشتراك جديد · 4 خطوات</p>
        <ol className="steps">
          {STEPS.map((s, i) => {
            const n = i + 1, cur = n === step, isDone = !cur && maxDone >= n;
            const can = created ? (n === 3 && view === "4" && canBack) : (n < step && maxDone >= n);
            return (
              <li key={n} className={"st" + (cur ? " cur" : isDone ? " done" : "") + (maxDone >= n ? " fill" : "")}>
                <button type="button" className="sbtn" disabled={!can} aria-current={cur ? "step" : undefined}
                  aria-label={s.t + (cur ? " — الخطوة الحالية" : isDone ? " — مكتملة" : "")} onClick={() => can && go(created ? "3" : "1a")}>
                  <span className="sn"><span className="sn-n">{n}</span><Check w={3} /></span>
                  <span className="stx"><b>{s.t}</b><small>{n === 4 && isTrial ? "لا يلزم للتجربة المجانية" : s.d}</small></span>
                </button>
              </li>
            );
          })}
        </ol>

        <section className={"sum" + (step >= 4 ? " compact" : "")} aria-label="ملخص الطلب">
          <div className="sm-hd"><span>ملخص الطلب</span>{step >= 3 && <span className="sm-tag">{isTrial ? "تجربة" : pay.kind === "paid" ? "مدفوع" : sel.yearly ? "سنوي" : "شهري"}</span>}</div>
          {step >= 3 && !isTrial && P && Q && (
            <>
              <div className="sm-plan"><b>باقة {PLAN_COPY[P.key].n}</b><span>{sel.yearly ? "اشتراك سنوي" : "اشتراك شهري"}</span></div>
              <OrderLines lines={lines} />
              <div className="tot"><span className="tl-l">الإجمالي المستحق<small>شامل ضريبة القيمة المضافة</small></span><b><span className="num">{total}</span> <small>ر.س</small></b></div>
              <p className="sm-meta">رسوم Meta للرسائل تُحتسب منفصلة حسب الاستخدام</p>
            </>
          )}
          {step >= 3 && isTrial && (
            <>
              <div className="sm-plan sm-tr"><b>تجربة مجانية</b><span>بدون دفع</span></div>
              <dl className="lines">
                <div className="ln"><dt>المدة</dt><dd>{TRIAL.days} أيام</dd></div>
                <div className="ln"><dt>الرسائل</dt><dd>{TRIAL.total} رسالة</dd></div>
                <div className="ln"><dt>المستلمون</dt><dd>جوالك + {TRIAL.inv} أرقام</dd></div>
                <div className="ln"><dt>المرسل</dt><dd>رقم كوربت التجريبي</dd></div>
              </dl>
              <div className="tot"><span className="tl-l">الإجمالي المستحق<small>لا يلزم دفع ولا بطاقة</small></span><b><span className="num">0.00</span> <small>ر.س</small></b></div>
              <p className="sm-meta">تشترك متى شئت وتعود لاختيار الباقة وبياناتك محفوظة</p>
            </>
          )}
          {step < 3 && (<>
          <div className="sm-who">
            <div className={"sm-row" + (nm ? " on" : "")}>
              <span className="sm-av">{nm ? nm.charAt(0) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c.9-3.6 3.9-6 7.5-6s6.6 2.4 7.5 6" /></svg>
              )}</span>
              <span className="sm-tx"><b>{nm || "حسابك"}</b><small>{email || "الاسم والبريد الإلكتروني"}</small></span>
            </div>
            <div className={"sm-row" + (bizName ? " on" : "")}>
              <span className="sm-av ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M3 21h18" /></svg></span>
              <span className="sm-tx"><b>{bizName || "منشأتك"}</b><small>{v.cr ? "السجل التجاري " + v.cr : "السجل التجاري والقطاع"}</small></span>
            </div>
          </div>
          <p className="sm-empty">ستظهر هنا الباقة والإجمالي بعد اختيارها في الخطوة 3.</p>
          </>)}
        </section>

        <div className="side-ft">
          <a className="help" href="tel:920006900"><Phone /><span>تحتاج مساعدة؟</span> <b><bdi dir="ltr">920006900</bdi></b></a>
          <a href="https://corbit.sa" target="_blank" rel="noopener"><bdi dir="ltr">corbit.sa</bdi></a>
        </div>
      </aside>

      {/* ===== main ===== */}
      <section className="main">
        <div className="deco" aria-hidden="true" />
        <header className="mtop">
          {view === "1a"
            ? <a className="mback" href={PRODUCT_URL} aria-label="رجوع إلى صفحة WhatsBit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></a>
            : <button type="button" className="mback" onClick={goBack} hidden={!canBack} aria-label="رجوع إلى الخطوة السابقة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>}
          <a className="mbrand" href={PRODUCT_URL} aria-label="WhatsBit"><Mark /><b>Whats<span className="g">Bit</span></b></a>
          <span className="mstep"><b>الخطوة {step} من 4</b><span className="mst-t"> · {STEPS[step - 1].t}</span></span>
          <span className="mbar" aria-hidden="true">{[1, 2, 3, 4].map((n) => <i key={n} className={n < step ? "on" : n === step ? "on cur" : ""} />)}</span>
          <span className="msp" />
          <span className="mlogin">لديك حساب؟ <a href="/login">سجّل الدخول</a></span>
        </header>

        <form className="mform" noValidate autoComplete="on" onSubmit={submit}>
          <div className="mscroll">
            <div className="pane">

              {/* STEP 1 · account */}
              {view === "1a" && (
                <div className="view">
                  <div className="ph"><h1 tabIndex={-1}>أنشئ حسابك</h1><p>ابدأ ببياناتك الأساسية، ثم نتحقق من رقم جوالك برمز يصلك برسالة نصية.</p></div>
                  <div className="card">
                    <div className="g2">
                      <div className={f.name.cls}>
                        <label htmlFor="wr-name">الاسم الكامل</label>
                        <div className="ctrl"><input id="wr-name" name="name" autoComplete="name" placeholder="مثال: سارة العتيبي" {...f.name.input} /><Check cls="okm" /></div>
                        <p className="err" id="wr-name-e">{f.name.err}</p>
                      </div>
                      <div className={f.email.cls}>
                        <label htmlFor="wr-email">البريد الإلكتروني</label>
                        <div className="ctrl"><input id="wr-email" name="email" type="email" dir="ltr" inputMode="email" autoComplete="email" placeholder="name@company.com" {...f.email.input} /><Check cls="okm" /></div>
                        <p className="err" id="wr-email-e">{f.email.err}</p>
                      </div>
                      <div className={f.phone.cls}>
                        <label htmlFor="wr-phone">رقم الجوال</label>
                        <div className="ctrl ltrc"><span className="cc">+966</span><input id="wr-phone" name="tel" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="5X XXX XXXX" {...f.phone.input} /><Check cls="okm" /></div>
                        <p className="err" id="wr-phone-e">{f.phone.err}</p>
                        <p className="hint"><Shield /><span>سنتحقق منه برمز يصلك برسالة نصية</span></p>
                      </div>
                      <div className={f.pass.cls}>
                        <label htmlFor="wr-pass">كلمة المرور</label>
                        <div className="ctrl">
                          <input id="wr-pass" name="new-password" type={pw ? "text" : "password"} dir="ltr" autoComplete="new-password" placeholder="8 أحرف على الأقل" maxLength={72} {...f.pass.input} aria-describedby="wr-pass-m wr-pass-e" />
                          <button type="button" className="eye" onClick={() => setPw((x) => !x)} aria-label={pw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={pw}><EyeIcon off={pw} /></button>
                        </div>
                        <div className={"meter s" + ps} id="wr-pass-m"><i /><i /><i /><i /><span>{["", "ضعيفة", "مقبولة", "جيدة", "قوية"][ps]}</span></div>
                        <p className="err" id="wr-pass-e">{f.pass.err}</p>
                      </div>
                      <div className={"fld full" + (agreeBad ? " bad" : "")}>
                        <label className="chk">
                          <input type="checkbox" name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} aria-invalid={agreeBad} aria-describedby="wr-agree-e" />
                          <span className="box"><Check w={3} /></span>
                          <span>أوافق على <a href="/terms" target="_blank" rel="noopener">الشروط والأحكام</a> و<a href="/privacy" target="_blank" rel="noopener">سياسة الخصوصية</a> و<a href="https://business.whatsapp.com/policy" target="_blank" rel="noopener noreferrer">سياسة واتساب للأعمال</a></span>
                        </label>
                        <p className="err" id="wr-agree-e">يلزم الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة</p>
                      </div>
                    </div>
                  </div>
                  {formErr && <p className="form-err" role="alert">{formErr}</p>}
                  <ul className="assure" aria-label="مزايا المنصة">
                    <li><Shield /><span>الواجهة الرسمية من Meta</span></li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" /></svg><span>متوافقة مع نظام حماية البيانات (PDPL)</span></li>
                    <li><Phone /><span>مساعدة على الرقم <bdi dir="ltr">920006900</bdi></span></li>
                  </ul>
                  <p className="alt-login">لديك حساب؟ <a href="/login">سجّل الدخول</a></p>
                </div>
              )}

              {/* STEP 1 · OTP */}
              {view === "1b" && (
                <div className="view">
                  <div className="ph"><h1 tabIndex={-1}>تحقق من رقم جوالك</h1><p>أرسلنا رمز تحقق من 6 أرقام برسالة نصية إلى <bdi dir="ltr" className="num">{`+966 ${v.phone.charAt(0)}• ••• ••${v.phone.slice(7)}`}</bdi></p></div>
                  <div className="card otp-card">
                    <div className={"otp" + (otp.join("").length === 6 ? " full" : "") + (otpErr ? " bad" : "")} role="group" aria-label="رمز التحقق المكوّن من 6 أرقام">
                      {otp.map((c, k) => (
                        <input key={k} className="cell" inputMode="numeric" autoComplete={k ? "off" : "one-time-code"} aria-label={`الرقم ${k + 1} من 6`} value={c}
                          onChange={(ev) => otpInput(k, ev.target.value.replace(/\D/g, ""), ev.target, false)}
                          onKeyDown={(ev) => otpKey(k, ev)}
                          onPaste={(ev) => { const t = ev.clipboardData.getData("text").replace(/\D/g, ""); if (!t) return; ev.preventDefault(); otpInput(0, t.slice(0, 6), ev.currentTarget, true); }}
                          onFocus={(ev) => { try { ev.target.select(); } catch { /* ignore */ } }} />
                      ))}
                    </div>
                    <p className={"otp-err" + (otpErr ? " on" : "")} role="alert">{otpErr}</p>
                    <div className="otp-meta">
                      {otpNote && <span className="otp-note" role="status"><Check w={2.4} />{otpNote}</span>}
                    </div>
                    <div className="otp-links">
                      {cd > 0
                        ? <span className="cd">إعادة الإرسال بعد <b className="num">{mmss(cd)}</b></span>
                        : <button type="button" className="lnk" disabled={busy} onClick={() => requestCode(true)}>أعد إرسال الرمز</button>}
                      <button type="button" className="lnk muted" onClick={() => { go("1a"); setTimeout(() => { const el = q<HTMLInputElement>("#wr-phone"); try { el?.focus(); el?.select(); } catch { /* ignore */ } }, 320); }}>تغيير الرقم</button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 · business */}
              {view === "2" && (
                <div className="view">
                  <div className="ph"><h1 tabIndex={-1}>بيانات المنشأة</h1><p>أدخل بيانات منشأتك ورقم واتساب الأعمال الذي تريد ربطه بالمنصة.</p></div>
                  <div className="card">
                    <div className="g2">
                      <div className={f.biz.cls}>
                        <label htmlFor="wr-biz">اسم المنشأة</label>
                        <div className="ctrl"><input id="wr-biz" name="organization" autoComplete="organization" placeholder="مثال: متجر النخبة" {...f.biz.input} /><Check cls="okm" /></div>
                        <p className="err" id="wr-biz-e">{f.biz.err}</p>
                      </div>
                      <div className={f.sector.cls}>
                        <label htmlFor="wr-sector">القطاع</label>
                        <div className={"ctrl sel" + (v.sector ? "" : " empty")}>
                          <select id="wr-sector" name="sector" {...f.sector.input}>
                            <option value="" disabled>اختر القطاع</option>
                            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                        <p className="err" id="wr-sector-e">{f.sector.err}</p>
                      </div>
                      <div className={f.cr.cls}>
                        <label htmlFor="wr-cr">رقم السجل التجاري</label>
                        <div className="ctrl ltrc"><input id="wr-cr" name="cr" inputMode="numeric" autoComplete="off" placeholder="10 أرقام" {...f.cr.input} /><Check cls="okm" /></div>
                        <p className="err" id="wr-cr-e">{f.cr.err}</p>
                      </div>
                      <div className={f.vat.cls}>
                        <label htmlFor="wr-vat">الرقم الضريبي <span className="opt">(اختياري)</span></label>
                        <div className="ctrl ltrc"><input id="wr-vat" name="vat" inputMode="numeric" autoComplete="off" placeholder="15 رقمًا يبدأ وينتهي بـ 3" {...f.vat.input} /><Check cls="okm" /></div>
                        <p className="err" id="wr-vat-e">{f.vat.err}</p>
                      </div>
                      <div className={f.city.cls}>
                        <label htmlFor="wr-city">المدينة</label>
                        <div className="ctrl"><input id="wr-city" name="city" autoComplete="address-level2" placeholder="مثال: الرياض" {...f.city.input} /><Check cls="okm" /></div>
                        <p className="err" id="wr-city-e">{f.city.err}</p>
                      </div>
                      <div className={f.wa.cls}>
                        <div className="lbl-row">
                          <label htmlFor="wr-wa">رقم واتساب الأعمال المراد ربطه</label>
                          {v.wa !== v.phone && <button type="button" className="lnk sm" onClick={() => setVal("wa", v.phone)}>نفس رقم الجوال</button>}
                        </div>
                        <div className="ctrl ltrc"><span className="cc">+966</span><input id="wr-wa" name="wa" type="tel" inputMode="numeric" autoComplete="off" placeholder="5X XXX XXXX" {...f.wa.input} /><Check cls="okm" /></div>
                        <p className="err" id="wr-wa-e">{f.wa.err}</p>
                      </div>
                      <div className={f.disp.cls}>
                        <label htmlFor="wr-disp">الاسم الظاهر للعملاء</label>
                        <div className="ctrl"><input id="wr-disp" name="display" autoComplete="off" placeholder="مثال: متجر النخبة" {...f.disp.input} /><Check cls="okm" /></div>
                        <p className="err" id="wr-disp-e">{f.disp.err}</p>
                      </div>
                      <div className="note">
                        <span className="note-ic"><Shield /></span>
                        <p>بعد إنشاء الحساب نساعدك في ربط الرقم بالواجهة الرسمية من Meta وتوثيقه</p>
                      </div>
                    </div>
                  </div>
                  {formErr && <p className="form-err" role="alert">{formErr}</p>}
                </div>
              )}

              {/* STEP 3 · plan or trial */}
              {view === "3" && (catalog && catalog.plans.length
                ? <PlanStep catalog={catalog} sel={sel} onChange={(patch) => setSel((s) => ({ ...s, ...patch }))} quoteOf={quoteOf} biz={bizName} phone={phoneShown} sector={v.sector} />
                : <div className="view"><div className="card pay-res" role="status">{formErr ? <p className="form-err" role="alert">{formErr}</p> : <><span className="wait" aria-hidden="true" /><p>جارٍ تحميل الباقات…</p></>}</div></div>)}

              {/* STEP 4 · payment */}
              {view === "4" && (pay.kind !== "review" && pay.kind !== "failed"
                ? <PayStep lines={[]} total="" periodLabel="" state={pay} error="" onEnter={enterPlatform} />
                : P && Q
                  ? <PayStep lines={lines} total={total} periodLabel={sel.yearly ? "اشتراك سنوي" : "اشتراك شهري"} state={pay} error={formErr} onEnter={enterPlatform}
                      promo={{ value: promo, err: promoErr, busy: promoBusy, applied: applied ? { code: applied.code, saved: money(applied.discountH) } : null,
                        onChange: (x) => { setPromo(x.toUpperCase().replace(/\s/g, "").slice(0, 20)); setPromoErr(""); },
                        onApply: applyPromo, onRemove: () => { setApplied(null); setPromo(""); setPromoErr(""); } }} />
                  : <div className="view"><div className="card pay-res" role="status"><span className="wait" aria-hidden="true" /><p>جارٍ التحميل…</p></div></div>)}

            </div>
            <p className="m-help"><a href="tel:920006900">تحتاج مساعدة؟ <b><bdi dir="ltr">920006900</bdi></b></a></p>
          </div>

          <footer className="act" hidden={view === "4" && payBusy}>
            <div className="act-in">
              {view === "1a"
                ? <a className="btn btn-line act-back" href={PRODUCT_URL}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg><span>رجوع</span></a>
                : <button type="button" className="btn btn-line act-back" onClick={goBack} hidden={!canBack}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg><span>رجوع</span></button>}
              <span className="act-sp" />
              <span className="act-gw">
                <button type="submit" className={"btn act-go " + (view === "3" && isTrial ? "btn-tr" : "btn-pri") + (busy ? " busy" : "")} aria-busy={busy}>
                  <span className="bl">{actLabel}</span>
                  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
                  <span className="spin" aria-hidden="true" />
                </button>
                {view === "4" && <button type="button" className="act-try" onClick={enterPlatform}>جرّب المنصة أولًا، بدون دفع</button>}
              </span>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
