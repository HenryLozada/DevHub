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
