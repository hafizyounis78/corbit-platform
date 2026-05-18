"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Button } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import api from "@/lib/api/client";

type EstimateResponse = {
  model: string;
  input_tokens: number;
  estimated_max_output_tokens: number;
  input_cost_sar: number;
  estimated_max_total_cost_sar: number;
  note?: string;
};

/**
 * Pre-flight cost preview for any AI prompt textarea. Drop it next to
 * a textarea, pass the current text, and the operator gets a one-click
 * estimate of what the prompt will cost before they actually send it.
 *
 * Cheap to call (no LLM round-trip — just a heuristic estimator on the
 * server), so re-clicking on every prompt edit is fine.
 */
export function CostEstimate({
  prompt,
  maxOutputTokens = 500,
  model,
}: {
  prompt: string;
  maxOutputTokens?: number;
  model?: string;
}) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimate = async () => {
    if (!prompt.trim()) {
      setError(isAr ? "اكتب نصّاً أوّلاً" : "Write a prompt first");
      setEstimate(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/ai/estimate-tokens", {
        prompt,
        max_output_tokens: maxOutputTokens,
        ...(model ? { model } : {}),
      });
      const data = (res.data?.data ?? res.data) as EstimateResponse;
      setEstimate(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message
          || (isAr ? "تعذّر حساب الكلفة" : "Couldn't compute the estimate"),
      );
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, border: `1px dashed ${C.brd}`, background: `${C.pri}06` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12, color: C.t2, display: "flex", alignItems: "center", gap: 5 }}>
          <Icon name="wallet" size={13} />
          <span>{isAr ? "تقدير الكلفة قبل الإرسال" : "Pre-flight cost estimate"}</span>
        </div>
        <Button outline disabled={loading} onClick={fetchEstimate}>
          {loading
            ? (isAr ? "جارٍ الحساب..." : "Calculating...")
            : (isAr ? "احسب الكلفة" : "Estimate cost")}
        </Button>
      </div>

      {estimate && (
        <div style={{ marginTop: 10, fontSize: 11.5, color: C.t2, lineHeight: 1.7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px dashed ${C.brd}` }}>
            <span>{isAr ? "رموز الدخل" : "Input tokens"}</span>
            <span style={{ color: C.txt, fontWeight: 600 }}>{estimate.input_tokens.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px dashed ${C.brd}` }}>
            <span>{isAr ? "كلفة الدخل (مؤكّدة)" : "Input cost (definite)"}</span>
            <span style={{ color: "#10b981", fontWeight: 700 }}>
              {estimate.input_cost_sar.toFixed(4)} {isAr ? "ر.س" : "SAR"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span>
              {isAr
                ? `سقف الكلفة (مع ${estimate.estimated_max_output_tokens} رمز خرج)`
                : `Cost ceiling (incl. ${estimate.estimated_max_output_tokens} output tokens)`}
            </span>
            <span style={{ color: C.pri, fontWeight: 700 }}>
              {estimate.estimated_max_total_cost_sar.toFixed(4)} {isAr ? "ر.س" : "SAR"}
            </span>
          </div>
          <div style={{ marginTop: 6, fontSize: 10.5, color: C.t3 }}>
            {isAr
              ? `النموذج: ${estimate.model} · ${estimate.note ?? ""}`
              : `Model: ${estimate.model} · ${estimate.note ?? ""}`}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", gap: 5 }}><Icon name="alert" size={12} /><span>{error}</span></div>
      )}
    </div>
  );
}
