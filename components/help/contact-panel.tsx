"use client";

import { Card, Badge } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useHelpContact, usePlanUsage } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";
import { Icon } from "@/components/icons/icon";

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

  // Plan-aware channel surfacing. The contact endpoint always
  // returns the full address book (one row per channel) — we filter
  // it here against support_channels from PlanService so lower tiers
  // don't see channels they aren't entitled to use. The phone card
  // on Basic, for example, would only confuse the user when calling
  // it gets them an "upgrade for phone support" response.
  //
  //   Basic        → ['email']
  //   Starter      → ['email', 'whatsapp']
  //   Business     → ['email', 'whatsapp', 'phone']
  //   Enterprise   → ['email', 'whatsapp', 'phone', 'priority_24_7']
  const { data: planData } = usePlanUsage();
  const supportChannels = (planData?.limits?.support_channels as string[] | undefined) ?? ['email'];
  const has24x7Priority = supportChannels.includes('priority_24_7');

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

  // Every card declares which support_channels key gates it. Filtered
  // after construction so the array literal stays readable.
  const allCards = [
    {
      channel: "whatsapp",
      icon: "msg",
      bg: "#25D366",
      title: "WhatsApp",
      desc: isAr ? "تواصل معنا مباشرة عبر واتساب" : "Chat with us on WhatsApp",
      action: isAr ? "افتح المحادثة" : "Open Chat",
      href: contact.whatsapp.url,
      value: contact.whatsapp.number,
    },
    {
      channel: "phone",
      icon: "phone",
      bg: C.pri,
      title: isAr ? "اتصال هاتفي" : "Phone Call",
      desc: pick(contact.hours),
      action: isAr ? "اتصل الآن" : "Call Now",
      href: contact.phone.url,
      value: contact.phone.number,
      // Enterprise gets a "Priority 24/7" badge on the phone card —
      // same number, but the SLA expectation is different and worth
      // calling out.
      badge: has24x7Priority
        ? (isAr ? "أولويّة 24/7" : "Priority 24/7")
        : undefined,
    },
    {
      channel: "email",
      icon: "mail",
      bg: C.info,
      title: isAr ? "البريد الإلكتروني" : "Email",
      desc: pick(contact.email_sla),
      action: isAr ? "أرسل بريداً" : "Send Email",
      href: contact.email.url,
      value: contact.email.address,
    },
  ];

  const cards = allCards.filter((c) => supportChannels.includes(c.channel));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
      {cards.map((c) => (
        <Card key={c.title} style={{ padding: 24, textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: `${c.bg}15`,
            color: c.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <Icon name={c.icon} size={28} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>{c.title}</h3>
          {c.badge && (
            <div style={{ marginBottom: 8 }}>
              <Badge color="#10b981">{c.badge}</Badge>
            </div>
          )}
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
