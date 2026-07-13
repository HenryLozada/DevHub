import { Button } from "@/components/ui/button"
import { IoAdd, IoDownload, IoPencil } from "react-icons/io5"
import {
  type PersonalEvent,
  type EventOccurrence,
  exportEventsToJSON,
  getCategoryMeta,
  formatEventTime,
} from "@/lib/events"
import { sileo } from "sileo"
import { formatFullDate } from "@/lib/cashflow"
import { cn } from "@/lib/utils"

interface EventsPanelProps {
  selectedDate: Date
  dayOccurrences: EventOccurrence[]
  events: PersonalEvent[]
  onAddEvent: () => void
  onEditEvent: (event: PersonalEvent) => void
  onToggleComplete: (occ: EventOccurrence) => void
  completed: Record<string, boolean>
}

export function EventsPanel({
  selectedDate,
  dayOccurrences,
  events,
  onAddEvent,
  onEditEvent,
  onToggleComplete,
  completed,
}: EventsPanelProps) {

  const handleExport = () => {
    exportEventsToJSON(events)
  }

  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.categoria]) acc[event.categoria] = []
    acc[event.categoria].push(event)
    return acc
  }, {} as Record<string, PersonalEvent[]>)

  const card = "relative border border-white/30 dark:border-white/10 backdrop-blur-lg bg-white/40 dark:bg-zinc-950/40 rounded-sm"
  const chip = "flex items-center justify-between gap-2 rounded-sm border border-white/30 dark:border-white/10 backdrop-blur-md bg-white/30 dark:bg-zinc-900/40 p-2.5"

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80">
      <div className={cn(card, "p-5")}>
        <div className="corner-square" />
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Agenda del día
          </p>
        </div>
        <h2 className="mt-0.5 text-[17px] font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
          {formatFullDate(selectedDate)}
        </h2>

        {dayOccurrences.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Sin eventos programados.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5">
            {dayOccurrences.map((o) => {
              const meta = getCategoryMeta(o.event.categoria)
              const taskKey = `${o.event.id}-${selectedDate.toISOString().split("T")[0]}`
              const isCompleted = !!completed[taskKey]
              return (
                <li
                  key={o.event.id}
                  onClick={() => onToggleComplete(o)}
                  className={cn(
                    chip,
                    "cursor-pointer transition-all duration-200 hover:bg-white/90 dark:hover:bg-zinc-900/80 hover:shadow-[0_0_20px_-4px_rgba(118,185,0,0.25)]",
                    isCompleted && "opacity-50 line-through"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-sm", isCompleted ? "bg-zinc-400" : meta.color)} />
                    <div className="flex flex-col">
                      <span className={cn("truncate text-sm font-medium", isCompleted ? "text-zinc-500 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100")}>
                        {o.event.nombre}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatEventTime(o.event)}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className={cn(card, "flex flex-col")}>
        <div className="corner-square" />
        <div className="flex items-center justify-between gap-2 border-b border-hairline dark:border-zinc-800 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Todos los Eventos
          </p>
          <div className="flex gap-1.5">
            <Button size="icon" variant="secondary" onClick={handleExport} title="Exportar Agenda" className="h-8 w-8">
              <IoDownload className="size-4" />
            </Button>
            <Button size="sm" onClick={onAddEvent}>
              <IoAdd className="size-4" />
              Nuevo
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {events.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Aún no hay eventos. Agrega tu primer evento a la agenda.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {["rutina", "laboral", "concierto", "cumpleaños"].map((cat) => {
                const catEvents = groupedEvents[cat]
                if (!catEvents || catEvents.length === 0) return null
                const meta = getCategoryMeta(cat as any)
                return (
                  <div key={cat} className="flex flex-col gap-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{meta.label}</h3>
                    <ul className="flex flex-col gap-1.5">
                      {catEvents.map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => onEditEvent(event)}
                            className="group flex w-full items-center justify-between gap-2 rounded-sm border border-white/30 dark:border-white/10 backdrop-blur-md bg-white/30 dark:bg-zinc-900/40 p-3 text-left transition-all duration-200 hover:bg-white/90 dark:hover:bg-zinc-900/80 hover:shadow-[0_0_20px_-4px_rgba(118,185,0,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#76b900]"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn("size-2 shrink-0 rounded-sm", meta.color)} />
                                <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{event.nombre}</span>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                                {formatEventTime(event)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <IoPencil className="size-3.5 text-zinc-400 dark:text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
