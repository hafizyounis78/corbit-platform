"use client";

/**
 * Plan-gated CSV + Excel export controls. Two buttons that:
 *
 *   - Hit the same export endpoint with ?format=csv or ?format=xlsx
 *     and trigger a browser download via Blob + ObjectURL. Streaming
 *     directly into <a download> avoids the "view in tab" failure
 *     mode you get from plain navigation when the server sets the
 *     wrong Content-Disposition.
 *
 *   - Read csv_export_enabled / excel_export_enabled from
 *     PlanService::limitsFor and disable themselves when the plan
 *     doesn't include the format. Disabled buttons still render
 *     (with a hint) so Basic tenants understand what's behind the
 *     paywall rather than the buttons just vanishing.
 *
 * Endpoint is passed as a path (e.g. "/analytics/export") and the
 * caller supplies any extra query params it needs (range, type,
 * tags, etc.). The buttons append ?format=… themselves.
 */

import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useToast } from "@/hooks/use-toast";
import { usePlanUsage } from "@/lib/api/hooks";
import api from "@/lib/api/client";

interface Props {
  endpoint: string;                       // e.g. "/contacts/export"
  params?: Record<string, string | undefined>;
  filenamePrefix?: string;                // defaults to last path segment
  size?: "small" | "normal";
}

export function ExportButtons({
  endpoint, params = {}, filenamePrefix, size = "small",
}: Props) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();
  const { showToast } = useToast();
  const { data: planData } = usePlanUsage();

  const csvEnabled   = (planData?.limits?.csv_export_enabled   as boolean | undefined) ?? false;
  const excelEnabled = (planData?.limits?.excel_export_enabled as boolean | undefined) ?? false;

  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);

  const guessedName = filenamePrefix
    ?? endpoint.split("/").filter(Boolean).pop()
    ?? "export";

  const handleDownload = async (format: "csv" | "xlsx") => {
    const enabled = format === "csv" ? csvEnabled : excelEnabled;
    if (!enabled) {
      showToast(
        isAr
          ? "تصدير البيانات غير متاح في باقتك الحاليّة. رقّ الباقة."
          : "Export not available in your plan. Upgrade to enable.",
        "error",
      );
      return;
    }

    setDownloading(format);
    try {
      // Build query string from params + format.
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") q.set(k, v);
      }
      q.set("format", format);

      const res = await api.get(`${endpoint}?${q.toString()}`, {
        responseType: "blob",
      });

      // Some browsers + axios combos drop Content-Disposition;
      // synthesise the filename from the params so the download
      // lands with a meaningful name regardless.
      const blob = res.data as Blob;
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href      = url;
      a.download  = `${guessedName}-${new Date().toISOString().slice(0,10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      // 403 → plan gate fired. Anything else → generic failure.
      const status = err?.response?.status;
      const msg = status === 403
        ? (isAr
            ? "تصدير البيانات غير متاح في باقتك. رقّ الباقة."
            : "Export not enabled on your plan.")
        : (isAr ? "تعذّر التصدير." : "Export failed.");
      showToast(msg, "error");
    } finally {
      setDownloading(null);
    }
  };

  const small = size === "small";

  return (
    <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
      <ExportBtn
        C={C}
        loading={downloading === "csv"}
        disabled={!csvEnabled}
        onClick={() => handleDownload("csv")}
        small={small}
        title={!csvEnabled
          ? (isAr ? "غير متاح في باقتك" : "Not in your plan")
          : undefined}
        icon="document"
        label="CSV"
      />
      <ExportBtn
        C={C}
        loading={downloading === "xlsx"}
        disabled={!excelEnabled}
        onClick={() => handleDownload("xlsx")}
        small={small}
        title={!excelEnabled
          ? (isAr ? "غير متاح في باقتك" : "Not in your plan")
          : undefined}
        icon="document"
        label="Excel"
      />
    </div>
  );
}

function ExportBtn({
  C, loading, disabled, onClick, small, title, icon, label,
}: {
  C: any; loading: boolean; disabled: boolean; onClick: () => void;
  small: boolean; title?: string; icon: string; label: string;
}) {
  return (
    <div title={title}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        style={{
          padding: small ? "5px 12px" : "8px 16px",
          borderRadius: 8,
          border: `1px solid ${disabled ? C.brd : C.brd}`,
          background: "transparent",
          color: disabled ? C.t3 : C.txt,
          fontSize: small ? 12 : 13,
          fontWeight: 600,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Icon name={icon} size={small ? 11 : 13} />
        <span>{loading ? "…" : label}</span>
      </button>
    </div>
  );
}
