/**
 * Shared localStorage helpers used by chores and budgeted stores.
 */

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStore(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}
