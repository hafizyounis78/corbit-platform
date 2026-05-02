"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useAiSegments } from "@/lib/api/hooks";
import { FONT_FAMILY } from "@/lib/constants/font";

interface SegmentTile {
  key: string;
  icon: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  color: string;
  count: number;
}

interface Props {
  /** Fired when an operator clicks a tile — parent uses the key to
   *  filter the contacts table or to launch a campaign. */
  onSegmentClick?: (key: string) => void;
  /** Currently-active segment key, drawn with a slight emphasis. */
  activeSegment?: string | null;
}

/**
 * Horizontal scroller of the 8 AI Smart Segment tiles. Designed to sit
 * directly under the page header and above the contacts table — wide
 * enough on desktop to show all 8 in a grid, falls back to a horizontal
 * scroll on narrower screens so we don't waste vertical real estate.
 *
 * Counts come from the backend's SmartSegmentsService and refresh on
 * mount; the parent can call mutate() (returned via the hook) after
 * import/score-recompute to refetch.
 */
export function SmartSegmentsBar({ onSegmentClick, activeSegment }: Props) {
  const { colors: C, isDark } = useTheme();
  const { isAr } = useLocale();
  const { data, isLoading } = useAiSegments();

  const segments: SegmentTile[] = (data as any)?.segments ?? [];

  if (isLoading) {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 10,
        marginBottom: 16,
      }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            height: 88,
            borderRadius: 12,
            background: C.card,
            border: `1px solid ${C.brd}`,
            opacity: 0.5,
          }} />
        ))}
      </div>
    );
  }

  if (segments.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 700,
          color: C.txt,
        }}>
          <span style={{ fontSize: 16 }}>🧠</span>
          {isAr ? "شرائح ذكيّة" : "Smart Segments"}
          <span style={{ fontSize: 11, fontWeight: 400, color: C.t3 }}>
            {isAr ? "(يتمّ تحديثها يومياً)" : "(refreshed daily)"}
          </span>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 10,
      }}>
        {segments.map((seg) => {
          const active = activeSegment === seg.key;
          const name = isAr ? seg.name_ar : seg.name_en;
          const desc = isAr ? seg.description_ar : seg.description_en;
          return (
            <button
              key={seg.key}
              onClick={() => onSegmentClick?.(seg.key)}
              style={{
                background: isDark ? C.card : "#fff",
                border: `1.5px solid ${active ? seg.color : C.brd}`,
                borderRadius: 12,
                padding: "12px 14px",
                cursor: "pointer",
                fontFamily: FONT_FAMILY,
                textAlign: isAr ? "right" : "left",
                transition: "all 0.15s",
                boxShadow: active ? `0 0 0 3px ${seg.color}25` : "none",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = seg.color + "80";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = C.brd;
              }}
            >
              {/* Subtle background tint matching segment color */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: seg.color,
                opacity: active ? 0.08 : 0.03,
                pointerEvents: "none",
              }} />
              <div style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 4,
              }}>
                <span style={{ fontSize: 22 }}>{seg.icon}</span>
                <span style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: seg.color,
                  fontFamily: "monospace",
                }}>
                  {seg.count.toLocaleString()}
                </span>
              </div>
              <div style={{
                position: "relative",
                fontSize: 13,
                fontWeight: 600,
                color: C.txt,
                marginBottom: 2,
              }}>
                {name}
              </div>
              <div style={{
                position: "relative",
                fontSize: 11,
                color: C.t2,
                lineHeight: 1.4,
              }}>
                {desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
