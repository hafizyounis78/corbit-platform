"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FONT_FAMILY } from '@/lib/constants/font';
import { GRADIENT } from '@/lib/constants/colors';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      router.replace('/dashboard');
    } else if (result.otpRequired && result.userId) {
      // 2FA gate: stash the user_id + masked phone so the OTP page can
      // render context without us passing them through router state.
      try {
        sessionStorage.setItem('otp_pending', JSON.stringify({
          userId: result.userId,
          phoneMasked: result.phoneMasked ?? '',
        }));
      } catch { /* sessionStorage not available — page will fall back to query string */ }
      router.replace(`/auth/otp?u=${encodeURIComponent(result.userId)}`);
    } else {
      setError(result.error || 'فشل تسجيل الدخول');
    }
    setLoading(false);
  };

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0C0E14', fontFamily: FONT_FAMILY }}>
      <div style={{ color: '#8B8D97', fontSize: 15 }}>جاري التحميل...</div>
    </div>
  );

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      background: '#0C0E14', fontFamily: FONT_FAMILY, direction: 'rtl',
    }}>
      <div style={{ width: 420, maxWidth: '90vw' }}>
        {/* Logo Area */}
        <div style={{
          background: GRADIENT, borderRadius: '20px 20px 0 0', padding: '40px 32px 30px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>CORBIT</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 }}>المدار</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
            منصة واتساب الأعمال المتكاملة
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: '#141721', borderRadius: '0 0 20px 20px', padding: '32px',
          border: '1px solid #1E2233', borderTop: 'none',
        }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#8B8D97', fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@corbit.sa"
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1E2233',
                background: '#1A1E2E', color: '#E8E6E3', fontSize: 14, fontFamily: FONT_FAMILY,
                outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#8B8D97', fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1E2233',
                  background: '#1A1E2E', color: '#E8E6E3', fontSize: 14, fontFamily: FONT_FAMILY,
                  outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#8B8D97', cursor: 'pointer', fontSize: 13,
                }}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#E8485515', color: '#E84855', padding: '10px 14px', borderRadius: 10,
              fontSize: 13, marginBottom: 16, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: loading ? '#555' : GRADIENT, color: '#fff', fontSize: 15,
              fontWeight: 600, fontFamily: FONT_FAMILY, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              style={{
                background: 'none', border: 'none', color: '#E8713A', fontSize: 12,
                cursor: 'pointer', fontFamily: FONT_FAMILY,
              }}
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid #1E2233', fontSize: 13, color: '#8B8D97' }}>
            ليس لديك حساب؟{' '}
            <a
              href="/register"
              style={{ color: '#E8713A', textDecoration: 'none', fontWeight: 600 }}
            >
              أنشئ حسابك الآن
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
