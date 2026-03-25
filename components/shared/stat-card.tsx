"use client";

import { Card } from "@/components/ui/card";
import { MiniBar } from "@/components/charts/mini-bar";
import { useTheme } from "@/lib/theme/theme-provider";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  color: string;
  data: number[];
}

export function StatCard({ label, value, change, color, data }: StatCardProps) {
  const { colors: C } = useTheme();

  return (
    <Card style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: C.t2, marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.ok,
            background: C.ok + "15",
            padding: "3px 8px",
            borderRadius: 8,
            height: "fit-content",
          }}
        >
          {change}
        </span>
      </div>
      <MiniBar data={data} color={color} />
    </Card>
  );
}
