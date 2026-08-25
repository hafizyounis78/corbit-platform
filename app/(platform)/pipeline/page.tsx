"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Card, Button, Badge, TabBar } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { usePipelineBoard, usePipelineFunnel } from "@/lib/api/hooks";
import { ContactDetailDrawer } from "@/components/contacts/contact-detail-drawer";
import api from "@/lib/api/client";

interface BoardCard {
  id: string;
  name: string;
  ph: string;
  score: number;
  ltv: number;
  movedAt: string | null;
}

interface BoardColumn {
  id: string;
  name: string;
  nameEn: string | null;
  color: string;
  isWon: boolean;
  isLost: boolean;
  count: number;
  contacts: BoardCard[];
}

/**
 * The sales board: عميل جديد → تمّ التواصل → عرض سعر → متابعة →
 * مكسوب / مفقود.
 *
 * A card moves two ways on purpose. Dragging is what a salesperson
 * expects on a desktop; the per-card dropdown is what actually works
 * on a phone and with a keyboard, and it is the only path that exists
 * on mobile where HTML5 drag events never fire.
 *
 * A move is applied optimistically — the card jumps immediately and
 * the board refetches after the request lands. On failure the refetch
 * restores the truth rather than us hand-rolling a rollback.
 */
export default function PipelinePage() {
  const { colors: C } = useTheme();
  const { t, isAr } = useLocale();
  const { showToast } = useToast();
  const isMob = useIsMobile();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [tab, setTab] = useState("board");
  const [range, setRange] = useState("monthly");
  const { data: boardData, isLoading, mutate } = usePipelineBoard();
  const { data: funnelData, mutate: mutateFunnel } = usePipelineFunnel(range);

  const [creating, setCreating] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [openContactId, setOpenContactId] = useState<string | null>(null);

  const columns: BoardColumn[] = Array.isArray(boardData) ? boardData : [];
  const funnel = funnelData ?? null;

  const stageName = (col: BoardColumn) => (isAr ? col.name : col.nameEn || col.name);

  const createDefaults = async () => {
    setCreating(true);
    try {
      await api.post("/pipeline/stages/defaults");
      showToast(isAr ? "تمّ إنشاء المراحل" : "Stages created");
      mutate();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? "تعذّر الإنشاء" : "Couldn't create"), "error");
    } finally {
      setCreating(false);
    }
  };

  const moveCard = async (contactId: string, stageId: string) => {
    setMovingId(contactId);
    try {
      await api.patch(`/contacts/${contactId}/stage`, { stage_id: stageId });
      mutate();
      mutateFunnel();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? "تعذّر نقل العميل" : "Couldn't move contact"), "error");
      mutate();
    } finally {
      setMovingId(null);
    }
  };

  // ── Empty state: no stages defined yet ───────────────────
  if (!isLoading && columns.length === 0) {
    return (
      <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{t("pipeline")}</h2>
        <p style={{ fontSize: 13, color: C.t2, margin: "0 0 20px" }}>
          {isAr ? "تابع العملاء المحتملين من أوّل تواصل حتّى إغلاق الصفقة" : "Track leads from first contact to closed deal"}
        </p>

        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.txt, marginBottom: 8 }}>
            {isAr ? "لم تُنشأ مراحل بعد" : "No stages yet"}
          </div>
          <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.8, maxWidth: 460, margin: "0 auto 18px" }}>
            {isAr
              ? "ابدأ بالمراحل القياسيّة: عميل جديد ← تمّ التواصل ← عرض سعر ← متابعة ← مكسوب / مفقود. يمكنك تعديلها أو إضافة غيرها في أي وقت."
              : "Start with the standard stages: New Lead → Contacted → Quotation → Follow-Up → Won / Lost. Rename, reorder or add your own at any time."}
          </p>
          {isAdmin ? (
            <Button primary onClick={createDefaults} disabled={creating}>
              {creating ? (isAr ? "جارٍ الإنشاء..." : "Creating...") : (isAr ? "إنشاء المراحل القياسيّة" : "Create standard stages")}
            </Button>
          ) : (
            <p style={{ fontSize: 12.5, color: C.t3, margin: 0 }}>
              {isAr ? "اطلب من مدير الحساب إنشاء المراحل" : "Ask an account admin to create the stages"}
            </p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{t("pipeline")}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>
            {isAr ? "تابع العملاء المحتملين من أوّل تواصل حتّى إغلاق الصفقة" : "Track leads from first contact to closed deal"}
          </p>
        </div>
        {tab === "funnel" && (
          <TabBar
            tabs={[{ key: "daily", label: t("daily") }, { key: "weekly", label: t("weekly") }, { key: "monthly", label: t("monthly") }]}
            active={range}
            onChange={setRange}
          />
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <TabBar
          tabs={[
            { key: "board", label: isAr ? "اللوحة" : "Board" },
            { key: "funnel", label: isAr ? "قمع المبيعات" : "Funnel" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {isLoading && (
        <p style={{ fontSize: 13, color: C.t2 }}>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
      )}

      {/* ── Board ── */}
      {!isLoading && tab === "board" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMob ? "1fr" : `repeat(${columns.length}, minmax(220px, 1fr))`,
            gap: 12,
            overflowX: "auto",
            alignItems: "start",
          }}
        >
          {columns.map((col) => (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(col.id); }}
              onDragLeave={() => setDragOverStage((s) => (s === col.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                const contactId = e.dataTransfer.getData("text/plain");
                if (contactId) moveCard(contactId, col.id);
              }}
              style={{
                background: dragOverStage === col.id ? `${col.color}18` : C.inp,
                border: `1px ${dragOverStage === col.id ? "dashed" : "solid"} ${dragOverStage === col.id ? col.color : C.brdL}`,
                borderRadius: 12,
                padding: 10,
                minHeight: 160,
                transition: "background 120ms ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>{stageName(col)}</span>
                <span style={{ marginInlineStart: "auto", fontSize: 12, fontWeight: 700, color: C.t2 }}>{col.count}</span>
              </div>

              {col.contacts.length === 0 && (
                <p style={{ fontSize: 11.5, color: C.t3, textAlign: "center", padding: "14px 0", margin: 0 }}>
                  {isAr ? "لا أحد هنا" : "Empty"}
                </p>
              )}

              {col.contacts.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.brdL}`,
                    borderRadius: 10,
                    padding: "9px 10px",
                    marginBottom: 6,
                    opacity: movingId === c.id ? 0.5 : 1,
                    cursor: "grab",
                  }}
                >
                  <button
                    onClick={() => setOpenContactId(c.id)}
                    style={{
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      fontSize: 12.5, fontWeight: 600, color: C.txt,
                      fontFamily: FONT_FAMILY, textAlign: "start", width: "100%",
                    }}
                  >
                    {c.name}
                  </button>
                  <div style={{ fontSize: 10.5, color: C.t3, direction: "ltr", textAlign: isAr ? "right" : "left" }}>
                    {c.ph}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    {c.ltv > 0 && (
                      <Badge color={C.pri}>{`${Number(c.ltv).toLocaleString()} ${isAr ? "ر.س" : "SAR"}`}</Badge>
                    )}
                    {c.movedAt && (
                      <span style={{ fontSize: 10, color: C.t3, marginInlineStart: "auto" }}>{c.movedAt}</span>
                    )}
                  </div>

                  {/* The path that works on a phone and with a keyboard —
                      HTML5 drag events never fire on touch. */}
                  <select
                    value={col.id}
                    onChange={(e) => { if (e.target.value !== col.id) moveCard(c.id, e.target.value); }}
                    disabled={movingId === c.id}
                    aria-label={isAr ? "نقل إلى مرحلة" : "Move to stage"}
                    style={{
                      width: "100%", marginTop: 8, padding: "5px 6px",
                      borderRadius: 7, border: `1px solid ${C.brdL}`,
                      background: C.inp, color: C.t2, fontSize: 11,
                      fontFamily: FONT_FAMILY, cursor: "pointer",
                    }}
                  >
                    {columns.map((o) => (
                      <option key={o.id} value={o.id}>{stageName(o)}</option>
                    ))}
                  </select>
                </div>
              ))}

              {col.count > col.contacts.length && (
                <p style={{ fontSize: 10.5, color: C.t3, textAlign: "center", margin: "4px 0 0" }}>
                  {isAr
                    ? `+${col.count - col.contacts.length} غير معروضين`
                    : `+${col.count - col.contacts.length} more`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Funnel ── */}
      {!isLoading && tab === "funnel" && funnel && (
        <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "2fr 1fr", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>
              {isAr ? "كم عميلاً وصل لكلّ مرحلة" : "How many leads reached each stage"}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 11.5, color: C.t2 }}>
              {isAr
                ? "يُحسب من حركة المراحل خلال الفترة — لا من مكان العملاء اليوم"
                : "Counted from stage movements in the period — not from where leads sit today"}
            </p>

            {(funnel.stages ?? []).map((s: any) => {
              const max = Math.max(...(funnel.stages ?? []).map((x: any) => x.entered), 1);
              const pct = Math.round((s.entered / max) * 100);
              return (
                <div key={s.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ color: C.t2 }}>{isAr ? s.name : (s.nameEn || s.name)}</span>
                    <span style={{ fontWeight: 700, color: C.txt }}>
                      {s.entered}
                      <span style={{ fontSize: 11, color: C.t3, fontWeight: 400 }}>
                        {isAr ? ` (${s.current} حاليّاً)` : ` (${s.current} now)`}
                      </span>
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 6, background: C.inp, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 6 }} />
                  </div>
                </div>
              );
            })}
          </Card>

          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>
              {isAr ? "الإغلاق" : "Closing"}
            </h3>
            {[
              [isAr ? "مكسوبة" : "Won", funnel.won ?? 0, C.ok],
              [isAr ? "مفقودة" : "Lost", funnel.lost ?? 0, C.err],
              [isAr ? "نسبة الفوز" : "Win rate", `${funnel.winRate ?? 0}%`, C.pri],
            ].map(([label, value, color]: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: C.inp, marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: C.t2 }}>{label}</span>
                <span style={{ fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <ContactDetailDrawer
        contactId={openContactId}
        onClose={() => setOpenContactId(null)}
        onMutated={() => { mutate(); mutateFunnel(); }}
      />
    </div>
  );
}
