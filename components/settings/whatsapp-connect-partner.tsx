"use client";

/**
 * WhatsAppConnectPartner — partner-mode replacement for WhatsAppConnect.
 *
 * Behavior:
 *   - When the org already has an active number: shows the connected
 *     summary (display name, phone, quality rating, disconnect).
 *   - When no number exists: renders the provisioning wizard so the
 *     tenant can submit business docs through Corbit. The 360dialog
 *     account/API-key paste flow is gone — Corbit owns the partner
 *     relationship and provisions on the tenant's behalf.
 *
 * The legacy WhatsAppConnect component still exists for fallback
 * during the transition period — settings/page.tsx chooses which
 * one to render.
 */

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal } from "@/components/ui";
import { useWhatsAppStatus } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { WhatsAppProvisioningWizard } from "./whatsapp-provisioning-wizard";

type Status = {
  connected: boolean;
  phone_number?: string;
  display_phone_number?: string;
  display_name?: string;
  last_connected_at?: string | null;
  status?: string;
  quality_rating?: string;
};

const QUALITY_COLOR: Record<string, string> = {
  green:  '#10B981',
  yellow: '#F59E0B',
  red:    '#EF4444',
  unknown:'#9CA3AF',
};

export function WhatsAppConnectPartner({ showHeader = true }: { showHeader?: boolean }) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const { data: statusData, mutate } = useWhatsAppStatus();
  const status: Status = (statusData as any) || { connected: false };

  const [showDisconnect, setShowDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.post('/onboarding/whatsapp/disconnect');
      showToast(isAr ? 'تم فصل الربط' : 'Disconnected', 'success');
      setShowDisconnect(false);
      await mutate();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? 'فشل الفصل' : 'Disconnect failed'), 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div>
      {showHeader && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.txt }}>
            {isAr ? 'ربط رقم واتساب الأعمال' : 'Connect WhatsApp Business'}
          </h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>
            {isAr
              ? 'Corbit تتولّى ربط رقمك مع Meta. ما يحتاج تفتح حساب لدى أيّ مزوّد بنفسك.'
              : 'Corbit handles your number registration with Meta. No third-party provider account needed on your side.'}
          </p>
        </div>
      )}

      {status.connected ? (
        <Card style={{ padding: 20, borderInlineStart: `4px solid #10B981` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <Badge color="#10B981">{isAr ? 'متصل' : 'Connected'}</Badge>
                {status.quality_rating && status.quality_rating !== 'unknown' && (
                  <Badge color={QUALITY_COLOR[status.quality_rating] ?? C.t3}>
                    {isAr ? 'الجودة: ' : 'Quality: '}{status.quality_rating.toUpperCase()}
                  </Badge>
                )}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.txt, marginBottom: 4 }}>
                {status.display_name || status.phone_number}
              </div>
              <div style={{ fontSize: 12.5, color: C.t2, fontFamily: 'monospace', direction: 'ltr' }}>
                +{status.display_phone_number || status.phone_number}
              </div>
              {status.last_connected_at && (
                <div style={{ fontSize: 11.5, color: C.t3, marginTop: 8 }}>
                  {isAr ? 'متصل منذ: ' : 'Connected: '}
                  {new Date(status.last_connected_at).toLocaleString(isAr ? 'ar' : 'en')}
                </div>
              )}
            </div>
            <Button outline onClick={() => setShowDisconnect(true)}>
              {isAr ? 'فصل الربط' : 'Disconnect'}
            </Button>
          </div>
        </Card>
      ) : (
        <WhatsAppProvisioningWizard onClose={() => mutate()} />
      )}

      <Modal open={showDisconnect} onClose={() => setShowDisconnect(false)} title={isAr ? 'تأكيد فصل الربط' : 'Confirm disconnect'} hideFooter>
        <p style={{ fontSize: 13, color: C.t2, marginBottom: 18 }}>
          {isAr
            ? 'سيتوقّف الإرسال والاستقبال فوراً. تقدر تعيد الربط لاحقاً عبر الويزرد.'
            : 'Sending and receiving will stop immediately. You can re-onboard later via the wizard.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button outline onClick={() => setShowDisconnect(false)} disabled={disconnecting}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? (isAr ? 'جاري الفصل...' : 'Disconnecting...') : (isAr ? 'تأكيد الفصل' : 'Confirm disconnect')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
