import { useState, useEffect, useMemo } from "react"
import { getInjections } from "./injection-store"

type Registry = typeof import("./registry")

interface Props {
  moduleId: string
  slot?: string
  className?: string
}

export function InjectionSlot({ moduleId, slot = "background", className }: Props) {
  const [version, setVersion] = useState(0)
  // The registry pulls in every animated background; load it only when something is injected
  const [registry, setRegistry] = useState<Registry | null>(null)

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1)
    window.addEventListener("ph:injection", handler)
    window.addEventListener("ph:update", handler)
    return () => {
      window.removeEventListener("ph:injection", handler)
      window.removeEventListener("ph:update", handler)
    }
  }, [])

  const injection = useMemo(
    () => getInjections()[moduleId]?.[slot] ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, moduleId, slot]
  )

  useEffect(() => {
    if (injection && !registry) void import("./registry").then(setRegistry)
  }, [injection, registry])

  if (!injection || !registry) return null
  const meta = registry.getComponentById(injection.componentId)
  if (!meta || !meta.component) return null

  const Comp = meta.component
  const props = meta.transformProps ? meta.transformProps(injection.props) : injection.props
  return <Comp {...(props as any)} className={className} />
}
