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

export function writeStore(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error("localStorage write failed", key, e)
    return
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ph:update"))
  }
  void syncToCloud(key, value)
}

async function syncToCloud(key: string, value: unknown) {
  const userId = getUserId()
  if (!userId) return

  const { supabase } = await import("./supabase")
  if (!supabase) return

  const table = TABLE_MAP[key]
  if (!table) return

  const timestamp = new Date().toISOString()
  localStorage.setItem(`${key}_ts`, timestamp)

  const { error } = await supabase.from(table).upsert(
    { user_id: userId, data: JSON.parse(JSON.stringify(value)), updated_at: timestamp },
    { onConflict: "user_id" }
  )
  if (error) console.error("syncToCloud failed", key, error.message)
}

export async function downloadFromCloud(key: string): Promise<boolean> {
  const userId = getUserId()
  if (!userId) return false

  const { supabase } = await import("./supabase")
  if (!supabase) return false

  const table = TABLE_MAP[key]
  if (!table) return false

  const { data, error } = await supabase
    .from(table)
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("downloadFromCloud failed", key, error.message)
    return false
  }

  if (data?.data !== undefined && data?.data !== null) {
    const localTs = localStorage.getItem(`${key}_ts`) || ""
    const cloudTs = data.updated_at || ""
    const existing = localStorage.getItem(key)
    const newStr = JSON.stringify(data.data)

    if (!localTs || !cloudTs || cloudTs >= localTs) {
      if (existing !== newStr) {
        localStorage.setItem(key, newStr)
        if (cloudTs) localStorage.setItem(`${key}_ts`, cloudTs)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("ph:update"))
        }
        return true
      }
    }
  }
  return false
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
