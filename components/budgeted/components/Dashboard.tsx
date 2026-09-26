import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus, Receipt, Pencil, Trash2, Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { RippleButton } from "@/components/ui/ripple-button"
import { InjectionSlot } from "@/components/playground/InjectionSlot"
import { togglePaidStatus, deleteExpense } from "../store"
import { Expense, PaidStatus, fmt } from "../types"
import { CountUp } from "@/components/ui/count-up"

const money = (n: number) => `$${fmt(n)}`
import { ExpenseModal } from "./ExpenseModal"

interface DashboardProps {
  expenses: Expense[]
  onRefresh: () => void
}

const STATUS_META: Record<PaidStatus, { label: string; next: string }> = {
  unpaid: { label: "Pendiente", next: "Marcar pagado" },
  paid: { label: "Pagado", next: "Marcar parcial" },
  partial: { label: "Parcial", next: "Marcar pendiente" },
}

// Paleta armónica compartida (ver @theme en globals.css)
const PALETTE = ["#76b900", "#6a9ef0", "#3cc4d8", "#e9b44c", "#a58af0", "#3ecf9a", "#f07a6a"]
const catColor = (cats: string[], c: string) => PALETTE[Math.max(0, cats.indexOf(c)) % PALETTE.length]

export function Dashboard({ expenses, onRefresh }: DashboardProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all")
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null)

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  // Partial payments count toward "paid"; only the remainder is pending
  const paidPortion = (e: Expense) =>
    e.paidStatus === "paid" ? e.amount
    : e.paidStatus === "partial" ? Math.min(Math.max(e.paidAmount ?? 0, 0), e.amount)
    : 0
  const unpaidTotal = expenses.reduce((s, e) => s + e.amount - paidPortion(e), 0)
  const paidPct = total ? Math.round(((total - unpaidTotal) / total) * 100) : 0

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
  const byCategory = categories
    .map(c => ({ c, sum: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0) }))
    .sort((a, b) => b.sum - a.sum)

  return (
    <div className="mx-auto max-w-6xl px-f13 py-f21 md:px-f34 md:py-f34 relative">
      <InjectionSlot moduleId="budgeted" className="absolute inset-0 pointer-events-none" />
      <div className="relative z-10 grid gap-f21 lg:grid-cols-[1.618fr_1fr] lg:items-start">

      {/* ── Resumen (38%) ── */}
      <aside className="flex flex-col gap-f21 lg:order-2 lg:sticky lg:top-f21">
        <section className="panel p-f21">
          <div className="flex items-end justify-between gap-f13">
            <div className="min-w-0">
              <p className="eyebrow">Total gastado</p>
              <p className="mt-f5 truncate font-mono text-4xl font-light tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-100">
                <CountUp value={total} format={money} />
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg leading-none tabular-nums text-zinc-900 dark:text-zinc-100">{paidPct}<span className="text-zinc-500">%</span></p>
              <p className="eyebrow mt-f5 tracking-[0.2em]">Pagado</p>
            </div>
          </div>
          <div className="mt-f21 h-[3px] overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/[0.06]">
            <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${paidPct}%` }} />
          </div>
          <div className="mt-f13 grid grid-cols-2 gap-f13">
            <div className="cal-chip pl-f8" style={{ "--neon": "var(--color-pos)" } as React.CSSProperties}>
              <p className="eyebrow tracking-[0.2em]">Pagado</p>
              <p className="font-mono text-sm tabular-nums text-zinc-900 dark:text-zinc-100"><CountUp value={total - unpaidTotal} format={money} /></p>
            </div>
            <div className="cal-chip pl-f8" style={{ "--neon": "var(--color-warn)" } as React.CSSProperties}>
              <p className="eyebrow tracking-[0.2em]">Pendiente</p>
              <p className="font-mono text-sm tabular-nums text-zinc-900 dark:text-zinc-100"><CountUp value={unpaidTotal} format={money} /></p>
            </div>
          </div>
        </section>

        {byCategory.length > 0 && (
          <section className="panel p-f21">
            <p className="eyebrow">Por categoría</p>
            {/* barra apilada: de un vistazo, en qué se va el dinero */}
            <div className="mt-f13 flex h-f8 overflow-hidden rounded-full">
              {byCategory.map(({ c, sum }) => (
                <div key={c} title={c} style={{ width: `${(sum / total) * 100}%`, background: catColor(categories, c) }} className="h-full first:rounded-l-full last:rounded-r-full" />
              ))}
            </div>
            <ul className="mt-f13 flex flex-col gap-f8">
              {byCategory.map(({ c, sum }) => (
                <li key={c} className="cal-chip flex items-center justify-between gap-f8 pl-f8 text-xs" style={{ "--neon": catColor(categories, c) } as React.CSSProperties}>
                  <span className="truncate">{c}</span>
                  <span className="shrink-0 font-mono tabular-nums text-zinc-500">{money(sum)} · {Math.round((sum / total) * 100)}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>

      {/* ── Lista (62%) ── */}
      <section className="panel flex flex-col lg:order-1">
        <header className="flex items-center justify-between gap-f13 px-f21 pb-f13 pt-f21">
          <div className="min-w-0">
            <p className="eyebrow">Registro</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Mis gastos <span className="font-mono text-zinc-500">[{expenses.length}]</span>
            </p>
          </div>
          <RippleButton onClick={() => { setEditing(null); setShowAdd(true) }}
            rippleColor="#000000" duration="600ms"
            className="flex h-9 shrink-0 items-center gap-f5 overflow-hidden rounded-full bg-brand px-f13 text-xs font-semibold text-black transition-colors hover:bg-brand-hi">
            <Plus className="size-4" /> Gasto
          </RippleButton>
        </header>

        {/* Filtro segmentado */}
        <div className="px-f21 pb-f13">
          <div className="inline-flex rounded-full border border-zinc-200 p-f3 dark:border-white/10">
            {(["all", "unpaid", "paid"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("rounded-full px-f13 py-f5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                  filter === f ? "bg-zinc-900 text-white dark:bg-white/10 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200")}>
                {f === "all" ? "Todos" : f === "unpaid" ? "Pendientes" : "Pagados"}
              </button>
            ))}
          </div>
        </div>

        <div className="hairline" />

        {filtered.length === 0 ? (
          <div className="m-f21 rounded-f13 border border-dashed border-zinc-300 px-f21 py-f34 text-center dark:border-white/10">
            <Receipt className="mx-auto mb-f8 size-5 text-zinc-400" />
            <p className="eyebrow">Sin registros</p>
            <p className="mt-f5 text-sm text-zinc-500 dark:text-zinc-400">Registra el primero con el botón de arriba.</p>
          </div>
        ) : (
          <ul className="flex flex-col p-f8">
            <AnimatePresence mode="popLayout">
              {filtered.map(exp => {
                const status = exp.paidStatus || "unpaid"
                const st = STATUS_META[status]
                return (
                  <motion.li key={exp.id} layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="reveal group flex items-center gap-f13 rounded-f13 px-f13 py-f8 transition-colors hover:bg-zinc-900/[0.03] dark:hover:bg-white/[0.03]">
                    {/* nodo de estado, igual que en la agenda */}
                    <button onClick={() => handleToggleStatus(exp)} title={st.next} aria-label={`${st.label}: ${st.next}`}
                      className={cn("grid size-[21px] shrink-0 place-items-center rounded-full border transition-all duration-300",
                        status === "paid" ? "border-pos bg-pos text-black"
                        : status === "partial" ? "border-warn text-warn"
                        : "border-zinc-300 bg-white hover:border-brand dark:border-white/20 dark:bg-zinc-950")}>
                      {status === "paid" ? <Check className="size-3" strokeWidth={3} /> : status === "partial" ? <Minus className="size-3" strokeWidth={3} /> : null}
                    </button>

                    <button onClick={() => { setEditing(exp); setShowAdd(true) }} className="min-w-0 flex-1 text-left">
                      <span className={cn("block truncate text-sm", status === "paid" ? "text-zinc-400 line-through decoration-pos/60 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100")}>{exp.description}</span>
                      <span className="mt-f3 flex items-center gap-f8">
                        <span className="cal-chip truncate pl-f5 text-[10px]" style={{ "--neon": catColor(categories, exp.category) } as React.CSSProperties}>{exp.category}</span>
                        <span className="font-mono text-[10px] tabular-nums text-zinc-500">{exp.date}</span>
                      </span>
                    </button>

                    <span className="shrink-0 font-mono text-sm tabular-nums text-zinc-900 dark:text-zinc-100">{money(exp.amount)}</span>

                    <div className="flex shrink-0 gap-f3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      <button onClick={() => { setEditing(exp); setShowAdd(true) }} title="Editar" className="rounded-f8 p-f5 text-zinc-400 transition-colors hover:text-brand"><Pencil className="size-3.5" /></button>
                      <button onClick={() => setConfirmDelete(exp)} title="Eliminar" className="rounded-f8 p-f5 text-zinc-400 transition-colors hover:text-neg"><Trash2 className="size-3.5" /></button>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

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
              className="panel relative w-full max-w-sm p-f34 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-neg/10 rounded-full flex items-center justify-center mx-auto mb-f21 text-neg"><Trash2 className="w-6 h-6 sm:w-7 sm:h-7" /></div>
              <h3 className="text-base font-medium text-zinc-900 dark:text-white mb-f8">¿Eliminar gasto?</h3>
              <p className="text-zinc-500 text-sm mb-f21">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-f13 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">Cancelar</button>
                <RippleButton onClick={() => handleDelete(confirmDelete)} rippleColor="#ffffff" duration="600ms" className="flex-1 py-f13 rounded-full bg-neg hover:brightness-110 text-black text-xs font-semibold transition overflow-hidden">Eliminar</RippleButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>{/* relative z-10 */}
    </div>
  )
}
