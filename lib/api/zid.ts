"use client";

import { useApi } from "./hooks";
import api from "./client";

/**
 * Zid integration types — mirrors the JSON shape returned by the
 * backend ZidController. Keep in sync; if the shape drifts, the
 * /integrations/zid page silently breaks.
 *
 * Naming intentionally mirrors lib/api/salla.ts so the integration
 * pages can share most of their primitives between the two stores.
 * Where Zid genuinely differs from Salla (dual-token auth lives
 * server-side; the frontend only sees the integration row) we just
 * carry the field shape that the controller returns.
 */

export type ZidIntegrationStatus =
  | "active"
  | "expired"
  | "disconnected"
  | "error";

export interface ZidIntegration {
  id: string;
  zid_store_id: string;
  store_name: string | null;
  store_url: string | null;
  store_currency: string;
  status: ZidIntegrationStatus;
  connected_at: string | null;
  last_synced_at: string | null;
  token_expires_at: string | null;
  needs_refresh: boolean;
  error_message: string | null;
}

export interface ZidStatusResponse {
  enabled: boolean;
  // Plan-level flag. Distinct from `enabled` (the platform-wide kill
  // switch). When false, the page shows an upgrade banner instead of
  // the Connect CTA — but only when there's no existing integration;
  // live integrations stay visible regardless so a downgrade never
  // breaks ongoing use.
  plan_enabled?: boolean;
  connected: boolean;
  integration: ZidIntegration | null;
  message?: string;
}

export function useZidStatus(pollInterval?: number) {
  return useApi<ZidStatusResponse>("/integrations/zid", [], pollInterval);
}

/**
 * Start the OAuth flow. Returns the authorize URL to redirect to.
 * Full window redirect (no popup) — the merchant lands cleanly on
 * whatsbit.corbit.sa without window.opener gymnastics.
 */
export async function startZidConnect(): Promise<string> {
  const res = await api.post("/integrations/zid/connect");
  return res.data?.authorize_url || res.data?.data?.authorize_url;
}

export async function disconnectZid(): Promise<void> {
  await api.post("/integrations/zid/disconnect");
}

export async function triggerZidSync(): Promise<void> {
  await api.post("/integrations/zid/sync");
}

export interface ZidOrder {
  id: string;
  zid_order_id: string;
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
 * Paginated orders synced from Zid. The Conversions tab uses this to
 * surface what's been pulled in with a small revenue summary up top.
 */
export function useZidOrders(pollInterval?: number) {
  return useApi<{ data: ZidOrder[]; total: number }>(
    "/integrations/zid/orders",
    [],
    pollInterval,
  );
}

export interface ZidWebhookEvent {
  id: string;
  event: string;
  event_id: string | null;
  payload: unknown;
  processed_at: string | null;
  processing_error: string | null;
  created_at: string;
}

/**
 * Fetch incoming webhook events for this org — powers the Events tab.
 * Proves deliveries are landing and lets operators see which failed.
 */
export function useZidWebhookEvents(pollInterval?: number) {
  return useApi<{ data: ZidWebhookEvent[] }>(
    "/integrations/zid/webhook-events",
    [],
    pollInterval,
  );
}
