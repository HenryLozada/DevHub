import { useState, useMemo } from "react"
import { confetti } from "@/lib/confetti"
import { AnimatePresence, motion } from "motion/react"
import { Check, Plus, Pencil, Trash2, ChevronRight } from "lucide-react"
import { CountUp } from "@/components/ui/count-up"
import { PixelBar } from "@/components/ui/pixel-bar"
import { isBefore, startOfDay, endOfWeek, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { RippleButton } from "@/components/ui/ripple-button"
import { InjectionSlot } from "@/components/playground/InjectionSlot"
import { toggleChore, deleteChore } from "../store"
import { Chore, CHORE_COLOR } from "../types"
import { ChoreModal } from "./ChoreModal"

interface DashboardProps {
  chores: Chore[]
  onRefresh: () => void
}

const URGENCY = {
  urgent: { label: "Vence hoy", color: "var(--color-neg)", empty: "Nada urgente" },
  soon: { label: "Esta semana", color: "var(--color-warn)", empty: "Semana tranquila" },
  later: { label: "Después", color: "var(--color-pos)", empty: "Sin pendientes" },
}

type Urgency = keyof typeof URGENCY

function KanbanCard({
  c,
  onToggle,
  onEdit,
  onDelete,
}: {
  c: Chore
  onToggle: (c: Chore) => void
  onEdit: (c: Chore) => void
  onDelete: (c: Chore) => void
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="reveal group flex items-center gap-f13 rounded-f13 px-f8 py-f8 transition-colors hover:bg-zinc-900/[0.03] dark:hover:bg-white/[0.03]"
    >
      <button onClick={() => onToggle(c)} aria-label="Completar"
        className="grid size-[21px] shrink-0 place-items-center rounded-full border border-zinc-300 bg-white transition-all hover:border-brand active:scale-90 dark:border-white/20 dark:bg-zinc-950">
        <Check className="size-3 text-brand opacity-0 transition-opacity group-hover:opacity-40" strokeWidth={3} />
      </button>
      <button onClick={() => onEdit(c)} className="min-w-0 flex-1 text-left">
        <span className="cal-chip block truncate pl-f8 text-sm" style={{ "--neon": CHORE_COLOR[c.color ?? ""] ?? "var(--color-brand)" } as React.CSSProperties}>{c.title}</span>
        {c.dueDate && <span className="mt-f3 block pl-f8 font-mono text-[10px] tabular-nums text-zinc-500">{c.dueDate}</span>}
      </button>
      <div className="flex shrink-0 gap-f3 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <button onClick={() => onEdit(c)} title="Editar" className="rounded-f8 p-f5 text-zinc-400 transition-colors hover:text-brand"><Pencil className="size-3.5" /></button>
        <button onClick={() => onDelete(c)} title="Eliminar" className="rounded-f8 p-f5 text-zinc-400 transition-colors hover:text-neg"><Trash2 className="size-3.5" /></button>
      </div>
    </motion.li>
  )
}

function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number)
  if (!y || !m || !d) return new Date(isoDate)
  return new Date(y, m - 1, d)
}

function getUrgency(c: Chore): Urgency | null {
  if (c.status === "done") return null
  if (!c.dueDate) return "later"
  const today = startOfDay(new Date())
  const due = startOfDay(parseLocalDate(c.dueDate))
  if (isBefore(due, today) || isSameDay(due, today)) return "urgent"
  if (isBefore(due, endOfWeek(today, { weekStartsOn: 1 }))) return "soon"
  return "later"
}

export function Dashboard({ chores, onRefresh }: DashboardProps) {
  const [showChoreModal, setShowChoreModal] = useState(false)
  const [editingChore, setEditingChore] = useState<Chore | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Chore | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const total = chores.length
  const doneCount = chores.filter(c => c.status === "done").length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const grouped = useMemo(() => {
    const urgent: Chore[] = []
    const soon: Chore[] = []
    const later: Chore[] = []
    const done: Chore[] = []
    for (const c of chores) {
      const u = getUrgency(c)
      if (u === "urgent") urgent.push(c)
      else if (u === "soon") soon.push(c)
      else if (u === "later") later.push(c)
      else done.push(c)
    }
    const sortByDate = (arr: Chore[]) => arr.sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })
    return {
      urgent: sortByDate(urgent),
      soon: sortByDate(soon),
      later: sortByDate(later),
      done: done.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5),
    }
  }, [chores])

  function handleToggle(c: Chore) {
    toggleChore(c.id)
    if (c.status !== "done") confetti()
    onRefresh()
  }

  function handleDelete(c: Chore) {
    deleteChore(c.id)
    setConfirmDelete(null)
    onRefresh()
  }

  function toggleCollapse(key: string) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const columns: { key: Urgency; chores: Chore[] }[] = [
    { key: "urgent", chores: grouped.urgent },
    { key: "soon", chores: grouped.soon },
    { key: "later", chores: grouped.later },
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-f21 px-f13 py-f21 md:px-f34 md:py-f34 relative">
      <InjectionSlot moduleId="chores" className="absolute inset-0 pointer-events-none" />

      {/* Resumen */}
      <section className="panel relative z-10 flex flex-wrap items-end justify-between gap-f21 p-f21">
        <div className="flex items-end gap-f13">
          <span className="font-mono text-5xl font-light leading-none tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-100">
            <CountUp value={total - doneCount} />
          </span>
          <div className="pb-f3">
            <p className="eyebrow">Pendientes</p>
            <p className="text-sm text-zinc-500">{grouped.urgent.length > 0 ? `${grouped.urgent.length} vencen hoy` : "Nada vence hoy"}</p>
          </div>
        </div>
        <div className="flex min-w-[233px] flex-1 items-center gap-f13 md:max-w-[377px]">
          <PixelBar className="flex-1" label={`${pct}% hecho`} segments={[{ value: pct / 100, color: "var(--color-brand)" }]} />
          <span className="font-mono text-xs tabular-nums text-zinc-500">{doneCount}/{total}</span>
        </div>
        <RippleButton onClick={() => { setEditingChore(null); setShowChoreModal(true) }}
          rippleColor="#000000" duration="600ms"
          className="flex h-9 shrink-0 items-center gap-f5 overflow-hidden rounded-full bg-brand px-f13 text-xs font-semibold text-black transition-colors hover:bg-brand-hi">
          <Plus className="size-4" /> Tarea
        </RippleButton>
      </section>

      {/* Columnas por urgencia */}
      <div className="relative z-10 grid grid-cols-1 gap-f21 md:grid-cols-3">
        {columns.map(col => {
          const meta = URGENCY[col.key]
          const isCollapsed = collapsed[col.key]
          const shown = isCollapsed ? col.chores.slice(0, 3) : col.chores
          return (
            <section key={col.key} className="panel flex flex-col">
              <header className="flex items-center gap-f8 px-f21 pb-f13 pt-f21">
                <span className="h-f13 w-[3px] rounded-full" style={{ background: meta.color }} />
                <h3 className="eyebrow !text-zinc-600 dark:!text-zinc-400">{meta.label}</h3>
                <span className="hairline flex-1" />
                <span className="font-mono text-[10px] text-zinc-500">{String(col.chores.length).padStart(2, "0")}</span>
                {col.chores.length > 3 && (
                  <button onClick={() => toggleCollapse(col.key)} className="p-f3 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
                    <ChevronRight className={cn("size-3.5 transition-transform duration-200", !isCollapsed && "rotate-90")} />
                  </button>
                )}
              </header>
              <ul className="flex flex-col px-f8 pb-f8">
                <AnimatePresence mode="popLayout">
                  {shown.map(c => (
                    <KanbanCard
                      key={c.id}
                      c={c}
                      onToggle={handleToggle}
                      onEdit={(item) => { setEditingChore(item); setShowChoreModal(true) }}
                      onDelete={(item) => setConfirmDelete(item)}
                    />
                  ))}
                </AnimatePresence>
                {isCollapsed && col.chores.length > 3 && (
                  <button onClick={() => toggleCollapse(col.key)} className="mx-f8 my-f5 rounded-full py-f5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-brand">
                    +{col.chores.length - 3} más
                  </button>
                )}
                {col.chores.length === 0 && (
                  <li className="m-f8 rounded-f13 border border-dashed border-zinc-300 px-f13 py-f21 text-center dark:border-white/10">
                    <p className="eyebrow">{meta.empty}</p>
                  </li>
                )}
              </ul>
            </section>
          )
        })}
      </div>

      {/* Hechas recientemente */}
      {grouped.done.length > 0 && (
        <section className="relative z-10 flex items-center gap-f13 overflow-x-auto no-scrollbar">
          <span className="eyebrow shrink-0">Hechas</span>
          {grouped.done.map(c => (
            <button key={c.id} onClick={() => handleToggle(c)} title="Deshacer"
              className="flex shrink-0 items-center gap-f5 rounded-full border border-zinc-200 px-f13 py-f5 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:border-white/10 dark:hover:text-zinc-200">
              <Check className="size-3 text-brand" strokeWidth={3} />
              <span className="max-w-[144px] truncate line-through decoration-brand/60">{c.title}</span>
            </button>
          ))}
        </section>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showChoreModal && (
          <ChoreModal chore={editingChore} onClose={() => setShowChoreModal(false)} onSaved={() => onRefresh()} />
        )}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="panel relative w-full max-w-sm p-f34 text-center">
              <div className="size-[55px] bg-neg/10 rounded-full flex items-center justify-center mx-auto mb-f21 text-neg"><Trash2 className="size-6" /></div>
              <h3 className="text-base font-medium text-zinc-900 dark:text-white mb-f8">¿Eliminar tarea?</h3>
              <p className="text-zinc-500 text-sm mb-f21">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-f13 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">Cancelar</button>
                <RippleButton onClick={() => handleDelete(confirmDelete)} rippleColor="#ffffff" duration="600ms" className="flex-1 py-f13 rounded-full bg-neg hover:brightness-110 text-black text-xs font-semibold transition overflow-hidden">Eliminar</RippleButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
