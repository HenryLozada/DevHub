import { Button } from "@/components/ui/button"
import { Plus as IoAdd, TrendingUp as IoTrendingUp, TrendingDown as IoTrendingDown, Pencil as IoPencil } from "lucide-react"
import {
  type CashflowRule,
  type MonthSummary,
  type Occurrence,
  formatCurrency,
  formatFullDate,
  recurrenceLabel,
} from "@/lib/cashflow"
import { cn } from "@/lib/utils"

interface FinancePanelProps {
  summary: MonthSummary
  selectedDate: Date
  dayOccurrences: Occurrence[]
  rules: CashflowRule[]
  onAddRule: () => void
  onEditRule: (rule: CashflowRule) => void
}

export function FinancePanel({
  summary,
  selectedDate,
  dayOccurrences,
  rules,
  onAddRule,
  onEditRule,
}: FinancePanelProps) {
  const card = "relative border border-white/30 dark:border-white/10 backdrop-blur-lg bg-white/40 dark:bg-zinc-950/40 p-3 sm:p-5 rounded-sm shadow-sm shadow-black/5"
  const chip = "flex items-center justify-between gap-2 rounded-sm border border-white/30 dark:border-white/10 backdrop-blur-md bg-white/30 dark:bg-zinc-900/40 p-2.5"

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80">
      <div className={card}>
        <div className="corner-square" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Balance proyectado del mes
        </p>
        <p className={cn(
          "mt-1.5 text-2xl sm:text-[34px] font-semibold leading-none tracking-tight tabular-nums truncate",
          summary.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
        )}>
          {formatCurrency(summary.balance)}
        </p>

        <div className="mt-3 md:mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-sm border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-2 sm:p-3">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <IoTrendingUp className="size-3 sm:size-3.5 shrink-0" />
              <span className="text-[10px] sm:text-xs font-semibold truncate">Ingresos</span>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 truncate">
              {formatCurrency(summary.ingresos)}
            </p>
          </div>
          <div className="rounded-sm border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-2 sm:p-3">
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <IoTrendingDown className="size-3 sm:size-3.5 shrink-0" />
              <span className="text-[10px] sm:text-xs font-semibold truncate">Egresos</span>
            </div>
            <p className="mt-1 text-xs sm:text-sm font-semibold tabular-nums text-red-600 dark:text-red-400 truncate">
              {formatCurrency(summary.egresos)}
            </p>
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="corner-square" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Movimientos del día
        </p>
        <h2 className="mt-0.5 text-[17px] font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
          {formatFullDate(selectedDate)}
        </h2>

        {dayOccurrences.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Sin movimientos programados.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5">
            {dayOccurrences.map((o) => (
              <li key={o.rule.id} className={chip}>
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn(
                    "size-2 shrink-0 rounded-sm",
                    o.rule.tipo === "ingreso" ? "bg-emerald-500" : "bg-red-500",
                  )} />
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{o.rule.concepto}</span>
                </div>
                <span className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  o.rule.tipo === "ingreso" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                )}>
                  {o.rule.tipo === "ingreso" ? "+" : "-"}
                  {formatCurrency(o.rule.monto)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cn(card, "flex flex-col")}>
        <div className="corner-square" />
        <div className="flex items-center justify-between gap-2 border-b border-hairline dark:border-zinc-800 pb-4 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Reglas recurrentes
          </p>
          <Button size="sm" onClick={onAddRule}>
            <IoAdd className="size-4" />
            Nueva
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rules.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Aún no hay reglas. Agrega tu primer ingreso o egreso.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {rules.map((rule) => (
                <li key={rule.id}>
                  <button
                    type="button"
                    onClick={() => onEditRule(rule)}
                    className={cn(chip, "w-full text-left transition-all duration-200 hover:bg-white/90 dark:hover:bg-zinc-900/80 hover:shadow-[0_0_20px_-4px_rgba(118,185,0,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#76b900]")}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "size-2 shrink-0 rounded-sm",
                          rule.tipo === "ingreso" ? "bg-emerald-500" : "bg-red-500",
                        )} />
                        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{rule.concepto}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {recurrenceLabel(rule)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={cn(
                        "text-sm font-semibold tabular-nums",
                        rule.tipo === "ingreso" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                      )}>
                        {rule.tipo === "ingreso" ? "+" : "-"}
                        {formatCurrency(rule.monto)}
                      </span>
                      <IoPencil className="size-3.5 text-zinc-400 dark:text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
