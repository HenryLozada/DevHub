import { useState } from "react";
import { X, ShieldCheck, Copy, Check } from "lucide-react";
import { getPasswordSecurity, createRecoveryCode, savePasswordSecurity } from "../security";
import { sileo } from "sileo";

interface PasswordSecurityDialogProps {
  mode: "settings" | "verify";
  onClose: () => void;
  onVerified?: (verified: boolean) => void;
  onChanged?: () => void;
}

export function PasswordSecurityDialog({ mode, onClose, onVerified, onChanged }: PasswordSecurityDialogProps) {
  const current = getPasswordSecurity();
  const [step, setStep] = useState<"menu" | "current" | "recovery" | "new" | "recoveryView">(mode === "verify" ? "new" : "menu");
  const [value, setValue] = useState("");
  const [newPin, setNewPin] = useState("");
  const [copied, setCopied] = useState(false);
  const [pendingAction, setPendingAction] = useState<"change" | "disable">("change");

  const close = () => {
    onVerified?.(false);
    onClose();
  };

  const submitPin = () => {
    if (!/^\d{4}$/.test(value)) return;
    if (mode === "verify") {
      onVerified?.(value === current.pin);
      if (value !== current.pin) sileo.error({ title: "PIN incorrecto", description: "No se puede mostrar la contraseña." });
      onClose();
      return;
    }
    if (step === "current" && value === current.pin) {
      if (pendingAction === "disable") {
        savePasswordSecurity({ enabled: false });
        sileo.success({ title: "Protección desactivada", description: "Las contraseñas ya no pedirán PIN." });
        onChanged?.();
        onClose();
        return;
      }
      setValue("");
      setStep("new");
      return;
    }
    if (step === "current") {
      sileo.error({ title: "PIN incorrecto", description: "Introduce tu PIN actual." });
      return;
    }
  };

  const submitNewPin = () => {
    if (!/^\d{4}$/.test(newPin)) return;
    const recoveryCode = current.recoveryCode || createRecoveryCode();
    savePasswordSecurity({ enabled: true, pin: newPin, recoveryCode });
    setStep("recoveryView");
    setValue(recoveryCode);
    onChanged?.();
  };

  const submitRecovery = () => {
    if (value.trim().toUpperCase() === current.recoveryCode) {
      setValue("");
      setStep("new");
    } else {
      sileo.error({ title: "Código incorrecto", description: "Revisa tu código de recuperación." });
    }
  };

  const title = mode === "verify" ? "Autorización requerida" : step === "menu" ? "Seguridad de contraseñas" : step === "recoveryView" ? "Código de recuperación" : step === "recovery" ? "Recuperar PIN" : step === "new" ? "Nuevo PIN" : "Cambiar PIN";
  const description = mode === "verify" ? "Introduce tu PIN para ver la contraseña." : step === "menu" ? "Configura una protección global para todas tus contraseñas." : step === "recoveryView" ? "Guárdalo en un lugar seguro. También puedes copiarlo." : step === "recovery" ? "Usa el código de recuperación guardado." : step === "new" ? "Elige un PIN de 4 dígitos." : "Confirma tu PIN actual para continuar.";
  const actionClass = "w-full border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:border-[#76b900] hover:text-[#76b900] cursor-pointer";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default" onClick={close} aria-label="Cerrar" />
      <div className="relative w-full max-w-sm border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-5">
          <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#76b900]" /><div><h2 className="font-mono font-bold text-sm uppercase tracking-wider text-zinc-900 dark:text-white">{title}</h2><p className="text-[11px] text-zinc-500 mt-1">{description}</p></div></div>
          <button onClick={close} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {mode === "settings" && step === "menu" && (
          <div className="space-y-2">
            {current.enabled ? (
              <>
                <button onClick={() => { setPendingAction("change"); setStep("current"); setValue(""); }} className={actionClass}>Cambiar PIN</button>
                <button onClick={() => { setStep("recovery"); setValue(""); }} className={actionClass}>Recuperar PIN</button>
                <button onClick={() => { setStep("recoveryView"); setValue(current.recoveryCode || ""); }} className={actionClass}>Ver código de recuperación</button>
                <button onClick={() => { setPendingAction("disable"); setStep("current"); setValue(""); }} className={`${actionClass} text-red-500`}>Desactivar protección</button>
              </>
            ) : <button onClick={() => { setStep("new"); setNewPin(""); }} className={actionClass}>Activar protección global</button>}
          </div>
        )}

        {mode === "settings" && step === "recoveryView" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border border-[#76b900]/50 bg-[#76b900]/10 p-4">
              <code className="flex-1 select-all text-center font-mono text-lg font-bold tracking-widest text-zinc-900 dark:text-white">{value}</code>
              <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="shrink-0 border border-zinc-300 dark:border-zinc-700 p-2 text-zinc-500 hover:text-[#76b900] cursor-pointer" title="Copiar código">
                {copied ? <Check className="w-4 h-4 text-[#76b900]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Puedes seleccionar el código con el cursor o usar el botón copiar.</p>
            <button onClick={onClose} className="w-full bg-[#76b900] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black cursor-pointer hover:bg-[#86cb10]">Entendido</button>
          </div>
        ) : mode === "verify" || (mode === "settings" && (step === "current" || step === "recovery")) ? (
          <form onSubmit={(e) => { e.preventDefault(); step === "recovery" ? submitRecovery() : submitPin(); }} className="space-y-4">
            <input autoFocus type={step === "recovery" ? "text" : "password"} inputMode={step === "recovery" ? "text" : "numeric"} maxLength={step === "recovery" ? 8 : 4} value={value === "__DISABLE__" ? "" : value} onChange={(e) => setValue(step === "recovery" ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={step === "recovery" ? "CÓDIGO" : "••••"} className="w-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-3 text-center font-mono tracking-[0.4em] text-zinc-900 dark:text-white focus:outline-none focus:border-[#76b900]" />
            <button type="submit" className="w-full bg-[#76b900] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black cursor-pointer hover:bg-[#86cb10]">Continuar</button>
          </form>
        ) : mode === "settings" && step === "new" ? (
          <form onSubmit={(e) => { e.preventDefault(); submitNewPin(); }} className="space-y-4">
            <input autoFocus type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="PIN de 4 dígitos" className="w-full border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-3 text-center font-mono tracking-[0.4em] text-zinc-900 dark:text-white focus:outline-none focus:border-[#76b900]" />
            <button type="submit" className="w-full bg-[#76b900] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black cursor-pointer hover:bg-[#86cb10]">Guardar PIN</button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
