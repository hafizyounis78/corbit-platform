"use client";

import { Card, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useHelpContact } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";
import { Icon } from "@/components/icons/icon";

/**
 * Live chat placeholder — the underlying chat infrastructure isn't
 * wired up yet (would need a separate WS connection to Corbit's own
 * support inbox), so we surface a clear "coming soon" panel that
 * funnels users to the WhatsApp + tickets channels in the meantime.
 */
export function LiveChatPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { data: contact } = useHelpContact();
  const whatsappUrl = (contact as any)?.whatsapp?.url ?? "https://wa.me/966500001234";

  return (
    <Card style={{ padding: 32, textAlign: "center" }}>
      <div style={{ marginBottom: 14, display: "flex", justifyContent: "center", color: C.pri }}><Icon name="msg" size={48} /></div>
      <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700 }}>
        {isAr ? "محادثة الدعم الفوريّة — قريباً" : "Live Chat — Coming Soon"}
      </h2>
      <p style={{
        margin: "0 auto 20px", fontSize: 13.5, color: C.t2,
        maxWidth: 480, lineHeight: 1.7,
      }}>
        {isAr
          ? "نعمل على إطلاق المحادثة الفوريّة مع فريق الدعم الفنّي مباشرة من هنا. حالياً، أسرع طريقة للتواصل هي عبر واتساب أو فتح تذكرة."
          : "We're rolling out live chat with our support team directly from this panel. In the meantime, the fastest way to reach us is WhatsApp or opening a ticket."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 10,
            background: "#25D366", color: "#fff",
            textDecoration: "none",
            fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 600,
          }}
        >
          <Icon name="msg" size={15} />
          <span>{isAr ? "تواصل عبر واتساب" : "Chat on WhatsApp"}</span>
        </a>
        <Button outline onClick={() => {
          // Switch to the Tickets tab via the URL — the page reads
          // ?tab= on mount.
          const url = new URL(window.location.href);
          url.searchParams.set("tab", "tickets");
          window.location.href = url.toString();
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Icon name="ticket" size={14} />
            <span>{isAr ? "افتح تذكرة" : "Open Ticket"}</span>
          </span>
        </Button>
      </div>
    </Card>
  );
}
