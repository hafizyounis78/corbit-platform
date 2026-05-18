"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Card } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useBillingOverview, useSmsConfig } from "@/lib/api/hooks";
import Link from "next/link";

/**
 * SMS-specific usage panel for the /billing → Usage tab. Renders the
 * tenant's monthly SMS volume, monthly SMS spend, and the live provider
 * balance from their connected mobile.net.sa account.
 *
 * Hidden when the tenant hasn't connected SMS — the panel is only
 * meaningful once there's a wallet to show. This widget never folds
 * SMS into WhatsApp or AI; each metric on each row is sourced from
 * the SMS line of the billing breakdown only.
 */
export function SmsUsageWidget() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { data: overviewResp } = useBillingOverview();
  const { data: smsResp } = useSmsConfig();

  const overview = (overviewResp as any)?.data ?? overviewResp;
  const smsConfig = (smsResp as any)?.data ?? smsResp;

  if (!smsConfig?.connected) {
    // No connected SMS account — render nothing; the tenant doesn't
    // need a card encouraging them to spend on a channel they haven't
    // set up yet. The /settings/sms page already guides them in.
    return null;
  }

  // Pull SMS-only fields. The overview API was reshaped to expose
  // `usage.sms.{count, cost_sar}` so this widget can read its line
  // directly without summing across channels.
  const smsCount = Number(overview?.usage?.sms?.count ?? 0);
  const smsCost  = Number(overview?.usage?.sms?.cost_sar ?? 0);
  const balance  = smsConfig?.balance != null ? Number(smsConfig.balance) : null;
  const balanceAt = smsConfig?.balance_at as string | undefined;
  const lowBalance = smsConfig?.low_balance_threshold != null
    ? Number(smsConfig.low_balance_threshold)
    : null;
  const isLow = balance != null && lowBalance != null && balance <= lowBalance;
  const sender = smsConfig?.sender_name as string | undefined;

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>
            {isAr ? "قناة SMS" : "SMS Channel"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="phone" size={18} />
            <span>{sender || (isAr ? "حساب mobile.net.sa" : "mobile.net.sa account")}</span>
          </div>
        </div>
        <Link href="/settings" style={{ textDecoration: "none", fontSize: 12, color: C.pri }}>
          {isAr ? "إدارة SMS ←" : "Manage SMS →"}
        </Link>
      </div>

      {/* Three independent metric tiles — never combined into a total. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Tile
          label={isAr ? "رسائل هذا الشهر" : "This month"}
          value={smsCount.toLocaleString()}
          unit={isAr ? "رسالة" : "msg"}
          c={C}
        />
        <Tile
          label={isAr ? "كلفة SMS الشهرية" : "Monthly SMS spend"}
          value={smsCost.toFixed(2)}
          unit={isAr ? "ر.س" : "SAR"}
          c={C}
          accent={smsCost > 0 ? "#10b981" : undefined}
        />
        <Tile
          label={isAr ? "رصيد المزوّد" : "Provider balance"}
          value={balance != null ? balance.toLocaleString() : "—"}
          unit={isAr ? "رسالة متبقّية" : "remaining"}
          c={C}
          accent={isLow ? "#ef4444" : undefined}
          hint={balanceAt ? new Date(balanceAt).toLocaleString(isAr ? "ar-SA" : "en-US") : undefined}
        />
      </div>

      {isLow && (
        <div style={{
          marginTop: 14, padding: "10px 14px", borderRadius: 10,
          background: "#ef444412", border: "1px solid #ef444440",
          fontSize: 12, color: "#ef4444",
          display: "flex", alignItems: "flex-start", gap: 6,
        }}>
          <Icon name="alert" size={13} />
          <span>{isAr
            ? `الرصيد قارب على الانتهاء (${balance} متبقّية، الحدّ ${lowBalance}). أعد الشحن من بوابة mobile.net.sa.`
            : `Balance is running low (${balance} remaining, threshold ${lowBalance}). Top up via your mobile.net.sa portal.`}</span>
        </div>
      )}
    </Card>
  );
}

function Tile({ label, value, unit, c, accent, hint }: {
  label: string;
  value: string;
  unit: string;
  c: any;
  accent?: string;
  hint?: string;
}) {
  return (
    <div style={{
      padding: 14, borderRadius: 10,
      background: c.inp, border: `1px solid ${c.brd}`,
    }}>
      <div style={{ fontSize: 11, color: c.t2, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ?? c.txt, lineHeight: 1.1 }}>
        {value}
        <span style={{ fontSize: 11, fontWeight: 500, color: c.t3, marginInlineStart: 4 }}>{unit}</span>
      </div>
      {hint && (
        <div style={{ fontSize: 10, color: c.t3, marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}
