"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/lib/theme/theme-provider";

interface DataTableProps {
  headers: (string | ReactNode)[];
  rows: ReactNode[][];
}

export function DataTable({ headers, rows }: DataTableProps) {
  const { colors: C } = useTheme();

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((hd, i) => (
              <th
                key={i}
                style={{
                  padding: "10px 16px",
                  textAlign: "inherit",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: C.t2,
                  borderBottom: "1px solid " + C.brd,
                  whiteSpace: "nowrap",
                }}
              >
                {hd}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid " + C.brdL }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
