"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile, useIsTablet } from "@/hooks/use-media-query";
import { Button, Avatar, Badge, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { getStatusColor, getPriorityColor } from "@/lib/utils/status-color";
import type { Conversation, ChatMessage } from "@/data/conversations";
import { useConversations, useMessages, useWindowStatus } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { COLORS } from "@/lib/constants/colors";
import { TemplatePicker } from "@/components/shared/template-picker";

const QUICK_REPLIES_AR = ["شكراً لتواصلك!", "سأتحقق وأعود لك", "هل تحتاج مساعدة أخرى؟", "تم إرسال التفاصيل"];
const QUICK_REPLIES_EN = ["Thanks for reaching out!", "Let me check and get back to you", "Anything else I can help with?", "Details sent"];

type FilterTab = "all" | "unread" | "open";

const AI_COLOR = "#7C3AED";

function getSentimentColor(sentiment: string): string {
  if (sentiment === "positive") return "#34C77B";
  if (sentiment === "negative") return "#E84855";
  return "#F5A623";
}

function getSentimentLabel(sentiment: string, isAr: boolean): string {
  if (sentiment === "positive") return isAr ? "إيجابي" : "Positive";
  if (sentiment === "negative") return isAr ? "سلبي" : "Negative";
  return isAr ? "محايد" : "Neutral";
}

function mapApiConversation(c: any): Conversation {
  return {
    id: c.id || c._id || "",
    name: c.name || c.contact?.name || "",
    ph: c.ph || c.phone || c.contact?.phone || "",
    email: c.email || c.contact?.email || "",
    msg: c.msg || c.lastMessage || c.last_message || "",
    time: c.time || c.updated_at || c.updatedAt || "",
    unread: c.unread ?? 0,
    st: c.st || c.status || "open",
    pri: c.pri || c.priority || "medium",
    tag: typeof c.tag === "object" ? (c.tag?.name || "") : (c.tag || c.tags?.[0]?.name || c.tags?.[0] || ""),
    sentiment: c.sentiment || "neutral",
    intent: c.intent || "",
    online: c.online ?? false,
    orders: c.orders ?? 0,
    joined: c.joined || c.created_at || c.createdAt || "",
    notes: c.notes || "",
  };
}

function mapApiMessage(m: any): ChatMessage {
  return {
    from: m.from || m.sender || m.messageType || "customer",
    text: m.text || m.content || m.body || "",
    time: m.time || m.created_at || m.createdAt || "",
  };
}

export default function InboxPage() {
  const { colors: C, isDark: dk } = useTheme();
  const { t, lang, isAr, rtl } = useLocale();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // API: fetch conversations
  const [apiFilterTab, setApiFilterTab] = useState<string | undefined>(undefined);
  const { data: apiConvosRaw, isLoading: convosLoading, mutate: mutateConvos } = useConversations(
    apiFilterTab ? { status: apiFilterTab } : undefined
  );

  const rawItems = Array.isArray(apiConvosRaw)
    ? apiConvosRaw
    : apiConvosRaw?.items || apiConvosRaw?.data || [];
  const convos: Conversation[] = Array.isArray(rawItems)
    ? rawItems.map(mapApiConversation)
    : [];

  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [showDetail, setShowDetail] = useState(true);
  const [aiAgentOn, setAiAgentOn] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat" | "detail">("list");
  const [aiAgents, setAiAgents] = useState<Record<number, boolean>>({ 0: true, 3: true });
  const [noteText, setNoteText] = useState("");
  const [aiSummary, setAiSummary] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickReplies = isAr ? QUICK_REPLIES_AR : QUICK_REPLIES_EN;

  // Get selected conversation ID for API calls
  const selected: Conversation = convos[selectedIdx] || convos[0];
  const selectedId = (selected as any)?.id || null;

  // API: fetch messages for selected conversation
  const { data: apiMessagesRaw, isLoading: messagesLoading, mutate: mutateMessages } = useMessages(selectedId);

  // API: check 24h window status
  const { data: windowData } = useWindowStatus(selectedId);
  const windowOpen = (selected as any)?.windowOpen ?? windowData?.windowOpen ?? true;
  const [showInboxTemplatePicker, setShowInboxTemplatePicker] = useState(false);
  const [sendingInboxTemplate, setSendingInboxTemplate] = useState(false);

  const rawMsgs = Array.isArray(apiMessagesRaw)
    ? apiMessagesRaw
    : apiMessagesRaw?.items || apiMessagesRaw?.data || [];
  const apiMessages: ChatMessage[] = Array.isArray(rawMsgs)
    ? rawMsgs.map(mapApiMessage)
    : [];

  const messages = apiMessages.length ? apiMessages : [];

  // API: fetch notes for selected conversation
  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      try {
        const res = await api.get(`/conversations/${selectedId}/notes`);
        const data = res.data?.data ?? res.data;
        if (Array.isArray(data)) {
          setNotes(data.map((n: any) => n.content || n.text || n));
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedId]);

  // Sync filter tab to API
  useEffect(() => {
    if (filterTab === "all") {
      setApiFilterTab(undefined);
    } else if (filterTab === "open") {
      setApiFilterTab("open");
    } else if (filterTab === "unread") {
      setApiFilterTab("unread");
    }
  }, [filterTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isAiOn = aiAgents[selectedIdx] === true;

  const toggleAi = useCallback(async () => {
    const newVal = !isAiOn;
    // Optimistic update
    setAiAgents((prev) => ({ ...prev, [selectedIdx]: newVal }));
    // Sync with API
    if (selectedId) {
      try {
        await api.post(`/conversations/${selectedId}/ai/toggle`, { enabled: newVal });
      } catch (e) {
        console.error(e);
      }
    }
  }, [isAiOn, selectedIdx, selectedId]);

  const sentColor = getSentimentColor(selected?.sentiment);
  const sentLabel = getSentimentLabel(selected?.sentiment, isAr);
  const priColor = getPriorityColor(selected?.pri);

  // Local filtering (search always local, filter tabs apply locally too)
  const filteredConvos = convos.filter((c) => {
    if (filterTab === "unread" && c.unread === 0) return false;
    if (filterTab === "open" && c.st !== "open") return false;
    if (searchQuery && !c.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !(c.msg || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  async function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    // Block free text if window is closed
    if (!windowOpen) {
      showToast(isAr ? "نافذة المحادثة مغلقة (24 ساعة). استخدم قالب معتمد." : "24h window closed. Use an approved template.");
      return;
    }
    const now = new Date();
    const time = now.toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "numeric", minute: "2-digit" });
    const newMsg: ChatMessage = { from: "agent", text, time };
    // Optimistic update
    setLocalMessages((prev) => [...prev, newMsg]);
    setInputText("");
    inputRef.current?.focus();
    // Send to API
    if (selectedId) {
      try {
        await api.post(`/conversations/${selectedId}/messages`, { content: text, messageType: "text" });
        mutateMessages();
      } catch (e: any) {
        const msg = e?.response?.data?.message;
        if (msg) showToast(msg);
        console.error(e);
      }
    }
  }

  async function handleQuickReply(reply: string) {
    const now = new Date();
    const time = now.toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "numeric", minute: "2-digit" });
    setLocalMessages((prev) => [...prev, { from: "agent", text: reply, time }]);
    setShowQuickReplies(false);
    if (selectedId) {
      try {
        await api.post(`/conversations/${selectedId}/messages`, { content: reply, messageType: "agent" });
        mutateMessages();
      } catch (e) {
        console.error(e);
      }
    }
  }

  function selectConvo(idx: number) {
    setSelectedIdx(idx);
    setLocalMessages([]);
    if (isMobile) setMobileView("chat");
  }

  async function handleResolve() {
    if (selectedId) {
      try {
        await api.post(`/conversations/${selectedId}/resolve`);
        mutateConvos();
        showToast(isAr ? "تم ✓" : "Done ✓");
      } catch (e) {
        console.error(e);
        showToast(isAr ? "تم ✓" : "Done ✓");
      }
    } else {
      showToast(isAr ? "تم ✓" : "Done ✓");
    }
  }

  async function handleSaveNote() {
    if (!noteText) return;
    const text = noteText;
    setNoteText("");
    // Optimistic
    setNotes((prev) => [...prev, text]);
    showToast("✓");
    if (selectedId) {
      try {
        await api.post(`/conversations/${selectedId}/notes`, { content: text });
      } catch (e) {
        console.error(e);
      }
    }
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: isAr ? "الكل" : "All" },
    { key: "unread", label: isAr ? "جديدة" : "Unread" },
    { key: "open", label: isAr ? "مفتوحة" : "Open" },
  ];

  // ===================== LIST PANEL =====================
  function renderConversationList() {
    return (
      <div style={{ width: isMobile ? "100%" : 320, borderInlineEnd: "1px solid " + (dk ? C.brd : "#EAE7E2"), display: "flex", flexDirection: "column", background: C.card }}>
        {/* Search */}
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 12, background: C.inp, marginBottom: 12 }}>
            <Icon name="search" size={14} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search")}
              style={{ border: "none", background: "none", outline: "none", fontFamily: FONT_FAMILY, fontSize: 13, color: C.txt, width: "100%" }}
            />
          </div>
          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", fontFamily: FONT_FAMILY, fontSize: 11.5, fontWeight: filterTab === tab.key ? 600 : 400, color: filterTab === tab.key ? "#fff" : C.t2, background: filterTab === tab.key ? C.pri : "transparent", cursor: "pointer" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Cards */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {convosLoading && (
            <div style={{ padding: "20px 16px", textAlign: "center", fontSize: 13, color: C.t2 }}>
              {isAr ? "جاري التحميل..." : "Loading..."}
            </div>
          )}
          {!convosLoading && filteredConvos.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center", fontSize: 13, color: C.t2 }}>
              {isAr ? "لا توجد محادثات" : "No conversations"}
            </div>
          )}
          {filteredConvos.map((c, i) => {
            const idx = convos.indexOf(c);
            return (
              <div
                key={idx}
                onClick={() => selectConvo(idx)}
                style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, borderBottom: "1px solid " + (dk ? C.brd : "#F5F2ED"), cursor: "pointer", background: selectedIdx === idx ? C.pri + "08" : "transparent" }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar name={c.name} size={44} />
                  {c.online && (
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, background: C.wa, border: "2px solid " + C.card }} />
                  )}
                  {aiAgents[idx] && (
                    <div style={{ position: "absolute", top: -2, left: -2, width: 18, height: 18, borderRadius: 5, background: AI_COLOR, border: "2px solid " + C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 8, fontWeight: 800 }}>AI</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 10.5, color: C.t3 }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.t2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.msg}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                    <Badge color={getStatusColor(c.st)}>{c.st}</Badge>
                    <Badge color={C.pri}>{c.tag}</Badge>
                  </div>
                </div>
                {c.unread > 0 && (
                  <span style={{ background: C.pri, color: "#fff", fontSize: 10.5, fontWeight: 700, borderRadius: 10, padding: "2px 7px" }}>{c.unread}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid " + (dk ? C.brd : "#EAE7E2"), fontSize: 12, color: C.t2, display: "flex", justifyContent: "space-between" }}>
          <span>{filteredConvos.length} {isAr ? "محادثة" : "conv"}</span>
          <span style={{ color: C.ok, fontWeight: 600 }}>{convos.filter((x) => x.online).length} {isAr ? "متصل" : "online"}</span>
        </div>
      </div>
    );
  }

  // ===================== CHAT PANEL =====================
  function renderChatPanel() {
    if (!selected) return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: dk ? "#0A0C14" : "#F5F3EF", color: C.t2, fontSize: 15 }}>
        {isAr ? "اختر محادثة للبدء" : "Select a conversation"}
      </div>
    );
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: dk ? "#0A0C14" : "#F5F3EF", minWidth: 0 }}>
        {/* Chat Header */}
        <div style={{ padding: "12px 22px", background: C.card, borderBottom: "1px solid " + (dk ? C.brd : "#EAE7E2"), display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: C.shadow, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {isMobile && (
              <button onClick={() => setMobileView("list")} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.txt, padding: 4, display: "flex" }}>
                <Icon name="x" size={18} />
              </button>
            )}
            <div style={{ position: "relative" }}>
              <Avatar name={selected.name} size={42} solid />
              {selected.online && (
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, background: C.wa, border: "2px solid " + C.card }} />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{selected.name}</div>
              <div style={{ fontSize: 11.5, color: C.t2 }}>{selected.ph}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {/* Sentiment */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: sentColor + "12", fontSize: 11, fontWeight: 600, color: sentColor }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: sentColor }} />
              {sentLabel}
            </div>
            {/* AI Toggle */}
            <div
              onClick={toggleAi}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, background: isAiOn ? AI_COLOR + "15" : C.inp, border: isAiOn ? "1.5px solid " + AI_COLOR : "1.5px solid " + (dk ? C.brd : "#D5D2CC"), cursor: "pointer" }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 4, background: isAiOn ? AI_COLOR : C.t3 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: isAiOn ? AI_COLOR : C.t2 }}>{isAiOn ? (isAr ? "وكيل AI نشط" : "AI ON") : (isAr ? "وكيل AI متوقف" : "AI OFF")}</span>
            </div>
            {/* Take Over */}
            {isAiOn && (
              <Button outline small style={{ color: AI_COLOR, borderColor: AI_COLOR }} onClick={() => { toggleAi(); showToast(isAr ? "تم الاستلام ✓" : "Taken over ✓"); }}>
                <Icon name="users" size={13} /> {isAr ? "استلام" : "Take Over"}
              </Button>
            )}
            {/* Assign */}
            {!isAiOn && (
              <Button outline small onClick={() => showToast("✓")}>{isAr ? "إسناد" : "Assign"}</Button>
            )}
            {/* Resolve */}
            <Button primary small onClick={handleResolve}>{isAr ? "حل" : "Resolve"}</Button>
            {/* Detail toggle */}
            <button
              onClick={() => setShowDetail(!showDetail)}
              style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid " + (dk ? C.brd : "#D5D2CC"), background: "transparent", color: showDetail ? C.pri : C.t2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="users" size={15} />
            </button>
          </div>
        </div>

        {/* Intent Bar */}
        <div style={{ padding: "8px 22px", background: isAiOn ? (dk ? "#1a1030" : "#F5F0FF") : (dk ? "#1a1a30" : "#FFF8F0"), borderBottom: "1px solid " + (dk ? C.brd : isAiOn ? "#E0D4F5" : "#F0E8DD"), display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
          {isAiOn && <div style={{ width: 28, height: 28, borderRadius: 8, background: AI_COLOR + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="bot" size={14} /></div>}
          {isAiOn && <span style={{ fontWeight: 600, color: AI_COLOR }}>{isAr ? "وكيل AI يدير المحادثة" : "AI Agent handling"}</span>}
          {isAiOn && <span style={{ marginInlineStart: "auto", fontSize: 11.5, color: C.t2 }}>{isAr ? "هدف:" : "Intent:"} <span style={{ fontWeight: 600, color: C.pri }}>{selected.intent}</span></span>}
          {!isAiOn && <div style={{ width: 28, height: 28, borderRadius: 8, background: C.pri + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="brain" size={14} /></div>}
          {!isAiOn && <span style={{ color: C.t2 }}>{isAr ? "هدف:" : "Intent:"}</span>}
          {!isAiOn && <span style={{ fontWeight: 600, color: C.pri }}>{selected.intent}</span>}
          {!isAiOn && <span style={{ marginInlineStart: "auto" }}><Badge color={priColor}>{selected.pri}</Badge></span>}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          {messagesLoading && (
            <div style={{ textAlign: "center", fontSize: 13, color: C.t2, padding: 20 }}>
              {isAr ? "جاري التحميل..." : "Loading..."}
            </div>
          )}
          {messages.map((m, i) => {
            const cu = m.from === "customer";
            const bo = m.from === "bot";
            return (
              <div key={i} style={{ display: "flex", justifyContent: cu ? (rtl ? "flex-end" : "flex-start") : (rtl ? "flex-start" : "flex-end"), marginBottom: 14 }}>
                <div style={{ maxWidth: "65%", padding: "12px 16px", borderRadius: 16, background: cu ? C.card : bo ? C.wa + "12" : C.pri, color: (!cu && !bo) ? "#fff" : C.txt, border: cu ? "1px solid " + (dk ? C.brd : "#E8E5E0") : "none", boxShadow: cu ? C.shadow : "none" }}>
                  {bo && (
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: C.wa, marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="bot" size={12} /> Bot
                    </div>
                  )}
                  <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>{m.text}</div>
                  <div style={{ fontSize: 10, marginTop: 5, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", color: (!cu && !bo) ? "rgba(255,255,255,0.7)" : C.t3 }}>
                    {m.time}
                    {!cu && <span style={{ color: C.info }}><Icon name="dcheck" size={10} /></span>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* AI Agent Panel (when AI is on) */}
        {isAiOn && (
          <div style={{ margin: "0 22px 10px", borderRadius: 14, background: dk ? "#1a1030" : "#F8F4FF", border: "1.5px solid " + (dk ? "#2D2060" : "#D4C4F0"), overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: AI_COLOR, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <Icon name="bot" size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: AI_COLOR }}>{isAr ? "وكيل الذكاء الاصطناعي" : "AI Agent"}</div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{isAr ? "يرد تلقائياً باستخدام قاعدة المعرفة" : "Auto-responding via knowledge base"}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: AI_COLOR, boxShadow: "0 0 8px " + AI_COLOR + "80" }} />
                <span style={{ fontSize: 10, color: AI_COLOR, fontWeight: 600 }}>{isAr ? "نشط" : "Active"}</span>
              </div>
            </div>
            <div style={{ padding: "10px 18px", borderTop: "1px solid " + (dk ? "#2D2060" : "#E8DDF5"), display: "flex", gap: 8, flexWrap: "wrap" }}>
              {([
                [isAr ? "الثقة: 94%" : "Conf: 94%", AI_COLOR],
                [isAr ? "الردود: 3" : "Replies: 3", C.ok],
                [isAr ? "المعرفة: متصلة" : "KB: On", C.ok],
              ] as [string, string][]).map(([l, clr], i) => (
                <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: clr + "12", color: clr, fontWeight: 600 }}>{l}</span>
              ))}
            </div>
            <div style={{ padding: "10px 18px", borderTop: "1px solid " + (dk ? "#2D2060" : "#E8DDF5") }}>
              <button
                onClick={toggleAi}
                style={{ width: "100%", padding: 8, borderRadius: 8, border: "1.5px solid " + AI_COLOR, background: "transparent", fontFamily: FONT_FAMILY, fontSize: 12.5, fontWeight: 600, color: AI_COLOR, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Icon name="users" size={14} /> {isAr ? "استلام المحادثة" : "Take Over"}
              </button>
            </div>
          </div>
        )}

        {/* Quick Replies */}
        {showQuickReplies && (
          <div style={{ margin: "0 22px 10px", padding: "10px 16px", borderRadius: 14, background: C.card, border: "1px solid " + (dk ? C.brd : "#EAE7E2"), boxShadow: C.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{isAr ? "ردود سريعة" : "Quick Replies"}</span>
              <button onClick={() => setShowQuickReplies(false)} style={{ background: "none", border: "none", color: C.t3, cursor: "pointer" }}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {quickReplies.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickReply(r)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + (dk ? C.brd : "#E0DDD8"), background: "transparent", fontFamily: FONT_FAMILY, fontSize: 12, color: C.txt, cursor: "pointer" }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div style={{ margin: "0 22px 10px", padding: "10px 16px", borderRadius: 14, background: C.card, border: "1px solid " + (dk ? C.brd : "#EAE7E2"), display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["😊", "👍", "🙏", "❤️", "😂", "🎉", "👋", "✅", "⭐", "🔥", "💪", "📦"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => { setInputText((prev) => prev + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }}
                style={{ fontSize: 20, padding: "4px 6px", background: "transparent", border: "none", cursor: "pointer", borderRadius: 6 }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Input */}
        <div style={{ padding: "14px 22px", background: C.card, borderTop: "1px solid " + (dk ? C.brd : "#EAE7E2") }}>
          {isAiOn && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: dk ? "#1a1030" : "#F8F4FF", border: "1px solid " + (dk ? "#2D2060" : "#D4C4F0"), marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: AI_COLOR, boxShadow: "0 0 6px " + AI_COLOR + "80" }} />
              <span style={{ fontSize: 12.5, color: AI_COLOR, fontWeight: 600, flex: 1 }}>{isAr ? "وكيل AI نشط" : "AI Agent active"}</span>
              <button onClick={toggleAi} style={{ padding: "6px 14px", borderRadius: 8, background: AI_COLOR, color: "#fff", border: "none", fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{isAr ? "استلام" : "Take Over"}</button>
            </div>
          )}
          {/* Window closed banner */}
          {!windowOpen && !isAiOn && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: dk ? "#1a1a10" : "#FFF8E8", border: "1px solid " + (dk ? "#3D3520" : "#F0E0B0"), marginBottom: 10 }}>
              <Icon name="timer" size={16} />
              <span style={{ fontSize: 12.5, color: C.t2, flex: 1 }}>
                {isAr ? "نافذة المحادثة مغلقة (24 ساعة). يمكنك فقط إرسال قالب معتمد." : "24h conversation window is closed. You can only send an approved template."}
              </span>
              <button
                onClick={() => setShowInboxTemplatePicker(true)}
                style={{ padding: "6px 14px", borderRadius: 8, background: COLORS.wa, color: "#fff", border: "none", fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {isAr ? "إرسال قالب" : "Send Template"}
              </button>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, opacity: (isAiOn || !windowOpen) ? 0.4 : 1, pointerEvents: (isAiOn || !windowOpen) ? "none" : "auto" }}>
            <div style={{ display: "flex", gap: 6, paddingBottom: 4 }}>
              <button style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: C.inp, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.t2 }}>
                <Icon name="clip" size={16} />
              </button>
              <button
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowQuickReplies(false); }}
                style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: showEmojiPicker ? C.pri + "15" : C.inp, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: showEmojiPicker ? C.pri : C.t2 }}
              >
                <Icon name="smile" size={16} />
              </button>
              <button
                onClick={() => { setShowQuickReplies(!showQuickReplies); setShowEmojiPicker(false); }}
                style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: showQuickReplies ? C.pri + "15" : C.inp, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: showQuickReplies ? C.pri : C.t2 }}
              >
                <Icon name="bookmark" size={16} />
              </button>
              <button
                onClick={toggleAi}
                style={{ width: 34, height: 34, borderRadius: 8, border: isAiOn ? "1.5px solid " + AI_COLOR : "none", background: isAiOn ? AI_COLOR + "15" : C.inp, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isAiOn ? AI_COLOR : C.t2 }}
              >
                <Icon name="bot" size={16} />
              </button>
            </div>
            <div style={{ flex: 1, padding: "10px 16px", borderRadius: 14, background: C.inp }}>
              <input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder={isAr ? "اكتب رسالة..." : "Type..."}
                style={{ border: "none", background: "none", outline: "none", fontFamily: FONT_FAMILY, fontSize: 13.5, color: C.txt, width: "100%" }}
              />
            </div>
            <button
              onClick={handleSend}
              style={{ width: 42, height: 42, borderRadius: 12, background: inputText ? C.wa : C.inp, border: "none", cursor: "pointer", color: inputText ? "#fff" : C.t3, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="send" size={18} />
            </button>
          </div>
        </div>
        {/* Inbox Template Picker */}
        <TemplatePicker
          open={showInboxTemplatePicker}
          onClose={() => setShowInboxTemplatePicker(false)}
          contactName={selected?.name}
          sending={sendingInboxTemplate}
          onSend={(templateId, variables) => {
            if (!selectedId) return;
            setSendingInboxTemplate(true);
            api.post(`/conversations/${selectedId}/messages`, { messageType: "template", templateId, templateVariables: variables })
              .then(() => {
                showToast(isAr ? "تم إرسال القالب ✓" : "Template sent ✓");
                setShowInboxTemplatePicker(false);
                mutateMessages();
              })
              .catch((err: any) => {
                const msg = err?.response?.data?.message;
                showToast(msg || (isAr ? "فشل إرسال القالب" : "Failed to send template"));
              })
              .finally(() => setSendingInboxTemplate(false));
          }}
        />
      </div>
    );
  }

  // ===================== DETAIL PANEL =====================
  function renderDetailPanel() {
    if (!selected) return null;
    return (
      <div style={{ width: 300, borderInlineStart: "1px solid " + (dk ? C.brd : "#EAE7E2"), background: C.card, overflowY: "auto" }}>
        {/* Contact Header */}
        <div style={{ padding: 22, textAlign: "center", borderBottom: "1px solid " + (dk ? C.brd : "#F0EDE8") }}>
          <Avatar name={selected.name} size={64} solid />
          <div style={{ fontWeight: 700, fontSize: 16, marginTop: 12 }}>{selected.name}</div>
          <div style={{ fontSize: 12.5, color: C.t2, marginTop: 4 }}>{selected.ph}</div>
          <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{selected.email}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
            <Badge color={C.pri}>{selected.tag}</Badge>
          </div>
        </div>

        {/* AI Agent Toggle */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid " + (dk ? C.brd : "#F0EDE8") }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="bot" size={14} />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{isAr ? "وكيل AI" : "AI Agent"}</span>
            </div>
            <Toggle on={isAiOn} onToggle={toggleAi} />
          </div>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: isAiOn ? (dk ? "#1a1030" : "#F8F4FF") : C.inp, fontSize: 12, color: isAiOn ? AI_COLOR : C.t2 }}>
            {isAiOn ? (isAr ? "نشط - يرد تلقائياً" : "Active") : (isAr ? "متوقف" : "Off")}
          </div>
        </div>

        {/* AI Summary */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid " + (dk ? C.brd : "#F0EDE8") }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{isAr ? "ملخص AI" : "AI Summary"}</span>
            <button
              onClick={() => setAiSummary(!aiSummary)}
              style={{ background: "none", border: "none", color: C.pri, fontFamily: FONT_FAMILY, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
            >
              {aiSummary ? (isAr ? "إخفاء" : "Hide") : (isAr ? "عرض" : "Show")}
            </button>
          </div>
          {aiSummary && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: dk ? "#1a1a30" : "#FFF8F0", fontSize: 12.5, lineHeight: 1.7, color: C.t2 }}>
              {isAr ? "يستفسر عن باقة المؤسسات والعروض. مهتم - فرصة بيع عالية." : "Inquiring about Enterprise. High conversion potential."}
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid " + (dk ? C.brd : "#F0EDE8") }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>{isAr ? "معلومات" : "Info"}</div>
          {([
            [isAr ? "انضمام" : "Joined", selected.joined],
            [isAr ? "طلبات" : "Orders", selected.orders],
          ] as [string, string | number][]).map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12.5 }}>
              <span style={{ color: C.t2 }}>{l}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10 }}>{isAr ? "ملاحظات" : "Notes"}</div>
          {selected.notes && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: C.inp, fontSize: 12.5, color: C.t2, marginBottom: 10 }}>{selected.notes}</div>
          )}
          {notes.map((n, i) => (
            <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: C.inp, fontSize: 12.5, color: C.t2, marginBottom: 10 }}>{n}</div>
          ))}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={isAr ? "ملاحظة..." : "Note..."}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: C.inp, border: "none", fontFamily: FONT_FAMILY, fontSize: 12.5, color: C.txt, outline: "none" }}
            />
            <button
              onClick={handleSaveNote}
              style={{ padding: "8px 12px", borderRadius: 8, background: C.pri, color: "#fff", border: "none", fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {isAr ? "حفظ" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== LAYOUT =====================
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {mobileView === "list" && renderConversationList()}
        {mobileView === "chat" && renderChatPanel()}
        {mobileView === "detail" && renderDetailPanel()}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 65px)" }}>
      {renderConversationList()}
      {renderChatPanel()}
      {showDetail && !isTablet && renderDetailPanel()}
    </div>
  );
}
