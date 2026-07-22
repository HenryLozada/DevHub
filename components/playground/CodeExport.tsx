import { useMemo, useState } from "react"
import { Copy, Check } from "lucide-react"
import { sileo } from "sileo"
import type { ComponentMeta } from "./types"

interface Props {
  meta: ComponentMeta
  values: Record<string, unknown>
  integrationSnippet?: string
}

export function CodeExport({ meta, values, integrationSnippet }: Props) {
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<"jsx" | "integration">("jsx")

  const code = useMemo(() => {
    if (mode === "integration" && integrationSnippet) return integrationSnippet
    const children = (values.children as string) ?? ""
    return meta.codeTemplate(values, children)
  }, [meta, values, mode, integrationSnippet])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      sileo.success({ title: "Copiado", description: "Código copiado al portapapeles." })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      sileo.error({ title: "Error", description: "No se pudo copiar el código." })
    }
  }

  return (
    <div className="relative space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Código
          </label>
          {integrationSnippet && (
            <div className="flex gap-1">
              <button
                onClick={() => setMode("jsx")}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                  mode === "jsx"
                    ? "bg-[#76b900] text-black border-[#76b900]"
                    : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                JSX
              </button>
              <button
                onClick={() => setMode("integration")}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                  mode === "integration"
                    ? "bg-[#76b900] text-black border-[#76b900]"
                    : "bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                + Integración
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-[#76b900] transition-colors rounded-none cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="w-full overflow-x-auto bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none p-4 text-xs font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed select-all">
        <code>{code}</code>
      </pre>
    </div>
  )
}
