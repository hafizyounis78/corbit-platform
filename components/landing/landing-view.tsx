"use client";
/* eslint-disable */
// GENERATED from the approved landing design (project/WhatsBit.dc.html): markup, classes, texts and
// icons are the design's own. Do not hand-edit — change the generator, or the view-model in landing.tsx.
import { Fragment } from "react";

/** "--p:50%; --i:2" → a style object (the design passes inline styles as strings). */
function sv(s: string | undefined): React.CSSProperties | undefined {
  if (!s) return undefined;
  const o: Record<string, string> = {};
  for (const part of String(s).split(";")) {
    const i = part.indexOf(":");
    if (i <= 0) continue;
    const k = part.slice(0, i).trim();
    o[k.startsWith("--") ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = part.slice(i + 1).trim();
  }
  return o as React.CSSProperties;
}

export function LandingView({ vm }: { vm: any }) {
  return (
<div className="w2" dir="rtl" onMouseMove={vm.onMove} style={sv("position: relative; width: 100%; height: 100vh; min-height: 640px; overflow: hidden; background: #F7F8FA")}>
  <div className="sprog" aria-hidden="true"><i></i></div>

  <header className="top">
    <button type="button" className="brand" onClick={vm.goHome} aria-label="WhatsBit — البداية">
      <img src="/landing/whatsbit-mark.png" alt="" />
      <span className="bw"><b>Whats<span className="g">Bit</span></b><small>منصة من المدار</small></span>
    </button>
    <div style={sv("display: flex; align-items: center; gap: 22px")}>
      <span className="chap hide-sm"><i></i>{vm.chapter}</span>
      <button type="button" className="btn btn-line hide-sm" onClick={vm.goPricing} style={sv("min-height: 42px; padding: 0 18px; font-size: 14px")}>الباقات</button>
      <a className="btn btn-line loginbtn" href="/login" style={sv("min-height: 42px; padding: 0 16px; font-size: 14px; gap: 8px")}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c.9-3.6 3.9-6 7.5-6s6.6 2.4 7.5 6"></path></svg><span className="hide-sm">تسجيل الدخول</span><span className="show-sm">دخول</span></a>
      <button type="button" className="btn btn-primary" onClick={vm.goContact} style={sv("min-height: 42px; padding: 0 18px; font-size: 14px")}>ابدأ الآن</button>
      <button type="button" className="menubtn" onClick={vm.openMenu} aria-label="القائمة والمنتجات" aria-expanded={vm.menuExp} aria-controls="sidemenu"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10"></path></svg></button>
    </div>
  </header>
  <button type="button" className={`scrim ${vm.menuCls}`} onClick={vm.closeMenu} aria-label="إغلاق القائمة" tabIndex={-1}></button>
  <aside id="sidemenu" className={`drawer ${vm.menuCls}`} aria-label="القائمة والمنتجات" aria-hidden={vm.menuHidden}>
    <div className="dh">
      <img src="/landing/corbit-logo.png" alt="CORBIT المدار" style={sv("height: 38px; width: auto")} />
      <button type="button" className="menubtn" onClick={vm.closeMenu} aria-label="إغلاق القائمة"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
    </div>
    <div className="lab">منتجاتنا</div>
    <nav aria-label="المنتجات" style={sv("display: flex; flex-direction: column")}>
      <a className="it" href="https://corbit.sa/products/sms" target="_blank" rel="noopener"><span className="ic"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM8 11h8M8 14.5h5"></path></svg></span><span className="tx"><span className="nm">الرسائل النصية SMS</span><span className="ds">رسائل جماعية ورموز تحقق باسم علامتك</span></span><svg className="go" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"></path></svg></a>
      <a className="it here" href="/" aria-current="page"><span className="ic"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM9.5 8.5c0 3.3 2.7 6 6 6l1-1.6-2-1-1 1a4 4 0 0 1-2.4-2.4l1-1-1-2z"></path></svg></span><span className="tx"><span className="nm">WhatsBit</span><span className="ds">منصة واتساب أعمال متكاملة</span></span><span className="tag">أنت هنا</span></a>
      <a className="it" href="https://corbit.sa/products/o-time" target="_blank" rel="noopener"><span className="ic"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2"></path></svg></span><span className="tx"><span className="nm">O-Time</span><span className="ds">الحضور والرواتب ودورة حياة الموظف</span></span><svg className="go" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8"></path></svg></a>
      <a className="it" href="https://corbit.sa/products/gov-gate" target="_blank" rel="noopener"><span className="ic"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4"></path></svg></span><span className="tx"><span className="nm">Gov Gate</span><span className="ds">بوابة مراسلات مؤسسية آمنة</span></span><svg className="go" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8"></path></svg></a>
      <a className="it" href="https://corbit.sa/products/schoolbit" target="_blank" rel="noopener"><span className="ic"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9l10-5 10 5-10 5zM6 11v5c3.5 2.5 8.5 2.5 12 0v-5"></path></svg></span><span className="tx"><span className="nm">SchoolBit</span><span className="ds">منصة إدارة المدرسة والتواصل</span></span><svg className="go" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"></path></svg></a>
    </nav>
    <div className="lab" style={sv("padding-top: 26px")}>الدخول إلى منصاتنا</div>
    <nav className="pl" aria-label="تسجيل الدخول إلى المنصات">
        <a href="https://sms.corbit.sa/login" target="_blank" rel="noopener">الرسائل النصية</a>
        <a href="/login">WhatsBit</a>
        <a href="https://schoolbit.corbit.sa/" target="_blank" rel="noopener">SchoolBit</a>
    </nav>
    <div className="lab" style={sv("padding-top: 26px")}>الصفحات</div>
    <nav className="pl" aria-label="صفحات الموقع">
        <a href="https://corbit.sa" target="_blank" rel="noopener">الرئيسية</a>
        <a href="https://corbit.sa/about-us" target="_blank" rel="noopener">من نحن</a>
        <a href="https://corbit.sa/blog" target="_blank" rel="noopener">المدونة</a>
        <a href="https://corbit.sa/contact" target="_blank" rel="noopener">تواصل معنا</a>
    </nav>
    <div className="df"><span>اتصال وواتساب: <a href="tel:920006900">920006900</a></span><span>البريد: <a href="mailto:info@corbit.sa">info@corbit.sa</a></span></div>
  </aside>


  <main className="stage" onScroll={vm.onScrub}>
  <div className="flowpin">

    
    <section className={`scene s-hero ${vm.c.s0}`} aria-hidden={vm.h.s0} aria-label="البداية">
      <div className="glowc" aria-hidden="true"></div>
      <div className="bigw" aria-hidden="true">WhatsBit</div>
      <canvas className="hcv" aria-hidden="true"></canvas>
      <div className="hwrap">
        <div className="htxt">
          <div className="kick in t1"><span className="dt"></span><span>منصة واتساب أعمال متكاملة</span><span className="ln"></span><span className="sub">من المدار</span></div>
          <h1 className="h1x" aria-label="رقم واتساب واحد، وفريقك كله يرد.">
            <span className="kl" aria-hidden="true"><span className="kw" style={sv("--i: 0")}><span>رقم</span></span> <span className="kw" style={sv("--i: 1")}><span>واتساب</span></span> <span className="kw" style={sv("--i: 2")}><span>واحد،</span></span></span>
            <span className="kl" aria-hidden="true"><span className="kw" style={sv("--i: 3")}><span className="gg">وفريقك</span></span> <span className="kw" style={sv("--i: 4")}><span className="gg">كله</span></span> <span className="swash"><span className="kw" style={sv("--i: 5")}><span className="gg">يرد.</span></span></span></span>
          </h1>
          <p className="lead in t3">نظّم محادثات عملائك، وأتمت ردودك، وأطلق حملاتك من منصة واحدة، عبر الواجهة الرسمية لواتساب للأعمال.</p>
          <div className="btnrow in t4">
            <button type="button" className="btn btn-primary" onClick={vm.goContact}>ابدأ الآن</button>
            <button type="button" className="btn btn-line" onClick={vm.goPricing}>شاهد الباقات</button>
          </div>
          <div className="pills in t5">
            <span className="pill"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4"></path></svg>الواجهة الرسمية من <span className="en">Meta</span></span>
            <span className="pill"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg>واجهة عربية من المتصفح</span>
            <span className="pill"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg><b className="en">+20,000</b>&nbsp;جهة تثق بالمدار</span>
          </div>
        </div>
        <div className="hvis">
          <div className="hst">
            <div className="orbit o1" style={sv("--c: #28A745")} aria-hidden="true"><i></i></div>
            <div className="orbit o2" style={sv("--c: #FF2D8F")} aria-hidden="true"><i></i></div>
            <div className="phone hphone" role="img" aria-label="جوال توضيحي: عميل يطلب من متجر عبر واتساب، فيصله رابط الدفع ثم تأكيد الطلب تلقائياً">
              <div className="scr">
                <span className="isl"></span>
                <div className="sbar" aria-hidden="true"><span>9:41</span><span className="ics"><span className="bars"><i></i><i></i><i></i><i></i></span><span className="bat"></span></span></div>
                <div className="chd" aria-hidden="true">
                  <svg className="bk" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
                  <span className="cav">ن</span>
                  <span className="cnm"><div><b>متجر النخبة <svg className="vb" width="15" height="15" viewBox="0 0 24 24"><path fill="#28A745" d="M12 1.8l2.6 1.9 3.2-.2.9 3.1 2.7 1.8-1 3 1 3-2.7 1.8-.9 3.1-3.2-.2L12 22.2l-2.6-1.9-3.2.2-.9-3.1-2.7-1.8 1-3-1-3 2.7-1.8.9-3.1 3.2.2z"></path><path d="M8.3 12.2l2.5 2.5 4.9-5" fill="none" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"></path></svg></b><small className={vm.hero.subCls}>{vm.hero.sub}</small></div></span>
                  <span className="acts"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h12v10H3zM15 10l6-3v10l-6-3"></path></svg><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg></span>
                </div>
                <div className={vm.hero.bdCls} aria-hidden="true">
                  <span className="cday">اليوم</span>
                  {(vm.hero.items || []).map((m: any, i: number) => (<Fragment key={i}><div className={m.cls}>{!!m.txt && (<>{m.t}{!!m.hasTm && (<><span className="tm">{m.tm}</span></>)}</>)}{!!m.typ && (<><i></i><i></i><i></i></>)}{!!m.pay && (<><div className="pc"><div className="pc-h"><span className="pc-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"></path></svg></span><span><b>فاتورة الطلب</b><small className="en">#4821</small></span></div><div className="pc-r"><span>الإجمالي</span><b><span className="en">245.00</span> ر.س</b></div><span className="cb-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path></svg>رابط الدفع</span></div></>)}{!!m.ord && (<><div className="oc"><div className="oc-h"><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></i>تم تأكيد طلبك</div><p>تم تأكيد طلبك رقم 4821، ويصلك خلال يومين عمل.</p><span className="cb-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"></path></svg>تتبّع الشحنة</span></div></>)}{!!m.book && (<><div className="oc"><div className="oc-h bk"><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></i>تم تأكيد موعدك</div><p>موعدك يوم الأحد الساعة 10:30 صباحاً، وسنرسل لك تذكيراً قبله.</p></div></>)}{!!m.menu && (<><div className="mc"><p>اختر ما تحتاجه:</p>{(m.mb || []).map((x: any, i: number) => (<Fragment key={i}><span className={x.cls}>{x.t}</span></Fragment>))}</div></>)}</div></Fragment>))}
                </div>
                <div className="cft" aria-hidden="true"><span className="inp">اكتب رسالة</span><span className="mic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3"></path></svg></span></div>
                <span className="homei"></span>
              </div>
            </div>
            <div className="fchip team" aria-hidden="true"><span className="avs"><span className="ph-photo"></span><span style={sv("background: #FF5B5B")}>ف</span><span style={sv("background: #0D284D")}>م</span></span><span>3 موظفين على نفس الرقم</span><span className="lv"></span></div>
            <div className="fchip auto" aria-hidden="true"><span className="bolt"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"></path></svg></span><span>رد تلقائي خلال 3 ثوانٍ</span></div>
          </div>
          <div className="hleg inf t6" aria-hidden="true"><span className="t">LIVE · DEMO</span><span><i></i>بث لعملاء وافقوا على الاستلام</span><span><i className="p"></i>محادثة توضيحية</span></div>
        </div>
      </div>
    </section>

    
    <section className={`scene s-ch ${vm.chSc} ${vm.c.s1}`} aria-hidden={vm.h.s1} aria-label="التحدي">
      <div className="glowc" aria-hidden="true"></div>
      <div className="chaos" aria-hidden="true">
        {(vm.chaos || []).map((b: any, i: number) => (<Fragment key={i}><span className="cbb" style={sv(b.st)}><span><i></i><i></i>{!!b.hasN && (<><b>{b.n}</b></>)}</span></span></Fragment>))}
      </div>
      <div className="full">
        <div className="chhead">
          <div>
            <div className="kick in t1"><span className="dt"></span><span>التحدي</span><span className="ln"></span></div>
            <h2 className="h2x"><span className="ml d1"><span>واتساب قناة عملائك الأولى..</span></span><span className="ml d2"><span className="muted">ويستحق أن يُدار كقناة أعمال.</span></span></h2>
          </div>
          <div className="seg in t3" role="tablist" aria-label="المقارنة" style={sv("align-self: flex-end")}>
            {(vm.chTabs || []).map((t: any, i: number) => (<Fragment key={i}><button type="button" role="tab" className={t.cls} aria-selected={t.sel} onClick={t.pick}>{t.name}</button></Fragment>))}
          </div>
        </div>
        <div className={`ch4 in t3 ${vm.chCls}`}>
          <div className="chc glass"><span className="cn">01</span>
            <div className="face fp" aria-hidden={vm.chA.hp}><span className="ico"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2"></path></svg></span><b>رقم على جوال واحد</b><p>الفريق لا يرى المحادثات ولا يستطيع العمل عليها معاً.</p></div>
            <div className="face fs" aria-hidden={vm.chA.hs}><span className="ico"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.7-3.4 3.3-5.5 6.5-5.5s5.8 2.1 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.8c2 .7 3.2 2.5 3.5 5.2"></path></svg></span><b>رقم واحد لفريقك كله</b><p>صندوق وارد مشترك يعمل عليه الجميع من المتصفح.</p></div>
          </div>
          <div className="chc glass"><span className="cn">02</span>
            <div className="face fp" aria-hidden={vm.chA.hp}><span className="ico"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2"></path></svg></span><b>رسائل بلا رد</b><p>محادثات تضيع بين الموظفين، وعملاء ينتظرون خارج أوقات الدوام.</p></div>
            <div className="face fs" aria-hidden={vm.chA.hs}><span className="ico"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 8h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM12 4v4M9.5 13h.01M14.5 13h.01"></path></svg></span><b>رد على مدار الساعة</b><p>ردود تلقائية وبوت ذكي يرد فوراً ويحوّل للموظف عند الحاجة.</p></div>
          </div>
          <div className="chc glass"><span className="cn">03</span>
            <div className="face fp" aria-hidden={vm.chA.hp}><span className="ico"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1zM16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"></path></svg></span><b>إرسال جماعي بلا ضوابط</b><p>رسائل عشوائية تعرّض الرقم للبلاغات والحظر.</p></div>
            <div className="face fs" aria-hidden={vm.chA.hs}><span className="ico"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4"></path></svg></span><b>بث آمن بقوالب معتمدة</b><p>حملات لعملاء وافقوا على الاستلام، تحمي جودة رقمك.</p></div>
          </div>
          <div className="chc glass"><span className="cn">04</span>
            <div className="face fp" aria-hidden={vm.chA.hp}><span className="ico"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"></path></svg></span><b>لا شيء يُقاس</b><p>لا تقارير لسرعة الرد، ولا لأداء الفريق، ولا لنتائج الحملات.</p></div>
            <div className="face fs" aria-hidden={vm.chA.hs}><span className="ico"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16M7 16v-4M12 16V8M17 16v-6"></path></svg></span><b>كل شيء واضح بالأرقام</b><p>تقارير لسرعة الرد وأداء الفريق ونتائج كل حملة.</p></div>
          </div>
        </div>
        <p className="chline in t4">منصة واحدة تحوّل رقم الواتساب إلى قناة أعمال منظّمة، مؤتمتة، وقابلة للقياس.</p>
      </div>
    </section>

    
    <section className={`scene s-ib ${vm.c.s2}`} aria-hidden={vm.h.s2} aria-label="صندوق الوارد المشترك">
      <div className="glowc" aria-hidden="true"></div>
      <div className="wrapx">
        <div className="colV">
          <div className="ibv fit inf u1" style={sv("--fw: 660px")}>
            <div className="polar" role="img" aria-label="فريق خدمة عملاء يتابع المحادثات على الشاشة"><span><i></i>فريقك على رقم واحد</span></div>
            <div className="lane" aria-hidden="true">
              <span className="fly" style={sv("top: 0; animation-delay: 0s")}><i style={sv("background: #28A745")}></i><u></u></span>
              <span className="fly" style={sv("top: 56px; animation-delay: .7s")}><i style={sv("background: #FF5B5B")}></i><u></u></span>
              <span className="fly" style={sv("top: 112px; animation-delay: 1.4s")}><i style={sv("background: #FF8A1C")}></i><u></u></span>
              <span className="fly" style={sv("top: 168px; animation-delay: 2.1s")}><i style={sv("background: #0D284D")}></i><u></u></span>
              <span className="fly" style={sv("top: 224px; animation-delay: 2.8s")}><i style={sv("background: #FF2D8F")}></i><u></u></span>
            </div>
            <div className="app glass">
              <div className="abar"><b><img src="/landing/whatsbit-mark.png" alt="" />صندوق الوارد</b><span className="online"><i></i>3 موظفين متصلين · بيانات توضيحية</span></div>
              <div className="tstrip" role="list" aria-label="الفريق">
                {(vm.ib.agents || []).map((a: any, i: number) => (<Fragment key={i}><div className={a.cls} role="listitem" aria-label={a.aria}><span className="aa" style={sv(a.st)}>{a.ini}</span><span className="at"><b>{a.n}</b><small>{a.d}</small></span><span className="ac">{a.c}</span></div></Fragment>))}
              </div>
              <div className="abody">
                <div className="list" role="list" aria-label="المحادثات">
                  {(vm.ib.cvs || []).map((v: any, i: number) => (<Fragment key={i}>
                    <div className={v.wcls}><div>
                      <button type="button" role="listitem" className={v.cls} aria-pressed={v.cur} tabIndex={v.ti} onClick={v.pick}>
                        <span className="av" style={sv(v.av)}>{v.ini}</span>
                        <span className="cx"><span className="cnn">{v.n}</span><span className="cll">{v.last}</span></span>
                        <span className="cm"><span className="ct">{v.tm}</span>{!!v.hasUn && (<><span className="un">{v.un}</span></>)}<span className="dp" style={sv(v.dst)}>{v.dept}</span></span>
                      </button>
                    </div></div>
                  </Fragment>))}
                </div>
                <div className="thread">
                  <div className="th"><b>{vm.ib.thName}</b><span className="asg">{vm.ib.thAsg}</span></div>
                  <div className="tb" aria-live="polite">
                    {(vm.ib.msgs || []).map((m: any, i: number) => (<Fragment key={i}><div className={m.cls}>{m.t}<span className="tm">{m.tm}</span></div></Fragment>))}
                    {!!vm.ib.moved && (<><span className="m sys on">{vm.ib.moveNote}</span></>)}
                  </div>
                  <div className="tf"><span>تحويل إلى:</span>
                    {(vm.ib.depts || []).map((d: any, i: number) => (<Fragment key={i}><button type="button" className={d.cls} aria-pressed={d.pr} onClick={d.pick}>{d.name}</button></Fragment>))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="colT">
          <div className="kick in t1"><span className="dt"></span><span>صندوق وارد مشترك</span><span className="ln"></span></div>
          <h2 className="h2x"><span className="ml d1"><span>رقم واحد..</span></span><span className="ml d2"><span className="muted">وفريق كامل يعمل عليه.</span></span></h2>
          <p className="lead in t3">كل محادثات رقمك في صندوق واحد، توزَّع على فريقك حسب القسم أو المسؤول، ولا تضيع رسالة بين الموظفين.</p>
          <ul className="pts in t4">
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h10M4 12h7M4 17h10M16 9l4 3-4 3"></path></svg></span><span>توزيع المحادثات حسب القسم أو المسؤول</span></li>
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2"></path></svg></span><span>ردود سريعة، وجدولة للرسائل، وفلترة وبحث</span></li>
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"></path></svg></span><span>صلاحيات لكل مستخدم، وتقارير لأداء الفريق</span></li>
          </ul>
          <p className="note in t5"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11V5a2 2 0 0 1 4 0v5l4.5 1a2 2 0 0 1 1.5 2.2L18 20H9.5L6 15.5a1.7 1.7 0 0 1 2.6-2.2L9 14"></path></svg>جرّب: اختر محادثة، ثم حوّلها إلى قسم آخر.</p>
        </div>
      </div>
    </section>

    
    <section className={`scene s-bot ${vm.c.s3}`} aria-hidden={vm.h.s3} aria-label="الشات بوت">
      <div className="glowc" aria-hidden="true"></div>
      <div className="wrapx">
        <div className="colT s-bt" style={sv("flex-basis: 470px")}>
          <div className="kick in t1"><span className="dt"></span><span>الشات بوت</span><span className="ln"></span><span className="sub">ردود تلقائية</span></div>
          <h2 className="h2x"><span className="ml d1"><span>بوت يرد فوراً..</span></span><span className="ml d2"><span className="muted">ويحوّل لموظفك عند الحاجة.</span></span></h2>
          <p className="lead in t3">ردود تلقائية وبوت ذكي يرد على عملائك فوراً، ويحوّل المحادثة للموظف عند الحاجة. ويُعدّ فريقنا معك القوالب والردود والبوت، ويدرّب فريقك.</p>
          <ul className="pts in t4">
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 8h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM12 4v4M9.5 13h.01M14.5 13h.01"></path></svg></span><span>شات بوت ذكي بدءاً من باقة البداية</span></li>
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h10M4 17h7"></path></svg></span><span>ردود تلقائية بقواعد ثابتة في الباقة الأساسية</span></li>
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1.2 12H6.2zM9 8V6a3 3 0 0 1 6 0v2"></path></svg></span><span>تكامل مع سلة وزد و<span className="en">Shopify</span></span></li>
          </ul>
          <p className="note in t5"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11V5a2 2 0 0 1 4 0v5l4.5 1a2 2 0 0 1 1.5 2.2L18 20H9.5L6 15.5a1.7 1.7 0 0 1 2.6-2.2L9 14"></path></svg>جرّب: فعّل خطوات المسار أو أوقفها، وشاهد المحادثة تتغيّر.</p>
        </div>
        <div className="colV">
          <div className="bld glass fit inf u1" style={sv("--fw: 700px")}>
            <div className="bbar"><b><span className="dots" aria-hidden="true"><i></i><i></i><i></i></span>مسار المحادثة <span className="demo"><i></i>توضيحي</span></b><button type="button" className="rply" onClick={vm.bot.replay}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4"></path></svg>شغّل من جديد</button></div>
            <div className="bbd">
              <div className="flow" role="group" aria-label="خطوات مسار البوت">
                <div className={vm.bot.n0}><span className="nic"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM8.5 11h7M8.5 14.5h4"></path></svg></span><span className="ntx"><b>الترحيب</b><small>رد فوري على أول رسالة</small></span><span className="fx">دائماً</span></div>
                <span className={vm.bot.w0} aria-hidden="true"></span>
                <div className={vm.bot.n1}><span className="nic"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"></path></svg></span><span className="ntx"><b>قائمة الأزرار</b><small>خيارات يضغطها العميل بلمسة</small></span><button type="button" className={vm.bot.s1} role="switch" aria-checked={vm.bot.a1} aria-label="قائمة الأزرار" onClick={vm.bot.t1}></button></div>
                <span className={vm.bot.w1} aria-hidden="true"></span>
                <div className={vm.bot.n2}><span className="nic"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1.2 12H6.2zM9 8V6a3 3 0 0 1 6 0v2"></path></svg></span><span className="ntx"><b>الطلب أو الحجز</b><small>ما يتولاه البوت عن فريقك</small><span className="nch" role="radiogroup" aria-label="الطلب أو الحجز"><button type="button" role="radio" className={vm.bot.k0} aria-checked={vm.bot.ka0} onClick={vm.bot.pk0}>طلب جديد</button><button type="button" role="radio" className={vm.bot.k1} aria-checked={vm.bot.ka1} onClick={vm.bot.pk1}>حجز موعد</button></span></span></div>
                <span className={vm.bot.w2} aria-hidden="true"></span>
                <div className={vm.bot.n3}><span className="nic"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2zM18 19c0 1.4-1.8 2.5-5 2.5"></path></svg></span><span className="ntx"><b>التحويل لموظف</b><small>مع ملخص المحادثة</small></span><button type="button" className={vm.bot.s3} role="switch" aria-checked={vm.bot.a3} aria-label="التحويل لموظف" onClick={vm.bot.t3}></button></div>
              </div>
              <div className="pv">
                <div className="phone" role="img" aria-label="معاينة توضيحية لمحادثة البوت حسب الخطوات المفعّلة">
                  <div className="scr">
                    <span className="isl"></span>
                    <div className="sbar" aria-hidden="true"><span>9:41</span><span className="ics"><span className="bars"><i></i><i></i><i></i><i></i></span><span className="bat"></span></span></div>
                    <div className="chd" aria-hidden="true">
                      <svg className="bk" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
                      <span className="cav">ن</span>
                      <span className="cnm"><div><b>متجر النخبة <svg className="vb" width="15" height="15" viewBox="0 0 24 24"><path fill="#28A745" d="M12 1.8l2.6 1.9 3.2-.2.9 3.1 2.7 1.8-1 3 1 3-2.7 1.8-.9 3.1-3.2-.2L12 22.2l-2.6-1.9-3.2.2-.9-3.1-2.7-1.8 1-3-1-3 2.7-1.8.9-3.1 3.2.2z"></path><path d="M8.3 12.2l2.5 2.5 4.9-5" fill="none" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"></path></svg></b><small className={vm.bot.subCls}>{vm.bot.sub}</small></div></span>
                    </div>
                    <div className="cbd" aria-hidden="true">
                      <span className="cday">اليوم</span>
                      {(vm.bot.items || []).map((m: any, i: number) => (<Fragment key={i}><div className={m.cls}>{!!m.txt && (<>{m.t}{!!m.hasTm && (<><span className="tm">{m.tm}</span></>)}</>)}{!!m.typ && (<><i></i><i></i><i></i></>)}{!!m.pay && (<><div className="pc"><div className="pc-h"><span className="pc-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"></path></svg></span><span><b>فاتورة الطلب</b><small className="en">#4821</small></span></div><div className="pc-r"><span>الإجمالي</span><b><span className="en">245.00</span> ر.س</b></div><span className="cb-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path></svg>رابط الدفع</span></div></>)}{!!m.ord && (<><div className="oc"><div className="oc-h"><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></i>تم تأكيد طلبك</div><p>تم تأكيد طلبك رقم 4821، ويصلك خلال يومين عمل.</p><span className="cb-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"></path></svg>تتبّع الشحنة</span></div></>)}{!!m.book && (<><div className="oc"><div className="oc-h bk"><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></i>تم تأكيد موعدك</div><p>موعدك يوم الأحد الساعة 10:30 صباحاً، وسنرسل لك تذكيراً قبله.</p></div></>)}{!!m.menu && (<><div className="mc"><p>اختر ما تحتاجه:</p>{(m.mb || []).map((x: any, i: number) => (<Fragment key={i}><span className={x.cls}>{x.t}</span></Fragment>))}</div></>)}</div></Fragment>))}
                    </div>
                    <div className="cft" aria-hidden="true"><span className="inp">اكتب رسالة</span><span className="mic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3"></path></svg></span></div>
                    <span className="homei"></span>
                  </div>
                </div>
                <small>معاينة حيّة للمسار</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    
    <section className={`scene s-ai ${vm.c.s4}`} aria-hidden={vm.h.s4} aria-label="الذكاء الاصطناعي">
      <div className="glowc" aria-hidden="true"></div>
      <div className="wrapx">
        <div className="colV">
          <div className={vm.ai.vcls} style={sv("--fw: 600px")}>
            <div className="orb" aria-hidden="true"></div>
            <div className="orr a" style={sv("--c: #FF2D8F")} aria-hidden="true"><i></i></div>
            <div className="orr b" style={sv("--c: #28A745")} aria-hidden="true"><i></i></div>
            <div className="aic glass" role="group" aria-label="تجربة توضيحية: الوكيل الذكي يفهم سؤال العميل ثم يرد">
              <div className="aihd"><b><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF2D8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"></path></svg>الوكيل الذكي <span className="aitag">AI</span></b><span className="demo"><i></i>توضيحي</span></div>
              <div className="qcs" role="radiogroup" aria-label="اختر سؤال العميل"><small>اختر سؤال العميل:</small>{(vm.ai.chips || []).map((q: any, i: number) => (<Fragment key={i}><button type="button" role="radio" className={q.cls} aria-checked={q.on} onClick={q.pick}>{q.t}</button></Fragment>))}</div>
              {(vm.ai.qs || []).map((q: any, i: number) => (<Fragment key={i}>{!!q.on && (<><div className={q.cls}><span className="who">العميل</span>{(q.toks || []).map((w: any, i: number) => (<Fragment key={i}><span className={w.cls} style={sv(w.st)}>{w.t}</span></Fragment>))}</div></>)}</Fragment>))}
              <div className="pipe" style={sv(vm.ai.pst)}>{(vm.ai.stg || []).map((g: any, i: number) => (<Fragment key={i}><div className={g.cls}><i>{g.n}</i><span>{g.t}</span></div></Fragment>))}</div>
              <div className={vm.ai.icls}><div className="ik"><small>النية المفهومة</small><b>{vm.ai.intent}</b></div><div><small>الإجراء</small><b>{vm.ai.act}</b></div></div>
              <div className="ans" aria-live="polite">
                {!!vm.ai.typing && (<><span className="m typ on" aria-label="يكتب الآن"><i></i><i></i><i></i></span></>)}
                {!!vm.ai.reply && (<><div className="m b bz on"><span className="lb"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"></path></svg>رد الوكيل الذكي</span>{vm.ai.a}</div></>)}
                {!!vm.ai.sys && (<><span className="m sys on">{vm.ai.sysT}</span></>)}
              </div>
            </div>
          </div>
        </div>
        <div className="colT">
          <div className="kick in t1"><span className="dt"></span><span>ذكاء اصطناعي مضمّن</span><span className="ln"></span></div>
          <h2 className="h2x"><span className="ml d1"><span>ذكاء يفهم عميلك..</span></span><span className="ml d2"><span className="muted">ويرد عنك على مدار الساعة.</span></span></h2>
          <p className="lead in t3">ذكاء اصطناعي مدمج في المنصة، لا إضافة منفصلة. يفهم سؤال عميلك ويرد عليه بمعلومات شركتك، ويعرف متى يحوّل المحادثة إلى موظف.</p>
          <ul className="pts in t4">
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM8.5 11h7M8.5 14.5h4"></path></svg></span><span>يفهم سؤال العميل بأسلوبه، ويرد فوراً بلغة طبيعية</span></li>
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"></path></svg></span><span>يُدرَّب على بيانات شركتك، فيرد بمعلوماتك أنت</span></li>
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h10M4 12h7M4 17h10M16 9l4 3-4 3"></path></svg></span><span>يحوّل المحادثة للموظف المناسب مع ملخص جاهز</span></li>
          </ul>
          <p className="note in t5" style={sv("color: #6B7280")}>مضمّن في الباقات بدءاً من باقة الأعمال، مع نماذج لغوية متعددة للمؤسسات.</p>
        </div>
      </div>
    </section>

    
    <section className={`scene s-uc ${vm.c.s5}`} aria-hidden={vm.h.s5} aria-label="الاستخدامات">
      <div className="glowc" aria-hidden="true"></div>
      <div className="wrapx">
        <div className="colT">
          <div className="kick in t1"><span className="dt"></span><span>الاستخدامات</span><span className="ln"></span><span className="sub">قناة واحدة لكل رحلة العميل</span></div>
          <div className="seg seg4 in t2" role="tablist" aria-label="الاستخدام">
            {(vm.uses || []).map((u: any, i: number) => (<Fragment key={i}><button type="button" role="tab" className={u.cls} aria-selected={u.sel} onClick={u.pick}>{u.name}</button></Fragment>))}
          </div>
          <div className={vm.ucBar} aria-hidden="true"><i></i></div>
          <div className="ucbody in t3">
            {(vm.uses || []).map((u: any, i: number) => (<Fragment key={i}>{!!u.on && (<>
              <h2 className="h2x cin">{u.title}</h2>
              <p className="lead cin2">{u.desc}</p>
              <div className="fee glass cin2"><span className="fk">رسوم <span className="en">Meta</span> · {u.cat}</span><b>{u.fee}</b><span className="fn">تُحتسب منفصلة عن اشتراك المنصة، وبالريال السعودي.</span></div>
            </>)}</Fragment>))}
          </div>
        </div>
        <div className="colV">
          <div className="ucv fit inf u1" style={sv("--fw: 640px")}>
            <div className="ucp">
              {(vm.uses || []).map((u: any, i: number) => (<Fragment key={i}><div className={u.pcls} role="img" aria-label={u.alt} aria-hidden={u.ph}></div></Fragment>))}
              <span className={vm.ucEdge} aria-hidden="true"></span>
            </div>
            {(vm.uses || []).map((u: any, i: number) => (<Fragment key={i}>{!!u.on && (<>
              <div className="ubadge cin" aria-hidden="true"><i><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></i>قالب معتمد · {u.cat}</div>
              <div className="uct glass cin2">
                <div className="uh"><span className="cav">ن</span><b>متجر النخبة <svg className="vb" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="#28A745" d="M12 1.8l2.6 1.9 3.2-.2.9 3.1 2.7 1.8-1 3 1 3-2.7 1.8-.9 3.1-3.2-.2L12 22.2l-2.6-1.9-3.2.2-.9-3.1-2.7-1.8 1-3-1-3 2.7-1.8.9-3.1 3.2.2z"></path><path d="M8.3 12.2l2.5 2.5 4.9-5" fill="none" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"></path></svg></b></div>
                <div className="ub">
                  {(u.bubs || []).map((b: any, i: number) => (<Fragment key={i}><div className={b.cls}>{b.t}<span className="tm">{b.tm}</span></div></Fragment>))}
                  {(u.btns || []).map((x: any, i: number) => (<Fragment key={i}><span className="tbtn">{x}</span></Fragment>))}
                </div>
                <div className="ucap"><span>{u.cat}</span><span>محادثة توضيحية</span></div>
              </div>
            </>)}</Fragment>))}
          </div>
        </div>
      </div>
    </section>

    
    <section className={`scene s-vf ${vm.c.s6}`} aria-hidden={vm.h.s6} aria-label="التوثيق">
      <div className="glowc" aria-hidden="true"></div>
      <div className="wrapx">
        <div className="colV">
          <div className={vm.vf.vcls} style={sv("--fw: 640px")}>
            <div className="vrings" aria-hidden="true"></div>
            <div className="vtl" style={sv(vm.vf.pst)} role="list" aria-label="خطوات التوثيق">
              <span className="vfill" aria-hidden="true"></span>
              {(vm.vf.steps || []).map((s: any, i: number) => (<Fragment key={i}><div className={s.cls} role="listitem"><span className="vdot"><span>{s.n}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></span><span className="vx"><b>{s.t}</b><small>{s.d}</small></span></div></Fragment>))}
            </div>
            <div className="vph">
              <div className={vm.vf.phCls} role="img" aria-label={vm.vf.aria}>
                <div className="scr">
                  <span className="isl"></span>
                  <div className="sbar" aria-hidden="true"><span>9:41</span><span className="ics"><span className="bars"><i></i><i></i><i></i><i></i></span><span className="bat"></span></span></div>
                  <div className="chd" aria-hidden="true">
                    <svg className="bk" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
                    <span className="cav">ن</span>
                    <span className="cnm">
                      <div className="v0"><b className="en">+966 55 012 3456</b><small>~ متجر النخبة</small></div>
                      <div className="v1"><b>متجر النخبة <svg className="vb" width="15" height="15" viewBox="0 0 24 24"><path fill="#28A745" d="M12 1.8l2.6 1.9 3.2-.2.9 3.1 2.7 1.8-1 3 1 3-2.7 1.8-.9 3.1-3.2-.2L12 22.2l-2.6-1.9-3.2.2-.9-3.1-2.7-1.8 1-3-1-3 2.7-1.8.9-3.1 3.2.2z"></path><path d="M8.3 12.2l2.5 2.5 4.9-5" fill="none" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"></path></svg></b><small>حساب أعمال موثّق</small></div>
                    </span>
                  </div>
                  <div className="cbd" aria-hidden="true">
                    <span className="cday" style={sv("margin-bottom: 0")}>اليوم</span>
                    <span className="warn">هذا الرقم ليس ضمن جهات اتصالك. هل تريد الإبلاغ عنه أو حظره؟</span>
                    <div className="m card on"><div className="oc"><div className="oc-h"><i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></i>قالب معتمد</div><p>تم تأكيد طلبك رقم 4821، ويصلك خلال يومين عمل.</p><span className="cb-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"></path></svg>تتبّع الشحنة</span></div></div>
                  </div>
                  <div className="cft" aria-hidden="true"><span className="inp">اكتب رسالة</span><span className="mic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3"></path></svg></span></div>
                  <span className="homei"></span>
                </div>
              </div>
              <svg className="vstamp" viewBox="0 0 24 24" aria-hidden="true"><path fill="#28A745" d="M12 1.8l2.6 1.9 3.2-.2.9 3.1 2.7 1.8-1 3 1 3-2.7 1.8-.9 3.1-3.2-.2L12 22.2l-2.6-1.9-3.2.2-.9-3.1-2.7-1.8 1-3-1-3 2.7-1.8.9-3.1 3.2.2z"></path><path d="M8.3 12.2l2.5 2.5 4.9-5" fill="none" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </div>
          </div>
        </div>
        <div className="colT">
          <div className="kick in t1"><span className="dt"></span><span>التوثيق والشارة</span><span className="ln"></span></div>
          <h2 className="h2x"><span className="ml d1"><span>اسم منشأتك يظهر..</span></span><span className="ml d2"><span className="muted">وعميلك يعرف من يراسله.</span></span></h2>
          <div className="seg in t3" role="tablist" aria-label="حالة الحساب">
            {(vm.vf.tabs || []).map((t: any, i: number) => (<Fragment key={i}><button type="button" role="tab" className={t.cls} aria-selected={t.sel} onClick={t.pick}>{t.name}</button></Fragment>))}
          </div>
          <div className={vm.vf.lcls}>
            <div className="vrow"><span className="st"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></span><span>يظهر اسم منشأتك وشارة التوثيق لعملائك</span></div>
            <div className="vrow"><span className="st"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></span><span>ثقة أعلى تقلل تجاهل رسائلك والإبلاغ عنها</span></div>
            <div className="vrow"><span className="st"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></span><span>نرافقك في توثيق حسابك لدى <span className="en">&nbsp;Meta&nbsp;</span> وطلب الشارة</span></div>
          </div>
          <div className="in t5" style={sv("display: flex; flex-wrap: wrap; align-items: center; gap: 6px 18px")}>
            <button type="button" className="lnk" onClick={vm.vf.replay}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4"></path></svg>شاهد خطوات التوثيق</button>
            <span style={sv("font-size: 12.5px; color: #6B7280")}>منح الشارة يخضع لمعايير <span className="en">Meta</span>.</span>
            <span className="demo"><i></i>المحادثة توضيحية</span>
          </div>
        </div>
      </div>
    </section>

    
    <section className={`scene s-lm ${vm.c.s7}`} aria-hidden={vm.h.s7} aria-label="حدود الإرسال">
      <div className="glowc" aria-hidden="true"></div>
      <div className="wrapx">
        <div className="colT">
          <div className="kick in t1"><span className="dt"></span><span>جودة الحساب وحدود الإرسال</span><span className="ln"></span></div>
          <h2 className="h2x"><span className="ml d1"><span>حدود إرسال أعلى..</span></span><span className="ml d2"><span className="muted">كلما ارتفعت جودتك.</span></span></h2>
          <ul className="pts in t3">
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3"></path></svg></span><span>قوالب واضحة بتصنيف صحيح ترفع تقييم الجودة</span></li>
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg></span><span>موافقة صريحة من العميل، واحترام فوري لطلب الإلغاء</span></li>
            <li><span className="pi"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"></path></svg></span><span>متابعة جودة الحساب ودعم متخصص قبل أي حملة كبيرة</span></li>
          </ul>
          <p className="note in t4"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11V5a2 2 0 0 1 4 0v5l4.5 1a2 2 0 0 1 1.5 2.2L18 20H9.5L6 15.5a1.7 1.7 0 0 1 2.6-2.2L9 14"></path></svg>اضغط أي درجة لعرض حدّ مستواها.</p>
        </div>
        <div className="colV">
          <div className="lmv glass fit inf u1" style={sv("--fw: 600px")}>
            <div className="lmh">
              <div><span className="lbl">الحد اليومي لمحادثات العملاء الجدد</span><span className="lroll" aria-live="polite" aria-label={vm.lm.aria}><span style={sv(vm.lm.rst)} aria-hidden="true">{(vm.lm.vals || []).map((v: any, i: number) => (<Fragment key={i}><b className={v.cls}>{v.v}</b></Fragment>))}</span></span><span className="lbl">{vm.lm.name}</span></div>
              <span className="qpill"><i></i>جودة الحساب: عالية</span>
            </div>
            <div className="stair" role="group" aria-label="مستويات حدود الإرسال">
              {(vm.lm.levels || []).map((l: any, i: number) => (<Fragment key={i}><button type="button" className={l.cls} style={sv(l.st)} aria-pressed={l.pr} aria-label={l.aria} onClick={l.pick}><span className="sv">{l.v}</span></button></Fragment>))}
              <span className="smk" style={sv(vm.lm.mk)} aria-hidden="true"><span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM8.5 11h7M8.5 14.5h4"></path></svg></span></span>
            </div>
            <div className="slbl" aria-hidden="true">{(vm.lm.levels || []).map((l: any, i: number) => (<Fragment key={i}><span>{l.l}</span></Fragment>))}</div>
            <div className="lnote2"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2"></path></svg><span>خلال 24 ساعة، وفق مستويات <span className="en">Meta</span> لعام 2026</span><span className="demo"><i></i>الجودة توضيحية</span></div>
          </div>
        </div>
      </div>
    </section>

    
    <section className={`scene s-why ${vm.c.s8}`} aria-hidden={vm.h.s8} aria-label="لماذا WhatsBit">
      <div className="glowc" aria-hidden="true"></div>
      <div className="full">
        <div style={sv("display: flex; flex-direction: column; gap: 14px")}>
          <div className="kick in t1"><span className="dt"></span><span>لماذا <span className="en">WhatsBit</span></span><span className="ln"></span></div>
          <h2 className="h2x"><span className="ml d1"><span>ثلاثة أسس.. <span className="muted">تجعلها الخيار الأذكى للسوق السعودي.</span></span></span></h2>
        </div>
        <div className="why3">
          <div className="why glass in t3">
            <div className="wtop"><span className="wic"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"></path></svg></span><span className="wn">01</span></div>
            <b>محلية حقيقية</b>
            <p>متوافقة مع متطلبات هيئة الزكاة ونظام حماية البيانات الشخصية، بفوترة بالريال السعودي وفريق دعم محلي.</p>
            <div className="wtags"><span>هيئة الزكاة</span><span>حماية البيانات</span><span>دعم محلي</span></div>
          </div>
          <div className="why glass in t4">
            <div className="wtop"><span className="wic"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 8h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM12 4v4M9.5 13h.01M14.5 13h.01"></path></svg></span><span className="wn">02</span></div>
            <b>ذكاء اصطناعي مضمّن</b>
            <p>وكيل ذكاء اصطناعي كامل ضمن الباقات بدءاً من باقة الأعمال، دون إضافة مدفوعة منفصلة.</p>
            <div className="wtags"><span>بوت ذكي</span><span>وكيل ذكي</span><span>نماذج متعددة</span></div>
          </div>
          <div className="why glass in t5">
            <div className="wtop"><span className="wic"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4"></path></svg></span><span className="wn">03</span></div>
            <b>مرونة تامة</b>
            <p>ادفع لما تحتاجه فقط: حزم رسائل ومستخدمون إضافيون عند الحاجة، دون ترقية كاملة.</p>
            <div className="wtags"><span>حزم رسائل</span><span>مستخدمون إضافيون</span><span>خصم سنوي</span></div>
          </div>
        </div>
        <div className="wstats in t5">
          <div className="wsl"><b>من المدار | كوربت</b><span>شركة سعودية للحلول التقنية الذكية، تخدم القطاعين الحكومي والخاص.</span></div>
          <div className="wsn"><span className="odo" role="img" aria-label="+20,000">{(vm.ws.a || []).map((d: any, i: number) => (<Fragment key={i}>{!!d.dg && (<><span className="od" aria-hidden="true"><span className={d.cls}><b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b></span></span></>)}{!!d.sp && (<><span className="sg" aria-hidden="true">{d.ch}</span></>)}</Fragment>))}</span><span>عميل</span></div>
          <div className="wsn"><span className="odo" role="img" aria-label="+10">{(vm.ws.b || []).map((d: any, i: number) => (<Fragment key={i}>{!!d.dg && (<><span className="od" aria-hidden="true"><span className={d.cls}><b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b></span></span></>)}{!!d.sp && (<><span className="sg" aria-hidden="true">{d.ch}</span></>)}</Fragment>))}</span><span>مليار رسالة مرسلة</span></div>
          <div className="wsn"><span className="odo" role="img" aria-label="98%">{(vm.ws.c || []).map((d: any, i: number) => (<Fragment key={i}>{!!d.dg && (<><span className="od" aria-hidden="true"><span className={d.cls}><b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b></span></span></>)}{!!d.sp && (<><span className="sg" aria-hidden="true">{d.ch}</span></>)}</Fragment>))}</span><span>نسبة رضا العملاء</span></div>
        </div>
        <p className="wvals in t5"><span>اتصال</span><i></i><span>سرعة</span><i></i><span>ذكاء</span><i></i><span>تكامل</span><i></i><span>نمو</span></p>
      </div>
    </section>

    
    <section className={`scene s-pr ${vm.c.s9}`} aria-hidden={vm.h.s9} aria-label="الباقات">
      <div className="glowc" aria-hidden="true"></div>
      <div className="full">
        <div className="phead">
          <div>
            <div className="kick in t1"><span className="dt"></span><span>الباقات</span><span className="ln"></span></div>
            <h2 className="h2x"><span className="ml d1"><span>أربع باقات.. <span className="muted">لكل مرحلة من نموك.</span></span></span></h2>
          </div>
          <div className="seg in t3" role="tablist" aria-label="مدة الاشتراك">
            {(vm.periods || []).map((t: any, i: number) => (<Fragment key={i}><button type="button" role="tab" className={t.cls} aria-selected={t.sel} onClick={t.pick}>{t.name}{!!t.hasOff && (<><span className="off">-20%</span></>)}</button></Fragment>))}
          </div>
        </div>
        <div className="pk4 in t3" onScroll={vm.pkScroll}>
          {(vm.pkgs || []).map((p: any, i: number) => (<Fragment key={i}>
            <div className={p.cls}>
              {!!p.hot && (<><span className="shn" aria-hidden="true"><i></i></span><span className="hb">الأكثر طلباً</span></>)}
              <div className="pkn"><b>{p.n}</b><span>{p.en}</span></div>
              <p className="pka">{p.aud}</p>
              <div className="pkp"><span className="odo" role="img" aria-label={p.price}>{(p.dg || []).map((d: any, i: number) => (<Fragment key={i}>{!!d.dg && (<><span className="od" aria-hidden="true"><span className={d.cls}><b>0</b><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b></span></span></>)}{!!d.sp && (<><span className="sg" aria-hidden="true">{d.ch}</span></>)}</Fragment>))}</span><span>ر.س / شهرياً</span></div>
              <div className="pks">{p.sub}</div>
              <ul>
                {(p.feats || []).map((f: any, i: number) => (<Fragment key={i}><li><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"></path></svg>{f}</li></Fragment>))}
              </ul>
              <button type="button" className={p.btn} onClick={p.go}>{p.cta}</button>
            </div>
          </Fragment>))}
        </div>
        <div className="pkdots in t4" role="group" aria-label="التنقل بين الباقات">{(vm.pkDots || []).map((d: any, i: number) => (<Fragment key={i}><button type="button" className={d.cls} aria-label={d.label} aria-current={d.cur} onClick={d.go}></button></Fragment>))}<span className="pkhint">اسحب للمقارنة</span></div>
        <p className="pnote in t4">الأسعار قبل ضريبة القيمة المضافة 15% · رسوم توثيق وإعداد لمرة واحدة · رسوم <span className="en">Meta</span> للرسائل تُحتسب منفصلة</p>
      </div>
    </section>

    
    <section className={`scene s-fq ${vm.c.s10}`} aria-hidden={vm.h.s10} aria-label="الأسئلة الشائعة">
      <div className="glowc" aria-hidden="true"></div>
      <div className="full">
        <div className="faqg">
          <div className="in t1">
            <div className="kick"><span className="dt"></span><span>الأسئلة الشائعة</span><span className="ln"></span></div>
            <h2 className="h2x">كل ما تحتاج معرفته..<br /><span className="muted">قبل البدء.</span></h2>
            <p style={sv("margin: 0; font-size: 15px; color: #4B5563")}>سؤالك غير موجود؟ اتصل بنا على <a href="tel:920006900" className="en" style={sv("font-weight: 700")}>920006900</a></p>
          </div>
          <div className="in t3">
            <div className={`qa ${vm.fq.c0}`}><button type="button" className="qq" id="w2q0" aria-expanded={vm.fq.e0} aria-controls="w2a0" onClick={vm.fq.t0}><span className="qi" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"></path></svg></span><span className="qt">ما الفرق بين WhatsBit وتطبيق واتساب للأعمال؟</span><span className="pl" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg></span></button><div className="qa-a" id="w2a0" role="region" aria-labelledby="w2q0"><div className="qa-in"><div className="ansr"><img src="/landing/whatsbit-mark.png" alt="" /><div className="abub"><span className="atp" aria-hidden="true"><i></i><i></i><i></i></span><p>التطبيق مخصص لجهاز واحد، أما WhatsBit فيعمل عبر الواجهة الرسمية لواتساب للأعمال، فيتيح لعدة موظفين العمل على رقم واحد، مع بوت ذكي وحملات وتكاملات وتقارير.</p></div></div></div></div></div>
            <div className={`qa ${vm.fq.c1}`}><button type="button" className="qq" id="w2q1" aria-expanded={vm.fq.e1} aria-controls="w2a1" onClick={vm.fq.t1}><span className="qi" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"></path></svg></span><span className="qt">هل أحتاج إلى تحميل برنامج؟</span><span className="pl" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg></span></button><div className="qa-a" id="w2a1" role="region" aria-labelledby="w2q1"><div className="qa-in"><div className="ansr"><img src="/landing/whatsbit-mark.png" alt="" /><div className="abub"><span className="atp" aria-hidden="true"><i></i><i></i><i></i></span><p>لا، المنصة تعمل من المتصفح بواجهة عربية بالكامل، دون أي تركيب.</p></div></div></div></div></div>
            <div className={`qa ${vm.fq.c2}`}><button type="button" className="qq" id="w2q2" aria-expanded={vm.fq.e2} aria-controls="w2a2" onClick={vm.fq.t2}><span className="qi" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"></path></svg></span><span className="qt">كم يستغرق تفعيل الحساب؟</span><span className="pl" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg></span></button><div className="qa-a" id="w2a2" role="region" aria-labelledby="w2q2"><div className="qa-in"><div className="ansr"><img src="/landing/whatsbit-mark.png" alt="" /><div className="abub"><span className="atp" aria-hidden="true"><i></i><i></i><i></i></span><p>يساعدك فريقنا على اختيار الباقة وإعداد حسابك خلال 24 ساعة، ويعتمد توثيق الحساب لدى Meta على اكتمال بيانات منشأتك.</p></div></div></div></div></div>
            <div className={`qa ${vm.fq.c3}`}><button type="button" className="qq" id="w2q3" aria-expanded={vm.fq.e3} aria-controls="w2a3" onClick={vm.fq.t3}><span className="qi" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"></path></svg></span><span className="qt">هل رسوم Meta مشمولة في الاشتراك؟</span><span className="pl" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg></span></button><div className="qa-a" id="w2a3" role="region" aria-labelledby="w2q3"><div className="qa-in"><div className="ansr"><img src="/landing/whatsbit-mark.png" alt="" /><div className="abub"><span className="atp" aria-hidden="true"><i></i><i></i><i></i></span><p>لا، تُحتسب رسوم Meta لكل رسالة حسب نوعها وبشكل منفصل عن اشتراك المنصة، وبالريال السعودي. ومحادثات خدمة العملاء مجانية من Meta.</p></div></div></div></div></div>
            <div className={`qa ${vm.fq.c4}`}><button type="button" className="qq" id="w2q4" aria-expanded={vm.fq.e4} aria-controls="w2a4" onClick={vm.fq.t4}><span className="qi" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"></path></svg></span><span className="qt">هل يمكنني إرسال حملات تسويقية؟</span><span className="pl" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg></span></button><div className="qa-a" id="w2a4" role="region" aria-labelledby="w2q4"><div className="qa-in"><div className="ansr"><img src="/landing/whatsbit-mark.png" alt="" /><div className="abub"><span className="atp" aria-hidden="true"><i></i><i></i><i></i></span><p>نعم، عبر قوالب معتمدة لعملاء وافقوا على الاستلام، مع تحليل النتائج واحترام فوري لطلبات الإلغاء. البث متاح بدءاً من الباقة الأساسية.</p></div></div></div></div></div>
            <div className={`qa ${vm.fq.c5}`}><button type="button" className="qq" id="w2q5" aria-expanded={vm.fq.e5} aria-controls="w2a5" onClick={vm.fq.t5}><span className="qi" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"></path></svg></span><span className="qt">هل يوجد شات بوت وتكامل مع متجري؟</span><span className="pl" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg></span></button><div className="qa-a" id="w2a5" role="region" aria-labelledby="w2q5"><div className="qa-in"><div className="ansr"><img src="/landing/whatsbit-mark.png" alt="" /><div className="abub"><span className="atp" aria-hidden="true"><i></i><i></i><i></i></span><p>نعم، الشات بوت الذكي متاح بدءاً من باقة البداية مع التكامل مع سلة وزد وShopify، والوكيل الذكي وواجهة الربط الكاملة في باقتي الأعمال والمؤسسات.</p></div></div></div></div></div>
          </div>
        </div>
      </div>
    </section>

    
    <section className={`scene s-cta ${vm.c.s11}`} aria-hidden={vm.h.s11} aria-label="ابدأ الآن">
      <div className="glowc" aria-hidden="true"></div>
      <div className="full" style={sv("gap: 24px")}>
        <div className="ctap glass in t1">
          <div className="ctabg" aria-hidden="true"></div>
          <div className="ctl">
            <div className="kick"><span className="dt"></span><span>خطوات البدء</span><span className="ln"></span></div>
            <h2 className="h2x">من أول تواصل..<br /><span className="swash">إلى أول محادثة.</span></h2>
            <p>فريقنا يساعدك على اختيار الباقة المثالية وإعداد حسابك خلال 24 ساعة.</p>
            <div className="btnrow">
              <a className="btn btn-primary" href="tel:920006900">اتصل بنا · <span className="en">920006900</span></a>
              <a className="btn btn-line" href="https://wa.me/966920006900" target="_blank" rel="noopener">راسلنا واتساب</a>
            </div>
          </div>
          <div className="cth">
            <div className="chd" aria-hidden="true">
              <span className="cav" style={sv("background: #FFFFFF")}><img src="/landing/whatsbit-mark.png" alt="" style={sv("width: 30px; height: 30px")} /></span>
              <span className="cnm"><div><b><span className="en">WhatsBit</span> <svg className="vb" width="15" height="15" viewBox="0 0 24 24"><path fill="#28A745" d="M12 1.8l2.6 1.9 3.2-.2.9 3.1 2.7 1.8-1 3 1 3-2.7 1.8-.9 3.1-3.2-.2L12 22.2l-2.6-1.9-3.2.2-.9-3.1-2.7-1.8 1-3-1-3 2.7-1.8.9-3.1 3.2.2z"></path><path d="M8.3 12.2l2.5 2.5 4.9-5" fill="none" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"></path></svg></b><small>أربع خطوات للانطلاق</small></div></span>
            </div>
            <ol className="ctb" aria-label="خطوات البدء" style={sv("margin: 0; list-style: none")}>
              {(vm.cta || []).map((s: any, i: number) => (<Fragment key={i}><li className={s.cls}><div className="sh"><span className="sn">{s.n}</span><b>{s.t}</b></div><p>{s.d}</p></li></Fragment>))}
            </ol>
          </div>
        </div>
        <div className="foot in t3">
          <div className="fb"><span className="brand" style={sv("cursor: default")}><img src="/landing/whatsbit-mark.png" alt="" style={sv("width: 34px; height: 34px")} /><b style={sv("font-size: 18px")}>Whats<span className="g">Bit</span></b></span><span>منصة من المدار | كوربت · المدينة المنورة · السجل التجاري <span className="en">7012398264</span></span></div>
          <nav aria-label="روابط"><a href="https://corbit.sa" target="_blank" rel="noopener">الرئيسية</a><a href="https://corbit.sa/products/sms" target="_blank" rel="noopener">الرسائل النصية</a><a href="mailto:info@corbit.sa" className="en">info@corbit.sa</a></nav>
        </div>
      </div>
    </section>

    <div className={vm.sweepCls} aria-hidden="true"></div>
  </div><div className="runway" aria-hidden="true"></div>
  </main>

  <div className={`cxw ${vm.cx.cls} ${vm.cl.wcls}`} onKeyDown={vm.cx.onKey}>
    {!!vm.cx.teaser && (<>
      <div className="cx-tease" role="status">
        <button type="button" className="cx-tb" onClick={vm.cx.open}><b className="t1">{vm.cx.teaseT}</b><span className="t2">{vm.cx.teaseS}</span></button>
        <button type="button" className="cx-tx" onClick={vm.cx.hideTease} aria-label="إخفاء"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
      </div>
    </>)}
    <div className="cx-panel" id="cxpanel" role="dialog" aria-label="مساعد اختيار الحل" aria-hidden={vm.cx.hidden}>
      <div className="cx-hd">
        <span className="cx-av" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"></path></svg></span>
        <span style={sv("display: flex; flex-direction: column; min-width: 0")}><b>{vm.cx.title}</b><small><i></i>{vm.cx.sub}</small></span>
        <button type="button" className="cx-x" onClick={vm.cx.close} aria-label="إغلاق المساعد"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
      </div>
      <div className="cx-bd" aria-live="polite">
        <div className="cx-msgs">
          {!!vm.cx.hasRec && (<>
            <div className="cx-rec">
              <span className="cx-rk">ترشيحنا لك</span>
              <span className="cx-rt">{vm.cx.rec.title}</span>
              <p>{vm.cx.rec.body}</p>
              {!!vm.cx.rec.hasPrice && (<><div className="cx-rp"><b>{vm.cx.rec.price}</b><span>{vm.cx.rec.unit}</span></div></>)}
              {!!vm.cx.rec.hasExtra && (<><span className="cx-ex">{vm.cx.rec.extra}</span></>)}
            </div>
          </>)}
          {!!vm.cx.typing && (<><span className="cx-typing" aria-label="يكتب الآن"><i></i><i></i><i></i></span></>)}
          {(vm.cx.msgs || []).map((m: any, i: number) => (<Fragment key={i}><div className={m.cls}>{m.t}</div></Fragment>))}
        </div>
      </div>
      <div className="cx-ft">
        {!!vm.cx.hasChips && (<>
          <div className="cx-chips">{(vm.cx.chips || []).map((c: any, i: number) => (<Fragment key={i}><button type="button" className="cx-chip" onClick={c.pick}>{c.label}</button></Fragment>))}</div>
        </>)}
        {!!vm.cx.hasCta && (<>
          <div className="cx-cta">
            <a className="cx-wa" href={vm.cx.wa} target="_blank" rel="noopener"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM9.5 8.5c0 3.3 2.7 6 6 6l1-1.6-2-1-1 1a4 4 0 0 1-2.4-2.4l1-1-1-2z"></path></svg>أكمل على واتساب</a>
            <div className="cx-row">
              <button type="button" className="cx-sec" onClick={vm.cx.toSales}>مكالمة مع المبيعات</button>
              {!!vm.cx.hasMoreLink && (<><a className="cx-sec" href={vm.cx.moreHref} target={vm.cx.moreTarget} rel="noopener">{vm.cx.moreLabel}</a></>)}
              {!!vm.cx.hasMoreGo && (<><button type="button" className="cx-sec" onClick={vm.cx.moreGo}>شاهد كل الباقات</button></>)}
            </div>
            <button type="button" className="cx-re" onClick={vm.cx.restart}>ابدأ من جديد</button>
          </div>
        </>)}
        {!!vm.cx.hasChips && (<>
          <div className="cx-hand"><span>تفضّل تتكلم مع أحد الآن؟</span><button type="button" className="cx-hb" onClick={vm.cx.toSales}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg>المبيعات</button><button type="button" className="cx-hb" onClick={vm.cx.toSupport}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"></path><path d="M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z"></path><path d="M18 19c0 1.4-1.8 2.5-5 2.5"></path></svg>الدعم الفني</button></div>
        </>)}
      </div>
    </div>
    <div className="cl-panel" id="clpanel" role="dialog" aria-label="تواصل معنا من المتصفح" aria-hidden={vm.cl.hidden}>
      <div className="cl-hd">
        <span className="cl-av" aria-hidden="true"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"></path><path d="M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z"></path><path d="M18 19c0 1.4-1.8 2.5-5 2.5"></path></svg></span>
        <span className="cl-ht"><b>تواصل معنا من المتصفح</b><small>كوربت (المدار) · اتصال أو محادثة مجانية</small></span>
        <button type="button" className="cl-x" onClick={vm.cl.close} aria-label="إغلاق نافذة التواصل"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>
      </div>
      <div className="cl-bd">
        {!!vm.cl.showMode && (<><div className="cl-mode" role="tablist" aria-label="طريقة التواصل"><button type="button" role="tab" className={vm.cl.mCall} aria-selected={vm.cl.sCall} onClick={vm.cl.toCall}><svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg><span>اتصال صوتي</span></button><button type="button" role="tab" className={vm.cl.mChat} aria-selected={vm.cl.sChat} onClick={vm.cl.toChat}><svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM8.5 11h7M8.5 14.5h4"></path></svg><span>محادثة</span></button></div></>)}
        {!!vm.cl.isForm && (<>
          <div className="cl-card">
            {!!vm.cl.hasFrom && (<><div className="cl-from"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"></path></svg><span>حوّلك المساعد مع ملخص محادثتك، فلا تحتاج تعيد الشرح: <b>{vm.cl.from}</b></span></div></>)}
            <span className="cl-lb">بمن تريد الاتصال؟</span>
            <div className="cl-depts" role="radiogroup" aria-label="بمن تريد الاتصال؟">
              {(vm.cl.depts || []).map((d: any, i: number) => (<Fragment key={i}><button type="button" className={d.cls} role="radio" aria-checked={d.on} onClick={d.pick}><b>{d.name}</b><span>{d.desc}</span></button></Fragment>))}
            </div>
            
            {!!vm.cl.stPh && (<>
              <input id="clph" className="cl-in" dir="ltr" type="tel" inputMode="tel" autoComplete="tel" placeholder="05XXXXXXXX" value={vm.cl.ph} onChange={vm.cl.onPh} />
              <p className="cl-help">يظهر الرقم لموظفنا حتى يعاود الاتصال بك إن انقطعت المكالمة، لذلك نتحقق أنه رقمك برسالة نصية. من خارج السعودية اكتبه برمز الدولة، مثل <bdi dir="ltr">+971501234567</bdi>.</p>
              {!!vm.cl.hasErr && (<><p className="cl-err" role="alert">{vm.cl.err}</p></>)}
              <button type="button" className="cl-send" onClick={vm.cl.send}>أرسل رمز التحقق</button>
            </>)}
            {!!vm.cl.stCode && (<>
              <div className="cl-sent">أرسلنا رمزاً من 4 أرقام إلى <bdi dir="ltr">{vm.cl.ph}</bdi><button type="button" className="cl-lnk" onClick={vm.cl.change}>تغيير الرقم</button></div>
              <input id="clcode" className="cl-in cl-code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="••••" aria-label="رمز التحقق" value={vm.cl.code} onChange={vm.cl.onCode} />
              <div className="cl-rs">{!!vm.cl.cdOn && (<><span>إعادة الإرسال بعد {vm.cl.cd} ثانية</span></>)}{!!vm.cl.cdOff && (<><button type="button" className="cl-lnk" onClick={vm.cl.resend}>أعد إرسال الرمز</button></>)}</div>
            </>)}
            {!!vm.cl.stOk && (<><div className="cl-ok"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg><span>تم التحقق من رقمك <bdi dir="ltr">{vm.cl.ph}</bdi></span><button type="button" className="cl-lnk" onClick={vm.cl.change}>تغيير</button></div></>)}
            <p className="cl-note">تُفتح صفحة الاتصال المجاني من المتصفح، وتدخل مكالمتك طابور موظفينا.</p>
            {!!vm.cl.hasCallErr && (<><p className="cl-err" role="alert">{vm.cl.callErr}</p></>)}
            <button type="button" className={vm.cl.callCls} onClick={vm.cl.call}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg><span>اتصال</span></button>
          </div>
        </>)}
        {!!vm.cl.isCall && (<>
          <div className="cl-card cl-call" aria-live="polite">
            <div className={`cl-ring ${vm.cl.ringCls}`}><svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"></path><path d="M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z"></path><path d="M18 19c0 1.4-1.8 2.5-5 2.5"></path></svg></div>
            <b className="cl-who">{vm.cl.who}</b>
            <span className="cl-st">{vm.cl.status}</span>
            {!!vm.cl.hasTime && (<><span className="cl-tm" dir="ltr">{vm.cl.time}</span></>)}
            {!!vm.cl.hasFrom && (<><span className="cl-sum">وصل للموظف ملخص محادثتك: {vm.cl.from}</span></>)}
            <div className="cl-ctl">
              <button type="button" className={vm.cl.muteCls} aria-pressed={vm.cl.muted} onClick={vm.cl.mute}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"></path><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path><path className="sl" d="M4 4l16 16"></path></svg><span>{vm.cl.muteLb}</span></button>
              <button type="button" className="cl-end" onClick={vm.cl.end}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><g transform="rotate(135 12 12)"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"></path></g></svg><span>إنهاء</span></button>
            </div>
          </div>
        </>)}
        {!!vm.cl.isEnd && (<>
          <div className="cl-card cl-call">
            <div className="cl-ring done"><svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>
            <b className="cl-who">انتهت المكالمة</b>
            <span className="cl-st">المدة <bdi dir="ltr">{vm.cl.time}</bdi> · شكراً لتواصلك مع كوربت</span>
            <div className="cl-ctl"><button type="button" className="cl-again" onClick={vm.cl.again}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg><span>اتصال جديد</span></button><button type="button" onClick={vm.cl.close}><span>إغلاق</span></button></div>
          </div>
        </>)}
        {!!vm.cl.chForm && (<>
          <div className="cl-card">
            {!!vm.cl.hasFrom && (<><div className="cl-from"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"></path></svg><span>حوّلك المساعد مع ملخص محادثتك، فلا تحتاج تعيد الشرح: <b>{vm.cl.from}</b></span></div></>)}
            <span className="cl-lb">مع من تريد المحادثة؟</span>
            <div className="cl-depts" role="radiogroup" aria-label="مع من تريد المحادثة؟">
              {(vm.cl.depts || []).map((d: any, i: number) => (<Fragment key={i}><button type="button" className={d.cls} role="radio" aria-checked={d.on} onClick={d.pick}><b>{d.name}</b><span>{d.desc}</span></button></Fragment>))}
            </div>
            <label className="cl-lb" htmlFor="chname">اسمك</label>
            <input id="chname" className="cl-in" type="text" autoComplete="name" placeholder="مثال: خالد" value={vm.cl.chName} onChange={vm.cl.onName} />
            <label className="cl-lb" htmlFor="chmsg">كيف نقدر نساعدك؟</label>
            <textarea id="chmsg" className="cl-in cl-ta" rows={3} placeholder="اكتب سؤالك أو استفسارك هنا" value={vm.cl.chMsg} onChange={vm.cl.onMsg}></textarea>
            {!!vm.cl.hasChErr && (<><p className="cl-err" role="alert">{vm.cl.chErr}</p></>)}
            <p className="cl-note">تُفتح محادثتك مع فريقنا على واتساب، ومعها اسمك ورسالتك.</p>
            <button type="button" className="cl-go" onClick={vm.cl.chStart}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM8.5 11h7M8.5 14.5h4"></path></svg><span>ابدأ المحادثة</span></button>
          </div>
        </>)}
        {!!vm.cl.chChat && (<>
          <div className="cl-card ch-box">
            <div className="ch-hd"><span className={vm.cl.chDot} aria-hidden="true"></span><b>{vm.cl.chWho}</b><span>{vm.cl.chState}</span></div>
            <div className="ch-log" aria-live="polite">
              {!!vm.cl.chTyping && (<><span className="ch-typ" aria-label="يكتب الآن"><i></i><i></i><i></i></span></>)}
              {(vm.cl.chItems || []).map((m: any, i: number) => (<Fragment key={i}><div className={m.cls}><span>{m.t}</span>{!!m.hasRc && (<><small>{m.rc}</small></>)}</div></Fragment>))}
            </div>
            <div className="ch-in"><input id="chdraft" className="cl-in" type="text" placeholder="اكتب رسالتك…" aria-label="اكتب رسالتك" value={vm.cl.chDraft} onChange={vm.cl.onDraft} onKeyDown={vm.cl.draftKey} /><button type="button" className="ch-send" onClick={vm.cl.chSend} aria-label="إرسال"><svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4L4 11l6.5 2.5L13 20z"></path><path d="M20 4l-9.5 9.5"></path></svg></button></div>
            <div className="ch-act"><button type="button" className="cl-lnk ch-tocall" onClick={vm.cl.chToCall}><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"></path></svg><span>حوّلها لاتصال صوتي</span></button><button type="button" className="ch-endb" onClick={vm.cl.chEnd}>إنهاء المحادثة</button></div>
          </div>
        </>)}
        {!!vm.cl.chDone && (<>
          <div className="cl-card cl-call">
            <div className="cl-ring done"><svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>
            <b className="cl-who">انتهت المحادثة</b>
            <span className="cl-st">شكراً لتواصلك مع كوربت، ويسعدنا خدمتك في أي وقت.</span>
            <div className="cl-ctl"><button type="button" className="cl-again" onClick={vm.cl.chAgain}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM8.5 11h7M8.5 14.5h4"></path></svg><span>محادثة جديدة</span></button><button type="button" onClick={vm.cl.close}><span>إغلاق</span></button></div>
          </div>
        </>)}
      </div>
      <div className="cl-ft">
        <span>أو اتصل على الرقم الموحد <a href="tel:920006900" dir="ltr">920006900</a></span>
        <small>نستخدم الميكروفون أثناء المكالمة فقط، وتُسجَّل المكالمات والمحادثات لضمان الجودة.</small>
      </div>
    </div>
    <button type="button" className="cx-btn" onClick={vm.cx.toggle} aria-expanded={vm.cx.exp} aria-controls="cxpanel" aria-label={vm.cx.btnLabel}>
      <span className="cx-ic" aria-hidden="true"><svg className="c" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12zM8.5 11h7M8.5 14.5h4"></path></svg><svg className="x" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></span>
      <span className="cx-lb">ساعدني أختار</span>
    </button>
    <button type="button" className="cl-btn" onClick={vm.cl.toggle} aria-expanded={vm.cl.exp} aria-controls="clpanel" aria-label={vm.cl.btnLabel} title="تواصل معنا — اتصال أو محادثة مجانية">
      <span className="cl-ic" aria-hidden="true"><svg className="p" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"></path><path d="M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z"></path><path d="M18 19c0 1.4-1.8 2.5-5 2.5"></path></svg><svg className="x" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"></path></svg></span><i className="cl-dot" aria-hidden="true"></i>
    </button>
  </div>

  {!!vm.notLast && (<><button type="button" className="next" onClick={vm.nextAct} aria-label="التالي"><span>التالي</span><span className="line" aria-hidden="true"></span></button></>)}
</div>
  );
}
