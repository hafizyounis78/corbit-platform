"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Card, Button, TabBar, Badge, Modal, Pagination } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { Donut } from "@/components/charts/donut";
import { ProgressBar } from "@/components/charts/progress-bar";
import { Sparkline } from "@/components/charts/sparkline";
import { useBillingOverview, useBillingPlans, useBillingTransactions, useBankAccounts } from "@/lib/api/hooks";
import { PlanUsageCard } from "@/components/plan/plan-usage-card";
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

export default function BillingPage() {
  const { colors: C, isDark: dk } = useTheme();
  const { t, isAr, lang } = useLocale();
  const { showToast } = useToast();
  const isMob = useIsMobile();
  const ar = isAr;
  const [tab, setTab] = useState("overview");
  const [txnPage, setTxnPage] = useState(1);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  // Calculator inputs — each holds a string so an empty input
  // doesn't read NaN. Only used by the calculator section in the
  // top-up modal; not persisted.
  const [showCalc, setShowCalc] = useState(false);
  const [calcMk, setCalcMk] = useState("");
  const [calcUt, setCalcUt] = useState("");
  const [calcAu, setCalcAu] = useState("");
  const [calcSv, setCalcSv] = useState("");
  const [calcSm, setCalcSm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [bankAccountId, setBankAccountId] = useState("");
  const [depositedName, setDepositedName] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const { data: bankAccountsData } = useBankAccounts();
  const bankAccounts: BankAccount[] = Array.isArray(bankAccountsData) ? bankAccountsData : [];
  const [upgradeLoading, setUpgradeLoading] = useState<number | null>(null);
  const [confirmUpgrade, setConfirmUpgrade] = useState<any | null>(null);

  // Fetch from API, fall back to mock data
  const { data: apiOverview, isLoading: loadingOverview, mutate: mutateOverview } = useBillingOverview();
  const { data: apiPlans, isLoading: loadingPlans, mutate: mutatePlans } = useBillingPlans();
  const { data: apiTransactions, isLoading: loadingTxns, mutate: mutateTxns } = useBillingTransactions();

  const plans = Array.isArray(apiPlans) ? apiPlans : [];
  const transactions = Array.isArray(apiTransactions) ? apiTransactions : [];

  const TXN_PER_PAGE = 10;
  const totalTxnPages = Math.ceil(transactions.length / TXN_PER_PAGE);
  const paginatedTransactions = transactions.slice((txnPage - 1) * TXN_PER_PAGE, txnPage * TXN_PER_PAGE);

  useEffect(() => { setTxnPage(1); }, [tab]);

  // Overview data from API only
  const raw = apiOverview || {};
  const overview = {
    wallet: raw.wallet ?? "0",
    curPlan: ar ? (raw.currentPlan?.nameAr || raw.currentPlan?.name || "") : (raw.currentPlan?.name || ""),
    planPrice: raw.currentPlan?.price ?? "0",
    waConv: raw.usage ? `${raw.usage.conversations}` : "0",
    waPercent: "",
    aiCredits: raw.usage ? `${raw.usage.aiCredits}` : "0",
    aiPercent: "",
    costBreakdown: raw.costBreakdown || [],
    dailyWa: raw.dailyWa || [],
    dailyAi: raw.dailyAi || [],
    waUsed: raw.usage?.conversations ?? "0",
    waTotal: "0",
    waRemaining: "0",
    aiUsed: raw.usage?.aiCredits ?? "0",
    aiTotal: "0",
    aiRemaining: "0",
    monthCost: raw.monthCost ?? "0",
  };

  // Plans tab is hidden until upgrades go through the proper sales flow
  // — direct in-app upgrade was disabled in the 2026-04-29 sales-gating
  // change, so leaving the tab visible would tease an action the user
  // can't actually take. Re-enable by restoring the plans entry below
  // when the in-app upgrade path ships.
  const tabs = [
    { key: "overview", label: t("overview") },
    { key: "usage", label: t("usage") },
    { key: "transactions", label: t("txns") },
  ];

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) { showToast(ar ? "يرجى إدخال مبلغ صحيح" : "Please enter valid amount", "error"); return; }

    if (paymentMethod === "bank") {
      if (!bankAccountId) { showToast(ar ? "اختر البنك المستفيد" : "Select bank account", "error"); return; }
      if (!depositedName) { showToast(ar ? "اسم المحوِّل مطلوب" : "Depositor name required", "error"); return; }
      if (!receipt) { showToast(ar ? "صورة الإيصال مطلوبة" : "Receipt is required", "error"); return; }

      setTopUpLoading(true);
      try {
        const fd = new FormData();
        fd.append("amount", String(amt));
        fd.append("bank_account_id", bankAccountId);
        fd.append("deposited_name", depositedName);
        fd.append("transfer_date", transferDate);
        if (reference) fd.append("reference", reference);
        if (note) fd.append("note", note);
        fd.append("receipt", receipt);

        await api.post('/billing/transfers', fd, { headers: { "Content-Type": "multipart/form-data" } });
        showToast(ar ? "تمّ استلام التحويل، سيتمّ مراجعته" : "Transfer submitted, awaiting review");
        setShowTopUp(false);
        setTopUpAmount("");
        setBankAccountId(""); setDepositedName(""); setReference(""); setNote(""); setReceipt(null);
        mutateOverview();
        mutateTxns();
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "";
        showToast(ar ? `فشل الإرسال: ${msg}` : `Submission failed: ${msg}`, "error");
      } finally {
        setTopUpLoading(false);
      }
      return;
    }

    setTopUpLoading(true);
    try {
      await api.post('/billing/top-up', { amount: amt, paymentMethod });
      showToast(ar ? `تم شحن ${amt.toLocaleString()} ر.س بنجاح` : `${amt.toLocaleString()} SAR topped up successfully`);
      setShowTopUp(false);
      setTopUpAmount("");
      mutateOverview();
      mutateTxns();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "";
      showToast(ar ? `فشل الشحن: ${msg}` : `Top-up failed: ${msg}`, "error");
    } finally {
      setTopUpLoading(false);
    }
  };

  /**
   * Plan changes are sales-gated (manual bank transfer + admin approval).
   * Open Corbit's sales WhatsApp with a prefilled request — the rest of
   * the flow is handled by the team there.
   */
  const SALES_WHATSAPP = "966148213721";
  const handleRequestUpgrade = (plan: any) => {
    const planName = plan?.name ?? "";
    const planPrice = plan?.price ?? "";
    const text = ar
      ? `السلام عليكم،\nأرغب في الترقية إلى خطة ${planName} (${planPrice} ر.س/شهر).\nالرجاء توجيهي لخطوات الدفع.`
      : `Hello,\nI'd like to upgrade to the ${planName} plan (${planPrice} SAR/month). Please share the payment steps.`;
    const url = `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setConfirmUpgrade(null);
  };

  const isLoading = loadingOverview || loadingPlans || loadingTxns;

  if (isLoading) {
    return (
      <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <p style={{ fontSize: 14, color: C.t2 }}>{ar ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{t("billing")}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>{ar ? "الفوترة والاشتراكات" : "Billing & subscriptions"}</p>
        </div>
        <Button primary onClick={() => { setTopUpAmount(""); setPaymentMethod("bank"); setShowTopUp(true); }}>{t("topUp")}</Button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <>
          {/* AI billing model notice — analytics is free under the
              default 'replies_only' platform mode (set 2026-05-03).
              Only AI auto-replies that go back to the customer cost
              wallet credits. */}
          <div style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "#7C3AED10",
            border: "1px solid #7C3AED25",
            marginBottom: 14,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            fontSize: 12.5,
            lineHeight: 1.6,
          }}>
            <span style={{ fontSize: 16 }}>🧠</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: "#7C3AED" }}>
                {ar ? "تحليلات AI مجانيّة" : "AI analytics are free"}
              </strong>
              <span style={{ color: C.t2 }}>
                {" — "}
                {ar
                  ? "التصنيف، تحليل المشاعر، الترجمة، الملخّصات، واقتراحات الردّ للوكيل لا تُخصم من المحفظة. فقط الردود التلقائيّة من وكيل AI الذكي للعملاء تستهلك الرصيد."
                  : "Classification, sentiment, translation, summaries, and reply suggestions for agents don't draw from your wallet. Only AI auto-replies to customers consume credits."}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
            {[[t("wallet"), overview.wallet, t("sar"), C.pri, "wallet"], [t("curPlan"), overview.curPlan, overview.planPrice + "/" + (ar ? "شهر" : "mo"), C.ok, "star"], [t("waConv"), overview.waConv, overview.waPercent, C.info, "msg"], [t("aiCredits"), overview.aiCredits, overview.aiPercent, "#7C3AED", "brain"]].map(([label, value, sub, color, icon], i) => (
              <Card key={i} style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={icon as string} size={16} />
                  </div>
                  <span style={{ fontSize: 11.5, color: C.t2 }}>{label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{sub}</div>
              </Card>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{ar ? "توزيع التكاليف" : "Cost Breakdown"}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <Donut segments={[{ value: 51, color: C.pri }, { value: 7, color: "#7C3AED" }, { value: 42, color: C.ok }]} size={100} strokeWidth={12} />
                <div style={{ fontSize: 12 }}>
                  {[["WhatsApp", "51%", C.pri], ["AI", "7%", "#7C3AED"], [ar ? "اشتراك" : "Subscription", "42%", C.ok]].map(([l, v, c], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c as string }} />
                      <span style={{ color: C.t2 }}>{l}</span>
                      <span style={{ fontWeight: 600, marginInlineStart: "auto" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{ar ? "الاستهلاك اليومي" : "Daily Usage"}</h3>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: C.t2, marginBottom: 6 }}>{t("waConv")}</div>
                <Sparkline data={overview.dailyWa || []} color={C.pri} width={280} height={40} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: C.t2, marginBottom: 6 }}>{t("aiCredits")}</div>
                <Sparkline data={overview.dailyAi || []} color="#7C3AED" width={280} height={40} />
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === "plans" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {plans.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
              {ar ? "لا توجد خطط" : "No plans available"}
            </div>
          )}
          {plans.map((plan: any) => (
            <Card key={plan.id} style={{ padding: 22, border: plan.current ? `2px solid ${C.pri}` : undefined }}>
              {plan.current && <Badge color={C.pri}>{t("curPlan")}</Badge>}
              <h3 style={{ marginTop: 10, marginBottom: 4, fontSize: 20, fontWeight: 700 }}>{plan.name}</h3>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
                <span style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: C.t2 }}> {t("sar")}/{ar ? "شهر" : "mo"}</span>
              </div>
              <div style={{ marginTop: 16, borderTop: `1px solid ${C.brd}`, paddingTop: 16 }}>
                {(Array.isArray(plan.features) ? plan.features : []).map((f: string, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12.5 }}>
                    <span style={{ color: C.ok }}><Icon name="check" size={14} /></span>{f}
                  </div>
                ))}
              </div>
              {!plan.current && <Button primary style={{ width: "100%", justifyContent: "center", marginTop: 14, opacity: upgradeLoading === plan.id ? 0.6 : 1, pointerEvents: upgradeLoading === plan.id ? "none" : "auto" }} onClick={() => setConfirmUpgrade(plan)}>{upgradeLoading === plan.id ? (ar ? "جاري الترقية..." : "Upgrading...") : t("upgrade")}</Button>}
            </Card>
          ))}
        </div>
      )}

      {tab === "usage" && (
        <PlanUsageCard />
      )}

      {tab === "transactions" && (
        <Card>
          {transactions.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
              {ar ? "لا توجد معاملات" : "No transactions"}
            </div>
          )}
          {transactions.length > 0 && <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {[t("type"), ar ? "الوصف" : "Description", t("amount"), t("date"), t("ref")].map((h, i) => (
                    <th key={i} style={{ padding: "10px 16px", textAlign: "inherit", fontSize: 11.5, fontWeight: 600, color: C.t2, borderBottom: `1px solid ${C.brd}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>
                    <td style={{ padding: "12px 16px" }}><Badge color={tx.type === "payment" ? C.ok : tx.type === "refund" ? C.info : C.err}>{tx.type === "charge" ? t("charge") : tx.type === "payment" ? t("payment") : t("refund")}</Badge></td>
                    <td style={{ padding: "12px 16px" }}>{tx.desc}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: tx.amount > 0 ? C.ok : C.err }}>{tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} {t("sar")}</td>
                    <td style={{ padding: "12px 16px", color: C.t2 }}>{tx.date}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11 }}>{tx.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
          {transactions.length > 0 && <Pagination page={txnPage} totalPages={totalTxnPages} totalItems={transactions.length} onPageChange={setTxnPage} />}
        </Card>
      )}

      {/* ── Plan Upgrade — Sales Contact Modal ── */}
      <Modal
        open={!!confirmUpgrade}
        onClose={() => setConfirmUpgrade(null)}
        title={ar ? "طلب ترقية الخطة" : "Request Plan Upgrade"}
        submitLabel={ar ? "تواصل عبر واتساب" : "Contact via WhatsApp"}
        onSubmit={() => { if (confirmUpgrade) handleRequestUpgrade(confirmUpgrade); }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {ar ? `الترقية إلى خطة ${confirmUpgrade?.name || ""}` : `Upgrade to ${confirmUpgrade?.name || ""} plan`}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            <span style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{confirmUpgrade?.price || 0}</span>
            <span style={{ fontSize: 14, color: C.t2 }}> {t("sar")}/{ar ? "شهر" : "mo"}</span>
          </div>
          <div style={{ textAlign: ar ? "right" : "left", padding: "14px 16px", borderRadius: 12, background: `${C.info}10`, border: `1px solid ${C.info}25` }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: C.txt }}>
              {ar ? "خطوات الترقية:" : "Upgrade steps:"}
            </div>
            <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.9 }}>
              {ar ? (
                <>
                  1. تواصل مع فريق المبيعات عبر واتساب<br />
                  2. سترسل لك تفاصيل التحويل البنكي<br />
                  3. ارفع إيصال التحويل من <b>شحن الرصيد</b><br />
                  4. بعد تأكيد التحويل، تُفعّل الباقة الجديدة فوراً
                </>
              ) : (
                <>
                  1. Contact sales via WhatsApp<br />
                  2. Receive the bank transfer details<br />
                  3. Upload the receipt from <b>Top Up</b><br />
                  4. Once confirmed, the new plan activates immediately
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Top Up Modal ── */}
      <Modal
        open={showTopUp}
        onClose={() => setShowTopUp(false)}
        title={ar ? "شحن الرصيد" : "Top Up Balance"}
        submitLabel={topUpLoading ? (ar ? "جاري الشحن..." : "Processing...") : (ar ? "شحن الآن" : "Top Up Now")}
        submitLoading={topUpLoading}
        onSubmit={handleTopUp}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Current Balance */}
          <div style={{ padding: 20, borderRadius: 14, background: GRADIENT, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>{ar ? "الرصيد الحالي" : "Current Balance"}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{overview.wallet || "0"}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{ar ? "ر.س" : "SAR"}</div>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>{ar ? "اختر مبلغ سريع" : "Quick Amount"}</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(String(amt))}
                  style={{
                    padding: "14px 8px", borderRadius: 10, cursor: "pointer", fontFamily: FONT_FAMILY, textAlign: "center",
                    border: `2px solid ${topUpAmount === String(amt) ? C.pri : C.brd}`,
                    background: topUpAmount === String(amt) ? `${C.pri}12` : "transparent",
                    color: topUpAmount === String(amt) ? C.pri : C.txt,
                    fontWeight: 700, fontSize: 15,
                  }}
                >
                  {amt.toLocaleString()}
                  <div style={{ fontSize: 10, fontWeight: 400, color: C.t2, marginTop: 2 }}>{ar ? "ر.س" : "SAR"}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Calculator — let the operator plan a top-up by expected
              message volume. Prices below are platform defaults
              shown for orientation; the actual debit is resolved
              per-org at send time via PricingResolver, so this is a
              forecast tool, not a final price. */}
          <div>
            <button
              type="button"
              onClick={() => setShowCalc(!showCalc)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1px dashed ${C.brd}`, background: showCalc ? `${C.pri}08` : "transparent",
                color: showCalc ? C.pri : C.t2, fontFamily: FONT_FAMILY, fontSize: 12.5, fontWeight: 600,
                cursor: "pointer", textAlign: "start", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span>{showCalc ? "▾" : "▸"}</span>
              {ar ? "🧮 حاسبة الرصيد — قدّر المبلغ من عدد الرسائل" : "🧮 Calculator — estimate from message volume"}
            </button>
            {showCalc && (() => {
              const mk = parseInt(calcMk, 10) || 0;
              const ut = parseInt(calcUt, 10) || 0;
              const au = parseInt(calcAu, 10) || 0;
              const sv = parseInt(calcSv, 10) || 0;
              const sm = parseInt(calcSm, 10) || 0;
              // Platform defaults (SAR per message). When PricingResolver
              // is exposed via API this should swap to per-org rates.
              const PRICE = { mk: 0.30, ut: 0.20, au: 0.10, sv: 0.00, sm: 0.15 };
              const total = mk * PRICE.mk + ut * PRICE.ut + au * PRICE.au + sv * PRICE.sv + sm * PRICE.sm;
              const rows = [
                [ar ? "تسويقي (Marketing)" : "Marketing", calcMk, setCalcMk, PRICE.mk, "mk"],
                [ar ? "خدمي (Utility)" : "Utility", calcUt, setCalcUt, PRICE.ut, "ut"],
                [ar ? "مصادقة (OTP)" : "Authentication (OTP)", calcAu, setCalcAu, PRICE.au, "au"],
                [ar ? "خدمة عملاء" : "Service", calcSv, setCalcSv, PRICE.sv, "sv"],
                [ar ? "SMS" : "SMS", calcSm, setCalcSm, PRICE.sm, "sm"],
              ] as const;
              return (
                <div style={{ marginTop: 10, padding: 14, borderRadius: 12, background: C.inp, display: "flex", flexDirection: "column", gap: 8 }}>
                  {rows.map(([label, val, setVal, price, key]) => (
                    <div key={key as string} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.txt }}>{label}</div>
                        <div style={{ fontSize: 10, color: C.t3 }}>{Number(price).toFixed(2)} {ar ? "ر.س / رسالة" : "SAR/msg"}</div>
                      </div>
                      <input
                        type="number" min={0}
                        value={val as string}
                        onChange={(e) => (setVal as (s: string) => void)(e.target.value)}
                        placeholder="0"
                        style={{ width: 80, padding: "7px 10px", borderRadius: 8, background: C.card, border: `1px solid ${C.brd}`, color: C.txt, fontSize: 13, fontWeight: 600, fontFamily: FONT_FAMILY, outline: "none", textAlign: "center" }}
                      />
                    </div>
                  ))}
                  {total > 0 && (
                    <div style={{ marginTop: 4, paddingTop: 10, borderTop: `1px solid ${C.brd}`, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: C.t2 }}>{ar ? "الإجمالي التقريبي" : "Estimated total"}</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: C.pri }}>{total.toFixed(2)} {ar ? "ر.س" : "SAR"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTopUpAmount(String(Math.ceil(total)))}
                        style={{ padding: "9px", borderRadius: 8, border: "none", background: C.pri, color: "#fff", fontFamily: FONT_FAMILY, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                      >
                        {ar ? "استخدم هذا المبلغ" : "Use this amount"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Custom Amount */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>{ar ? "أو أدخل مبلغ مخصص" : "Or enter custom amount"}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number" min={1}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="0"
                style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 18, fontWeight: 700, fontFamily: FONT_FAMILY, outline: "none", textAlign: "center" }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.t2 }}>{ar ? "ر.س" : "SAR"}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>{ar ? "طريقة الدفع" : "Payment Method"}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                // Hidden until a payment gateway is integrated:
                // { key: "card", icon: "card", label: ar ? "بطاقة ائتمان" : "Credit Card", desc: ar ? "Visa, Mastercard, مدى" : "Visa, Mastercard, Mada" },
                { key: "bank", icon: "receipt", label: ar ? "تحويل بنكي" : "Bank Transfer", desc: ar ? "حوالة بنكية مباشرة" : "Direct bank transfer" },
                // { key: "wallet", icon: "wallet", label: ar ? "Apple Pay / STC Pay" : "Apple Pay / STC Pay", desc: ar ? "محافظ إلكترونية" : "Digital wallets" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, cursor: "pointer", fontFamily: FONT_FAMILY, textAlign: "start",
                    border: `2px solid ${paymentMethod === m.key ? C.pri : C.brd}`,
                    background: paymentMethod === m.key ? `${C.pri}08` : "transparent",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: paymentMethod === m.key ? `${C.pri}18` : C.inp, display: "flex", alignItems: "center", justifyContent: "center", color: paymentMethod === m.key ? C.pri : C.t2, flexShrink: 0 }}>
                    <Icon name={m.icon} size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>{m.label}</div>
                    <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>{m.desc}</div>
                  </div>
                  {paymentMethod === m.key && (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.pri, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      <Icon name="check" size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bank Transfer Details (only when bank method selected) */}
          {paymentMethod === "bank" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14, borderRadius: 12, background: C.inp, border: `1px solid ${C.brd}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.txt }}>
                {ar ? "تفاصيل التحويل البنكي" : "Bank transfer details"}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, color: C.t2, marginBottom: 4 }}>
                  {ar ? "البنك المستفيد" : "To bank account"} <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.bg, color: C.txt, fontSize: 13, outline: "none", fontFamily: FONT_FAMILY }}
                >
                  <option value="">{ar ? "اختر..." : "Select..."}</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {ar ? acc.bank_name_ar || acc.bank_name : acc.bank_name} — {acc.iban}
                    </option>
                  ))}
                </select>
              </div>

              {bankAccountId && (() => {
                const acc = bankAccounts.find((a) => a.id === bankAccountId);
                if (!acc) return null;
                return (
                  <div style={{ padding: 10, borderRadius: 8, background: C.bg, fontSize: 12, lineHeight: 1.7 }}>
                    <div><span style={{ color: C.t2 }}>{ar ? "اسم المستفيد:" : "Beneficiary:"}</span> <strong style={{ color: C.txt }}>{acc.account_holder}</strong></div>
                    <div><span style={{ color: C.t2 }}>{ar ? "رقم الحساب:" : "Account #:"}</span> <strong style={{ color: C.txt, fontFamily: "monospace" }}>{acc.account_number}</strong></div>
                    <div><span style={{ color: C.t2 }}>IBAN:</span> <strong style={{ color: C.txt, fontFamily: "monospace" }}>{acc.iban}</strong></div>
                  </div>
                );
              })()}

              <div>
                <label style={{ display: "block", fontSize: 11.5, color: C.t2, marginBottom: 4 }}>
                  {ar ? "اسم المحوِّل" : "Depositor name"} <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={depositedName}
                  onChange={(e) => setDepositedName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.bg, color: C.txt, fontSize: 13, outline: "none", fontFamily: FONT_FAMILY }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, color: C.t2, marginBottom: 4 }}>
                    {ar ? "تاريخ التحويل" : "Transfer date"} <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setTransferDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.bg, color: C.txt, fontSize: 13, outline: "none", fontFamily: FONT_FAMILY }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, color: C.t2, marginBottom: 4 }}>
                    {ar ? "الرقم المرجعي" : "Reference"}
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.bg, color: C.txt, fontSize: 13, outline: "none", fontFamily: FONT_FAMILY }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, color: C.t2, marginBottom: 4 }}>
                  {ar ? "ملاحظة" : "Note"}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.bg, color: C.txt, fontSize: 13, outline: "none", fontFamily: FONT_FAMILY, resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, color: C.t2, marginBottom: 4 }}>
                  {ar ? "صورة الإيصال (jpg/png/pdf، حدّ أقصى 5MB)" : "Receipt (jpg/png/pdf, max 5MB)"} <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.bg, color: C.txt, fontSize: 12, fontFamily: FONT_FAMILY }}
                />
                {receipt && (
                  <div style={{ marginTop: 4, fontSize: 11, color: C.t2 }}>
                    {receipt.name} ({(receipt.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {topUpAmount && parseFloat(topUpAmount) > 0 && (
            <div style={{ padding: 16, borderRadius: 12, background: `#34C77B10`, border: `1px solid #34C77B20` }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.t2 }}>{ar ? "المبلغ:" : "Amount:"}</span>
                <span style={{ fontWeight: 600, color: C.txt }}>{parseFloat(topUpAmount).toLocaleString()} {ar ? "ر.س" : "SAR"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.t2 }}>{ar ? "ضريبة القيمة المضافة (15%):" : "VAT (15%):"}</span>
                <span style={{ fontWeight: 600, color: C.txt }}>{(parseFloat(topUpAmount) * 0.15).toLocaleString()} {ar ? "ر.س" : "SAR"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, paddingTop: 8, borderTop: `1px solid #34C77B30` }}>
                <span style={{ color: C.txt }}>{ar ? "الإجمالي:" : "Total:"}</span>
                <span style={{ color: "#34C77B" }}>{(parseFloat(topUpAmount) * 1.15).toLocaleString()} {ar ? "ر.س" : "SAR"}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
