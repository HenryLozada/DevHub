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

  const BACKGROUND_IDS = ["flickering-grid", "animated-grid-pattern", "interactive-grid-pattern", "particles"]
  const isBackground = BACKGROUND_IDS.includes(meta.id)

  return (
    <div className="panel flex min-h-[377px] items-center justify-center p-f34">
      {isBackground ? (
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
