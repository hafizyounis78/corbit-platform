"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * View-model for the self-serve trial dashboard.
 *
 * It builds the same object the design's own script builds (pf, nv, tb,
 * wel, tk, kp, ph, lk, tp, ct, ib, sd, lkm, ach …) so the generated view
 * (platform-view.tsx) renders the design unchanged — but every number
 * here is the backend's: the trial summary, its messages and its
 * invitations. Sending, inviting and the tasks go through the API; the
 * limits are enforced there, this file only mirrors them for the UI.
 */

type TrialTemplate = {
  id: string; name: string; body: string; footer: string | null; variablesCount: number; variableExamples: string[];
  /** 1-based position of the variable the platform fills with the business name; the customer never types it */
  bizVariable: number | null;
  variableLabels: string[];
};
type Invite = { phone: string; status: "pending" | "accepted" | "declined" };
export type TrialSummary = {
  status: "active" | "not_started" | "expired" | "cap_reached" | "ended";
  daysLeft: number; messageCap: number; messagesUsed: number; remaining: number; allowedPhones: string[];
  templates: TrialTemplate[];
  selfServe: boolean; dailyCap: number | null; sentToday: number; inviteCap: number; invites: Invite[];
  signupPhone: string | null; tasks: { msg: boolean; inv: boolean; tpl: boolean };
  extended: boolean; extensionDays: number; totalDays: number; retentionDays: number;
};
type TrialMessage = { id: string; phone: string; templateName: string; body: string | null; status: string; error?: string | null; sentAt: string | null };

type View = "home" | "tpl" | "ct" | "inbox" | "feat";
type Seg = { t: string; c: "s" | "v" | "b" };

/** The three the home card lists as opening with a subscription, each with the first plan that includes it (from the design). */
const FEAT: Record<string, { n: string; d: string; plan: string }> = {
  camp: { n: "الحملات", d: "رسائل البث لعملائك", plan: "basic" },
  bot: { n: "الشات بوت الذكي", d: "ردود آلية ذكية على عملائك", plan: "starter" },
  api: { n: "API والتكاملات", d: "سلة وزد و Shopify وأنظمتك", plan: "starter" },
};
const PLAN: Record<string, { n: string }> = { basic: { n: "الأساسية" }, starter: { n: "البداية" } };
const NAV_T: Record<string, string> = {
  home: "لوحة التحكم", inbox: "صندوق الوارد", camp: "الحملات", ct: "جهات الاتصال", pipe: "مسار المبيعات", tpl: "القوالب", bot: "بناء البوت",
  aic: "مركز الذكاء", aig: "وكلاء الذكاء", ana: "التحليلات", api: "التطبيقات", team: "الفرق", bill: "الفوترة", help: "مركز المساعدة",
};
const VIEW_TITLE: Record<Exclude<View, "feat">, string> = { home: NAV_T.home, tpl: NAV_T.tpl, ct: NAV_T.ct, inbox: NAV_T.inbox };

/**
 * What a trial account reads when it opens a section it cannot use yet:
 * the section is not locked away, it is explained — what it does (`pts`)
 * and the step that starts it once the number is connected (`step`).
 */
const TOUR: Record<string, { s: string; pts: [string, string][]; step: string }> = {
  camp: {
    s: "أرسل رسائل البث لعملائك دفعة واحدة بقوالب معتمدة من Meta، وتابع نتيجة كل حملة.",
    pts: [["اختيار الجمهور", "حدّد المستلمين من جهات الاتصال أو من شريحة منها"], ["قوالب معتمدة", "ترسل بقوالبك المعتمدة من Meta مع متغيرات لكل عميل"], ["جدولة الإرسال", "أرسل الحملة الآن أو حدّد لها موعدًا"], ["تقرير لكل حملة", "ما أُرسل وما وصل وما قُرئ وما فشل"]],
    step: "أنشئ حملتك الأولى واختر جمهورها",
  },
  pipe: {
    s: "تابع صفقاتك من أول محادثة حتى الإغلاق في لوحة مراحل واحدة.",
    pts: [["مراحل واضحة", "انقل الصفقة من مرحلة إلى التي بعدها بالسحب"], ["مرتبطة بالعميل", "كل صفقة مرتبطة بجهة الاتصال صاحبة المحادثة"], ["متابعة الفريق", "اعرف ما في كل مرحلة ومن المسؤول عنه"]],
    step: "أضف صفقتك الأولى وحرّكها بين المراحل",
  },
  bot: {
    s: "ابنِ ردودًا آلية تعمل على مدار الساعة بمخطط مرئي، دون كتابة كود.",
    pts: [["مخطط مرئي", "ارسم مسار المحادثة خطوة بخطوة"], ["أزرار وقوائم", "يختار العميل ما يريد بضغطة"], ["تحويل لموظف", "يحوّل البوت المحادثة لفريقك عند الحاجة"], ["يعمل دائمًا", "يرد على عملائك خارج أوقات الدوام"]],
    step: "ابنِ أول بوت وفعّله على رقمك",
  },
  aic: {
    s: "ردود ذكية على عملائك مبنية على معلومات منشأتك أنت.",
    pts: [["قاعدة المعرفة", "أضف معلومات منشأتك ليجيب الذكاء منها"], ["نبرة الرد", "اختر الأسلوب الذي يخاطب به عملاءك"], ["ضوابط", "حدّد ما يجيب عنه وما يحوّله لموظف"], ["نظرة عامة", "تابع استخدام الذكاء ونتائجه"]],
    step: "أضف معلومات منشأتك وفعّل الرد الذكي",
  },
  aig: {
    s: "وكلاء ذكاء متخصصون، لكل واحد شخصيته ومهمته.",
    pts: [["وكيل لكل مهمة", "مبيعات، دعم، حجوزات، أو ما يناسب منشأتك"], ["تعليمات خاصة", "تكتب لكل وكيل شخصيته وطريقة رده"], ["توجيه تلقائي", "تُوجَّه المحادثة للوكيل المناسب بكلمات مفتاحية"], ["يستند لمعلوماتك", "يستخدم الوكيل قاعدة المعرفة عند الرد"]],
    step: "أنشئ أول وكيل واكتب تعليماته",
  },
  ana: {
    s: "أرقام رسائلك ومحادثاتك وأداء فريقك في مكان واحد.",
    pts: [["الرسائل", "ما أُرسل وما وصل وما قُرئ"], ["المحادثات", "حجم المحادثات وأوقاتها"], ["أداء الفريق", "نشاط كل موظف وسرعة رده"]],
    step: "ابدأ الإرسال وتظهر الأرقام تلقائيًا",
  },
  api: {
    s: "اربط WhatsBit بمتجرك وأنظمتك لتُرسل الرسائل تلقائيًا.",
    pts: [["المتاجر", "رسائل الطلبات والشحن تلقائيًا"], ["API عام", "أرسل من أنظمتك برمز وصول خاص بك"], ["تنبيهات لأنظمتك", "استقبل أحداث الرسائل في نظامك (Webhooks)"]],
    step: "اربط متجرك أو أنشئ رمز الوصول",
  },
  team: {
    s: "أضف فريقك ووزّع المحادثات بينهم.",
    pts: [["أعضاء وأدوار", "أضف موظفيك وحدّد صلاحية كل واحد"], ["توزيع المحادثات", "أسند المحادثة للموظف أو الفريق المناسب"], ["صندوق مشترك", "يعمل الجميع على رقم واحد"]],
    step: "أضف أول عضو لفريقك",
  },
  bill: {
    s: "اشتراكك وفواتيرك في مكان واحد.",
    pts: [["الباقة", "اختر باقتك وغيّرها متى احتجت"], ["الفواتير", "فاتورة ضريبية إلكترونية لكل دفعة"], ["الدفع", "دفع آمن بالبطاقة"]],
    step: "اختر باقتك وأكمل الدفع",
  },
  help: {
    s: "إجابات وأدلة، وفريق دعم معك.",
    pts: [["اتصل بنا", "فريق الدعم على الرقم 920006900"], ["أدلة الاستخدام", "شرح كل قسم في المنصة خطوة بخطوة"], ["الأسئلة الشائعة", "إجابات جاهزة لأكثر ما يُسأل عنه"]],
    step: "اتصل بفريق الدعم متى احتجت",
  },
};
const NAV = ["home", "inbox", "camp", "ct", "pipe", "tpl", "bot", "aic", "aig", "ana", "api", "team", "bill", "help"];

const days = (n: number) => (n <= 0 ? "انتهت" : n === 1 ? "يوم واحد" : n === 2 ? "يومان" : n <= 10 ? `${n} أيام` : `${n} يومًا`);
const msgN = (n: number) => (n === 1 ? "رسالة واحدة" : n === 2 ? "رسالتان" : n >= 3 && n <= 10 ? `${n} رسائل` : `${n} رسالة`);
/** +9665XXXXXXXX → "+966 5X XXX XXXX" */
const showPhone = (e164: string | null | undefined) => {
  const d = String(e164 || "").replace(/\D/g, "").replace(/^966/, "");
  return "+966 " + [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(" ");
};
const digits9 = (s: string) => { let d = s.replace(/\D/g, ""); if (d.startsWith("966") && d.length > 9) d = d.slice(3); return d.replace(/^0+/, ""); };
const clock = (iso: string | null) => {
  const d = iso ? new Date(iso) : new Date(), h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}${h < 12 ? " ص" : " م"}`;
};
const pct = (p: number) => `--p:${Math.round(Math.max(0, Math.min(1, p)) * 100)}%`;

function varErr(s: string): string {
  const v = String(s || "").trim();
  if (!v) return "اكتب قيمة المتغير";
  if (/(https?:|www\.|[a-z0-9-]+\.(com|net|org|sa|io|me|ly|co|app|store|link)\b)/i.test(v)) return "الروابط غير مسموحة في التجربة";
  if (v.length > 30) return "الحد الأقصى 30 حرفًا";
  return "";
}

/** Positions (0-based, in the template) of the variables the customer types — all but the business name. */
const customerVars = (t: TrialTemplate) =>
  Array.from({ length: t.variablesCount }, (_, i) => i).filter((i) => i + 1 !== t.bizVariable);

const varLabel = (t: TrialTemplate, pos: number) => (t.variableLabels?.[pos] || "").trim() || `المتغير ${pos + 1}`;

/**
 * A template body with {{1}}, {{2}}… → text, variable and business-name segments.
 * `vals` are the customer's values in customerVars() order; an empty one shows its label.
 */
function segments(t: TrialTemplate, vals: string[] | null, biz: string): Seg[] {
  const out: Seg[] = [];
  const order = customerVars(t);
  const re = /\{\{(\d+)\}\}/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(t.body))) {
    if (m.index > last) out.push({ t: t.body.slice(last, m.index), c: "s" });
    const pos = Number(m[1]) - 1;
    if (pos + 1 === t.bizVariable) out.push({ t: biz, c: "b" });
    else out.push({ t: (vals?.[order.indexOf(pos)] || "").trim() || varLabel(t, pos), c: "v" });
    last = re.lastIndex;
  }
  if (last < t.body.length) out.push({ t: t.body.slice(last), c: "s" });
  return out;
}

/** What the send dialog starts with: the customer's first name where a name is asked, else the template's example. */
const startValues = (t: TrialTemplate, first: string) =>
  customerVars(t).map((pos, k) => (k === 0 && first ? first : t.variableExamples?.[pos] ?? ""));

export function useTrialPlatform(initial: TrialSummary) {
  const { user, logout } = useAuth();
  const [trial, setTrial] = useState<TrialSummary>(initial);
  const [msgs, setMsgs] = useState<TrialMessage[]>([]);

  const [pv, setPv] = useState<View>("home");
  const [md, setMd] = useState<"" | "send" | "ach">("");
  const [nav, setNav] = useState(false);
  const [featK, setFeatK] = useState("camp");
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);

  // send dialog
  const [sTpl, setSTpl] = useState("");
  const [sTo, setSTo] = useState("me");
  const [sVars, setSVars] = useState<string[]>([]);
  const [sSub, setSSub] = useState(false);
  const [sBusy, setSBusy] = useState(false);
  const [sErr, setSErr] = useState("");

  // invite form
  const [invV, setInvV] = useState("");
  const [invErr, setInvErr] = useState("");
  const [invBusy, setInvBusy] = useState(false);

  const achShown = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMessages = useCallback(
    () => api.get("/trial/messages", { params: { limit: 100 } }).then((r) => setMsgs(r.data?.data?.items ?? [])).catch(() => {}),
    [],
  );
  const refresh = useCallback(() => {
    api.get("/trial").then((r) => setTrial(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  // an invited number answers on its own phone — pick the answer up while the page is open
  useEffect(() => {
    if (!trial.invites.some((i) => i.status === "pending")) return;
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [trial.invites, refresh]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const say = useCallback((t: string) => {
    setToast(t); setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 3600);
  }, []);

  const first = (user?.name || "").trim().split(/\s+/)[0] || "";
  const biz = ((user as any)?.org?.name || "").trim() || "منشأتك";
  const me = trial.signupPhone || trial.allowedPhones[0] || "";
  const TL = trial.templates;
  const total = trial.messageCap, sent = trial.messagesUsed, left = trial.remaining;
  const day = trial.dailyCap ?? total, today = trial.sentToday;
  const frozen = trial.status !== "active";
  const dayFull = today >= day;
  const okInv = trial.invites.filter((i) => i.status === "accepted").length;
  const nDone = (trial.tasks.msg ? 1 : 0) + (trial.tasks.inv ? 1 : 0) + (trial.tasks.tpl ? 1 : 0);

  /** A response carried a fresh summary: show the design's toast for what just happened. */
  const after = (next: TrialSummary, message: string) => {
    const justExtended = next.extended && !trial.extended;
    setTrial(next);
    say(justExtended ? `أكملت المهام الثلاث — مددنا تجربتك ${next.extensionDays} أيام` : message);
  };

  const goSubscribe = (plan?: string) => { window.location.href = "/register?step=plan" + (plan ? `&plan=${plan}` : ""); };

  const go = (k: string) => {
    if (k === "home" || k === "tpl" || k === "ct" || k === "inbox") {
      setNav(false); setPv(k);
      if (k === "tpl" && !trial.tasks.tpl) {
        api.post("/trial/tasks/templates").then((r) => after(r.data.data, "استعرضت القوالب الجاهزة لقطاعك")).catch(() => {});
      }
      return;
    }
    // every other section opens as a page that explains it: the trial lets the customer look around
    setNav(false); setFeatK(k); setPv("feat");
  };

  const openSend = (id?: string) => {
    if (frozen) { say("انتهت التجربة وتجمّد الإرسال — اشترك للمتابعة"); return; }
    const t = TL.find((x) => x.id === id) || TL[0];
    if (!t) { say("لا توجد قوالب متاحة للتجربة حاليًا"); return; }
    const to = sTo !== "me" && trial.invites.some((i) => i.phone === sTo && i.status === "accepted") ? sTo : "me";
    setSTpl(t.id); setSTo(to); setSSub(false); setSBusy(false); setSErr("");
    setSVars(startValues(t, first));
    setNav(false); setMd("send");
  };

  const sT = TL.find((x) => x.id === sTpl) || TL[0];
  const pickTpl = (t: TrialTemplate) => {
    setSTpl(t.id); setSSub(false);
    setSVars(startValues(t, first));
  };

  const doSend = async () => {
    if (sBusy || frozen || dayFull || !sT) return;
    const typed = customerVars(sT).map((_, k) => sVars[k] || ""); // the business name is added by the backend
    if (typed.some((x) => !!varErr(x))) { setSSub(true); return; }
    setSBusy(true); setSErr("");
    const to = sTo === "me" ? me : sTo;
    try {
      const res = await api.post("/trial/messages", { phone: to, templateId: sT.id, variables: typed });
      // One request: the answer carries the recorded message and the whole refreshed summary.
      const message = res.data?.data?.message as TrialMessage | undefined;
      const next = res.data?.data?.trial as TrialSummary;
      const failed = message?.status === "failed";
      if (message) setMsgs((list) => [message, ...list.filter((m) => m.id !== message.id)]);
      if (failed) { setTrial(next); setSErr((message as any)?.error || "تعذّر إرسال الرسالة. حاول مرة أخرى."); setSBusy(false); return; }
      setMd(""); setSBusy(false);
      after(next, sTo === "me" ? "وصلت رسالتك إلى جوالك" : `أُرسلت الرسالة إلى ${showPhone(to)}`);
      // the achievement screen, once, at 80% of the messages
      if (!achShown.current && next.messagesUsed >= Math.ceil(next.messageCap * 0.8)) {
        achShown.current = true;
        setTimeout(() => setMd("ach"), 1300);
      }
    } catch (e: any) {
      const errs = e?.response?.data?.errors;
      setSErr(errs?.trial?.[0] || errs?.phone?.[0] || errs?.variables?.[0] || e?.response?.data?.message || "تعذّر الإرسال. تحقق من الاتصال وحاول مرة أخرى.");
      setSBusy(false);
      refresh();
    }
  };

  const doInvite = async () => {
    if (invBusy) return;
    const d = digits9(invV);
    let e = "";
    if (frozen) e = "انتهت التجربة، ولا يمكن دعوة أرقام جديدة";
    else if (trial.invites.length >= trial.inviteCap) e = `وصلت إلى الحد الأقصى: ${trial.inviteCap} أرقام`;
    else if (!/^5\d{8}$/.test(d)) e = "رقم الجوال 9 أرقام ويبدأ بالرقم 5";
    else if ("+966" + d === me) e = "هذا جوالك الموثّق، وهو مستلم تلقائيًا";
    else if (trial.invites.some((x) => x.phone === "+966" + d)) e = "دعوت هذا الرقم من قبل";
    if (e) { setInvErr(e); return; }
    setInvBusy(true);
    try {
      const res = await api.post("/trial/invites", { phone: "966" + d });
      setInvV(""); setInvErr("");
      after(res.data.data, `أرسلنا طلب الموافقة إلى ${showPhone("+966" + d)}`);
    } catch (err: any) {
      setInvErr(err?.response?.data?.errors?.phone?.[0] || err?.response?.data?.message || "تعذّر إرسال الدعوة. حاول مرة أخرى.");
    }
    setInvBusy(false);
  };

  return useMemo(() => {
    const meMsgs = msgs.filter((m) => m.phone === me && m.status !== "failed").slice().reverse();
    const sentMsgs = msgs.filter((m) => m.status !== "failed");
    const dl = Math.max(0, trial.daysLeft);
    const tour = TOUR[featK] || TOUR.camp;
    const featPlan = FEAT[featK] ? PLAN[FEAT[featK].plan].n : "";
    const toOpts = [{ k: "me", t: "جوالك الموثّق", n: showPhone(me), wait: false }]
      .concat(trial.invites.filter((i) => i.status !== "declined").map((i) => ({ k: i.phone, t: "رقم مدعو", n: showPhone(i.phone), wait: i.status !== "accepted" })));
    const toSel = toOpts.find((o) => o.k === sTo && !o.wait) || toOpts[0];

    const nv: Record<string, any> = { inboxN: String(sentMsgs.length) };
    NAV.forEach((k) => {
      const on = pv === "feat" ? k === featK : k === pv;
      nv[k] = { cls: "pf-it" + (on ? " on" : ""), cur: on ? "page" : undefined, lk: false, lkT: "", go: () => go(k) };
    });

    const taskDefs = [
      { k: "msg" as const, t: "أرسل أول رسالة لجوالك", s: `بقالب جاهز يحمل اسم «${biz}»`, btn: "أرسل الآن", ok: "أُرسلت", go: () => openSend(), dis: frozen || dayFull },
      { k: "inv" as const, t: "ادعُ رقمًا للتجربة", s: `حتى ${trial.inviteCap} أرقام، ولا يستقبل الرقم أي رسالة قبل موافقته`, btn: "ادعُ رقمًا", ok: "أُرسلت الدعوة", go: () => go("ct"), dis: frozen },
      { k: "tpl" as const, t: "استعرض القوالب الجاهزة لقطاعك", s: "القوالب المعتمدة للتجربة", btn: "استعرض", ok: "تم", go: () => go("tpl"), dis: false },
    ];

    return {
      pf: {
        cls: "pf ph-ready trial" + (nav ? " nav" : ""), isTrial: true, title: pv === "feat" ? NAV_T[featK] : VIEW_TITLE[pv],
        ini: first.charAt(0) || "م", uname: user?.name || "مالك الحساب",
        navOpen: () => setNav(true), navClose: () => setNav(false), navExp: nav ? "true" : "false",
        sub: () => goSubscribe(), send: () => openSend(), sendDis: frozen || dayFull,
        toast, toastCls: "pf-toast" + (toastOn ? " on" : ""),
        logout: (e: React.MouseEvent) => { e.preventDefault(); logout().finally(() => { window.location.href = "/login"; }); },
        key: (ev: React.KeyboardEvent) => {
          if (ev.key !== "Escape") return;
          if (md && !sBusy) { ev.preventDefault(); setMd(""); } else if (nav) { ev.preventDefault(); setNav(false); }
        },
      },
      nv,
      chip: { t: "تجربة مجانية", a: dl > 0 && !frozen ? `متبقٍ ${days(dl)}` : "انتهت", b: "رسائل التجربة", c: `${sent} / ${total}` },
      boot: { on: false, t: "", items: [] },
      tb: {
        cls: "pf-tb" + (frozen ? " frz" : ""), live: !frozen, frozen,
        frzT: sent >= total ? `استخدمت رسائل التجربة كاملة وتجمّد الإرسال · بياناتك محفوظة ${trial.retentionDays} يومًا` : `انتهت التجربة وتجمّد الإرسال · بياناتك محفوظة ${trial.retentionDays} يومًا`,
        left: String(left), total: String(total), today: String(today), day: String(day), days: days(dl),
        barSt: pct(total ? left / total : 0), advOn: false, advLbl: "", adv: () => {},
      },
      wel: { t: `أهلًا ${first || "بك"}، جرّب WhatsBit قبل الاشتراك`, s1: "رسائلك التجريبية تصل من رقم كوربت التجريبي، واسم «", b: biz, s2: "» داخل نص كل رسالة." },
      tk: {
        n: String(nDone), aria: `أكملت ${nDone} من 3 مهام`, ringSt: `--p:${Math.round((nDone / 3) * 100)}`, ext: trial.extended, extN: String(trial.extensionDays),
        sub: trial.extended ? "أكملت المهام الثلاث ومُدّدت تجربتك تلقائيًا." : `أكمل المهام الثلاث وتُمدَّد تجربتك ${trial.extensionDays} أيام تلقائيًا.`,
        list: taskDefs.map((x, i) => { const d = trial.tasks[x.k]; return { i: String(i + 1), t: x.t, s: x.s, cls: "tk" + (d ? " done" : ""), done: d, todo: !d, btn: x.btn, okT: x.ok, go: x.go, dis: x.dis }; }),
      },
      kp: [
        { l: "الرسائل المتبقية", v: left, of: `من ${total}`, p: total ? left / total : 0, s: "لكامل مدة التجربة", c: "c1" },
        { l: "رسائل اليوم", v: today, of: `من ${day}`, p: day ? today / day : 0, s: "الحد اليومي يتجدد كل يوم", c: "c2" },
        { l: "الأرقام المدعوة", v: trial.invites.length, of: `من ${trial.inviteCap}`, p: trial.inviteCap ? trial.invites.length / trial.inviteCap : 0, s: trial.invites.length ? `وافق ${okInv} منها` : "بموافقة كل رقم", c: "c3" },
        { l: "الأيام المتبقية", v: dl, of: `من ${trial.totalDays}`, p: trial.totalDays ? dl / trial.totalDays : 0, s: trial.extended ? `شاملة تمديد ${trial.extensionDays} أيام` : "ثم يتجمّد الإرسال", c: "c4" },
      ].map((k) => ({ l: k.l, v: String(k.v), of: k.of, s: k.s, cls: "pf-kpi " + k.c, st: pct(k.p) })),
      ph: { to: showPhone(me), empty: !meMsgs.length, more: !!meMsgs.length, msgs: meMsgs.map((m) => ({ segs: [{ t: m.body || "", c: "s" }], time: clock(m.sentAt) })) },
      lk: ["camp", "bot", "api"].map((k) => ({ n: FEAT[k].n, d: FEAT[k].d, pl: `من باقة ${PLAN[FEAT[k].plan].n}`, go: () => go(k) })),
      tp: {
        chip: "خدمي · معتمد للتجربة", ft: true,
        sub: "قوالب خدمية معتمدة خلال التجربة، تعدّل فيها المتغيرات فقط.",
        lockT: "تُفتح بعد الاشتراك: تكتب قوالبك بنصك الخاص وترسلها لاعتماد Meta، ومنها الرسائل التسويقية.",
        list: TL.map((t) => ({ n: t.name, segs: segments(t, null, biz), vars: customerVars(t).length ? `المتغيرات: ${customerVars(t).map((pos) => varLabel(t, pos)).join("، ")}` : "بلا متغيرات", useLbl: "استخدم القالب", use: () => openSend(t.id) })),
      },
      ct: {
        used: String(trial.invites.length), max: String(trial.inviteCap), v: invV, fcls: "pfld" + (invErr ? " bad" : ""), err: invErr, inv: invErr ? "true" : "false",
        on: (ev: React.ChangeEvent<HTMLInputElement>) => { setInvV(ev.target.value.replace(/[^\d\s+]/g, "").slice(0, 16)); setInvErr(""); },
        key: (ev: React.KeyboardEvent) => { if (ev.key === "Enter") { ev.preventDefault(); doInvite(); } },
        send: () => doInvite(), dis: frozen || invBusy || trial.invites.length >= trial.inviteCap,
        me: showPhone(me), meIni: first.charAt(0) || "م", empty: !trial.invites.length,
        list: trial.invites.map((x) => {
          const ok = x.status === "accepted", no = x.status === "declined";
          return { n: showPhone(x.phone), st: ok ? "وافق" : no ? "رفض" : "بانتظار الموافقة", cls: "st-chip " + (ok ? "ok" : "w"), sub: ok ? "يمكنك الإرسال إليه" : no ? "لن يستقبل رسائل التجربة" : "وصله طلب الموافقة" };
        }),
      },
      ib: { empty: !sentMsgs.length, list: sentMsgs.map((m) => ({ to: m.phone === me ? "جوالك الموثّق" : showPhone(m.phone), tpl: m.templateName, time: clock(m.sentAt), tx: m.body || "" })) },
      sd: {
        to: toOpts.map((o) => { const on = o.k === toSel.k; return { t: o.t, n: o.n, wait: o.wait, dis: o.wait, on, cls: "so" + (on ? " on" : "") + (o.wait ? " dis" : ""), pick: () => { if (!o.wait) setSTo(o.k); } }; }),
        toN: toSel.n,
        tpls: TL.map((t) => { const on = t.id === sT?.id; return { n: t.name, on, cls: "so" + (on ? " on" : ""), pick: () => pickTpl(t) }; }),
        vars: sT ? customerVars(sT).map((pos, i) => {
          const val = sVars[i] || "", e = varErr(val), show = !!e && (sSub || (!!val && e !== "اكتب قيمة المتغير"));
          return { id: `pf-v-${i}`, l: varLabel(sT, pos), v: val, err: e, inv: show ? "true" : "false", cls: "pfld" + (show ? " bad" : ""),
            on: (ev: React.ChangeEvent<HTMLInputElement>) => setSVars((o) => { const n = o.slice(); n[i] = ev.target.value.slice(0, 40); return n; }) };
        }) : [],
        segs: sT ? segments(sT, sVars, biz) : [],
        limit: frozen || dayFull || !!sErr,
        limitT: sErr || (frozen ? "انتهت التجربة وتجمّد الإرسال." : `وصلت إلى حد اليوم (${day} رسائل). يتجدد الحد غدًا.`),
        left: `يتبقى ${msgN(left)} في التجربة`, dis: frozen || dayFull, busy: sBusy ? "true" : "false",
        btnCls: "pf-btn pf-pri" + (sBusy ? " busy" : ""),
        send: () => doSend(), inv: () => { setMd(""); go("ct"); },
      },
      // sections are explained on their own page (ft), so the lock dialog is never opened
      lkm: { t: "", s: "", pn: "", pp: "", f: [], goLbl: "", go: () => {} },
      ft: {
        t: NAV_T[featK], s: tour.s, pts: tour.pts.map(([t, d]) => ({ t, d })),
        k: featPlan ? `متاحة من باقة ${featPlan}` : "تتفعّل بعد الاشتراك وربط رقمك",
        ct: "فعّل هذه الميزة على رقمك",
        cs: featK === "bill" ? "أنت الآن في التجربة المجانية ولا يُطلب منك دفع." : "تعمل على رقمك الخاص وباسم منشأتك بعد الاشتراك.",
        goLbl: featK === "help" ? "اتصل بالدعم" : "اشترك الآن",
        go: () => { if (featK === "help") window.location.href = "tel:920006900"; else goSubscribe(FEAT[featK]?.plan); },
        steps: featK === "help" ? [tour.step] : ["اشترك في الباقة المناسبة لمنشأتك", "اربط رقم واتساب الأعمال باسم منشأتك", tour.step],
      },
      srch: [
        ...NAV.map((k) => ({ t: NAV_T[k], s: "قسم", go: () => go(k) })),
        ...TL.map((t) => ({ t: t.name, s: "قالب", go: () => openSend(t.id) })),
        { t: "إرسال رسالة تجريبية", s: "إجراء", go: () => openSend() },
        { t: "ادعُ رقمًا للتجربة", s: "إجراء", go: () => go("ct") },
        { t: "اشترك الآن", s: "إجراء", go: () => goSubscribe() },
        ...trial.invites.map((i) => ({ t: showPhone(i.phone), s: "رقم مدعو", go: () => go("ct") })),
      ],
      notes: [
        ...(frozen ? [{ id: "frozen", t: "انتهت التجربة وتجمّد الإرسال.", s: "اشترك لمتابعة الإرسال من رقمك الخاص", go: () => goSubscribe() }] : []),
        ...(!frozen && !TL.length ? [{ id: "no-tpl", t: "لا توجد قوالب متاحة للتجربة حاليًا", s: "القوالب قيد الاعتماد وستظهر هنا فور جاهزيتها" }] : []),
        ...msgs.filter((m) => m.status === "failed").slice(0, 3).map((m) => ({ id: `fail:${m.id}`, t: `تعذّر إرسال رسالة إلى ${showPhone(m.phone)}`, s: m.error || "تعذّر الإرسال", go: () => openSend() })),
        ...(!frozen && dayFull ? [{ id: `day:${today}`, t: `وصلت إلى حد اليوم (${day} رسائل). يتجدد الحد غدًا.`, s: "" }] : []),
        ...(!frozen && dl <= 2 ? [{ id: `days:${dl}`, t: `تبقّى ${days(dl)} على انتهاء تجربتك`, s: "اشترك لمتابعة الإرسال من رقمك الخاص", go: () => goSubscribe() }] : []),
        ...(!frozen && left > 0 && left <= 5 ? [{ id: `left:${left}`, t: `يتبقى ${msgN(left)} في التجربة`, s: "اشترك لمتابعة الإرسال من رقمك الخاص", go: () => goSubscribe() }] : []),
        ...(trial.extended ? [{ id: "extended", t: `أكملت المهام الثلاث — مددنا تجربتك ${trial.extensionDays} أيام`, s: "" }] : []),
        ...trial.invites.filter((i) => i.status !== "pending").map((i) => i.status === "accepted"
          ? { id: `inv:${i.phone}:ok`, t: `وافق الرقم ${showPhone(i.phone)} على استقبال رسائل التجربة`, s: "يمكنك الإرسال إليه الآن", go: () => openSend() }
          : { id: `inv:${i.phone}:no`, t: `رفض الرقم ${showPhone(i.phone)} استقبال رسائل التجربة`, s: "لن يستقبل رسائل التجربة", go: () => go("ct") }),
        { id: "started", t: `بدأت تجربتك المجانية: ${total} رسالة خلال ${days(trial.totalDays)}`, s: "رسائلك تصل من رقم كوربت التجريبي" },
      ],
      ach: {
        s: sent >= Math.ceil(total * 0.8) ? `استخدمت ${sent} من ${total} رسالة تجريبية. هذا ما أنجزته حتى الآن:` : dl > 0 && !frozen ? `تبقّى ${days(dl)} على انتهاء تجربتك. هذا ما أنجزته حتى الآن:` : "انتهت تجربتك. هذا ما أنجزته:",
        sent: String(sent), inv: String(okInv), tk: String(nDone), ext: trial.extended, go: () => goSubscribe(),
      },
      md: { send: md === "send", lock: false, ach: md === "ach", meta: false, close: () => { if (!sBusy) setMd(""); } },
      pv: { homeT: pv === "home", homeP: false, tpl: pv === "tpl", ct: pv === "ct", inbox: pv === "inbox", feat: pv === "feat" },
      // the paid dashboard (number wizard, receipt, quick actions) is not part of the trial
      rc: { on: false }, wz: {}, qa: {}, hl: [], mt: {},
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial, msgs, pv, md, nav, featK, toast, toastOn, sTpl, sTo, sVars, sSub, sBusy, sErr, invV, invErr, invBusy, user]);
}
