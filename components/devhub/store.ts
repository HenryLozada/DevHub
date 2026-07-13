import { readStore, writeStore } from "@/lib/local-store";
import { DevItem } from "./types";

const STORE_KEY = "ph_devhub_items";

export function getDevItems(): DevItem[] {
  return readStore<DevItem[]>(STORE_KEY, []);
}

export function saveDevItem(data: Omit<DevItem, "id" | "createdAt">): DevItem {
  const items = getDevItems();
  const newItem: DevItem = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  writeStore(STORE_KEY, [...items, newItem]);
  return newItem;
}

export function updateDevItem(id: string, data: Partial<Omit<DevItem, "id">>): void {
  const items = getDevItems().map((item) =>
    item.id === id ? { ...item, ...data } : item
  );
  writeStore(STORE_KEY, items);
}

export function deleteDevItem(id: string): void {
  const items = getDevItems().filter((item) => item.id !== id);
  writeStore(STORE_KEY, items);
}
