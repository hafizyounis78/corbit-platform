"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useTemplates } from "@/lib/api/hooks";
import { Modal, Badge, SearchInput } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { COLORS } from "@/lib/constants/colors";
import { FONT_FAMILY } from "@/lib/constants/font";

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onSend: (templateId: string, variables: string[]) => void;
  sending?: boolean;
  contactName?: string;
}

const CAT_COLORS: Record<string, string> = {
  utility: COLORS.info,
  marketing: COLORS.ok,
  authentication: COLORS.warn,
};

export function TemplatePicker({ open, onClose, onSend, sending, contactName }: TemplatePickerProps) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  const { data: apiTemplates, isLoading } = useTemplates({ status: "approved" });
  const templates = useMemo(() => {
    const list = apiTemplates?.items || apiTemplates || [];
    return Array.isArray(list) ? list : [];
  }, [apiTemplates]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [variables, setVariables] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((t: any) => t.name?.toLowerCase().includes(q) || t.body?.toLowerCase().includes(q));
  }, [templates, search]);

  const handleSelect = (t: any) => {
    setSelected(t);
    // Pre-fill first variable with contact name if available
    const vars = t.vars || [];
    const prefilled = vars.map((_: any, i: number) => (i === 0 && contactName ? contactName : ""));
    setVariables(prefilled);
  };

  const handleBack = () => {
    setSelected(null);
    setVariables([]);
  };

  const getPreview = () => {
    if (!selected) return "";
    let body = selected.body || "";
    variables.forEach((val, i) => {
      body = body.replace(`{{${i + 1}}}`, val || `{{${i + 1}}}`);
    });
    return body;
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setSelected(null); setSearch(""); setVariables([]); }}
      title={isAr ? "إرسال قالب واتساب" : "Send WhatsApp Template"}
      wide
      submitLabel={selected ? (sending ? (isAr ? "جارٍ الإرسال..." : "Sending...") : (isAr ? "إرسال القالب" : "Send Template")) : undefined}
      onSubmit={selected ? () => {
        if (sending) return;
        onSend(selected.id, variables);
      } : undefined}
    >
      <div style={{ minHeight: 300 }}>
        {!selected ? (
          /* ── Template List ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={isAr ? "ابحث عن قالب..." : "Search templates..."}
            />

            {isLoading ? (
              <div style={{ textAlign: "center", padding: 40, color: C.t2, fontSize: 13 }}>
                {isAr ? "جارٍ التحميل..." : "Loading..."}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.t2, fontSize: 13 }}>
                {isAr ? "لا توجد قوالب معتمدة" : "No approved templates found"}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 350, overflowY: "auto" }}>
                {filtered.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    style={{
                      display: "flex", flexDirection: "column", gap: 6, padding: 14, borderRadius: 12,
                      border: `1px solid ${C.brd}`, background: C.card, cursor: "pointer",
                      textAlign: isAr ? "right" : "left", transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = COLORS.pri)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.brd)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: C.txt }}>{t.name}</span>
                      <Badge color={CAT_COLORS[t.cat] || C.t2}>{t.cat}</Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: C.t2, lineHeight: 1.5, maxHeight: 40, overflow: "hidden" }}>
                      {t.body}
                    </p>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.t3 }}>
                      <span>{isAr ? "اللغة" : "Lang"}: {t.ln}</span>
                      <span>{isAr ? "الاستخدام" : "Uses"}: {t.uses}</span>
                      {t.open > 0 && <span>{isAr ? "الفتح" : "Open"}: {t.open}%</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Info banner */}
            <div style={{
              padding: 12, borderRadius: 10, background: `${COLORS.wa}10`, border: `1px solid ${COLORS.wa}20`,
              display: "flex", alignItems: "center", gap: 10, marginTop: 4,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, background: `${COLORS.wa}20`,
                display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.wa, flexShrink: 0,
              }}>
                <Icon name="msg" size={14} />
              </div>
              <span style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.4 }}>
                {isAr
                  ? "يمكن فقط إرسال قوالب معتمدة من Meta لبدء محادثة جديدة"
                  : "Only Meta-approved templates can be used to initiate a new conversation"}
              </span>
            </div>
          </div>
        ) : (
          /* ── Template Preview + Variables ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Back button */}
            <button
              onClick={handleBack}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                cursor: "pointer", color: C.t2, fontSize: 12.5, padding: 0, fontFamily: FONT_FAMILY,
              }}
            >
              <Icon name="back" size={14} />
              {isAr ? "رجوع لقائمة القوالب" : "Back to templates"}
            </button>

            {/* Template info */}
            <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${C.brd}`, background: C.card }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.txt }}>{selected.name}</span>
                <Badge color={CAT_COLORS[selected.cat] || C.t2}>{selected.cat}</Badge>
              </div>
              {selected.header && (
                <div style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 4 }}>{selected.header}</div>
              )}
              <div style={{
                padding: 12, borderRadius: 10, background: `${COLORS.wa}08`, border: `1px solid ${COLORS.wa}15`,
                fontSize: 13, color: C.txt, lineHeight: 1.6, whiteSpace: "pre-wrap",
              }}>
                {getPreview()}
              </div>
              {selected.footer && (
                <div style={{ fontSize: 11, color: C.t3, marginTop: 6 }}>{selected.footer}</div>
              )}
            </div>

            {/* Variable inputs */}
            {(selected.vars || []).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: C.t2 }}>
                  {isAr ? "المتغيرات" : "Variables"}
                </label>
                {(selected.vars as string[]).map((varName: string, i: number) => (
                  <div key={i}>
                    <label style={{ display: "block", fontSize: 11.5, color: C.t3, marginBottom: 4 }}>
                      {`{{${i + 1}}}`} — {varName}
                    </label>
                    <input
                      value={variables[i] || ""}
                      onChange={(e) => {
                        const updated = [...variables];
                        updated[i] = e.target.value;
                        setVariables(updated);
                      }}
                      placeholder={varName}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.brd}`,
                        background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
