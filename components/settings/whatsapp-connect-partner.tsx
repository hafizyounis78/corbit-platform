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
  messaging_tier?: string;
  daily_send_cap?: number;
  used_today?: number;
  metrics_updated_at?: string | null;
};

const QUALITY_COLOR: Record<string, string> = {
  green:  '#10B981',
  yellow: '#F59E0B',
  red:    '#EF4444',
  unknown:'#9CA3AF',
};

// Map our normalized tier (tier_0..tier_4) to a human label.
const TIER_LABEL: Record<string, { en: string; ar: string }> = {
  tier_0: { en: '250/day',          ar: '250/يوم' },
  tier_1: { en: '1,000/day',        ar: '1,000/يوم' },
  tier_2: { en: '10,000/day',       ar: '10,000/يوم' },
  tier_3: { en: '100,000/day',      ar: '100,000/يوم' },
  tier_4: { en: 'Unlimited',        ar: 'غير محدود' },
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
                {status.messaging_tier && TIER_LABEL[status.messaging_tier] && (
                  <Badge color="#6366F1">
                    {isAr ? 'الحدّ: ' : 'Tier: '}
                    {isAr ? TIER_LABEL[status.messaging_tier].ar : TIER_LABEL[status.messaging_tier].en}
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

          {/* 24h messaging window usage. Hidden when the tier is unlimited
              (cap === -1) — there's nothing useful to show. used_today
              counts unique outbound recipients in the last 24h, matching
              Meta's quota model. */}
          {typeof status.daily_send_cap === 'number' && status.daily_send_cap > 0 && (
            (() => {
              const cap = status.daily_send_cap;
              const used = status.used_today ?? 0;
              const pct = Math.min(100, Math.round((used / cap) * 100));
              const warn = pct >= 80;
              const barColor = warn ? '#EF4444' : '#10B981';
              return (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.bd}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.t2, fontWeight: 600 }}>
                      {isAr ? 'المُرسَل خلال 24 ساعة' : 'Sent in last 24h'}
                    </span>
                    <span style={{ fontSize: 12.5, color: C.txt, fontFamily: 'monospace', direction: 'ltr' }}>
                      {used.toLocaleString()} / {cap.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 8, background: C.bd, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 300ms' }} />
                  </div>
                  {status.metrics_updated_at && (
                    <div style={{ fontSize: 10.5, color: C.t3, marginTop: 6 }}>
                      {isAr ? 'آخر تحديث للجودة: ' : 'Quality updated: '}
                      {new Date(status.metrics_updated_at).toLocaleString(isAr ? 'ar' : 'en')}
                    </div>
                  )}
                </div>
              );
            })()
          )}
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
