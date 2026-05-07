"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { FONT_FAMILY } from "@/lib/constants/font";
import api from "@/lib/api/client";

const PRESETS_AR = ["VIP", "شكوى", "استفسار", "متابعة", "عميل جديد", "عاجل", "تمّ"];
const PRESETS_EN = ["VIP", "Complaint", "Inquiry", "Follow-up", "New", "Urgent", "Done"];

/**
 * Edit the conversation's tag set. Hybrid: a row of preset chips
 * (most teams use the same handful of buckets) + a free-text input
 * for anything custom. The backend stores both indistinguishably,
 * so a tag can be invented by one agent and reused by another.
 *
 * Pure metadata — tags don't trigger any Meta-side action and never
 * affect what gets sent. They just help the team filter / segment
 * conversations in the inbox.
 */
export function TagsEditorModal({
  open,
  onClose,
  conversationId,
  initialTags,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string | null;
  initialTags: string[];
  onSaved: (tags: string[]) => void;
}) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTags(initialTags);
      setDraft("");
    }
  }, [open, initialTags]);

  const presets = isAr ? PRESETS_AR : PRESETS_EN;

  const toggle = (t: string) => {
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const addCustom = () => {
    const v = draft.trim();
    if (!v) return;
    if (tags.includes(v)) { setDraft(""); return; }
    if (tags.length >= 10) {
      showToast(isAr ? "الحدّ الأقصى 10 تصنيفات" : "Max 10 tags", "error");
      return;
    }
    setTags([...tags, v]);
    setDraft("");
  };

  const handleSave = async () => {
    if (!conversationId) return;
    setBusy(true);
    try {
      await api.patch(`/conversations/${conversationId}/tags`, { tags });
      onSaved(tags);
      showToast(isAr ? "تمّ حفظ التصنيفات" : "Tags saved");
      onClose();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? "فشل الحفظ" : "Save failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isAr ? "🏷️ تصنيفات المحادثة" : "🏷️ Conversation Tags"}
      submitLabel={busy ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
      submitDisabled={busy}
      onSubmit={handleSave}
    >
      <div style={{ fontFamily: FONT_FAMILY }}>
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>
          {isAr
            ? "اختر من المقترحات أو أضف تصنيفاً مخصّصاً. الحدّ الأقصى 10 تصنيفات."
            : "Pick from presets or add a custom tag. Max 10 tags."}
        </p>

        {/* Active tags */}
        {tags.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.t2, marginBottom: 6, fontWeight: 600 }}>
              {isAr ? "المختارة" : "Selected"} ({tags.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 10px", borderRadius: 12,
                    background: C.pri, color: "#fff", fontSize: 12, fontWeight: 600,
                  }}
                >
                  {t}
                  <button
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    style={{
                      background: "rgba(255,255,255,0.25)", border: "none",
                      color: "#fff", borderRadius: "50%",
                      width: 16, height: 16, cursor: "pointer", fontSize: 11, lineHeight: 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Presets */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.t2, marginBottom: 6, fontWeight: 600 }}>
            {isAr ? "مقترحات" : "Presets"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {presets.map((p) => {
              const active = tags.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => toggle(p)}
                  style={{
                    padding: "5px 12px", borderRadius: 12,
                    background: active ? `${C.pri}20` : "transparent",
                    border: `1px solid ${active ? C.pri : C.brd}`,
                    color: active ? C.pri : C.t2,
                    fontSize: 12, fontWeight: 600,
                    fontFamily: FONT_FAMILY, cursor: "pointer",
                  }}
                >
                  {active ? "✓ " : "+ "}{p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom add */}
        <div>
          <div style={{ fontSize: 11, color: C.t2, marginBottom: 6, fontWeight: 600 }}>
            {isAr ? "تصنيف مخصّص" : "Custom tag"}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
              placeholder={isAr ? "اكتب التصنيف ثمّ Enter" : "Type a tag and press Enter"}
              maxLength={40}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                border: `1px solid ${C.brd}`, background: C.inp,
                color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY,
                outline: "none",
              }}
            />
            <Button onClick={addCustom} disabled={!draft.trim()}>
              {isAr ? "إضافة" : "Add"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
