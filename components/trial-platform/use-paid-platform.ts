"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import api from "@/lib/api/client";

/**
 * View-model for the paid dashboard a customer lands on after paying
 * (the design's platform shell in its «paid» state): the payment receipt
 * and the four-step wizard that connects their own WhatsApp number.
 *
 * It builds the object the design's own script builds for this state
 * (pf, nv, chip, wel, wz, rc, qa, hl, tp…) from the backend's summary.
 *
 * Where the wizard differs from the clickable design, which simulates Meta:
 * steps 1 and 2 both happen inside Meta's own window (opened through
 * 360dialog) — Meta signs the customer in, sends the code to the number
 * and checks it there. So a finished window completes both steps at once.
 */

type Tpl = { id: string; name: string; body: string; variablesCount: number; bizVariable: number | null; variableLabels: string[] };
export type PaidSummary = {
  receipt: null | {
    orderNo: string; planKey: string | null; period: "monthly" | "yearly"; totalHalalas: number; monthlyHalalas: number;
    email: string; invoiceNumber: string | null; invoiceReady: boolean;
  };
  business: { name: string; sector: string | null; crNumber: string | null; waNumber: string | null };
  wizard: {
    step: number; partnerId: string; number: null | { phone: string; displayName: string | null };
    displayName: string; displayNameSubmitted: boolean; document: null | { name: string };
  };
  templates: Tpl[];
};

type View = "home" | "tpl";
type Seg = { t: string; c: "s" | "v" | "b" };

/** From the design («باقات WhatsBit 2026»). */
const PLAN: Record<string, { n: string; conv: string; rank: number }> = {
  basic: { n: "الأساسية", conv: "1,000", rank: 1 },
  starter: { n: "البداية", conv: "2,500", rank: 2 },
  business: { n: "الأعمال", conv: "5,000", rank: 3 },
  enterprise: { n: "المؤسسات", conv: "10,000", rank: 4 },
};
/** Features that need a minimum plan. */
const FEAT: Record<string, { n: string; plan: string }> = {
  camp: { n: "الحملات", plan: "basic" },
  bot: { n: "الشات بوت الذكي", plan: "starter" },
  api: { n: "API والتكاملات", plan: "starter" },
};
const NAV = ["home", "inbox", "camp", "ct", "pipe", "tpl", "bot", "aic", "aig", "ana", "api", "team", "bill", "help"];
/** Where each item leads in the app once the number is connected. */
const ROUTE: Record<string, string> = {
  inbox: "/inbox", camp: "/campaigns", ct: "/contacts", pipe: "/pipeline", bot: "/bot-builder", aic: "/ai-center",
  aig: "/ai-agents", ana: "/analytics", api: "/integrations", team: "/teams", bill: "/billing",
};
const VIEW_TITLE: Record<View, string> = { home: "لوحة التحكم", tpl: "القوالب" };
const NAV_T: Record<string, string> = {
  home: "لوحة التحكم", inbox: "صندوق الوارد", camp: "الحملات", ct: "جهات الاتصال", pipe: "مسار المبيعات", tpl: "القوالب", bot: "بناء البوت",
  aic: "مركز الذكاء", aig: "وكلاء الذكاء", ana: "التحليلات", api: "التطبيقات", team: "الفرق", bill: "الفوترة", help: "مركز المساعدة",
};
const HEALTH = [
  ["تقييم Meta للجودة", "يظهر بعد ربط الرقم"], ["نسبة الحظر (Block Rate)", "بعد بدء الإرسال"], ["القوالب المرفوضة (30 يوم)", "بعد اعتماد قوالبك"],
  ["معدّل إلغاء الاشتراك", "بعد بدء الإرسال"], ["معدّل القراءة (آخر 7 أيام)", "بعد بدء الإرسال"], ["معدّل الرد (آخر 7 أيام)", "بعد أول محادثة"],
];
const HUB = (process.env.NEXT_PUBLIC_DIALOG360_HUB_URL || "https://hub.360dialog.com").replace(/\/$/, "");
const DOC_TYPES = /\.(pdf|png|jpe?g)$/i;

const sar = (halalas: number) => (halalas / 100).toLocaleString("en-US", { minimumFractionDigits: halalas % 100 ? 2 : 0, maximumFractionDigits: 2 });
const showPhone = (v: string | null | undefined) => {
  const d = String(v || "").replace(/\D/g, "").replace(/^966/, "").replace(/^0+/, "");
  return "+966 " + [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(" ");
};

function segments(t: Tpl, biz: string): Seg[] {
  const out: Seg[] = [];
  const re = /\{\{(\d+)\}\}/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(t.body))) {
    if (m.index > last) out.push({ t: t.body.slice(last, m.index), c: "s" });
    const n = Number(m[1]);
    out.push(n === t.bizVariable ? { t: biz, c: "b" } : { t: (t.variableLabels?.[n - 1] || "").trim() || `المتغير ${n}`, c: "v" });
    last = re.lastIndex;
  }
  if (last < t.body.length) out.push({ t: t.body.slice(last), c: "s" });
  return out;
}
const varNames = (t: Tpl) =>
  Array.from({ length: t.variablesCount }, (_, i) => i + 1).filter((n) => n !== t.bizVariable)
    .map((n) => (t.variableLabels?.[n - 1] || "").trim() || `المتغير ${n}`);

/** "?client=abc&channels=[x,y]" as 360dialog returns it → the channel ids. */
function parseConnect(search: string): { client: string; channels: string[] } | null {
  const q = new URLSearchParams(search.replace(/^\?/, ""));
  const channels = (q.get("channels") || "").replace(/^\[|\]$/g, "").split(",").map((x) => x.trim()).filter(Boolean);
  return channels.length ? { client: q.get("client") || "", channels } : null;
}

export function usePaidPlatform(initial: PaidSummary) {
  const { user, logout } = useAuth();
  const [data, setData] = useState<PaidSummary>(initial);

  const [pv, setPv] = useState<View>("home");
  const [nav, setNav] = useState(false);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [rcpt, setRcpt] = useState(true);

  const [metaBusy, setMetaBusy] = useState(false);
  const [dn, setDn] = useState(initial.wizard.displayName || "");
  const [dnErr, setDnErr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [docErr, setDocErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popup = useRef<Window | null>(null);
  const finalizing = useRef(false);
  const handled = useRef("");

  const W = data.wizard.step;
  const rc = data.receipt;
  const rcKey = rc ? `wb-receipt-hidden:${rc.orderNo}` : "";

  useEffect(() => { try { if (rcKey && localStorage.getItem(rcKey)) setRcpt(false); } catch {} }, [rcKey]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const say = useCallback((t: string) => {
    setToast(t); setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 3600);
  }, []);

  const errOf = (e: any, fallback: string) => {
    const errs = e?.response?.data?.errors;
    const first = errs && typeof errs === "object" ? (Object.values(errs)[0] as string[] | undefined)?.[0] : "";
    return first || e?.response?.data?.message || fallback;
  };

  // ── step 1 + 2: Meta's window ─────────────────────────────────
  // The window comes back to our own site with the new channel in its
  // address; that page hands the address to this one and closes itself.
  const finalize = useCallback(async (search: string) => {
    const got = parseConnect(search);
    if (!got || finalizing.current || handled.current === search) return; // the window may report twice
    finalizing.current = true; handled.current = search; setMetaBusy(true);
    try {
      await api.post("/onboarding/whatsapp/partner-finalize", got);
      const fresh: PaidSummary = (await api.get("/subscription/onboarding")).data.data;
      setData(fresh); setDn(fresh.wizard.displayName || "");
      say("تم ربط حساب Meta للأعمال والتحقق من الرقم");
    } catch (e: any) {
      handled.current = "";
      say(errOf(e, "تعذّر إكمال الربط. حاول مرة أخرى."));
    } finally {
      finalizing.current = false; setMetaBusy(false);
    }
  }, [say]);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin || typeof ev.data !== "string" || !ev.data.includes("channels=")) return;
      finalize(ev.data);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [finalize]);

  const openMeta = () => {
    if (metaBusy) return;
    const pid = data.wizard.partnerId;
    if (!pid) { say("الربط غير متاح الآن. تواصل مع الدعم على 920006900"); return; }
    const number = String(data.business.waNumber || "").replace(/\D/g, "");
    const url = `${HUB}/dashboard/app/${encodeURIComponent(pid)}/permissions` + (number ? `?number=${number}` : "");
    popup.current = window.open(url, "connect-360dialog", "toolbar=no, menubar=no, width=600, height=900, top=100, left=100");
    if (!popup.current) say("اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى");
    else popup.current.focus();
  };

  // ── step 3: display name ──────────────────────────────────────
  const sendName = async () => {
    const n = dn.trim();
    if (n.length < 2) { setDnErr("اكتب الاسم الذي سيظهر لعملائك"); return; }
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.post("/subscription/onboarding/display-name", { displayName: n });
      setData(res.data.data); setDnErr("");
      say("أُرسل الاسم الظاهر لمراجعة Meta");
    } catch (e: any) { setDnErr(errOf(e, "تعذّر الإرسال. حاول مرة أخرى.")); } finally { setBusy(false); }
  };

  // ── step 4: business document ─────────────────────────────────
  const pickFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    if (!DOC_TYPES.test(f.name)) { setFile(null); setDocErr("الملف يجب أن يكون PDF أو صورة (PNG أو JPG)"); return; }
    if (f.size > 10 * 1024 * 1024) { setFile(null); setDocErr("حجم الملف يجب ألا يتجاوز 10 ميجابايت"); return; }
    setFile(f); setDocErr("");
  };
  const sendDoc = async () => {
    if (!file) { setDocErr("اختر ملف المستند أولًا"); return; }
    if (busy) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/subscription/onboarding/document", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setData(res.data.data); setDocErr("");
      say("أُرسلت مستندات المنشأة للتوثيق");
    } catch (e: any) { setDocErr(errOf(e, "تعذّر رفع الملف. حاول مرة أخرى.")); } finally { setBusy(false); }
  };

  const first = (user?.name || "").trim().split(/\s+/)[0] || "";
  const biz = (data.business.name || "").trim() || "منشأتك";
  const P = PLAN[rc?.planKey || ""] || { n: (user as any)?.org?.plan?.nameAr || "باقتك", conv: "—", rank: 0 };
  const connected = W > 1;

  const go = (k: string) => {
    setNav(false);
    if (k === "home" || k === "tpl") { setPv(k); return; }
    if (k === "help") { say("فريق الدعم معك على الرقم 920006900"); return; }
    if (FEAT[k] && P.rank && P.rank < PLAN[FEAT[k].plan].rank) {
      say(`${FEAT[k].n} غير مشمولة في باقة ${P.n}، وتتوفر من باقة ${PLAN[FEAT[k].plan].n}`);
      return;
    }
    // the team and the subscription do not depend on the number
    if (connected || k === "team" || k === "bill") { window.location.href = ROUTE[k]; return; }
    say(FEAT[k] ? `${FEAT[k].n} تتفعّل بعد ربط رقمك` : "يتفعّل بعد ربط رقمك");
  };

  return useMemo(() => {
    const wcls = (n: number) => "wz" + (W > n ? " done" : W === n ? " cur" : "");
    const waShown = showPhone(data.wizard.number?.phone || data.business.waNumber);
    const sec = data.business.sector ? ` لقطاع «${data.business.sector}»` : " لقطاعك";

    const nv: Record<string, any> = { inboxN: "0" };
    NAV.forEach((k) => {
      const on = k === pv;
      nv[k] = { cls: "pf-it" + (on ? " on" : ""), cur: on ? "page" : undefined, lk: false, lkT: "", go: () => go(k) };
    });

    return {
      pf: {
        cls: "pf ph-ready paid" + (nav ? " nav" : ""), isTrial: false, title: VIEW_TITLE[pv],
        ini: first.charAt(0) || "م", uname: user?.name || "مالك الحساب",
        navOpen: () => setNav(true), navClose: () => setNav(false), navExp: nav ? "true" : "false",
        sub: () => {}, send: () => {}, sendDis: true,
        toast, toastCls: "pf-toast" + (toastOn ? " on" : ""),
        logout: (e: React.MouseEvent) => { e.preventDefault(); logout().finally(() => { window.location.href = "/login"; }); },
        key: (ev: React.KeyboardEvent) => { if (ev.key === "Escape" && nav) { ev.preventDefault(); setNav(false); } },
      },
      nv,
      chip: { t: P.n, a: rc ? `${sar(rc.monthlyHalalas)} ر.س` : "", b: "محادثات الشهر", c: `0 / ${P.conv}` },
      boot: { on: false, t: "", items: [] },
      wel: { t: "مرحبًا بك في WhatsBit", s1: "اشتراكك في ", b: `باقة ${P.n}`, s2: connected ? " فعّال، ورقم واتساب الأعمال مربوط. أكمل الخطوات الباقية لتوثيق منشأتك." : " فعّال. الخطوة التالية: ربط رقم واتساب الأعمال الخاص بمنشأتك." },
      rc: {
        on: !!rc && rcpt, plan: P.n, period: rc?.period === "yearly" ? "اشتراك سنوي" : "اشتراك شهري",
        paid: rc ? sar(rc.totalHalalas) : "", no: rc?.orderNo || "—", email: rc?.email || user?.email || "",
        close: () => { setRcpt(false); try { if (rcKey) localStorage.setItem(rcKey, "1"); } catch {} },
      },
      wz: {
        prog: `${Math.min(W, 5) - 1} من 4`, c1: wcls(1), c2: wcls(2), c3: wcls(3), c4: wcls(4),
        a1: W === 1, d1: W > 1, d1t: `تم الربط · ${biz}`, meta: openMeta, metaBusy,
        // step 2 is completed inside Meta's window together with step 1
        f2: W < 2, a2: false, d2: W > 2, wa: waShown, sent: false, notSent: false,
        code: "", codeCls: "pfld", codeErr: "", codeInv: "false", onCode: () => {}, keyCode: () => {}, send: () => {}, verify: () => {},
        f3: W < 3, a3: W === 3, d3: W > 3, dn, dnCls: "pfld" + (dnErr ? " bad" : ""), dnErr, dnInv: dnErr ? "true" : "false",
        onDn: (ev: React.ChangeEvent<HTMLInputElement>) => { setDn(ev.target.value.slice(0, 60)); setDnErr(""); },
        d3t: `«${(data.wizard.displayName || dn).trim()}» · قيد مراجعة Meta`, name: sendName,
        f4: W < 4, a4: W === 4, d4: W > 4, cr: data.business.crNumber || "",
        docName: file?.name || "اختر ملفًا (PDF أو صورة)", upCls: "wz-up" + (file ? " on" : ""), docErr,
        file: pickFile, doc: sendDoc, demoFile: () => {},
        fin: W >= 5, busy,
      },
      qa: {
        camp: () => go("camp"),
        tpl: () => { setPv("tpl"); },
      },
      hl: HEALTH.map((h) => ({ l: h[0], s: h[1] })),
      tp: {
        chip: "خدمي · مقترح", ft: false,
        sub: `قوالب خدمية مقترحة${sec}، ترسلها لاعتماد Meta بعد ربط رقمك.`,
        lockT: "تكتبها بنصك الخاص بعد ربط رقمك، وترسلها لاعتماد Meta.",
        list: data.templates.map((t) => ({
          n: t.name, segs: segments(t, biz), vars: varNames(t).length ? `المتغيرات: ${varNames(t).join("، ")}` : "بلا متغيرات",
          useLbl: connected ? "أنشئ القالب" : "بعد ربط الرقم",
          use: () => { if (connected) window.location.href = "/templates"; else say("يتفعّل الإرسال بعد ربط رقمك"); },
        })),
      },
      md: { send: false, lock: false, ach: false, meta: false, close: () => {} },
      pv: { homeT: false, homeP: pv === "home", tpl: pv === "tpl", ct: false, inbox: false, feat: false },
      ft: { t: "", s: "", pts: [], k: "", ct: "", cs: "", goLbl: "", go: () => {}, steps: [] },
      srch: [
        ...NAV.map((k) => ({ t: NAV_T[k], s: "قسم", go: () => go(k) })),
        ...data.templates.map((t) => ({ t: t.name, s: "قالب", go: () => { setNav(false); setPv("tpl"); } })),
      ],
      notes: [
        ...(W >= 5 ? [{ id: "wz:done", t: "أنهيت ما عليك", s: "تراجع Meta طلبك وسنبلغك فور اكتمال المراجعة" }]
          : [{ id: `wz:${W}`, t: W <= 2 ? "الخطوة التالية: ربط حساب Meta للأعمال" : W === 3 ? "الخطوة التالية: الاسم الظاهر للعملاء" : "الخطوة التالية: توثيق المنشأة", s: "من لوحة «اربط رقم واتساب الأعمال»", go: () => { setNav(false); setPv("home"); } }]),
        ...(rc ? [{ id: `paid:${rc.orderNo}`, t: `تم الدفع بنجاح · باقة ${P.n}`, s: `رقم الطلب ${rc.orderNo}` }] : []),
      ],
      // trial-only parts of the shell
      tb: { cls: "pf-tb", live: false, frozen: false, frzT: "", left: "", total: "", today: "", day: "", days: "", barSt: "", advOn: false, advLbl: "", adv: () => {} },
      tk: { n: "0", aria: "", ringSt: "", ext: false, extN: "", sub: "", list: [] },
      kp: [], ph: { to: "", empty: true, more: false, msgs: [] }, lk: [],
      ct: { used: "0", max: "0", v: "", fcls: "pfld", err: "", inv: "false", on: () => {}, key: () => {}, send: () => {}, dis: true, me: "", meIni: "", empty: true, list: [] },
      ib: { empty: true, list: [] },
      sd: { to: [], toN: "", tpls: [], vars: [], segs: [], limit: false, limitT: "", left: "", dis: true, busy: "false", btnCls: "pf-btn pf-pri", send: () => {}, inv: () => {} },
      lkm: { t: "", s: "", pn: "", pp: "", f: [], goLbl: "", go: () => {} },
      ach: { s: "", sent: "0", inv: "0", tk: "0", ext: false, go: () => {} },
      mt: { biz, cur: true, neu: false, cCls: "so on", nCls: "so", toCur: () => {}, toNew: () => {}, ok: () => {} },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, pv, nav, toast, toastOn, rcpt, metaBusy, dn, dnErr, file, docErr, busy, user]);
}
