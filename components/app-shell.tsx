import { useState, useEffect } from "react"
import { CashflowCalendar } from "@/components/cashflow-calendar"
import { BudgetedApp } from "@/components/budgeted/index"
import { ChoresApp } from "@/components/chores/index"
import { DevHubApp } from "@/components/devhub/index"
import { GlobalNav } from "@/components/global-nav"
import { DevBot } from "@/components/devbot"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "sileo"

export function AppShell() {
  const [activeTab, setActiveTab] = useState<"calendar" | "budgeted" | "chores" | "devhub">("calendar")
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

  return (
    <ErrorBoundary>
    <div className="min-h-screen flex flex-col bg-[#fafafc] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <GlobalNav activeTab={activeTab} onTabChange={setActiveTab} theme={theme} onToggleTheme={toggleTheme} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === "calendar" ? (
          <div className="animate-in fade-in duration-300">
            <CashflowCalendar />
          </div>
        ) : activeTab === "budgeted" ? (
          <div className="animate-in fade-in duration-300">
            <BudgetedApp />
          </div>
        ) : activeTab === "chores" ? (
          <div className="animate-in fade-in duration-300">
            <ChoresApp />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <DevHubApp />
          </div>
        )}
      </main>
      <Toaster position="bottom-right" offset={16} theme="system" />
      <DevBot />
    </div>
    </ErrorBoundary>
  )
}
