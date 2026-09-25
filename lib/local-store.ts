import { isEntityList, mergeValues, removedIds, stampChanges } from "./sync-merge"

const TABLE_MAP: Record<string, string> = {
  cashflow_rules: "cashflow_rules",
  personal_events_v2: "personal_events",
  ph_event_completed: "event_completed",
  ph_chores_chores: "chores",
  ph_budgeted_expenses: "expenses",
  ph_devhub_items: "devhub_items",
  ph_devbot_history: "devbot_history",
  ph_devhub_vault: "devhub_vault",
}

const ALL_KEYS = Object.keys(TABLE_MAP)
const SYNC_META_SUFFIXES = ["_ts", "_seen", "_tomb"]

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
  const synced = key in TABLE_MAP
  const prevRaw = localStorage.getItem(key)
  let prev: unknown = null
  try {
    prev = prevRaw ? JSON.parse(prevRaw) : null
  } catch {
    /* corrupt previous value: overwrite */
  }
  const next = synced ? stampChanges(prev, value, new Date().toISOString()) : value
  const raw = JSON.stringify(next)
  if (raw === prevRaw) return

  try {
    localStorage.setItem(key, raw)
  } catch (e) {
    console.error("localStorage write failed", key, e)
    return
  }
  if (synced) {
    const removed = removedIds(prev, next)
    if (removed.length) writeIdSet(`${key}_tomb`, new Set([...readIdSet(`${key}_tomb`), ...removed]))
  }
  // Avoid feedback loops: callers that mirror React state should pass emit:false
  // or rely on the default only when other modules need a refresh.
  if (opts?.emit !== false && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ph:update", { detail: { key } }))
  }
  scheduleSync(key)
}

function readIdSet(key: string): Set<string> {
  const ids = readStore<unknown>(key, [])
  return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [])
}

function writeIdSet(key: string, ids: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...ids]))
}

// Debounce cloud syncs per key so rapid edits (typing, drag) produce a single round-trip
const SYNC_DEBOUNCE_MS = 800
const pendingSyncs = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleSync(key: string) {
  if (!TABLE_MAP[key] || !getUserId()) return
  localStorage.setItem(`${key}_ts`, new Date().toISOString())
  const prev = pendingSyncs.get(key)
  if (prev) clearTimeout(prev)
  pendingSyncs.set(
    key,
    setTimeout(() => {
      pendingSyncs.delete(key)
      void reconcile(key)
    }, SYNC_DEBOUNCE_MS)
  )
}

export function flushPendingSyncs() {
  for (const [key, timer] of pendingSyncs) {
    clearTimeout(timer)
    pendingSyncs.delete(key)
    void reconcile(key)
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

export type SyncResult = "updated" | "unchanged" | "error"

const inFlight = new Map<string, Promise<SyncResult>>()

/**
 * Two-way sync of one key: fetches the cloud copy, merges it with the local one
 * (per item for lists, see lib/sync-merge.ts), stores the result locally and uploads it if the
 * cloud differs. Returns "updated" when local data changed.
 */
export function reconcile(key: string): Promise<SyncResult> {
  const running = inFlight.get(key)
  if (running) return running.then(() => reconcile(key))
  const task = doReconcile(key).finally(() => inFlight.delete(key))
  inFlight.set(key, task)
  return task
}

async function doReconcile(key: string): Promise<SyncResult> {
  const userId = getUserId()
  const table = TABLE_MAP[key]
  if (!userId || !table) return "error"

  // This sync covers any edit still waiting in the debounce window
  const pending = pendingSyncs.get(key)
  if (pending) {
    clearTimeout(pending)
    pendingSyncs.delete(key)
  }

  const { supabase } = await import("./supabase")
  if (!supabase) return "error"

  const { data, error } = await supabase
    .from(table)
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle()
  if (error) {
    console.error("sync download failed", key, error.message)
    return "error"
  }

  // A local edit landed while we were waiting: let its own debounced sync handle it
  if (pendingSyncs.has(key)) return "unchanged"

  const localRaw = localStorage.getItem(key)
  const local = readStore<unknown>(key, null)
  const cloud = data?.data ?? null
  const merged = mergeValues(local, cloud, {
    localTs: localStorage.getItem(`${key}_ts`) || "",
    cloudTs: data?.updated_at || "",
    seen: readIdSet(`${key}_seen`),
    tomb: readIdSet(`${key}_tomb`),
  })
  if (merged == null) return "unchanged"

  const mergedRaw = JSON.stringify(merged)
  const localChanged = mergedRaw !== localRaw
  if (localChanged) localStorage.setItem(key, mergedRaw)

  let cloudTs = data?.updated_at || ""
  if (mergedRaw !== JSON.stringify(cloud)) {
    cloudTs = new Date().toISOString()
    const { error: upErr } = await supabase
      .from(table)
      .upsert({ user_id: userId, data: merged, updated_at: cloudTs }, { onConflict: "user_id" })
    if (upErr) {
      console.error("sync upload failed", key, upErr.message)
      if (localChanged) window.dispatchEvent(new Event("ph:update"))
      return "error"
    }
  }

  if (cloudTs) localStorage.setItem(`${key}_ts`, cloudTs)
  if (isEntityList(merged)) writeIdSet(`${key}_seen`, new Set(merged.map((e) => e.id)))
  localStorage.removeItem(`${key}_tomb`)

  if (localChanged) {
    window.dispatchEvent(new Event("ph:update"))
    return "updated"
  }
  return "unchanged"
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
  if (isEntityList(local)) writeIdSet(`${key}_seen`, new Set(local.map((e) => e.id)))
  localStorage.removeItem(`${key}_tomb`)
  return true
}

export function clearLocalUserData(): void {
  cancelPendingSyncs()
  for (const key of ALL_KEYS) {
    localStorage.removeItem(key)
    for (const suffix of SYNC_META_SUFFIXES) localStorage.removeItem(`${key}${suffix}`)
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
  if (key === "ph_event_completed" || key === "ph_devhub_vault") {
    return value !== null && typeof value === "object" && !Array.isArray(value)
  }
  return isEntityList(value)
}

const MAX_BACKUP_BYTES = 5 * 1024 * 1024

export async function importBackup(jsonString: string): Promise<number> {
  if (jsonString.length > MAX_BACKUP_BYTES) throw new Error("El backup es demasiado grande")
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
    for (const suffix of SYNC_META_SUFFIXES) localStorage.removeItem(`${key}${suffix}`)
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
