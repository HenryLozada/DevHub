import { useState, useMemo, useEffect } from "react"
import { Check, X, Code2 } from "lucide-react"
import { COMPONENT_REGISTRY, getComponentById } from "./registry"
import type { ComponentMeta } from "./types"
import { DynamicControls } from "./DynamicControls"
import { LivePreview } from "./LivePreview"
import { CodeExport } from "./CodeExport"
import { MODULES, getModuleIntegration } from "./module-integrations"
import { setInjection, removeInjection, getInjections, type InjectionConfig } from "./injection-store"
import { cn } from "@/lib/utils"

const BACKGROUND_IDS = ["flickering-grid", "animated-grid-pattern", "interactive-grid-pattern", "particles"]

export function PlaygroundPanel() {
  const [selectedId, setSelectedId] = useState(COMPONENT_REGISTRY[0]?.id ?? "")
  const [propValues, setPropValues] = useState<Record<string, unknown>>(() => buildDefaults(COMPONENT_REGISTRY[0]!))
  const [destination, setDestination] = useState("")
  const [injections, setInjections] = useState<InjectionConfig>({})

  // Estado real de cada hub: qué efecto tiene aplicado ahora mismo
  useEffect(() => {
    const sync = () => setInjections(getInjections())
    sync()
    window.addEventListener("ph:injection", sync)
    window.addEventListener("ph:update", sync)
    return () => {
      window.removeEventListener("ph:injection", sync)
      window.removeEventListener("ph:update", sync)
    }
  }, [])

  const meta = useMemo(() => getComponentById(selectedId), [selectedId])
  const isBackground = !!meta && BACKGROUND_IDS.includes(meta.id)

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

  const apply = (moduleId: string) => {
    if (!meta) return
    const filtered: Record<string, unknown> = {}
    for (const def of meta.props) {
      if (def.key === "children") continue
      filtered[def.key] = propValues[def.key] ?? def.defaultValue
    }
    setDestination(moduleId)
    setInjection(moduleId, "background", { componentId: meta.id, props: filtered })
  }

  const effectName = (id?: string) => COMPONENT_REGISTRY.find((c) => c.id === id)?.name

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-f21 px-f13 py-f21 md:px-f34 md:py-f34">
      {/* Estado de los hubs */}
      <section className="panel p-f21">
        <div className="flex flex-wrap items-end justify-between gap-f13">
          <div>
            <p className="eyebrow">Estudio</p>
            <h1 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Personaliza el fondo de cada hub</h1>
          </div>
          <p className="text-xs text-zinc-500">Elige un efecto, ajústalo y aplícalo con un clic.</p>
        </div>
        <ul className="mt-f21 grid grid-cols-2 gap-f13 md:grid-cols-4">
          {MODULES.map((mod) => {
            const current = injections[mod.id]?.background
            return (
              <li key={mod.id} className="cal-chip flex items-center justify-between gap-f8 pl-f13"
                style={{ "--neon": current ? "var(--color-brand)" : "rgb(113 113 122 / 0.4)" } as React.CSSProperties}>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">{mod.label}</p>
                  <p className="truncate font-mono text-[10px] text-zinc-500">{current ? effectName(current.componentId) : "Por defecto"}</p>
                </div>
                {current && (
                  <button onClick={() => removeInjection(mod.id, "background")} title="Quitar efecto"
                    className="shrink-0 rounded-full p-f5 text-zinc-400 transition-colors hover:text-neg">
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Galería de efectos */}
      <div className="no-scrollbar inline-flex max-w-full self-start overflow-x-auto rounded-full border border-zinc-200 p-f3 dark:border-white/10">
        {COMPONENT_REGISTRY.map((c) => (
          <button key={c.id} onClick={() => handleSelect(c.id)}
            className={cn("shrink-0 rounded-full px-f13 py-f5 font-mono text-[10px] uppercase tracking-wider transition-colors",
              selectedId === c.id ? "bg-zinc-900 text-white dark:bg-white/10 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200")}>
            {c.name}
          </button>
        ))}
      </div>

      {meta && (
        <>
          {/* Vista previa 62% · Controles 38% */}
          <div className="grid gap-f21 lg:grid-cols-[1.618fr_1fr] lg:items-start">
            <section className="flex flex-col gap-f13">
              <LivePreview meta={meta} values={propValues} />
              <p className="px-f5 text-xs text-zinc-500">{meta.description}</p>
            </section>

            <section className="panel flex flex-col gap-f21 p-f21">
              <div>
                <p className="eyebrow mb-f13">Ajustes</p>
                <DynamicControls meta={meta} values={propValues} onChange={handleChange} />
              </div>

              {isBackground && (
                <div>
                  <div className="hairline mb-f21" />
                  <p className="eyebrow mb-f13">Aplicar a</p>
                  <div className="grid grid-cols-2 gap-f8">
                    {MODULES.map((mod) => {
                      const active = injections[mod.id]?.background?.componentId === meta.id
                      return (
                        <button key={mod.id} onClick={() => apply(mod.id)}
                          className={cn("reveal flex items-center justify-between gap-f5 rounded-full border px-f13 py-f8 text-xs transition-colors",
                            active ? "border-brand/60 text-zinc-900 dark:text-zinc-100" : "border-zinc-200 text-zinc-600 hover:border-brand dark:border-white/10 dark:text-zinc-300")}>
                          {mod.label}
                          {active && <Check className="size-3.5 text-brand" strokeWidth={3} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Código, para quien lo quiera */}
          <details className="panel group p-f21">
            <summary className="flex cursor-pointer list-none items-center gap-f8 text-sm text-zinc-600 dark:text-zinc-300">
              <Code2 className="size-4 text-zinc-400" /> Ver código
              <span className="eyebrow ml-auto group-open:hidden">Para desarrolladores</span>
            </summary>
            <div className="mt-f21 flex flex-col gap-f13">
              <div className="flex flex-wrap gap-f5">
                {[{ id: "", label: "Solo JSX" }, ...MODULES].map((mod) => (
                  <button key={mod.id} onClick={() => setDestination(mod.id)}
                    className={cn("rounded-full border px-f13 py-f5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                      destination === mod.id ? "border-brand text-brand" : "border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-white/10 dark:hover:text-zinc-200")}>
                    {mod.label}
                  </button>
                ))}
              </div>
              <CodeExport meta={meta} values={propValues} integrationSnippet={integrationSnippet} />
            </div>
          </details>
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
