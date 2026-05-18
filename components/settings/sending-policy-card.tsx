"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import api from "@/lib/api/client";
import { FONT_FAMILY } from "@/lib/constants/font";

/**
 * Org-wide sending-policy defaults — Frequency Cap + Send Window.
 *
 * These values feed straight into SendingPolicyGate at dispatch
 * time. Per-campaign overrides (campaigns table) can narrow the
 * org defaults for a single shot; null on a campaign field falls
 * back to whatever the operator sets here.
 *
 * Defaults from the team-guide v2.0:
 *   Frequency Cap: 2 messages / contact / 7 days (Marketing only)
 *   Send Window:   09:00 – 21:00, skip Fridays
 */
export function SendingPolicyCard() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [freqCount, setFreqCount] = useState(2);
  const [freqDays, setFreqDays] = useState(7);
  const [windowStart, setWindowStart] = useState("09:00");
  const [windowEnd, setWindowEnd] = useState("21:00");
  const [skipFridays, setSkipFridays] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get("/settings/sending-policy")
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        if (data) {
          if (typeof data.frequency_cap_count === "number") setFreqCount(data.frequency_cap_count);
          if (typeof data.frequency_cap_days === "number") setFreqDays(data.frequency_cap_days);
          if (data.send_window_start) setWindowStart(String(data.send_window_start).slice(0, 5));
          if (data.send_window_end) setWindowEnd(String(data.send_window_end).slice(0, 5));
          if (typeof data.send_window_skip_fridays === "boolean") setSkipFridays(data.send_window_skip_fridays);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/settings/sending-policy", {
        frequency_cap_count: freqCount,
        frequency_cap_days: freqDays,
        send_window_start: windowStart,
        send_window_end: windowEnd,
        send_window_skip_fridays: skipFridays,
      });
      showToast(isAr ? "تمّ حفظ سياسة الإرسال" : "Sending policy saved");
    } catch {
      showToast(isAr ? "تعذّر الحفظ، حاول لاحقاً" : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>
          {isAr ? "سياسة الإرسال للحملات" : "Campaign Sending Policy"}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.txt, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="shield" size={16} />
          <span>{isAr ? "الإعدادات الافتراضيّة للمؤسّسة" : "Organization defaults"}</span>
        </div>
        <div style={{ fontSize: 12, color: C.t2, marginTop: 6, lineHeight: 1.7 }}>
          {isAr
            ? "تُطبَّق على كلّ الحملات الجديدة افتراضياً. يمكن تجاوزها لكلّ حملة على حدة من شاشة الإنشاء. القيم المقترحة من دليل الفِرَق الداخليّ v2.0 لحماية تقييم الجودة (Quality Rating)."
            : "Applied to every new campaign by default. Can be overridden per-campaign from the create modal. Recommended values from the internal Team Guide v2.0 to protect Quality Rating."}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: C.t2 }}>
          {isAr ? "جارٍ التحميل..." : "Loading..."}
        </div>
      ) : (
        <>
          {/* Frequency cap (Rule 4) */}
          <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${C.brd}`, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
              <Icon name="chart" size={13} />
              <span>{isAr ? "حدّ الرسائل لكلّ عميل" : "Per-contact frequency cap"}</span>
            </div>
            <div style={{ fontSize: 11, color: C.t2, marginBottom: 12, lineHeight: 1.6 }}>
              {isAr
                ? "يمنع إرسال أكثر من العدد المحدّد من رسائل التسويق لنفس العميل خلال الفترة. الافتراضي 2/7 (موصى به من Meta)."
                : "Blocks more than N marketing messages to the same contact within the window. Default 2/7 (Meta-recommended)."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4 }}>
                  {isAr ? "الحدّ الأقصى" : "Max messages"}
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={freqCount}
                  onChange={(e) => setFreqCount(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 13 }}
                />
                <div style={{ fontSize: 10, color: C.t3, marginTop: 4 }}>
                  {isAr ? "0 = إيقاف الحدّ" : "0 = disable"}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4 }}>
                  {isAr ? "خلال (أيام)" : "Within (days)"}
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={freqDays}
                  onChange={(e) => setFreqDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          {/* Send window (Rule 5) */}
          <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${C.brd}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
              <Icon name="timer" size={13} />
              <span>{isAr ? "نافذة الإرسال" : "Send window"}</span>
            </div>
            <div style={{ fontSize: 11, color: C.t2, marginBottom: 12, lineHeight: 1.6 }}>
              {isAr
                ? "ساعات السماح بإرسال الحملات بتوقيت العميل (إن وُجد) وإلا توقيت المؤسّسة. الافتراضي 09:00-21:00 + تجنّب الجمعة."
                : "Send-allowed hours in the contact's local time (or org timezone if absent). Default 09:00-21:00 + skip Fridays."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4 }}>
                  {isAr ? "من" : "From"}
                </label>
                <input
                  type="time"
                  value={windowStart}
                  onChange={(e) => setWindowStart(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4 }}>
                  {isAr ? "إلى" : "To"}
                </label>
                <input
                  type="time"
                  value={windowEnd}
                  onChange={(e) => setWindowEnd(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 13 }}
                />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 10px", borderRadius: 8, background: skipFridays ? `${C.pri}10` : "transparent", border: `1px solid ${skipFridays ? C.pri : C.brd}` }}>
              <input
                type="checkbox"
                checked={skipFridays}
                onChange={(e) => setSkipFridays(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: C.pri, cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.txt }}>
                  {isAr ? "تجنّب الإرسال يوم الجمعة" : "Skip Fridays"}
                </div>
                <div style={{ fontSize: 10.5, color: C.t3 }}>
                  {isAr ? "يوم العطلة الرسمي في السعوديّة — معدّلات الحظر أعلى" : "Saudi weekend day — block rates run higher"}
                </div>
              </div>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <Button primary onClick={save} disabled={saving}>
              {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
