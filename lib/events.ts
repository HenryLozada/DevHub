import { daysInMonth, toDateKey } from "./cashflow"

export type EventCategory = "cumpleaños" | "concierto" | "laboral" | "rutina"
export type EventRecurrence = "anual" | "mensual" | "semanal" | "diario" | "dias_laborales" | "unico"

export interface PersonalEvent {
  id: string
  nombre: string
  categoria: EventCategory
  recurrencia: EventRecurrence
  mesDelAño?: number // 0-11
  diaDelMes?: number // 1-31
  diasSemana?: number[] // 0-6 array for multiple days in a week
  fechaUnica?: string // "YYYY-MM-DD"
  horaInicio?: string // "HH:MM"
  horaFin?: string // "HH:MM"
  nota?: string
  completado?: boolean // checkbox de agenda del día
}

export interface EventOccurrence {
  event: PersonalEvent
  date: Date
}

export function projectPersonalMonth(
  events: PersonalEvent[],
  year: number,
  month: number
): Record<string, EventOccurrence[]> {
  const map: Record<string, EventOccurrence[]> = {}
  const totalDays = daysInMonth(year, month)

  const push = (date: Date, event: PersonalEvent) => {
    const key = toDateKey(date)
      ; (map[key] ??= []).push({ event, date })
  }

  for (const event of events) {
    if (event.recurrencia === "unico" && event.fechaUnica) {
      const [y, m, d] = event.fechaUnica.split("-").map(Number)
      if (y === year && m - 1 === month) {
        push(new Date(year, month, d), event)
      }
    } else if (event.recurrencia === "anual") {
      if (event.mesDelAño === month && event.diaDelMes) {
        push(new Date(year, month, event.diaDelMes), event)
      }
    } else if (event.recurrencia === "mensual" && event.diaDelMes) {
      const day = Math.min(event.diaDelMes, totalDays)
      push(new Date(year, month, day), event)
    } else if (event.recurrencia === "semanal" && event.diasSemana) {
      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month, d)
        if (event.diasSemana.includes(date.getDay())) {
          push(date, event)
        }
      }
    } else if (event.recurrencia === "dias_laborales") {
      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month, d)
        const dayOfWeek = date.getDay()
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          push(date, event)
        }
      }
    } else if (event.recurrencia === "diario") {
      for (let d = 1; d <= totalDays; d++) {
        push(new Date(year, month, d), event)
      }
    }
  }

  // Sort events by time within each day
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => {
      const timeA = a.event.horaInicio || "24:00"
      const timeB = b.event.horaInicio || "24:00"
      return timeA.localeCompare(timeB)
    })
  }

  return map
}

export function formatEventTime(event: PersonalEvent): string {
  if (event.horaInicio && event.horaFin) {
    return `${event.horaInicio} - ${event.horaFin}`
  }
  if (event.horaInicio) {
    return event.horaInicio
  }
  return "Todo el día"
}

export function getCategoryMeta(categoria: EventCategory) {
  switch (categoria) {
    case "cumpleaños":
      return { label: "Cumpleaños", color: "bg-violet-500", textColor: "text-violet-600", bgLight: "bg-violet-500/10", border: "border-violet-500/40" }
    case "concierto":
      return { label: "Eventos/Conciertos", color: "bg-amber-500", textColor: "text-amber-600", bgLight: "bg-amber-500/10", border: "border-amber-500/40" }
    case "laboral":
      return { label: "Laboral", color: "bg-blue-500", textColor: "text-blue-600", bgLight: "bg-blue-500/10", border: "border-blue-500/40" }
    case "rutina":
      return { label: "Rutinas", color: "bg-cyan-500", textColor: "text-cyan-600", bgLight: "bg-cyan-500/10", border: "border-cyan-500/40" }
  }
}

export function exportEventsToJSON(events: PersonalEvent[]) {
  const weeklyAgenda: Record<number, any[]> = {
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  }

  const annualEvents = events.filter(e => e.recurrencia === 'anual')
  const specificEvents = events.filter(e => e.recurrencia === 'unico')

  for (const event of events) {
    if (event.recurrencia === 'diario') {
      for (let i = 0; i < 7; i++) weeklyAgenda[i].push(event)
    } else if (event.recurrencia === 'dias_laborales') {
      for (let i = 1; i <= 5; i++) weeklyAgenda[i].push(event)
    } else if (event.recurrencia === 'semanal' && event.diasSemana) {
      for (const d of event.diasSemana) weeklyAgenda[d].push(event)
    }
  }

  for (let i = 0; i < 7; i++) {
    weeklyAgenda[i].sort((a, b) => (a.horaInicio || "24:00").localeCompare(b.horaInicio || "24:00"))
    weeklyAgenda[i] = weeklyAgenda[i].map(e => ({
      nombre: e.nombre,
      inicio: e.horaInicio || "00:00",
      fin: e.horaFin || "23:59",
      categoria: e.categoria
    }))
  }

  const exportData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    agenda_semanal_24h: weeklyAgenda,
    eventos_anuales: annualEvents.map(e => ({ nombre: e.nombre, mes: e.mesDelAño, dia: e.diaDelMes })),
    eventos_especificos: specificEvents.map(e => ({ nombre: e.nombre, fecha: e.fechaUnica, inicio: e.horaInicio }))
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `agenda_hardware_${new Date().getTime()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const INITIAL_PERSONAL_EVENTS: PersonalEvent[] = [
  // Bloque 1: Rutina Diaria y Operaciones (Lunes a Sábado)
  { id: "e1", nombre: "Despertar y Orden Doméstico", categoria: "rutina", recurrencia: "diario", horaInicio: "06:00", horaFin: "06:40" },
  { id: "e2", nombre: "Preparación y Desayuno", categoria: "rutina", recurrencia: "diario", horaInicio: "06:40", horaFin: "08:15" },
  { id: "e3", nombre: "Traslado en Bici (Ida)", categoria: "rutina", recurrencia: "dias_laborales", horaInicio: "08:40", horaFin: "09:00" },
  { id: "e4", nombre: "Operación Tienda / Apertura", categoria: "laboral", recurrencia: "dias_laborales", horaInicio: "09:00", horaFin: "13:00" },
  { id: "e5", nombre: "Almuerzo / Comida", categoria: "rutina", recurrencia: "diario", horaInicio: "13:00", horaFin: "14:00" },
  { id: "e6", nombre: "Operación Tienda / Cierre", categoria: "laboral", recurrencia: "dias_laborales", horaInicio: "14:00", horaFin: "17:30" },
  { id: "e7", nombre: "Traslado en Bici (Retorno)", categoria: "rutina", recurrencia: "dias_laborales", horaInicio: "17:30", horaFin: "17:45" },

  // Bloque 2: Post-Trabajo y Enfoque Técnico (Lunes a Viernes)
  { id: "e8", nombre: "Pesas / Hipertrofia (Directo de Bici)", categoria: "rutina", recurrencia: "dias_laborales", horaInicio: "17:45", horaFin: "19:00" },
  { id: "e9", nombre: "Cena y Baño", categoria: "rutina", recurrencia: "diario", horaInicio: "19:00", horaFin: "19:45" },
  { id: "e10", nombre: "Práctica Guitarra (Neural DSP)", categoria: "rutina", recurrencia: "semanal", diasSemana: [2, 4], horaInicio: "19:45", horaFin: "21:15" },
  { id: "e11", nombre: "Descanso Circadiano", categoria: "rutina", recurrencia: "diario", horaInicio: "22:30", horaFin: "06:00" }
]
