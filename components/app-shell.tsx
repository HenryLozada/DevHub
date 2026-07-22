import { useState, useEffect, lazy, Suspense } from "react"
import { motion } from "motion/react"
import { GlobalNav } from "@/components/global-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthProvider, useAuth } from "@/lib/auth-store"
import { AuthScreen } from "@/components/auth/AuthScreen"
import { UserMenu } from "@/components/auth/UserMenu"
import { Toaster } from "sileo"

const CashflowCalendar = lazy(() => import("@/components/cashflow-calendar").then(m => ({ default: m.CashflowCalendar })))
const BudgetedApp = lazy(() => import("@/components/budgeted/index").then(m => ({ default: m.BudgetedApp })))
const ChoresApp = lazy(() => import("@/components/chores/index").then(m => ({ default: m.ChoresApp })))
const DevHubApp = lazy(() => import("@/components/devhub/index").then(m => ({ default: m.DevHubApp })))
const PlaygroundPanel = lazy(() => import("@/components/playground/PlaygroundPanel").then(m => ({ default: m.PlaygroundPanel })))
const DevBot = lazy(() => import("@/components/devbot").then(m => ({ default: m.DevBot })))

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-6 h-6 border-2 border-[#76b900] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppInner() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<"calendar" | "budgeted" | "chores" | "devhub" | "playground">("calendar")
  const [theme, setTheme] = useState<"light" | "dark">("light")

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafc] dark:bg-[#000000] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#76b900] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen flex flex-col bg-[#fafafc] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <GlobalNav activeTab={activeTab} onTabChange={setActiveTab} theme={theme} onToggleTheme={toggleTheme} rightSlot={<UserMenu />} />

      <main className="flex-1">
        <Suspense fallback={<ModuleLoader />}>
          {activeTab === "calendar" ? (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <CashflowCalendar />
            </motion.div>
          ) : activeTab === "budgeted" ? (
            <motion.div key="budgeted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <BudgetedApp />
            </motion.div>
          ) : activeTab === "chores" ? (
            <motion.div key="chores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <ChoresApp />
            </motion.div>
          ) : activeTab === "devhub" ? (
            <motion.div key="devhub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <DevHubApp />
            </motion.div>
          ) : (
            <motion.div key="playground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <PlaygroundPanel />
            </motion.div>
          )}
        </Suspense>
      </main>
      <Toaster position="bottom-right" offset={16} theme="system" />
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
