"use client";

import { useState } from "react";
import { Modal, Button, Badge } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";

export interface CredentialsData {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
  loginUrl: string;
  notification?: { sent: boolean; channel: string; detail?: string };
}

interface Props {
  open: boolean;
  data: CredentialsData | null;
  onClose: () => void;
  title?: string;
}

export function CredentialsModal({ open, data, onClose, title }: Props) {
  const { colors: C } = useTheme();
  const { isAr: ar } = useLocale();
  const [copied, setCopied] = useState<string | null>(null);

  if (!data) return null;

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {}
  };

  const copyAll = () => {
    const lines = [
      `${ar ? "الاسم" : "Name"}: ${data.name}`,
      `${ar ? "البريد" : "Email"}: ${data.email}`,
      data.phone ? `${ar ? "الجوال" : "Phone"}: ${data.phone}` : null,
      `${ar ? "كلمة المرور" : "Password"}: ${data.password}`,
      `${ar ? "رابط الدخول" : "Login"}: ${data.loginUrl}`,
    ].filter(Boolean).join("\n");
    copy(lines, "all");
  };

  const sent = !!data.notification?.sent;
  const channel = data.notification?.channel || "none";

  const row = (label: string, value: string, key: string, mono = false) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: C.bg, borderRadius: 10, border: `1px solid ${C.brd}` }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: C.t3, minWidth: 90 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: C.txt, fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : FONT_FAMILY, direction: "ltr", textAlign: "left", wordBreak: "break-all" }}>{value}</div>
      <Button small outline onClick={() => copy(value, key)}>{copied === key ? (ar ? "تم النسخ" : "Copied") : (ar ? "نسخ" : "Copy")}</Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || (ar ? "بيانات الدخول" : "Login Credentials")}
      submitLabel={ar ? "تم" : "Done"}
      onSubmit={onClose}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ padding: "10px 12px", borderRadius: 8, background: `${C.warn || "#F5A623"}15`, border: `1px solid ${C.warn || "#F5A623"}40`, fontSize: 12.5, color: C.txt }}>
          {ar
            ? "⚠️ انسخ هذه البيانات الآن — لن تظهر كلمة المرور مرة أخرى."
            : "⚠️ Copy these credentials now — the password will not be shown again."}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {row(ar ? "الاسم" : "Name", data.name, "name")}
          {row(ar ? "البريد" : "Email", data.email, "email", true)}
          {data.phone ? row(ar ? "الجوال" : "Phone", data.phone, "phone", true) : null}
          {row(ar ? "كلمة المرور" : "Password", data.password, "password", true)}
          {row(ar ? "رابط الدخول" : "Login URL", data.loginUrl, "login", true)}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <div style={{ fontSize: 12, color: C.t2, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{ar ? "حالة الواتساب:" : "WhatsApp:"}</span>
            {channel === "whatsapp" && sent ? (
              <Badge color="#34C77B">{ar ? "تم الإرسال" : "Sent"}</Badge>
            ) : channel === "whatsapp" ? (
              <Badge color="#E84855">{ar ? "فشل الإرسال" : "Send failed"}</Badge>
            ) : (
              <Badge color={C.t3}>{ar ? "معطّل (تسجيل فقط)" : "Log-only"}</Badge>
            )}
          </div>
          <Button small onClick={copyAll}>{copied === "all" ? (ar ? "تم نسخ الكل" : "All copied") : (ar ? "نسخ الكل" : "Copy all")}</Button>
        </div>
      </div>
    </Modal>
  );
}
