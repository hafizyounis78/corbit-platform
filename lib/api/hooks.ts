"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import api from './client';

// ─── Generic Hook ─────────────────────────────────────────
export function useApi<T = any>(url: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!!url);
  const urlRef = useRef(url);
  urlRef.current = url;

  const fetchData = useCallback(async () => {
    if (!urlRef.current) { setData(null); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(urlRef.current);
      if (urlRef.current === url) setData(res.data?.data ?? res.data);
    } catch (e: any) {
      if (urlRef.current === url) setError(e.response?.data?.message || e.message);
    } finally {
      if (urlRef.current === url) setIsLoading(false);
    }
  }, [url]);

  useEffect(() => { fetchData(); }, [url, ...deps]);

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
export function useConversations(params?: { status?: string; search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  const q = qs.toString();
  return useApi(`/conversations${q ? '?' + q : ''}`, [q]);
}

export function useConversation(id: string | null) {
  return useApi(id ? `/conversations/${id}` : null, [id]);
}

export function useMessages(conversationId: string | null) {
  return useApi(conversationId ? `/conversations/${conversationId}/messages` : null, [conversationId]);
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

// ─── Notifications ────────────────────────────────────────
export function useNotifications() {
  return useApi('/notifications');
}

export function useUnreadCount() {
  return useApi('/notifications/unread-count');
}

// ─── Settings ─────────────────────────────────────────────
export function useSettings(section: string) {
  const path = section === 'general' ? '/settings/general' :
               section === 'security' ? '/settings/security' :
               section === 'notifications' ? '/settings/notifications' :
               section === 'sla' ? '/settings/sla' :
               section === 'conversations' ? '/settings/conversations' :
               section === 'sms' ? '/settings/sms' :
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
