"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useWhatsAppStatus } from "@/lib/api/hooks";
import { WhatsAppConnectEmbedded } from "@/components/settings/whatsapp-connect-embedded";
import api from "@/lib/api/client";

type Status = {
  connected: boolean;
  phone_number?: string;
  display_phone_number?: string;
  display_name?: string;
  phone_number_id?: string;
  waba_id?: string;
  last_connected_at?: string | null;
  status?: string;
  has_api_key?: boolean;
  // 'api_key_decrypt_failed' = the encrypted blob is in DB but the
  // current APP_KEY can't decrypt it (key was rotated). The customer
  // must reconnect so the api_key gets re-encrypted with the new key.
  key_error?: string | null;
  // Meta WABA health metrics — populated by the daily sync job that
  // polls 360dialog. Null on a fresh number until the first sync.
  quality_rating?: string | null;
  messaging_tier?: string | null;
  daily_send_cap?: number | null;
  used_today?: number | null;
  metrics_updated_at?: string | null;
  // Partner config surfaced by the backend so the embedded Connect
  // Button gets the partner id at runtime (no build-time env needed).
  partner_enabled?: boolean;
  partner_id?: string;
};

const QUALITY_COLOR: Record<string, string> = {
  green:  '#10b981',
  yellow: '#f59e0b',
  red:    '#ef4444',
  unknown:'#9ca3af',
};

// Normalized tier (tier_0..tier_4) → human-readable daily cap label.
const TIER_LABEL: Record<string, { en: string; ar: string }> = {
  tier_0: { en: '250/day',     ar: '250/يوم' },
  tier_1: { en: '1,000/day',   ar: '1,000/يوم' },
  tier_2: { en: '10,000/day',  ar: '10,000/يوم' },
  tier_3: { en: '100,000/day', ar: '100,000/يوم' },
  tier_4: { en: 'Unlimited',   ar: 'غير محدود' },
};

export function WhatsAppConnect({ showHeader = true }: { showHeader?: boolean }) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const { data: statusData, mutate } = useWhatsAppStatus();
  const status: Status = (statusData as any) || { connected: false };

  const [showDisconnect, setShowDisconnect] = useState(false);

  const handleDisconnect = async () => {
    try {
      await api.post('/onboarding/whatsapp/disconnect');
      showToast(isAr ? "تمّ فصل الربط" : "Disconnected", "success");
      setShowDisconnect(false);
      mutate();
    } catch (e: any) {
      showToast(isAr ? "فشل الفصل" : "Disconnect failed", "error");
    }
  };

  return (
    <div>
      {showHeader && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
            {isAr ? "ربط رقم واتساب الأعمال" : "Connect WhatsApp Business"}
          </h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>
            {isAr
              ? "اربط رقم واتساب أعمالك بـ Corbit لتبدأ استقبال وإرسال الرسائل"
              : "Connect your WhatsApp Business number to Corbit to start sending and receiving"}
          </p>
        </div>
      )}

      {/* APP_KEY rotation banner — the encrypted blob is in DB but
          can't be decrypted with the current key, so sends will fail
          with "WhatsApp number not connected". The fix is one click:
          disconnect + reconnect. Surfaced as its own banner so the
          customer sees a clear explanation instead of generic "Not
          Connected" or a confused "Connected but nothing works". */}
      {!status.connected && status.key_error === 'api_key_decrypt_failed' && (
        <Card style={{ padding: 16, marginBottom: 14, borderRight: `4px solid #ef4444`, background: `#ef444410` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ color: "#ef4444", display: "flex" }}><Icon name="lock" size={22} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, marginBottom: 4 }}>
                {isAr ? "مفتاح التشفير لا يطابق الربط القديم" : "Encryption key mismatch"}
              </div>
              <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.7, marginBottom: 10 }}>
                {isAr
                  ? "الربط محفوظ لكن لا يمكن قراءة مفتاح API بشكل صحيح. اضغط 'فصل الربط' ثم أعد الربط بنفس المفاتيح من 360dialog Hub — العمليّة تستغرق دقيقة."
                  : "Your connection is saved, but the API key can't be decrypted. Click Disconnect, then reconnect with the same 360dialog Hub keys — takes about a minute."}
              </div>
              <Button onClick={() => setShowDisconnect(true)}>
                {isAr ? "فصل الربط الآن" : "Disconnect Now"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {status.connected ? (
        <Card style={{ padding: 18, marginBottom: 18, borderRight: `4px solid #10b981` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <Badge color="#10b981">{isAr ? "متصل" : "Connected"}</Badge>
                {(() => {
                  // Normalize quality_rating casing — the DB enum is uppercase
                  // ('GREEN'/'YELLOW'/'RED'/'UNKNOWN') but the webhook handler
                  // has historically written lowercase. Accept either so the
                  // badge always renders when the value is meaningful.
                  const q = status.quality_rating?.toLowerCase();
                  if (!q || q === 'unknown') return null;
                  return (
                    <Badge color={QUALITY_COLOR[q] ?? C.t2}>
                      {isAr ? "الجودة: " : "Quality: "}{q.toUpperCase()}
                    </Badge>
                  );
                })()}
                {status.messaging_tier && TIER_LABEL[status.messaging_tier] && (
                  <Badge color="#6366f1">
                    {isAr ? "الحدّ: " : "Tier: "}
                    {isAr ? TIER_LABEL[status.messaging_tier].ar : TIER_LABEL[status.messaging_tier].en}
                  </Badge>
                )}
                <strong style={{ fontSize: 14, color: C.txt }}>{status.display_name || status.phone_number}</strong>
              </div>
              <div style={{ fontSize: 12, color: C.t2, fontFamily: "monospace" }}>+{status.display_phone_number || status.phone_number}</div>
              {status.last_connected_at && (
                <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>
                  {isAr ? "ربط منذ: " : "Connected: "}
                  {new Date(status.last_connected_at).toLocaleString(isAr ? "ar" : "en")}
                </div>
              )}
            </div>
            <Button onClick={() => setShowDisconnect(true)}>
              {isAr ? "فصل الربط" : "Disconnect"}
            </Button>
          </div>

          {/* 24h messaging window usage — unique outbound recipients counted
              over the last 24h, matching Meta's tier quota model. Hidden on
              unlimited tier (cap === -1) or before metrics first sync. */}
          {typeof status.daily_send_cap === 'number' && status.daily_send_cap > 0 && (
            (() => {
              const cap = status.daily_send_cap;
              const used = status.used_today ?? 0;
              const pct = Math.min(100, Math.round((used / cap) * 100));
              const warn = pct >= 80;
              const barColor = warn ? '#ef4444' : '#10b981';
              return (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.brd}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.t2, fontWeight: 600 }}>
                      {isAr ? 'المُرسَل خلال 24 ساعة' : 'Sent in last 24h'}
                    </span>
                    <span style={{ fontSize: 12.5, color: C.txt, fontFamily: 'monospace', direction: 'ltr' }}>
                      {used.toLocaleString()} / {cap.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 8, background: C.brd, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 300ms' }} />
                  </div>
                  {status.metrics_updated_at && (
                    <div style={{ fontSize: 10.5, color: C.t2, marginTop: 6 }}>
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
        <>
          {/* Primary path: one-step Embedded Signup under Corbit's
              360dialog partner — no Hub visit, no manual keys. The
              partner id comes from the status endpoint at runtime. */}
          <WhatsAppConnectEmbedded partnerId={status.partner_id} onConnected={mutate} />
        </>
      )}

      <Modal open={showDisconnect} onClose={() => setShowDisconnect(false)}
        title={isAr ? "تأكيد فصل الربط" : "Confirm Disconnect"}
        submitLabel={isAr ? "نعم، افصل" : "Yes, Disconnect"} onSubmit={handleDisconnect}
      >
        <p style={{ fontSize: 13, color: C.txt, lineHeight: 1.6 }}>
          {isAr
            ? "بعد الفصل ستتوقّف Corbit عن استقبال أو إرسال رسائل لهذا الرقم. سيظلّ تاريخ المحادثات محفوظاً، تقدر تربط مرّة ثانية في أيّ وقت."
            : "After disconnecting, Corbit will stop receiving and sending messages on this number. Conversation history is kept, and you can reconnect anytime."}
        </p>
      </Modal>
    </div>
  );
}
