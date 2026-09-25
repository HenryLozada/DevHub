export type ScheduledNotification = {
  id: string
  title: string
  body?: string
  at: number
  url?: string
}

const PREF_KEY = "ph_notifications_enabled"

/** Injected at build time (astro.config.mjs) so every deploy gets a fresh service worker cache */
declare const __BUILD_ID__: string

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator
}

export function getNotificationPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === "1"
  } catch {
    return false
  }
}

export function setNotificationPref(enabled: boolean): void {
  localStorage.setItem(PREF_KEY, enabled ? "1" : "0")
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register(`/sw.js?v=${__BUILD_ID__}`, { scope: "/" })
    return reg
  } catch (e) {
    console.error("SW register failed", e)
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied"
  if (Notification.permission === "granted") {
    setNotificationPref(true)
    return "granted"
  }
  const result = await Notification.requestPermission()
  setNotificationPref(result === "granted")
  return result
}

function parseLocalDateTime(dateStr: string, timeStr?: string): number | null {
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return null
  let hh = 9
  let mm = 0
  if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, min] = timeStr.split(":").map(Number)
    hh = h
    mm = min
  }
  return new Date(y, m - 1, d, hh, mm, 0, 0).getTime()
}

export function buildScheduleFromStores(): ScheduledNotification[] {
  const items: ScheduledNotification[] = []
  const now = Date.now()
  const horizon = now + 1000 * 60 * 60 * 24 * 7

  try {
    const chores = JSON.parse(localStorage.getItem("ph_chores_chores") || "[]")
    if (Array.isArray(chores)) {
      for (const c of chores) {
        if (!c?.id || c.status === "done" || !c.dueDate) continue
        const at = parseLocalDateTime(c.dueDate, "09:00")
        if (!at || at < now || at > horizon) continue
        items.push({
          id: `chore-${c.id}-${c.dueDate}`,
          title: c.title || "Tarea pendiente",
          body: c.description || "Recordatorio de tarea en PersonalHub",
          at,
          url: "/?tab=chores",
        })
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const events = JSON.parse(localStorage.getItem("personal_events_v2") || "[]")
    if (Array.isArray(events)) {
      const today = new Date()
      for (let offset = 0; offset < 7; offset++) {
        const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)
        const y = day.getFullYear()
        const m = day.getMonth()
        const d = day.getDate()
        const dateKey = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        const dow = day.getDay()

        for (const ev of events) {
          if (!ev?.id || !ev.nombre) continue
          let matches = false
          if (ev.recurrencia === "unico" && ev.fechaUnica === dateKey) matches = true
          else if (ev.recurrencia === "diario") matches = true
          else if (ev.recurrencia === "dias_laborales" && dow >= 1 && dow <= 5) matches = true
          else if (ev.recurrencia === "semanal" && Array.isArray(ev.diasSemana) && ev.diasSemana.includes(dow)) matches = true
          else if (ev.recurrencia === "mensual" && Number(ev.diaDelMes) === d) matches = true
          else if (ev.recurrencia === "anual" && Number(ev.mesDelAño) === m && Number(ev.diaDelMes) === d) matches = true

          if (!matches) continue
          const at = parseLocalDateTime(dateKey, ev.horaInicio || "09:00")
          if (!at || at < now || at > horizon) continue

          items.push({
            id: `event-${ev.id}-${dateKey}`,
            title: ev.nombre,
            body: ev.nota || `Evento · ${ev.horaInicio || "todo el día"}`,
            at,
            url: "/?tab=calendar",
          })
        }
      }
    }
  } catch {
    /* ignore */
  }

  return items.sort((a, b) => a.at - b.at).slice(0, 80)
}

export async function pushScheduleToServiceWorker(items?: ScheduledNotification[]): Promise<void> {
  if (!getNotificationPref() || Notification.permission !== "granted") return
  const reg = await navigator.serviceWorker.ready
  const list = items ?? buildScheduleFromStores()
  reg.active?.postMessage({ type: "SCHEDULE_NOTIFICATIONS", items: list })
}

export async function clearScheduledNotifications(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration()
  reg?.active?.postMessage({ type: "CLEAR_NOTIFICATIONS" })
}

export async function enableNotifications(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported"
  await registerServiceWorker()
  const perm = await requestNotificationPermission()
  if (perm === "granted") await pushScheduleToServiceWorker()
  return perm
}

export async function disableNotifications(): Promise<void> {
  setNotificationPref(false)
  await clearScheduledNotifications()
}

/** Install prompt helpers */
let deferredInstall: any = null

export function captureInstallPrompt(e: Event): void {
  e.preventDefault()
  deferredInstall = e
  window.dispatchEvent(new Event("ph:install-available"))
}

export function canInstallPWA(): boolean {
  return Boolean(deferredInstall)
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  )
}

export async function promptInstallPWA(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferredInstall) return "unavailable"
  deferredInstall.prompt()
  const choice = await deferredInstall.userChoice
  deferredInstall = null
  return choice?.outcome === "accepted" ? "accepted" : "dismissed"
}
