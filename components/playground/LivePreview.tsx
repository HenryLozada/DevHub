import { useMemo } from "react"
import type { ComponentMeta } from "./types"

interface Props {
  meta: ComponentMeta
  values: Record<string, unknown>
}

export function LivePreview({ meta, values }: Props) {
  const previewProps = useMemo(() => {
    const filtered: Record<string, unknown> = {}
    for (const def of meta.props) {
      if (def.key === "children") continue
      let val = values[def.key] ?? def.defaultValue
      if (def.key === "symbols" && typeof val === "string" && val.length > 0) {
        val = [val[0]]
      }
      filtered[def.key] = val
    }
    return meta.transformProps ? meta.transformProps(filtered) : filtered
  }, [meta, values])

  const children = (values.children as string) ?? ""

  return (
    <div className="relative flex items-center justify-center min-h-[200px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none p-6 overflow-hidden">
      {meta.id === "flickering-grid" || meta.id === "animated-grid-pattern" ? (
        <div className="absolute inset-0">
          <meta.component {...(previewProps as any)} className="h-full w-full" />
        </div>
      ) : (
        <meta.component {...(previewProps as any)}>
          {children || undefined}
        </meta.component>
      )}
    </div>
  )
}
