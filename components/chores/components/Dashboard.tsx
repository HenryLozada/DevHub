import { useState, useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2, Circle, Plus, Pencil, Trash2, ChevronRight, Sparkles } from "lucide-react"
import { isBefore, startOfDay, endOfWeek, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { toggleChore, deleteChore } from "../store"
import { Chore } from "../types"
import { ChoreModal } from "./ChoreModal"

interface DashboardProps {
  chores: Chore[]
  onRefresh: () => void
}

const URGENCY_COLORS = {
  urgent: {
    label: "Vence hoy",
    dot: "bg-red-500",
    ring: "ring-red-500/20",
    glass: "border-red-500/20",
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-500",
    glow: "shadow-red-500/10",
  },
  soon: {
    label: "Esta semana",
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
    glass: "border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500",
    glow: "shadow-amber-500/10",
  },
  later: {
    label: "Después",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/20",
    glass: "border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500",
    glow: "shadow-emerald-500/10",
  },
}

type Urgency = keyof typeof URGENCY_COLORS

const GLASS = "backdrop-blur-xl bg-white/40 dark:bg-zinc-950/40 border border-white/30 dark:border-white/10 shadow-sm shadow-black/5"
const GLASS_CARD = "backdrop-blur-md bg-white/60 dark:bg-zinc-950/60 border border-white/40 dark:border-white/[0.08] shadow-sm shadow-black/5"

function getUrgency(c: Chore): Urgency | null {
  if (c.status === "done") return null
  if (!c.dueDate) return "later"
  const today = startOfDay(new Date())
  const due = startOfDay(new Date(c.dueDate))
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

  function KanbanCard({ c }: { c: Chore }) {
    return (
      <motion.div layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn("group flex items-center gap-2.5 p-2.5", GLASS_CARD, "hover:border-white/70 dark:hover:border-white/20 hover:shadow-md transition-all duration-200")}
      >
        <button onClick={() => handleToggle(c)} className="shrink-0 transition-all active:scale-90 cursor-pointer group/toggle">
          <Circle className="w-[15px] h-[15px] text-zinc-300 dark:text-zinc-600 group-hover/toggle:text-[#76b900] transition-colors" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate leading-tight">{c.title}</p>
          {c.dueDate && (
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{c.dueDate}</p>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
          <button onClick={() => { setEditingChore(c); setShowChoreModal(true) }} className="p-1 hover:bg-white/80 dark:hover:bg-zinc-800/60 text-zinc-400 hover:text-[#76b900] rounded-sm transition-colors cursor-pointer"><Pencil className="w-3 h-3" /></button>
          <button onClick={() => setConfirmDelete(c)} className="p-1 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-sm transition-colors cursor-pointer"><Trash2 className="w-3 h-3" /></button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col px-4 py-4 max-w-6xl mx-auto relative">
      {/* Subtle background decoration */}
      <div className="absolute -top-20 right-10 w-72 h-72 bg-[#76b900]/5 dark:bg-[#76b900]/[0.03] blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-56 h-56 bg-violet-500/5 dark:bg-violet-500/[0.02] blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#76b900]/10 border border-[#76b900]/20 flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#76b900]" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white font-sans tracking-tight">Mis Tareas</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-28 h-1 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm rounded-full overflow-hidden border border-white/30 dark:border-white/10">
              <div className="h-full bg-gradient-to-r from-[#76b900] to-[#86cb00] transition-all duration-700 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">{doneCount}/{total}</span>
          </div>
        </div>
        <button onClick={() => { setEditingChore(null); setShowChoreModal(true) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#76b900] text-black rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-[#86cb00] transition-all duration-200 border border-[#76b900] cursor-pointer active:scale-[0.97] shadow-sm shadow-[#76b900]/20">
          <Plus className="w-3.5 h-3.5" /> Tarea
        </button>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0 relative z-10">
        {columns.map(col => {
          const meta = URGENCY_COLORS[col.key]
          const isCollapsed = collapsed[col.key]
          return (
            <div key={col.key} className={cn("flex flex-col min-h-0 rounded-sm p-3", GLASS, meta.glass, meta.glow)}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full ring-2", meta.dot, meta.ring)} />
                  <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", meta.text)}>
                    {meta.label}
                  </span>
                  <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.5 text-white rounded-sm shadow-sm", meta.badge)}>
                    {col.chores.length}
                  </span>
                </div>
                {col.chores.length > 3 && (
                  <button onClick={() => toggleCollapse(col.key)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer p-0.5">
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform duration-200", !isCollapsed && "rotate-90")} />
                  </button>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-0.5 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                  {(isCollapsed ? col.chores.slice(0, 3) : col.chores).map(c => (
                    <KanbanCard key={c.id} c={c} />
                  ))}
                  {isCollapsed && col.chores.length > 3 && (
                    <button onClick={() => toggleCollapse(col.key)}
                      className="w-full py-1.5 text-[9px] font-mono font-bold text-zinc-400 hover:text-[#76b900] uppercase tracking-wider border border-dashed border-white/40 dark:border-white/[0.08] hover:border-[#76b900]/40 transition-colors cursor-pointer backdrop-blur-sm bg-white/20 dark:bg-zinc-950/20 rounded-sm">
                      +{col.chores.length - 3} más
                    </button>
                  )}
                </AnimatePresence>
                {col.chores.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border border-dashed border-white/30 dark:border-white/10 backdrop-blur-sm bg-white/10 dark:bg-zinc-950/10 rounded-sm">
                    Sin tareas
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recently done strip */}
      {grouped.done.length > 0 && (
        <div className="shrink-0 mt-3 pt-3 border-t border-white/30 dark:border-white/10 relative z-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#76b900]" /> Hechas
            </span>
            {grouped.done.map(c => (
              <div key={c.id}
                className="flex items-center gap-1.5 px-2 py-1 backdrop-blur-md bg-white/30 dark:bg-zinc-950/30 border border-white/40 dark:border-white/10 rounded-sm shrink-0 opacity-50 group cursor-pointer hover:opacity-100 hover:bg-white/50 dark:hover:bg-zinc-950/50 transition-all duration-200 active:scale-95"
                onClick={() => handleToggle(c)}
              >
                <CheckCircle2 className="w-3 h-3 text-[#76b900]" />
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-24">{c.title}</span>
              </div>
            ))}
          </div>
        </div>
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
              className={cn("relative w-full max-w-sm rounded-sm p-4 sm:p-8 text-center overflow-hidden", GLASS)}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center justify-center mx-auto mb-4 sm:mb-5 text-red-500 backdrop-blur-sm"><Trash2 className="w-6 h-6 sm:w-7 sm:h-7" /></div>
              <h3 className="text-sm sm:text-md font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider mb-2">¿Eliminar tarea?</h3>
              <p className="text-zinc-400 dark:text-zinc-500 text-xs font-mono uppercase tracking-wider mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm text-zinc-900 dark:text-white border border-zinc-200/50 dark:border-zinc-800/50 rounded-sm font-mono text-xs uppercase tracking-wider font-bold hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer">Cancelar</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-sm font-mono text-xs uppercase tracking-wider font-bold transition-colors border border-red-600 cursor-pointer shadow-sm shadow-red-600/20">Eliminar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
