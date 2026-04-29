"use client";
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import api from '@/lib/api/client';
import { FONT_FAMILY } from '@/lib/constants/font';
import { GRADIENT } from '@/lib/constants/colors';

function OtpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { finalizeLoginFromVerify } = useAuth();

  const [userId, setUserId] = useState<string>('');
  const [phoneMasked, setPhoneMasked] = useState<string>('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Pull user_id + phone mask from sessionStorage (set by /login) or fall
  // back to ?u= in the URL. If neither is present, the user reached this
  // page directly without authenticating — bounce back to login.
  useEffect(() => {
    let stashed: { userId?: string; phoneMasked?: string } = {};
    try {
      const raw = sessionStorage.getItem('otp_pending');
      if (raw) stashed = JSON.parse(raw);
    } catch { /* ignore */ }
    const uid = stashed.userId || params.get('u') || '';
    if (!uid) {
      router.replace('/login');
      return;
    }
    setUserId(uid);
    setPhoneMasked(stashed.phoneMasked ?? '');
  }, [params, router]);

  // Countdown for the "إعادة إرسال" button.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const setDigit = (idx: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length === 0) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const full = code.join('');
    if (full.length !== 6) {
      setError('أدخل الرمز كاملاً (6 أرقام)');
      return;
    }
    setError('');
    setInfo('');
    setVerifying(true);
    try {
      const res = await api.post('/auth/otp/verify', { user_id: userId, code: full });
      const data = res.data?.data ?? {};
      if (!data.token || !data.user) {
        setError('استجابة غير متوقّعة من الخادم');
        return;
      }
      finalizeLoginFromVerify({ token: data.token, user: data.user });
      try { sessionStorage.removeItem('otp_pending'); } catch { /* ignore */ }
      router.replace(data.user.mustChangePassword ? '/auth/change-password' : '/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'الرمز غير صحيح أو منتهٍ');
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0 || resending) return;
    setError('');
    setInfo('');
    setResending(true);
    try {
      await api.post('/auth/otp/resend', { user_id: userId });
      setInfo('تمّ إعادة إرسال الرمز إلى جوّالك');
      setResendCooldown(30);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'تعذّر إعادة الإرسال');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      background: '#0C0E14', fontFamily: FONT_FAMILY, direction: 'rtl',
    }}>
      <div style={{ width: 420, maxWidth: '90vw' }}>
        <div style={{
          background: GRADIENT, borderRadius: '20px 20px 0 0', padding: '36px 32px 26px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>التحقّق</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 8 }}>
            أدخل الرمز المرسل إلى جوّالك
          </div>
          {phoneMasked && (
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, direction: 'ltr' }}>
              {phoneMasked}
            </div>
          )}
        </div>

        <form onSubmit={submit} style={{
          background: '#141721', borderRadius: '0 0 20px 20px', padding: '32px',
          border: '1px solid #1E2233', borderTop: 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, direction: 'ltr', marginBottom: 20 }}>
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                style={{
                  width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 600,
                  borderRadius: 10, border: '1px solid #1E2233', background: '#1A1E2E',
                  color: '#E8E6E3', fontFamily: FONT_FAMILY, outline: 'none',
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{
              background: '#E8485515', color: '#E84855', padding: '10px 14px', borderRadius: 10,
              fontSize: 13, marginBottom: 12, textAlign: 'center',
            }}>{error}</div>
          )}
          {info && (
            <div style={{
              background: '#22C55E15', color: '#22C55E', padding: '10px 14px', borderRadius: 10,
              fontSize: 13, marginBottom: 12, textAlign: 'center',
            }}>{info}</div>
          )}

          <button
            type="submit"
            disabled={verifying}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: verifying ? '#555' : GRADIENT, color: '#fff', fontSize: 15,
              fontWeight: 600, fontFamily: FONT_FAMILY, cursor: verifying ? 'not-allowed' : 'pointer',
              opacity: verifying ? 0.7 : 1,
            }}
          >
            {verifying ? 'جاري التحقّق...' : 'تحقّق ودخول'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12.5, color: '#8B8D97' }}>
            ما وصلك الرمز؟{' '}
            <button
              type="button"
              onClick={resend}
              disabled={resendCooldown > 0 || resending}
              style={{
                background: 'none', border: 'none',
                color: resendCooldown > 0 ? '#555' : '#E8713A',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                fontFamily: FONT_FAMILY, fontSize: 12.5, fontWeight: 600, padding: 0,
              }}
            >
              {resendCooldown > 0 ? `إعادة الإرسال (${resendCooldown})` : 'إعادة الإرسال'}
            </button>
          </div>

          <div style={{
            textAlign: 'center', marginTop: 20, paddingTop: 18,
            borderTop: '1px solid #1E2233', fontSize: 12.5, color: '#8B8D97',
          }}>
            <a href="/login" style={{ color: '#E8713A', textDecoration: 'none', fontWeight: 600 }}>
              العودة لتسجيل الدخول
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpInner />
    </Suspense>
  );
}
