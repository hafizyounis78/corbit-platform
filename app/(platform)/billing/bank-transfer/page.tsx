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
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const { data: accountsData } = useBankAccounts();
  const { data: transfersData, mutate: refetchTransfers } = useMyTransfers();
  const { data: overview, mutate: refetchOverview } = useBillingOverview();

  const accounts: BankAccount[] = Array.isArray(accountsData) ? accountsData : [];
  const transfers: Transfer[] = Array.isArray((transfersData as any)?.data)
    ? (transfersData as any).data
    : Array.isArray(transfersData)
      ? (transfersData as any)
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
        isAr ? "تمّ استلام طلب التحويل، سيتمّ مراجعته" : "Transfer submitted, awaiting review",
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
      pending: { ar: "قيد المراجعة", en: "Pending", color: "#f59e0b" },
      approved: { ar: "مقبول", en: "Approved", color: "#10b981" },
      rejected: { ar: "مرفوض", en: "Rejected", color: "#ef4444" },
    };
    const m = map[status] ?? map.pending;
    return <Badge color={m.color}>{isAr ? m.ar : m.en}</Badge>;
  };

  const labelStyle: React.CSSProperties = { fontSize: 12, color: C.t2, marginBottom: 6, display: "block" };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: `1px solid ${C.brd}`,
    background: C.bg,
    color: C.t1,
    fontSize: 13,
    outline: "none",
  };

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <Link href="/billing" style={{ fontSize: 12, color: C.t2, textDecoration: "none" }}>
            {isAr ? "← العودة للفوترة" : "← Back to billing"}
          </Link>
          <h2 style={{ margin: "6px 0 4px", fontSize: 20, fontWeight: 700 }}>
            {isAr ? "تحويل بنكي" : "Bank Transfer"}
          </h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>
            {isAr
              ? "حوّل المبلغ إلى أحد حساباتنا، ارفع الإيصال، وسنراجعه خلال ساعات."
              : "Transfer to one of our accounts, upload the receipt, and we'll review it within hours."}
          </p>
        </div>
        <Button primary onClick={() => setShowForm(true)}>
          {isAr ? "إرسال تحويل" : "Submit transfer"}
        </Button>
      </div>

      <Card style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: C.t2 }}>{isAr ? "الرصيد الحالي" : "Current balance"}</div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>
          {(overview as any)?.wallet ?? "0.00"} {isAr ? "ر.س" : "SAR"}
        </div>
      </Card>

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
        {isAr ? "حوّل إلى أحد هذه الحسابات" : "Transfer to one of these accounts"}
      </h3>
      {accounts.length === 0 ? (
        <Card style={{ padding: 24, textAlign: "center", marginBottom: 24 }}>
          <span style={{ color: C.t2, fontSize: 13 }}>
            {isAr ? "لا توجد حسابات بنكيّة متاحة. تواصل مع الدعم." : "No bank accounts available. Contact support."}
          </span>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 24 }}>
          {accounts.map((acc) => (
            <Card key={acc.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {isAr ? acc.bank_name_ar || acc.bank_name : acc.bank_name}
                </div>
                {acc.is_default && <Badge color="#3b82f6">{isAr ? "الافتراضي" : "Default"}</Badge>}
              </div>
              <Row label={isAr ? "اسم المستفيد" : "Beneficiary"} value={acc.account_holder} />
              <Row label={isAr ? "رقم الحساب" : "Account #"} value={acc.account_number} copyable />
              <Row label="IBAN" value={acc.iban} copyable />
            </Card>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
        {isAr ? "تحويلاتي" : "My transfers"}
      </h3>
      {transfers.length === 0 ? (
        <Card style={{ padding: 24, textAlign: "center" }}>
          <span style={{ color: C.t2, fontSize: 13 }}>
            {isAr ? "لم ترسل أيّ تحويل بعد" : "No transfers yet"}
          </span>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
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
                  <tr key={t.id} style={{ borderTop: `1px solid ${C.brd}` }}>
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

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={isAr ? "إرسال تحويل بنكي" : "Submit bank transfer"}
        submitLabel={submitting ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال" : "Submit")}
        onSubmit={submit}
        submitLoading={submitting}
        submitDisabled={submitting}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>
              {isAr ? "المبلغ المُحوَّل (ر.س)" : "Amount transferred (SAR)"} <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              {isAr ? "البنك المستفيد" : "To bank account"} <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              value={form.bank_account_id}
              onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}
              style={inputStyle}
            >
              <option value="">{isAr ? "اختر..." : "Select..."}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {isAr ? acc.bank_name_ar || acc.bank_name : acc.bank_name} — {acc.iban}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              {isAr ? "اسم المحوِّل" : "Depositor name"} <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={form.deposited_name}
              onChange={(e) => setForm({ ...form, deposited_name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              {isAr ? "تاريخ التحويل" : "Transfer date"} <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="date"
              value={form.transfer_date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{isAr ? "الرقم المرجعي (اختياري)" : "Reference (optional)"}</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{isAr ? "ملاحظة (اختياري)" : "Note (optional)"}</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              {isAr ? "صورة الإيصال (jpg/png/pdf، 5MB)" : "Receipt (jpg/png/pdf, 5MB)"} <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              style={{ ...inputStyle, padding: "6px" }}
            />
          </div>
        </div>
      </Modal>
    </div>
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 12, padding: "4px 0" }}>
      <span style={{ color: C.t2 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: "monospace", color: C.t1 }}>{value}</span>
        {copyable && (
          <button
            onClick={copy}
            aria-label="copy"
            style={{ background: "none", border: "none", cursor: "pointer", color: C.t2, padding: 2 }}
          >
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
    <th style={{ textAlign: "start", padding: "10px 14px", fontWeight: 600, fontSize: 11, color: C.t2, textTransform: "uppercase" }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  const { colors: C } = useTheme();
  return <td style={{ padding: "10px 14px", color: C.t1 }}>{children}</td>;
}
