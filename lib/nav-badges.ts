import { useEffect, useState } from "react"
import { readStore } from "@/lib/local-store"
import { projectPersonalMonth, type PersonalEvent } from "@/lib/events"
import { toDateKey } from "@/lib/cashflow"
import type { TabId } from "@/components/global-nav"

type Badges = Partial<Record<TabId, number>>

/** Cuántas cosas piden atención hoy en cada hub (solo lectura de localStorage) */
function computeBadges(): Badges {
  const now = new Date()
  const today = toDateKey(now)

  const events = readStore<PersonalEvent[]>("personal_events_v2", [])
  const completed = readStore<Record<string, boolean>>("ph_event_completed", {})
  const todayOccs = projectPersonalMonth(events, now.getFullYear(), now.getMonth())[today] ?? []
  const calendar = todayOccs.filter((o) => !completed[`${o.event.id}-${today}`]).length

  const expenses = readStore<{ paidStatus?: string }[]>("ph_budgeted_expenses", [])
  const budgeted = expenses.filter((e) => (e.paidStatus || "unpaid") !== "paid").length

  const chores = readStore<{ status: string; dueDate?: string }[]>("ph_chores_chores", [])
  const due = chores.filter((c) => c.status !== "done" && !!c.dueDate && c.dueDate <= today).length

  return { calendar, budgeted, chores: due }
}

export function useNavBadges(): Badges {
  const [badges, setBadges] = useState<Badges>({})
  useEffect(() => {
    const sync = () => setBadges(computeBadges())
    sync()
    const id = window.setInterval(sync, 60_000)
    window.addEventListener("ph:update", sync)
    window.addEventListener("focus", sync)
    return () => {
      window.clearInterval(id)
      window.removeEventListener("ph:update", sync)
      window.removeEventListener("focus", sync)
    }
  }, [])
  return badges
}
