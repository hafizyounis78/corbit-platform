"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { CredentialsModal, type CredentialsData } from "@/components/shared/credentials-modal";
import { useSandbox } from "@/lib/api/hooks";
import api from "@/lib/api/client";

export default function SandboxPage() {
  const { colors: C } = useTheme();
  const { isAr: ar } = useLocale();
  const { showToast } = useToast();
  const { data, isLoading, mutate } = useSandbox();

  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<CredentialsData | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const enabled = data?.enabled ?? false;
  const provisioned = data?.provisioned ?? false;
  const sb = data?.sandbox ?? null;
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";

  const errMsg = (e: any, fallback: string) =>
    e?.response?.data?.message || (ar ? fallback : fallback);

  const handleProvision = async () => {
    setBusy(true);
    try {
      const res = await api.post("/sandbox/provision");
      const c = res.data?.data?.credentials;
      if (c) {
        setCreds({
          name: ar ? "مدير بيئة الاختبار" : "Sandbox Admin",
          email: c.email,
          password: c.password,
          loginUrl,
          notification: { sent: false, channel: "none" },
        });
      } else {
        showToast(ar ? "بيئة الاختبار موجودة بالفعل" : "Sandbox already exists");
      }
      mutate();
    } catch (e: any) {
      showToast(errMsg(e, ar ? "تعذّر إنشاء بيئة الاختبار" : "Failed to create sandbox"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      await api.post("/sandbox/reset");
      showToast(ar ? "تمّت إعادة ضبط بيئة الاختبار ✓" : "Sandbox reset ✓");
      setConfirmReset(false);
      mutate();
    } catch (e: any) {
      showToast(errMsg(e, ar ? "تعذّرت إعادة الضبط" : "Reset failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleNewCredentials = async () => {
    setBusy(true);
    try {
      const res = await api.post("/sandbox/credentials");
      const c = res.data?.data?.credentials;
      if (c) {
        setCreds({
          name: ar ? "مدير بيئة الاختبار" : "Sandbox Admin",
          email: c.email,
          password: c.password,
          loginUrl,
          notification: { sent: false, channel: "none" },
        });
      }
    } catch (e: any) {
      showToast(errMsg(e, ar ? "تعذّر تحديث كلمة المرور" : "Failed to reset password"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{ar ? "بيئة الاختبار" : "Sandbox"}</h2>
        <p style={{ fontSize: 13, color: C.t2, margin: "4px 0 0" }}>
          {ar
            ? "مساحة معزولة لتجربة البوتات والقوالب والحملات دون لمس بياناتك الحقيقيّة أو إرسال رسائل فعليّة."
            : "An isolated space to test bots, templates and campaigns without touching your real data or sending real messages."}
        </p>
      </div>

      {isLoading ? (
        <Card style={{ padding: 20 }}>
          <span style={{ color: C.t2, fontSize: 13 }}>{ar ? "جاري التحميل..." : "Loading..."}</span>
        </Card>
      ) : !enabled ? (
        <Card style={{ padding: 28, textAlign: "center" }}>
          <div style={{ display: "inline-flex", marginBottom: 12, color: C.t3 }}><Icon name="lock" size={28} /></div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            {ar ? "غير متاح في باقتك الحاليّة" : "Not available on your plan"}
          </div>
          <p style={{ fontSize: 13, color: C.t2, margin: "0 auto", maxWidth: 440 }}>
            {ar
              ? "بيئة الاختبار متاحة في باقة المؤسّسات (Enterprise). رقّ باقتك للوصول إليها."
              : "Sandbox is available on the Enterprise plan. Upgrade to unlock it."}
          </p>
        </Card>
      ) : !provisioned ? (
        <Card style={{ padding: 28, textAlign: "center" }}>
          <div style={{ display: "inline-flex", marginBottom: 12, color: C.pri }}><Icon name="code" size={30} /></div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            {ar ? "أنشئ بيئة الاختبار" : "Create your sandbox"}
          </div>
          <p style={{ fontSize: 13, color: C.t2, margin: "0 auto 18px", maxWidth: 480 }}>
            {ar
              ? "سننشئ مساحة عمل منفصلة برقم واتساب تجريبي ومحادثات جاهزة. كل الإرسال فيها محاكى — لا يصل أي عميل حقيقي ولا تُخصم من محفظتك."
              : "We'll spin up a separate workspace with a test WhatsApp number and ready-made conversations. All sending there is simulated — no real customer is reached and your wallet is never charged."}
          </p>
          <Button primary onClick={handleProvision} disabled={busy}>
            {busy ? (ar ? "جاري الإنشاء..." : "Creating...") : (ar ? "إنشاء بيئة الاختبار" : "Create sandbox")}
          </Button>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "inline-flex", color: C.pri }}><Icon name="code" size={20} /></div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{sb?.name}</div>
                  <div style={{ fontSize: 11.5, color: C.t2 }}>{ar ? "مساحة عمل معزولة" : "Isolated workspace"}</div>
                </div>
              </div>
              <Badge color="#10b981">{ar ? "نشطة" : "Active"}</Badge>
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
              <Stat C={C} label={ar ? "جهات الاتصال" : "Contacts"} value={sb?.contacts ?? 0} />
              <Stat C={C} label={ar ? "المحادثات" : "Conversations"} value={sb?.conversations ?? 0} />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={loginUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <Button primary>{ar ? "افتح بيئة الاختبار ↗" : "Open sandbox ↗"}</Button>
              </a>
              <Button outline onClick={handleNewCredentials} disabled={busy}>
                {ar ? "كلمة مرور جديدة" : "New password"}
              </Button>
              <Button outline onClick={() => setConfirmReset(true)} disabled={busy}>
                {ar ? "إعادة ضبط البيانات" : "Reset data"}
              </Button>
            </div>
          </Card>

          <Card style={{ padding: "14px 16px", background: `${C.pri}08`, border: `1px solid ${C.pri}25` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: C.txt }}>
              <span style={{ color: C.pri, display: "inline-flex", marginTop: 1, flexShrink: 0 }}><Icon name="alert" size={14} /></span>
              <span>
                {ar
                  ? "بيئة الاختبار حساب منفصل له بيانات دخول خاصّة. سجّل خروجك من هذا الحساب ثم ادخل ببيانات بيئة الاختبار للعمل داخلها."
                  : "The sandbox is a separate account with its own login. Sign out here, then sign in with the sandbox credentials to work inside it."}
              </span>
            </div>
          </Card>
        </div>
      )}

      <CredentialsModal
        open={!!creds}
        data={creds}
        onClose={() => setCreds(null)}
        title={ar ? "بيانات دخول بيئة الاختبار" : "Sandbox login"}
      />

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={ar ? "إعادة ضبط بيئة الاختبار" : "Reset sandbox"}
        submitLabel={busy ? (ar ? "جاري..." : "...") : (ar ? "إعادة الضبط" : "Reset")}
        submitLoading={busy}
        onSubmit={handleReset}
      >
        <p style={{ fontSize: 13.5, color: C.txt, margin: 0, lineHeight: 1.7 }}>
          {ar
            ? "سيتم حذف كل المحادثات وجهات الاتصال والحملات داخل بيئة الاختبار وإعادة بناء البيانات التجريبيّة من جديد. لا يؤثّر هذا على حسابك الحقيقي."
            : "This deletes all conversations, contacts and campaigns inside the sandbox and rebuilds fresh sample data. Your real account is unaffected."}
        </p>
      </Modal>
    </div>
  );
}

function Stat({ C, label, value }: { C: any; label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.txt }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 11.5, color: C.t2 }}>{label}</div>
    </div>
  );
}
