"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import api from "@/lib/api/client";

interface SearchResults {
  conversations: Array<{ id: string; name: string; ph?: string; st?: string; time?: string }>;
  contacts:      Array<{ id: string; name: string; ph?: string; email?: string; st?: string; score?: number }>;
  campaigns:     Array<{ id: string; name: string; st?: string; recipients?: number; date?: string }>;
  templates:     Array<{ id: string; name: string; cat?: string; st?: string; uses?: number }>;
}

const RECENT_KEY = "corbit:globalSearch:recent";
const MAX_RECENT = 6;

/**
 * Global search modal — Cmd/Ctrl+K opens, Esc closes. Hits the
 * unified /api/search endpoint that returns four categorised arrays
 * (conversations / contacts / campaigns / templates). Results are
 * grouped under section headers; clicking one navigates to the
 * matching detail page.
 *
 * Recent queries persist in localStorage so the empty state offers
 * quick re-runs instead of a blank box.
 */
export function GlobalSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { colors: C, isDark: dk } = useTheme();
  const { isAr } = useLocale();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate recent queries on first open. Wrapped in a try/catch
  // because Safari Private Mode blocks localStorage and we don't
  // want a render error there.
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) setRecent(list.slice(0, MAX_RECENT));
      }
    } catch {
      // ignore
    }
    // Focus the input on open so the user can start typing immediately.
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Reset state on close so the next open is fresh, but defer until
  // the close animation has paint-completed so the user doesn't see
  // a stutter as the list empties.
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setQuery("");
      setResults(null);
      setLoading(false);
    }, 150);
    return () => clearTimeout(t);
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(trimmed)}`);
      const data = (res.data?.data ?? res.data) as Partial<SearchResults>;
      setResults({
        conversations: data?.conversations ?? [],
        contacts:      data?.contacts ?? [],
        campaigns:     data?.campaigns ?? [],
        templates:     data?.templates ?? [],
      });
    } catch {
      setResults({ conversations: [], contacts: [], campaigns: [], templates: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search — 250ms is short enough to feel live but long
  // enough to skip a search per keystroke when typing fast.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const persistRecent = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    try {
      const next = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next);
    } catch {
      // ignore
    }
  }, [recent]);

  const handleNavigate = useCallback((url: string) => {
    persistRecent(query);
    onClose();
    router.push(url);
  }, [query, persistRecent, onClose, router]);

  const totalResults = useMemo(() => {
    if (!results) return 0;
    return results.conversations.length + results.contacts.length + results.campaigns.length + results.templates.length;
  }, [results]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 200,
          backdropFilter: "blur(2px)",
        }}
      />
      {/* Dialog — desktop centers near the top, mobile fills the
          viewport so the keyboard doesn't shove the input off-screen. */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          insetInlineStart: "50%",
          top: "10vh",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 640,
          maxHeight: "80vh",
          background: C.card,
          borderRadius: 14,
          border: `1px solid ${C.brd}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily: FONT_FAMILY,
        }}
      >
        {/* Search input */}
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? "ابحث في المنصّة كلّها — اسم، رقم، قالب، حملة..." : "Search across the platform — name, phone, template, campaign..."}
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: FONT_FAMILY, fontSize: 15, color: C.txt,
            }}
          />
          {loading && (
            <span style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>
              {isAr ? "بحث..." : "searching..."}
            </span>
          )}
          <span style={{
            fontSize: 10, padding: "3px 8px", borderRadius: 6,
            background: C.inp, color: C.t3, fontWeight: 600, fontFamily: "monospace",
          }}>
            ESC
          </span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {/* Empty state — recent searches when there's no query. */}
          {!query.trim() && (
            <div style={{ padding: "20px 18px" }}>
              {recent.length > 0 ? (
                <>
                  <div style={{ fontSize: 11, color: C.t3, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {isAr ? "بحث سابق" : "Recent"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setQuery(r)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "8px 12px", borderRadius: 8,
                          background: "transparent", border: "none", cursor: "pointer",
                          color: C.t2, fontFamily: FONT_FAMILY, fontSize: 13,
                          textAlign: "start" as const, width: "100%",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.inp; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <Icon name="timer" size={13} />
                        <span>{r}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "30px 16px", color: C.t3, fontSize: 13, lineHeight: 1.7 }}>
                  <div style={{ marginBottom: 10, display: "flex", justifyContent: "center", color: C.t2 }}><Icon name="search" size={32} /></div>
                  <div style={{ fontWeight: 600, color: C.t2, marginBottom: 4 }}>
                    {isAr ? "ابحث في كل شي" : "Search everywhere"}
                  </div>
                  <div>
                    {isAr
                      ? "محادثات، جهات اتصال، حملات، قوالب — كلّها مرّة واحدة"
                      : "Conversations, contacts, campaigns, templates — all in one place"}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 11.5 }}>
                    {isAr ? "اختصار: " : "Shortcut: "}
                    <span style={{ padding: "2px 7px", borderRadius: 5, background: C.inp, fontFamily: "monospace", fontWeight: 600 }}>Ctrl</span>
                    {" + "}
                    <span style={{ padding: "2px 7px", borderRadius: 5, background: C.inp, fontFamily: "monospace", fontWeight: 600 }}>K</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {query.trim() && results && totalResults === 0 && !loading && (
            <div style={{ padding: "30px 18px", textAlign: "center", color: C.t3, fontSize: 13 }}>
              <div style={{ marginBottom: 10, display: "flex", justifyContent: "center", color: C.t3 }}><Icon name="search" size={28} /></div>
              <div>
                {isAr
                  ? `لا توجد نتائج لـ "${query}"`
                  : `No results for "${query}"`}
              </div>
            </div>
          )}

          {query.trim() && results && totalResults > 0 && (
            <div>
              {/* Conversations */}
              {results.conversations.length > 0 && (
                <Section title={isAr ? "محادثات" : "Conversations"} icon="msg" count={results.conversations.length} C={C}>
                  {results.conversations.map((c) => (
                    <ResultRow
                      key={`conv-${c.id}`}
                      icon="msg"
                      title={c.name || (isAr ? "بدون اسم" : "Unnamed")}
                      subtitle={c.ph || ""}
                      meta={c.st || undefined}
                      C={C}
                      dk={dk}
                      onClick={() => handleNavigate(`/inbox?conversation=${c.id}`)}
                    />
                  ))}
                </Section>
              )}

              {/* Contacts */}
              {results.contacts.length > 0 && (
                <Section title={isAr ? "جهات اتصال" : "Contacts"} icon="users" count={results.contacts.length} C={C}>
                  {results.contacts.map((c) => (
                    <ResultRow
                      key={`contact-${c.id}`}
                      icon="users"
                      title={c.name || (isAr ? "بدون اسم" : "Unnamed")}
                      subtitle={[c.ph, c.email].filter(Boolean).join(" · ")}
                      meta={typeof c.score === "number" ? `${c.score}` : undefined}
                      C={C}
                      dk={dk}
                      onClick={() => handleNavigate(`/contacts?contact=${c.id}`)}
                    />
                  ))}
                </Section>
              )}

              {/* Campaigns */}
              {results.campaigns.length > 0 && (
                <Section title={isAr ? "حملات" : "Campaigns"} icon="megaphone" count={results.campaigns.length} C={C}>
                  {results.campaigns.map((c) => (
                    <ResultRow
                      key={`camp-${c.id}`}
                      icon="megaphone"
                      title={c.name}
                      subtitle={[c.date, typeof c.recipients === "number" ? (isAr ? `${c.recipients} مستلم` : `${c.recipients} recipients`) : null].filter(Boolean).join(" · ")}
                      meta={c.st}
                      C={C}
                      dk={dk}
                      onClick={() => handleNavigate(`/campaigns?campaign=${c.id}`)}
                    />
                  ))}
                </Section>
              )}

              {/* Templates */}
              {results.templates.length > 0 && (
                <Section title={isAr ? "قوالب" : "Templates"} icon="file" count={results.templates.length} C={C}>
                  {results.templates.map((t) => (
                    <ResultRow
                      key={`tmpl-${t.id}`}
                      icon="file"
                      title={t.name}
                      subtitle={[t.cat, typeof t.uses === "number" ? (isAr ? `${t.uses} استخدام` : `${t.uses} uses`) : null].filter(Boolean).join(" · ")}
                      meta={t.st}
                      C={C}
                      dk={dk}
                      onClick={() => handleNavigate(`/templates?template=${t.id}`)}
                    />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: "8px 18px", borderTop: `1px solid ${C.brd}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 10.5, color: C.t3, background: dk ? "#0F0F17" : "#FAFAF8",
        }}>
          <span>
            {isAr ? "اضغط Enter للذهاب • Esc للإغلاق" : "Enter to open • Esc to close"}
          </span>
          {totalResults > 0 && (
            <span style={{ fontWeight: 600 }}>
              {totalResults} {isAr ? "نتيجة" : "results"}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function Section({
  title, icon, count, C, children,
}: {
  title: string;
  icon?: string;
  count: number;
  C: any;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        padding: "10px 18px 6px",
        fontSize: 10.5,
        fontWeight: 700,
        color: C.t3,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        {icon && <Icon name={icon} size={11} />}
        <span>{title}</span>
        <span style={{ color: C.t3, fontWeight: 500 }}>· {count}</span>
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  icon, title, subtitle, meta, C, dk, onClick,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  meta?: string;
  C: any;
  dk: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "start" as const,
        padding: "10px 18px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.inp; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: `${C.pri}15`, color: C.pri,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: C.txt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11.5, color: C.t2, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {subtitle}
          </div>
        )}
      </div>
      {meta && (
        <span style={{
          fontSize: 10.5, padding: "3px 8px", borderRadius: 6,
          background: dk ? "#222" : "#F0EDE8", color: C.t2, fontWeight: 600,
          flexShrink: 0,
        }}>
          {meta}
        </span>
      )}
    </button>
  );
}
