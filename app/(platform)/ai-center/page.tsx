"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, TabBar, Toggle, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { Donut } from "@/components/charts/donut";
import { ProgressBar } from "@/components/charts/progress-bar";
import { FONT_FAMILY } from "@/lib/constants/font";
import { useAiOverview, useAiModels, useAiKnowledgeBase, useAiTone, useAiGuardrails } from "@/lib/api/hooks";
import api from "@/lib/api/client";

export default function AICenterPage() {
  const { colors: C, isDark: dk } = useTheme();
  const { t, isAr, lang } = useLocale();
  const { showToast } = useToast();
  const [tab, setTab] = useState("overview");
  const [activeTone, setActiveTone] = useState("");

  const ar = isAr;
  const aiC2 = "#7C3AED";

  /* ---------- API hooks ---------- */
  const { data: apiOverview, isLoading: loadingOverview } = useAiOverview();
  const { data: apiModels, isLoading: loadingModels, mutate: mutateModels } = useAiModels();
  const { data: apiKb, isLoading: loadingKb, mutate: mutateKb } = useAiKnowledgeBase();
  const { data: apiTone, isLoading: loadingTone, mutate: mutateTone } = useAiTone();
  const { data: apiGuardrails, isLoading: loadingGuardrails, mutate: mutateGuardrails } = useAiGuardrails();

  /* ---------- Resolved data (API only) ---------- */
  // Models - use local overrides for toggle without re-fetching
  const [modelOverrides, setModelOverrides] = useState<Record<string, boolean>>({});
  const models = useMemo(() => {
    const source = Array.isArray(apiModels) ? apiModels : [];
    return source.map((m: any) => ({
      ...m,
      active: modelOverrides[m.id] !== undefined ? modelOverrides[m.id] : (m.active ?? m.is_active ?? false),
      name: isAr ? (m.name_ar || m.name) : m.name,
      desc: isAr ? (m.description_ar || m.description || m.desc) : (m.description || m.desc),
      accuracy: m.accuracy ?? 0,
      dailyUsage: m.dailyUsage ?? m.daily_usage ?? 0,
    }));
  }, [apiModels, isAr, modelOverrides]);

  const kbDocs = Array.isArray(apiKb) ? apiKb : [];

  // Tone settings (single object: { tone, customInstructions })
  const toneData = (apiTone && !Array.isArray(apiTone)) ? apiTone as { tone?: string; customInstructions?: string } : { tone: "friendly", customInstructions: "" };
  const [customInstructions, setCustomInstructions] = useState("");
  const [savingTone, setSavingTone] = useState(false);

  useEffect(() => {
    if (!activeTone && toneData.tone) setActiveTone(toneData.tone);
    if (toneData.customInstructions !== undefined) setCustomInstructions(toneData.customInstructions || "");
  }, [apiTone]);

  const TONE_OPTIONS = useMemo(() => [
    { key: "friendly", emoji: "😊", name: ar ? "وديّة" : "Friendly", desc: ar ? "قريبة من العميل، ودودة" : "Warm and approachable" },
    { key: "formal",   emoji: "🎩", name: ar ? "رسميّة" : "Formal",   desc: ar ? "محترمة، مهنيّة" : "Professional and respectful" },
    { key: "casual",   emoji: "👋", name: ar ? "عفويّة" : "Casual",   desc: ar ? "غير رسميّة، عفويّة" : "Relaxed and informal" },
    { key: "sales",    emoji: "🎯", name: ar ? "مبيعات" : "Sales",    desc: ar ? "مقنعة، محفّزة" : "Persuasive and engaging" },
  ], [ar]);

  async function saveTone(toneKey: string, instructions: string) {
    setSavingTone(true);
    try {
      await api.patch("/ai/tone", { tone: toneKey, customInstructions: instructions });
      mutateTone();
      showToast(ar ? "تم الحفظ" : "Saved");
    } catch (e: any) {
      showToast(e?.response?.data?.message || (ar ? "تعذّر الحفظ" : "Save failed"));
    } finally {
      setSavingTone(false);
    }
  }

  const [guardrailOverrides, setGuardrailOverrides] = useState<Record<string, boolean>>({});
  const guardrails = useMemo(() => {
    const source = Array.isArray(apiGuardrails) ? apiGuardrails : [];
    return source.map((g: any) => ({
      ...g,
      name: isAr ? (g.name_ar || g.name) : g.name,
      desc: isAr ? (g.description_ar || g.description || g.desc) : (g.description || g.desc),
      on: guardrailOverrides[g.id] !== undefined ? guardrailOverrides[g.id] : (g.on ?? g.is_enabled ?? false),
    }));
  }, [apiGuardrails, isAr, guardrailOverrides]);

  const tabs = [
    { key: "overview", label: t("overview") },
    { key: "models", label: t("models") },
    { key: "knowledge", label: t("knowledge") },
    { key: "tone", label: t("tone") },
    { key: "guardrails", label: t("guardrails") },
  ];

  /* ---------- Loading ---------- */
  const isCurrentTabLoading =
    (tab === "overview" && loadingOverview) ||
    (tab === "models" && loadingModels) ||
    (tab === "knowledge" && loadingKb) ||
    (tab === "tone" && loadingTone) ||
    (tab === "guardrails" && loadingGuardrails);

  if (isCurrentTabLoading) {
    return (
      <div style={{ padding: "0 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{t("aiCenter")}</h2>
            <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>{ar ? "\u0625\u062f\u0627\u0631\u0629 \u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a" : "Manage AI models and settings"}</p>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <TabBar tabs={tabs} active={tab} onChange={setTab} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <p style={{ fontSize: 14, color: C.t2 }}>{ar ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{t("aiCenter")}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>{ar ? "\u0625\u062f\u0627\u0631\u0629 \u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a" : "Manage AI models and settings"}</p>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{ar ? "\u0623\u062f\u0627\u0621 \u0627\u0644\u0646\u0645\u0627\u0630\u062c" : "Model Performance"}</h3>
            {models.filter((m: any) => m.active).map((m: any, i: number) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span>{m.name}</span>
                  <span style={{ fontWeight: 600, color: aiC2 }}>{m.accuracy ?? m.acc ?? 0}%</span>
                </div>
                <ProgressBar value={m.accuracy ?? m.acc ?? 0} color={aiC2} />
              </div>
            ))}
          </Card>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{ar ? "\u0631\u0635\u064a\u062f AI" : "AI Credits"}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Donut segments={[{ value: apiOverview?.creditsUsedPct ?? 0, color: aiC2 }, { value: apiOverview?.creditsRemainingPct ?? 0, color: C.brd }]} size={100} strokeWidth={12} />
              <div style={{ fontSize: 12 }}>
                {([[ar ? "\u0645\u0633\u062a\u062e\u062f\u0645" : "Used", apiOverview?.creditsUsed ?? "0"], [ar ? "\u0645\u062a\u0628\u0642\u064a" : "Remaining", apiOverview?.creditsRemaining ?? "0"], [ar ? "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a" : "Total", apiOverview?.creditsTotal ?? "0"]] as const).map(([l, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 8 }}>
                    <span style={{ color: C.t2 }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "models" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {models.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
              {ar ? "لا توجد نماذج" : "No models"}
            </div>
          )}
          {models.map((m: any, i: number) => (
            <Card key={i} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{m.desc}</div>
                </div>
                <Toggle on={m.active} onToggle={async () => {
                  const newVal = !m.active;
                  setModelOverrides(prev => ({ ...prev, [m.id]: newVal }));
                  try {
                    await api.patch(`/ai/models/${m.id}`, { is_active: newVal });
                  } catch {
                    setModelOverrides(prev => ({ ...prev, [m.id]: !newVal }));
                  }
                }} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: C.inp, flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.t2 }}>{ar ? "\u0627\u0644\u062f\u0642\u0629" : "Accuracy"}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: aiC2 }}>{m.acc}%</div>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: C.inp, flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.t2 }}>{ar ? "\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u064a\u0648\u0645\u064a" : "Daily"}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{m.usage}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "knowledge" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{ar ? "\u0627\u0644\u0645\u0633\u062a\u0646\u062f\u0627\u062a" : "Documents"}</h3>
              <Button small primary onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf,.doc,.docx,.txt,.csv";
                input.onchange = async (e: any) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("name", file.name);
                  try {
                    await api.post("/ai/knowledge-base/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
                    showToast(isAr ? "تم رفع المستند بنجاح" : "Document uploaded");
                    mutateKb();
                  } catch {
                    showToast(isAr ? "فشل رفع المستند" : "Upload failed");
                  }
                };
                input.click();
              }}>{t("uploadDocs")}</Button>
            </div>
            {kbDocs.length === 0 && (
              <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: C.t2 }}>
                {ar ? "لا توجد مستندات" : "No documents"}
              </div>
            )}
            {kbDocs.map((doc: any, i: number) => (
              <div key={doc.id || i} style={{ padding: 12, borderRadius: 10, background: C.inp, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: aiC2 + "15" }}
                >
                  <Icon name="file" size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: C.t2 }}>
                    {doc.pages ?? doc.page_count ?? 0} {ar ? "\u0635\u0641\u062d\u0629" : "pages"} · {doc.type ?? doc.file_type ?? "PDF"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <Badge color={C.ok}>{doc.acc ?? doc.accuracy ?? 0}%</Badge>
                  {/* View/Download button */}
                  {doc.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
                        const token = localStorage.getItem("auth_token");
                        window.open(`${baseUrl}/ai/knowledge-base/${doc.id}/download?token=${token}`, "_blank");
                      }}
                      style={{ background: "transparent", border: `1px solid ${C.brd}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: C.info, fontSize: 11, fontWeight: 600, fontFamily: FONT_FAMILY }}
                    >
                      {ar ? "عرض" : "View"}
                    </button>
                  )}
                  {/* Delete button */}
                  {doc.id && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await api.delete(`/ai/knowledge-base/${doc.id}`);
                          showToast(ar ? "تم حذف المستند" : "Document deleted");
                          mutateKb();
                        } catch {
                          showToast(ar ? "فشل الحذف" : "Delete failed");
                        }
                      }}
                      style={{ background: "transparent", border: `1px solid ${C.brd}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: C.err, fontSize: 11, fontWeight: 600, fontFamily: FONT_FAMILY }}
                    >
                      <Icon name="x" size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </Card>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{ar ? "\u0625\u062d\u0635\u0627\u0626\u064a\u0627\u062a \u0627\u0644\u0645\u0639\u0631\u0641\u0629" : "Knowledge Stats"}</h3>
            {kbDocs.map((doc: any, i: number) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: C.t2 }}>{doc.name}</span>
                  <span style={{ fontWeight: 600 }}>{(doc.queries ?? doc.total_queries ?? 0).toLocaleString()} {ar ? "\u0627\u0633\u062a\u0639\u0644\u0627\u0645" : "queries"}</span>
                </div>
                <ProgressBar value={doc.acc ?? doc.accuracy ?? 0} color={aiC2} />
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === "tone" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.txt }}>
              {ar ? "اختر نغمة الذكاء الاصطناعي" : "Choose AI tone"}
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: C.t2 }}>
              {ar
                ? "تنطبق على كل اقتراحات الذكاء (اقتراح ردّ، توليد حملات، إلخ)"
                : "Applies to all AI suggestions (reply, campaign copy, etc.)"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
              {TONE_OPTIONS.map((tone) => {
                const isActive = tone.key === activeTone;
                return (
                  <Card
                    key={tone.key}
                    style={isActive
                      ? { padding: 16, cursor: "pointer", border: `2px solid ${aiC2}`, background: aiC2 + "08" }
                      : { padding: 16, cursor: "pointer" }}
                    onClick={() => {
                      setActiveTone(tone.key);
                      saveTone(tone.key, customInstructions);
                    }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{tone.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3, color: C.txt }}>{tone.name}</div>
                    <div style={{ fontSize: 11.5, color: C.t2 }}>{tone.desc}</div>
                    {isActive && <div style={{ marginTop: 8 }}><Badge color={aiC2}>{ar ? "مفعّل" : "Active"}</Badge></div>}
                  </Card>
                );
              })}
            </div>
          </div>

          <Card style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.txt }}>
              {ar ? "تعليمات مخصّصة (اختياري)" : "Custom instructions (optional)"}
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: C.t2 }}>
              {ar
                ? "أضف تعليمات خاصّة بشركتك (اسم الشركة، ساعات العمل، قواعد ردّ معيّنة، إلخ)"
                : "Add company-specific guidance (company name, hours, response rules, etc.)"}
            </p>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={ar
                ? "مثال: اسم شركتنا كوربت — ساعات العمل الأحد-الخميس 9-5 — لا تقدّم خصومات بدون موافقة"
                : "e.g. Our company is Corbit. Hours: Sun-Thu 9-5. Do not offer discounts without approval."}
              rows={10}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${C.brd}`,
                background: C.inp,
                color: C.txt,
                fontFamily: FONT_FAMILY,
                fontSize: 13,
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <Button
                primary
                disabled={savingTone}
                onClick={() => saveTone(activeTone || "friendly", customInstructions)}
              >
                {savingTone ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "guardrails" && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{t("guard")}</h3>
          {guardrails.length === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: C.t2 }}>
              {ar ? "لا توجد حواجز" : "No guardrails configured"}
            </div>
          )}
          {guardrails.map((g: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, background: C.inp, marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{g.name}</div>
                <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>{g.desc}</div>
              </div>
              <Toggle on={g.on} onToggle={async () => {
                const newVal = !g.on;
                setGuardrailOverrides(prev => ({ ...prev, [g.id]: newVal }));
                try {
                  await api.patch(`/ai/guardrails/${g.id}`, { is_enabled: newVal });
                } catch {
                  setGuardrailOverrides(prev => ({ ...prev, [g.id]: !newVal }));
                }
              }} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
