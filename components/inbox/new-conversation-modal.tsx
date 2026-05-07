"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useTemplates } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";
import api from "@/lib/api/client";

type Template = {
  id: string;
  name: string;
  cat?: string;
  st?: string;
  body?: string;
  vars?: string[];
};

type Contact = {
  id: string;
  name?: string;
  phone?: string;
  city?: string;
};

/**
 * Modal that opens an outbound conversation. Meta forbids free-text
 * first-touches, so the only legal path is "pick a contact + send
 * an approved template". This modal enforces both at the UI level
 * and the backend re-validates before any API call to 360dialog.
 *
 * Three steps:
 *   1. Resolve a contact — search the org's existing contacts by
 *      name or phone, OR enter a new phone (auto-creates the
 *      contact with opted_in_at=now since the agent is initiating).
 *   2. Pick an approved template — only `status=approved` shows up.
 *   3. Fill template variables (1 input per {{N}} slot).
 *
 * On submit: POST /conversations/start. The response gives back a
 * conversation_id which we hand to the parent so the inbox can
 * jump to the new chat.
 */
export function NewConversationModal({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted: (conversationId: string) => void;
}) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const { data: templatesData } = useTemplates();
  const templates: Template[] = (Array.isArray(templatesData) ? templatesData : []).filter(
    (t: Template) => t.st === "approved",
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<Contact[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [pickedContact, setPickedContact] = useState<Contact | null>(null);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [pickedTemplate, setPickedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Reset on close so re-opening starts fresh.
  useEffect(() => {
    if (!open) {
      setStep(1);
      setContactSearch("");
      setContactResults([]);
      setPickedContact(null);
      setNewPhone("");
      setNewName("");
      setPickedTemplate(null);
      setVariables([]);
    }
  }, [open]);

  // Debounced contact search.
  useEffect(() => {
    if (!open) return;
    const q = contactSearch.trim();
    if (!q) {
      setContactResults([]);
      return;
    }
    let cancelled = false;
    setContactLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/contacts?search=${encodeURIComponent(q)}&limit=10`);
        if (cancelled) return;
        const data = r.data?.data ?? r.data;
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setContactResults(list.slice(0, 10));
      } catch {
        if (!cancelled) setContactResults([]);
      } finally {
        if (!cancelled) setContactLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [contactSearch, open]);

  // Initialize variables array when template changes.
  useEffect(() => {
    if (pickedTemplate) {
      const slots = (pickedTemplate.vars || []).length;
      setVariables(Array(slots).fill(""));
    } else {
      setVariables([]);
    }
  }, [pickedTemplate]);

  const canStart = !!pickedTemplate && variables.every((v) => v.trim().length > 0);

  const handleStart = async () => {
    if (!pickedTemplate) return;
    setBusy(true);
    try {
      const payload: any = {
        template_id: pickedTemplate.id,
        variables,
      };
      if (pickedContact) {
        payload.contact_id = pickedContact.id;
      } else if (newPhone.trim()) {
        payload.phone = newPhone.trim();
        if (newName.trim()) payload.name = newName.trim();
      } else {
        showToast(isAr ? "اختر جهة اتّصال أو أدخل رقم جوّال" : "Pick a contact or enter a phone number", "error");
        setBusy(false);
        return;
      }

      const r = await api.post(`/conversations/start`, payload);
      const data = r.data?.data ?? r.data;
      const cid = data?.conversation_id;
      if (cid) {
        showToast(isAr ? "تمّ بدء المحادثة" : "Conversation started");
        onStarted(cid);
        onClose();
      } else {
        showToast(isAr ? "لم نحصل على ID المحادثة" : "Did not get a conversation id", "error");
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? "فشل بدء المحادثة" : "Could not start conversation"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={isAr ? "💬 محادثة جديدة" : "💬 New Conversation"}
      submitLabel={busy ? (isAr ? "جارٍ الإرسال..." : "Sending...") : (isAr ? "بدء المحادثة" : "Start Conversation")}
      submitDisabled={busy || !canStart || step !== 3}
      onSubmit={handleStart}
      wide
    >
      <div style={{ fontFamily: FONT_FAMILY }}>
        {/* Meta-rule banner — explains why a template is required so
            agents don't try to bypass it. */}
        <div style={{
          padding: "8px 12px", borderRadius: 8,
          background: `${C.info}10`, border: `1px solid ${C.info}30`,
          fontSize: 11.5, color: C.t2, lineHeight: 1.6, marginBottom: 14,
        }}>
          ℹ️ {isAr
            ? "Meta لا تسمح ببدء محادثة جديدة بنصّ حرّ. لا بدّ من قالب معتمد لأوّل تواصل."
            : "Meta requires an approved template for any first-touch outbound message."}
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: step >= n ? C.pri : C.brd,
              }}
            />
          ))}
        </div>

        {/* Step 1 — pick or create contact */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 8 }}>
              {isAr ? "1. جهة الاتّصال" : "1. Contact"}
            </div>
            <input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder={isAr ? "ابحث بالاسم أو الرقم..." : "Search by name or phone..."}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${C.brd}`, background: C.inp,
                color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY,
                outline: "none", marginBottom: 8, boxSizing: "border-box",
              }}
            />
            {contactSearch && (
              <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
                {contactLoading ? (
                  <div style={{ padding: 12, fontSize: 12, color: C.t2 }}>
                    {isAr ? "جارٍ البحث..." : "Searching..."}
                  </div>
                ) : contactResults.length === 0 ? (
                  <div style={{ padding: 12, fontSize: 12, color: C.t3 }}>
                    {isAr ? "لا توجد نتائج" : "No matches"}
                  </div>
                ) : contactResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setPickedContact(c); setNewPhone(""); setNewName(""); }}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      width: "100%", padding: "8px 12px", borderRadius: 6,
                      background: pickedContact?.id === c.id ? `${C.pri}15` : "transparent",
                      border: `1px solid ${pickedContact?.id === c.id ? C.pri : "transparent"}`,
                      cursor: "pointer", marginBottom: 4,
                      fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{c.name || (isAr ? "بدون اسم" : "No name")}</span>
                    <span style={{ color: C.t2, fontFamily: "monospace" }}>{c.phone}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0", color: C.t3, fontSize: 11 }}>
              <div style={{ flex: 1, height: 1, background: C.brd }} />
              {isAr ? "أو" : "or"}
              <div style={{ flex: 1, height: 1, background: C.brd }} />
            </div>

            <div style={{ fontSize: 12, color: C.t2, marginBottom: 6 }}>
              {isAr ? "إضافة جهة اتّصال جديدة" : "Add a new contact"}
            </div>
            <input
              value={newPhone}
              onChange={(e) => { setNewPhone(e.target.value); setPickedContact(null); }}
              placeholder={isAr ? "رقم الجوّال (مثال: +966501234567)" : "Phone (e.g. +966501234567)"}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${C.brd}`, background: C.inp,
                color: C.txt, fontSize: 13, fontFamily: "monospace",
                outline: "none", marginBottom: 6, boxSizing: "border-box", direction: "ltr",
              }}
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isAr ? "الاسم (اختياري)" : "Name (optional)"}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${C.brd}`, background: C.inp,
                color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY,
                outline: "none", marginBottom: 6, boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <Button
                primary
                onClick={() => setStep(2)}
                disabled={!pickedContact && !newPhone.trim()}
              >
                {isAr ? "التالي" : "Next"} →
              </Button>
            </div>
          </>
        )}

        {/* Step 2 — pick template */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 8 }}>
              {isAr ? "2. اختر قالباً معتمداً" : "2. Pick an approved template"}
            </div>
            {templates.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: C.t2, lineHeight: 1.7 }}>
                📭 {isAr
                  ? "لا توجد قوالب معتمدة بعد. أنشئ قالباً وانتظر موافقة Meta أوّلاً."
                  : "No approved templates yet. Create one and wait for Meta to approve."}
              </div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto", display: "grid", gap: 6 }}>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPickedTemplate(t)}
                    style={{
                      textAlign: isAr ? "right" : "left", padding: "10px 12px", borderRadius: 8,
                      background: pickedTemplate?.id === t.id ? `${C.pri}15` : "transparent",
                      border: `1px solid ${pickedTemplate?.id === t.id ? C.pri : C.brd}`,
                      cursor: "pointer", fontFamily: FONT_FAMILY,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: C.txt }}>{t.name}</span>
                      {t.cat && (
                        <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 4, background: `${C.pri}15`, color: C.pri, fontWeight: 600 }}>
                          {t.cat}
                        </span>
                      )}
                    </div>
                    {t.body && (
                      <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden" }}>
                        {t.body}
                      </div>
                    )}
                    {t.vars && t.vars.length > 0 && (
                      <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
                        {t.vars.length} {isAr ? "متغيّر" : "variables"}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <Button onClick={() => setStep(1)}>← {isAr ? "السابق" : "Back"}</Button>
              <Button primary onClick={() => setStep(3)} disabled={!pickedTemplate}>
                {isAr ? "التالي" : "Next"} →
              </Button>
            </div>
          </>
        )}

        {/* Step 3 — fill variables + send */}
        {step === 3 && pickedTemplate && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 8 }}>
              {isAr ? "3. ملء المتغيّرات" : "3. Fill variables"}
            </div>
            {variables.length === 0 ? (
              <div style={{ padding: 14, fontSize: 12.5, color: C.t2, lineHeight: 1.7, background: C.inp, borderRadius: 8, border: `1px solid ${C.brd}`, marginBottom: 10 }}>
                ✓ {isAr ? "هذا القالب لا يحوي متغيّرات. اضغط 'بدء المحادثة' للإرسال." : "No variables in this template. Click Start to send."}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                {variables.map((v, i) => (
                  <div key={i}>
                    <label style={{ display: "block", fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600, fontFamily: "monospace" }}>
                      {`{{${i + 1}}}`}
                    </label>
                    <input
                      value={v}
                      onChange={(e) => {
                        const next = [...variables];
                        next[i] = e.target.value;
                        setVariables(next);
                      }}
                      placeholder={isAr ? `قيمة المتغيّر ${i + 1}` : `Value for variable ${i + 1}`}
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: 6,
                        border: `1px solid ${C.brd}`, background: C.inp,
                        color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY,
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {pickedTemplate.body && (
              <div style={{
                padding: 10, borderRadius: 8,
                background: `${C.ok}08`, border: `1px solid ${C.ok}25`,
                fontSize: 12, color: C.t2, lineHeight: 1.7, marginBottom: 10,
                whiteSpace: "pre-wrap",
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.ok, marginBottom: 4 }}>
                  📱 {isAr ? "معاينة" : "Preview"}
                </div>
                {variables.reduce((acc, v, i) => acc.replaceAll(`{{${i + 1}}}`, v.trim() || `{{${i + 1}}}`), pickedTemplate.body)}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 10 }}>
              <Button onClick={() => setStep(2)}>← {isAr ? "السابق" : "Back"}</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
