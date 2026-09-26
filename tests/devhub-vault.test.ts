import { beforeEach, describe, expect, it } from "vitest"
import {
  changePin,
  disableProtection,
  enableProtection,
  getPasswordSecurity,
  isUnlocked,
  lockVault,
  openSecrets,
  sealSecrets,
  verifyPin,
  verifyRecoveryCode,
} from "@/components/devhub/security"
import { getDevItems, saveDevItem } from "@/components/devhub/store"

async function sha256Hex(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

beforeEach(() => {
  localStorage.clear()
  lockVault()
})

describe("DevHub vault", () => {
  it("stores plain secrets when protection is off", async () => {
    expect(await sealSecrets({ password: "p" })).toEqual({ password: "p", secretEnc: undefined })
  })

  it("encrypts existing items on enable and decrypts with the right PIN only", async () => {
    saveDevItem({ title: "db", type: "credential", category: "x", username: "u", password: "hunter2" })
    const code = await enableProtection("123456")
    expect(code).toMatch(/^[0-9A-Z]{8}$/)

    const [item] = getDevItems()
    expect(item.password).toBeUndefined()
    expect(item.secretEnc?.ct).toBeTruthy()
    expect(JSON.stringify(localStorage)).not.toContain("hunter2")

    lockVault()
    expect(isUnlocked()).toBe(false)
    await expect(openSecrets(item)).rejects.toThrow()

    expect((await verifyPin("000000")).ok).toBe(false)
    expect((await verifyPin("123456")).ok).toBe(true)
    expect(await openSecrets(item)).toEqual({ password: "hunter2" })
  })

  it("recovers with the recovery code and keeps data after changing the PIN", async () => {
    const code = await enableProtection("1111")
    saveDevItem({ title: "api", type: "api", category: "x", ...(await sealSecrets({ apiKey: "sk-1" })) })
    lockVault()

    expect(await verifyRecoveryCode("WRONG123")).toBe(false)
    expect(await verifyRecoveryCode(code.toLowerCase())).toBe(true)
    await changePin("2222")
    lockVault()

    expect((await verifyPin("1111")).ok).toBe(false)
    expect((await verifyPin("2222")).ok).toBe(true)
    expect(await openSecrets(getDevItems()[0])).toEqual({ apiKey: "sk-1" })
  })

  it("migrates a legacy SHA-256 PIN to the vault", async () => {
    saveDevItem({ title: "old", type: "api", category: "x", apiKey: "legacy-key" })
    localStorage.setItem(
      "ph_devhub_password_security",
      JSON.stringify({ enabled: true, pinHash: await sha256Hex("4321") })
    )
    expect(getPasswordSecurity().enabled).toBe(true)

    const res = await verifyPin("4321")
    expect(res.ok).toBe(true)
    expect(res.recoveryCode).toBeTruthy()
    const [item] = getDevItems()
    expect(item.apiKey).toBeUndefined()
    expect(await openSecrets(item)).toEqual({ apiKey: "legacy-key" })
  })

  it("locks out after 5 wrong attempts", async () => {
    await enableProtection("1234")
    lockVault()
    for (let i = 0; i < 5; i++) await verifyPin("9999")
    expect((await verifyPin("1234")).ok).toBe(false)
  })

  it("disabling decrypts items back", async () => {
    saveDevItem({ title: "db", type: "credential", category: "x", password: "pw" })
    await enableProtection("1234")
    await disableProtection()
    expect(getPasswordSecurity().enabled).toBe(false)
    expect(getDevItems()[0].password).toBe("pw")
    expect(getDevItems()[0].secretEnc).toBeUndefined()
  })
})
