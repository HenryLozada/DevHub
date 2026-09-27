import { useState } from "react"
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isToday, addMonths, subMonths,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Chore } from "../types"

const COLOR_BG: Record<string, string> = {
  violet: "bg-violet/10 text-violet dark:bg-violet/30 dark:text-violet border-violet/30 dark:border-violet/30",
  emerald: "bg-pos/10 text-pos dark:bg-pos/30 dark:text-pos border-pos/30 dark:border-pos/30",
  sky: "bg-info/10 text-info dark:bg-info/30 dark:text-info border-info/30 dark:border-info/30",
  amber: "bg-warn/10 text-warn dark:bg-warn/30 dark:text-warn border-warn/30 dark:border-warn/30",
  rose: "bg-neg/10 text-neg dark:bg-neg/30 dark:text-neg border-neg/30 dark:border-neg/30",
  teal: "bg-cyan/10 text-cyan dark:bg-cyan/30 dark:text-cyan border-cyan/30 dark:border-cyan/30",
}

interface CalendarViewProps {
  chores: Chore[]
  onEdit: (c: Chore) => void
  onToggle: (c: Chore) => void
}

export function CalendarView({ chores, onToggle }: CalendarViewProps) {
  const [current, setCurrent] = useState(new Date())
  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) })

  function getChoresForDay(day: Date) {
    return chores.filter((c) => {
      if (!c.dueDate) return false
      const [y, m, d] = c.dueDate.split("-").map(Number)
      return isSameDay(new Date(y, m - 1, d), day)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrent(subMonths(current, 1))}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
          <ChevronLeft className="w-4 h-4 text-zinc-500" />
        </button>
        <h3 className="font-bold text-zinc-950 dark:text-white uppercase font-mono text-xs tracking-wider">
          {format(current, "MMMM yyyy", { locale: es })}
        </h3>
        <button onClick={() => setCurrent(addMonths(current, 1))}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
          <ChevronRightIcon className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
          <div key={d} className="bg-zinc-50 dark:bg-zinc-900 py-2 text-center font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{d}</div>
        ))}
        {days.map((day, i) => {
          const dayChores = getChoresForDay(day)
          const inMonth = day.getMonth() === current.getMonth()
          const today = isToday(day)
          return (
            <div key={i} className={cn("bg-white dark:bg-zinc-950/70 dark:backdrop-blur-xl p-2 min-h-[80px]", !inMonth && "opacity-40")}>
              <p className={cn("text-xs font-mono font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-lg select-none",
                today ? "bg-brand text-black" : "text-zinc-500 dark:text-zinc-400")}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {dayChores.slice(0, 3).map((c) => (
                  <button key={c.id} onClick={() => onToggle(c)}
                    className={cn("w-full text-left font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-lg truncate border transition-all",
                      c.status === "done" ? "opacity-50 line-through" : "",
                      COLOR_BG[c.color ?? "violet"] ?? COLOR_BG.violet)}>
                    {c.title}
                  </button>
                ))}
                {dayChores.length > 3 && (
                  <p className="font-mono text-[9px] text-zinc-400 pl-1">+{dayChores.length - 3} MÁS</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
