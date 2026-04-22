"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import api from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("كلمة المرور يجب ألا تقل عن 8 أحرف");
      return;
    }
    if (password !== passwordConfirm) {
      setError("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }
    if (!acceptedTerms) {
      setError("يجب الموافقة على الشروط وسياسة الاستخدام للمتابعة");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(API.AUTH.REGISTER, {
        companyName: companyName.trim(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: passwordConfirm,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      });

      const { token, user } = res.data.data;
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
      }
      window.location.href = "/dashboard";
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const errorMap: Record<string, string> = {
        "The email has already been taken.": "البريد الإلكتروني مستخدم بالفعل",
        "The email field is required.": "حقل البريد الإلكتروني مطلوب",
        "The name field is required.": "حقل الاسم مطلوب",
        "The phone field is required.": "حقل رقم الجوال مطلوب",
        "The company name field is required.": "حقل اسم الشركة مطلوب",
        "The password field is required.": "حقل كلمة المرور مطلوب",
        "The password field confirmation does not match.": "تأكيد كلمة المرور غير مطابق",
      };
      setError(errorMap[msg] || msg || "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0C0E14", fontFamily: FONT_FAMILY }}>
        <div style={{ color: "#8B8D97", fontSize: 15 }}>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0C0E14",
        fontFamily: FONT_FAMILY,
        direction: "rtl",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: 460, maxWidth: "92vw" }}>
        {/* Logo Area */}
        <div
          style={{
            background: GRADIENT,
            borderRadius: "20px 20px 0 0",
            padding: "32px 32px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>CORBIT</div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 }}>المدار</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 }}>
            أنشئ حساب جديد لشركتك
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#141721",
            borderRadius: "0 0 20px 20px",
            padding: "28px 32px 32px",
            border: "1px solid #1E2233",
            borderTop: "none",
          }}
        >
          <Field label="اسم الشركة">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="شركة الأفق الرقمي"
              required
              style={inputStyle}
            />
          </Field>

          <Field label="اسمك الكامل">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="عبدالرحمن السعيد"
              required
              style={inputStyle}
            />
          </Field>

          <Field label="البريد الإلكتروني">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.sa"
              required
              style={{ ...inputStyle, direction: "ltr" }}
            />
          </Field>

          <Field label="رقم الجوال (واتساب + SMS)">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9665xxxxxxxx"
              required
              style={{ ...inputStyle, direction: "ltr" }}
            />
          </Field>

          <Field label="كلمة المرور">
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="على الأقلّ 8 أحرف"
                required
                minLength={8}
                style={{ ...inputStyle, direction: "ltr" }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#8B8D97",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </Field>

          <Field label="تأكيد كلمة المرور">
            <input
              type={showPw ? "text" : "password"}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              required
              minLength={8}
              style={{ ...inputStyle, direction: "ltr" }}
            />
          </Field>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 12.5,
              color: "#B8BAC3",
              lineHeight: 1.7,
              marginTop: 6,
              marginBottom: 16,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
              style={{
                marginTop: 3,
                width: 16,
                height: 16,
                accentColor: "#E8713A",
                flexShrink: 0,
                cursor: "pointer",
              }}
            />
            <span>
              أوافق على{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#E8713A", textDecoration: "none", fontWeight: 600 }}
              >
                شروط الاستخدام
              </a>
              {" "}و{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#E8713A", textDecoration: "none", fontWeight: 600 }}
              >
                سياسة الخصوصية
              </a>
              {" "}و{" "}
              <a
                href="https://business.whatsapp.com/policy"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#E8713A", textDecoration: "none", fontWeight: 600 }}
              >
                سياسة WhatsApp Business
              </a>
              ، وألتزم بالحصول على موافقة صريحة من العملاء قبل إرسال أي رسائل تسويقية.
            </span>
          </label>

          {error ? (
            <div
              style={{
                background: "#E8485515",
                color: "#E84855",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 10,
              border: "none",
              background: (loading || !acceptedTerms) ? "#555" : GRADIENT,
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: FONT_FAMILY,
              cursor: (loading || !acceptedTerms) ? "not-allowed" : "pointer",
              opacity: (loading || !acceptedTerms) ? 0.7 : 1,
              marginTop: 0,
            }}
          >
            {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
          </button>

          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid #1E2233",
              fontSize: 13,
              color: "#8B8D97",
            }}
          >
            لديك حساب بالفعل؟{" "}
            <a href="/login" style={{ color: "#E8713A", textDecoration: "none", fontWeight: 600 }}>
              سجّل دخولك
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          color: "#8B8D97",
          fontSize: 12,
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid #1E2233",
  background: "#1A1E2E",
  color: "#E8E6E3",
  fontSize: 14,
  fontFamily: FONT_FAMILY,
  outline: "none",
  boxSizing: "border-box",
  textAlign: "right",
};
