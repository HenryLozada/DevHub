// Pure helpers for merging local and cloud copies of a store without losing edits from other devices.
// Deletions are detected without trusting clocks: `seen` holds the ids that were in the cloud at the
// last sync (so a local-only id that was seen was deleted remotely) and `tomb` holds ids deleted
// locally since then (so a cloud-only id in `tomb` must not come back).

type Entity = { id: string; updatedAt?: string; createdAt?: string; [k: string]: unknown }

function isEntity(v: unknown): v is Entity {
  return typeof v === "object" && v !== null && !Array.isArray(v) && typeof (v as Entity).id === "string"
}

export function isEntityList(v: unknown): v is Entity[] {
  return Array.isArray(v) && v.every(isEntity)
}

function withoutStamp(e: Entity): string {
  const { updatedAt: _u, ...rest } = e
  return JSON.stringify(rest)
}

function stampOf(e: Entity): string {
  return e.updatedAt || e.createdAt || ""
}

/** Sets `updatedAt` on entities that are new or changed compared to `prev`; keeps it on the rest. */
export function stampChanges(prev: unknown, next: unknown, now: string): unknown {
  if (!isEntityList(next)) return next
  const prevById = new Map(isEntityList(prev) ? prev.map((e) => [e.id, e]) : [])
  return next.map((item) => {
    const before = prevById.get(item.id)
    if (before && withoutStamp(before) === withoutStamp(item)) {
      return before.updatedAt ? { ...item, updatedAt: before.updatedAt } : item
    }
    return { ...item, updatedAt: now }
  })
}

/** Ids present in `prev` but missing from `next`. */
export function removedIds(prev: unknown, next: unknown): string[] {
  if (!isEntityList(prev)) return []
  const nextIds = new Set(isEntityList(next) ? next.map((e) => e.id) : [])
  return prev.filter((e) => !nextIds.has(e.id)).map((e) => e.id)
}

export function mergeById(local: Entity[], cloud: Entity[], seen: Set<string>, tomb: Set<string>): Entity[] {
  const cloudById = new Map(cloud.map((e) => [e.id, e]))
  const localIds = new Set(local.map((e) => e.id))
  const out: Entity[] = []

  for (const item of local) {
    const remote = cloudById.get(item.id)
    if (remote) out.push(stampOf(remote) > stampOf(item) ? remote : item)
    else if (!seen.has(item.id)) out.push(item) // created here, not uploaded yet
    // else: it was in the cloud and another device deleted it
  }
  for (const remote of cloud) {
    if (!localIds.has(remote.id) && !tomb.has(remote.id)) out.push(remote)
  }
  return out
}

export interface MergeContext {
  localTs: string
  cloudTs: string
  seen: Set<string>
  tomb: Set<string>
}

/** Merges any store value: entity lists by id, plain objects by key, anything else last-write-wins. */
export function mergeValues(local: unknown, cloud: unknown, ctx: MergeContext): unknown {
  if (local == null) return cloud
  if (cloud == null) return local
  if (isEntityList(local) && isEntityList(cloud)) return mergeById(local, cloud, ctx.seen, ctx.tomb)

  const localWins = ctx.localTs > ctx.cloudTs
  const isPlainObject = (v: unknown) => typeof v === "object" && v !== null && !Array.isArray(v)
  if (isPlainObject(local) && isPlainObject(cloud) && !("v" in (local as object))) {
    return localWins ? { ...(cloud as object), ...(local as object) } : { ...(local as object), ...(cloud as object) }
  }
  return localWins ? local : cloud
}
