"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Icon } from "@/components/icons/icon";
import { Button } from "./button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: ReactNode;
  submitLabel?: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  hideFooter?: boolean;
}

export function Modal({ open, onClose, title, wide, children, submitLabel, onSubmit, submitDisabled, submitLoading, hideFooter }: ModalProps) {
  const { colors: C } = useTheme();
  const { t } = useLocale();

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: wide ? 860 : 520,
          maxWidth: "95vw",
          maxHeight: "90vh",
          background: C.card,
          borderRadius: 24,
          border: "1px solid " + C.brd,
          display: "flex",
          flexDirection: "column",
          boxShadow: C.shadowLg,
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid " + C.brd,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: C.t2,
              cursor: "pointer",
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>{children}</div>
        {!hideFooter && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid " + C.brd,
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <Button outline onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              primary
              disabled={submitDisabled || submitLoading}
              onClick={() => {
                if (onSubmit) {
                  onSubmit();
                } else {
                  onClose();
                }
              }}
            >
              {submitLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid #fff4",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  {submitLabel ?? "..."}
                </span>
              ) : (submitLabel ?? t("save"))}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
