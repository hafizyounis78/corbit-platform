import { useState } from "react";

const ff = "'IBM Plex Sans Arabic','IBM Plex Sans',sans-serif";
const GR = "linear-gradient(135deg,#E8713A,#D94F8A,#C43D78)";

/* ── Icon System ── */
const Ico = (name, size=16) => {
  const P = {
    dashboard:"M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  inbox:"M22 12h-6l-2 3H10l-2-3H2 M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
  megaphone:"M3 11l18-5v12L3 13v-2z M11.6 16.8a3 3 0 11-5.8-1.6",
  users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  file:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8",
  bot:"M12 2a2 2 0 012 2v1h3a2 2 0 012 2v10a4 4 0 01-4 4H9a4 4 0 01-4-4V7a2 2 0 012-2h3V4a2 2 0 012-2z M9 14h0 M15 14h0",
  brain:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M12 6v6l4 2",
  chart:"M18 20V10 M12 20V4 M6 20v-6",
  link:"M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  team:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 100-8 4 4 0 000 8z M20 8v6 M23 11h-6",
  card:"M2 5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5z M2 10h20",
  gear:"M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.82 1.18V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00-.33-2.82H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00.33 1.82V9h.09a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z",
  search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  menu:"M4 6h16M4 12h16M4 18h16",
  x:"M18 6L6 18M6 6l12 12",
  bell:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  sun:"M12 7a5 5 0 100 10 5 5 0 000-10z M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  moon:"M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  globe:"M12 2a10 10 0 100 20 10 10 0 000-20z M2 12h20 M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  send:"M22 2L11 13 M22 2l-7 20-4-9-9-4z",
  clip:"M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
  smile:"M12 2a10 10 0 100 20 10 10 0 000-20z M8 14s1.5 2 4 2 4-2 4-2 M9 9h.01 M15 9h.01",
  check:"M20 6L9 17l-5-5",
  dcheck:"M18 6L7 17l-5-5 M22 10l-9.17 9.17",
  wallet:"M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z M2 10h20 M16 14h.01",
  msg:"M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  rocket:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z",
  zap:"M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  tag:"M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
  bookmark:"M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z",
  book:"M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  shield:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  lock:"M5 11V7a5 5 0 0110 0v4 M3 11h18v11H3z",
  phone:"M5 2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z M12 18h.01",
  pkg:"M16.5 9.4l-9-5.19 M21 16V8l-9-5-9 5v8l9 5 9-5z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12",
  truck:"M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z M18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  cart:"M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6 M9 21a1 1 0 100-2 1 1 0 000 2z M20 21a1 1 0 100-2 1 1 0 000 2z",
  userPlus:"M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M8.5 3a4 4 0 100 8 4 4 0 000-8z M20 8v6 M23 11h-6",
  star:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  pencil:"M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z",
  target:"M12 22a10 10 0 100-20 10 10 0 000 20z M12 18a6 6 0 100-12 6 6 0 000 12z M12 14a2 2 0 100-4 2 2 0 000 4z",
  award:"M12 15a7 7 0 100-14 7 7 0 000 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12",
  list:"M10 6h11M10 12h11M10 18h11 M3 6l2 2 4-4 M3 18l2 2 4-4 M3 12h4",
  key:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  copy:"M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1 M9 9h10a2 2 0 012 2v9a2 2 0 01-2 2H9a2 2 0 01-2-2V11a2 2 0 012-2z",
  plug:"M12 22v-5 M9 8V2M15 8V2 M18 8v5a6 6 0 01-12 0V8z",
  store:"M3 9l1-4h16l1 4 M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9 M3 9h18 M9 21V13h6v8",
  pie:"M21.21 15.89A10 10 0 118 2.83 M22 12A10 10 0 0012 2v10z",
  receipt:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z M16 8h-6 M14 12H8",
  sheet:"M3 3h18v18H3z M3 9h18M3 15h18M9 3v18",
  refresh:"M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  activity:"M22 12h-4l-3 9L9 3l-3 9H2",
  timer:"M12 5a8 8 0 100 16 8 8 0 000-16z M12 9v4l2 2 M5 3L2 6 M22 6l-3-3 M12 2v2",
  };
  const d = P[name];
  if (!d) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
};

function useC(dk) {
  return { pri:"#E8713A",sec:"#D94F8A",bg:dk?"#0C0E14":"#F8F7F5",card:dk?"#141721":"#FFF",side:dk?"#0F1119":"#FFF",inp:dk?"#1A1E2E":"#F0EFED",txt:dk?"#E8E6E3":"#1A1A1A",t2:dk?"#8B8D97":"#6B6B6B",t3:dk?"#555764":"#9B9B9B",brd:dk?"#1E2233":"#E8E6E3",brdL:dk?"#262A3A":"#F0EFED",ok:"#34C77B",warn:"#F5A623",err:"#E84855",info:"#4A9EFF",wa:"#25D366",shadow:"0 2px 12px rgba(0,0,0,0.06)",shadow:"0 2px 12px rgba(0,0,0,0.06)",shadowLg:"0 12px 40px rgba(0,0,0,0.15)" };
}
const sC = s => ["open","active","published","online"].includes(s)?"#34C77B":["pending","testing","busy","scheduled"].includes(s)?"#F5A623":["solved","completed","approved"].includes(s)?"#4A9EFF":s==="rejected"?"#E84855":"#555764";

function MiniBar({data,color,h=40}) {
  const mx = Math.max(...data);
  return <div style={{display:"flex",alignItems:"flex-end",gap:2,height:h}}>{data.map((v,i)=><div key={i} style={{flex:1,height:(v/mx*100)+"%",background:color,borderRadius:2,minHeight:2}}/>)}</div>;
}
function Donut({segs,size=90,sw=10}) {
  const r=(size-sw)/2, c=2*Math.PI*r;
  let off=0;
  return <svg width={size} height={size}>{segs.map((s,i)=>{const d2=(s.v/100)*c,o=-off;off+=d2;return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.c} strokeWidth={sw} strokeDasharray={d2+" "+(c-d2)} strokeDashoffset={o} transform={"rotate(-90 "+size/2+" "+size/2+")"}/>;})}</svg>;
}
function ProgBar({value,color}) {
  return <div style={{height:8,borderRadius:8,background:"rgba(128,128,128,0.15)",overflow:"hidden"}}><div style={{height:"100%",width:value+"%",borderRadius:8,background:color}}/></div>;
}

export default function App() {
  const [lang, setLang] = useState("ar");
  const [theme, setTheme] = useState("dark");
  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const [mobMenu, setMobMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selConvo, setSelConvo] = useState(0);
  const [campTab, setCampTab] = useState("all");
  const [tmpTab, setTmpTab] = useState("all");
  const [stTab, setStTab] = useState("general");
  const [anaRange, setAnaRange] = useState("weekly");
  const [modal, setModal] = useState(null);
  const [tmTab, setTmTab] = useState("members");
  const [tmView, setTmView] = useState(null);
  const [anaTab, setAnaTab] = useState("overview");
  const [aiTab, setAiTab] = useState("overview");
  const [intTab2, setIntTab2] = useState("all");
  const [intView2, setIntView2] = useState(null);
  const [intSearch, setIntSearch] = useState("");
  const [conn2, setConn2] = useState(["shopify","hubspot","zapier"]);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [smsFallback, setSmsFallback] = useState(true);
  const [smsDual, setSmsDual] = useState(false);
  const isMob = typeof window !== "undefined" && window.innerWidth < 768;
  const isTab = typeof window !== "undefined" && window.innerWidth < 1024;
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [intTab, setIntTab] = useState("all");
  const [intView, setIntView] = useState(null);
  const [intConfig, setIntConfig] = useState(null);
  const [installedApps, setInstalledApps] = useState(["salla","daftra"]);
  const [connectedApps, setConnectedApps] = useState(["salla"]);
  const [appConfigs, setAppConfigs] = useState({salla:{apiKey:"sk-salla-****-7f3a",storeUrl:"mystore.salla.sa",syncOrders:true,syncProducts:true,syncCustomers:true,orderConfirm:true,shipNotify:true,abandonCart:false,reviewReq:false}});
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const openModal = (type) => { setModal(type); setFormData({}); };
  const rtl = lang==="ar", dk = theme==="dark";
  const C = useC(dk);
  const ar = lang==="ar";
  const t = {
    dashboard:ar?"لوحة التحكم":"Dashboard", inbox:ar?"صندوق الوارد":"Inbox", campaigns:ar?"الحملات":"Campaigns",
    contacts:ar?"جهات الاتصال":"Contacts", templates:ar?"القوالب":"Templates", botBuilder:ar?"بناء البوت":"Bot Builder",
    analytics:ar?"التحليلات":"Analytics", billing:ar?"الفوترة":"Billing", settings:ar?"الإعدادات":"Settings",
    aiCenter:ar?"مركز الذكاء":"AI Center", teams:ar?"الفرق":"Teams",
    integrations:ar?"التطبيقات":"Integrations", intDesc:ar?"اربط متجرك وأنظمتك مع واتساب":"Connect your store & systems with WhatsApp",
    installed:ar?"مثبّت":"Installed", notInstalled:ar?"غير مثبّت":"Not Installed", install:ar?"تثبيت":"Install",
    uninstall:ar?"إزالة":"Uninstall", configure:ar?"إعدادات الربط":"Configure", allApps:ar?"الكل":"All",
    ecommerce:ar?"المتاجر":"E-Commerce", crm:ar?"إدارة العملاء":"CRM", accounting:ar?"المحاسبة":"Accounting",
    payments:ar?"المدفوعات":"Payments", other:ar?"أخرى":"Other", syncNow:ar?"مزامنة الآن":"Sync Now",
    lastSync:ar?"آخر مزامنة":"Last Sync", connected2:ar?"مربوط":"Connected", disconnected:ar?"غير مربوط":"Disconnected",
    apiKeyLabel:ar?"مفتاح API":"API Key", storeUrl:ar?"رابط المتجر":"Store URL",
    testConn:ar?"اختبار الاتصال":"Test Connection", syncOrders:ar?"مزامنة الطلبات":"Sync Orders",
    syncProducts:ar?"مزامنة المنتجات":"Sync Products", syncCustomers:ar?"مزامنة العملاء":"Sync Customers",
    autoMsg:ar?"رسائل تلقائية":"Auto Messages", orderConfirm:ar?"تأكيد الطلب":"Order Confirm",
    shipNotify:ar?"إشعار الشحن":"Shipping Notification", abandonCart:ar?"السلة المتروكة":"Abandoned Cart",
    reviewReq:ar?"طلب تقييم":"Review Request", intActive:ar?"مفعّلة":"Active Apps",
    intTotal:ar?"التطبيقات":"Total Apps", syncEvents:ar?"أحداث المزامنة":"Sync Events",
    saveConfig:ar?"حفظ الإعدادات":"Save Config",
    totalConv:ar?"إجمالي المحادثات":"Total Conversations", activeAgents:ar?"الوكلاء النشطون":"Active Agents",
    avgResp:ar?"متوسط الاستجابة":"Avg Response", campSent:ar?"الحملات المرسلة":"Campaigns Sent",
    wallet:ar?"رصيد المحفظة":"Wallet", sla:"SLA", csat:ar?"تقييم الرضا":"CSAT",
    recentConv:ar?"المحادثات الأخيرة":"Recent Conversations", quickAct:ar?"إجراءات سريعة":"Quick Actions",
    newCamp:ar?"حملة جديدة":"New Campaign", newTmpl:ar?"قالب جديد":"New Template",
    importCont:ar?"استيراد":"Import", addAgent:ar?"إضافة وكيل":"Add Agent",
    search:ar?"بحث...":"Search...", notif:ar?"الإشعارات":"Notifications",
    min:ar?"د":"min", sar:ar?"ر.س":"SAR", connected:ar?"متصل":"Connected",
    waNum:ar?"أرقام واتساب":"WhatsApp Numbers", welcome:ar?"مرحباً بك في المدار":"Welcome to CORBIT",
    tagline:ar?"منصة واتساب الأعمال المتكاملة":"Integrated WhatsApp Business Platform",
    allConv:ar?"الكل":"All", unread:ar?"غير مقروءة":"Unread", assigned:ar?"مُسندة":"Assigned",
    typeMsg:ar?"اكتب رسالة...":"Type a message...", assignTo:ar?"إسناد":"Assign", resolve:ar?"حل":"Resolve",
    high:ar?"عالية":"High", medium:ar?"متوسطة":"Medium", low:ar?"منخفضة":"Low",
    aiUsage:ar?"استخدام الذكاء":"AI Usage", aiSug:ar?"اقتراحات":"Suggestions",
    aiAcc:ar?"مقبولة":"Accepted", aiCred:ar?"الرصيد":"Credits",
    active:ar?"نشطة":"Active", completed:ar?"مكتملة":"Completed",
    scheduled:ar?"مجدولة":"Scheduled", draft:ar?"مسودة":"Draft",
    createCamp:ar?"إنشاء حملة":"Create Campaign", estCost:ar?"التكلفة":"Cost",
    totalCont:ar?"إجمالي جهات الاتصال":"Total Contacts", segments:ar?"الشرائح":"Segments",
    newCont:ar?"جهات جديدة":"New", blocked:ar?"محظورة":"Blocked",
    name:ar?"الاسم":"Name", phone:ar?"الرقم":"Phone", tags:ar?"الوسوم":"Tags",
    lastInt:ar?"آخر تفاعل":"Last Interaction", addCont:ar?"إضافة":"Add",
    importCSV:ar?"استيراد":"Import", exportC:ar?"تصدير":"Export",
    createSeg:ar?"إنشاء شريحة":"Create Segment",
    approved:ar?"موافق":"Approved", pending:ar?"معلق":"Pending", rejected:ar?"مرفوض":"Rejected",
    mkt:ar?"تسويقي":"Marketing", util:ar?"خدمي":"Utility", authn:ar?"مصادقة":"Auth",
    createTmpl:ar?"إنشاء قالب":"Create Template", submit:ar?"إرسال":"Submit",
    published:ar?"منشور":"Published", unpublished:ar?"غير منشور":"Unpublished", testing:ar?"اختبار":"Testing",
    nodes:ar?"العقد":"Nodes", createFlow:ar?"إنشاء تدفق":"Create Flow", conv:ar?"المحادثات":"Conversations",
    replyA:ar?"مساعد الردود":"Reply Assist", summ:ar?"التلخيص":"Summarization",
    classif:ar?"التصنيف":"Classification", autoTag:ar?"الوسم التلقائي":"Auto Tagging",
    kb:ar?"قاعدة المعرفة":"Knowledge Base", guard:ar?"حواجز الأمان":"Guardrails",
    formal:ar?"رسمية":"Formal", friendly:ar?"ودية":"Friendly",
    uploadDocs:ar?"رفع مستندات":"Upload Docs",
    sugUsed:ar?"المستخدمة":"Used", accRate:ar?"الدقة":"Accuracy",
    convMetrics:ar?"مقاييس المحادثات":"Conversation Metrics",
    agentPerf:ar?"أداء الوكلاء":"Agent Performance",
    frt:ar?"وقت الاستجابة":"Response Time", resTime:ar?"وقت الحل":"Resolution",
    satTrend:ar?"اتجاه الرضا":"Satisfaction Trend",
    expCSV:ar?"تصدير CSV":"Export CSV", expPDF:ar?"تصدير PDF":"Export PDF",
    daily:ar?"يومي":"Daily", weekly:ar?"أسبوعي":"Weekly", monthly:ar?"شهري":"Monthly",
    agent:ar?"الوكيل":"Agent", sat:ar?"الرضا":"Satisfaction",
    members:ar?"الأعضاء":"Members", createTeam:ar?"إنشاء فريق":"Create Team",
    addMember:ar?"إضافة عضو":"Add Member", workHrs:ar?"ساعات العمل":"Working Hours",
    ooo:ar?"خارج الدوام":"Off", sup:ar?"مشرف":"Supervisor", agentR:ar?"وكيل":"Agent",
    onl:ar?"متصل":"Online", offl:ar?"غير متصل":"Offline", bsy:ar?"مشغول":"Busy",
    curPlan:ar?"الخطة الحالية":"Current Plan", ent:ar?"المؤسسات":"Enterprise",
    monthUse:ar?"الاستهلاك":"Usage", txns:ar?"المعاملات":"Transactions",
    topUp:ar?"شحن الرصيد":"Top Up", waConv:ar?"محادثات واتساب":"WA Conversations",
    aiCredits:ar?"رصيد الذكاء":"AI Credits", amount:ar?"المبلغ":"Amount",
    date:ar?"التاريخ":"Date", type:ar?"النوع":"Type", ref:ar?"المرجع":"Ref",
    charge:ar?"خصم":"Charge", payment:ar?"دفع":"Payment", refund:ar?"استرداد":"Refund",
    upgrade:ar?"ترقية":"Upgrade",
    general:ar?"عام":"General", security:ar?"الأمان":"Security",
    channels:ar?"القنوات":"Channels", api:"API",
    compName:ar?"اسم الشركة":"Company", tz:ar?"المنطقة الزمنية":"Timezone",
    currency:ar?"العملة":"Currency", twoFA:ar?"المصادقة الثنائية":"Two-Factor",
    audit:ar?"سجل التدقيق":"Audit Log", apiKeys:ar?"مفاتيح API":"API Keys",
    webhooks:ar?"الويبهوكس":"Webhooks", genKey:ar?"إنشاء مفتاح":"Generate Key",
    addWH:ar?"إضافة":"Add Webhook", save:ar?"حفظ":"Save", cancel:ar?"إلغاء":"Cancel",
    edit:ar?"تعديل":"Edit", enabled:ar?"مفعّل":"Enabled", disabled:ar?"معطّل":"Disabled",
    viewAll:ar?"عرض الكل":"View All", action:ar?"إجراء":"Action",
    tone:ar?"النبرة":"Tone", status:ar?"الحالة":"Status", cat:ar?"الفئة":"Category",
    lng:ar?"اللغة":"Language", recip:ar?"المستلمون":"Recipients",
    delRate:ar?"التسليم":"Delivery", readRate:ar?"القراءة":"Read",
    lowBal:ar?"رصيد منخفض":"Low Balance", lowBalM:ar?"رصيد أقل من 500":"Below 500 SAR",
    newMsg:ar?"رسالة جديدة":"New Message", newMsgB:ar?"12 رسالة جديدة":"12 unread",
    campDone:ar?"حملة اكتملت":"Campaign Done", campDoneM:ar?"رمضان اكتملت":"Ramadan done",
    features:ar?"المميزات":"Features",
  };

  /* UI Helpers */
  const Btn = ({children,primary,small,outline,onClick,style:s}) => <button onClick={onClick} style={{padding:small?"5px 12px":"8px 18px",borderRadius:10,fontFamily:ff,fontSize:small?11.5:12.5,fontWeight:600,cursor:"pointer",border:outline?"1px solid "+C.brd:"none",display:"inline-flex",alignItems:"center",gap:6,background:primary?GR:outline?"transparent":C.pri+"12",color:primary?"#fff":outline?C.txt:C.pri,...s}}>{children}</button>;
  const Cd = ({children,style:s}) => <div style={{background:C.card,borderRadius:14,border:"1px solid "+C.brd,overflow:"hidden",...s}}>{children}</div>;
  const CdH = ({title,actL,onAct}) => <div style={{padding:"14px 20px",borderBottom:"1px solid "+C.brd,display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{margin:0,fontSize:14.5,fontWeight:600}}>{title}</h3>{actL&&<button onClick={onAct} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:12,fontWeight:600,cursor:"pointer"}}>{actL}</button>}</div>;
  const Bg = ({children,color}) => <span style={{fontSize:10.5,padding:"2px 10px",borderRadius:8,fontWeight:600,background:color+"18",color}}>{children}</span>;
  const Av = ({name,size=40,solid}) => <div style={{width:size,height:size,borderRadius:12,background:solid?C.pri:C.pri+"15",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*.38,color:solid?"#fff":C.pri,flexShrink:0}}>{(name||"?").charAt(0)}</div>;
  const SD = ({color,label}) => <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11.5,fontWeight:600,color}}><span style={{width:7,height:7,borderRadius:"50%",background:color}}/>{label}</span>;
  const TBr = ({tabs,active,onChange}) => <div style={{display:"flex",gap:4,background:C.inp,borderRadius:10,padding:3,flexWrap:"wrap"}}>{tabs.map(tb=><button key={tb.k} onClick={()=>onChange(tb.k)} style={{padding:"6px 16px",borderRadius:8,border:"none",fontFamily:ff,fontSize:12,fontWeight:active===tb.k?600:400,cursor:"pointer",color:active===tb.k?"#fff":C.t2,background:active===tb.k?GR:"transparent",whiteSpace:"nowrap"}}>{tb.l}</button>)}</div>;
  const Tbl = ({h,rows}) => <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr>{h.map((hd,i)=><th key={i} style={{padding:"10px 16px",textAlign:"inherit",fontSize:11.5,fontWeight:600,color:C.t2,borderBottom:"1px solid "+C.brd,whiteSpace:"nowrap"}}>{hd}</th>)}</tr></thead><tbody>{rows.map((row,ri)=><tr key={ri} style={{borderBottom:"1px solid "+C.brdL}}>{row.map((cell,ci)=><td key={ci} style={{padding:"12px 16px",whiteSpace:"nowrap"}}>{cell}</td>)}</tr>)}</tbody></table></div>;
  const pC = p => p==="high"?C.err:p==="medium"?C.warn:C.t3;
  const Toggle = ({on,onToggle}) => <div onClick={onToggle} style={{width:44,height:24,borderRadius:12,background:on?C.ok:C.t3+"40",cursor:"pointer",position:"relative",transition:"background 0.2s"}}><div style={{width:20,height:20,borderRadius:10,background:"#fff",position:"absolute",top:2,[on?"right":"left"]:2,boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"all 0.2s"}}/></div>;

  /* Data */
  const convos = [
    {name:ar?"أحمد":"Ahmed",phone:"+966 55 XXX",msg:ar?"أريد الاستفسار":"About the offer",time:"2:30 PM",unread:3,status:"open",pri:"high",tag:ar?"مبيعات":"Sales"},
    {name:ar?"فاطمة":"Fatima",phone:"+966 50 XXX",msg:ar?"شكراً":"Thank you",time:"1:45 PM",unread:0,status:"solved",pri:"low",tag:ar?"دعم":"Support"},
    {name:ar?"محمد":"Mohammed",phone:"+966 54 XXX",msg:ar?"متى التسليم؟":"When delivery?",time:"12:20 PM",unread:1,status:"pending",pri:"medium",tag:ar?"طلبات":"Orders"},
    {name:ar?"نورة":"Noura",phone:"+966 56 XXX",msg:ar?"أحتاج مساعدة":"Need help",time:"11:05 AM",unread:2,status:"open",pri:"high",tag:ar?"دعم فني":"Tech"},
    {name:ar?"خالد":"Khaled",phone:"+966 53 XXX",msg:ar?"هل يوجد خصم؟":"Discount?",time:"10:30 AM",unread:0,status:"closed",pri:"low",tag:ar?"مبيعات":"Sales"},
  ];
  const chatMsgs = [{from:"customer",text:ar?"السلام عليكم، عروض رمضان؟":"Hello, Ramadan offers?",time:"2:25 PM"},{from:"bot",text:ar?"مرحباً بكم!\nكيف يمكنني مساعدتك؟":"Welcome!\nHow can I help?",time:"2:25 PM"},{from:"customer",text:ar?"تفاصيل باقة المؤسسات":"Enterprise details",time:"2:27 PM"},{from:"agent",text:ar?"أهلاً! الباقة تشمل:\n- 50 وكيل\n- 10 أرقام\n- بوت متقدم":"Hi! Includes:\n- 50 agents\n- 10 numbers\n- Advanced bot",time:"2:30 PM"}];
  const campData = [{name:ar?"عروض رمضان":"Ramadan",st:"active",r:12500,d:96.2,rd:72.1,cost:3750},{name:ar?"ترحيب":"Welcome",st:"active",r:850,d:98.5,rd:85.3,cost:255},{name:ar?"تذكير":"Payment",st:"completed",r:4200,d:97.8,rd:68.4,cost:1260},{name:ar?"عرض":"Weekend",st:"scheduled",r:8000,d:0,rd:0,cost:2400},{name:ar?"استبيان":"Survey",st:"draft",r:3000,d:0,rd:0,cost:900}];
  const contactsD = [{name:ar?"أحمد العتيبي":"Ahmed",phone:"+966551234567",tags:["VIP",ar?"مبيعات":"Sales"],last:"2026-02-21"},{name:ar?"سارة":"Sara",phone:"+966501234567",tags:[ar?"دعم":"Support"],last:"2026-02-20"},{name:ar?"عبدالله":"Abdullah",phone:"+966541234567",tags:[ar?"جديد":"New"],last:"2026-02-21"},{name:ar?"منى":"Mona",phone:"+966561234567",tags:["VIP"],last:"2026-02-19"},{name:ar?"فيصل":"Faisal",phone:"+966531234567",tags:[ar?"مبيعات":"Sales"],last:"2026-02-18"}];
  const tmplData = [{name:ar?"ترحيب":"Welcome",cat:"utility",ln:"ar+en",st:"approved"},{name:ar?"تأكيد":"Confirm",cat:"utility",ln:"ar",st:"approved"},{name:ar?"عرض":"Offer",cat:"marketing",ln:"ar+en",st:"approved"},{name:ar?"تذكير":"Reminder",cat:"utility",ln:"ar",st:"pending"},{name:"OTP",cat:"authentication",ln:"ar+en",st:"approved"},{name:ar?"استبيان":"Survey",cat:"marketing",ln:"ar",st:"rejected"}];
  const botData = [{name:ar?"بوت الترحيب":"Welcome Bot",st:"published",nodes:8,trig:ar?"مرحبا":"hello",cv:1240},{name:ar?"بوت الطلبات":"Order Bot",st:"published",nodes:15,trig:ar?"طلب":"order",cv:856},{name:ar?"بوت الدعم":"Support Bot",st:"testing",nodes:12,trig:ar?"مساعدة":"help",cv:0},{name:ar?"بوت الحجز":"Booking Bot",st:"unpublished",nodes:10,trig:ar?"قائمة":"menu",cv:0}];
  const teamsD = [{name:ar?"الدعم":"Support",m:[{n:ar?"سعد":"Saad",r:"sup",s:"online",c:12},{n:ar?"هند":"Hind",r:"agent",s:"online",c:8},{n:ar?"ماجد":"Majed",r:"agent",s:"busy",c:10}]},{name:ar?"المبيعات":"Sales",m:[{n:ar?"ليلى":"Laila",r:"sup",s:"online",c:6},{n:ar?"طارق":"Tariq",r:"agent",s:"offline",c:0}]},{name:ar?"الفوترة":"Billing",m:[{n:ar?"نواف":"Nawaf",r:"sup",s:"online",c:4}]}];
  const txns = [{tp:"charge",desc:ar?"واتساب":"WhatsApp",amt:-2450,date:"2026-02-20",ref:"TXN-001"},{tp:"payment",desc:ar?"شحن":"Top up",amt:5000,date:"2026-02-18",ref:"TXN-002"},{tp:"charge",desc:"AI",amt:-320,date:"2026-02-17",ref:"TXN-003"},{tp:"refund",desc:ar?"استرداد":"Refund",amt:150,date:"2026-02-15",ref:"TXN-004"},{tp:"charge",desc:ar?"اشتراك":"Sub",amt:-1200,date:"2026-02-01",ref:"TXN-005"}];
  const navItems = [{k:"dashboard",l:t.dashboard,ico:"dashboard"},{k:"inbox",l:t.inbox,ico:"inbox",badge:16},{k:"campaigns",l:t.campaigns,ico:"megaphone"},{k:"contacts",l:t.contacts,ico:"users"},{k:"templates",l:t.templates,ico:"file"},{k:"botBuilder",l:t.botBuilder,ico:"bot"},{k:"aiCenter",l:t.aiCenter,ico:"brain"},{k:"analytics",l:t.analytics,ico:"chart"},{k:"integrations",l:t.integrations,ico:"link"},{k:"teams",l:t.teams,ico:"team"},{k:"billing",l:t.billing,ico:"card"},{k:"settings",l:t.settings,ico:"gear"}];

  /* ═══ DASHBOARD ═══ */
  const DashPg = () => (
    <div style={{padding:"0 24px 24px"}}>
      <div style={{padding:"28px 32px",borderRadius:16,background:GR,marginBottom:24,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
        <h2 style={{color:"#fff",fontSize:24,fontWeight:700,margin:0,position:"relative"}}>{t.welcome}</h2>
        <p style={{color:"rgba(255,255,255,0.85)",margin:"8px 0 0",fontSize:14,position:"relative"}}>{t.tagline}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:24}}>
        {[[t.totalConv,"1,247","+12%",C.pri,[3,5,4,7,6,8,9,7,10,8]],[t.activeAgents,"24","+2",C.ok,[18,20,19,22,21,24,23,24,22,24]],[t.avgResp,"3.2 "+t.min,"-18%",C.info,[5,4.5,4,3.8,3.5,3.2,3.4,3.1,3.2,3.2]],[t.campSent,"38","+5",C.sec,[28,30,25,33,35,32,36,34,37,38]]].map(([lb,vl,ch,cl,data],i)=>(
          <Cd key={i} style={{padding:20}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div><div style={{fontSize:12,color:C.t2,marginBottom:6}}>{lb}</div><div style={{fontSize:26,fontWeight:700}}>{vl}</div></div><span style={{fontSize:12,fontWeight:600,color:C.ok,background:C.ok+"15",padding:"3px 8px",borderRadius:8,height:"fit-content"}}>{ch}</span></div><MiniBar data={data} color={cl}/></Cd>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:16}}>
        <Cd><CdH title={t.recentConv} actL={t.viewAll} onAct={()=>setPage("inbox")}/>
          {convos.slice(0,4).map((c2,i)=>(
            <div key={i} onClick={()=>{setSelConvo(i);setPage("inbox")}} style={{padding:"12px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:i<3?"1px solid "+C.brdL:"none",cursor:"pointer"}}><Av name={c2.name}/><div style={{flex:1,minWidth:0}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,fontSize:13}}>{c2.name}</span><span style={{fontSize:11,color:C.t3}}>{c2.time}</span></div><div style={{fontSize:12,color:C.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{c2.msg}</div></div>{c2.unread>0&&<span style={{background:GR,color:"#fff",fontSize:11,fontWeight:700,borderRadius:10,padding:"2px 8px"}}>{c2.unread}</span>}</div>
          ))}
        </Cd>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Cd style={{padding:20}}><h3 style={{margin:"0 0 14px",fontSize:14.5,fontWeight:600}}>{t.quickAct}</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[[t.newCamp,C.pri,"newCampaign"],[t.newTmpl,C.sec,"newTemplate"],[t.importCont,C.ok,"newContact"],[t.addAgent,C.info,"newTeam"]].map(([l,c2,m],i)=>(
              <button key={i} onClick={()=>openModal(m)} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 14px",borderRadius:10,background:c2+"12",border:"none",cursor:"pointer",fontFamily:ff,fontSize:12.5,fontWeight:600,color:c2}}>{l}</button>
            ))}</div>
          </Cd>
          <Cd style={{padding:20}}><h3 style={{margin:"0 0 14px",fontSize:14.5,fontWeight:600}}>{t.waNum}</h3>
            {["+966 55 123 4567","+966 55 987 6543"].map((n,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:C.inp,marginBottom:i===0?8:0}}>{Ico("phone",16)}<div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{i===0?(ar?"الرئيسي":"Main"):(ar?"المبيعات":"Sales")}</div><div style={{fontSize:12,color:C.t2,direction:"ltr"}}>{n}</div></div><SD color={C.ok} label={t.connected}/></div>
            ))}
          </Cd>
          <Cd style={{padding:20}}><h3 style={{margin:"0 0 14px",fontSize:14.5,fontWeight:600}}>{t.aiUsage}</h3>
            <div style={{display:"flex",alignItems:"center",gap:20}}><Donut segs={[{v:68,c:C.pri},{v:20,c:C.sec},{v:12,c:C.brd}]} size={80} sw={10}/><div style={{flex:1,fontSize:12}}>{[[t.aiSug,"342"],[t.aiAcc,"68%"],[t.aiCred,"1,240"]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:i<2?8:0}}><span style={{color:C.t2}}>{l}</span><span style={{fontWeight:600}}>{v}</span></div>)}</div></div>
          </Cd>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginTop:16}}>
        {[[t.sla,94,C.ok,"94%"],[t.csat,87,C.pri,"4.3"],[t.wallet,null,null,"12,450"]].map(([l,v,cl,disp],i)=>(
          <Cd key={i} style={{padding:20,textAlign:"center"}}><div style={{fontSize:12,color:C.t2,marginBottom:8}}>{l}</div>
            {v!=null?<div style={{position:"relative",display:"inline-block"}}><Donut segs={[{v,c:cl},{v:100-v,c:C.brd}]} size={90} sw={8}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700}}>{disp}</div></div>
            :<div><div style={{fontSize:28,fontWeight:700,marginTop:16,background:GR,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{disp}</div><div style={{fontSize:13,color:C.t2,marginTop:4}}>{t.sar}</div></div>}
          </Cd>
        ))}
      </div>
    </div>
  );

  /* ═══ INBOX ═══ */
  const InboxPg=()=>{
    const [inboxFilter,setInboxFilter]=useState("all");
    const [showDetail,setShowDetail]=useState(true);
    const [aiAgents2,setAiAgents2]=useState({0:true,3:true});
    const [aiSummary2,setAiSummary2]=useState(false);
    const [quickReply2,setQuickReply2]=useState(false);
    const [noteText2,setNoteText2]=useState("");
    const [msgText2,setMsgText2]=useState("");
    const isAiOn=aiAgents2[selConvo]===true;
    const toggleAi2=()=>setAiAgents2({...aiAgents2,[selConvo]:!isAiOn});
    const aiC2="#7C3AED";

    const convosFull=[
      {name:ar?"أحمد":"Ahmed",ph:"+966 55 XXX",email:"ahmed@ex.com",msg:ar?"استفسار عن العروض":"About offers",time:"2:30 PM",unread:3,st:"open",pri2:"high",tag:ar?"مبيعات":"Sales",sentiment:"positive",intent:ar?"استفسار عروض":"Offer inquiry",online:true,orders:5,joined:"2024-06",notes:ar?"عميل VIP":"VIP"},
      {name:ar?"فاطمة":"Fatima",ph:"+966 50 XXX",email:"f@ex.com",msg:ar?"شكراً":"Thanks",time:"1:45 PM",unread:0,st:"solved",pri2:"low",tag:ar?"دعم":"Support",sentiment:"positive",intent:ar?"شكر":"Thanks",online:false,orders:2,joined:"2025-01",notes:""},
      {name:ar?"محمد":"Mohammed",ph:"+966 54 XXX",email:"m@ex.com",msg:ar?"متى التسليم؟":"Delivery?",time:"12:20 PM",unread:1,st:"pending",pri2:"medium",tag:ar?"طلبات":"Orders",sentiment:"negative",intent:ar?"استفسار شحن":"Shipping",online:true,orders:8,joined:"2024-11",notes:ar?"يتابع بشكل متكرر":"Frequent"},
      {name:ar?"نورة":"Noura",ph:"+966 56 XXX",email:"n@ex.com",msg:ar?"مساعدة":"Help",time:"11:05 AM",unread:2,st:"open",pri2:"high",tag:ar?"دعم فني":"Tech",sentiment:"neutral",intent:ar?"تغيير عنوان":"Address change",online:true,orders:1,joined:"2025-02",notes:""},
      {name:"James",ph:"+966 59 XXX",email:"j@ex.com",msg:"Cancel subscription",time:"10:15 AM",unread:1,st:"open",pri2:"medium",tag:ar?"فوترة":"Billing",sentiment:"negative",intent:ar?"إلغاء":"Cancel",online:false,orders:12,joined:"2024-08",notes:"English"},
    ];
    const chatMsgsFull=[
      {from:"customer",text:ar?"السلام عليكم، عندكم عروض رمضان؟":"Hello, Ramadan offers?",time:"2:25 PM"},
      {from:"bot",text:ar?"مرحباً بك! كيف أساعدك؟":"Welcome! How can I help?",time:"2:25 PM"},
      {from:"customer",text:ar?"تفاصيل باقة المؤسسات":"Enterprise details",time:"2:27 PM"},
      {from:"agent",text:ar?"باقة المؤسسات تشمل 50 وكيل + 10 أرقام":"Enterprise: 50 agents + 10 numbers",time:"2:30 PM"},
      {from:"customer",text:ar?"ممتاز! خصم سنوي؟":"Great! Annual discount?",time:"2:32 PM"},
    ];
    const quickRepliesArr=ar?["شكراً لتواصلك!","تم استلام طلبك","هل تحتاج مساعدة أخرى؟","سأحولك لفريق مختص"]:["Thanks!","Request received","Anything else?","Let me transfer you"];
    const cv=convosFull[selConvo]||convosFull[0];
    const sentColor=cv.sentiment==="positive"?C.ok:cv.sentiment==="negative"?C.err:C.warn;
    const sentLabel=cv.sentiment==="positive"?(ar?"إيجابي":"Positive"):cv.sentiment==="negative"?(ar?"سلبي":"Negative"):(ar?"محايد":"Neutral");
    const priColor=cv.pri2==="high"?C.err:cv.pri2==="medium"?C.warn:C.t3;
    const filtConvos=inboxFilter==="all"?convosFull:inboxFilter==="unread"?convosFull.filter(x=>x.unread>0):inboxFilter==="open"?convosFull.filter(x=>x.st==="open"):convosFull;

    return <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 65px)"}}>
      {/* List */}
      <div style={{width:isMob?"100%":320,borderInlineEnd:"1px solid "+(dk?C.brd:"#EAE7E2"),display:"flex",flexDirection:"column",background:C.card}}>
        <div style={{padding:"16px 16px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:12,background:C.inp,marginBottom:12}}>{Ico("search",14)}<input placeholder={t.search} style={{border:"none",background:"none",outline:"none",fontFamily:ff,fontSize:13,color:C.txt,width:"100%"}}/></div>
          <div style={{display:"flex",gap:4}}>{[["all",ar?"الكل":"All"],["unread",ar?"جديدة":"Unread"],["open",ar?"مفتوحة":"Open"]].map(([k,l])=><button key={k} onClick={()=>setInboxFilter(k)} style={{flex:1,padding:"6px 0",borderRadius:8,border:"none",fontFamily:ff,fontSize:11.5,fontWeight:inboxFilter===k?600:400,color:inboxFilter===k?"#fff":C.t2,background:inboxFilter===k?C.pri:"transparent",cursor:"pointer"}}>{l}</button>)}</div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>{filtConvos.map((c2,i)=>{const idx=convosFull.indexOf(c2);return <div key={idx} onClick={()=>setSelConvo(idx)} style={{padding:"14px 16px",display:"flex",alignItems:"flex-start",gap:12,borderBottom:"1px solid "+(dk?C.brd:"#F5F2ED"),cursor:"pointer",background:selConvo===idx?C.pri+"08":"transparent"}}>
          <div style={{position:"relative",flexShrink:0}}><Av name={c2.name} size={44}/>{c2.online&&<div style={{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:6,background:C.wa,border:"2px solid "+C.card}}/>}{aiAgents2[idx]&&<div style={{position:"absolute",top:-2,left:-2,width:18,height:18,borderRadius:5,background:aiC2,border:"2px solid "+C.card,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:8,fontWeight:800}}>AI</span></div>}</div>
          <div style={{flex:1,minWidth:0}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontWeight:600}}>{c2.name}</span><span style={{fontSize:10.5,color:C.t3}}>{c2.time}</span></div><div style={{fontSize:12.5,color:C.t2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c2.msg}</div><div style={{display:"flex",gap:5,marginTop:6}}><Bg color={sC(c2.st)}>{c2.st}</Bg><Bg color={C.pri}>{c2.tag}</Bg></div></div>
          {c2.unread>0&&<span style={{background:C.pri,color:"#fff",fontSize:10.5,fontWeight:700,borderRadius:10,padding:"2px 7px"}}>{c2.unread}</span>}
        </div>;})}</div>
        <div style={{padding:"12px 16px",borderTop:"1px solid "+(dk?C.brd:"#EAE7E2"),fontSize:12,color:C.t2,display:"flex",justifyContent:"space-between"}}><span>{filtConvos.length} {ar?"محادثة":"conv"}</span><span style={{color:C.ok,fontWeight:600}}>{convosFull.filter(x=>x.online).length} {ar?"متصل":"online"}</span></div>
      </div>

      {/* Chat */}
      <div style={{flex:1,display:"flex",flexDirection:"column",background:dk?"#0A0C14":"#F5F3EF",minWidth:0}}>
        <div style={{padding:"12px 22px",background:C.card,borderBottom:"1px solid "+(dk?C.brd:"#EAE7E2"),display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:C.shadow,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}><div style={{position:"relative"}}><Av name={cv.name} size={42} solid/>{cv.online&&<div style={{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:6,background:C.wa,border:"2px solid "+C.card}}/>}</div><div><div style={{fontWeight:600,fontSize:14.5}}>{cv.name}</div><div style={{fontSize:11.5,color:C.t2}}>{cv.ph}</div></div></div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,background:sentColor+"12",fontSize:11,fontWeight:600,color:sentColor}}><span style={{width:6,height:6,borderRadius:3,background:sentColor}}/>{sentLabel}</div>
            <div onClick={toggleAi2} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,background:isAiOn?aiC2+"15":C.inp,border:isAiOn?"1.5px solid "+aiC2:"1.5px solid "+(dk?C.brd:"#D5D2CC"),cursor:"pointer"}}><div style={{width:8,height:8,borderRadius:4,background:isAiOn?aiC2:C.t3}}/><span style={{fontSize:11.5,fontWeight:600,color:isAiOn?aiC2:C.t2}}>{isAiOn?(ar?"وكيل AI نشط":"AI ON"):(ar?"وكيل AI متوقف":"AI OFF")}</span></div>
            {isAiOn&&<Btn outline small style={{color:aiC2,borderColor:aiC2}} onClick={()=>{toggleAi2();showToast(ar?"تم الاستلام ✓":"Taken over ✓")}}>{Ico("users",13)} {ar?"استلام":"Take Over"}</Btn>}
            {!isAiOn&&<Btn outline small onClick={()=>showToast("✓")}>{ar?"إسناد":"Assign"}</Btn>}
            <Btn primary small onClick={()=>showToast(ar?"تم ✓":"Done ✓")}>{ar?"حل":"Resolve"}</Btn>
            <button onClick={()=>setShowDetail(!showDetail)} style={{width:34,height:34,borderRadius:8,border:"1.5px solid "+(dk?C.brd:"#D5D2CC"),background:"transparent",color:showDetail?C.pri:C.t2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("users",15)}</button>
          </div>
        </div>

        <div style={{padding:"8px 22px",background:isAiOn?(dk?"#1a1030":"#F5F0FF"):(dk?"#1a1a30":"#FFF8F0"),borderBottom:"1px solid "+(dk?C.brd:isAiOn?"#E0D4F5":"#F0E8DD"),display:"flex",alignItems:"center",gap:10,fontSize:12.5}}>
          {isAiOn&&<div style={{width:28,height:28,borderRadius:8,background:aiC2+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("bot",14)}</div>}
          {isAiOn&&<span style={{fontWeight:600,color:aiC2}}>{ar?"وكيل AI يدير المحادثة":"AI Agent handling"}</span>}
          {isAiOn&&<span style={{marginInlineStart:"auto",fontSize:11.5,color:C.t2}}>{ar?"هدف:":"Intent:"} <span style={{fontWeight:600,color:C.pri}}>{cv.intent}</span></span>}
          {!isAiOn&&<div style={{width:28,height:28,borderRadius:8,background:C.pri+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("brain",14)}</div>}
          {!isAiOn&&<span style={{color:C.t2}}>{ar?"هدف:":"Intent:"}</span>}
          {!isAiOn&&<span style={{fontWeight:600,color:C.pri}}>{cv.intent}</span>}
          {!isAiOn&&<span style={{marginInlineStart:"auto"}}><Bg color={priColor}>{cv.pri2}</Bg></span>}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:22}}>{chatMsgsFull.map((m,i)=>{const cu=m.from==="customer",bo=m.from==="bot";return <div key={i} style={{display:"flex",justifyContent:cu?(rtl?"flex-end":"flex-start"):(rtl?"flex-start":"flex-end"),marginBottom:14}}><div style={{maxWidth:"65%",padding:"12px 16px",borderRadius:16,background:cu?C.card:bo?C.wa+"12":C.pri,color:(!cu&&!bo)?"#fff":C.txt,border:cu?"1px solid "+(dk?C.brd:"#E8E5E0"):"none",boxShadow:cu?C.shadow:"none"}}>{bo&&<div style={{fontSize:10.5,fontWeight:600,color:C.wa,marginBottom:5,display:"flex",alignItems:"center",gap:4}}>{Ico("bot",12)} Bot</div>}<div style={{fontSize:13.5,lineHeight:1.7}}>{m.text}</div><div style={{fontSize:10,marginTop:5,display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end",color:(!cu&&!bo)?"rgba(255,255,255,0.7)":C.t3}}>{m.time}{!cu&&<span style={{color:C.info}}>{Ico("dcheck",10)}</span>}</div></div></div>;})}</div>

        {isAiOn&&<div style={{margin:"0 22px 10px",borderRadius:14,background:dk?"#1a1030":"#F8F4FF",border:"1.5px solid "+(dk?"#2D2060":"#D4C4F0"),overflow:"hidden"}}><div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:12,background:aiC2,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{Ico("bot",20)}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13.5,color:aiC2}}>{ar?"وكيل الذكاء الاصطناعي":"AI Agent"}</div><div style={{fontSize:12,color:C.t2,marginTop:2}}>{ar?"يرد تلقائياً باستخدام قاعدة المعرفة":"Auto-responding via knowledge base"}</div></div><div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{width:10,height:10,borderRadius:5,background:aiC2,boxShadow:"0 0 8px "+aiC2+"80"}}/><span style={{fontSize:10,color:aiC2,fontWeight:600}}>{ar?"نشط":"Active"}</span></div></div><div style={{padding:"10px 18px",borderTop:"1px solid "+(dk?"#2D2060":"#E8DDF5"),display:"flex",gap:8,flexWrap:"wrap"}}>{[[ar?"الثقة: 94%":"Conf: 94%",aiC2],[ar?"الردود: 3":"Replies: 3",C.ok],[ar?"المعرفة: متصلة":"KB: On",C.ok]].map(([l,clr],i)=><span key={i} style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:clr+"12",color:clr,fontWeight:600}}>{l}</span>)}</div><div style={{padding:"10px 18px",borderTop:"1px solid "+(dk?"#2D2060":"#E8DDF5")}}><button onClick={toggleAi2} style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid "+aiC2,background:"transparent",fontFamily:ff,fontSize:12.5,fontWeight:600,color:aiC2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{Ico("users",14)} {ar?"استلام المحادثة":"Take Over"}</button></div></div>}

        {quickReply2&&<div style={{margin:"0 22px 10px",padding:"10px 16px",borderRadius:14,background:C.card,border:"1px solid "+(dk?C.brd:"#EAE7E2"),boxShadow:C.shadow}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:12.5,fontWeight:600}}>{ar?"ردود سريعة":"Quick Replies"}</span><button onClick={()=>setQuickReply2(false)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}>{Ico("x",14)}</button></div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{quickRepliesArr.map((r,i)=><button key={i} onClick={()=>{setMsgText2(r);setQuickReply2(false)}} style={{padding:"6px 12px",borderRadius:8,border:"1px solid "+(dk?C.brd:"#E0DDD8"),background:"transparent",fontFamily:ff,fontSize:12,color:C.txt,cursor:"pointer"}}>{r}</button>)}</div></div>}

        <div style={{padding:"14px 22px",background:C.card,borderTop:"1px solid "+(dk?C.brd:"#EAE7E2")}}>
          {isAiOn&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderRadius:12,background:dk?"#1a1030":"#F8F4FF",border:"1px solid "+(dk?"#2D2060":"#D4C4F0"),marginBottom:10}}><div style={{width:8,height:8,borderRadius:4,background:aiC2,boxShadow:"0 0 6px "+aiC2+"80"}}/><span style={{fontSize:12.5,color:aiC2,fontWeight:600,flex:1}}>{ar?"وكيل AI نشط":"AI Agent active"}</span><button onClick={toggleAi2} style={{padding:"6px 14px",borderRadius:8,background:aiC2,color:"#fff",border:"none",fontFamily:ff,fontSize:12,fontWeight:600,cursor:"pointer"}}>{ar?"استلام":"Take Over"}</button></div>}
          <div style={{display:"flex",alignItems:"flex-end",gap:10,opacity:isAiOn?0.4:1,pointerEvents:isAiOn?"none":"auto"}}>
            <div style={{display:"flex",gap:6,paddingBottom:4}}>
              <button style={{width:34,height:34,borderRadius:8,border:"none",background:C.inp,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2}}>{Ico("clip",16)}</button>
              <button style={{width:34,height:34,borderRadius:8,border:"none",background:C.inp,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.t2}}>{Ico("smile",16)}</button>
              <button onClick={()=>setQuickReply2(!quickReply2)} style={{width:34,height:34,borderRadius:8,border:"none",background:quickReply2?C.pri+"15":C.inp,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:quickReply2?C.pri:C.t2}}>{Ico("bookmark",16)}</button>
              <button onClick={toggleAi2} style={{width:34,height:34,borderRadius:8,border:isAiOn?"1.5px solid "+aiC2:"none",background:isAiOn?aiC2+"15":C.inp,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:isAiOn?aiC2:C.t2}}>{Ico("bot",16)}</button>
            </div>
            <div style={{flex:1,padding:"10px 16px",borderRadius:14,background:C.inp}}><input value={msgText2} onChange={e=>setMsgText2(e.target.value)} placeholder={ar?"اكتب رسالة...":"Type..."} style={{border:"none",background:"none",outline:"none",fontFamily:ff,fontSize:13.5,color:C.txt,width:"100%"}}/></div>
            <button onClick={()=>{if(msgText2){showToast("✓");setMsgText2("")}}} style={{width:42,height:42,borderRadius:12,background:msgText2?C.wa:C.inp,border:"none",cursor:"pointer",color:msgText2?"#fff":C.t3,display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("send",18)}</button>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {showDetail&&!isMob&&!isTab&&<div style={{width:300,borderInlineStart:"1px solid "+(dk?C.brd:"#EAE7E2"),background:C.card,overflowY:"auto"}}>
        <div style={{padding:22,textAlign:"center",borderBottom:"1px solid "+(dk?C.brd:"#F0EDE8")}}><Av name={cv.name} size={64} solid/><div style={{fontWeight:700,fontSize:16,marginTop:12}}>{cv.name}</div><div style={{fontSize:12.5,color:C.t2,marginTop:4}}>{cv.ph}</div><div style={{fontSize:12,color:C.t3,marginTop:2}}>{cv.email}</div><div style={{display:"flex",justifyContent:"center",gap:6,marginTop:12}}><Bg color={C.pri}>{cv.tag}</Bg></div></div>
        <div style={{padding:"16px 20px",borderBottom:"1px solid "+(dk?C.brd:"#F0EDE8")}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:6}}>{Ico("bot",14)}<span style={{fontSize:12.5,fontWeight:600}}>{ar?"وكيل AI":"AI Agent"}</span></div><Toggle on={isAiOn} onToggle={toggleAi2}/></div><div style={{padding:"10px 12px",borderRadius:8,background:isAiOn?(dk?"#1a1030":"#F8F4FF"):C.inp,fontSize:12,color:isAiOn?aiC2:C.t2}}>{isAiOn?(ar?"نشط - يرد تلقائياً":"Active"):(ar?"متوقف":"Off")}</div></div>
        <div style={{padding:"16px 20px",borderBottom:"1px solid "+(dk?C.brd:"#F0EDE8")}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:12.5,fontWeight:600}}>{ar?"ملخص AI":"AI Summary"}</span><button onClick={()=>setAiSummary2(!aiSummary2)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:11.5,fontWeight:600,cursor:"pointer"}}>{aiSummary2?(ar?"إخفاء":"Hide"):(ar?"عرض":"Show")}</button></div>{aiSummary2&&<div style={{padding:"10px 12px",borderRadius:8,background:dk?"#1a1a30":"#FFF8F0",fontSize:12.5,lineHeight:1.7,color:C.t2}}>{ar?"يستفسر عن باقة المؤسسات والعروض. مهتم - فرصة بيع عالية.":"Inquiring about Enterprise. High conversion potential."}</div>}</div>
        <div style={{padding:"16px 20px",borderBottom:"1px solid "+(dk?C.brd:"#F0EDE8")}}><div style={{fontSize:12.5,fontWeight:600,marginBottom:10}}>{ar?"معلومات":"Info"}</div>{[[ar?"انضمام":"Joined",cv.joined],[ar?"طلبات":"Orders",cv.orders]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:12.5}}><span style={{color:C.t2}}>{l}</span><span style={{fontWeight:500}}>{v}</span></div>)}</div>
        <div style={{padding:"16px 20px"}}><div style={{fontSize:12.5,fontWeight:600,marginBottom:10}}>{ar?"ملاحظات":"Notes"}</div>{cv.notes&&<div style={{padding:"10px 12px",borderRadius:8,background:C.inp,fontSize:12.5,color:C.t2,marginBottom:10}}>{cv.notes}</div>}<div style={{display:"flex",gap:6}}><input value={noteText2} onChange={e=>setNoteText2(e.target.value)} placeholder={ar?"ملاحظة...":"Note..."} style={{flex:1,padding:"8px 12px",borderRadius:8,background:C.inp,border:"none",fontFamily:ff,fontSize:12.5,color:C.txt,outline:"none"}}/><button onClick={()=>{if(noteText2){showToast("✓");setNoteText2("")}}} style={{padding:"8px 12px",borderRadius:8,background:C.pri,color:"#fff",border:"none",fontFamily:ff,fontSize:12,fontWeight:600,cursor:"pointer"}}>{ar?"حفظ":"Save"}</button></div></div>
      </div>}
    </div>;
  };

  /* CAMPAIGNS - Enhanced with AI & Behavioral Analytics */

  const CampPg=()=>{
    const [cTab,setCTab]=useState("all");
    const [cView,setCView]=useState(null);
    const [aiGen,setAiGen]=useState(false);
    const [abTest,setAbTest]=useState(false);
    const aiC2="#7C3AED";

    const campsFull=[
      {id:0,name:ar?"حملة رمضان":"Ramadan Campaign",st:"active",r:12500,d:96.2,rd:72.1,rp:18.4,cost:3750,roi:"+340%",date:"2025-03-01",tmpl:ar?"عرض رمضان":"Ramadan Offer",seg:ar?"جميع العملاء":"All Customers",schTime:"09:00",
        bhv:{opened:9012,clicked:2300,replied:1450,converted:580,unsubscribed:32},
        segments:[{n:ar?"VIP":"VIP",sent:2500,open:98,click:45,conv:28},{n:ar?"جدد":"New",sent:4000,open:94,click:22,conv:12},{n:ar?"غير نشطين":"Inactive",sent:3000,open:88,click:15,conv:6},{n:ar?"مكررين":"Repeat",sent:3000,open:97,click:38,conv:22}],
        timeline:[{t:"09:00",ev:ar?"بدء الإرسال":"Sending started",v:0},{t:"09:15",ev:ar?"50% تم الإرسال":"50% sent",v:6250},{t:"09:30",ev:ar?"اكتمل الإرسال":"Sending complete",v:12500},{t:"10:00",ev:ar?"ذروة الفتح":"Peak opens",v:7200},{t:"12:00",ev:ar?"ذروة النقر":"Peak clicks",v:1800},{t:"18:00",ev:ar?"أول تحويل":"Conversions peak",v:420}],
        aiInsights:ar?["أفضل وقت إرسال: 9 صباحاً - معدل فتح أعلى 23%","شريحة VIP تحقق 3x معدل تحويل مقارنة بالعملاء الجدد","الرسائل المحتوية على إيموجي تحقق فتح أعلى 18%","اقتراح: إعادة استهداف 3,488 من لم يفتحوا بعد 24 ساعة"]:["Best send time: 9 AM - 23% higher open rate","VIP segment has 3x conversion vs new customers","Messages with emoji get 18% higher opens","Suggest: Retarget 3,488 non-openers after 24h"]},
      {id:1,name:ar?"ترحيب العملاء":"Welcome Series",st:"active",r:850,d:98.5,rd:85.3,rp:42.1,cost:255,roi:"+520%",date:"2025-02-15",tmpl:ar?"ترحيب":"Welcome",seg:ar?"عملاء جدد":"New Customers",schTime:"Auto",
        bhv:{opened:722,clicked:358,replied:210,converted:145,unsubscribed:3},
        segments:[{n:ar?"عضوية مجانية":"Free",sent:500,open:97,click:40,conv:15},{n:ar?"مدفوعة":"Paid",sent:350,open:99,click:52,conv:35}],
        timeline:[],
        aiInsights:ar?["سلسلة الترحيب تحقق أعلى ROI بين جميع الحملات","المتابعة بعد 24 ساعة ترفع التحويل 35%","اقتراح: إضافة خطوة ثالثة بعرض خاص"]:["Welcome series has highest ROI","24h follow-up boosts conversion 35%","Suggest: Add 3rd step with special offer"]},
      {id:2,name:ar?"تذكير الدفع":"Payment Reminder",st:"completed",r:4200,d:97.8,rd:68.4,rp:12.3,cost:1260,roi:"+180%",date:"2025-02-10",tmpl:ar?"تذكير":"Reminder",seg:ar?"متأخرين":"Overdue",schTime:"14:00",
        bhv:{opened:3402,clicked:517,replied:320,converted:890,unsubscribed:8},
        segments:[{n:ar?"30 يوم":"30 days",sent:2000,open:96,click:18,conv:25},{n:ar?"60 يوم":"60 days",sent:1200,open:94,click:10,conv:15},{n:ar?"90+ يوم":"90+ days",sent:1000,open:88,click:5,conv:8}],
        timeline:[],
        aiInsights:ar?["التذكير الثاني يحقق 2x تحويل أكثر من الأول","أيام الأحد أفضل وقت لتذكير الدفع","اقتراح: تقديم خصم 10% للمتأخرين 90+ يوم"]:["2nd reminder gets 2x more conversions","Sundays best for payment reminders","Suggest: Offer 10% discount for 90+ days overdue"]},
      {id:3,name:ar?"عرض نهاية الأسبوع":"Weekend Flash",st:"scheduled",r:8000,d:0,rd:0,rp:0,cost:2400,roi:"-",date:"2025-03-07",tmpl:ar?"عرض":"Offer",seg:ar?"نشطون":"Active",schTime:"10:00",
        bhv:{opened:0,clicked:0,replied:0,converted:0,unsubscribed:0},
        segments:[{n:ar?"نشطون":"Active",sent:8000,open:0,click:0,conv:0}],
        timeline:[],
        aiInsights:ar?["بناءً على البيانات: الجمعة 10 صباحاً أفضل وقت لهذه الشريحة","اقتراح: A/B اختبار بين عرض 20% vs هدية مجانية","الشريحة المستهدفة لديها معدل فتح تاريخي 94%","اقتراح: إضافة CTA واضح في أول سطرين"]:["Data suggests: Friday 10 AM best for this segment","Suggest: A/B test 20% off vs free gift","Target segment has 94% historical open rate","Suggest: Add clear CTA in first 2 lines"]},
      {id:4,name:ar?"سلة متروكة":"Abandoned Cart",st:"active",r:1630,d:95.1,rd:61.2,rp:28.7,cost:489,roi:"+680%",date:"2025-02-20",tmpl:ar?"سلة":"Cart",seg:ar?"سلة متروكة":"Abandoned",schTime:"Auto +2h",
        bhv:{opened:1378,clicked:468,replied:245,converted:312,unsubscribed:5},
        segments:[{n:ar?"أقل من 200 ر.س":"<200 SAR",sent:800,open:93,click:25,conv:15},{n:ar?"200-500 ر.س":"200-500",sent:530,open:96,click:32,conv:22},{n:ar?"500+ ر.س":"500+",sent:300,open:98,click:42,conv:35}],
        timeline:[],
        aiInsights:ar?["السلات فوق 500 ر.س تحقق أعلى معدل تحويل (35%)","التذكير بعد ساعتين أفضل من 24 ساعة بـ 45%","اقتراح: إضافة صورة المنتج في الرسالة يرفع النقر 28%","حملة السلة المتروكة تحقق أعلى ROI"]:["Carts >500 SAR have highest conversion (35%)","2h reminder 45% better than 24h","Suggest: Adding product image boosts clicks 28%","Abandoned cart has highest ROI"]},
    ];

    const overviewStats=[
      [ar?"نشطة":"Active","3",C.ok,"megaphone"],
      [ar?"مكتملة":"Done","18",C.info,"check"],
      [ar?"مجدولة":"Scheduled","3",C.warn,"bookmark"],
      [ar?"إجمالي ROI":"Total ROI","+320%",C.ok,"chart"],
      [ar?"معدل الفتح":"Avg Open","92.4%",C.pri,"msg"],
      [ar?"معدل التحويل":"Conv Rate","18.6%",aiC2,"target"],
    ];

    /* Detail View */
    if(cView!==null){
      const cp=campsFull.find(x=>x.id===cView);
      if(!cp)return null;
      const bhv=cp.bhv;
      const total=cp.r;
      const funnelData=[
        {l:ar?"تم الإرسال":"Sent",v:total,c:C.t2},
        {l:ar?"تم الفتح":"Opened",v:bhv.opened,c:C.pri},
        {l:ar?"نقر":"Clicked",v:bhv.clicked,c:C.info},
        {l:ar?"رد":"Replied",v:bhv.replied,c:C.sec},
        {l:ar?"تحويل":"Converted",v:bhv.converted,c:C.ok},
      ];
      const maxFunnel=Math.max(...funnelData.map(x=>x.v),1);
      return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
        <button onClick={()=>setCView(null)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:18,display:"flex",alignItems:"center",gap:4}}>{Ico("x",14)} {ar?"العودة":"Back"}</button>

        {/* Header */}
        <Cd style={{padding:24,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div><h2 style={{margin:"0 0 6px",fontSize:22,fontWeight:700}}>{cp.name}</h2><div style={{display:"flex",gap:6,alignItems:"center"}}><Bg color={sC(cp.st)}>{cp.st}</Bg><span style={{fontSize:12.5,color:C.t2}}>{cp.date}</span><span style={{fontSize:12.5,color:C.t2}}>{cp.seg}</span></div></div>
            <div style={{display:"flex",gap:8}}><Btn outline small>CSV</Btn><Btn outline small>{ar?"تكرار":"Duplicate"}</Btn>{cp.st==="scheduled"&&<Btn primary small>{ar?"تعديل":"Edit"}</Btn>}</div>
          </div>
        </Cd>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
          {[[ar?"المستلمون":"Recipients",total.toLocaleString(),C.pri],[ar?"التسليم":"Delivered",cp.d+"%",C.ok],[ar?"الفتح":"Opens",bhv.opened?((bhv.opened/total*100).toFixed(1)+"%"):"—",C.pri],[ar?"النقر":"Clicks",bhv.clicked?((bhv.clicked/total*100).toFixed(1)+"%"):"—",C.info],[ar?"الرد":"Replies",bhv.replied?((bhv.replied/total*100).toFixed(1)+"%"):"—",C.sec],[ar?"التحويل":"Conv",bhv.converted?((bhv.converted/total*100).toFixed(1)+"%"):"—",C.ok],[ar?"التكلفة":"Cost",cp.cost.toLocaleString()+" "+(ar?"ر.س":"SAR"),C.err],["ROI",cp.roi,C.ok]].map(([l,v,clr],i)=><Cd key={i} style={{padding:"14px 18px"}}><div style={{fontSize:11.5,color:C.t2,marginBottom:4}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:clr}}>{v}</div></Cd>)}
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:20,marginBottom:20}}>
          {/* Funnel */}
          <Cd style={{padding:22}}>
            <h3 style={{margin:"0 0 18px",fontSize:15,fontWeight:700}}>{ar?"قمع السلوك":"Behavior Funnel"}</h3>
            {funnelData.map((f,i)=><div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:4}}><span style={{color:C.t2}}>{f.l}</span><span style={{fontWeight:600}}>{f.v.toLocaleString()} <span style={{color:C.t3,fontWeight:400}}>({total>0?(f.v/total*100).toFixed(1):0}%)</span></span></div>
              <div style={{height:10,borderRadius:5,background:dk?C.brd:"#F0EDE8",overflow:"hidden"}}><div style={{height:"100%",borderRadius:5,background:f.c,width:(f.v/maxFunnel*100)+"%",transition:"width 0.5s"}}/></div>
            </div>)}
            {bhv.unsubscribed>0&&<div style={{marginTop:8,fontSize:12,color:C.err}}>{Ico("x",12)} {bhv.unsubscribed} {ar?"إلغاء اشتراك":"unsubscribed"} ({(bhv.unsubscribed/total*100).toFixed(2)}%)</div>}
          </Cd>

          {/* Segment Performance */}
          <Cd style={{padding:22}}>
            <h3 style={{margin:"0 0 18px",fontSize:15,fontWeight:700}}>{ar?"أداء الشرائح":"Segment Performance"}</h3>
            <Tbl h={[ar?"الشريحة":"Segment",ar?"أرسل":"Sent",ar?"فتح":"Open",ar?"نقر":"Click",ar?"تحويل":"Conv"]} rows={cp.segments.map(s=>[<span style={{fontWeight:600}}>{s.n}</span>,s.sent.toLocaleString(),<span style={{color:s.open>95?C.ok:s.open>90?C.warn:C.err}}>{s.open}%</span>,<span style={{color:s.click>30?C.ok:s.click>20?C.warn:C.err}}>{s.click}%</span>,<span style={{fontWeight:600,color:s.conv>20?C.ok:s.conv>10?C.warn:C.err}}>{s.conv}%</span>])}/>
          </Cd>
        </div>

        {/* AI Insights */}
        <Cd style={{padding:22,marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><div style={{width:32,height:32,borderRadius:10,background:aiC2+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("brain",16)}</div><h3 style={{margin:0,fontSize:15,fontWeight:700,color:aiC2}}>AI {ar?"رؤى وتوصيات":"Insights & Recommendations"}</h3></div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:10}}>
            {cp.aiInsights.map((ins,i)=><div key={i} style={{padding:"12px 16px",borderRadius:12,background:dk?"#1a1030":"#F8F4FF",border:"1px solid "+(dk?"#2D2060":"#E8DDF5"),fontSize:12.5,lineHeight:1.6,display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{color:aiC2,fontWeight:700,fontSize:14,flexShrink:0}}>{i<2?"💡":"🎯"}</span>
              <span>{ins}</span>
            </div>)}
          </div>
          {cp.st!=="completed"&&<div style={{marginTop:14,display:"flex",gap:8}}>
            <Btn small style={{background:aiC2,color:"#fff"}} onClick={()=>showToast("✓")}>{Ico("zap",13)} {ar?"تطبيق التوصيات":"Apply Suggestions"}</Btn>
            <Btn small outline onClick={()=>showToast("✓")}>{ar?"إعادة استهداف":"Retarget Non-openers"}</Btn>
          </div>}
        </Cd>

        {/* Timeline */}
        {cp.timeline.length>0&&<Cd style={{padding:22}}>
          <h3 style={{margin:"0 0 18px",fontSize:15,fontWeight:700}}>{ar?"الجدول الزمني":"Timeline"}</h3>
          <div style={{position:"relative",paddingInlineStart:20}}>
            <div style={{position:"absolute",top:4,bottom:4,[rtl?"right":"left"]:7,width:2,background:dk?C.brd:"#E8E5E0"}}/>
            {cp.timeline.map((t,i)=><div key={i} style={{display:"flex",gap:14,marginBottom:16,position:"relative"}}>
              <div style={{width:16,height:16,borderRadius:8,background:i===cp.timeline.length-1?C.ok:C.pri,border:"3px solid "+(dk?"#1A1A2E":"#FFF"),position:"absolute",[rtl?"right":"left"]:-1,top:2,zIndex:1}}/>
              <div style={{paddingInlineStart:20}}><div style={{fontWeight:600,fontSize:13}}>{t.ev}</div><div style={{fontSize:12,color:C.t2,marginTop:2}}>{t.t} — {t.v.toLocaleString()}</div></div>
            </div>)}
          </div>
        </Cd>}
      </div>;
    }

    /* AI Campaign Generator */
    if(aiGen){
      return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
        <button onClick={()=>setAiGen(false)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:18}}>{ar?"← العودة":"← Back"}</button>
        <Cd style={{padding:28}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}><div style={{width:44,height:44,borderRadius:14,background:aiC2,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{Ico("brain",22)}</div><div><h2 style={{margin:0,fontSize:20,fontWeight:700,color:aiC2}}>AI {ar?"منشئ الحملات":"Campaign Builder"}</h2><p style={{margin:"4px 0 0",fontSize:13,color:C.t2}}>{ar?"أنشئ حملة ذكية بناءً على سلوك عملائك":"Build smart campaigns based on customer behavior"}</p></div></div>

          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:16,marginBottom:24}}>
            {[[ar?"🎯 إعادة استهداف":"🎯 Retarget",ar?"استهدف من لم يفتحوا آخر حملة":"Target non-openers from last campaign"],[ar?"🛒 سلة متروكة":"🛒 Abandoned Cart",ar?"ذكّر العملاء بسلاتهم المتروكة":"Remind customers about their carts"],[ar?"🎂 مناسبات":"🎂 Occasions",ar?"حملة تلقائية في أعياد الميلاد":"Auto birthday campaigns"],[ar?"📈 رفع المبيعات":"📈 Upsell",ar?"اقترح منتجات بناءً على المشتريات":"Suggest products based on purchases"],[ar?"😴 إعادة تنشيط":"😴 Win-back",ar?"أعد تنشيط العملاء غير النشطين":"Re-engage inactive customers"],[ar?"⭐ ولاء":"⭐ Loyalty",ar?"كافئ أفضل عملائك":"Reward your best customers"]].map(([title,desc],i)=><div key={i} onClick={()=>{setAiGen(false);openModal("newCampaign");showToast(ar?"تم إنشاء مسودة AI ✓":"AI draft created ✓")}} style={{padding:18,borderRadius:14,background:dk?"#1a1030":"#F8F4FF",border:"1.5px solid "+(dk?"#2D2060":"#E0D4F5"),cursor:"pointer"}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>{title}</div>
              <div style={{fontSize:12.5,color:C.t2,lineHeight:1.5}}>{desc}</div>
            </div>)}
          </div>

          <div style={{padding:18,borderRadius:14,background:dk?"#0F0F17":"#F8F6F2",border:"1px solid "+(dk?C.brd:"#EAE7E2")}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>{ar?"أو صِف حملتك وسيُنشئها AI":"Or describe your campaign and AI will build it"}</div>
            <div style={{display:"flex",gap:8}}><input placeholder={ar?"مثال: حملة خصم 30% لعملاء لم يشتروا منذ 3 أشهر":"e.g. 30% off campaign for customers inactive 3 months"} style={{flex:1,padding:"11px 16px",borderRadius:12,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:ff,fontSize:13,color:C.txt,outline:"none"}}/><Btn primary style={{background:aiC2}} onClick={()=>{setAiGen(false);openModal("newCampaign");showToast("✓")}}>{Ico("zap",14)} {ar?"إنشاء":"Generate"}</Btn></div>
          </div>
        </Cd>
      </div>;
    }

    /* Main List View */
    return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
      <div style={{marginBottom:8}}><h2 style={{fontSize:22,fontWeight:700,margin:0}}>{t.campaigns}</h2><p style={{fontSize:13.5,color:C.t2,margin:"6px 0 20px"}}>{ar?"إنشاء وإدارة حملات واتساب التسويقية":"Create and manage WhatsApp marketing campaigns"}</p></div>

      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:20}}>
        <Btn outline style={{color:aiC2,borderColor:aiC2}} onClick={()=>setAiGen(true)}>{Ico("brain",14)} AI {ar?"منشئ الحملات":"Campaign Builder"}</Btn>
        <Btn primary onClick={()=>openModal("newCampaign")}>+ {ar?"إنشاء حملة":"Create"}</Btn>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {overviewStats.map(([l,v,clr,ic],i)=><Cd key={i} style={{padding:"14px 18px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:32,height:32,borderRadius:8,background:clr+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico(ic,16)}</div><span style={{fontSize:11.5,color:C.t2}}>{l}</span></div><div style={{fontSize:22,fontWeight:700,color:clr}}>{v}</div></Cd>)}
      </div>

      {/* Tabs + Table */}
      <Cd>
        <div style={{padding:"16px 22px",borderBottom:"1px solid "+(dk?C.brd:"#EAE7E2"),display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <TBr tabs={[{k:"all",l:ar?"الكل":"All"},{k:"active",l:ar?"نشطة":"Active"},{k:"completed",l:ar?"مكتملة":"Done"},{k:"scheduled",l:ar?"مجدولة":"Scheduled"}]} active={cTab} onChange={setCTab}/>
        </div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr>{[ar?"الحملة":"Campaign",ar?"الحالة":"Status",ar?"المستلمون":"Recipients",ar?"الفتح":"Open",ar?"النقر":"Click",ar?"التحويل":"Conv","ROI",ar?"إجراء":"Action"].map((h,i)=><th key={i} style={{padding:"12px 16px",textAlign:"inherit",fontSize:12,fontWeight:600,color:C.t2,borderBottom:"1px solid "+(dk?C.brd:"#EAE7E2"),whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>
          {campsFull.filter(cp=>cTab==="all"||cp.st===cTab).map(cp=><tr key={cp.id} style={{borderBottom:"1px solid "+(dk?C.brd:"#F5F2ED"),cursor:"pointer"}} onClick={()=>setCView(cp.id)}>
            <td style={{padding:"14px 16px"}}><div style={{fontWeight:600,fontSize:13.5}}>{cp.name}</div><div style={{fontSize:11.5,color:C.t3,marginTop:2}}>{cp.date} · {cp.seg}</div></td>
            <td style={{padding:"14px 16px"}}><Bg color={sC(cp.st)}>{cp.st}</Bg></td>
            <td style={{padding:"14px 16px",fontWeight:600}}>{cp.r.toLocaleString()}</td>
            <td style={{padding:"14px 16px"}}><span style={{color:cp.rd>70?C.ok:cp.rd>50?C.warn:C.err,fontWeight:600}}>{cp.rd?cp.rd+"%":"—"}</span></td>
            <td style={{padding:"14px 16px"}}>{cp.rp?cp.rp+"%":"—"}</td>
            <td style={{padding:"14px 16px"}}>{cp.bhv.converted?<span style={{fontWeight:600,color:C.ok}}>{(cp.bhv.converted/cp.r*100).toFixed(1)+"%"}</span>:"—"}</td>
            <td style={{padding:"14px 16px"}}><span style={{fontWeight:700,color:cp.roi.startsWith("+")?C.ok:C.t2}}>{cp.roi}</span></td>
            <td style={{padding:"14px 16px"}}><Btn small primary onClick={e=>{e.stopPropagation();setCView(cp.id)}}>{ar?"تفاصيل":"Details"}</Btn></td>
          </tr>)}
        </tbody></table></div>
      </Cd>

      {/* AI Quick Insight */}
      <Cd style={{padding:20,marginTop:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><div style={{width:28,height:28,borderRadius:8,background:aiC2+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("brain",14)}</div><span style={{fontSize:13,fontWeight:600,color:aiC2}}>AI {ar?"ملخص سريع":"Quick Insights"}</span></div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 1fr",gap:10}}>
          {[
            [ar?"أفضل حملة":"Top Campaign",ar?"سلة متروكة - ROI +680%":"Abandoned Cart - ROI +680%",C.ok],
            [ar?"أفضل وقت إرسال":"Best Send Time",ar?"9:00 صباحاً - أيام الأحد":"9:00 AM - Sundays",C.pri],
            [ar?"توصية":"Recommendation",ar?"إعادة استهداف 3,488 عميل":"Retarget 3,488 customers",aiC2],
          ].map(([t,v,clr],i)=><div key={i} style={{padding:"12px 16px",borderRadius:12,background:clr+"08",border:"1px solid "+clr+"20"}}>
            <div style={{fontSize:11.5,color:C.t2,marginBottom:4}}>{t}</div>
            <div style={{fontSize:13,fontWeight:600,color:clr}}>{v}</div>
          </div>)}
        </div>
      </Cd>
    </div>;
  };

  /* CONTACTS - Enhanced with AI Segmentation & Profiles */

  const ContPg=()=>{
    const [cntTab,setCntTab]=useState("all");
    const [cntView,setCntView]=useState(null);
    const [cntSearch,setCntSearch]=useState("");
    const [selTag,setSelTag]=useState(null);
    const [aiSeg,setAiSeg]=useState(false);
    const aiC2="#7C3AED";

    const contactsFull=[
      {id:0,name:ar?"أحمد العتيبي":"Ahmed Al-Otaibi",ph:"+966 55 123 4567",email:"ahmed@company.sa",avatar:"أ",tags:["VIP",ar?"مبيعات":"Sales"],st:"active",score:92,ltv:"18,450",orders:24,lastOrder:ar?"طلب #1847 - 1,250 ر.س":"Order #1847 - 1,250 SAR",lastActive:"2025-03-02",joined:"2023-06-15",city:ar?"الرياض":"Riyadh",src:ar?"إعلان":"Ad",lang:"ar",
        bhv:{opens:96,clicks:45,replies:38,purchases:24,avgOrder:"768",lastCamp:ar?"حملة رمضان - فتح + نقر":"Ramadan - Opened + Clicked"},
        timeline:[{t:"03-02",ev:ar?"فتح حملة رمضان":"Opened Ramadan campaign",tp:"campaign"},{t:"03-01",ev:ar?"طلب #1847 - 1,250 ر.س":"Order #1847 - 1,250 SAR",tp:"order"},{t:"02-28",ev:ar?"محادثة مع الدعم":"Chat with support",tp:"chat"},{t:"02-25",ev:ar?"نقر رابط عرض":"Clicked offer link",tp:"campaign"},{t:"02-20",ev:ar?"طلب #1820 - 890 ر.س":"Order #1820 - 890 SAR",tp:"order"}],
        aiNotes:ar?["عميل عالي القيمة - معدل شراء شهري","يفضل العروض الحصرية والخصومات","أفضل وقت للتواصل: 10 صباحاً","احتمال الشراء القادم: 87% خلال 7 أيام"]:["High-value customer - monthly buyer","Prefers exclusive offers","Best contact time: 10 AM","Next purchase probability: 87% within 7 days"]},
      {id:1,name:ar?"سارة المالكي":"Sara Al-Malki",ph:"+966 50 456 7890",email:"sara@email.com",avatar:"س",tags:[ar?"دعم":"Support",ar?"نشطة":"Active"],st:"active",score:78,ltv:"6,200",orders:8,lastOrder:ar?"طلب #1830":"Order #1830",lastActive:"2025-03-01",joined:"2024-01-20",city:ar?"جدة":"Jeddah",src:ar?"واتساب":"WhatsApp",lang:"ar",
        bhv:{opens:88,clicks:32,replies:45,purchases:8,avgOrder:"775",lastCamp:ar?"ترحيب - فتح":"Welcome - Opened"},
        timeline:[{t:"03-01",ev:ar?"رد على حملة ترحيب":"Replied to welcome",tp:"campaign"},{t:"02-28",ev:ar?"طلب #1830 - 950 ر.س":"Order #1830",tp:"order"}],
        aiNotes:ar?["عميلة نشطة في المحادثات","معدل رد عالي 45%","مهتمة بالمنتجات الجديدة","اقتراح: إرسال عروض مبكرة"]:["Active in conversations","High reply rate 45%","Interested in new products","Suggest: Send early offers"]},
      {id:2,name:ar?"عبدالله الحربي":"Abdullah Al-Harbi",ph:"+966 54 789 0123",email:"abdullah@work.sa",avatar:"ع",tags:[ar?"جديد":"New"],st:"active",score:45,ltv:"1,200",orders:2,lastOrder:ar?"طلب #1845":"Order #1845",lastActive:"2025-02-28",joined:"2025-01-10",city:ar?"الدمام":"Dammam",src:ar?"بحث":"Search",lang:"ar",
        bhv:{opens:72,clicks:18,replies:12,purchases:2,avgOrder:"600",lastCamp:ar?"لم يفتح آخر حملة":"Didn't open last campaign"},
        timeline:[{t:"02-28",ev:ar?"طلب #1845":"Order #1845",tp:"order"},{t:"02-15",ev:ar?"انضمام":"Joined",tp:"system"}],
        aiNotes:ar?["عميل جديد - يحتاج رعاية","لم يفتح آخر حملتين","اقتراح: إرسال عرض ترحيبي خاص","احتمال التحول لعميل دائم: 35%"]:["New customer - needs nurturing","Didn't open last 2 campaigns","Suggest: Send special welcome offer","Repeat customer probability: 35%"]},
      {id:3,name:"James Wilson",ph:"+966 59 234 5678",email:"james@corp.com",avatar:"J",tags:["Enterprise",ar?"إنجليزي":"English"],st:"active",score:85,ltv:"42,000",orders:36,lastOrder:"Order #1842",lastActive:"2025-03-02",joined:"2023-02-01",city:ar?"الرياض":"Riyadh",src:"LinkedIn",lang:"en",
        bhv:{opens:94,clicks:52,replies:28,purchases:36,avgOrder:"1,167",lastCamp:"Payment Reminder - Opened + Paid"},
        timeline:[{t:"03-02",ev:"Opened payment reminder",tp:"campaign"},{t:"03-01",ev:"Order #1842 - 2,100 SAR",tp:"order"},{t:"02-25",ev:"Support chat - resolved",tp:"chat"}],
        aiNotes:ar?["عميل مؤسسي عالي القيمة","يفضل التواصل بالإنجليزية","معدل دفع فوري","اقتراح: ترقية للباقة الاحترافية"]:["High-value enterprise customer","Prefers English communication","Prompt payment record","Suggest: Upgrade to premium plan"]},
      {id:4,name:ar?"نورة القحطاني":"Noura Al-Qahtani",ph:"+966 56 012 3456",email:"noura@email.com",avatar:"ن",tags:[ar?"غير نشطة":"Inactive"],st:"inactive",score:22,ltv:"800",orders:1,lastOrder:ar?"طلب #1790":"Order #1790",lastActive:"2024-12-15",joined:"2024-11-01",city:ar?"مكة":"Makkah",src:ar?"إعلان":"Ad",lang:"ar",
        bhv:{opens:40,clicks:5,replies:2,purchases:1,avgOrder:"800",lastCamp:ar?"لم يفتح":"Didn't open"},
        timeline:[{t:"12-15",ev:ar?"آخر نشاط":"Last activity",tp:"system"},{t:"11-15",ev:ar?"طلب #1790":"Order #1790",tp:"order"}],
        aiNotes:ar?["عميلة غير نشطة منذ 3 أشهر","لم تفتح آخر 4 حملات","خطر فقدان العميلة: عالي","اقتراح: حملة إعادة تنشيط مع خصم 20%"]:["Inactive for 3 months","Didn't open last 4 campaigns","Churn risk: High","Suggest: Win-back campaign with 20% off"]},
      {id:5,name:ar?"فهد السبيعي":"Fahad Al-Subaie",ph:"+966 58 345 6789",email:"fahad@shop.sa",avatar:"ف",tags:["VIP",ar?"متكرر":"Repeat"],st:"active",score:88,ltv:"32,600",orders:48,lastOrder:ar?"طلب #1848":"Order #1848",lastActive:"2025-03-02",joined:"2022-09-01",city:ar?"الرياض":"Riyadh",src:ar?"إحالة":"Referral",lang:"ar",
        bhv:{opens:97,clicks:58,replies:42,purchases:48,avgOrder:"679",lastCamp:ar?"رمضان - فتح + شراء":"Ramadan - Opened + Purchased"},
        timeline:[{t:"03-02",ev:ar?"طلب #1848 - 1,400 ر.س":"Order #1848",tp:"order"},{t:"03-01",ev:ar?"فتح + نقر حملة رمضان":"Opened Ramadan campaign",tp:"campaign"}],
        aiNotes:ar?["من أفضل العملاء - 48 طلب","يشتري بشكل أسبوعي","أفضل سفير للعلامة التجارية","اقتراح: برنامج إحالة خاص"]:["Top customer - 48 orders","Weekly buyer","Best brand ambassador","Suggest: Special referral program"]},
    ];

    const allTags=["VIP",ar?"مبيعات":"Sales",ar?"دعم":"Support",ar?"نشطة":"Active",ar?"جديد":"New","Enterprise",ar?"إنجليزي":"English",ar?"غير نشطة":"Inactive",ar?"متكرر":"Repeat"];
    const filtered=contactsFull.filter(ct=>{
      if(cntTab==="active"&&ct.st!=="active")return false;
      if(cntTab==="inactive"&&ct.st!=="inactive")return false;
      if(cntTab==="vip"&&!ct.tags.includes("VIP"))return false;
      if(selTag&&!ct.tags.includes(selTag))return false;
      if(cntSearch&&!ct.name.toLowerCase().includes(cntSearch.toLowerCase())&&!ct.ph.includes(cntSearch))return false;
      return true;
    });

    const scoreColor=(s)=>s>=80?C.ok:s>=50?C.warn:C.err;

    /* Detail View */
    if(cntView!==null){
      const ct=contactsFull.find(x=>x.id===cntView);
      if(!ct)return null;
      const tpColor={campaign:C.pri,order:C.ok,chat:C.info,system:C.t3};
      const tpIcon={campaign:"megaphone",order:"cart",chat:"msg",system:"gear"};
      return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
        <button onClick={()=>setCntView(null)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:18,display:"flex",alignItems:"center",gap:4}}>{Ico("x",14)} {ar?"العودة":"Back"}</button>

        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"2fr 1fr",gap:20}}>
          {/* Main */}
          <div>
            {/* Profile Header */}
            <Cd style={{padding:24,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:18,flexWrap:"wrap"}}>
                <Av name={ct.name} size={64} solid/>
                <div style={{flex:1,minWidth:150}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}><h2 style={{margin:0,fontSize:20,fontWeight:700}}>{ct.name}</h2>{ct.tags.map((t,i)=><Bg key={i} color={t==="VIP"?C.warn:C.pri}>{t}</Bg>)}</div>
                  <div style={{fontSize:13,color:C.t2,display:"flex",flexWrap:"wrap",gap:12}}><span>{ct.ph}</span><span>{ct.email}</span><span>{ct.city}</span></div>
                </div>
                <div style={{textAlign:"center",padding:"10px 18px",borderRadius:12,background:scoreColor(ct.score)+"10",border:"1.5px solid "+scoreColor(ct.score)+"30"}}><div style={{fontSize:28,fontWeight:700,color:scoreColor(ct.score)}}>{ct.score}</div><div style={{fontSize:11,color:C.t2}}>{ar?"نقاط":"Score"}</div></div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}><Btn outline small onClick={()=>{showToast("✓")}}>{Ico("send",13)} {ar?"رسالة":"Message"}</Btn><Btn outline small>{Ico("megaphone",13)} {ar?"إضافة لحملة":"Add to Campaign"}</Btn><Btn outline small>{Ico("tag",13)} {ar?"وسم":"Tag"}</Btn><Btn outline small style={{color:C.err,borderColor:C.err}}>{Ico("lock",13)} {ar?"حظر":"Block"}</Btn></div>
            </Cd>

            {/* Behavioral Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10,marginBottom:16}}>
              {[[ar?"الطلبات":"Orders",ct.orders,C.pri],[ar?"القيمة":"LTV",ct.ltv+" "+(ar?"ر.س":"SAR"),C.ok],[ar?"متوسط":"Avg",ct.bhv.avgOrder+" "+(ar?"ر.س":"SAR"),C.info],[ar?"فتح":"Opens",ct.bhv.opens+"%",C.pri],[ar?"نقر":"Clicks",ct.bhv.clicks+"%",C.sec],[ar?"رد":"Replies",ct.bhv.replies+"%",C.warn]].map(([l,v,clr],i)=><Cd key={i} style={{padding:"12px 14px",textAlign:"center"}}><div style={{fontSize:11,color:C.t2,marginBottom:3}}>{l}</div><div style={{fontSize:16,fontWeight:700,color:clr}}>{v}</div></Cd>)}
            </div>

            {/* Activity Timeline */}
            <Cd style={{padding:22,marginBottom:16}}>
              <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700}}>{ar?"سجل النشاط":"Activity Timeline"}</h3>
              <div style={{position:"relative",paddingInlineStart:24}}>
                <div style={{position:"absolute",top:4,bottom:4,[rtl?"right":"left"]:8,width:2,background:dk?C.brd:"#E8E5E0"}}/>
                {ct.timeline.map((ev,i)=><div key={i} style={{display:"flex",gap:14,marginBottom:16,position:"relative"}}>
                  <div style={{width:20,height:20,borderRadius:10,background:tpColor[ev.tp]||C.t3,border:"3px solid "+(dk?"#1A1A2E":"#FFF"),position:"absolute",[rtl?"right":"left"]:-3,top:0,zIndex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",display:"flex"}}>{Ico(tpIcon[ev.tp]||"gear",9)}</span></div>
                  <div style={{paddingInlineStart:22}}><div style={{fontWeight:600,fontSize:13}}>{ev.ev}</div><div style={{fontSize:11.5,color:C.t3,marginTop:2}}>{ev.t}</div></div>
                </div>)}
              </div>
            </Cd>

            {/* Last Campaign */}
            <Cd style={{padding:18}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:C.pri+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("megaphone",16)}</div><div><div style={{fontSize:12,color:C.t2}}>{ar?"آخر حملة":"Last Campaign"}</div><div style={{fontSize:13,fontWeight:600}}>{ct.bhv.lastCamp}</div></div></div></Cd>
          </div>

          {/* Sidebar */}
          <div>
            {/* AI Insights */}
            <Cd style={{padding:20,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}><div style={{width:28,height:28,borderRadius:8,background:aiC2+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("brain",14)}</div><span style={{fontSize:13,fontWeight:700,color:aiC2}}>AI {ar?"رؤى":"Insights"}</span></div>
              {ct.aiNotes.map((n,i)=><div key={i} style={{padding:"10px 12px",borderRadius:10,background:dk?"#1a1030":"#F8F4FF",marginBottom:6,fontSize:12.5,lineHeight:1.6,display:"flex",gap:8}}><span style={{flexShrink:0}}>{i<2?"💡":"🎯"}</span><span>{n}</span></div>)}
            </Cd>

            {/* Info */}
            <Cd style={{padding:20,marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>{ar?"معلومات":"Details"}</div>
              {[[ar?"الانضمام":"Joined",ct.joined],[ar?"المصدر":"Source",ct.src],[ar?"اللغة":"Language",ct.lang==="ar"?(ar?"عربي":"Arabic"):"English"],[ar?"آخر نشاط":"Last Active",ct.lastActive],[ar?"الحالة":"Status",ct.st==="active"?(ar?"نشط":"Active"):(ar?"غير نشط":"Inactive")]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:12.5}}><span style={{color:C.t2}}>{l}</span><span style={{fontWeight:500}}>{v}</span></div>)}
            </Cd>

            {/* Quick Actions */}
            <Cd style={{padding:20}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:14}}>{ar?"إجراءات":"Actions"}</div>
              {[[ar?"إرسال عرض":"Send Offer",C.pri,"zap"],[ar?"إضافة ملاحظة":"Add Note",C.info,"pencil"],[ar?"تصدير":"Export",C.t2,"file"]].map(([l,clr,ic],i)=><button key={i} onClick={()=>showToast("✓")} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"none",background:"transparent",fontFamily:ff,fontSize:12.5,color:clr,cursor:"pointer",marginBottom:2}}>{Ico(ic,15)} {l}</button>)}
            </Cd>
          </div>
        </div>
      </div>;
    }

    /* AI Smart Segments */
    if(aiSeg){
      return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
        <button onClick={()=>setAiSeg(false)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:18}}>{ar?"← العودة":"← Back"}</button>
        <Cd style={{padding:28}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}><div style={{width:44,height:44,borderRadius:14,background:aiC2,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{Ico("brain",22)}</div><div><h2 style={{margin:0,fontSize:20,fontWeight:700,color:aiC2}}>AI {ar?"شرائح ذكية":"Smart Segments"}</h2><p style={{margin:"4px 0 0",fontSize:13,color:C.t2}}>{ar?"شرائح تلقائية بناءً على سلوك العملاء":"Auto-segments based on customer behavior"}</p></div></div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}>
            {[
              [ar?"🔥 عملاء حارّون":"🔥 Hot Leads",ar?"تفاعلوا مع آخر 3 حملات":"Engaged with last 3 campaigns","342",C.err],
              [ar?"💎 أعلى قيمة":"💎 Highest LTV",ar?"أعلى 10% من حيث القيمة":"Top 10% by lifetime value","248",C.ok],
              [ar?"😴 معرضون للفقدان":"😴 At Risk",ar?"لم يتفاعلوا منذ 30 يوم":"No activity for 30 days","1,245",C.warn],
              [ar?"🛒 مشترون متكررون":"🛒 Repeat Buyers",ar?"3+ طلبات في آخر 3 أشهر":"3+ orders in last 3 months","567",C.pri],
              [ar?"🆕 انضموا مؤخراً":"🆕 Recently Joined",ar?"آخر 30 يوم":"Last 30 days","189",C.info],
              [ar?"📱 يفضلون واتساب":"📱 WhatsApp Lovers",ar?"معدل فتح > 90%":"Open rate > 90%","3,456",C.wa],
              [ar?"💸 سلة متروكة":"💸 Cart Abandoners",ar?"تركوا سلة في آخر 7 أيام":"Abandoned cart in last 7 days","78",C.sec],
              [ar?"⭐ سفراء العلامة":"⭐ Brand Advocates",ar?"أحالوا 3+ عملاء":"Referred 3+ customers","45",C.warn],
            ].map(([title,desc,count,clr],i)=><div key={i} onClick={()=>{setAiSeg(false);showToast(ar?"تم تطبيق الشريحة ✓":"Segment applied ✓")}} style={{padding:18,borderRadius:14,background:clr+"08",border:"1.5px solid "+clr+"20",cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:15,fontWeight:700}}>{title}</span><span style={{fontSize:18,fontWeight:700,color:clr}}>{count}</span></div>
              <div style={{fontSize:12.5,color:C.t2,lineHeight:1.5}}>{desc}</div>
              <div style={{marginTop:10}}><Btn small style={{background:clr,color:"#fff"}} onClick={e=>{e.stopPropagation();showToast("✓")}}>{ar?"إرسال حملة":"Send Campaign"}</Btn></div>
            </div>)}
          </div>
        </Cd>
      </div>;
    }

    /* Main List */
    return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h2 style={{fontSize:22,fontWeight:700,margin:0}}>{t.contacts}</h2><p style={{fontSize:13.5,color:C.t2,margin:"6px 0 0"}}>{ar?"إدارة جهات الاتصال وتحليل سلوك العملاء":"Manage contacts & analyze customer behavior"}</p></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Btn outline style={{color:aiC2,borderColor:aiC2}} onClick={()=>setAiSeg(true)}>{Ico("brain",14)} AI {ar?"شرائح ذكية":"Segments"}</Btn><Btn outline onClick={()=>openModal("importContacts")}>{ar?"استيراد":"Import"}</Btn><Btn outline onClick={()=>openModal("exportData")}>{ar?"تصدير":"Export"}</Btn><Btn primary onClick={()=>openModal("newContact")}>+ {ar?"إضافة":"Add"}</Btn></div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {[[ar?"الإجمالي":"Total","24,856",C.pri,"users"],[ar?"نشطون":"Active","21,340",C.ok,"check"],[ar?"VIP":"VIP","1,248",C.warn,"star"],[ar?"جدد (30 يوم)":"New (30d)","342",C.info,"userPlus"],[ar?"معرضون للفقدان":"At Risk","1,245",C.err,"shield"],[ar?"متوسط النقاط":"Avg Score","72",aiC2,"target"]].map(([l,v,clr,ic],i)=><Cd key={i} style={{padding:"14px 18px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:32,height:32,borderRadius:8,background:clr+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico(ic,16)}</div><span style={{fontSize:11.5,color:C.t2}}>{l}</span></div><div style={{fontSize:22,fontWeight:700,color:clr}}>{v}</div></Cd>)}
      </div>

      {/* Search + Tags */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:12,background:C.inp,flex:1,minWidth:200}}>{Ico("search",14)}<input value={cntSearch} onChange={e=>setCntSearch(e.target.value)} placeholder={ar?"بحث بالاسم أو الرقم...":"Search by name or phone..."} style={{border:"none",background:"none",outline:"none",fontFamily:ff,fontSize:13,color:C.txt,width:"100%"}}/></div>
        <TBr tabs={[{k:"all",l:ar?"الكل":"All"},{k:"active",l:ar?"نشطون":"Active"},{k:"inactive",l:ar?"غير نشطين":"Inactive"},{k:"vip",l:"VIP"}]} active={cntTab} onChange={v=>{setCntTab(v);setSelTag(null)}}/>
      </div>

      {/* Tag Filter */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {allTags.map(t=><button key={t} onClick={()=>setSelTag(selTag===t?null:t)} style={{padding:"4px 12px",borderRadius:8,border:"1px solid "+(selTag===t?C.pri:(dk?C.brd:"#D5D2CC")),background:selTag===t?C.pri+"12":"transparent",fontFamily:ff,fontSize:11.5,color:selTag===t?C.pri:C.t2,cursor:"pointer",fontWeight:selTag===t?600:400}}>{t}</button>)}
      </div>

      {/* Table */}
      <Cd>
        <div style={{padding:"14px 22px",borderBottom:"1px solid "+(dk?C.brd:"#EAE7E2"),display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:600}}>{filtered.length} {ar?"جهة اتصال":"contacts"}</span><Btn small outline>CSV</Btn></div>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr>{[ar?"الاسم":"Name",ar?"النقاط":"Score",ar?"الوسوم":"Tags",ar?"الطلبات":"Orders",ar?"القيمة":"LTV",ar?"آخر نشاط":"Last Active",""].map((h,i)=><th key={i} style={{padding:"12px 16px",textAlign:"inherit",fontSize:12,fontWeight:600,color:C.t2,borderBottom:"1px solid "+(dk?C.brd:"#EAE7E2"),whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>
          {filtered.map(ct=><tr key={ct.id} style={{borderBottom:"1px solid "+(dk?C.brd:"#F5F2ED"),cursor:"pointer"}} onClick={()=>setCntView(ct.id)}>
            <td style={{padding:"14px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><Av name={ct.name} size={36}/><div><div style={{fontWeight:600}}>{ct.name}</div><div style={{fontSize:11.5,color:C.t3}}>{ct.ph}</div></div></div></td>
            <td style={{padding:"14px 16px"}}><div style={{width:36,height:36,borderRadius:10,background:scoreColor(ct.score)+"12",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:scoreColor(ct.score)}}>{ct.score}</div></td>
            <td style={{padding:"14px 16px"}}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{ct.tags.map((t,i)=><Bg key={i} color={t==="VIP"?C.warn:C.pri}>{t}</Bg>)}</div></td>
            <td style={{padding:"14px 16px",fontWeight:600}}>{ct.orders}</td>
            <td style={{padding:"14px 16px",fontWeight:600}}>{ct.ltv} {ar?"ر.س":"SAR"}</td>
            <td style={{padding:"14px 16px",fontSize:12,color:C.t3}}>{ct.lastActive}</td>
            <td style={{padding:"14px 16px"}}><Btn small primary onClick={e=>{e.stopPropagation();setCntView(ct.id)}}>{ar?"عرض":"View"}</Btn></td>
          </tr>)}
        </tbody></table></div>
      </Cd>

      {/* AI Insight Bar */}
      <Cd style={{padding:18,marginTop:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{width:28,height:28,borderRadius:8,background:aiC2+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("brain",14)}</div><span style={{fontSize:13,fontWeight:600,color:aiC2}}>AI {ar?"رؤى العملاء":"Customer Insights"}</span></div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 1fr",gap:10}}>
          {[[ar?"أعلى نمو":"Fastest Growing",ar?"عملاء جدة +28% هذا الشهر":"Jeddah customers +28% this month",C.ok],[ar?"خطر فقدان":"Churn Risk",ar?"1,245 عميل لم يتفاعل منذ 30 يوم":"1,245 inactive for 30 days",C.err],[ar?"فرصة":"Opportunity",ar?"567 مشتري متكرر - برنامج ولاء":"567 repeat buyers - loyalty program",aiC2]].map(([t,v,clr],i)=><div key={i} style={{padding:"12px 16px",borderRadius:12,background:clr+"08",border:"1px solid "+clr+"20"}}><div style={{fontSize:11.5,color:C.t2,marginBottom:4}}>{t}</div><div style={{fontSize:12.5,fontWeight:600,color:clr}}>{v}</div></div>)}
        </div>
      </Cd>
    </div>;
  };

  /* TEMPLATES - Enhanced with AI Generation & Preview */

  const TmplPg=()=>{
    const [tTab,setTTab]=useState("all");
    const [tView,setTView]=useState(null);
    const [tGen,setTGen]=useState(false);
    const [tSearch,setTSearch]=useState("");
    const [tEdit,setTEdit]=useState(null);
    const aiC2="#7C3AED";

    const tmpls=[
      {id:0,name:ar?"ترحيب العملاء":"Welcome Message",cat:"utility",ln:"ar+en",st:"approved",uses:3240,open:94.2,click:38.5,date:"2025-01-15",
        body:ar?"مرحباً {{1}}! 👋\nشكراً لانضمامك.\nنحن سعداء بخدمتك.\n\nللتواصل: {{2}}":"Hi {{1}}! 👋\nThanks for joining.\nWe're happy to serve you.\n\nContact: {{2}}",
        vars:["name","phone"],header:ar?"صورة":"Image",footer:ar?"المدار - CORBIT":"CORBIT",
        btns:[{t:ar?"تصفح المنتجات":"Browse Products",tp:"url"},{t:ar?"تواصل معنا":"Contact Us",tp:"phone"}],
        perf:{sent:3240,delivered:3190,read:3005,replied:1215,failed:50},
        aiScore:92,aiTips:ar?["معدل فتح ممتاز 94%","اقتراح: إضافة عرض ترحيبي يرفع النقر 25%","الإيموجي في البداية يزيد الفتح"]:["Excellent 94% open rate","Suggest: Add welcome offer to boost clicks 25%","Leading emoji increases opens"]},
      {id:1,name:ar?"عرض موسمي":"Seasonal Offer",cat:"marketing",ln:"ar",st:"approved",uses:8500,open:88.1,click:42.3,date:"2025-02-20",
        body:ar?"🎉 عرض خاص لك {{1}}!\n\nخصم {{2}} على جميع المنتجات\nالعرض ساري حتى {{3}}\n\nلا تفوّت الفرصة!":"🎉 Special offer {{1}}!\n\n{{2}} off all products\nValid until {{3}}\n\nDon't miss out!",
        vars:["name","discount","date"],header:ar?"صورة":"Image",footer:ar?"الشروط والأحكام":"Terms apply",
        btns:[{t:ar?"تسوق الآن":"Shop Now",tp:"url"},{t:ar?"شارك مع صديق":"Share",tp:"url"}],
        perf:{sent:8500,delivered:8415,read:7414,replied:3562,failed:85},
        aiScore:88,aiTips:ar?["نسبة نقر عالية 42%","اقتراح: تخصيص العرض حسب سجل الشراء","إضافة عداد تنازلي يزيد التحويل 18%"]:["High 42% click rate","Suggest: Personalize offer by purchase history","Adding countdown increases conversion 18%"]},
      {id:2,name:ar?"تذكير دفع":"Payment Reminder",cat:"utility",ln:"ar+en",st:"approved",uses:4200,open:91.5,click:28.1,date:"2025-02-01",
        body:ar?"مرحباً {{1}}\n\nتذكير بمبلغ مستحق: {{2}} ر.س\nتاريخ الاستحقاق: {{3}}\n\nيرجى السداد لتجنب التأخير.":"Hi {{1}}\n\nPayment due: {{2}} SAR\nDue date: {{3}}\n\nPlease pay to avoid late fees.",
        vars:["name","amount","date"],header:"",footer:"",
        btns:[{t:ar?"ادفع الآن":"Pay Now",tp:"url"}],
        perf:{sent:4200,delivered:4158,read:3803,replied:1050,failed:42},
        aiScore:85,aiTips:ar?["معدل سداد 62% بعد التذكير","اقتراح: تذكير ثانٍ بعد 48 ساعة يرفع السداد 28%","إضافة رابط دفع مباشر"]:["62% payment rate after reminder","Suggest: 2nd reminder after 48h boosts payment 28%","Add direct payment link"]},
      {id:3,name:"OTP",cat:"authentication",ln:"ar+en",st:"approved",uses:15600,open:99.1,click:0,date:"2025-01-01",
        body:ar?"رمز التحقق الخاص بك: {{1}}\n\nصالح لمدة 5 دقائق.\nلا تشارك هذا الرمز.":"Your verification code: {{1}}\n\nValid for 5 minutes.\nDo not share this code.",
        vars:["code"],header:"",footer:"",btns:[],
        perf:{sent:15600,delivered:15580,read:15444,replied:0,failed:20},
        aiScore:98,aiTips:ar?["معدل تسليم 99.9% - ممتاز","لا تغييرات مطلوبة","القالب محسّن بالكامل"]:["99.9% delivery - excellent","No changes needed","Template fully optimized"]},
      {id:4,name:ar?"تأكيد طلب":"Order Confirmation",cat:"utility",ln:"ar",st:"approved",uses:6800,open:96.3,click:34.2,date:"2025-02-10",
        body:ar?"✅ تم تأكيد طلبك {{1}}!\n\nرقم الطلب: {{2}}\nالمبلغ: {{3}} ر.س\nالتوصيل المتوقع: {{4}}\n\nشكراً لثقتك بنا!":"✅ Order confirmed {{1}}!\n\nOrder: {{2}}\nAmount: {{3}} SAR\nDelivery: {{4}}\n\nThank you!",
        vars:["name","order_id","amount","delivery_date"],header:ar?"صورة":"Image",footer:"",
        btns:[{t:ar?"تتبع الطلب":"Track Order",tp:"url"},{t:ar?"تواصل معنا":"Contact",tp:"phone"}],
        perf:{sent:6800,delivered:6750,read:6498,replied:1904,failed:50},
        aiScore:90,aiTips:ar?["نسبة فتح ممتازة 96%","إضافة تفاصيل المنتج ترفع الرضا","اقتراح: إضافة زر تقييم بعد التسليم"]:["Excellent 96% open rate","Product details increase satisfaction","Suggest: Add review button after delivery"]},
      {id:5,name:ar?"استبيان رضا":"Satisfaction Survey",cat:"marketing",ln:"ar",st:"pending",uses:0,open:0,click:0,date:"2025-03-01",
        body:ar?"مرحباً {{1}} 😊\n\nنود معرفة رأيك في تجربتك معنا.\nرأيك يهمنا لتحسين خدماتنا.\n\nشاركنا تقييمك:":"Hi {{1}} 😊\n\nWe'd love your feedback.\nYour opinion helps us improve.\n\nShare your rating:",
        vars:["name"],header:"",footer:"",
        btns:[{t:"⭐⭐⭐⭐⭐",tp:"quick"},{t:"⭐⭐⭐",tp:"quick"},{t:"⭐",tp:"quick"}],
        perf:{sent:0,delivered:0,read:0,replied:0,failed:0},
        aiScore:75,aiTips:ar?["اقتراح: إضافة حافز (خصم 5%) يرفع الاستجابة 40%","تقصير الرسالة يزيد معدل الإكمال","أفضل وقت للإرسال: بعد 24 ساعة من التسليم"]:["Suggest: Adding incentive boosts response 40%","Shorter message increases completion","Best time: 24h after delivery"]},
      {id:6,name:ar?"إشعار شحن":"Shipping Notification",cat:"utility",ln:"ar",st:"rejected",uses:0,open:0,click:0,date:"2025-02-25",
        body:ar?"📦 تم شحن طلبك {{1}}!\n\nرقم التتبع: {{2}}\nالناقل: {{3}}\n\nتتبع طلبك الآن:":"📦 Order shipped {{1}}!\n\nTracking: {{2}}\nCarrier: {{3}}\n\nTrack now:",
        vars:["name","tracking","carrier"],header:"",footer:"",
        btns:[{t:ar?"تتبع":"Track",tp:"url"}],
        perf:{sent:0,delivered:0,read:0,replied:0,failed:0},
        aiScore:60,aiTips:ar?["سبب الرفض: يجب إضافة اسم الشركة في الهيدر","اقتراح: إعادة التقديم مع تعديل الصياغة","إضافة شعار الشركة مطلوب"]:["Rejection: Must add company name in header","Suggest: Resubmit with adjusted wording","Company logo required"]},
    ];

    const catColor={utility:C.info,marketing:C.sec,authentication:C.warn};
    const catLabel={utility:ar?"خدمية":"Utility",marketing:ar?"تسويقية":"Marketing",authentication:ar?"مصادقة":"Auth"};
    const filtered=tmpls.filter(t=>{
      if(tTab!=="all"&&t.st!==tTab)return false;
      if(tSearch&&!t.name.toLowerCase().includes(tSearch.toLowerCase()))return false;
      return true;
    });

    /* Template Detail/Preview */
    if(tView!==null){
      const tp=tmpls.find(x=>x.id===tView);
      if(!tp)return null;
      const pf=tp.perf;
      const total=Math.max(pf.sent,1);
      return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
        <button onClick={()=>setTView(null)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:18,display:"flex",alignItems:"center",gap:4}}>{Ico("x",14)} {ar?"العودة":"Back"}</button>

        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 340px",gap:20}}>
          <div>
            {/* Header */}
            <Cd style={{padding:24,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div><h2 style={{margin:"0 0 6px",fontSize:20,fontWeight:700}}>{tp.name}</h2><div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}><Bg color={catColor[tp.cat]}>{catLabel[tp.cat]}</Bg><Bg color={sC(tp.st)}>{tp.st}</Bg><span style={{fontSize:12.5,color:C.t2}}>{tp.ln}</span><span style={{fontSize:12.5,color:C.t2}}>{tp.date}</span></div></div>
                <div style={{display:"flex",gap:8}}>{tp.st==="rejected"&&<Btn primary small onClick={()=>showToast("✓")}>{ar?"إعادة تقديم":"Resubmit"}</Btn>}{tp.st==="approved"&&<Btn primary small onClick={()=>showToast("✓")}>{ar?"إرسال حملة":"Send Campaign"}</Btn>}<Btn outline small>{ar?"تكرار":"Duplicate"}</Btn><Btn outline small>{ar?"تعديل":"Edit"}</Btn></div>
              </div>
            </Cd>

            {/* Performance */}
            {pf.sent>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10,marginBottom:16}}>
              {[[ar?"أرسل":"Sent",pf.sent,C.t2],[ar?"وصل":"Delivered",pf.delivered,C.ok],[ar?"قُرئ":"Read",pf.read,C.pri],[ar?"رد":"Replied",pf.replied,C.sec],[ar?"فشل":"Failed",pf.failed,C.err]].map(([l,v,clr],i)=><Cd key={i} style={{padding:"12px 14px",textAlign:"center"}}><div style={{fontSize:11,color:C.t2,marginBottom:3}}>{l}</div><div style={{fontSize:16,fontWeight:700,color:clr}}>{v.toLocaleString()}</div><div style={{fontSize:10.5,color:C.t3}}>{pf.sent>0?((v/pf.sent*100).toFixed(1)+"%"):""}</div></Cd>)}
            </div>}

            {/* Usage Stats */}
            {tp.uses>0&&<Cd style={{padding:22,marginBottom:16}}>
              <h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700}}>{ar?"إحصائيات الاستخدام":"Usage Stats"}</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:700,color:C.pri}}>{tp.uses.toLocaleString()}</div><div style={{fontSize:12,color:C.t2}}>{ar?"مرات الاستخدام":"Times Used"}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:700,color:C.ok}}>{tp.open}%</div><div style={{fontSize:12,color:C.t2}}>{ar?"معدل الفتح":"Open Rate"}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:700,color:C.info}}>{tp.click}%</div><div style={{fontSize:12,color:C.t2}}>{ar?"معدل النقر":"Click Rate"}</div></div>
              </div>
            </Cd>}

            {/* Variables */}
            <Cd style={{padding:22,marginBottom:16}}>
              <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:700}}>{ar?"المتغيرات":"Variables"}</h3>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{tp.vars.map((v,i)=><span key={i} style={{padding:"6px 14px",borderRadius:8,background:C.inp,fontSize:13,fontFamily:"monospace"}}>{"{{"}  {i+1}{"}}"}  = {v}</span>)}</div>
            </Cd>

            {/* AI Tips */}
            <Cd style={{padding:22}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:32,height:32,borderRadius:10,background:aiC2+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("brain",16)}</div>
                <h3 style={{margin:0,fontSize:15,fontWeight:700,color:aiC2}}>AI {ar?"تحليل وتوصيات":"Analysis"}</h3>
                <div style={{marginInlineStart:"auto",padding:"4px 12px",borderRadius:8,background:tp.aiScore>=90?C.ok+"15":tp.aiScore>=70?C.warn+"15":C.err+"15"}}><span style={{fontWeight:700,color:tp.aiScore>=90?C.ok:tp.aiScore>=70?C.warn:C.err}}>{tp.aiScore}/100</span></div>
              </div>
              {tp.aiTips.map((tip,i)=><div key={i} style={{padding:"10px 14px",borderRadius:10,background:dk?"#1a1030":"#F8F4FF",marginBottom:6,fontSize:12.5,lineHeight:1.6,display:"flex",gap:8}}><span>{i===0?"✅":"💡"}</span><span>{tip}</span></div>)}
            </Cd>
          </div>

          {/* Phone Preview */}
          <div>
            <div style={{position:"sticky",top:20}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:10,textAlign:"center",color:C.t2}}>{ar?"معاينة واتساب":"WhatsApp Preview"}</div>
              <div style={{width:"100%",maxWidth:320,margin:"0 auto",borderRadius:24,background:dk?"#0B141A":"#E5DDD5",padding:16,border:"8px solid "+(dk?"#222":"#CCC"),position:"relative",minHeight:400}}>
                {/* WA Header */}
                <div style={{background:dk?"#1F2C34":"#075E54",margin:"-16px -16px 16px",padding:"12px 16px",borderRadius:"16px 16px 0 0",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:16,background:"#DDD",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#666"}}>C</div>
                  <div><div style={{color:"#fff",fontSize:13,fontWeight:600}}>CORBIT</div><div style={{color:"rgba(255,255,255,0.7)",fontSize:10}}>{ar?"متصل":"online"}</div></div>
                </div>
                {/* Message bubble */}
                <div style={{background:dk?"#005C4B":"#DCF8C6",borderRadius:"0 12px 12px 12px",padding:"10px 14px",maxWidth:"90%",marginBottom:8,position:"relative"}}>
                  {tp.header&&<div style={{width:"100%",height:120,borderRadius:8,background:dk?"#1a2a30":"#C8E6C9",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",color:dk?"#4a8a6a":"#2E7D32",fontSize:12}}>{tp.header}</div>}
                  <div style={{fontSize:13,lineHeight:1.7,whiteSpace:"pre-line",color:dk?"#E9EDEF":"#111"}}>{tp.body}</div>
                  {tp.footer&&<div style={{fontSize:10,color:dk?"#8696A0":"#667781",marginTop:6}}>{tp.footer}</div>}
                  <div style={{fontSize:9,color:dk?"#8696A0":"#667781",textAlign:"right",marginTop:4}}>10:00 AM ✓✓</div>
                </div>
                {/* Buttons */}
                {tp.btns.length>0&&<div style={{display:"flex",flexDirection:"column",gap:4,maxWidth:"90%"}}>
                  {tp.btns.map((b,i)=><div key={i} style={{background:dk?"#1F2C34":"#FFF",borderRadius:8,padding:"8px 12px",textAlign:"center",fontSize:12,fontWeight:600,color:dk?"#53BDEB":"#0077B6",border:"1px solid "+(dk?"#2A3942":"#E0E0E0")}}>{b.t}</div>)}
                </div>}
              </div>
            </div>
          </div>
        </div>
      </div>;
    }

    /* AI Template Generator */
    if(tGen){
      return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
        <button onClick={()=>setTGen(false)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:18}}>{ar?"← العودة":"← Back"}</button>
        <Cd style={{padding:28}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}><div style={{width:44,height:44,borderRadius:14,background:aiC2,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{Ico("brain",22)}</div><div><h2 style={{margin:0,fontSize:20,fontWeight:700,color:aiC2}}>AI {ar?"منشئ القوالب":"Template Builder"}</h2><p style={{margin:"4px 0 0",fontSize:13,color:C.t2}}>{ar?"أنشئ قوالب واتساب محسّنة تلقائياً":"Create optimized WhatsApp templates with AI"}</p></div></div>

          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 1fr",gap:14,marginBottom:24}}>
            {[[ar?"🛒 تأكيد طلب":"🛒 Order Confirm","utility"],[ar?"📢 عرض تسويقي":"📢 Marketing Offer","marketing"],[ar?"🔔 تذكير":"🔔 Reminder","utility"],[ar?"💳 دفع":"💳 Payment","utility"],[ar?"📦 شحن":"📦 Shipping","utility"],[ar?"⭐ تقييم":"⭐ Review","marketing"],[ar?"🎂 مناسبة":"🎂 Occasion","marketing"],[ar?"🔑 مصادقة":"🔑 Auth","authentication"],[ar?"✍️ مخصص":"✍️ Custom","utility"]].map(([title,cat],i)=><div key={i} onClick={()=>{setTGen(false);openModal("newTemplate");showToast(ar?"تم إنشاء مسودة ✓":"Draft created ✓")}} style={{padding:16,borderRadius:14,background:catColor[cat]+"08",border:"1.5px solid "+catColor[cat]+"25",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:15,fontWeight:700,marginBottom:4}}>{title}</div><div style={{fontSize:11.5,color:C.t2}}>{catLabel[cat]}</div></div>)}
          </div>

          <div style={{padding:18,borderRadius:14,background:dk?"#0F0F17":"#F8F6F2",border:"1px solid "+(dk?C.brd:"#EAE7E2")}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>{ar?"أو صِف القالب":"Or describe your template"}</div>
            <div style={{display:"flex",gap:8}}><input placeholder={ar?"مثال: قالب تأكيد طلب مع رابط تتبع وزر تواصل":"e.g. Order confirmation with tracking link and contact button"} style={{flex:1,padding:"11px 16px",borderRadius:12,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:ff,fontSize:13,color:C.txt,outline:"none"}}/><Btn primary style={{background:aiC2}} onClick={()=>{setTGen(false);openModal("newTemplate");showToast("✓")}}>{Ico("zap",14)} {ar?"إنشاء":"Generate"}</Btn></div>
          </div>
        </Cd>
      </div>;
    }

    /* Main List */
    return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h2 style={{fontSize:22,fontWeight:700,margin:0}}>{t.templates}</h2><p style={{fontSize:13.5,color:C.t2,margin:"6px 0 0"}}>{ar?"تصفح وإنشاء قوالب رسائل واتساب":"Browse and create WhatsApp message templates"}</p></div>
        <div style={{display:"flex",gap:8}}><Btn outline style={{color:aiC2,borderColor:aiC2}} onClick={()=>setTGen(true)}>{Ico("brain",14)} AI {ar?"منشئ":"Builder"}</Btn><Btn primary onClick={()=>openModal("newTemplate")}>+ {ar?"إنشاء":"Create"}</Btn></div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {[[ar?"الإجمالي":"Total",tmpls.length+"",C.pri,"file"],[ar?"موافق عليها":"Approved",tmpls.filter(x=>x.st==="approved").length+"",C.ok,"check"],[ar?"قيد المراجعة":"Pending",tmpls.filter(x=>x.st==="pending").length+"",C.warn,"bookmark"],[ar?"مرفوضة":"Rejected",tmpls.filter(x=>x.st==="rejected").length+"",C.err,"x"],[ar?"الاستخدام":"Total Uses","38,340",C.info,"msg"],[ar?"متوسط الفتح":"Avg Open","93.8%",C.ok,"chart"]].map(([l,v,clr,ic],i)=><Cd key={i} style={{padding:"14px 18px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:32,height:32,borderRadius:8,background:clr+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico(ic,16)}</div><span style={{fontSize:11.5,color:C.t2}}>{l}</span></div><div style={{fontSize:22,fontWeight:700,color:clr}}>{v}</div></Cd>)}
      </div>

      {/* Search + Filter */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:12,background:C.inp,flex:1,minWidth:200}}>{Ico("search",14)}<input value={tSearch} onChange={e=>setTSearch(e.target.value)} placeholder={ar?"بحث...":"Search..."} style={{border:"none",background:"none",outline:"none",fontFamily:ff,fontSize:13,color:C.txt,width:"100%"}}/></div>
        <TBr tabs={[{k:"all",l:ar?"الكل":"All"},{k:"approved",l:ar?"موافق":"Approved"},{k:"pending",l:ar?"معلق":"Pending"},{k:"rejected",l:ar?"مرفوض":"Rejected"}]} active={tTab} onChange={setTTab}/>
      </div>

      {/* Template Cards Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {filtered.map(tp=><Cd key={tp.id} style={{cursor:"pointer"}} onClick={()=>setTView(tp.id)}>
          <div style={{padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div><div style={{fontWeight:700,fontSize:15,marginBottom:6}}>{tp.name}</div><div style={{display:"flex",gap:5}}><Bg color={catColor[tp.cat]}>{catLabel[tp.cat]}</Bg><Bg color={sC(tp.st)}>{tp.st}</Bg><span style={{fontSize:11,color:C.t3}}>{tp.ln}</span></div></div>
              <div style={{padding:"4px 10px",borderRadius:8,background:tp.aiScore>=90?C.ok+"15":tp.aiScore>=70?C.warn+"15":C.err+"15"}}><span style={{fontWeight:700,fontSize:12,color:tp.aiScore>=90?C.ok:tp.aiScore>=70?C.warn:C.err}}>{tp.aiScore}</span></div>
            </div>
            <div style={{padding:"10px 12px",borderRadius:10,background:dk?"#0B141A":"#E5DDD5",marginBottom:12,fontSize:12,lineHeight:1.5,color:dk?"#E9EDEF":"#333",maxHeight:80,overflow:"hidden",whiteSpace:"pre-line"}}>{tp.body.slice(0,120)}...</div>
            {tp.uses>0&&<div style={{display:"flex",gap:12,fontSize:12,color:C.t2}}>
              <span>{ar?"استخدام:":"Used:"} <b style={{color:C.txt}}>{tp.uses.toLocaleString()}</b></span>
              <span>{ar?"فتح:":"Open:"} <b style={{color:C.ok}}>{tp.open}%</b></span>
              <span>{ar?"نقر:":"Click:"} <b style={{color:C.info}}>{tp.click}%</b></span>
            </div>}
            {tp.btns.length>0&&<div style={{display:"flex",gap:6,marginTop:10}}>{tp.btns.slice(0,2).map((b,i)=><span key={i} style={{fontSize:10.5,padding:"3px 8px",borderRadius:6,background:C.inp,color:C.t2}}>{b.t}</span>)}</div>}
          </div>
        </Cd>)}
      </div>
    </div>;
  };

  /* BOT BUILDER - Visual Flow Builder with AI */

  const BotPg=()=>{
    const [bTab,setBTab]=useState("all");
    const [bView,setBView]=useState(null);
    const [bEdit,setBEdit]=useState(null);
    const [selNode,setSelNode]=useState(null);
    const aiC2="#7C3AED";

    const bots=[
      {id:0,name:ar?"بوت ترحيب":"Welcome Bot",st:"published",nodes:8,trig:ar?"مرحبا, السلام":"hello, hi",cv:3240,ai:true,desc:ar?"يرحب بالعملاء الجدد ويوجههم":"Greets new customers and guides them",
        stats:{sessions:3240,completed:2680,dropped:560,avgTime:"45s",satisfaction:4.6},
        flow:[
          {id:"n1",tp:"trigger",label:ar?"بداية":"Start",x:50,y:30,next:["n2"],config:{keywords:ar?"مرحبا, السلام, هلا":"hello, hi, hey"}},
          {id:"n2",tp:"message",label:ar?"ترحيب":"Welcome",x:50,y:120,next:["n3"],config:{text:ar?"مرحباً بك في المدار! 👋\nكيف يمكنني مساعدتك؟":"Welcome to CORBIT! 👋\nHow can I help?"}},
          {id:"n3",tp:"buttons",label:ar?"خيارات":"Options",x:50,y:210,next:["n4","n5","n6"],config:{buttons:[ar?"تصفح المنتجات":"Products",ar?"الدعم الفني":"Support",ar?"تتبع طلب":"Track Order"]}},
          {id:"n4",tp:"message",label:ar?"منتجات":"Products",x:10,y:310,next:["n7"],config:{text:ar?"إليك أحدث منتجاتنا:":"Here are our latest:"}},
          {id:"n5",tp:"ai",label:ar?"دعم AI":"AI Support",x:50,y:310,next:["n8"],config:{text:ar?"وكيل AI يتولى المحادثة":"AI agent handles conversation"}},
          {id:"n6",tp:"api",label:ar?"API طلب":"Order API",x:90,y:310,next:["n7"],config:{text:ar?"جلب بيانات الطلب من API":"Fetch order from API"}},
          {id:"n7",tp:"message",label:ar?"رد":"Reply",x:30,y:400,next:["n8"],config:{text:ar?"هل تحتاج مساعدة أخرى؟":"Anything else?"}},
          {id:"n8",tp:"end",label:ar?"نهاية":"End",x:50,y:480,next:[],config:{}},
        ]},
      {id:1,name:ar?"بوت طلبات":"Order Bot",st:"published",nodes:12,trig:ar?"طلب, شراء, أريد":"order, buy",cv:1856,ai:true,desc:ar?"يساعد العملاء في إتمام الطلبات":"Helps customers complete orders",
        stats:{sessions:1856,completed:1520,dropped:336,avgTime:"2m 15s",satisfaction:4.3},
        flow:[
          {id:"n1",tp:"trigger",label:ar?"بداية":"Start",x:50,y:30,next:["n2"],config:{keywords:ar?"طلب, شراء":"order, buy"}},
          {id:"n2",tp:"message",label:ar?"قائمة":"Menu",x:50,y:120,next:["n3"],config:{text:ar?"مرحباً! اختر من القائمة:":"Hi! Choose from menu:"}},
          {id:"n3",tp:"buttons",label:ar?"فئات":"Categories",x:50,y:210,next:["n4","n5"],config:{buttons:[ar?"إلكترونيات":"Electronics",ar?"ملابس":"Clothing"]}},
          {id:"n4",tp:"api",label:ar?"جلب المنتجات":"Fetch Products",x:30,y:300,next:["n6"],config:{text:"GET /api/products"}},
          {id:"n5",tp:"ai",label:ar?"مساعد AI":"AI Assist",x:70,y:300,next:["n6"],config:{text:ar?"AI يقترح منتجات":"AI suggests products"}},
          {id:"n6",tp:"message",label:ar?"عرض":"Display",x:50,y:390,next:["n7"],config:{text:ar?"إليك المنتجات المتاحة":"Available products:"}},
          {id:"n7",tp:"input",label:ar?"اختيار":"Select",x:50,y:470,next:["n8"],config:{text:ar?"اختر المنتج بالرقم":"Select by number"}},
          {id:"n8",tp:"api",label:ar?"إنشاء طلب":"Create Order",x:50,y:550,next:["n9"],config:{text:"POST /api/orders"}},
          {id:"n9",tp:"condition",label:ar?"تحقق":"Check",x:50,y:630,next:["n10","n11"],config:{text:ar?"هل تم الطلب؟":"Order success?"}},
          {id:"n10",tp:"message",label:ar?"نجاح":"Success",x:30,y:720,next:["n12"],config:{text:ar?"✅ تم طلبك بنجاح!":"✅ Order confirmed!"}},
          {id:"n11",tp:"message",label:ar?"فشل":"Failed",x:70,y:720,next:["n12"],config:{text:ar?"❌ حدث خطأ، حاول مرة أخرى":"❌ Error, try again"}},
          {id:"n12",tp:"end",label:ar?"نهاية":"End",x:50,y:800,next:[],config:{}},
        ]},
      {id:2,name:ar?"بوت دعم":"Support Bot",st:"testing",nodes:10,trig:ar?"مساعدة, مشكلة, شكوى":"help, issue",cv:0,ai:true,desc:ar?"يتعامل مع استفسارات الدعم تلقائياً":"Handles support queries automatically",
        stats:{sessions:0,completed:0,dropped:0,avgTime:"-",satisfaction:0},
        flow:[
          {id:"n1",tp:"trigger",label:ar?"بداية":"Start",x:50,y:30,next:["n2"],config:{keywords:ar?"مساعدة, مشكلة":"help, issue"}},
          {id:"n2",tp:"ai",label:ar?"تحليل AI":"AI Analyze",x:50,y:120,next:["n3"],config:{text:ar?"AI يحلل نوع المشكلة":"AI analyzes issue type"}},
          {id:"n3",tp:"condition",label:ar?"تصنيف":"Classify",x:50,y:210,next:["n4","n5","n6"],config:{text:ar?"نوع المشكلة":"Issue type"}},
          {id:"n4",tp:"ai",label:ar?"رد AI":"AI Reply",x:20,y:310,next:["n7"],config:{text:ar?"AI يرد من قاعدة المعرفة":"AI responds from KB"}},
          {id:"n5",tp:"message",label:ar?"تذكرة":"Ticket",x:50,y:310,next:["n7"],config:{text:ar?"تم إنشاء تذكرة دعم":"Support ticket created"}},
          {id:"n6",tp:"transfer",label:ar?"تحويل":"Transfer",x:80,y:310,next:["n7"],config:{text:ar?"تحويل لموظف":"Transfer to agent"}},
          {id:"n7",tp:"end",label:ar?"نهاية":"End",x:50,y:400,next:[],config:{}},
        ]},
      {id:3,name:ar?"بوت FAQ":"FAQ Bot",st:"draft",nodes:6,trig:ar?"سؤال, كيف":"question, how",cv:0,ai:true,desc:ar?"يجيب على الأسئلة الشائعة تلقائياً":"Answers FAQs automatically",
        stats:{sessions:0,completed:0,dropped:0,avgTime:"-",satisfaction:0},
        flow:[]},
    ];

    const nodeTypes={
      trigger:{color:"#6366F1",icon:"zap",label:ar?"مُحفّز":"Trigger"},
      message:{color:C.pri,icon:"msg",label:ar?"رسالة":"Message"},
      buttons:{color:"#0EA5E9",icon:"list",label:ar?"أزرار":"Buttons"},
      input:{color:"#8B5CF6",icon:"pencil",label:ar?"إدخال":"Input"},
      condition:{color:C.warn,icon:"shield",label:ar?"شرط":"Condition"},
      ai:{color:aiC2,icon:"brain",label:"AI"},
      api:{color:"#10B981",icon:"link",label:"API"},
      transfer:{color:C.sec,icon:"users",label:ar?"تحويل":"Transfer"},
      end:{color:C.t3,icon:"check",label:ar?"نهاية":"End"},
    };

    const filtBots=bTab==="all"?bots:bots.filter(b=>b.st===bTab);

    /* Flow Editor View */
    if(bEdit!==null){
      const bot=bots.find(x=>x.id===bEdit);
      if(!bot)return null;
      const nd=selNode?bot.flow.find(x=>x.id===selNode):null;
      const nt=nd?nodeTypes[nd.tp]:null;
      return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><button onClick={()=>{setBEdit(null);setSelNode(null)}} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer"}}>{Ico("x",14)} {ar?"العودة":"Back"}</button><h2 style={{margin:0,fontSize:18,fontWeight:700}}>{bot.name}</h2><Bg color={sC(bot.st)}>{bot.st}</Bg></div>
          <div style={{display:"flex",gap:8}}><Btn outline small onClick={()=>showToast("✓")}>{ar?"اختبار":"Test"}</Btn><Btn outline small>{ar?"تصدير":"Export"}</Btn><Btn primary small onClick={()=>showToast(ar?"تم النشر ✓":"Published ✓")}>{ar?"نشر":"Publish"}</Btn></div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":nd?"1fr 320px":"1fr",gap:16}}>
          {/* Visual Flow Canvas */}
          <Cd style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"12px 18px",borderBottom:"1px solid "+(dk?C.brd:"#EAE7E2"),display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:600}}>{ar?"مخطط التدفق":"Flow Diagram"} — {bot.flow.length} {ar?"عقدة":"nodes"}</span>
              <div style={{display:"flex",gap:6}}>{Object.entries(nodeTypes).slice(0,6).map(([k,v])=><button key={k} onClick={()=>showToast(ar?"اسحب لإضافة":"Drag to add")} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:6,border:"1px solid "+(dk?C.brd:"#E0DDD8"),background:"transparent",fontFamily:ff,fontSize:10.5,color:v.color,cursor:"pointer"}}><span style={{width:8,height:8,borderRadius:2,background:v.color}}/>{v.label}</button>)}</div>
            </div>

            <div style={{padding:20,minHeight:400,position:"relative",background:dk?"#0A0C14":"#FAFAF8",backgroundImage:"radial-gradient("+(dk?"#1a1a30":"#E8E5E0")+" 1px, transparent 1px)",backgroundSize:"20px 20px"}}>
              {bot.flow.map(node=>{const ntp=nodeTypes[node.tp];return <div key={node.id}>
                {/* Connection lines */}
                {node.next.map((nxId,ni)=>{const nxNode=bot.flow.find(x=>x.id===nxId);if(!nxNode)return null;return <svg key={ni} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}><line x1={node.x+"%"} y1={(node.y+35)+"px"} x2={nxNode.x+"%"} y2={nxNode.y+"px"} stroke={dk?"#444":"#CCC"} strokeWidth="2" strokeDasharray="4"/></svg>;})}
                {/* Node */}
                <div onClick={()=>setSelNode(selNode===node.id?null:node.id)} style={{position:"absolute",left:"calc("+node.x+"% - 60px)",top:node.y,width:120,padding:"10px 12px",borderRadius:12,background:C.card,border:selNode===node.id?"2px solid "+ntp.color:"1.5px solid "+(dk?C.brd:"#E0DDD8"),boxShadow:selNode===node.id?"0 0 0 3px "+ntp.color+"20":C.shadow,cursor:"pointer",zIndex:1,textAlign:"center",transition:"all 0.15s"}}>
                  <div style={{width:28,height:28,borderRadius:8,background:ntp.color+"15",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px",color:ntp.color}}>{Ico(ntp.icon,14)}</div>
                  <div style={{fontSize:11.5,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{node.label}</div>
                  <div style={{fontSize:9.5,color:ntp.color,fontWeight:600,marginTop:2}}>{ntp.label}</div>
                </div>
              </div>;})}
            </div>
          </Cd>

          {/* Node Config Panel */}
          {nd&&<Cd style={{padding:0,alignSelf:"flex-start"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid "+(dk?C.brd:"#EAE7E2"),display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:8,background:nt.color+"15",display:"flex",alignItems:"center",justifyContent:"center",color:nt.color}}>{Ico(nt.icon,14)}</div><div><div style={{fontWeight:600,fontSize:13}}>{nd.label}</div><div style={{fontSize:11,color:nt.color}}>{nt.label}</div></div></div><button onClick={()=>setSelNode(null)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer"}}>{Ico("x",14)}</button></div>

            <div style={{padding:18}}>
              {nd.tp==="trigger"&&<div><div style={{fontSize:12.5,fontWeight:600,marginBottom:8}}>{ar?"الكلمات المحفّزة":"Trigger Keywords"}</div><textarea defaultValue={nd.config.keywords} rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:10,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:ff,fontSize:12.5,color:C.txt,outline:"none",resize:"vertical"}}/><div style={{fontSize:11,color:C.t3,marginTop:4}}>{ar?"افصل بفاصلة":"Comma separated"}</div></div>}

              {nd.tp==="message"&&<div><div style={{fontSize:12.5,fontWeight:600,marginBottom:8}}>{ar?"نص الرسالة":"Message Text"}</div><textarea defaultValue={nd.config.text} rows={4} style={{width:"100%",padding:"10px 12px",borderRadius:10,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:ff,fontSize:12.5,color:C.txt,outline:"none",resize:"vertical"}}/><div style={{marginTop:10,display:"flex",gap:6}}><button style={{padding:"5px 10px",borderRadius:6,border:"1px solid "+(dk?C.brd:"#DDD"),background:"transparent",fontFamily:ff,fontSize:11,color:C.t2,cursor:"pointer"}}>{ar?"+ صورة":"+ Image"}</button><button style={{padding:"5px 10px",borderRadius:6,border:"1px solid "+(dk?C.brd:"#DDD"),background:"transparent",fontFamily:ff,fontSize:11,color:C.t2,cursor:"pointer"}}>{ar?"+ زر":"+ Button"}</button><button style={{padding:"5px 10px",borderRadius:6,border:"1px solid "+(dk?C.brd:"#DDD"),background:"transparent",fontFamily:ff,fontSize:11,color:C.t2,cursor:"pointer"}}>{ar?"+ متغير":"+ Variable"}</button></div></div>}

              {nd.tp==="buttons"&&<div><div style={{fontSize:12.5,fontWeight:600,marginBottom:8}}>{ar?"الأزرار":"Buttons"}</div>{(nd.config.buttons||[]).map((b,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}><span style={{fontSize:11,color:C.pri,fontWeight:600}}>{i+1}</span><input defaultValue={b} style={{flex:1,padding:"8px 12px",borderRadius:8,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:ff,fontSize:12.5,color:C.txt,outline:"none"}}/></div>)}<button style={{padding:"5px 10px",borderRadius:6,border:"1px solid "+(dk?C.brd:"#DDD"),background:"transparent",fontFamily:ff,fontSize:11,color:C.pri,cursor:"pointer"}}>+ {ar?"زر جديد":"New Button"}</button></div>}

              {nd.tp==="condition"&&<div><div style={{fontSize:12.5,fontWeight:600,marginBottom:8}}>{ar?"الشرط":"Condition"}</div><input defaultValue={nd.config.text} style={{width:"100%",padding:"8px 12px",borderRadius:8,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:ff,fontSize:12.5,color:C.txt,outline:"none"}}/><div style={{marginTop:10,fontSize:12,color:C.t2}}>{ar?"المخرجات:":"Outputs:"} <span style={{color:C.ok}}>True</span> / <span style={{color:C.err}}>False</span></div></div>}

              {nd.tp==="ai"&&<div><div style={{fontSize:12.5,fontWeight:600,marginBottom:8,color:aiC2}}>AI {ar?"إعدادات":"Settings"}</div><div style={{padding:12,borderRadius:10,background:dk?"#1a1030":"#F8F4FF",marginBottom:10}}><div style={{fontSize:12,color:aiC2,marginBottom:6}}>{nd.config.text}</div></div>{[[ar?"قاعدة المعرفة":"Knowledge Base",true],[ar?"سياق المحادثة":"Conversation Context",true],[ar?"تصعيد تلقائي":"Auto Escalate",false],[ar?"حد الثقة (%)":"Confidence Threshold","80"]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<3?"1px solid "+(dk?C.brd:"#F0EDE8"):"none"}}><span style={{fontSize:12.5}}>{l}</span>{typeof v==="boolean"?<Toggle on={v} onToggle={()=>{}}/>:<input defaultValue={v} style={{width:60,padding:"4px 8px",borderRadius:6,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:ff,fontSize:12,color:C.txt,outline:"none",textAlign:"center"}}/>}</div>)}</div>}

              {nd.tp==="api"&&<div><div style={{fontSize:12.5,fontWeight:600,marginBottom:8}}>API {ar?"إعدادات":"Config"}</div><div style={{marginBottom:10}}><label style={{fontSize:11.5,color:C.t2,display:"block",marginBottom:4}}>{ar?"الطريقة":"Method"}</label><div style={{display:"flex",gap:4}}>{["GET","POST","PUT","DELETE"].map(m=><button key={m} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+(dk?C.brd:"#DDD"),background:m==="GET"?C.ok+"15":"transparent",fontFamily:ff,fontSize:11,color:m==="GET"?C.ok:C.t2,cursor:"pointer",fontWeight:600}}>{m}</button>)}</div></div><div style={{marginBottom:10}}><label style={{fontSize:11.5,color:C.t2,display:"block",marginBottom:4}}>URL</label><input defaultValue={nd.config.text} style={{width:"100%",padding:"8px 12px",borderRadius:8,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:"monospace",fontSize:12,color:C.txt,outline:"none"}}/></div><div><label style={{fontSize:11.5,color:C.t2,display:"block",marginBottom:4}}>Headers</label><textarea rows={2} placeholder='{"Authorization":"Bearer ..."}' style={{width:"100%",padding:"8px 12px",borderRadius:8,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:"monospace",fontSize:11,color:C.txt,outline:"none",resize:"vertical"}}/></div></div>}

              {nd.tp==="transfer"&&<div><div style={{fontSize:12.5,fontWeight:600,marginBottom:8}}>{ar?"التحويل إلى":"Transfer To"}</div>{[[ar?"فريق الدعم":"Support Team"],[ar?"فريق المبيعات":"Sales Team"],[ar?"وكيل محدد":"Specific Agent"]].map(([l],i)=><div key={i} style={{padding:"10px 12px",borderRadius:8,background:i===0?C.pri+"10":C.inp,border:i===0?"1.5px solid "+C.pri:"1.5px solid transparent",marginBottom:6,fontSize:12.5,cursor:"pointer",fontWeight:i===0?600:400}}>{l}</div>)}</div>}

              {nd.tp==="input"&&<div><div style={{fontSize:12.5,fontWeight:600,marginBottom:8}}>{ar?"نوع الإدخال":"Input Type"}</div>{[[ar?"نص حر":"Free Text","text"],[ar?"رقم":"Number","number"],[ar?"بريد":"Email","email"],[ar?"هاتف":"Phone","phone"]].map(([l,k],i)=><div key={i} style={{padding:"8px 12px",borderRadius:8,background:i===0?C.pri+"10":C.inp,border:i===0?"1.5px solid "+C.pri:"1.5px solid transparent",marginBottom:4,fontSize:12.5,cursor:"pointer"}}>{l}</div>)}<div style={{marginTop:10}}><label style={{fontSize:11.5,color:C.t2,display:"block",marginBottom:4}}>{ar?"رسالة الطلب":"Prompt"}</label><input defaultValue={nd.config.text} style={{width:"100%",padding:"8px 12px",borderRadius:8,background:C.inp,border:"1px solid "+(dk?C.brd:"#DDD"),fontFamily:ff,fontSize:12.5,color:C.txt,outline:"none"}}/></div></div>}

              <div style={{marginTop:16,display:"flex",gap:8}}><Btn primary small onClick={()=>showToast("✓")} style={{flex:1}}>{ar?"حفظ":"Save"}</Btn><Btn outline small style={{color:C.err,borderColor:C.err}} onClick={()=>setSelNode(null)}>{ar?"حذف":"Delete"}</Btn></div>
            </div>
          </Cd>}
        </div>
      </div>;
    }

    /* Bot Detail View */
    if(bView!==null){
      const bot=bots.find(x=>x.id===bView);
      if(!bot)return null;
      const st=bot.stats;
      const compRate=st.sessions>0?((st.completed/st.sessions*100).toFixed(1)):0;
      const dropRate=st.sessions>0?((st.dropped/st.sessions*100).toFixed(1)):0;
      return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
        <button onClick={()=>setBView(null)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:18,display:"flex",alignItems:"center",gap:4}}>{Ico("x",14)} {ar?"العودة":"Back"}</button>

        <Cd style={{padding:24,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div style={{display:"flex",gap:16,alignItems:"flex-start"}}><div style={{width:56,height:56,borderRadius:16,background:C.wa+"12",display:"flex",alignItems:"center",justifyContent:"center",color:C.wa}}>{Ico("bot",26)}</div><div><h2 style={{margin:"0 0 6px",fontSize:20,fontWeight:700}}>{bot.name}</h2><p style={{margin:"0 0 8px",fontSize:13,color:C.t2}}>{bot.desc}</p><div style={{display:"flex",gap:6}}><Bg color={sC(bot.st)}>{bot.st}</Bg><Bg color={C.pri}>{bot.nodes} {ar?"عقدة":"nodes"}</Bg>{bot.ai&&<Bg color={aiC2}>AI</Bg>}</div></div></div>
            <div style={{display:"flex",gap:8}}><Btn outline small onClick={()=>showToast("✓")}>{ar?"اختبار":"Test"}</Btn><Btn primary small onClick={()=>{setBView(null);setBEdit(bot.id)}}>{ar?"تعديل التدفق":"Edit Flow"}</Btn></div>
          </div>
        </Cd>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:20}}>
          {[[ar?"الجلسات":"Sessions",st.sessions.toLocaleString(),C.pri],[ar?"مكتملة":"Completed",st.completed.toLocaleString(),C.ok],[ar?"انسحاب":"Dropped",st.dropped.toLocaleString(),C.err],[ar?"معدل الإكمال":"Completion",compRate+"%",C.ok],[ar?"متوسط الوقت":"Avg Time",st.avgTime,C.info],[ar?"الرضا":"CSAT",st.satisfaction>0?st.satisfaction+"/5":"—",C.warn]].map(([l,v,clr],i)=><Cd key={i} style={{padding:"14px 18px",textAlign:"center"}}><div style={{fontSize:11.5,color:C.t2,marginBottom:4}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:clr}}>{v}</div></Cd>)}
        </div>

        {st.sessions>0&&<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:16,marginBottom:20}}>
          <Cd style={{padding:22}}><h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700}}>{ar?"قمع المحادثات":"Conversation Funnel"}</h3>{[[ar?"بدأوا":"Started",st.sessions,C.pri],[ar?"أكملوا":"Completed",st.completed,C.ok],[ar?"انسحبوا":"Dropped",st.dropped,C.err]].map(([l,v,clr],i)=><div key={i} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:4}}><span style={{color:C.t2}}>{l}</span><span style={{fontWeight:600}}>{v.toLocaleString()}</span></div><ProgBar value={v/st.sessions*100} color={clr}/></div>)}</Cd>
          <Cd style={{padding:22}}><h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700}}>{ar?"الكلمات المحفّزة":"Trigger Keywords"}</h3><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{bot.trig.split(", ").map((kw,i)=><span key={i} style={{padding:"6px 12px",borderRadius:8,background:C.inp,fontSize:12.5,fontWeight:500}}>{kw}</span>)}</div></Cd>
        </div>}

        <Cd style={{padding:22}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><div style={{width:28,height:28,borderRadius:8,background:aiC2+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("brain",14)}</div><span style={{fontSize:13,fontWeight:700,color:aiC2}}>AI {ar?"توصيات":"Recommendations"}</span></div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:10}}>
            {(ar?["إضافة رد AI للأسئلة الشائعة يقلل الانسحاب 35%","العقدة الثالثة أكثر نقطة انسحاب - اقتراح: تبسيط الخيارات","ربط API المنتجات يزيد التحويل 28%","إضافة تأكيد قبل إنهاء المحادثة"]:["Adding AI FAQ reduces drop-off 35%","Node 3 is main drop-off - simplify options","Product API integration boosts conversion 28%","Add confirmation before ending chat"]).map((tip,i)=><div key={i} style={{padding:"10px 14px",borderRadius:10,background:dk?"#1a1030":"#F8F4FF",fontSize:12.5,lineHeight:1.6,display:"flex",gap:8}}><span>{i<2?"💡":"🎯"}</span><span>{tip}</span></div>)}
          </div>
        </Cd>
      </div>;
    }

    /* Main List */
    return <div style={{padding:isMob?"0 14px 14px":"0 28px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h2 style={{fontSize:22,fontWeight:700,margin:0}}>{t.botBuilder}</h2><p style={{fontSize:13.5,color:C.t2,margin:"6px 0 0"}}>{ar?"إنشاء وإدارة بوتات واتساب الذكية":"Create and manage smart WhatsApp bots"}</p></div>
        <div style={{display:"flex",gap:8}}><Btn outline style={{color:aiC2,borderColor:aiC2}} onClick={()=>showToast(ar?"قريباً":"Coming soon")}>{Ico("brain",14)} AI {ar?"منشئ":"Builder"}</Btn><Btn primary onClick={()=>openModal("newFlow")}>+ {ar?"إنشاء بوت":"New Bot"}</Btn></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {[[ar?"الإجمالي":"Total",bots.length+"",C.pri,"bot"],[ar?"منشورة":"Published",bots.filter(x=>x.st==="published").length+"",C.ok,"check"],[ar?"اختبار":"Testing",bots.filter(x=>x.st==="testing").length+"",C.warn,"shield"],[ar?"الجلسات":"Sessions","5,096",C.info,"msg"],[ar?"الإكمال":"Completion","82.6%",C.ok,"target"],[ar?"AI نشط":"AI Active",bots.filter(x=>x.ai).length+"",aiC2,"brain"]].map(([l,v,clr,ic],i)=><Cd key={i} style={{padding:"14px 18px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:32,height:32,borderRadius:8,background:clr+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico(ic,16)}</div><span style={{fontSize:11.5,color:C.t2}}>{l}</span></div><div style={{fontSize:22,fontWeight:700,color:clr}}>{v}</div></Cd>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax("+String(isMob?260:320)+"px,1fr))",gap:16}}>
        {filtBots.map(bot=><Cd key={bot.id} style={{cursor:"pointer"}} onClick={()=>setBView(bot.id)}>
          <div style={{padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div><div style={{fontWeight:700,fontSize:16,marginBottom:6}}>{bot.name}</div><p style={{margin:"0 0 8px",fontSize:12.5,color:C.t2,lineHeight:1.5}}>{bot.desc}</p><div style={{display:"flex",gap:5}}><Bg color={sC(bot.st)}>{bot.st}</Bg>{bot.ai&&<Bg color={aiC2}>AI</Bg>}</div></div>
              <div style={{width:48,height:48,borderRadius:14,background:C.wa+"12",display:"flex",alignItems:"center",justifyContent:"center",color:C.wa}}>{Ico("bot",22)}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[[ar?"العقد":"Nodes",bot.nodes],[ar?"الجلسات":"Sessions",bot.cv.toLocaleString()],[ar?"المحفّز":"Trigger",bot.trig.split(",")[0]]].map(([l,v],i)=><div key={i} style={{padding:"8px 10px",borderRadius:8,background:C.inp,textAlign:"center"}}><div style={{fontSize:10.5,color:C.t2}}>{l}</div><div style={{fontSize:13,fontWeight:600,marginTop:2}}>{v}</div></div>)}
            </div>
            <div style={{display:"flex",gap:8}}><Btn small primary style={{flex:1}} onClick={e=>{e.stopPropagation();setBEdit(bot.id)}}>{ar?"تعديل التدفق":"Edit Flow"}</Btn><Btn small outline onClick={e=>{e.stopPropagation();setBView(bot.id)}}>{ar?"تفاصيل":"Details"}</Btn></div>
          </div>
        </Cd>)}
      </div>
    </div>;
  };

  /* AI CENTER - Full AI Management Hub */

  const AIPg = () => {
    const aiC2="#7C3AED";
    const aiModels=[[ar?"مساعد الردود":"Reply Assist",ar?"يقترح ردود ذكية":"Smart replies",true,91,342],[ar?"ملخص المحادثات":"Summary",ar?"تلخيص تلقائي":"Auto summary",true,94,156],[ar?"تصنيف الرسائل":"Classifier",ar?"تصنيف تلقائي":"Auto classify",true,89,1240],[ar?"تحليل المشاعر":"Sentiment",ar?"تحليل مشاعر العميل":"Customer sentiment",true,87,1240],[ar?"التوجيه الذكي":"Smart Routing",ar?"توجيه للفريق المناسب":"Route to right team",true,86,890],[ar?"الترجمة":"Translation",ar?"ترجمة فورية AR↔EN":"Real-time AR↔EN",true,95,48]];
    const kbDocs=[[ar?"سياسة الاسترجاع":"Return Policy",12,"pdf",342,94],[ar?"دليل المنتجات":"Product Catalog",85,"pdf",1250,91],[ar?"الأسئلة الشائعة":"FAQ",8,"doc",2100,96]];
    return <div style={{padding:"0 24px 24px"}}>
      <div style={{marginBottom:18}}><h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700}}>{t.aiCenter}</h2><p style={{fontSize:13,color:C.t2,margin:0}}>{ar?"إدارة أدوات الذكاء الاصطناعي":"Manage AI tools"}</p></div>
      <div style={{marginBottom:16}}><TBr tabs={[{k:"overview",l:ar?"نظرة عامة":"Overview"},{k:"models",l:ar?"النماذج":"Models"},{k:"knowledge",l:t.kb},{k:"tone",l:t.tone},{k:"guardrails",l:t.guard}]} active={aiTab} onChange={setAiTab}/></div>
      {aiTab==="overview"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:14}}>{[[ar?"اقتراحات":"Suggestions","1,240",aiC2],[t.aiAcc,"68%",C.ok],[t.accRate,"91.2%",C.pri],[t.aiCred,"8,450",C.warn],[ar?"التوفير":"Saved","47h",C.ok],[ar?"نماذج نشطة":"Active","6/6",aiC2]].map(([l,v,clr],i)=><Cd key={i} style={{padding:"12px 14px"}}><div style={{fontSize:10,color:C.t2,marginBottom:3}}>{l}</div><div style={{fontSize:18,fontWeight:700,color:clr}}>{v}</div></Cd>)}</div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"أداء النماذج":"Model Performance"}</h3>{aiModels.filter(m=>m[2]).map(([n,,,,acc],i)=><div key={i} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span>{n}</span><span style={{fontWeight:600,color:acc>=90?C.ok:C.warn}}>{acc}%</span></div><ProgBar value={acc} color={acc>=90?C.ok:C.warn}/></div>)}</Cd>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"استهلاك الرصيد":"Credits"}</h3><div style={{display:"flex",alignItems:"center",gap:16}}><Donut segs={[{v:64,c:aiC2},{v:36,c:C.inp}]} size={80} sw={10}/><div style={{flex:1,fontSize:12}}>{[[ar?"مستخدم":"Used","5,450",aiC2],[ar?"متبقي":"Remaining","3,000",C.ok]].map(([l,v,clr],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:C.t2}}>{l}</span><span style={{fontWeight:600,color:clr}}>{v}</span></div>)}</div></div></Cd>
        </div>
      </div>}
      {aiTab==="models"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>{aiModels.map(([name,desc,active,acc,daily],i)=><Cd key={i} style={{padding:18}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{name}</div><p style={{margin:0,fontSize:12,color:C.t2}}>{desc}</p></div><Toggle on={active} onToggle={()=>showToast("✓")}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{[[t.accRate,acc+"%",acc>=90?C.ok:C.warn],[ar?"يومي":"Daily",daily,C.info]].map(([l,v,clr],j)=><div key={j} style={{padding:6,borderRadius:6,background:C.inp,textAlign:"center"}}><div style={{fontSize:10,color:C.t2}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:clr}}>{v}</div></div>)}</div></Cd>)}</div>}
      {aiTab==="knowledge"&&<div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><Btn primary>+ {t.uploadDocs}</Btn></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>{kbDocs.map(([name,pages,type,queries,acc],i)=><Cd key={i} style={{padding:18}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}><div style={{width:40,height:40,borderRadius:10,background:aiC2+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("file",18)}</div><div><div style={{fontWeight:700,fontSize:14}}>{name}</div><div style={{fontSize:11,color:C.t2}}>{pages}p · {type.toUpperCase()}</div></div></div><div style={{display:"flex",gap:8,fontSize:12,color:C.t2}}><span>{ar?"استعلامات":"Queries"}: <b style={{color:C.txt}}>{queries}</b></span><span>{t.accRate}: <b style={{color:C.ok}}>{acc}%</b></span></div></Cd>)}</div></div>}
      {aiTab==="tone"&&<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}><Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"نبرة المحادثة":"Tone"}</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[[ar?"ودّي":"Friendly",true],[t.formal,false],[ar?"غير رسمي":"Casual",false],[ar?"مبيعات":"Sales",false]].map(([n,sel],i)=><div key={i} style={{padding:14,borderRadius:10,background:sel?aiC2+"10":C.inp,border:sel?"2px solid "+aiC2:"2px solid transparent",cursor:"pointer",textAlign:"center",fontWeight:sel?700:400,fontSize:13}}>{n}</div>)}</div></Cd><Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"تعليمات مخصصة":"Instructions"}</h3><textarea rows={4} placeholder={ar?"مثال: رحّب بالعميل باسمه":"e.g. Greet by name"} style={{width:"100%",padding:"10px 12px",borderRadius:10,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:12,color:C.txt,outline:"none",resize:"vertical"}}/><Btn primary small style={{marginTop:8}} onClick={()=>showToast("✓")}>{t.save}</Btn></Cd></div>}
      {aiTab==="guardrails"&&<Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{t.guard}</h3>{[[ar?"فلتر الألفاظ":"Profanity Filter",ar?"منع الألفاظ غير اللائقة":"Block bad language",true],[ar?"حماية المنافسين":"Competitor Guard",ar?"عدم ذكر المنافسين":"Never mention competitors",true],[ar?"حماية البيانات":"Data Protection",ar?"عدم طلب بيانات حساسة":"Never request sensitive data",true],[ar?"تحويل للموظف":"Redirect",ar?"عند عدم اليقين":"When uncertain",true],[ar?"كشف اللغة":"Language Detect",ar?"رد بنفس اللغة":"Match customer language",true]].map(([l,desc,on],i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:10,background:C.inp,marginBottom:6}}><div><div style={{fontWeight:600,fontSize:12}}>{l}</div><div style={{fontSize:11,color:C.t2}}>{desc}</div></div><Toggle on={on} onToggle={()=>showToast("✓")}/></div>)}</Cd>}
    </div>;
  };

  /* ═══ ANALYTICS ═══ */
  const AnaPg = () => {
    const aiC2="#7C3AED";
    const kpiData=[[t.totalConv,"12,847","+12%",C.pri,[80,95,88,120,105,140,130,155,148,170,162,185]],[t.frt,"2.8 "+t.min,"-22%",C.ok,[5,4.5,4,3.8,3.5,3.2,3,2.9,2.8,2.8,2.7,2.8]],[t.resTime,"18 "+t.min,"-15%",C.info,[28,26,25,24,22,21,20,19,19,18,18,18]],[t.csat,"4.6/5","+0.3",C.warn,[4.1,4.2,4.2,4.3,4.3,4.4,4.4,4.5,4.5,4.6,4.5,4.6]],[t.sla,"96.2%","+2.1%",C.ok,[90,91,92,92,93,94,94,95,95,96,96,96]],["FCR","78%","+5%",aiC2,[68,70,71,72,73,74,75,76,76,77,78,78]]];
    const catData=[[ar?"مبيعات":"Sales",26.6,C.pri],[ar?"دعم":"Support",32.8,C.info],[ar?"طلبات":"Orders",22.1,C.ok],[ar?"فوترة":"Billing",9.7,C.warn],[ar?"أخرى":"Other",8.8,C.t3]];
    const hourly=[0,2,1,0,1,3,12,28,45,62,78,85,72,68,55,48,42,35,28,22,15,10,5,2];
    const SpkLn=({data,color,w=80,h=30})=>{const mx=Math.max(...data),mn=Math.min(...data),r=mx-mn||1,pts=data.map((v,i)=>[i/(data.length-1)*w,(1-(v-mn)/r)*h]),d="M"+pts.map(p=>p[0]+","+p[1]).join("L");return <svg width={w} height={h}><path d={d} fill="none" stroke={color} strokeWidth="2"/><circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color}/></svg>;};
    return <div style={{padding:"0 24px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}><div><h2 style={{margin:0,fontSize:20,fontWeight:700}}>{t.analytics}</h2></div><div style={{display:"flex",gap:6}}><TBr tabs={[{k:"daily",l:t.daily},{k:"weekly",l:t.weekly},{k:"monthly",l:t.monthly}]} active={anaRange} onChange={setAnaRange}/><Btn outline small>{t.expCSV}</Btn></div></div>
      <div style={{marginBottom:16}}><TBr tabs={[{k:"overview",l:ar?"نظرة عامة":"Overview"},{k:"conversations",l:t.conv},{k:"agents",l:t.agent},{k:"ai",l:"AI"}]} active={anaTab} onChange={setAnaTab}/></div>
      {anaTab==="overview"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:16}}>{kpiData.map(([l,v,ch,clr,spark],i)=><Cd key={i} style={{padding:"14px 16px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><div style={{fontSize:11,color:C.t2,marginBottom:3}}>{l}</div><div style={{fontSize:20,fontWeight:700}}>{v}</div></div></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}><span style={{fontSize:11,fontWeight:600,color:C.ok}}>{ch}</span><SpkLn data={spark} color={clr}/></div></Cd>)}</div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"توزيع بالساعة":"Hourly"}</h3><div style={{display:"flex",gap:1,alignItems:"flex-end",height:80}}>{hourly.map((v,i)=><div key={i} style={{flex:1,background:C.pri,borderRadius:2,height:Math.max(3,(v/85)*70),opacity:Math.max(0.15,v/85)}}/>)}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:C.t3}}><span>12AM</span><span>12PM</span><span>12AM</span></div></Cd>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"تصنيف المحادثات":"Categories"}</h3><div style={{display:"flex",alignItems:"center",gap:16}}><Donut segs={catData.map(([,p,c])=>({v:p,c}))} size={80} sw={10}/><div style={{flex:1}}>{catData.map(([n,p,clr],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:7,height:7,borderRadius:2,background:clr}}/>{n}</div><span style={{fontWeight:600}}>{p}%</span></div>)}</div></div></Cd>
        </div>
        <Cd style={{padding:18}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:13,fontWeight:700,color:aiC2}}>AI {ar?"رؤى":"Insights"}</span></div><div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 1fr 1fr",gap:8}}>{(ar?[["💡","محادثات الأحد +28%"],["🎯","78% مبيعات تتحول بـ 5 دقائق"],["📈","CSAT ارتفع 0.3 بعد AI"],["⚡","22% أسرع وفّر 47 ساعة"]]:
          [["💡","Sunday convos up 28%"],["🎯","78% sales convert in 5min"],["📈","CSAT +0.3 after AI"],["⚡","22% faster, saved 47hrs"]]).map(([em,tip],i)=><div key={i} style={{padding:"10px 12px",borderRadius:10,background:C.inp,fontSize:11.5,lineHeight:1.5}}>{em} {tip}</div>)}</div></Cd>
      </div>}
      {anaTab==="conversations"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:14}}>{[[ar?"الإجمالي":"Total","12,847",C.pri],[ar?"مفتوحة":"Open","342",C.warn],[ar?"محلولة":"Resolved","11,890",C.ok],[ar?"متوسط/يوم":"Avg/Day","428",C.info]].map(([l,v,clr],i)=><Cd key={i} style={{padding:"12px 14px",textAlign:"center"}}><div style={{fontSize:10,color:C.t2}}>{l}</div><div style={{fontSize:18,fontWeight:700,color:clr}}>{v}</div></Cd>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}><Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"الاتجاه":"Trend"}</h3><MiniBar data={[8200,9100,9800,10500,11200,10800,11500,12100,11800,12400,12600,12847]} color={C.pri} h={100}/></Cd><Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"معدل الحل":"Resolution"}</h3><MiniBar data={[88,89,90,90,91,91,92,93,93,94,95,96]} color={C.ok} h={100}/></Cd></div>
        <Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"أهم المواضيع":"Top Topics"}</h3>{(ar?[["استفسار شحن",22.1],["حالة طلب",16.7],["استرجاع",13.1],["مشاكل دفع",9.7],["استفسار منتج",8.6]]:
          [["Shipping",22.1],["Order status",16.7],["Returns",13.1],["Payment",9.7],["Product",8.6]]).map(([topic,pct],i)=><div key={i} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span>{topic}</span><span style={{fontWeight:600}}>{pct}%</span></div><ProgBar value={pct/22.1*100} color={i<2?C.pri:C.info}/></div>)}</Cd>
      </div>}
      {anaTab==="agents"&&<Cd><CdH title={t.agentPerf}/><Tbl h={[t.agent,t.status,t.conv,t.frt,t.resTime,t.csat,ar?"التحميل":"Load"]} rows={[{n:ar?"سعد":"Saad",on:true,c:342,f:"1.8",r:"14",s:"4.8",ld:78},{n:ar?"هند":"Hind",on:true,c:298,f:"2.2",r:"16",s:"4.6",ld:92},{n:ar?"ماجد":"Majed",on:true,c:315,f:"3.1",r:"22",s:"4.3",ld:85},{n:ar?"ليلى":"Laila",on:false,c:256,f:"2.5",r:"18",s:"4.5",ld:0}].map(a=>[<div style={{display:"flex",alignItems:"center",gap:8}}><Av name={a.n} size={30}/><span style={{fontWeight:600}}>{a.n}</span></div>,<SD color={a.on?C.ok:C.t3} label={a.on?t.onl:t.offl}/>,a.c,<span style={{color:parseFloat(a.f)<3?C.ok:C.warn,fontWeight:600}}>{a.f} {t.min}</span>,a.r+" "+t.min,<span style={{color:C.warn}}>{Ico("star",12)} {a.s}</span>,<div style={{display:"flex",alignItems:"center",gap:4,width:70}}><ProgBar value={a.ld} color={a.ld>85?C.err:a.ld>60?C.warn:C.ok}/><span style={{fontSize:11}}>{a.ld}%</span></div>])}/></Cd>}
      {anaTab==="ai"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:14}}>{[[ar?"إجراءات AI":"AI Actions","8,420",aiC2],[ar?"مقبولة":"Accepted","72%",C.ok],[ar?"معدّلة":"Modified","18%",C.warn],[ar?"مرفوضة":"Rejected","10%",C.err],[ar?"الوقت الموفّر":"Time Saved","47h",C.ok]].map(([l,v,clr],i)=><Cd key={i} style={{padding:"12px 14px",textAlign:"center"}}><div style={{fontSize:10,color:C.t2}}>{l}</div><div style={{fontSize:18,fontWeight:700,color:clr}}>{v}</div></Cd>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"أداء النماذج":"Models"}</h3>{[[ar?"تصنيف":"Classifier",89,1240],[ar?"مساعد ردود":"Reply",91,342],[ar?"مشاعر":"Sentiment",87,1240],[ar?"توجيه":"Routing",86,890]].map(([n,acc,d],i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:12,flex:1}}>{n}</span><span style={{fontSize:11,color:C.t2,width:50}}>{d}/d</span><div style={{width:60}}><ProgBar value={acc} color={acc>=90?C.ok:C.warn}/></div><span style={{fontSize:12,fontWeight:600,color:acc>=90?C.ok:C.warn,width:35}}>{acc}%</span></div>)}</Cd><Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"قبول الاقتراحات":"Acceptance"}</h3><div style={{display:"flex",alignItems:"center",gap:16}}><Donut segs={[{v:72,c:C.ok},{v:18,c:C.warn},{v:10,c:C.err}]} size={80} sw={10}/><div style={{flex:1}}>{[[ar?"مقبولة":"Accepted","72%",C.ok],[ar?"معدّلة":"Modified","18%",C.warn],[ar?"مرفوضة":"Rejected","10%",C.err]].map(([l,v,clr],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:7,height:7,borderRadius:2,background:clr}}/>{l}</div><span style={{fontWeight:600,color:clr}}>{v}</span></div>)}</div></div></Cd></div>
      </div>}
    </div>;
  };

  /* ═══ TEAMS ═══ */
  const TeamsPg = () => {
    const aiC2="#7C3AED";
    const members=[
      {id:0,name:ar?"سعد الغامدي":"Saad",email:"saad@corbit.sa",role:"admin",team:ar?"إدارة":"Management",online:true,stats:{convos:342,frt:"1.8",res:"14",csat:4.8,fcr:85,load:78},schedule:{sun:true,mon:true,tue:true,wed:true,thu:true,fri:false,sat:false},skills:[ar?"مبيعات":"Sales","VIP"]},
      {id:1,name:ar?"هند العمري":"Hind",email:"hind@corbit.sa",role:"supervisor",team:ar?"المبيعات":"Sales",online:true,stats:{convos:298,frt:"2.2",res:"16",csat:4.6,fcr:82,load:92},schedule:{sun:true,mon:true,tue:true,wed:true,thu:true,fri:false,sat:false},skills:[ar?"مبيعات":"Sales",ar?"إنجليزي":"English"]},
      {id:2,name:ar?"ماجد القرني":"Majed",email:"majed@corbit.sa",role:"agent",team:ar?"الدعم":"Support",online:true,stats:{convos:315,frt:"3.1",res:"22",csat:4.3,fcr:72,load:85},schedule:{sun:true,mon:true,tue:true,wed:true,thu:true,fri:false,sat:false},skills:[ar?"دعم فني":"Tech",ar?"طلبات":"Orders"]},
      {id:3,name:ar?"ليلى الشهري":"Laila",email:"laila@corbit.sa",role:"agent",team:ar?"الدعم":"Support",online:false,stats:{convos:256,frt:"2.5",res:"18",csat:4.5,fcr:80,load:0},schedule:{sun:false,mon:true,tue:true,wed:true,thu:true,fri:false,sat:true},skills:[ar?"فوترة":"Billing",ar?"استرجاع":"Returns"]},
    ];
    const tmTeams=[
      {id:0,name:ar?"المبيعات":"Sales",color:C.pri,lead:ar?"هند":"Hind",convos:487,csat:4.4,online:2,total:2,rules:[ar?"توزيع Round-Robin":"Round-robin",ar?"أولوية VIP لهند":"VIP to Hind"]},
      {id:1,name:ar?"الدعم":"Support",color:C.info,lead:ar?"ماجد":"Majed",convos:781,csat:4.4,online:1,total:2,rules:[ar?"توجيه حسب المهارات":"Skill-based",ar?"فوترة → ليلى":"Billing → Laila"]},
      {id:2,name:ar?"الإدارة":"Management",color:C.warn,lead:ar?"سعد":"Saad",convos:342,csat:4.8,online:1,total:1,rules:[ar?"تصعيدات فقط":"Escalations only"]},
    ];
    const roleC={admin:C.err,supervisor:C.warn,agent:C.info};
    const roleL={admin:ar?"مدير":"Admin",supervisor:ar?"مشرف":"Sup",agent:ar?"وكيل":"Agent"};
    if(tmView!==null){const m=members.find(x=>x.id===tmView);if(!m)return null;const s=m.stats;
    return <div style={{padding:"0 24px 24px"}}><button onClick={()=>setTmView(null)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:16}}>{ar?"← العودة":"← Back"}</button>
      <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"2fr 1fr",gap:16}}>
        <div><Cd style={{padding:22,marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:16}}><div style={{position:"relative"}}><Av name={m.name} size={56} solid/>{m.online&&<div style={{position:"absolute",bottom:2,right:2,width:12,height:12,borderRadius:6,background:C.ok,border:"2px solid "+C.card}}/>}</div><div style={{flex:1}}><h2 style={{margin:"0 0 4px",fontSize:18,fontWeight:700}}>{m.name}</h2><div style={{fontSize:12,color:C.t2}}>{m.email}</div><div style={{display:"flex",gap:4,marginTop:6}}><Bg color={roleC[m.role]}>{roleL[m.role]}</Bg><Bg color={C.pri}>{m.team}</Bg></div></div></div></Cd>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",gap:8,marginBottom:14}}>{[[t.conv,s.convos,C.pri],[t.frt,s.frt+(ar?" د":"m"),parseFloat(s.frt)<3?C.ok:C.warn],["CSAT",s.csat,C.warn],["FCR",s.fcr+"%",s.fcr>=80?C.ok:C.warn]].map(([l,v,clr],i)=><Cd key={i} style={{padding:"10px 12px",textAlign:"center"}}><div style={{fontSize:10,color:C.t2}}>{l}</div><div style={{fontSize:15,fontWeight:700,color:clr,marginTop:2}}>{v}</div></Cd>)}</div>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>{ar?"المهارات":"Skills"}</h3><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{m.skills.map((sk,i)=><span key={i} style={{padding:"6px 14px",borderRadius:8,background:C.inp,fontSize:12}}>{sk}</span>)}</div></Cd>
          <Cd style={{padding:18,marginTop:14}}><h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>{ar?"جدول العمل":"Schedule"}</h3><div style={{display:"flex",gap:4}}>{[["sun",ar?"أحد":"Su"],["mon",ar?"اثنين":"Mo"],["tue",ar?"ثلاثاء":"Tu"],["wed",ar?"أربعاء":"We"],["thu",ar?"خميس":"Th"],["fri",ar?"جمعة":"Fr"],["sat",ar?"سبت":"Sa"]].map(([k,l])=><div key={k} style={{flex:1,padding:"8px 4px",borderRadius:8,textAlign:"center",background:m.schedule[k]?C.ok+"12":C.inp,fontSize:11,fontWeight:600,color:m.schedule[k]?C.ok:C.t3}}>{l}</div>)}</div></Cd></div>
        <Cd style={{padding:18,alignSelf:"start"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:13,fontWeight:700,color:aiC2}}>AI {ar?"رؤى":"Insights"}</span></div>{(s.csat>=4.5?[ar?"أداء ممتاز":"Excellent performance",ar?"ترقية لمشرف":"Promote to supervisor"]:[ar?"وقت استجابة يحتاج تحسين":"Response needs improvement",ar?"ربط مع مساعد AI":"Connect AI assistant"]).map((tip,i)=><div key={i} style={{padding:"8px 10px",borderRadius:8,background:C.inp,marginBottom:4,fontSize:12,lineHeight:1.5}}>{i===0?"💡":"🎯"} {tip}</div>)}</Cd>
      </div></div>;}
    return <div style={{padding:"0 24px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}><div><h2 style={{margin:0,fontSize:20,fontWeight:700}}>{t.teams}</h2><p style={{fontSize:13,color:C.t2,margin:"4px 0 0"}}>{ar?"إدارة الفرق والأعضاء":"Manage teams and members"}</p></div><Btn primary onClick={()=>openModal("newTeam")}>+ {t.addMember}</Btn></div>
      <div style={{marginBottom:16}}><TBr tabs={[{k:"members",l:t.members},{k:"teams",l:t.teams},{k:"routing",l:ar?"التوجيه":"Routing"},{k:"schedule",l:ar?"الجدول":"Schedule"}]} active={tmTab} onChange={setTmTab}/></div>
      {tmTab==="members"&&<Cd><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr>{[t.agent,ar?"الدور":"Role",t.status,t.conv,"CSAT",ar?"التحميل":"Load",""].map((h,i)=><th key={i} style={{padding:"10px 14px",textAlign:"inherit",fontSize:11.5,fontWeight:600,color:C.t2,borderBottom:"1px solid "+C.brd,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{members.map(m=><tr key={m.id} style={{borderBottom:"1px solid "+(dk?C.brd:"#F5F2ED"),cursor:"pointer"}} onClick={()=>setTmView(m.id)}><td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><Av name={m.name} size={34}/><div><div style={{fontWeight:600}}>{m.name}</div><div style={{fontSize:11,color:C.t3}}>{m.email}</div></div></div></td><td style={{padding:"12px 14px"}}><Bg color={roleC[m.role]}>{roleL[m.role]}</Bg></td><td style={{padding:"12px 14px"}}><SD color={m.online?C.ok:C.t3} label={m.online?t.onl:t.offl}/></td><td style={{padding:"12px 14px",fontWeight:600}}>{m.stats.convos}</td><td style={{padding:"12px 14px"}}><span style={{color:C.warn,fontWeight:600}}>{m.stats.csat}</span></td><td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:4,width:80}}><ProgBar value={m.stats.load} color={m.stats.load>85?C.err:m.stats.load>60?C.warn:C.ok}/><span style={{fontSize:11,fontWeight:600}}>{m.stats.load}%</span></div></td><td><Btn small outline>{t.edit}</Btn></td></tr>)}</tbody></table></div></Cd>}
      {tmTab==="teams"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>{tmTeams.map(tm=><Cd key={tm.id}><div style={{padding:"16px 20px",borderBottom:"1px solid "+C.brd}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:36,height:36,borderRadius:10,background:tm.color+"12",display:"flex",alignItems:"center",justifyContent:"center",color:tm.color,fontWeight:700,fontSize:14}}>{tm.name[0]}</div><div><div style={{fontWeight:700,fontSize:14}}>{tm.name}</div><div style={{fontSize:11,color:C.t2}}>{ar?"قائد:":"Lead:"} {tm.lead}</div></div></div><Btn small outline>{t.edit}</Btn></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>{[[t.members,tm.online+"/"+tm.total],[t.conv,tm.convos],[t.csat,tm.csat]].map(([l,v],i)=><div key={i} style={{padding:6,borderRadius:6,background:C.inp,textAlign:"center"}}><div style={{fontSize:10,color:C.t2}}>{l}</div><div style={{fontSize:13,fontWeight:700}}>{v}</div></div>)}</div></div><div style={{padding:"12px 20px"}}><div style={{fontSize:11,fontWeight:600,marginBottom:6}}>{ar?"قواعد التوجيه":"Rules"}</div>{tm.rules.map((r,i)=><div key={i} style={{fontSize:11,color:C.t2,marginBottom:3}}>• {r}</div>)}</div></Cd>)}</div>}
      {tmTab==="routing"&&<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:16}}><Cd style={{padding:20}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"قواعد التوجيه":"Routing Rules"}</h3>{[[ar?"التوزيع الافتراضي":"Default","Round-Robin",true],[ar?"توجيه حسب المهارات":"Skill Routing",ar?"للوكيل الأنسب":"Best agent",true],[ar?"أولوية VIP":"VIP Priority",ar?"أولوية عالية":"High priority",true],[ar?"تصعيد تلقائي":"Auto Escalation",ar?"بعد 5 دقائق":"After 5min",true],[ar?"AI أولاً":"AI First",ar?"AI يرد ثم يحول":"AI first",false]].map(([l,desc,on],i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:10,background:C.inp,marginBottom:6}}><div><div style={{fontWeight:600,fontSize:12}}>{l}</div><div style={{fontSize:11,color:C.t2,marginTop:2}}>{desc}</div></div><Toggle on={on} onToggle={()=>showToast("✓")}/></div>)}</Cd><Cd style={{padding:20}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"خريطة التوجيه":"Routing Map"}</h3>{[[ar?"مبيعات":"Sales",ar?"→ فريق المبيعات":"→ Sales",C.pri],[ar?"دعم":"Support",ar?"→ فريق الدعم":"→ Support",C.info],[ar?"فوترة":"Billing",ar?"→ ليلى":"→ Laila",C.warn],[ar?"VIP":"VIP",ar?"→ سعد":"→ Saad",C.err]].map(([f,to,clr],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderRadius:8,background:clr+"08",marginBottom:4,fontSize:12}}><span style={{fontWeight:600,color:clr}}>{f}</span><span style={{color:C.t2}}>{to}</span></div>)}</Cd></div>}
      {tmTab==="schedule"&&<Cd style={{padding:20}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"جدول العمل":"Schedule"}</h3><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr><th style={{padding:"8px 12px",textAlign:"inherit",fontSize:11,color:C.t2,borderBottom:"1px solid "+C.brd}}>{t.agent}</th>{[ar?"أحد":"Su",ar?"اثنين":"Mo",ar?"ثلاثاء":"Tu",ar?"أربعاء":"We",ar?"خميس":"Th",ar?"جمعة":"Fr",ar?"سبت":"Sa"].map((d,i)=><th key={i} style={{padding:"8px",textAlign:"center",fontSize:11,color:C.t2,borderBottom:"1px solid "+C.brd}}>{d}</th>)}</tr></thead><tbody>{members.map(m=><tr key={m.id} style={{borderBottom:"1px solid "+(dk?C.brd:"#F5F2ED")}}><td style={{padding:"10px 12px"}}><div style={{display:"flex",alignItems:"center",gap:6}}><Av name={m.name} size={28}/><span style={{fontWeight:600,fontSize:12}}>{m.name}</span></div></td>{["sun","mon","tue","wed","thu","fri","sat"].map(d=><td key={d} style={{padding:"8px",textAlign:"center"}}><div style={{width:24,height:24,borderRadius:6,margin:"0 auto",background:m.schedule[d]?C.ok+"12":C.inp,display:"flex",alignItems:"center",justifyContent:"center"}}>{m.schedule[d]&&<span style={{color:C.ok,fontSize:11}}>✓</span>}</div></td>)}</tr>)}</tbody></table></div></Cd>}
    </div>;
  };

  /* ═══ BILLING ═══ */
  const BillPg = () => {
    const [billTab,setBillTab]=useState("overview");
    const aiC2="#7C3AED";
    const plans=[
      {id:"starter",name:ar?"المبتدئ":"Starter",price:299,agents:5,convos:"5,000",ai:"1,000",features:ar?["5 وكلاء","5,000 محادثة","بوت واحد","دعم بريدي"]:["5 agents","5K convos","1 bot","Email support"]},
      {id:"business",name:ar?"الأعمال":"Business",price:799,agents:15,convos:"15,000",ai:"5,000",features:ar?["15 وكيل","15,000 محادثة","5 بوتات","AI مساعد","API"]:["15 agents","15K convos","5 bots","AI assist","API"]},
      {id:"enterprise",name:ar?"المؤسسات":"Enterprise",price:1999,agents:50,convos:"50,000",ai:"20,000",current:true,features:ar?["50 وكيل","50,000 محادثة","بوتات غير محدودة","AI كامل","API + Webhooks","مدير حساب","SLA 99.9%"]:["50 agents","50K convos","Unlimited bots","Full AI","API + Webhooks","Account manager","99.9% SLA"]},
    ];
    const invoices=[
      {id:"INV-2026-003",date:"2026-03-01",amount:1999,status:"paid",desc:ar?"اشتراك مارس":"March Subscription"},
      {id:"INV-2026-002",date:"2026-02-01",amount:1999,status:"paid",desc:ar?"اشتراك فبراير":"February Subscription"},
      {id:"INV-2026-001",date:"2026-01-01",amount:1999,status:"paid",desc:ar?"اشتراك يناير":"January Subscription"},
      {id:"INV-2025-012",date:"2025-12-01",amount:799,status:"paid",desc:ar?"اشتراك ديسمبر (أعمال)":"December Sub (Business)"},
    ];
    const usageData={convos:{used:8420,total:15000,daily:[280,310,295,340,320,380,350,290,310,330,350,340,280,300]},ai:{used:1240,total:5000,daily:[42,38,45,50,48,55,52,40,44,46,50,48,42,45]},msgs:{sent:12500,delivered:12150,read:9720,replied:6830},cost:{wa:2450,ai:320,sub:1999,total:4769}};
    const SpkLn=({data,color,w=80,h=28})=>{const mx=Math.max(...data),mn=Math.min(...data),r=mx-mn||1,pts=data.map((v,i)=>[i/(data.length-1)*w,(1-(v-mn)/r)*h]);return <svg width={w} height={h}><polyline points={pts.map(p=>p[0]+","+p[1]).join(" ")} fill="none" stroke={color} strokeWidth="2"/></svg>;};
    return <div style={{padding:"0 24px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}><div><h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700}}>{ar?"الفوترة والاشتراك":"Billing & Subscription"}</h2><p style={{fontSize:13,color:C.t2,margin:0}}>{ar?"إدارة خطتك ومدفوعاتك":"Manage your plan and payments"}</p></div><Btn primary onClick={()=>openModal("topUp")}>+ {t.topUp}</Btn></div>
      <div style={{marginBottom:16}}><TBr tabs={[{k:"overview",l:ar?"نظرة عامة":"Overview"},{k:"plans",l:ar?"الخطط":"Plans"},{k:"usage",l:ar?"الاستهلاك":"Usage"},{k:"invoices",l:ar?"الفواتير":"Invoices"},{k:"transactions",l:t.txns}]} active={billTab} onChange={setBillTab}/></div>

      {billTab==="overview"&&<div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 1fr",gap:14,marginBottom:16}}>
          <Cd style={{padding:20,background:GR}}><div style={{color:"rgba(255,255,255,0.8)",fontSize:12,marginBottom:4}}>{t.wallet}</div><div style={{color:"#fff",fontSize:32,fontWeight:700}}>12,450</div><div style={{color:"rgba(255,255,255,0.7)",fontSize:13,marginTop:2}}>{t.sar}</div><div style={{display:"flex",gap:6,marginTop:14}}><Btn style={{background:"rgba(255,255,255,0.2)",color:"#fff",border:"1px solid rgba(255,255,255,0.3)"}} small onClick={()=>openModal("topUp")}>+ {t.topUp}</Btn><Btn style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",border:"1px solid rgba(255,255,255,0.2)"}} small>{ar?"سجل":"History"}</Btn></div></Cd>
          <Cd style={{padding:20}}><div style={{fontSize:12,color:C.t2,marginBottom:4}}>{t.curPlan}</div><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{fontSize:22,fontWeight:700}}>{ar?"المؤسسات":"Enterprise"}</div><Bg color={C.ok}>{ar?"نشط":"Active"}</Bg></div><div style={{fontSize:12,color:C.t2,marginTop:2}}>50 {ar?"وكيل":"agents"} · {ar?"التجديد":"Renews"}: 2026-04-01</div><div style={{fontSize:20,fontWeight:700,color:C.pri,marginTop:8}}>1,999 <span style={{fontSize:12,fontWeight:400,color:C.t2}}>{t.sar}/{ar?"شهر":"mo"}</span></div></Cd>
          <Cd style={{padding:20}}><div style={{fontSize:12,color:C.t2,marginBottom:8}}>{ar?"تكلفة الشهر":"Month Cost"}</div>{[["WhatsApp",usageData.cost.wa,C.pri],["AI",usageData.cost.ai,aiC2],[ar?"اشتراك":"Sub",usageData.cost.sub,C.sec]].map(([l,v,clr],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}><span style={{color:C.t2}}>{l}</span><span style={{fontWeight:600,color:clr}}>{v.toLocaleString()}</span></div>)}<div style={{borderTop:"1px solid "+C.brd,paddingTop:6,marginTop:4,display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700}}><span>{ar?"الإجمالي":"Total"}</span><span>{usageData.cost.total.toLocaleString()} {t.sar}</span></div></Cd>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
          <Cd style={{padding:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h3 style={{margin:0,fontSize:14,fontWeight:700}}>{t.waConv}</h3><span style={{fontSize:12,fontWeight:600,color:usageData.convos.used/usageData.convos.total>0.8?C.warn:C.ok}}>{Math.round(usageData.convos.used/usageData.convos.total*100)}%</span></div><ProgBar value={usageData.convos.used/usageData.convos.total*100} color={usageData.convos.used/usageData.convos.total>0.8?C.warn:C.pri}/><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.t2,marginTop:6}}><span>{usageData.convos.used.toLocaleString()} / {usageData.convos.total.toLocaleString()}</span><SpkLn data={usageData.convos.daily} color={C.pri}/></div></Cd>
          <Cd style={{padding:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h3 style={{margin:0,fontSize:14,fontWeight:700}}>{t.aiCredits}</h3><span style={{fontSize:12,fontWeight:600,color:C.ok}}>{Math.round(usageData.ai.used/usageData.ai.total*100)}%</span></div><ProgBar value={usageData.ai.used/usageData.ai.total*100} color={aiC2}/><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.t2,marginTop:6}}><span>{usageData.ai.used.toLocaleString()} / {usageData.ai.total.toLocaleString()}</span><SpkLn data={usageData.ai.daily} color={aiC2}/></div></Cd>
        </div>
        <Cd style={{padding:18}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><span style={{fontSize:13,fontWeight:700,color:aiC2}}>AI {ar?"رؤى":"Insights"}</span></div><div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 1fr",gap:8}}>{(ar?[["💰","الاستهلاك الحالي طبيعي - توقع 11,200 محادثة نهاية الشهر"],["📊","AI Credits كافية لـ 3 أشهر بالمعدل الحالي"],["💡","ترقية للخطة السنوية يوفر 20% (4,800 ر.س/سنة)"]]:
          [["💰","Current usage normal - projected 11,200 convos by month end"],["📊","AI Credits sufficient for 3 months at current rate"],["💡","Annual plan saves 20% (4,800 SAR/year)"]]).map(([em,tip],i)=><div key={i} style={{padding:"10px 12px",borderRadius:10,background:C.inp,fontSize:11.5,lineHeight:1.5}}>{em} {tip}</div>)}</div></Cd>
      </div>}

      {billTab==="plans"&&<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 1fr",gap:16}}>
        {plans.map(plan=><Cd key={plan.id} style={{padding:22,border:plan.current?"2px solid "+C.pri:"1px solid "+C.brd,position:"relative"}}>{plan.current&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:C.pri,color:"#fff",fontSize:10,fontWeight:700,padding:"3px 14px",borderRadius:6}}>{ar?"خطتك الحالية":"Current Plan"}</div>}<div style={{textAlign:"center",marginBottom:16}}><h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:700}}>{plan.name}</h3><div style={{fontSize:28,fontWeight:800,color:C.pri}}>{plan.price.toLocaleString()} <span style={{fontSize:13,fontWeight:400,color:C.t2}}>{t.sar}/{ar?"شهر":"mo"}</span></div></div><div style={{borderTop:"1px solid "+C.brd,paddingTop:14}}>{plan.features.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,marginBottom:6}}><span style={{color:C.ok}}>✓</span>{f}</div>)}</div>{!plan.current&&<Btn primary style={{width:"100%",justifyContent:"center",marginTop:14}} onClick={()=>showToast("✓")}>{plan.price>1999?(ar?"تواصل معنا":"Contact Us"):(ar?"ترقية":"Upgrade")}</Btn>}</Cd>)}
      </div>}

      {billTab==="usage"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:14}}>{[[ar?"مرسلة":"Sent",usageData.msgs.sent,C.pri],[ar?"وصلت":"Delivered",usageData.msgs.delivered,C.ok],[ar?"مقروءة":"Read",usageData.msgs.read,C.info],[ar?"رد":"Replied",usageData.msgs.replied,C.warn]].map(([l,v,clr],i)=><Cd key={i} style={{padding:"12px 14px",textAlign:"center"}}><div style={{fontSize:10,color:C.t2}}>{l}</div><div style={{fontSize:18,fontWeight:700,color:clr}}>{v.toLocaleString()}</div></Cd>)}</div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"المحادثات اليومية":"Daily Conversations"}</h3><MiniBar data={usageData.convos.daily} color={C.pri} h={100}/><div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,color:C.t3}}><span>{ar?"14 يوم":"14 days"}</span><span>{ar?"اليوم":"Today"}</span></div></Cd>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"استهلاك AI":"AI Usage"}</h3><MiniBar data={usageData.ai.daily} color={aiC2} h={100}/><div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,color:C.t3}}><span>{ar?"14 يوم":"14 days"}</span><span>{ar?"اليوم":"Today"}</span></div></Cd>
        </div>
        <Cd style={{padding:18,marginTop:14}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"تفاصيل التكلفة":"Cost Breakdown"}</h3><div style={{display:"flex",alignItems:"center",gap:16}}><Donut segs={[{v:51,c:C.pri},{v:7,c:aiC2},{v:42,c:C.sec}]} size={90} sw={10}/><div style={{flex:1}}>{[["WhatsApp",usageData.cost.wa,C.pri,"51%"],["AI",usageData.cost.ai,aiC2,"7%"],[ar?"اشتراك":"Subscription",usageData.cost.sub,C.sec,"42%"]].map(([l,v,clr,pct],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:clr}}/>{l}</div><span style={{fontWeight:600}}>{v.toLocaleString()} {t.sar} ({pct})</span></div>)}</div></div></Cd>
      </div>}

      {billTab==="invoices"&&<Cd><div style={{padding:"14px 20px",borderBottom:"1px solid "+C.brd,display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{margin:0,fontSize:14,fontWeight:600}}>{ar?"الفواتير":"Invoices"}</h3><Btn outline small onClick={()=>openModal("exportData")}>{ar?"تصدير":"Export"}</Btn></div><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr>{[ar?"رقم الفاتورة":"Invoice",t.date,ar?"الوصف":"Description",t.amount,t.status,""].map((h,i)=><th key={i} style={{padding:"10px 16px",textAlign:"inherit",fontSize:11.5,fontWeight:600,color:C.t2,borderBottom:"1px solid "+C.brd}}>{h}</th>)}</tr></thead><tbody>{invoices.map((inv,i)=><tr key={i} style={{borderBottom:"1px solid "+(dk?C.brd:"#F5F2ED")}}><td style={{padding:"12px 16px",fontWeight:600,color:C.pri}}>{inv.id}</td><td style={{padding:"12px 16px"}}>{inv.date}</td><td style={{padding:"12px 16px"}}>{inv.desc}</td><td style={{padding:"12px 16px",fontWeight:700}}>{inv.amount.toLocaleString()} {t.sar}</td><td style={{padding:"12px 16px"}}><Bg color={inv.status==="paid"?C.ok:C.warn}>{inv.status==="paid"?(ar?"مدفوعة":"Paid"):(ar?"معلقة":"Pending")}</Bg></td><td style={{padding:"12px 16px"}}><Btn small outline onClick={()=>showToast(ar?"جاري التحميل...":"Downloading...")}>{Ico("file",12)} PDF</Btn></td></tr>)}</tbody></table></div></Cd>}

      {billTab==="transactions"&&<Cd><CdH title={t.txns}/><Tbl h={[t.date,t.type,t.name,t.amount,t.ref]} rows={txns.map(tx=>[tx.date,<Bg color={tx.tp==="payment"?C.ok:tx.tp==="refund"?C.info:C.err}>{tx.tp==="payment"?t.payment:tx.tp==="refund"?t.refund:t.charge}</Bg>,tx.desc,<span style={{fontWeight:700,color:tx.amt>0?C.ok:C.err}}>{tx.amt>0?"+":""}{tx.amt.toLocaleString()} {t.sar}</span>,<span style={{fontSize:12,color:C.t3}}>{tx.ref}</span>])}/></Cd>}
    </div>;
  };

  /* Modal + Toast */
  const ModalC = () => {
    if (!modal) return null;
    const close = () => setModal(null);
    const fld = (label, key, ph, type) => (
      <div style={{marginBottom:14}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{label}</label>
        {type==="textarea"?<textarea value={formData[key]||""} onChange={e=>setFormData({...formData,[key]:e.target.value})} placeholder={ph} rows={3} style={{width:"100%",padding:"10px 14px",borderRadius:12,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:13,color:C.txt,outline:"none",resize:"vertical"}}/>
        :type==="select"?<select value={formData[key]||""} onChange={e=>setFormData({...formData,[key]:e.target.value})} style={{width:"100%",padding:"10px 14px",borderRadius:12,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:13,color:C.txt,outline:"none"}}>{(ph||[]).map((o,i)=><option key={i} value={o.v||o}>{o.l||o}</option>)}</select>
        :<input type={type||"text"} value={formData[key]||""} onChange={e=>setFormData({...formData,[key]:e.target.value})} placeholder={ph} style={{width:"100%",padding:"10px 14px",borderRadius:12,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:13,color:C.txt,outline:"none"}}/>}
      </div>
    );
    const chip=(label,active,onClick)=><button onClick={onClick} style={{padding:"6px 14px",borderRadius:8,border:active?"1.5px solid "+C.pri:"1.5px solid "+(dk?C.brd:"#D5D2CC"),background:active?C.pri+"12":"transparent",color:active?C.pri:C.t2,fontFamily:ff,fontSize:11.5,fontWeight:active?600:400,cursor:"pointer"}}>{label}</button>;
    const tmplVars=(formData.tmplVars||[]);
    const tmplBtns=(formData.tmplBtns||[]);
    const addVar=()=>setFormData({...formData,tmplVars:[...tmplVars,{key:"{{"+String(tmplVars.length+1)+"}}",sample:ar?"نص تجريبي":"Sample"}]});
    const addBtn=(type)=>setFormData({...formData,tmplBtns:[...tmplBtns,{type,text:type==="url"?(ar?"زيارة":"Visit"):type==="call"?(ar?"اتصل":"Call"):(ar?"رد سريع":"Quick"),value:""}]});
    const rmVar=(i)=>setFormData({...formData,tmplVars:tmplVars.filter((_,j)=>j!==i)});
    const rmBtn=(i)=>setFormData({...formData,tmplBtns:tmplBtns.filter((_,j)=>j!==i)});
    const waPrev=()=>{const body=formData.tmplBody||(ar?"مرحباً {{1}}، شكراً لطلبك رقم {{2}}":"Hi {{1}}, thanks for order #{{2}}");return <div style={{background:"#E5DDD5",borderRadius:14,padding:18,maxWidth:300}}><div style={{background:"#DCF8C6",borderRadius:"12px 12px 0 12px",padding:"10px 14px",fontSize:12.5,lineHeight:1.7,position:"relative"}}>{formData.tmplHeader&&<div style={{fontWeight:700,marginBottom:6}}>{formData.tmplHeader}</div>}{body.split(/({{[^}]+}})/).map((p,i)=>/{{.*}}/.test(p)?<span key={i} style={{background:"#FFE0B2",borderRadius:4,padding:"1px 4px",fontWeight:600}}>{p}</span>:<span key={i}>{p}</span>)}{formData.tmplFooter&&<div style={{fontSize:11,color:"#667",marginTop:6}}>{formData.tmplFooter}</div>}<div style={{fontSize:9,color:"#999",textAlign:"end",marginTop:4}}>12:00 PM ✓✓</div></div>{tmplBtns.length>0&&<div style={{marginTop:4}}>{tmplBtns.map((b,i)=><div key={i} style={{background:"#fff",borderRadius:8,padding:"8px 12px",textAlign:"center",fontSize:12,color:"#4A90D9",fontWeight:600,marginTop:2,cursor:"pointer"}}>{b.type==="url"?"🔗":b.type==="call"?"📞":"↩"} {b.text}</div>)}</div>}</div>;};

    const cfgs = {
      newTemplate:{title:ar?"إنشاء قالب واتساب":"Create WhatsApp Template",wide:true,fields:()=><div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 280px",gap:20}}>
        <div>
          {fld(ar?"اسم القالب":"Template Name","tmplName",ar?"مثال: تأكيد_طلب":"e.g. order_confirmation")}
          <div style={{display:"flex",gap:6,marginBottom:14}}><label style={{fontSize:12,color:C.t2,width:50,paddingTop:8}}>{ar?"الفئة":"Category"}</label>{["marketing","utility","authentication"].map(c2=>chip(c2==="marketing"?(ar?"تسويقي":"Marketing"):c2==="utility"?(ar?"خدمي":"Utility"):(ar?"مصادقة":"Auth"),(formData.tmplCat||"utility")===c2,()=>setFormData({...formData,tmplCat:c2})))}</div>
          <div style={{display:"flex",gap:6,marginBottom:14}}><label style={{fontSize:12,color:C.t2,width:50,paddingTop:8}}>{ar?"اللغة":"Language"}</label>{chip(ar?"عربي":"Arabic",(formData.tmplLang||"ar")==="ar",()=>setFormData({...formData,tmplLang:"ar"}))}{chip("English",(formData.tmplLang)==="en",()=>setFormData({...formData,tmplLang:"en"}))}</div>
          {fld(ar?"الرأس (اختياري)":"Header (optional)","tmplHeader",ar?"عنوان أو صورة":"Title or image")}
          {fld(ar?"نص الرسالة":"Message Body","tmplBody",ar?"مرحباً {{1}}، شكراً لطلبك رقم {{2}}. حالة الطلب: {{3}}":"Hi {{1}}, thanks for order #{{2}}. Status: {{3}}","textarea")}
          {fld(ar?"التذييل (اختياري)":"Footer (optional)","tmplFooter",ar?"كوربت - خدمة العملاء":"CORBIT - Customer Service")}
          <div style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><label style={{fontSize:12,fontWeight:600}}>{ar?"المتغيرات":"Variables"} ({tmplVars.length})</label><button onClick={addVar} style={{background:C.pri+"12",color:C.pri,border:"none",fontFamily:ff,fontSize:11,fontWeight:600,padding:"4px 12px",borderRadius:6,cursor:"pointer"}}>+ {ar?"متغير":"Variable"}</button></div>{tmplVars.map((v,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}><span style={{fontSize:12,fontWeight:600,color:C.pri,minWidth:40}}>{v.key}</span><input value={v.sample} onChange={e=>{const nv=[...tmplVars];nv[i]={...nv[i],sample:e.target.value};setFormData({...formData,tmplVars:nv})}} style={{flex:1,padding:"6px 10px",borderRadius:8,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:12,color:C.txt,outline:"none"}} placeholder={ar?"قيمة تجريبية":"Sample value"}/><button onClick={()=>rmVar(i)} style={{background:"none",border:"none",color:C.err,cursor:"pointer",fontSize:14}}>×</button></div>)}</div>
          <div style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><label style={{fontSize:12,fontWeight:600}}>{ar?"الأزرار":"Buttons"} ({tmplBtns.length}/3)</label><div style={{display:"flex",gap:4}}>{tmplBtns.length<3&&<>{chip("🔗 URL",false,()=>addBtn("url"))}{chip("📞 "+t.phone,false,()=>addBtn("call"))}{chip("↩ "+(ar?"رد سريع":"Quick"),false,()=>addBtn("quick"))}</>}</div></div>{tmplBtns.map((b,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,padding:"8px 10px",borderRadius:8,background:C.inp}}><span style={{fontSize:11,fontWeight:600,color:b.type==="url"?C.info:b.type==="call"?C.ok:C.warn,minWidth:35}}>{b.type==="url"?"🔗URL":b.type==="call"?"📞":("↩")}</span><input value={b.text} onChange={e=>{const nb=[...tmplBtns];nb[i]={...nb[i],text:e.target.value};setFormData({...formData,tmplBtns:nb})}} placeholder={ar?"نص الزر":"Button text"} style={{flex:1,padding:"5px 8px",borderRadius:6,background:C.card,border:"1px solid "+C.brd,fontFamily:ff,fontSize:11.5,color:C.txt,outline:"none"}}/><input value={b.value} onChange={e=>{const nb=[...tmplBtns];nb[i]={...nb[i],value:e.target.value};setFormData({...formData,tmplBtns:nb})}} placeholder={b.type==="url"?"https://...":b.type==="call"?"+966...":""} style={{flex:1,padding:"5px 8px",borderRadius:6,background:C.card,border:"1px solid "+C.brd,fontFamily:ff,fontSize:11.5,color:C.txt,outline:"none",display:b.type==="quick"?"none":"block"}}/><button onClick={()=>rmBtn(i)} style={{background:"none",border:"none",color:C.err,cursor:"pointer",fontSize:14}}>×</button></div>)}</div>
          <div style={{padding:12,borderRadius:10,background:"#7C3AED08",border:"1px solid #7C3AED20"}}><div style={{fontSize:12,fontWeight:600,color:"#7C3AED",marginBottom:4}}>AI {ar?"اقتراح":"Suggestion"}</div><div style={{fontSize:11.5,color:C.t2}}>{ar?"💡 أضف زر CTA لزيادة التفاعل 40%. القوالب ذات المتغيرات تحقق نسبة فتح أعلى بـ 28%":"💡 Add a CTA button to increase engagement 40%. Templates with variables get 28% higher open rates"}</div></div>
        </div>
        <div><div style={{fontSize:12,fontWeight:600,marginBottom:8}}>{ar?"معاينة واتساب":"WhatsApp Preview"}</div>{waPrev()}</div>
      </div>},
      newCampaign:{title:ar?"إنشاء حملة":"Create Campaign",wide:true,fields:()=><div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
          <div>{fld(ar?"اسم الحملة":"Campaign Name","campName",ar?"عروض رمضان":"Ramadan Offers")}{fld(ar?"القالب":"Template","campTmpl","select",[{v:"",l:ar?"اختر قالب":"Select template"},{v:"welcome",l:ar?"رسالة ترحيب":"Welcome"},{v:"promo",l:ar?"عرض ترويجي":"Promo Offer"},{v:"order",l:ar?"تأكيد طلب":"Order Confirm"},{v:"reminder",l:ar?"تذكير":"Reminder"}])}</div>
          <div>{fld(ar?"الشريحة المستهدفة":"Target Segment","campSeg","select",[{v:"all",l:ar?"جميع العملاء":"All Customers"},{v:"active",l:ar?"نشطون (30 يوم)":"Active (30d)"},{v:"vip",l:ar?"VIP (أكثر من 5 طلبات)":"VIP (5+ orders)"},{v:"inactive",l:ar?"غير نشطين (90 يوم)":"Inactive (90d)"},{v:"cart",l:ar?"سلة متروكة":"Cart Abandoned"}])}{fld(ar?"تاريخ الإرسال":"Send Date","campDate","","date")}</div>
        </div>
        <div style={{marginBottom:14}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{ar?"قناة الإرسال":"Delivery Channel"}</label><div style={{display:"flex",gap:6}}>{[["wa","WhatsApp","📱",C.wa],["sms","SMS","💬","#5B21B6"],["both",ar?"كلاهما":"Both","📡",C.pri],["fallback",ar?"WA ← SMS":"WA→SMS","🔄",C.warn]].map(([v,l,ico,clr])=><button key={v} onClick={()=>setFormData({...formData,campChannel:v})} style={{flex:1,padding:"10px 8px",borderRadius:10,border:(formData.campChannel||"wa")===v?"2px solid "+clr:"2px solid "+(dk?C.brd:"#D5D2CC"),background:(formData.campChannel||"wa")===v?clr+"10":"transparent",cursor:"pointer",textAlign:"center",fontFamily:ff}}><div style={{fontSize:16}}>{ico}</div><div style={{fontSize:11,fontWeight:(formData.campChannel||"wa")===v?700:400,color:(formData.campChannel||"wa")===v?clr:C.t2,marginTop:2}}>{l}</div></button>)}</div></div>
        <div style={{display:"flex",gap:6,marginBottom:14}}><label style={{fontSize:12,color:C.t2,paddingTop:6}}>{ar?"الجدولة":"Schedule"}</label>{["now","scheduled","recurring"].map(s=>chip(s==="now"?(ar?"فوري":"Now"):s==="scheduled"?(ar?"مجدول":"Scheduled"):(ar?"متكرر":"Recurring"),(formData.campSchedule||"now")===s,()=>setFormData({...formData,campSchedule:s})))}</div>
        {fld(ar?"ملاحظات":"Notes","campNotes",ar?"ملاحظات داخلية...":"Internal notes...","textarea")}
        <div style={{padding:12,borderRadius:10,background:C.ok+"08",border:"1px solid "+C.ok+"20",fontSize:12}}><b>{ar?"التقدير":"Estimate"}:</b> {ar?"12,500 مستلم":"12,500 recipients"} · {(formData.campChannel||"wa")==="both"?(ar?"تكلفة: 7,250 ر.س (WA+SMS)":"Cost: 7,250 SAR (WA+SMS)"):(formData.campChannel||"wa")==="sms"?(ar?"تكلفة: 3,750 ر.س (SMS)":"Cost: 3,750 SAR (SMS)"):(ar?"تكلفة: 3,625 ر.س (WA)":"Cost: 3,625 SAR (WA)")} · ~15 {ar?"دقيقة":"min"}</div>
      </div>},
      newContact:{title:ar?"إضافة جهة اتصال":"Add Contact",fields:()=><>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{fld(ar?"الاسم الأول":"First Name","firstName",ar?"محمد":"Mohammed")}{fld(ar?"اسم العائلة":"Last Name","lastName",ar?"أحمد":"Ahmed")}</div>
        {fld(ar?"رقم الهاتف":"Phone","phone","+966 5X XXX XXXX","tel")}
        {fld(ar?"البريد":"Email","email","email@example.com","email")}
        {fld(ar?"الشريحة":"Segment","contSeg","select",[{v:"",l:ar?"اختر":"Select"},{v:"vip",l:"VIP"},{v:"regular",l:ar?"عادي":"Regular"},{v:"new",l:ar?"جديد":"New"}])}
        {fld(ar?"ملاحظات":"Notes","notes",ar?"ملاحظات...":"Notes...","textarea")}
        <div style={{padding:10,borderRadius:8,background:C.inp,fontSize:12,color:C.t2}}>{ar?"💡 يمكنك أيضاً استيراد جهات الاتصال بالجملة عبر ملف CSV":"💡 You can also bulk import contacts via CSV file"}</div>
      </>},
      importContacts:{title:ar?"استيراد جهات الاتصال":"Import Contacts",fields:()=><>
        <div style={{border:"2px dashed "+(dk?C.brd:"#CCC"),borderRadius:14,padding:30,textAlign:"center",marginBottom:14,cursor:"pointer",background:C.inp}}><div style={{fontSize:28,marginBottom:8}}>📁</div><div style={{fontWeight:600,marginBottom:4}}>{ar?"اسحب ملف CSV/Excel هنا":"Drag CSV/Excel file here"}</div><div style={{fontSize:12,color:C.t2}}>{ar?"أو انقر للاختيار":"or click to browse"}</div></div>
        <div style={{fontSize:12,color:C.t2,marginBottom:14}}>{ar?"الأعمدة المطلوبة: الاسم، رقم الهاتف (اختياري: البريد، الشريحة، الملاحظات)":"Required columns: Name, Phone (optional: Email, Segment, Notes)"}</div>
        <div style={{padding:12,borderRadius:10,background:"#7C3AED08",border:"1px solid #7C3AED20"}}><div style={{fontSize:12,fontWeight:600,color:"#7C3AED",marginBottom:4}}>AI {ar?"استيراد ذكي":"Smart Import"}</div><div style={{fontSize:11.5,color:C.t2}}>{ar?"سنتعرف تلقائياً على الأعمدة ونزيل التكرارات ونتحقق من صحة الأرقام":"Auto-detect columns, remove duplicates, and validate phone numbers"}</div></div>
      </>},
      exportData:{title:ar?"تصدير البيانات":"Export Data",fields:()=><>
        <div style={{fontSize:13,marginBottom:14}}>{ar?"اختر البيانات المراد تصديرها:":"Select data to export:"}</div>
        {[ar?"جهات الاتصال":"Contacts",ar?"المحادثات":"Conversations",ar?"الحملات":"Campaigns",ar?"القوالب":"Templates",ar?"التقارير":"Reports"].map((item,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:C.inp,marginBottom:4,cursor:"pointer"}} onClick={()=>setFormData({...formData,["exp_"+i]:!formData["exp_"+i]})}><div style={{width:20,height:20,borderRadius:6,border:formData["exp_"+i]?"2px solid "+C.pri:"2px solid "+C.t3,background:formData["exp_"+i]?C.pri+"15":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{formData["exp_"+i]&&<span style={{color:C.pri,fontSize:12}}>✓</span>}</div><span style={{fontSize:13}}>{item}</span></div>)}
        <div style={{display:"flex",gap:6,marginTop:14}}><label style={{fontSize:12,color:C.t2,paddingTop:6}}>{ar?"الصيغة":"Format"}</label>{chip("CSV",(formData.expFmt||"csv")==="csv",()=>setFormData({...formData,expFmt:"csv"}))}{chip("Excel",(formData.expFmt)==="xlsx",()=>setFormData({...formData,expFmt:"xlsx"}))}{chip("JSON",(formData.expFmt)==="json",()=>setFormData({...formData,expFmt:"json"}))}</div>
      </>},
      newTeam:{title:ar?"إنشاء فريق":"New Team",fields:()=><>
        {fld(ar?"اسم الفريق":"Team Name","teamName",ar?"فريق الدعم":"Support Team")}
        {fld(ar?"الوصف":"Description","teamDesc",ar?"وصف الفريق...":"Team description...","textarea")}
        {fld(ar?"القائد":"Team Leader","teamLead","select",[{v:"",l:ar?"اختر":"Select"},{v:"saad",l:ar?"سعد":"Saad"},{v:"hind",l:ar?"هند":"Hind"},{v:"majed",l:ar?"ماجد":"Majed"}])}
        <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:8}}>{ar?"كاتالوج الخدمات":"Service Catalog"}</label><div style={{fontSize:11.5,color:C.t2,marginBottom:8}}>{ar?"حدد الخدمات التي يقدمها هذا الفريق للتوجيه التلقائي":"Define services this team handles for auto-routing"}</div>{[ar?"استعادة كلمة المرور":"Password Reset",ar?"الشكاوى":"Complaints",ar?"تسجيل طلب شراء":"Purchase Orders",ar?"الاستفسارات العامة":"General Inquiries",ar?"الدعم الفني":"Technical Support",ar?"الاسترجاع والاستبدال":"Returns & Exchanges"].map((svc,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:C.inp,marginBottom:3,cursor:"pointer"}} onClick={()=>{const svcs=formData.teamSvcs||[];setFormData({...formData,teamSvcs:svcs.includes(i)?svcs.filter(x=>x!==i):[...svcs,i]})}}><div style={{width:18,height:18,borderRadius:5,border:(formData.teamSvcs||[]).includes(i)?"2px solid "+C.pri:"2px solid "+C.t3,background:(formData.teamSvcs||[]).includes(i)?C.pri+"15":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{(formData.teamSvcs||[]).includes(i)&&<span style={{color:C.pri,fontSize:10}}>✓</span>}</div><span style={{fontSize:12}}>{svc}</span></div>)}</div>
      </>},
      newFlow:{title:ar?"إنشاء تدفق":"New Bot Flow",fields:()=><>
        {fld(ar?"اسم البوت":"Bot Name","flowName",ar?"بوت الترحيب":"Welcome Bot")}
        {fld(ar?"الكلمة المفتاحية":"Trigger Keyword","keyword",ar?"مرحبا، أهلاً، hi":"hello, hi, start")}
        {fld(ar?"رسالة الترحيب":"Welcome Message","welcomeMsg",ar?"أهلاً وسهلاً! كيف أقدر أساعدك؟":"Hello! How can I help you?","textarea")}
        <div style={{display:"flex",gap:6,marginBottom:14}}><label style={{fontSize:12,color:C.t2,paddingTop:6}}>{ar?"النوع":"Type"}</label>{["support","sales","faq"].map(tp=>chip(tp==="support"?(ar?"دعم":"Support"):tp==="sales"?(ar?"مبيعات":"Sales"):"FAQ",(formData.flowType||"support")===tp,()=>setFormData({...formData,flowType:tp})))}</div>
        <div style={{padding:10,borderRadius:8,background:C.inp,fontSize:12,color:C.t2}}>{ar?"💡 بعد الإنشاء، يمكنك تعديل التدفق بصرياً في محرر التدفقات":"💡 After creation, you can visually edit the flow in the flow editor"}</div>
      </>},
      topUp:{title:ar?"شحن الرصيد":"Top Up",fields:()=><><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>{[500,1000,2500,5000].map(a=><div key={a} onClick={()=>setFormData({...formData,topUpAmt:a})} style={{padding:12,borderRadius:10,background:formData.topUpAmt===a?C.pri+"20":C.inp,border:formData.topUpAmt===a?"2px solid "+C.pri:"2px solid transparent",cursor:"pointer",textAlign:"center",fontWeight:700}}>{a.toLocaleString()}</div>)}</div>{fld(ar?"مبلغ مخصص":"Custom","topUpAmt","","number")}</>},
    };
    const cfg = cfgs[modal];
    if (!cfg) return null;
    return (
      <div onClick={close} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(3px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{width:cfg.wide?860:520,maxWidth:"95vw",maxHeight:"90vh",background:C.card,borderRadius:18,border:"1px solid "+C.brd,display:"flex",flexDirection:"column",boxShadow:"0 25px 60px rgba(0,0,0,0.3)"}}>
          <div style={{padding:"20px 24px",borderBottom:"1px solid "+C.brd,display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{margin:0,fontSize:18,fontWeight:700}}>{cfg.title}</h2><button onClick={close} style={{background:"none",border:"none",color:C.t2,cursor:"pointer"}}>{Ico("x",18)}</button></div>
          <div style={{padding:24,overflowY:"auto",flex:1}}>{cfg.fields()}</div>
          <div style={{padding:"16px 24px",borderTop:"1px solid "+C.brd,display:"flex",gap:8,justifyContent:"flex-end"}}><Btn outline onClick={close}>{t.cancel}</Btn><Btn primary onClick={()=>{close();showToast(ar?"تم بنجاح ✓":"Success ✓")}}>{modal==="newTemplate"?(ar?"إرسال للمراجعة":"Submit for Review"):modal==="exportData"?(ar?"تصدير":"Export"):t.save}</Btn></div>
        </div>
      </div>
    );
  };

  const IntPg = () => {
    const apps=[
      {id:"shopify",name:"Shopify",cat:"ecommerce",desc:ar?"مزامنة المنتجات والطلبات":"Sync products & orders",icon:"🛒",color:"#96BF48",pop:true,features:ar?["مزامنة تلقائية","إشعارات الطلبات","تتبع الشحن","سلة متروكة"]:["Auto sync","Order notifications","Shipping tracking","Cart recovery"]},
      {id:"hubspot",name:"HubSpot",cat:"crm",desc:ar?"مزامنة جهات الاتصال والصفقات":"Sync contacts & deals",icon:"🔶",color:"#FF7A59",pop:true,features:ar?["مزامنة ثنائية","إنشاء صفقات","تسجيل النشاط"]:["Two-way sync","Create deals","Activity logging"]},
      {id:"zapier",name:"Zapier",cat:"automation",desc:ar?"اربط مع 5000+ تطبيق":"Connect 5000+ apps",icon:"⚡",color:"#FF4A00",pop:true,features:ar?["5000+ تكامل","أتمتة بدون كود","مشغلات واتساب"]:["5000+ integrations","No-code","WhatsApp triggers"]},
      {id:"sheets",name:"Google Sheets",cat:"automation",desc:ar?"تصدير البيانات تلقائياً":"Auto-export data",icon:"📊",color:"#0F9D58",features:ar?["تصدير جهات الاتصال","تقارير","تحديث تلقائي"]:["Export contacts","Reports","Auto-update"]},
      {id:"salesforce",name:"Salesforce",cat:"crm",desc:ar?"تكامل CRM للمؤسسات":"Enterprise CRM",icon:"☁️",color:"#00A1E0",pop:true,features:ar?["مزامنة العملاء","تحديث الفرص","تقارير مخصصة"]:["Lead sync","Opportunity updates","Custom reports"]},
      {id:"stripe",name:"Stripe",cat:"payment",desc:ar?"معالجة المدفوعات":"Process payments",icon:"💳",color:"#635BFF",pop:true,features:ar?["روابط دفع","إيصالات تلقائية","اشتراكات"]:["Payment links","Auto receipts","Subscriptions"]},
      {id:"slack",name:"Slack",cat:"productivity",desc:ar?"إشعارات الفريق":"Team notifications",icon:"💬",color:"#4A154B",features:ar?["إشعارات","تنبيهات VIP","تقارير يومية"]:["Alerts","VIP alerts","Daily reports"]},
    ];
    const cats=[{k:"all",l:ar?"الكل":"All"},{k:"ecommerce",l:ar?"متاجر":"E-com"},{k:"crm",l:"CRM"},{k:"automation",l:ar?"أتمتة":"Auto"},{k:"payment",l:ar?"مدفوعات":"Pay"},{k:"productivity",l:ar?"إنتاجية":"Prod"}];
    const filtered=apps.filter(a=>(intTab2==="all"||a.cat===intTab2)&&(!intSearch||a.name.toLowerCase().includes(intSearch.toLowerCase())));
    const isC=id=>conn2.includes(id);
    if(intView2){const app=apps.find(a=>a.id===intView2);if(!app)return null;const connected=isC(app.id);
    return <div style={{padding:"0 24px 24px"}}><button onClick={()=>setIntView2(null)} style={{background:"none",border:"none",color:C.pri,fontFamily:ff,fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:14}}>{ar?"← العودة":"← Back"}</button>
      <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"2fr 1fr",gap:16}}>
        <div><Cd style={{padding:20,marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:52,height:52,borderRadius:14,background:app.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{app.icon}</div><div style={{flex:1}}><h2 style={{margin:"0 0 4px",fontSize:18,fontWeight:700}}>{app.name}</h2><p style={{margin:0,fontSize:12,color:C.t2}}>{app.desc}</p><div style={{display:"flex",gap:4,marginTop:6}}><Bg color={connected?C.ok:C.t3}>{connected?t.connected2:ar?"غير متصل":"Not Connected"}</Bg></div></div>{connected?<Btn outline small style={{color:C.err,borderColor:C.err}} onClick={()=>{setConn2(conn2.filter(x=>x!==app.id));showToast("✓")}}>{ar?"فصل":"Disconnect"}</Btn>:<Btn primary onClick={()=>{setConn2([...conn2,app.id]);showToast("✓")}}>{ar?"ربط":"Connect"}</Btn>}</div></Cd>
          <Cd style={{padding:20}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{t.features}</h3><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{app.features.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:C.inp,fontSize:12}}><span style={{color:C.ok}}>{Ico("check",12)}</span>{f}</div>)}</div></Cd></div>
        <Cd style={{padding:18,alignSelf:"start"}}><div style={{fontSize:13,fontWeight:700,color:"#7C3AED",marginBottom:10}}>AI {ar?"اقتراحات":"Tips"}</div>{(ar?["ربط هذا التطبيق يزيد المبيعات 15%","العملاء المتصلون حققوا ROI أعلى"]:["Connecting boosts sales 15%","Connected customers see higher ROI"]).map((tip,i)=><div key={i} style={{padding:"8px 10px",borderRadius:8,background:C.inp,marginBottom:4,fontSize:12}}>{i===0?"💡":"🎯"} {tip}</div>)}</Cd>
      </div></div>;}
    return <div style={{padding:"0 24px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700}}>{t.integrations}</h2><p style={{fontSize:13,color:C.t2,margin:0}}>{ar?"اربط منصتك مع أدواتك":"Connect with your tools"}</p></div></div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:10,background:C.inp,flex:1,minWidth:180}}>{Ico("search",14)}<input value={intSearch} onChange={e=>setIntSearch(e.target.value)} placeholder={t.search} style={{border:"none",background:"none",outline:"none",fontFamily:ff,fontSize:12,color:C.txt,width:"100%"}}/></div></div>
      <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>{cats.map(ct=><button key={ct.k} onClick={()=>setIntTab2(ct.k)} style={{padding:"5px 12px",borderRadius:7,border:intTab2===ct.k?"1.5px solid "+C.pri:"1.5px solid "+(dk?C.brd:"#D5D2CC"),background:intTab2===ct.k?C.pri+"10":"transparent",fontFamily:ff,fontSize:11,color:intTab2===ct.k?C.pri:C.t2,cursor:"pointer",fontWeight:intTab2===ct.k?600:400}}>{ct.l}</button>)}</div>
      {conn2.length>0&&<div style={{padding:"10px 16px",marginBottom:14,borderRadius:10,background:C.ok+"08",border:"1px solid "+C.ok+"20",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,fontWeight:600,color:C.ok}}>{Ico("check",12)} {conn2.length} {ar?"متصلة":"connected"}</span><div style={{display:"flex",gap:3,marginInlineStart:"auto"}}>{conn2.map(id=>{const a=apps.find(x=>x.id===id);return a?<span key={id} onClick={()=>setIntView2(id)} style={{width:28,height:28,borderRadius:7,background:a.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer"}}>{a.icon}</span>:null;})}</div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>{filtered.map(app=>{const connected=isC(app.id);return <Cd key={app.id} style={{cursor:"pointer",border:connected?"1.5px solid "+C.ok+"30":"1.5px solid transparent"}} onClick={()=>setIntView2(app.id)}><div style={{padding:16}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}><div style={{width:42,height:42,borderRadius:12,background:app.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{app.icon}</div><div><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontWeight:700,fontSize:14}}>{app.name}</span>{app.pop&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:4,background:C.warn+"15",color:C.warn}}>⭐</span>}</div><p style={{margin:0,fontSize:11,color:C.t2}}>{app.desc}</p></div></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><Bg color={connected?C.ok:C.t3}>{connected?t.connected2:ar?"متاح":"Available"}</Bg>{connected?<Btn small outline>{t.edit}</Btn>:<Btn small primary onClick={e=>{e.stopPropagation();setConn2([...conn2,app.id]);showToast("✓")}}>{ar?"ربط":"Connect"}</Btn>}</div></div></Cd>;})}</div>
    </div>;
  };
  const SetPg = () => {
    const aiC2="#7C3AED";
    const [stSaved,setStSaved]=useState(false);
    const save=()=>{showToast(ar?"تم الحفظ ✓":"Saved ✓");setStSaved(true);setTimeout(()=>setStSaved(false),2000)};
    return <div style={{padding:"0 24px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700}}>{t.settings}</h2><p style={{fontSize:13,color:C.t2,margin:0}}>{ar?"تخصيص منصتك":"Customize your platform"}</p></div></div>
      <div style={{marginBottom:16}}><TBr tabs={[{k:"general",l:t.general},{k:"notifications",l:ar?"الإشعارات":"Notifications"},{k:"security",l:t.security},{k:"channels",l:t.channels},{k:"team",l:ar?"الفريق":"Team"},{k:"api",l:t.api}]} active={stTab} onChange={setStTab}/></div>

      {stTab==="general"&&<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}>
        <Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"معلومات الشركة":"Company Info"}</h3>
          {[[t.compName,ar?"كوربت":"CORBIT","text"],[ar?"البريد الرسمي":"Official Email","admin@corbit.sa","email"],[ar?"رقم الهاتف":"Phone","+966 11 234 5678","tel"],[ar?"الموقع":"Website","https://corbit.sa","url"],[t.tz,"Asia/Riyadh (UTC+3)","text"],[t.currency,ar?"ريال سعودي (SAR)":"SAR","text"]].map(([l,v,tp],i)=><div key={i} style={{marginBottom:12}}><label style={{fontSize:11.5,color:C.t2,display:"block",marginBottom:4}}>{l}</label><input defaultValue={v} type={tp} style={{width:"100%",padding:"9px 12px",borderRadius:10,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:12.5,color:C.txt,outline:"none"}}/></div>)}
          <div style={{marginBottom:14}}><label style={{fontSize:11.5,color:C.t2,display:"block",marginBottom:4}}>{ar?"الوصف":"Description"}</label><textarea defaultValue={ar?"منصة واتساب الأعمال المتكاملة":"Integrated WhatsApp Business Platform"} rows={2} style={{width:"100%",padding:"9px 12px",borderRadius:10,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:12.5,color:C.txt,outline:"none",resize:"vertical"}}/></div>
          <div style={{marginBottom:14}}><label style={{fontSize:11.5,color:C.t2,display:"block",marginBottom:8}}>{ar?"شعار الشركة":"Company Logo"}</label><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:56,height:56,borderRadius:14,background:GR,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#fff"}}>C</div><div><Btn outline small onClick={()=>showToast("✓")}>{ar?"تغيير الشعار":"Change Logo"}</Btn><div style={{fontSize:11,color:C.t3,marginTop:4}}>PNG, JPG {ar?"حتى":"up to"} 2MB</div></div></div></div>
          <Btn primary onClick={save}>{t.save}</Btn></Cd>
        <div>
          <Cd style={{padding:18,marginBottom:14}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"المظهر":"Appearance"}</h3>
            <div style={{marginBottom:14}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:8}}>{ar?"الوضع":"Theme"}</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[[ar?"فاتح":"Light","☀️",!dk],[ar?"داكن":"Dark","🌙",dk]].map(([l,ico,sel],i)=><div key={i} onClick={()=>{setTheme(sel?theme:dk?"light":"dark")}} style={{padding:14,borderRadius:12,background:sel?C.pri+"12":C.inp,border:sel?"2px solid "+C.pri:"2px solid transparent",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{ico}</div><div style={{fontSize:12,fontWeight:sel?700:400}}>{l}</div></div>)}</div></div>
            <div style={{marginBottom:14}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:8}}>{ar?"اللغة":"Language"}</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{[["عربي","🇸🇦",ar],["English","🇬🇧",!ar]].map(([l,fl,sel],i)=><div key={i} onClick={()=>setLang(i===0?"ar":"en")} style={{padding:12,borderRadius:12,background:sel?C.pri+"12":C.inp,border:sel?"2px solid "+C.pri:"2px solid transparent",cursor:"pointer",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{fontSize:16}}>{fl}</span><span style={{fontSize:12,fontWeight:sel?700:400}}>{l}</span></div>)}</div></div>
            <div><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:8}}>{ar?"ساعات العمل":"Business Hours"}</label><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>{(ar?["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"]:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]).map((d,i)=><div key={i} style={{padding:8,borderRadius:8,textAlign:"center",background:i<5?C.ok+"10":C.inp,fontSize:10,fontWeight:600,color:i<5?C.ok:C.t3}}>{d}<div style={{fontSize:9,marginTop:2}}>{i<5?"9-6":ar?"عطلة":"Off"}</div></div>)}</div></div>
          </Cd>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>{ar?"رسائل تلقائية":"Auto Messages"}</h3>
            {[[ar?"رسالة الترحيب":"Welcome",ar?"أهلاً بك! كيف أقدر أساعدك؟":"Hello! How can I help?",true],[ar?"خارج الدوام":"Away",ar?"شكراً لتواصلك، سنرد خلال ساعات العمل":"Thanks, we'll reply during business hours",true],[ar?"رسالة الانتظار":"Queue",ar?"جميع الوكلاء مشغولون، سنرد قريباً":"All agents busy, we'll respond soon",false]].map(([l,msg,on],i)=><div key={i} style={{padding:12,borderRadius:10,background:C.inp,marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontWeight:600,fontSize:12}}>{l}</span><Toggle on={on} onToggle={()=>showToast("✓")}/></div><div style={{fontSize:11,color:C.t2,lineHeight:1.5}}>{msg}</div></div>)}</Cd>
        </div>
      </div>}

      {stTab==="notifications"&&<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}>
        <Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"إشعارات المنصة":"Platform Notifications"}</h3>
          {[[ar?"محادثة جديدة":"New Conversation",ar?"عند ورود محادثة جديدة":"When a new conversation arrives",true],[ar?"رسالة جديدة":"New Message",ar?"عند ورود رسالة في محادثة مفتوحة":"New message in open conversation",true],[ar?"إسناد محادثة":"Assignment",ar?"عند إسنادك محادثة":"When assigned a conversation",true],[ar?"تصعيد":"Escalation",ar?"عند تصعيد محادثة":"When a conversation is escalated",true],[ar?"SLA قريب":"SLA Warning",ar?"قبل انتهاء وقت SLA":"Before SLA time expires",true],[ar?"رصيد منخفض":"Low Balance",ar?"عند انخفاض الرصيد عن 500 ر.س":"When balance below 500 SAR",true]].map(([l,desc,on],i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:10,background:C.inp,marginBottom:4}}><div style={{flex:1}}><div style={{fontWeight:600,fontSize:12}}>{l}</div><div style={{fontSize:11,color:C.t2,marginTop:1}}>{desc}</div></div><Toggle on={on} onToggle={()=>showToast("✓")}/></div>)}</Cd>
        <Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"قنوات الإشعار":"Notification Channels"}</h3>
          {[[ar?"إشعارات المتصفح":"Browser Push",ar?"إشعارات فورية في المتصفح":"Instant browser notifications",true],[ar?"البريد الإلكتروني":"Email",ar?"ملخص يومي + تنبيهات عاجلة":"Daily digest + urgent alerts",true],[ar?"صوت الإشعار":"Sound",ar?"تنبيه صوتي عند ورود رسالة":"Audio alert on new message",false],[ar?"إشعارات الهاتف":"Mobile Push",ar?"إشعارات تطبيق الهاتف":"Mobile app notifications",true]].map(([l,desc,on],i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:10,background:C.inp,marginBottom:4}}><div style={{flex:1}}><div style={{fontWeight:600,fontSize:12}}>{l}</div><div style={{fontSize:11,color:C.t2,marginTop:1}}>{desc}</div></div><Toggle on={on} onToggle={()=>showToast("✓")}/></div>)}
          <div style={{marginTop:12}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{ar?"أوقات الصمت":"Quiet Hours"}</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="time" defaultValue="22:00" style={{padding:"7px 10px",borderRadius:8,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:12,color:C.txt}}/><span style={{color:C.t2,fontSize:12}}>{ar?"إلى":"to"}</span><input type="time" defaultValue="07:00" style={{padding:"7px 10px",borderRadius:8,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:12,color:C.txt}}/></div></div>
          <div style={{marginTop:14}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{ar?"تقارير تلقائية":"Auto Reports"}</label><div style={{display:"flex",gap:6}}>{[ar?"يومي":"Daily",ar?"أسبوعي":"Weekly",ar?"شهري":"Monthly"].map((r,i)=><button key={i} style={{padding:"6px 14px",borderRadius:8,border:i===1?"1.5px solid "+C.pri:"1.5px solid "+(dk?C.brd:"#D5D2CC"),background:i===1?C.pri+"12":"transparent",color:i===1?C.pri:C.t2,fontFamily:ff,fontSize:11,cursor:"pointer",fontWeight:i===1?600:400}}>{r}</button>)}</div></div>
        </Cd>
      </div>}

      {stTab==="security"&&<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}>
        <Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"المصادقة والوصول":"Authentication"}</h3>
          {[[t.twoFA,ar?"حماية إضافية بكود SMS":"Extra protection with SMS code",true,"🔐"],[ar?"تسجيل الدخول الموحد":"SSO (SAML)",ar?"تسجيل دخول عبر Google/Microsoft":"Login via Google/Microsoft",false,"🔑"],[ar?"قفل IP":"IP Whitelist",ar?"السماح بالوصول من IPs محددة":"Allow access from specific IPs only",false,"🌐"],[ar?"انتهاء الجلسة":"Session Timeout",ar?"إنهاء الجلسة بعد 30 دقيقة عدم نشاط":"End session after 30min inactivity",true,"⏱️"]].map(([l,desc,on,ico],i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px",borderRadius:12,background:C.inp,marginBottom:6}}><div style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{fontSize:16}}>{ico}</span><div><div style={{fontWeight:600,fontSize:12.5}}>{l}</div><div style={{fontSize:11,color:C.t2,marginTop:2}}>{desc}</div></div></div><Toggle on={on} onToggle={()=>showToast("✓")}/></div>)}
          <div style={{marginTop:10}}><label style={{fontSize:12,color:C.t2,display:"block",marginBottom:6}}>{ar?"سياسة كلمة المرور":"Password Policy"}</label><div style={{display:"flex",gap:6}}>{[ar?"عادية":"Basic",ar?"متوسطة":"Medium",ar?"قوية":"Strong"].map((p,i)=><button key={i} style={{padding:"6px 14px",borderRadius:8,border:i===2?"1.5px solid "+C.pri:"1.5px solid "+(dk?C.brd:"#D5D2CC"),background:i===2?C.pri+"12":"transparent",color:i===2?C.pri:C.t2,fontFamily:ff,fontSize:11,cursor:"pointer",fontWeight:i===2?600:400}}>{p}</button>)}</div></div></Cd>
        <Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{t.audit}</h3>
          <div style={{fontSize:12,color:C.t2,marginBottom:12}}>{ar?"آخر الأنشطة المسجّلة":"Recent audit log entries"}</div>
          {[[ar?"تسجيل دخول":"Login","admin@corbit.sa","2026-03-04 09:15",C.ok],[ar?"تعديل إعدادات":"Settings Change","admin@corbit.sa","2026-03-04 08:42",C.warn],[ar?"إنشاء قالب":"Template Created","hind@corbit.sa","2026-03-03 16:30",C.info],[ar?"حذف جهة اتصال":"Contact Deleted","saad@corbit.sa","2026-03-03 14:15",C.err],[ar?"تصدير بيانات":"Data Export","admin@corbit.sa","2026-03-03 11:00",C.info],[ar?"تعديل صلاحيات":"Role Change","admin@corbit.sa","2026-03-02 17:45",C.warn]].map(([action,user,time,clr],i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,background:C.inp,marginBottom:3}}><div style={{width:6,height:6,borderRadius:3,background:clr,flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{action}</div><div style={{fontSize:10.5,color:C.t3}}>{user}</div></div><span style={{fontSize:10.5,color:C.t3,flexShrink:0}}>{time}</span></div>)}
          <Btn outline small style={{marginTop:8,width:"100%",justifyContent:"center"}}>{ar?"عرض السجل الكامل":"View Full Log"}</Btn></Cd>
      </div>}

      {stTab==="channels"&&<div>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
          <Cd style={{padding:18}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><div style={{width:30,height:30,borderRadius:8,background:C.wa+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico("phone",14)}</div><h3 style={{margin:0,fontSize:14,fontWeight:700}}>WhatsApp</h3><Bg color={C.ok}>{ar?"نشط":"Active"}</Bg></div>
            {[["+966 50 123 4567",ar?"الرئيسي":"Primary","verified","8,420"],["+966 55 987 6543",ar?"المبيعات":"Sales","verified","3,200"],["+966 53 456 7890",ar?"الدعم":"Support","pending","—"]].map(([num,label,st2,conv],i)=><div key={i} style={{padding:10,borderRadius:10,background:C.inp,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:8,background:C.wa+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>📱</div><div><div style={{fontWeight:600,fontSize:12}}>{num}</div><div style={{fontSize:10,color:C.t2}}>{label}</div></div></div><div style={{textAlign:"end"}}><Bg color={st2==="verified"?C.ok:C.warn}>{st2==="verified"?(ar?"موثّق":"✓"):"⏳"}</Bg><div style={{fontSize:10,color:C.t3,marginTop:2}}>{conv} {ar?"محادثة":"conv"}</div></div></div>)}
            <Btn primary small style={{marginTop:6}} onClick={()=>showToast("✓")}>+ {ar?"إضافة رقم":"Add Number"}</Btn></Cd>
          <Cd style={{padding:18}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><div style={{width:30,height:30,borderRadius:8,background:"#5B21B615",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💬</div><h3 style={{margin:0,fontSize:14,fontWeight:700}}>SMS</h3>{smsEnabled?<Bg color={C.ok}>{ar?"نشط":"Active"}</Bg>:<Bg color={C.t3}>{ar?"معطّل":"Off"}</Bg>}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:10,background:smsEnabled?C.ok+"08":C.inp,border:smsEnabled?"1px solid "+C.ok+"20":"1px solid transparent",marginBottom:10}}><div><div style={{fontWeight:700,fontSize:12}}>{ar?"تفعيل خدمة SMS":"Enable SMS"}</div><div style={{fontSize:10.5,color:C.t2,marginTop:1}}>{ar?"إرسال رسائل نصية للعملاء":"Send text messages to customers"}</div></div><Toggle on={smsEnabled} onToggle={()=>setSmsEnabled(!smsEnabled)}/></div>
            {smsEnabled&&<><div style={{marginBottom:8}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:3}}>{ar?"مزود الخدمة":"Provider"}</label><select defaultValue="unifonic" style={{width:"100%",padding:"8px 10px",borderRadius:8,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:12,color:C.txt}}><option value="unifonic">Unifonic</option><option value="twilio">Twilio</option><option value="taqnyat">{ar?"تقنيات":"Taqnyat"}</option><option value="messagebird">MessageBird</option></select></div>
              <div style={{marginBottom:8}}><label style={{fontSize:11,color:C.t2,display:"block",marginBottom:3}}>{ar?"معرّف المرسل":"Sender ID"}</label><input defaultValue="CORBIT" style={{width:"100%",padding:"8px 10px",borderRadius:8,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:12,color:C.txt}}/></div>
              <div style={{padding:10,borderRadius:8,background:C.inp,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}><span style={{color:C.t2}}>{ar?"رصيد SMS":"SMS Balance"}</span><span style={{fontWeight:700,color:"#5B21B6"}}>2,340</span></div><ProgBar value={46.8} color="#5B21B6"/><div style={{fontSize:10,color:C.t3,marginTop:3}}>{ar?"مستخدم":"Used"}: 2,660 / 5,000</div></div>
              <div style={{display:"flex",gap:4}}><Btn primary small onClick={()=>openModal("topUp")}>{ar?"شحن SMS":"Top Up"}</Btn><Btn outline small onClick={()=>showToast("✓")}>{ar?"اختبار":"Test"}</Btn></div>
            </>}</Cd>
        </div>
        <Cd style={{padding:18,marginBottom:14}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"تفضيلات القنوات":"Channel Preferences"}</h3>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr 1fr",gap:8,marginBottom:14}}>{[[ar?"واتساب فقط":"WhatsApp Only",ar?"إرسال عبر واتساب":"Send via WhatsApp","wa",!smsFallback&&!smsDual],[ar?"واتساب + SMS احتياطي":"WA → SMS Fallback",ar?"إذا فشل واتساب، يُرسل SMS":"If WA fails, auto-send SMS","fallback",smsFallback&&!smsDual],[ar?"قناتين معاً":"Dual Channel",ar?"إرسال على القناتين":"Send on both channels","dual",smsDual]].map(([l,desc,mode,sel],i)=><div key={i} onClick={()=>{if(mode==="wa"){setSmsFallback(false);setSmsDual(false)}else if(mode==="fallback"){setSmsFallback(true);setSmsDual(false)}else{setSmsFallback(false);setSmsDual(true)}}} style={{padding:12,borderRadius:10,background:sel?C.pri+"10":C.inp,border:sel?"2px solid "+C.pri:"2px solid transparent",cursor:"pointer"}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:16,height:16,borderRadius:8,border:sel?"2px solid "+C.pri:"2px solid "+C.t3,display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<div style={{width:7,height:7,borderRadius:4,background:C.pri}}/>}</div><span style={{fontWeight:600,fontSize:12}}>{l}</span></div><div style={{fontSize:10.5,color:C.t2,lineHeight:1.4}}>{desc}</div></div>)}</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:8}}>{[[ar?"الحملات":"Campaigns",ar?"القناة الافتراضية":"Default channel","campaign"],[ar?"الإشعارات":"Notifications",ar?"قناة الإشعارات":"Notification channel","notif"],[ar?"تأكيد الطلبات":"Orders",ar?"قناة تأكيد الطلبات":"Order confirmation","order"],[ar?"المصادقة OTP":"OTP Auth",ar?"رموز التحقق":"Verification codes","otp"]].map(([l,desc,key],i)=><div key={i} style={{padding:10,borderRadius:8,background:C.inp}}><div style={{fontWeight:600,fontSize:11.5,marginBottom:2}}>{l}</div><div style={{fontSize:10,color:C.t2,marginBottom:6}}>{desc}</div><select defaultValue={key==="otp"?"sms":"wa"} style={{width:"100%",padding:"6px 8px",borderRadius:6,background:C.card,border:"1px solid "+C.brd,fontFamily:ff,fontSize:11,color:C.txt}}><option value="wa">WhatsApp</option>{smsEnabled&&<option value="sms">SMS</option>}{smsEnabled&&<option value="both">{ar?"كلاهما":"Both"}</option>}{smsEnabled&&<option value="fallback">{ar?"WA ← SMS احتياطي":"WA → SMS Fallback"}</option>}</select></div>)}</div></Cd>
        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"ملف واتساب":"WA Profile"}</h3>{[[ar?"اسم العرض":"Name",ar?"كوربت":"CORBIT"],[ar?"الوصف":"About",ar?"منصة واتساب":"WA Platform"],[ar?"العنوان":"Address",ar?"الرياض":"Riyadh"],[ar?"الموقع":"Web","https://corbit.sa"]].map(([l,v],i)=><div key={i} style={{marginBottom:8}}><label style={{fontSize:10.5,color:C.t2,display:"block",marginBottom:2}}>{l}</label><input defaultValue={v} style={{width:"100%",padding:"7px 10px",borderRadius:8,background:C.inp,border:"1px solid "+C.brd,fontFamily:ff,fontSize:12,color:C.txt,outline:"none"}}/></div>)}<Btn primary small onClick={save}>{t.save}</Btn></Cd>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700}}>{ar?"مقارنة القنوات":"Channel Comparison"}</h3>{[["WhatsApp",{rate:ar?"نسبة القراءة":"Read Rate",val:"79%",clr:C.ok},{rate:ar?"التكلفة":"Cost",val:"0.29 "+t.sar,clr:C.pri},{rate:ar?"الوسائط":"Media",val:"✓",clr:C.ok}],["SMS",{rate:ar?"نسبة القراءة":"Read Rate",val:"95%",clr:C.ok},{rate:ar?"التكلفة":"Cost",val:"0.30 "+t.sar,clr:C.warn},{rate:ar?"الوسائط":"Media",val:"✗",clr:C.err}]].map(([ch,r1,r2,r3],i)=><div key={i} style={{padding:10,borderRadius:8,background:C.inp,marginBottom:6}}><div style={{fontWeight:700,fontSize:12,marginBottom:6}}>{ch}</div><div style={{display:"flex",gap:10}}>{[r1,r2,r3].map((r,j)=><div key={j} style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:C.t2}}>{r.rate}</div><div style={{fontSize:13,fontWeight:700,color:r.clr}}>{r.val}</div></div>)}</div></div>)}<div style={{padding:8,borderRadius:6,background:"#7C3AED08",fontSize:10.5,color:C.t2}}>💡 {ar?"SMS أعلى قراءة لكن بدون وسائط. واتساب أغنى محتوى وأرخص للحملات":"SMS has higher read rate but no media. WhatsApp is richer and cheaper for campaigns"}</div></Cd>
        </div>
      </div>}

      {stTab==="team"&&<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}>
        <Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"الصلاحيات":"Roles & Permissions"}</h3>
          {[[ar?"مدير":"Admin",ar?"وصول كامل لجميع الإعدادات والبيانات":"Full access to all settings and data","🔴",3],[ar?"مشرف":"Supervisor",ar?"إدارة الفريق والمحادثات والتقارير":"Manage team, conversations, reports","🟡",2],[ar?"وكيل":"Agent",ar?"الرد على المحادثات المسندة فقط":"Reply to assigned conversations only","🔵",8]].map(([role,desc,dot,count],i)=><div key={i} style={{padding:14,borderRadius:12,background:C.inp,marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:6}}><span>{dot}</span><span style={{fontWeight:700,fontSize:13}}>{role}</span><Bg color={C.t3}>{count}</Bg></div><Btn small outline>{t.edit}</Btn></div><div style={{fontSize:11,color:C.t2}}>{desc}</div></div>)}</Cd>
        <div>
          <Cd style={{padding:18,marginBottom:14}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{ar?"إعدادات المحادثات":"Conversation Settings"}</h3>
            {[[ar?"إغلاق تلقائي":"Auto Close",ar?"إغلاق المحادثة بعد 24 ساعة عدم نشاط":"Close after 24h inactivity",true],[ar?"توزيع تلقائي":"Auto Assign",ar?"توزيع المحادثات الجديدة تلقائياً":"Auto-distribute new conversations",true],[ar?"تحويل للعميل":"Customer Takeover",ar?"السماح للعميل بطلب وكيل بشري":"Allow customer to request human agent",true],[ar?"تقييم بعد الإغلاق":"Post-Close Survey",ar?"إرسال استبيان رضا تلقائي":"Send satisfaction survey automatically",false]].map(([l,desc,on],i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",borderRadius:10,background:C.inp,marginBottom:4}}><div style={{flex:1}}><div style={{fontWeight:600,fontSize:12}}>{l}</div><div style={{fontSize:10.5,color:C.t2,marginTop:1}}>{desc}</div></div><Toggle on={on} onToggle={()=>showToast("✓")}/></div>)}</Cd>
          <Cd style={{padding:18}}><h3 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>SLA</h3>
            {[[ar?"وقت الاستجابة الأولى":"First Response",ar?"5 دقائق":"5 min",C.ok],[ar?"وقت الحل":"Resolution Time",ar?"30 دقيقة":"30 min",C.warn],[ar?"التصعيد":"Escalation",ar?"10 دقائق بدون رد":"10 min no reply",C.err]].map(([l,v,clr],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderRadius:8,background:C.inp,marginBottom:4}}><span style={{fontSize:12}}>{l}</span><Bg color={clr}>{v}</Bg></div>)}</Cd>
        </div>
      </div>}

      {stTab==="api"&&<div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14}}>
        <Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{t.apiKeys}</h3>
          {[["sk-corbit-live-****-7f3a","2025-01-15",true,ar?"إنتاج":"Production","12,450"],[" sk-corbit-test-****-9b2c","2025-06-20",true,ar?"اختبار":"Sandbox","342"]].map(([key,date,on,env,calls],i)=><div key={i} style={{padding:14,borderRadius:12,background:C.inp,marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div><div style={{fontFamily:"monospace",fontSize:12,fontWeight:600}}>{key}</div><div style={{fontSize:10.5,color:C.t3,marginTop:2}}>{ar?"أنشئ":"Created"}: {date} · {ar?"طلبات":"Calls"}: {calls}</div></div><Bg color={env.includes("نتاج")||env==="Production"?C.ok:C.warn}>{env}</Bg></div><div style={{display:"flex",gap:4}}><Btn small outline onClick={()=>showToast(ar?"تم النسخ":"Copied")}>{ar?"نسخ":"Copy"}</Btn><Btn small outline onClick={()=>showToast("✓")}>{ar?"تجديد":"Rotate"}</Btn><Btn small outline style={{color:C.err,borderColor:C.err}}>{ar?"حذف":"Delete"}</Btn></div></div>)}
          <Btn primary small onClick={()=>showToast("✓")}>+ {t.genKey}</Btn>
          <div style={{marginTop:14,padding:12,borderRadius:10,background:aiC2+"08",border:"1px solid "+aiC2+"20"}}><div style={{fontSize:12,fontWeight:600,color:aiC2,marginBottom:4}}>{ar?"وثائق API":"API Documentation"}</div><div style={{fontSize:11.5,color:C.t2}}>{ar?"اطلع على الوثائق الكاملة لـ REST API مع أمثلة بـ cURL و Python و Node.js":"View full REST API docs with cURL, Python & Node.js examples"}</div><Btn outline small style={{marginTop:8,color:aiC2,borderColor:aiC2}}>{ar?"فتح الوثائق":"Open Docs"} →</Btn></div></Cd>
        <Cd style={{padding:18}}><h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>{t.webhooks}</h3>
          {[["https://api.mysite.com/webhook",["message.received","message.sent","conversation.closed"],true],["https://crm.mysite.com/wa-hook",["contact.created","conversation.assigned"],true]].map(([url,events,on],i)=><div key={i} style={{padding:14,borderRadius:12,background:C.inp,marginBottom:6}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{fontFamily:"monospace",fontSize:11.5,fontWeight:600,wordBreak:"break-all"}}>{url}</div><Toggle on={on} onToggle={()=>showToast("✓")}/></div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{events.map((ev,j)=><span key={j} style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:C.pri+"10",color:C.pri}}>{ev}</span>)}</div></div>)}
          <Btn primary small onClick={()=>showToast("✓")}>+ {t.addWH}</Btn>
          <h3 style={{margin:"20px 0 14px",fontSize:14,fontWeight:700}}>{ar?"سجل الطلبات":"Request Log"}</h3>
          {[["POST /messages/send","200","142ms","2026-03-04 09:15:32"],["GET /contacts","200","89ms","2026-03-04 09:14:58"],["POST /webhooks/test","200","234ms","2026-03-04 09:10:15"],["POST /messages/send","429","12ms","2026-03-04 09:08:44"]].map(([ep,code,time,date],i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:6,background:C.inp,marginBottom:2,fontSize:11}}><Bg color={code==="200"?C.ok:C.err}>{code}</Bg><span style={{fontFamily:"monospace",fontWeight:600,flex:1}}>{ep}</span><span style={{color:C.t3}}>{time}</span><span style={{color:C.t3,fontSize:10}}>{date}</span></div>)}</Cd>
      </div>}
    </div>;
  };

  const pages = {dashboard:DashPg,inbox:InboxPg,campaigns:CampPg,contacts:ContPg,templates:TmplPg,botBuilder:BotPg,aiCenter:AIPg,analytics:AnaPg,integrations:IntPg,teams:TeamsPg,billing:BillPg,settings:SetPg};
  const PageC = pages[page] || DashPg;

  return (
    <div style={{fontFamily:ff,direction:rtl?"rtl":"ltr",background:C.bg,color:C.txt,height:"100vh",display:"flex",overflow:"hidden",fontSize:14,transition:"background 0.3s,color 0.3s"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{margin:0}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${C.brd};border-radius:10px}input::placeholder{color:${C.t3}}`}</style>
      {mobMenu&&<div onClick={()=>setMobMenu(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:40}}/>}
      <div style={{width:sideOpen?260:72,minWidth:sideOpen?260:72,background:C.side,borderInlineEnd:"1px solid "+C.brd,display:"flex",flexDirection:"column",transition:"width 0.3s",overflow:"hidden",zIndex:20}}>
        <div style={{padding:"20px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid "+C.brd}}>
          <div style={{width:40,height:40,borderRadius:12,background:GR,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#fff",flexShrink:0}}>C</div>
          {sideOpen&&<div><div style={{fontWeight:700,fontSize:18,letterSpacing:-0.5}}>CORBIT</div><div style={{fontSize:11,color:C.t2,marginTop:-2}}>المدار</div></div>}
        </div>
        <nav style={{flex:1,padding:"12px 8px",overflowY:"auto"}}>
          {navItems.map(n=>{const a=page===n.k;return(
            <button key={n.k} onClick={()=>setPage(n.k)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:sideOpen?"10px 14px":"10px",justifyContent:sideOpen?"flex-start":"center",marginBottom:2,borderRadius:10,border:"none",cursor:"pointer",fontFamily:ff,fontSize:13.5,fontWeight:a?600:400,color:a?C.pri:C.t2,background:a?C.pri+"12":"transparent"}}>
              <span style={{flexShrink:0,opacity:a?1:0.6}}>{Ico(n.ico,18)}</span>
              {sideOpen&&<span>{n.l}</span>}
              {n.badge&&sideOpen&&<span style={{marginInlineStart:"auto",background:GR,color:"#fff",fontSize:11,fontWeight:700,borderRadius:10,padding:"2px 8px"}}>{n.badge}</span>}
            </button>
          );})}
        </nav>
        {sideOpen&&<div style={{padding:16,borderTop:"1px solid "+C.brd}}><div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:C.pri+"15"}}><Av name={ar?"م":"A"} size={36} solid/><div><div style={{fontWeight:600,fontSize:13}}>{ar?"محمد أحمد":"Mohammed"}</div><div style={{fontSize:11,color:C.t2}}>Admin</div></div></div></div>}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <header style={{height:64,minHeight:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",background:C.card,borderBottom:"1px solid "+C.brd}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setSideOpen(!sideOpen)} style={{background:"none",border:"none",color:C.t2,cursor:"pointer",padding:4}}>{Ico("menu",18)}</button>
            <h1 style={{fontSize:17,fontWeight:700,letterSpacing:-0.3}}>{navItems.find(n=>n.k===page)?.l}</h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:10,background:C.inp,width:180}}>{Ico("search",14)}<input placeholder={t.search} style={{border:"none",background:"none",outline:"none",fontFamily:ff,fontSize:12,color:C.txt,width:"100%"}}/></div>
            <button onClick={()=>setLang(lang==="ar"?"en":"ar")} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:10,border:"1px solid "+C.brd,background:"transparent",color:C.txt,cursor:"pointer",fontFamily:ff,fontSize:12,fontWeight:600}}>{Ico("globe",14)} {lang==="ar"?"EN":"عربي"}</button>
            <button onClick={()=>setTheme(theme==="dark"?"light":"dark")} style={{display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:10,border:"1px solid "+C.brd,background:"transparent",color:C.txt,cursor:"pointer"}}>{dk?Ico("sun",16):Ico("moon",16)}</button>
            <div style={{position:"relative"}}>
              <button onClick={()=>setNotifOpen(!notifOpen)} style={{display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:10,border:"1px solid "+C.brd,background:"transparent",color:C.txt,cursor:"pointer",position:"relative"}}>{Ico("bell",16)}<span style={{position:"absolute",top:4,right:4,width:8,height:8,borderRadius:"50%",background:C.err}}/></button>
              {notifOpen&&(
                <div style={{position:"absolute",top:44,[rtl?"left":"right"]:0,width:320,background:C.card,borderRadius:14,border:"1px solid "+C.brd,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",zIndex:100,overflow:"hidden"}}>
                  <div style={{padding:"14px 16px",borderBottom:"1px solid "+C.brd,fontWeight:700,fontSize:14}}>{t.notif}</div>
                  {[{ti:t.lowBal,m:t.lowBalM,ic:"wallet",c2:C.warn,tm:"5m"},{ti:t.newMsg,m:t.newMsgB,ic:"msg",c2:C.info,tm:"12m"},{ti:t.campDone,m:t.campDoneM,ic:"rocket",c2:C.ok,tm:"1h"}].map((n,i)=>(
                    <div key={i} style={{padding:"12px 16px",borderBottom:"1px solid "+C.brdL,display:"flex",gap:10,cursor:"pointer"}}>
                      <div style={{width:36,height:36,borderRadius:10,background:n.c2+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{Ico(n.ic,16)}</div>
                      <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12.5}}>{n.ti}</div><div style={{fontSize:11.5,color:C.t2,marginTop:2}}>{n.m}</div></div>
                      <span style={{fontSize:10,color:C.t3,flexShrink:0}}>{n.tm}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        <main style={{flex:1,overflowY:page==="inbox"?"hidden":"auto",paddingTop:page==="inbox"?0:24}} onClick={()=>{if(notifOpen)setNotifOpen(false)}}><PageC/></main>
      </div>
      <ModalC/>
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.ok,color:"#fff",padding:"12px 24px",borderRadius:12,fontFamily:ff,fontSize:14,fontWeight:600,zIndex:300,boxShadow:"0 8px 30px rgba(0,0,0,0.2)"}}>{toast}</div>}
    </div>
  );
}
