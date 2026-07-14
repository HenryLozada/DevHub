import {
  type Occurrence,
  WEEKDAYS,
  getMonthGrid,
  isSameDay,
  toDateKey,
} from "@/lib/cashflow"
import { type EventOccurrence, getCategoryMeta } from "@/lib/events"
import { cn } from "@/lib/utils"

interface MonthGridProps {
  year: number
  month: number
  selectedDate: Date
  occByDate: Record<string, Occurrence[]>
  eventsByDate: Record<string, EventOccurrence[]>
  onSelectDate: (date: Date) => void
}

export function MonthGrid({
  year,
  month,
  selectedDate,
  occByDate,
  eventsByDate,
  onSelectDate,
}: MonthGridProps) {
  const days = getMonthGrid(year, month)
  const today = new Date()

  return (
    <div className="flex flex-col overflow-hidden rounded-none backdrop-blur-2xl bg-white/40 dark:bg-zinc-950/40 border border-white/30 dark:border-white/10 shadow-lg shadow-black/10">
      <div className="grid grid-cols-7 border-b border-white/30 dark:border-white/10">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1.5 sm:py-2 text-center text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 select-none"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[minmax(40px,auto)] sm:auto-rows-[minmax(80px,auto)]">
        {days.map((date) => {
          const key = toDateKey(date)
          const inMonth = date.getMonth() === month
          const isToday = isSameDay(date, today)
          const isSelected = isSameDay(date, selectedDate)
          const occs = occByDate[key] ?? []
          const dayEvents = eventsByDate[key] ?? []

          const hasIngreso = occs.some((o) => o.rule.tipo === "ingreso")
          const hasEgreso = occs.some((o) => o.rule.tipo === "egreso")

          const totalItems = occs.length + dayEvents.length
          const displayOccs = occs.slice(0, 2)
          const displayEvents = dayEvents.slice(0, Math.max(0, 2 - displayOccs.length))
          const displayedItems = [
            ...displayOccs.map(o => ({ key: o.rule.id, type: 'finance' as const, label: o.rule.concepto, tipo: o.rule.tipo })),
            ...displayEvents.map(e => ({ key: e.event.id, type: 'event' as const, label: e.event.nombre, categoria: e.event.categoria }))
          ]
          const remainingCount = totalItems - displayedItems.length

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-pressed={isSelected}
              className={cn(
                "group relative flex min-h-[40px] sm:min-h-[80px] lg:min-h-[100px] flex-col gap-0.5 sm:gap-1 border-b border-r border-white/30 dark:border-white/10 p-1 sm:p-1.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#76b900] focus-visible:ring-inset last:border-r-0",
                "hover:bg-white/95 dark:hover:bg-zinc-900/60 hover:shadow-[0_0_30px_-4px_rgba(118,185,0,0.3)] dark:hover:shadow-[0_0_35px_-4px_rgba(118,185,0,0.35)]",
                !inMonth && "bg-zinc-50/30 dark:bg-zinc-900/10 text-zinc-300 dark:text-zinc-700",
                inMonth && "text-zinc-900 dark:text-zinc-100",
                isSelected && "bg-[#76b900]/10 ring-1 ring-[#76b900] z-10",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    "flex size-5 sm:size-7 items-center justify-center rounded-sm text-[10px] sm:text-[13px] font-bold",
                    isToday && "bg-[#76b900] text-black",
                    !isToday && !inMonth && "text-zinc-400 dark:text-zinc-600",
                    !isToday && inMonth && "text-zinc-900 dark:text-zinc-100",
                  )}
                >
                  {date.getDate()}
                </span>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {hasIngreso && (
                    <span className="size-1.5 sm:size-2 rounded-none bg-emerald-500" aria-label="Ingreso" />
                  )}
                  {hasEgreso && (
                    <span className="size-1.5 sm:size-2 rounded-none bg-red-500" aria-label="Egreso" />
                  )}
                </div>
              </div>

              <div className="hidden min-h-0 flex-1 flex-col gap-0.5 sm:gap-1 overflow-hidden sm:flex w-full">
                {displayedItems.map((item) => {
                  if (item.type === "finance") {
                    return (
                      <div
                        key={item.key}
                        className={cn(
                          "flex items-center gap-1 truncate rounded-sm px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] leading-tight font-mono font-bold",
                          item.tipo === "ingreso"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400",
                        )}
                      >
                        <span className="truncate">{item.label}</span>
                      </div>
                    )
                  } else {
                    const meta = getCategoryMeta(item.categoria)
                    return (
                      <div
                        key={item.key}
                        className={cn(
                          "flex items-center gap-1 truncate rounded-sm px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] leading-tight font-mono font-bold",
                          meta.bgLight,
                          meta.textColor,
                          "dark:bg-zinc-800 dark:text-zinc-200"
                        )}
                      >
                        <span className="truncate">{item.label}</span>
                      </div>
                    )
                  }
                })}

                {remainingCount > 0 && (
                  <span className="px-1 text-[8px] sm:text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                    +{remainingCount} más
                  </span>
                )}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
                {Array.from(new Set(dayEvents.map(e => e.event.categoria))).map(cat => (
                  <span key={cat} className={cn("size-1.5 rounded-none", getCategoryMeta(cat).color)} />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
