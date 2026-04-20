"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import api from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, updateUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }
    if (newPassword === currentPassword) {
      setError("كلمة المرور الجديدة يجب أن تختلف عن الحالية");
      return;
    }

    setLoading(true);
    try {
      await api.post(API.AUTH.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      updateUser({ mustChangePassword: false });
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0C0E14", fontFamily: FONT_FAMILY, color: "#8B8D97" }}>
        جاري التحميل...
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0C0E14", fontFamily: FONT_FAMILY, padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#14171F", borderRadius: 16, padding: 32, border: "1px solid #22262F" }}>
        <div style={{ height: 3, background: GRADIENT, borderRadius: 2, marginBottom: 24 }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, marginBottom: 8 }}>تغيير كلمة المرور</h1>
        <p style={{ fontSize: 13, color: "#8B8D97", margin: 0, marginBottom: 24, lineHeight: 1.6 }}>
          {user.mustChangePassword
            ? "مطلوب تغيير كلمة المرور المؤقتة قبل متابعة استخدام المنصة."
            : "أدخل كلمة المرور الحالية ثم كلمة المرور الجديدة."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="كلمة المرور الحالية">
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={inputStyle} />
          </Field>
          <Field label="كلمة المرور الجديدة">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} style={inputStyle} />
          </Field>
          <Field label="تأكيد كلمة المرور الجديدة">
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} style={inputStyle} />
          </Field>

          {error ? (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "#E8485520", border: "1px solid #E8485540", color: "#FFB3B8", fontSize: 12.5 }}>{error}</div>
          ) : null}

          <button type="submit" disabled={loading} style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: GRADIENT,
            color: "#fff",
            fontFamily: FONT_FAMILY,
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginTop: 4,
          }}>
            {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#B3B5BC", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #22262F",
  background: "#0C0E14",
  color: "#fff",
  fontSize: 13,
  fontFamily: FONT_FAMILY,
  outline: "none",
  boxSizing: "border-box",
};
