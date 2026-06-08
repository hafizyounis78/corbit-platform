"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Toggle, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { useAiAgents, usePlanUsage } from "@/lib/api/hooks";
import api from "@/lib/api/client";

type AgentForm = {
  id?: string;
  name: string;
  name_ar: string;
  description: string;
  system_prompt: string;
  routing_keywords: string; // comma/newline separated in the form
  is_default: boolean;
  is_active: boolean;
  use_knowledge_base: boolean;
  kb_top_k: number;
};

const EMPTY: AgentForm = {
  name: "",
  name_ar: "",
  description: "",
  system_prompt: "",
  routing_keywords: "",
  is_default: false,
  is_active: true,
  use_knowledge_base: true,
  kb_top_k: 3,
};

export default function AiAgentsPage() {
  const { colors: C } = useTheme();
  const { isAr: ar } = useLocale();
  const { showToast } = useToast();
  const { data: agents, isLoading, mutate } = useAiAgents();
  const { data: planData } = usePlanUsage();
  const enabled = (planData?.limits?.multi_agent_ai_enabled as boolean | undefined) ?? false;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AgentForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const list = Array.isArray(agents) ? agents : [];

  const openCreate = () => { setForm(EMPTY); setShowForm(true); };
  const openEdit = (a: any) => {
    setForm({
      id: a.id,
      name: a.name ?? "",
      name_ar: a.name_ar ?? "",
      description: a.description ?? "",
      system_prompt: a.system_prompt ?? "",
      routing_keywords: Array.isArray(a.routing_keywords) ? a.routing_keywords.join("، ") : "",
      is_default: !!a.is_default,
      is_active: !!a.is_active,
      use_knowledge_base: !!a.use_knowledge_base,
      kb_top_k: Number(a.kb_top_k ?? 3),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast(ar ? "يرجى إدخال اسم الوكيل" : "Please enter the agent name", "error"); return; }
    if (!form.system_prompt.trim()) { showToast(ar ? "يرجى إدخال تعليمات الوكيل" : "Please enter the system prompt", "error"); return; }

    const keywords = form.routing_keywords
      .split(/[،,\n]/)
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      name_ar: form.name_ar.trim() || null,
      description: form.description.trim() || null,
      system_prompt: form.system_prompt.trim(),
      routing_keywords: keywords,
      is_default: form.is_default,
      is_active: form.is_active,
      use_knowledge_base: form.use_knowledge_base,
      kb_top_k: Math.max(1, Math.min(10, Number(form.kb_top_k) || 3)),
    };

    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/ai-agents/${form.id}`, payload);
        showToast(ar ? "تمّ تحديث الوكيل ✓" : "Agent updated ✓");
      } else {
        await api.post("/ai-agents", payload);
        showToast(ar ? "تمّ إنشاء الوكيل ✓" : "Agent created ✓");
      }
      setShowForm(false);
      mutate();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (ar ? "تعذّر حفظ الوكيل" : "Failed to save agent"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/ai-agents/${deleteTarget.id}`);
      showToast(ar ? "تمّ حذف الوكيل ✓" : "Agent deleted ✓");
      setDeleteTarget(null);
      mutate();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (ar ? "تعذّر حذف الوكيل" : "Failed to delete agent"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`,
    background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 6, display: "block" };

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{ar ? "وكلاء الذكاء" : "AI Agents"}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: "4px 0 0" }}>
            {ar
              ? "وكلاء متخصّصون (مبيعات، دعم، فوترة...) يوزّع عليهم الذكاء رسائل العملاء تلقائياً حسب الموضوع."
              : "Specialist agents (Sales, Support, Billing…) the AI routes each customer message to by topic."}
          </p>
        </div>
        {enabled && (
          <Button primary onClick={openCreate}>{ar ? "+ وكيل جديد" : "+ New agent"}</Button>
        )}
      </div>

      {isLoading ? (
        <Card style={{ padding: 20 }}><span style={{ color: C.t2, fontSize: 13 }}>{ar ? "جاري التحميل..." : "Loading..."}</span></Card>
      ) : !enabled ? (
        <Card style={{ padding: 28, textAlign: "center" }}>
          <div style={{ display: "inline-flex", marginBottom: 12, color: C.t3 }}><Icon name="lock" size={28} /></div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{ar ? "غير متاح في باقتك الحاليّة" : "Not available on your plan"}</div>
          <p style={{ fontSize: 13, color: C.t2, margin: "0 auto", maxWidth: 460 }}>
            {ar
              ? "الذكاء متعدّد الوكلاء متاح في باقة المؤسّسات (Enterprise). رقّ باقتك للوصول إليه."
              : "Multi-agent AI is available on the Enterprise plan. Upgrade to unlock it."}
          </p>
        </Card>
      ) : list.length === 0 ? (
        <Card style={{ padding: 28, textAlign: "center" }}>
          <div style={{ display: "inline-flex", marginBottom: 12, color: C.pri }}><Icon name="sparkles" size={30} /></div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{ar ? "لا يوجد وكلاء بعد" : "No agents yet"}</div>
          <p style={{ fontSize: 13, color: C.t2, margin: "0 auto 18px", maxWidth: 480 }}>
            {ar
              ? "أنشئ وكيلك الأوّل (مثلاً: وكيل المبيعات) وحدّد كلماته المفتاحيّة. عند وصول رسالة عميل، يوجّهها الذكاء للوكيل الأنسب."
              : "Create your first agent (e.g. a Sales agent) and set its keywords. Incoming messages get routed to the best-fit agent."}
          </p>
          <Button primary onClick={openCreate}>{ar ? "إنشاء أوّل وكيل" : "Create first agent"}</Button>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {list.map((a: any) => (
            <Card key={a.id} style={{ padding: 18, opacity: a.is_active ? 1 : 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "inline-flex", color: C.pri }}><Icon name="sparkles" size={18} /></div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{ar ? (a.name_ar || a.name) : a.name}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {a.is_default && <Badge color="#6366f1">{ar ? "افتراضي" : "Default"}</Badge>}
                  {!a.is_active && <Badge color={C.t3}>{ar ? "معطّل" : "Off"}</Badge>}
                </div>
              </div>

              {a.description && (
                <p style={{ fontSize: 12.5, color: C.t2, margin: "0 0 10px", lineHeight: 1.6 }}>{a.description}</p>
              )}

              {Array.isArray(a.routing_keywords) && a.routing_keywords.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {a.routing_keywords.slice(0, 6).map((k: string, i: number) => (
                    <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 8, background: C.bg, border: `1px solid ${C.brd}`, color: C.t2 }}>{k}</span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: `1px solid ${C.brd}`, paddingTop: 12 }}>
                <Button small outline onClick={() => openEdit(a)}>{ar ? "تعديل" : "Edit"}</Button>
                <Button small outline onClick={() => setDeleteTarget({ id: a.id, name: ar ? (a.name_ar || a.name) : a.name })}>
                  {ar ? "حذف" : "Delete"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={form.id ? (ar ? "تعديل الوكيل" : "Edit agent") : (ar ? "وكيل جديد" : "New agent")}
        submitLabel={saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
        submitLoading={saving}
        onSubmit={handleSave}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>{ar ? "الاسم (إنجليزي)" : "Name (EN)"}</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={ar ? "مثال: Sales" : "e.g. Sales"} dir="ltr" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{ar ? "الاسم (عربي)" : "Name (AR)"}</label>
              <input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} placeholder={ar ? "مثال: المبيعات" : "e.g. المبيعات"} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{ar ? "وصف مختصر (يساعد التوجيه)" : "Short description (helps routing)"}</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={ar ? "يتعامل مع الأسعار، الباقات، العروض، التجديد" : "Handles pricing, plans, offers, renewals"} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{ar ? "تعليمات الوكيل (الشخصيّة)" : "System prompt (persona)"}</label>
            <textarea
              value={form.system_prompt}
              onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              placeholder={ar ? "أنت وكيل مبيعات ودود. أجب باختصار وركّز على إغلاق الطلب..." : "You are a friendly sales agent. Be concise and focus on closing..."}
              rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          <div>
            <label style={labelStyle}>{ar ? "كلمات مفتاحيّة للتوجيه (افصل بفاصلة)" : "Routing keywords (comma separated)"}</label>
            <input value={form.routing_keywords} onChange={(e) => setForm({ ...form, routing_keywords: e.target.value })} placeholder={ar ? "سعر، عرض، باقة، اشتراك" : "price, offer, plan, subscription"} style={inputStyle} />
            <div style={{ fontSize: 11, color: C.t3, marginTop: 5 }}>
              {ar ? "لو احتوت رسالة العميل أيّ كلمة منها، تُوجَّه لهذا الوكيل مباشرة." : "If a message contains any of these, it routes straight to this agent."}
            </div>
          </div>

          <div>
            <label style={labelStyle}>{ar ? "عدد مقاطع قاعدة المعرفة (KB)" : "KB chunks (top-K)"}</label>
            <input type="number" min={1} max={10} value={form.kb_top_k} onChange={(e) => setForm({ ...form, kb_top_k: Number(e.target.value) })} dir="ltr" style={{ ...inputStyle, width: 120 }} />
          </div>

          <ToggleRow C={C} label={ar ? "الوكيل الافتراضي (عند عدم وضوح التوجيه)" : "Default agent (fallback)"} on={form.is_default} onToggle={() => setForm({ ...form, is_default: !form.is_default })} />
          <ToggleRow C={C} label={ar ? "استخدام قاعدة المعرفة" : "Use knowledge base"} on={form.use_knowledge_base} onToggle={() => setForm({ ...form, use_knowledge_base: !form.use_knowledge_base })} />
          <ToggleRow C={C} label={ar ? "مُفعّل" : "Active"} on={form.is_active} onToggle={() => setForm({ ...form, is_active: !form.is_active })} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={ar ? "حذف الوكيل" : "Delete agent"}
        submitLabel={deleting ? (ar ? "جاري..." : "...") : (ar ? "حذف" : "Delete")}
        submitLoading={deleting}
        onSubmit={handleDelete}
      >
        <p style={{ fontSize: 13.5, color: C.txt, margin: 0, lineHeight: 1.7 }}>
          {ar
            ? `سيتم حذف الوكيل "${deleteTarget?.name}" نهائياً. لن يؤثّر ذلك على المحادثات السابقة.`
            : `The agent "${deleteTarget?.name}" will be permanently deleted. Past conversations are unaffected.`}
        </p>
      </Modal>
    </div>
  );
}

function ToggleRow({ C, label, on, onToggle }: { C: any; label: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.bg }}>
      <span style={{ fontSize: 13, color: C.txt }}>{label}</span>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}
