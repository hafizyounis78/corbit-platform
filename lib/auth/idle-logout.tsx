"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_BEFORE_WARN_MS = 59 * 60 * 1000;
const WARN_DURATION_S = 60;

interface Props {
  enabled: boolean;
  onLogout: () => void;
}

export function IdleLogout({ enabled, onLogout }: Props) {
  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARN_DURATION_S);
  const idleTimerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearAll = () => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const scheduleIdle = useCallback(() => {
    clearAll();
    idleTimerRef.current = window.setTimeout(() => {
      setWarning(true);
      setCountdown(WARN_DURATION_S);
      intervalRef.current = window.setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearAll();
            onLogout();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }, IDLE_BEFORE_WARN_MS);
  }, [onLogout]);

  const stay = useCallback(() => {
    setWarning(false);
    setCountdown(WARN_DURATION_S);
    scheduleIdle();
  }, [scheduleIdle]);

  useEffect(() => {
    if (!enabled) {
      clearAll();
      setWarning(false);
      return;
    }

    const onActivity = () => {
      // While the warning modal is up, random page activity should
      // NOT silently extend the session — the user has to click the
      // explicit "stay" button. Otherwise the warning is useless:
      // the cursor twitching on an open tab keeps the session alive
      // even when the operator stepped away from the desk.
      if (!warning) scheduleIdle();
    };

    const events: (keyof DocumentEventMap)[] = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => document.addEventListener(e, onActivity, { passive: true }));
    scheduleIdle();

    return () => {
      events.forEach((e) => document.removeEventListener(e, onActivity));
      clearAll();
    };
  }, [enabled, warning, scheduleIdle]);

  if (!warning) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-warning-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 text-right border border-gray-200 dark:border-gray-700">
        <h2 id="idle-warning-title" className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {"تنبيه: انتهاء الجلسة قريباً"}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
          {"سيتمّ تسجيل خروجك تلقائياً بعد "}
          <span className="font-bold text-red-600 dark:text-red-400 text-lg">{countdown}</span>
          {" ثانية بسبب عدم النشاط."}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {"تسجيل خروج الآن"}
          </button>
          <button
            type="button"
            onClick={stay}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold"
            autoFocus
          >
            {"استمرار الجلسة"}
          </button>
        </div>
      </div>
    </div>
  );
}
