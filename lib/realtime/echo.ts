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

import Echo from "laravel-echo";
import Pusher from "pusher-js";

type AnyListener = (payload: any) => void;

let echo: Echo<"pusher"> | null = null;
let initFailed = false;

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
  if (!key) {
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
            .then((res) => {
              if (!res.ok) throw new Error(`auth ${res.status}`);
              return res.json();
            })
            .then((data) => callback(null, data))
            .catch((err) => callback(err instanceof Error ? err : new Error(String(err)), null));
        },
      }),
    });

    return echo;
  } catch (e) {
    initFailed = true;
    // Surface once to the console so an env mismatch is debuggable; the
    // hooks still fall back to polling so the inbox keeps working.
    // eslint-disable-next-line no-console
    console.warn("[realtime] Echo init failed, falling back to polling", e);
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
  if (!client || !conversationId) return () => {};

  const channelName = `conversation.${conversationId}`;
  const channel = client.private(channelName).listen(".message.new", onNewMessage);

  return () => {
    try {
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
  if (!client || !orgId) return () => {};

  const channelName = `org.${orgId}`;
  const channel = client.private(channelName).listen(".conversation.updated", onConversationUpdated);

  return () => {
    try {
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
    echo.disconnect();
  } finally {
    echo = null;
    initFailed = false;
  }
}
