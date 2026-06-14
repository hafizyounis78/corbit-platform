"use client";

import { useApi } from "./hooks";
import api from "./client";

/**
 * Shopify integration types — mirrors the JSON shape returned by the
 * backend ShopifyController. Keep in sync; if the shape drifts, the
 * /integrations/shopify page silently breaks.
 *
 * Naming intentionally mirrors lib/api/salla.ts and lib/api/zid.ts so
 * the integration pages can share most of their primitives between
 * stores. The two intentional divergences from Salla/Zid:
 *   1. Shopify is per-shop, so connecting requires a shop_domain.
 *   2. Shopify access tokens are permanent — there's no
 *      token_expires_at / needs_refresh on the integration row.
 */

export type ShopifyIntegrationStatus =
  | "active"
  | "disconnected"
  | "error";

export interface ShopifyIntegration {
  id: string;
  shop_domain: string;
  store_name: string | null;
  store_url: string | null;
  store_currency: string;
  status: ShopifyIntegrationStatus;
  connected_at: string | null;
  last_synced_at: string | null;
  error_message: string | null;
}

export interface ShopifyStatusResponse {
  enabled: boolean;
  // Plan-level flag. Distinct from `enabled` (the platform-wide kill
  // switch). When false, the page shows an upgrade banner instead of
  // the Connect CTA — but only when there's no existing integration;
  // live integrations stay visible regardless so a downgrade never
  // breaks ongoing use.
  plan_enabled?: boolean;
  connected: boolean;
  integration: ShopifyIntegration | null;
  message?: string;
}

export function useShopifyStatus(pollInterval?: number) {
  return useApi<ShopifyStatusResponse>("/integrations/shopify", [], pollInterval);
}

/**
 * Start the OAuth flow for a specific shop. Returns the authorize URL
 * to redirect to. Full window redirect (no popup) — the merchant lands
 * cleanly on whatsbit.corbit.sa without window.opener gymnastics.
 *
 * Shopify is per-shop, so the merchant has to tell us which store to
 * connect (e.g. `mystore.myshopify.com`). The backend sanitises and
 * fully validates the domain — on a 422 the caller surfaces the
 * inline error message.
 */
export async function startShopifyConnect(shopDomain: string): Promise<string> {
  const res = await api.post("/integrations/shopify/connect", {
    shop_domain: shopDomain,
  });
  return res.data?.authorize_url || res.data?.data?.authorize_url;
}

export async function disconnectShopify(): Promise<void> {
  await api.post("/integrations/shopify/disconnect");
}

export async function triggerShopifySync(): Promise<void> {
  await api.post("/integrations/shopify/sync");
}

export interface ShopifyOrder {
  id: string;
  shopify_order_id: string;
  order_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount_sar: number;
  refunded_amount: number;
  fx_rate_used: number | null;
  currency: string;
  status: string;
  placed_at: string;
  attributed_campaign_id: string | null;
  attributed_campaign_send_id: string | null;
  attributed_campaign: { id: string; name: string } | null;
}

export interface ShopifyConversionsResponse {
  totals: {
    orders_count: number;
    unique_buyers: number;
    gross_revenue: number;
    refunded_sar: number;
    net_revenue: number;
  };
  orders: ShopifyOrder[];
}

/**
 * Conversion summary + order list for the Conversions tab. Unlike
 * Salla/Zid (which page raw orders), the Shopify backend returns a
 * pre-computed `totals` block alongside the orders — refunds and FX
 * conversion make a client-side sum unreliable, so we trust the server.
 */
export function useShopifyConversions(pollInterval?: number) {
  return useApi<ShopifyConversionsResponse>(
    "/integrations/shopify/conversions",
    [],
    pollInterval,
  );
}

/**
 * Paginated orders synced from Shopify. Kept for parity with Salla/Zid;
 * the Conversions tab itself reads from the richer /conversions
 * endpoint above.
 */
export function useShopifyOrders(pollInterval?: number) {
  return useApi<{ data: ShopifyOrder[]; total: number }>(
    "/integrations/shopify/orders",
    [],
    pollInterval,
  );
}

export interface ShopifyWebhookEvent {
  id: string;
  event: string;
  shopify_event_id: string | null;
  payload: unknown;
  processed_at: string | null;
  processing_error: string | null;
  created_at: string;
}

/**
 * Fetch incoming webhook events for this org — powers the Events tab.
 * Proves deliveries are landing and lets operators see which failed.
 */
export function useShopifyWebhookEvents(pollInterval?: number) {
  return useApi<{ data: ShopifyWebhookEvent[] }>(
    "/integrations/shopify/webhook-events",
    [],
    pollInterval,
  );
}
