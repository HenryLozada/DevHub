const TABLE_MAP: Record<string, string> = {
  cashflow_rules: "cashflow_rules",
  personal_events_v2: "personal_events",
  ph_event_completed: "event_completed",
  ph_chores_chores: "chores",
  ph_budgeted_expenses: "expenses",
  ph_devhub_items: "devhub_items",
  ph_devbot_history: "devbot_history",
}

const ALL_KEYS = Object.keys(TABLE_MAP)

const LOCAL_ONLY_KEYS = [
  "ph_devhub_password_security",
  "ph_user_avatar",
  "theme",
  "ph_playground_injections",
]

export function getStoreKeys(): string[] {
  return [...ALL_KEYS]
}

function getUserId(): string | null {
  try {
    const raw = sessionStorage.getItem("ph_user_id")
    return raw || null
  } catch {
    return null
  }
}

export function setUserId(id: string | null) {
  if (id) sessionStorage.setItem("ph_user_id", id)
  else sessionStorage.removeItem("ph_user_id")
}

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStore(key: string, value: unknown, opts?: { emit?: boolean }): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error("localStorage write failed", key, e)
    return
  }
  // Avoid feedback loops: callers that mirror React state should pass emit:false
  // or rely on the default only when other modules need a refresh.
  if (opts?.emit !== false && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ph:update", { detail: { key } }))
  }
  scheduleSync(key)
}

// Debounce cloud uploads per key so rapid edits (typing, drag) produce a single upsert
const SYNC_DEBOUNCE_MS = 800
const pendingSyncs = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleSync(key: string) {
  if (!TABLE_MAP[key] || !getUserId()) return
  // Mark local as newer right away so a poll in the debounce window doesn't overwrite it
  localStorage.setItem(`${key}_ts`, new Date().toISOString())
  const prev = pendingSyncs.get(key)
  if (prev) clearTimeout(prev)
  pendingSyncs.set(
    key,
    setTimeout(() => {
      pendingSyncs.delete(key)
      void syncToCloud(key)
    }, SYNC_DEBOUNCE_MS)
  )
}

export function flushPendingSyncs() {
  for (const [key, timer] of pendingSyncs) {
    clearTimeout(timer)
    pendingSyncs.delete(key)
    void syncToCloud(key)
  }
}

function cancelPendingSyncs() {
  for (const timer of pendingSyncs.values()) clearTimeout(timer)
  pendingSyncs.clear()
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushPendingSyncs)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushPendingSyncs()
  })
}

async function syncToCloud(key: string) {
  const userId = getUserId()
  if (!userId) return

  const { supabase } = await import("./supabase")
  if (!supabase) return

  const table = TABLE_MAP[key]
  if (!table) return

  const value = readStore<unknown>(key, null)
  if (value === null) return

  const timestamp = localStorage.getItem(`${key}_ts`) || new Date().toISOString()

  const { error } = await supabase.from(table).upsert(
    { user_id: userId, data: value, updated_at: timestamp },
    { onConflict: "user_id" }
  )
  if (error) console.error("syncToCloud failed", key, error.message)
}

export type DownloadResult = "updated" | "unchanged" | "local-newer" | "error"

export async function downloadFromCloud(key: string): Promise<DownloadResult> {
  const userId = getUserId()
  if (!userId) return "error"

  const { supabase } = await import("./supabase")
  if (!supabase) return "error"

  const table = TABLE_MAP[key]
  if (!table) return "error"

  const { data, error } = await supabase
    .from(table)
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("downloadFromCloud failed", key, error.message)
    return "error"
  }

  // Nothing in the cloud yet: local data (if any) should be uploaded
  if (data?.data === undefined || data?.data === null) return "local-newer"

  const localTs = localStorage.getItem(`${key}_ts`) || ""
  const cloudTs = data.updated_at || ""

  if (pendingSyncs.has(key) || (localTs && cloudTs && cloudTs < localTs)) return "local-newer"

  const newStr = JSON.stringify(data.data)
  if (localStorage.getItem(key) === newStr) return "unchanged"

  localStorage.setItem(key, newStr)
  if (cloudTs) localStorage.setItem(`${key}_ts`, cloudTs)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ph:update"))
  }
  return "updated"
}

export async function uploadToCloud(key: string): Promise<boolean> {
  const userId = getUserId()
  if (!userId) return false

  const { supabase } = await import("./supabase")
  if (!supabase) return false

  const table = TABLE_MAP[key]
  if (!table) return false

  const local = readStore<unknown>(key, null)
  if (local === null || local === undefined) return false

  // Never upload empty arrays as "first sync" if cloud might exist —
  // caller should only upload when local has meaningful data
  if (Array.isArray(local) && local.length === 0) return false

  const timestamp = new Date().toISOString()
  localStorage.setItem(`${key}_ts`, timestamp)

  const { error } = await supabase.from(table).upsert(
    { user_id: userId, data: local, updated_at: timestamp },
    { onConflict: "user_id" }
  )
  if (error) {
    console.error("uploadToCloud failed", key, error.message)
    return false
  }
  return true
}

export function clearLocalUserData(): void {
  cancelPendingSyncs()
  for (const key of ALL_KEYS) {
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}_ts`)
  }
  for (const key of LOCAL_ONLY_KEYS) {
    localStorage.removeItem(key)
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ph:update"))
  }
}

/* ─── Backup / Restore / Reset ─── */

export function exportAllData(): string {
  const snapshot: Record<string, unknown> = {}
  for (const key of ALL_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        snapshot[key] = JSON.parse(raw)
      } catch {
        /* skip corrupt */
      }
    }
  }
  snapshot._exportedAt = new Date().toISOString()
  snapshot._version = "personalhub-backup-v1"
  return JSON.stringify(snapshot, null, 2)
}

export function downloadBackup() {
  const json = exportAllData()
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `personalhub-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function isValidBackupValue(key: string, value: unknown): boolean {
  if (key === "ph_event_completed") {
    return value !== null && typeof value === "object" && !Array.isArray(value)
  }
  return Array.isArray(value)
}

export async function importBackup(jsonString: string): Promise<number> {
  const data = JSON.parse(jsonString)
  if (data._version !== "personalhub-backup-v1") {
    throw new Error("Archivo de backup no válido")
  }
  let count = 0
  for (const key of ALL_KEYS) {
    if (data[key] !== undefined && isValidBackupValue(key, data[key])) {
      writeStore(key, data[key])
      count++
    }
  }
  window.dispatchEvent(new Event("ph:update"))
  return count
}

export async function uploadAllToCloud(): Promise<number> {
  let count = 0
  for (const key of ALL_KEYS) {
    const ok = await uploadToCloud(key)
    if (ok) count++
  }
  return count
}

export async function resetAllData(): Promise<void> {
  const userId = getUserId()
  cancelPendingSyncs()

  for (const key of ALL_KEYS) {
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}_ts`)
  }
  for (const key of LOCAL_ONLY_KEYS) {
    localStorage.removeItem(key)
  }

  if (userId) {
    const { supabase } = await import("./supabase")
    if (supabase) {
      for (const key of ALL_KEYS) {
        const table = TABLE_MAP[key]
        if (table) {
          await supabase.from(table).delete().eq("user_id", userId)
        }
      }
    }
  }

  window.dispatchEvent(new Event("ph:update"))
}
