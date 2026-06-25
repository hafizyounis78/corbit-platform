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
import { useConversations, useMessages, useWindowStatus, useTeams, useQuickReplies } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/auth-context";
import api from "@/lib/api/client";
import { COLORS } from "@/lib/constants/colors";
import { TemplatePicker } from "@/components/shared/template-picker";
import { ReportIssueModal, type IssueContext } from "@/components/support/report-issue-modal";
import { TagsEditorModal } from "@/components/inbox/tags-editor-modal";
import { NewConversationModal } from "@/components/inbox/new-conversation-modal";

// Fallbacks shown only when the org has zero quick replies in DB
// (fresh tenant, or hasn't customized the list yet). Settings UI
// at /settings → ⚡ Quick Replies lets admins manage the live set.
const QUICK_REPLIES_AR_FALLBACK = ["شكراً لتواصلك!", "سأتحقق وأعود لك", "هل تحتاج مساعدة أخرى؟", "تم إرسال التفاصيل"];
const QUICK_REPLIES_EN_FALLBACK = ["Thanks for reaching out!", "Let me check and get back to you", "Anything else I can help with?", "Details sent"];

type FilterTab = "all" | "unread" | "open";

const AI_COLOR = "#7C3AED";

/**
 * 5-tier sentiment derived from the AI score (-1..1). Falls back to
 * the 3-class string when the score is missing (older rows pre-
 * 2026_05_03_160000 migration).
 */
type SentimentTier = "very_positive" | "positive" | "neutral" | "dissatisfied" | "angry";

function getSentimentTier(sentiment: string | undefined, score: number | null | undefined): SentimentTier {
  if (typeof score === "number" && !Number.isNaN(score)) {
    if (score >=  0.7) return "very_positive";
    if (score >=  0.2) return "positive";
    if (score <= -0.7) return "angry";
    if (score <= -0.2) return "dissatisfied";
    return "neutral";
  }
  // No score → derive from the 3-class string.
  if (sentiment === "positive") return "positive";
  if (sentiment === "negative") return "angry";
  return "neutral";
}

function getSentimentColor(sentiment: string | undefined, score?: number | null): string {
  const tier = getSentimentTier(sentiment, score);
  if (tier === "very_positive") return "#1FA85F";
  if (tier === "positive")      return "#34C77B";
  if (tier === "neutral")       return "#F5A623";
  if (tier === "dissatisfied")  return "#E0784D";
  return "#E84855"; // angry
}

/**
 * Vivid 5-tier sentiment labels. Returns icon name + text so callers
 * can render <Icon> consistently rather than relying on emoji glyphs.
 */
function getSentimentLabel(sentiment: string | undefined, isAr: boolean, score?: number | null): { icon: string; text: string } {
  const tier = getSentimentTier(sentiment, score);
  if (tier === "very_positive") return { icon: "smile", text: isAr ? "سعيد جداً" : "Delighted" };
  if (tier === "positive")      return { icon: "smile", text: isAr ? "سعيد" : "Happy" };
  if (tier === "neutral")       return { icon: "meh", text: isAr ? "محايد" : "Neutral" };
  if (tier === "dissatisfied")  return { icon: "frown", text: isAr ? "غير راضٍ" : "Dissatisfied" };
  return { icon: "frown", text: isAr ? "غاضب" : "Angry" };
}

/** Trend chip helper — returns icon + text + colour, or null when
 *  trend is stable / unknown (no chip rendered then). */
function getTrendDisplay(trend: string | null | undefined, isAr: boolean): { icon: string; text: string; color: string } | null {
  if (trend === "worsening") return { icon: "trendingDown", text: isAr ? "يسوء" : "Worsening", color: "#E84855" };
  if (trend === "improving") return { icon: "trendingUp",   text: isAr ? "يتحسّن" : "Improving", color: "#34C77B" };
  return null;
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
    tags: Array.isArray(c.tags)
      ? c.tags.map((t: any) => typeof t === "string" ? t : (t?.name || ""))
        .filter((t: string) => t.length > 0)
      : (c.tag ? [typeof c.tag === "object" ? c.tag.name : c.tag] : []),
    sentiment: c.sentiment || "neutral",
    intent: c.intent || "",
    online: c.online ?? false,
    orders: c.orders ?? 0,
    joined: c.joined || c.created_at || c.createdAt || "",
    notes: c.notes || "",
    aiEnabled: !!(c.aiEnabled ?? c.ai_agent_enabled ?? false),
    // Pass the assignment through verbatim — the sidebar list and the
    // chat header both render the assignee name. Resource exposes
    // these as { id, name } objects when the relations are loaded.
    assignedUser: c.assignedUser ?? c.assigned_user ?? null,
    assignedTeam: c.assignedTeam ?? c.assigned_team ?? null,
    // Sentiment intelligence — score lets the frontend pick a 5-tier
    // label, trend renders the 📉 / 📈 indicator, autoEscalatedAt
    // shows a 🚨 chip when the router has fired on this conversation.
    sentimentScore: typeof c.sentimentScore === "number" ? c.sentimentScore
      : (typeof c.sentiment_score === "number" ? c.sentiment_score : null),
    sentimentTrend: c.sentimentTrend ?? c.sentiment_trend ?? null,
    autoEscalatedAt: c.autoEscalatedAt ?? c.auto_escalated_at ?? null,
  };
}

function mapApiMessage(m: any): ChatMessage {
  return {
    id:   m.id || m._id || undefined,
    from: m.from || m.sender || m.messageType || "customer",
    text: m.text || m.content || m.body || "",
    time: m.time || m.created_at || m.createdAt || "",
    type: (m.type || m.message_type || m.messageType || "text") as ChatMessage["type"],
    media: m.media || m.media_url || m.mediaUrl || null,
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
  const [showTagsEditor, setShowTagsEditor] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat" | "detail">("list");
  // Per-conversation AI override map keyed by conversation id. Only set
  // for conversations the user toggled this session — for the rest we
  // read straight from the conversation's aiEnabled (loaded from API),
  // so a refresh always reflects the source of truth in DB instead of
  // a stale hard-coded local state.
  const [aiAgentsById, setAiAgentsById] = useState<Record<string, boolean>>({});
  const [noteText, setNoteText] = useState("");
  const [aiSummary, setAiSummary] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestionLogId, setAiSuggestionLogId] = useState<string | null>(null);
  // Assignment drawer state — open/close + search filter for the
  // teams-and-agents picker shown when the operator clicks "Assign".
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const { data: teamsData } = useTeams();
  // Per-agent data scoping: a scoped agent can't reassign conversations
  // (backend returns 403), so we hide the reassign control entirely for
  // them. False for everyone else — UI is unchanged.
  const { user } = useAuth();
  const isScopedAgent = user?.role === "agent" && !!user?.dataScopingEnabled;

  // "Report this message" modal — captures the message id + a preview
  // so support sees what the user was complaining about even if the
  // message is later deleted.
  const [reportContext, setReportContext] = useState<IssueContext | null>(null);

  // Per-message AI translations. Keyed by message id. Stored locally
  // so the operator's session shows translations inline without us
  // having to persist them back into the messages table — the source
  // of truth is still the original text the customer sent.
  const [translations, setTranslations] = useState<Record<string, { text: string; targetLang: string }>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  // We mark a conversation as "scrolled to bottom" only on the render
  // that actually has messages. Tracking selectedId alone fails because
  // selectedId changes BEFORE messages arrive — the first render is
  // empty, the effect fires, scrollHeight is tiny, then messages
  // arrive and the effect fires again thinking we're already in
  // "smooth scroll" mode (since the id matches).
  const lastScrolledConvoRef = useRef<number | null>(null);
  // Sticky-scroll intent: tracks whether the user was pinned to the
  // bottom right before each render. We can't compute this inside
  // the messages effect because by then the DOM already reflects the
  // new message — scrollHeight has grown and the user looks "above"
  // the bottom even though they hadn't moved. The scroll listener
  // updates this flag continuously while they actually scroll.
  const stickToBottomRef = useRef<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live quick replies from /api/quick-replies. Admin manages from
  // settings; falls back to a starter set when the org hasn't saved
  // any yet so a fresh tenant isn't staring at an empty panel.
  const { data: quickRepliesData } = useQuickReplies();
  const quickRepliesList = Array.isArray(quickRepliesData) ? quickRepliesData : [];
  const quickReplies = quickRepliesList.length > 0
    ? quickRepliesList
        .map((q: any) => isAr ? (q.text_ar || q.text || "") : (q.text || q.text_ar || ""))
        .filter((t: string) => t.length > 0)
    : (isAr ? QUICK_REPLIES_AR_FALLBACK : QUICK_REPLIES_EN_FALLBACK);

  // Get selected conversation ID for API calls
  const selected: Conversation = convos[selectedIdx] || convos[0];
  const selectedId = (selected as any)?.id || null;

  const requestTranslation = useCallback(async (msgId: string, originalText: string) => {
    if (!selectedId || translating[msgId]) return;
    if (translations[msgId]) {
      setTranslations((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
      return;
    }
    setTranslating((prev) => ({ ...prev, [msgId]: true }));
    try {
      // Heuristic target: if the message looks Arabic, translate to
      // English; otherwise to Arabic. Operator can re-tap to dismiss.
      const isArabic = /[؀-ۿ]/.test(originalText);
      const target = isArabic ? "en" : "ar";
      const res = await api.post(`/conversations/${selectedId}/messages/${msgId}/translate`, { target });
      const data = (res?.data?.data ?? res?.data) || {};
      const text = data.content || "";
      if (text) {
        setTranslations((prev) => ({ ...prev, [msgId]: { text, targetLang: data.targetLang || target } }));
      } else {
        showToast(isAr ? "تعذّر الترجمة" : "Translation failed", "error");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        showToast(isAr ? "الترجمة معطّلة في مركز AI" : "Translation is disabled in AI Center", "error");
      } else {
        showToast(isAr ? "تعذّر الترجمة" : "Translation failed", "error");
      }
    } finally {
      setTranslating((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
    }
  }, [selectedId, translations, translating, showToast, isAr]);

  // API: fetch messages for selected conversation
  const { data: apiMessagesRaw, isLoading: messagesLoading, mutate: mutateMessages } = useMessages(selectedId);

  // API: check 24h window status
  const { data: windowData } = useWindowStatus(selectedId);
  const windowOpen = (selected as any)?.windowOpen ?? windowData?.windowOpen ?? true;

  // Assignment lock — when a conversation is owned by another agent,
  // a second agent shouldn't be able to message the same customer and
  // step on the owner. We lock the composer and show a notice instead.
  // Admins/supervisors are exempt: stepping in is intentional oversight,
  // not a collision. The backend enforces the same rule on send, so
  // this is purely the friendly UI half — bypassing it still 403s.
  const assignedOwnerId = (selected as any)?.assignedUser?.id ?? null;
  const assignedOwnerName = (selected as any)?.assignedUser?.name ?? null;
  const isPrivileged = user?.role === "admin" || user?.role === "supervisor";
  const lockedToOther = !!assignedOwnerId && assignedOwnerId !== user?.id && !isPrivileged;

  // windowExpiresAt is an ISO string from the backend; deriving the
  // remaining time at render time (rather than storing in state) keeps
  // the value live without setting up another timer alongside Live
  // Progress polling. The conversation re-fetches on send anyway.
  const windowExpiresAt: string | null = windowData?.windowExpiresAt ?? null;
  const windowRemaining: { hours: number; minutes: number } | null = (() => {
    if (!windowOpen || !windowExpiresAt) return null;
    const ms = new Date(windowExpiresAt).getTime() - Date.now();
    if (ms <= 0) return null;
    return { hours: Math.floor(ms / 3600000), minutes: Math.floor((ms % 3600000) / 60000) };
  })();
  const [showInboxTemplatePicker, setShowInboxTemplatePicker] = useState(false);
  const [sendingInboxTemplate, setSendingInboxTemplate] = useState(false);

  const rawMsgs = Array.isArray(apiMessagesRaw)
    ? apiMessagesRaw
    : apiMessagesRaw?.items || apiMessagesRaw?.data || [];
  const apiMessages: ChatMessage[] = Array.isArray(rawMsgs)
    ? rawMsgs.map(mapApiMessage)
    : [];

  // Display order is oldest (top) → newest (bottom), matching every
  // chat app the user has ever used (WhatsApp/Telegram/iMessage). The
  // backend returns newest-first, so we reverse a copy for the UI
  // only. The unmodified array still flows into AI/analytics so
  // history stays in its original order for everything else.
  const messages = apiMessages.length ? [...apiMessages].reverse() : [];

  // Translate every customer message currently in the thread that
  // doesn't already have a translation cached. Re-uses the
  // per-message endpoint serially so we don't hammer the AI provider —
  // a 50-msg conversation hits 50 rate-limits if we Promise.all.
  const translateAllVisible = useCallback(async () => {
    if (!selectedId) return;
    const customerMsgs = apiMessages.filter(
      (m) => m.from === "customer" && m.text && !translations[String(m.id)],
    );
    if (customerMsgs.length === 0) {
      showToast(isAr ? "لا توجد رسائل بحاجة إلى ترجمة" : "Nothing to translate");
      return;
    }
    showToast(
      isAr ? `جاري ترجمة ${customerMsgs.length} رسالة...` : `Translating ${customerMsgs.length} messages...`,
    );
    for (const m of customerMsgs) {
      try {
        await requestTranslation(String(m.id), m.text);
      } catch {
        // Skip and keep going — per-message handler already toasted.
      }
    }
  }, [selectedId, apiMessages, translations, isAr, showToast, requestTranslation]);

  // Assign the conversation to a specific team or agent. The drawer
  // shows both — picking a team posts teamId only, picking an agent
  // posts userId. The backend's assign() merges either field, so a
  // team assignment leaves the user unchanged (auto-distribution
  // handles the rest).
  const handleAssign = useCallback(async (target: { kind: "team" | "user"; id: string; label: string }) => {
    if (!selectedId || assigning) return;
    setAssigning(true);
    try {
      const payload: Record<string, string> = {};
      if (target.kind === "team") payload.teamId = target.id;
      else payload.userId = target.id;
      await api.post(`/conversations/${selectedId}/assign`, payload);
      showToast(isAr ? `تمّ الإسناد إلى ${target.label}` : `Assigned to ${target.label}`);
      setShowAssignDrawer(false);
      setAssignSearch("");
      mutateConvos();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message
          || (isAr ? "تعذّر الإسناد" : "Assignment failed"),
        "error",
      );
    } finally {
      setAssigning(false);
    }
  }, [selectedId, assigning, isAr, showToast, mutateConvos]);

  // CSAT request — sends a customer-satisfaction template to the
  // contact. Backend wiring lands with the CSAT template work; for
  // now we 404-guard so the button isn't a dead-end while the
  // template is being configured.
  const requestCsat = useCallback(async () => {
    if (!selectedId) return;
    try {
      await api.post(`/conversations/${selectedId}/csat-request`);
      showToast(isAr ? "تم إرسال طلب التقييم ⭐" : "CSAT request sent ⭐");
    } catch (err: any) {
      if (err?.response?.status === 404) {
        showToast(isAr ? "ميزة التقييم قريباً" : "CSAT feature coming soon");
      } else {
        showToast(
          err?.response?.data?.message
            || (isAr ? "تعذّر إرسال طلب التقييم" : "Failed to send CSAT request"),
          "error",
        );
      }
    }
  }, [selectedId, isAr, showToast]);

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

  // Auto-mark conversation as read when opened. Optimistic — the
  // sidebar badge clears immediately and the API call confirms it
  // server-side. mutateConvos reconciles the count on next refresh.
  useEffect(() => {
    if (!selectedId) return;
    const current = (selected as any)?.unread ?? 0;
    if (current <= 0) return;
    (async () => {
      try {
        await api.post(`/conversations/${selectedId}/read`);
        mutateConvos();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [selectedId, mutateConvos]);

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

  // Order is oldest→newest, so opening a conversation should land
  // the user on the latest message — same as any chat app. Skip
  // until the messages array is populated so we don't "use up" the
  // jump on the empty pre-load render.
  //
  // We use scrollIntoView on a tail anchor (chatEndRef) instead of
  // setting scrollTop=scrollHeight directly: the browser waits until
  // layout is final before honouring it, so it works even when
  // images/long bubbles are still reflowing on the first paint.
  useEffect(() => {
    if (!selectedId || messages.length === 0) return;

    const isFirstLoad = lastScrolledConvoRef.current !== selectedId;

    if (isFirstLoad || stickToBottomRef.current) {
      const scrollToEnd = () => {
        chatEndRef.current?.scrollIntoView({ block: "end" });
        // Belt-and-braces: also pin the container itself, in case the
        // anchor is inside a non-positioned ancestor and the browser
        // refuses to scroll for it.
        const c = messagesScrollRef.current;
        if (c) c.scrollTop = c.scrollHeight;
      };
      // Two RAFs: the first lets React paint the new bubbles, the
      // second runs once layout for those bubbles is complete.
      requestAnimationFrame(() => requestAnimationFrame(scrollToEnd));
      if (isFirstLoad) {
        lastScrolledConvoRef.current = selectedId;
        // Opening a fresh conversation always pins to bottom.
        stickToBottomRef.current = true;
      }
    }
  }, [selectedId, messages.length]);

  // Track whether the user is "at the bottom" continuously, not just
  // at message-update time. 80px slack is generous enough that the
  // last bubble being half-visible still counts as pinned.
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distanceFromBottom < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [selectedId]);

  // Resolved AI state for the selected conversation: prefer the user's
  // session-level override (so optimistic toggles don't flicker), fall
  // back to whatever the API reported.
  const isAiOn = selectedId
    ? (aiAgentsById[selectedId] ?? selected?.aiEnabled ?? false)
    : false;

  const toggleAi = useCallback(async () => {
    if (!selectedId) return;
    const newVal = !isAiOn;
    // Optimistic update keyed by conversation id (not by row index).
    setAiAgentsById((prev) => ({ ...prev, [selectedId]: newVal }));
    try {
      await api.post(`/conversations/${selectedId}/ai/toggle`, { enabled: newVal });
      // Re-fetch so the next render reads aiEnabled from the API and
      // we can drop the override on success.
      mutateConvos();
    } catch (e) {
      // Roll the optimistic flip back on failure so the UI stays honest.
      setAiAgentsById((prev) => ({ ...prev, [selectedId]: !newVal }));
      console.error(e);
    }
  }, [isAiOn, selectedId, mutateConvos]);

  const sentColor = getSentimentColor(selected?.sentiment, selected?.sentimentScore);
  const sentLabel = getSentimentLabel(selected?.sentiment, isAr, selected?.sentimentScore);
  const sentTrend = getTrendDisplay(selected?.sentimentTrend, isAr);
  const isAutoEscalated = !!selected?.autoEscalatedAt;
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
    // Capture and clear AI suggestion tracker BEFORE the await
    const acceptedLogId = aiSuggestionLogId;
    setAiSuggestionLogId(null);
    // Optimistic update
    setLocalMessages((prev) => [...prev, newMsg]);
    setInputText("");
    inputRef.current?.focus();
    // Send to API
    if (selectedId) {
      try {
        await api.post(`/conversations/${selectedId}/messages`, { content: text, messageType: "text" });
        mutateMessages();
        // If this message originated from an AI suggestion, mark it as accepted (fire-and-forget)
        if (acceptedLogId) {
          api.post(`/conversations/${selectedId}/ai/suggest/${acceptedLogId}/accept`).catch(() => {});
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message;
        if (msg) showToast(msg);
        console.error(e);
      }
    }
  }

  async function handleAiSuggest() {
    if (!selectedId || aiSuggesting) return;
    setAiSuggesting(true);
    try {
      const res = await api.post(`/conversations/${selectedId}/ai/suggest`);
      const payload = res.data?.data ?? res.data;
      const suggestion: string = payload?.suggestion ?? "";
      const logId: string | null = payload?.logId ?? null;
      const kbHits: number = payload?.kbHits ?? 0;
      if (suggestion) {
        setInputText(suggestion);
        setAiSuggestionLogId(logId);
        inputRef.current?.focus();
        if (kbHits > 0) {
          showToast(isAr ? `اقتراح جاهز (${kbHits} مرجع من قاعدة المعرفة)` : `Suggestion ready (${kbHits} KB hits)`);
        } else {
          showToast(isAr ? "اقتراح جاهز" : "Suggestion ready");
        }
      } else {
        showToast(isAr ? "تعذّر توليد اقتراح" : "Could not generate a suggestion");
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      showToast(msg || (isAr ? "تعذّر الاتصال بالذكاء" : "AI request failed"));
      console.error(e);
    } finally {
      setAiSuggesting(false);
    }
  }

  // Attachment upload — opens the hidden file input on click,
  // POSTs the chosen file to /conversations/{id}/attachments, and
  // refreshes the message list. Cap (16MB) matches WhatsApp's
  // hard limit; we surface the validation error from the backend
  // when the operator picks a too-large or unsupported file.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const openAttachmentPicker = useCallback(() => {
    if (uploadingAttachment) return;
    if (isAiOn || !windowOpen) return;
    fileInputRef.current?.click();
  }, [uploadingAttachment, isAiOn, windowOpen]);

  const handleAttachmentChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so picking the same file again triggers onChange
    if (!file || !selectedId) return;
    if (file.size > 16 * 1024 * 1024) {
      showToast(isAr ? 'الحدّ الأقصى 16 ميجابايت' : 'Max 16MB', 'error');
      return;
    }

    setUploadingAttachment(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/conversations/${selectedId}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      mutateMessages();
      showToast(isAr ? 'تمّ إرسال المرفق' : 'Attachment sent');
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isAr ? 'فشل إرسال المرفق' : 'Failed to send attachment');
      showToast(msg, 'error');
    } finally {
      setUploadingAttachment(false);
    }
  }, [selectedId, isAr, showToast, mutateMessages]);

  function handleQuickReply(reply: string) {
    // Quick replies populate the composer for review/edit before
    // sending — same pattern as WhatsApp Web / Slack / Intercom
    // canned responses. The previous version fired the message
    // straight to the API on click, which (a) bypassed the agent's
    // chance to tweak the wording, and (b) would silently send
    // even with the AI on (since this code path skipped the
    // composer's disabled-state check).
    setInputText(reply);
    setShowQuickReplies(false);
    inputRef.current?.focus();
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
    const text = noteText.trim();
    if (!text || !selectedId) return;
    setNoteText("");

    // Optimistic insert so the operator sees their note immediately.
    setNotes((prev) => [...prev, text]);

    try {
      // Backend validates `text`, not `content` — the previous payload
      // shape silently 422'd and the optimistic note was the only
      // record left (it disappeared on next conversation switch).
      await api.post(`/conversations/${selectedId}/notes`, { text });
      showToast(isAr ? "تم حفظ الملاحظة" : "Note saved");

      // Refetch so the server-side state (with id, timestamp, author)
      // overwrites the optimistic stub. Keeps the list consistent if
      // multiple agents are editing the same conversation.
      const res = await api.get(`/conversations/${selectedId}/notes`);
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) {
        setNotes(data.map((n: any) => n.content || n.text || n));
      }
    } catch (err) {
      // Roll back the optimistic insert and restore the textarea so
      // the operator can retry without re-typing.
      setNotes((prev) => prev.filter((n) => n !== text));
      setNoteText(text);
      showToast(isAr ? "تعذّر حفظ الملاحظة" : "Failed to save note", "error");
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
        {/* Header — start new conversation entry point. Outbound
            requires an approved template (Meta rule), the modal
            walks the agent through it. */}
        <div style={{ padding: "12px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            {isAr ? "المحادثات" : "Conversations"}
          </h2>
          <button
            onClick={() => setShowNewConversation(true)}
            title={isAr ? "بدء محادثة جديدة (يتطلّب قالباً معتمداً)" : "Start new conversation (requires approved template)"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "5px 10px", borderRadius: 8,
              background: C.pri, color: "#fff", border: "none",
              fontSize: 11.5, fontWeight: 700, fontFamily: FONT_FAMILY, cursor: "pointer",
            }}
          >
            <Icon name="plus" size={11} />
            {isAr ? "جديدة" : "New"}
          </button>
        </div>
        {/* Search */}
        <div style={{ padding: "12px 16px" }}>
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
                  {(c.id ? (aiAgentsById[c.id] ?? c.aiEnabled) : c.aiEnabled) && (
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
                  <div style={{ display: "flex", gap: 5, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge color={getStatusColor(c.st)}>{c.st}</Badge>
                    {/* All applied tags — render up to 3 inline so the
                        card height stays stable. The conversation
                        detail panel shows the full list + edit. */}
                    {(c.tags && c.tags.length > 0 ? c.tags.slice(0, 3) : (c.tag ? [c.tag] : [])).map((t: string, i: number) => (
                      <Badge key={i} color={C.pri}>{t}</Badge>
                    ))}
                    {c.tags && c.tags.length > 3 && (
                      <span style={{ fontSize: 10, color: C.t3 }}>+{c.tags.length - 3}</span>
                    )}
                    {/* Sentiment pill — emoji + 5-tier vivid label so
                        the operator spots an angry customer at a glance.
                        Score-aware: AI score wins over the 3-class string
                        when available. */}
                    {c.sentiment && (() => {
                      const sc = getSentimentColor(c.sentiment, c.sentimentScore);
                      return (
                        <span style={{
                          fontSize: 10,
                          color: sc,
                          fontWeight: 600,
                          padding: "1px 6px",
                          borderRadius: 6,
                          background: sc + "12",
                          border: `1px solid ${sc}25`,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 2,
                        }}>
                          {(() => { const sl = getSentimentLabel(c.sentiment, isAr, c.sentimentScore); return (<><Icon name={sl.icon} size={11} /><span>{sl.text}</span></>); })()}
                        </span>
                      );
                    })()}
                    {/* Trend chip — only renders when AI history shows
                        the conversation is actively worsening or
                        improving. Stable / unknown is silent. */}
                    {(() => {
                      const td = getTrendDisplay(c.sentimentTrend, isAr);
                      if (!td) return null;
                      return (
                        <span style={{
                          fontSize: 10, color: td.color, fontWeight: 600,
                          padding: "1px 6px", borderRadius: 6,
                          background: td.color + "12",
                          border: `1px solid ${td.color}25`,
                          display: "inline-flex", alignItems: "center", gap: 3,
                        }}>
                          <Icon name={td.icon} size={11} />
                          <span>{td.text}</span>
                        </span>
                      );
                    })()}
                    {/* Auto-escalation marker — set by EscalationRouter
                        when negative sentiment + complaint intent fired
                        a re-route. Shows up alongside the assignment so
                        the operator knows this isn't a routine landing. */}
                    {c.autoEscalatedAt && (
                      <span style={{
                        fontSize: 10, color: "#E84855", fontWeight: 700,
                        padding: "1px 6px", borderRadius: 6,
                        background: "#E8485515",
                        border: "1px solid #E8485540",
                        display: "inline-flex", alignItems: "center", gap: 3,
                      }}>
                        <Icon name="siren" size={11} />
                        <span>{isAr ? "تصعيد تلقائي" : "Escalated"}</span>
                      </span>
                    )}
                    {/* Intent pill — what the customer is here for
                        (شكوى / استفسار / نيّة شراء …). Backend already
                        humanises the AI's English enum. */}
                    {c.intent && (
                      <span style={{ fontSize: 10, color: C.info, fontWeight: 500, padding: "1px 6px", borderRadius: 6, background: C.info + "10", display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Icon name="target" size={11} />
                        <span>{c.intent}</span>
                      </span>
                    )}
                    {/* Assignment chip — agent wins if both are set
                        (agent assignment is more specific than team). */}
                    {c.assignedUser?.name && (
                      <span style={{ fontSize: 10, color: C.info, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Icon name="user" size={11} />
                        <span>{c.assignedUser.name}</span>
                      </span>
                    )}
                    {!c.assignedUser?.name && c.assignedTeam?.name && (
                      <span style={{ fontSize: 10, color: C.info, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Icon name="users" size={11} />
                        <span>{c.assignedTeam.name}</span>
                      </span>
                    )}
                    {!c.assignedUser?.name && !c.assignedTeam?.name && !c.aiEnabled && (
                      <span style={{ fontSize: 10, color: C.warn, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Icon name="timer" size={11} />
                        <span>{isAr ? "غير مسند" : "Unassigned"}</span>
                      </span>
                    )}
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: dk ? "#0A0C14" : "#F5F3EF", minWidth: 0, minHeight: 0 }}>
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
            {/* Sentiment + manual recompute. The chip itself is clickable
                so an operator who just took over the conversation can
                say "re-analyse now" instead of waiting for the next
                inbound to fire the auto job. The job server-side throttles
                duplicate clicks so we don't worry about spamming it. */}
            <button
              onClick={async () => {
                try {
                  const res = await api.post(`/conversations/${selectedId}/ai/analyze`);
                  const data = res.data?.data ?? res.data;
                  if (data?.sentiment || data?.intent) {
                    showToast(isAr ? "تم تحليل المحادثة ✓" : "Analysis updated ✓");
                    mutateConvos();
                  }
                } catch {
                  showToast(isAr ? "تعذّر التحليل" : "Couldn't analyse");
                }
              }}
              title={isAr ? "إعادة تحليل" : "Re-analyse"}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 8,
                background: sentColor + "12",
                border: `1px solid ${sentColor}30`,
                fontSize: 11, fontWeight: 600, color: sentColor,
                cursor: "pointer", fontFamily: FONT_FAMILY,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 3, background: sentColor }} />
              <Icon name={sentLabel.icon} size={12} />
              <span>{sentLabel.text}</span>
            </button>
            {/* Trend indicator next to sentiment — only renders when
                worsening or improving (stable is silent). */}
            {sentTrend && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 8,
                background: sentTrend.color + "12",
                border: `1px solid ${sentTrend.color}30`,
                fontSize: 11, fontWeight: 600, color: sentTrend.color,
              }}>
                <Icon name={sentTrend.icon} size={12} />
                <span>{sentTrend.text}</span>
              </span>
            )}
            {/* Auto-escalation banner-chip in the header so the
                operator knows the routing engine put them on this
                conversation deliberately. */}
            {isAutoEscalated && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 8,
                background: "#E8485515",
                border: "1px solid #E8485540",
                fontSize: 11, fontWeight: 700, color: "#E84855",
              }}>
                <Icon name="siren" size={12} />
                <span>{isAr ? "تصعيد تلقائي" : "Escalated"}</span>
              </span>
            )}
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
            {/* Assign — hidden for scoped agents (reassignment 403s for them) */}
            {!isAiOn && !isScopedAgent && (
              <div style={{ position: "relative" }}>
                <Button outline small onClick={() => setShowAssignDrawer((v) => !v)}>
                  {isAr ? "إسناد" : "Assign"} ▾
                </Button>
                {showAssignDrawer && (() => {
                  const teams = (teamsData as any)?.teams ?? [];
                  const members = (teamsData as any)?.members ?? [];
                  const q = assignSearch.trim().toLowerCase();
                  const matches = (s: string) => !q || s.toLowerCase().includes(q);
                  const filteredTeams = teams.filter((t: any) =>
                    matches(t.name ?? "") || matches(t.name_ar ?? ""),
                  );
                  const filteredMembers = members.filter((m: any) =>
                    matches(m.name ?? "") || matches(m.email ?? ""),
                  );
                  return (
                    <>
                      {/* Backdrop closes the drawer on outside click */}
                      <div
                        onClick={() => setShowAssignDrawer(false)}
                        style={{ position: "fixed", inset: 0, zIndex: 40 }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          insetInlineEnd: 0,
                          width: 280,
                          background: C.card,
                          borderRadius: 12,
                          border: `1px solid ${C.brd}`,
                          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                          zIndex: 50,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          maxHeight: 380,
                        }}
                      >
                        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.brd}`, fontSize: 12, fontWeight: 700, color: C.t2 }}>
                          {isAr ? "إسناد إلى" : "Assign to"}
                        </div>
                        <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.brd}` }}>
                          <input
                            value={assignSearch}
                            onChange={(e) => setAssignSearch(e.target.value)}
                            placeholder={isAr ? "بحث عن قسم أو وكيل..." : "Search team or agent..."}
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: 8,
                              background: C.inp,
                              border: `1px solid ${C.brd}`,
                              fontFamily: FONT_FAMILY,
                              fontSize: 11.5,
                              color: C.txt,
                              outline: "none",
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
                          {filteredTeams.length > 0 && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, padding: "4px 10px" }}>
                                {isAr ? "الأقسام" : "Teams"}
                              </div>
                              {filteredTeams.map((tm: any) => (
                                <div
                                  key={`team-${tm.id}`}
                                  onClick={() => handleAssign({
                                    kind: "team",
                                    id: tm.id,
                                    label: (isAr && tm.name_ar) ? tm.name_ar : tm.name,
                                  })}
                                  style={{
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    cursor: assigning ? "wait" : "pointer",
                                    fontSize: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    opacity: assigning ? 0.5 : 1,
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.inp; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                >
                                  <div style={{
                                    width: 24, height: 24, borderRadius: 6,
                                    background: (tm.color || C.pri) + "20",
                                    color: tm.color || C.pri,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 11, fontWeight: 700,
                                  }}>
                                    {((isAr && tm.name_ar) ? tm.name_ar : tm.name)?.[0] ?? "T"}
                                  </div>
                                  {(isAr && tm.name_ar) ? tm.name_ar : tm.name}
                                </div>
                              ))}
                            </>
                          )}
                          {filteredMembers.length > 0 && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, padding: "8px 10px 4px", borderTop: filteredTeams.length > 0 ? `1px solid ${C.brd}` : "none", marginTop: filteredTeams.length > 0 ? 4 : 0 }}>
                                {isAr ? "الوكلاء" : "Agents"}
                              </div>
                              {filteredMembers.map((m: any) => (
                                <div
                                  key={`user-${m.id}`}
                                  onClick={() => handleAssign({ kind: "user", id: m.id, label: m.name })}
                                  style={{
                                    padding: "8px 10px",
                                    borderRadius: 8,
                                    cursor: assigning ? "wait" : "pointer",
                                    fontSize: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    opacity: assigning ? 0.5 : 1,
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.inp; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                >
                                  <Avatar name={m.name} size={24} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                                    {m.role && <div style={{ fontSize: 10, color: C.t3 }}>{m.role}</div>}
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                          {filteredTeams.length === 0 && filteredMembers.length === 0 && (
                            <div style={{ padding: "20px 10px", textAlign: "center", fontSize: 12, color: C.t3 }}>
                              {isAr ? "لا توجد نتائج" : "No matches"}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            {/* Resolve */}
            <Button primary small onClick={handleResolve}>{isAr ? "حل" : "Resolve"}</Button>
            {/* CSAT request — sends a satisfaction survey to the customer */}
            <button
              onClick={requestCsat}
              title={isAr ? "طلب تقييم العميل" : "Request customer satisfaction rating"}
              style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid " + (dk ? C.brd : "#D5D2CC"), background: "transparent", color: C.t2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="star" size={15} />
            </button>
            {/* Translate all customer messages in this thread */}
            <button
              onClick={translateAllVisible}
              title={isAr ? "ترجمة كل الرسائل" : "Translate all messages"}
              style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid " + (dk ? C.brd : "#D5D2CC"), background: "transparent", color: C.t2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="translate" size={15} />
            </button>
            {/* Detail toggle */}
            <button
              onClick={() => setShowDetail(!showDetail)}
              title={isAr ? "تفاصيل العميل" : "Customer details"}
              style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid " + (dk ? C.brd : "#D5D2CC"), background: "transparent", color: showDetail ? C.pri : C.t2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="users" size={15} />
            </button>
          </div>
        </div>

        {/* Intent Bar */}
        <div style={{ padding: "8px 22px", background: isAiOn ? (dk ? "#1a1030" : "#F5F0FF") : (dk ? "#1a1a30" : "#FFF8F0"), borderBottom: "1px solid " + (dk ? C.brd : isAiOn ? "#E0D4F5" : "#F0E8DD"), display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, flexWrap: "wrap" }}>
          {isAiOn && <div style={{ width: 28, height: 28, borderRadius: 8, background: AI_COLOR + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="bot" size={14} /></div>}
          {isAiOn && <span style={{ fontWeight: 600, color: AI_COLOR }}>{isAr ? "وكيل AI يدير المحادثة" : "AI Agent handling"}</span>}
          {!isAiOn && <div style={{ width: 28, height: 28, borderRadius: 8, background: C.pri + "15", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="brain" size={14} /></div>}
          {!isAiOn && <span style={{ color: C.t2 }}>{isAr ? "هدف:" : "Intent:"}</span>}
          {!isAiOn && <span style={{ fontWeight: 600, color: C.pri }}>{selected.intent}</span>}
          {/* Assignment indicator. Specificity wins: agent ▸ team ▸ unassigned. */}
          {selected.assignedUser?.name && (
            <span style={{ fontSize: 11.5, color: C.info, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="user" size={12} />
              <span>{selected.assignedUser.name}</span>
            </span>
          )}
          {!selected.assignedUser?.name && selected.assignedTeam?.name && (
            <span style={{ fontSize: 11.5, color: C.info, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="users" size={12} />
              <span>{selected.assignedTeam.name}</span>
            </span>
          )}
          {!isAiOn && !selected.assignedUser?.name && !selected.assignedTeam?.name && (
            <span style={{ fontSize: 11.5, color: C.warn, fontWeight: 500 }}>
              ⏳ {isAr ? "غير مسند" : "Unassigned"}
            </span>
          )}
          {isAiOn && <span style={{ marginInlineStart: "auto", fontSize: 11.5, color: C.t2 }}>{isAr ? "هدف:" : "Intent:"} <span style={{ fontWeight: 600, color: C.pri }}>{selected.intent}</span></span>}
          {!isAiOn && <span style={{ marginInlineStart: "auto" }}><Badge color={priColor}>{selected.pri}</Badge></span>}
        </div>

        {/* Messages */}
        <div ref={messagesScrollRef} style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          {messagesLoading && (
            <div style={{ textAlign: "center", fontSize: 13, color: C.t2, padding: 20 }}>
              {isAr ? "جاري التحميل..." : "Loading..."}
            </div>
          )}
          {messages.map((m, i) => {
            const cu = m.from === "customer";
            const bo = m.from === "bot";
            const canReport = !!m.id && !!selectedId;
            return (
              <div
                key={i}
                className="msg-row"
                style={{ display: "flex", justifyContent: cu ? (rtl ? "flex-end" : "flex-start") : (rtl ? "flex-start" : "flex-end"), marginBottom: 14, alignItems: "flex-start", gap: 6 }}
              >
                <div style={{ maxWidth: "65%", padding: "12px 16px", borderRadius: 16, background: cu ? C.card : bo ? C.wa + "12" : C.pri, color: (!cu && !bo) ? "#fff" : C.txt, border: cu ? "1px solid " + (dk ? C.brd : "#E8E5E0") : "none", boxShadow: cu ? C.shadow : "none", position: "relative" }}>
                  {bo && (
                    <div style={{ fontSize: 10.5, fontWeight: 600, color: C.wa, marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="bot" size={12} /> Bot
                    </div>
                  )}
                  {/* Media preview — drawn before the caption text so the
                      image/video sits on top of any accompanying caption.
                      Sticker is treated as image. Audio + document fall
                      back to a download chip. The onError handler swaps
                      in a placeholder if the URL can't be fetched (the
                      inbound case where media_url points at a Meta CDN
                      URL the browser can't authenticate against). */}
                  {m.media && (m.type === "image" || m.type === "sticker") && (
                    <a href={m.media} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: m.text ? 8 : 0 }}>
                      <img
                        src={m.media}
                        alt=""
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (img.dataset.fallbackApplied) return;
                          img.dataset.fallbackApplied = "1";
                          const wrapper = img.parentElement;
                          if (wrapper) {
                            wrapper.removeAttribute("href");
                            wrapper.style.cursor = "default";
                            wrapper.innerHTML = `
                              <div style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                padding: 14px 16px;
                                border-radius: 10px;
                                background: ${dk ? "rgba(255,255,255,0.06)" : "#F2EFEA"};
                                color: ${C.t2};
                                font-size: 12px;
                                font-style: italic;
                              ">
                                <span>📷</span>
                                <span>${isAr ? "صورة من العميل — افتح المحادثة على واتساب لمشاهدتها" : "Customer photo — open in WhatsApp to view"}</span>
                              </div>
                            `;
                          }
                        }}
                        style={{
                          display: "block",
                          maxWidth: "100%",
                          maxHeight: 280,
                          borderRadius: 10,
                          objectFit: "cover",
                        }}
                      />
                    </a>
                  )}
                  {m.media && m.type === "video" && (
                    <video
                      src={m.media}
                      controls
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        maxHeight: 280,
                        borderRadius: 10,
                        marginBottom: m.text ? 8 : 0,
                      }}
                    />
                  )}
                  {m.media && m.type === "audio" && (
                    <audio
                      src={m.media}
                      controls
                      style={{ display: "block", maxWidth: "100%", marginBottom: m.text ? 8 : 0 }}
                    />
                  )}
                  {m.media && m.type === "document" && (
                    <a
                      href={m.media}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 12px",
                        borderRadius: 10,
                        background: (!cu && !bo) ? "rgba(255,255,255,0.18)" : (dk ? C.brd : "#F2EFEA"),
                        color: "inherit",
                        textDecoration: "none",
                        fontSize: 12.5,
                        fontWeight: 600,
                        marginBottom: m.text ? 8 : 0,
                      }}
                    >
                      <Icon name="file" size={14} />
                      <span>{isAr ? "افتح المستند" : "Open document"}</span>
                    </a>
                  )}
                  {m.text && <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>{m.text}</div>}
                  {m.id && translations[String(m.id)] && (
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: `1px dashed ${(!cu && !bo) ? "rgba(255,255,255,0.35)" : (dk ? C.brd : "#E0DDD8")}`,
                        fontSize: 12.5,
                        lineHeight: 1.7,
                        opacity: 0.9,
                        direction: translations[String(m.id)].targetLang === "ar" ? "rtl" : "ltr",
                        textAlign: translations[String(m.id)].targetLang === "ar" ? "right" : "left",
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 3, opacity: 0.7, letterSpacing: 0.3, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Icon name="translate" size={11} />
                        <span>{translations[String(m.id)].targetLang === "ar" ? "العربية" : "English"}</span>
                      </div>
                      {translations[String(m.id)].text}
                    </div>
                  )}
                  <div style={{ fontSize: 10, marginTop: 5, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", color: (!cu && !bo) ? "rgba(255,255,255,0.7)" : C.t3 }}>
                    {m.time}
                    {!cu && <span style={{ color: C.info }}><Icon name="dcheck" size={10} /></span>}
                  </div>
                </div>
                {canReport && (
                  <div className="msg-actions" style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6, transition: "opacity 0.15s" }}>
                    <button
                      onClick={() => requestTranslation(String(m.id), m.text)}
                      title={
                        translations[String(m.id)]
                          ? (isAr ? "إخفاء الترجمة" : "Hide translation")
                          : (isAr ? "ترجمة الرسالة" : "Translate message")
                      }
                      disabled={!!translating[String(m.id)]}
                      style={{
                        width: 26, height: 26, borderRadius: 13, border: `1px solid ${C.brd}`,
                        background: translations[String(m.id)] ? AI_COLOR : C.card,
                        color: translations[String(m.id)] ? "#fff" : C.t3,
                        cursor: translating[String(m.id)] ? "wait" : "pointer", padding: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: 12, transition: "all 0.15s",
                        opacity: translating[String(m.id)] ? 0.6 : 1,
                      }}
                    >
                      {translating[String(m.id)] ? "…" : <Icon name="translate" size={13} />}
                    </button>
                    <button
                      onClick={() => setReportContext({
                        type: "message",
                        conversationId: selectedId!,
                        messageId: m.id!,
                        preview: m.text,
                        sentAt: m.time,
                      })}
                      title={isAr ? "تبليغ عن هذه الرسالة" : "Report this message"}
                      style={{
                        width: 26, height: 26, borderRadius: 13, border: `1px solid ${C.brd}`,
                        background: C.card, color: C.t3, cursor: "pointer", padding: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: 12, transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.err; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.t3; }}
                    >
                      <Icon name="flag" size={13} />
                    </button>
                  </div>
                )}
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
          {lockedToOther ? (
            /* Conversation owned by another agent — replace the whole
               composer with a notice. The owner's name comes from the
               assignedUser relation; reassigning (via the header
               "إسناد" control) is how a different agent legitimately
               takes it over. */
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: dk ? "#2A1F08" : "#FFFBEB", border: "1px solid " + (dk ? "#5A4515" : "#FCD34D") }}>
              <span style={{ color: "#D97706", display: "inline-flex" }}><Icon name="lock" size={16} /></span>
              <span style={{ fontSize: 12.5, color: C.t2, flex: 1, lineHeight: 1.6 }}>
                {isAr
                  ? <>هذه المحادثة مُسنَدة إلى <strong style={{ color: C.txt }}>{assignedOwnerName}</strong>. لا يمكنك الرد إلا بعد إسنادها إليك.</>
                  : <>This conversation is assigned to <strong style={{ color: C.txt }}>{assignedOwnerName}</strong>. You can't reply until it's reassigned to you.</>}
              </span>
            </div>
          ) : (
          <>
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
          {/* Window-open indicator with countdown — Meta only allows
              free-form replies inside this 24h window from the
              customer's last message. We render three flavours so the
              operator always knows where they stand:
                - >2h left:  green "النافذة مفتوحة"
                - 30m-2h:    amber "النافذة على وشك الانتهاء"
                - <30m:      red urgent "ستُغلق قريباً — استخدم قالب الآن"
              The closed banner above takes over once the window
              actually expires. Without this transition the operator
              had a silent gap of 30 minutes where neither indicator
              showed — the QA flagged that on 2026-05-05.
            */}
          {windowOpen && !isAiOn && windowRemaining && (() => {
            const totalMin = windowRemaining.hours * 60 + windowRemaining.minutes;
            const isUrgent = totalMin < 30;
            const isWarning = totalMin >= 30 && totalMin < 120; // 30m..2h
            const isOk = totalMin >= 120;

            const tone = isUrgent
              ? { fg: "#EF4444", bgDark: "#2A1010", bgLight: "#FEF2F2", borderDark: "#5A1A1A", borderLight: "#FCA5A5", dot: "#EF4444" }
              : isWarning
              ? { fg: "#D97706", bgDark: "#2A1F08", bgLight: "#FFFBEB", borderDark: "#5A4515", borderLight: "#FCD34D", dot: "#F59E0B" }
              : { fg: COLORS.ok, bgDark: "#0F1F15", bgLight: "#EBF7EF", borderDark: "#1F3D2A", borderLight: "#C8E6CE", dot: COLORS.ok };

            const remainingText = isAr
              ? `${windowRemaining.hours > 0 ? `${windowRemaining.hours} ساعة` : ''}${windowRemaining.hours > 0 && windowRemaining.minutes > 0 ? ' و' : ''}${windowRemaining.minutes > 0 ? `${windowRemaining.minutes} دقيقة` : ''}`
              : `${windowRemaining.hours > 0 ? `${windowRemaining.hours}h` : ''}${windowRemaining.minutes > 0 ? ` ${windowRemaining.minutes}m` : ''}`;

            const headline = isUrgent
              ? (isAr ? `النافذة ستُغلق خلال ${remainingText} — جهّز قالباً!` : `Closes in ${remainingText} — get a template ready`)
              : isWarning
              ? (isAr ? `النافذة على وشك الانتهاء — متبقّي ${remainingText}` : `Window closing soon — ${remainingText} left`)
              : (isAr ? `النافذة مفتوحة — متبقّي ${remainingText}` : `Window open — ${remainingText} left`);

            return (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px", borderRadius: 10,
                background: dk ? tone.bgDark : tone.bgLight,
                border: "1px solid " + (dk ? tone.borderDark : tone.borderLight),
                marginBottom: 10, fontSize: 11.5,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: tone.dot }} />
                {(isUrgent || isWarning) && (
                  <span style={{ color: tone.fg, display: "inline-flex" }}>
                    <Icon name="alert" size={13} />
                  </span>
                )}
                <span style={{ color: isUrgent || isWarning ? tone.fg : C.t2, flex: 1, fontWeight: isUrgent ? 600 : 400 }}>
                  {headline}
                </span>
                {(isUrgent || isWarning) && (
                  <button
                    onClick={() => setShowInboxTemplatePicker(true)}
                    style={{
                      padding: "4px 10px", borderRadius: 6,
                      background: tone.fg, color: "#fff", border: "none",
                      fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: 600,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {isAr ? "إرسال قالب" : "Send template"}
                  </button>
                )}
              </div>
            );
          })()}
          {/*
            Composer lock = AI agent on OR 24h window closed. The
            wrapper used to set pointerEvents:none on the whole row,
            which silently disabled ✨ Suggest too — the agent had to
            Take Over before they could even *peek* at what the AI
            would say. Now we lock individual controls instead, with
            ✨ Suggest + the AI bot toggle staying live so the agent
            can preview suggestions and flip control without giving
            up the AI's autoreply behavior.
          */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <div style={{ display: "flex", gap: 6, paddingBottom: 4 }}>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"
                onChange={handleAttachmentChange}
              />
              <button
                onClick={openAttachmentPicker}
                disabled={isAiOn || !windowOpen || uploadingAttachment}
                title={isAr ? (uploadingAttachment ? "جاري الرفع..." : "إرفاق ملف") : (uploadingAttachment ? "Uploading..." : "Attach file")}
                aria-label={isAr ? "إرفاق ملف" : "Attach file"}
                style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: uploadingAttachment ? C.pri + "15" : C.inp, cursor: (isAiOn || !windowOpen || uploadingAttachment) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.t2, opacity: (isAiOn || !windowOpen) ? 0.4 : 1 }}
              >
                <Icon name={uploadingAttachment ? "loader" : "clip"} size={16} />
              </button>
              <button
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowQuickReplies(false); }}
                disabled={isAiOn || !windowOpen}
                title={isAr ? "إيموجي" : "Emoji"}
                aria-label={isAr ? "إيموجي" : "Emoji"}
                style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: showEmojiPicker ? C.pri + "15" : C.inp, cursor: (isAiOn || !windowOpen) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: showEmojiPicker ? C.pri : C.t2, opacity: (isAiOn || !windowOpen) ? 0.4 : 1 }}
              >
                <Icon name="smile" size={16} />
              </button>
              <button
                onClick={() => { setShowQuickReplies(!showQuickReplies); setShowEmojiPicker(false); }}
                disabled={isAiOn || !windowOpen}
                title={isAr ? "ردود سريعة" : "Quick replies"}
                aria-label={isAr ? "ردود سريعة" : "Quick replies"}
                style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: showQuickReplies ? C.pri + "15" : C.inp, cursor: (isAiOn || !windowOpen) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: showQuickReplies ? C.pri : C.t2, opacity: (isAiOn || !windowOpen) ? 0.4 : 1 }}
              >
                <Icon name="bookmark" size={16} />
              </button>
              {/* ✨ Suggest stays clickable even when the AI is on —
                  agent can preview an alternative reply before deciding
                  whether to take over, without breaking the AI flow. */}
              <button
                onClick={handleAiSuggest}
                disabled={aiSuggesting || !selectedId}
                title={isAr ? "اقترح ردًّا بالذكاء الاصطناعي" : "AI Suggest reply"}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: "1px solid " + AI_COLOR + "40",
                  background: aiSuggesting ? AI_COLOR + "15" : C.inp,
                  cursor: aiSuggesting ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: AI_COLOR,
                  opacity: aiSuggesting || !selectedId ? 0.6 : 1,
                }}
              >
                <span style={{ display: "inline-flex", animation: aiSuggesting ? "ai-spin 1s linear infinite" : undefined }}>
                  <Icon name={aiSuggesting ? "loader" : "sparkles"} size={16} />
                </span>
                <style>{`
                  @keyframes ai-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                  .msg-actions { opacity: 0; }
                  .msg-row:hover .msg-actions { opacity: 1; }
                  /* Mobile / touch devices have no hover — keep buttons
                     visible at half opacity so they're still tappable. */
                  @media (hover: none) {
                    .msg-actions { opacity: 0.55; }
                  }
                `}</style>
              </button>
              {/* AI bot toggle — also stays live so the agent can flip
                  control with one click instead of hunting the bigger
                  toggle in the header. */}
              <button
                onClick={toggleAi}
                title={isAr ? (isAiOn ? "إيقاف وكيل الذكاء وأخذ المحادثة" : "تشغيل وكيل الذكاء") : (isAiOn ? "Take over from AI" : "Hand to AI agent")}
                aria-label={isAr ? "تبديل وكيل الذكاء" : "Toggle AI agent"}
                style={{ width: 34, height: 34, borderRadius: 8, border: isAiOn ? "1.5px solid " + AI_COLOR : "none", background: isAiOn ? AI_COLOR + "15" : C.inp, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isAiOn ? AI_COLOR : C.t2 }}
              >
                <Icon name="bot" size={16} />
              </button>
            </div>
            <div style={{ flex: 1, padding: "10px 16px", borderRadius: 14, background: C.inp, opacity: (isAiOn || !windowOpen) ? 0.4 : 1 }}>
              <input
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                disabled={isAiOn || !windowOpen}
                placeholder={isAr ? "اكتب رسالة..." : "Type..."}
                style={{ border: "none", background: "none", outline: "none", fontFamily: FONT_FAMILY, fontSize: 13.5, color: C.txt, width: "100%", cursor: (isAiOn || !windowOpen) ? "not-allowed" : "text" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isAiOn || !windowOpen}
              title={isAr ? "إرسال" : "Send"}
              aria-label={isAr ? "إرسال الرسالة" : "Send message"}
              style={{ width: 42, height: 42, borderRadius: 12, background: inputText ? C.wa : C.inp, border: "none", cursor: (isAiOn || !windowOpen) ? "not-allowed" : "pointer", color: inputText ? "#fff" : C.t3, display: "flex", alignItems: "center", justifyContent: "center", opacity: (isAiOn || !windowOpen) ? 0.4 : 1 }}
            >
              <Icon name="send" size={18} />
            </button>
          </div>
          </>
          )}
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
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {((selected as any).tags?.length ? (selected as any).tags : (selected.tag ? [selected.tag] : [])).map((t: string, i: number) => (
              <Badge key={i} color={C.pri}>{t}</Badge>
            ))}
            <button
              onClick={() => setShowTagsEditor(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: C.pri, border: "none",
                borderRadius: 14, padding: "5px 14px",
                color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700,
                fontFamily: FONT_FAMILY,
                boxShadow: `0 2px 6px ${C.pri}40`,
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 10px ${C.pri}55`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 6px ${C.pri}40`;
              }}
              title={isAr ? "تحرير التصنيفات" : "Edit tags"}
            >
              <Icon name="tag" size={13} />
              <span>{isAr ? "تصنيف" : "Tag"}</span>
            </button>
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
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", minHeight: 0, flex: 1 }}>
        {mobileView === "list" && renderConversationList()}
        {mobileView === "chat" && renderChatPanel()}
        {mobileView === "detail" && renderDetailPanel()}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
      {renderConversationList()}
      {renderChatPanel()}
      {showDetail && !isTablet && renderDetailPanel()}

      {/* Per-message report-issue modal. Mounted once for the whole
          inbox; the row buttons just feed it a fresh IssueContext. */}
      <ReportIssueModal
        open={!!reportContext}
        onClose={() => setReportContext(null)}
        context={reportContext ?? { type: "general" }}
      />

      {/* Conversation tags editor — opens from the contact panel
          "+ Tag" affordance. Persists via PATCH /conversations/{id}/tags. */}
      <TagsEditorModal
        open={showTagsEditor}
        onClose={() => setShowTagsEditor(false)}
        conversationId={selectedId}
        initialTags={(selected as any)?.tags ?? (selected?.tag ? [selected.tag] : [])}
        onSaved={(newTags) => {
          // Optimistically refresh the visible card so the chips
          // update without waiting for the next list poll.
          mutateConvos();
          setShowTagsEditor(false);
          // No-op for newTags here — mutateConvos will refetch.
          void newTags;
        }}
      />

      {/* Outbound conversation starter. Sends an approved template
          via /conversations/start (Meta-compliant), then jumps the
          inbox selection to the freshly-created conversation. */}
      <NewConversationModal
        open={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onStarted={(cid) => {
          mutateConvos();
          // Selecting by id after the next poll: the convo list will
          // refresh shortly. We try to find it immediately too.
          const idx = convos.findIndex((c: any) => c.id === cid);
          if (idx >= 0) setSelectedIdx(idx);
        }}
      />
    </div>
  );
}
