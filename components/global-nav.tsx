import { Calendar as IoCalendarOutline, Wallet, CheckCircle2, Terminal, Puzzle, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

interface GlobalNavProps {
  activeTab: "calendar" | "budgeted" | "chores" | "devhub" | "playground"
  onTabChange: (tab: "calendar" | "budgeted" | "chores" | "devhub" | "playground") => void
  theme: "light" | "dark"
  onToggleTheme: () => void
  rightSlot?: React.ReactNode
}

const TABS = [
  { id: "calendar" as const, label: "Calendario", icon: IoCalendarOutline },
  { id: "budgeted" as const, label: "Gastos", icon: Wallet },
  { id: "chores" as const, label: "Tareas", icon: CheckCircle2 },
  { id: "devhub" as const, label: "DevHub", icon: Terminal },
  { id: "playground" as const, label: "Playground", icon: Puzzle },
]

export function GlobalNav({ activeTab, onTabChange, theme, onToggleTheme, rightSlot }: GlobalNavProps) {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 flex items-center justify-center relative select-none">
              <div className="absolute top-0 left-0 w-2 h-2 bg-[#76b900]" />
              <span className="text-[#76b900] font-bold font-mono text-sm tracking-tight">P</span>
            </div>
            <span className="font-bold text-white tracking-tight hidden sm:inline">PersonalHub</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center h-full overflow-x-auto no-scrollbar gap-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={cn(
                  "relative flex items-center gap-1.5 h-full px-2.5 md:px-4 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer select-none shrink-0",
                  activeTab === id
                    ? "text-[#76b900]"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon className="size-3 md:size-3.5" />
                <span className="hidden md:inline">{label}</span>
                {activeTab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#76b900]" />
                )}
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {rightSlot}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
              title="Cambiar tema"
              aria-label="Cambiar tema"
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
            <span className="hidden sm:block text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 select-none">
              v1.0
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}
