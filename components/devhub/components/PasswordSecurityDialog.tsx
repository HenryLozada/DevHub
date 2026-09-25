import { useState } from "react"
import { X, ShieldCheck, Copy, Check } from "lucide-react"
import {
  getPasswordSecurity,
  enableProtection,
  changePin,
  disableProtection,
  verifyPin,
  verifyRecoveryCode,
  isLockedOut,
  PIN_PATTERN,
} from "../security"
import { sileo } from "sileo"

interface PasswordSecurityDialogProps {
  mode: "settings" | "verify"
  onClose: () => void
  onVerified?: (verified: boolean) => void
  onChanged?: () => void
}

export function PasswordSecurityDialog({
  mode,
  onClose,
  onVerified,
  onChanged,
}: PasswordSecurityDialogProps) {
  const current = getPasswordSecurity()
  const [step, setStep] = useState<
    "menu" | "current" | "recovery" | "new" | "recoveryView"
  >(mode === "verify" ? "current" : "menu")
  const [value, setValue] = useState("")
  const [newPin, setNewPin] = useState("")
  const [copied, setCopied] = useState(false)
  const [pendingAction, setPendingAction] = useState<"change" | "disable" | "viewRecovery">("change")
  const [plainRecovery, setPlainRecovery] = useState("")
  const [busy, setBusy] = useState(false)

  const close = () => {
    onVerified?.(false)
    onClose()
  }

  const submitPin = async () => {
    if (!PIN_PATTERN.test(value) || busy) return
    if (isLockedOut()) {
      sileo.error({ title: "Bloqueado", description: "Demasiados intentos. Espera un minuto." })
      return
    }
    setBusy(true)
    try {
      const { ok, recoveryCode } = await verifyPin(value)
      if (recoveryCode) {
        // Legacy PIN was migrated to the encrypted vault: the old recovery code no longer applies
        onVerified?.(ok)
        onChanged?.()
        setPlainRecovery(recoveryCode)
        setStep("recoveryView")
        sileo.info({ title: "Seguridad actualizada", description: "Tus credenciales ahora están cifradas. Guarda tu nuevo código de recuperación." })
        return
      }
      if (mode === "verify") {
        onVerified?.(ok)
        if (!ok) sileo.error({ title: "PIN incorrecto", description: "No se puede mostrar la contraseña." })
        onClose()
        return
      }
      if (step === "current") {
        if (!ok) {
          sileo.error({ title: "PIN incorrecto", description: "Introduce tu PIN actual." })
          return
        }
        if (pendingAction === "disable") {
          try {
            await disableProtection()
          } catch {
            sileo.error({ title: "Error", description: "No se pudo desactivar la protección." })
            return
          }
          sileo.success({ title: "Protección desactivada", description: "Las contraseñas ya no pedirán PIN ni estarán cifradas." })
          onChanged?.()
          onClose()
          return
        }
        if (pendingAction === "viewRecovery") {
          sileo.info({
            title: "Código no recuperable",
            description: "Por seguridad el código se guarda hasheado. Usa Recuperar PIN o regenera activando de nuevo.",
          })
          setStep("menu")
          setValue("")
          return
        }
        setValue("")
        setStep("new")
      }
    } finally {
      setBusy(false)
    }
  }

  const submitNewPin = async () => {
    if (!PIN_PATTERN.test(newPin) || busy) return
    setBusy(true)
    try {
      if (current.enabled) {
        const maybeCode = await changePin(newPin)
        if (maybeCode) {
          setPlainRecovery(maybeCode)
          setStep("recoveryView")
        } else {
          sileo.success({ title: "PIN actualizado", description: "El nuevo PIN ya está activo." })
          onChanged?.()
          onClose()
        }
      } else {
        const recoveryCode = await enableProtection(newPin)
        setPlainRecovery(recoveryCode)
        setStep("recoveryView")
      }
      onChanged?.()
    } finally {
      setBusy(false)
    }
  }

  const submitRecovery = async () => {
    if (busy) return
    setBusy(true)
    try {
      const ok = await verifyRecoveryCode(value)
      if (ok) {
        setValue("")
        setStep("new")
      } else {
        sileo.error({ title: "Código incorrecto", description: "Revisa tu código de recuperación." })
      }
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === "verify"
      ? "Autorización requerida"
      : step === "menu"
        ? "Seguridad de contraseñas"
        : step === "recoveryView"
          ? "Código de recuperación"
          : step === "recovery"
            ? "Recuperar PIN"
            : step === "new"
              ? "Nuevo PIN"
              : "Confirmar PIN"

  const description =
    mode === "verify"
      ? "Introduce tu PIN para continuar."
      : step === "menu"
        ? "Configura una protección global para todas tus contraseñas."
        : step === "recoveryView"
          ? "Guárdalo ahora. No se volverá a mostrar en texto plano."
          : step === "recovery"
            ? "Usa el código de recuperación guardado."
            : step === "new"
              ? "Elige un PIN de 4 a 8 dígitos (6 o más es más seguro)."
              : "Confirma tu PIN actual para continuar."

  const actionClass =
    "w-full border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:border-[#76b900] hover:text-[#76b900] cursor-pointer"

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default" onClick={close} aria-label="Cerrar" />
      <div className="relative w-full max-w-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#76b900]" />
            <div>
              <h2 className="font-mono font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-white">{title}</h2>
              <p className="text-[11px] text-zinc-500 mt-1">{description}</p>
            </div>
          </div>
          <button onClick={close} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === "settings" && step === "menu" && (
          <div className="space-y-2">
            {current.enabled ? (
              <>
                <button
                  onClick={() => {
                    setPendingAction("change")
                    setStep("current")
                    setValue("")
                  }}
                  className={actionClass}
                >
                  Cambiar PIN
                </button>
                <button
                  onClick={() => {
                    setStep("recovery")
                    setValue("")
                  }}
                  className={actionClass}
                >
                  Recuperar PIN
                </button>
                <button
                  onClick={() => {
                    setPendingAction("disable")
                    setStep("current")
                    setValue("")
                  }}
                  className={`${actionClass} text-red-500`}
                >
                  Desactivar protección
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setStep("new")
                  setNewPin("")
                }}
                className={actionClass}
              >
                Activar protección global
              </button>
            )}
          </div>
        )}

        {step === "recoveryView" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border border-[#76b900]/50 bg-[#76b900]/10 p-4">
              <code className="flex-1 select-all text-center font-mono text-lg font-bold tracking-widest text-zinc-900 dark:text-white">
                {plainRecovery}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(plainRecovery)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
                className="shrink-0 border border-zinc-300 dark:border-zinc-700 p-2 text-zinc-500 hover:text-[#76b900] cursor-pointer"
                title="Copiar código"
              >
                {copied ? <Check className="w-4 h-4 text-[#76b900]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Puedes seleccionar el código o usar el botón copiar. Guárdalo fuera de esta app.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-[#76b900] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black cursor-pointer hover:bg-[#86cb10]"
            >
              Entendido
            </button>
          </div>
        ) : mode === "verify" || (mode === "settings" && (step === "current" || step === "recovery")) ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              step === "recovery" ? void submitRecovery() : void submitPin()
            }}
            className="space-y-4"
          >
            <input
              autoFocus
              type={step === "recovery" ? "text" : "password"}
              inputMode={step === "recovery" ? "text" : "numeric"}
              maxLength={step === "recovery" ? 12 : 8}
              value={value}
              onChange={(e) =>
                setValue(
                  step === "recovery"
                    ? e.target.value.toUpperCase().slice(0, 12)
                    : e.target.value.replace(/\D/g, "").slice(0, 8)
                )
              }
              placeholder={step === "recovery" ? "CÓDIGO" : "••••"}
              className="w-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-3 text-center font-mono tracking-[0.4em] text-zinc-900 dark:text-white focus:outline-none focus:border-[#76b900]"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#76b900] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black cursor-pointer hover:bg-[#86cb10] disabled:opacity-50"
            >
              Continuar
            </button>
          </form>
        ) : mode === "settings" && step === "new" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submitNewPin()
            }}
            className="space-y-4"
          >
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="PIN de 4 a 8 dígitos"
              className="w-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-3 text-center font-mono tracking-[0.4em] text-zinc-900 dark:text-white focus:outline-none focus:border-[#76b900]"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#76b900] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black cursor-pointer hover:bg-[#86cb10] disabled:opacity-50"
            >
              Guardar PIN
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
