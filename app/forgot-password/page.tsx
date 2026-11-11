"use client";
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';
import { useLocale } from '@/lib/i18n/locale-provider';
import { ZohoSalesIq } from '@/components/support/zoho-salesiq';
import { AuthTopbar, AuthLegal, EyeIcon, useAuthTheme } from '@/components/auth/auth-shell';
import '../login/login.css';

/**
 * Password recovery, in the same shell as the login screen.
 *
 * Step 1: the account email. Step 2: the 6-digit code that was sent by
 * SMS to the phone on the account, plus the new password. Login details
 * never travel by email, so there is no reset link to follow.
 */

/** Matches the backend's 60s cooldown between two codes for the same account. */
const RESEND_SECONDS = 60;

const D = {
  ar: {
    h1: 'استعادة كلمة المرور', sub1: 'أدخل بريد حسابك، ونرسل رمز تحقق برسالة نصية إلى رقم الجوال المسجّل في الحساب.',
    email: 'البريد الإلكتروني', eEmail: 'أدخل بريداً إلكترونياً صحيحاً', send: 'أرسل رمز التحقق', back: 'العودة لتسجيل الدخول',
    h2: 'أدخل رمز التحقق',
    sent: (e: string) => `إن كان ${e} مسجّلاً لدينا، فقد أرسلنا رمزاً من 6 أرقام برسالة نصية إلى رقم الجوال المرتبط بالحساب. الرمز صالح لـ 10 دقائق.`,
    change: 'تغيير البريد', code: 'رمز التحقق', eCode: 'أدخل الرمز المكوّن من 6 أرقام',
    pass: 'كلمة المرور الجديدة', ePass: '8 أحرف على الأقل، فيها حرف كبير وحرف صغير ورقم',
    passHelp: '8 أحرف على الأقل، فيها حرف كبير وحرف صغير ورقم.', caps: 'زر الأحرف الكبيرة (Caps Lock) مفعّل',
    save: 'حفظ كلمة المرور الجديدة', showPass: 'إظهار كلمة المرور', hidePass: 'إخفاء كلمة المرور',
    noCode: 'لم يصلك الرمز؟', resend: 'أعد إرسال الرمز', resendIn: (n: number) => `إعادة الإرسال بعد ${n} ثانية`, resent: 'أرسلنا رمزاً جديداً.',
    help: 'إن لم يكن في حسابك رقم جوال، أو لم يصلك الرمز، تواصل مع الدعم على',
    doneH: 'تم تغيير كلمة المرور', doneP: 'سجّلنا خروجك من كل الأجهزة. ادخل الآن بكلمة المرور الجديدة.', login: 'تسجيل الدخول',
    errNet: 'تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.', errCode: 'الرمز غير صحيح أو منتهٍ. اطلب رمزاً جديداً.',
    errMany: 'محاولات كثيرة. حاول مرة أخرى بعد ساعة.', errAny: 'تعذّر إتمام الطلب. حاول مرة أخرى.',
  },
  en: {
    h1: 'Reset your password', sub1: "Enter your account email and we'll text a verification code to the mobile number on the account.",
    email: 'Email', eEmail: 'Enter a valid email address', send: 'Send verification code', back: 'Back to sign in',
    h2: 'Enter the verification code',
    sent: (e: string) => `If ${e} is registered with us, we texted a 6-digit code to the mobile number on the account. The code is valid for 10 minutes.`,
    change: 'Change email', code: 'Verification code', eCode: 'Enter the 6-digit code',
    pass: 'New password', ePass: 'At least 8 characters, with an uppercase letter, a lowercase letter and a number',
    passHelp: 'At least 8 characters, with an uppercase letter, a lowercase letter and a number.', caps: 'Caps Lock is on',
    save: 'Save new password', showPass: 'Show password', hidePass: 'Hide password',
    noCode: "Didn't get the code?", resend: 'Resend code', resendIn: (n: number) => `Resend in ${n}s`, resent: 'We sent a new code.',
    help: "If your account has no mobile number, or the code didn't arrive, contact support on",
    doneH: 'Password changed', doneP: "We signed you out on every device. Sign in with your new password.", login: 'Sign in',
    errNet: "Couldn't connect. Check your internet and try again.", errCode: 'The code is incorrect or has expired. Request a new one.',
    errMany: 'Too many attempts. Try again in an hour.', errAny: "Couldn't complete the request. Try again.",
  },
} as const;

type ErrKey = 'errNet' | 'errCode' | 'errMany' | 'errAny';
/** Kept as a key where we have our own wording, so the message follows the language. */
type FormError = { k: ErrKey } | { m: string };

const validPassword = (p: string) => p.length >= 8 && p.length <= 72 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);

/** Turn a failed request into a message; `onValidation` picks the wording for a 422. */
function toError(e: any, onValidation: (data: any) => FormError): FormError {
  if (!e?.response) return { k: 'errNet' };
  if (e.response.status === 429) return { k: 'errMany' };
  if (e.response.status === 422) return onValidation(e.response.data);
  return { k: 'errAny' };
}

export default function ForgotPasswordPage() {
  const { lang, toggleLang } = useLocale();
  const en = lang === 'en';
  const t = D[en ? 'en' : 'ar'];
  const [dark, toggleTheme] = useAuthTheme();

  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [pw, setPw] = useState(false);
  const [caps, setCaps] = useState(false);
  const [bad, setBad] = useState<{ email?: boolean; code?: boolean; pass?: boolean }>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<FormError | null>(null);
  const [resent, setResent] = useState(false);
  const [wait, setWait] = useState(0);

  const sending = useRef(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  // countdown before another code can be requested
  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const requestCode = async (isResend: boolean) => {
    if (sending.current) return;
    const em = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setBad({ email: true }); return; }
    sending.current = true;
    setBusy(true); setErr(null); setResent(false); setBad({});
    try {
      await api.post(API.AUTH.FORGOT_PASSWORD, { email: em });
      setEmail(em);
      setStep('code');
      setWait(RESEND_SECONDS);
      setResent(isResend);
    } catch (e) {
      const error = toError(e, () => ({ k: 'errAny' }));
      if (!isResend && e && (e as any).response?.status === 422) setBad({ email: true });
      else setErr(error);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const submitReset = async (ev: React.SyntheticEvent) => {
    ev.preventDefault();
    if (sending.current) return;
    const okCode = /^\d{6}$/.test(code), okPass = validPassword(password);
    if (!okCode || !okPass) { setBad({ code: !okCode, pass: !okPass }); return; }
    sending.current = true;
    setBusy(true); setErr(null); setResent(false); setBad({});
    try {
      await api.post(API.AUTH.RESET_PASSWORD, { email, code, new_password: password });
      setPassword(''); setCode('');
      setStep('done');
    } catch (e) {
      setErr(toError(e, (data) => {
        const rule = data?.errors?.new_password?.[0];
        return rule ? { m: String(rule) } : { k: 'errCode' };
      }));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  const capsKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const c = !!e.getModifierState?.('CapsLock');
    if (c !== caps) setCaps(c);
  };

  const errBox = err && <div className="form-err" role="alert">{'k' in err ? t[err.k] : err.m}</div>;
  const submitBtn = (label: string) => (
    <button className={'btn' + (busy ? ' loading' : '')} type="submit" aria-busy={busy ? 'true' : 'false'}>
      <span className="lbl">{label}</span>
      <span className="spin"><i /></span>
    </button>
  );

  return (
    <div className={'lgw solo' + (dark ? ' dark' : '') + (en ? ' en' : '')} dir={en ? 'ltr' : 'rtl'} lang={en ? 'en' : 'ar'}>
      <ZohoSalesIq hideLauncher />
      <div className="page">
        <section className="side-form">
          <div className="gridbg" aria-hidden="true" /><div className="orb" aria-hidden="true" />
          <AuthTopbar en={en} onToggleLang={toggleLang} onToggleTheme={toggleTheme} />

          <main className="center">
            <div className="card reveal">

              {step === 'email' && (
                <>
                  <h1>{t.h1}</h1>
                  <p className="sub">{t.sub1}</p>
                  <form noValidate onSubmit={(e) => { e.preventDefault(); requestCode(false); }}>
                    <div className={'field' + (bad.email ? ' invalid' : '')}>
                      <label htmlFor="email"><span>{t.email}</span> <i>*</i></label>
                      <div className="ctrl">
                        <input id="email" name="email" type="email" dir="ltr" placeholder="name@company.com" autoComplete="username" inputMode="email" autoFocus
                          value={email} onChange={(e) => { setEmail(e.target.value); if (bad.email) setBad({}); }} />
                      </div>
                      <div className="hint"><span>{t.eEmail}</span></div>
                    </div>
                    {errBox}
                    {submitBtn(t.send)}
                  </form>
                </>
              )}

              {step === 'code' && (
                <>
                  <h1>{t.h2}</h1>
                  <p className="sub">{t.sent(email)} <button type="button" className="link" onClick={() => { setStep('email'); setErr(null); setBad({}); setCode(''); }}>{t.change}</button></p>
                  <form noValidate onSubmit={submitReset}>
                    <div className={'field' + (bad.code ? ' invalid' : '')}>
                      <label htmlFor="code"><span>{t.code}</span> <i>*</i></label>
                      <div className="ctrl code">
                        <input id="code" name="code" ref={codeRef} dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••"
                          value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (bad.code) setBad((b) => ({ ...b, code: false })); }} />
                      </div>
                      <div className="hint"><span>{t.eCode}</span></div>
                    </div>
                    <div className={'field' + (bad.pass ? ' invalid' : '')}>
                      <label htmlFor="pass"><span>{t.pass}</span> <i>*</i></label>
                      <div className="ctrl">
                        <input id="pass" name="new-password" ref={passRef} type={pw ? 'text' : 'password'} dir="ltr" placeholder="••••••••" autoComplete="new-password" maxLength={72}
                          value={password} onChange={(e) => { setPassword(e.target.value); if (bad.pass) setBad((b) => ({ ...b, pass: false })); }}
                          onKeyDown={capsKey} onKeyUp={capsKey} onBlur={() => caps && setCaps(false)} />
                        <button type="button" className="icon-btn" aria-label={pw ? t.hidePass : t.showPass}
                          onClick={() => { setPw((v) => !v); setTimeout(() => passRef.current?.focus(), 0); }}>
                          <EyeIcon off={pw} />
                        </button>
                      </div>
                      {!bad.pass && <p className="help">{t.passHelp}</p>}
                      <div className="hint"><span>{t.ePass}</span></div>
                      <div className={'hint warn' + (caps ? ' show' : '')}><span>{t.caps}</span></div>
                    </div>
                    {errBox}
                    {resent && !err && <div className="form-ok" role="status">{t.resent}</div>}
                    {submitBtn(t.save)}
                  </form>
                  <p className="sublink">
                    <span>{t.noCode}</span>{' '}
                    <button type="button" className="link" disabled={wait > 0 || busy} onClick={() => requestCode(true)}>
                      {wait > 0 ? t.resendIn(wait) : t.resend}
                    </button>
                  </p>
                  <p className="help center-txt">{t.help} <a className="link" href="tel:920006900"><bdi dir="ltr">920006900</bdi></a></p>
                </>
              )}

              {step === 'done' && (
                <div className="done-box">
                  <span className="ok-ring" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
                  </span>
                  <h1>{t.doneH}</h1>
                  <p className="sub">{t.doneP}</p>
                  <a className="btn as-link" href="/login"><span className="lbl">{t.login}</span></a>
                </div>
              )}

              {step !== 'done' && <p className="sublink"><a href="/login">{t.back}</a></p>}
            </div>
          </main>

          <AuthLegal en={en} />
        </section>
      </div>
    </div>
  );
}
