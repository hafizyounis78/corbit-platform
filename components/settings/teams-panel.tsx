"use client";

/**
 * Multi-teams management panel.
 *
 * Lists the org's teams (the auto-provisioned Default Team plus
 * any custom ones), lets Starter+ tenants create more, and surfaces
 * the plan gate inline. On Basic the "+ Create team" button is
 * disabled with a clear hint that explains why — the Default team
 * still works for member assignment.
 *
 * Backed by /api/teams (GET / POST / DELETE). The POST is the gate
 * site the backend wired in 8b1add0; any 403 response from a race
 * (UI cached an old plan) surfaces verbatim in the error toast.
 */

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useTeams, usePlanUsage } from "@/lib/api/hooks";
import api from "@/lib/api/client";

type Team = {
  id: string;
  name: string;
  name_ar?: string | null;
  color?: string | null;
  lead_id?: string | null;
  member_count?: number;
};

const DEFAULT_COLOR = "#6366f1";
const COLOR_PRESETS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

export function TeamsPanel() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const { data, mutate } = useTeams();
  const { data: planData } = usePlanUsage();

  // The /api/teams endpoint returns { teams: [...], members: [...] }
  // wrapped in the standard { success, data } envelope. useApi
  // already unwraps to `data`, but we still need to dig out `teams`.
  // member_count isn't on the team resource — derive it from the
  // members list (team_id match) so the badge stays accurate even
  // for the Default Team that wasn't created with a count column.
  const teamsRaw = ((data as any)?.teams ?? []) as Team[];
  const members = ((data as any)?.members ?? []) as Array<{ team_id?: string | null }>;
  const memberCountByTeam: Record<string, number> = {};
  for (const m of members) {
    if (!m.team_id) continue;
    memberCountByTeam[m.team_id] = (memberCountByTeam[m.team_id] ?? 0) + 1;
  }
  const teams: Team[] = teamsRaw.map((t) => ({
    ...t,
    member_count: memberCountByTeam[t.id] ?? 0,
  }));

  const teamsEnabled = (planData?.limits?.teams_enabled as boolean | undefined) ?? false;

  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Team | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", name_ar: "", color: DEFAULT_COLOR });

  const reset = () => setForm({ name: "", name_ar: "", color: DEFAULT_COLOR });

  const handleAdd = async () => {
    if (!form.name.trim()) {
      showToast(isAr ? "اسم الفريق إلزامي" : "Team name required", "error");
      return;
    }
    setAdding(true);
    try {
      await api.post('/teams', {
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || undefined,
        color: form.color,
      });
      showToast(isAr ? "تمّ إنشاء الفريق" : "Team created", "success");
      setShowAdd(false);
      reset();
      mutate();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Create failed";
      showToast(msg, "error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setDeletingId(id);
    try {
      await api.delete(`/teams/${id}`);
      showToast(isAr ? "تمّ الحذف" : "Deleted", "success");
      setConfirmDelete(null);
      mutate();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Delete failed";
      showToast(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.txt, marginBottom: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="users" size={14} />
              <span>{isAr ? "الفرق" : "Teams"}</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>
            {isAr
              ? `${teams.length} فريق. الفرق تساعد في توزيع المحادثات وتنظيم الأعضاء حسب التخصّص.`
              : `${teams.length} teams. Use teams to route conversations and group members by specialty.`}
          </p>
        </div>
        <div title={!teamsEnabled ? (isAr ? "غير متاح في باقتك الحاليّة" : "Not available in your plan") : undefined}>
          <Button
            primary
            disabled={!teamsEnabled}
            onClick={() => { reset(); setShowAdd(true); }}
          >
            {isAr ? "إنشاء فريق" : "Create team"}
          </Button>
        </div>
      </div>

      {!teamsEnabled && (
        <div style={{ fontSize: 12, color: C.t2, padding: 10, background: C.inp, borderRadius: 8, marginBottom: 14, lineHeight: 1.7 }}>
          {isAr
            ? "إنشاء فرق متعدّدة متاح في باقات Starter وأعلى. تقدر تستخدم الفريق الافتراضي لتوزيع الأعضاء حالياً."
            : "Creating multiple teams is available on Starter and above. You can still assign members to the Default Team for now."}
        </div>
      )}

      {teams.length === 0 ? (
        <div style={{ fontSize: 13, color: C.t2, padding: 12, background: C.inp, borderRadius: 8 }}>
          {isAr ? "لا توجد فرق بعد." : "No teams yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {teams.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                padding: 12, borderRadius: 8, border: `1px solid ${C.brd}`, flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                <span style={{
                  display: "inline-block", width: 12, height: 12, borderRadius: 6,
                  background: t.color || DEFAULT_COLOR, flexShrink: 0,
                }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.txt }}>
                    {(isAr && t.name_ar) || t.name}
                  </div>
                  {typeof t.member_count === "number" && (
                    <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>
                      <Badge color={C.t2}>
                        {t.member_count} {isAr ? "عضو" : "members"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setConfirmDelete(t)}
                disabled={deletingId === t.id}
              >
                {deletingId === t.id
                  ? (isAr ? "جاري الحذف..." : "Deleting...")
                  : (isAr ? "حذف" : "Delete")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); reset(); }}
        title={isAr ? "إنشاء فريق جديد" : "Create New Team"}
        submitLabel={adding ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء" : "Create")}
        onSubmit={handleAdd}
        submitLoading={adding}
        submitDisabled={adding}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label={isAr ? "اسم الفريق (إنجليزي)" : "Team Name (English)"} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Sales Team"
              style={inputStyle(C)}
            />
          </Field>
          <Field label={isAr ? "اسم الفريق (عربي) — اختياري" : "Team Name (Arabic) — optional"}>
            <input
              type="text"
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              placeholder="فريق المبيعات"
              style={inputStyle(C)}
            />
          </Field>
          <Field label={isAr ? "اللون" : "Color"}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: 32, height: 32, borderRadius: 6, background: c,
                    border: form.color === c ? `3px solid ${C.txt}` : `1px solid ${C.brd}`,
                    cursor: "pointer", padding: 0,
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </Field>
        </div>
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={isAr ? "تأكيد حذف الفريق" : "Confirm Delete Team"}
        submitLabel={
          deletingId
            ? (isAr ? "جاري الحذف..." : "Deleting...")
            : (isAr ? "نعم، احذف" : "Yes, delete")
        }
        onSubmit={handleDelete}
        submitLoading={deletingId !== null}
        submitDisabled={deletingId !== null}
      >
        <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.7 }}>
          {isAr ? (
            <>
              سيتمّ حذف فريق{" "}
              <strong>{confirmDelete?.name_ar || confirmDelete?.name}</strong>.
              الأعضاء المعيّنون لهذا الفريق لن يُحذفوا، فقط ستزول إشارتهم لهذا الفريق.
            </>
          ) : (
            <>
              The team <strong>{confirmDelete?.name}</strong> will be deleted.
              Members assigned to it stay, only their team link is removed.
            </>
          )}
        </div>
      </Modal>
    </Card>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  const { colors: C } = useTheme();
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function inputStyle(C: any): React.CSSProperties {
  return {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
    fontSize: 13, outline: "none",
  };
}
