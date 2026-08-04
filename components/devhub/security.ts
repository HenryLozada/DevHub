const SECURITY_KEY = "ph_devhub_password_security"
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60_000

export interface PasswordSecurity {
  enabled: boolean
  pinHash?: string
  recoveryHash?: string
  /** Plain recovery shown only once after setup; never re-persisted after first view session */
  attempts?: number
  lockedUntil?: number
  /** Legacy plaintext fields — migrated on first verify */
  pin?: string
  recoveryCode?: string
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return toHex(hash)
}

export function getPasswordSecurity(): PasswordSecurity {
  try {
    return JSON.parse(localStorage.getItem(SECURITY_KEY) || "null") || { enabled: false }
  } catch {
    return { enabled: false }
  }
}

export function savePasswordSecurity(security: PasswordSecurity): void {
  const clean: PasswordSecurity = {
    enabled: security.enabled,
    pinHash: security.pinHash,
    recoveryHash: security.recoveryHash,
    attempts: security.attempts ?? 0,
    lockedUntil: security.lockedUntil,
  }
  localStorage.setItem(SECURITY_KEY, JSON.stringify(clean))
  window.dispatchEvent(new Event("ph:password-security-update"))
}

export function createRecoveryCode(): string {
  const bytes = new Uint8Array(5)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(36).toUpperCase().padStart(2, "0"))
    .join("")
    .slice(0, 8)
}

export async function hashSecret(value: string): Promise<string> {
  return sha256(value.trim().toUpperCase())
}

export async function hashPin(pin: string): Promise<string> {
  return sha256(pin.trim())
}

export function isLockedOut(security: PasswordSecurity = getPasswordSecurity()): boolean {
  return Boolean(security.lockedUntil && security.lockedUntil > Date.now())
}

export async function verifyPin(pin: string): Promise<boolean> {
  const security = getPasswordSecurity()
  if (!security.enabled) return true
  if (isLockedOut(security)) return false

  // Migrate legacy plaintext pin once
  if (security.pin && !security.pinHash) {
    const pinHash = await hashPin(security.pin)
    const recoveryHash = security.recoveryCode
      ? await hashSecret(security.recoveryCode)
      : security.recoveryHash
    savePasswordSecurity({ enabled: true, pinHash, recoveryHash })
    return pin === security.pin
  }

  if (!security.pinHash) return false
  const ok = (await hashPin(pin)) === security.pinHash
  if (ok) {
    savePasswordSecurity({ ...security, attempts: 0, lockedUntil: undefined })
    return true
  }

  const attempts = (security.attempts ?? 0) + 1
  const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : undefined
  savePasswordSecurity({
    ...security,
    attempts: lockedUntil ? 0 : attempts,
    lockedUntil,
  })
  return false
}

export async function verifyRecoveryCode(code: string): Promise<boolean> {
  const security = getPasswordSecurity()
  if (security.recoveryCode && !security.recoveryHash) {
    return code.trim().toUpperCase() === security.recoveryCode.toUpperCase()
  }
  if (!security.recoveryHash) return false
  return (await hashSecret(code)) === security.recoveryHash
}

export async function enableProtection(pin: string): Promise<string> {
  const recoveryCode = createRecoveryCode()
  const pinHash = await hashPin(pin)
  const recoveryHash = await hashSecret(recoveryCode)
  savePasswordSecurity({ enabled: true, pinHash, recoveryHash, attempts: 0 })
  return recoveryCode
}

export async function changePin(newPin: string, existingRecoveryCode?: string): Promise<string | void> {
  const security = getPasswordSecurity()
  const pinHash = await hashPin(newPin)
  let recoveryHash = security.recoveryHash
  let recoveryCode: string | undefined

  if (!recoveryHash) {
    recoveryCode = existingRecoveryCode || createRecoveryCode()
    recoveryHash = await hashSecret(recoveryCode)
  }

  savePasswordSecurity({
    enabled: true,
    pinHash,
    recoveryHash,
    attempts: 0,
  })
  return recoveryCode
}

export function disableProtection(): void {
  savePasswordSecurity({ enabled: false })
}
