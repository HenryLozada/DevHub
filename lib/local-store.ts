const TABLE_MAP: Record<string, string> = {
  cashflow_rules: "cashflow_rules",
  personal_events_v2: "personal_events",
  ph_chores_chores: "chores",
  ph_budgeted_expenses: "expenses",
  ph_devhub_items: "devhub_items",
  ph_devbot_history: "devbot_history",
}

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

  await supabase.from(table).upsert(
    { user_id: userId, data: JSON.parse(JSON.stringify(value)) },
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
    .select("data")
    .eq("user_id", userId)
    .single()

  if (data?.data) {
    const existing = localStorage.getItem(key)
    const newStr = JSON.stringify(data.data)
    if (existing !== newStr) {
      localStorage.setItem(key, newStr)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ph:update"))
      }
      return true
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

  await supabase.from(table).upsert(
    { user_id: userId, data: local },
    { onConflict: "user_id" }
  )
  return true
}
