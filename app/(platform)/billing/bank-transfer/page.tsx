"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { useBankAccounts, useMyTransfers, useBillingOverview } from "@/lib/api/hooks";
import api from "@/lib/api/client";

type BankAccount = {
  id: string;
  bank_name: string;
  bank_name_ar?: string;
  account_number: string;
  iban: string;
  account_holder: string;
  is_default?: boolean;
};

type Transfer = {
  id: string;
  amount: string | number;
  vat_amount: string | number;
  status: "pending" | "approved" | "rejected";
  invoice_no?: string | null;
  admin_note?: string | null;
  approved_at?: string | null;
  created_at: string;
  method_meta?: {
    deposited_name?: string;
    transfer_date?: string;
    reference?: string;
    note?: string;
  };
};

export default function BankTransferPage() {
  const { colors: C, isDark: dk } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const { data: accountsData } = useBankAccounts();
  const { data: transfersData, mutate: refetchTransfers } = useMyTransfers();
  const { data: overview, mutate: refetchOverview } = useBillingOverview();

  const accounts: BankAccount[] = Array.isArray(accountsData) ? accountsData : [];
  const transfers: Transfer[] = Array.isArray(transfersData?.data)
    ? transfersData.data
    : Array.isArray(transfersData)
      ? transfersData
      : [];

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    bank_account_id: "",
    deposited_name: "",
    transfer_date: new Date().toISOString().slice(0, 10),
    reference: "",
    note: "",
  });
  const [receipt, setReceipt] = useState<File | null>(null);

  const reset = () => {
    setForm({
      amount: "",
      bank_account_id: "",
      deposited_name: "",
      transfer_date: new Date().toISOString().slice(0, 10),
      reference: "",
      note: "",
    });
    setReceipt(null);
  };

  const submit = async () => {
    if (!receipt) {
      showToast(isAr ? "الإيصال مطلوب" : "Receipt is required", "error");
      return;
    }
    if (!form.amount || !form.bank_account_id || !form.deposited_name) {
      showToast(isAr ? "أكمل الحقول الإلزاميّة" : "Fill required fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("amount", form.amount);
      fd.append("bank_account_id", form.bank_account_id);
      fd.append("deposited_name", form.deposited_name);
      fd.append("transfer_date", form.transfer_date);
      if (form.reference) fd.append("reference", form.reference);
      if (form.note) fd.append("note", form.note);
      fd.append("receipt", receipt);

      await api.post("/billing/transfers", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast(
        isAr
          ? "تمّ استلام طلب التحويل، سيتمّ مراجعته من قبل الإدارة"
          : "Transfer submitted, awaiting admin review",
        "success"
      );
      reset();
      setShowForm(false);
      refetchTransfers();
      refetchOverview();
    } catch (e: any) {
      showToast(
        e?.response?.data?.message || (isAr ? "فشل إرسال التحويل" : "Submission failed"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: Transfer["status"]) => {
    const map = {
      pending: { ar: "قيد المراجعة", en: "Pending", color: "warning" as const },
      approved: { ar: "مقبول", en: "Approved", color: "success" as const },
      rejected: { ar: "مرفوض", en: "Rejected", color: "danger" as const },
    };
    const m = map[status] ?? map.pending;
    return <Badge variant={m.color}>{isAr ? m.ar : m.en}</Badge>;
  };

  return (
    <div className="space-y-6 p-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/billing" className="text-sm" style={{ color: C.muted }}>
            {isAr ? "← العودة للفوترة" : "← Back to billing"}
          </Link>
          <h1 className="text-2xl font-bold mt-2" style={{ color: C.text }}>
            {isAr ? "تحويل بنكي" : "Bank Transfer"}
          </h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>
            {isAr
              ? "حوّل المبلغ إلى أحد حساباتنا، ارفع الإيصال، وسنراجعه خلال ساعات."
              : "Transfer to one of our accounts, upload the receipt, and we will review it within hours."}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Icon name="plus" size={18} />
          {isAr ? "إرسال تحويل" : "Submit transfer"}
        </Button>
      </div>

      <Card>
        <div className="p-4">
          <div className="text-sm" style={{ color: C.muted }}>
            {isAr ? "الرصيد الحالي" : "Current balance"}
          </div>
          <div className="text-3xl font-bold mt-1" style={{ color: C.text }}>
            {overview?.wallet ?? "0.00"} {isAr ? "ر.س" : "SAR"}
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: C.text }}>
          {isAr ? "حوّل إلى أحد هذه الحسابات" : "Transfer to one of these accounts"}
        </h2>
        {accounts.length === 0 ? (
          <Card>
            <div className="p-6 text-center text-sm" style={{ color: C.muted }}>
              {isAr
                ? "لا توجد حسابات بنكيّة متاحة حالياً. تواصل مع الدعم."
                : "No bank accounts available. Contact support."}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <Card key={acc.id}>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold" style={{ color: C.text }}>
                      {isAr ? acc.bank_name_ar || acc.bank_name : acc.bank_name}
                    </div>
                    {acc.is_default && (
                      <Badge variant="primary">{isAr ? "الافتراضي" : "Default"}</Badge>
                    )}
                  </div>
                  <Row label={isAr ? "اسم المستفيد" : "Beneficiary"} value={acc.account_holder} />
                  <Row label={isAr ? "رقم الحساب" : "Account #"} value={acc.account_number} copyable />
                  <Row label="IBAN" value={acc.iban} copyable />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: C.text }}>
          {isAr ? "تحويلاتي" : "My transfers"}
        </h2>
        {transfers.length === 0 ? (
          <Card>
            <div className="p-6 text-center text-sm" style={{ color: C.muted }}>
              {isAr ? "لم ترسل أيّ تحويل بعد" : "No transfers yet"}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: C.bg }}>
                    <Th>{isAr ? "التاريخ" : "Date"}</Th>
                    <Th>{isAr ? "المبلغ" : "Amount"}</Th>
                    <Th>{isAr ? "المحوِّل" : "Depositor"}</Th>
                    <Th>{isAr ? "الحالة" : "Status"}</Th>
                    <Th>{isAr ? "الفاتورة" : "Invoice"}</Th>
                    <Th>{isAr ? "ملاحظة الإدارة" : "Admin note"}</Th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <Td>{new Date(t.created_at).toLocaleDateString(isAr ? "ar" : "en")}</Td>
                      <Td>{Number(t.amount).toFixed(2)} {isAr ? "ر.س" : "SAR"}</Td>
                      <Td>{t.method_meta?.deposited_name || "—"}</Td>
                      <Td>{statusBadge(t.status)}</Td>
                      <Td>{t.invoice_no || "—"}</Td>
                      <Td>{t.admin_note || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={isAr ? "إرسال تحويل بنكي" : "Submit bank transfer"}>
        <div className="space-y-4">
          <Field label={isAr ? "المبلغ المُحوَّل (ر.س)" : "Amount transferred (SAR)"} required>
            <input
              type="number"
              step="0.01"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 rounded border outline-none"
              style={{ background: C.bg, borderColor: C.border, color: C.text }}
            />
          </Field>

          <Field label={isAr ? "البنك المستفيد" : "To bank account"} required>
            <select
              value={form.bank_account_id}
              onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}
              className="w-full px-3 py-2 rounded border outline-none"
              style={{ background: C.bg, borderColor: C.border, color: C.text }}
            >
              <option value="">{isAr ? "اختر..." : "Select..."}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {isAr ? acc.bank_name_ar || acc.bank_name : acc.bank_name} — {acc.iban}
                </option>
              ))}
            </select>
          </Field>

          <Field label={isAr ? "اسم المحوِّل" : "Depositor name"} required>
            <input
              type="text"
              value={form.deposited_name}
              onChange={(e) => setForm({ ...form, deposited_name: e.target.value })}
              className="w-full px-3 py-2 rounded border outline-none"
              style={{ background: C.bg, borderColor: C.border, color: C.text }}
            />
          </Field>

          <Field label={isAr ? "تاريخ التحويل" : "Transfer date"} required>
            <input
              type="date"
              value={form.transfer_date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
              className="w-full px-3 py-2 rounded border outline-none"
              style={{ background: C.bg, borderColor: C.border, color: C.text }}
            />
          </Field>

          <Field label={isAr ? "الرقم المرجعي (اختياري)" : "Reference (optional)"}>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="w-full px-3 py-2 rounded border outline-none"
              style={{ background: C.bg, borderColor: C.border, color: C.text }}
            />
          </Field>

          <Field label={isAr ? "ملاحظة (اختياري)" : "Note (optional)"}>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded border outline-none"
              style={{ background: C.bg, borderColor: C.border, color: C.text }}
            />
          </Field>

          <Field label={isAr ? "صورة الإيصال (jpg/png/pdf، حدّ أقصى 5MB)" : "Receipt image (jpg/png/pdf, max 5MB)"} required>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
              style={{ color: C.text }}
            />
          </Field>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)} disabled={submitting}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting
                ? isAr ? "جاري الإرسال..." : "Submitting..."
                : isAr ? "إرسال" : "Submit"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const { colors: C } = useTheme();
  return (
    <label className="block">
      <div className="text-sm mb-1" style={{ color: C.text }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </div>
      {children}
    </label>
  );
}

function Row({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const { colors: C } = useTheme();
  const { showToast } = useToast();
  const { isAr } = useLocale();

  const copy = () => {
    navigator.clipboard.writeText(value);
    showToast(isAr ? "نُسخ" : "Copied", "success");
  };

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span style={{ color: C.muted }}>{label}</span>
      <div className="flex items-center gap-2">
        <span style={{ color: C.text, fontFamily: "monospace" }}>{value}</span>
        {copyable && (
          <button onClick={copy} aria-label="copy" className="opacity-60 hover:opacity-100">
            <Icon name="copy" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  const { colors: C } = useTheme();
  return (
    <th className="text-start px-4 py-2 font-semibold text-xs uppercase" style={{ color: C.muted }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  const { colors: C } = useTheme();
  return <td className="px-4 py-3" style={{ color: C.text }}>{children}</td>;
}
