"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/locale-provider';
import { ZohoSalesIq } from '@/components/support/zoho-salesiq';
import { AuthTopbar, AuthLegal, EyeIcon, useAuthTheme } from '@/components/auth/auth-shell';
import './login.css';

const D = {
  ar: {
    sub: 'أدخل بيانات حسابك للوصول إلى منصة واتساب الأعمال.', email: 'البريد الإلكتروني', eEmail: 'أدخل بريداً إلكترونياً صحيحاً',
    pass: 'كلمة المرور', ePass: 'أدخل كلمة المرور', forgot: 'نسيت كلمة المرور؟', caps: 'زر الأحرف الكبيرة (Caps Lock) مفعّل',
    login: 'تسجيل الدخول', noAcc: 'ليس لديك حساب؟', signup: 'أنشئ حسابك الآن',
    errAuth: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', errNet: 'تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
    showPass: 'إظهار كلمة المرور', hidePass: 'إخفاء كلمة المرور', loading: 'جاري التحميل...',
    eyebrow: 'منصة واتساب الأعمال المتكاملة', h2a: 'واتساب للأعمال', h2b: ' بذكاء أكبر',
    heroP: 'حملات وقوالب معتمدة وبوتات ووكلاء ذكاء اصطناعي وصندوق وارد مشترك لفريقك في مكان واحد.',
    demo: 'عرض توضيحي', inb: 'صندوق الوارد', c1n: 'أحمد', c1m: 'كم سعر الباقة السنوية؟', c2n: 'سارة', c2m: 'أريد تغيير موعد الطلب',
    c3n: 'خالد', c3m: 'وصلتني الفاتورة، شكراً', open: 'مفتوحة', newc: 'جديدة', agent: 'وكيل المبيعات AI', r1: 'مبيعات', r2: 'دعم', r3: 'فوترة',
    st1: 'سنة خبرة', st2: 'نسبة رضا العملاء', st3: 'دعم فني على مدار الساعة', cta: 'أنشئ حسابك الآن ←',
    chips: ['قالب حملة', 'بوت تلقائي', 'وكيل AI', 'رابط دفع'], greet: ['صباح الخير 👋', 'مساء الخير 👋'],
    chat: ['كم سعر الباقة السنوية؟', 'أهلاً أحمد! أنا وكيل المبيعات. كم عدد عملائكم تقريباً لأرشّح لك الباقة الأنسب؟'],
  },
  en: {
    sub: 'Enter your account details to access the WhatsApp business platform.', email: 'Email', eEmail: 'Enter a valid email address',
    pass: 'Password', ePass: 'Enter your password', forgot: 'Forgot password?', caps: 'Caps Lock is on',
    login: 'Sign in', noAcc: "Don't have an account?", signup: 'Create your account',
    errAuth: 'Incorrect email or password.', errNet: "Couldn't connect. Check your internet and try again.",
    showPass: 'Show password', hidePass: 'Hide password', loading: 'Loading...',
    eyebrow: 'The complete WhatsApp business platform', h2a: 'WhatsApp for business,', h2b: ' smarter',
    heroP: 'Campaigns, approved templates, bots, AI agents and a shared team inbox in one place.',
    demo: 'Demo', inb: 'Inbox', c1n: 'Ahmed', c1m: 'How much is the yearly plan?', c2n: 'Sara', c2m: 'I want to change my order date',
    c3n: 'Khaled', c3m: 'Got the invoice, thanks', open: 'Open', newc: 'New', agent: 'Sales AI agent', r1: 'Sales', r2: 'Support', r3: 'Billing',
    st1: 'years of experience', st2: 'customer satisfaction', st3: 'technical support, around the clock', cta: 'Create your account →',
    chips: ['Campaign', 'Auto bot', 'AI agent', 'Pay link'], greet: ['Good morning 👋', 'Good evening 👋'],
    chat: ['How much is the yearly plan?', "Hi Ahmed! I'm the sales agent. Roughly how many customers do you have, so I can suggest the right plan?"],
  },
} as const;

/** Both languages are in the DOM; CSS shows the active one (data-l). */
const L2 = ({ ar, en }: { ar: string; en: string }) => (<><span data-l="ar">{ar}</span><span data-l="en">{en}</span></>);

/** Blocks whose height is locked to the taller of the two languages. */
const LOCK_SEL = ['.hero-head', '.stage', '.trust', '.slides', '.card'] as const;

type FormError = { k: 'errAuth' | 'errNet' } | { m: string };

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { lang, toggleLang } = useLocale();
  // Layout measuring: 'a' = this language, 'b' = one render in the other language (never painted).
  const [meas, setMeas] = useState<'' | 'a' | 'b'>('a');
  const [lk, setLk] = useState<number[] | null>(null);
  const en = (meas === 'b') !== (lang === 'en');
  const t = D[en ? 'en' : 'ar'];

  const [dark, toggleTheme] = useAuthTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pw, setPw] = useState(false);
  const [caps, setCaps] = useState(false);
  const [eE, setEE] = useState(false);
  const [eP, setEP] = useState(false);
  const [shk, setShk] = useState(0);
  const [btn, setBtn] = useState<'' | 'loading' | 'success'>('');
  const [err, setErr] = useState<FormError | null>(null);
  const [morning, setMorning] = useState(true);

  // hero demo state
  const [chat, setChat] = useState(0);
  const [sl, setSl] = useState(0);
  const [slAlt, setSlAlt] = useState(false);
  const [used, setUsed] = useState(false);
  const [cnt, setCnt] = useState(0);
  const [now, setNow] = useState<number | null>(null);

  const busy = useRef(false);
  const passRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lkA = useRef<number[] | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroInnerRef = useRef<HTMLDivElement>(null);
  const slRef = useRef(0);
  const slTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  // greeting + clock
  useEffect(() => {
    const h = new Date().getHours();
    setMorning(h >= 4 && h < 12);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const reduce = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  };

  // inbox demo chat: user bubble → route → typing → agent reply, loops every 10.5s
  useEffect(() => {
    if (reduce()) { setChat(4); return; }
    let timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setChat(0);
      timers = [
        setTimeout(() => setChat(1), 500),
        setTimeout(() => setChat(2), 1500),
        setTimeout(() => setChat(3), 2100),
        setTimeout(() => setChat(4), 3900),
        setTimeout(run, 10500),
      ];
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, []);

  // phone slides: auto-advance every 5s; a chip click pauses for 12s
  const showSlide = useCallback((n: number, byUser: boolean) => {
    const cur = ((n % 4) + 4) % 4;
    if (slTimer.current) clearTimeout(slTimer.current);
    if (byUser) {
      setUsed(true);
      if (cur === slRef.current) setSlAlt((a) => !a);
    }
    slRef.current = cur;
    setSl(cur);
    if (!reduce()) slTimer.current = setTimeout(() => showSlide(slRef.current + 1, false), byUser ? 12000 : 5000);
  }, []);

  useEffect(() => {
    showSlide(0, false);
    return () => { if (slTimer.current) clearTimeout(slTimer.current); };
  }, [showSlide]);

  // number counters (20+, 98%)
  useEffect(() => {
    if (reduce()) { setCnt(1); return; }
    const t0 = Date.now() + 400;
    const id = setInterval(() => {
      const k = Math.min(1, Math.max(0, (Date.now() - t0) / 1500));
      setCnt(k);
      if (k >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, []);

  /* Fit to the viewport height — the page never scrolls (mirrors the design's lock() + fit()):
     'a' natural heights in this language → 'b' the same in the other language → lock min-heights
     to the taller of the two, so switching language doesn't move the layout → zoom the card / the
     hero down when they are taller than the room they have.
     Zoom goes straight to the DOM inside a layout effect, so nothing is painted in between. */
  const fit = useCallback(() => {
    const card = cardRef.current, center = centerRef.current, hero = heroRef.current, hi = heroInnerRef.current;
    if (card && center) {
      card.style.zoom = '';
      const av = center.clientHeight - 24, h = card.offsetHeight;
      if (h > av) card.style.zoom = String(Math.max(0.4, av / h));
    }
    if (hi) {
      hi.style.zoom = ''; hi.style.height = ''; hi.style.flex = '';
      if (hero && getComputedStyle(hero).display !== 'none') {
        hi.style.flex = 'none';
        const H = hero.clientHeight, N = hi.offsetHeight, z = N > 0 ? Math.min(1, H / N) : 1;
        hi.style.height = `${H / z}px`;
        if (z < 1) hi.style.zoom = String(z);
      }
    }
  }, []);

  useLayoutEffect(() => {
    if (isLoading) return;
    if (meas) {
      // natural size: no zoom, no fixed hero height
      const card = cardRef.current, hi = heroInnerRef.current;
      if (card) card.style.zoom = '';
      if (hi) { hi.style.zoom = ''; hi.style.height = ''; hi.style.flex = 'none'; }
      const hs = LOCK_SEL.map((sel) => rootRef.current?.querySelector<HTMLElement>(sel)?.offsetHeight ?? 0);
      if (meas === 'a') { lkA.current = hs; setMeas('b'); return; }
      const a = lkA.current ?? hs;
      setLk(hs.map((v, i) => Math.max(v, a[i])));
      setMeas('');
      return;
    }
    fit();
    // the field hints open with a .25s transition — fit again once they have settled
    const id = setTimeout(fit, 320);
    return () => clearTimeout(id);
  }, [fit, isLoading, meas, lk, lang, eE, eP, caps, err]);

  // re-measure from scratch when the viewport changes or the web fonts land
  useEffect(() => {
    let tm: ReturnType<typeof setTimeout>;
    const relock = () => { clearTimeout(tm); tm = setTimeout(() => { setLk(null); setMeas('a'); }, 250); };
    window.addEventListener('resize', relock);
    try { document.fonts?.ready.then(relock); } catch { /* ignore */ }
    return () => { window.removeEventListener('resize', relock); clearTimeout(tm); };
  }, []);

  const capsKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const c = !!e.getModifierState?.('CapsLock');
    if (c !== caps) setCaps(c);
  };

  const submit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (busy.current) return;
    const em = email.trim();
    const okE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    if (!okE || !password) { setEE(!okE); setEP(!password); setShk((s) => s + 1); return; }
    busy.current = true;
    setErr(null); setBtn('loading'); setEE(false); setEP(false);
    const result = await login(em, password);
    if (result.success) {
      setBtn('success');
      router.replace('/dashboard');
      return;
    }
    if (result.otpRequired && result.userId) {
      // 2FA gate: stash the user_id + masked phone so the OTP page can
      // render context without us passing them through router state.
      try {
        sessionStorage.setItem('otp_pending', JSON.stringify({ userId: result.userId, phoneMasked: result.phoneMasked ?? '' }));
      } catch { /* sessionStorage not available — page will fall back to query string */ }
      setBtn('success');
      router.replace(`/auth/otp?u=${encodeURIComponent(result.userId)}`);
      return;
    }
    busy.current = false;
    setBtn('');
    // Server messages (suspended account, throttling…) are kept as-is; the
    // two designed messages cover wrong credentials and no connection.
    setErr(result.network ? { k: 'errNet' } : (result.status === 401 || result.status === 422 || !result.error ? { k: 'errAuth' } : { m: result.error }));
  };

  if (isLoading) return (
    <div className="lgw" style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
      <div style={{ color: 'var(--muted)', fontSize: 15 }}>{t.loading}</div>
    </div>
  );

  const d = now ? new Date(now) : null;
  const hm = d ? `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}` : '';
  const e3 = 1 - Math.pow(1 - cnt, 3);
  const slc = (i: number) => 'slide' + (i === sl ? ' on' + (slAlt ? ' alt' : '') : '');
  const ctrlCls = 'ctrl' + (shk % 2 ? ' alt' : '');
  const meta = (tick?: boolean) => (
    <small className="wa-meta">{hm}{tick && <> <i className="wa-tick">✓✓</i></>}</small>
  );

  return (
    <div className={'lgw' + (dark ? ' dark' : '') + (en ? ' en' : '')} dir={en ? 'ltr' : 'rtl'} lang={en ? 'en' : 'ar'} ref={rootRef}>
      <ZohoSalesIq hideLauncher />
      <div className="page">

        <section className="side-form">
          <div className="gridbg" aria-hidden="true" /><div className="orb" aria-hidden="true" />
          <AuthTopbar en={en} onToggleLang={toggleLang} onToggleTheme={toggleTheme} />

          <main className="center" ref={centerRef}>
            <div className="card reveal" ref={cardRef} style={lk ? { minHeight: lk[4] } : undefined}>
              <h1>{t.greet[morning ? 0 : 1]}</h1>
              <p className="sub">{t.sub}</p>
              <form noValidate onSubmit={submit}>
                <div className={'field' + (eE ? ' invalid' : '')}>
                  <label htmlFor="email"><span>{t.email}</span> <i>*</i></label>
                  <div className={ctrlCls}>
                    <input id="email" name="email" type="email" dir="ltr" placeholder="name@company.com" autoComplete="username" inputMode="email"
                      value={email} onChange={(e) => { setEmail(e.target.value); if (eE) setEE(false); }} />
                  </div>
                  <div className="hint"><span>{t.eEmail}</span></div>
                </div>
                <div className={'field' + (eP ? ' invalid' : '')}>
                  <div className="lbl-row">
                    <label htmlFor="pass"><span>{t.pass}</span> <i>*</i></label>
                    <a className="link" href="/forgot-password">{t.forgot}</a>
                  </div>
                  <div className={ctrlCls}>
                    <input id="pass" name="password" ref={passRef} type={pw ? 'text' : 'password'} dir="ltr" placeholder="••••••••" autoComplete="current-password"
                      value={password} onChange={(e) => { setPassword(e.target.value); if (eP) setEP(false); }}
                      onKeyDown={capsKey} onKeyUp={capsKey} onBlur={() => caps && setCaps(false)} />
                    <button type="button" className="icon-btn" aria-label={pw ? t.hidePass : t.showPass}
                      onClick={() => { setPw((v) => !v); setTimeout(() => passRef.current?.focus(), 0); }}>
                      <EyeIcon off={pw} />
                    </button>
                  </div>
                  <div className="hint"><span>{t.ePass}</span></div>
                  <div className={'hint warn' + (caps ? ' show' : '')}><span>{t.caps}</span></div>
                </div>
                {err && <div className="form-err" role="alert">{'k' in err ? t[err.k] : err.m}</div>}
                <button className={'btn' + (btn ? ' ' + btn : '')} type="submit" aria-busy={btn ? 'true' : 'false'}>
                  <span className="lbl">{t.login}</span>
                  <span className="spin"><i /></span>
                  <span className="done"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg></span>
                </button>
              </form>
              <p className="sublink"><span>{t.noAcc}</span> <a href="/register">{t.signup}</a></p>
            </div>
          </main>

          <AuthLegal en={en} />
        </section>

        <aside className="hero" ref={heroRef}>
          <div className="hero-inner" ref={heroInnerRef}>
            <div className="hero-head reveal" style={lk ? { minHeight: lk[0] } : undefined}>
              <span className="eyebrow"><span className="dot" /><span>{t.eyebrow}</span></span>
              <h2><em>{t.h2a}</em>{t.h2b}</h2>
              <p>{t.heroP}</p>
            </div>

            <div className="stage reveal" style={lk ? { minHeight: lk[1] } : undefined}>
              <div className="dash" aria-hidden="true">
                <div className="chrome"><i /><i /><i /><span className="url" dir="ltr">whatsbit.corbit.sa/inbox</span><span className="demo">{t.demo}</span></div>
                <div className="dbody inbox">
                  <div className="convs">
                    <div className="ch"><b>{t.inb}</b></div>
                    <div className="cv on cA"><span className="av">A</span><span className="tx"><b>{t.c1n}</b><small>{t.c1m}</small></span><span className="st">{t.open}</span></div>
                    <div className="cv cS"><span className="av">S</span><span className="tx"><b>{t.c2n}</b><small>{t.c2m}</small></span><span className="st p">{t.newc}</span></div>
                    <div className="cv cK"><span className="av">K</span><span className="tx"><b>{t.c3n}</b><small>{t.c3m}</small></span><span className="st">{t.open}</span></div>
                  </div>
                  <div className="chat">
                    <div className="hd"><span className="av cA av22">A</span><b>{t.c1n}</b><span className="ai">{t.agent}</span></div>
                    <div className="route"><i className={chat >= 2 ? 'on' : ''}>{t.r1}</i><i>{t.r2}</i><i>{t.r3}</i></div>
                    <div className="msgs">
                      {chat >= 1 && <div className="bub me">{t.chat[0]}</div>}
                      {chat === 3 && <div className="typing"><i /><i /><i /></div>}
                      {chat >= 4 && <div className="bub bot">{t.chat[1]}</div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="phone wa">
                <div className="notch" />
                <div className="scr wa-scr">
                  <div className="wa-head">
                    <span className="wa-av"><span className="bi">ر</span></span>
                    <span className="wa-who"><b><span className="bn">متجر الريّان</span><i className="wa-ver">✓</i></b><small><L2 ar="حساب تجاري" en="Business account" /></small></span>
                  </div>
                  <div className="wa-body">
                    <div className="slides" style={lk ? { minHeight: lk[3] } : undefined}>
                      <div className={slc(0)}>
                        <div className="wa-in wa-tpl">
                          <div className="wa-img"><L2 ar="🎉 عرض نهاية الأسبوع" en="🎉 Weekend offer" /></div>
                          <L2 ar="خصم 20٪ على كل الطلبات حتى الأحد." en="20% off every order until Sunday." />
                          {meta()}
                          <div className="wa-btns"><span><L2 ar="🛒 تسوّق الآن" en="🛒 Shop now" /></span><span><L2 ar="إيقاف العروض" en="Stop offers" /></span></div>
                        </div>
                        <div className="wa-out"><L2 ar="🛒 تسوّق الآن" en="🛒 Shop now" />{meta(true)}</div>
                      </div>
                      <div className={slc(1)}>
                        <div className="wa-out"><L2 ar="أبغى أتابع طلبي" en="I want to track my order" />{meta(true)}</div>
                        <div className="wa-in"><L2 ar="أهلاً! اختر من القائمة 👇" en="Hi! Pick an option 👇" />{meta()}
                          <div className="wa-btns"><span><L2 ar="☰ عرض الخيارات" en="☰ View options" /></span></div>
                        </div>
                        <div className="wa-in wa-list"><b><L2 ar="طلب #20418" en="Order #20418" /></b><L2 ar="🚚 في الطريق، يصلك اليوم" en="🚚 On the way, arrives today" />{meta()}</div>
                      </div>
                      <div className={slc(2)}>
                        <div className="wa-out"><L2 ar="كم سعر الباقة السنوية؟" en="How much is the yearly plan?" />{meta(true)}</div>
                        <div className="wa-in"><em className="wa-ai"><L2 ar="🤖 وكيل المبيعات" en="🤖 Sales agent" /></em><br />
                          <L2 ar="أهلاً! كم عدد عملائكم تقريباً لأرشّح لك الباقة الأنسب؟" en="Hi! Roughly how many customers do you have, so I can suggest a plan?" />{meta()}
                          <div className="wa-btns"><span><L2 ar="أقل من 1,000" en="Under 1,000" /></span><span><L2 ar="أكثر من 1,000" en="Over 1,000" /></span></div>
                        </div>
                      </div>
                      <div className={slc(3)}>
                        <div className="wa-out"><L2 ar="أبغى أعيد نفس طلبي السابق" en="I want to reorder my last order" />{meta(true)}</div>
                        <div className="wa-in"><b><L2 ar="طلبك جاهز ✨" en="Your order is ready ✨" /></b><br />
                          <L2 ar="عطر العود × 1 · 250 ر.س" en="Oud perfume × 1 · SAR 250" />{meta()}
                          <div className="wa-btns"><span><L2 ar="💳 ادفع الآن" en="💳 Pay now" /></span></div>
                        </div>
                        <div className="wa-in wa-paid"><L2 ar="✅ تم الدفع. طلبك في الطريق 🚚" en="✅ Paid. Your order is on its way 🚚" />{meta()}</div>
                      </div>
                    </div>
                  </div>
                  <div className={'sl-dots' + (used ? ' used' : '')}>
                    {t.chips.map((label, i) => (
                      <button key={i} type="button" className={'chip' + (i === sl ? ' on' : '')} aria-pressed={i === sl} onClick={() => showSlide(i, true)}>{label}</button>
                    ))}
                  </div>
                  <a className="ph-cta show" href="/register">{t.cta}</a>
                </div>
              </div>
            </div>

            <div className="trust reveal" style={lk ? { minHeight: lk[2] } : undefined}>
              <dl className="stats">
                <div><dt><bdi dir="ltr"><b className="num">{Math.round(20 * e3)}+</b></bdi></dt><dd>{t.st1}</dd></div>
                <div><dt><bdi dir="ltr"><b className="num">{Math.round(98 * e3)}%</b></bdi></dt><dd>{t.st2}</dd></div>
                <div><dt><bdi dir="ltr"><b className="num">24/7</b></bdi></dt><dd>{t.st3}</dd></div>
              </dl>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
