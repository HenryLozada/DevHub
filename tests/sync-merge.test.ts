import { describe, expect, it } from "vitest"
import { mergeById, mergeValues, removedIds, stampChanges } from "@/lib/sync-merge"

const e = (id: string, extra: Record<string, unknown> = {}) => ({ id, ...extra })

describe("stampChanges", () => {
  it("stamps new and changed items, keeps stamps on unchanged ones", () => {
    const prev = [e("a", { v: 1, updatedAt: "t0" }), e("b", { v: 1, updatedAt: "t0" })]
    const next = [e("a", { v: 1 }), e("b", { v: 2 }), e("c")]
    expect(stampChanges(prev, next, "t1")).toEqual([
      e("a", { v: 1, updatedAt: "t0" }),
      e("b", { v: 2, updatedAt: "t1" }),
      e("c", { updatedAt: "t1" }),
    ])
  })

  it("leaves non-entity values alone", () => {
    expect(stampChanges(null, { x: true }, "t1")).toEqual({ x: true })
  })
})

describe("removedIds", () => {
  it("lists ids missing from next", () => {
    expect(removedIds([e("a"), e("b")], [e("b")])).toEqual(["a"])
  })
})

describe("mergeById", () => {
  it("keeps the newest version of items present on both sides", () => {
    const local = [e("a", { v: "local", updatedAt: "2" })]
    const cloud = [e("a", { v: "cloud", updatedAt: "3" })]
    expect(mergeById(local, cloud, new Set(["a"]), new Set())).toEqual(cloud)
  })

  it("keeps items created on each device", () => {
    const merged = mergeById([e("mine")], [e("theirs")], new Set(), new Set())
    expect(merged.map((x) => x.id)).toEqual(["mine", "theirs"])
  })

  it("drops items deleted on another device", () => {
    expect(mergeById([e("a"), e("b")], [e("b")], new Set(["a", "b"]), new Set())).toEqual([e("b")])
  })

  it("does not resurrect items deleted locally", () => {
    expect(mergeById([e("b")], [e("a"), e("b")], new Set(["a", "b"]), new Set(["a"]))).toEqual([e("b")])
  })
})

describe("mergeValues", () => {
  const ctx = (localTs: string, cloudTs: string) => ({ localTs, cloudTs, seen: new Set<string>(), tomb: new Set<string>() })

  it("merges plain objects by key with the newer side winning conflicts", () => {
    expect(mergeValues({ x: true, y: false }, { y: true, z: true }, ctx("1", "2"))).toEqual({ x: true, y: true, z: true })
    expect(mergeValues({ x: true, y: false }, { y: true, z: true }, ctx("3", "2"))).toEqual({ x: true, y: false, z: true })
  })

  it("uses last-write-wins for versioned objects like the vault", () => {
    expect(mergeValues({ v: 1, enabled: false }, { v: 1, enabled: true }, ctx("1", "2"))).toEqual({ v: 1, enabled: true })
  })

  it("falls back to whichever side exists", () => {
    expect(mergeValues(null, [e("a")], ctx("", ""))).toEqual([e("a")])
    expect(mergeValues([e("a")], null, ctx("", ""))).toEqual([e("a")])
  })
})
