"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";

export interface CustomFieldDef {
  id?: string;
  key: string;
  label: string;
  labelEn?: string | null;
  type: string;
  options?: string[];
  required?: boolean;
  placeholder?: string | null;
  showInList?: boolean;
  sortOrder?: number;
}

interface Props {
  definitions: CustomFieldDef[];
  /** { key: value } — the caller owns the state. */
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

/**
 * Renders the tenant's own contact fields as form inputs.
 *
 * Shared by the add and edit modals so a field defined once behaves
 * identically in both — and so a new field type only ever needs
 * handling here.
 *
 * Renders nothing when the tenant has defined no fields, which keeps
 * the contact form exactly as it was for everyone who never opens the
 * custom-fields settings screen.
 */
export function CustomFieldInputs({ definitions, values, onChange }: Props) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  if (!definitions.length) return null;

  const set = (key: string, value: string) => onChange({ ...values, [key]: value });

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${C.brd}`,
    background: C.inp,
    color: C.txt,
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <>
      {definitions.map((def) => {
        const label = isAr ? def.label : (def.labelEn || def.label);
        const value = values[def.key] ?? "";

        return (
          <div key={def.key}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
              {label}{def.required ? " *" : ""}
            </label>

            {def.type === "select" ? (
              <select
                value={value}
                onChange={(e) => set(def.key, e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">{isAr ? "اختر..." : "Select..."}</option>
                {(def.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : def.type === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => set(def.key, e.target.value)}
                rows={3}
                placeholder={def.placeholder || ""}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            ) : (
              <input
                type={
                  def.type === "date" ? "date" :
                  def.type === "number" ? "number" :
                  def.type === "email" ? "email" :
                  def.type === "url" ? "url" :
                  def.type === "phone" ? "tel" : "text"
                }
                value={value}
                onChange={(e) => set(def.key, e.target.value)}
                placeholder={def.placeholder || ""}
                // Numbers, dates, emails, URLs and phones read
                // left-to-right even in an Arabic interface.
                dir={["text", "textarea"].includes(def.type) ? undefined : "ltr"}
                style={inputStyle}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * Strip empty answers before sending. The API treats an empty string
 * as "clear this answer", which is right for an edit but noise on a
 * create.
 */
export function nonEmptyValues(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== ""),
  );
}
