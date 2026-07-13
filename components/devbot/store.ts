import { readStore, writeStore } from "@/lib/local-store";
import { ChatMessage } from "./types";

const STORE_KEY = "ph_devbot_history";

export function getChatHistory(): ChatMessage[] {
  const history = readStore<ChatMessage[]>(STORE_KEY, []);
  return Array.isArray(history) ? history : [];
}

export function addChatMessage(msg: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
  const history = getChatHistory();
  const newMessage: ChatMessage = {
    ...msg,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  
  const updatedHistory = [...history, newMessage];
  writeStore(STORE_KEY, updatedHistory);
  return newMessage;
}

export function clearChatHistory(): void {
  writeStore(STORE_KEY, []);
}
