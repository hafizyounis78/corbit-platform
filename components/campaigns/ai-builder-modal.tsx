"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useCampaignBuilderPresets } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { COLORS } from "@/lib/constants/colors";
import { FONT_FAMILY } from "@/lib/constants/font";

interface Preset {
  key: string;
  icon: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
}

interface Draft {
  name: string;
  segment_key: string | null;
  message_idea: string;
  suggested_send_time: string;
  suggested_day: string;
  rationale: string;
  estimated_recipients: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with the resolved draft when the operator clicks Continue.
   *  The parent uses it to pre-fill the existing "new campaign" modal,
   *  so this builder is purely a smart-fill on top of the regular flow.  */
  onDraftReady: (draft: Draft) => void;
}

const AI_COLOR = "#FF5A5F";

/**
 * The two-step "Smart Builder" entry the V2 Campaigns page surfaces
 * before the regular create flow:
 *
 *   1. Pick from 6 deterministic preset cards (no AI call), or
 *   2. Type a free-text request like "30% off for inactive customers"
 *      and let the AI fill the fields.
 *
 * Either path lands on a preview screen showing the proposed name,
 * segment, suggested send time, and estimated recipient count. The
 * operator confirms with "Continue" → the parent's existing campaign
 * editor opens pre-filled with the draft. The Builder never writes to
 * the campaigns table directly.
 */
export function CampaignAIBuilderModal({ open, onClose, onDraftReady }: Props) {
  const { colors: C, isDark } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  // Step state. 'choose' is the entry view (presets + NL input);
  // 'preview' renders the resolved draft for confirmation.
  const [step, setStep] = useState<"choose" | "preview">("choose");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  const { data: presetsData } = useCampaignBuilderPresets();
  const presets: Preset[] = (presetsData as any)?.presets ?? [];

  if (!open) return null;

  const reset = () => {
    setStep("choose");
    setDraft(null);
    setPrompt("");
    setLoading(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handlePreset = async (key: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post("/campaigns/ai/builder/preset", { key });
      const d = res.data?.data ?? res.data;
      setDraft(d);
      setStep("preview");
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? "تعذّر تطبيق القالب" : "Couldn't apply preset"));
    } finally {
      setLoading(false);
    }
  };

  const handlePrompt = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      const res = await api.post("/campaigns/ai/builder/prompt", { prompt: trimmed });
      const d = res.data?.data ?? res.data;
      setDraft(d);
      setStep("preview");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 429) {
        showToast(isAr ? "وصلت الحدّ اليومي للذكاء، جرّب القوالب الجاهزة" : "Daily AI limit reached — try a preset");
      } else {
        showToast(e?.response?.data?.message || (isAr ? "تعذّر فهم الطلب" : "Couldn't understand the request"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!draft) return;
    onDraftReady(draft);
    close();
  };

  // Backdrop click closes; modal click stops propagation so an accidental
  // click on the modal body doesn't dismiss it mid-edit.
  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 16,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card,
          borderRadius: 18,
          maxWidth: 720, width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
          border: `1px solid ${C.brd}`,
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${C.brd}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: AI_COLOR, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>🧠</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>
                {isAr ? "منشئ الحملات الذكي" : "AI Campaign Builder"}
              </div>
              <div style={{ fontSize: 11.5, color: C.t2 }}>
                {step === "choose"
                  ? (isAr ? "اختر قالباً جاهزاً أو اكتب طلبك بالكلمات" : "Pick a preset or describe what you want")
                  : (isAr ? "تأكيد الحملة قبل الإنشاء" : "Confirm before creating")}
              </div>
            </div>
          </div>
          <button
            onClick={close}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 18, color: C.t2, padding: 8,
            }}
          >
            ✕
          </button>
        </div>

        {step === "choose" && (
          <div style={{ padding: 24 }}>
            {/* Preset grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 20,
            }}>
              {presets.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePreset(p.key)}
                  disabled={loading}
                  style={{
                    background: isDark ? C.inp : "#FAFAF8",
                    border: `1.5px solid ${C.brd}`,
                    borderRadius: 12,
                    padding: "14px 14px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: FONT_FAMILY,
                    textAlign: isAr ? "right" : "left",
                    transition: "all 0.15s",
                    opacity: loading ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = AI_COLOR;
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = C.brd;
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>
                    {isAr ? p.title_ar : p.title_en}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.4 }}>
                    {isAr ? p.description_ar : p.description_en}
                  </div>
                </button>
              ))}
            </div>

            {/* OR divider */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: 16,
            }}>
              <div style={{ flex: 1, height: 1, background: C.brd }} />
              <span style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>
                {isAr ? "أو" : "OR"}
              </span>
              <div style={{ flex: 1, height: 1, background: C.brd }} />
            </div>

            {/* Free-text input */}
            <div style={{
              padding: 14,
              borderRadius: 12,
              background: isDark ? "#1a1030" : "#F8F4FF",
              border: `1.5px solid ${AI_COLOR}30`,
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.txt, marginBottom: 8 }}>
                {isAr ? "اكتب طلبك بحرية" : "Describe your campaign"}
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isAr
                  ? "مثال: حملة خصم 30% للعملاء غير النشطين منذ 3 شهور، أرسل الأحد صباحاً"
                  : "e.g. 30% off campaign for customers inactive 3 months, send Sunday morning"}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: C.card,
                  border: `1px solid ${C.brd}`,
                  fontFamily: FONT_FAMILY,
                  fontSize: 13,
                  color: C.txt,
                  outline: "none",
                  resize: "vertical",
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handlePrompt}
                disabled={loading || !prompt.trim()}
                style={{
                  background: prompt.trim() ? AI_COLOR : C.t3,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "9px 16px",
                  fontFamily: FONT_FAMILY,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading
                  ? (isAr ? "جارٍ التحليل..." : "Analyzing...")
                  : (isAr ? "✨ ابني الحملة" : "✨ Build it")}
              </button>
            </div>
          </div>
        )}

        {step === "preview" && draft && (
          <div style={{ padding: 24 }}>
            {/* Resolved draft preview */}
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: isDark ? "#1a1030" : "#F8F4FF",
              border: `1.5px solid ${AI_COLOR}40`,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 11.5, color: AI_COLOR, fontWeight: 700, marginBottom: 4 }}>
                {isAr ? "اقتراح المساعد الذكي" : "AI proposal"}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.txt, marginBottom: 10 }}>
                {draft.name}
              </div>
              {draft.message_idea && (
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  background: C.card,
                  fontSize: 13, lineHeight: 1.6, color: C.txt,
                  marginBottom: 12,
                  whiteSpace: "pre-line",
                }}>
                  {draft.message_idea}
                </div>
              )}
              {draft.rationale && (
                <div style={{ fontSize: 12, color: C.t2, fontStyle: "italic" }}>
                  💡 {draft.rationale}
                </div>
              )}
            </div>

            {/* Quick facts */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 20,
            }}>
              {[
                {
                  label: isAr ? "الجمهور" : "Audience",
                  value: draft.segment_key ?? (isAr ? "غير محدّد" : "Unset"),
                  color: COLORS.pri,
                },
                {
                  label: isAr ? "أفضل وقت" : "Best time",
                  value: `${draft.suggested_day} ${draft.suggested_send_time}`,
                  color: COLORS.warn,
                },
                {
                  label: isAr ? "متلقّون متوقّعون" : "Recipients",
                  value: draft.estimated_recipients.toLocaleString(),
                  color: COLORS.ok,
                },
              ].map((fact, i) => (
                <div key={i} style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: C.inp,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 10.5, color: C.t2, marginBottom: 4 }}>{fact.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: fact.color }}>{fact.value}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setStep("choose"); setDraft(null); }}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  border: `1px solid ${C.brd}`,
                  background: "transparent",
                  color: C.t2,
                  fontFamily: FONT_FAMILY,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isAr ? "← رجوع" : "← Back"}
              </button>
              <button
                onClick={handleContinue}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: AI_COLOR,
                  color: "#fff",
                  fontFamily: FONT_FAMILY,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isAr ? "تابع للإنشاء →" : "Continue to create →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
