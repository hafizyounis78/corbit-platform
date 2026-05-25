"use client";

// Real-time client (Pusher Channels via laravel-echo).
//
// Single shared instance for the whole frontend. Created lazily on
// first use because:
//   - SSR has no `window`, so the constructor must not run at import.
//   - Anonymous visitors (/login, marketing pages) shouldn't open a
//     WebSocket they'll never use.
//   - The auth token only exists after a successful login, so we
//     can't initialize Echo at module load reliably.
//
// Callers use `subscribeToConversation(...)` / `subscribeToOrg(...)`
// which return an unsubscribe function — that's the only surface the
// rest of the app touches.
//
// Disabled (no-op) when NEXT_PUBLIC_PUSHER_KEY isn't set. The hooks
// fall back to polling in that case, so the inbox keeps working.
//
// Verbose console logs are emitted under the `[realtime]` prefix so
// the lifecycle is reconstructable from a single browser-console
// screenshot — we don't want another back-and-forth diagnosis cycle.

import Echo from "laravel-echo";
import Pusher from "pusher-js";

type AnyListener = (payload: any) => void;

let echo: Echo<"pusher"> | null = null;
let initFailed = false;

const log = (...args: any[]) => {
  // eslint-disable-next-line no-console
  console.log("[realtime]", ...args);
};
const warn = (...args: any[]) => {
  // eslint-disable-next-line no-console
  console.warn("[realtime]", ...args);
};

function apiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:8000/api")
  );
}

function authToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

function getEcho(): Echo<"pusher"> | null {
  if (echo) return echo;
  if (initFailed) return null;
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

  // Log env presence on first init attempt — covers the #1 silent
  // failure mode: Vercel build happened before the env vars were
  // added, so the keys are missing from the bundle even though they
  // exist in the dashboard.
  log("init attempt", {
    has_key: !!key,
    key_prefix: key ? key.slice(0, 6) + "…" : null,
    cluster,
    api_base: apiBaseUrl(),
    has_token: !!authToken(),
  });

  if (!key) {
    warn("aborting: NEXT_PUBLIC_PUSHER_KEY is empty. Vercel build must be re-run AFTER the env var is added.");
    initFailed = true;
    return null;
  }

  try {
    // pusher-js looks for `Pusher` on window in some setups. Echo
    // expects the constructor as a `client` option instead, which is
    // the documented path and avoids polluting globals.
    (window as any).Pusher = Pusher;

    echo = new Echo({
      broadcaster: "pusher",
      key,
      cluster,
      forceTLS: true,
      // Sanctum-backed handshake endpoint. The token is added per
      // request via the authorizer below so it stays current after a
      // re-login without forcing the user to reload the page.
      authEndpoint: `${apiBaseUrl()}/broadcasting/auth`,
      authorizer: (channel: { name: string }) => ({
        authorize: (socketId: string, callback: (error: Error | null, data: any) => void) => {
          const token = authToken();
          log("auth handshake", { channel: channel.name, has_token: !!token });
          fetch(`${apiBaseUrl()}/broadcasting/auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: new URLSearchParams({
              socket_id: socketId,
              channel_name: channel.name,
            }).toString(),
          })
            .then(async (res) => {
              if (!res.ok) {
                const body = await res.text().catch(() => "<unreadable>");
                warn("auth handshake FAILED", {
                  channel: channel.name,
                  status: res.status,
                  body: body.slice(0, 300),
                });
                throw new Error(`auth ${res.status}`);
              }
              return res.json();
            })
            .then((data) => {
              log("auth handshake OK", { channel: channel.name });
              callback(null, data);
            })
            .catch((err) => callback(err instanceof Error ? err : new Error(String(err)), null));
        },
      }),
    });

    // Surface socket lifecycle so a hung/refused connection is
    // obvious without poking at the underlying Pusher object.
    try {
      const pusherClient = (echo as any).connector?.pusher;
      pusherClient?.connection?.bind("state_change", (s: any) => {
        log("socket state", s.previous, "→", s.current);
      });
      pusherClient?.connection?.bind("error", (e: any) => {
        warn("socket error", {
          type: e?.type,
          error: e?.error,
          data: e?.data,
        });
      });
    } catch (e) {
      warn("could not bind state listeners (non-fatal)", e);
    }

    log("Echo initialized");
    return echo;
  } catch (e) {
    initFailed = true;
    warn("Echo init threw, falling back to polling", e);
    return null;
  }
}

/**
 * Subscribe to a single conversation's `.message.new` event. Returns
 * an unsubscribe function. No-op + returns a noop unsubscribe when
 * Pusher is not configured.
 */
export function subscribeToConversation(
  conversationId: string,
  onNewMessage: AnyListener,
): () => void {
  const client = getEcho();
  if (!client || !conversationId) {
    log("subscribeToConversation skipped", {
      has_client: !!client,
      conversation_id: conversationId,
    });
    return () => {};
  }

  const channelName = `conversation.${conversationId}`;
  log("subscribing", { channel: channelName });
  const channel = client
    .private(channelName)
    .listen(".message.new", (payload: any) => {
      log("event received .message.new", {
        channel: channelName,
        message_id: payload?.message?.id ?? null,
      });
      onNewMessage(payload);
    });

  return () => {
    try {
      log("unsubscribing", { channel: channelName });
      channel.stopListening(".message.new");
      client.leave(channelName);
    } catch {
      // ignore
    }
  };
}

/**
 * Subscribe to org-wide conversation activity (`.conversation.updated`)
 * so the inbox list refreshes when any thread receives a message.
 */
export function subscribeToOrg(orgId: string, onConversationUpdated: AnyListener): () => void {
  const client = getEcho();
  if (!client || !orgId) {
    log("subscribeToOrg skipped", { has_client: !!client, org_id: orgId });
    return () => {};
  }

  const channelName = `org.${orgId}`;
  log("subscribing", { channel: channelName });
  const channel = client
    .private(channelName)
    .listen(".conversation.updated", (payload: any) => {
      log("event received .conversation.updated", {
        channel: channelName,
        conversation_id: payload?.conversation_id ?? null,
      });
      onConversationUpdated(payload);
    });

  return () => {
    try {
      log("unsubscribing", { channel: channelName });
      channel.stopListening(".conversation.updated");
      client.leave(channelName);
    } catch {
      // ignore
    }
  };
}

/**
 * Tear the client down on logout so a stale token-authorized socket
 * doesn't hang around. Safe to call when uninitialized.
 */
export function disconnectRealtime(): void {
  if (!echo) return;
  try {
    log("disconnecting");
    echo.disconnect();
  } finally {
    echo = null;
    initFailed = false;
  }
}
