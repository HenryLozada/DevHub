import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus, Receipt, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { RippleButton } from "@/components/ui/ripple-button"
import { InjectionSlot } from "@/components/playground/InjectionSlot"
import { togglePaidStatus, deleteExpense } from "../store"
import { Expense, PaidStatus, fmt } from "../types"
import { ExpenseModal } from "./ExpenseModal"

interface DashboardProps {
  expenses: Expense[]
  onRefresh: () => void
}

const STATUS_META: Record<PaidStatus, { label: string; icon: any; style: string }> = {
  unpaid: { label: "Pendiente", icon: "○", style: "text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700" },
  paid: { label: "Pagado", icon: "✓", style: "text-emerald-600 dark:text-emerald-400 border-emerald-400 dark:border-emerald-600" },
  partial: { label: "Parcial", icon: "◐", style: "text-amber-600 dark:text-amber-400 border-amber-400 dark:border-amber-600" },
}

export function Dashboard({ expenses, onRefresh }: DashboardProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all")
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null)

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const unpaidTotal = expenses.filter(e => (e.paidStatus || "unpaid") !== "paid").reduce((s, e) => s + e.amount, 0)

  const filtered = filter === "all" ? expenses
    : filter === "unpaid" ? expenses.filter(e => (e.paidStatus || "unpaid") !== "paid")
    : expenses.filter(e => e.paidStatus === "paid")

  function handleToggleStatus(exp: Expense) {
    togglePaidStatus(exp.id)
    onRefresh()
  }

  function handleDelete(exp: Expense) {
    deleteExpense(exp.id)
    setConfirmDelete(null)
    onRefresh()
  }

  const categories = [...new Set(expenses.map(e => e.category))]

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8 relative">
      <InjectionSlot moduleId="budgeted" className="absolute inset-0 pointer-events-none" />
      <div className="relative z-10">
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <div className="min-w-0">
          <h2 className="text-xl md:text-3xl font-bold text-zinc-950 dark:text-white font-sans uppercase tracking-tight truncate">Mis Gastos</h2>
          <p className="text-zinc-500 text-[10px] md:text-xs mt-0.5 md:mt-1 font-mono uppercase tracking-wider truncate">
            {expenses.length} registros · ${fmt(unpaidTotal)} pendiente
          </p>
        </div>
        <RippleButton onClick={() => { setEditing(null); setShowAdd(true) }}
          rippleColor="#000000" duration="600ms"
          className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-[#76b900] text-black rounded-none text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#86cb00] transition-colors border border-[#76b900] shrink-0 overflow-hidden">
          <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> Gasto
        </RippleButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 md:p-5 rounded-none shadow-xs relative overflow-hidden">
          <div className="corner-square" />
          <p className="font-mono text-[8px] md:text-[9px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 truncate">Total</p>
          <p className="text-base md:text-2xl font-mono font-bold text-[#76b900] truncate">${fmt(total)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 md:p-5 rounded-none shadow-xs relative overflow-hidden">
          <div className="corner-square" />
          <p className="font-mono text-[8px] md:text-[9px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 truncate">Pagado</p>
          <p className="text-base md:text-2xl font-mono font-bold text-emerald-500 truncate">${fmt(total - unpaidTotal)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 md:p-5 rounded-none shadow-xs relative overflow-hidden">
          <div className="corner-square" />
          <p className="font-mono text-[8px] md:text-[9px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 truncate">Pendiente</p>
          <p className="text-base md:text-2xl font-mono font-bold text-amber-500 truncate">${fmt(unpaidTotal)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-4">
        {(["all", "unpaid", "paid"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-none text-[9px] font-mono font-bold uppercase tracking-wider transition-all border",
              filter === f ? "bg-[#76b900] text-black border-[#76b900]" : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200")}>
            {f === "all" ? "Todos" : f === "unpaid" ? "Pendientes" : "Pagados"}
          </button>
        ))}
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-950 rounded-none border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
          <div className="corner-square" />
          <Receipt className="w-12 h-12 text-[#76b900] mx-auto mb-3" />
          <p className="text-zinc-400 dark:text-zinc-500 font-mono text-xs uppercase tracking-wider">Sin gastos registrados</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none overflow-hidden shadow-xs divide-y divide-zinc-200 dark:divide-zinc-800 relative">
          <div className="corner-square" />
          <AnimatePresence mode="popLayout">
            {filtered.map(exp => {
              const st = STATUS_META[exp.paidStatus || "unpaid"]
              return (
                <motion.div key={exp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2 md:gap-4 p-3 md:p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 group transition-colors">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-50 dark:bg-zinc-900 rounded-none flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800">
                    <Receipt className="w-4 h-4 md:w-5 md:h-5 text-[#76b900]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 dark:text-white truncate text-xs md:text-sm">{exp.description}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[8px] md:text-[9px] font-mono font-bold uppercase tracking-wider text-[#76b900] bg-[#76b900]/10 border border-[#76b900]/20 px-1.5 py-0.5 rounded-none truncate max-w-[80px] md:max-w-none">{exp.category}</span>
                      <span className="text-[8px] md:text-[9px] text-zinc-400 dark:text-zinc-500 font-mono uppercase tracking-wider">{exp.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="font-bold font-mono text-zinc-900 dark:text-white text-xs md:text-sm whitespace-nowrap">${fmt(exp.amount)}</p>
                    <button onClick={() => handleToggleStatus(exp)}
                      className={cn(
                        "flex items-center gap-1 px-1.5 md:px-2.5 py-1 rounded-none text-[8px] md:text-[9px] font-mono font-bold uppercase tracking-wider transition-all border shrink-0 whitespace-nowrap",
                        st.style,
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}>
                      {st.icon} <span className="hidden md:inline">{st.label}</span>
                    </button>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditing(exp); setShowAdd(true) }} className="p-1 md:p-1.5 hover:bg-[#76b900]/10 text-zinc-400 hover:text-[#76b900] rounded-none border border-transparent hover:border-[#76b900]/20 transition-colors"><TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                    <button onClick={() => setConfirmDelete(exp)} className="p-1 md:p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-none border border-transparent hover:border-red-500/20 transition-colors"><TrendingDown className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <ExpenseModal expense={editing} onClose={() => { setShowAdd(false); setEditing(null) }} onSaved={() => { onRefresh() }} />
        )}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setConfirmDelete(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none p-4 sm:p-8 text-center shadow-xs overflow-hidden">
              <div className="corner-square" />
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500/10 border border-red-500/20 rounded-none flex items-center justify-center mx-auto mb-4 sm:mb-5 text-red-600"><TrendingDown className="w-6 h-6 sm:w-7 sm:h-7" /></div>
              <h3 className="text-sm sm:text-md font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider mb-2">¿Eliminar gasto?</h3>
              <p className="text-zinc-400 dark:text-zinc-500 text-xs font-mono uppercase tracking-wider mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-none font-mono text-xs uppercase tracking-wider font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
                <RippleButton onClick={() => handleDelete(confirmDelete)} rippleColor="#ffffff" duration="600ms" className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-none font-mono text-xs uppercase tracking-wider font-bold transition-colors border border-red-600 overflow-hidden">Eliminar</RippleButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>{/* relative z-10 */}
    </div>
  )
}
