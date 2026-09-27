import { Calendar as IoCalendarOutline, Wallet, CheckCircle2, Terminal, Puzzle, Sun, Moon } from "lucide-react"
import { motion } from "motion/react"
import { useNavBadges } from "@/lib/nav-badges"
import { CountUp } from "@/components/ui/count-up"
import { cn } from "@/lib/utils"

export type TabId = "calendar" | "budgeted" | "chores" | "devhub" | "playground"

interface GlobalNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  theme: "light" | "dark"
  onToggleTheme: () => void
  rightSlot?: React.ReactNode
}

export const TABS = [
  { id: "calendar" as const, label: "Calendario", short: "Agenda", icon: IoCalendarOutline },
  { id: "budgeted" as const, label: "Gastos", short: "Gastos", icon: Wallet },
  { id: "chores" as const, label: "Tareas", short: "Tareas", icon: CheckCircle2 },
  { id: "devhub" as const, label: "DevHub", short: "DevHub", icon: Terminal },
  { id: "playground" as const, label: "Playground", short: "Lab", icon: Puzzle },
]

const SPRING = { type: "spring", stiffness: 500, damping: 38 } as const

export function GlobalNav({ activeTab, onTabChange, theme, onToggleTheme, rightSlot }: GlobalNavProps) {
  const badges = useNavBadges()
  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <motion.div
                whileHover={{ rotate: -8, scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                className="relative flex h-9 w-9 select-none items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-hi shadow-[0_0_18px_rgba(118,185,0,0.45)]"
              >
                <span className="font-mono text-sm font-black tracking-tight text-black">P</span>
              </motion.div>
              <span className="hidden font-bold tracking-tight text-white sm:inline">
                Personal<span className="text-brand-gradient">Hub</span>
              </span>
            </div>

            {/* Tabs (desktop / tablet) */}
            <div className="relative hidden h-full items-center gap-1 md:flex">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id
                return (
                  <button
                    key={id}
                    onClick={() => onTabChange(id)}
                    className={cn(
                      "relative flex h-9 shrink-0 cursor-pointer select-none items-center gap-f8 rounded-full px-f13 font-mono text-xs uppercase tracking-wider transition-colors",
                      active ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                    )}
                  >
                    {active && (
                      <motion.span layoutId="nav-line" transition={SPRING}
                        className="absolute inset-x-f13 -bottom-[14px] h-[2px] bg-brand" />
                    )}
                    <Icon className={cn("relative size-3.5", active && "text-brand")} />
                    <span className="relative">{label}</span>
                    <NavBadge n={badges[id]} active={active} />
                  </button>
                )
              })}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3">
              {rightSlot}
              <motion.button
                whileTap={{ scale: 0.9, rotate: 20 }}
                onClick={onToggleTheme}
                className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:border-brand/50 hover:text-brand-hi"
                title="Cambiar tema"
                aria-label="Cambiar tema"
              >
                <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} className="block">
                  {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                </motion.span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom tab bar (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5">
          {TABS.map(({ id, short, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                aria-label={short}
                className={cn(
                  "relative flex cursor-pointer select-none flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                  active ? "text-brand-hi" : "text-zinc-500"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-glow"
                    transition={SPRING}
                    className="absolute inset-x-f13 top-0 h-px bg-gradient-to-r from-transparent via-brand-hi to-transparent"
                  />
                )}
                <motion.span animate={{ scale: active ? 1.15 : 1, y: active ? -1 : 0 }} transition={SPRING} className="relative">
                  <Icon className="size-5" />
                  {!!badges[id] && (
                    <span className="absolute -right-f8 -top-f5 min-w-[15px] rounded-full bg-brand px-[3px] text-center font-mono text-[9px] leading-[15px] text-black tabular-nums">{badges[id]}</span>
                  )}
                </motion.span>
                {short}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}

/** Contador de pendientes de hoy, con los números animados de la app */
function NavBadge({ n, active }: { n?: number; active: boolean }) {
  if (!n) return null
  return (
    <span className={cn("relative font-mono text-[10px] tabular-nums", active ? "text-brand" : "text-zinc-500")}>
      <CountUp value={n} />
    </span>
  )
}
