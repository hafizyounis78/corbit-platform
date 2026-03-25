"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { FONT_FAMILY } from "@/lib/constants/font";
import { GRADIENT } from "@/lib/constants/colors";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  const { colors: C } = useTheme();
  const { isAr } = useLocale();

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return pages;
  };

  const btnStyle = (active: boolean, disabled?: boolean): React.CSSProperties => ({
    minWidth: 32,
    height: 32,
    padding: "0 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: active ? "none" : `1px solid ${C.brd}`,
    background: active ? GRADIENT : "transparent",
    color: active ? "#fff" : disabled ? C.t3 : C.t2,
    fontFamily: FONT_FAMILY,
    opacity: disabled ? 0.4 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  });

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, padding: "14px 20px", borderTop: `1px solid ${C.brdL}`, flexWrap: "wrap" }}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        style={btnStyle(false, page <= 1)}
      >
        {isAr ? "السابق" : "Prev"}
      </button>

      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} style={{ color: C.t3, fontSize: 12, padding: "0 4px" }}>...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            style={btnStyle(p === page)}
          >
            {p}
          </button>
        )
      )}

      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        style={btnStyle(false, page >= totalPages)}
      >
        {isAr ? "التالي" : "Next"}
      </button>

      {totalItems !== undefined && (
        <span style={{ fontSize: 11, color: C.t3, marginRight: isAr ? 0 : 8, marginLeft: isAr ? 8 : 0 }}>
          {isAr ? `${totalItems} نتيجة` : `${totalItems} results`}
        </span>
      )}
    </div>
  );
}
