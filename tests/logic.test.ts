import { describe, expect, it } from "vitest"
import { projectMonth, summarizeMonth, type CashflowRule } from "@/lib/cashflow"
import { projectPersonalMonth, type PersonalEvent } from "@/lib/events"
import { isPrivateIp } from "@/lib/ip-safety"

const rule = (r: Partial<CashflowRule>): CashflowRule => ({
  id: "r", concepto: "x", monto: 100, tipo: "ingreso", recurrencia: "mensual", ...r,
})

describe("projectMonth", () => {
  it("clamps monthly rules to the last day of short months", () => {
    const map = projectMonth([rule({ diaDelMes: 31 })], 2026, 1) // Feb 2026
    expect(Object.keys(map)).toEqual(["2026-02-28"])
  })

  it("repeats weekly rules on every matching weekday", () => {
    const map = projectMonth([rule({ recurrencia: "semanal", diaSemana: 1 })], 2026, 8) // Sep 2026
    expect(Object.keys(map)).toEqual(["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"])
  })

  it("summarizes income, expenses and balance", () => {
    const map = projectMonth(
      [rule({ id: "a", diaDelMes: 1, monto: 1000 }), rule({ id: "b", diaDelMes: 2, monto: 300, tipo: "egreso" })],
      2026, 0
    )
    expect(summarizeMonth(map)).toEqual({ ingresos: 1000, egresos: 300, balance: 700 })
  })
})

describe("projectPersonalMonth", () => {
  const ev = (e: Partial<PersonalEvent>): PersonalEvent => ({
    id: "e", nombre: "n", categoria: "rutina", recurrencia: "unico", ...e,
  })

  it("places one-off events only in their month", () => {
    const e = ev({ fechaUnica: "2026-03-15" })
    expect(Object.keys(projectPersonalMonth([e], 2026, 2))).toEqual(["2026-03-15"])
    expect(projectPersonalMonth([e], 2026, 3)).toEqual({})
  })

  it("covers only weekdays for dias_laborales", () => {
    const days = Object.keys(projectPersonalMonth([ev({ recurrencia: "dias_laborales" })], 2026, 1))
    expect(days).toHaveLength(20) // Feb 2026 has 20 weekdays
  })

  it("sorts a day's events by start time", () => {
    const map = projectPersonalMonth(
      [ev({ id: "late", recurrencia: "diario", horaInicio: "18:00" }), ev({ id: "early", recurrencia: "diario", horaInicio: "07:30" })],
      2026, 0
    )
    expect(map["2026-01-01"].map((o) => o.event.id)).toEqual(["early", "late"])
  })
})

describe("isPrivateIp", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "not-an-ip"])(
    "blocks %s", (ip) => expect(isPrivateIp(ip)).toBe(true)
  )
  it.each(["8.8.8.8", "172.32.0.1", "2606:4700::1111"])("allows %s", (ip) => expect(isPrivateIp(ip)).toBe(false))
})
