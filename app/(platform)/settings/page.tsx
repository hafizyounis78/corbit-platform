"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Card, Button, TabBar, Badge, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { ProgressBar } from "@/components/charts/progress-bar";
import { useSettings } from "@/lib/api/hooks";
import { WhatsAppConnect } from "@/components/settings/whatsapp-connect";
import api from "@/lib/api/client";

/* ─── helpers ─── */

function SectionTitle({ children }: { children: string }) {
  return <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>{children}</h3>;
}

function FieldLabel({ children, C }: { children: string; C?: any }) {
  return <label style={{ fontSize: 11.5, color: C?.t2, display: "block", marginBottom: 4 }}>{children}</label>;
}

function Input({ value, onChange, placeholder, type, C }: { value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; C: any }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      type={type ?? "text"}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt, outline: "none", boxSizing: "border-box" }}
    />
  );
}

function Select({ value, onChange, options, C }: { value: string; onChange?: (v: string) => void; options: string[]; C: any }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ width: "100%", padding: "9px 12px", borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt, outline: "none", cursor: "pointer", boxSizing: "border-box" }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function ToggleRow({ label, on, onToggle, desc, icon, C }: { label: string; on: boolean; onToggle: () => void; desc?: string; icon?: string; C: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: C.inp, marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
          {desc && <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

function AutoMessageBlock({
  C, ar, icon, label, desc, placeholder, on, onToggle, value, onChangeText,
}: {
  C: any; ar: boolean; icon: string; label: string; desc: string; placeholder: string;
  on: boolean; onToggle: () => void; value: string; onChangeText: (v: string) => void;
}) {
  return (
    <div style={{ padding: "14px 14px 12px", borderRadius: 12, background: C.inp, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: on ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{desc}</div>
          </div>
        </div>
        <Toggle on={on} onToggle={onToggle} />
      </div>
      {on && (
        <textarea
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={placeholder}
          dir={ar ? "rtl" : "ltr"}
          style={{
            width: "100%", minHeight: 64, padding: "9px 12px", borderRadius: 10,
            background: C.bg ?? "#fff", border: `1px solid ${C.brd}`,
            fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt,
            outline: "none", resize: "vertical", boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}

/* ─── page ─── */

export default function SettingsPage() {
  const { colors: C, isDark: dk, toggleTheme } = useTheme();
  const { t, isAr, lang, toggleLang } = useLocale();
  const { showToast } = useToast();
  const isMob = useIsMobile();
  const ar = isAr;

  const [tab, setTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings from API per section
  const { data: generalData, isLoading: loadingGeneral, mutate: mutateGeneral } = useSettings('general');
  const { data: notifData, isLoading: loadingNotif, mutate: mutateNotif } = useSettings('notifications');
  const { data: securityData, isLoading: loadingSecurity, mutate: mutateSecurity } = useSettings('security');
  const { data: channelsData, isLoading: loadingChannels, mutate: mutateChannels } = useSettings('conversations');
  const { data: apiKeysData, isLoading: loadingApi, mutate: mutateApi } = useSettings('api-keys');
  const { data: whatsappData, mutate: mutateWhatsapp } = useSettings('whatsapp');
  const { data: webhooksData, mutate: mutateWebhooks } = useSettings('webhooks');
  const { data: autoMsgsData, mutate: mutateAutoMsgs } = useSettings('auto-messages');
  const { data: bizHoursData, mutate: mutateBizHours } = useSettings('business-hours');
  const whatsappNumbers: any[] = (whatsappData?.numbers as any[]) ?? [];
  const webhooks: any[] = Array.isArray(webhooksData) ? (webhooksData as any[]) : ((webhooksData as any)?.data ?? []);

  // Team member counts for the Team tab
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  useEffect(() => {
    api.get('/teams/members').then((res: any) => {
      const list = res?.data?.data ?? res?.data ?? [];
      setTeamMembers(Array.isArray(list) ? list : []);
    }).catch(() => setTeamMembers([]));
  }, []);
  const roleCounts = {
    admin: teamMembers.filter((m: any) => m.role === 'admin').length,
    supervisor: teamMembers.filter((m: any) => m.role === 'supervisor').length,
    agent: teamMembers.filter((m: any) => m.role === 'agent').length,
  };

  /* general settings state */
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [timezone, setTimezone] = useState("Asia/Riyadh (GMT+3)");
  const [currency, setCurrency] = useState("SAR");
  const [description, setDescription] = useState("");

  // Populate from API when data arrives (backend returns: name, email, phone, website, timezone, currency, description)
  useEffect(() => {
    if (generalData) {
      const g: any = generalData;
      if (g.name ?? g.companyName) setCompanyName(g.name ?? g.companyName);
      if (g.email ?? g.companyEmail) setCompanyEmail(g.email ?? g.companyEmail);
      if (g.phone ?? g.companyPhone) setCompanyPhone(g.phone ?? g.companyPhone);
      if (g.website ?? g.companyWebsite) setCompanyWebsite(g.website ?? g.companyWebsite);
      if (g.timezone) setTimezone(g.timezone);
      if (g.currency) setCurrency(g.currency);
      if (g.description) setDescription(g.description);
    }
  }, [generalData]);

  const markChanged = () => { if (!hasChanges) setHasChanges(true); };

  /* toggle states */
  const [welcomeMsg, setWelcomeMsg] = useState(true);
  const [awayMsg, setAwayMsg] = useState(true);
  const [queueMsg, setQueueMsg] = useState(false);
  const [welcomeText, setWelcomeText] = useState("");
  const [awayText, setAwayText] = useState("");
  const [queueText, setQueueText] = useState("");
  const [notifNew, setNotifNew] = useState(true);
  const [notifMsg, setNotifMsg] = useState(true);
  const [notifAssign, setNotifAssign] = useState(true);
  const [notifEsc, setNotifEsc] = useState(false);
  const [notifSla, setNotifSla] = useState(true);
  const [notifBal, setNotifBal] = useState(true);
  const [pushBrowser, setPushBrowser] = useState(true);
  const [pushEmail, setPushEmail] = useState(true);
  const [pushSound, setPushSound] = useState(true);
  const [pushMobile, setPushMobile] = useState(false);
  const [quietHours, setQuietHours] = useState(false);
  const [autoReports, setAutoReports] = useState(true);
  const [twoFA, setTwoFA] = useState(true);
  const [sso, setSSO] = useState(false);
  const [ipWhite, setIpWhite] = useState(false);
  const [sessTimeout, setSessTimeout] = useState(true);
  const [smsEnable, setSmsEnable] = useState(true);
  const [channelMode, setChannelMode] = useState("wa_sms");
  const [autoClose, setAutoClose] = useState(true);
  const [autoAssign, setAutoAssign] = useState(true);
  const [custTakeover, setCustTakeover] = useState(false);
  const [postSurvey, setPostSurvey] = useState(true);

  // Populate notification toggles from API
  useEffect(() => {
    if (notifData) {
      if (notifData.newConversation !== undefined) setNotifNew(notifData.newConversation);
      if (notifData.newMessage !== undefined) setNotifMsg(notifData.newMessage);
      if (notifData.assignment !== undefined) setNotifAssign(notifData.assignment);
      if (notifData.escalation !== undefined) setNotifEsc(notifData.escalation);
      if (notifData.slaWarning !== undefined) setNotifSla(notifData.slaWarning);
      if (notifData.lowBalance !== undefined) setNotifBal(notifData.lowBalance);
      if (notifData.browserPush !== undefined) setPushBrowser(notifData.browserPush);
      if (notifData.emailNotif !== undefined) setPushEmail(notifData.emailNotif);
      if (notifData.sound !== undefined) setPushSound(notifData.sound);
      if (notifData.mobilePush !== undefined) setPushMobile(notifData.mobilePush);
      if (notifData.quietHours !== undefined) setQuietHours(notifData.quietHours);
      if (notifData.autoReports !== undefined) setAutoReports(notifData.autoReports);
    }
  }, [notifData]);

  // Populate security toggles from API
  useEffect(() => {
    if (securityData) {
      if (securityData.twoFA !== undefined) setTwoFA(securityData.twoFA);
      if (securityData.sso !== undefined) setSSO(securityData.sso);
      if (securityData.ipWhitelist !== undefined) setIpWhite(securityData.ipWhitelist);
      if (securityData.sessionTimeout !== undefined) setSessTimeout(securityData.sessionTimeout);
    }
  }, [securityData]);

  // Populate auto-messages (welcome / away / queue) from API.
  // Backend returns array: [{type, text, text_ar, is_enabled}].
  useEffect(() => {
    const list = Array.isArray(autoMsgsData) ? autoMsgsData : (autoMsgsData as any)?.data;
    if (!Array.isArray(list)) return;
    const byType: Record<string, any> = {};
    list.forEach((m: any) => { if (m?.type) byType[m.type] = m; });
    if (byType.welcome) {
      setWelcomeMsg(!!byType.welcome.is_enabled);
      setWelcomeText(byType.welcome.text_ar ?? byType.welcome.text ?? "");
    }
    if (byType.away) {
      setAwayMsg(!!byType.away.is_enabled);
      setAwayText(byType.away.text_ar ?? byType.away.text ?? "");
    }
    if (byType.queue) {
      setQueueMsg(!!byType.queue.is_enabled);
      setQueueText(byType.queue.text_ar ?? byType.queue.text ?? "");
    }
  }, [autoMsgsData]);

  /* business hours state. Day code mapping is by INDEX (0=sun…6=sat) so
     we don't depend on the localized label. */
  const DAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const [bizHours, setBizHours] = useState([
    { day: ar ? "الأحد" : "Sunday", on: true, from: "09:00", to: "17:00" },
    { day: ar ? "الاثنين" : "Monday", on: true, from: "09:00", to: "17:00" },
    { day: ar ? "الثلاثاء" : "Tuesday", on: true, from: "09:00", to: "17:00" },
    { day: ar ? "الأربعاء" : "Wednesday", on: true, from: "09:00", to: "17:00" },
    { day: ar ? "الخميس" : "Thursday", on: true, from: "09:00", to: "14:00" },
    { day: ar ? "الجمعة" : "Friday", on: false, from: "09:00", to: "17:00" },
    { day: ar ? "السبت" : "Saturday", on: false, from: "09:00", to: "17:00" },
  ]);

  // Populate business hours from API. Backend returns array of
  // {day, is_open, open_time, close_time} where day is the 3-letter code.
  // Times come back as HH:MM:SS — trim to HH:MM for <input type="time">.
  useEffect(() => {
    const list = Array.isArray(bizHoursData) ? bizHoursData : (bizHoursData as any)?.data;
    if (!Array.isArray(list)) return;
    const byDay: Record<string, any> = {};
    list.forEach((h: any) => { if (h?.day) byDay[h.day] = h; });

    setBizHours((prev) =>
      prev.map((bh, i) => {
        const fromDb = byDay[DAY_CODES[i]];
        if (!fromDb) return bh;
        return {
          day: bh.day,
          on: !!fromDb.is_open,
          from: String(fromDb.open_time ?? "09:00").slice(0, 5),
          to: String(fromDb.close_time ?? "17:00").slice(0, 5),
        };
      })
    );
    // DAY_CODES is a stable literal; no need to depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizHoursData]);

  const tabs = [
    { key: "general", label: ar ? "عام" : "General" },
    { key: "notifications", label: ar ? "الإشعارات" : "Notifications" },
    { key: "security", label: ar ? "الأمان" : "Security" },
    { key: "channels", label: ar ? "القنوات" : "Channels" },
    { key: "whatsapp", label: ar ? "ربط الواتساب" : "WhatsApp" },
    { key: "team", label: ar ? "الفريق" : "Team" },
    { key: "api", label: ar ? "واجهة API" : "API" },
  ];

  const grid2Style = { display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 14 } as const;

  const handleSave = async () => {
    setSaving(true);
    try {
      const section = tab === "general" ? "general" :
                      tab === "notifications" ? "notifications" :
                      tab === "security" ? "security" :
                      tab === "channels" ? "conversations" :
                      tab === "team" ? "conversations" :
                      tab === "api" ? "api-keys" : "general";

      const payload: Record<string, any> = {};

      if (tab === "general") {
        // Profile fields go to /settings/general. Welcome / Away / Queue
        // texts are persisted separately to /settings/auto-messages because
        // the backend updateGeneral fillable drops anything outside the
        // organization profile fields.
        Object.assign(payload, { name: companyName, email: companyEmail, phone: companyPhone, website: companyWebsite, timezone, currency, language: lang, description });

        await api.patch(`/settings/auto-messages`, {
          messages: [
            { type: "welcome", text_ar: welcomeText, text: welcomeText, is_enabled: welcomeMsg },
            { type: "away",    text_ar: awayText,    text: awayText,    is_enabled: awayMsg },
            { type: "queue",   text_ar: queueText,   text: queueText,   is_enabled: queueMsg },
          ],
        });
        mutateAutoMsgs();

        // Business hours go to /settings/business-hours. Map our state by
        // index → 3-letter day_of_week code the backend expects.
        await api.patch(`/settings/business-hours`, {
          hours: bizHours.map((bh, i) => ({
            day: DAY_CODES[i],
            is_open: bh.on,
            open_time: bh.from,
            close_time: bh.to,
          })),
        });
        mutateBizHours();
      } else if (tab === "notifications") {
        Object.assign(payload, { preferences: [
          { key: "newConversation", enabled: notifNew },
          { key: "newMessage", enabled: notifMsg },
          { key: "assignment", enabled: notifAssign },
          { key: "escalation", enabled: notifEsc },
          { key: "slaWarning", enabled: notifSla },
          { key: "lowBalance", enabled: notifBal },
          { key: "browserPush", enabled: pushBrowser },
          { key: "emailNotif", enabled: pushEmail },
          { key: "sound", enabled: pushSound },
          { key: "mobilePush", enabled: pushMobile },
          { key: "quietHours", enabled: quietHours },
          { key: "autoReports", enabled: autoReports },
        ] });
      } else if (tab === "security") {
        Object.assign(payload, { twoFA, sso, ipWhitelist: ipWhite, sessionTimeout: sessTimeout });
      } else if (tab === "channels") {
        Object.assign(payload, { settings: { smsEnable, channelMode } });
      } else if (tab === "team") {
        Object.assign(payload, { settings: { autoClose, autoAssign, custTakeover, postSurvey } });
      }

      await api.patch(`/settings/${section}`, payload);
      setSaving(false);
      setHasChanges(false);
      showToast(ar ? "تم حفظ الإعدادات بنجاح ✓" : "Settings saved successfully ✓");
      // Refresh the relevant section
      if (tab === "general") mutateGeneral();
      else if (tab === "notifications") mutateNotif();
      else if (tab === "security") mutateSecurity();
      else if (tab === "channels" || tab === "team") mutateChannels();
      else if (tab === "api") mutateApi();
    } catch (e: any) {
      setSaving(false);
      const msg = e?.response?.data?.message || e?.message || "";
      showToast(ar ? `فشل حفظ الإعدادات: ${msg}` : `Failed to save settings: ${msg}`, "error");
    }
  };

  const isLoading = (tab === "general" && loadingGeneral) ||
                    (tab === "notifications" && loadingNotif) ||
                    (tab === "security" && loadingSecurity) ||
                    (tab === "channels" && loadingChannels) ||
                    (tab === "api" && loadingApi);

  if (isLoading) {
    return (
      <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <p style={{ fontSize: 14, color: C.t2 }}>{ar ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 24px" }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{ar ? "الإعدادات" : "Settings"}</h2>
          <p style={{ fontSize: 13, color: C.t2, margin: 0 }}>{ar ? "إدارة إعدادات المنصة والتفضيلات" : "Manage platform settings & preferences"}</p>
        </div>
        <Button primary onClick={handleSave} style={{ opacity: saving ? 0.6 : 1, pointerEvents: saving ? "none" : "auto" }}>
          <Icon name={saving ? "timer" : "check"} size={14} />
          {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {/* ═══════════ GENERAL TAB ═══════════ */}
      {tab === "general" && (
        <div style={grid2Style}>
          {/* left col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Company Info */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "معلومات الشركة" : "Company Info"}</SectionTitle>

              {/* logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 700 }}>C</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{ar ? "شعار الشركة" : "Company Logo"}</div>
                  <Button small outline onClick={() => showToast("✓")}>{ar ? "تغيير" : "Change"}</Button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div><FieldLabel C={C}>{ar ? "اسم الشركة" : "Company Name"}</FieldLabel><Input value={companyName} onChange={(v) => { setCompanyName(v); markChanged(); }} C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "البريد الإلكتروني" : "Email"}</FieldLabel><Input value={companyEmail} onChange={(v) => { setCompanyEmail(v); markChanged(); }} type="email" C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "الهاتف" : "Phone"}</FieldLabel><Input value={companyPhone} onChange={(v) => { setCompanyPhone(v); markChanged(); }} C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "الموقع" : "Website"}</FieldLabel><Input value={companyWebsite} onChange={(v) => { setCompanyWebsite(v); markChanged(); }} C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "المنطقة الزمنية" : "Timezone"}</FieldLabel><Select value={timezone} onChange={(v) => { setTimezone(v); markChanged(); }} options={["Asia/Riyadh (GMT+3)", "Asia/Dubai (GMT+4)", "UTC"]} C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "العملة" : "Currency"}</FieldLabel><Select value={currency} onChange={(v) => { setCurrency(v); markChanged(); }} options={["SAR", "USD", "AED", "EUR"]} C={C} /></div>
              </div>
              <div style={{ marginTop: 12 }}>
                <FieldLabel C={C}>{ar ? "الوصف" : "Description"}</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markChanged(); }}
                  style={{ width: "100%", minHeight: 72, padding: "9px 12px", borderRadius: 10, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </Card>

            {/* Auto Messages */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "الرسائل التلقائية" : "Auto Messages"}</SectionTitle>
              <AutoMessageBlock
                C={C}
                ar={ar}
                icon="👋"
                label={ar ? "رسالة الترحيب" : "Welcome Message"}
                desc={ar ? "تُرسل تلقائيّاً لمّا يبدأ العميل محادثة جديدة" : "Auto-send when a new conversation starts"}
                placeholder={ar ? "مرحباً بك في متجرنا! كيف نقدر نخدمك؟" : "Welcome to our store! How can we help?"}
                on={welcomeMsg}
                onToggle={() => { setWelcomeMsg(!welcomeMsg); markChanged(); }}
                value={welcomeText}
                onChangeText={(v) => { setWelcomeText(v); markChanged(); }}
              />
              <AutoMessageBlock
                C={C}
                ar={ar}
                icon="🌙"
                label={ar ? "رسالة الغياب" : "Away Message"}
                desc={ar ? "تُرسل تلقائيّاً خارج ساعات العمل المضبوطة" : "Auto-send outside configured business hours"}
                placeholder={ar ? "نعتذر، نحن خارج الدوام الآن. سنرد عليك في أقرب وقت." : "We're currently away. We'll get back to you soon."}
                on={awayMsg}
                onToggle={() => { setAwayMsg(!awayMsg); markChanged(); }}
                value={awayText}
                onChangeText={(v) => { setAwayText(v); markChanged(); }}
              />
              <AutoMessageBlock
                C={C}
                ar={ar}
                icon="⏳"
                label={ar ? "رسالة قائمة الانتظار" : "Queue Message"}
                desc={ar ? "تُرسل عند وضع العميل في طابور الانتظار" : "Sent when the customer is placed in queue"}
                placeholder={ar ? "شكراً لتواصلك. أنت في قائمة الانتظار وسيتم الردّ عليك قريباً." : "Thanks for reaching out. You're in queue, we'll be with you shortly."}
                on={queueMsg}
                onToggle={() => { setQueueMsg(!queueMsg); markChanged(); }}
                value={queueText}
                onChangeText={(v) => { setQueueText(v); markChanged(); }}
              />
            </Card>
          </div>

          {/* right col */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Appearance */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "المظهر" : "Appearance"}</SectionTitle>

              {/* Theme toggle */}
              <div style={{ marginBottom: 14 }}>
                <FieldLabel C={C}>{ar ? "السمة" : "Theme"}</FieldLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                  {([["light", "☀️", ar ? "فاتح" : "Light"], ["dark", "🌙", ar ? "داكن" : "Dark"]] as const).map(([key, icon, label]) => (
                    <div
                      key={key}
                      onClick={() => { if ((key === "dark") !== dk) toggleTheme(); }}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: (key === "dark") === dk ? `${C.pri}12` : C.inp,
                        border: (key === "dark") === dk ? `2px solid ${C.pri}` : "2px solid transparent",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                      <div style={{ fontSize: 12, fontWeight: (key === "dark") === dk ? 700 : 400 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language toggle */}
              <div style={{ marginBottom: 18 }}>
                <FieldLabel C={C}>{ar ? "اللغة" : "Language"}</FieldLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                  {([["ar", "🇸🇦", "العربية"], ["en", "🇺🇸", "English"]] as const).map(([key, flag, label]) => (
                    <div
                      key={key}
                      onClick={() => { if ((key === "ar") !== ar) toggleLang(); }}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        background: (key === "ar") === ar ? `${C.pri}12` : C.inp,
                        border: (key === "ar") === ar ? `2px solid ${C.pri}` : "2px solid transparent",
                        cursor: "pointer",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{flag}</span>
                      <span style={{ fontSize: 12, fontWeight: (key === "ar") === ar ? 700 : 400 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Hours */}
              <FieldLabel C={C}>{ar ? "ساعات العمل" : "Business Hours"}</FieldLabel>
              <div style={{ marginTop: 6 }}>
                {bizHours.map((bh, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 44px 1fr 20px 1fr", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, opacity: bh.on ? 1 : 0.5 }}>{bh.day}</span>
                    <Toggle on={bh.on} onToggle={() => { const u = [...bizHours]; u[i] = { ...u[i], on: !u[i].on }; setBizHours(u); markChanged(); }} />
                    <input
                      type="time"
                      value={bh.from}
                      onChange={(e) => { const u = [...bizHours]; u[i] = { ...u[i], from: e.target.value }; setBizHours(u); markChanged(); }}
                      disabled={!bh.on}
                      style={{ padding: "5px 8px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, fontFamily: FONT_FAMILY, fontSize: 12, color: C.txt, opacity: bh.on ? 1 : 0.4 }}
                    />
                    <span style={{ textAlign: "center", fontSize: 11, color: C.t2 }}>-</span>
                    <input
                      type="time"
                      value={bh.to}
                      onChange={(e) => { const u = [...bizHours]; u[i] = { ...u[i], to: e.target.value }; setBizHours(u); markChanged(); }}
                      disabled={!bh.on}
                      style={{ padding: "5px 8px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, fontFamily: FONT_FAMILY, fontSize: 12, color: C.txt, opacity: bh.on ? 1 : 0.4 }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════ NOTIFICATIONS TAB ═══════════ */}
      {tab === "notifications" && (
        <div style={grid2Style}>
          {/* Platform Notifications */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "إشعارات المنصة" : "Platform Notifications"}</SectionTitle>
            <ToggleRow C={C} label={ar ? "محادثة جديدة" : "New Conversation"} desc={ar ? "عند وصول محادثة جديدة" : "When a new conversation arrives"} on={notifNew} onToggle={() => setNotifNew(!notifNew)} icon="💬" />
            <ToggleRow C={C} label={ar ? "رسالة جديدة" : "New Message"} desc={ar ? "عند وصول رسالة في محادثة حالية" : "When a message arrives in existing conversation"} on={notifMsg} onToggle={() => setNotifMsg(!notifMsg)} icon="📩" />
            <ToggleRow C={C} label={ar ? "تعيين" : "Assignment"} desc={ar ? "عند تعيين محادثة لك" : "When a conversation is assigned to you"} on={notifAssign} onToggle={() => setNotifAssign(!notifAssign)} icon="👤" />
            <ToggleRow C={C} label={ar ? "تصعيد" : "Escalation"} desc={ar ? "عند تصعيد محادثة" : "When a conversation is escalated"} on={notifEsc} onToggle={() => setNotifEsc(!notifEsc)} icon="🚨" />
            <ToggleRow C={C} label={ar ? "تحذير SLA" : "SLA Warning"} desc={ar ? "عند اقتراب انتهاء وقت الاستجابة" : "When response time is nearing limit"} on={notifSla} onToggle={() => setNotifSla(!notifSla)} icon="⏰" />
            <ToggleRow C={C} label={ar ? "رصيد منخفض" : "Low Balance"} desc={ar ? "عند انخفاض رصيد الحساب" : "When account balance is low"} on={notifBal} onToggle={() => setNotifBal(!notifBal)} icon="💰" />
          </Card>

          {/* Notification Channels */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "قنوات الإشعارات" : "Notification Channels"}</SectionTitle>
            <ToggleRow C={C} label={ar ? "إشعارات المتصفح" : "Browser Push"} desc={ar ? "إشعارات منبثقة في المتصفح" : "Browser push notifications"} on={pushBrowser} onToggle={() => setPushBrowser(!pushBrowser)} icon="🔔" />
            <ToggleRow C={C} label={ar ? "البريد الإلكتروني" : "Email"} desc={ar ? "إرسال إشعارات عبر البريد" : "Send notifications via email"} on={pushEmail} onToggle={() => setPushEmail(!pushEmail)} icon="📧" />
            <ToggleRow C={C} label={ar ? "الصوت" : "Sound"} desc={ar ? "تشغيل صوت عند وصول إشعار" : "Play sound on notification"} on={pushSound} onToggle={() => setPushSound(!pushSound)} icon="🔊" />
            <ToggleRow C={C} label={ar ? "إشعارات الجوال" : "Mobile Push"} desc={ar ? "إشعارات على تطبيق الجوال" : "Push to mobile app"} on={pushMobile} onToggle={() => setPushMobile(!pushMobile)} icon="📱" />

            <div style={{ marginTop: 12 }}>
              <ToggleRow C={C} label={ar ? "ساعات الهدوء" : "Quiet Hours"} desc={ar ? "إيقاف الإشعارات خلال فترة محددة" : "Mute notifications during a specific period"} on={quietHours} onToggle={() => setQuietHours(!quietHours)} icon="🌙" />
              {quietHours && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 8, paddingInlineStart: 26 }}>
                  <span style={{ fontSize: 12, color: C.t2 }}>{ar ? "من" : "From"}</span>
                  <input type="time" defaultValue="22:00" style={{ padding: "7px 10px", borderRadius: 8, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 12, color: C.txt }} />
                  <span style={{ fontSize: 12, color: C.t2 }}>{ar ? "إلى" : "To"}</span>
                  <input type="time" defaultValue="07:00" style={{ padding: "7px 10px", borderRadius: 8, background: C.inp, border: `1px solid ${C.brd}`, fontFamily: FONT_FAMILY, fontSize: 12, color: C.txt }} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <ToggleRow C={C} label={ar ? "التقارير التلقائية" : "Auto Reports"} desc={ar ? "إرسال تقارير دورية تلقائياً" : "Send periodic reports automatically"} on={autoReports} onToggle={() => setAutoReports(!autoReports)} icon="📊" />
              {autoReports && (
                <div style={{ paddingTop: 8, paddingInlineStart: 26 }}>
                  <FieldLabel C={C}>{ar ? "التكرار" : "Frequency"}</FieldLabel>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(ar ? ["يومي", "أسبوعي", "شهري"] : ["Daily", "Weekly", "Monthly"]).map((r, i) => (
                      <button key={i} style={{ padding: "6px 14px", borderRadius: 8, border: i === 1 ? `1.5px solid ${C.pri}` : `1.5px solid ${dk ? C.brd : "#D5D2CC"}`, background: i === 1 ? `${C.pri}12` : "transparent", color: i === 1 ? C.pri : C.t2, fontFamily: FONT_FAMILY, fontSize: 11, cursor: "pointer", fontWeight: i === 1 ? 600 : 400 }}>{r}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ SECURITY TAB ═══════════ */}
      {tab === "security" && (
        <div style={grid2Style}>
          {/* Authentication */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "المصادقة" : "Authentication"}</SectionTitle>
            <ToggleRow C={C} label={ar ? "المصادقة الثنائية" : "Two-Factor Authentication"} desc={ar ? "طلب رمز إضافي عند تسجيل الدخول" : "Require extra code on login"} on={twoFA} onToggle={() => setTwoFA(!twoFA)} icon="🔐" />
            <ToggleRow C={C} label={ar ? "تسجيل الدخول الموحد" : "Single Sign-On (SSO)"} desc={ar ? "تسجيل الدخول عبر مزود هوية خارجي" : "Login via external identity provider"} on={sso} onToggle={() => setSSO(!sso)} icon="🔑" />
            <ToggleRow C={C} label={ar ? "قائمة IP المسموحة" : "IP Whitelist"} desc={ar ? "تقييد الوصول لعناوين IP محددة" : "Restrict access to specific IPs"} on={ipWhite} onToggle={() => setIpWhite(!ipWhite)} icon="🛡️" />
            <ToggleRow C={C} label={ar ? "مهلة الجلسة" : "Session Timeout"} desc={ar ? "تسجيل خروج تلقائي بعد فترة خمول" : "Auto-logout after inactivity"} on={sessTimeout} onToggle={() => setSessTimeout(!sessTimeout)} icon="⏱️" />

            <div style={{ marginTop: 10 }}>
              <FieldLabel C={C}>{ar ? "سياسة كلمة المرور" : "Password Policy"}</FieldLabel>
              <div style={{ display: "flex", gap: 6 }}>
                {(ar ? ["أساسية", "متوسطة", "قوية"] : ["Basic", "Medium", "Strong"]).map((p, i) => (
                  <button key={i} style={{ padding: "6px 14px", borderRadius: 8, border: i === 2 ? `1.5px solid ${C.pri}` : `1.5px solid ${dk ? C.brd : "#D5D2CC"}`, background: i === 2 ? `${C.pri}12` : "transparent", color: i === 2 ? C.pri : C.t2, fontFamily: FONT_FAMILY, fontSize: 11, cursor: "pointer", fontWeight: i === 2 ? 600 : 400 }}>{p}</button>
                ))}
              </div>
            </div>
          </Card>

          {/* Audit Log */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "سجل التدقيق" : "Audit Log"}</SectionTitle>
            {[
              { action: ar ? "تسجيل دخول" : "Login", user: "admin@corbit.sa", time: ar ? "منذ 5 دقائق" : "5 min ago", color: C.ok },
              { action: ar ? "تغيير إعدادات" : "Settings Changed", user: "sarah@corbit.sa", time: ar ? "منذ 15 دقيقة" : "15 min ago", color: C.info },
              { action: ar ? "إضافة عضو" : "Member Added", user: "admin@corbit.sa", time: ar ? "منذ ساعة" : "1 hour ago", color: "#7C3AED" },
              { action: ar ? "تغيير كلمة المرور" : "Password Changed", user: "omar@corbit.sa", time: ar ? "منذ ساعتين" : "2 hours ago", color: C.warn },
              { action: ar ? "تعطيل 2FA" : "2FA Disabled", user: "ahmed@corbit.sa", time: ar ? "منذ 3 ساعات" : "3 hours ago", color: C.err },
              { action: ar ? "تسجيل خروج" : "Logout", user: "nora@corbit.sa", time: ar ? "منذ 4 ساعات" : "4 hours ago", color: C.t3 },
              { action: ar ? "تحديث API Key" : "API Key Rotated", user: "admin@corbit.sa", time: ar ? "أمس" : "Yesterday", color: C.info },
            ].map((entry, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: C.inp, marginBottom: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: entry.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{entry.action}</div>
                  <div style={{ fontSize: 11, color: C.t2 }}>{entry.user}</div>
                </div>
                <span style={{ fontSize: 11, color: C.t3, whiteSpace: "nowrap", flexShrink: 0 }}>{entry.time}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ═══════════ CHANNELS TAB ═══════════ */}
      {tab === "channels" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={grid2Style}>
            {/* WhatsApp */}
            <Card style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.wa}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="msg" size={18} />
                </div>
                <div>
                  <SectionTitle>WhatsApp Business</SectionTitle>
                </div>
              </div>
              {whatsappNumbers.length === 0 ? (
                <div style={{ padding: "16px 0", fontSize: 12.5, color: C.t2, textAlign: "center" }}>
                  {ar ? "لا توجد أرقام واتساب مُعدّة بعد" : "No WhatsApp numbers configured yet"}
                </div>
              ) : (
                whatsappNumbers.map((ph: any) => (
                  <div key={ph.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, direction: "ltr" }}>{ph.phone_number}</div>
                      <div style={{ fontSize: 11, color: C.t2 }}>{(ar ? ph.display_name_ar : null) || ph.display_name}</div>
                    </div>
                    <Badge color={ph.is_verified ? C.ok : C.warn}>
                      {ph.is_verified ? (ar ? "موثق" : "Verified") : (ar ? "قيد المراجعة" : "Pending")}
                    </Badge>
                  </div>
                ))
              )}
              <div style={{ marginTop: 10, fontSize: 11, color: C.t2 }}>
                {ar ? "المزوّد الحالي: " : "Active provider: "}<b style={{ color: C.txt }}>{(whatsappData as any)?.provider ?? "—"}</b>
              </div>
            </Card>

            {/* SMS */}
            <Card style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.info}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="phone" size={18} />
                  </div>
                  <SectionTitle>{ar ? "الرسائل القصيرة" : "SMS"}</SectionTitle>
                </div>
                <Toggle on={smsEnable} onToggle={() => setSmsEnable(!smsEnable)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div><FieldLabel C={C}>{ar ? "المزود" : "Provider"}</FieldLabel><Input value="mobile.net.sa" C={C} /></div>
                <div><FieldLabel C={C}>{ar ? "معرف المرسل" : "Sender ID"}</FieldLabel><Input value="Corbit" C={C} /></div>
              </div>
              <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.7 }}>
                {ar
                  ? "يُستخدم لإرسال بيانات الدخول للعملاء الجدد. الرصيد يُدار من حساب mobile.net.sa مباشرة."
                  : "Used to send login credentials to new clients. Balance is managed directly in the mobile.net.sa account."}
              </div>
            </Card>
          </div>

          {/* Channel Preferences */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "تفضيلات القنوات" : "Channel Preferences"}</SectionTitle>
            <div style={grid2Style}>
              {/* Mode selection */}
              <div>
                <FieldLabel C={C}>{ar ? "وضع القنوات" : "Channel Mode"}</FieldLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  {[
                    { key: "wa_only", label: ar ? "واتساب فقط" : "WhatsApp Only", desc: ar ? "استخدام واتساب كقناة وحيدة" : "Use WhatsApp as the only channel" },
                    { key: "wa_sms", label: ar ? "واتساب + SMS احتياطي" : "WA + SMS Fallback", desc: ar ? "SMS عند عدم توفر واتساب" : "SMS when WhatsApp is unavailable" },
                    { key: "dual", label: ar ? "قنوات مزدوجة" : "Dual Channel", desc: ar ? "استخدام كلا القناتين بالتوازي" : "Use both channels simultaneously" },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      onClick={() => setChannelMode(opt.key)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        cursor: "pointer",
                        border: `1px solid ${channelMode === opt.key ? C.pri : C.brd}`,
                        background: channelMode === opt.key ? `${C.pri}10` : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{ width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${channelMode === opt.key ? C.pri : C.t3}` }}
                        >
                          {channelMode === opt.key && <div style={{ width: 10, height: 10, borderRadius: 5, background: C.pri }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: C.t2 }}>{opt.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel routing */}
              <div>
                <FieldLabel C={C}>{ar ? "توجيه القنوات حسب الاستخدام" : "Channel Routing by Use Case"}</FieldLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
                  {[
                    { label: ar ? "الدعم" : "Support", value: "WhatsApp" },
                    { label: ar ? "التسويق" : "Marketing", value: "WhatsApp" },
                    { label: ar ? "المعاملات" : "Transactional", value: ar ? "كلاهما" : "Both" },
                    { label: ar ? "التنبيهات" : "Alerts", value: "SMS" },
                  ].map((route, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>
                      <span style={{ fontSize: 13 }}>{route.label}</span>
                      <Select value={route.value} options={["WhatsApp", "SMS", ar ? "كلاهما" : "Both"]} C={C} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div style={grid2Style}>
            {/* WA Profile */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "ملف واتساب التجاري" : "WA Business Profile"}</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: `${C.wa}15`, color: C.wa }}>
                  <Icon name="msg" size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Corbit Tech</div>
                  <div style={{ fontSize: 11, color: C.t2 }}>{ar ? "حساب أعمال موثق" : "Verified Business Account"}</div>
                </div>
                <Badge color={C.ok}>{ar ? "موثق" : "Verified"}</Badge>
              </div>
              {[
                [ar ? "الفئة" : "Category", ar ? "تقنية المعلومات" : "IT Services"],
                [ar ? "العنوان" : "Address", ar ? "الرياض، السعودية" : "Riyadh, Saudi Arabia"],
                [ar ? "البريد" : "Email", "support@corbit.sa"],
                [ar ? "الموقع" : "Website", "https://corbit.sa"],
              ].map(([label, val], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}`, fontSize: 12.5 }}>
                  <span style={{ color: C.t2 }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </Card>

            {/* Channel Comparison */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "مقارنة القنوات" : "Channel Comparison"}</SectionTitle>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      {["", "WhatsApp", "SMS"].map((h, i) => (
                        <th key={i} style={{ padding: "8px 10px", textAlign: i === 0 ? "start" : "center", fontSize: 11.5, fontWeight: 600, color: C.t2, borderBottom: `1px solid ${C.brd}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [ar ? "التكلفة" : "Cost", ar ? "منخفضة" : "Low", ar ? "متوسطة" : "Medium"],
                      [ar ? "الوسائط" : "Media", "✓", "✗"],
                      [ar ? "القوالب" : "Templates", "✓", "✓"],
                      [ar ? "الاستجابة" : "Read Rate", "95%", "70%"],
                      [ar ? "الوصول" : "Reach", ar ? "عالي" : "High", ar ? "عالمي" : "Global"],
                    ].map(([label, wa, sms], i) => (
                      <tr key={i}>
                        <td style={{ padding: "8px 10px", fontWeight: 500, borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>{label}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>{wa}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", borderBottom: `1px solid ${dk ? C.brd : "#F5F2ED"}` }}>{sms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════ WHATSAPP TAB ═══════════ */}
      {tab === "whatsapp" && (
        <WhatsAppConnect showHeader={false} />
      )}

      {/* ═══════════ TEAM TAB ═══════════ */}
      {tab === "team" && (
        <div style={grid2Style}>
          {/* Roles & Permissions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "الأدوار والصلاحيات" : "Roles & Permissions"}</SectionTitle>
              {[
                { role: ar ? "مدير" : "Admin", count: roleCounts.admin, color: C.err, desc: ar ? "وصول كامل لجميع الإعدادات والبيانات" : "Full access to all settings and data", icon: "🔴" },
                { role: ar ? "مشرف" : "Supervisor", count: roleCounts.supervisor, color: C.warn, desc: ar ? "إدارة الفريق ومراقبة المحادثات" : "Team management & conversation monitoring", icon: "🟡" },
                { role: ar ? "وكيل" : "Agent", count: roleCounts.agent, color: C.ok, desc: ar ? "التعامل مع المحادثات والعملاء" : "Handle conversations and customers", icon: "🟢" },
              ].map((r, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 12, background: C.inp, marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{r.role}</span>
                      <Badge color={r.color}>{r.count} {ar ? "أعضاء" : "members"}</Badge>
                    </div>
                    <Button small outline onClick={() => showToast("✓")}>
                      <Icon name="pencil" size={12} />
                    </Button>
                  </div>
                  <div style={{ fontSize: 11, color: C.t2 }}>{r.desc}</div>
                </div>
              ))}
            </Card>

            {/* SLA Settings */}
            <Card style={{ padding: 18 }}>
              <SectionTitle>{ar ? "إعدادات SLA" : "SLA Settings"}</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldLabel C={C}>{ar ? "وقت الاستجابة الأولى" : "First Response Time"}</FieldLabel>
                  <Select value={ar ? "5 دقائق" : "5 minutes"} options={ar ? ["1 دقيقة", "5 دقائق", "15 دقيقة", "30 دقيقة"] : ["1 minute", "5 minutes", "15 minutes", "30 minutes"]} C={C} />
                </div>
                <div>
                  <FieldLabel C={C}>{ar ? "وقت الحل" : "Resolution Time"}</FieldLabel>
                  <Select value={ar ? "4 ساعات" : "4 hours"} options={ar ? ["ساعة", "4 ساعات", "8 ساعات", "24 ساعة"] : ["1 hour", "4 hours", "8 hours", "24 hours"]} C={C} />
                </div>
                <div>
                  <FieldLabel C={C}>{ar ? "تحذير التصعيد" : "Escalation Warning"}</FieldLabel>
                  <Select value={ar ? "3 دقائق" : "3 minutes"} options={ar ? ["1 دقيقة", "3 دقائق", "5 دقائق"] : ["1 minute", "3 minutes", "5 minutes"]} C={C} />
                </div>
                <div>
                  <FieldLabel C={C}>{ar ? "أولوية VIP" : "VIP Priority"}</FieldLabel>
                  <Select value={ar ? "عالية" : "High"} options={ar ? ["عادية", "عالية", "عاجلة"] : ["Normal", "High", "Urgent"]} C={C} />
                </div>
              </div>
            </Card>
          </div>

          {/* Conversation Settings */}
          <Card style={{ padding: 18 }}>
            <SectionTitle>{ar ? "إعدادات المحادثات" : "Conversation Settings"}</SectionTitle>
            <ToggleRow C={C}
              label={ar ? "إغلاق تلقائي" : "Auto Close"}
              desc={ar ? "إغلاق المحادثات غير النشطة بعد 24 ساعة" : "Close inactive conversations after 24 hours"}
              on={autoClose}
              onToggle={() => setAutoClose(!autoClose)}
              icon="🔒"
            />
            <ToggleRow C={C}
              label={ar ? "تعيين تلقائي" : "Auto Assign"}
              desc={ar ? "تعيين المحادثات الجديدة تلقائياً للوكلاء المتاحين" : "Auto-assign new conversations to available agents"}
              on={autoAssign}
              onToggle={() => setAutoAssign(!autoAssign)}
              icon="🔄"
            />
            <ToggleRow C={C}
              label={ar ? "استلام العميل" : "Customer Takeover"}
              desc={ar ? "السماح للعملاء بتحويل من البوت للوكيل" : "Allow customers to transfer from bot to agent"}
              on={custTakeover}
              onToggle={() => setCustTakeover(!custTakeover)}
              icon="🤝"
            />
            <ToggleRow C={C}
              label={ar ? "استبيان بعد الإغلاق" : "Post-Close Survey"}
              desc={ar ? "إرسال استبيان رضا بعد إغلاق المحادثة" : "Send satisfaction survey after closing conversation"}
              on={postSurvey}
              onToggle={() => setPostSurvey(!postSurvey)}
              icon="⭐"
            />

            <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: `${C.pri}08`, border: `1px solid ${C.pri}20` }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{ar ? "إعدادات التعيين التلقائي" : "Auto-Assign Settings"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <FieldLabel C={C}>{ar ? "الخوارزمية" : "Algorithm"}</FieldLabel>
                  <Select value={ar ? "الأقل حملاً" : "Least Load"} options={ar ? ["الأقل حملاً", "دوري", "عشوائي"] : ["Least Load", "Round Robin", "Random"]} C={C} />
                </div>
                <div>
                  <FieldLabel C={C}>{ar ? "الحد الأقصى للوكيل" : "Max per Agent"}</FieldLabel>
                  <Input value="15" type="number" C={C} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ API TAB ═══════════ */}
      {tab === "api" && (
        <div style={grid2Style}>
          {/* API Keys */}
          <Card style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <SectionTitle>{ar ? "مفاتيح API" : "API Keys"}</SectionTitle>
              <Button small outline onClick={() => window.open("#", "_blank")}>
                <Icon name="book" size={13} />
                {ar ? "توثيق API" : "API Docs"}
              </Button>
            </div>

            {(() => {
              const list: any[] = Array.isArray(apiKeysData) ? apiKeysData : ((apiKeysData as any)?.data ?? []);
              if (list.length === 0) {
                return (
                  <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12.5, color: C.t2 }}>
                    {ar ? "لا توجد مفاتيح API — أنشئ مفتاحاً جديداً" : "No API keys — create one to get started"}
                  </div>
                );
              }
              return list.map((apiKey: any, i: number) => (
              <div key={apiKey.id ?? i} style={{ padding: 14, borderRadius: 12, background: C.inp, marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="key" size={14} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{apiKey.name ?? apiKey.label ?? (ar ? "مفتاح" : "Key")}</span>
                  </div>
                  <Badge color={apiKey.environment === "production" ? C.ok : C.warn}>{apiKey.environment ?? "—"}</Badge>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: C.card, fontFamily: "monospace", fontSize: 12, color: C.t2, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>
                  {apiKey.key ?? apiKey.masked_key ?? ""}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Button small outline onClick={() => { navigator.clipboard.writeText(apiKey.key ?? ""); showToast(ar ? "تم النسخ" : "Copied!"); }}>
                    <Icon name="copy" size={12} /> {ar ? "نسخ" : "Copy"}
                  </Button>
                  <Button small outline onClick={async () => {
                    try {
                      await api.post(`/settings/api-keys/${apiKey.id}/regenerate`);
                      showToast(ar ? "تم التدوير" : "Key rotated");
                      mutateApi();
                    } catch (e: any) {
                      const msg = e?.response?.data?.message || e?.message || "";
                      showToast(ar ? `فشل التدوير: ${msg}` : `Failed to rotate key: ${msg}`);
                    }
                  }}>
                    <Icon name="refresh" size={12} /> {ar ? "تدوير" : "Rotate"}
                  </Button>
                  <Button small outline onClick={async () => {
                    try {
                      await api.delete(`/settings/api-keys/${apiKey.id}`);
                      showToast(ar ? "تم الحذف" : "Key deleted");
                      mutateApi();
                    } catch (e: any) {
                      const msg = e?.response?.data?.message || e?.message || "";
                      showToast(ar ? `فشل الحذف: ${msg}` : `Failed to delete key: ${msg}`);
                    }
                  }} style={{ color: C.err }}>
                    <Icon name="x" size={12} /> {ar ? "حذف" : "Delete"}
                  </Button>
                </div>
              </div>
              ));
            })()}

            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: `#7C3AED08`, border: `1px solid #7C3AED20` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", marginBottom: 4 }}>{ar ? "وثائق API" : "API Documentation"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <Icon name="shield" size={14} />
                <span style={{ color: C.t2 }}>{ar ? "المعدل: 1000 طلب/دقيقة | الحد: 100,000 طلب/يوم" : "Rate: 1,000 req/min | Limit: 100,000 req/day"}</span>
              </div>
            </div>
          </Card>

          {/* Webhooks */}
          <Card style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <SectionTitle>{ar ? "الويب هوكس" : "Webhooks"}</SectionTitle>
              <Button small primary onClick={async () => {
                try {
                  await api.post('/settings/webhooks', { url: '', events: [] });
                  showToast(ar ? "تمت الإضافة" : "Webhook added");
                  mutateApi();
                } catch (e: any) {
                  const msg = e?.response?.data?.message || e?.message || "";
                  showToast(ar ? `فشلت الإضافة: ${msg}` : `Failed to add webhook: ${msg}`, "error");
                }
              }}>
                <Icon name="link" size={13} />
                {ar ? "إضافة" : "Add"}
              </Button>
            </div>

            {webhooks.length === 0 ? (
              <div style={{ padding: "16px 0", fontSize: 12.5, color: C.t2, textAlign: "center" }}>
                {ar ? "لا توجد ويب هوكس مضافة بعد" : "No webhooks configured yet"}
              </div>
            ) : (
              webhooks.map((wh: any) => (
                <div key={wh.id} style={{ padding: 14, borderRadius: 12, background: C.inp, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ flex: 1, fontFamily: "monospace", fontSize: 11.5, color: C.t2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginInlineEnd: 10, direction: "ltr" }}>
                      {wh.url}
                    </div>
                    <Toggle
                      on={!!wh.is_active}
                      onToggle={async () => {
                        try {
                          await api.patch(`/settings/webhooks/${wh.id}`, { is_active: !wh.is_active });
                          mutateWebhooks();
                        } catch (e: any) {
                          showToast(ar ? "فشل التحديث" : "Update failed");
                        }
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(wh.events ?? []).map((ev: string) => (
                      <Badge key={ev} color={C.info}>{ev}</Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
