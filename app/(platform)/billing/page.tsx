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
import { useBillingOverview, useBillingPlans, useBillingTransactions } from "@/lib/api/hooks";
import api from "@/lib/api/client";

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
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [topUpLoading, setTopUpLoading] = useState(false);
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
  const overview = apiOverview || {
    wallet: "0",
    curPlan: "",
    planPrice: "0",
    waConv: "0/0",
    waPercent: "0%",
    aiCredits: "0/0",
    aiPercent: "0%",
    costBreakdown: [],
    dailyWa: [],
    dailyAi: [],
    waUsed: "0",
    waTotal: "0",
    waRemaining: "0",
    aiUsed: "0",
    aiTotal: "0",
    aiRemaining: "0",
  };

  const tabs = [
    { key: "overview", label: t("overview") },
    { key: "plans", label: t("plans") },
    { key: "usage", label: t("usage") },
    { key: "transactions", label: t("txns") },
  ];

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) { showToast(ar ? "يرجى إدخال مبلغ صحيح" : "Please enter valid amount", "error"); return; }
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

  const handleUpgradePlan = async (planId: number) => {
    setUpgradeLoading(planId);
    try {
      await api.post('/billing/plans/upgrade', { planId });
      showToast(ar ? "تم ترقية الخطة بنجاح" : "Plan upgraded successfully");
      mutateOverview();
      mutatePlans();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "";
      showToast(ar ? `فشل ترقية الخطة: ${msg}` : `Plan upgrade failed: ${msg}`, "error");
    } finally {
      setUpgradeLoading(null);
      setConfirmUpgrade(null);
    }
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
        <Button primary onClick={() => { setTopUpAmount(""); setPaymentMethod("card"); setShowTopUp(true); }}>{t("topUp")}</Button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <>
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
                {plan.features.map((f: string, i: number) => (
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
        <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{t("waConv")}</h3>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: C.t2 }}>{ar ? "مستخدم" : "Used"}: {overview.waUsed || "0"}</span>
              <span style={{ fontWeight: 600 }}>{ar ? "الإجمالي" : "Total"}: {overview.waTotal || "0"}</span>
            </div>
            <ProgressBar value={73.7} color={C.pri} />
            <div style={{ fontSize: 11, color: C.t2, marginTop: 6 }}>{ar ? "متبقي:" : "Remaining:"} {overview.waRemaining || "0"}</div>
          </Card>
          <Card style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>{t("aiCredits")}</h3>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: C.t2 }}>{ar ? "مستخدم" : "Used"}: {overview.aiUsed || "0"}</span>
              <span style={{ fontWeight: 600 }}>{ar ? "الإجمالي" : "Total"}: {overview.aiTotal || "0"}</span>
            </div>
            <ProgressBar value={62} color="#7C3AED" />
            <div style={{ fontSize: 11, color: C.t2, marginTop: 6 }}>{ar ? "متبقي:" : "Remaining:"} {overview.aiRemaining || "0"}</div>
          </Card>
        </div>
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

      {/* ── Upgrade Confirmation Modal ── */}
      <Modal
        open={!!confirmUpgrade}
        onClose={() => setConfirmUpgrade(null)}
        title={ar ? "تأكيد الترقية" : "Confirm Upgrade"}
        submitLabel={upgradeLoading ? (ar ? "جاري الترقية..." : "Upgrading...") : (ar ? "تأكيد الترقية" : "Confirm Upgrade")}
        submitLoading={!!upgradeLoading}
        onSubmit={() => { if (confirmUpgrade) handleUpgradePlan(confirmUpgrade.id); }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🚀</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {ar ? `هل تريد الترقية إلى خطة ${confirmUpgrade?.name || ""}؟` : `Upgrade to ${confirmUpgrade?.name || ""} plan?`}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            <span style={{ background: GRADIENT, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{confirmUpgrade?.price || 0}</span>
            <span style={{ fontSize: 14, color: C.t2 }}> {t("sar")}/{ar ? "شهر" : "mo"}</span>
          </div>
          <div style={{ fontSize: 13, color: C.t2 }}>
            {ar ? "سيتم خصم المبلغ من رصيد المحفظة. يمكنك تغيير خطتك لاحقاً." : "The amount will be deducted from your wallet balance. You can change your plan later."}
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
                { key: "card", icon: "card", label: ar ? "بطاقة ائتمان" : "Credit Card", desc: ar ? "Visa, Mastercard, مدى" : "Visa, Mastercard, Mada" },
                { key: "bank", icon: "receipt", label: ar ? "تحويل بنكي" : "Bank Transfer", desc: ar ? "حوالة بنكية مباشرة" : "Direct bank transfer" },
                { key: "wallet", icon: "wallet", label: ar ? "Apple Pay / STC Pay" : "Apple Pay / STC Pay", desc: ar ? "محافظ إلكترونية" : "Digital wallets" },
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
