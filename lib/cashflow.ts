import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  subDays,
} from "date-fns"
import { es } from "date-fns/locale"

export type RuleType = "ingreso" | "egreso"
export type Recurrence = "mensual" | "semanal"

export interface CashflowRule {
  id: string
  concepto: string
  monto: number // siempre positivo; el signo se deriva del tipo
  tipo: RuleType
  recurrencia: Recurrence
  diaDelMes?: number // 1-31, para recurrencia mensual
  diaSemana?: number // 0 (domingo) - 6 (sábado), para recurrencia semanal
}

export interface Occurrence {
  rule: CashflowRule
  date: Date
}

export const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export const WEEKDAYS_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
]

export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export { format, startOfMonth, endOfMonth, eachDayOfInterval, addDays, subDays } from "date-fns"

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

/** Devuelve una cuadrícula de 6x7 (Date) que cubre el mes visible. */
export function getMonthGrid(year: number, month: number): Date[] {
  const first = startOfMonth(new Date(year, month, 1))
  const startDay = first.getDay()
  const start = subDays(first, startDay)
  const grid: Date[] = []
  for (let i = 0; i < 42; i++) {
    grid.push(addDays(start, i))
  }
  return grid
}

export function daysInMonth(year: number, month: number): number {
  return endOfMonth(new Date(year, month, 1)).getDate()
}

/**
 * Proyecta todas las reglas de recurrencia sobre un mes específico,
 * devolviendo un mapa de claveFecha -> ocurrencias de ese día.
 */
export function projectMonth(
  rules: CashflowRule[],
  year: number,
  month: number,
): Record<string, Occurrence[]> {
  const map: Record<string, Occurrence[]> = {}
  const total = daysInMonth(year, month)

  const push = (date: Date, rule: CashflowRule) => {
    const key = toDateKey(date)
      ; (map[key] ??= []).push({ rule, date })
  }

  for (const rule of rules) {
    if (rule.recurrencia === "mensual") {
      const dom = rule.diaDelMes
      if (!dom) continue
      const day = Math.min(dom, total)
      push(new Date(year, month, day), rule)
    } else if (rule.recurrencia === "semanal") {
      const target = rule.diaSemana
      if (target === undefined) continue
      for (let d = 1; d <= total; d++) {
        const date = new Date(year, month, d)
        if (date.getDay() === target) push(date, rule)
      }
    }
  }

  return map
}

export interface MonthSummary {
  ingresos: number
  egresos: number
  balance: number
}

export function summarizeMonth(occByDate: Record<string, Occurrence[]>): MonthSummary {
  let ingresos = 0
  let egresos = 0
  for (const occs of Object.values(occByDate)) {
    for (const { rule } of occs) {
      if (rule.tipo === "ingreso") ingresos += rule.monto
      else egresos += rule.monto
    }
  }
  return { ingresos, egresos, balance: ingresos - egresos }
}

const currencyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return currencyFmt.format(value)
}

export function formatFullDate(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' y", { locale: es })
}

export function recurrenceLabel(rule: CashflowRule): string {
  if (rule.recurrencia === "mensual") {
    return `Cada día ${rule.diaDelMes} del mes`
  }
  return `Cada ${WEEKDAYS_FULL[rule.diaSemana ?? 0].toLowerCase()}`
}