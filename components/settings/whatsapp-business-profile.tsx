"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, Button } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { COLORS } from "@/lib/constants/colors";
import { FONT_FAMILY } from "@/lib/constants/font";
import api from "@/lib/api/client";

/**
 * Edit the WABA's display picture, about text and business info from
 * the platform instead of routing the tenant through 360dialog's Hub.
 *
 * The photo preview is a circle on purpose: WhatsApp displays profile
 * pictures as circles in chats, so a rectangular preview would let the
 * operator upload a logo whose edges later get cropped (exactly the
 * Yasref bug that motivated building this page).
 */

type Profile = {
  about: string;
  description: string;
  address: string;
  email: string;
  vertical: string;
  websites: string[];
};

const VERTICALS = [
  { value: "OTHER", labelAr: "أخرى", labelEn: "Other" },
  { value: "AUTO", labelAr: "السيارات", labelEn: "Auto" },
  { value: "BEAUTY", labelAr: "الجمال والعناية", labelEn: "Beauty & Personal Care" },
  { value: "APPAREL", labelAr: "الملابس", labelEn: "Apparel" },
  { value: "EDU", labelAr: "التعليم", labelEn: "Education" },
  { value: "ENTERTAIN", labelAr: "الترفيه", labelEn: "Entertainment" },
  { value: "EVENT_PLAN", labelAr: "تنظيم الفعاليات", labelEn: "Event Planning" },
  { value: "FINANCE", labelAr: "التمويل والبنوك", labelEn: "Finance & Banking" },
  { value: "GROCERY", labelAr: "البقالة والمواد الغذائية", labelEn: "Grocery" },
  { value: "GOVT", labelAr: "حكومي", labelEn: "Government" },
  { value: "HOTEL", labelAr: "الفنادق والإقامة", labelEn: "Hotel" },
  { value: "HEALTH", labelAr: "الصحّة", labelEn: "Medical & Health" },
  { value: "NONPROFIT", labelAr: "منظّمة غير ربحيّة", labelEn: "Non-profit" },
  { value: "PROF_SERVICES", labelAr: "خدمات احترافيّة", labelEn: "Professional Services" },
  { value: "RETAIL", labelAr: "تجزئة", labelEn: "Retail" },
  { value: "TRAVEL", labelAr: "سفر وسياحة", labelEn: "Travel" },
  { value: "RESTAURANT", labelAr: "مطعم", labelEn: "Restaurant" },
  { value: "NOT_A_BIZ", labelAr: "ليست شركة", labelEn: "Not a business" },
];

export function WhatsAppBusinessProfile() {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    about: "",
    description: "",
    address: "",
    email: "",
    vertical: "",
    websites: [],
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch the current profile on mount. A failure here usually means
  // the WhatsApp number isn't connected yet (kill switch fires inside
  // resolveApiKey), so we surface that state explicitly instead of
  // showing an empty form the operator can fill but never save.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/settings/whatsapp/profile');
        if (cancelled) return;
        const d = res.data?.data ?? res.data ?? {};
        setProfile({
          about: d.about ?? "",
          description: d.description ?? "",
          address: d.address ?? "",
          email: d.email ?? "",
          vertical: d.vertical ?? "",
          websites: Array.isArray(d.websites) ? d.websites : [],
        });
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.response?.data?.message || (isAr ? "تعذّر تحميل البروفايل" : "Failed to load profile"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAr]);

  const save = async () => {
    setSaving(true);
    try {
      // Drop empty websites entries — sending [] as a sole field would
      // still trigger the PATCH for nothing, but a stray "" inside the
      // array would 422 at validation.
      const websites = profile.websites.filter((w) => !!w && w.trim().length > 0);
      await api.patch('/settings/whatsapp/profile', { ...profile, websites });
      showToast(isAr ? "تمّ حفظ بيانات الشركة" : "Profile saved");
    } catch (err: any) {
      showToast(err?.response?.data?.message || (isAr ? "فشل الحفظ" : "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ textAlign: "center", color: C.t2, fontSize: 13 }}>
          <Icon name="timer" size={20} />
          <div style={{ marginTop: 8 }}>{isAr ? "جاري التحميل..." : "Loading..."}</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: 24 }}>
        <div style={{ textAlign: "center", color: COLORS.err, fontSize: 13 }}>{error}</div>
        <div style={{ textAlign: "center", color: C.t3, fontSize: 11, marginTop: 6 }}>
          {isAr ? "اربط رقم واتساب أولاً من القسم أعلاه" : "Connect a WhatsApp number first from the section above"}
        </div>
      </Card>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${C.brd}`,
    background: C.inp ?? C.bg,
    color: C.txt,
    fontSize: 13,
    fontFamily: FONT_FAMILY,
    outline: "none",
  };

  return (
    <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.txt }}>
          {isAr ? "بروفايل واتساب الأعمال" : "WhatsApp Business Profile"}
        </div>
        <div style={{ fontSize: 12, color: C.t2, marginTop: 4, lineHeight: 1.7 }}>
          {isAr
            ? "هذه البيانات تظهر للعملاء عند فتح صفحة شركتك في واتساب. الصورة تُعرض دائرةً، فضع شعارك في النصف."
            : "These fields appear to your customers when they tap your business page in WhatsApp. The photo is shown as a circle — keep your logo centered."}
        </div>
      </div>

      {/* Photo section removed: this WABA tier on 360dialog Cloud V2 does
          not expose the profile picture via API — /configs/profile/photo
          returns 404 and the business/profile response does not include
          profile_picture_url either. The image is visible to end users
          on WhatsApp, just not retrievable on our side. Showing an empty
          circle would be misleading. */}

      <div style={{ height: 1, background: C.brd }} />

      {/* About — short tagline, 139 char hard cap */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.txt }}>
            {isAr ? "النبذة (About)" : "About"}
          </label>
          <span style={{ fontSize: 11, color: profile.about.length > 139 ? COLORS.err : C.t3 }}>
            {profile.about.length} / 139
          </span>
        </div>
        <input
          type="text"
          value={profile.about}
          maxLength={139}
          onChange={(e) => setProfile({ ...profile, about: e.target.value })}
          placeholder={isAr ? "مثال: نقدّم أفضل خدمات تكرير البترول" : "Example: We provide the best refining services"}
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
          {isAr ? "تظهر تحت اسم الشركة في صفحة البروفايل" : "Shown under your business name on the profile page"}
        </div>
      </div>

      {/* Description — longer paragraph */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 6, display: "block" }}>
          {isAr ? "وصف الشركة (Description)" : "Description"}
        </label>
        <textarea
          value={profile.description}
          maxLength={512}
          rows={3}
          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
          placeholder={isAr ? "وصف تفصيلي لنشاطك التجاري" : "Detailed description of your business"}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Email */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 6, display: "block" }}>
            {isAr ? "البريد الإلكتروني" : "Email"}
          </label>
          <input
            type="email"
            value={profile.email}
            maxLength={128}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="info@company.com"
            style={{ ...inputStyle, direction: "ltr" }}
          />
        </div>

        {/* Vertical */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 6, display: "block" }}>
            {isAr ? "قطاع النشاط" : "Industry"}
          </label>
          <select
            value={profile.vertical}
            onChange={(e) => setProfile({ ...profile, vertical: e.target.value })}
            style={inputStyle}
          >
            <option value="">{isAr ? "اختر..." : "Select..."}</option>
            {VERTICALS.map((v) => (
              <option key={v.value} value={v.value}>{isAr ? v.labelAr : v.labelEn}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Address */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 6, display: "block" }}>
          {isAr ? "العنوان" : "Address"}
        </label>
        <input
          type="text"
          value={profile.address}
          maxLength={256}
          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
          placeholder={isAr ? "المدينة، الحيّ، الشارع" : "City, district, street"}
          style={inputStyle}
        />
      </div>

      {/* Websites — up to 2 per Meta */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.txt, marginBottom: 6, display: "block" }}>
          {isAr ? "روابط الموقع (حتى 2)" : "Websites (up to 2)"}
        </label>
        {[0, 1].map((i) => (
          <input
            key={i}
            type="url"
            value={profile.websites[i] ?? ""}
            maxLength={256}
            onChange={(e) => {
              const next = [...profile.websites];
              while (next.length <= i) next.push("");
              next[i] = e.target.value;
              setProfile({ ...profile, websites: next });
            }}
            placeholder="https://example.com"
            style={{ ...inputStyle, direction: "ltr", marginBottom: i === 0 ? 8 : 0 }}
          />
        ))}
      </div>

      {/* Save button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button primary onClick={save} disabled={saving}>
          <Icon name="check" size={14} />
          {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ البيانات" : "Save")}
        </Button>
      </div>
    </Card>
  );
}
