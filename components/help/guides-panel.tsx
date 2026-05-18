"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useHelpGuides } from "@/lib/api/hooks";
import { MarkdownText } from "./markdown-text";
import { HelpfulVote } from "./helpful-vote";
import { FONT_FAMILY } from "@/lib/constants/font";
import { Icon } from "@/components/icons/icon";

interface GuideStep {
  id: string;
  title: { ar: string; en?: string | null };
  desc:  { ar: string; en?: string | null };
  tip?:  { ar?: string | null; en?: string | null };
  visual?: string | null;
  link_path?: string | null;
}

interface Guide {
  id: string;
  slug: string;
  title: { ar: string; en?: string | null };
  icon: string;
  color: string;
  tags: string[];
  steps: GuideStep[];
  helpful_yes?: number;
  helpful_no?: number;
}

/**
 * Help Center > Guides tab. Fetches the live guide list from
 * /api/help/guides; ops edits land instantly without a deploy.
 * Search filters by title, tag, or any step title — same UX the
 * static version had.
 */
export function GuidesPanel({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { colors: C, isDark: dk } = useTheme();
  const { isAr } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useHelpGuides();
  const guides: Guide[] = Array.isArray(data) ? data : [];

  // Resolve a localized string from {ar, en} preferring the active
  // locale and falling back to whichever side is present.
  const pick = (loc?: { ar?: string | null; en?: string | null } | null): string => {
    if (!loc) return "";
    if (isAr) return (loc.ar ?? loc.en ?? "");
    return (loc.en ?? loc.ar ?? "");
  };

  const q = search.trim().toLowerCase();
  const filtered = guides.filter((g) => {
    if (!q) return true;
    if (pick(g.title).toLowerCase().includes(q)) return true;
    if ((g.tags ?? []).some((t) => t.toLowerCase().includes(q))) return true;
    if ((g.steps ?? []).some((s) => pick(s.title).toLowerCase().includes(q))) return true;
    return false;
  });

  if (isLoading) {
    return (
      <div style={{ padding: "40px 18px", textAlign: "center", color: C.t3, fontSize: 13 }}>
        {isAr ? "جاري تحميل الأدلّة..." : "Loading guides..."}
      </div>
    );
  }

  // Detail view — selected guide opens with its full step list.
  if (openId) {
    const guide = guides.find((g) => g.id === openId);
    if (!guide) {
      setOpenId(null);
      return null;
    }
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenId(null)}
          style={{
            background: "none", border: "none", color: C.pri,
            fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: 600,
            cursor: "pointer", marginBottom: 16, padding: 0,
          }}
        >
          {isAr ? "← العودة للأدلّة" : "← Back to Guides"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${guide.color}15`, color: guide.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
          }}>
            {guide.icon}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{pick(guide.title)}</h2>
            <div style={{ fontSize: 12.5, color: C.t2, marginTop: 4 }}>
              {guide.steps.length} {isAr ? "خطوة" : "steps"}
            </div>
          </div>
        </div>

        <div>
          {guide.steps.map((step, i) => {
            const tipText = pick(step.tip);
            const isWarning = tipText.startsWith("⚠");
            return (
              <div key={step.id ?? i} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: guide.color, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 14,
                  }}>
                    {i + 1}
                  </div>
                  {i < guide.steps.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: `${guide.color}25`, marginTop: 4 }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: C.txt }}>{pick(step.title)}</div>
                  <MarkdownText
                    text={pick(step.desc)}
                    style={{
                      padding: "12px 16px", borderRadius: 12, background: C.inp,
                      fontSize: 13, color: C.t2,
                    }}
                    linkColor={guide.color}
                    codeBg={dk ? "#0006" : "#0001"}
                  />
                  {tipText && (
                    <div style={{
                      marginTop: 8, padding: "8px 14px", borderRadius: 8,
                      background: isWarning ? `${C.warn}10` : `${C.pri}06`,
                      border: `1px solid ${isWarning ? C.warn + "25" : C.pri + "15"}`,
                      fontSize: 12, color: isWarning ? C.warn : C.pri, lineHeight: 1.6,
                    }}>
                      {tipText}
                    </div>
                  )}
                  {step.link_path && (
                    <button
                      type="button"
                      onClick={() => onNavigate(step.link_path!)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        marginTop: 10, padding: "6px 14px", borderRadius: 8,
                        background: `${C.info}10`, border: `1px solid ${C.info}30`,
                        color: C.info, fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Icon name="link" size={13} />
                      <span>{isAr ? "افتح هذه الصفحة" : "Open this page"}</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
                {step.visual && (
                  <div style={{
                    width: 60, flexShrink: 0, display: "flex",
                    alignItems: "flex-start", justifyContent: "center", paddingTop: 4,
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 12,
                      background: `${guide.color}10`,
                      border: `1px dashed ${guide.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22,
                    }}>
                      {step.visual}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* "Was this helpful?" footer for the whole guide. Sits below
            the last step so the operator only sees it after they've
            actually walked through the content. */}
        <HelpfulVote
          targetType="guide"
          targetId={guide.id}
          initialYes={guide.helpful_yes ?? 0}
          initialNo={guide.helpful_no ?? 0}
        />
      </div>
    );
  }

  // List view — cards of all guides with a search box.
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 12, background: C.inp,
        marginBottom: 16,
      }}>
        <Icon name="search" size={14} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? "ابحث في الأدلّة..." : "Search guides..."}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontFamily: FONT_FAMILY, fontSize: 13, color: C.txt,
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{ background: "none", border: "none", color: C.t3, cursor: "pointer", fontSize: 14 }}
          >×</button>
        )}
      </div>

      {guides.length === 0 ? (
        <div style={{ padding: "40px 18px", textAlign: "center", color: C.t3, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Icon name="inbox" size={20} />
          <span>{isAr ? "لم تُنشَر أدلّة بعد." : "No guides published yet."}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "40px 18px", textAlign: "center", color: C.t3, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Icon name="search" size={20} />
          <span>{isAr ? `لا توجد نتائج لـ "${search}"` : `No matches for "${search}"`}</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map((g) => (
            <Card
              key={g.id}
              style={{
                cursor: "pointer", padding: 20,
                border: `1px solid ${dk ? C.brd : "#EAE7E2"}`,
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onClick={() => setOpenId(g.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${g.color}15`, color: g.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}>
                  {g.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{pick(g.title)}</div>
                  <div style={{ fontSize: 11.5, color: C.t2 }}>
                    {g.steps.length} {isAr ? "خطوة" : "steps"}
                  </div>
                </div>
              </div>
              {/* Step progress placeholder bars */}
              <div style={{ display: "flex", gap: 3 }}>
                {g.steps.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: `${g.color}30` }} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
