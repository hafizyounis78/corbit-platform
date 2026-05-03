"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import api from './client';

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
// Inbox is polled every 8s in the background so new conversations
// and unread bumps surface without a manual refresh. Visibility-aware
// (see useApi) so background tabs stay quiet.
export function useConversations(params?: { status?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  const q = qs.toString();
  return useApi(`/conversations${q ? '?' + q : ''}`, [q], 8000);
}

export function useConversation(id: string | null) {
  return useApi(id ? `/conversations/${id}` : null, [id]);
}

// Active conversation refreshes faster (4s) — that's the chat the
// agent is staring at, so new messages must appear quickly.
export function useMessages(conversationId: string | null) {
  return useApi(
    conversationId ? `/conversations/${conversationId}/messages` : null,
    [conversationId],
    4000,
  );
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
export function useTemplates(params?: { status?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
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

export function useBillingTransactions() {
  return useApi('/billing/transactions');
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

// ─── Notifications ────────────────────────────────────────
export function useNotifications() {
  return useApi('/notifications');
}

export function useUnreadCount() {
  return useApi('/notifications/unread-count');
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
