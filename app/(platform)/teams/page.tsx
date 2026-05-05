"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Card, Button, TabBar, Badge, Avatar, Toggle, Modal, Pagination } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { CredentialsModal } from "@/components/shared/credentials-modal";
import { FONT_FAMILY } from "@/lib/constants/font";
import { ProgressBar } from "@/components/charts/progress-bar";
import { useTeams } from "@/lib/api/hooks";
import api from "@/lib/api/client";

export default function TeamsPage() {
  const { colors: C, isDark: dk } = useTheme();
  const { t, isAr, lang } = useLocale();
  const { showToast } = useToast();
  const isMob = useIsMobile();
  const ar = isAr;
  const [tab, setTab] = useState("members");
  const [page, setPage] = useState(1);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", phone: "", password: "", role: "agent", team_id: "", skills: [] as string[], schedule: { sun: true, mon: true, tue: true, wed: true, thu: true, fri: false, sat: false } as Record<string, boolean>, startTime: "09:00", endTime: "17:00" });
  const [credentialsResult, setCredentialsResult] = useState<null | { name: string; email: string; phone: string | null; password: string; notification: { sent: boolean; channel: string; detail?: string }; loginUrl: string; }>(null);
  const [showEditMember, setShowEditMember] = useState(false);
  const [editMemberLoading, setEditMemberLoading] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  // Team create/edit modal — name + services catalog. The catalog
  // gates which conversations get routed here once routing rules
  // are wired up.
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamModalTarget, setTeamModalTarget] = useState<any | null>(null);
  const [teamModalLoading, setTeamModalLoading] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", name_ar: "", services: [] as string[] });
  const [customService, setCustomService] = useState("");

  // Fetch from API
  const { data: apiData, isLoading, mutate } = useTeams();
  const members = apiData?.members || [];
  const teams = apiData?.teams || [];

  const MEMBERS_PER_PAGE = 10;
  const totalMemberPages = Math.ceil(members.length / MEMBERS_PER_PAGE);
  const paginatedMembers = members.slice((page - 1) * MEMBERS_PER_PAGE, page * MEMBERS_PER_PAGE);

  useEffect(() => { setPage(1); }, [tab]);

  const tabs = [
    { key: "members", label: t("members") },
    { key: "teams", label: t("teams") },
    { key: "routing", label: t("routing") },
    { key: "schedule", label: t("schedule") },
  ];

  const [routingRules, setRoutingRules] = useState([
    { key: "round_robin", name: ar ? "توزيع دائري" : "Round Robin", desc: ar ? "توزيع متساوي بين الوكلاء" : "Equal distribution", on: true },
    { key: "skill_based", name: ar ? "حسب المهارة" : "Skill-based", desc: ar ? "توجيه حسب مهارات الوكيل" : "Route by agent skills", on: true },
    { key: "vip_priority", name: ar ? "أولوية VIP" : "VIP Priority", desc: ar ? "عملاء VIP أولاً" : "VIP customers first", on: true },
    { key: "auto_escalation", name: ar ? "تصعيد تلقائي" : "Auto Escalation", desc: ar ? "تصعيد بعد 10 دقائق" : "Escalate after 10 min", on: true },
    { key: "ai_first", name: ar ? "AI أولاً" : "AI First", desc: ar ? "يحاول البوت قبل التحويل" : "Bot tries before transfer", on: false },
  ]);

  const days = ar ? ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  const SKILL_OPTIONS = [
    { key: "sales", label: ar ? "مبيعات" : "Sales" },
    { key: "support", label: ar ? "دعم" : "Support" },
    { key: "technical", label: ar ? "تقني" : "Technical" },
    { key: "billing", label: ar ? "فوترة" : "Billing" },
  ];

  const toggleSkill = (key: string) => {
    setNewMember(prev => ({
      ...prev,
      skills: prev.skills.includes(key) ? prev.skills.filter(s => s !== key) : [...prev.skills, key],
    }));
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim()) { showToast(ar ? "يرجى إدخال الاسم" : "Please enter name"); return; }
    if (!newMember.email.trim()) { showToast(ar ? "يرجى إدخال البريد" : "Please enter email"); return; }
    if (!newMember.phone.trim()) { showToast(ar ? "يرجى إدخال رقم الجوال" : "Please enter phone number"); return; }
    if (newMember.password && newMember.password.length < 8) {
      showToast(ar ? "كلمة المرور يجب ألا تقل عن 8 أحرف" : "Password must be at least 8 characters");
      return;
    }
    setAddMemberLoading(true);
    try {
      const activeDays = dayKeys.filter(k => newMember.schedule[k]);
      const res = await api.post('/teams/members', {
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        ...(newMember.password ? { password: newMember.password } : {}),
        role: newMember.role,
        ...(newMember.team_id ? { team_id: newMember.team_id } : {}),
        skills: newMember.skills,
        schedule: {
          days: activeDays,
          start: newMember.startTime,
          end: newMember.endTime,
        },
      });
      const data = res.data?.data || {};
      setShowAddMember(false);
      setCredentialsResult({
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        password: data.password,
        notification: data.notification || { sent: false, channel: 'unknown' },
        loginUrl: typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login',
      });
      setNewMember({ name: "", email: "", phone: "", password: "", role: "agent", team_id: "", skills: [], schedule: { sun: true, mon: true, tue: true, wed: true, thu: true, fri: false, sat: false }, startTime: "09:00", endTime: "17:00" });
      mutate();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      const errorMap: Record<string, string> = {
        'The email has already been taken.': 'البريد الإلكتروني مستخدم بالفعل',
        'The email field is required.': 'حقل البريد الإلكتروني مطلوب',
        'The name field is required.': 'حقل الاسم مطلوب',
        'The email field must be a valid email address.': 'البريد الإلكتروني غير صالح',
      };
      const displayMsg = ar && msg ? (errorMap[msg] || msg) : msg;
      showToast(displayMsg || (ar ? "حدث خطأ أثناء الإضافة" : "Error adding member"));
    } finally {
      setAddMemberLoading(false);
    }
  };

  const openEditMember = (m: any) => {
    setEditMember({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      team_id: teams.find((t: any) => t.name === m.team)?.id || "",
      skills: m.skills || [],
    });
    setShowEditMember(true);
  };

  const handleEditMember = async () => {
    if (!editMember) return;
    setEditMemberLoading(true);
    try {
      await api.patch(`/teams/members/${editMember.id}`, {
        name: editMember.name,
        email: editMember.email,
        role: editMember.role,
        ...(editMember.team_id ? { team_id: editMember.team_id } : { team_id: null }),
        skills: editMember.skills,
      });
      showToast(ar ? "تم تحديث العضو بنجاح" : "Member updated successfully");
      setShowEditMember(false);
      mutate();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      showToast(msg || (ar ? "حدث خطأ أثناء التحديث" : "Error updating member"));
    } finally {
      setEditMemberLoading(false);
    }
  };

  const toggleEditSkill = (key: string) => {
    setEditMember((prev: any) => ({
      ...prev,
      skills: prev.skills.includes(key) ? prev.skills.filter((s: string) => s !== key) : [...prev.skills, key],
    }));
  };

  const handleToggleRouting = async (ruleKey: string) => {
    setRoutingRules(prev => prev.map(r =>
      r.key === ruleKey ? { ...r, on: !r.on } : r
    ));
    try {
      const rule = routingRules.find(r => r.key === ruleKey);
      await api.patch('/settings/conversations', {
        routing_rules: { [ruleKey]: !rule?.on }
      });
    } catch {}
  };

  const openCreateTeam = () => {
    setTeamModalTarget(null);
    setTeamForm({ name: "", name_ar: "", services: [] });
    setCustomService("");
    setShowTeamModal(true);
  };

  const openEditTeam = (team: any) => {
    setTeamModalTarget(team);
    setTeamForm({
      name: team?.name_en ?? team?.name ?? "",
      name_ar: team?.name_ar ?? "",
      services: Array.isArray(team?.services_catalog) ? team.services_catalog : [],
    });
    setCustomService("");
    setShowTeamModal(true);
  };

  const handleSaveTeam = async () => {
    const trimmedEn = teamForm.name.trim();
    const trimmedAr = teamForm.name_ar.trim();
    if (!trimmedEn && !trimmedAr) {
      showToast(ar ? "أدخل اسم الفريق" : "Enter a team name", "error");
      return;
    }
    setTeamModalLoading(true);
    try {
      const payload: Record<string, any> = {
        name: trimmedEn || trimmedAr,
        name_ar: trimmedAr || null,
        services_catalog: teamForm.services,
      };
      if (teamModalTarget?.id) {
        await api.patch(`/teams/${teamModalTarget.id}`, payload);
        showToast(ar ? "تم تحديث الفريق ✓" : "Team updated ✓");
      } else {
        await api.post("/teams", payload);
        showToast(ar ? "تم إنشاء الفريق ✓" : "Team created ✓");
      }
      setShowTeamModal(false);
      mutate();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message
          || (ar ? "تعذّر حفظ الفريق" : "Failed to save team"),
        "error",
      );
    } finally {
      setTeamModalLoading(false);
    }
  };

  const toggleServiceChip = (service: string) => {
    setTeamForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const addCustomService = () => {
    const v = customService.trim();
    if (!v) return;
    if (!teamForm.services.includes(v)) {
      setTeamForm((prev) => ({ ...prev, services: [...prev.services, v] }));
    }
    setCustomService("");
  };

  // Six common services as starter chips. Operators can also add
  // free-form ones — the value persists as JSON, no enum constraint.
  const PRESET_SERVICES = ar
    ? [
        "استعادة كلمة المرور",
        "الشكاوى",
        "تسجيل طلب شراء",
        "الاستفسارات العامة",
        "الدعم الفني",
        "الاسترجاع والاستبدال",
      ]
    : [
        "Password Reset",
        "Complaints",
        "Purchase Orders",
        "General Inquiries",
        "Technical Support",
        "Returns & Exchanges",
      ];

  if (isLoading) {
    return (
      <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <p style={{ fontSize: 14, color: C.t2 }}>{ar ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t("teams")}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: "4px 0 0" }}>{ar ? "إدارة الفرق والوكلاء" : "Manage teams and agents"}</p>
        </div>
        <Button primary onClick={() => { setNewMember({ name: "", email: "", phone: "", password: "", role: "agent", team_id: "", skills: [], schedule: { sun: true, mon: true, tue: true, wed: true, thu: true, fri: false, sat: false }, startTime: "09:00", endTime: "17:00" }); setShowAddMember(true); }}>{t("addMember")}</Button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === "members" && (
        <Card>
          {members.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
              {ar ? "لا يوجد أعضاء" : "No members"}
            </div>
          )}
          {members.length > 0 && <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {[t("name"), t("team"), ar ? "الدور" : "Role", t("status"), t("conv"), t("frt"), t("csat"), ar ? "الحمل" : "Load", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 14px", textAlign: "inherit", fontSize: 11.5, fontWeight: 600, color: C.t2, borderBottom: `1px solid ${C.brd}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((m: any) => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ position: "relative" }}>
                          <Avatar name={m.name} size={34} />
                          {m.online && <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, background: C.ok, border: `2px solid ${C.card}` }} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: C.t3 }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>{m.team}</td>
                    <td style={{ padding: "12px 14px" }}><Badge color={m.role === "supervisor" ? C.warn : C.info}>{m.role === "supervisor" ? t("sup") : t("agentR")}</Badge></td>
                    <td style={{ padding: "12px 14px" }}><Badge color={m.online ? C.ok : C.t3}>{m.online ? t("onl") : t("offl")}</Badge></td>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>{m.stats.convos}</td>
                    <td style={{ padding: "12px 14px" }}>{m.stats.frt}</td>
                    <td style={{ padding: "12px 14px" }}><span style={{ fontWeight: 600, color: m.stats.csat >= 95 ? C.ok : C.warn }}>{m.stats.csat}%</span></td>
                    <td style={{ padding: "12px 14px", width: 110 }}>
                      {/* Workload column was rendering an unlabelled
                          ProgressBar so a 0% load looked identical to
                          a 100% one — flagged in 2026-05-05 QA. Pair
                          the bar with the numeric percent + the raw
                          (active/max) ratio in a tooltip so an
                          operator can both eyeball and dig in. */}
                      {(() => {
                        const load = Number(m.stats?.load ?? 0);
                        const color = load > 70 ? C.err : load > 50 ? C.warn : C.ok;
                        return (
                          <div title={ar ? `${load}% من الطاقة الاستيعابيّة` : `${load}% of capacity`}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 2 }}>
                              <span style={{ fontWeight: 600, color }}>{load}%</span>
                              <span style={{ color: C.t3, fontSize: 10 }}>
                                {load >= 90 ? (ar ? "ممتلئ" : "Full")
                                  : load >= 70 ? (ar ? "مرتفع" : "High")
                                  : load >= 30 ? (ar ? "متوسّط" : "Medium")
                                  : (ar ? "خفيف" : "Light")}
                              </span>
                            </div>
                            <ProgressBar value={load} color={color} />
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button onClick={() => openEditMember(m)} style={{ background: "none", border: "none", cursor: "pointer", color: C.t2, padding: 4, borderRadius: 6 }} title={ar ? "تعديل" : "Edit"}>
                        <Icon name="pencil" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
          {members.length > 0 && <Pagination page={page} totalPages={totalMemberPages} totalItems={members.length} onPageChange={setPage} />}
        </Card>
      )}

      {tab === "teams" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {teams.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
              {ar ? "لا توجد فرق" : "No teams"}
            </div>
          )}
          {teams.map((team: any) => (
            <Card key={team.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${team.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="users" size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{team.name}</div>
                  <div style={{ fontSize: 11, color: C.t2 }}>{ar ? "قائد:" : "Lead:"} {team.lead || (ar ? "—" : "—")}</div>
                </div>
                <button
                  type="button"
                  onClick={() => openEditTeam(team)}
                  title={ar ? "تعديل الفريق" : "Edit team"}
                  style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.brd}`, background: "transparent", color: C.t2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Icon name="pencil" size={12} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[[t("conv"), team.convos], [t("csat"), `${team.csat}%`], [t("onl"), `${team.online}/${team.total}`]].map(([l, v], i) => (
                  <div key={i} style={{ padding: "6px 10px", borderRadius: 6, background: C.inp, fontSize: 12 }}>
                    <div style={{ color: C.t2 }}>{l}</div>
                    <div style={{ fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              {Array.isArray(team.services_catalog) && team.services_catalog.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: C.t3, marginBottom: 4, fontWeight: 600 }}>
                    {ar ? "الخدمات" : "Services"}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {team.services_catalog.map((s: string, i: number) => (
                      <span key={i} style={{ padding: "3px 8px", borderRadius: 6, background: `${C.pri}10`, color: C.pri, fontSize: 10.5, fontWeight: 500 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {team.rules.map((r: string, i: number) => <Badge key={i} color={C.info}>{r}</Badge>)}
              </div>
            </Card>
          ))}
          <Card style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px dashed ${C.brd}` }} onClick={openCreateTeam}>
            <div style={{ textAlign: "center", color: C.t2 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>+</div>
              <div style={{ fontSize: 13 }}>{t("createTeam")}</div>
            </div>
          </Card>
        </div>
      )}

      {tab === "routing" && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>{ar ? "قواعد التوجيه" : "Routing Rules"}</h3>
          {routingRules.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: C.inp, marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>{r.desc}</div>
              </div>
              <Toggle on={r.on} onToggle={() => handleToggleRouting(r.key)} />
            </div>
          ))}
        </Card>
      )}

      {tab === "schedule" && (
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>{t("schedule")}</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px 12px", textAlign: "inherit", fontSize: 11, fontWeight: 600, color: C.t2, borderBottom: `1px solid ${C.brd}` }}>{t("name")}</th>
                  {days.map((d, i) => <th key={i} style={{ padding: 8, textAlign: "center", fontSize: 11, fontWeight: 600, color: C.t2, borderBottom: `1px solid ${C.brd}` }}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {members.map((m: any) => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{m.name}</td>
                    {dayKeys.map((dk2, i) => (
                      <td key={i} style={{ padding: 8, textAlign: "center" }}>
                        {m.schedule[dk2] ? <span style={{ color: C.ok }}><Icon name="check" size={14} /></span> : <span style={{ color: C.t3 }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Edit Member Modal ── */}
      {editMember && <Modal
        open={showEditMember}
        onClose={() => { if (!editMemberLoading) setShowEditMember(false); }}
        title={ar ? "تعديل العضو" : "Edit Member"}
        wide
        submitLabel={ar ? "حفظ التعديلات" : "Save Changes"}
        onSubmit={handleEditMember}
        submitLoading={editMemberLoading}
        submitDisabled={editMemberLoading || !editMember.name?.trim() || !editMember.email?.trim()}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "الاسم الكامل" : "Full Name"} <span style={{ color: C.err }}>*</span></label>
            <input value={editMember.name} onChange={(e) => setEditMember({ ...editMember, name: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }} />
          </div>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "البريد الإلكتروني" : "Email"} <span style={{ color: C.err }}>*</span></label>
            <input type="email" value={editMember.email} onChange={(e) => setEditMember({ ...editMember, email: e.target.value })} dir="ltr" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }} />
          </div>
          {/* Role & Team */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "الدور" : "Role"}</label>
              <select value={editMember.role} onChange={(e) => setEditMember({ ...editMember, role: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
                <option value="admin">{ar ? "مدير" : "Admin"}</option>
                <option value="supervisor">{ar ? "مشرف" : "Supervisor"}</option>
                <option value="agent">{ar ? "وكيل" : "Agent"}</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "الفريق" : "Team"}</label>
              <select value={editMember.team_id} onChange={(e) => setEditMember({ ...editMember, team_id: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
                <option value="">{ar ? "-- بدون فريق --" : "-- No team --"}</option>
                {teams.map((tm: any) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
              </select>
            </div>
          </div>
          {/* Skills */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>{ar ? "المهارات" : "Skills"}</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SKILL_OPTIONS.map((sk) => {
                const selected = editMember.skills.includes(sk.key);
                return (
                  <button key={sk.key} type="button" onClick={() => toggleEditSkill(sk.key)} style={{
                    padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontFamily: FONT_FAMILY, fontSize: 12.5, fontWeight: 600,
                    border: `2px solid ${selected ? C.pri : C.brd}`,
                    background: selected ? `${C.pri}15` : "transparent",
                    color: selected ? C.pri : C.t3,
                  }}>
                    {selected ? "✓ " : ""}{sk.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>}

      {/* ── Add Member Modal ── */}
      <Modal
        open={showAddMember}
        onClose={() => { if (!addMemberLoading) setShowAddMember(false); }}
        title={ar ? "إضافة عضو جديد" : "Add New Member"}
        wide
        submitLabel={ar ? "إضافة العضو" : "Add Member"}
        onSubmit={handleAddMember}
        submitLoading={addMemberLoading}
        submitDisabled={addMemberLoading || !newMember.name.trim() || !newMember.email.trim() || !newMember.phone.trim()}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 240px", gap: 24 }}>
          {/* Left: Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Name */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "الاسم الكامل" : "Full Name"} <span style={{ color: C.err }}>*</span></label>
              <input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder={ar ? "مثال: سعد الغامدي" : "e.g. Saad Al-Ghamdi"} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${!newMember.name.trim() && newMember.email.trim() ? C.err : C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "البريد الإلكتروني" : "Email"} <span style={{ color: C.err }}>*</span></label>
              <input type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} placeholder="name@corbit.sa" dir="ltr" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${!newMember.email.trim() && newMember.name.trim() ? C.err : C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "رقم الجوال (واتساب)" : "Phone (WhatsApp)"} <span style={{ color: C.err }}>*</span></label>
              <input type="tel" value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} placeholder="9665xxxxxxxx" dir="ltr" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${!newMember.phone.trim() && newMember.name.trim() ? C.err : C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }} />
              <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{ar ? "سيتم إرسال بيانات الدخول على هذا الرقم عبر واتساب" : "Login credentials will be sent to this number via WhatsApp"}</div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "كلمة المرور" : "Password"} <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>({ar ? "اختياري — تُولَّد عشوائية" : "optional — random if empty"})</span></label>
              <input type="text" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} placeholder={ar ? "اتركها فارغة لتوليد كلمة مرور" : "Leave empty to auto-generate"} dir="ltr" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Role & Team */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "الدور" : "Role"} <span style={{ color: C.err }}>*</span></label>
                <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
                  <option value="admin">{ar ? "مدير" : "Admin"}</option>
                  <option value="supervisor">{ar ? "مشرف" : "Supervisor"}</option>
                  <option value="agent">{ar ? "وكيل" : "Agent"}</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "الفريق" : "Team"} <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>({ar ? "اختياري" : "optional"})</span></label>
                <select value={newMember.team_id} onChange={(e) => setNewMember({ ...newMember, team_id: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
                  <option value="">{ar ? "-- بدون فريق --" : "-- No team --"}</option>
                  {teams.map((tm: any) => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                </select>
              </div>
            </div>

            {/* Skills - multi-select tags */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>{ar ? "المهارات" : "Skills"} <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>({ar ? "اختياري" : "optional"})</span></label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SKILL_OPTIONS.map((sk) => {
                  const selected = newMember.skills.includes(sk.key);
                  return (
                    <button
                      key={sk.key}
                      type="button"
                      onClick={() => toggleSkill(sk.key)}
                      style={{
                        padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontFamily: FONT_FAMILY, fontSize: 12.5, fontWeight: 600,
                        border: `2px solid ${selected ? C.pri : C.brd}`,
                        background: selected ? `${C.pri}15` : "transparent",
                        color: selected ? C.pri : C.t3,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {selected ? "✓ " : ""}{sk.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule - working days + hours */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>{ar ? "جدول العمل" : "Work Schedule"} <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>({ar ? "اختياري" : "optional"})</span></label>
              {/* Day checkboxes */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {dayKeys.map((key, i) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewMember({ ...newMember, schedule: { ...newMember.schedule, [key]: !newMember.schedule[key] } })}
                    style={{
                      flex: 1, padding: "10px 4px", borderRadius: 10, cursor: "pointer", fontFamily: FONT_FAMILY, textAlign: "center", fontSize: 11, fontWeight: 600,
                      border: `2px solid ${newMember.schedule[key] ? "#34C77B" : C.brd}`,
                      background: newMember.schedule[key] ? "#34C77B12" : "transparent",
                      color: newMember.schedule[key] ? "#34C77B" : C.t3,
                    }}
                  >
                    {days[i]}
                  </button>
                ))}
              </div>
              {/* Start / End time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: C.t3, marginBottom: 4 }}>{ar ? "وقت البداية" : "Start Time"}</label>
                  <input type="time" value={newMember.startTime} onChange={(e) => setNewMember({ ...newMember, startTime: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: C.t3, marginBottom: 4 }}>{ar ? "وقت النهاية" : "End Time"}</label>
                  <input type="time" value={newMember.endTime} onChange={(e) => setNewMember({ ...newMember, endTime: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview Card */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 12 }}>{ar ? "معاينة" : "Preview"}</div>
            <Card style={{ padding: 20 }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <Avatar name={newMember.name || "?"} size={56} solid />
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 10, color: C.txt }}>{newMember.name || (ar ? "اسم العضو" : "Member Name")}</div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{newMember.email || "email@corbit.sa"}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <Badge color={newMember.role === "admin" ? "#E84855" : newMember.role === "supervisor" ? "#F5A623" : "#4A9EFF"}>
                    {newMember.role === "admin" ? (ar ? "مدير" : "Admin") : newMember.role === "supervisor" ? (ar ? "مشرف" : "Supervisor") : (ar ? "وكيل" : "Agent")}
                  </Badge>
                  {newMember.team_id && <Badge color={C.pri}>{teams.find((tm: any) => tm.id === newMember.team_id)?.name || ""}</Badge>}
                </div>
              </div>

              {/* Skills preview */}
              {newMember.skills.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
                  {newMember.skills.map(sk => (
                    <Badge key={sk} color={C.info}>{SKILL_OPTIONS.find(o => o.key === sk)?.label || sk}</Badge>
                  ))}
                </div>
              )}

              <div style={{ borderTop: `1px solid ${C.brd}`, paddingTop: 12, fontSize: 12, color: C.t2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>{ar ? "أيام العمل:" : "Work days:"}</span>
                  <span style={{ fontWeight: 600, color: C.txt }}>{Object.values(newMember.schedule).filter(Boolean).length}/7</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>{ar ? "ساعات العمل:" : "Hours:"}</span>
                  <span style={{ fontWeight: 600, color: C.txt }}>{newMember.startTime} - {newMember.endTime}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>{ar ? "المهارات:" : "Skills:"}</span>
                  <span style={{ fontWeight: 600, color: C.txt }}>{newMember.skills.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{ar ? "الحالة:" : "Status:"}</span>
                  <Badge color="#34C77B">{ar ? "جاهز" : "Ready"}</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Modal>

      <CredentialsModal
        open={!!credentialsResult}
        data={credentialsResult}
        onClose={() => setCredentialsResult(null)}
        title={ar ? "تم إنشاء العضو" : "Member Created"}
      />

      {/* ── Team Create / Edit Modal ── */}
      <Modal
        open={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        title={teamModalTarget
          ? (ar ? `تعديل ${teamModalTarget.name}` : `Edit ${teamModalTarget.name}`)
          : (ar ? "إنشاء فريق جديد" : "Create New Team")}
        submitLabel={teamModalLoading
          ? (ar ? "جاري الحفظ..." : "Saving...")
          : (ar ? "حفظ" : "Save")}
        submitLoading={teamModalLoading}
        onSubmit={handleSaveTeam}
        wide
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Names */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: C.t2, marginBottom: 4 }}>
                {ar ? "الاسم بالعربيّة" : "Arabic name"}
              </label>
              <input
                value={teamForm.name_ar}
                onChange={(e) => setTeamForm({ ...teamForm, name_ar: e.target.value })}
                placeholder={ar ? "مثال: فريق الدعم" : "e.g. فريق الدعم"}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: C.t2, marginBottom: 4 }}>
                {ar ? "الاسم بالإنجليزيّة" : "English name"}
              </label>
              <input
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="e.g. Support"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 13 }}
              />
            </div>
          </div>

          {/* Service catalog */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 6 }}>
              {ar ? "كاتالوج الخدمات" : "Service Catalog"}
            </label>
            <div style={{ fontSize: 11.5, color: C.t2, marginBottom: 8, lineHeight: 1.6 }}>
              {ar
                ? "حدّد الخدمات اللي يقدّمها هذا الفريق. سيتمّ توجيه المحادثات للفريق المناسب تلقائياً عند تفعيل قواعد التوجيه الذكي."
                : "Pick the services this team handles. The smart routing engine will prefer this team when conversations are tagged with one of these services."}
            </div>
            {/* Preset chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {PRESET_SERVICES.map((s) => {
                const active = teamForm.services.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleServiceChip(s)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${active ? C.pri : C.brd}`,
                      background: active ? `${C.pri}12` : "transparent",
                      color: active ? C.pri : C.t2,
                      fontFamily: FONT_FAMILY, fontSize: 11.5,
                      fontWeight: active ? 600 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {active ? "✓ " : "+ "}{s}
                  </button>
                );
              })}
            </div>
            {/* Custom entries — chips already chosen */}
            {teamForm.services.filter((s) => !PRESET_SERVICES.includes(s)).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {teamForm.services.filter((s) => !PRESET_SERVICES.includes(s)).map((s) => (
                  <span key={s} style={{ padding: "6px 6px 6px 12px", borderRadius: 8, border: `1.5px solid ${C.warn}`, background: `${C.warn}12`, color: C.warn, fontFamily: FONT_FAMILY, fontSize: 11.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {s}
                    <button
                      type="button"
                      onClick={() => toggleServiceChip(s)}
                      style={{ width: 16, height: 16, borderRadius: 4, border: "none", background: "transparent", color: C.warn, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
            {/* Custom service input */}
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomService(); } }}
                placeholder={ar ? "أضف خدمة مخصّصة..." : "Add custom service..."}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontFamily: FONT_FAMILY, fontSize: 12 }}
              />
              <button
                type="button"
                onClick={addCustomService}
                disabled={!customService.trim()}
                style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: customService.trim() ? C.pri : C.brd, color: "#fff", fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600, cursor: customService.trim() ? "pointer" : "not-allowed" }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
