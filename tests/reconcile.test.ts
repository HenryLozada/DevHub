import { beforeEach, describe, expect, it, vi } from "vitest"

// In-memory stand-in for the Supabase tables used by lib/local-store.ts
const cloud = new Map<string, { data: unknown; updated_at: string }>()
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: cloud.get(table) ?? null, error: null }) }),
      }),
      upsert: async (row: { data: unknown; updated_at: string }) => {
        cloud.set(table, { data: JSON.parse(JSON.stringify(row.data)), updated_at: row.updated_at })
        return { error: null }
      },
    }),
  },
}))

const { readStore, reconcile, setUserId, writeStore } = await import("@/lib/local-store")

const KEY = "ph_chores_chores"
const ids = () => readStore<{ id: string }[]>(KEY, []).map((c) => c.id)

beforeEach(() => {
  localStorage.clear()
  cloud.clear()
  setUserId("user-1")
})

describe("reconcile", () => {
  it("uploads local data when the cloud is empty", async () => {
    writeStore(KEY, [{ id: "a", title: "A" }], { emit: false })
    await reconcile(KEY)
    expect((cloud.get("chores")?.data as { id: string }[]).map((c) => c.id)).toEqual(["a"])
  })

  it("merges edits made on two devices instead of overwriting", async () => {
    writeStore(KEY, [{ id: "a", title: "A" }], { emit: false })
    await reconcile(KEY)

    // Another device adds "b" directly in the cloud
    const remote = cloud.get("chores")!.data as object[]
    cloud.set("chores", { data: [...remote, { id: "b", title: "B", updatedAt: "2999-01-01" }], updated_at: "2999-01-01" })

    // Meanwhile this device adds "c"
    writeStore(KEY, [...readStore<object[]>(KEY, []), { id: "c", title: "C" }], { emit: false })
    expect(await reconcile(KEY)).toBe("updated")

    expect(ids().sort()).toEqual(["a", "b", "c"])
    expect((cloud.get("chores")!.data as { id: string }[]).map((c) => c.id).sort()).toEqual(["a", "b", "c"])
  })

  it("propagates deletions in both directions", async () => {
    writeStore(KEY, [{ id: "a" }, { id: "b" }], { emit: false })
    await reconcile(KEY)

    // Deleted remotely
    cloud.set("chores", { data: [{ id: "b" }], updated_at: "2999-01-01" })
    await reconcile(KEY)
    expect(ids()).toEqual(["b"])

    // Deleted locally
    writeStore(KEY, [], { emit: false })
    await reconcile(KEY)
    expect(cloud.get("chores")!.data).toEqual([])
  })
})
