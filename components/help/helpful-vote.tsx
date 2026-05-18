"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { getHelpClientToken } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";
import { Icon } from "@/components/icons/icon";
import api from "@/lib/api/client";

const VOTE_KEY_PREFIX = "corbit:help:voted:";

type Vote = "yes" | "no" | null;

/**
 * 👍 / 👎 footer rendered under each guide and FAQ. Tracks the
 * user's last vote in localStorage so the chosen button stays
 * highlighted across visits, and shows the live yes/no counters
 * from the API. Anonymous browsers identify by a stable
 * client_token (see getHelpClientToken).
 */
export function HelpfulVote({
  targetType,
  targetId,
  initialYes,
  initialNo,
}: {
  targetType: "guide" | "faq";
  targetId: string;
  initialYes: number;
  initialNo: number;
}) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const [yes, setYes] = useState(initialYes);
  const [no, setNo] = useState(initialNo);
  const [vote, setVote] = useState<Vote>(null);
  const [busy, setBusy] = useState(false);
  const localKey = `${VOTE_KEY_PREFIX}${targetType}:${targetId}`;

  // Hydrate the user's previous choice from localStorage so the
  // selected button stays highlighted on page refresh.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(localKey);
      if (stored === "yes" || stored === "no") setVote(stored);
    } catch {
      // ignore
    }
  }, [localKey]);

  // Keep counters in sync when the parent reloads the API list.
  useEffect(() => { setYes(initialYes); }, [initialYes]);
  useEffect(() => { setNo(initialNo); }, [initialNo]);

  const cast = async (helpful: boolean) => {
    if (busy) return;
    const newVote: Vote = helpful ? "yes" : "no";
    if (vote === newVote) return; // already voted this way
    setBusy(true);

    // Optimistic update — flip the counter immediately so the click
    // feels instant; reconcile from the API response.
    const prevYes = yes;
    const prevNo = no;
    const prevVote = vote;
    if (helpful) {
      setYes(yes + 1);
      if (vote === "no") setNo(Math.max(0, no - 1));
    } else {
      setNo(no + 1);
      if (vote === "yes") setYes(Math.max(0, yes - 1));
    }
    setVote(newVote);

    try {
      const res = await api.post("/help/feedback", {
        target_type:  targetType,
        target_id:    targetId,
        helpful,
        client_token: getHelpClientToken(),
      });
      const data = res.data?.data ?? res.data ?? {};
      if (typeof data.helpful_yes === "number") setYes(data.helpful_yes);
      if (typeof data.helpful_no  === "number") setNo(data.helpful_no);
      try { localStorage.setItem(localKey, newVote); } catch { /* noop */ }
      showToast(isAr ? "شكراً على ملاحظتك ❤️" : "Thanks for the feedback ❤️");
    } catch (err: any) {
      // Roll back the optimistic update on failure so the UI doesn't
      // claim a vote that the server didn't accept.
      setYes(prevYes);
      setNo(prevNo);
      setVote(prevVote);
      showToast(
        err?.response?.data?.message
          || (isAr ? "تعذّر تسجيل تقييمك" : "Failed to record your vote"),
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const btnStyle = (active: boolean, accent: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 14px", borderRadius: 999,
    border: `1.5px solid ${active ? accent : C.brd}`,
    background: active ? `${accent}15` : "transparent",
    color: active ? accent : C.t2,
    fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: 600,
    cursor: busy ? "wait" : "pointer",
    opacity: busy ? 0.7 : 1,
    transition: "all 0.15s",
  });

  return (
    <div style={{
      marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.brd}`,
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 11.5, color: C.t2, fontWeight: 600 }}>
        {isAr ? "هل ساعدك هذا؟" : "Was this helpful?"}
      </span>
      <button
        type="button"
        onClick={() => cast(true)}
        disabled={busy}
        style={btnStyle(vote === "yes", "#34C77B")}
      >
        <Icon name="thumbsUp" size={13} />
        {yes > 0 && <span style={{ opacity: 0.85 }}>{yes}</span>}
      </button>
      <button
        type="button"
        onClick={() => cast(false)}
        disabled={busy}
        style={btnStyle(vote === "no", "#E84855")}
      >
        <Icon name="thumbsDown" size={13} />
        {no > 0 && <span style={{ opacity: 0.85 }}>{no}</span>}
      </button>
      {vote && (
        <span style={{ fontSize: 11, color: C.t3 }}>
          {isAr ? "تمّ تسجيل تقييمك" : "Vote recorded"}
        </span>
      )}
    </div>
  );
}
