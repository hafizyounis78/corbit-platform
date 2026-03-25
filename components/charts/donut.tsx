"use client";

export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
}

export function Donut({ segments, size = 90, strokeWidth = 10 }: DonutProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      {segments.map((seg, i) => {
        const dashLen = (seg.value / 100) * c;
        const dashOffset = -offset;
        offset += dashLen;

        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLen} ${c - dashLen}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
    </svg>
  );
}
