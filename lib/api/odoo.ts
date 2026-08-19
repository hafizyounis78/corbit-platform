"use client";

import { useApi } from "./hooks";
import api from "./client";

/**
 * Odoo integration types — mirrors the JSON shape returned by the
 * backend OdooController. Keep in sync; if the shape drifts, the
 * /integrations/odoo page silently breaks.
 *
 * Naming follows lib/api/salla.ts and lib/api/shopify.ts so the
 * integration pages share their primitives. The one structural
 * difference from those two: Odoo has no OAuth. Nothing authorises us
 * against Odoo — the tenant pastes a URL we mint into their own
 * automation rule. Which makes `webhook_url` the only field here that
 * is returned once and never again.
 */

export interface OdooIntegration {
  id: string;
  is_enabled: boolean;
  base_url: string | null;
  template_name: string;
  template_language: string;
  dedupe_minutes: number;
  last_received_at: string | null;
  last_sent_at: string | null;
  last_error: string | null;
  connected_at: string | null;
  /** Leading slice of the token, so two URLs can be told apart. */
  token_prefix: string;
}

/** An approved template that declares exactly the four variables we fill. */
export interface OdooEligibleTemplate {
  name: string;
  language: string;
  body: string;
}

export interface OdooStatusResponse {
  connected: boolean;
  integration: OdooIntegration | null;
  eligible_templates: OdooEligibleTemplate[];
  required_variables: number;
}

/** One inbound webhook, for the troubleshooting table. */
export interface OdooEvent {
  id: string;
  reference: string | null;
  /** Masked — only the last four digits survive the server. */
  phone: string | null;
  status: "queued" | "sent" | "failed" | "duplicate" | "rejected";
  error: string | null;
  created_at: string | null;
}

export interface OdooConnectPayload {
  base_url: string;
  template_name: string;
  template_language?: string;
  dedupe_minutes?: number;
}

/** connect + rotate both answer with a URL shown exactly once. */
export interface OdooCredentialResponse {
  connected: boolean;
  integration: OdooIntegration;
  webhook_url: string;
}

export function useOdooStatus(pollInterval?: number) {
  return useApi<OdooStatusResponse>("/integrations/odoo", [], pollInterval);
}

export function useOdooEvents(pollInterval?: number) {
  return useApi<{ events: OdooEvent[] }>("/integrations/odoo/events", [], pollInterval);
}

export async function connectOdoo(payload: OdooConnectPayload): Promise<OdooCredentialResponse> {
  const res = await api.post("/integrations/odoo/connect", payload);
  return res.data;
}

/**
 * Mints a replacement URL. The previous one stops working the instant
 * this resolves, so the caller must show the result before letting the
 * user navigate away.
 */
export async function rotateOdooUrl(): Promise<OdooCredentialResponse> {
  const res = await api.post("/integrations/odoo/rotate");
  return res.data;
}

export async function updateOdooSettings(
  payload: Partial<OdooConnectPayload> & { is_enabled?: boolean },
): Promise<OdooStatusResponse> {
  const res = await api.patch("/integrations/odoo/settings", payload);
  return res.data;
}

export async function disconnectOdoo(): Promise<void> {
  await api.post("/integrations/odoo/disconnect");
}
