import { beforeEach, describe, expect, it } from "vitest"
import { parseActions } from "@/components/devbot/actions"
import { getChores, saveChore } from "@/components/chores/store"
import { getExpenses } from "@/components/budgeted/store"

const action = (payload: object) => `ok |ACTION| ${JSON.stringify(payload)} |END|`

beforeEach(() => localStorage.clear())

describe("parseActions", () => {
  it("runs create actions immediately and strips them from the text", () => {
    const { cleanText, results, pending } = parseActions(action({ saveChore: { title: "Lavar" } }))
    expect(cleanText.trim()).toBe("ok")
    expect(results[0]).toContain("Lavar")
    expect(pending).toHaveLength(0)
    expect(getChores().map((c) => c.title)).toEqual(["Lavar"])
  })

  it("defers deletes until confirmed", () => {
    const chore = saveChore({ title: "Borrar", description: "", status: "pending" })
    const { pending } = parseActions(action({ deleteChore: { id: chore.id } }))
    expect(getChores()).toHaveLength(1)
    expect(pending[0].label).toContain("Borrar")
    pending[0].run()
    expect(getChores()).toHaveLength(0)
  })

  it("rejects invalid expenses", () => {
    const { results } = parseActions(action({ saveExpense: { amount: "mucho", description: "x", category: "c", date: "hoy" } }))
    expect(results[0]).toContain("inválido")
    expect(getExpenses()).toHaveLength(0)
  })
})
