"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api/client";
import { COLORS } from "@/lib/constants/colors";
import { FONT_FAMILY } from "@/lib/constants/font";
import { Avatar, Badge, Button } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { usePipelineStages } from "@/lib/api/hooks";

interface TimelineEvent {
  type: string;
  label: string;
  at: string;
}

interface ContactDetail {
  id: string;
  name: string;
  ph: string;
  email?: string;
  city?: string;
  language?: string;
  source?: string;
  st?: string;
  tags?: string[];
  score: number;
  ltv: number;
  orders: number;
  avgOrder?: number;
  lastActive?: string;
  joined?: string;
  notes?: string;
  behavior?: {
    opens: number;
    clicks: number;
    replies: number;
    purchases: number;
    avgOrder: number;
    lastCamp?: string;
  };
  timeline?: TimelineEvent[];
  aiNotes?: string[];
  /** Sales pipeline position. Null when the contact is not on the
   *  board — which is every contact until someone puts them there. */
  stage?: {
    id: string;
    name: string;
    nameEn?: string | null;
    color: string;
    isWon?: boolean;
    isLost?: boolean;
    movedAt?: string | null;
  } | null;
  stageHistory?: { from: string | null; to: string | null; note: string | null; at: string }[];
}

interface Props {
  /** When set, drawer slides in for that id. Null closes. */
  contactId: string | null;
  onClose: () => void;
  /** Called after a write that affects the parent list (block, etc).
   *  Lets the parent refetch contacts without us coupling to its state. */
  onMutated?: () => void;
}

const AI_COLOR = "#FF5A5F";

/**
 * Right-side drawer for the full contact profile. Loads the detail
 * payload (?detail=1) which includes behavior + timeline + AI notes
 * — all data the listing endpoint deliberately doesn't carry.
 *
 * Layout follows what operators read top-to-bottom in a triage moment:
 *   1. Profile header (who is this, score)
 *   2. Behavior tiles (orders / LTV / open rate / replies — quick scan)
 *   3. AI Notes (rule-based insights, no OpenAI call per view)
 *   4. Activity Timeline (last 15 events: chats + campaigns)
 *   5. Quick actions (message / add-to-campaign / tag / block)
 *
 * Refetches the AI score on demand via the recompute endpoint so an
 * operator who just edited tags can see the new score without waiting
 * for the nightly cron.
 */
export function ContactDetailDrawer({ contactId, onClose, onMutated }: Props) {
  const { colors: C, isDark } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  // Pipeline stages, so the drawer can offer a move. Empty array for
  // every tenant that has not created a pipeline — the selector then
  // renders nothing at all.
  const { data: stagesData } = usePipelineStages();
  const stages: any[] = Array.isArray(stagesData) ? stagesData : [];
  const [movingStage, setMovingStage] = useState(false);

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  // Delete confirmation modal — requires the operator to type the
  // contact name exactly so a misclick can never erase the wrong row.
  // Soft delete on the backend, so the contact stays in DB for ~30
  // days for compliance + accidental-restore scenarios.
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  // Tag modal — quick inline add. The "وسم" button on the action bar
  // used to fire showToast("✓") only, which made the button look broken
  // because nothing actually changed. Now it opens this modal, POSTs to
  // /contacts/{id}/tags, refreshes the drawer's tag list, and signals
  // the parent so the contacts table re-renders.
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  useEffect(() => {
    if (!contactId) {
      setContact(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.get(`/contacts/${contactId}?detail=1`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? res.data;
        // Eloquent returns tags as full pivot rows ({id, contact_id,
        // tag, ...}); the drawer renders them directly in <Badge>{t}</Badge>.
        // Coerce to strings here so React doesn't explode with error #31
        // when a contact has any tags at all. Matches the same shape
        // the contacts list page normalizes to.
        if (data && Array.isArray(data.tags)) {
          data.tags = data.tags.map((t: any) =>
            typeof t === 'string' ? t : (t?.tag ?? t?.name ?? '')
          ).filter(Boolean);
        }
        setContact(data);
      })
      .catch(() => {
        if (cancelled) return;
        showToast(isAr ? "تعذّر تحميل بيانات العميل" : "Couldn't load contact");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [contactId, isAr, showToast]);

  const handleRecompute = async () => {
    if (!contactId || recomputing) return;
    setRecomputing(true);
    try {
      const res = await api.post(`/contacts/${contactId}/recompute-score`);
      const data = res.data?.data ?? res.data;
      setContact((prev) => prev ? { ...prev, score: data.engagement_score } : prev);
      showToast(isAr ? "تم تحديث النقاط" : "Score updated");
    } catch {
      showToast(isAr ? "تعذّر التحديث" : "Couldn't update");
    } finally {
      setRecomputing(false);
    }
  };

  const handleStageChange = async (stageId: string) => {
    if (!contactId || movingStage) return;
    setMovingStage(true);
    try {
      await api.patch(`/contacts/${contactId}/stage`, { stage_id: stageId || null });
      const next = stages.find((s: any) => s.id === stageId) || null;
      setContact((prev) => prev ? { ...prev, stage: next } : prev);
      showToast(isAr ? "تمّ تحديث المرحلة" : "Stage updated");
      onMutated?.();
    } catch {
      showToast(isAr ? "تعذّر تحديث المرحلة" : "Couldn't update stage");
    } finally {
      setMovingStage(false);
    }
  };

  const handleAddTag = async () => {
    if (!contactId || savingTag) return;
    const t = tagInput.trim();
    if (!t) return;
    if ((contact?.tags || []).some((x: any) => (typeof x === 'string' ? x : x?.tag) === t)) {
      showToast(isAr ? "الوسم موجود بالفعل" : "Tag already exists");
      return;
    }
    setSavingTag(true);
    try {
      await api.post(`/contacts/${contactId}/tags`, { tag: t });
      setContact((prev) => prev ? { ...prev, tags: [...(prev.tags || []), t] } : prev);
      setTagInput("");
      setShowTagModal(false);
      showToast(isAr ? "تمّت إضافة الوسم" : "Tag added");
      onMutated?.();
    } catch {
      showToast(isAr ? "تعذّر إضافة الوسم" : "Couldn't add tag");
    } finally {
      setSavingTag(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!contactId) return;
    try {
      await api.delete(`/contacts/${contactId}/tags/${encodeURIComponent(tag)}`);
      setContact((prev) => prev ? { ...prev, tags: (prev.tags || []).filter((x: any) => (typeof x === 'string' ? x : x?.tag) !== tag) } : prev);
      showToast(isAr ? "تمّ حذف الوسم" : "Tag removed");
      onMutated?.();
    } catch {
      showToast(isAr ? "تعذّر حذف الوسم" : "Couldn't remove tag");
    }
  };

  const handleDelete = async () => {
    if (!contactId || !contact) return;
    // Belt-and-suspenders: button is already disabled when text doesn't
    // match, but recheck here so an enabled state from a stale render
    // can never bypass the gate.
    if (deleteConfirmText.trim() !== contact.name.trim()) return;
    setDeleting(true);
    try {
      await api.delete(`/contacts/${contactId}`);
      showToast(isAr ? "تم حذف جهة الاتصال" : "Contact deleted");
      setShowDeleteModal(false);
      setDeleteConfirmText("");
      onMutated?.();
      onClose();
    } catch {
      showToast(isAr ? "تعذّر الحذف" : "Couldn't delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!contactId) return null;

  const scoreColor = (s: number) =>
    s >= 80 ? COLORS.ok : s >= 50 ? COLORS.warn : COLORS.err;

  const tpIcon: Record<string, string> = {
    chat: "msg",
    campaign: "megaphone",
    order: "cart",
    system: "gear",
  };
  const tpColor: Record<string, string> = {
    chat: COLORS.info,
    campaign: COLORS.pri,
    order: COLORS.ok,
    // System events are rare; muted grey matches the t3 token on
    // both themes without depending on the theme-only C.t3 (which
    // isn't on the COLORS constant export).
    system: "#9CA3AF",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 95,
        }}
      />
      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0,
          [isAr ? "left" : "right"]: 0 as any,
          width: "min(440px, 92vw)",
          height: "100vh",
          background: C.card,
          boxShadow: "-12px 0 40px rgba(0,0,0,0.2)",
          zIndex: 96,
          overflowY: "auto",
          fontFamily: FONT_FAMILY,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sticky header strip with close button */}
        <div
          style={{
            position: "sticky", top: 0,
            background: C.card,
            borderBottom: `1px solid ${C.brd}`,
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 5,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>
            {isAr ? "ملف العميل" : "Contact Profile"}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none",
              cursor: "pointer", color: C.t2, fontSize: 18, padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {loading || !contact ? (
          <div style={{ padding: 40, textAlign: "center", color: C.t2 }}>
            <Icon name="timer" size={24} />
            <p style={{ marginTop: 8, fontSize: 13 }}>
              {isAr ? "جاري التحميل..." : "Loading..."}
            </p>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.brdL}` }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <Avatar name={contact.name} size={56} solid />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: C.txt, marginBottom: 4 }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.t2, marginBottom: 4, direction: "ltr" }}>
                    {contact.ph}
                  </div>
                  {contact.email && (
                    <div style={{ fontSize: 11.5, color: C.t3, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="mail" size={11} />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.city && (
                    <div style={{ fontSize: 11.5, color: C.t3, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="globe" size={11} />
                      <span>{contact.city}</span>
                    </div>
                  )}
                </div>
                {/* Score badge — clickable for manual recompute */}
                <button
                  onClick={handleRecompute}
                  disabled={recomputing}
                  title={isAr ? "إعادة حساب النقاط" : "Recompute score"}
                  style={{
                    width: 56, height: 56,
                    borderRadius: 14,
                    background: scoreColor(contact.score) + "15",
                    border: `2px solid ${scoreColor(contact.score)}40`,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    cursor: recomputing ? "wait" : "pointer",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  <div style={{ fontSize: 19, fontWeight: 800, color: scoreColor(contact.score) }}>
                    {recomputing ? "…" : contact.score}
                  </div>
                  <div style={{ fontSize: 9, color: C.t3 }}>{isAr ? "نقاط" : "Score"}</div>
                </button>
              </div>

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginTop: 12, flexWrap: "wrap" }}>
                  {contact.tags.map((t: any, i) => {
                    // Defensive: tag may still arrive as a pivot row object
                    // from older cached responses. Render its string form so
                    // React doesn't throw error #31 on legacy payloads.
                    const label = typeof t === 'string' ? t : (t?.tag ?? t?.name ?? '');
                    if (!label) return null;
                    const color = label === "VIP" ? COLORS.warn : COLORS.pri;
                    return (
                      <span
                        key={i}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: color + "20",
                          color,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {label}
                        <button
                          onClick={() => handleRemoveTag(label)}
                          aria-label={isAr ? `حذف وسم ${label}` : `Remove ${label}`}
                          style={{
                            background: "transparent",
                            border: "none",
                            color,
                            cursor: "pointer",
                            padding: 0,
                            lineHeight: 1,
                            fontSize: 13,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Behavior tiles — quick scan */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
              padding: "14px 20px",
              borderBottom: `1px solid ${C.brdL}`,
            }}>
              {[
                {
                  label: isAr ? "الطلبات" : "Orders",
                  value: contact.orders,
                  color: COLORS.pri,
                },
                {
                  label: isAr ? "LTV" : "LTV",
                  value: `${Number(contact.ltv).toLocaleString()} ${isAr ? "ر.س" : "SAR"}`,
                  color: COLORS.ok,
                },
                {
                  label: isAr ? "متوسّط" : "Avg",
                  value: `${Number(contact.avgOrder ?? 0).toLocaleString()} ${isAr ? "ر.س" : "SAR"}`,
                  color: COLORS.info,
                },
                {
                  label: isAr ? "فتح %" : "Open %",
                  value: `${(contact.behavior?.opens ?? 0).toFixed(0)}%`,
                  color: COLORS.pri,
                },
                {
                  label: isAr ? "نقر %" : "Click %",
                  value: `${(contact.behavior?.clicks ?? 0).toFixed(0)}%`,
                  color: COLORS.sec,
                },
                {
                  label: isAr ? "ردود %" : "Reply %",
                  value: `${(contact.behavior?.replies ?? 0).toFixed(0)}%`,
                  color: COLORS.warn,
                },
              ].map((tile, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 6px",
                    background: isDark ? C.inp : "#FAFAF8",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 9.5, color: C.t3, marginBottom: 2 }}>{tile.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tile.color }}>{tile.value}</div>
                </div>
              ))}
            </div>

            {/* Sales stage — only when the tenant has a pipeline. The
                selector is the same move the board makes, so an agent
                working from the inbox never has to switch screens. */}
            {stages.length > 0 && (
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.brdL}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t2, marginBottom: 8 }}>
                  {isAr ? "مرحلة الصفقة" : "Deal stage"}
                </div>
                <select
                  value={contact.stage?.id || ""}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={movingStage}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: `1px solid ${contact.stage?.color || C.brd}`,
                    background: contact.stage ? `${contact.stage.color}12` : C.inp,
                    color: C.txt, fontSize: 12.5, fontFamily: FONT_FAMILY,
                    cursor: movingStage ? "wait" : "pointer",
                  }}
                >
                  <option value="">{isAr ? "بدون مرحلة" : "No stage"}</option>
                  {stages.map((s: any) => (
                    <option key={s.id} value={s.id}>{isAr ? s.name : (s.nameEn || s.name)}</option>
                  ))}
                </select>

                {(contact.stageHistory || []).length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {(contact.stageHistory || []).slice(0, 4).map((h, i) => (
                      <div key={i} style={{ fontSize: 11, color: C.t3, padding: "3px 0" }}>
                        {h.from ? `${h.from} ← ${h.to ?? (isAr ? "خارج المسار" : "removed")}` : (h.to ?? "")}
                        <span style={{ marginInlineStart: 6, opacity: 0.75 }}>{h.at}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Notes */}
            {contact.aiNotes && contact.aiNotes.length > 0 && (
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.brdL}` }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 700, color: AI_COLOR,
                  marginBottom: 10,
                }}>
                  <Icon name="brain" size={14} />
                  <span>{isAr ? "رؤى ذكيّة" : "AI Insights"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {contact.aiNotes.map((note, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: isDark ? "#1a1030" : "#F8F4FF",
                        border: `1px solid ${AI_COLOR}25`,
                        fontSize: 12, lineHeight: 1.55, color: C.txt,
                      }}
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {contact.timeline && contact.timeline.length > 0 && (
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.brdL}`, flex: 1 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: C.txt, marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Icon name="calendar" size={14} />
                  <span>{isAr ? "سجل النشاط" : "Activity Timeline"}</span>
                </div>
                <div style={{ position: "relative", paddingInlineStart: 22 }}>
                  {/* Vertical guide line */}
                  <div style={{
                    position: "absolute",
                    top: 4, bottom: 4,
                    [isAr ? "right" : "left"]: 8 as any,
                    width: 2,
                    background: C.brdL,
                  }} />
                  {contact.timeline.map((event, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        paddingInlineStart: 16,
                        paddingBottom: 12,
                      }}
                    >
                      <div style={{
                        position: "absolute",
                        [isAr ? "right" : "left"]: -14 as any,
                        top: 2,
                        width: 18, height: 18,
                        borderRadius: 9,
                        background: tpColor[event.type] ?? C.t3,
                        border: `3px solid ${C.card}`,
                        display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "#fff",
                      }}>
                        <Icon name={tpIcon[event.type] ?? "gear"} size={9} />
                      </div>
                      <div style={{ fontSize: 12, color: C.txt, fontWeight: 600 }}>
                        {event.label}
                      </div>
                      <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>
                        {event.at}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky action bar at bottom */}
            <div style={{
              position: "sticky", bottom: 0,
              background: C.card,
              borderTop: `1px solid ${C.brd}`,
              padding: "12px 20px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}>
              <Button outline small onClick={() => showToast("✓")}>
                <Icon name="send" size={12} /> {isAr ? "رسالة" : "Message"}
              </Button>
              <Button outline small onClick={() => showToast("✓")}>
                <Icon name="megaphone" size={12} /> {isAr ? "حملة" : "Campaign"}
              </Button>
              <Button outline small onClick={() => { setTagInput(""); setShowTagModal(true); }}>
                <Icon name="tag" size={12} /> {isAr ? "وسم" : "Tag"}
              </Button>
              <Button outline small style={{ color: COLORS.err, borderColor: COLORS.err }}
                onClick={async () => {
                  try {
                    await api.post(`/contacts/${contactId}/block`);
                    showToast(isAr ? "تم الحظر" : "Blocked");
                    onMutated?.();
                    onClose();
                  } catch {
                    showToast(isAr ? "تعذّر الحظر" : "Couldn't block");
                  }
                }}>
                <Icon name="lock" size={12} /> {isAr ? "حظر" : "Block"}
              </Button>
              <Button outline small style={{ color: COLORS.err, borderColor: COLORS.err }}
                onClick={() => {
                  setDeleteConfirmText("");
                  setShowDeleteModal(true);
                }}>
                <Icon name="trash" size={12} /> {isAr ? "حذف" : "Delete"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation modal — sits above the drawer (zIndex 100)
          so the backdrop still dims the drawer. We require typing the
          contact name exactly because soft delete is reversible from
          Nova but not from this UI, and a misclick on a high-LTV
          contact would still surprise the operator. */}
      {showDeleteModal && contact && (
        <>
          <div
            onClick={() => !deleting && setShowDeleteModal(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 100,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(440px, 92vw)",
              background: C.card,
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              zIndex: 101,
              fontFamily: FONT_FAMILY,
              direction: isAr ? "rtl" : "ltr",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: COLORS.err + "20",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="trash" size={18} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>
                {isAr ? "حذف جهة الاتصال؟" : "Delete contact?"}
              </div>
            </div>

            <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, marginBottom: 14 }}>
              {isAr
                ? "سيختفي العميل من القوائم. سجلّ المحادثات والرسائل وموافقات الواتساب تبقى محفوظة (يمكن للإدارة الاسترجاع خلال 30 يوماً قبل الحذف النهائي)."
                : "The contact will vanish from your lists. Conversations, messages and WhatsApp opt-in records stay preserved (Admin can restore within 30 days before final purge)."}
            </div>

            <div style={{ fontSize: 12, color: C.t3, marginBottom: 6 }}>
              {isAr
                ? <>اكتب اسم العميل للتأكيد: <strong style={{ color: C.txt }}>{contact.name}</strong></>
                : <>Type the contact name to confirm: <strong style={{ color: C.txt }}>{contact.name}</strong></>}
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoFocus
              disabled={deleting}
              placeholder={contact.name}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1.5px solid ${C.brd}`,
                background: C.inp,
                color: C.txt,
                fontSize: 13,
                fontFamily: FONT_FAMILY,
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button outline small disabled={deleting}
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button small
                disabled={deleting || deleteConfirmText.trim() !== contact.name.trim()}
                onClick={handleDelete}
                style={{
                  background: COLORS.err,
                  borderColor: COLORS.err,
                  color: "#fff",
                  opacity: (deleting || deleteConfirmText.trim() !== contact.name.trim()) ? 0.5 : 1,
                }}>
                {deleting
                  ? (isAr ? "جاري الحذف..." : "Deleting...")
                  : (isAr ? "حذف نهائي" : "Delete")}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Tag modal — sits above the drawer like the delete one. Enter
          submits; Esc / Cancel closes. Backend rejects empty/duplicate
          tags too, but we short-circuit duplicates client-side to avoid
          a confusing 422. */}
      {showTagModal && contact && (
        <>
          <div
            onClick={() => !savingTag && setShowTagModal(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 100,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(420px, 92vw)",
              background: C.card,
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              zIndex: 101,
              fontFamily: FONT_FAMILY,
              direction: isAr ? "rtl" : "ltr",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: COLORS.pri + "20",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="tag" size={18} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>
                {isAr ? "إضافة وسم" : "Add tag"}
              </div>
            </div>

            <div style={{ fontSize: 12, color: C.t3, marginBottom: 6 }}>
              {isAr
                ? <>سيظهر الوسم في قائمة وسوم العميل ويمكن استخدامه لإنشاء شريحة.</>
                : <>The tag will show on this contact and can be used to build a segment.</>}
            </div>

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag();
                if (e.key === 'Escape' && !savingTag) setShowTagModal(false);
              }}
              autoFocus
              disabled={savingTag}
              maxLength={50}
              placeholder={isAr ? "اسم الوسم (مثال: VIP)" : "Tag name (e.g. VIP)"}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1.5px solid ${C.brd}`,
                background: C.inp,
                color: C.txt,
                fontSize: 13,
                fontFamily: FONT_FAMILY,
                marginTop: 8,
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button outline small disabled={savingTag}
                onClick={() => { setShowTagModal(false); setTagInput(""); }}>
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button small
                disabled={savingTag || !tagInput.trim()}
                onClick={handleAddTag}
                style={{
                  opacity: (savingTag || !tagInput.trim()) ? 0.5 : 1,
                }}>
                {savingTag
                  ? (isAr ? "جاري الحفظ..." : "Saving...")
                  : (isAr ? "إضافة" : "Add")}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
