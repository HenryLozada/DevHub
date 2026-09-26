import { useState, useEffect, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "motion/react"
import { GlobalNav, TABS, type TabId } from "@/components/global-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthProvider, useAuth } from "@/lib/auth-store"
import { AuthScreen } from "@/components/auth/AuthScreen"
import { UserMenu } from "@/components/auth/UserMenu"
import { PwaBootstrap } from "@/components/pwa-bootstrap"
import { Toaster } from "sileo"
import { getSpaceFx, SPACE_FX_EVENT } from "@/lib/space-fx"

const CashflowCalendar = lazy(() => import("@/components/cashflow-calendar").then(m => ({ default: m.CashflowCalendar })))
const BudgetedApp = lazy(() => import("@/components/budgeted/index").then(m => ({ default: m.BudgetedApp })))
const ChoresApp = lazy(() => import("@/components/chores/index").then(m => ({ default: m.ChoresApp })))
const DevHubApp = lazy(() => import("@/components/devhub/index").then(m => ({ default: m.DevHubApp })))
const PlaygroundPanel = lazy(() => import("@/components/playground/PlaygroundPanel").then(m => ({ default: m.PlaygroundPanel })))
const SpaceBackground = lazy(() => import("@/components/space-background").then(m => ({ default: m.SpaceBackground })))
const DevBot = lazy(() => import("@/components/devbot").then(m => ({ default: m.DevBot })))

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-6 h-6 border-2 border-[#76b900] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppInner() {
  const { user, loading, syncVersion } = useAuth()
  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    try {
      const saved = localStorage.getItem("ph_active_tab") as TabId | null
      return saved && TABS.some((t) => t.id === saved) ? saved : "calendar"
    } catch {
      return "calendar"
    }
  })
  // +1 when moving right in the tab order, -1 when moving left (drives the slide direction)
  const [direction, setDirection] = useState(1)
  const setActiveTab = (next: TabId) => {
    const idx = (id: TabId) => TABS.findIndex((t) => t.id === id)
    setDirection(idx(next) >= idx(activeTab) ? 1 : -1)
    setActiveTabState(next)
    try {
      localStorage.setItem("ph_active_tab", next)
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 })
  }
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [spaceFx, setSpaceFxState] = useState(true)

  useEffect(() => {
    const sync = () => setSpaceFxState(getSpaceFx())
    sync()
    window.addEventListener(SPACE_FX_EVENT, sync)
    return () => window.removeEventListener(SPACE_FX_EVENT, sync)
  }, [])

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light"
    setTheme(nextTheme)
    localStorage.setItem("theme", nextTheme)
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const backdrop = theme === "dark" && spaceFx ? (
    <Suspense fallback={null}>
      <SpaceBackground />
    </Suspense>
  ) : null

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        {backdrop}
        <motion.div
          animate={{ rotate: [0, 90, 180, 270, 360], borderRadius: ["30%", "50%", "30%", "50%", "30%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="size-10 bg-gradient-to-br from-[#76b900] to-[#b6f03a] shadow-[0_0_30px_rgba(118,185,0,0.5)]"
        />
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">Cargando</p>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {backdrop}
        <AuthScreen />
      </>
    )
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen flex flex-col text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {backdrop}
      <GlobalNav activeTab={activeTab} onTabChange={setActiveTab} theme={theme} onToggleTheme={toggleTheme} rightSlot={<UserMenu />} />

      <main className="flex-1 overflow-x-clip pb-20 md:pb-0">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`${activeTab}-${syncVersion}`}
            custom={direction}
            variants={{
              // No filter/lingering transform: they would break sticky headers and fixed modals inside
              enter: (d: number) => ({ opacity: 0, x: 24 * d }),
              center: { opacity: 1, x: 0, transitionEnd: { transform: "none" } },
              exit: (d: number) => ({ opacity: 0, x: -24 * d }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense fallback={<ModuleLoader />}>
              {activeTab === "calendar" ? (
                <CashflowCalendar />
              ) : activeTab === "budgeted" ? (
                <BudgetedApp />
              ) : activeTab === "chores" ? (
                <ChoresApp />
              ) : activeTab === "devhub" ? (
                <DevHubApp />
              ) : (
                <PlaygroundPanel />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Toaster position="top-center" offset={80} theme="system" />
      <PwaBootstrap />
      <Suspense fallback={null}>
        <DevBot />
      </Suspense>
    </div>
    </ErrorBoundary>
  )
}

export function AppShell() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
