import { Expense, PaidStatus } from './types'

const KEYS = {
  expenses: 'ph_budgeted_expenses',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function uid() {
  return crypto.randomUUID()
}

export function getExpenses(): Expense[] {
  return read<Expense[]>(KEYS.expenses, [])
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function saveExpense(data: Omit<Expense, 'id' | 'createdAt'>): Expense {
  const expenses = getExpenses()
  const expense: Expense = { ...data, id: uid(), createdAt: new Date().toISOString() }
  write(KEYS.expenses, [expense, ...expenses])
  return expense
}

export function updateExpense(id: string, data: Partial<Omit<Expense, 'id'>>): void {
  write(KEYS.expenses, getExpenses().map(e => e.id === id ? { ...e, ...data } : e))
}

export function deleteExpense(id: string): void {
  write(KEYS.expenses, getExpenses().filter(e => e.id !== id))
}

export function togglePaidStatus(id: string): { status: PaidStatus } {
  const expenses = getExpenses()
  const idx = expenses.findIndex(e => e.id === id)
  if (idx === -1) throw new Error("Expense not found")
  const current = expenses[idx].paidStatus || "unpaid"
  const next: PaidStatus = current === "unpaid" ? "paid" : current === "paid" ? "unpaid" : "paid"
  expenses[idx] = { ...expenses[idx], paidStatus: next }
  write(KEYS.expenses, expenses)
  return { status: next }
}
