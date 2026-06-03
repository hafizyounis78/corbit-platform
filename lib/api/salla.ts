"use client";

import { useApi } from "./hooks";
import api from "./client";

/**
 * Salla integration types — mirrors the JSON shape returned by the
 * backend SallaController. Keep in sync with that controller; if the
 * shape drifts, the connection page silently breaks.
 */

export type SallaIntegrationStatus =
  | "active"
  | "expired"
  | "disconnected"
  | "error";

export interface SallaIntegration {
  id: string;
  salla_store_id: string;
  store_name: string | null;
  store_url: string | null;
  store_currency: string;
  status: SallaIntegrationStatus;
  connected_at: string | null;
  last_synced_at: string | null;
  token_expires_at: string | null;
  needs_refresh: boolean;
  error_message: string | null;
}

export interface SallaStatusResponse {
  enabled: boolean;
  // Plan-level flag. Distinct from `enabled` (which is the
  // platform-wide kill switch). When false, the page shows an
  // upgrade banner instead of the Connect CTA — but only when
  // there's no existing integration; live integrations stay
  // visible regardless so a downgrade never breaks ongoing use.
  plan_enabled?: boolean;
  connected: boolean;
  integration: SallaIntegration | null;
  message?: string;
}

export function useSallaStatus(pollInterval?: number) {
  return useApi<SallaStatusResponse>("/integrations/salla", [], pollInterval);
}

/**
 * Start the OAuth flow. Returns the authorize URL to redirect the
 * user to. We do a full window redirect rather than a popup — the
 * user lands cleanly on whatsbit.corbit.sa without window.opener
 * gymnastics, and the OAuth callback in the API redirects them back.
 */
export async function startSallaConnect(): Promise<string> {
  const res = await api.post("/integrations/salla/connect");
  return res.data?.authorize_url || res.data?.data?.authorize_url;
}

export async function disconnectSalla(): Promise<void> {
  await api.post("/integrations/salla/disconnect");
}

export async function triggerSallaSync(): Promise<void> {
  await api.post("/integrations/salla/sync");
}

export interface SallaOrder {
  id: string;
  salla_order_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  total_amount_sar: number;
  currency: string;
  status: string;
  payment_status: string;
  items_count: number;
  tracking_number: string | null;
  shipping_company: string | null;
  placed_at: string;
  attributed_campaign_id: string | null;
}

/**
 * Paginated orders synced from Salla (via API sync, not webhooks).
 * The Conversions tab uses this to surface what's been pulled in
 * with a small revenue summary at the top.
 */
export function useSallaOrders(pollInterval?: number) {
  return useApi<{ data: SallaOrder[]; total: number }>(
    "/integrations/salla/orders",
    [],
    pollInterval,
  );
}

export interface SallaWebhookEvent {
  id: string;
  event: string;
  event_id: string | null;
  payload: unknown;
  processed_at: string | null;
  processing_error: string | null;
  created_at: string;
}

/**
 * Fetch incoming webhook events for this org. Used by the Events tab
 * on /integrations/salla to prove deliveries are landing and let
 * operators retry any that failed processing.
 */
export function useSallaWebhookEvents(pollInterval?: number) {
  return useApi<{ data: SallaWebhookEvent[] }>(
    "/integrations/salla/webhook-events",
    [],
    pollInterval,
  );
}
