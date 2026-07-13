import { Chore } from './types'

const KEYS = {
  chores: 'ph_chores_chores',
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

export function uid() {
  return crypto.randomUUID()
}

export function getChores(): Chore[] {
  return read<Chore[]>(KEYS.chores, [])
}

export function saveChore(data: Omit<Chore, 'id' | 'createdAt'>): Chore {
  const chores = getChores()
  const chore: Chore = { ...data, id: uid(), createdAt: new Date().toISOString() }
  write(KEYS.chores, [...chores, chore])
  return chore
}

export function updateChore(id: string, data: Partial<Omit<Chore, 'id'>>): void {
  write(KEYS.chores, getChores().map(c => c.id === id ? { ...c, ...data } : c))
}

export function deleteChore(id: string): void {
  write(KEYS.chores, getChores().filter(c => c.id !== id))
}

export function toggleChore(choreId: string): void {
  const chores = getChores()
  const chore = chores.find(c => c.id === choreId)
  if (!chore) return
  const nextStatus = chore.status === 'done' ? 'pending' : 'done'
  updateChore(choreId, { status: nextStatus })
}
