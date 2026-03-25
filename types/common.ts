export type Status = "open" | "active" | "published" | "online" | "pending" | "testing" | "busy" | "scheduled" | "solved" | "completed" | "approved" | "rejected" | "closed" | "draft" | "unpublished" | "offline";

export type Priority = "high" | "medium" | "low";

export type Sentiment = "positive" | "negative" | "neutral";

export type Locale = "ar" | "en";

export type Theme = "dark" | "light";

export interface ThemeColors {
  pri: string;
  sec: string;
  bg: string;
  card: string;
  side: string;
  inp: string;
  txt: string;
  t2: string;
  t3: string;
  brd: string;
  brdL: string;
  ok: string;
  warn: string;
  err: string;
  info: string;
  wa: string;
  ai: string;
  shadow: string;
  shadowLg: string;
}
