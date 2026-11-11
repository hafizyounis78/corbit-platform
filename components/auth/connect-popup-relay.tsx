"use client";

import { useEffect } from "react";

/**
 * When Meta's sign-up window (opened through 360dialog) finishes, it comes
 * back to this site with the new channel in its address:
 *   ?client=…&channels=[…]
 * Whatever page it lands on, hand that address to the page that opened the
 * window and close — the opener finishes the connection. Mounted once, at
 * the root, so it does not matter which return address is configured.
 */
export function ConnectPopupRelay() {
  useEffect(() => {
    const search = window.location.search;
    if (!window.opener || window.name !== "connect-360dialog") return;
    if (!/[?&]client=/.test(search) || !/[?&]channels=/.test(search)) return;
    try { window.opener.postMessage(search, window.location.origin); } catch {}
    window.close();
  }, []);

  return null;
}
