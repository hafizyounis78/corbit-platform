"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import api from "@/lib/api/client";

// The 360dialog Connect Button touches `window` on click, so it must
// only ever render on the client — dynamic import with ssr:false keeps
// Next from evaluating it during server rendering.
const ConnectButton = dynamic(
  () => import("360dialog-connect-button").then((m) => m.ConnectButton),
  { ssr: false }
);

const ENV_PARTNER_ID = process.env.NEXT_PUBLIC_DIALOG360_PARTNER_ID || "";

type CallbackObject = {
  client?: string;
  channels?: string[];
  revokedChannels?: string[];
};

/**
 * Integrated Onboarding entry point.
 *
 * Renders the 360dialog Connect Button which opens Meta's Embedded
 * Signup in a popup — the client logs in with Facebook, picks/verifies
 * their number, and the channel lands under Corbit's partner account.
 * The whole flow stays inside our platform; nobody visits the 360dialog
 * Hub. On success we hand the returned channel ids to the backend
 * (partner-finalize) which mints the messaging key and activates the
 * number for this org.
 */
export function WhatsAppConnectEmbedded({
  partnerId,
  requestedNumber,
  onConnected,
}: {
  partnerId?: string;
  requestedNumber?: string;
  onConnected?: () => void;
}) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const [finalizing, setFinalizing] = useState(false);

  // Prefer the partner id the backend hands us at runtime (single source
  // of truth, always present once DIALOG360_PARTNER_ID is set on the
  // server). Fall back to the build-time NEXT_PUBLIC var if provided.
  const resolvedPartnerId = partnerId || ENV_PARTNER_ID;

  const handleCallback = async (cb: CallbackObject) => {
    const channels = (cb?.channels || []).filter(Boolean);
    if (!channels.length) {
      showToast(
        isAr ? "لم يكتمل الربط — لم تُستلم أي قناة" : "Onboarding incomplete — no channel returned",
        "error"
      );
      return;
    }
    setFinalizing(true);
    try {
      await api.post("/onboarding/whatsapp/partner-finalize", {
        client: cb.client,
        channels,
      });
      showToast(isAr ? "🎉 تمّ ربط رقم واتساب بنجاح!" : "🎉 WhatsApp number connected!", "success");
      onConnected?.();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message;
      showToast((isAr ? "فشل إكمال الربط: " : "Finalize failed: ") + msg, "error");
    } finally {
      setFinalizing(false);
    }
  };

  if (!resolvedPartnerId) {
    return (
      <Card style={{ padding: 16, marginBottom: 14, borderRight: `4px solid #f59e0b` }}>
        <div style={{ fontSize: 13, color: C.t2 }}>
          {isAr
            ? "الربط التلقائي غير مهيّأ (لم يصل معرّف الشريك من الخادم)."
            : "Automatic connection is not configured (partner id not provided by the server)."}
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 18, marginBottom: 14, borderRight: `4px solid ${C.pri}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <Badge color={C.pri}>{isAr ? "موصى به" : "Recommended"}</Badge>
        <strong style={{ fontSize: 15, color: C.txt }}>
          {isAr ? "ربط واتساب في خطوة واحدة" : "Connect WhatsApp in one step"}
        </strong>
      </div>
      <p style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.7, margin: "0 0 14px" }}>
        {isAr
          ? "اضغط الزرّ وسجّل دخول بحساب Facebook الخاص بنشاطك، اختر رقمك وأكّده — والباقي علينا. كل العمليّة من خلال المنصّة، بدون أي إعدادات يدويّة."
          : "Click the button, log in with your business Facebook account, pick and verify your number — we handle the rest. Entirely in-platform, no manual setup."}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <ConnectButton
          partnerId={resolvedPartnerId}
          {...(requestedNumber ? { requestedNumber } : {})}
          callback={handleCallback}
          label={isAr ? "ربط واتساب الأعمال" : "Connect WhatsApp Business"}
          style={{
            background: C.pri,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "11px 20px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            opacity: finalizing ? 0.6 : 1,
            pointerEvents: finalizing ? "none" : "auto",
          }}
        />
        {finalizing && (
          <span style={{ fontSize: 12.5, color: C.t2, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="loader" size={14} />
            {isAr ? "جارٍ إكمال الربط..." : "Finalizing..."}
          </span>
        )}
      </div>
    </Card>
  );
}
