"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { FONT_FAMILY } from "@/lib/constants/font";

type ToastType = "success" | "error";

interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Listen for toast events dispatched by the axios interceptor
  // (plan-limit / plan-feature errors), so any API call anywhere
  // gets a uniform toast without the calling component having to
  // hand-roll it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message?: string; type?: ToastType } | undefined;
      if (detail?.message) {
        showToast(detail.message, detail.type ?? "error");
      }
    };
    window.addEventListener("corbit:toast", handler as EventListener);
    return () => window.removeEventListener("corbit:toast", handler as EventListener);
  }, [showToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "error" ? "#E53E3E" : "#34C77B",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            fontFamily: FONT_FAMILY,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 300,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
