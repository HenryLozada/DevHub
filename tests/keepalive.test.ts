import { describe, expect, it } from "vitest"
import { handleKeepalive } from "@/lib/keepalive"

const fakeClient = (error: { message: string } | null = null) =>
  ({ from: () => ({ select: () => ({ limit: async () => ({ data: [], error }) }) }) }) as never

const req = (auth?: string) => new Request("http://x/api/keepalive", { headers: auth ? { authorization: auth } : {} })

describe("keepalive", () => {
  it("pings the database without a secret configured", async () => {
    const res = await handleKeepalive(req(), { client: fakeClient() })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it("rejects calls without the cron secret", async () => {
    expect((await handleKeepalive(req("Bearer nope"), { client: fakeClient(), secret: "s3cret" })).status).toBe(401)
    expect((await handleKeepalive(req("Bearer s3cret"), { client: fakeClient(), secret: "s3cret" })).status).toBe(200)
  })

  it("reports Supabase errors", async () => {
    const res = await handleKeepalive(req(), { client: fakeClient({ message: "paused" }) })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe("paused")
  })
})
