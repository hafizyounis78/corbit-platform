"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import api from "@/lib/api/client";

type Step = {
  key: string;
  done: boolean;
  title: string;
  description: string;
  action_url: string;
};

type OnboardingStatus = {
  completed: number;
  total: number;
  dismissed_at: string | null;
  steps: Step[];
};

/**
 * Tenant-side onboarding checklist banner.
 *
 * Renders only when:
 *   - The status fetch returned successfully (we never show a half-loaded
 *     skeleton for first-time tenants — better to render nothing than a
 *     broken card).
 *   - dismissed_at is null AND at least one step is incomplete.
 *
 * The checklist is purely a navigation aid — clicking a step takes the
 * tenant to the page where the actual feature lives. We never duplicate
 * the work of /settings/whatsapp etc. inside this card; this is just
 * "you haven't done X yet, go here".
 *
 * Polling: refreshes when the dashboard remounts (i.e. tenant navigates
 * back). No background interval — the moment they finish a step elsewhere
 * the checkmark catches up on next visit.
 */
export function OnboardingChecklist() {
  const { colors: C, isDark } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const router = useRouter();

  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  const [hidden, setHidden] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get("/onboarding/status");
      const data: OnboardingStatus = res?.data?.data ?? res?.data;
      setStatus(data);
    } catch {
      // Silent failure — the tenant doesn't need to see "couldn't load
      // onboarding hint" if the dashboard itself loaded fine.
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleDismiss = useCallback(async () => {
    if (dismissing) return;
    setDismissing(true);
    try {
      await api.post("/onboarding/dismiss");
      setHidden(true);
      showToast(isAr ? "تم إخفاء الدليل" : "Checklist dismissed", "success");
    } catch {
      showToast(isAr ? "تعذّر الإخفاء" : "Could not dismiss", "error");
    } finally {
      setDismissing(false);
    }
  }, [dismissing, isAr, showToast]);

  // Loading + dismissed + already-hidden + everything-done → render nothing
  if (loading || hidden) return null;
  if (!status) return null;
  if (status.dismissed_at) return null;
  if (status.completed >= status.total) return null;

  const progress = Math.round((status.completed / status.total) * 100);
  const accent = C.pri;

  return (
    <div
      style={{
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
        background: isDark ? "#0f1a2e" : "#F0F7FF",
        border: `1.5px solid ${isDark ? "#1f3458" : "#BFD9F2"}`,
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ color: C.pri, display: "inline-flex" }}><Icon name="rocket" size={20} /></span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.txt }}>
              {isAr ? "ابدأ من هنا" : "Get Started"}
            </h3>
          </div>
          <div style={{ fontSize: 12.5, color: C.t2 }}>
            {isAr
              ? `أكملت ${status.completed} من ${status.total} خطوات`
              : `${status.completed} of ${status.total} steps complete`}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          title={isAr ? "إخفاء دائم" : "Hide permanently"}
          style={{
            background: "transparent",
            border: "none",
            color: C.t3,
            cursor: dismissing ? "wait" : "pointer",
            padding: 4,
            fontSize: 18,
            lineHeight: 1,
            opacity: dismissing ? 0.5 : 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: isDark ? "#1a2740" : "rgba(59,130,246,0.15)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: accent,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {status.steps.map((step, i) => (
          <div
            key={step.key}
            onClick={() => !step.done && router.push(step.action_url)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              background: step.done ? (isDark ? "#0a1a10" : "#ECFDF5") : (isDark ? "#0c1626" : "#fff"),
              border: `1px solid ${step.done ? (isDark ? "#1d4030" : "#A7F3D0") : (isDark ? "#1e2a44" : "#E0EAF8")}`,
              cursor: step.done ? "default" : "pointer",
              transition: "all 0.15s",
              opacity: step.done ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!step.done) {
                (e.currentTarget as HTMLElement).style.borderColor = accent;
                (e.currentTarget as HTMLElement).style.transform = "translateX(2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!step.done) {
                (e.currentTarget as HTMLElement).style.borderColor = isDark ? "#1e2a44" : "#E0EAF8";
                (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
              }
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: step.done ? "#10B981" : (isDark ? "#1a2740" : "#E0EAF8"),
                color: step.done ? "#fff" : C.t3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {step.done ? "✓" : i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.txt, textDecoration: step.done ? "line-through" : "none" }}>
                {step.title}
              </div>
              <div style={{ fontSize: 11.5, color: C.t2, marginTop: 1 }}>
                {step.description}
              </div>
            </div>
            {!step.done && (
              <div style={{ color: accent, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                {isAr ? "ابدأ ←" : "Start →"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
