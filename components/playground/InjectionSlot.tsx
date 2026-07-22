import { useState, useEffect, useMemo } from "react"
import { getInjections, type InjectedComponent } from "./injection-store"
import { getComponentById } from "./registry"

interface Props {
  moduleId: string
  slot?: string
  className?: string
}

export function InjectionSlot({ moduleId, slot = "background", className }: Props) {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    window.addEventListener("ph:injection", handler)
    window.addEventListener("ph:update", handler)
    return () => {
      window.removeEventListener("ph:injection", handler)
      window.removeEventListener("ph:update", handler)
    }
  }, [])

  const rendered = useMemo(() => {
    const config = getInjections()
    const injection: InjectedComponent | null = config[moduleId]?.[slot] ?? null
    if (!injection) return null

    const meta = getComponentById(injection.componentId)
    if (!meta || !meta.component) return null

    const Comp = meta.component
    const props = meta.transformProps
      ? meta.transformProps(injection.props as Record<string, unknown>)
      : injection.props
    return <Comp {...(props as any)} className={className} />
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, moduleId, slot, className])

  return rendered
}
