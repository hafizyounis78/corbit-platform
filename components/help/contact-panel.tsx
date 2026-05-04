"use client";

import { Card } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";

/**
 * Three-card grid with the public-facing contact channels for
 * Corbit's own support team. The numbers + email here are the
 * Corbit company contacts (not the tenant's), so they live in code
 * for now — moving them to env or platform_settings is a small
 * follow-up if marketing wants to A/B different numbers.
 */
export function ContactPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  const cards = [
    {
      icon: "📱",
      bg: "#25D366",
      title: "WhatsApp",
      desc: isAr ? "تواصل معنا مباشرة عبر واتساب" : "Chat with us on WhatsApp",
      action: isAr ? "افتح المحادثة" : "Open Chat",
      href: "https://wa.me/966500001234", // TODO: replace with the real Corbit support number
      value: "+966 50 000 1234",
    },
    {
      icon: "📞",
      bg: C.pri,
      title: isAr ? "اتصال هاتفي" : "Phone Call",
      desc: isAr ? "الأحد – الخميس، 9 صباحاً – 6 مساءً" : "Sun–Thu, 9 AM – 6 PM",
      action: isAr ? "اتصل الآن" : "Call Now",
      href: "tel:+96611000567",
      value: "+966 11 000 5678",
    },
    {
      icon: "📧",
      bg: C.info,
      title: isAr ? "البريد الإلكتروني" : "Email",
      desc: isAr ? "نردّ خلال 4 ساعات عمل" : "Response within 4 business hours",
      action: isAr ? "أرسل بريداً" : "Send Email",
      href: "mailto:support@corbit.sa",
      value: "support@corbit.sa",
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
