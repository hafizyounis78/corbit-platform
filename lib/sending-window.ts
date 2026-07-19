/**
 * Client-side mirror of the backend send-window policy.
 *
 * Source of truth is App\Services\Compliance\SendingPolicyGate (backend);
 * this exists only so the UI can tell an operator *before* they launch
 * that their campaign will be deferred, instead of leaving them staring
 * at a 0% progress bar wondering if the platform is broken. That exact
 * confusion cost a support escalation on 2026-07-19.
 *
 * Keep the two in sync: same defaults (09:00–21:00, skip Fridays), same
 * midnight-crossing rule, same "walk forward up to 8 days" search.
 *
 * Deliberately NOT a send-blocking check — the backend decides. If this
 * file and the gate ever disagree, the gate wins and the worst case is a
 * slightly wrong hint, never a dropped or wrongly-sent message.
 */

export const DEFAULT_WINDOW_START = "09:00";
export const DEFAULT_WINDOW_END = "21:00";
export const DEFAULT_SKIP_FRIDAYS = true;

export type SendWindow = {
  start: string; // "HH:MM" or "HH:MM:SS"
  end: string;
  skipFridays: boolean;
};

export type WindowState = {
  /** False when a campaign launched right now would be deferred. */
  isOpen: boolean;
  /** When sending would actually begin. Null while the window is open. */
  opensAt: Date | null;
};

/** Minutes since local midnight for an "HH:MM" / "HH:MM:SS" string. */
function toMinutes(time: string): number {
  const [h = "0", m = "0"] = String(time).split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function isFriday(d: Date): boolean {
  return d.getDay() === 5;
}

function atTime(day: Date, time: string): Date {
  const d = new Date(day);
  const [h = "0", m = "0"] = String(time).split(":");
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d;
}

export function resolveWindow(policy?: Partial<Record<string, any>> | null): SendWindow {
  return {
    start: policy?.send_window_start || DEFAULT_WINDOW_START,
    end: policy?.send_window_end || DEFAULT_WINDOW_END,
    skipFridays:
      policy?.send_window_skip_fridays === undefined || policy?.send_window_skip_fridays === null
        ? DEFAULT_SKIP_FRIDAYS
        : Boolean(policy.send_window_skip_fridays),
  };
}

export function isInsideWindow(now: Date, w: SendWindow): boolean {
  if (w.skipFridays && isFriday(now)) return false;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = toMinutes(w.start);
  const endMin = toMinutes(w.end);

  // Overnight window (e.g. 22:00 → 02:00): open at either end of the day.
  if (endMin < startMin) return nowMin >= startMin || nowMin <= endMin;

  return nowMin >= startMin && nowMin <= endMin;
}

/**
 * Next moment the window opens, assuming `now` is currently outside it.
 * Walks forward at most 8 days — enough to clear a Friday skip from any
 * starting day.
 */
export function nextWindowOpen(now: Date, w: SendWindow): Date {
  let candidate = atTime(now, w.start);
  if (candidate.getTime() <= now.getTime()) {
    candidate = atTime(new Date(candidate.getTime() + 86400000), w.start);
  }

  for (let i = 0; i < 8; i++) {
    if (w.skipFridays && isFriday(candidate)) {
      candidate = atTime(new Date(candidate.getTime() + 86400000), w.start);
      continue;
    }
    return candidate;
  }
  return candidate;
}

export function evaluateWindow(now: Date, w: SendWindow): WindowState {
  if (isInsideWindow(now, w)) return { isOpen: true, opensAt: null };
  return { isOpen: false, opensAt: nextWindowOpen(now, w) };
}

/** "اليوم 09:00" / "غداً 09:00" / "السبت 09:00" — short, human, local. */
export function formatOpensAt(at: Date, isAr: boolean): string {
  const now = new Date();
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(at) - midnight(now)) / 86400000);

  const time = at.toLocaleTimeString(isAr ? "ar-SA" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (days === 0) return `${isAr ? "اليوم" : "today"} ${time}`;
  if (days === 1) return `${isAr ? "غداً" : "tomorrow"} ${time}`;

  const weekday = at.toLocaleDateString(isAr ? "ar-SA" : "en-GB", { weekday: "long" });
  return `${weekday} ${time}`;
}

/** Trims "09:00:00" → "09:00" for display. */
export function shortTime(t: string): string {
  const [h = "00", m = "00"] = String(t).split(":");
  return `${h.padStart(2, "0")}:${m}`;
}
