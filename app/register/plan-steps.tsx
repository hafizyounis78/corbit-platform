"use client";

import { META_FEES, PLAN_COPY, TRIAL, money, price, usersLabel, type Catalog, type CatalogPlan, type Line, type PlanKey, type Quote } from "./plan-data";

/** What the customer has chosen on step 3. */
export type Selection = {
  path: "plan" | "trial";
  yearly: boolean;
  plan: PlanKey;
  /** extra users, remembered per plan as in the design */
  extra: Partial<Record<PlanKey, number>>;
};

const Ico = ({ d, w = 2, children }: { d?: string; w?: number; children?: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d ? <path d={d} /> : children}</svg>
);
const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const SHIELD = "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6zM9 12l2 2 4-4";
const SPARK = "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z";

/* ------------------------------------------------------------------ */
/* STEP 3 · choose a plan, or start with the trial                     */
/* ------------------------------------------------------------------ */

/** The customer's existing trial, when they come back to this step from it. */
export type TrialState = { frozen: boolean; daysLeft: string; left: string; sent: number; sentLabel: string; accepted: string; first: string };

export function PlanStep({ catalog, sel, onChange, quoteOf, biz, phone, sector, trial }: {
  catalog: Catalog;
  sel: Selection;
  onChange: (patch: Partial<Selection>) => void;
  quoteOf: (p: CatalogPlan, extra?: number) => Quote;
  biz: string;
  phone: string;
  sector: string;
  trial?: TrialState | null;
}) {
  const isT = sel.path === "trial";
  const tDis = !!trial?.frozen;
  const P = catalog.plans.find((p) => p.key === sel.plan) ?? catalog.plans[0];
  const copy = PLAN_COPY[P.key];
  const xu = sel.extra[P.key] ?? 0;
  const xMax = P.extra_users_max === null ? 999 : P.extra_users_max;
  const setXu = (n: number) => onChange({ extra: { ...sel.extra, [P.key]: Math.max(0, Math.min(xMax, Math.trunc(n) || 0)) } });
  const cheapest = Math.min(...catalog.plans.map((p) => p.price));

  return (
    <div className="view">
      {trial && (
        <div className="wb3" role="status">
          <span className="wb3-ic"><Ico d={CHECK} w={2.6} /></span>
          <div><b>أهلًا بعودتك{trial.first ? ` يا ${trial.first}` : ""} — بياناتك محفوظة</b>
            <small>{(trial.sent ? `أرسلت ${trial.sentLabel} خلال التجربة` : "لم ترسل رسائل بعد") + (trial.accepted ? `، ووافق ${trial.accepted}` : "")}. اختر الباقة وأكمل الدفع لتربط رقمك الخاص.</small></div>
        </div>
      )}
      <div className="ph"><h1 tabIndex={-1}>اختر باقتك أو ابدأ بالتجربة</h1><p>اشترك الآن لتبدأ ربط رقمك الخاص، أو جرّب المنصة قبل الدفع ثم اشترك متى كنت جاهزًا وبياناتك محفوظة.</p></div>

      <div className="paths" role="radiogroup" aria-label="طريقة البدء">
        <label className={"pth" + (isT ? "" : " on")}>
          <input type="radio" className="sr" name="wr-path" value="plan" checked={!isT} onChange={() => onChange({ path: "plan" })} />
          <span className="pt-ic"><Ico w={1.8}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></Ico></span>
          <span className="pt-tx"><b>اشترك بباقة</b><small>ادفع الآن، ثم اربط رقم واتساب منشأتك ووثّقه باسمك عبر Meta.</small><span className="pt-tag">من {price(cheapest * 100)} ر.س شهريًا قبل الضريبة</span></span>
          <span className="rd" aria-hidden="true" />
        </label>
        <label className={"pth tr" + (isT ? " on" : "") + (tDis ? " dis" : "")}>
          <input type="radio" className="sr" name="wr-path" value="trial" checked={isT} disabled={tDis} onChange={() => { if (!tDis) onChange({ path: "trial" }); }} />
          <span className="pt-ic"><Ico d={SPARK} w={1.7} /></span>
          <span className="pt-tx">
            <b>{trial ? (tDis ? "انتهت تجربتك" : "تجربتك فعّالة") : "جرّب المنصة أولًا، بدون دفع"}</b>
            <small>{trial
              ? (tDis ? "تُتاح تجربة واحدة لكل جوال ولكل سجل تجاري. اختر باقة للمتابعة." : `متبقٍ ${trial.daysLeft} و${trial.left}، وتعود إليها متى شئت.`)
              : `${TRIAL.days} أيام و${TRIAL.total} رسالة من رقم كوربت التجريبي بقوالب جاهزة، بدون بطاقة.`}</small>
            <span className="pt-tag">{trial ? (tDis ? "منتهية" : "فعّالة") : "مجانًا"}</span>
          </span>
          <span className="rd" aria-hidden="true" />
        </label>
      </div>

      {!isT && (
        <>
          <div className="pl-bar">
            <p className="pl-note">الأسعار بالريال السعودي قبل ضريبة القيمة المضافة {catalog.vat_percent}%، وتحت كل سعر إجمالي الفترة شامل الضريبة.</p>
            <div className="seg" role="radiogroup" aria-label="مدة الاشتراك">
              <label className={sel.yearly ? "" : "on"}><input type="radio" className="sr" name="wr-per" value="m" checked={!sel.yearly} onChange={() => onChange({ yearly: false })} /><span>شهري</span></label>
              <label className={sel.yearly ? "on" : ""}><input type="radio" className="sr" name="wr-per" value="y" checked={sel.yearly} onChange={() => onChange({ yearly: true })} /><span>سنوي — <em>خصم {catalog.yearly_discount_percent}%</em></span></label>
            </div>
          </div>

          <div className="plans" role="radiogroup" aria-label="الباقات">
            {catalog.plans.map((p) => {
              const q = quoteOf(p, 0), on = p.key === P.key, c = PLAN_COPY[p.key];
              return (
                <label key={p.key} className={"pl" + (on ? " on" : "")} data-plan={p.key}>
                  <input type="radio" className="sr" name="wr-plan" value={p.key} checked={on} onChange={() => onChange({ plan: p.key })} />
                  {c.hot && <span className="hot">الأكثر طلبًا</span>}
                  <span className="pl-hd"><span className="rd" aria-hidden="true" /><b>{c.n}</b><span className="pl-en">{c.en}</span></span>
                  <span className="pl-pr"><b className="num">{price(q.monthlyH)}</b><span className="cur">ر.س</span></span>
                  <span className="pl-u">شهريًا قبل الضريبة{sel.yearly && <s className="num">{p.price.toLocaleString("en-US")}</s>}</span>
                  <span className="pl-vat"><b className="num">{money(q.planInclH)} ر.س</b> {sel.yearly ? "سنويًا شامل الضريبة" : "شهريًا شامل الضريبة"}</span>
                  <span className="pl-keys">{c.keys.map((k) => <span key={k}>{k}</span>)}</span>
                </label>
              );
            })}
          </div>

          <div className="card pdet">
            <div className="pdet-f">
              <h3>مميزات باقة {copy.n}</h3>
              <ul className="feats">{copy.f.map((x) => <li key={x}><Ico d={CHECK} w={2.4} /><span>{x}</span></li>)}</ul>
            </div>
            <div className="pdet-s">
              <div className="xu">
                <div className="xu-hd">
                  <span className="xu-ic"><Ico d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8" /></span>
                  <span className="xu-t"><b>مستخدمون إضافيون</b><small>{
                    P.extra_users_max === 0
                      ? "تشمل الباقة مستخدمَين"
                      : `${P.extra_user_price} ر.س للمستخدم شهريًا · ${P.extra_users_max === null ? "بلا حد أقصى" : `حتى ${usersLabel(P.users + P.extra_users_max)} إجمالًا`}${sel.yearly ? " · لا يشملها الخصم السنوي" : ""}`
                  }</small></span>
                </div>
                {P.extra_users_max !== 0 ? (
                  <>
                    <div className="xu-row">
                      <div className="stepper">
                        <button type="button" className="xu-dec" onClick={() => setXu(xu - 1)} disabled={xu <= 0} aria-label="إنقاص مستخدم"><Ico d="M5 12h14" w={2.4} /></button>
                        <input className="num xu-in" inputMode="numeric" value={String(xu)} onChange={(e) => setXu(parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)} aria-label="عدد المستخدمين الإضافيين" />
                        <button type="button" className="xu-inc" onClick={() => setXu(xu + 1)} disabled={xu >= xMax} aria-label="إضافة مستخدم"><Ico d="M12 5v14M5 12h14" w={2.4} /></button>
                      </div>
                      <span className="xu-tot">المجموع {usersLabel(P.users + xu)}</span>
                    </div>
                    {P.extra_users_max !== null && xu >= P.extra_users_max && <p className="xu-max">وصلت إلى الحد الأقصى للمستخدمين في هذه الباقة</p>}
                  </>
                ) : (
                  <p className="xu-off">إضافة مستخدمين غير متاحة في الأساسية، والترقية إلزامية. <button type="button" className="lnk" onClick={() => onChange({ plan: "starter" })}>الترقية إلى البداية</button></p>
                )}
              </div>
              <div className="once">
                <span className="once-t">رسوم لمرة واحدة<small>غير شاملة الضريبة</small></span>
                <span className="once-r"><span>التوثيق</span><b className="num">{P.verification_fee.toLocaleString("en-US")} ر.س</b></span>
                <span className="once-r"><span>الإعداد</span><b className="num">{P.setup_fee.toLocaleString("en-US")} ر.س</b></span>
              </div>
            </div>
          </div>

          <MetaFees />
        </>
      )}

      {isT && (
        <div className="card tri">
          <div className="tri-a">
            <h3>ما تحصل عليه في التجربة</h3>
            <div className="tri-stats">
              <div className="tri-s"><b className="num">{TRIAL.days}</b><small>أيام</small></div>
              <div className="tri-s"><b className="num">{TRIAL.total}</b><small>رسالة للتجربة</small></div>
              <div className="tri-s"><b className="num">{TRIAL.day}</b><small>رسائل يوميًا</small></div>
              <div className="tri-s"><b className="num">{TRIAL.inv}</b><small>أرقام تدعوها</small></div>
            </div>
            <ul>
              <li><Ico d={CHECK} w={2.4} /><span>إرسال فعلي من رقم كوربت التجريبي، واسم «{biz || "منشأتك"}» داخل نص كل رسالة</span></li>
              <li><Ico d={CHECK} w={2.4} /><span>أول رسالة تصل إلى جوالك الموثّق <bdi dir="ltr">{phone}</bdi></span></li>
              <li><Ico d={CHECK} w={2.4} /><span>قوالب خدمية جاهزة {sector ? `لقطاع «${sector}»` : "لقطاعك"}</span></li>
              <li><Ico d={CHECK} w={2.4} /><span>دعوة حتى {TRIAL.inv} أرقام، ولا يستقبل الرقم أي رسالة قبل موافقته</span></li>
              <li><Ico d={CHECK} w={2.4} /><span>أكمل 3 مهام وتُمدَّد تجربتك {TRIAL.ext} أيام تلقائيًا</span></li>
            </ul>
          </div>
          <div className="tri-b">
            <h3>لحماية الرقم التجريبي</h3>
            <ul>
              {["قوالب معتمدة فقط، وتعدّل فيها الاسم ورقم الطلب والموعد", "لا نص حر ولا روابط ولا ملفات، وتذييل «رسالة تجريبية - كوربت»", "الحملات والشات بوت الذكي والـAPI تُفتح بالاشتراك", "تجربة واحدة لكل جوال ولكل سجل تجاري"].map((x) => (
                <li key={x}><Ico w={2}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Ico><span>{x}</span></li>
              ))}
            </ul>
          </div>
          <p className="tri-note"><Ico d={SHIELD} /><span>تشترك متى شئت من داخل المنصة وتعود إلى هذه الصفحة وبياناتك محفوظة. بعد انتهاء التجربة يتجمّد الإرسال وتُحفظ بياناتك 30 يومًا.</span></p>
        </div>
      )}
    </div>
  );
}

function MetaFees() {
  // uncontrolled <details>-like toggle kept in the DOM class, as in the design
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const box = e.currentTarget.parentElement!;
    const open = box.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", String(open));
    box.querySelector(".mf-body")?.setAttribute("aria-hidden", String(!open));
    const more = e.currentTarget.querySelector(".mf-lbl");
    if (more) more.textContent = open ? "إخفاء" : "التفاصيل";
    if (open) setTimeout(() => box.scrollIntoView({ block: "nearest", behavior: "smooth" }), 380);
  };
  return (
    <div className="mf">
      <button type="button" className="mf-btn" aria-expanded="false" aria-controls="wr-mf" onClick={toggle}>
        <Ico><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Ico>
        <span className="mf-t">رسوم Meta للرسائل تُحتسب منفصلة حسب الاستخدام</span>
        <span className="mf-more"><span className="mf-lbl">التفاصيل</span><Ico d="M6 9l6 6 6-6" w={2.2} /></span>
      </button>
      <div className="mf-body" id="wr-mf" aria-hidden="true"><div className="mf-in"><div className="mf-grid">
        {META_FEES.map((r) => <div className="mfc" key={r.k}><span className="mfc-k">{r.k}</span><b className="num">{r.v}</b><small>{r.u}</small>{r.n && <em>{r.n}</em>}</div>)}
      </div></div></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* shared: the order lines                                             */
/* ------------------------------------------------------------------ */

export function OrderLines({ lines }: { lines: Line[] }) {
  return (
    <dl className="lines">
      {lines.map((l) => (
        <div key={l.k} className={"ln" + (l.sep ? " sep" : "")}>
          <dt>{l.k}{l.once && <span className="once-i"> · مرة واحدة</span>}{l.sub && <small>{l.sub}</small>}</dt>
          <dd>{l.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* STEP 4 · payment (PayTabs' hosted page, as in the SMS portal)       */
/* ------------------------------------------------------------------ */

export type PayState =
  | { kind: "review" }
  | { kind: "checking" }                       // back from the payment page, waiting for the gateway's verdict
  | { kind: "late"; orderNo: string }         // still unconfirmed after a minute — may yet be approved
  | { kind: "paid"; orderNo: string; method?: string | null }
  | { kind: "failed"; reason: string };

/** The discount-code field on the payment step. */
export type PromoProps = {
  value: string;
  err: string;
  busy: boolean;
  /** set once the backend accepted the code */
  applied: { code: string; saved: string } | null;
  onChange: (v: string) => void;
  onApply: () => void;
  onRemove: () => void;
};

export function PayStep({ lines, total, periodLabel, state, error, onEnter, promo }: {
  lines: Line[];
  total: string;
  periodLabel: string;
  state: PayState;
  error: string;
  onEnter: () => void;
  promo?: PromoProps;
}) {
  if (state.kind === "checking") {
    return (
      <div className="view">
        <div className="card pay-res" role="status" aria-live="polite">
          <span className="wait" aria-hidden="true" />
          <h2 tabIndex={-1}>جارٍ تأكيد الدفع…</h2>
          <p>ننتظر تأكيد البنك للعملية. لا تغلق هذه الصفحة.</p>
        </div>
      </div>
    );
  }

  if (state.kind === "late") {
    return (
      <div className="view">
        <div className="card pay-res" role="status">
          <span className="wait" aria-hidden="true" />
          <h2 tabIndex={-1}>لم يصلنا تأكيد البنك بعد</h2>
          <p>طلبك <bdi dir="ltr" className="num">{state.orderNo}</bdi> ما زال قيد التأكيد. إن خُصم المبلغ فسيتفعّل اشتراكك تلقائيًا خلال دقائق، ولا تحتاج إلى الدفع مرة أخرى. للمساعدة اتصل على <bdi dir="ltr">920006900</bdi>.</p>
          <button type="button" className="btn btn-pri" onClick={onEnter}><span className="bl">ادخل إلى المنصة</span></button>
        </div>
      </div>
    );
  }

  if (state.kind === "paid") {
    return (
      <div className="view">
        <div className="card pay-res" role="status">
          <span className="okc"><Ico d={CHECK} w={2.8} /></span>
          <h2 tabIndex={-1}>تم الدفع وتفعيل اشتراكك</h2>
          <p>رقم الطلب <bdi dir="ltr" className="num">{state.orderNo}</bdi>{state.method ? ` · ${state.method}` : ""}. الخطوة التالية ربط رقم واتساب منشأتك وتوثيقه.</p>
          <button type="button" className="btn btn-pri" onClick={onEnter}><span className="bl">ادخل إلى المنصة</span></button>
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="ph"><h1 tabIndex={-1}>الدفع</h1><p>راجع طلبك، ثم أكمل الدفع في صفحة الدفع الآمنة.</p></div>
      <div className="pay">
        <div className="card paym">
          <h3 className="c-t">طريقة الدفع</h3>
          <div className="pay-how" aria-label="طرق الدفع المقبولة"><span>مدى</span><span>بطاقة ائتمانية</span><span>Apple Pay</span></div>
          <p className="pm-note"><Ico d={SHIELD} /><span>عند الضغط على «ادفع» تنتقل إلى صفحة الدفع الآمنة من PayTabs لإدخال بيانات البطاقة، ثم تعود إلى هنا تلقائيًا. لا تمرّ بيانات بطاقتك على خوادمنا.</span></p>
          {(state.kind === "failed" || error) && (
            <p className="form-err" role="alert">{state.kind === "failed" ? `لم تكتمل عملية الدفع${state.reason ? `: ${state.reason}` : ""}. لم يُخصم أي مبلغ، ويمكنك المحاولة مرة أخرى.` : error}</p>
          )}
        </div>

        <div className="card ordr">
          <h3 className="c-t">ملخص الطلب <span className="ordr-tag">{periodLabel}</span></h3>
          <OrderLines lines={lines} />
          {promo && (
            <div className={"fld promo-w" + (promo.err ? " bad" : "")}>
              <label className="lbl" htmlFor="wr-promo">رمز الخصم <span className="opt">(اختياري)</span></label>
              <div className="promo">
                <div className="ctrl">
                  <input id="wr-promo" name="promo" autoComplete="off" placeholder="أدخل الرمز" dir="ltr" value={promo.value} readOnly={!!promo.applied}
                    onChange={(e) => promo.onChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (!promo.applied) promo.onApply(); } }}
                    aria-invalid={!!promo.err} aria-describedby="wr-promo-e" />
                </div>
                {promo.applied
                  ? <button type="button" className="btn btn-line promo-go" onClick={promo.onRemove}>إزالة</button>
                  : <button type="button" className={"btn btn-line promo-go" + (promo.busy ? " busy" : "")} disabled={promo.busy} onClick={promo.onApply}>تطبيق</button>}
              </div>
              <p className="err" id="wr-promo-e" role="alert">{promo.err}</p>
              {promo.applied && <p className="promo-ok" role="status"><Ico d={CHECK} w={2.4} /><span>تم تطبيق الرمز <bdi dir="ltr">{promo.applied.code}</bdi> — وفّرت {promo.applied.saved} ر.س قبل الضريبة</span></p>}
            </div>
          )}
          <div className="tot"><span className="tl-l">الإجمالي المستحق<small>شامل ضريبة القيمة المضافة</small></span><b><span className="num">{total}</span> <small>ر.س</small></b></div>
        </div>
      </div>
    </div>
  );
}
