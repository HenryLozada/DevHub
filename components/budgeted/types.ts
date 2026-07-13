export type PaidStatus = 'paid' | 'unpaid' | 'partial'

export interface Expense {
  id: string
  amount: number
  description: string
  category: string
  date: string
  paidStatus: PaidStatus
  paidAmount?: number
  createdAt: string
}

export const CATEGORIES = [
  'Comida', 'Renta', 'Servicios', 'Transporte',
  'Entretenimiento', 'Compras', 'Salud', 'Viaje', 'Otro',
]

export function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function uid() {
  return crypto.randomUUID()
}
