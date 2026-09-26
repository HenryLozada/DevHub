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
    <div className="glass flex flex-col overflow-hidden rounded-2xl">
      <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/[0.06]">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1.5 sm:py-2 text-center text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400/80 select-none"
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
                "group relative flex min-h-[40px] sm:min-h-[80px] lg:min-h-[100px] flex-col gap-0.5 sm:gap-1 border-b border-r border-black/5 dark:border-white/[0.05] p-1 sm:p-1.5 text-left transition-[background-color,box-shadow] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#76b900] focus-visible:ring-inset [&:nth-child(7n)]:border-r-0",
                "hover:bg-white/60 dark:hover:bg-white/[0.035]",
                !inMonth && "text-zinc-300 dark:text-zinc-700 [&>*]:opacity-50",
                inMonth && "text-zinc-900 dark:text-zinc-100",
                isToday && "bg-[#76b900]/[0.06] shadow-[inset_0_0_24px_-8px_rgba(118,185,0,0.55)]",
                isSelected && "z-10 bg-[#76b900]/[0.08] shadow-[inset_0_0_0_1px_rgba(155,224,28,0.7),inset_0_0_28px_-6px_rgba(118,185,0,0.45),0_0_24px_-6px_rgba(118,185,0,0.5)]",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    "flex size-5 sm:size-7 items-center justify-center rounded-md text-[10px] sm:text-[13px] font-semibold tabular-nums",
                    isToday && "bg-gradient-to-br from-[#76b900] to-[#b6f03a] text-black rounded-md pulse-ring shadow-[0_0_14px_rgba(118,185,0,0.5)]",
                    !isToday && !inMonth && "text-zinc-400 dark:text-zinc-600",
                    !isToday && inMonth && "text-zinc-900 dark:text-zinc-100",
                  )}
                >
                  {date.getDate()}
                </span>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {hasIngreso && (
                    <span className="neon-dot size-1.5 rounded-full" style={{ "--neon": "#34d399" } as React.CSSProperties} aria-label="Ingreso" />
                  )}
                  {hasEgreso && (
                    <span className="neon-dot size-1.5 rounded-full" style={{ "--neon": "#fb7185" } as React.CSSProperties} aria-label="Egreso" />
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
                          "neon-chip flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[8px] sm:text-[10px] leading-tight font-medium transition-transform duration-200 group-hover:translate-x-0.5",
                                                  )}
                        style={{ "--neon": item.tipo === "ingreso" ? "#34d399" : "#fb7185" } as React.CSSProperties}
                      >
                        <span className="truncate">{item.label}</span>
                      </div>
                    )
                  } else {
                    const meta = getCategoryMeta(item.categoria)
                    return (
                      <div
                        key={item.key}
                        style={{ "--neon": meta.neon } as React.CSSProperties}
                        className="neon-chip flex items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[8px] sm:text-[10px] leading-tight font-medium transition-transform duration-200 group-hover:translate-x-0.5"
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
                  <span key={cat} className="neon-dot size-1.5 rounded-full" style={{ "--neon": getCategoryMeta(cat).neon } as React.CSSProperties} />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
