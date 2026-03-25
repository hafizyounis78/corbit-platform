"use client";

interface MiniBarProps {
  data: number[];
  color: string;
  height?: number;
}

export function MiniBar({ data, color, height = 40 }: MiniBarProps) {
  const max = Math.max(...data);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
        height,
      }}
    >
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            background: color,
            borderRadius: 2,
            minHeight: 2,
          }}
        />
      ))}
    </div>
  );
}
