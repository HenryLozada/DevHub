import { useCallback, useRef, useState } from "react"
import { getPasswordSecurity, isUnlocked, migratePlaintextItems, touchVault } from "../security"
import { PasswordSecurityDialog } from "./PasswordSecurityDialog"

/** Asks for the DevHub PIN when the vault is locked. Render `dialog` somewhere in the component. */
export function useVaultUnlock() {
  const [open, setOpen] = useState(false)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const requestUnlock = useCallback(async (): Promise<boolean> => {
    if (!getPasswordSecurity().enabled) return true
    if (isUnlocked()) {
      touchVault()
      return true
    }
    setOpen(true)
    const ok = await new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
    if (ok) await migratePlaintextItems()
    return ok
  }, [])

  const dialog = open ? (
    <PasswordSecurityDialog
      mode="verify"
      onClose={() => setOpen(false)}
      onVerified={(ok) => {
        resolver.current?.(ok)
        resolver.current = null
      }}
    />
  ) : null

  return { requestUnlock, dialog }
}
