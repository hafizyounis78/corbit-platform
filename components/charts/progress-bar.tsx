"use client";

interface ProgressBarProps {
  value: number;
  color: string;
}

export function ProgressBar({ value, color }: ProgressBarProps) {
  return (
    <div
      style={{
        height: 8,
        borderRadius: 8,
        background: "rgba(128,128,128,0.15)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          borderRadius: 8,
          background: color,
        }}
      />
    </div>
  );
}
