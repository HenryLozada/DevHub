export type ChoreStatus = 'pending' | 'done'

export interface Chore {
  id: string
  title: string
  description?: string
  status: ChoreStatus
  dueDate?: string
  color?: string
  createdAt: string
}

/** Color de la tarea → token de la paleta armónica */
export const CHORE_COLOR: Record<string, string> = {
  violet: "var(--color-violet)",
  emerald: "var(--color-pos)",
  sky: "var(--color-info)",
  amber: "var(--color-warn)",
  rose: "var(--color-neg)",
  teal: "var(--color-cyan)",
}
