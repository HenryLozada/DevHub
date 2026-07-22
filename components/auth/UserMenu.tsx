import { useState, useRef } from "react"
import { LogOut, Download, Upload, Trash2, CloudUpload } from "lucide-react"
import { useAuth } from "@/lib/auth-store"
import { downloadBackup, importBackup, resetAllData, uploadAllToCloud } from "@/lib/local-store"
import { sileo } from "sileo"

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const initial = user.email?.charAt(0).toUpperCase() || "U"

  const handleDownload = () => {
    downloadBackup()
    sileo.success({ title: "Backup descargado", description: "Archivo JSON guardado." })
    setOpen(false)
  }

  const handleUploadClick = () => {
    fileRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const text = await file.text()
      const count = await importBackup(text)
      sileo.success({ title: "Datos restaurados", description: `${count} módulos importados y sincronizados.` })
      setOpen(false)
      setTimeout(() => window.location.reload(), 600)
    } catch (err: any) {
      sileo.error({ title: "Error al importar", description: err?.message || "Archivo no válido." })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleSyncUp = async () => {
    setBusy(true)
    try {
      const count = await uploadAllToCloud()
      sileo.success({ title: "Datos subidos", description: `${count} módulos sincronizados a la nube.` })
    } catch {
      sileo.error({ title: "Error", description: "No se pudo subir a la nube." })
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  const handleReset = async () => {
    setBusy(true)
    try {
      await resetAllData()
      sileo.success({ title: "Cuenta reseteada", description: "Todos los datos fueron eliminados." })
      setConfirmReset(false)
      setOpen(false)
      setTimeout(() => window.location.reload(), 600)
    } catch {
      sileo.error({ title: "Error", description: "No se pudo resetear." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setConfirmReset(false) }}
        className="w-7 h-7 rounded-sm bg-[#76b900]/10 border border-[#76b900]/20 flex items-center justify-center text-[10px] font-bold font-mono text-[#76b900] cursor-pointer hover:bg-[#76b900]/20 transition-colors"
        title={user.email || ""}
      >
        {initial}
      </button>

      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setConfirmReset(false) }} />
          <div className="absolute right-0 top-9 z-50 w-56 backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-lg overflow-hidden">
            {/* Email */}
            <div className="px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={handleDownload}
                disabled={busy}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-[#76b900] hover:bg-[#76b900]/5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" /> Descargar backup
              </button>

              <button
                onClick={handleUploadClick}
                disabled={busy}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-[#76b900] hover:bg-[#76b900]/5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Upload className="w-3.5 h-3.5" /> Restaurar backup
              </button>

              <button
                onClick={handleSyncUp}
                disabled={busy}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-[#76b900] hover:bg-[#76b900]/5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <CloudUpload className="w-3.5 h-3.5" /> Subir todo a la nube
              </button>
            </div>

            {/* Danger zone */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 py-1">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  disabled={busy}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-mono text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Resetear cuenta
                </button>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <p className="text-[9px] font-mono font-bold text-red-500 uppercase tracking-wider">
                    Esto borra TODO (local + nube)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 py-1.5 text-[9px] font-mono font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={busy}
                      className="flex-1 py-1.5 text-[9px] font-mono font-bold bg-red-600 text-white border border-red-600 cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-40"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => { signOut(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-mono text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
