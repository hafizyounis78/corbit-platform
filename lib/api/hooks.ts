"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import api from './client';
import { subscribeToConversation, subscribeToOrg } from '../realtime/echo';

// ─── Generic Hook ─────────────────────────────────────────
//
// Optional `pollInterval` enables background polling. Polling pauses
// while the tab is hidden so a user with 6 tabs open isn't stacking
// requests against the API for inboxes they aren't looking at.
export function useApi<T = any>(
  url: string | null,
  deps: any[] = [],
  pollInterval?: number,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!url);
  const urlRef = useRef(url);
  urlRef.current = url;
  // Quiet refetches don't flip isLoading — otherwise the inbox
  // re-renders a "loading…" skeleton every poll tick.
  const fetchData = useCallback(async (quiet = false) => {
    if (!urlRef.current) { setData(null); setIsLoading(false); return; }
    if (!quiet) setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(urlRef.current);
      if (urlRef.current === url) setData(res.data?.data ?? res.data);
    } catch (e: any) {
      if (urlRef.current === url) setError(e.response?.data?.message || e.message);
    } finally {
      if (urlRef.current === url && !quiet) setIsLoading(false);
    }
  }, [url]);

  useEffect(() => { fetchData(); }, [url, ...deps]);

  useEffect(() => {
    if (!pollInterval || !url) return;
    let handle: number | undefined;
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchData(true);
    };
    handle = window.setInterval(tick, pollInterval);
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchData(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (handle) clearInterval(handle);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [url, pollInterval, fetchData]);

  return { data, error, isLoading, mutate: fetchData };
}

// ─── Dashboard ────────────────────────────────────────────
export function useDashboardStats() {
  return useApi('/dashboard/stats');
}

// ─── Nav Badges ───────────────────────────────────────────
export function useNavBadges() {
  return useApi('/nav/badges');
}

// ─── Conversations ────────────────────────────────────────
//
// Pusher pushes a `.conversation.updated` event on
// `private-org.{orgId}` whenever any thread gets a new message, and
// the hook refetches the list immediately. The 8s background poll
// stays in place as a hard safety net — if Pusher drops an event,
// the socket reconnects, AdBlock blocks the WebSocket on a single
// browser, or a deploy lands without env vars yet, the inbox keeps
// updating at the same cadence the customers were used to before
// real-time was introduced. Zero regression is more important than
// shaving polling load.
export function useConversations(params?: { status?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  const q = qs.toString();
  const result = useApi(`/conversations${q ? '?' + q : ''}`, [q], 8000);

  // Pull the org id from the logged-in user. Stored at login by the
  // auth flow; absent during SSR or pre-login so we skip the
  // subscription in that case.
  const orgId = useOrgIdFromStorage();

  useEffect(() => {
    if (!orgId) return;
    const unsub = subscribeToOrg(orgId, () => {
      // Quietly refetch — useApi.mutate() runs the same fetch the
      // poll uses, including the "no skeleton flash" path.
      result.mutate(true);
    });
    return unsub;
    // result.mutate identity is stable enough; including it would
    // re-subscribe on every render. Channel auth + token is checked
    // by the authorizer on each handshake so refresh isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  return result;
}

export function useConversation(id: string | null) {
  return useApi(id ? `/conversations/${id}` : null, [id]);
}

// Active conversation: Pusher pushes `.message.new` on
// `private-conversation.{id}` so the open thread appends instantly.
// The 4s poll stays as a hard backstop — covers reconnects, dropped
// events, and any browser where AdBlock is silently blocking the
// WebSocket. Customers don't see a regression vs. the pre-Pusher
// world even when Pusher misses.
export function useMessages(conversationId: string | null) {
  const result = useApi(
    conversationId ? `/conversations/${conversationId}/messages` : null,
    [conversationId],
    4000,
  );

  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeToConversation(conversationId, () => {
      result.mutate(true);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return result;
}

// Reads org_id from the auth_user blob stashed in localStorage on
// login. Returns null during SSR or before login. Kept inline because
// only the inbox hooks need it; promoting it to its own module would
// be overkill for two callers.
function useOrgIdFromStorage(): string | null {
  const [orgId, setOrgId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // UserResource exposes the org under `org.id`; older sessions
      // may have stored it as `org_id` or `organization.id` so we
      // accept all three shapes.
      const id =
        parsed?.org?.id ??
        parsed?.org_id ??
        parsed?.organization_id ??
        parsed?.organization?.id ??
        null;
      if (id) setOrgId(String(id));
    } catch {
      // ignore — falls back to null which disables the subscription
    }
  }, []);
  return orgId;
}

export function useWindowStatus(conversationId: string | null) {
  return useApi(conversationId ? `/conversations/${conversationId}/window-status` : null, [conversationId]);
}

// ─── Campaigns ────────────────────────────────────────────
export function useCampaigns(params?: { status?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  const q = qs.toString();
  return useApi(`/campaigns${q ? '?' + q : ''}`, [q]);
}

export function useCampaignStats() {
  return useApi('/campaigns/stats');
}

export function useCampaign(id: string | number | null) {
  return useApi(id ? `/campaigns/${id}` : null, [id]);
}

/**
 * Polls /campaigns/:id/progress every 2.5s while `enabled` is true.
 * Caller flips `enabled` based on campaign.status === 'active' so we
 * stop hitting the backend the moment the campaign reaches a terminal
 * state. The first fetch fires immediately so the UI doesn't flash
 * stale numbers between mount and the first interval tick.
 */
export function useCampaignProgress(
  id: string | number | null,
  enabled: boolean,
  intervalMs: number = 2500,
) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !enabled) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await api.get(`/campaigns/${id}/progress`);
        if (!cancelled) {
          setData(res.data?.data ?? res.data);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.response?.data?.message || e.message);
      }
    };

    tick();
    const handle = setInterval(tick, intervalMs);
    return () => { cancelled = true; clearInterval(handle); };
  }, [id, enabled, intervalMs]);

  return { data, error };
}

// ─── Contacts ─────────────────────────────────────────────
export function useContacts(params?: { status?: string; search?: string; tags?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  if (params?.tags) qs.set('tags', params.tags);
  if (params?.page) qs.set('page', String(params.page));
  const q = qs.toString();
  return useApi(`/contacts${q ? '?' + q : ''}`, [q]);
}

export function useContactStats() {
  return useApi('/contacts/stats');
}

export function useContactTags() {
  return useApi('/contacts/tags');
}

// AI Smart Segments — 8 fixed segments with live counts. The backend
// route is POST (no body required) so we use a dedicated tiny fetcher
// rather than the GET-only useApi.
export function useAiSegments() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/contacts/ai/segments');
      setData(res.data?.data ?? res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, error, isLoading, mutate: fetchData };
}

// Org-wide insight summary for the bottom-of-page Insights bar.
export function useAiInsights() {
  return useApi('/contacts/ai/insights');
}

// ─── Campaign analytics ──────────────────────────────────
//
// The detail view fetches the Behavior Funnel + segment performance +
// cost summary in one round-trip. Skips the call entirely when no
// campaignId is selected so the hook is safe to mount unconditionally.
export function useCampaignFunnel(campaignId: string | null) {
  return useApi(campaignId ? `/campaigns/${campaignId}/funnel` : null, [campaignId]);
}

// 6 deterministic preset cards for the Campaign Builder modal.
// Cached for the page lifetime; the presets don't change between
// requests so we don't refetch.
export function useCampaignBuilderPresets() {
  return useApi('/campaigns/ai/builder/presets');
}

// ─── Templates ────────────────────────────────────────────
export function useTemplates(params?: { status?: string; category?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.category) qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  const q = qs.toString();
  return useApi(`/templates${q ? '?' + q : ''}`, [q]);
}

export function useTemplateStats() {
  return useApi('/templates/stats');
}

// ─── Bots ─────────────────────────────────────────────────
export function useBots() {
  return useApi('/bots');
}

export function useBot(id: string | null) {
  return useApi(id ? `/bots/${id}` : null, [id]);
}

// ─── AI Center ────────────────────────────────────────────
export function useAiOverview() {
  return useApi('/ai/overview');
}

export function useAiModels() {
  return useApi('/ai/models');
}

export function useAiKnowledgeBase() {
  return useApi('/ai/knowledge-base');
}

export function useAiTone() {
  return useApi('/ai/tone');
}

export function useAiGuardrails() {
  return useApi('/ai/guardrails');
}

// ─── Analytics ────────────────────────────────────────────
export function useAnalytics(tab: string, range?: string) {
  const qs = range ? `?range=${range}` : '';
  const path = tab === 'overview' ? '/analytics/overview' :
               tab === 'conversations' ? '/analytics/conversations' :
               tab === 'agents' ? '/analytics/agents' :
               tab === 'ai' ? '/analytics/ai' : '/analytics/overview';
  return useApi(`${path}${qs}`, [tab, range]);
}

// ─── Integrations ─────────────────────────────────────────
export function useIntegrations(params?: { category?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all') qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  const q = qs.toString();
  return useApi(`/integrations${q ? '?' + q : ''}`, [q]);
}

// ─── Teams ────────────────────────────────────────────────
export function useTeams() {
  return useApi('/teams');
}

export function useTeamMembers(teamId: string | null) {
  return useApi(teamId ? `/teams/${teamId}/members` : null, [teamId]);
}

// ─── Billing ──────────────────────────────────────────────
export function useBillingOverview() {
  return useApi('/billing/overview');
}

export function useBillingPlans() {
  return useApi('/billing/plans');
}

export function useBillingTransactions(category?: string) {
  // Accepts the same category buckets the backend returns ('whatsapp',
  // 'sms', 'ai', 'topup'). Omit for the unfiltered ledger. Encoded into
  // the SWR key so switching filters doesn't return cached rows from a
  // different bucket.
  const qs = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
  return useApi(`/billing/transactions${qs}`);
}

export function useBankAccounts() {
  return useApi('/billing/bank-accounts');
}

export function useMyTransfers() {
  return useApi('/billing/transfers');
}

export function useWhatsAppStatus() {
  return useApi('/onboarding/whatsapp/status');
}

/**
 * Sales Channel Partner provisioning. Returns the org's active draft
 * + history. The wizard polls this on mount to resume mid-flow.
 */
export function useWhatsAppProvisioning() {
  return useApi<{
    draft: {
      id: string;
      status: string;
      editable: boolean;
      business: { name: string|null; nameAr: string|null; crNumber: string|null; category: string|null; address: string|null; city: string|null; country: string; website: string|null };
      owner: { name: string|null; idType: string|null; idNumber: string|null; email: string|null; phone: string|null };
      number: { phoneNumber: string|null; displayName: string|null; displayNameAr: string|null; isExistingNumber: boolean; verificationMethod: string|null };
      documents: Array<{ id: string; type: string; fileName: string; uploadedAt: string|null }>;
      consents: Array<{ type: string; documentVersion: string; signerName: string; signedAt: string|null }>;
      rejectionReason: string|null;
      submittedAt: string|null;
      activatedAt: string|null;
    };
    history: any[];
    consentVersions: { dpa: string; tos: string; privacy: string };
  }>('/whatsapp/provisioning');
}

export function usePlanUsage() {
  return useApi<{
    is_sandbox: boolean;
    is_trial: boolean;
    plan: { name: string; name_ar: string; price: number } | null;
    expiry: {
      expiresAt: string | null;
      daysLeft: number | null;
      isActive: boolean;
      expiringSoon: boolean;
    };
    limits: Record<string, number | boolean>;
    usage: Record<string, number>;
  }>('/billing/plan-usage');
}

// ─── Sandbox (Enterprise) ─────────────────────────────────
export function useSandbox() {
  return useApi<{
    enabled: boolean;
    provisioned: boolean;
    sandbox: { id: string; name: string; created_at: string | null; contacts: number; conversations: number } | null;
  }>('/sandbox');
}

// ─── AI Agents (Enterprise multi-agent) ───────────────────
export function useAiAgents() {
  return useApi<Array<{
    id: string;
    name: string;
    name_ar: string | null;
    description: string | null;
    system_prompt: string;
    routing_keywords: string[] | null;
    is_default: boolean;
    is_active: boolean;
    use_knowledge_base: boolean;
    kb_top_k: number;
    sort_order: number;
  }>>('/ai-agents');
}

// ─── Notifications ────────────────────────────────────────
export function useNotifications() {
  return useApi('/notifications');
}

export function useUnreadCount() {
  return useApi('/notifications/unread-count');
}

// ─── SMS — per-tenant configuration ──────────────────────
export function useSmsConfig() {
  return useApi('/sms/config');
}

// Per-channel monthly spend alert thresholds. The endpoint returns
// { whatsapp, sms, ai } in SAR — each independent; null means no
// alert configured for that channel.
export function useAlertThresholds() {
  return useApi('/billing/alert-thresholds');
}

// CSAT (Customer Satisfaction) settings + the org's approved Meta
// templates the operator can pick as the survey trigger. One round-
// trip so the form renders without a second fetch.
export function useCsatSettings() {
  return useApi('/settings/csat');
}

// ─── Help Center ─────────────────────────────────────────
//
// Help content is platform-wide (not org-scoped) so the same data
// surfaces for every tenant. The endpoints are read-only on the
// tenant side — editing happens in Nova.
export function useHelpGuides() {
  return useApi('/help/guides');
}

export function useHelpFaqs() {
  return useApi('/help/faqs');
}

export function useHelpContact() {
  return useApi('/help/contact');
}

/**
 * Anonymous votes need a stable client token so a browser can't
 * vote a hundred times. We mint and persist it once per device in
 * localStorage; logged-in users get identified by user_id and the
 * token is ignored server-side.
 */
export function getHelpClientToken(): string {
  if (typeof window === 'undefined') return '';
  const KEY = 'corbit:help:clientToken';
  try {
    let t = localStorage.getItem(KEY);
    if (!t) {
      t = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEY, t);
    }
    return t;
  } catch {
    // localStorage unavailable (Safari Private Mode etc.) — return a
    // session-scoped fallback so the vote still goes through.
    return Math.random().toString(36).slice(2);
  }
}

// ─── Support tickets ─────────────────────────────────────
export function useSupportTickets(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return useApi(`/support/tickets${qs}`, [status ?? '']);
}

export function useSupportTicket(id: string | null) {
  return useApi(id ? `/support/tickets/${id}` : null, [id]);
}

// ─── Settings ─────────────────────────────────────────────
export function useSettings(section: string) {
  const path = section === 'general' ? '/settings/general' :
               section === 'security' ? '/settings/security' :
               section === 'notifications' ? '/settings/notifications' :
               section === 'sla' ? '/settings/sla' :
               section === 'conversations' ? '/settings/conversations' :
               section === 'sms' ? '/settings/sms' :
               section === 'reply-mode' ? '/settings/reply-mode' :
               section === 'auto-messages' ? '/settings/auto-messages' :
               section === 'business-hours' ? '/settings/business-hours' :
               section === 'api-keys' ? '/settings/api-keys' :
               section === 'webhooks' ? '/settings/webhooks' :
               section === 'whatsapp' ? '/settings/whatsapp' : null;
  return useApi(path, [section]);
}

// ─── Search ───────────────────────────────────────────────
export function useSearch(query: string) {
  return useApi(query.length >= 1 ? `/search?q=${encodeURIComponent(query)}` : null, [query]);
}

// ─── Segments ─────────────────────────────────────────────
export function useSegments() {
  return useApi('/segments');
}

// ─── Quick Replies ────────────────────────────────────────
export function useQuickReplies() {
  return useApi('/quick-replies');
}
