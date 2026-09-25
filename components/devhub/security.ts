// DevHub vault: credentials (password / apiKey) are encrypted with a random master key.
// The master key is wrapped twice — with a PIN-derived key and a recovery-code-derived key —
// and the wrapped copies (never the PIN) are synced to Supabase so every device can unlock.
import { readStore, writeStore } from "@/lib/local-store"
import {
  PBKDF2_ITERATIONS,
  decryptJSON,
  deriveKey,
  encryptJSON,
  generateMasterKey,
  randomSalt,
  unwrapKey,
  wrapKey,
  type Sealed,
} from "./crypto"
import type { DevItem } from "./types"

const VAULT_KEY = "ph_devhub_vault"
const ITEMS_KEY = "ph_devhub_items"
/** Local-only: lockout counters and the legacy (pre-vault) SHA-256 PIN config */
const SECURITY_KEY = "ph_devhub_password_security"
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60_000
const AUTO_LOCK_MS = 5 * 60_000

export const PIN_PATTERN = /^\d{4,8}$/

interface Vault {
  v: 1
  enabled: boolean
  iterations?: number
  pinSalt?: string
  pinWrap?: Sealed
  recoverySalt?: string
  recoveryWrap?: Sealed
}

export interface PasswordSecurity {
  enabled: boolean
  attempts?: number
  lockedUntil?: number
  /** Legacy fields from the pre-vault version, migrated on first successful PIN */
  pinHash?: string
  recoveryHash?: string
}

export interface ItemSecrets {
  password?: string
  apiKey?: string
}

/* ─── State ─── */

let unlockedKey: CryptoKey | null = null
/** recoverySalt of the vault the in-memory key belongs to (it never changes for a vault) */
let unlockedVaultId: string | null = null
let lockTimer: ReturnType<typeof setTimeout> | null = null

function getVault(): Vault | null {
  const vault = readStore<Vault | null>(VAULT_KEY, null)
  return vault && vault.v === 1 && vault.enabled && vault.pinWrap ? vault : null
}

function getLocal(): PasswordSecurity {
  try {
    return JSON.parse(localStorage.getItem(SECURITY_KEY) || "null") || { enabled: false }
  } catch {
    return { enabled: false }
  }
}

function saveLocal(security: PasswordSecurity): void {
  localStorage.setItem(SECURITY_KEY, JSON.stringify(security))
  window.dispatchEvent(new Event("ph:password-security-update"))
}

function setUnlocked(key: CryptoKey) {
  unlockedKey = key
  unlockedVaultId = getVault()?.recoverySalt ?? null
  touchVault()
}

/** The master key, only if it belongs to the vault currently stored (guards logout / user switch). */
function activeKey(): CryptoKey | null {
  const vault = getVault()
  if (!unlockedKey || !vault || vault.recoverySalt !== unlockedVaultId) return null
  return unlockedKey
}

/** Extends the auto-lock window; call whenever secrets are used. */
export function touchVault() {
  if (lockTimer) clearTimeout(lockTimer)
  lockTimer = setTimeout(lockVault, AUTO_LOCK_MS)
}

export function lockVault() {
  unlockedKey = null
  unlockedVaultId = null
  if (lockTimer) clearTimeout(lockTimer)
  lockTimer = null
}

export function isUnlocked(): boolean {
  return activeKey() !== null
}

export function getPasswordSecurity(): PasswordSecurity {
  const local = getLocal()
  const legacyEnabled = Boolean(local.enabled && local.pinHash)
  return { ...local, enabled: getVault() !== null || legacyEnabled }
}

export function isLockedOut(security: PasswordSecurity = getLocal()): boolean {
  return Boolean(security.lockedUntil && security.lockedUntil > Date.now())
}

function registerAttempt(ok: boolean) {
  const local = getLocal()
  if (ok) {
    saveLocal({ ...local, attempts: 0, lockedUntil: undefined })
    return
  }
  const attempts = (local.attempts ?? 0) + 1
  const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : undefined
  saveLocal({ ...local, attempts: lockedUntil ? 0 : attempts, lockedUntil })
}

/* ─── Recovery code ─── */

export function createRecoveryCode(): string {
  const bytes = new Uint8Array(5)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(36).toUpperCase().padStart(2, "0"))
    .join("")
    .slice(0, 8)
}

const normalizeRecovery = (code: string) => code.trim().toUpperCase()

async function sha256Hex(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

/* ─── Vault lifecycle ─── */

async function createVault(pin: string): Promise<string> {
  const key = await generateMasterKey()
  const recoveryCode = createRecoveryCode()
  const pinSalt = randomSalt()
  const recoverySalt = randomSalt()
  const vault: Vault = {
    v: 1,
    enabled: true,
    iterations: PBKDF2_ITERATIONS,
    pinSalt,
    pinWrap: await wrapKey(key, await deriveKey(pin, pinSalt)),
    recoverySalt,
    recoveryWrap: await wrapKey(key, await deriveKey(normalizeRecovery(recoveryCode), recoverySalt)),
  }
  writeStore(VAULT_KEY, vault)
  saveLocal({ enabled: false, attempts: 0 })
  setUnlocked(key)
  await encryptPlaintextItems()
  return recoveryCode
}

/** Turns on protection with a new PIN. Returns the recovery code to show once. */
export async function enableProtection(pin: string): Promise<string> {
  return createVault(pin)
}

/**
 * Verifies the PIN and unlocks the vault. For a legacy (pre-vault) PIN it also migrates to the
 * vault and returns a new recovery code that must be shown to the user.
 */
export async function verifyPin(pin: string): Promise<{ ok: boolean; recoveryCode?: string }> {
  if (isLockedOut()) return { ok: false }
  const vault = getVault()

  if (vault) {
    try {
      const wrapping = await deriveKey(pin, vault.pinSalt!, vault.iterations)
      setUnlocked(await unwrapKey(vault.pinWrap!, wrapping))
      registerAttempt(true)
      return { ok: true }
    } catch {
      registerAttempt(false)
      return { ok: false }
    }
  }

  const local = getLocal()
  if (local.enabled && local.pinHash) {
    const ok = (await sha256Hex(pin.trim())) === local.pinHash
    registerAttempt(ok)
    if (!ok) return { ok: false }
    return { ok: true, recoveryCode: await createVault(pin) }
  }

  return { ok: false }
}

/** Unlocks the vault with the recovery code so a new PIN can be set. */
export async function verifyRecoveryCode(code: string): Promise<boolean> {
  if (isLockedOut()) return false
  const vault = getVault()
  if (vault?.recoveryWrap && vault.recoverySalt) {
    try {
      const wrapping = await deriveKey(normalizeRecovery(code), vault.recoverySalt, vault.iterations)
      setUnlocked(await unwrapKey(vault.recoveryWrap, wrapping))
      registerAttempt(true)
      return true
    } catch {
      registerAttempt(false)
      return false
    }
  }
  const local = getLocal()
  if (local.recoveryHash) {
    const ok = (await sha256Hex(normalizeRecovery(code))) === local.recoveryHash
    registerAttempt(ok)
    return ok
  }
  return false
}

/**
 * Sets a new PIN after verifyPin/verifyRecoveryCode succeeded. Keeps the same master key and
 * recovery code. Returns a recovery code only when a new vault had to be created (legacy path).
 */
export async function changePin(newPin: string): Promise<string | void> {
  const vault = getVault()
  const masterKey = activeKey()
  if (!vault || !masterKey) return createVault(newPin)
  const pinSalt = randomSalt()
  writeStore(VAULT_KEY, {
    ...vault,
    iterations: PBKDF2_ITERATIONS,
    pinSalt,
    pinWrap: await wrapKey(masterKey, await deriveKey(newPin, pinSalt)),
  } satisfies Vault)
  touchVault()
}

/** Turns protection off: decrypts every credential back to plain fields and drops the vault. */
export async function disableProtection(): Promise<void> {
  if (getVault()) {
    const masterKey = activeKey()
    if (!masterKey) throw new Error("Vault is locked")
    const items = await Promise.all(
      readStore<DevItem[]>(ITEMS_KEY, []).map(async (item) => {
        if (!item.secretEnc) return item
        const secrets = await decryptJSON<ItemSecrets>(masterKey, item.secretEnc)
        const { secretEnc: _drop, ...rest } = item
        return { ...rest, ...secrets }
      })
    )
    writeStore(ITEMS_KEY, items)
  }
  writeStore(VAULT_KEY, { v: 1, enabled: false } satisfies Vault)
  lockVault()
  saveLocal({ enabled: false, attempts: 0 })
}

/* ─── Item secrets ─── */

function hasSecrets(s: ItemSecrets): boolean {
  return Boolean(s.password || s.apiKey)
}

/**
 * Prepares secrets for storage. With protection on it returns them encrypted (vault must be
 * unlocked); without protection it returns them as plain fields.
 */
export async function sealSecrets(secrets: ItemSecrets): Promise<Pick<DevItem, "password" | "apiKey" | "secretEnc">> {
  if (!hasSecrets(secrets)) return { password: undefined, apiKey: undefined, secretEnc: undefined }
  if (!getVault()) return { ...secrets, secretEnc: undefined }
  const masterKey = activeKey()
  if (!masterKey) throw new Error("Vault is locked")
  touchVault()
  return { password: undefined, apiKey: undefined, secretEnc: await encryptJSON(masterKey, secrets) }
}

/** Returns the item's secrets in plain text (vault must be unlocked for encrypted items). */
export async function openSecrets(item: DevItem): Promise<ItemSecrets> {
  if (!item.secretEnc) return { password: item.password, apiKey: item.apiKey }
  const masterKey = activeKey()
  if (!masterKey) throw new Error("Vault is locked")
  touchVault()
  return decryptJSON<ItemSecrets>(masterKey, item.secretEnc)
}

/** Encrypts any item still holding plain password/apiKey. Runs after every unlock. */
async function encryptPlaintextItems(): Promise<void> {
  const masterKey = activeKey()
  if (!masterKey) return
  const items = readStore<DevItem[]>(ITEMS_KEY, [])
  if (!items.some((i) => hasSecrets({ password: i.password, apiKey: i.apiKey }))) return
  const next = await Promise.all(
    items.map(async (item) => {
      const plain = { password: item.password, apiKey: item.apiKey }
      if (!hasSecrets(plain)) return item
      // Merge with any secrets already encrypted on this item
      const existing = item.secretEnc ? await decryptJSON<ItemSecrets>(masterKey, item.secretEnc) : {}
      const { password: _p, apiKey: _a, ...rest } = item
      return { ...rest, secretEnc: await encryptJSON(masterKey, { ...existing, ...plain }) }
    })
  )
  writeStore(ITEMS_KEY, next)
}

/** Call after a successful unlock so items synced as plain text from other devices get encrypted. */
export async function migratePlaintextItems(): Promise<void> {
  await encryptPlaintextItems()
}
