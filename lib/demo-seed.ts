// Dev-only sample data so the app can be exercised without Supabase (see lib/auth-store.tsx)
import { readStore, writeStore } from "./local-store"

function isoDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export function seedDemoData() {
  const now = new Date().toISOString()
  const today = new Date()
  const seeds: Record<string, unknown[]> = {
    cashflow_rules: [
      { id: "r1", concepto: "Salario", monto: 28000, tipo: "ingreso", recurrencia: "mensual", diaDelMes: 15 },
      { id: "r2", concepto: "Renta", monto: 9500, tipo: "egreso", recurrencia: "mensual", diaDelMes: 1 },
      { id: "r3", concepto: "Gym", monto: 250, tipo: "egreso", recurrencia: "semanal", diaSemana: 1 },
    ],
    personal_events_v2: [
      { id: "e1", nombre: "Stand-up", categoria: "laboral", recurrencia: "dias_laborales", horaInicio: "09:30", horaFin: "09:45" },
      { id: "e2", nombre: "Concierto", categoria: "concierto", recurrencia: "unico", fechaUnica: isoDate(3), horaInicio: "21:00" },
      { id: "e3", nombre: "Cumpleaños de mamá", categoria: "cumpleaños", recurrencia: "anual", mesDelAño: today.getMonth(), diaDelMes: Math.min(today.getDate() + 5, 28) },
    ],
    ph_chores_chores: [
      { id: "c1", title: "Ir al súper", status: "pending", dueDate: isoDate(0), color: "#76b900", createdAt: now },
      { id: "c2", title: "Pagar luz", status: "pending", dueDate: isoDate(2), createdAt: now },
      { id: "c3", title: "Lavar el coche", status: "done", createdAt: now },
    ],
    ph_budgeted_expenses: [
      { id: "x1", amount: 1450.5, description: "Súper semanal", category: "Comida", date: isoDate(-1), paidStatus: "paid", createdAt: now },
      { id: "x2", amount: 899, description: "Internet", category: "Servicios", date: isoDate(-3), paidStatus: "unpaid", createdAt: now },
      { id: "x3", amount: 320, description: "Uber", category: "Transporte", date: isoDate(-5), paidStatus: "partial", paidAmount: 150, createdAt: now },
    ],
    ph_devhub_items: [
      { id: "d1", title: "Astro Docs", type: "tool", url: "https://docs.astro.build", category: "Frontend", description: "Documentación oficial de Astro.", createdAt: now },
      { id: "d2", title: "Snippet fetch", type: "note", content: "const res = await fetch(url)", category: "General", createdAt: now },
      { id: "d3", title: "Servidor staging", type: "credential", username: "admin", password: "demo-pass", category: "DevOps", createdAt: now },
    ],
  }
  for (const [key, value] of Object.entries(seeds)) {
    if (readStore<unknown[]>(key, []).length === 0) writeStore(key, value, { emit: false })
  }
}
