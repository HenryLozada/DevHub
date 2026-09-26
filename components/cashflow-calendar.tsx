import { useMemo, useState, useEffect, useRef, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ModuleNav } from "@/components/module-nav"
import {
  ArrowLeft as IoArrowBack,
  ArrowRight as IoArrowForward,
  Calendar as IoCalendar,
  TrendingUp as IoStatsChart,
} from "lucide-react"
import {
  type CashflowRule,
  MONTHS,
  projectMonth,
  summarizeMonth,
  toDateKey,
} from "@/lib/cashflow"
import {
  type PersonalEvent,
  type EventOccurrence,
  projectPersonalMonth,
} from "@/lib/events"
import { MonthGrid } from "@/components/month-grid"
import { FinancePanel } from "@/components/finance-panel"
import { EventsPanel } from "@/components/events-panel"
// Dialogs pull in the dialog/select primitives; load them the first time they open
const RuleDialog = lazy(() => import("@/components/rule-dialog").then((m) => ({ default: m.RuleDialog })))
const EventDialog = lazy(() => import("@/components/event-dialog").then((m) => ({ default: m.EventDialog })))
import { sileo } from "sileo"
import { cn } from "@/lib/utils"
import { RippleButton } from "@/components/ui/ripple-button"
import { InjectionSlot } from "@/components/playground/InjectionSlot"
import { writeStore } from "@/lib/local-store"
import { confetti } from "@/lib/confetti"

export function CashflowCalendar() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [monthDir, setMonthDir] = useState(1)
  const [selectedDate, setSelectedDate] = useState(today)
  const [activeTab, setActiveTab] = useState<"finanzas" | "eventos">("eventos")
  const [rules, setRules] = useState<CashflowRule[]>([])
  const [events, setEvents] = useState<PersonalEvent[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CashflowRule | null>(null)

  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  // Stay mounted after the first open so close animations still run
  const [ruleDialogLoaded, setRuleDialogLoaded] = useState(false)
  const [eventDialogLoaded, setEventDialogLoaded] = useState(false)
  if (dialogOpen && !ruleDialogLoaded) setRuleDialogLoaded(true)
  if (eventDialogOpen && !eventDialogLoaded) setEventDialogLoaded(true)
  const [editingEvent, setEditingEvent] = useState<PersonalEvent | null>(null)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = useState(false)
  const skipWriteRef = useRef(false)

  const loadFromStorage = () => {
    skipWriteRef.current = true
    try {
      const savedRules = localStorage.getItem("cashflow_rules")
      setRules(savedRules ? JSON.parse(savedRules) : [])
    } catch (e) {
      console.error("Error reading cashflow_rules from localStorage", e)
    }

    try {
      const savedEvents = localStorage.getItem("personal_events_v2")
      setEvents(savedEvents ? JSON.parse(savedEvents) : [])
    } catch (e) {
      console.error("Error reading personal_events_v2 from localStorage", e)
    }

    try {
      const savedCompleted = localStorage.getItem("ph_event_completed")
      setCompleted(savedCompleted ? JSON.parse(savedCompleted) : {})
    } catch (e) {
      console.error("Error reading ph_event_completed from localStorage", e)
    }
    // Allow writes on the next tick after React applies loaded state
    queueMicrotask(() => {
      skipWriteRef.current = false
    })
  }

  useEffect(() => {
    loadFromStorage()
    setHydrated(true)
  }, [])

  useEffect(() => {
    const handler = () => loadFromStorage()
    window.addEventListener("ph:update", handler)
    return () => window.removeEventListener("ph:update", handler)
  }, [])

  // Persist only after hydration, and never while reloading from storage.
  // emit:false prevents write → ph:update → load → wipe races.
  useEffect(() => {
    if (!hydrated || skipWriteRef.current) return
    writeStore("cashflow_rules", rules, { emit: false })
  }, [rules, hydrated])

  useEffect(() => {
    if (!hydrated || skipWriteRef.current) return
    writeStore("personal_events_v2", events, { emit: false })
  }, [events, hydrated])

  useEffect(() => {
    if (!hydrated || skipWriteRef.current) return
    writeStore("ph_event_completed", completed, { emit: false })
  }, [completed, hydrated])

  // Proyección del mes activo: se recalcula solo al cambiar reglas o mes.
  const occByDate = useMemo(
    () => projectMonth(rules, viewYear, viewMonth),
    [rules, viewYear, viewMonth],
  )

  const eventsByDate = useMemo(
    () => projectPersonalMonth(events, viewYear, viewMonth),
    [events, viewYear, viewMonth],
  )

  const summary = useMemo(() => summarizeMonth(occByDate), [occByDate])

  const dayOccurrences = occByDate[toDateKey(selectedDate)] ?? []
  const dayEventOccurrences = eventsByDate[toDateKey(selectedDate)] ?? []

  function goToMonth(offset: number) {
    setMonthDir(offset >= 0 ? 1 : -1)
    const next = new Date(viewYear, viewMonth + offset, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  function goToToday() {
    setMonthDir(today.getFullYear() * 12 + today.getMonth() >= viewYear * 12 + viewMonth ? 1 : -1)
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelectedDate(today)
  }

  function openCreate() {
    setEditingRule(null)
    setDialogOpen(true)
  }

  function openEdit(rule: CashflowRule) {
    setEditingRule(rule)
    setDialogOpen(true)
  }

  function handleSave(data: Omit<CashflowRule, "id">) {
    setRules((prev) => {
      const next = editingRule
        ? prev.map((r) => (r.id === editingRule.id ? { ...r, ...data } : r))
        : [...prev, { id: crypto.randomUUID(), ...data }]
      // Persist immediately so a remount/sync cannot lose the change
      writeStore("cashflow_rules", next, { emit: false })
      return next
    })
    sileo.success({
      title: editingRule ? "Regla actualizada" : "Regla creada",
      description: `"${data.concepto}" ${editingRule ? "se guardó correctamente" : "agregada al flujo de caja"}.`,
    })
    setEditingRule(null)
    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    sileo.info({ title: "Regla eliminada", description: "Se eliminó la regla del flujo de caja." })
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== id)
      // Persist immediately so a remount/sync cannot lose the change
      writeStore("cashflow_rules", next, { emit: false })
      return next
    })
    setDialogOpen(false)
  }

  function openCreateEvent() {
    setEditingEvent(null)
    setEventDialogOpen(true)
  }

  function openEditEvent(event: PersonalEvent) {
    setEditingEvent(event)
    setEventDialogOpen(true)
  }

  function handleSaveEvent(data: Omit<PersonalEvent, "id">) {
    setEvents((prev) => {
      const next = editingEvent
        ? prev.map((e) => (e.id === editingEvent.id ? { ...e, ...data } : e))
        : [...prev, { id: crypto.randomUUID(), ...data }]
      // Persist immediately so a remount/sync cannot lose the change
      writeStore("personal_events_v2", next, { emit: false })
      return next
    })
    sileo.success({
      title: editingEvent ? "Evento actualizado" : "Evento creado",
      description: `"${data.nombre}" ${editingEvent ? "se guardó correctamente" : "agregado a tu agenda"}.`,
    })
    setEditingEvent(null)
    setEventDialogOpen(false)
  }

  function handleDeleteEvent(id: string) {
    sileo.info({ title: "Evento eliminado", description: "Se eliminó el evento de tu agenda." })
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id)
      // Persist immediately so a remount/sync cannot lose the change
      writeStore("personal_events_v2", next, { emit: false })
      return next
    })
    setEditingEvent(null)
    setEventDialogOpen(false)
  }

  function toggleEventComplete(occ: EventOccurrence) {
    const key = `${occ.event.id}-${toDateKey(occ.date)}`
    setCompleted((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      // Persist immediately so a remount/sync cannot lose the change
      writeStore("ph_event_completed", next, { emit: false })
      return next
    })
    const isDone = !completed[key]
    if (isDone) confetti()
    sileo.success({
      title: isDone ? "¡Tarea completada!" : "Tarea desmarcada",
      description: `${occ.event.nombre} — ${isDone ? "marcado como hecho" : "pendiente de nuevo"}`,
    })
  }

  return (
    <div className="mx-auto min-h-screen flex flex-col relative">
      <InjectionSlot moduleId="calendar" className="absolute inset-0 pointer-events-none" />
      <ModuleNav
        icon={<IoCalendar className="w-4 h-4 text-[#76b900]" />}
        title="Flujo de Caja"
        actions={
          <RippleButton onClick={goToToday} rippleColor="#ffffff" duration="600ms"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors border border-zinc-800 hover:border-zinc-700 overflow-hidden">
            <IoCalendar className="size-3.5" /> Hoy
          </RippleButton>
        }
      />

      {/* Sub Navigation */}
      <div className="sticky top-[120px] z-30 h-12 w-full backdrop-blur-2xl bg-white/50 dark:bg-zinc-950/50 border-b border-white/30 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          <h1 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            {MONTHS[viewMonth]} {viewYear}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToMonth(-1)}
              aria-label="Mes anterior"
              className="size-8 flex items-center justify-center rounded-lg bg-white/40 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-white/40 dark:border-white/10 hover:border-[#76b900]/60 dark:hover:border-[#76b900]/70 transition-all duration-200"
            >
              <IoArrowBack className="size-4" />
            </button>
            <button
              onClick={() => goToMonth(1)}
              aria-label="Mes siguiente"
              className="size-8 flex items-center justify-center rounded-lg bg-white/40 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-white/40 dark:border-white/10 hover:border-[#76b900]/60 dark:hover:border-[#76b900]/70 transition-all duration-200"
            >
              <IoArrowForward className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="flex flex-1 flex-col gap-5 lg:flex-row lg:items-start">

          <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex flex-1 flex-col">
              <AnimatePresence mode="wait" custom={monthDir} initial={false}>
                <motion.div
                  key={`${viewYear}-${viewMonth}`}
                  custom={monthDir}
                  variants={{
                    enter: (d: number) => ({ opacity: 0, x: 40 * d }),
                    center: { opacity: 1, x: 0, transitionEnd: { transform: "none" } },
                    exit: (d: number) => ({ opacity: 0, x: -40 * d }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  // Swipe left/right to change month (touch friendly)
                  drag="x"
                  dragDirectionLock
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -70) goToMonth(1)
                    else if (info.offset.x > 70) goToMonth(-1)
                  }}
                  className="touch-pan-y"
                >
                <MonthGrid
                  year={viewYear}
                  month={viewMonth}
                  selectedDate={selectedDate}
                  occByDate={occByDate}
                  eventsByDate={eventsByDate}
                  onSelectDate={(date) => {
                    setSelectedDate(date)
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      document.getElementById("detail-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
                    }
                  }}
                />
                </motion.div>
              </AnimatePresence>
            </div>

            <div id="detail-panel" className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:w-80 lg:max-h-[calc(100vh-3rem)]">
              {/* View Tabs */}
              <div className="flex rounded-sm border border-white/30 dark:border-white/10 p-0.5 backdrop-blur-xl bg-white/40 dark:bg-zinc-950/40">
                <button
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-sm py-1.5 text-sm font-medium transition-all",
                    activeTab === "eventos" ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm border border-[#76b900]" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                  onClick={() => setActiveTab("eventos")}
                >
                  <IoCalendar className="size-4" />
                  Agenda
                </button>
                <button
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-sm py-1.5 text-sm font-medium transition-all",
                    activeTab === "finanzas" ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm border border-[#76b900]" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                  onClick={() => setActiveTab("finanzas")}
                >
                  <IoStatsChart className="size-4" />
                  Finanzas
                </button>
              </div>

              {activeTab === "finanzas" ? (
                <FinancePanel
                  summary={summary}
                  selectedDate={selectedDate}
                  dayOccurrences={dayOccurrences}
                  rules={rules}
                  onAddRule={openCreate}
                  onEditRule={openEdit}
                />
              ) : (
                <EventsPanel
                  selectedDate={selectedDate}
                  dayOccurrences={dayEventOccurrences}
                  events={events}
                  onAddEvent={openCreateEvent}
                  onEditEvent={openEditEvent}
                  onToggleComplete={(occ) => toggleEventComplete(occ)}
                  completed={completed}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <Suspense fallback={null}>
        {ruleDialogLoaded && (
          <RuleDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            rule={editingRule}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
        {eventDialogLoaded && (
          <EventDialog
            open={eventDialogOpen}
            onOpenChange={setEventDialogOpen}
            event={editingEvent}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
          />
        )}
      </Suspense>
    </div>
  )
}
