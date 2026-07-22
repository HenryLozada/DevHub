import { Chore } from './types'
import { readStore, writeStore } from '@/lib/local-store'

const KEYS = {
  chores: 'ph_chores_chores',
} as const

export function uid() {
  return crypto.randomUUID()
}

export function getChores(): Chore[] {
  return readStore<Chore[]>(KEYS.chores, [])
}

export function saveChore(data: Omit<Chore, 'id' | 'createdAt'>): Chore {
  const chores = getChores()
  const chore: Chore = { ...data, id: uid(), createdAt: new Date().toISOString() }
  writeStore(KEYS.chores, [...chores, chore])
  return chore
}

export function updateChore(id: string, data: Partial<Omit<Chore, 'id'>>): void {
  writeStore(KEYS.chores, getChores().map(c => c.id === id ? { ...c, ...data } : c))
}

export function deleteChore(id: string): void {
  writeStore(KEYS.chores, getChores().filter(c => c.id !== id))
}

export function toggleChore(choreId: string): void {
  const chores = getChores()
  const chore = chores.find(c => c.id === choreId)
  if (!chore) return
  const nextStatus = chore.status === 'done' ? 'pending' : 'done'
  updateChore(choreId, { status: nextStatus })
}
