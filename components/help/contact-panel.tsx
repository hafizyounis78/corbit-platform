"use client";

import { Card } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useHelpContact } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";

interface ContactPayload {
  whatsapp:  { number: string; url: string };
  phone:     { number: string; url: string };
  email:     { address: string; url: string };
  hours:     { ar?: string | null; en?: string | null };
  email_sla: { ar?: string | null; en?: string | null };
}

/**
 * Three-card grid for Corbit's own support channels. Reads the
 * singleton support_contact_settings row via /api/help/contact so
 * marketing can flip the WhatsApp number without a deploy.
 */
export function ContactPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { data, isLoading } = useHelpContact();
  const contact = data as ContactPayload | null;

  const pick = (loc?: { ar?: string | null; en?: string | null } | null): string => {
    if (!loc) return "";
    if (isAr) return (loc.ar ?? loc.en ?? "");
    return (loc.en ?? loc.ar ?? "");
  };

  if (isLoading || !contact) {
    return (
      <div style={{ padding: "40px 18px", textAlign: "center", color: C.t3, fontSize: 13 }}>
        {isAr ? "جاري التحميل..." : "Loading..."}
      </div>
    );
  }

  const cards = [
    {
      icon: "📱",
      bg: "#25D366",
      title: "WhatsApp",
      desc: isAr ? "تواصل معنا مباشرة عبر واتساب" : "Chat with us on WhatsApp",
      action: isAr ? "افتح المحادثة" : "Open Chat",
      href: contact.whatsapp.url,
      value: contact.whatsapp.number,
    },
    {
      icon: "📞",
      bg: C.pri,
      title: isAr ? "اتصال هاتفي" : "Phone Call",
      desc: pick(contact.hours),
      action: isAr ? "اتصل الآن" : "Call Now",
      href: contact.phone.url,
      value: contact.phone.number,
    },
    {
      icon: "📧",
      bg: C.info,
      title: isAr ? "البريد الإلكتروني" : "Email",
      desc: pick(contact.email_sla),
      action: isAr ? "أرسل بريداً" : "Send Email",
      href: contact.email.url,
      value: contact.email.address,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
      {cards.map((c) => (
        <Card key={c.title} style={{ padding: 24, textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: `${c.bg}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 12px",
          }}>
            {c.icon}
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>{c.title}</h3>
          <p style={{ fontSize: 12.5, color: C.t2, margin: "0 0 10px", lineHeight: 1.6 }}>
            {c.desc}
          </p>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.bg, marginBottom: 14, direction: "ltr" }}>
            {c.value}
          </div>
          <a
            href={c.href}
            target={c.href.startsWith("http") ? "_blank" : undefined}
            rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
            style={{
              display: "inline-block",
              padding: "8px 18px", borderRadius: 10,
              background: c.bg, color: "#fff",
              textDecoration: "none",
              fontFamily: FONT_FAMILY, fontSize: 12.5, fontWeight: 600,
            }}
          >
            {c.action}
          </a>
        </Card>
      ))}
    </div>
  );
}
