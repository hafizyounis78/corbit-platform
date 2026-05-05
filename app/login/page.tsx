"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FONT_FAMILY } from '@/lib/constants/font';
import { COLORS, GRADIENT } from '@/lib/constants/colors';
import { WhatsBitIcon } from '@/components/shared/whatsbit-logo';
import { FONT_LATIN } from '@/lib/constants/font';

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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0B1D3A', fontFamily: FONT_FAMILY }}>
      <div style={{ color: '#8B99AD', fontSize: 15 }}>جاري التحميل...</div>
    </div>
  );

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      background: '#0B1D3A', fontFamily: FONT_FAMILY, direction: 'rtl',
    }}>
      <div style={{ width: 420, maxWidth: '90vw' }}>
        {/* Logo Area */}
        <div style={{
          background: GRADIENT, borderRadius: '20px 20px 0 0', padding: '40px 32px 32px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, opacity: 0.18, pointerEvents: 'none' }}>
            <svg viewBox="0 0 140 140" fill="none"><circle cx="70" cy="70" r="58" stroke="#fff" strokeWidth="2" fill="none"/><circle cx="70" cy="70" r="40" stroke="#fff" strokeWidth="1.4" fill="none" strokeDasharray="4 7"/></svg>
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 16, opacity: 0.22, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Array.from({ length: 3 }).map((_, r) => (
              <div key={r} style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: 5 }).map((_, c) => (
                  <div key={c} style={{ width: 4, height: 4, borderRadius: 1, background: '#fff' }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: 12 }}>
            <WhatsBitIcon size={64} variant="light" />
          </div>
          <div style={{ position: 'relative', fontSize: 32, fontWeight: 800, letterSpacing: -0.8, fontFamily: FONT_LATIN, lineHeight: 1 }}>
            <span style={{ color: '#fff' }}>Whats</span>
            <span style={{ color: '#2ECC71', fontWeight: 800 }}>Bit</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 8, position: 'relative' }}>
            منصة واتساب الأعمال المتكاملة
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: '#112240', borderRadius: '0 0 20px 20px', padding: '32px',
          border: '1px solid #1E3350', borderTop: 'none',
        }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#8B99AD', fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@corbit.sa"
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1E3350',
                background: '#1A2E4A', color: '#E8ECF0', fontSize: 14, fontFamily: FONT_FAMILY,
                outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#8B99AD', fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
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
                  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #1E3350',
                  background: '#1A2E4A', color: '#E8ECF0', fontSize: 14, fontFamily: FONT_FAMILY,
                  outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#8B99AD', cursor: 'pointer', fontSize: 13,
                }}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#FF5A5F15', color: '#FF5A5F', padding: '10px 14px', borderRadius: 10,
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
                background: 'none', border: 'none', color: COLORS.pri, fontSize: 12,
                cursor: 'pointer', fontFamily: FONT_FAMILY,
              }}
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 20, borderTop: '1px solid #1E3350', fontSize: 13, color: '#8B99AD' }}>
            ليس لديك حساب؟{' '}
            <a
              href="/register"
              style={{ color: COLORS.pri, textDecoration: 'none', fontWeight: 600 }}
            >
              أنشئ حسابك الآن
            </a>
          </div>

          {/* Legal footer — Privacy + Terms required by Meta WhatsApp
              Business Policy. Both pages exist (/privacy, /terms) but
              were missing visible entry points; surface them here on
              every login screen so a tenant can review before signing
              in / signing up. */}
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#6B7785', display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ color: '#8B99AD', textDecoration: 'none' }}>سياسة الخصوصيّة</a>
            <span style={{ opacity: 0.5 }}>·</span>
            <a href="/terms" style={{ color: '#8B99AD', textDecoration: 'none' }}>شروط الاستخدام</a>
            <span style={{ opacity: 0.5 }}>·</span>
            <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#8B99AD', textDecoration: 'none' }}>سياسة واتساب</a>
          </div>
        </form>
      </div>
    </div>
  );
}
