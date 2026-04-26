"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Card, Button, Modal, Badge } from "@/components/ui";
import { FONT_FAMILY } from "@/lib/constants/font";
import { CredentialsModal, type CredentialsData } from "@/components/shared/credentials-modal";
import { useApi } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";

interface Organization {
  id: string;
  name: string;
  logo: string | null;
  timezone: string;
  currency: string;
  language: string;
  wallet_balance: number;
  plan: { id: string; name: string; name_ar: string; price_monthly: number } | null;
  stats: { users: number; contacts: number; conversations: number };
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  name_ar: string | null;
  price_monthly: number;
}

export default function SuperAdminPage() {
  const { colors: C } = useTheme();
  const { isAr: ar } = useLocale();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const isMob = useIsMobile();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CredentialsData | null>(null);
  const [form, setForm] = useState({
    name: "",
    plan_id: "",
    currency: "SAR",
    timezone: "Asia/Riyadh",
    language: "ar",
    wallet_balance: 0,
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    admin_password: "",
  });

  // Guard: only super-admins
  useEffect(() => {
    if (!authLoading && user && !user.isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const { data: orgs, isLoading, mutate } = useApi<Organization[]>(
    user?.isSuperAdmin ? API.SUPER_ADMIN.ORGANIZATIONS : null
  );
  const { data: plans } = useApi<Plan[]>(user?.isSuperAdmin ? "/billing/plans" : null);

  const openCreate = () => {
    setForm({
      name: "",
      plan_id: plans?.[0]?.id || "",
      currency: "SAR",
      timezone: "Asia/Riyadh",
      language: "ar",
      wallet_balance: 0,
      admin_name: "",
      admin_email: "",
      admin_phone: "",
      admin_password: "",
    });
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.admin_name.trim() || !form.admin_email.trim() || !form.admin_phone.trim()) {
      showToast(ar ? "يرجى إكمال الحقول المطلوبة (بما فيها رقم الجوال)" : "Please complete required fields (including phone)");
      return;
    }
    if (!/^\+?[0-9 \-]{8,20}$/.test(form.admin_phone.trim())) {
      showToast(ar ? "صيغة رقم الجوال غير صحيحة (مثال: +966500000000)" : "Invalid phone format (e.g. +966500000000)");
      return;
    }
    if (form.admin_password && form.admin_password.length < 8) {
      showToast(ar ? "كلمة المرور يجب ألا تقل عن 8 أحرف" : "Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(API.SUPER_ADMIN.ORGANIZATIONS, {
        name: form.name,
        ...(form.plan_id ? { plan_id: form.plan_id } : {}),
        currency: form.currency,
        timezone: form.timezone,
        language: form.language,
        wallet_balance: form.wallet_balance,
        admin: {
          name: form.admin_name,
          email: form.admin_email,
          phone: form.admin_phone.trim(),
          ...(form.admin_password ? { password: form.admin_password } : {}),
        },
      });
      const data = res.data?.data || {};
      setShowCreate(false);
      setCredentials({
        name: data.admin?.name || form.admin_name,
        email: data.admin?.email || form.admin_email,
        phone: data.admin?.phone || form.admin_phone || null,
        password: data.password,
        loginUrl: typeof window !== "undefined" ? `${window.location.origin}/login` : "/login",
        notification: data.notification,
      });
      mutate();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      showToast(msg || (ar ? "حدث خطأ أثناء الإنشاء" : "Error creating organization"));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div style={{ padding: 24, color: C.t2 }}>{ar ? "جاري التحميل..." : "Loading..."}</div>;
  }
  if (!user.isSuperAdmin) return null;

  return (
    <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.txt, margin: 0 }}>{ar ? "لوحة المشرف العام" : "Super Admin"}</h1>
          <div style={{ fontSize: 12.5, color: C.t2, marginTop: 4 }}>{ar ? "إدارة مؤسسات العملاء واشتراكاتهم" : "Manage client organizations and subscriptions"}</div>
        </div>
        <Button primary onClick={openCreate}>{ar ? "+ إنشاء مؤسسة" : "+ Create Organization"}</Button>
      </div>

      {isLoading ? (
        <div style={{ color: C.t2 }}>{ar ? "جاري التحميل..." : "Loading..."}</div>
      ) : !orgs || orgs.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: C.t2 }}>{ar ? "لا توجد مؤسسات بعد" : "No organizations yet"}</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {orgs.map((org: Organization) => (
            <Card key={org.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>{org.name}</div>
                  <div style={{ fontSize: 11.5, color: C.t3, marginTop: 2 }}>{new Date(org.created_at).toLocaleDateString(ar ? "ar-SA" : "en-US")}</div>
                </div>
                {org.plan ? (
                  <Badge color={C.pri}>{ar ? org.plan.name_ar || org.plan.name : org.plan.name}</Badge>
                ) : (
                  <Badge color={C.t3}>{ar ? "بدون خطة" : "No plan"}</Badge>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
                <Stat label={ar ? "مستخدمين" : "Users"} value={org.stats.users} C={C} />
                <Stat label={ar ? "جهات اتصال" : "Contacts"} value={org.stats.contacts} C={C} />
                <Stat label={ar ? "محادثات" : "Convos"} value={org.stats.conversations} C={C} />
              </div>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.brd}`, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: C.t2 }}>{ar ? "الرصيد:" : "Wallet:"}</span>
                <span style={{ fontWeight: 700, color: C.txt }}>{org.wallet_balance.toFixed(2)} {org.currency}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Org Modal */}
      <Modal
        open={showCreate}
        onClose={() => !submitting && setShowCreate(false)}
        title={ar ? "إنشاء مؤسسة جديدة" : "Create New Organization"}
        wide
        submitLabel={ar ? "إنشاء" : "Create"}
        onSubmit={handleCreate}
        submitLoading={submitting}
        submitDisabled={submitting || !form.name.trim() || !form.admin_name.trim() || !form.admin_email.trim()}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Field label={ar ? "اسم الشركة" : "Company Name"} required C={C}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle(C)} />
          </Field>

          <Field label={ar ? "الخطة" : "Plan"} C={C}>
            <select value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })} style={inputStyle(C)}>
              <option value="">{ar ? "-- افتراضي --" : "-- default --"}</option>
              {plans?.map((p: Plan) => (
                <option key={p.id} value={p.id}>{ar ? p.name_ar || p.name : p.name} — {p.price_monthly} SAR</option>
              ))}
            </select>
          </Field>

          <Field label={ar ? "العملة" : "Currency"} C={C}>
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} dir="ltr" style={inputStyle(C)} />
          </Field>
          <Field label={ar ? "الرصيد الافتتاحي" : "Initial Wallet"} C={C}>
            <input type="number" min={0} value={form.wallet_balance} onChange={(e) => setForm({ ...form, wallet_balance: Number(e.target.value) })} style={inputStyle(C)} />
          </Field>

          <div style={{ gridColumn: isMob ? "auto" : "1 / -1", padding: "10px 0 4px", borderTop: `1px solid ${C.brd}`, marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 4 }}>{ar ? "بيانات الأدمن الأول" : "First Admin"}</div>
          </div>

          <Field label={ar ? "اسم الأدمن" : "Admin Name"} required C={C}>
            <input value={form.admin_name} onChange={(e) => setForm({ ...form, admin_name: e.target.value })} style={inputStyle(C)} />
          </Field>
          <Field label={ar ? "بريد الأدمن" : "Admin Email"} required C={C}>
            <input type="email" dir="ltr" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} style={inputStyle(C)} />
          </Field>
          <Field label={ar ? "رقم جوال الأدمن (واتساب)" : "Admin Phone (WhatsApp)"} required C={C}>
            <input type="tel" dir="ltr" placeholder="+966500000000" value={form.admin_phone} onChange={(e) => setForm({ ...form, admin_phone: e.target.value })} style={inputStyle(C)} />
            <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
              {ar ? "ضروريّ لإرسال بيانات الدخول عبر واتساب" : "Required to deliver credentials via WhatsApp"}
            </div>
          </Field>
          <Field label={ar ? "كلمة المرور (اختياري)" : "Password (optional)"} C={C}>
            <input type="text" dir="ltr" placeholder={ar ? "فارغة = عشوائية" : "Leave empty for random"} value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} style={inputStyle(C)} />
          </Field>
        </div>
      </Modal>

      <CredentialsModal
        open={!!credentials}
        data={credentials}
        onClose={() => setCredentials(null)}
        title={ar ? "تم إنشاء المؤسسة" : "Organization Created"}
      />
    </div>
  );
}

function Stat({ label, value, C }: { label: string; value: number; C: any }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 8, background: C.bg, border: `1px solid ${C.brd}`, textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.txt }}>{value}</div>
      <div style={{ fontSize: 10.5, color: C.t3, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Field({ label, required, C, children }: { label: string; required?: boolean; C: any; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
        {label} {required ? <span style={{ color: C.err }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

function inputStyle(C: any) {
  return {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${C.brd}`,
    background: C.inp,
    color: C.txt,
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    outline: "none" as const,
    boxSizing: "border-box" as const,
  };
}
