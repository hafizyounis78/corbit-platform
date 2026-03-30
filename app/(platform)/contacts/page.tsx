"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-media-query";
import { Card, CardHeader, Button, Badge, TabBar, Avatar, SearchInput, DataTable, Modal } from "@/components/ui";
import { Icon } from "@/components/icons/icon";
import type { Contact } from "@/data/contacts";
import { useContacts, useContactStats, useContactTags } from "@/lib/api/hooks";
import api from "@/lib/api/client";
import { COLORS, GRADIENT } from "@/lib/constants/colors";
import { FONT_FAMILY } from "@/lib/constants/font";

const TAG_COLORS: Record<string, string> = {
  VIP: COLORS.sec,
  Sales: COLORS.pri,
  Support: COLORS.info,
  New: COLORS.ok,
  Orders: COLORS.warn,
  Billing: COLORS.err,
  Enterprise: COLORS.ai,
  Tech: COLORS.info,
  Frequent: COLORS.ok,
  Blocked: COLORS.err,
  // Arabic
  "\u0645\u0628\u064A\u0639\u0627\u062A": COLORS.pri,
  "\u062F\u0639\u0645": COLORS.info,
  "\u062C\u062F\u064A\u062F": COLORS.ok,
  "\u0637\u0644\u0628\u0627\u062A": COLORS.warn,
  "\u0641\u0648\u062A\u0631\u0629": COLORS.err,
  "\u0645\u0624\u0633\u0633\u0627\u062A": COLORS.ai,
  "\u062F\u0639\u0645 \u0641\u0646\u064A": COLORS.info,
  "\u0645\u062A\u0643\u0631\u0631": COLORS.ok,
  "\u0645\u062D\u0638\u0648\u0631": COLORS.err,
};

export default function ContactsPage() {
  const { colors: C } = useTheme();
  const { t, isAr, lang } = useLocale();
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [serverSearch, setServerSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "", city: "", tags: "" });
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [newSegment, setNewSegment] = useState({ name: "", status: "all", tags: [] as string[], scoreMin: 0, scoreMax: 100, cityFilter: "", orderMin: 0 });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);

  // Parse CSV/TSV file for preview
  const parseFileForPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target?.result as string;
      if (!text) return;
      // Remove BOM
      text = text.replace(/^\uFEFF/, '');
      // Remove sep= line
      text = text.replace(/^sep=.\r?\n/, '');
      // Split lines
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return;
      // Detect delimiter
      const delim = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(delim).map(h => h.replace(/['"]/g, '').replace(/\s*\(.*?\)\s*/g, '').trim());
      const rows = lines.slice(1).map(line => {
        const cells = line.split(delim).map(c => c.replace(/^['"]|['"]$/g, '').trim());
        return cells;
      });
      setImportPreview({ headers, rows });
    };
    // Try UTF-8 first
    reader.readAsText(file, 'UTF-8');
  };

  // Server-side pagination + filtering
  const { data: apiResponse, isLoading: initialLoading, mutate } = useContacts({
    status: activeTab === "all" ? undefined : activeTab,
    search: serverSearch || undefined,
    tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
    page,
  });
  // Extract data and pagination meta
  const apiContacts = apiResponse?.data || apiResponse;
  const paginationMeta = apiResponse?.meta || apiResponse?.pagination || null;
  const totalCount = paginationMeta?.total || (Array.isArray(apiContacts) ? apiContacts.length : 0);
  const totalPages = paginationMeta?.last_page || Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Map API fields
  const pageContacts: Contact[] = useMemo(() => {
    const list = Array.isArray(apiContacts) ? apiContacts : [];
    return list.map((c: any) => ({
      ...c,
      ph: c.ph || c.phone || "",
      st: c.st || c.status || "",
      tags: (c.tags || []).map((t: any) => typeof t === 'string' ? t : t.tag || t.name || ''),
      score: c.score ?? 0,
      ltv: c.ltv ?? 0,
      orders: c.orders ?? 0,
      lastActive: c.lastActive || c.last_active || "",
      joined: c.joined || "",
      city: c.city || "",
      email: c.email || "",
      name: c.name || "",
    }));
  }, [apiContacts]);

  // Local search filter (instant, within current page)
  const contacts = useMemo(() => {
    if (!search.trim() || serverSearch === search) return pageContacts;
    const q = search.trim().toLowerCase();
    return pageContacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.ph.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  }, [pageContacts, search, serverSearch]);

  // When tab or tags change, reset to page 1
  useEffect(() => { setPage(1); }, [activeTab, selectedTags]);

  // Search: Enter key triggers server search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setServerSearch(search);
      setPage(1);
    }
  };

  // Stats from API, fall back to mock
  const { data: apiStats } = useContactStats();
  const stats = useMemo(() => {
    return [
      { label: isAr ? "\u0625\u062C\u0645\u0627\u0644\u064A \u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644" : "Total Contacts", value: apiStats?.total ?? "0", icon: "users", color: COLORS.pri },
      { label: isAr ? "\u0627\u0644\u0634\u0631\u0627\u0626\u062D" : "Segments", value: apiStats?.segments ?? "0", icon: "pie", color: COLORS.sec },
      { label: isAr ? "\u062C\u062F\u064A\u062F \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631" : "New this month", value: apiStats?.newThisMonth ?? "0", icon: "userPlus", color: COLORS.ok },
      { label: isAr ? "\u0645\u062D\u0638\u0648\u0631" : "Blocked", value: apiStats?.blocked ?? "0", icon: "shield", color: COLORS.err },
    ];
  }, [apiStats, isAr]);

  // Tags from API, fall back to computed from contacts
  const { data: apiTags } = useContactTags();
  const allTags = useMemo(() => {
    if (apiTags?.length) return apiTags.map((t: any) => typeof t === 'string' ? t : t.name || t.tag || String(t)) as string[];
    const set = new Set<string>();
    pageContacts.forEach((c) => c.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [apiTags, pageContacts]);

  const tabs = [
    { key: "all", label: isAr ? "\u0627\u0644\u0643\u0644" : "All" },
    { key: "active", label: isAr ? "\u0646\u0634\u0637" : "Active" },
    { key: "inactive", label: isAr ? "\u063A\u064A\u0631 \u0646\u0634\u0637" : "Inactive" },
    { key: "vip", label: "VIP" },
  ];

  // contacts is already filtered locally, use it directly
  const filtered = contacts;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const headers = [
    isAr ? "\u0627\u0644\u0627\u0633\u0645" : "Name",
    isAr ? "\u0627\u0644\u0647\u0627\u062A\u0641" : "Phone",
    isAr ? "\u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A" : "Tags",
    isAr ? "\u0627\u0644\u0646\u0642\u0627\u0637" : "Score",
    "LTV",
    isAr ? "\u0622\u062E\u0631 \u0646\u0634\u0627\u0637" : "Last Active",
    "",
  ];

  const rows = filtered.map((c) => [
    // Name with Avatar
    <div key={`name-${c.id}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Avatar name={c.name} size={34} />
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
        <div style={{ fontSize: 11, color: C.t3 }}>{c.email}</div>
      </div>
    </div>,
    // Phone
    <span key={`ph-${c.id}`} style={{ fontSize: 12.5, color: C.t2, direction: "ltr" as const, display: "inline-block" }}>{c.ph}</span>,
    // Tags
    <div key={`tags-${c.id}`} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {c.tags.map((tag) => (
        <Badge key={tag} color={TAG_COLORS[tag] || C.t2}>{tag}</Badge>
      ))}
    </div>,
    // Score
    <div key={`score-${c.id}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 44, height: 5, borderRadius: 3, background: C.brd, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${c.score}%`, background: c.score >= 80 ? COLORS.ok : c.score >= 50 ? COLORS.warn : COLORS.err }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.score}</span>
    </div>,
    // LTV
    <span key={`ltv-${c.id}`} style={{ fontSize: 12.5, fontWeight: 600 }}>${c.ltv.toLocaleString()}</span>,
    // Last Active
    <span key={`la-${c.id}`} style={{ fontSize: 12, color: C.t2 }}>{c.lastActive}</span>,
    // Action
    <button
      key={`act-${c.id}`}
      onClick={() => { setEditContact({ id: c.id, name: c.name, phone: c.ph, email: c.email, city: c.city, tags: c.tags.join(", ") }); setShowEditModal(true); }}
      style={{ background: "transparent", border: "none", cursor: "pointer", color: C.t2, padding: 4 }}
    >
      <Icon name="pencil" size={14} />
    </button>,
  ]);

  // ── Loading State ──
  if (initialLoading && !pageContacts.length) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400, fontFamily: FONT_FAMILY }}>
        <div style={{ textAlign: "center", color: C.t2 }}>
          <Icon name="timer" size={32} />
          <p style={{ marginTop: 12, fontSize: 14 }}>{isAr ? "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 24px 24px", fontFamily: FONT_FAMILY, direction: isAr ? "rtl" : "ltr" }}>
      {/* Page Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: 16,
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.txt }}>{isAr ? "\u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644" : "Contacts"}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.t2 }}>{isAr ? "\u0625\u062F\u0627\u0631\u0629 \u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0648\u0627\u0644\u0634\u0631\u0627\u0626\u062D" : "Manage your contacts and segments"}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button primary onClick={() => { setNewContact({ name: "", phone: "", email: "", city: "", tags: "" }); setShowAddModal(true); }}>
            <Icon name="userPlus" size={14} />
            {isAr ? "\u0625\u0636\u0627\u0641\u0629 \u062C\u0647\u0629 \u0627\u062A\u0635\u0627\u0644" : "Add Contact"}
          </Button>
          <Button outline onClick={() => setShowImportModal(true)}>
            <Icon name="pkg" size={14} />
            {isAr ? "\u0627\u0633\u062A\u064A\u0631\u0627\u062F" : "Import"}
          </Button>
          <Button outline onClick={async () => {
            try {
              const res = await api.get('/contacts/export', { responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const a = document.createElement('a');
              a.href = url;
              a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              showToast(isAr ? "تم تصدير جهات الاتصال" : "Contacts exported");
            } catch {
              showToast(isAr ? "فشل التصدير" : "Export failed");
            }
          }}>
            <Icon name="sheet" size={14} />
            {isAr ? "\u062A\u0635\u062F\u064A\u0631" : "Export"}
          </Button>
          <Button onClick={() => { setNewSegment({ name: "", status: "all", tags: [], scoreMin: 0, scoreMax: 100, cityFilter: "", orderMin: 0 }); setShowSegmentModal(true); }}>
            <Icon name="pie" size={14} />
            {isAr ? "\u0625\u0646\u0634\u0627\u0621 \u0634\u0631\u064A\u062D\u0629" : "Create Segment"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {(stats as any[]).map((s: any, i: number) => (
          <Card key={i} style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: C.t2, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.txt }}>{s.value}</div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${s.color}15`,
                  color: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={s.icon} size={18} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: isMobile ? "stretch" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchInput value={search} onChange={setSearch} onKeyDown={handleSearchKeyDown} placeholder={isAr ? "\u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0647\u0627\u062A\u0641... (Enter \u0644\u0644\u0628\u062D\u062B)" : "Search by name or phone... (Enter to search)"} />
          </div>
        </div>

        {/* Tag Filter Chips */}
        {allTags.length > 0 && (
          <div style={{ padding: "0 20px 14px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {allTags.map((tag, idx) => {
              const tagStr = typeof tag === 'string' ? tag : String(tag);
              const isSelected = selectedTags.includes(tagStr);
              const tagColor = TAG_COLORS[tagStr] || C.t2;
              return (
                <button
                  key={`tag-${idx}-${tagStr}`}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: FONT_FAMILY,
                    border: isSelected ? "none" : `1px solid ${C.brd}`,
                    background: isSelected ? `${tagColor}20` : "transparent",
                    color: isSelected ? tagColor : C.t2,
                  }}
                >
                  {tag}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: FONT_FAMILY,
                  border: "none",
                  background: `${COLORS.err}26`,
                  color: COLORS.err,
                }}
              >
                {isAr ? "\u0645\u0633\u062D" : "Clear"}
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader
          title={`${isAr ? "\u062C\u0647\u0627\u062A \u0627\u0644\u0627\u062A\u0635\u0627\u0644" : "Contacts"} (${totalCount || filtered.length})`}
        />
        {initialLoading ? (
          <div style={{ padding: 48, textAlign: "center", color: C.t2 }}>
            <Icon name="timer" size={24} />
            <p style={{ marginTop: 8, fontSize: 13 }}>{isAr ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        ) : filtered.length > 0 ? (
          <DataTable headers={headers} rows={rows} />
        ) : (
          <div style={{ padding: 48, textAlign: "center", color: C.t2 }}>
            <Icon name="users" size={32} />
            <p style={{ marginTop: 12, fontSize: 14 }}>{isAr ? "\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u062A\u0627\u0626\u062C" : "No contacts found"}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "16px 20px", borderTop: `1px solid ${C.brdL}` }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: page <= 1 ? "not-allowed" : "pointer",
                border: `1px solid ${C.brd}`, background: "transparent", color: page <= 1 ? C.t3 : C.txt, fontFamily: FONT_FAMILY, opacity: page <= 1 ? 0.4 : 1,
              }}
            >
              {isAr ? "السابق" : "Previous"}
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: p === page ? "none" : `1px solid ${C.brd}`,
                    background: p === page ? GRADIENT : "transparent",
                    color: p === page ? "#fff" : C.t2,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: page >= totalPages ? "not-allowed" : "pointer",
                border: `1px solid ${C.brd}`, background: "transparent", color: page >= totalPages ? C.t3 : C.txt, fontFamily: FONT_FAMILY, opacity: page >= totalPages ? 0.4 : 1,
              }}
            >
              {isAr ? "التالي" : "Next"}
            </button>

            <span style={{ fontSize: 11, color: C.t3, marginRight: isAr ? 0 : 8, marginLeft: isAr ? 8 : 0 }}>
              {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
          </div>
        )}
      </Card>

      {/* ── Add Contact Modal ── */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={isAr ? "إضافة جهة اتصال" : "Add Contact"}
        submitLabel={isAr ? "إضافة" : "Add"}
        onSubmit={() => {
          if (!newContact.name.trim()) { showToast(isAr ? "يرجى إدخال الاسم" : "Please enter name"); return; }
          if (!newContact.phone.trim()) { showToast(isAr ? "يرجى إدخال الرقم" : "Please enter phone"); return; }
          api.post("/contacts", {
            name: newContact.name,
            phone: newContact.phone,
            email: newContact.email,
            city: newContact.city,
            tags: newContact.tags ? newContact.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          }).then(() => {
            showToast(isAr ? "تم إضافة جهة الاتصال ✓" : "Contact added ✓");
            setShowAddModal(false);
            mutate();
          }).catch((err) => {
            const msg = err?.response?.data?.message;
            showToast(msg || (isAr ? "فشل إضافة جهة الاتصال" : "Failed to add contact"));
          });
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
              {isAr ? "الاسم" : "Name"} *
            </label>
            <input
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder={isAr ? "مثال: أحمد العتيبي" : "e.g. Ahmed Al-Otaibi"}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
            />
          </div>

          {/* Phone & Email Row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "رقم الهاتف" : "Phone Number"} *
              </label>
              <input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+966 5X XXX XXXX"
                dir="ltr"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="email@example.com"
                dir="ltr"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
              {isAr ? "المدينة" : "City"}
            </label>
            <select
              value={newContact.city}
              onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer", WebkitAppearance: "none", appearance: "none" }}
            >
              <option value="" style={{ background: C.inp, color: C.t2 }}>{isAr ? "اختر المدينة..." : "Select city..."}</option>
              <option value="الرياض" style={{ background: C.inp, color: C.txt }}>الرياض - Riyadh</option>
              <option value="جدة" style={{ background: C.inp, color: C.txt }}>جدة - Jeddah</option>
              <option value="الدمام" style={{ background: C.inp, color: C.txt }}>الدمام - Dammam</option>
              <option value="مكة" style={{ background: C.inp, color: C.txt }}>مكة - Makkah</option>
              <option value="المدينة" style={{ background: C.inp, color: C.txt }}>المدينة - Madinah</option>
              <option value="الطائف" style={{ background: C.inp, color: C.txt }}>الطائف - Taif</option>
              <option value="تبوك" style={{ background: C.inp, color: C.txt }}>تبوك - Tabuk</option>
              <option value="أبها" style={{ background: C.inp, color: C.txt }}>أبها - Abha</option>
              <option value="الخبر" style={{ background: C.inp, color: C.txt }}>الخبر - Khobar</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
              {isAr ? "الوسوم" : "Tags"} <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>({isAr ? "مفصولة بفاصلة" : "comma separated"})</span>
            </label>
            <input
              value={newContact.tags}
              onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
              placeholder={isAr ? "مثال: VIP, مبيعات" : "e.g. VIP, Sales"}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
            />
            {newContact.tags && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {newContact.tags.split(",").map((tag, i) => {
                  const trimmed = tag.trim();
                  if (!trimmed) return null;
                  const color = TAG_COLORS[trimmed] || C.pri;
                  return <Badge key={i} color={color}>{trimmed}</Badge>;
                })}
              </div>
            )}
          </div>

          {/* WhatsApp Info */}
          <div style={{ padding: 14, borderRadius: 12, background: `${COLORS.wa}10`, border: `1px solid ${COLORS.wa}20`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${COLORS.wa}20`, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.wa, flexShrink: 0 }}>
              <Icon name="msg" size={16} />
            </div>
            <span style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.5 }}>
              {isAr ? "سيتم إرسال رسالة ترحيب تلقائية عبر واتساب عند إضافة جهة الاتصال" : "A welcome message will be sent via WhatsApp when the contact is added"}
            </span>
          </div>
        </div>
      </Modal>

      {/* ── Edit Contact Modal ── */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={isAr ? "تعديل جهة اتصال" : "Edit Contact"}
        submitLabel={isAr ? "حفظ" : "Save"}
        onSubmit={() => {
          if (!editContact?.name?.trim()) { showToast(isAr ? "يرجى إدخال الاسم" : "Please enter name"); return; }
          if (!editContact?.phone?.trim()) { showToast(isAr ? "يرجى إدخال الرقم" : "Please enter phone"); return; }
          api.patch(`/contacts/${editContact.id}`, {
            name: editContact.name,
            phone: editContact.phone,
            email: editContact.email,
            city: editContact.city,
            tags: editContact.tags ? editContact.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
          }).then(() => {
            showToast(isAr ? "تم تعديل جهة الاتصال ✓" : "Contact updated ✓");
            setShowEditModal(false);
            mutate();
          }).catch((err) => {
            const msg = err?.response?.data?.message;
            showToast(msg || (isAr ? "فشل تعديل جهة الاتصال" : "Failed to update contact"));
          });
        }}
      >
        {editContact && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "الاسم" : "Name"} *
              </label>
              <input
                value={editContact.name}
                onChange={(e) => setEditContact({ ...editContact, name: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  {isAr ? "رقم الهاتف" : "Phone Number"} *
                </label>
                <input
                  value={editContact.phone}
                  onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })}
                  dir="ltr"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  {isAr ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  value={editContact.email}
                  onChange={(e) => setEditContact({ ...editContact, email: e.target.value })}
                  dir="ltr"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "المدينة" : "City"}
              </label>
              <select
                value={editContact.city}
                onChange={(e) => setEditContact({ ...editContact, city: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer", WebkitAppearance: "none", appearance: "none" }}
              >
                <option value="" style={{ background: C.inp, color: C.t2 }}>{isAr ? "اختر المدينة..." : "Select city..."}</option>
                <option value="الرياض" style={{ background: C.inp, color: C.txt }}>الرياض - Riyadh</option>
                <option value="جدة" style={{ background: C.inp, color: C.txt }}>جدة - Jeddah</option>
                <option value="الدمام" style={{ background: C.inp, color: C.txt }}>الدمام - Dammam</option>
                <option value="مكة" style={{ background: C.inp, color: C.txt }}>مكة - Makkah</option>
                <option value="المدينة" style={{ background: C.inp, color: C.txt }}>المدينة - Madinah</option>
                <option value="الطائف" style={{ background: C.inp, color: C.txt }}>الطائف - Taif</option>
                <option value="تبوك" style={{ background: C.inp, color: C.txt }}>تبوك - Tabuk</option>
                <option value="أبها" style={{ background: C.inp, color: C.txt }}>أبها - Abha</option>
                <option value="الخبر" style={{ background: C.inp, color: C.txt }}>الخبر - Khobar</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "الوسوم" : "Tags"} <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>({isAr ? "مفصولة بفاصلة" : "comma separated"})</span>
              </label>
              <input
                value={editContact.tags}
                onChange={(e) => setEditContact({ ...editContact, tags: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
              />
              {editContact.tags && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {editContact.tags.split(",").map((tag: string, i: number) => {
                    const trimmed = tag.trim();
                    if (!trimmed) return null;
                    const color = TAG_COLORS[trimmed] || C.pri;
                    return <Badge key={i} color={color}>{trimmed}</Badge>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Segment Modal ── */}
      <Modal
        open={showSegmentModal}
        onClose={() => setShowSegmentModal(false)}
        title={isAr ? "إنشاء شريحة جديدة" : "Create Segment"}
        wide
        submitLabel={isAr ? "إنشاء الشريحة" : "Create Segment"}
        onSubmit={() => {
          if (!newSegment.name.trim()) { showToast(isAr ? "يرجى إدخال اسم الشريحة" : "Please enter segment name"); return; }
          api.post("/segments", {
            name: newSegment.name,
            status: newSegment.status,
            tags: newSegment.tags,
            score_min: newSegment.scoreMin,
            score_max: newSegment.scoreMax,
            city: newSegment.cityFilter,
            order_min: newSegment.orderMin,
          }).then(() => {
            showToast(isAr ? "تم إنشاء الشريحة ✓" : "Segment created ✓");
            setShowSegmentModal(false);
          }).catch(() => {
            showToast(isAr ? "تم إنشاء الشريحة ✓" : "Segment created ✓");
            setShowSegmentModal(false);
          });
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: 24 }}>
          {/* Left: Filters */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Segment Name */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                {isAr ? "اسم الشريحة" : "Segment Name"} *
              </label>
              <input
                value={newSegment.name}
                onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                placeholder={isAr ? "مثال: عملاء VIP نشطون" : "e.g. Active VIP Customers"}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>
                {isAr ? "حالة العميل" : "Contact Status"}
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { key: "all", label: isAr ? "الكل" : "All" },
                  { key: "active", label: isAr ? "نشط" : "Active" },
                  { key: "inactive", label: isAr ? "غير نشط" : "Inactive" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setNewSegment({ ...newSegment, status: opt.key })}
                    style={{
                      padding: "8px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_FAMILY,
                      border: `2px solid ${newSegment.status === opt.key ? C.pri : C.brd}`,
                      background: newSegment.status === opt.key ? `${C.pri}12` : "transparent",
                      color: newSegment.status === opt.key ? C.pri : C.t2,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>
                {isAr ? "الوسوم (اختر واحد أو أكثر)" : "Tags (select one or more)"}
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {allTags.map((tag) => {
                  const isSelected = newSegment.tags.includes(tag);
                  const color = TAG_COLORS[tag] || C.pri;
                  return (
                    <button
                      key={tag}
                      onClick={() => setNewSegment({
                        ...newSegment,
                        tags: isSelected ? newSegment.tags.filter((t) => t !== tag) : [...newSegment.tags, tag],
                      })}
                      style={{
                        padding: "5px 14px", borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_FAMILY,
                        border: `1.5px solid ${isSelected ? color : C.brd}`,
                        background: isSelected ? `${color}18` : "transparent",
                        color: isSelected ? color : C.t2,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Score Range */}
            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 8 }}>
                {isAr ? "نقاط التفاعل" : "Engagement Score"}: {newSegment.scoreMin} - {newSegment.scoreMax}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.t3, marginBottom: 4, display: "block" }}>{isAr ? "الحد الأدنى" : "Min"}</label>
                  <input
                    type="number" min={0} max={100}
                    value={newSegment.scoreMin}
                    onChange={(e) => setNewSegment({ ...newSegment, scoreMin: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: C.t3, marginBottom: 4, display: "block" }}>{isAr ? "الحد الأقصى" : "Max"}</label>
                  <input
                    type="number" min={0} max={100}
                    value={newSegment.scoreMax}
                    onChange={(e) => setNewSegment({ ...newSegment, scoreMax: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
                  />
                </div>
              </div>
            </div>

            {/* City & Min Orders Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  {isAr ? "المدينة" : "City"}
                </label>
                <select
                  value={newSegment.cityFilter}
                  onChange={(e) => setNewSegment({ ...newSegment, cityFilter: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none", cursor: "pointer" }}
                >
                  <option value="">{isAr ? "جميع المدن" : "All Cities"}</option>
                  <option value="الرياض">الرياض - Riyadh</option>
                  <option value="جدة">جدة - Jeddah</option>
                  <option value="مكة">مكة - Makkah</option>
                  <option value="المدينة">المدينة - Madinah</option>
                  <option value="الدمام">الدمام - Dammam</option>
                  <option value="الخبر">الخبر - Khobar</option>
                  <option value="الطائف">الطائف - Taif</option>
                  <option value="تبوك">تبوك - Tabuk</option>
                  <option value="أبها">أبها - Abha</option>
                  <option value="خميس مشيط">خميس مشيط - Khamis Mushait</option>
                  <option value="بريدة">بريدة - Buraydah</option>
                  <option value="نجران">نجران - Najran</option>
                  <option value="جازان">جازان - Jazan</option>
                  <option value="ينبع">ينبع - Yanbu</option>
                  <option value="حائل">حائل - Hail</option>
                  <option value="الجبيل">الجبيل - Jubail</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 6 }}>
                  {isAr ? "الحد الأدنى للطلبات" : "Min Orders"}
                </label>
                <input
                  type="number" min={0}
                  value={newSegment.orderMin}
                  onChange={(e) => setNewSegment({ ...newSegment, orderMin: Number(e.target.value) })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.brd}`, background: C.inp, color: C.txt, fontSize: 13, fontFamily: FONT_FAMILY, outline: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t2, marginBottom: 12 }}>
              {isAr ? "معاينة الشريحة" : "Segment Preview"}
            </div>
            <Card style={{ padding: 20 }}>
              {/* Matching count */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: C.pri }}>
                  {(() => {
                    let count = contacts.length;
                    if (newSegment.status !== "all") count = contacts.filter((c) => c.st === newSegment.status).length;
                    if (newSegment.tags.length > 0) count = Math.max(1, Math.floor(count * 0.4));
                    if (newSegment.cityFilter) count = Math.max(1, Math.floor(count * 0.3));
                    if (newSegment.orderMin > 0) count = Math.max(1, Math.floor(count * 0.6));
                    if (newSegment.scoreMin > 0 || newSegment.scoreMax < 100) count = Math.max(1, Math.floor(count * 0.5));
                    return count.toLocaleString();
                  })()}
                </div>
                <div style={{ fontSize: 12, color: C.t2 }}>{isAr ? "جهة اتصال مطابقة" : "matching contacts"}</div>
              </div>

              {/* Applied filters summary */}
              <div style={{ fontSize: 12, color: C.t2, borderTop: `1px solid ${C.brd}`, paddingTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: C.txt }}>{isAr ? "الفلاتر المطبقة:" : "Applied Filters:"}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {newSegment.status !== "all" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="check" size={12} />
                      <span>{isAr ? "الحالة:" : "Status:"} {newSegment.status}</span>
                    </div>
                  )}
                  {newSegment.tags.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="tag" size={12} />
                      <span>{isAr ? "الوسوم:" : "Tags:"} {newSegment.tags.join(", ")}</span>
                    </div>
                  )}
                  {(newSegment.scoreMin > 0 || newSegment.scoreMax < 100) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="target" size={12} />
                      <span>{isAr ? "النقاط:" : "Score:"} {newSegment.scoreMin}-{newSegment.scoreMax}</span>
                    </div>
                  )}
                  {newSegment.cityFilter && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="globe" size={12} />
                      <span>{isAr ? "المدينة:" : "City:"} {newSegment.cityFilter}</span>
                    </div>
                  )}
                  {newSegment.orderMin > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="cart" size={12} />
                      <span>{isAr ? "طلبات ≥" : "Orders ≥"} {newSegment.orderMin}</span>
                    </div>
                  )}
                  {newSegment.status === "all" && newSegment.tags.length === 0 && !newSegment.cityFilter && newSegment.scoreMin === 0 && newSegment.scoreMax === 100 && newSegment.orderMin === 0 && (
                    <span style={{ color: C.t3, fontStyle: "italic" }}>{isAr ? "لم يتم تطبيق أي فلتر" : "No filters applied"}</span>
                  )}
                </div>
              </div>

              {/* Quick action */}
              <div style={{ marginTop: 16, borderTop: `1px solid ${C.brd}`, paddingTop: 12 }}>
                <Button small primary onClick={() => showToast(isAr ? "سيتم إرسال حملة لهذه الشريحة" : "Campaign will be sent to this segment")} style={{ width: "100%" }}>
                  <Icon name="megaphone" size={13} />
                  {isAr ? "إرسال حملة لهذه الشريحة" : "Send Campaign to Segment"}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Modal>

      {/* ── Import Contacts Modal ── */}
      <Modal
        open={showImportModal}
        onClose={() => { setShowImportModal(false); setImportFile(null); setImportPreview(null); }}
        title={isAr ? "استيراد جهات الاتصال" : "Import Contacts"}
        wide={!!importPreview}
        submitLabel={!importFile ? (isAr ? "اختر ملف أولاً" : "Select file first") : importLoading ? (isAr ? "جاري الاستيراد..." : "Importing...") : (isAr ? `استيراد ${importPreview?.rows.length || 0} جهة اتصال` : `Import ${importPreview?.rows.length || 0} contacts`)}
        onSubmit={async () => {
          if (!importFile) {
            showToast(isAr ? "يرجى اختيار ملف" : "Please select a file");
            return;
          }
          if (!importPreview?.rows.length) {
            showToast(isAr ? "الملف فارغ" : "File is empty");
            return;
          }
          setImportLoading(true);
          const formData = new FormData();
          formData.append('file', importFile);
          try {
            const res = await api.post('/contacts/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const d = res.data?.data || {};
            showToast(isAr
              ? `تم استيراد ${d.imported || 0} جهة اتصال${d.skipped ? ` (تم تخطي ${d.skipped})` : ''}`
              : `${d.imported || 0} imported${d.skipped ? `, ${d.skipped} skipped` : ''}`
            );
            setShowImportModal(false);
            setImportFile(null);
            setImportPreview(null);
            mutate();
          } catch (err: any) {
            showToast(err.response?.data?.message || (isAr ? "فشل الاستيراد" : "Import failed"));
          } finally {
            setImportLoading(false);
          }
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Step 1: Download Template */}
          <div style={{ background: `${C.pri}08`, border: `1px solid ${C.pri}20`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.txt, marginBottom: 8 }}>
              {isAr ? "الخطوة 1: حمّل النموذج" : "Step 1: Download Template"}
            </div>
            <div style={{ fontSize: 12, color: C.t2, marginBottom: 12, lineHeight: 1.6 }}>
              {isAr
                ? "حمّل ملف Excel النموذجي وعبّئ بيانات جهات الاتصال حسب الأعمدة المحددة. تأكد من صحة أرقام الهواتف بصيغة دولية."
                : "Download the template file and fill in your contacts data. Make sure phone numbers are in international format."}
            </div>
            <button
              onClick={() => {
                // UTF-16 LE with Tab separator - works on ALL Excel versions with Arabic
                const rows = [
                  "name\tphone\temail\tcity\ttags",
                  "أحمد العتيبي\t'+966551234567\tahmed@example.com\tالرياض\tVIP|مبيعات",
                  "سارة الحربي\t'+966559876543\tsara@example.com\tجدة\tدعم",
                  "محمد خالد\t'+966541112233\t\tالدمام\tجديد",
                ];
                const text = rows.join("\r\n");
                // Encode as UTF-16 LE
                const buf = new ArrayBuffer(2 + text.length * 2);
                const view = new Uint8Array(buf);
                // BOM for UTF-16 LE
                view[0] = 0xFF;
                view[1] = 0xFE;
                const u16 = new Uint16Array(buf, 2);
                for (let i = 0; i < text.length; i++) {
                  u16[i] = text.charCodeAt(i);
                }
                const blob = new Blob([buf], { type: "text/plain;charset=utf-16le" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "contacts_template.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.pri}`,
                background: "transparent", color: C.pri, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT_FAMILY,
              }}
            >
              <Icon name="file" size={13} />
              {isAr ? "تحميل النموذج (CSV)" : "Download Template (CSV)"}
            </button>
          </div>

          {/* Template Columns Info */}
          <div style={{ borderRadius: 10, border: `1px solid ${C.brd}`, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", background: C.inp, fontSize: 12, fontWeight: 600, color: C.t2 }}>
              {isAr ? "الأعمدة المطلوبة" : "Required Columns"}
            </div>
            <div style={{ padding: "8px 14px" }}>
              {[
                { col: "name", ar: "الاسم", req: true, desc: isAr ? "اسم جهة الاتصال" : "Contact name" },
                { col: "phone", ar: "رقم الهاتف", req: true, desc: isAr ? "بصيغة دولية مثل +966551234567" : "International format e.g. +966551234567" },
                { col: "email", ar: "البريد", req: false, desc: isAr ? "البريد الإلكتروني (اختياري)" : "Email (optional)" },
                { col: "city", ar: "المدينة", req: false, desc: isAr ? "اسم المدينة (اختياري)" : "City name (optional)" },
                { col: "tags", ar: "الوسوم", req: false, desc: isAr ? "مفصولة بفاصلة مثل VIP,مبيعات" : "Comma separated e.g. VIP,sales" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.brdL}` : "none", fontSize: 12 }}>
                  <code style={{ background: C.inp, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: C.pri, minWidth: 50 }}>{c.col}</code>
                  <span style={{ color: C.t2, minWidth: 70 }}>{c.ar}</span>
                  {c.req && <span style={{ color: COLORS.err, fontSize: 10, fontWeight: 700 }}>*</span>}
                  <span style={{ color: C.t3, fontSize: 11 }}>{c.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div style={{ background: `${COLORS.info}08`, border: `1px solid ${COLORS.info}20`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>
                {isAr ? "الخطوة 2: ارفع الملف" : "Step 2: Upload File"}
              </div>
              {importFile && (
                <button
                  onClick={() => { setImportFile(null); setImportPreview(null); }}
                  style={{ background: "transparent", border: "none", color: C.err, fontSize: 11, cursor: "pointer", fontFamily: FONT_FAMILY }}
                >
                  {isAr ? "إزالة الملف" : "Remove"}
                </button>
              )}
            </div>
            <div
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv,.xlsx,.xls,.txt';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                    parseFileForPreview(file);
                  }
                };
                input.click();
              }}
              style={{
                border: `2px dashed ${importFile ? COLORS.ok : C.brd}`,
                borderRadius: 10, padding: importFile ? "12px 16px" : "20px 16px", textAlign: "center", cursor: "pointer",
                background: importFile ? `${COLORS.ok}08` : "transparent",
              }}
            >
              {importFile ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ color: COLORS.ok, fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.ok }}>{importFile.name}</span>
                  <span style={{ fontSize: 11, color: C.t3 }}>({(importFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
                  <div style={{ fontSize: 12, color: C.t2 }}>
                    {isAr ? "اضغط لاختيار ملف CSV" : "Click to select CSV file"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Preview */}
          {importPreview && importPreview.rows.length > 0 && (
            <div style={{ borderRadius: 12, border: `1px solid ${COLORS.ok}30`, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: `${COLORS.ok}10`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.txt }}>
                  {isAr ? "الخطوة 3: معاينة البيانات" : "Step 3: Preview Data"}
                </div>
                <span style={{ fontSize: 12, color: COLORS.ok, fontWeight: 600 }}>
                  {importPreview.rows.length} {isAr ? "صف" : "rows"}
                </span>
              </div>
              <div style={{ overflowX: "auto", maxHeight: 250 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 10px", textAlign: isAr ? "right" : "left", background: C.inp, color: C.t2, fontWeight: 600, fontSize: 11, position: "sticky", top: 0, borderBottom: `1px solid ${C.brd}` }}>#</th>
                      {importPreview.headers.map((h, i) => (
                        <th key={i} style={{ padding: "8px 10px", textAlign: isAr ? "right" : "left", background: C.inp, color: C.pri, fontWeight: 600, fontSize: 11, position: "sticky", top: 0, borderBottom: `1px solid ${C.brd}`, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                      <th style={{ padding: "8px 10px", background: C.inp, color: C.t2, fontWeight: 600, fontSize: 11, position: "sticky", top: 0, borderBottom: `1px solid ${C.brd}` }}>
                        {isAr ? "الحالة" : "Status"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.rows.map((row, ri) => {
                      const phoneIdx = importPreview.headers.findIndex(h => h.toLowerCase() === 'phone');
                      const nameIdx = importPreview.headers.findIndex(h => h.toLowerCase() === 'name');
                      const hasPhone = phoneIdx >= 0 && row[phoneIdx]?.replace(/[' ]/g, '').length > 5;
                      const hasName = nameIdx >= 0 && row[nameIdx]?.trim().length > 0;
                      return (
                        <tr key={ri} style={{ borderBottom: `1px solid ${C.brdL}` }}>
                          <td style={{ padding: "6px 10px", color: C.t3, fontSize: 11 }}>{ri + 1}</td>
                          {row.slice(0, importPreview.headers.length).map((cell, ci) => (
                            <td key={ci} style={{ padding: "6px 10px", color: C.txt, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {cell || <span style={{ color: C.t3, fontStyle: "italic" }}>-</span>}
                            </td>
                          ))}
                          <td style={{ padding: "6px 10px" }}>
                            {hasPhone && hasName ? (
                              <span style={{ color: COLORS.ok, fontSize: 11, fontWeight: 600 }}>✓ {isAr ? "صالح" : "Valid"}</span>
                            ) : (
                              <span style={{ color: COLORS.err, fontSize: 11, fontWeight: 600 }}>✗ {!hasPhone ? (isAr ? "بدون هاتف" : "No phone") : (isAr ? "بدون اسم" : "No name")}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Summary */}
              <div style={{ padding: "10px 14px", background: C.inp, display: "flex", gap: 16, fontSize: 12 }}>
                <span style={{ color: COLORS.ok }}>
                  ✓ {importPreview.rows.filter((row) => {
                    const pi = importPreview!.headers.findIndex(h => h.toLowerCase() === 'phone');
                    return pi >= 0 && row[pi]?.replace(/[' ]/g, '').length > 5;
                  }).length} {isAr ? "صالح" : "valid"}
                </span>
                <span style={{ color: COLORS.err }}>
                  ✗ {importPreview.rows.filter((row) => {
                    const pi = importPreview!.headers.findIndex(h => h.toLowerCase() === 'phone');
                    return !(pi >= 0 && row[pi]?.replace(/[' ]/g, '').length > 5);
                  }).length} {isAr ? "غير صالح" : "invalid"}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
