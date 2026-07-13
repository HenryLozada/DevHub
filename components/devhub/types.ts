export type DevItemType = "tool" | "repo" | "youtube" | "note" | "api" | "credential";

export interface DevItem {
  id: string;
  title: string;
  description?: string;
  type: DevItemType;
  url?: string;
  content?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  createdAt: string;
  category: string; // e.g. "Frontend", "Backend", "DevOps", "AI", "General"
}
