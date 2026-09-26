import { Button } from "@/components/ui/button"
import { Plus as IoAdd, Download as IoDownload, ChevronRight, Check } from "lucide-react"
import {
  type PersonalEvent,
  type EventOccurrence,
  exportEventsToJSON,
  getCategoryMeta,
  formatEventTime,
} from "@/lib/events"
import { toDateKey } from "@/lib/cashflow"
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

const CATEGORY_ORDER = ["rutina", "laboral", "concierto", "cumpleaños"]

const RECURRENCE_LABEL: Record<string, string> = {
  diario: "Diario",
  dias_laborales: "Lun–Vie",
  semanal: "Semanal",
  mensual: "Mensual",
  anual: "Anual",
  unico: "Único",
}

const recurrenceLabel = (r: string) => RECURRENCE_LABEL[r] ?? r.replace(/_/g, " ")

const panel =
  "relative overflow-hidden rounded-2xl border border-black/5 dark:border-white/[0.06] bg-white/60 dark:bg-[linear-gradient(160deg,rgba(24,24,27,0.75),rgba(9,9,11,0.9))] backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)]"

const eyebrow = "font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-500"

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

  const dateKey = toDateKey(selectedDate)
  const doneCount = dayOccurrences.filter((o) => completed[`${o.event.id}-${dateKey}`]).length
  const progress = dayOccurrences.length ? Math.round((doneCount / dayOccurrences.length) * 100) : 0

  const weekday = selectedDate.toLocaleDateString("es-ES", { weekday: "long" })
  const monthYear = selectedDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80">
      {/* ── Agenda del día ── */}
      <section className={cn(panel, "p-5")}>
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#76b900]/15 blur-3xl" />

        <div className="relative flex items-end justify-between gap-3">
          <div className="flex items-end gap-3">
            <span className="bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text font-mono text-5xl font-light leading-none tracking-tighter text-transparent tabular-nums">
              {String(selectedDate.getDate()).padStart(2, "0")}
            </span>
            <div className="pb-0.5">
              <p className={eyebrow}>Agenda</p>
              <p className="text-sm font-medium capitalize leading-tight text-zinc-900 dark:text-zinc-100">{weekday}</p>
              <p className="text-xs capitalize text-zinc-500">{monthYear}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono text-lg leading-none tabular-nums text-zinc-900 dark:text-zinc-100">
              {doneCount}
              <span className="text-zinc-500">/{dayOccurrences.length}</span>
            </p>
            <p className={cn(eyebrow, "mt-1 tracking-[0.2em]")}>Hecho</p>
          </div>
        </div>

        <div className="relative mt-4 h-[3px] overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#76b900] to-[#b6ff3b] shadow-[0_0_12px_rgba(118,185,0,0.8)] transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {dayOccurrences.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-zinc-300 dark:border-white/10 px-4 py-6 text-center">
            <p className={eyebrow}>Sin señales</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Día libre: sin eventos programados.</p>
          </div>
        ) : (
          <ol className="relative mt-5 flex flex-col stagger">
            <span className="absolute bottom-3 left-[58px] top-3 w-px bg-gradient-to-b from-[#76b900]/60 via-zinc-300 to-transparent dark:via-white/10" />
            {dayOccurrences.map((o) => {
              const meta = getCategoryMeta(o.event.categoria)
              const isCompleted = !!completed[`${o.event.id}-${toDateKey(o.date)}`]
              return (
                <li key={o.event.id}>
                  <button
                    type="button"
                    onClick={() => onToggleComplete(o)}
                    aria-pressed={isCompleted}
                    className="group relative flex w-full items-center gap-3 rounded-xl py-2 pr-2 text-left transition-colors hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#76b900]/60"
                  >
                    <span className="w-11 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-500">
                      {o.event.horaInicio ?? "—"}
                    </span>
                    <span
                      className={cn(
                        "relative z-10 grid size-[18px] shrink-0 place-items-center rounded-full border transition-all duration-300",
                        isCompleted
                          ? "border-[#76b900] bg-[#76b900] shadow-[0_0_14px_rgba(118,185,0,0.7)]"
                          : "border-zinc-300 bg-white dark:border-white/20 dark:bg-zinc-950 group-hover:border-[#76b900]"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="size-3 text-black" strokeWidth={3} />
                      ) : (
                        <span className={cn("size-1.5 rounded-full", meta.color)} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-medium transition-colors",
                          isCompleted ? "text-zinc-400 line-through decoration-[#76b900]/70 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-100"
                        )}
                      >
                        {o.event.nombre}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-zinc-500">
                        {formatEventTime(o.event)} · {meta.label}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* ── Todos los eventos ── */}
      <section className={cn(panel, "flex flex-col")}>
        <header className="flex items-center justify-between gap-2 px-5 pb-3 pt-5">
          <div>
            <p className={eyebrow}>Registro</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Todos los eventos <span className="font-mono text-zinc-500">[{events.length}]</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleExport}
              title="Exportar Agenda"
              className="size-9 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <IoDownload className="size-4" />
            </Button>
            <Button
              size="sm"
              onClick={onAddEvent}
              className="h-9 rounded-full px-4 shadow-[0_0_24px_-6px_rgba(118,185,0,0.9)]"
            >
              <IoAdd className="size-4" />
              Nuevo
            </Button>
          </div>
        </header>

        <div className="h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-white/10" />

        <div className="flex-1 overflow-y-auto p-3">
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Aún no hay eventos. Agrega tu primer evento a la agenda.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {[
                ...CATEGORY_ORDER,
                ...Object.keys(groupedEvents).filter((c) => !CATEGORY_ORDER.includes(c)),
              ].map((cat) => {
                const catEvents = groupedEvents[cat]
                if (!catEvents || catEvents.length === 0) return null
                const meta = getCategoryMeta(cat)
                return (
                  <div key={cat}>
                    <div className="mb-1.5 flex items-center gap-2 px-2">
                      <span className={cn("h-3 w-[3px] rounded-full", meta.color)} />
                      <h3 className={cn(eyebrow, "text-zinc-600 dark:text-zinc-400")}>{meta.label}</h3>
                      <span className="h-px flex-1 bg-zinc-200 dark:bg-white/[0.05]" />
                      <span className="font-mono text-[10px] text-zinc-500">{String(catEvents.length).padStart(2, "0")}</span>
                    </div>
                    <ul className="flex flex-col stagger">
                      {catEvents.map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => onEditEvent(event)}
                            className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-all duration-200 hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#76b900]/60"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-zinc-900 dark:text-zinc-100">{event.nombre}</span>
                              <span className="mt-0.5 flex items-center gap-2">
                                <span className="font-mono text-[11px] tabular-nums text-zinc-500">{formatEventTime(event)}</span>
                                <span className="rounded-full border border-zinc-200 dark:border-white/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                                  {recurrenceLabel(event.recurrencia)}
                                </span>
                              </span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-zinc-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#76b900] dark:text-zinc-600" />
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
      </section>
    </aside>
  )
}
