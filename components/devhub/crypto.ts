// WebCrypto helpers for the DevHub vault: PBKDF2 key derivation, AES-GCM encryption and key wrapping

export interface Sealed {
  iv: string
  ct: string
}

export const PBKDF2_ITERATIONS = 310_000

function toB64(bytes: Uint8Array): string {
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function randomSalt(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(16)))
}

/** Derives an AES-GCM key from a low-entropy secret (PIN or recovery code). */
export async function deriveKey(secret: string, salt: string, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"])
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromB64(salt), iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
}

async function encryptBytes(key: CryptoKey, data: Uint8Array<ArrayBuffer>): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)
  return { iv: toB64(iv), ct: toB64(new Uint8Array(ct)) }
}

/** Throws if the key is wrong or the data was tampered with (GCM authentication). */
async function decryptBytes(key: CryptoKey, sealed: Sealed): Promise<Uint8Array<ArrayBuffer>> {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(sealed.iv) }, key, fromB64(sealed.ct))
  return new Uint8Array(pt)
}

export async function wrapKey(masterKey: CryptoKey, wrappingKey: CryptoKey): Promise<Sealed> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", masterKey))
  return encryptBytes(wrappingKey, raw)
}

export async function unwrapKey(sealed: Sealed, wrappingKey: CryptoKey): Promise<CryptoKey> {
  const raw = await decryptBytes(wrappingKey, sealed)
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"])
}

export async function encryptJSON(key: CryptoKey, value: unknown): Promise<Sealed> {
  return encryptBytes(key, new Uint8Array(new TextEncoder().encode(JSON.stringify(value))))
}

export async function decryptJSON<T>(key: CryptoKey, sealed: Sealed): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await decryptBytes(key, sealed))) as T
}
