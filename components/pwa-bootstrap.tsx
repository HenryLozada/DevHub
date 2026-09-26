import { useEffect, useState } from "react"
import { Download, Bell, X } from "lucide-react"
import {
  registerServiceWorker,
  captureInstallPrompt,
  promptInstallPWA,
  isStandalone,
  enableNotifications,
  getNotificationPref,
  pushScheduleToServiceWorker,
  isNotificationSupported,
} from "@/lib/notifications"
import { sileo } from "sileo"

export function PwaBootstrap() {
  const [showInstall, setShowInstall] = useState(false)
  const [installReady, setInstallReady] = useState(false)

  useEffect(() => {
    void registerServiceWorker()

    const onBip = (e: Event) => {
      captureInstallPrompt(e)
      setInstallReady(true)
      if (!isStandalone() && !sessionStorage.getItem("ph_install_dismissed")) {
        setShowInstall(true)
      }
    }
    window.addEventListener("beforeinstallprompt", onBip)

    const onAvail = () => setInstallReady(true)
    window.addEventListener("ph:install-available", onAvail)

    const canNotify = () =>
      isNotificationSupported() && getNotificationPref() && Notification.permission === "granted"

    if (canNotify()) void pushScheduleToServiceWorker()

    // Coalesce bursts of ph:update (sync, bulk edits) into one reschedule
    let debounce: number | undefined
    const onUpdate = () => {
      window.clearTimeout(debounce)
      debounce = window.setTimeout(() => {
        if (canNotify()) void pushScheduleToServiceWorker()
      }, 1_000)
    }
    window.addEventListener("ph:update", onUpdate)
    // Periodic refresh also keeps the service worker (and its timers) alive while the app is open
    const interval = window.setInterval(onUpdate, 60_000)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip)
      window.removeEventListener("ph:install-available", onAvail)
      window.removeEventListener("ph:update", onUpdate)
      clearInterval(interval)
      window.clearTimeout(debounce)
    }
  }, [])

  const handleInstall = async () => {
    const result = await promptInstallPWA()
    if (result === "accepted") {
      sileo.success({ title: "App instalada", description: "PersonalHub se abrirá sin el navegador." })
      setShowInstall(false)
    } else if (result === "unavailable") {
      sileo.info({
        title: "Cómo instalar",
        description: "En Chrome: menú ⋮ → Instalar app / Añadir a pantalla de inicio.",
      })
    }
  }

  const handleEnableNotifs = async () => {
    const perm = await enableNotifications()
    if (perm === "granted") {
      sileo.success({ title: "Notificaciones activas", description: "Te avisaremos de tareas y eventos." })
    } else if (perm === "denied") {
      sileo.error({ title: "Permiso denegado", description: "Actívalas en ajustes del sistema." })
    } else if (perm === "unsupported") {
      sileo.error({ title: "No soportado", description: "Este navegador no permite notificaciones." })
    }
  }

  if (isStandalone() || (!showInstall && !installReady)) return null

  if (!showInstall) return null

  return (
    <div className="fixed bottom-4 left-3 right-3 md:left-auto md:right-6 md:w-96 z-[80] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/70 dark:backdrop-blur-xl shadow-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Instalar PersonalHub
          </p>
          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
            Se abre como app nativa: sin barra de URL ni pestañas. Ideal para compartir con amigos.
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.setItem("ph_install_dismissed", "1")
            setShowInstall(false)
          }}
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 flex items-center justify-center gap-2 bg-[#76b900] text-black font-mono text-[11px] font-bold uppercase tracking-wider py-2.5 cursor-pointer hover:bg-[#86cb10]"
        >
          <Download className="w-3.5 h-3.5" /> Instalar app
        </button>
        {isNotificationSupported() && (
          <button
            onClick={handleEnableNotifs}
            className="flex-1 flex items-center justify-center gap-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-bold uppercase tracking-wider py-2.5 cursor-pointer hover:border-[#76b900] hover:text-[#76b900]"
          >
            <Bell className="w-3.5 h-3.5" /> Notificaciones
          </button>
        )}
      </div>
    </div>
  )
}
