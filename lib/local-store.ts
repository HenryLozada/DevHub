const TABLE_MAP: Record<string, string> = {
  cashflow_rules: "cashflow_rules",
  personal_events_v2: "personal_events",
  ph_chores_chores: "chores",
  ph_budgeted_expenses: "expenses",
  ph_devhub_items: "devhub_items",
  ph_devbot_history: "devbot_history",
}

const ALL_KEYS = Object.keys(TABLE_MAP)

function getUserId(): string | null {
  try {
    const raw = sessionStorage.getItem("ph_user_id")
    return raw || null
  } catch { return null }
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
  localStorage.setItem(key, JSON.stringify(value))
  syncToCloud(key, value)
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

  await supabase.from(table).upsert(
    { user_id: userId, data: JSON.parse(JSON.stringify(value)), updated_at: timestamp },
    { onConflict: "user_id" }
  )
}

export async function downloadFromCloud(key: string): Promise<boolean> {
  const userId = getUserId()
  if (!userId) return false

  const { supabase } = await import("./supabase")
  if (!supabase) return false

  const table = TABLE_MAP[key]
  if (!table) return false

  const { data } = await supabase
    .from(table)
    .select("data, updated_at")
    .eq("user_id", userId)
    .single()

  if (data?.data) {
    const localTs = localStorage.getItem(`${key}_ts`) || ""
    const cloudTs = data.updated_at || ""
    const existing = localStorage.getItem(key)
    const newStr = JSON.stringify(data.data)

    // Si la nube es más reciente o si no hay timestamp local pero los datos cambiaron
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

  const local = readStore<any>(key, null)
  if (!local) return false

  const timestamp = new Date().toISOString()
  localStorage.setItem(`${key}_ts`, timestamp)

  await supabase.from(table).upsert(
    { user_id: userId, data: local, updated_at: timestamp },
    { onConflict: "user_id" }
  )
  return true
}

/* ─── Backup / Restore / Reset ─── */

export function exportAllData(): string {
  const snapshot: Record<string, unknown> = {}
  for (const key of ALL_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw) snapshot[key] = JSON.parse(raw)
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

export async function importBackup(jsonString: string): Promise<number> {
  const data = JSON.parse(jsonString)
  if (data._version !== "personalhub-backup-v1") {
    throw new Error("Archivo de backup no válido")
  }
  let count = 0
  for (const key of ALL_KEYS) {
    if (data[key] !== undefined) {
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

  // Limpiar localStorage
  for (const key of ALL_KEYS) {
    localStorage.removeItem(key)
    localStorage.removeItem(`${key}_ts`)
  }

  // Limpiar nube
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
