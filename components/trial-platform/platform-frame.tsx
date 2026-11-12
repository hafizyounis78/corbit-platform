"use client";

import "@/app/register/register.css";
import "./platform.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useAuth } from "@/lib/auth/auth-context";
import api from "@/lib/api/client";
import { PlatformView } from "./platform-view";
import { localize, toEn } from "./i18n-en";

/** Something the search finds: a section, a template, an action. */
export type SearchItem = { t: string; s: string; go: () => void };
/** A line under the bell. `id` is what marks it as read, so it must be stable. */
export type Note = { id: string; t: string; s: string; go?: () => void };

const same = (s: string) => s;
const fold = (s: string) => s.toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");

/**
 * The frame both dashboards share (trial and paid): it puts the shell on
 * screen and runs its top bar — search, language, light/dark and the bell.
 * The view-model supplies what can be searched (`vm.srch`) and what there
 * is to be told (`vm.notes`); everything else about the top bar lives here.
 */
export function PlatformFrame({ vm }: { vm: any }) {
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLocale();
  const { user } = useAuth();
  const en = lang === "en";
  const tr = en ? toEn : same;

  const [srch, setSrch] = useState(false);
  const [q, setQ] = useState("");
  const [cur, setCur] = useState(0);
  const [bell, setBell] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  // «حسابي»: the account's details and its password
  const [me, setMe] = useState(false);
  const [pwCur, setPwCur] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState("");
  const [pwOk, setPwOk] = useState("");

  const seenKey = `wb-notes-seen:${(user as any)?.id || ""}`;
  useEffect(() => {
    try { setSeen(JSON.parse(localStorage.getItem(seenKey) || "[]")); } catch {}
  }, [seenKey]);

  const notes: Note[] = vm.notes || [];
  const unread = notes.filter((n) => !seen.includes(n.id)).length;

  const savePassword = async () => {
    if (pwBusy) return;
    if (!pwCur || !pwNew) { setPwOk(""); setPwErr("اكتب كلمة المرور الحالية والجديدة"); return; }
    setPwBusy(true); setPwErr(""); setPwOk("");
    try {
      const res = await api.post("/auth/change-password", { current_password: pwCur, new_password: pwNew });
      setPwCur(""); setPwNew("");
      setPwOk(res.data?.message || "تم تغيير كلمة المرور بنجاح");
    } catch (e: any) {
      const errs = e?.response?.data?.errors;
      const first = errs && typeof errs === "object" ? (Object.values(errs)[0] as string[] | undefined)?.[0] : "";
      setPwErr(first || e?.response?.data?.message || "تعذّر تغيير كلمة المرور. حاول مرة أخرى.");
    } finally {
      setPwBusy(false);
    }
  };

  const openSearch = useCallback(() => { setBell(false); setQ(""); setCur(0); setSrch(true); }, []);

  // ⌘K / Ctrl+K from anywhere on the page, as in the rest of the platform
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      e.preventDefault();
      setSrch((on) => { if (on) return false; setBell(false); setQ(""); setCur(0); return true; });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // a click anywhere else closes the bell
  useEffect(() => {
    if (!bell) return;
    const onDown = (e: MouseEvent) => { if (!(e.target as Element | null)?.closest?.(".pf-bw2")) setBell(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [bell]);

  const full = useMemo(() => {
    const items: SearchItem[] = vm.srch || [];
    const needle = fold(q.trim());
    const found = (needle ? items.filter((x) => fold(x.t).includes(needle) || fold(toEn(x.t)).includes(needle)) : items).slice(0, 8);
    const at = Math.min(cur, Math.max(0, found.length - 1));
    const pick = (x: SearchItem) => { setSrch(false); x.go(); };

    const toggleBell = () => {
      setBell((on) => {
        if (!on) {
          const all = notes.map((n) => n.id);
          setSeen(all);
          try { localStorage.setItem(seenKey, JSON.stringify(all)); } catch {}
        }
        return !on;
      });
    };

    return {
      ...vm,
      pf: {
        ...vm.pf,
        cls: vm.pf.cls + (isDark ? "" : " lt"),
        key: (ev: React.KeyboardEvent) => {
          if (ev.key === "Escape" && (srch || bell || me)) { ev.preventDefault(); setSrch(false); setBell(false); if (!pwBusy) setMe(false); return; }
          vm.pf.key?.(ev);
        },
      },
      top: {
        dark: isDark, theme: toggleTheme, themeAria: isDark ? "الوضع الفاتح" : "الوضع الداكن",
        lang: toggleLang, langLbl: en ? "عربي" : "EN",
        srchOpen: openSearch, srchOn: srch, srchClose: () => setSrch(false), q,
        onQ: (ev: React.ChangeEvent<HTMLInputElement>) => { setQ(ev.target.value); setCur(0); },
        srchKey: (ev: React.KeyboardEvent) => {
          if (ev.key === "ArrowDown") { ev.preventDefault(); setCur(Math.min(at + 1, found.length - 1)); }
          else if (ev.key === "ArrowUp") { ev.preventDefault(); setCur(Math.max(at - 1, 0)); }
          else if (ev.key === "Enter" && found[at]) { ev.preventDefault(); pick(found[at]); }
        },
        found: found.map((x, i) => ({ t: x.t, s: x.s, cls: "sr-it" + (i === at ? " on" : ""), go: () => pick(x), over: () => setCur(i) })),
        none: !found.length,
        bell: toggleBell, bellOn: bell, bellExp: bell ? "true" : "false", n: unread ? String(unread) : "",
        notes: notes.map((n) => ({
          t: n.t, s: n.s, cls: "nt" + (n.go ? " act" : ""),
          go: () => { if (n.go) { setBell(false); n.go(); } },
        })),
        noNotes: !notes.length,
        meOpen: () => { vm.pf.navClose?.(); setPwCur(""); setPwNew(""); setPwErr(""); setPwOk(""); setMe(true); },
        meOn: me, meClose: () => { if (!pwBusy) setMe(false); },
        meRows: [
          { l: "الاسم", v: user?.name || "" },
          { l: "البريد الإلكتروني", v: user?.email || "", dir: "ltr" },
          { l: "رقم الجوال", v: (user as any)?.phone || "", dir: "ltr" },
          { l: "المنشأة", v: (user as any)?.org?.name || "" },
        ].filter((r) => r.v),
        pwCur, pwNew, pwErr, pwOk,
        onPwCur: (ev: React.ChangeEvent<HTMLInputElement>) => { setPwCur(ev.target.value); setPwErr(""); },
        onPwNew: (ev: React.ChangeEvent<HTMLInputElement>) => { setPwNew(ev.target.value); setPwErr(""); },
        pwKey: (ev: React.KeyboardEvent) => { if (ev.key === "Enter") { ev.preventDefault(); savePassword(); } },
        pwSave: savePassword, pwDis: pwBusy, pwBusy: pwBusy ? "true" : "false", pwBtnCls: "pf-btn pf-pri" + (pwBusy ? " busy" : ""),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm, isDark, en, srch, q, cur, bell, seen, seenKey, me, pwCur, pwNew, pwBusy, pwErr, pwOk, user]);

  // The view has no state of its own, so it is called like a function: that
  // gives the finished tree, which English then goes over as a whole.
  const view = PlatformView({ vm: full });

  return (
    <div className="wr pfm" dir={en ? "ltr" : "rtl"} lang={en ? "en" : "ar"} style={{ position: "fixed", inset: 0, zIndex: 60, height: "100dvh" }}>
      {en ? localize(view, tr) : view}
    </div>
  );
}
