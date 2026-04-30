"use client";

/**
 * WhatsAppProvisioningWizard
 *
 * Six-step onboarding flow for tenants signing up under Corbit's
 * 360dialog Sales Channel Partner umbrella. Backend keeps the source
 * of truth — every step PATCHes the draft, so the wizard can be
 * abandoned and resumed at any time.
 *
 * Steps:
 *   1. Business identity (CR + business profile)
 *   2. Owner / authorized signatory
 *   3. WhatsApp number to provision
 *   4. Document uploads (CR + Owner ID required)
 *   5. Legal consents (DPA + TOS + Privacy)
 *   6. Review & submit for Corbit admin review
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button, Badge } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import api from "@/lib/api/client";
import { useWhatsAppProvisioning } from "@/lib/api/hooks";

type Draft = NonNullable<ReturnType<typeof useWhatsAppProvisioning>['data']>['draft'];
type ConsentVersions = NonNullable<ReturnType<typeof useWhatsAppProvisioning>['data']>['consentVersions'];

const STEPS = [
  { key: 'business',  arLabel: 'الشركة' },
  { key: 'owner',     arLabel: 'المسؤول' },
  { key: 'number',    arLabel: 'الرقم' },
  { key: 'documents', arLabel: 'الأوراق' },
  { key: 'consents',  arLabel: 'الموافقات' },
  { key: 'review',    arLabel: 'المراجعة' },
] as const;

const BUSINESS_CATEGORIES = [
  'OTHER', 'AUTO', 'BEAUTY', 'APPAREL', 'EDU', 'ENTERTAIN',
  'EVENT_PLAN', 'FINANCE', 'GROCERY', 'GOVT', 'HOTEL', 'HEALTH',
  'NONPROFIT', 'PROF_SERVICES', 'RETAIL', 'TRAVEL', 'RESTAURANT',
];

export function WhatsAppProvisioningWizard({ onClose }: { onClose?: () => void }) {
  const { colors: C, isDark: dk } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const { data, mutate, isLoading } = useWhatsAppProvisioning();

  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Local draft mirrors the backend so the user sees their own
  // typing without waiting for round-trips. We PATCH on step
  // navigation, not on every keystroke.
  const [local, setLocal] = useState<Draft | null>(null);
  const lastSyncedDraftId = useRef<string | null>(null);

  useEffect(() => {
    if (data?.draft && data.draft.id !== lastSyncedDraftId.current) {
      setLocal(data.draft);
      lastSyncedDraftId.current = data.draft.id;
    }
  }, [data?.draft]);

  const draft = local;
  const consentVersions: ConsentVersions = data?.consentVersions ?? { dpa: '', tos: '', privacy: '' };

  // ── helpers ─────────────────────────────────────────────
  const updateField = (path: string, value: any) => {
    if (!draft) return;
    setLocal((prev) => {
      if (!prev) return prev;
      const [section, key] = path.split('.');
      if (!key) return { ...prev, [section]: value } as any;
      return { ...prev, [section]: { ...(prev as any)[section], [key]: value } } as any;
    });
  };

  // Persist the editable section fields. Step navigation calls this
  // before moving forward so we never lose data on a tab close.
  const saveCurrentStep = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      const stepKey = STEPS[stepIdx].key;

      if (stepKey === 'business') {
        Object.assign(payload, {
          business_name:     draft.business.name ?? null,
          business_name_ar:  draft.business.nameAr ?? null,
          cr_number:         draft.business.crNumber ?? null,
          business_category: draft.business.category ?? null,
          address:           draft.business.address ?? null,
          city:              draft.business.city ?? null,
          country_code:      draft.business.country ?? 'SA',
          website:           draft.business.website ?? null,
        });
      } else if (stepKey === 'owner') {
        Object.assign(payload, {
          owner_name:      draft.owner.name ?? null,
          owner_id_type:   draft.owner.idType ?? null,
          owner_id_number: draft.owner.idNumber ?? null,
          owner_email:     draft.owner.email ?? null,
          owner_phone:     draft.owner.phone ?? null,
        });
      } else if (stepKey === 'number') {
        Object.assign(payload, {
          phone_number:        draft.number.phoneNumber ?? null,
          display_name:        draft.number.displayName ?? null,
          display_name_ar:     draft.number.displayNameAr ?? null,
          is_existing_number:  draft.number.isExistingNumber ?? false,
          verification_method: draft.number.verificationMethod ?? null,
        });
      }

      if (Object.keys(payload).length > 0) {
        await api.patch(`/whatsapp/provisioning/${draft.id}`, payload);
      }
      await mutate();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? 'فشل الحفظ' : 'Save failed'), 'error');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    try {
      await saveCurrentStep();
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    } catch {
      // toast already shown
    }
  };
  const goBack = () => setStepIdx((i) => Math.max(i - 1, 0));

  const uploadDoc = async (type: string, file: File) => {
    if (!draft) return;
    const fd = new FormData();
    fd.append('type', type);
    fd.append('file', file);
    try {
      await api.post(`/whatsapp/provisioning/${draft.id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await mutate();
      showToast(isAr ? 'تمّ رفع المستند' : 'Document uploaded', 'success');
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? 'فشل الرفع' : 'Upload failed'), 'error');
    }
  };

  const recordConsent = async (consentType: 'dpa' | 'tos' | 'privacy') => {
    if (!draft) return;
    try {
      await api.post(`/whatsapp/provisioning/${draft.id}/consents`, {
        consentType,
        signerName: draft.owner.name || '',
        signerEmail: draft.owner.email || '',
        signerPhone: draft.owner.phone || null,
      });
      await mutate();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? 'فشل تسجيل الموافقة' : 'Consent failed'), 'error');
    }
  };

  const submitFinal = async () => {
    if (!draft) return;
    setSubmitting(true);
    try {
      await saveCurrentStep();
      await api.post(`/whatsapp/provisioning/${draft.id}/submit`);
      await mutate();
      showToast(isAr ? 'تمّ إرسال الطلب — بانتظار مراجعة Corbit' : 'Request submitted — Corbit will review', 'success');
      onClose?.();
    } catch (e: any) {
      showToast(e?.response?.data?.message || (isAr ? 'فشل الإرسال' : 'Submit failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── computed ────────────────────────────────────────────
  const docsByType = useMemo(() => {
    const m = new Map<string, any>();
    (draft?.documents ?? []).forEach((d) => m.set(d.type, d));
    return m;
  }, [draft?.documents]);

  const consentsByType = useMemo(() => {
    const m = new Map<string, any>();
    (draft?.consents ?? []).forEach((c) => m.set(c.type, c));
    return m;
  }, [draft?.consents]);

  const allConsentsSigned =
    consentsByType.has('dpa') && consentsByType.has('tos') && consentsByType.has('privacy');
  const requiredDocsUploaded = docsByType.has('cr') && docsByType.has('owner_id');

  // ── render guards ───────────────────────────────────────
  if (isLoading || !draft) {
    return (
      <Card style={{ padding: 28, textAlign: 'center', color: C.t2 }}>
        {isAr ? 'جاري التحميل...' : 'Loading...'}
      </Card>
    );
  }

  if (!draft.editable && draft.status !== 'draft') {
    return <ProvisioningStatusCard draft={draft} />;
  }

  // ── render ──────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stepper */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {STEPS.map((s, i) => {
            const active = i === stepIdx;
            const done   = i < stepIdx;
            const color  = active ? '#3B82F6' : done ? '#10B981' : C.t3;
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: active || done ? 1 : 0.7 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 14,
                  background: active ? color : done ? color : 'transparent',
                  border: `2px solid ${color}`,
                  color: active || done ? '#fff' : color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12.5, color, fontWeight: active ? 600 : 500 }}>{s.arLabel}</span>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 18, height: 1, background: C.brd, marginInlineStart: 4 }} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step content */}
      <Card style={{ padding: 24 }}>
        {STEPS[stepIdx].key === 'business' && (
          <BusinessStep draft={draft} onChange={updateField} isAr={isAr} C={C} />
        )}
        {STEPS[stepIdx].key === 'owner' && (
          <OwnerStep draft={draft} onChange={updateField} isAr={isAr} C={C} />
        )}
        {STEPS[stepIdx].key === 'number' && (
          <NumberStep draft={draft} onChange={updateField} isAr={isAr} C={C} />
        )}
        {STEPS[stepIdx].key === 'documents' && (
          <DocumentsStep docsByType={docsByType} onUpload={uploadDoc} isAr={isAr} C={C} />
        )}
        {STEPS[stepIdx].key === 'consents' && (
          <ConsentsStep
            consentsByType={consentsByType}
            consentVersions={consentVersions}
            onSign={recordConsent}
            isAr={isAr}
            C={C}
            ownerEmail={draft.owner.email}
          />
        )}
        {STEPS[stepIdx].key === 'review' && (
          <ReviewStep
            draft={draft}
            requiredDocsUploaded={requiredDocsUploaded}
            allConsentsSigned={allConsentsSigned}
            isAr={isAr}
            C={C}
          />
        )}
      </Card>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <Button outline onClick={goBack} disabled={stepIdx === 0 || saving}>
          {isAr ? 'السابق' : 'Back'}
        </Button>
        {stepIdx < STEPS.length - 1 ? (
          <Button primary onClick={goNext} disabled={saving}>
            {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'التالي' : 'Next')}
          </Button>
        ) : (
          <Button
            primary
            onClick={submitFinal}
            disabled={submitting || !requiredDocsUploaded || !allConsentsSigned}
          >
            {submitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'إرسال للمراجعة' : 'Submit for review')}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Step 1: Business
// ─────────────────────────────────────────────────────────────────
function BusinessStep({ draft, onChange, isAr, C }: { draft: Draft; onChange: (path: string, value: any) => void; isAr: boolean; C: any }) {
  return (
    <Section title={isAr ? 'بيانات الشركة (تطابق السجلّ التجاري)' : 'Business identity (must match CR)'} C={C}>
      <Row C={C}>
        <Field label={isAr ? 'الاسم التجاري' : 'Business name'} C={C}>
          <input value={draft.business.name ?? ''} onChange={(e) => onChange('business.name', e.target.value)} style={inputStyle(C)} />
        </Field>
        <Field label={isAr ? 'الاسم بالعربية' : 'Business name (AR)'} C={C}>
          <input value={draft.business.nameAr ?? ''} onChange={(e) => onChange('business.nameAr', e.target.value)} style={inputStyle(C)} />
        </Field>
      </Row>
      <Row C={C}>
        <Field label={isAr ? 'رقم السجل التجاري' : 'CR number'} C={C}>
          <input value={draft.business.crNumber ?? ''} onChange={(e) => onChange('business.crNumber', e.target.value)} style={inputStyle(C)} />
        </Field>
        <Field label={isAr ? 'فئة النشاط' : 'Business category'} C={C}>
          <select value={draft.business.category ?? ''} onChange={(e) => onChange('business.category', e.target.value)} style={inputStyle(C)}>
            <option value="">{isAr ? '-- اختر --' : '-- select --'}</option>
            {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </Row>
      <Field label={isAr ? 'العنوان الكامل' : 'Full address'} C={C}>
        <input value={draft.business.address ?? ''} onChange={(e) => onChange('business.address', e.target.value)} style={inputStyle(C)} />
      </Field>
      <Row C={C}>
        <Field label={isAr ? 'المدينة' : 'City'} C={C}>
          <input value={draft.business.city ?? ''} onChange={(e) => onChange('business.city', e.target.value)} style={inputStyle(C)} />
        </Field>
        <Field label={isAr ? 'الموقع الإلكتروني (اختياري)' : 'Website (optional)'} C={C}>
          <input value={draft.business.website ?? ''} onChange={(e) => onChange('business.website', e.target.value)} style={inputStyle(C)} placeholder="https://..." />
        </Field>
      </Row>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Step 2: Owner
// ─────────────────────────────────────────────────────────────────
function OwnerStep({ draft, onChange, isAr, C }: { draft: Draft; onChange: (path: string, value: any) => void; isAr: boolean; C: any }) {
  return (
    <Section title={isAr ? 'المسؤول / الموقّع المخوّل' : 'Owner / authorized signatory'} C={C}>
      <Field label={isAr ? 'الاسم الكامل (كما في الهوية)' : 'Full name (as on ID)'} C={C}>
        <input value={draft.owner.name ?? ''} onChange={(e) => onChange('owner.name', e.target.value)} style={inputStyle(C)} />
      </Field>
      <Row C={C}>
        <Field label={isAr ? 'نوع الهوية' : 'ID type'} C={C}>
          <select value={draft.owner.idType ?? ''} onChange={(e) => onChange('owner.idType', e.target.value)} style={inputStyle(C)}>
            <option value="">{isAr ? '-- اختر --' : '-- select --'}</option>
            <option value="national_id">{isAr ? 'هوية وطنية' : 'National ID'}</option>
            <option value="iqama">{isAr ? 'إقامة' : 'Iqama'}</option>
            <option value="passport">{isAr ? 'جواز سفر' : 'Passport'}</option>
          </select>
        </Field>
        <Field label={isAr ? 'رقم الهوية' : 'ID number'} C={C}>
          <input value={draft.owner.idNumber ?? ''} onChange={(e) => onChange('owner.idNumber', e.target.value)} style={inputStyle(C)} />
        </Field>
      </Row>
      <Row C={C}>
        <Field label={isAr ? 'البريد الإلكتروني' : 'Email'} C={C}>
          <input type="email" value={draft.owner.email ?? ''} onChange={(e) => onChange('owner.email', e.target.value)} style={inputStyle(C)} />
        </Field>
        <Field label={isAr ? 'رقم الجوال' : 'Phone'} C={C}>
          <input value={draft.owner.phone ?? ''} onChange={(e) => onChange('owner.phone', e.target.value)} style={inputStyle(C)} dir="ltr" placeholder="+966..." />
        </Field>
      </Row>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Step 3: Number
// ─────────────────────────────────────────────────────────────────
function NumberStep({ draft, onChange, isAr, C }: { draft: Draft; onChange: (path: string, value: any) => void; isAr: boolean; C: any }) {
  return (
    <Section title={isAr ? 'رقم WhatsApp المراد ربطه' : 'WhatsApp number to provision'} C={C}>
      <Field label={isAr ? 'الرقم بصيغة دوليّة' : 'Phone number (international format)'} C={C}>
        <input value={draft.number.phoneNumber ?? ''} onChange={(e) => onChange('number.phoneNumber', e.target.value)} style={inputStyle(C)} dir="ltr" placeholder="+9665..." />
      </Field>
      <Row C={C}>
        <Field label={isAr ? 'اسم العرض (يظهر للعملاء)' : 'Display name (shown to customers)'} C={C}>
          <input value={draft.number.displayName ?? ''} onChange={(e) => onChange('number.displayName', e.target.value)} style={inputStyle(C)} />
        </Field>
        <Field label={isAr ? 'اسم العرض بالعربية' : 'Display name (AR)'} C={C}>
          <input value={draft.number.displayNameAr ?? ''} onChange={(e) => onChange('number.displayNameAr', e.target.value)} style={inputStyle(C)} />
        </Field>
      </Row>
      <Field label={isAr ? 'حالة الرقم' : 'Number status'} C={C}>
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="radio" checked={!draft.number.isExistingNumber} onChange={() => onChange('number.isExistingNumber', false)} />
            {isAr ? 'رقم جديد' : 'New number'}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="radio" checked={!!draft.number.isExistingNumber} onChange={() => onChange('number.isExistingNumber', true)} />
            {isAr ? 'رقم موجود حالياً (قيد النقل)' : 'Existing number (migration)'}
          </label>
        </div>
      </Field>
      <Field label={isAr ? 'طريقة التحقّق' : 'Verification method'} C={C}>
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="radio" checked={draft.number.verificationMethod === 'sms'} onChange={() => onChange('number.verificationMethod', 'sms')} />
            SMS
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="radio" checked={draft.number.verificationMethod === 'call'} onChange={() => onChange('number.verificationMethod', 'call')} />
            {isAr ? 'مكالمة' : 'Call'}
          </label>
        </div>
      </Field>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Step 4: Documents
// ─────────────────────────────────────────────────────────────────
function DocumentsStep({
  docsByType,
  onUpload,
  isAr,
  C,
}: {
  docsByType: Map<string, any>;
  onUpload: (type: string, file: File) => Promise<void>;
  isAr: boolean;
  C: any;
}) {
  const docs = [
    { type: 'cr',             label: isAr ? 'السجلّ التجاري (PDF)' : 'Commercial Registration (PDF)', required: true },
    { type: 'owner_id',       label: isAr ? 'هوية المالك / المخوّل' : 'Owner / signatory ID',          required: true },
    { type: 'business_proof', label: isAr ? 'إثبات ملكيّة النشاط (اختياري)' : 'Business proof (optional)', required: false },
    { type: 'additional',     label: isAr ? 'مستند إضافي (اختياري)' : 'Additional document (optional)',  required: false },
  ];

  return (
    <Section title={isAr ? 'الأوراق المطلوبة' : 'Required documents'} C={C}>
      <p style={{ fontSize: 12.5, color: C.t2, marginBottom: 16 }}>
        {isAr ? 'PDF أو JPG/PNG. الحدّ الأقصى 10MB لكل ملف.' : 'PDF or JPG/PNG. Max 10MB per file.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {docs.map((d) => {
          const uploaded = docsByType.get(d.type);
          return (
            <div key={d.type} style={{
              padding: 14, borderRadius: 10, border: `1px solid ${C.brd}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.txt }}>
                  {d.label}
                  {d.required && <span style={{ color: '#ef4444', marginInlineStart: 4 }}>*</span>}
                </div>
                {uploaded && (
                  <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>
                    ✓ {uploaded.fileName}
                  </div>
                )}
              </div>
              <label style={{
                padding: '8px 14px', borderRadius: 8, background: C.inp,
                color: C.txt, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {uploaded ? (isAr ? 'استبدال' : 'Replace') : (isAr ? 'رفع' : 'Upload')}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(d.type, f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Step 5: Consents
// ─────────────────────────────────────────────────────────────────
function ConsentsStep({
  consentsByType,
  consentVersions,
  onSign,
  isAr,
  C,
  ownerEmail,
}: {
  consentsByType: Map<string, any>;
  consentVersions: ConsentVersions;
  onSign: (t: 'dpa' | 'tos' | 'privacy') => Promise<void>;
  isAr: boolean;
  C: any;
  ownerEmail: string | null;
}) {
  const items: Array<{ key: 'dpa'|'tos'|'privacy'; title: string; body: string }> = [
    {
      key: 'dpa',
      title: isAr ? 'اتفاقيّة معالجة البيانات (DPA)' : 'Data Processing Agreement (DPA)',
      body: isAr
        ? 'بالموافقة، تفوّض شركة Corbit بمعالجة بياناتك ضمن خدمات WhatsApp Business، وتقرّ بأنّ 360dialog هي معالج البيانات الأساسي وفقاً لسياسات Meta. تحتفظ بحقّك في سحب الموافقة في أيّ وقت.'
        : 'You authorize Corbit to process your data within WhatsApp Business services, and acknowledge 360dialog as the data processor in accordance with Meta policies. You retain the right to withdraw consent at any time.',
    },
    {
      key: 'tos',
      title: isAr ? 'شروط Meta و WhatsApp Business' : 'Meta + WhatsApp Business Terms',
      body: isAr
        ? 'تقرّ بالالتزام بسياسات Meta التجاريّة وسياسة WhatsApp Business، بما فيها قواعد المحتوى، نافذة 24 ساعة، ومتطلّبات opt-in/opt-out.'
        : 'You agree to comply with Meta Commerce Policy and the WhatsApp Business Policy, including content rules, the 24-hour customer service window, and opt-in/opt-out requirements.',
    },
    {
      key: 'privacy',
      title: isAr ? 'سياسة الخصوصيّة' : 'Privacy Policy',
      body: isAr
        ? 'تقرّ باطّلاعك على سياسة الخصوصيّة وموافقتك على آلية الاحتفاظ بالبيانات لمدّة 24 شهراً ثم الحذف التلقائي.'
        : 'You acknowledge the privacy policy and agree to the 24-month data retention then automatic deletion.',
    },
  ];

  return (
    <Section title={isAr ? 'الموافقات القانونيّة' : 'Legal consents'} C={C}>
      <p style={{ fontSize: 12.5, color: C.t2, marginBottom: 16 }}>
        {isAr
          ? `سيتم تسجيل توقيعك بالاسم والإيميل (${ownerEmail || '—'}) مع طابع زمني وعنوان IP للأرشفة.`
          : `Your signature will be recorded with name + email (${ownerEmail || '—'}), timestamp and IP for audit.`}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item) => {
          const signed = consentsByType.get(item.key);
          return (
            <div key={item.key} style={{
              padding: 16, borderRadius: 10,
              border: `1px solid ${signed ? '#10B98150' : C.brd}`,
              background: signed ? (C.card === '#fff' ? '#F0FDF4' : '#0F1F15') : 'transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.txt, marginBottom: 6 }}>
                    {item.title}
                    {' '}
                    <Badge color={C.t3}>{(consentVersions as any)[item.key]}</Badge>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>
                    {item.body}
                  </div>
                  {signed && (
                    <div style={{ fontSize: 11.5, color: '#10B981', marginTop: 8 }}>
                      ✓ {isAr ? 'موقّع بواسطة' : 'Signed by'} {signed.signerName} · {new Date(signed.signedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                {!signed && (
                  <button
                    onClick={() => onSign(item.key)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, background: '#3B82F6',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
                    }}
                  >
                    {isAr ? 'أوافق' : 'I agree'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Step 6: Review
// ─────────────────────────────────────────────────────────────────
function ReviewStep({
  draft,
  requiredDocsUploaded,
  allConsentsSigned,
  isAr,
  C,
}: {
  draft: Draft;
  requiredDocsUploaded: boolean;
  allConsentsSigned: boolean;
  isAr: boolean;
  C: any;
}) {
  const ready = requiredDocsUploaded && allConsentsSigned;

  return (
    <Section title={isAr ? 'مراجعة وتأكيد' : 'Review & confirm'} C={C}>
      {!ready && (
        <div style={{
          padding: 12, borderRadius: 10, marginBottom: 16,
          background: '#FEF3C7', color: '#92400E', fontSize: 12.5,
        }}>
          {isAr ? '⚠️ لم تكتمل: ' : '⚠️ Incomplete: '}
          {!requiredDocsUploaded && (isAr ? 'الأوراق المطلوبة. ' : 'Required documents. ')}
          {!allConsentsSigned && (isAr ? 'الموافقات القانونيّة.' : 'Legal consents.')}
        </div>
      )}
      <ReviewBlock title={isAr ? 'الشركة' : 'Business'} C={C}>
        <Line k={isAr ? 'الاسم' : 'Name'} v={draft.business.name} C={C} />
        <Line k="CR" v={draft.business.crNumber} C={C} />
        <Line k={isAr ? 'الفئة' : 'Category'} v={draft.business.category} C={C} />
        <Line k={isAr ? 'العنوان' : 'Address'} v={`${draft.business.address ?? '—'}, ${draft.business.city ?? '—'}`} C={C} />
      </ReviewBlock>
      <ReviewBlock title={isAr ? 'المسؤول' : 'Owner'} C={C}>
        <Line k={isAr ? 'الاسم' : 'Name'} v={draft.owner.name} C={C} />
        <Line k={isAr ? 'الهوية' : 'ID'} v={`${draft.owner.idType ?? ''} ${draft.owner.idNumber ?? ''}`} C={C} />
        <Line k={isAr ? 'البريد' : 'Email'} v={draft.owner.email} C={C} />
        <Line k={isAr ? 'الجوال' : 'Phone'} v={draft.owner.phone} C={C} />
      </ReviewBlock>
      <ReviewBlock title={isAr ? 'الرقم' : 'Number'} C={C}>
        <Line k={isAr ? 'الرقم' : 'Phone'} v={draft.number.phoneNumber} C={C} />
        <Line k={isAr ? 'اسم العرض' : 'Display'} v={draft.number.displayName} C={C} />
        <Line k={isAr ? 'الحالة' : 'Status'} v={draft.number.isExistingNumber ? (isAr ? 'موجود' : 'Existing') : (isAr ? 'جديد' : 'New')} C={C} />
      </ReviewBlock>
      <ReviewBlock title={isAr ? 'الأوراق' : 'Documents'} C={C}>
        {draft.documents.length === 0
          ? <span style={{ color: C.t3, fontSize: 12 }}>{isAr ? 'لم تُرفع أوراق بعد' : 'No documents uploaded'}</span>
          : draft.documents.map((d) => <Line key={d.id} k={d.type} v={d.fileName} C={C} />)}
      </ReviewBlock>
      <ReviewBlock title={isAr ? 'الموافقات' : 'Consents'} C={C}>
        {draft.consents.length === 0
          ? <span style={{ color: C.t3, fontSize: 12 }}>{isAr ? 'لم تُوقّع' : 'Not signed'}</span>
          : draft.consents.map((c) => <Line key={c.type} k={c.type.toUpperCase()} v={`${c.signerName} (${c.documentVersion})`} C={C} />)}
      </ReviewBlock>
    </Section>
  );
}

// Status card when the draft is no longer editable (submitted, in review, active, rejected).
function ProvisioningStatusCard({ draft }: { draft: Draft }) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  const map: Record<string, { color: string; ar: string; en: string }> = {
    submitted:      { color: '#3B82F6', ar: 'تم الإرسال — بانتظار مراجعة Corbit', en: 'Submitted — awaiting Corbit review' },
    pending_review: { color: '#3B82F6', ar: 'قيد المراجعة من Corbit',                en: 'Under Corbit review' },
    provisioning:   { color: '#F59E0B', ar: 'قيد التفعيل عبر 360dialog',             en: 'Provisioning via 360dialog' },
    active:         { color: '#10B981', ar: 'مفعّل ✓',                                en: 'Active ✓' },
    rejected:       { color: '#EF4444', ar: 'مرفوض — راجع السبب',                    en: 'Rejected — see reason' },
    cancelled:      { color: '#9CA3AF', ar: 'ملغى',                                    en: 'Cancelled' },
  };
  const cur = map[draft.status] ?? { color: C.t3, ar: draft.status, en: draft.status };

  return (
    <Card style={{ padding: 28, textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: cur.color, marginBottom: 8 }}>
        {isAr ? cur.ar : cur.en}
      </h3>
      {draft.rejectionReason && (
        <div style={{
          marginTop: 12, padding: 12, borderRadius: 8,
          background: '#FEE2E2', color: '#991B1B', fontSize: 13, textAlign: 'start',
        }}>
          {isAr ? 'سبب الرفض: ' : 'Reason: '} {draft.rejectionReason}
        </div>
      )}
      <div style={{ fontSize: 12, color: C.t3, marginTop: 16 }}>
        {isAr ? 'سنرسل لك إشعاراً عبر واتساب فور التحديث.' : 'We will notify you via WhatsApp when status changes.'}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// Generic primitives
// ─────────────────────────────────────────────────────────────────
function Section({ title, children, C }: { title: string; children: React.ReactNode; C: any }) {
  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.txt, marginBottom: 16 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}
function Row({ children, C }: { children: React.ReactNode; C: any }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>;
}
function Field({ label, children, C }: { label: string; children: React.ReactNode; C: any }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: 12.5, color: C.t2, fontWeight: 500, marginBottom: 6, display: 'block' }}>{label}</span>
      {children}
    </label>
  );
}
function inputStyle(C: any): React.CSSProperties {
  return {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
    fontSize: 13, outline: 'none',
  };
}
function ReviewBlock({ title, children, C }: { title: string; children: React.ReactNode; C: any }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.txt, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}
function Line({ k, v, C }: { k: string; v: any; C: any }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12.5 }}>
      <span style={{ color: C.t3, minWidth: 90 }}>{k}:</span>
      <span style={{ color: C.txt }}>{v ?? '—'}</span>
    </div>
  );
}
