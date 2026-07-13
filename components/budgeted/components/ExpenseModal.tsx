import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { X, Check, Circle, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateExpense, saveExpense } from "../store"
import { Expense, CATEGORIES, PaidStatus, fmt } from "../types"

interface ExpenseModalProps {
  expense?: Expense | null
  onClose: () => void
  onSaved: () => void
}

export function ExpenseModal({ expense, onClose, onSaved }: ExpenseModalProps) {
  const [amount, setAmount] = useState(expense?.amount.toString() ?? "")
  const [description, setDescription] = useState(expense?.description ?? "")
  const [category, setCategory] = useState(expense?.category ?? CATEGORIES[0])
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().slice(0, 10))
  const [paidStatus, setPaidStatus] = useState<PaidStatus>(expense?.paidStatus ?? "unpaid")
  const [paidAmount, setPaidAmount] = useState(expense?.paidAmount?.toString() ?? "")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      amount: +amount, description, category, date,
      paidStatus,
      ...(paidStatus === "partial" && paidAmount ? { paidAmount: +paidAmount } : {}),
    }
    if (expense) {
      updateExpense(expense.id, data)
    } else {
      saveExpense(data)
    }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none shadow-sm p-8 overflow-hidden">
        <div className="corner-square" />
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider">{expense ? "EDITAR GASTO" : "NUEVO GASTO"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-none text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Monto</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold font-mono">$</span>
              <input autoFocus type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]/20"
              />
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Descripción</label>
            <input required value={description} onChange={e => setDescription(e.target.value)} placeholder="¿En qué se gastó?"
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]/20 font-mono text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white text-sm appearance-none focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]/20 font-mono">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Fecha</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]/20 font-mono"
              />
            </div>
          </div>
          {/* Paid Status */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Estado de pago</label>
            <div className="flex gap-1.5">
              {([{ value: "unpaid" as PaidStatus, label: "Pendiente", icon: Circle },
                { value: "paid" as PaidStatus, label: "Pagado", icon: Check },
                { value: "partial" as PaidStatus, label: "Parcial", icon: Minus },
              ]).map(s => (
                <button key={s.value} type="button" onClick={() => setPaidStatus(s.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider transition-all border",
                    paidStatus === s.value
                      ? s.value === "paid" ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                        : s.value === "partial" ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}>
                  <s.icon className={cn("size-3.5",
                    paidStatus === s.value && s.value === "paid" ? "text-emerald-500"
                      : paidStatus === s.value && s.value === "partial" ? "text-amber-500"
                      : ""
                  )} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {paidStatus === "partial" && (
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Monto pagado</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold font-mono">$</span>
                <input type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]/20"
                  placeholder={fmt(+(amount || 0) / 2).toString()} />
              </div>
            </div>
          )}
          <button type="submit" className="w-full py-3.5 bg-[#76b900] hover:bg-[#86cb00] text-black rounded-none font-mono text-xs uppercase tracking-wider font-bold transition-all border border-[#76b900]">
            {expense ? "GUARDAR CAMBIOS" : "AGREGAR GASTO"}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
