import type { Status } from "@/types/common";

export function getStatusColor(status: string): string {
  if (["open", "active", "published", "online"].includes(status)) return "#34C77B";
  if (["pending", "testing", "busy", "scheduled"].includes(status)) return "#F5A623";
  if (["solved", "completed", "approved"].includes(status)) return "#4A9EFF";
  if (status === "rejected") return "#E84855";
  return "#555764";
}

export function getPriorityColor(priority: string): string {
  if (priority === "high") return "#E84855";
  if (priority === "medium") return "#F5A623";
  return "#555764";
}
