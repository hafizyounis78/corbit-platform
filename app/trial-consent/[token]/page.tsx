"use client";

import { use, useEffect, useState } from "react";
import api from "@/lib/api/client";
import "../../register/register.css";
import "./consent.css";

/**
 * Where a number invited to someone's WhatsBit trial answers.
 *
 * The invitation arrives by SMS with this link. Nothing is sent to the
 * number on WhatsApp until its owner accepts here; declining is final.
 * No account is needed — the link's token is the invitation.
 */

type Status = "loading" | "pending" | "accepted" | "declined" | "invalid" | "error";

export default function TrialConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<Status>("loading");
  const [business, setBusiness] = useState("");
  const [busy, setBusy] = useState<"" | "yes" | "no">("");

  useEffect(() => {
    api.get(`/trial-consent/${encodeURIComponent(token)}`)
      .then((r) => { setBusiness(r.data.data.business || ""); setStatus(r.data.data.status); })
      .catch((e) => setStatus(e?.response?.status === 404 ? "invalid" : "error"));
  }, [token]);

  const answer = async (accept: boolean) => {
    if (busy) return;
    setBusy(accept ? "yes" : "no");
    try {
      const r = await api.post(`/trial-consent/${encodeURIComponent(token)}`, { accept });
      setStatus(r.data.data.status);
    } catch (e: any) {
      setStatus(e?.response?.status === 404 ? "invalid" : "error");
    }
    setBusy("");
  };

  return (
    <div className="wr cns" dir="rtl" lang="ar">
      <main className="cns-box">
        <div className="cns-brand"><b>Whats<span className="g">Bit</span></b><small>منصة من كوربت</small></div>

        {status === "loading" && <p className="cns-p">جارٍ التحميل…</p>}

        {status === "pending" && (
          <>
            <h1>دعوة لاستقبال رسائل تجريبية</h1>
            <p className="cns-p"><b>«{business}»</b> يجرّب منصة WhatsBit لرسائل واتساب، ويدعوك لاستقبال رسائل تجريبية على رقمك.</p>
            <ul className="cns-ul">
              <li>تصلك الرسائل من رقم كوربت التجريبي على واتساب، وفي آخر كل رسالة «رسالة تجريبية - كوربت».</li>
              <li>عدد محدود من الرسائل خلال مدة التجربة فقط.</li>
              <li>لا يصلك شيء إن لم توافق.</li>
            </ul>
            <div className="cns-act">
              <button type="button" className={"btn btn-pri" + (busy === "yes" ? " busy" : "")} disabled={!!busy} onClick={() => answer(true)}><span className="bl">أوافق</span><span className="spin" aria-hidden="true" /></button>
              <button type="button" className="btn btn-line" disabled={!!busy} onClick={() => answer(false)}><span>لا أوافق</span></button>
            </div>
          </>
        )}

        {status === "accepted" && (<><h1>تمت الموافقة</h1><p className="cns-p">ستصلك رسائل تجريبية من «{business}» على واتساب. شكرًا لك.</p></>)}
        {status === "declined" && (<><h1>تم تسجيل الرفض</h1><p className="cns-p">لن تصلك أي رسالة من هذه التجربة.</p></>)}
        {status === "invalid" && (<><h1>رابط الدعوة غير صالح</h1><p className="cns-p">تأكد من الرابط الذي وصلك في الرسالة النصية.</p></>)}
        {status === "error" && (<><h1>تعذّر فتح الدعوة</h1><p className="cns-p">تحقق من اتصالك بالإنترنت ثم حدّث الصفحة.</p></>)}

        <p className="cns-ft">للمساعدة: <a href="tel:920006900"><bdi dir="ltr">920006900</bdi></a></p>
      </main>
    </div>
  );
}
