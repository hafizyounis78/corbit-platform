"use client";
/* eslint-disable */
// GENERATED from the approved signup design (project/WhatsBit-Signup.dc.html, the platform section)
// by scratch tooling: markup, classes, texts and icons are the design's own. Do not hand-edit the
// markup here — change the view-model in use-trial-platform.ts instead.
//
// Three parts are written by hand, because the design has no markup for them, and must be kept
// if this file is generated again: the top bar's four controls (vm.top), the search dialog, the
// «حسابي» dialog behind the user card, and the page a trial account sees for a feature it is
// exploring (vm.pv.feat / vm.ft).
import { Fragment } from "react";

/** "--p:50%; --i:2" → a style object (the design passes CSS variables as strings). */
function sv(s: string | undefined): React.CSSProperties | undefined {
  if (!s) return undefined;
  const o: Record<string, string> = {};
  for (const part of String(s).split(";")) {
    const i = part.indexOf(":");
    if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return o as React.CSSProperties;
}

/** WhatsBit mark (the design uses an image). */
function Mark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" width={size} height={size} aria-hidden="true" style={{ color: "#fff", flex: "none" }}>
      <defs>
        <linearGradient id="pfArcA" x1="12" y1="62" x2="64" y2="14" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FF8A1C" /><stop offset=".35" stopColor="#FF2D8F" /><stop offset="1" stopColor="#FF8A1C" /></linearGradient>
        <linearGradient id="pfArcB" x1="86" y1="55" x2="55" y2="86" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FF8A1C" /><stop offset="1" stopColor="#FF2D8F" /></linearGradient>
      </defs>
      <path d="M14.5 56.3A36 36 0 0 1 62.3 16.2" stroke="url(#pfArcA)" strokeWidth="3" strokeLinecap="round" />
      <path d="M85.5 56.3A36 36 0 0 1 56.3 85.5" stroke="url(#pfArcB)" strokeWidth="3" strokeLinecap="round" />
      <path d="M66 25.5A28 28 0 0 0 30.2 69.8L24 81l14-6.2A28 28 0 0 0 73.5 64" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="76" y="24" width="6.5" height="6.5" rx="1.2" fill="#FF5B5B" />
      <rect x="66" y="33.5" width="13" height="6.5" rx="1.4" fill="#28A745" /><rect x="56" y="38" width="6" height="4.5" rx="1.1" fill="#28A745" />
      <rect x="59" y="44" width="14.5" height="7" rx="1.4" fill="#28A745" /><rect x="79" y="42" width="8" height="4.8" rx="1.1" fill="#28A745" />
      <rect x="49" y="47.5" width="6" height="4.2" rx="1.1" fill="#28A745" /><rect x="39" y="55" width="7.5" height="5" rx="1.1" fill="#28A745" />
      <rect x="52" y="54.5" width="8.5" height="5" rx="1.1" fill="#28A745" /><rect x="66" y="53.5" width="12" height="5.8" rx="1.3" fill="#28A745" />
    </svg>
  );
}

export function PlatformView({ vm }: { vm: any }) {
  return (
    <div className={vm.pf.cls} onKeyDown={vm.pf.key}>
      <div className="pf-slab" aria-hidden="true"></div>
      <aside className="pf-side" aria-label="القائمة الرئيسية">
        <div className="pf-sin">
          <div className="pf-brand">
            <Mark size={36} />
            <span className="pf-bw"><b>Whats<span className="g">Bit</span></b><small>منصة واتساب أعمال متكاملة</small></span>
            <button type="button" className="pf-x" onClick={vm.pf.navClose} aria-label="إغلاق القائمة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
          </div>
          <nav className="pf-nav" aria-label="أقسام المنصة">
            <button type="button" className={vm.nv.home.cls} style={sv("--i:0")} onClick={vm.nv.home.go} aria-current={vm.nv.home.cur}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.6"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"></rect></svg><span className="t">لوحة التحكم</span></button>
            <button type="button" className={vm.nv.inbox.cls} style={sv("--i:1")} onClick={vm.nv.inbox.go} aria-current={vm.nv.inbox.cur}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 13h5l1.5 2.5h5L16 13h5"></path></svg><span className="t">صندوق الوارد</span><span className="cnt">{vm.nv.inboxN}</span></button>
            <button type="button" className={vm.nv.camp.cls} style={sv("--i:2")} onClick={vm.nv.camp.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10v4a1 1 0 0 1-1 1h-2l-5 4V5l5 4h2a1 1 0 0 1 1 1zM9 8.5a4 4 0 0 0 0 7M6 6a7.5 7.5 0 0 0 0 12"></path></svg><span className="t">الحملات</span>{!!vm.nv.camp.lk && (<><span className="lk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>{vm.nv.camp.lkT}</span></>)}</button>
            <button type="button" className={vm.nv.ct.cls} style={sv("--i:3")} onClick={vm.nv.ct.go} aria-current={vm.nv.ct.cur}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8"></path></svg><span className="t">جهات الاتصال</span></button>
            <button type="button" className={vm.nv.pipe.cls} style={sv("--i:4")} onClick={vm.nv.pipe.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h11M3 12h11M3 18h11M16.5 6l1.5 1.5L20.5 5M16.5 12l1.5 1.5 2.5-2.5M16.5 18l1.5 1.5 2.5-2.5"></path></svg><span className="t">مسار المبيعات</span></button>
            <button type="button" className={vm.nv.tpl.cls} style={sv("--i:5")} onClick={vm.nv.tpl.go} aria-current={vm.nv.tpl.cur}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v5h5M9 13h6M9 17h6"></path></svg><span className="t">القوالب</span></button>
            <button type="button" className={vm.nv.bot.cls} style={sv("--i:6")} onClick={vm.nv.bot.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="3"></rect><path d="M12 4v4M9 13v1.5M15 13v1.5M2 13v3M22 13v3"></path></svg><span className="t">بناء البوت</span>{!!vm.nv.bot.lk && (<><span className="lk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>{vm.nv.bot.lkT}</span></>)}</button>
            <button type="button" className={vm.nv.aic.cls} style={sv("--i:7")} onClick={vm.nv.aic.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5v9M7.5 12h9M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4"></path></svg><span className="t">مركز الذكاء</span></button>
            <button type="button" className={vm.nv.aig.cls} style={sv("--i:8")} onClick={vm.nv.aig.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"></path></svg><span className="t">وكلاء الذكاء</span></button>
            <button type="button" className={vm.nv.ana.cls} style={sv("--i:9")} onClick={vm.nv.ana.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 20V11M11 20V4M17 20v-7M3 20h18"></path></svg><span className="t">التحليلات</span></button>
            <button type="button" className={vm.nv.api.cls} style={sv("--i:10")} onClick={vm.nv.api.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path></svg><span className="t">التطبيقات</span>{!!vm.nv.api.lk && (<><span className="lk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>{vm.nv.api.lkT}</span></>)}</button>
            <button type="button" className={vm.nv.team.cls} style={sv("--i:11")} onClick={vm.nv.team.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 8v6M16 11h6"></path></svg><span className="t">الفرق</span></button>
            <button type="button" className={vm.nv.bill.cls} style={sv("--i:12")} onClick={vm.nv.bill.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18M7 15h4"></path></svg><span className="t">الفوترة</span></button>
            <button type="button" className={vm.nv.help.cls} style={sv("--i:13")} onClick={vm.nv.help.go}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2zM12 6.5v13"></path></svg><span className="t">مركز المساعدة</span></button>
          </nav>
          <div className="pf-plan"><b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"></path></svg><span>{vm.chip.t}</span></b><span className="pa">{vm.chip.a}</span><small>{vm.chip.b}</small><span className="pc">{vm.chip.c}</span></div>
          <div className="pf-user"><button type="button" className="pf-me" onClick={vm.top.meOpen} aria-label="حسابي"><span className="pf-av">{vm.pf.ini}</span><span className="pf-ut"><b>{vm.pf.uname}</b><small>مالك الحساب</small></span></button><a className="pf-out" href="/login" onClick={vm.pf.logout} aria-label="تسجيل الخروج"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"></path></svg></a></div>
        </div>
      </aside>
      <div className="pf-scrim" onClick={vm.pf.navClose} aria-hidden="true"></div>

      <section className="pf-main">
        <header className="pf-top">
          <button type="button" className="pf-mb" onClick={vm.pf.navOpen} aria-label="فتح القائمة" aria-expanded={vm.pf.navExp}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg></button>
          <span className="pf-ttl">{vm.pf.title}</span>
          
          <span className="pf-sp"></span>
          {/* hand-wired (the design draws these four as decoration): search, language, light/dark, bell */}
          <button type="button" className="pf-srch" onClick={vm.top.srchOpen} aria-label="بحث"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2"></path></svg><span>بحث...</span><kbd>⌘K</kbd></button>
          <button type="button" className="pf-tic" onClick={vm.top.lang} aria-label="تغيير اللغة">{vm.top.langLbl} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z"></path></svg></button>
          <button type="button" className="pf-tic" onClick={vm.top.theme} aria-label={vm.top.themeAria}>
            {!!vm.top.dark && (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"></path></svg>)}
            {!vm.top.dark && (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"></path></svg>)}
          </button>
          <span className="pf-bw2">
            <button type="button" className="pf-tic pf-bell" onClick={vm.top.bell} aria-label="الإشعارات" aria-expanded={vm.top.bellExp}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"></path></svg>{!!vm.top.n && (<i>{vm.top.n}</i>)}</button>
            {!!vm.top.bellOn && (
              <div className="pf-pop" role="dialog" aria-label="الإشعارات">
                <b className="pop-h">الإشعارات</b>
                <ul className="pop-ul">{(vm.top.notes || []).map((x: any, i: number) => (<Fragment key={i}><li><button type="button" className={x.cls} onClick={x.go}><b>{x.t}</b>{!!x.s && (<small>{x.s}</small>)}</button></li></Fragment>))}</ul>
                {!!vm.top.noNotes && (<p className="pop-0">لا توجد إشعارات.</p>)}
              </div>
            )}
          </span>
        </header>

        {!!vm.pf.isTrial && (<>
          <div className={vm.tb.cls}>
            <span className="tb-badge"><i aria-hidden="true"></i>وضع التجربة</span>
            {!!vm.tb.live && (<>
              <span className="tb-st t1"><b className="num">{vm.tb.left}</b> من {vm.tb.total} رسالة متبقية</span>
              <span className="tb-bar" aria-hidden="true"><i style={sv(vm.tb.barSt)}></i></span>
              <span className="tb-st t2">اليوم <b className="num">{vm.tb.today}</b> من {vm.tb.day}</span>
              <span className="tb-st t3">المدة المتبقية <b>{vm.tb.days}</b></span>
            </>)}
            {!!vm.tb.frozen && (<><span className="tb-frz">{vm.tb.frzT}</span></>)}
            <span className="tb-sp"></span>
            {!!vm.tb.advOn && (<><button type="button" className="tb-adv" onClick={vm.tb.adv}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 6l-8 6 8 6zM21 6l-8 6 8 6z"></path></svg><span>{vm.tb.advLbl}</span></button></>)}
            <button type="button" className="pf-btn pf-grad tb-go" onClick={vm.pf.sub}>اشترك الآن</button>
          </div>
        </>)}

        <div className="pf-scroll">
          <div className="pf-cont">

            
            {!!vm.pv.homeT && (<>
              <div className="pf-view">
                <div className="pf-wel"><div className="pf-wel-tx"><h1 tabIndex={-1}>{vm.wel.t}</h1><p>{vm.wel.s1}<b>{vm.wel.b}</b>{vm.wel.s2}</p></div></div>
                <div className="pf-g">
                  <div className="pf-col">
                    <section className="pf-card" aria-labelledby="pf-tk-h">
                      <div className="pf-ch"><div><h2 id="pf-tk-h">ابدأ بثلاث مهام</h2><p>{vm.tk.sub}</p></div><span className="tk-ring" style={sv(vm.tk.ringSt)} role="img" aria-label={vm.tk.aria}><b>{vm.tk.n}</b><small>من 3</small></span></div>
                      <ol className="tk-list">
                        {(vm.tk.list || []).map((t: any, i: number) => (<Fragment key={i}><li className={t.cls}><span className="tk-n"><span className="tk-i">{t.i}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><span className="tk-tx"><b>{t.t}</b><small>{t.s}</small></span>{!!t.todo && (<><button type="button" className="pf-btn pf-line tk-go" onClick={t.go} disabled={!!t.dis}>{t.btn}</button></>)}{!!t.done && (<><span className="tk-ok">{t.okT}</span></>)}</li></Fragment>))}
                      </ol>
                      {!!vm.tk.ext && (<><p className="tk-ext"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="9" width="17" height="11.5" rx="2"></rect><path d="M12 9v11.5M3.5 13h17M12 9C10.5 5 6.5 5 6.8 7.4 7 9 12 9 12 9zM12 9c1.5-4 5.5-4 5.2-1.6C17 9 12 9 12 9z"></path></svg><span>أكملت المهام الثلاث — مددنا تجربتك {vm.tk.extN} أيام</span></p></>)}
                    </section>
                    <div className="pf-kpis">
                      {(vm.kp || []).map((k: any, i: number) => (<Fragment key={i}><div className={k.cls}><span className="kp-l">{k.l}</span><b className="num">{k.v}<small>{k.of}</small></b><span className="kp-bar" aria-hidden="true"><i style={sv(k.st)}></i></span><small className="kp-s">{k.s}</small></div></Fragment>))}
                    </div>
                    <div className="pf-two">
                      <section className="pf-card" aria-labelledby="pf-lk-h">
                        <div className="pf-ch sm"><h2 id="pf-lk-h">تُفتح بالاشتراك</h2></div>
                        <ul className="lk-list">{(vm.lk || []).map((x: any, i: number) => (<Fragment key={i}><li><button type="button" className="lk-it" onClick={x.go}><span className="lk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg></span><span className="lk-tx"><b>{x.n}</b><small>{x.d}</small></span><span className="lk-pl">{x.pl}</span></button></li></Fragment>))}</ul>
                      </section>
                      <section className="pf-card" aria-labelledby="pf-rl-h">
                        <div className="pf-ch sm"><h2 id="pf-rl-h">قواعد التجربة لحماية الرقم</h2></div>
                        <ul className="rl-list">
                          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4"></path></svg><span>قوالب خدمية معتمدة منّا فقط</span></li>
                          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4"></path></svg><span>تعدّل المتغيرات فقط: الاسم، رقم الطلب، الموعد</span></li>
                          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4"></path></svg><span>لا نص حر ولا روابط ولا ملفات</span></li>
                          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4"></path></svg><span>تذييل «رسالة تجريبية - كوربت» في كل رسالة</span></li>
                          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4"></path></svg><span>تجربة واحدة لكل جوال ولكل سجل تجاري</span></li>
                        </ul>
                      </section>
                    </div>
                  </div>
                  <aside className="pf-card pf-phw" aria-labelledby="pf-ph-h">
                    <div className="pf-ch sm"><h2 id="pf-ph-h">كما تصل إلى جوالك</h2><bdi dir="ltr" className="ph-num num">{vm.ph.to}</bdi></div>
                    <div className="pf-ph">
                      <div className="ph-hd"><span className="ph-av">ك</span><span className="ph-who"><b>كوربت · رقم التجربة</b><small>حساب أعمال</small></span></div>
                      <div className="ph-body">
                        {!!vm.ph.empty && (<><div className="ph-empty"><p>لم تصلك رسائل بعد. أرسل أول رسالة لترى كيف تصل لعملائك.</p><button type="button" className="pf-btn pf-pri" onClick={vm.pf.send} disabled={!!vm.pf.sendDis}>أرسل الآن</button></div></>)}
                        {(vm.ph.msgs || []).map((m: any, i: number) => (<Fragment key={i}><div className="ph-msg"><p className="ph-tx">{(m.segs || []).map((g: any, i: number) => (<Fragment key={i}><span className={g.c}>{g.t}</span></Fragment>))}</p><p className="ph-ft">رسالة تجريبية - كوربت</p><span className="ph-tm"><span>{m.time}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12.5l3.5 3.5L12 9.5M9 15l1 1L17 9.5"></path></svg></span></div></Fragment>))}
                      </div>
                    </div>
                    {!!vm.ph.more && (<><button type="button" className="pf-btn pf-line ph-more" onClick={vm.pf.send} disabled={!!vm.pf.sendDis}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 3.5L3.5 10.6l6.6 2.8 2.8 6.6zM10.1 13.4l4.3-4.3"></path></svg><span>إرسال رسالة تجريبية</span></button></>)}
                  </aside>
                </div>
              </div>
            </>)}

            
            {!!vm.pv.homeP && (<>
              <div className="pf-view">
                {!!vm.rc.on && (<><div className="pf-rc" role="status"><span className="rc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><span className="rc-tx"><b>تم الدفع بنجاح · باقة {vm.rc.plan} — {vm.rc.period}</b><small><span className="num">{vm.rc.paid}</span> ر.س شامل الضريبة · رقم الطلب <bdi dir="ltr">{vm.rc.no}</bdi>  · تصلك الفاتورة الضريبية الإلكترونية على <bdi dir="ltr">{vm.rc.email}</bdi></small></span><button type="button" className="pf-ix" onClick={vm.rc.close} aria-label="إخفاء"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button></div></>)}
                <div className="pf-wel"><div className="pf-wel-tx"><h1 tabIndex={-1}>{vm.wel.t}</h1><p>{vm.wel.s1}<b>{vm.wel.b}</b>{vm.wel.s2}</p></div></div>
                <div className="pf-g">
                  <section className="pf-card" aria-labelledby="wz-h">
                    <div className="pf-ch"><div><h2 id="wz-h">اربط رقم واتساب الأعمال</h2><p>خطوات قليلة داخل المنصة وفريق الدعم معك. التوثيق تراجعه Meta وقد يستغرق أيامًا.</p></div><span className="wz-prog">{vm.wz.prog}</span></div>
                    <ol className="wz-list">
                      <li className={vm.wz.c1}><span className="wz-n"><span className="wz-i">1</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><div className="wz-b"><b>ربط حساب Meta للأعمال</b>
                        {!!vm.wz.a1 && (<><p>سجّل الدخول عبر Meta واختر حساب منشأتك، أو أنشئ حسابًا جديدًا لواتساب الأعمال.</p><button type="button" className="pf-btn pf-pri" onClick={vm.wz.meta}>متابعة مع Meta</button></>)}
                        {!!vm.wz.d1 && (<><small className="wz-done">{vm.wz.d1t}</small></>)}
                      </div></li>
                      <li className={vm.wz.c2}><span className="wz-n"><span className="wz-i">2</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><div className="wz-b"><b>التحقق من الرقم</b>
                        {!!vm.wz.f2 && (<><small className="wz-f">رمز تحقق يصل من Meta على رقم منشأتك</small></>)}
                        {!!vm.wz.a2 && (<><p>يصلك رمز من Meta برسالة نصية على الرقم <bdi dir="ltr">{vm.wz.wa}</bdi>.</p>
                          {!!vm.wz.notSent && (<><button type="button" className="pf-btn pf-pri" onClick={vm.wz.send}>أرسل الرمز</button></>)}
                          {!!vm.wz.sent && (<><div className="wz-row"><div className={vm.wz.codeCls}><label htmlFor="pf-wzc">رمز التحقق</label><div className="pctrl ltrc"><input id="pf-wzc" inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" value={vm.wz.code} onChange={vm.wz.onCode} onKeyDown={vm.wz.keyCode} aria-invalid={vm.wz.codeInv} aria-describedby="pf-wzc-e" /></div><p className="err" id="pf-wzc-e" role="alert">{vm.wz.codeErr}</p></div><button type="button" className="pf-btn pf-pri wz-v" onClick={vm.wz.verify}>تحقق</button></div></>)}
                        </>)}
                        {!!vm.wz.d2 && (<><small className="wz-done">تم التحقق من <bdi dir="ltr">{vm.wz.wa}</bdi></small></>)}
                      </div></li>
                      <li className={vm.wz.c3}><span className="wz-n"><span className="wz-i">3</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><div className="wz-b"><b>الاسم الظاهر للعملاء</b>
                        {!!vm.wz.f3 && (<><small className="wz-f">الاسم الذي يراه عملاؤك في المحادثات</small></>)}
                        {!!vm.wz.a3 && (<><p>تراجعه Meta قبل ظهوره في محادثات عملائك.</p><div className="wz-row"><div className={vm.wz.dnCls}><label htmlFor="pf-dn">الاسم الظاهر</label><div className="pctrl"><input id="pf-dn" autoComplete="off" value={vm.wz.dn} onChange={vm.wz.onDn} aria-invalid={vm.wz.dnInv} aria-describedby="pf-dn-e" /></div><p className="err" id="pf-dn-e" role="alert">{vm.wz.dnErr}</p></div><button type="button" className="pf-btn pf-pri wz-v" onClick={vm.wz.name}>إرسال للمراجعة</button></div></>)}
                        {!!vm.wz.d3 && (<><small className="wz-done">{vm.wz.d3t}</small></>)}
                      </div></li>
                      <li className={vm.wz.c4}><span className="wz-n"><span className="wz-i">4</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><div className="wz-b"><b>توثيق المنشأة</b>
                        {!!vm.wz.f4 && (<><small className="wz-f">مستندات المنشأة الرسمية لمراجعة Meta</small></>)}
                        {!!vm.wz.a4 && (<><p>ارفع مستندات المنشأة الرسمية مثل السجل التجاري <bdi dir="ltr">{vm.wz.cr}</bdi>. تراجعها Meta وقد يستغرق ذلك أيامًا.</p>
                          <label className={vm.wz.upCls}><input type="file" className="sr" accept=".pdf,.png,.jpg,.jpeg" onChange={vm.wz.file} /><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"></path></svg><span>{vm.wz.docName}</span></label>
                          <div className="wz-row"><button type="button" className="pf-btn pf-pri" onClick={vm.wz.doc}>إرسال للتوثيق</button></div>
                          {!!vm.wz.docErr && (<><p className="err-l" role="alert">{vm.wz.docErr}</p></>)}
                        </>)}
                        {!!vm.wz.d4 && (<><small className="wz-done">أُرسلت المستندات · قيد مراجعة Meta</small></>)}
                      </div></li>
                    </ol>
                    {!!vm.wz.fin && (<><div className="wz-fin" role="status"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg><div><b>أنهيت ما عليك</b><small>تراجع Meta الاسم الظاهر وتوثيق المنشأة، وقد يستغرق ذلك أيامًا. فريق الدعم يتابع طلبك وسنبلغك فور اكتمال المراجعة.</small></div></div></>)}
                  </section>
                  <div className="pf-col">
                    <section className="pf-card sup"><h2>فريق الدعم معك</h2><p>نساعدك في ربط الرقم والتوثيق خطوة بخطوة.</p><a className="pf-btn pf-line" href="tel:920006900"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg><bdi dir="ltr">920006900</bdi></a></section>
                    <section className="pf-card qa"><h2>إجراءات سريعة</h2><div className="qa-g"><button type="button" className="qa-b g" onClick={vm.qa.camp}>حملة جديدة<small>بعد ربط الرقم</small></button><button type="button" className="qa-b p" onClick={vm.qa.tpl}>قالب جديد<small>قوالب مقترحة لقطاعك</small></button></div></section>
                  </div>
                </div>
                <section className="pf-card" aria-labelledby="hl-h">
                  <div className="pf-ch"><div><small className="hl-k">مؤشرات صحة الحساب اليومية</small><h2 id="hl-h">تظهر بعد ربط رقمك وبدء الإرسال</h2></div><span className="hl-t">آخر 7 أيام</span></div>
                  <div className="hl-g">{(vm.hl || []).map((h: any, i: number) => (<Fragment key={i}><div className="hl-c"><span className="hl-l">{h.l}</span><b>—</b><small>{h.s}</small></div></Fragment>))}</div>
                </section>
              </div>
            </>)}

            
            {!!vm.pv.tpl && (<>
              <div className="pf-view">
                <div className="pf-vh"><h1 tabIndex={-1}>القوالب الجاهزة</h1><p>{vm.tp.sub}</p></div>
                <div className="tp-grid">
                  {(vm.tp.list || []).map((t: any, i: number) => (<Fragment key={i}><article className="pf-card tp"><div className="tp-hd"><b>{t.n}</b><span className="tp-chip">{vm.tp.chip}</span></div><p className="tp-b">{(t.segs || []).map((g: any, i: number) => (<Fragment key={i}><span className={g.c}>{g.t}</span></Fragment>))}</p>{!!vm.tp.ft && (<><p className="tp-ft">التذييل: رسالة تجريبية - كوربت</p></>)}<div className="tp-act"><span className="tp-vars">{t.vars}</span><button type="button" className="pf-btn pf-line" onClick={t.use}>{t.useLbl}</button></div></article></Fragment>))}
                  <article className="pf-card tp tp-lock"><div className="tp-hd"><b>القوالب التسويقية والمخصّصة</b><span className="lk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg></span></div><p className="tp-x">{vm.tp.lockT}</p></article>
                </div>
              </div>
            </>)}

            
            {!!vm.pv.ct && (<>
              <div className="pf-view">
                <div className="pf-vh"><h1 tabIndex={-1}>أرقام التجربة</h1><p>يصل الرقم المدعو طلب موافقة أولًا، ولا يستقبل أي رسالة قبل أن يوافق.</p></div>
                <div className="pf-g2">
                  <section className="pf-card ct-form" aria-labelledby="ct-h">
                    <h2 id="ct-h">ادعُ رقمًا للتجربة <span className="ct-cnt">{vm.ct.used} من {vm.ct.max}</span></h2>
                    <div className={vm.ct.fcls}><label htmlFor="pf-inv">رقم الجوال</label><div className="pctrl ltrc"><span className="cc">+966</span><input id="pf-inv" type="tel" inputMode="numeric" autoComplete="off" placeholder="5X XXX XXXX" value={vm.ct.v} onChange={vm.ct.on} onKeyDown={vm.ct.key} aria-invalid={vm.ct.inv} aria-describedby="pf-inv-e" /></div><p className="err" id="pf-inv-e" role="alert">{vm.ct.err}</p></div>
                    <button type="button" className="pf-btn pf-pri" onClick={vm.ct.send} disabled={!!vm.ct.dis}>إرسال طلب الموافقة</button>
                    
                    <div className="ct-lock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg><span>استيراد جهات الاتصال ورفع ملفات الأرقام متاح بعد الاشتراك</span></div>
                  </section>
                  <section className="pf-card ct-list" aria-labelledby="ct-l-h">
                    <h2 id="ct-l-h">المستلمون في التجربة</h2>
                    <ul className="ct-ul">
                      <li className="ct-r me"><span className="ct-av">{vm.ct.meIni}</span><span className="ct-t"><bdi dir="ltr">{vm.ct.me}</bdi><small>جوالك الموثّق · مستلم تلقائي</small></span><span className="st-chip ok">موثّق</span></li>
                      {(vm.ct.list || []).map((x: any, i: number) => (<Fragment key={i}><li className="ct-r"><span className="ct-av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c.9-3.6 3.9-6 7.5-6s6.6 2.4 7.5 6"></path></svg></span><span className="ct-t"><bdi dir="ltr">{x.n}</bdi><small>{x.sub}</small></span><span className={x.cls}>{x.st}</span></li></Fragment>))}
                    </ul>
                    {!!vm.ct.empty && (<><p className="ct-empty">لم تدعُ أي رقم بعد.</p></>)}
                  </section>
                </div>
              </div>
            </>)}

            
            {!!vm.pv.inbox && (<>
              <div className="pf-view">
                <div className="pf-vh"><h1 tabIndex={-1}>صندوق الوارد</h1><p>رسائل التجربة التي أرسلتها من رقم كوربت التجريبي.</p></div>
                <section className="pf-card">
                  {!!vm.ib.empty && (<><div className="ib-empty"><p>لم ترسل رسائل بعد.</p><button type="button" className="pf-btn pf-pri" onClick={vm.pf.send} disabled={!!vm.pf.sendDis}>أرسل أول رسالة</button></div></>)}
                  <ul className="ib-ul">{(vm.ib.list || []).map((m: any, i: number) => (<Fragment key={i}><li className="ib-r"><span className="ct-av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"></path></svg></span><span className="ib-t"><b>{m.to}</b><p>{m.tx}</p></span><span className="ib-m"><span>{m.time}</span><span className="st-chip ok">{m.tpl}</span></span></li></Fragment>))}</ul>
                </section>
              </div>
            </>)}

            {/* hand-written: a feature the trial account is exploring */}
            {!!vm.pv.feat && (<>
              <div className="pf-view">
                <div className="pf-vh"><h1 tabIndex={-1}>{vm.ft.t}</h1><p>{vm.ft.s}</p></div>
                <div className="pf-g">
                  <section className="pf-card" aria-labelledby="ft-h">
                    <div className="pf-ch sm"><h2 id="ft-h">ماذا تقدّم لك هذه الميزة</h2><span className="tp-chip">تستكشفها الآن</span></div>
                    <ul className="ft-list">{(vm.ft.pts || []).map((p: any, i: number) => (<Fragment key={i}><li><span className="ft-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><span className="ft-tx"><b>{p.t}</b><small>{p.d}</small></span></li></Fragment>))}</ul>
                  </section>
                  <div className="pf-col">
                    <section className="pf-card ft-cta"><span className="ft-k">{vm.ft.k}</span><h2>{vm.ft.ct}</h2><p>{vm.ft.cs}</p><button type="button" className="pf-btn pf-grad" onClick={vm.ft.go}>{vm.ft.goLbl}</button></section>
                    <section className="pf-card" aria-labelledby="ft-s-h">
                      <div className="pf-ch sm"><h2 id="ft-s-h">كيف تبدأ</h2></div>
                      <ol className="ft-steps">{(vm.ft.steps || []).map((s: string, i: number) => (<Fragment key={i}><li><span className="ft-n">{i + 1}</span><span>{s}</span></li></Fragment>))}</ol>
                    </section>
                  </div>
                </div>
              </div>
            </>)}

          </div>
        </div>

        {!!vm.boot.on && (<>
          <div className="pf-boot" role="status" aria-live="polite"><div className="pf-bc"><Mark size={52} /><h2>{vm.boot.t}</h2><ul>{(vm.boot.items || []).map((b: any, i: number) => (<Fragment key={i}><li className={b.cls}><span className="bic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span><span>{b.t}</span></li></Fragment>))}</ul><span className="bbar" aria-hidden="true"><i></i></span></div></div>
        </>)}
        <a className="pf-help" href="tel:920006900" aria-label="تحتاج مساعدة؟ اتصل على 920006900">?</a>
      </section>

      
      {!!vm.md.send && (<>
        <div className="pf-md">
          <div className="pf-mscrim" onClick={vm.md.close} aria-hidden="true"></div>
          <div className="pf-dlg wide" role="dialog" aria-modal="true" aria-labelledby="sd-h">
            <div className="dlg-hd"><div><h2 id="sd-h" tabIndex={-1}>إرسال رسالة تجريبية</h2><p>من رقم كوربت التجريبي بقالب معتمد، وتعدّل المتغيرات فقط.</p></div><button type="button" className="pf-ix" onClick={vm.md.close} aria-label="إغلاق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button></div>
            <div className="sd-g">
              <div className="sd-f">
                <fieldset className="sd-fs"><legend>المستلم</legend>
                  <div className="sd-opts">{(vm.sd.to || []).map((o: any, i: number) => (<Fragment key={i}><label className={o.cls}><input type="radio" className="sr" name="pf-to" checked={!!o.on} disabled={!!o.dis} onChange={o.pick} /><span className="rd2" aria-hidden="true"></span><span className="o-t"><b>{o.t}</b><bdi dir="ltr" className="num">{o.n}</bdi></span>{!!o.wait && (<><span className="o-w">بانتظار الموافقة</span></>)}</label></Fragment>))}</div>
                  <button type="button" className="lnk sm sd-inv" onClick={vm.sd.inv}>ادعُ رقمًا للتجربة</button>
                </fieldset>
                <fieldset className="sd-fs"><legend>القالب</legend>
                  <div className="sd-opts">{(vm.sd.tpls || []).map((o: any, i: number) => (<Fragment key={i}><label className={o.cls}><input type="radio" className="sr" name="pf-tpl" checked={!!o.on} onChange={o.pick} /><span className="rd2" aria-hidden="true"></span><b>{o.n}</b></label></Fragment>))}</div>
                </fieldset>
                <fieldset className="sd-fs"><legend>المتغيرات</legend>
                  <div className="sd-vars">{(vm.sd.vars || []).map((x: any, i: number) => (<Fragment key={i}><div className={x.cls}><label htmlFor={x.id}>{x.l}</label><div className="pctrl"><input id={x.id} autoComplete="off" value={x.v} onChange={x.on} aria-invalid={x.inv} /></div><p className="err" role="alert">{x.err}</p></div></Fragment>))}</div>
                </fieldset>
              </div>
              <div className="sd-pv">
                <span className="sd-pl">معاينة الرسالة</span>
                <div className="pf-ph sm">
                  <div className="ph-hd"><span className="ph-av">ك</span><span className="ph-who"><b>كوربت · رقم التجربة</b><small>إلى <bdi dir="ltr">{vm.sd.toN}</bdi></small></span></div>
                  <div className="ph-body"><div className="ph-msg"><p className="ph-tx">{(vm.sd.segs || []).map((g: any, i: number) => (<Fragment key={i}><span className={g.c}>{g.t}</span></Fragment>))}</p><p className="ph-ft">رسالة تجريبية - كوربت</p><span className="ph-tm"><span>الآن</span></span></div></div>
                </div>
                <ul className="sd-rules"><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>قوالب خدمية معتمدة فقط</span></li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>لا نص حر ولا روابط ولا ملفات</span></li></ul>
              </div>
            </div>
            <div className="dlg-ft">
              {!!vm.sd.limit && (<><p className="sd-lim" role="alert">{vm.sd.limitT}</p></>)}
              <span className="sd-left">{vm.sd.left}</span>
              <span className="pf-sp"></span>
              <button type="button" className="pf-btn pf-ghost" onClick={vm.md.close}>إلغاء</button>
              <button type="button" className={vm.sd.btnCls} onClick={vm.sd.send} disabled={!!vm.sd.dis} aria-busy={vm.sd.busy}><span>إرسال</span><span className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 3.5L3.5 10.6l6.6 2.8 2.8 6.6zM10.1 13.4l4.3-4.3"></path></svg></span><span className="spin" aria-hidden="true"></span></button>
            </div>
          </div>
        </div>
      </>)}

      
      {!!vm.md.lock && (<>
        <div className="pf-md">
          <div className="pf-mscrim" onClick={vm.md.close} aria-hidden="true"></div>
          <div className="pf-dlg" role="dialog" aria-modal="true" aria-labelledby="lk-h">
            <div className="dlg-hd"><span className="lk-big"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg></span><button type="button" className="pf-ix" onClick={vm.md.close} aria-label="إغلاق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button></div>
            <h2 id="lk-h" tabIndex={-1}>{vm.lkm.t}</h2>
            <p className="dlg-p">{vm.lkm.s}</p>
            <div className="lkm-plan"><div className="lkm-ph"><b>باقة {vm.lkm.pn}</b><span><b className="num">{vm.lkm.pp}</b> ر.س شهريًا قبل الضريبة</span></div><ul>{(vm.lkm.f || []).map((f: any, i: number) => (<Fragment key={i}><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>{f}</span></li></Fragment>))}</ul></div>
            <div className="dlg-ft"><span className="pf-sp"></span><button type="button" className="pf-btn pf-ghost" onClick={vm.md.close}>متابعة التجربة</button><button type="button" className="pf-btn pf-grad" onClick={vm.lkm.go}>{vm.lkm.goLbl}</button></div>
          </div>
        </div>
      </>)}

      
      {!!vm.md.ach && (<>
        <div className="pf-md">
          <div className="pf-mscrim" onClick={vm.md.close} aria-hidden="true"></div>
          <div className="pf-dlg ach" role="dialog" aria-modal="true" aria-labelledby="ach-h">
            <div className="ach-top" aria-hidden="true"></div>
            <span className="ach-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8.5 20.5h7M9.5 17h5"></path></svg></span>
            <h2 id="ach-h" tabIndex={-1}>إنجازك في التجربة</h2>
            <p className="dlg-p">{vm.ach.s}</p>
            <div className="ach-g">
              <div className="ach-s"><b className="num">{vm.ach.sent}</b><small>رسائل أرسلتها</small></div>
              <div className="ach-s"><b className="num">{vm.ach.inv}</b><small>أرقام وافقت</small></div>
              <div className="ach-s"><b className="num">{vm.ach.tk}</b><small>مهام من 3</small></div>
            </div>
            {!!vm.ach.ext && (<><p className="ach-ext">مددنا تجربتك {vm.tk.extN} أيام لأنك أكملت المهام الثلاث.</p></>)}
            <p className="ach-n">عند الاشتراك تعود إلى اختيار الباقة وبياناتك محفوظة، ثم تربط رقمك الخاص باسم منشأتك.</p>
            <div className="dlg-ft"><button type="button" className="pf-btn pf-ghost" onClick={vm.md.close}>متابعة التجربة</button><button type="button" className="pf-btn pf-grad" onClick={vm.ach.go}>اشترك الآن</button></div>
          </div>
        </div>
      </>)}

      
      {!!vm.md.meta && (<>
        <div className="pf-md">
          <div className="pf-mscrim" onClick={vm.md.close} aria-hidden="true"></div>
          <div className="pf-dlg" role="dialog" aria-modal="true" aria-labelledby="mt-h">
            <div className="dlg-hd"><div><span className="mt-k">Meta </span><h2 id="mt-h" tabIndex={-1}>ربط WhatsBit بحساب أعمالك</h2><p>اختر حساب الأعمال الذي سيُربط به رقم واتساب لمنشأتك.</p></div><button type="button" className="pf-ix" onClick={vm.md.close} aria-label="إغلاق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button></div>
            <div className="mt-opts" role="radiogroup" aria-label="حساب الأعمال">
              <label className={vm.mt.cCls}><input type="radio" className="sr" name="pf-mt" checked={!!vm.mt.cur} onChange={vm.mt.toCur} /><span className="rd2" aria-hidden="true"></span><span className="o-t"><b>{vm.mt.biz}</b><small>حساب أعمال حالي</small></span></label>
              <label className={vm.mt.nCls}><input type="radio" className="sr" name="pf-mt" checked={!!vm.mt.neu} onChange={vm.mt.toNew} /><span className="rd2" aria-hidden="true"></span><span className="o-t"><b>إنشاء حساب أعمال جديد</b><small>باسم {vm.mt.biz}</small></span></label>
            </div>
            <div className="dlg-ft"><span className="pf-sp"></span><button type="button" className="pf-btn pf-ghost" onClick={vm.md.close}>إلغاء</button><button type="button" className="pf-btn pf-pri" onClick={vm.mt.ok}>متابعة</button></div>
          </div>
        </div>
      </>)}

      {/* hand-written: the account behind the user card */}
      {!!vm.top.meOn && (<>
        <div className="pf-md">
          <div className="pf-mscrim" onClick={vm.top.meClose} aria-hidden="true"></div>
          <div className="pf-dlg" role="dialog" aria-modal="true" aria-labelledby="me-h">
            <div className="dlg-hd"><div><h2 id="me-h" tabIndex={-1}>حسابي</h2><p>بيانات حسابك في WhatsBit.</p></div><button type="button" className="pf-ix" onClick={vm.top.meClose} aria-label="إغلاق"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button></div>
            <dl className="me-dl">{(vm.top.meRows || []).map((r: any, i: number) => (<Fragment key={i}><div><dt>{r.l}</dt><dd><bdi dir={r.dir}>{r.v}</bdi></dd></div></Fragment>))}</dl>
            <fieldset className="sd-fs me-pw"><legend>تغيير كلمة المرور</legend>
              <div className="sd-vars">
                <div className="pfld"><label htmlFor="me-cur">كلمة المرور الحالية</label><div className="pctrl ltrc"><input id="me-cur" type="password" autoComplete="current-password" value={vm.top.pwCur} onChange={vm.top.onPwCur} /></div></div>
                <div className="pfld"><label htmlFor="me-new">كلمة المرور الجديدة</label><div className="pctrl ltrc"><input id="me-new" type="password" autoComplete="new-password" value={vm.top.pwNew} onChange={vm.top.onPwNew} onKeyDown={vm.top.pwKey} /></div></div>
              </div>
              {!!vm.top.pwErr && (<p className="err-l me-msg" role="alert">{vm.top.pwErr}</p>)}
              {!!vm.top.pwOk && (<p className="me-ok me-msg" role="status">{vm.top.pwOk}</p>)}
            </fieldset>
            <div className="dlg-ft"><span className="pf-sp"></span><button type="button" className="pf-btn pf-ghost" onClick={vm.top.meClose}>إغلاق</button><button type="button" className={vm.top.pwBtnCls} onClick={vm.top.pwSave} disabled={!!vm.top.pwDis} aria-busy={vm.top.pwBusy}><span>حفظ كلمة المرور</span><span className="spin" aria-hidden="true"></span></button></div>
          </div>
        </div>
      </>)}

      {/* hand-written: search */}
      {!!vm.top.srchOn && (<>
        <div className="pf-md sr-md">
          <div className="pf-mscrim" onClick={vm.top.srchClose} aria-hidden="true"></div>
          <div className="pf-dlg sr-dlg" role="dialog" aria-modal="true" aria-label="بحث">
            <div className="sr-in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2"></path></svg><input autoFocus autoComplete="off" placeholder="ابحث في المنصة..." aria-label="بحث" value={vm.top.q} onChange={vm.top.onQ} onKeyDown={vm.top.srchKey} /><kbd>Esc</kbd></div>
            <ul className="sr-ul">{(vm.top.found || []).map((x: any, i: number) => (<Fragment key={i}><li><button type="button" className={x.cls} onClick={x.go} onMouseEnter={x.over}><b>{x.t}</b><small>{x.s}</small></button></li></Fragment>))}</ul>
            {!!vm.top.none && (<p className="sr-0">لا توجد نتائج.</p>)}
          </div>
        </div>
      </>)}

      <div className={vm.pf.toastCls} role="status" aria-live="polite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>{vm.pf.toast}</span></div>
    </div>
  );
}
