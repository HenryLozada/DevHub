export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: string;
}
