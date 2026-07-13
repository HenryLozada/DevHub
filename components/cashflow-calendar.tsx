import { useMemo, useState, useEffect } from "react"
import { ModuleNav } from "@/components/module-nav"
import {
  IoArrowBack,
  IoArrowForward,
  IoCalendar,
  IoStatsChart,
} from "react-icons/io5"
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
  INITIAL_PERSONAL_EVENTS,
  projectPersonalMonth,
} from "@/lib/events"
import { MonthGrid } from "@/components/month-grid"
import { FinancePanel } from "@/components/finance-panel"
import { EventsPanel } from "@/components/events-panel"
import { RuleDialog } from "@/components/rule-dialog"
import { EventDialog } from "@/components/event-dialog"
import { sileo } from "sileo"
import { cn } from "@/lib/utils"

const SEED_RULES: CashflowRule[] = [
  { id: "r1", concepto: "Renta", monto: 4000, tipo: "egreso", recurrencia: "mensual", diaDelMes: 8 },
  { id: "r2", concepto: "Internet", monto: 600, tipo: "egreso", recurrencia: "mensual", diaDelMes: 10 },
  { id: "r3", concepto: "Nómina Semanal", monto: 2000, tipo: "ingreso", recurrencia: "semanal", diaSemana: 5 },
]

export function CashflowCalendar() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(today)
  const [activeTab, setActiveTab] = useState<"finanzas" | "eventos">("eventos")
  // Estado inicial: mismos datos que SSR para evitar mismatch de hidratación.
  const [rules, setRules] = useState<CashflowRule[]>(SEED_RULES)
  const [events, setEvents] = useState<PersonalEvent[]>(INITIAL_PERSONAL_EVENTS)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CashflowRule | null>(null)

  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<PersonalEvent | null>(null)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  // Load from localStorage on mount — sobrescribe los datos semilla
  useEffect(() => {
    try {
      const savedRules = localStorage.getItem("cashflow_rules")
      if (savedRules) setRules(JSON.parse(savedRules))
    } catch (e) {
      console.error("Error reading cashflow_rules from localStorage", e)
    }

    try {
      const savedEvents = localStorage.getItem("personal_events_v2")
      if (savedEvents) setEvents(JSON.parse(savedEvents))
    } catch (e) {
      console.error("Error reading personal_events_v2 from localStorage", e)
    }
  }, [])

  // Escuchar cambios del DevBot y recargar datos
  useEffect(() => {
    const handler = () => {
      try {
        const savedRules = localStorage.getItem("cashflow_rules")
        if (savedRules) setRules(JSON.parse(savedRules))
      } catch (e) { /* ignore */ }
      try {
        const savedEvents = localStorage.getItem("personal_events_v2")
        if (savedEvents) setEvents(JSON.parse(savedEvents))
      } catch (e) { /* ignore */ }
    };
    window.addEventListener("ph:update", handler);
    return () => window.removeEventListener("ph:update", handler);
  }, [])

  // Save rules to localStorage
  useEffect(() => {
    localStorage.setItem("cashflow_rules", JSON.stringify(rules))
  }, [rules])

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem("personal_events_v2", JSON.stringify(events))
  }, [events])

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
    const next = new Date(viewYear, viewMonth + offset, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  function goToToday() {
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
    if (editingRule) {
      setRules((prev) => prev.map((r) => (r.id === editingRule.id ? { ...r, ...data } : r)))
      sileo.success({ title: "Regla actualizada", description: `"${data.concepto}" se guardó correctamente.` })
    } else {
      setRules((prev) => [...prev, { id: crypto.randomUUID(), ...data }])
      sileo.success({ title: "Regla creada", description: `"${data.concepto}" agregada al flujo de caja.` })
    }
    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    sileo.info({ title: "Regla eliminada", description: "Se eliminó la regla del flujo de caja." })
    setRules((prev) => prev.filter((r) => r.id !== id))
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
    if (editingEvent) {
      setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? { ...e, ...data } : e)))
      sileo.success({ title: "Evento actualizado", description: `"${data.nombre}" se guardó correctamente.` })
    } else {
      setEvents((prev) => [...prev, { id: crypto.randomUUID(), ...data }])
      sileo.success({ title: "Evento creado", description: `"${data.nombre}" agregado a tu agenda.` })
    }
    setEventDialogOpen(false)
  }

  function handleDeleteEvent(id: string) {
    sileo.info({ title: "Evento eliminado", description: "Se eliminó el evento de tu agenda." })
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setEventDialogOpen(false)
  }

  function toggleEventComplete(occ: EventOccurrence) {
    const key = `${occ.event.id}-${toDateKey(occ.date)}`
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }))
    const isDone = !completed[key]
    sileo.success({
      title: isDone ? "¡Tarea completada!" : "Tarea desmarcada",
      description: `${occ.event.nombre} — ${isDone ? "marcado como hecho" : "pendiente de nuevo"}`,
    })
  }

  return (
    <div className="mx-auto min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-canvas)' }}>
      <ModuleNav
        icon={<IoCalendar className="w-4 h-4 text-[#76b900]" />}
        title="Flujo de Caja"
        actions={
          <button onClick={goToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-none text-[10px] font-mono font-bold uppercase tracking-wider transition-colors border border-zinc-800 hover:border-zinc-700">
            <IoCalendar className="size-3.5" /> Hoy
          </button>
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
              className="size-8 flex items-center justify-center rounded-none bg-white/40 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-white/40 dark:border-white/10 hover:border-[#76b900]/60 dark:hover:border-[#76b900]/70 transition-all duration-200"
            >
              <IoArrowBack className="size-4" />
            </button>
            <button
              onClick={() => goToMonth(1)}
              aria-label="Mes siguiente"
              className="size-8 flex items-center justify-center rounded-none bg-white/40 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-white/40 dark:border-white/10 hover:border-[#76b900]/60 dark:hover:border-[#76b900]/70 transition-all duration-200"
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

      <RuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <EventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={editingEvent}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  )
}
