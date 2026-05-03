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
import { useBots } from "@/lib/api/hooks";
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
  ai: "#8B5CF6",
  end: "#6B7280",
  input: "#EC4899",
  transfer: "#10B981",
  api: "#E8713A",
};

const ADD_NODE_TYPES = [
  { type: "message", label: "Message", labelAr: "\u0631\u0633\u0627\u0644\u0629" },
  { type: "buttons", label: "Buttons", labelAr: "\u0623\u0632\u0631\u0627\u0631" },
  { type: "condition", label: "Condition", labelAr: "\u0634\u0631\u0637" },
  { type: "ai", label: "AI", labelAr: "\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A" },
  { type: "input", label: "Input", labelAr: "\u0625\u062F\u062E\u0627\u0644" },
  { type: "transfer", label: "Transfer", labelAr: "\u062A\u062D\u0648\u064A\u0644" },
  { type: "api", label: "API", labelAr: "API" },
  { type: "end", label: "End", labelAr: "\u0646\u0647\u0627\u064A\u0629" },
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
  const [newBot, setNewBot] = useState({ name: "", description: "", trigger: "", aiEnabled: true, startNode: "welcome" });
  const [deleteTarget, setDeleteTarget] = useState<Bot | null>(null);
  const [deletingBot, setDeletingBot] = useState(false);

  /* ---- Flow editor state ---- */
  const [flow, setFlow] = useState<FlowNode[]>([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [savingFlow, setSavingFlow] = useState(false);
  const [showAddNodeDropdown, setShowAddNodeDropdown] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);

  const selectedBot = useMemo(
    () => (selectedBotId !== null ? bots.find((b) => b.id === selectedBotId) ?? null : null),
    [bots, selectedBotId],
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? flow.find((n) => n.id === selectedNodeId) ?? null : null),
    [flow, selectedNodeId],
  );

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

  /* ---------- Handlers ---------- */
  const handleCreateFlow = useCallback(() => {
    setNewBot({ name: "", description: "", trigger: "", aiEnabled: true, startNode: "welcome" });
    setShowCreateModal(true);
  }, []);

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
      if (node.type === "ai" && node.config.model) return String(node.config.model);
      if (node.type === "transfer" && node.config.team) return String(node.config.team);
      if (node.type === "api" && node.config.url) return String(node.config.url);
      return "";
    };

    const nodeColor = (type: string) => NODE_COLORS[type] ?? C.t3;

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
            </div>
            <p style={{ marginTop: 4, marginBottom: 0, fontSize: 13, color: C.t2 }}>{selectedBot.desc}</p>
          </div>
          {/* Save + Add buttons */}
          <div style={{ display: "flex", gap: 8, position: "relative" }}>
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
                  {ADD_NODE_TYPES.map((nt) => (
                    <button
                      key={nt.type}
                      onClick={() => handleAddNode(nt.type)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "9px 12px",
                        border: "none",
                        borderRadius: 8,
                        background: "transparent",
                        cursor: "pointer",
                        fontFamily: FONT_FAMILY,
                        fontSize: 13,
                        color: C.txt,
                        textAlign: isAr ? "right" : "left",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${NODE_COLORS[nt.type]}15`; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 16 }}>{NODE_ICONS[nt.type]}</span>
                      <span style={{ fontWeight: 500 }}>{isAr ? nt.labelAr : nt.label}</span>
                      <span style={{ marginLeft: "auto", fontSize: 10, color: NODE_COLORS[nt.type], fontWeight: 600, textTransform: "uppercase" }}>{nt.type}</span>
                    </button>
                  ))}
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
                          \u00D7
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

                      {/* Type badge */}
                      <div style={{
                        display: "inline-flex",
                        alignSelf: "flex-start",
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
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0631\u0627\u0628\u0637 \u0627\u0644\u0635\u0648\u0631\u0629" : "Image URL"} <span style={{ fontWeight: 400, color: C.t3 }}>({isAr ? "\u0627\u062E\u062A\u064A\u0627\u0631\u064A" : "optional"})</span>
                      </div>
                      <input
                        value={String(selectedNode.config.imageUrl ?? "")}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { imageUrl: e.target.value })}
                        placeholder="https://..."
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
                  </>
                )}

                {/* Buttons: editable button list */}
                {selectedNode.type === "buttons" && (
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
                            \u00D7
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
                )}

                {/* Condition: expression */}
                {selectedNode.type === "condition" && (
                  <div>
                    <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                      {isAr ? "\u0627\u0644\u0634\u0631\u0637" : "Condition Expression"}
                    </div>
                    <textarea
                      value={String(selectedNode.config.expression ?? "")}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { expression: e.target.value })}
                      rows={2}
                      placeholder={isAr ? "\u0627\u0643\u062A\u0628 \u0627\u0644\u0634\u0631\u0637..." : "e.g. user.plan === 'premium'"}
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
                      }}
                    />
                  </div>
                )}

                {/* AI: model selector + prompt */}
                {selectedNode.type === "ai" && (
                  <>
                    <div>
                      <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                        {isAr ? "\u0646\u0645\u0648\u0630\u062C AI" : "AI Model"}
                      </div>
                      <select
                        value={String(selectedNode.config.model ?? "gpt-4")}
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
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5">GPT-3.5 Turbo</option>
                        <option value="claude-3">Claude 3</option>
                        <option value="gemini">Gemini Pro</option>
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
                  </>
                )}

                {/* Input: variable name */}
                {selectedNode.type === "input" && (
                  <div>
                    <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                      {isAr ? "\u0627\u0644\u0645\u062a\u063a\u064a\u0631" : "Variable Name"}
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
                  </div>
                )}

                {/* Transfer: team */}
                {selectedNode.type === "transfer" && (
                  <div>
                    <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>
                      {isAr ? "\u0627\u0644\u0641\u0631\u064a\u0642" : "Team"}
                    </div>
                    <input
                      value={String(selectedNode.config.team ?? "")}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { team: e.target.value })}
                      placeholder={isAr ? "\u0627\u0633\u0645 \u0627\u0644\u0641\u0631\u064A\u0642" : "Team name"}
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
                )}

                {/* API: url */}
                {selectedNode.type === "api" && (
                  <div>
                    <div style={{ fontSize: 11, color: C.t2, marginBottom: 4, fontWeight: 600 }}>URL</div>
                    <input
                      value={String(selectedNode.config.url ?? "")}
                      onChange={(e) => updateNodeConfig(selectedNode.id, { url: e.target.value })}
                      placeholder="https://api.example.com/..."
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
                  </div>
                )}

                {/* Connections */}
                <div>
                  <div style={{ fontSize: 11, color: C.t2, marginBottom: 6, fontWeight: 600 }}>
                    {isAr ? "\u0645\u062a\u0635\u0644 \u0628\u0640" : "Connected to"}
                  </div>
                  {selectedNode.next.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {selectedNode.next.map((nid) => {
                        const target = flow.find((n) => n.id === nid);
                        return (
                          <Badge key={nid} color={target ? nodeColor(target.type) : C.info}>
                            {target?.label ?? nid}
                          </Badge>
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
        <Button primary onClick={handleCreateFlow}>
          <Icon name="zap" size={14} />
          {isAr ? "\u0625\u0646\u0634\u0627\u0621 \u062a\u062f\u0641\u0642" : "Create Flow"}
        </Button>
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

              {/* Description */}
              <p style={{ marginBottom: 12, marginTop: 0, fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>
                {bot.desc}
              </p>

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
        const published = filteredBots.filter((b: any) => b.status === "published" || b.is_active);
        const drafts = filteredBots.filter((b: any) => b.status === "draft");
        // Top performer by conversations served.
        const sortedByConvos = [...filteredBots].sort((a: any, b: any) => (b.conversations || 0) - (a.conversations || 0));
        const top = sortedByConvos[0];
        const cards: AiInsightCard[] = [];
        if (top && top.conversations > 0) {
          cards.push({
            icon: "🏆",
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
            icon: "📝",
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
            icon: "💡",
            title: isAr ? "اقتراح" : "Suggestion",
            caption: isAr
              ? "لا يوجد بوت نشط حالياً — الذكاء الاصطناعي يجاوب بدلاً منهم. فعّل بوت لتقليل التكلفة."
              : "No active bots yet — AI handles fallback. Publishing a bot reduces AI cost.",
            cta: isAr ? "انشر أوّل بوت" : "Publish first bot",
            tone: "pri",
          });
        } else {
          cards.push({
            icon: "🚀",
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

      {/* ── Delete Bot Confirmation Modal ── */}
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
