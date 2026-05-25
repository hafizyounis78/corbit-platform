"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Button, Card, CardHeader, Badge, TabBar, Modal, Toggle, Pagination } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import { getStatusColor } from "@/lib/utils/status-color";
import { nodeTypes } from "@/data/bots";
import type { Bot, FlowNode } from "@/data/bots";
import { COLORS } from "@/lib/constants/colors";
import { FONT_FAMILY } from "@/lib/constants/font";
import type { ThemeColors } from "@/types/common";
import { useBots, useTeams } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { AiInsightsBar, type AiInsightCard } from "@/components/shared/ai-insights-bar";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const NODE_ICONS: Record<string, string> = {
  trigger: "\u26A1",
  message: "\uD83D\uDCAC",
  buttons: "\uD83D\uDD18",
  condition: "\uD83D\uDD00",
  branch: "\uD83C\uDF3F",
  ai: "\uD83E\uDD16",
  end: "\uD83C\uDFC1",
  input: "\u270D\uFE0F",
  transfer: "\uD83D\uDD04",
  api: "\uD83D\uDD0C",
};

const NODE_COLORS: Record<string, string> = {
  trigger: "#F97316",
  message: "#3B82F6",
  buttons: "#A855F7",
  condition: "#EAB308",
  branch: "#0EA5E9",
  ai: "#8B5CF6",
  end: "#6B7280",
  input: "#EC4899",
  transfer: "#10B981",
  api: "#E8713A",
};

// `comingSoon` marks node types whose UI exists but whose runtime
// handler in WhatsAppService::resolveBotReply isn't wired yet \u2014 the
// engine only walks message/buttons/transfer/end at the moment.
// Showing them as enabled would let operators publish bots that
// silently fail when the customer hits an AI/Condition/Input/API
// node. We keep them in the dropdown (greyed) so the feature surface
// stays discoverable + bots already built with them keep editing,
// but block new inserts behind a clear warning until the engine
// catches up.
type AddNodeOption = { type: string; label: string; labelAr: string; comingSoon?: boolean };
const ADD_NODE_TYPES: AddNodeOption[] = [
  { type: "message", label: "Message", labelAr: "\u0631\u0633\u0627\u0644\u0629" },
  { type: "buttons", label: "Buttons", labelAr: "\u0623\u0632\u0631\u0627\u0631" },
  { type: "transfer", label: "Transfer", labelAr: "\u062A\u062D\u0648\u064A\u0644" },
  { type: "end", label: "End", labelAr: "\u0646\u0647\u0627\u064A\u0629" },
  { type: "ai", label: "AI", labelAr: "\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A" },
  { type: "condition", label: "Condition", labelAr: "\u0634\u0631\u0637" },
  { type: "branch", label: "Branch", labelAr: "\u062A\u0641\u0631\u064A\u0639" },
  { type: "input", label: "Input", labelAr: "\u0625\u062F\u062E\u0627\u0644" },
  { type: "api", label: "API", labelAr: "API" },
];

/* ------------------------------------------------------------------ */
/*  Bot Builder Page                                                   */
/* ------------------------------------------------------------------ */

export default function BotBuilderPage() {
  const { colors: C, isDark } = useTheme();
  const { lang, isAr, t } = useLocale();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  const { data: apiBots, isLoading, mutate } = useBots();
  // Pulled for AI node's escalate_to_team dropdown so operators don't
  // free-type a team name that doesn't exist (escalation silently no-ops).
  const { data: teamsData } = useTeams();
  const teams: { id: string; name: string; name_ar?: string }[] =
    Array.isArray(teamsData) ? teamsData : (teamsData as any)?.data ?? [];
  const bots: Bot[] = (Array.isArray(apiBots) ? apiBots : []).map((b: any) => ({
    ...b,
    st: b.st ?? b.status ?? "unpublished",
    ai: b.ai ?? b.aiEnabled ?? false,
    desc: b.desc ?? b.description ?? "",
  }));

  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBot, setNewBot] = useState({ name: "", description: "", trigger: "", aiEnabled: true, startNode: "welcome", cooldownHours: 24 });
  const [savingCooldown, setSavingCooldown] = useState(false);
  // Local draft of the cooldown input so the chip can show a "save"
  // affordance whenever the typed value differs from the server value.
  // Synced from `selectedBot.cooldownHours` via the effect below.
  const [cooldownDraft, setCooldownDraft] = useState<number>(24);
  const [deleteTarget, setDeleteTarget] = useState<Bot | null>(null);
  const [deletingBot, setDeletingBot] = useState(false);

  // Inline edit for the bot's description text shown on each card.
  // editDescTarget holds the bot being edited; editDescDraft holds the
  // textarea value while the modal is open.
  const [editDescTarget, setEditDescTarget] = useState<Bot | null>(null);
  const [editDescDraft, setEditDescDraft] = useState<string>("");
  const [savingDesc, setSavingDesc] = useState(false);

  // Template picker modal — fetched on first open and cached for the
  // session so reopening doesn't re-hit the API.
  type BotTemplate = {
    id: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    category: string;
    node_count: number;
  };
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templates, setTemplates] = useState<BotTemplate[] | null>(null);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState<string | null>(null);

  /* ---- Flow editor state ---- */
  const [flow, setFlow] = useState<FlowNode[]>([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [savingFlow, setSavingFlow] = useState(false);
  const [showAddNodeDropdown, setShowAddNodeDropdown] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
  // Connection mode — clicking a node enters "pick target" state and
  // the next node clicked becomes a child of the source. Esc cancels.
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  // Test mode — slide-in panel that walks the flow as a chat preview.
  const [testOpen, setTestOpen] = useState(false);
  const [testTrace, setTestTrace] = useState<Array<{ kind: "bot" | "user" | "system"; text: string; nodeId?: string }>>([]);
  const [testCurrentNodeId, setTestCurrentNodeId] = useState<string | null>(null);
  const [testInputValue, setTestInputValue] = useState("");

  // Per-node analytics (last 30 days, rolled up). Refreshed when a
  // bot is opened so badges reflect what production has been hitting.
  type NodeAnalytics = {
    node_id: string;
    visited?: number;
    escalated?: number;
    completed?: number;
    error?: number;
    last_visited_at?: string | null;
  };
  const [nodeAnalytics, setNodeAnalytics] = useState<Record<string, NodeAnalytics>>({});

  const selectedBot = useMemo(
    () => (selectedBotId !== null ? bots.find((b) => b.id === selectedBotId) ?? null : null),
    [bots, selectedBotId],
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? flow.find((n) => n.id === selectedNodeId) ?? null : null),
    [flow, selectedNodeId],
  );

  /* ---- Fetch per-node analytics in parallel with the flow ---- */
  useEffect(() => {
    if (selectedBotId === null) {
      setNodeAnalytics({});
      return;
    }
    let cancelled = false;
    api
      .get(`/bots/${selectedBotId}/node-analytics`)
      .then((res: any) => {
        if (cancelled) return;
        const list = (res?.data?.data ?? res?.data ?? []) as NodeAnalytics[];
        const byId: Record<string, NodeAnalytics> = {};
        for (const row of Array.isArray(list) ? list : []) {
          if (row?.node_id) byId[row.node_id] = row;
        }
        setNodeAnalytics(byId);
      })
      .catch(() => {
        if (!cancelled) setNodeAnalytics({});
      });
    return () => { cancelled = true; };
  }, [selectedBotId]);

  /* ---- Sync cooldown draft when the selected bot changes ---- */
  useEffect(() => {
    const serverValue = Number((selectedBot as any)?.cooldownHours ?? 24);
    setCooldownDraft(serverValue);
  }, [selectedBotId, (selectedBot as any)?.cooldownHours]);

  /* ---- Fetch flow when bot is selected ---- */
  useEffect(() => {
    if (selectedBotId === null) {
      setFlow([]);
      return;
    }
    let cancelled = false;
    setFlowLoading(true);
    api
      .get(`/bots/${selectedBotId}/flow`)
      .then((res: any) => {
        if (!cancelled) {
          const raw = res?.data?.data ?? res?.data?.flow ?? res?.data ?? res?.flow ?? res;
          const data = Array.isArray(raw) ? raw : [];
          setFlow(data);
        }
      })
      .catch(() => {
        // Fallback to bot's inline flow data
        if (!cancelled) {
          const bot = bots.find((b) => b.id === selectedBotId);
          setFlow(bot?.flow ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) setFlowLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedBotId]);

  /* ---------- Stats ---------- */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { published: 0, testing: 0, unpublished: 0 };
    bots.forEach((b) => {
      if (counts[b.st] !== undefined) counts[b.st]++;
      else counts[b.st] = 1;
    });
    return counts;
  }, [bots]);

  /* ---------- Filter ---------- */
  const filterTabs = useMemo(
    () => [
      { key: "all", label: isAr ? "\u0627\u0644\u0643\u0644" : "All" },
      { key: "published", label: isAr ? "\u0645\u0646\u0634\u0648\u0631" : "Published" },
      { key: "testing", label: isAr ? "\u0627\u062e\u062a\u0628\u0627\u0631" : "Testing" },
      { key: "unpublished", label: isAr ? "\u0645\u0633\u0648\u062f\u0629" : "Draft" },
    ],
    [isAr],
  );

  const filteredBots = useMemo(
    () => (filterTab === "all" ? bots : bots.filter((b) => b.st === filterTab)),
    [bots, filterTab],
  );

  const BOTS_PER_PAGE = 9;
  const totalBotPages = Math.ceil(filteredBots.length / BOTS_PER_PAGE);
  const paginatedBots = filteredBots.slice((page - 1) * BOTS_PER_PAGE, page * BOTS_PER_PAGE);

  useEffect(() => { setPage(1); }, [filterTab]);

  /* ---- Esc cancels the active connection draft ---- */
  useEffect(() => {
    if (!connectingFromId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConnectingFromId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [connectingFromId]);

  /* ---------- Handlers ---------- */
  const handleCreateFlow = useCallback(() => {
    setNewBot({ name: "", description: "", trigger: "", aiEnabled: true, startNode: "welcome", cooldownHours: 24 });
    setShowCreateModal(true);
  }, []);

  const handleOpenTemplates = useCallback(async () => {
    setShowTemplatesModal(true);
    if (templates !== null) return;
    try {
      const res = await api.get("/bots/templates");
      const list = (res?.data?.data ?? res?.data ?? []) as BotTemplate[];
      setTemplates(Array.isArray(list) ? list : []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isAr ? "تعذّر تحميل القوالب" : "Failed to load templates");
      showToast(msg);
      setTemplates([]);
    }
  }, [templates, isAr, showToast]);

  const handleCreateFromTemplate = useCallback(async (templateId: string) => {
    setCreatingFromTemplate(templateId);
    try {
      await api.post(`/bots/templates/${templateId}`);
      mutate();
      showToast(isAr ? "تمّ إنشاء البوت من القالب ✓" : "Bot created from template ✓");
      setShowTemplatesModal(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isAr ? "تعذّر إنشاء البوت" : "Failed to create bot");
      showToast(msg);
    } finally {
      setCreatingFromTemplate(null);
    }
  }, [isAr, showToast, mutate]);

  const handleSelectBot = useCallback((id: number) => {
    setSelectedBotId(id);
    setSelectedNodeId(null);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedBotId(null);
    setSelectedNodeId(null);
    setFlow([]);
  }, []);

  /* ---- Update a node field in flow ---- */
  const updateNode = useCallback((nodeId: string, patch: Partial<FlowNode>) => {
    setFlow((prev) => prev.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)));
  }, []);

  /* ---- Update node config ---- */
  const updateNodeConfig = useCallback((nodeId: string, configPatch: Record<string, any>) => {
    setFlow((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, config: { ...n.config, ...configPatch } } : n,
      ),
    );
  }, []);

  /* ---- Add node ---- */
  const handleAddNode = useCallback(
    (type: string) => {
      const id = `node_${Date.now()}`;
      const lastNode = flow.length > 0 ? flow[flow.length - 1] : null;
      const newX = lastNode ? lastNode.x : 15;
      const newY = lastNode ? Math.min(lastNode.y + 16, 85) : 10;
      const labelMap: Record<string, string> = {
        message: isAr ? "\u0631\u0633\u0627\u0644\u0629" : "Message",
        buttons: isAr ? "\u0623\u0632\u0631\u0627\u0631" : "Buttons",
        condition: isAr ? "\u0634\u0631\u0637" : "Condition",
        branch: isAr ? "\u062A\u0641\u0631\u064A\u0639" : "Branch",
        ai: "AI",
        input: isAr ? "\u0625\u062F\u062E\u0627\u0644" : "Input",
        transfer: isAr ? "\u062A\u062D\u0648\u064A\u0644" : "Transfer",
        api: "API",
        end: isAr ? "\u0646\u0647\u0627\u064A\u0629" : "End",
      };

      const newNode: FlowNode = {
        id,
        type,
        label: labelMap[type] ?? type,
        x: newX,
        y: newY,
        next: [],
        config: {},
      };

      setFlow((prev) => {
        const updated = [...prev];
        // Connect from last node if it exists and is not an end node
        if (lastNode && lastNode.type !== "end") {
          updated[updated.length - 1] = {
            ...lastNode,
            next: [...lastNode.next, id],
          };
        }
        updated.push(newNode);
        return updated;
      });
      setSelectedNodeId(id);
      setShowAddNodeDropdown(false);
    },
    [flow, isAr],
  );

  /* ---- Delete node ---- */
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setFlow((prev) => {
        const node = prev.find((n) => n.id === nodeId);
        if (!node || node.type === "trigger") return prev;
        // Remove node and clean references
        return prev
          .filter((n) => n.id !== nodeId)
          .map((n) => ({
            ...n,
            next: n.next.filter((nid) => nid !== nodeId),
          }));
      });
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [selectedNodeId],
  );

  /* ---- Save flow ---- */
  const handleSaveFlow = useCallback(async () => {
    if (selectedBotId === null) return;
    setSavingFlow(true);
    try {
      await api.put(`/bots/${selectedBotId}/flow`, flow);
      showToast(isAr ? "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u062A\u062F\u0641\u0642 \u0628\u0646\u062C\u0627\u062D \u2713" : "Flow saved successfully \u2713");
      mutate();
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isAr ? "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u062A\u062F\u0641\u0642" : "Failed to save flow");
      showToast(msg);
    } finally {
      setSavingFlow(false);
    }
  }, [selectedBotId, flow, isAr, showToast, mutate]);

  /* ---- Publish / Unpublish bot ---- */
  const [togglingPublish, setTogglingPublish] = useState(false);
  const handleTogglePublish = useCallback(async () => {
    if (selectedBotId === null || !selectedBot) return;
    const isPublished = selectedBot.st === "published";
    setTogglingPublish(true);
    try {
      await api.post(`/bots/${selectedBotId}/${isPublished ? "unpublish" : "publish"}`);
      showToast(
        isPublished
          ? (isAr ? "\u062A\u0645 \u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0646\u0634\u0631" : "Unpublished")
          : (isAr ? "\u062A\u0645 \u0646\u0634\u0631 \u0627\u0644\u0628\u0648\u062A \u2713" : "Bot published \u2713")
      );
      mutate();
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isAr ? "\u062D\u062F\u062B \u062E\u0637\u0623" : "Error");
      showToast(msg);
    } finally {
      setTogglingPublish(false);
    }
  }, [selectedBotId, selectedBot, isAr, showToast, mutate]);

  /* ---- Drag handlers ---- */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const node = flow.find((n) => n.id === nodeId);
      if (!node) return;
      setDraggingNodeId(nodeId);
      dragStartRef.current = { startX: e.clientX, startY: e.clientY, nodeX: node.x, nodeY: node.y };
    },
    [flow],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingNodeId || !dragStartRef.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStartRef.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragStartRef.current.startY) / rect.height) * 100;
      const newX = Math.max(0, Math.min(85, dragStartRef.current.nodeX + dx));
      const newY = Math.max(0, Math.min(90, dragStartRef.current.nodeY + dy));
      updateNode(draggingNodeId, { x: newX, y: newY });
    },
    [draggingNodeId, updateNode],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
    dragStartRef.current = null;
  }, []);

  /* ---------- Loading ---------- */
  if (isLoading) {
    return (
      <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <p style={{ fontSize: 14, color: C.t2 }}>{isAr ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..." : "Loading..."}</p>
      </div>
    );
  }

  /* ================================================================ */
  /*  DETAIL VIEW                                                      */
  /* ================================================================ */
  if (selectedBot) {
    const stats = selectedBot.stats || { sessions: 0, completed: 0, dropped: 0, avgTime: "0m", satisfaction: 0 };
    const completionPct = stats.sessions > 0 ? Math.round((stats.completed / stats.sessions) * 100) : 0;
    const dropPct = stats.sessions > 0 ? Math.round((stats.dropped / stats.sessions) * 100) : 0;

    const detailStats = [
      { label: isAr ? "\u0627\u0644\u062c\u0644\u0633\u0627\u062a" : "Sessions", value: stats.sessions.toLocaleString(), icon: "activity", color: COLORS.info },
      { label: isAr ? "\u0645\u0639\u062f\u0644 \u0627\u0644\u0625\u0643\u0645\u0627\u0644" : "Completion %", value: `${completionPct}%`, icon: "check", color: COLORS.ok },
      { label: isAr ? "\u0645\u0639\u062f\u0644 \u0627\u0644\u0627\u0646\u0633\u062d\u0627\u0628" : "Drop-off %", value: `${dropPct}%`, icon: "x", color: COLORS.err },
      { label: isAr ? "\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0648\u0642\u062a" : "Avg Time", value: stats.avgTime, icon: "timer", color: COLORS.warn },
      { label: isAr ? "\u0627\u0644\u0631\u0636\u0627" : "Satisfaction", value: `${stats.satisfaction}%`, icon: "star", color: COLORS.ai },
    ];

    /* helper: get config preview text */
    const getConfigPreview = (node: FlowNode): string => {
      if (node.type === "trigger" && node.config.keywords) return String(node.config.keywords);
      if (node.type === "message" && node.config.text) {
        const txt = String(node.config.text);
        return txt.length > 40 ? txt.slice(0, 40) + "..." : txt;
      }
      if (node.type === "buttons" && Array.isArray(node.config.buttons)) return (node.config.buttons as string[]).join(", ");
      if (node.type === "condition" && node.config.expression) return String(node.config.expression);
      if (node.type === "branch" && Array.isArray(node.config.outputs)) {
        const labels = (node.config.outputs as Array<{ label?: string }>)
          .map((o) => o?.label)
          .filter(Boolean) as string[];
        return labels.length ? labels.join(" | ") : (isAr ? `${(node.config.outputs as unknown[]).length} مخارج` : `${(node.config.outputs as unknown[]).length} outputs`);
      }
      if (node.type === "ai" && node.config.model) return String(node.config.model);
      if (node.type === "transfer" && node.config.team) return String(node.config.team);
      if (node.type === "api" && node.config.url) return String(node.config.url);
      return "";
    };

    const nodeColor = (type: string) => NODE_COLORS[type] ?? C.t3;

    /* ---- Connection mode handlers ---- */
    const startConnect = () => {
      setConnectingFromId(selectedNodeId || (flow[0]?.id ?? null));
      // If the user has no node selected, hint at picking one
      if (!selectedNodeId && flow.length > 0) {
        showToast(isAr ? "اختر عقدة المصدر أولاً" : "Pick the source node first");
      }
    };

    const handleNodeClick = (nodeId: string) => {
      // In connect mode, the second click finalises the edge.
      if (connectingFromId) {
        if (connectingFromId === nodeId) {
          // Clicking the source again = cancel
          setConnectingFromId(null);
          return;
        }
        setFlow((prev) => prev.map((n) => {
          if (n.id !== connectingFromId) return n;
          if (n.next.includes(nodeId)) return n; // already connected
          return { ...n, next: [...n.next, nodeId] };
        }));
        setConnectingFromId(null);
        showToast(isAr ? "تم الربط ✓" : "Connected ✓");
        return;
      }
      setSelectedNodeId(nodeId);
    };

    /* ---- Test mode — walks the flow as a fake chat ---- */
    const advanceFromNode = (nodeId: string, choice?: string) => {
      const node = flow.find((n) => n.id === nodeId);
      if (!node) return;
      const trace: typeof testTrace = [];

      // Render the node's "what the bot says" line (if any).
      switch (node.type) {
        case "trigger":
          trace.push({
            kind: "system",
            text: isAr ? `🚀 بدأ التدفّق من '${node.config?.keywords ?? "trigger"}'` : `🚀 Flow started from '${node.config?.keywords ?? "trigger"}'`,
            nodeId,
          });
          break;
        case "message":
          if (node.config?.text) trace.push({ kind: "bot", text: String(node.config.text), nodeId });
          // Surface attached media in the test trace so the operator
          // can see "yes, the PDF would also go out" without sending
          // a real WhatsApp.
          if (node.config?.media && typeof node.config.media === "object") {
            const m = node.config.media as { type?: string; filename?: string };
            const icon = m.type === "image" ? "🖼️" : m.type === "video" ? "🎬" : "📎";
            const label = m.filename || (isAr ? "مرفق" : "attachment");
            trace.push({ kind: "bot", text: `${icon} ${label}`, nodeId });
          } else if (node.config?.imageUrl) {
            trace.push({ kind: "bot", text: `🖼️ ${String(node.config.imageUrl)}`, nodeId });
          }
          break;
        case "buttons":
          if (node.config?.text) trace.push({ kind: "bot", text: String(node.config.text), nodeId });
          break;
        case "input":
          if (node.config?.text) trace.push({ kind: "bot", text: String(node.config.text), nodeId });
          break;
        case "ai":
          trace.push({
            kind: "bot",
            text: isAr ? "🧠 [وكيل AI يردّ هنا بناءً على قاعدة المعرفة]" : "🧠 [AI agent replies here from the knowledge base]",
            nodeId,
          });
          break;
        case "api":
          trace.push({
            kind: "system",
            text: isAr ? `🔌 استدعاء API: ${node.config?.url ?? "—"}` : `🔌 API call: ${node.config?.url ?? "—"}`,
            nodeId,
          });
          break;
        case "condition":
          trace.push({
            kind: "system",
            text: isAr ? `🔀 شرط: ${node.config?.expression ?? "—"} (سنأخذ المسار الأوّل)` : `🔀 Condition: ${node.config?.expression ?? "—"} (taking first path)`,
            nodeId,
          });
          break;
        case "branch": {
          const outs = Array.isArray(node.config?.outputs) ? (node.config.outputs as Array<{ label?: string; keywords?: string[] }>) : [];
          const summary = outs.length
            ? outs.map((o, i) => `${i + 1}. ${o.label ?? "—"}`).join(" / ")
            : (isAr ? "بدون مخارج معدّة" : "no outputs configured");
          trace.push({
            kind: "system",
            text: isAr ? `🌿 تفريع: ${summary} (يأخذ المخرج الأوّل في وضع الاختبار)` : `🌿 Branch: ${summary} (test mode takes first output)`,
            nodeId,
          });
          break;
        }
        case "transfer":
          trace.push({
            kind: "system",
            text: isAr ? `👤 تحويل لـ ${node.config?.team ?? "وكيل بشري"} — انتهى مسار البوت` : `👤 Transfer to ${node.config?.team ?? "human agent"} — bot path ends`,
            nodeId,
          });
          break;
        case "end":
          trace.push({
            kind: "system",
            text: isAr ? "🏁 انتهى التدفّق" : "🏁 Flow ended",
            nodeId,
          });
          break;
      }

      if (choice) {
        trace.push({ kind: "user", text: choice });
      }

      setTestTrace((prev) => [...prev, ...trace]);

      // Buttons + Input wait for the user before advancing; everything
      // else auto-advances to the first child.
      const waitsForUser = node.type === "buttons" || node.type === "input";
      const isTerminal = node.type === "end" || node.type === "transfer";

      if (waitsForUser) {
        setTestCurrentNodeId(nodeId);
        return;
      }

      if (isTerminal || node.next.length === 0) {
        setTestCurrentNodeId(null);
        return;
      }

      // Auto-advance after a small delay so the user can read the
      // bot's last line before the next one lands.
      setTimeout(() => advanceFromNode(node.next[0]), 350);
    };

    const startTest = () => {
      setTestTrace([]);
      setTestInputValue("");
      const start = flow.find((n) => n.type === "trigger") ?? flow[0];
      setTestOpen(true);
      if (!start) {
        setTestTrace([{ kind: "system", text: isAr ? "لا توجد عقدة بداية" : "No starting node" }]);
        return;
      }
      // Defer one tick so React mounts the panel before we push trace
      setTimeout(() => advanceFromNode(start.id), 50);
    };

    const handleTestButton = (label: string, targetNodeId: string) => {
      advanceFromNode(targetNodeId, label);
    };

    const handleTestInputSubmit = () => {
      if (!testCurrentNodeId || !testInputValue.trim()) return;
      const current = flow.find((n) => n.id === testCurrentNodeId);
      if (!current) return;
      const next = current.next[0];
      if (!next) {
        setTestTrace((prev) => [...prev, { kind: "user", text: testInputValue }]);
        setTestCurrentNodeId(null);
        setTestInputValue("");
        return;
      }
      const value = testInputValue;
      setTestInputValue("");
      advanceFromNode(next, value);
    };

    return (
      <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 20, overflow: "hidden" }}>
        {/* Back + Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Button outline small onClick={handleBack}>
            <Icon name={isAr ? "send" : "send"} size={14} />
            {isAr ? "\u0631\u062c\u0648\u0639" : "Back"}
          </Button>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{selectedBot.name}</h2>
              <Badge color={getStatusColor(selectedBot.st)}>{selectedBot.st}</Badge>
              {selectedBot.ai && <Badge color={COLORS.ai}>AI</Badge>}

              {/* Cooldown editor — controlled input. The draft state
                  diverges from the server value as the user types; a
                  save button appears next to the field whenever the two
                  differ, so it's always clear whether the typed value
                  is persisted. Enter also commits. cooldown_hours=0
                  disables the gate (bot fires every time). */}
              {(() => {
                const serverValue = Number((selectedBot as any)?.cooldownHours ?? 24);
                const dirty = cooldownDraft !== serverValue;
                const commit = async () => {
                  if (savingCooldown || !dirty) return;
                  const v = Math.max(0, Math.min(72, Number(cooldownDraft) || 0));
                  setSavingCooldown(true);
                  try {
                    await api.patch(`/bots/${selectedBotId}`, { cooldownHours: v });
                    await mutate();
                    showToast(isAr ? "تم تحديث فترة الانتظار ✓" : "Cooldown updated ✓");
                  } catch {
                    showToast(isAr ? "تعذّر التحديث" : "Update failed");
                    setCooldownDraft(serverValue);
                  } finally {
                    setSavingCooldown(false);
                  }
                };
                return (
                  <div
                    title={isAr ? "فترة انتظار البوت قبل الردّ على نفس العميل (0 = بدون انتظار)" : "Cooldown before re-replying to same contact (0 = no cooldown)"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 6px 3px 8px",
                      borderRadius: 999,
                      background: dirty ? `${C.pri}20` : `${COLORS.warn}18`,
                      color: dirty ? C.pri : COLORS.warn,
                      fontSize: 11,
                      fontWeight: 600,
                      border: dirty ? `1px dashed ${C.pri}` : "1px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon name="timer" size={11} />
                    <input
                      type="number"
                      min={0}
                      max={72}
                      value={cooldownDraft}
                      disabled={savingCooldown}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const n = raw === "" ? 0 : Math.max(0, Math.min(72, Number(raw)));
                        setCooldownDraft(n);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
                      style={{
                        width: 32,
                        border: "none",
                        background: "transparent",
                        color: "inherit",
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: "center",
                        fontFamily: FONT_FAMILY,
                        outline: "none",
                        padding: 0,
                      }}
                    />
                    <span>{isAr ? "س" : "h"}</span>
                    {dirty && (
                      <button
                        type="button"
                        onClick={commit}
                        disabled={savingCooldown}
                        title={isAr ? "حفظ" : "Save"}
                        style={{
                          marginInlineStart: 4,
                          background: C.pri,
                          color: "#fff",
                          border: "none",
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontFamily: FONT_FAMILY,
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: savingCooldown ? "wait" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        {savingCooldown
                          ? (isAr ? "..." : "...")
                          : (<><Icon name="check" size={10} /><span>{isAr ? "حفظ" : "Save"}</span></>)}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
            <p style={{ marginTop: 4, marginBottom: 0, fontSize: 13, color: C.t2 }}>{selectedBot.desc}</p>
          </div>
          {/* Save + Add + Connect + Test buttons */}
          <div style={{ display: "flex", gap: 8, position: "relative", flexWrap: "wrap" }}>
            <Button
              small
              onClick={startTest}
              style={{
                background: "#7C3AED15",
                color: "#7C3AED",
                border: "1px solid #7C3AED40",
              }}
            >
              {"\uD83E\uDDEA "}{isAr ? "\u0627\u062E\u062A\u0628\u0627\u0631" : "Test"}
            </Button>
            <Button
              outline
              small
              onClick={connectingFromId ? () => setConnectingFromId(null) : startConnect}
              style={connectingFromId ? {
                background: "#10B98115",
                color: "#10B981",
                borderColor: "#10B98180",
              } : undefined}
            >
              {"\uD83D\uDD17 "}{connectingFromId
                ? (isAr ? "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0631\u0628\u0637 (Esc)" : "Cancel link (Esc)")
                : (isAr ? "\u0631\u0628\u0637" : "Connect")}
            </Button>
            <div style={{ position: "relative" }}>
              <Button
                outline
                small
                onClick={() => setShowAddNodeDropdown(!showAddNodeDropdown)}
              >
                <Icon name="zap" size={14} />
                {isAr ? "\u0625\u0636\u0627\u0641\u0629 \u0639\u0642\u062F\u0629" : "Add Node"}
              </Button>
              {showAddNodeDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: 4,
                    background: isDark ? "#1E2235" : "#FFF",
                    border: `1px solid ${C.brd}`,
                    borderRadius: 12,
                    padding: 6,
                    zIndex: 100,
                    minWidth: 180,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  }}
                >
                  {ADD_NODE_TYPES.map((nt) => {
                    const disabled = !!nt.comingSoon;
                    return (
                      <button
                        key={nt.type}
                        onClick={() => {
                          if (disabled) {
                            showToast(
                              isAr
                                ? "هذه العقدة قيد التطوير ولا تعمل في البوت المنشور. ستتوفّر قريباً."
                                : "This node type is still in development and won't execute in published bots. Coming soon.",
                              "error",
                            );
                            return;
                          }
                          handleAddNode(nt.type);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "9px 12px",
                          border: "none",
                          borderRadius: 8,
                          background: "transparent",
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.55 : 1,
                          fontFamily: FONT_FAMILY,
                          fontSize: 13,
                          color: C.txt,
                          textAlign: isAr ? "right" : "left",
                        }}
                        onMouseEnter={(e) => {
                          if (disabled) return;
                          (e.currentTarget as HTMLElement).style.background = `${NODE_COLORS[nt.type]}15`;
                        }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        title={disabled ? (isAr ? "قيد التطوير" : "Coming soon") : undefined}
                      >
                        <span style={{ fontSize: 16 }}>{NODE_ICONS[nt.type]}</span>
                        <span style={{ fontWeight: 500 }}>{isAr ? nt.labelAr : nt.label}</span>
                        {disabled ? (
                          <span style={{
                            marginInlineStart: "auto",
                            fontSize: 9.5,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#F59E0B22",
                            color: "#B45309",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                          }}>
                            {isAr ? "قريباً" : "Soon"}
                          </span>
                        ) : (
                          <span style={{ marginInlineStart: "auto", fontSize: 10, color: NODE_COLORS[nt.type], fontWeight: 600, textTransform: "uppercase" }}>{nt.type}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              primary
              small
              onClick={handleSaveFlow}
              disabled={savingFlow}
            >
              {savingFlow ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 14, height: 14, border: "2px solid #fff4", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  {isAr ? "\u062D\u0641\u0638..." : "Saving..."}
                </span>
              ) : (
                <>
                  <Icon name="check" size={14} />
                  {isAr ? "\u062D\u0641\u0638 \u0627\u0644\u062A\u062F\u0641\u0642" : "Save Flow"}
                </>
              )}
            </Button>
            <Button
              small
              onClick={handleTogglePublish}
              disabled={togglingPublish}
              style={{
                background: selectedBot.st === "published" ? "#EF444418" : "#10B98118",
                color: selectedBot.st === "published" ? "#EF4444" : "#10B981",
                border: `1px solid ${selectedBot.st === "published" ? "#EF444440" : "#10B98140"}`,
              }}
            >
              {togglingPublish ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 14, height: 14, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  ...
                </span>
              ) : selectedBot.st === "published" ? (
                <>
                  <Icon name="x" size={14} />
                  {isAr ? "\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0646\u0634\u0631" : "Unpublish"}
                </>
              ) : (
                <>
                  <Icon name="send" size={14} />
                  {isAr ? "\u0646\u0634\u0631" : "Publish"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 12 }}>
          {detailStats.map((s) => (
            <Card key={s.label} style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div
                  style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${s.color}18`, color: s.color }}
                >
                  <Icon name={s.icon} size={14} />
                </div>
                <span style={{ fontSize: 11.5, color: C.t2 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Connect-mode banner \u2014 sits above the canvas so the user
            can't miss why the cursor + interactions changed. */}
        {connectingFromId && (
          <div style={{
            padding: "10px 16px", borderRadius: 10,
            background: "#10B98112", border: "1px solid #10B98140",
            color: "#0F8B5E", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {"\ud83d\udd17"} {isAr
              ? "\u0648\u0636\u0639 \u0627\u0644\u0631\u0628\u0637: \u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0639\u0642\u062f\u0629 \u0627\u0644\u0647\u062f\u0641. Esc \u0644\u0644\u0625\u0644\u063a\u0627\u0621."
              : "Connect mode: click the target node. Esc to cancel."}
            <button
              type="button"
              onClick={() => setConnectingFromId(null)}
              style={{
                marginInlineStart: "auto", padding: "4px 10px", borderRadius: 6,
                border: "1px solid #10B98140", background: "transparent",
                color: "#0F8B5E", fontFamily: FONT_FAMILY, fontSize: 11,
                fontWeight: 600, cursor: "pointer",
              }}
            >
              {isAr ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}
            </button>
          </div>
        )}

        {/* Flow Canvas + Node Config Panel */}
        <div style={{ display: "flex", gap: 16, flexDirection: isMobile ? "column" : "row" }}>
          {/* Canvas */}
          <Card style={{ flex: 1, minHeight: 520, position: "relative", overflow: "hidden" }}>
            <CardHeader title={isAr ? "\u0645\u062e\u0637\u0637 \u0627\u0644\u062a\u062f\u0641\u0642" : "Flow Visualization"} />

            {flowLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 440 }}>
                <p style={{ fontSize: 13, color: C.t2 }}>{isAr ? "\u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062A\u062F\u0641\u0642..." : "Loading flow..."}</p>
              </div>
            ) : (
              <div
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  position: "relative",
                  width: "100%",
                  height: 480,
                  backgroundImage: `radial-gradient(circle, ${C.brd} 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                  cursor: draggingNodeId ? "grabbing" : "default",
                  userSelect: draggingNodeId ? "none" : "auto",
                }}
              >
                {/* SVG Connection Lines */}
                <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                  <defs>
                    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill={C.t3} />
                    </marker>
                  </defs>
                  {(Array.isArray(flow) ? flow : []).map((node) =>
                    (node.next || []).map((targetId) => {
                      const target = flow.find((n) => n.id === targetId);
                      if (!target) return null;
                      const x1 = node.x + 6;
                      const y1 = node.y + 5;
                      const x2 = target.x + 6;
                      const y2 = target.y;
                      const midY = (y1 + y2) / 2;
                      const color = nodeColor(node.type);
                      return (
                        <path
                          key={`${node.id}-${targetId}`}
                          d={`M ${x1}% ${y1}% C ${x1}% ${midY}%, ${x2}% ${midY}%, ${x2}% ${y2}%`}
                          stroke={color}
                          strokeWidth="2"
                          fill="none"
                          strokeOpacity={0.5}
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    }),
                  )}
                </svg>

                {/* Nodes */}
                {(Array.isArray(flow) ? flow : []).map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const color = nodeColor(node.type);
                  const preview = getConfigPreview(node);
                  const icon = NODE_ICONS[node.type] ?? "\u26A1";

                  return (
                    <div
                      key={node.id}
                      onMouseDown={(e) => handleMouseDown(e, node.id)}
                      onClick={(e) => {
                        if (draggingNodeId) return;
                        e.stopPropagation();
                        // In connect mode, route through the helper
                        // so the second click adds the edge instead
                        // of just selecting.
                        if (connectingFromId) {
                          handleNodeClick(node.id);
                          return;
                        }
                        setSelectedNodeId(isSelected ? null : node.id);
                      }}
                      style={{
                        position: "absolute",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        cursor: draggingNodeId === node.id ? "grabbing" : "grab",
                        transition: draggingNodeId === node.id ? "none" : "border-color 0.15s, box-shadow 0.15s",
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                        width: isMobile ? 110 : 150,
                        background: isDark ? "#1A1E2E" : "#FFF",
                        border: `2px solid ${isSelected ? color : C.brd}`,
                        borderRadius: 12,
                        padding: "10px 10px 8px",
                        boxShadow: isSelected
                          ? `0 0 0 3px ${color}30, 0 4px 12px ${color}20`
                          : `0 2px 8px rgba(0,0,0,0.08)`,
                        zIndex: isSelected ? 10 : draggingNodeId === node.id ? 20 : 1,
                      }}
                    >
                      {/* Delete button (not for trigger) */}
                      {node.type !== "trigger" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `1px solid ${C.brd}`,
                            background: isDark ? "#2A2E3E" : "#FFF",
                            color: "#EF4444",
                            fontSize: 12,
                            lineHeight: "18px",
                            textAlign: "center",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            fontFamily: FONT_FAMILY,
                          }}
                          title={isAr ? "\u062D\u0630\u0641" : "Delete"}
                        >
                          {"\u00D7"}
                        </button>
                      )}

                      {/* Top row: icon + label */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: `${color}18`,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: C.txt,
                          }}>
                            {node.label}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        {/* Type badge */}
                        <div style={{
                          display: "inline-flex",
                          padding: "2px 7px",
                          borderRadius: 6,
                          background: `${color}15`,
                          color: color,
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}>
                          {nodeTypes[node.type]?.label[lang] ?? node.type}
                        </div>

                        {/* Visit count badge — only shown when the node
                            actually got visited in the last 30 days, so
                            an empty canvas doesn't show zeros everywhere.
                            Escalation count rides as a red sub-badge for
                            AI / transfer nodes that actually bailed. */}
                        {(() => {
                          const stats = nodeAnalytics[node.id];
                          const visited = stats?.visited ?? 0;
                          if (visited <= 0) return null;
                          const escalated = stats?.escalated ?? 0;
                          return (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 9,
                              fontWeight: 700,
                              color: C.t2,
                            }}
                            title={isAr ? `زيارات آخر 30 يوم: ${visited}${escalated ? ` — تحويلات: ${escalated}` : ""}` : `Visits in last 30d: ${visited}${escalated ? ` — escalations: ${escalated}` : ""}`}
                            >
                              <span style={{
                                padding: "2px 6px",
                                borderRadius: 6,
                                background: `${C.t3}15`,
                                color: C.t2,
                                display: "inline-flex", alignItems: "center", gap: 3,
                              }}>
                                <Icon name="eye" size={10} />
                                <span>{visited.toLocaleString()}</span>
                              </span>
                              {escalated > 0 && (
                                <span style={{
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                  background: "#EF444415",
                                  color: "#B91C1C",
                                  display: "inline-flex", alignItems: "center", gap: 3,
                                }}>
                                  <Icon name="trendingUp" size={10} />
                                  <span>{escalated.toLocaleString()}</span>
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Config preview */}
                      {preview && (
                        <div style={{
                          fontSize: 9.5,
                          color: C.t3,
                          marginTop: 2,
                          lineHeight: 1.3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}>
                          {preview}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Empty state */}
                {flow.length === 0 && !flowLoading && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: C.t3 }}>
                    <Icon name="bot" size={40} />
                    <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
                      {isAr ? "\u0644\u0627 \u064a\u0648\u062c\u062f \u062a\u062f\u0641\u0642 \u0628\u0639\u062f" : "No flow defined yet"}
                    </p>
                    <p style={{ marginTop: 6, marginBottom: 0, fontSize: 12, color: C.t3 }}>
                      {isAr ? "\u0623\u0636\u0641 \u0639\u0642\u062F\u0629 \u0644\u0644\u0628\u062F\u0621" : "Add a node to get started"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Node Config Panel */}
          {selectedNode && (
            <Card style={{ width: isMobile ? "100%" : 320, flexShrink: 0 }}>
              <CardHeader title={isAr ? "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0642\u062f\u0629" : "Node Config"} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, maxHeight: 460, overflowY: "auto" }}>
                {/* Node type header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `${nodeColor(selectedNode.type)}18`,
                      fontSize: 18,
                    }}
                  >
                    {NODE_ICONS[selectedNode.type] ?? "\u26A1"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedNode.label}</div>
                    <div style={{
                      fontSize: 11,
                      color: nodeColor(selectedNode.type),
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}>
                      {nodeTypes[selectedNode.type]?.label[lang] ?? selectedNode.type}
                    </div>
                  </div>
                </div>

                {/* Editable Label */}
                <div>
                  <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>{isAr ? "\u0627\u0644\u0639\u0646\u0648\u0627\u0646" : "Label"}</div>
                  <input
                    value={selectedNode.label}
                    onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${C.brd}`,
                      background: C.inp,
                      color: C.txt,
                      fontSize: 12.5,
                      fontFamily: FONT_FAMILY,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* ID (read-only) */}
                <ConfigField label={isAr ? "\u0627\u0644\u0645\u0639\u0631\u0641" : "ID"} value={selectedNode.id} C={C} />

                {/* ---- Type-specific editable config ---- */}

                {/* Trigger: keywords input */}
                {selectedNode.type === "trigger" && (
                  <div>
                    <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                      {isAr ? "\u0627\u0644\u0643\u0644\u0645\u0627\u062a \u0627\u0644\u0645\u0641\u062a\u0627\u062d\u064a\u0629" : "Keywords"}
                    </div>
                    <input
                      value={String(selectedNode.config.keywords ?? "")}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { keywords: e.target.value })}
                      placeholder={isAr ? "\u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0627\u0635\u0644\u0629" : "Comma separated"}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1px solid ${C.brd}`,
                        background: C.inp,
                        color: C.txt,
                        fontSize: 12.5,
                        fontFamily: FONT_FAMILY,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    {selectedNode.config.keywords && (
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {String(selectedNode.config.keywords).split(",").map((kw, i) => {
                          const trimmed = kw.trim();
                          if (!trimmed) return null;
                          // Removable keyword chip — clicking ✕ rebuilds
                          // the comma-separated string without this entry
                          // and drops empties so we never end up with
                          // ",,," after multiple removals.
                          const removeKeyword = () => {
                            const next = String(selectedNode.config.keywords ?? '')
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s, idx) => s !== '' && idx !== i);
                            updateNodeConfig(selectedNode.id, { keywords: next.join(', ') });
                          };
                          return (
                            <span
                              key={i}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 4px 3px 8px',
                                borderRadius: 999,
                                background: NODE_COLORS.trigger + '22',
                                color: NODE_COLORS.trigger,
                                fontSize: 11,
                                fontWeight: 600,
                                lineHeight: 1,
                              }}
                            >
                              {trimmed}
                              <button
                                onClick={removeKeyword}
                                title={isAr ? 'حذف' : 'Remove'}
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 8,
                                  border: 'none',
                                  background: NODE_COLORS.trigger,
                                  color: '#fff',
                                  fontSize: 10,
                                  lineHeight: 1,
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                ✕
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Message: text textarea + image URL */}
                {selectedNode.type === "message" && (
                  <>
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629" : "Message Text"}
                      </div>
                      <textarea
                        value={String(selectedNode.config.text ?? "")}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { text: e.target.value })}
                        rows={3}
                        placeholder={isAr ? "\u0627\u0643\u062A\u0628 \u0627\u0644\u0631\u0633\u0627\u0644\u0629..." : "Type your message..."}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${C.brd}`,
                          background: C.inp,
                          color: C.txt,
                          fontSize: 12.5,
                          fontFamily: FONT_FAMILY,
                          outline: "none",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <BotMediaUploader
                      node={selectedNode}
                      C={C}
                      isAr={isAr}
                      onChange={(media) => updateNodeConfig(selectedNode.id, { media, imageUrl: undefined })}
                    />
                  </>
                )}

                {/* Buttons: editable button list */}
                {selectedNode.type === "buttons" && (
                  <>
                    {/* Question text that prefaces the buttons. Optional
                        but strongly recommended \u2014 the customer sees this
                        as a normal WhatsApp message right before the
                        button strip ("\u0627\u062e\u062a\u0631 \u0627\u0644\u0642\u0633\u0645: \u2026"). Without it the
                        buttons appear without context and feel abrupt. */}
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0627\u0644\u0633\u0624\u0627\u0644 (\u064a\u0638\u0647\u0631 \u0641\u0648\u0642 \u0627\u0644\u0623\u0632\u0631\u0627\u0631)" : "Question (shown above buttons)"}
                      </div>
                      <textarea
                        value={String(selectedNode.config.text ?? "")}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { text: e.target.value })}
                        rows={2}
                        placeholder={isAr ? "\u0645\u062b\u0627\u0644: \u0627\u062e\u062a\u0631 \u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0645\u0646\u0627\u0633\u0628" : "e.g. Choose the right department"}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${C.brd}`,
                          background: C.inp,
                          color: C.txt,
                          fontSize: 12.5,
                          fontFamily: FONT_FAMILY,
                          outline: "none",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div>
                    <div style={{ fontSize: 11, color: C.t2, marginBottom: 6, fontWeight: 600 }}>
                      {isAr ? "\u0627\u0644\u0623\u0632\u0631\u0627\u0631" : "Buttons"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(Array.isArray(selectedNode.config.buttons) ? selectedNode.config.buttons as string[] : []).map((btn, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input
                            value={btn}
                            onChange={(e) => {
                              const btns = [...(selectedNode.config.buttons as string[])];
                              btns[i] = e.target.value;
                              updateNodeConfig(selectedNode.id, { buttons: btns });
                            }}
                            style={{
                              flex: 1,
                              padding: "7px 10px",
                              borderRadius: 8,
                              border: `1px solid ${C.brd}`,
                              background: C.inp,
                              color: C.txt,
                              fontSize: 12,
                              fontFamily: FONT_FAMILY,
                              outline: "none",
                            }}
                          />
                          <button
                            onClick={() => {
                              const btns = (selectedNode.config.buttons as string[]).filter((_, idx) => idx !== i);
                              updateNodeConfig(selectedNode.id, { buttons: btns });
                            }}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              border: `1px solid ${C.brd}`,
                              background: "transparent",
                              color: "#EF4444",
                              cursor: "pointer",
                              fontSize: 14,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              fontFamily: FONT_FAMILY,
                            }}
                          >
                            {"\u00D7"}
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const btns = [...(Array.isArray(selectedNode.config.buttons) ? selectedNode.config.buttons as string[] : []), ""];
                          updateNodeConfig(selectedNode.id, { buttons: btns });
                        }}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: `2px dashed ${C.brd}`,
                          background: "transparent",
                          color: C.t3,
                          cursor: "pointer",
                          fontSize: 12,
                          fontFamily: FONT_FAMILY,
                        }}
                      >
                        + {isAr ? "\u0625\u0636\u0627\u0641\u0629 \u0632\u0631" : "Add Button"}
                      </button>
                    </div>
                    </div>
                    <div style={{ fontSize: 10.5, color: C.t3 }}>
                      {isAr
                        ? "\u0645\u0644\u0627\u062d\u0638\u0629: \u0648\u0627\u062a\u0633\u0627\u0628 \u064a\u062f\u0639\u0645 3 \u0623\u0632\u0631\u0627\u0631 \u0643\u062d\u062f\u0651 \u0623\u0642\u0635\u0649. \u0627\u0644\u0623\u0643\u062b\u0631 \u0645\u0646 \u0630\u0644\u0643 \u0633\u064a\u064f\u062a\u062c\u0627\u0647\u064e\u0644."
                        : "Note: WhatsApp supports max 3 buttons. Extras are dropped."}
                    </div>
                  </>
                )}

                {/* Condition: expression */}
                {selectedNode.type === "condition" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0627\u0644\u0634\u0631\u0637" : "Condition Expression"}
                      </div>
                      <textarea
                        value={String(selectedNode.config.expression ?? "")}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { expression: e.target.value })}
                        rows={2}
                        placeholder={isAr ? "{{score}} >= 80" : "{{score}} >= 80"}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${C.brd}`,
                          background: C.inp,
                          color: C.txt,
                          fontSize: 12.5,
                          fontFamily: "monospace",
                          outline: "none",
                          resize: "vertical",
                          boxSizing: "border-box",
                          direction: "ltr",
                        }}
                      />
                    </div>
                    <div style={{
                      fontSize: 10.5,
                      color: C.t3,
                      padding: 10,
                      borderRadius: 8,
                      background: C.inp,
                      border: `1px dashed ${C.brd}`,
                      lineHeight: 1.7,
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, color: C.t2 }}>
                        {isAr ? "\u0635\u064A\u063A \u0645\u062F\u0639\u0648\u0645\u0629:" : "Supported operators:"}
                      </div>
                      <div style={{ fontFamily: "monospace", direction: "ltr", textAlign: "left" }}>
                        {"{{var}} == \"value\""}<br />
                        {"{{var}} != \"value\""}<br />
                        {"{{count}} >= 5  /  >  /  <=  /  <"}<br />
                        {"{{text}} contains \"keyword\""}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {isAr
                          ? "\u0627\u0644\u0639\u0642\u062F\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0627\u0644\u0645\u062A\u0651\u0635\u0644\u0629 = \u0645\u0633\u0627\u0631 \"\u0646\u0639\u0645\"\u060C \u0627\u0644\u062B\u0627\u0646\u064A\u0629 = \u0645\u0633\u0627\u0631 \"\u0644\u0627\"."
                          : "First connection = true branch, second = false branch."}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI: model + prompt + escalation guardrails. The model
                    dropdown defaults to gpt-4o-mini \u2014 same model the
                    inbox auto-reply uses, ~30\u00D7 cheaper than gpt-4 at
                    comparable quality for short replies. Claude/Gemini
                    options stay listed for future provider support,
                    but the backend currently routes them through
                    OpenAI's gpt-4o-mini regardless. */}
                {selectedNode.type === "ai" && (
                  <>
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0646\u0645\u0648\u0630\u062C AI" : "AI Model"}
                      </div>
                      <select
                        value={String(selectedNode.config.model ?? "gpt-4o-mini")}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { model: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${C.brd}`,
                          background: C.inp,
                          color: C.txt,
                          fontSize: 12.5,
                          fontFamily: FONT_FAMILY,
                          outline: "none",
                          boxSizing: "border-box",
                          cursor: "pointer",
                        }}
                      >
                        <option value="gpt-4o-mini">GPT-4o mini ({isAr ? "\u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647" : "Recommended"})</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0627\u0644\u062A\u0639\u0644\u064A\u0645\u0627\u062A" : "System Prompt"}
                      </div>
                      <textarea
                        value={String(selectedNode.config.prompt ?? "")}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { prompt: e.target.value })}
                        rows={3}
                        placeholder={isAr ? "\u0627\u0643\u062A\u0628 \u062A\u0639\u0644\u064A\u0645\u0627\u062A AI..." : "Enter system prompt for the AI..."}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${C.brd}`,
                          background: C.inp,
                          color: C.txt,
                          fontSize: 12.5,
                          fontFamily: FONT_FAMILY,
                          outline: "none",
                          resize: "vertical",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Conversation context toggle. OFF by default to keep
                        token usage predictable; flip ON when the bot needs
                        to remember earlier turns in the same conversation. */}
                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${C.brd}`,
                      background: C.inp,
                      cursor: "pointer",
                      fontSize: 12.5,
                    }}>
                      <input
                        type="checkbox"
                        checked={!!selectedNode.config.conversation_context}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { conversation_context: e.target.checked })}
                        style={{ accentColor: NODE_COLORS.ai, cursor: "pointer" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: C.txt, fontWeight: 600 }}>
                          {isAr ? "\u062D\u0641\u0638 \u0633\u064A\u0627\u0642 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629" : "Conversation context"}
                        </div>
                        <div style={{ color: C.t3, fontSize: 10.5, marginTop: 2 }}>
                          {isAr
                            ? "\u064A\u0631\u0633\u0644 \u0622\u062E\u0631 10 \u0631\u0633\u0627\u0626\u0644 \u0645\u0639 \u0643\u0644 \u0637\u0644\u0628 (\u064A\u0632\u064A\u062F \u0627\u0644\u062A\u0643\u0644\u0641\u0629)"
                            : "Sends last 10 messages with each call (raises cost)"}
                        </div>
                      </div>
                    </label>

                    {/* KB grounding toggle. OFF by default \u2014 flipping ON
                        runs the inbox-style vector retrieve against the
                        org's KB and injects the top-K chunks as kbContext.
                        Adds embedding cost per call, so we keep it
                        explicit instead of always-on. */}
                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: `1px solid ${C.brd}`,
                      background: C.inp,
                      cursor: "pointer",
                      fontSize: 12.5,
                    }}>
                      <input
                        type="checkbox"
                        checked={!!selectedNode.config.use_knowledge_base}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { use_knowledge_base: e.target.checked })}
                        style={{ accentColor: NODE_COLORS.ai, cursor: "pointer" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: C.txt, fontWeight: 600 }}>
                          {isAr ? "\u0627\u0633\u062A\u062E\u062F\u0645 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 (RAG)" : "Use Knowledge Base (RAG)"}
                        </div>
                        <div style={{ color: C.t3, fontSize: 10.5, marginTop: 2 }}>
                          {isAr
                            ? "\u064A\u0628\u062D\u062B \u0641\u064A \u0645\u0644\u0641\u0651\u0627\u062A KB \u0644\u0644\u0645\u0646\u0638\u0651\u0645\u0629 \u0648\u064A\u064F\u0645\u0631\u0651\u0631 \u0623\u0639\u0644\u0649 \u0627\u0644\u0645\u0642\u062A\u0637\u0641\u0627\u062A \u0644\u0644\u0646\u0645\u0648\u0630\u062C"
                            : "Retrieves top chunks from the org's KB and passes them to the model"}
                        </div>
                      </div>
                    </label>

                    {/* Optional top-K when KB is enabled. Defaults to 3. */}
                    {!!selectedNode.config.use_knowledge_base && (
                      <div>
                        <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                          {isAr ? "\u0639\u062F\u062F \u0627\u0644\u0645\u0642\u062A\u0637\u0641\u0627\u062A (Top-K)" : "Top-K chunks"}
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={Number(selectedNode.config.kb_top_k ?? 3)}
                          onChange={(e) => {
                            const v = Math.max(1, Math.min(10, Number(e.target.value) || 3));
                            updateNodeConfig(selectedNode.id, { kb_top_k: v });
                          }}
                          style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: `1px solid ${C.brd}`,
                            background: C.inp,
                            color: C.txt,
                            fontSize: 12.5,
                            fontFamily: FONT_FAMILY,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                        <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
                          {isAr ? "1-10. \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A 3. \u0643\u0644 \u0645\u0642\u062A\u0637\u0641 \u064A\u0632\u064A\u062F ~150 \u062A\u0648\u0643\u0646." : "1-10. Default 3. Each chunk ~150 extra tokens."}
                        </div>
                      </div>
                    )}

                    {/* Escalate keywords \u2014 comma-separated. Empty string
                        disables; null/missing uses backend defaults
                        ("\u0645\u0648\u0638\u0641", "\u0625\u0646\u0633\u0627\u0646", "human", etc.). */}
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0644\u0625\u0646\u0633\u0627\u0646 (\u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0648\u0627\u0635\u0644)" : "Escalate keywords (comma-separated)"}
                      </div>
                      <input
                        value={(() => {
                          const v = selectedNode.config.escalate_keywords;
                          if (Array.isArray(v)) return v.join(", ");
                          return typeof v === "string" ? v : "";
                        })()}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { escalate_keywords: e.target.value })}
                        placeholder={isAr ? "\u0645\u0648\u0638\u0641, \u0625\u0646\u0633\u0627\u0646, \u062E\u062F\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621" : "agent, human, operator"}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${C.brd}`,
                          background: C.inp,
                          color: C.txt,
                          fontSize: 12.5,
                          fontFamily: FONT_FAMILY,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
                        {isAr
                          ? "\u0627\u062A\u0631\u0643\u0647\u0627 \u0641\u0627\u0631\u063A\u0629 \u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629. \u0623\u064A\u0651 \u0643\u0644\u0645\u0629 \u062A\u0637\u0627\u0628\u0642 \u0633\u062A\u062D\u0648\u0651\u0644 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629 \u0641\u0648\u0631\u0627\u064B \u0628\u062F\u0648\u0646 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 AI."
                          : "Leave empty for defaults. Any match transfers immediately, skipping the OpenAI call."}
                      </div>
                    </div>

                    {/* Team dropdown \u2014 pulled from /teams. Plain text
                        was the previous storage shape; we keep accepting
                        text but offer the dropdown for new flows. */}
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0641\u0631\u064A\u0642 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0639\u0646\u062F \u0627\u0644\u062A\u0635\u0639\u064A\u062F" : "Escalate to team"}
                      </div>
                      <select
                        value={String(selectedNode.config.escalate_to_team ?? "")}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { escalate_to_team: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${C.brd}`,
                          background: C.inp,
                          color: C.txt,
                          fontSize: 12.5,
                          fontFamily: FONT_FAMILY,
                          outline: "none",
                          boxSizing: "border-box",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">
                          {isAr ? "\u0628\u062F\u0648\u0646 \u0641\u0631\u064A\u0642 \u0645\u062D\u062F\u0651\u062F (\u064A\u0638\u0647\u0631 \u0641\u064A \u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0648\u0627\u0631\u062F)" : "No specific team (goes to inbox queue)"}
                        </option>
                        {teams.map((t) => (
                          <option key={t.id} value={isAr && t.name_ar ? t.name_ar : t.name}>
                            {isAr && t.name_ar ? t.name_ar : t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Branch: ordered list of outputs, each with its own
                    keywords array. The runtime (BotFlowExecutor::
                    matchBranchOutput) takes the first output whose
                    keywords match the customer's reply — exact match
                    first, then substring contains. The output flagged
                    `is_default` (or one with empty keywords) catches
                    everything else. Outputs map by index to next_nodes,
                    so reordering them re-routes the existing edges. */}
                {selectedNode.type === "branch" && (() => {
                  const outputs: Array<{ label: string; keywords: string[]; is_default?: boolean }> =
                    Array.isArray(selectedNode.config.outputs)
                      ? (selectedNode.config.outputs as Array<{ label: string; keywords: string[]; is_default?: boolean }>)
                      : [];

                  const setOutputs = (next: Array<{ label: string; keywords: string[]; is_default?: boolean }>) =>
                    updateNodeConfig(selectedNode.id, { outputs: next });

                  const addOutput = () => {
                    setOutputs([
                      ...outputs,
                      { label: isAr ? `مخرج ${outputs.length + 1}` : `Output ${outputs.length + 1}`, keywords: [] },
                    ]);
                  };

                  const removeOutput = (idx: number) => {
                    setOutputs(outputs.filter((_, i) => i !== idx));
                  };

                  const updateLabel = (idx: number, label: string) => {
                    setOutputs(outputs.map((o, i) => (i === idx ? { ...o, label } : o)));
                  };

                  const updateKeywords = (idx: number, raw: string) => {
                    const list = raw
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s !== "");
                    setOutputs(outputs.map((o, i) => (i === idx ? { ...o, keywords: list } : o)));
                  };

                  const toggleDefault = (idx: number) => {
                    setOutputs(outputs.map((o, i) => (i === idx ? { ...o, is_default: !o.is_default } : o)));
                  };

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{
                        fontSize: 10.5,
                        color: C.t3,
                        padding: 10,
                        borderRadius: 8,
                        background: C.inp,
                        border: `1px dashed ${C.brd}`,
                        lineHeight: 1.7,
                      }}>
                        {isAr
                          ? "كل مخرج له عنوان وكلمات مفتاحيّة (مفصولة بفاصلة). البوت يأخذ أوّل مخرج تتطابق كلمته مع ردّ العميل. ارجع لـ \"وضع الربط\" لربط كل مخرج بعقدة لاحقة."
                          : "Each output has a label and keywords (comma-separated). The bot takes the first output whose keyword matches the customer reply. Use \"Connect mode\" to link each output to a downstream node."}
                      </div>

                      {outputs.map((output, idx) => (
                        <div
                          key={idx}
                          style={{
                            border: `1px solid ${C.brd}`,
                            borderRadius: 10,
                            padding: 10,
                            background: C.inp,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: NODE_COLORS.branch,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: NODE_COLORS.branch + "22",
                              minWidth: 26,
                              textAlign: "center",
                            }}>
                              {idx + 1}
                            </span>
                            <input
                              value={output.label ?? ""}
                              onChange={(e) => updateLabel(idx, e.target.value)}
                              placeholder={isAr ? "اسم المخرج (مثلاً: الفنادق)" : "Output label (e.g. Hotels)"}
                              style={{
                                flex: 1,
                                padding: "6px 8px",
                                borderRadius: 6,
                                border: `1px solid ${C.brd}`,
                                background: C.bg,
                                color: C.txt,
                                fontSize: 12.5,
                                fontFamily: FONT_FAMILY,
                                outline: "none",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeOutput(idx)}
                              title={isAr ? "حذف المخرج" : "Remove output"}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: `1px solid ${C.brd}`,
                                background: "transparent",
                                color: COLORS.err,
                                cursor: "pointer",
                                fontSize: 14,
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </div>

                          <input
                            value={(output.keywords ?? []).join(", ")}
                            onChange={(e) => updateKeywords(idx, e.target.value)}
                            placeholder={isAr ? "كلمات مفتاحيّة مفصولة بفاصلة: 1, فنادق, فندق" : "Keywords comma-separated: 1, hotels, hotel"}
                            style={{
                              padding: "6px 8px",
                              borderRadius: 6,
                              border: `1px solid ${C.brd}`,
                              background: C.bg,
                              color: C.txt,
                              fontSize: 12,
                              fontFamily: FONT_FAMILY,
                              outline: "none",
                              direction: "ltr",
                            }}
                          />

                          <label style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color: C.t2,
                            cursor: "pointer",
                          }}>
                            <input
                              type="checkbox"
                              checked={!!output.is_default}
                              onChange={() => toggleDefault(idx)}
                              style={{ accentColor: NODE_COLORS.branch, cursor: "pointer" }}
                            />
                            {isAr ? "مخرج افتراضي (لو ما تطابقت أيّ كلمة)" : "Default output (when no keyword matches)"}
                          </label>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addOutput}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px dashed ${NODE_COLORS.branch}`,
                          background: "transparent",
                          color: NODE_COLORS.branch,
                          fontSize: 12.5,
                          fontFamily: FONT_FAMILY,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {isAr ? "+ إضافة مخرج" : "+ Add output"}
                      </button>
                    </div>
                  );
                })()}

                {/* Input: variable name */}
                {selectedNode.type === "input" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0627\u0633\u0645 \u0627\u0644\u0645\u062a\u063a\u064a\u0651\u0631" : "Variable Name"}
                      </div>
                      <input
                        value={String(selectedNode.config.variable ?? "")}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { variable: e.target.value })}
                        placeholder="e.g. user_email"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${C.brd}`,
                          background: C.inp,
                          color: C.txt,
                          fontSize: 12.5,
                          fontFamily: "monospace",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
                        {isAr
                          ? "\u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0651\u0629 snake_case. \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0644\u0627\u062d\u0642\u0627\u064b: {{user_email}}."
                          : "Use snake_case. Reference it later with {{user_email}}."}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10.5,
                      color: C.t3,
                      padding: 10,
                      borderRadius: 8,
                      background: C.inp,
                      border: `1px dashed ${C.brd}`,
                      lineHeight: 1.6,
                    }}>
                      {isAr
                        ? "\ud83d\udca1 \u0636\u0639 \u0639\u0642\u062f\u0629 \"\u0631\u0633\u0627\u0644\u0629\" \u0642\u0628\u0644 \u0647\u0630\u0647 \u0627\u0644\u0639\u0642\u062f\u0629 \u062a\u0633\u0623\u0644 \u0627\u0644\u0633\u0624\u0627\u0644 (\u0645\u062b\u0644\u0627\u064b: \"\u0645\u0627 \u0631\u0642\u0645 \u0637\u0644\u0628\u0643\u061f\")\u060c \u062b\u0645\u0651 \u0631\u062f\u0651 \u0627\u0644\u0639\u0645\u064a\u0644 \u0627\u0644\u062a\u0627\u0644\u064a \u064a\u064f\u062d\u0641\u064e\u0638 \u0641\u064a \u0627\u0644\u0645\u062a\u063a\u064a\u0651\u0631 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b."
                        : "\ud83d\udca1 Put a Message node before this asking the question (e.g. \"What's your order id?\"). The customer's next reply gets stored in the variable automatically."}
                    </div>
                  </div>
                )}

                {/* Transfer: team picker. Dropdown is the source of truth
                    for new flows so operators can't typo a team name into
                    a silent no-op. When an older bot stored a name that
                    no longer matches a team, we keep showing it as a
                    "custom" entry so the existing routing stays auditable
                    until the operator picks a real team to replace it. */}
                {selectedNode.type === "transfer" && (() => {
                  const currentTeam = String(selectedNode.config.team ?? "");
                  const teamMatches = (t: { name: string; name_ar?: string }) =>
                    t.name === currentTeam || t.name_ar === currentTeam;
                  const isCustom = currentTeam !== "" && !teams.some(teamMatches);
                  return (
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0627\u0644\u0641\u0631\u064A\u0642" : "Team"}
                      </div>
                      <select
                        value={currentTeam}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { team: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${isCustom ? "#F59E0B" : C.brd}`,
                          background: C.inp,
                          color: C.txt,
                          fontSize: 12.5,
                          fontFamily: FONT_FAMILY,
                          outline: "none",
                          boxSizing: "border-box",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">
                          {isAr ? "\u2014 \u0627\u062e\u062a\u0631 \u0627\u0644\u0641\u0631\u064A\u0642 \u2014" : "\u2014 Select team \u2014"}
                        </option>
                        {teams.map((t) => (
                          <option key={t.id} value={isAr && t.name_ar ? t.name_ar : t.name}>
                            {isAr && t.name_ar ? t.name_ar : t.name}
                          </option>
                        ))}
                        {isCustom && (
                          <option value={currentTeam}>
                            {currentTeam} {isAr ? "(\u063a\u064A\u0631 \u0645\u0639\u0631\u064e\u0651\u0641)" : "(unknown)"}
                          </option>
                        )}
                      </select>
                      {isCustom && (
                        <div style={{ fontSize: 10.5, color: "#B45309", marginTop: 4 }}>
                          {isAr
                            ? `"${currentTeam}" \u063a\u064A\u0631 \u0645\u0637\u0627\u0628\u0642 \u0644\u0623\u064A\u0651 \u0641\u0631\u064A\u0642. \u0627\u0644\u062a\u062d\u0648\u064A\u0644 \u0633\u064A\u062e\u0644\u0651\u064A \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629 \u0628\u0644\u0627 \u062a\u0639\u064A\u064A\u0646.`
                            : `"${currentTeam}" doesn't match any team. Transfer will leave the conversation unassigned.`}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* API: method + URL + headers + body + response variable.
                    All four config fields flow through {{var}} interpolation
                    at runtime, so an Input node earlier in the flow can
                    populate {{order_id}} and the request reaches the right
                    endpoint with the right payload. Body parses as JSON
                    when valid, otherwise sends as raw text/plain. */}
                {selectedNode.type === "api" && (() => {
                  const method = String(selectedNode.config.method ?? "GET").toUpperCase();
                  const showBody = ["POST", "PUT", "PATCH"].includes(method);
                  const rawHeaders = selectedNode.config.headers;
                  const headers: { key: string; value: string }[] = Array.isArray(rawHeaders)
                    ? rawHeaders.map((h: any) => ({ key: String(h?.key ?? ""), value: String(h?.value ?? "") }))
                    : [];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ width: 100 }}>
                          <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                            {isAr ? "النوع" : "Method"}
                          </div>
                          <select
                            value={method}
                            onChange={(e) => updateNodeConfig(selectedNode.id, { method: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: `1px solid ${C.brd}`,
                              background: C.inp,
                              color: C.txt,
                              fontSize: 12.5,
                              fontFamily: "monospace",
                              outline: "none",
                              boxSizing: "border-box",
                              cursor: "pointer",
                            }}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>URL</div>
                          <input
                            value={String(selectedNode.config.url ?? "")}
                            onChange={(e) => updateNodeConfig(selectedNode.id, { url: e.target.value })}
                            placeholder="https://api.example.com/orders/{{order_id}}"
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: `1px solid ${C.brd}`,
                              background: C.inp,
                              color: C.txt,
                              fontSize: 12.5,
                              fontFamily: "monospace",
                              outline: "none",
                              boxSizing: "border-box",
                              direction: "ltr",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                          {isAr ? "الـ Headers (اختياري)" : "Headers (optional)"}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {headers.map((h, i) => (
                            <div key={i} style={{ display: "flex", gap: 6 }}>
                              <input
                                value={h.key}
                                onChange={(e) => {
                                  const next = headers.slice();
                                  next[i] = { ...h, key: e.target.value };
                                  updateNodeConfig(selectedNode.id, { headers: next });
                                }}
                                placeholder="Authorization"
                                style={{
                                  flex: 1, padding: "7px 10px", borderRadius: 6,
                                  border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
                                  fontSize: 12, fontFamily: "monospace", outline: "none", direction: "ltr",
                                }}
                              />
                              <input
                                value={h.value}
                                onChange={(e) => {
                                  const next = headers.slice();
                                  next[i] = { ...h, value: e.target.value };
                                  updateNodeConfig(selectedNode.id, { headers: next });
                                }}
                                placeholder="Bearer {{token}}"
                                style={{
                                  flex: 1.4, padding: "7px 10px", borderRadius: 6,
                                  border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
                                  fontSize: 12, fontFamily: "monospace", outline: "none", direction: "ltr",
                                }}
                              />
                              <button
                                onClick={() => {
                                  const next = headers.filter((_, idx) => idx !== i);
                                  updateNodeConfig(selectedNode.id, { headers: next });
                                }}
                                style={{
                                  width: 24, height: 30, borderRadius: 6,
                                  border: `1px solid ${C.brd}`, background: "transparent",
                                  color: "#EF4444", cursor: "pointer", fontSize: 14,
                                  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                }}
                              >
                                {"×"}
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => updateNodeConfig(selectedNode.id, {
                              headers: [...headers, { key: "", value: "" }],
                            })}
                            style={{
                              padding: "6px 10px", borderRadius: 6,
                              border: `2px dashed ${C.brd}`, background: "transparent",
                              color: C.t3, cursor: "pointer", fontSize: 11.5, fontFamily: FONT_FAMILY,
                            }}
                          >
                            + {isAr ? "إضافة Header" : "Add Header"}
                          </button>
                        </div>
                      </div>

                      {showBody && (
                        <div>
                          <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                            {isAr ? "محتوى الطلب (JSON)" : "Request Body (JSON)"}
                          </div>
                          <textarea
                            value={String(selectedNode.config.body ?? "")}
                            onChange={(e) => updateNodeConfig(selectedNode.id, { body: e.target.value })}
                            rows={4}
                            placeholder={'{\n  "order_id": "{{order_id}}",\n  "status": "new"\n}'}
                            style={{
                              width: "100%", padding: "8px 10px", borderRadius: 8,
                              border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
                              fontSize: 12, fontFamily: "monospace", outline: "none",
                              resize: "vertical", boxSizing: "border-box", direction: "ltr",
                            }}
                          />
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                          {isAr ? "اسم متغيّر الرد" : "Response Variable"}
                        </div>
                        <input
                          value={String(selectedNode.config.response_variable ?? "")}
                          onChange={(e) => updateNodeConfig(selectedNode.id, { response_variable: e.target.value })}
                          placeholder="api_response"
                          style={{
                            width: "100%", padding: "8px 10px", borderRadius: 8,
                            border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
                            fontSize: 12.5, fontFamily: "monospace", outline: "none", boxSizing: "border-box",
                          }}
                        />
                        <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
                          {isAr
                            ? "يخزّن الرد لاستخدامه في عقد لاحقة عبر {{response_variable}}."
                            : "Stores the response for later nodes to use as {{response_variable}}."}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Connections \u2014 each chip carries an X so an operator
                    can remove a single wrong edge without deleting the
                    whole node. For buttons nodes the connection order
                    maps to the button index (1st = button 1, 2nd =
                    button 2\u2026), so the chips are numbered to keep that
                    explicit. */}
                <div>
                  <div style={{ fontSize: 11, color: C.t2, marginBottom: 6, fontWeight: 600 }}>
                    {isAr ? "\u0645\u062a\u0635\u0644 \u0628\u0640" : "Connected to"}
                  </div>
                  {selectedNode.next.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {selectedNode.next.map((nid, idx) => {
                        const target = flow.find((n) => n.id === nid);
                        const isButtons = selectedNode.type === "buttons";
                        const removeAt = idx;
                        return (
                          <span
                            key={`${nid}-${idx}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 4px 2px 8px",
                              borderRadius: 999,
                              background: `${target ? nodeColor(target.type) : C.info}20`,
                              color: target ? nodeColor(target.type) : C.info,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {isButtons && (
                              <span style={{ opacity: 0.7, marginInlineEnd: 2 }}>
                                {idx + 1}.
                              </span>
                            )}
                            <span>{target?.label ?? nid}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFlow((prev) => prev.map((n) => {
                                  if (n.id !== selectedNode.id) return n;
                                  const nextArr = [...n.next];
                                  nextArr.splice(removeAt, 1);
                                  return { ...n, next: nextArr };
                                }));
                              }}
                              title={isAr ? "\u062d\u0630\u0641 \u0627\u0644\u0648\u0635\u0644\u0629" : "Remove edge"}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                lineHeight: 1,
                                display: "inline-flex",
                                color: "inherit",
                                opacity: 0.75,
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                            >
                              <Icon name="x" size={11} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: C.t3 }}>
                      {isAr ? "\u0644\u0627 \u064a\u0648\u062c\u062f" : "None"}
                    </span>
                  )}
                </div>

                {/* Delete button at bottom (not for trigger) */}
                {selectedNode.type !== "trigger" && (
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    style={{
                      marginTop: 8,
                      padding: "9px 14px",
                      borderRadius: 8,
                      border: `1px solid #EF444440`,
                      background: "#EF444412",
                      color: "#EF4444",
                      cursor: "pointer",
                      fontSize: 12.5,
                      fontWeight: 600,
                      fontFamily: FONT_FAMILY,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Icon name="x" size={13} />
                    {isAr ? "\u062D\u0630\u0641 \u0627\u0644\u0639\u0642\u062F\u0629" : "Delete Node"}
                  </button>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* \u2500\u2500 Test panel \u2014 slides in from the side; chat-style preview
              of the flow. Closes via the \u00D7 button or Esc (handled by
              the parent). \u2500\u2500 */}
        {testOpen && (
          <>
            <div
              onClick={() => setTestOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 220 }}
            />
            <div style={{
              position: "fixed",
              top: 0,
              insetInlineEnd: 0,
              width: 380,
              maxWidth: "92vw",
              height: "100vh",
              background: C.card,
              borderInlineStart: `1px solid ${C.brd}`,
              boxShadow: "-12px 0 30px rgba(0,0,0,0.18)",
              zIndex: 221,
              display: "flex",
              flexDirection: "column",
              fontFamily: FONT_FAMILY,
            }}>
              <div style={{
                padding: "14px 18px", borderBottom: `1px solid ${C.brd}`,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#7C3AED15", color: "#7C3AED",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>{"\uD83E\uDDEA"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {isAr ? "\u0648\u0636\u0639 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631" : "Test Mode"}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.t2 }}>
                    {selectedBot?.name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startTest}
                  title={isAr ? "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644" : "Restart"}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: `1px solid ${C.brd}`, background: "transparent",
                    color: C.t2, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                ><Icon name="refresh" size={14} /></button>
                <button
                  type="button"
                  onClick={() => setTestOpen(false)}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: `1px solid ${C.brd}`, background: "transparent",
                    color: C.t2, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                ><Icon name="x" size={14} /></button>
              </div>

              {/* Trace */}
              <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8, background: isDark ? "#0A0C14" : "#F5F3EF" }}>
                {testTrace.length === 0 && (
                  <div style={{ textAlign: "center", color: C.t3, fontSize: 12, marginTop: 30 }}>
                    {isAr ? "\u062C\u0627\u0631\u064A \u0628\u062F\u0621 \u0627\u0644\u062A\u062F\u0641\u0651\u0642..." : "Starting flow..."}
                  </div>
                )}
                {testTrace.map((t, i) => {
                  if (t.kind === "system") {
                    return (
                      <div key={i} style={{
                        textAlign: "center" as const,
                        fontSize: 11, color: C.t3, fontStyle: "italic" as const,
                        padding: "6px 12px",
                      }}>
                        {t.text}
                      </div>
                    );
                  }
                  const isUser = t.kind === "user";
                  return (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                    }}>
                      <div style={{
                        maxWidth: "78%",
                        padding: "9px 13px",
                        borderRadius: isUser ? "14px 14px 0 14px" : "14px 14px 14px 0",
                        background: isUser ? "#DCF8C6" : C.card,
                        color: "#1A1A1A",
                        fontSize: 13,
                        lineHeight: 1.6,
                        boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
                      }}>
                        {t.text}
                      </div>
                    </div>
                  );
                })}

                {/* Buttons node \u2014 render the choices as tappable chips
                    that advance the trace along the matching edge. */}
                {testCurrentNodeId && (() => {
                  const node = flow.find((n) => n.id === testCurrentNodeId);
                  if (!node || node.type !== "buttons") return null;
                  const labels: string[] = Array.isArray(node.config?.buttons) ? node.config.buttons : [];
                  return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {labels.map((label, idx) => {
                        const target = node.next[idx] ?? node.next[0];
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => target && handleTestButton(label, target)}
                            disabled={!target}
                            style={{
                              padding: "8px 14px", borderRadius: 18,
                              background: target ? "#fff" : "#eee",
                              border: `1px solid ${target ? "#4A90D9" : C.brd}`,
                              color: target ? "#4A90D9" : C.t3,
                              fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600,
                              cursor: target ? "pointer" : "not-allowed",
                            }}
                          >
                            {label}{target ? "" : " \u26A0"}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Input footer \u2014 only when current node is "input" */}
              {testCurrentNodeId && (() => {
                const node = flow.find((n) => n.id === testCurrentNodeId);
                if (!node || node.type !== "input") return null;
                return (
                  <div style={{
                    padding: 12, borderTop: `1px solid ${C.brd}`,
                    display: "flex", gap: 8,
                  }}>
                    <input
                      value={testInputValue}
                      onChange={(e) => setTestInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleTestInputSubmit(); }}
                      placeholder={isAr ? "\u0627\u0643\u062A\u0628 \u0631\u062F\u0651 \u0627\u0644\u0639\u0645\u064A\u0644..." : "Type customer reply..."}
                      style={{
                        flex: 1, padding: "10px 14px", borderRadius: 10,
                        background: C.inp, border: `1px solid ${C.brd}`,
                        color: C.txt, fontFamily: FONT_FAMILY, fontSize: 13,
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleTestInputSubmit}
                      style={{
                        padding: "10px 18px", borderRadius: 10,
                        background: C.pri, color: "#fff", border: "none",
                        fontFamily: FONT_FAMILY, fontSize: 12.5, fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isAr ? "\u0625\u0631\u0633\u0627\u0644" : "Send"}
                    </button>
                  </div>
                );
              })()}
              {!testCurrentNodeId && testTrace.length > 0 && (
                <div style={{
                  padding: "10px 14px", borderTop: `1px solid ${C.brd}`,
                  fontSize: 11.5, color: C.t3, textAlign: "center" as const,
                }}>
                  {isAr ? "\uD83C\uDFC1 \u0627\u0646\u062A\u0647\u0649 \u0627\u0644\u062A\u062F\u0641\u0651\u0642 \u2014 \u0627\u0636\u063A\u0637 \uD83D\uDD04 \u0644\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644" : "\uD83C\uDFC1 Flow ended \u2014 click \uD83D\uDD04 to restart"}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  /* ================================================================ */
  /*  LIST VIEW                                                        */
  /* ================================================================ */
  return (
    <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 20, overflow: "hidden" }}>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            {isAr ? "\u0645\u0646\u0634\u0626 \u0627\u0644\u0628\u0648\u062a\u0627\u062a" : "Bot Builder"}
          </h1>
          <p style={{ marginTop: 4, marginBottom: 0, fontSize: 13, color: C.t2 }}>
            {isAr ? "\u0625\u0646\u0634\u0627\u0621 \u0648\u0625\u062f\u0627\u0631\u0629 \u062a\u062f\u0641\u0642\u0627\u062a \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0627\u062a \u0627\u0644\u0622\u0644\u064a\u0629" : "Create and manage automated conversation flows"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button outline onClick={handleOpenTemplates}>
            <Icon name="bot" size={14} />
            {isAr ? "\u0627\u0628\u062f\u0623 \u0645\u0646 \u0642\u0627\u0644\u0628" : "Start from Template"}
          </Button>
          <Button primary onClick={handleCreateFlow}>
            <Icon name="zap" size={14} />
            {isAr ? "\u0625\u0646\u0634\u0627\u0621 \u062a\u062f\u0641\u0642" : "Create Flow"}
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: isAr ? "\u0627\u0644\u0643\u0644" : "Total", value: bots.length, color: COLORS.pri, icon: "bot" },
          { label: isAr ? "\u0645\u0646\u0634\u0648\u0631" : "Published", value: statusCounts.published ?? 0, color: COLORS.ok, icon: "check" },
          { label: isAr ? "\u0627\u062e\u062a\u0628\u0627\u0631" : "Testing", value: statusCounts.testing ?? 0, color: COLORS.warn, icon: "activity" },
          { label: isAr ? "\u0645\u0633\u0648\u062f\u0629" : "Draft", value: statusCounts.unpublished ?? 0, color: "#555764", icon: "file" },
        ].map((s) => (
          <Card key={s.label} style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div
                style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${s.color}18`, color: s.color }}
              >
                <Icon name={s.icon} size={14} />
              </div>
              <span style={{ fontSize: 12, color: C.t2 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <TabBar tabs={filterTabs} active={filterTab} onChange={setFilterTab} />

      {/* Bot cards grid */}
      {paginatedBots.length === 0 && !isLoading && (
        <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 13, color: C.t2 }}>
          {isAr ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u0648\u062a\u0627\u062a" : "No bots"}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(320px,1fr))", gap: 14 }}>
        {paginatedBots.map((bot) => (
          <Card
            key={bot.id}
            onClick={() => handleSelectBot(bot.id)}
            style={{ padding: 0, cursor: "pointer" }}
          >
            <div style={{ padding: 18 }}>
              {/* Top row: name + badges + delete */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div
                    style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${COLORS.pri}15`, color: COLORS.pri }}
                  >
                    <Icon name="bot" size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{bot.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <Badge color={getStatusColor(bot.st)}>{bot.st}</Badge>
                      {bot.ai && <Badge color={COLORS.ai}>AI</Badge>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(bot);
                  }}
                  title={isAr ? "\u062d\u0630\u0641" : "Delete"}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#EF444412", color: "#EF4444",
                    border: `1px solid #EF444430`, cursor: "pointer",
                  }}
                >
                  <Icon name="x" size={14} />
                </button>
              </div>

              {/* Description — pencil sits inline so the affordance is
                  always visible without a hover state (mobile-friendly). */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 12 }}>
                <p style={{ flex: 1, margin: 0, fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>
                  {bot.desc || (
                    <span style={{ color: C.t3, fontStyle: "italic" }}>
                      {isAr ? "لا يوجد وصف — اضغط القلم لإضافة وصف" : "No description — click the pencil to add one"}
                    </span>
                  )}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditDescTarget(bot as any);
                    setEditDescDraft(bot.desc ?? "");
                  }}
                  title={isAr ? "تعديل الوصف" : "Edit description"}
                  style={{
                    width: 26, height: 26, borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${COLORS.pri}10`, color: COLORS.pri,
                    border: `1px solid ${COLORS.pri}30`, cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="pencil" size={12} />
                </button>
              </div>

              {/* Meta row */}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11.5, color: C.t3 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon name="zap" size={12} />
                  {bot.nodes} {isAr ? "\u0639\u0642\u062f\u0629" : "nodes"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon name="tag" size={12} />
                  {bot.trigger}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon name="msg" size={12} />
                  {bot.conversations.toLocaleString()} {isAr ? "\u0645\u062d\u0627\u062f\u062b\u0629" : "conversations"}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Pagination page={page} totalPages={totalBotPages} totalItems={filteredBots.length} onPageChange={setPage} />

      {/* AI Insights — derived from the loaded bot list. */}
      {(() => {
        if (!filteredBots || filteredBots.length === 0) return null;
        // Status arrives as `st` from the API (BotResource maps to short
        // key for the card badges); the `status` long form was a leftover
        // assumption that always returned undefined, making the "no active
        // bot" suggestion fire even when bots were published.
        const published = filteredBots.filter((b: any) => b.st === "published" || b.status === "published" || b.is_active);
        const drafts = filteredBots.filter((b: any) => b.st === "draft" || b.status === "draft");
        // Top performer by conversations served.
        const sortedByConvos = [...filteredBots].sort((a: any, b: any) => (b.conversations || 0) - (a.conversations || 0));
        const top = sortedByConvos[0];
        const cards: AiInsightCard[] = [];
        if (top && top.conversations > 0) {
          cards.push({
            icon: "award",
            title: isAr ? "البوت الأنشط" : "Most Active Bot",
            value: top.conversations,
            caption: isAr
              ? `${top.name} خدم أكبر عدد من المحادثات`
              : `${top.name} handled the most conversations`,
            cta: isAr ? "افحص التدفّق" : "Inspect flow",
            tone: "ok",
          });
        }
        if (drafts.length > 0) {
          cards.push({
            icon: "text",
            title: isAr ? "مسودّات لم تُنشَر" : "Unpublished Drafts",
            value: drafts.length,
            caption: isAr
              ? "بوتات جاهزة للاختبار قبل تفعيلها"
              : "Bots ready to test before going live",
            cta: isAr ? "اختبر وانشر" : "Test & publish",
            tone: "warn",
          });
        }
        if (published.length === 0 && filteredBots.length > 0) {
          cards.push({
            icon: "sparkles",
            title: isAr ? "اقتراح" : "Suggestion",
            caption: isAr
              ? "لا يوجد بوت نشط حالياً — الذكاء الاصطناعي يجاوب بدلاً منهم. فعّل بوت لتقليل التكلفة."
              : "No active bots yet — AI handles fallback. Publishing a bot reduces AI cost.",
            cta: isAr ? "انشر أوّل بوت" : "Publish first bot",
            tone: "pri",
          });
        } else {
          cards.push({
            icon: "rocket",
            title: isAr ? "بوتات نشطة" : "Active Bots",
            value: published.length,
            caption: isAr
              ? "كل بوت نشط يقلّل تكلفة AI ويسرّع الردود"
              : "Each active bot cuts AI cost and speeds responses",
            tone: "pri",
          });
        }
        return <AiInsightsBar cards={cards} title={isAr ? "تحليل بوتاتك" : "Bots Insights"} />;
      })()}

      {/* Empty state */}
      {filteredBots.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.t3 }}>
          <Icon name="bot" size={40} />
          <p style={{ marginTop: 12, marginBottom: 0, fontSize: 14 }}>
            {isAr ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u0648\u062a\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629" : "No bots match this filter"}
          </p>
        </div>
      )}

      {/* ── Pick Template Modal ── */}
      <Modal
        open={showTemplatesModal}
        onClose={() => !creatingFromTemplate && setShowTemplatesModal(false)}
        title={isAr ? "\u0627\u062E\u062A\u0631 \u0642\u0627\u0644\u0628 \u0627\u0644\u0628\u0648\u062A" : "Pick a Bot Template"}
        wide
        hideFooter
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: C.t2, lineHeight: 1.6 }}>
            {isAr
              ? "\u0627\u062E\u062A\u0631 \u0642\u0627\u0644\u0628\u0627\u064B \u062C\u0627\u0647\u0632\u0627\u064B \u0648\u0639\u062F\u0651\u0644 \u0639\u0644\u064A\u0647 \u2014 \u0627\u0644\u0628\u0648\u062A \u064A\u064F\u0646\u0634\u0623 \u0643\u0645\u0633\u0648\u0651\u062F\u0629 \u0644\u062A\u0631\u0627\u062C\u0639 \u0627\u0644\u0646\u0635\u0648\u0635 \u0648\u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0641\u0631\u0642 \u0642\u0628\u0644 \u0627\u0644\u0646\u0634\u0631."
              : "Pick a starter and tweak it \u2014 bots are created as drafts so you can review the copy and team names before going live."}
          </p>
          {templates === null && (
            <div style={{ padding: 30, textAlign: "center", color: C.t3, fontSize: 13 }}>
              {isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." : "Loading..."}
            </div>
          )}
          {templates !== null && templates.length === 0 && (
            <div style={{ padding: 30, textAlign: "center", color: C.t3, fontSize: 13 }}>
              {isAr ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u0642\u0648\u0627\u0644\u0628 \u0645\u062A\u0627\u062D\u0629" : "No templates available"}
            </div>
          )}
          {templates && templates.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: 10,
              marginTop: 8,
            }}>
              {templates.map((t) => {
                const busy = creatingFromTemplate === t.id;
                const anyBusy = creatingFromTemplate !== null;
                return (
                  <div
                    key={t.id}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: `1px solid ${C.brd}`,
                      background: C.card,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      opacity: anyBusy && !busy ? 0.55 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Badge color={COLORS.ai}>{t.category}</Badge>
                      <Badge color={C.t3}>{t.node_count} {isAr ? "\u0639\u0642\u062F\u0629" : "nodes"}</Badge>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>
                      {isAr ? t.name_ar : t.name_en}
                    </div>
                    <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6, flex: 1 }}>
                      {isAr ? t.description_ar : t.description_en}
                    </div>
                    <Button
                      primary
                      small
                      disabled={anyBusy}
                      onClick={() => handleCreateFromTemplate(t.id)}
                    >
                      {busy
                        ? (isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u0625\u0646\u0634\u0627\u0621..." : "Creating...")
                        : (isAr ? "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0647\u0630\u0627 \u0627\u0644\u0642\u0627\u0644\u0628" : "Use this template")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* \u2500\u2500 Delete Bot Modal \u2500\u2500 */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deletingBot && setDeleteTarget(null)}
        title={isAr ? "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062D\u0630\u0641" : "Confirm Delete"}
        submitLabel={deletingBot ? (isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062D\u0630\u0641..." : "Deleting...") : (isAr ? "\u0646\u0639\u0645\u060C \u0627\u062D\u0630\u0641" : "Yes, Delete")}
        submitDisabled={deletingBot}
        onSubmit={async () => {
          if (!deleteTarget) return;
          setDeletingBot(true);
          try {
            await api.delete(`/bots/${deleteTarget.id}`);
            showToast(isAr ? "\u062A\u0645 \u0627\u0644\u062D\u0630\u0641 \u2713" : "Deleted \u2713");
            mutate();
            setDeleteTarget(null);
          } catch (err: any) {
            const msg = err?.response?.data?.message || (isAr ? "\u0641\u0634\u0644 \u0627\u0644\u062D\u0630\u0641" : "Failed to delete");
            showToast(msg);
          } finally {
            setDeletingBot(false);
          }
        }}
      >
        <div style={{ padding: "8px 4px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, borderRadius: 12, background: "#EF444410", border: `1px solid #EF444430`, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EF444418", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="x" size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {isAr ? `\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F \u0645\u0646 \u062D\u0630\u0641 "${deleteTarget?.name}"\u061F` : `Delete "${deleteTarget?.name}"?`}
              </div>
              <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>
                {isAr ? "\u0633\u064A\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0628\u0648\u062A \u0648\u062C\u0645\u064A\u0639 \u0639\u0642\u062F\u0647 \u0646\u0647\u0627\u0626\u064A\u0627\u064B. \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621." : "This will permanently delete the bot and all its flow nodes. This action cannot be undone."}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Create Bot Flow Modal ── */}
      {/* Edit Description Modal */}
      <Modal
        open={!!editDescTarget}
        onClose={() => !savingDesc && setEditDescTarget(null)}
        title={isAr ? "تعديل وصف البوت" : "Edit Bot Description"}
        submitLabel={savingDesc ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
        submitDisabled={savingDesc}
        onSubmit={async () => {
          if (!editDescTarget) return;
          setSavingDesc(true);
          try {
            await api.patch(`/bots/${editDescTarget.id}`, {
              description: editDescDraft.trim(),
            });
            showToast(isAr ? "تمّ حفظ الوصف ✓" : "Description saved ✓");
            mutate();
            setEditDescTarget(null);
          } catch (err: any) {
            const msg = err?.response?.data?.message || (isAr ? "تعذّر الحفظ" : "Failed to save");
            showToast(msg);
          } finally {
            setSavingDesc(false);
          }
        }}
      >
        <div style={{ padding: "4px 4px 8px" }}>
          <div style={{ fontSize: 12.5, color: C.t2, marginBottom: 10, lineHeight: 1.6 }}>
            {isAr
              ? `وصف يظهر على بطاقة البوت "${editDescTarget?.name ?? ""}" — يساعد فريقك على معرفة وظيفة البوت بسرعة.`
              : `Description shown on the "${editDescTarget?.name ?? ""}" bot card — helps your team understand what the bot does at a glance.`}
          </div>
          <textarea
            value={editDescDraft}
            onChange={(e) => setEditDescDraft(e.target.value)}
            placeholder={isAr ? "وصف مختصر لوظيفة البوت..." : "Brief description of what this bot does..."}
            rows={5}
            maxLength={1000}
            autoFocus
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${C.brd}`, background: C.inp, color: C.txt,
              fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", resize: "vertical",
            }}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: C.t3, textAlign: isAr ? "left" : "right" }}>
            {editDescDraft.length} / 1000
          </div>
        </div>
      </Modal>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={isAr ? "\u0625\u0646\u0634\u0627\u0621 \u062a\u062f\u0641\u0642 \u062c\u062f\u064a\u062f" : "Create New Flow"}
        wide
        submitLabel={isAr ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u062f\u0641\u0642" : "Create Flow"}
        onSubmit={async () => {
          if (!newBot.name.trim()) { showToast(isAr ? "\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0633\u0645 \u0627\u0644\u0628\u0648\u062a" : "Please enter bot name"); return; }
          if (!newBot.trigger.trim()) { showToast(isAr ? "\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0643\u0644\u0645\u0627\u062a \u0627\u0644\u0645\u062d\u0641\u0651\u0632\u0629" : "Please enter trigger keywords"); return; }
          try {
            await api.post("/bots", {
              name: newBot.name,
              description: newBot.description,
              trigger: newBot.trigger,
              aiEnabled: newBot.aiEnabled,
              startNode: newBot.startNode,
              cooldownHours: newBot.cooldownHours,
            });
            mutate();
            showToast(isAr ? "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u062f\u0641\u0642 \u0628\u0646\u062c\u0627\u062d \u2713" : "Flow created \u2713");
            setShowCreateModal(false);
          } catch (err: any) {
            // Surface the real error instead of swallowing it. Plan-gate
            // failures (bot limit reached) and validation errors both
            // come back here \u2014 the user needs to know which one.
            const msg = err?.response?.data?.message
              || err?.response?.data?.error
              || (isAr ? "\u062a\u0639\u0630\u0651\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0628\u0648\u062a" : "Failed to create bot");
            showToast(msg);
            // Keep the modal open so the user can fix the input.
          }
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: 24 }}>
          {/* Left: Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Bot Name */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "\u0627\u0633\u0645 \u0627\u0644\u0628\u0648\u062a" : "Bot Name"} *
              </label>
              <input
                value={newBot.name}
                onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                placeholder={isAr ? "\u0645\u062b\u0627\u0644: \u0628\u0648\u062a \u062a\u0631\u062d\u064a\u0628 \u0627\u0644\u0639\u0645\u0644\u0627\u0621" : "e.g. Customer Welcome Bot"}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "\u0627\u0644\u0648\u0635\u0641" : "Description"}
              </label>
              <textarea
                value={newBot.description}
                onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
                placeholder={isAr ? "\u0648\u0635\u0641 \u0645\u062e\u062a\u0635\u0631 \u0644\u0648\u0638\u064a\u0641\u0629 \u0627\u0644\u0628\u0648\u062a..." : "Brief description of what this bot does..."}
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", resize: "vertical" }}
              />
            </div>

            {/* Trigger Keywords */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "\u0627\u0644\u0643\u0644\u0645\u0627\u062a \u0627\u0644\u0645\u062d\u0641\u0651\u0632\u0629" : "Trigger Keywords"} * <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>({isAr ? "\u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0627\u0635\u0644\u0629" : "comma separated"})</span>
              </label>
              <input
                value={newBot.trigger}
                onChange={(e) => setNewBot({ ...newBot, trigger: e.target.value })}
                placeholder={isAr ? "\u0645\u062b\u0627\u0644: \u0645\u0631\u062d\u0628\u0627, \u0627\u0644\u0633\u0644\u0627\u0645, \u0647\u0644\u0627" : "e.g. hello, hi, hey"}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
              />
              {newBot.trigger && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {newBot.trigger.split(",").map((kw, i) => {
                    const trimmed = kw.trim();
                    if (!trimmed) return null;
                    return <Badge key={i} color={COLORS.ai}>{trimmed}</Badge>;
                  })}
                </div>
              )}
            </div>

            {/* AI Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: `${COLORS.ai}10`, border: `1px solid ${COLORS.ai}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.ai}20`, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.ai }}>
                  <Icon name="brain" size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>{isAr ? "\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a" : "Enable AI"}</div>
                  <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2 }}>{isAr ? "\u0627\u0644\u0628\u0648\u062a \u064a\u0633\u062a\u062e\u062f\u0645 AI \u0644\u0644\u0631\u062f\u0648\u062f \u0627\u0644\u0630\u0643\u064a\u0629" : "Bot uses AI for smart responses"}</div>
                </div>
              </div>
              <Toggle on={newBot.aiEnabled} onToggle={() => setNewBot({ ...newBot, aiEnabled: !newBot.aiEnabled })} />
            </div>

            {/* Cooldown — protects WABA quality rating from spam */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: `${COLORS.warn}10`, border: `1px solid ${COLORS.warn}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.warn}20`, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.warn }}>
                  <Icon name="timer" size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.txt }}>{isAr ? "فترة الانتظار بين الردود" : "Cooldown between replies"}</div>
                  <div style={{ fontSize: 11.5, color: C.t2, marginTop: 2, lineHeight: 1.5 }}>
                    {isAr
                      ? "البوت لن يردّ على نفس العميل أكثر من مرة خلال هذه الفترة. 0 = يردّ على كل رسالة (يحمي تقييم الواتساب)"
                      : "Bot will not re-reply to the same contact within this window. 0 = reply every time (protects WABA quality rating)"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={newBot.cooldownHours}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(72, Number(e.target.value) || 0));
                    setNewBot({ ...newBot, cooldownHours: v });
                  }}
                  style={{
                    width: 60,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${C.brd}`,
                    background: C.inp,
                    color: C.txt,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                    fontFamily: FONT_FAMILY,
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: 12, color: C.t2 }}>{isAr ? "ساعة" : "hours"}</span>
              </div>
            </div>

            {/* Start Node Type */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>
                {isAr ? "\u0639\u0642\u062f\u0629 \u0627\u0644\u0628\u062f\u0627\u064a\u0629" : "Start Node"}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { key: "welcome", label: isAr ? "\u0631\u0633\u0627\u0644\u0629 \u062a\u0631\u062d\u064a\u0628" : "Welcome Message", icon: "msg", color: COLORS.pri },
                  { key: "buttons", label: isAr ? "\u0642\u0627\u0626\u0645\u0629 \u062e\u064a\u0627\u0631\u0627\u062a" : "Options Menu", icon: "list", color: COLORS.info },
                  { key: "ai", label: isAr ? "\u0645\u062d\u0627\u062f\u062b\u0629 AI" : "AI Chat", icon: "brain", color: COLORS.ai },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setNewBot({ ...newBot, startNode: opt.key })}
                    style={{
                      padding: "14px 10px", borderRadius: 12, cursor: "pointer", fontFamily: FONT_FAMILY, textAlign: "center",
                      border: `2px solid ${newBot.startNode === opt.key ? opt.color : C.brd}`,
                      background: newBot.startNode === opt.key ? `${opt.color}10` : "transparent",
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${opt.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: opt.color }}>
                      <Icon name={opt.icon} size={16} />
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: newBot.startNode === opt.key ? opt.color : C.t2 }}>{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Flow Preview */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 12 }}>
              {isAr ? "\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u062a\u062f\u0641\u0642" : "Flow Preview"}
            </div>
            <Card style={{ padding: 20 }}>
              {/* Mini flow visualization */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                {/* Trigger node */}
                <div style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: `#6366F118`, border: `1.5px solid #6366F1`, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#6366F1", fontWeight: 600, marginBottom: 2 }}>{isAr ? "\u0645\u064f\u062d\u0641\u0651\u0632" : "Trigger"}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.txt }}>{newBot.trigger || (isAr ? "\u0643\u0644\u0645\u0627\u062a..." : "keywords...")}</div>
                </div>
                <div style={{ width: 2, height: 20, background: C.brd }} />

                {/* Start node */}
                <div style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10, textAlign: "center",
                  background: newBot.startNode === "welcome" ? `${COLORS.pri}18` : newBot.startNode === "buttons" ? `${COLORS.info}18` : `${COLORS.ai}18`,
                  border: `1.5px solid ${newBot.startNode === "welcome" ? COLORS.pri : newBot.startNode === "buttons" ? COLORS.info : COLORS.ai}`,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 2, color: newBot.startNode === "welcome" ? COLORS.pri : newBot.startNode === "buttons" ? COLORS.info : COLORS.ai }}>
                    {newBot.startNode === "welcome" ? (isAr ? "\u0631\u0633\u0627\u0644\u0629" : "Message") : newBot.startNode === "buttons" ? (isAr ? "\u0623\u0632\u0631\u0627\u0631" : "Buttons") : "AI"}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.txt }}>
                    {newBot.startNode === "welcome" ? (isAr ? "\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643! \uD83D\uDC4B" : "Welcome! \uD83D\uDC4B") : newBot.startNode === "buttons" ? (isAr ? "\u0627\u062e\u062a\u0631 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629" : "Choose option") : (isAr ? "\u0648\u0643\u064a\u0644 AI" : "AI Agent")}
                  </div>
                </div>
                <div style={{ width: 2, height: 20, background: C.brd }} />

                {/* More nodes placeholder */}
                <div style={{ width: "100%", padding: "12px", borderRadius: 10, border: `2px dashed ${C.brd}`, textAlign: "center", color: C.t3, fontSize: 12 }}>
                  {isAr ? "\u0623\u0636\u0641 \u0639\u0642\u062f \u0628\u0639\u062f \u0627\u0644\u0625\u0646\u0634\u0627\u0621..." : "Add nodes after creation..."}
                </div>
                <div style={{ width: 2, height: 20, background: C.brd }} />

                {/* End node */}
                <div style={{ width: "100%", padding: "8px 12px", borderRadius: 10, background: `${C.t3}18`, border: `1.5px solid ${C.t3}`, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>{isAr ? "\u0646\u0647\u0627\u064a\u0629" : "End"}</div>
                </div>
              </div>

              {/* Summary */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.brd}`, fontSize: 12, color: C.t2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>{isAr ? "\u0627\u0644\u0639\u0642\u062f:" : "Nodes:"}</span>
                  <span style={{ fontWeight: 600, color: C.txt }}>3</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span>AI:</span>
                  <span style={{ fontWeight: 600, color: newBot.aiEnabled ? COLORS.ok : C.t3 }}>{newBot.aiEnabled ? (isAr ? "\u0645\u0641\u0639\u0651\u0644" : "Enabled") : (isAr ? "\u0645\u0639\u0637\u0651\u0644" : "Disabled")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{isAr ? "\u0627\u0644\u062d\u0627\u0644\u0629:" : "Status:"}</span>
                  <Badge color={COLORS.warn}>{isAr ? "\u0645\u0633\u0648\u062f\u0629" : "Draft"}</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Config Field Helper                                                */
/* ------------------------------------------------------------------ */
function ConfigField({
  label,
  value,
  C,
}: {
  label: string;
  value: string;
  C: ThemeColors;
}) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12.5, padding: "7px 10px", borderRadius: 8, background: C.inp, wordBreak: "break-word" }}>
        {value}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bot Media Uploader                                                 */
/*                                                                     */
/*  Lets the operator attach an image/video/document to a message      */
/*  node. Uploads through the existing /api/templates/upload-header-   */
/*  media endpoint (same OSS pipeline used for template headers — no   */
/*  reason to maintain a parallel one). The returned disk+path are     */
/*  stored on the node config so the backend can mint a fresh signed   */
/*  URL at send time, which means a flow that's been sitting in the   */
/*  canvas for weeks doesn't ship Meta a stale URL.                    */
/* ------------------------------------------------------------------ */
type BotMediaShape = {
  type?: "image" | "video" | "document";
  url?: string;
  disk?: string;
  path?: string;
  filename?: string;
  mime?: string;
};

const ALLOWED_MIME_BY_TYPE: Record<string, string[]> = {
  image: ["image/jpeg", "image/png"],
  video: ["video/mp4", "video/3gpp"],
  document: ["application/pdf"],
};

const MAX_BYTES_BY_TYPE: Record<string, number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  document: 100 * 1024 * 1024,
};

function detectFormatFromMime(mime: string): "image" | "video" | "document" | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  return null;
}

function BotMediaUploader({
  node,
  C,
  isAr,
  onChange,
}: {
  node: FlowNode;
  C: ThemeColors;
  isAr: boolean;
  onChange: (media: BotMediaShape | null) => void;
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // Two shapes are tolerated for backwards compat:
  //   - new: config.media = { type, url, disk, path, filename, mime }
  //   - legacy: config.imageUrl = "https://..."
  // The legacy form is shown read-only — saving a new file replaces it.
  const media: BotMediaShape | null = (() => {
    if (node.config?.media && typeof node.config.media === "object") {
      return node.config.media as BotMediaShape;
    }
    if (node.config?.imageUrl && typeof node.config.imageUrl === "string") {
      return { type: "image", url: node.config.imageUrl as string };
    }
    return null;
  })();

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const format = detectFormatFromMime(file.type);
    if (!format) {
      showToast(isAr ? "نوع الملف غير مدعوم. ادعم: صورة JPG/PNG، فيديو MP4، أو PDF." : "Unsupported file type. Use JPG/PNG image, MP4 video, or PDF.");
      e.target.value = "";
      return;
    }

    if ((ALLOWED_MIME_BY_TYPE[format] ?? []).indexOf(file.type) === -1) {
      showToast(isAr ? `نوع الملف (${file.type}) غير مقبول.` : `File type (${file.type}) not accepted.`);
      e.target.value = "";
      return;
    }

    if (file.size > (MAX_BYTES_BY_TYPE[format] ?? 0)) {
      const maxMb = Math.round(MAX_BYTES_BY_TYPE[format] / 1024 / 1024);
      showToast(isAr ? `حجم الملف يتجاوز الحد المسموح (${maxMb} ميجا).` : `File exceeds size limit (${maxMb}MB).`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("format", format);
      fd.append("file", file);

      // Reuse the template-header upload endpoint — same OSS pipeline,
      // same validation, same signed-URL story.
      const res = await api.post("/templates/upload-header-media", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data?.data ?? res.data ?? {};

      const next: BotMediaShape = {
        type: format,
        url: data.media_url ?? data.url ?? "",
        disk: data.media_disk ?? "",
        path: data.media_path ?? "",
        filename: file.name,
        mime: file.type,
      };

      onChange(next);
      showToast(isAr ? "تم رفع المرفق ✓" : "Media uploaded ✓");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message || (isAr ? "فشل رفع الملف" : "Upload failed");
      showToast(msg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const typeIcon = media?.type === "image" ? "image" : media?.type === "video" ? "video" : "clip";
  const typeLabel = media?.type === "image"
    ? (isAr ? "صورة" : "Image")
    : media?.type === "video"
      ? (isAr ? "فيديو" : "Video")
      : (isAr ? "مستند" : "Document");

  return (
    <div>
      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
        {isAr ? "مرفق (اختياري)" : "Attachment (optional)"}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/jpeg,image/png,video/mp4,video/3gpp,application/pdf"
        style={{ display: "none" }}
      />

      {! media && (
        <button
          type="button"
          onClick={handlePickFile}
          disabled={uploading}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1.5px dashed ${C.brd}`,
            background: "transparent",
            color: C.t2,
            fontSize: 12,
            fontFamily: FONT_FAMILY,
            cursor: uploading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {uploading
            ? (isAr ? "جاري الرفع..." : "Uploading...")
            : (
              <>
                <Icon name="clip" size={14} />
                <span>{isAr ? "رفع صورة / فيديو / PDF" : "Upload image / video / PDF"}</span>
              </>
            )}
        </button>
      )}

      {media && (
        <div
          style={{
            border: `1px solid ${C.brd}`,
            borderRadius: 8,
            padding: 10,
            background: C.inp,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name={typeIcon} size={22} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {media.filename || (isAr ? "ملف مرفق" : "Attached file")}
              </div>
              <div style={{ fontSize: 11, color: C.t3 }}>
                {typeLabel}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              title={isAr ? "حذف" : "Remove"}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "none",
                background: COLORS.err + "22",
                color: COLORS.err,
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {media.type === "image" && media.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.url}
              alt={media.filename || "preview"}
              style={{
                maxWidth: "100%",
                maxHeight: 140,
                borderRadius: 6,
                objectFit: "contain",
                background: "#0001",
              }}
            />
          )}

          <button
            type="button"
            onClick={handlePickFile}
            disabled={uploading}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px solid ${C.brd}`,
              background: "transparent",
              color: C.t2,
              fontSize: 11,
              fontFamily: FONT_FAMILY,
              cursor: uploading ? "wait" : "pointer",
            }}
          >
            {uploading
              ? (isAr ? "جاري الرفع..." : "Uploading...")
              : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon name="refresh" size={12} />
                  <span>{isAr ? "استبدال" : "Replace"}</span>
                </span>
              )}
          </button>
        </div>
      )}

      <div style={{ fontSize: 10.5, color: C.t3, marginTop: 6, lineHeight: 1.6 }}>
        {isAr
          ? "يُرسل المرفق كرسالة واتساب منفصلة بعد النص. الحدود: صورة 5MB، فيديو 16MB، PDF 100MB."
          : "Attachment is sent as a separate WhatsApp message after the text. Limits: image 5MB, video 16MB, PDF 100MB."}
      </div>
    </div>
  );
}
