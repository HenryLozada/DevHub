import { useState, useMemo } from "react"
import { COMPONENT_REGISTRY, getComponentById, getCategories } from "./registry"
import type { ComponentMeta } from "./types"
import { DynamicControls } from "./DynamicControls"
import { LivePreview } from "./LivePreview"
import { CodeExport } from "./CodeExport"
import { MODULES, getModuleIntegration } from "./module-integrations"
import { setInjection, removeInjection } from "./injection-store"

export function PlaygroundPanel() {
  const [selectedId, setSelectedId] = useState(COMPONENT_REGISTRY[0]?.id ?? "")
  const [propValues, setPropValues] = useState<Record<string, unknown>>(() => buildDefaults(COMPONENT_REGISTRY[0]!))
  const [destination, setDestination] = useState("")

  const meta = useMemo(() => getComponentById(selectedId), [selectedId])
  const categories = useMemo(() => getCategories(), [])

  const integrationSnippet = useMemo(() => {
    if (!meta || !destination) return ""
    return getModuleIntegration(destination, meta.id, meta.name)
  }, [meta, destination])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const next = getComponentById(id)
    if (next) setPropValues(buildDefaults(next))
  }

  const handleChange = (key: string, value: unknown) => {
    setPropValues((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-8 space-y-4 md:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-lg md:text-2xl font-mono font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span className="text-[#76b900] font-bold">◆</span> PLAYGROUND
          </h1>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
            Magic UI Component Customizer
          </p>
        </div>
      </div>

      {/* Category pills + Component selector */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
              {cat}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COMPONENT_REGISTRY.filter((c) => c.category === cat).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className={`px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    selectedId === c.id
                      ? "bg-[#76b900] text-black border-[#76b900]"
                      : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {meta && (
        <>
          {/* Description */}
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">
            {meta.description}
          </p>

          {/* Preview + Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Preview */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                Vista Previa
              </label>
              <LivePreview meta={meta} values={propValues} />
            </div>

            {/* Controls */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                Controles
              </label>
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none p-4 md:p-5">
                <DynamicControls meta={meta} values={propValues} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Destino / Integration selector */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
              ¿Dónde quieres usarlo?
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDestination("")}
                className={`px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                  !destination
                    ? "bg-[#76b900] text-black border-[#76b900]"
                    : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                Solo JSX
              </button>
              {MODULES.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setDestination(mod.id)}
                  className={`px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    destination === mod.id
                      ? "bg-[#76b900] text-black border-[#76b900]"
                      : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {mod.label}
                </button>
              ))}
            </div>
            {destination && (
              <p className="text-[10px] font-mono text-zinc-400 mt-1.5">
                {MODULES.find((m) => m.id === destination)?.description} — {MODULES.find((m) => m.id === destination)?.file}
              </p>
            )}
          </div>

          {/* Apply / Remove */}
          {destination && (
            <div className="flex items-center gap-3 py-2">
              <button
                onClick={() => {
                  const filtered: Record<string, unknown> = {}
                  for (const def of meta.props) {
                    if (def.key === "children") continue
                    filtered[def.key] = propValues[def.key] ?? def.defaultValue
                  }
                  setInjection(destination, "background", {
                    componentId: meta.id,
                    props: filtered,
                  })
                }}
                className="px-5 py-2.5 bg-[#76b900] text-black font-mono text-xs font-bold uppercase tracking-wider border border-[#76b900] hover:bg-[#86cb00] transition-colors cursor-pointer"
              >
                Aplicar a {MODULES.find((m) => m.id === destination)?.label}
              </button>
              <button
                onClick={() => removeInjection(destination, "background")}
                className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Quitar fondo
              </button>
            </div>
          )}

          {/* Code Export */}
          <CodeExport meta={meta} values={propValues} integrationSnippet={integrationSnippet} />
        </>
      )}
    </div>
  )
}

function buildDefaults(meta?: ComponentMeta): Record<string, unknown> {
  if (!meta) return {}
  const defaults: Record<string, unknown> = {}
  for (const def of meta.props) {
    defaults[def.key] = def.defaultValue
  }
  return defaults
}
