import { readStore, writeStore } from "@/lib/local-store"

const STORE_KEY = "ph_playground_injections"

export interface InjectedComponent {
  componentId: string
  props: Record<string, unknown>
}

export interface InjectionConfig {
  [moduleId: string]: {
    background: InjectedComponent | null
  }
}

export function getInjections(): InjectionConfig {
  return readStore<InjectionConfig>(STORE_KEY, {})
}

export function setInjection(moduleId: string, slot: string, injection: InjectedComponent): void {
  const config = getInjections()
  if (!config[moduleId]) config[moduleId] = { background: null }
  ;(config[moduleId] as any)[slot] = injection
  writeStore(STORE_KEY, config)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ph:injection", { detail: { moduleId, slot } }))
  }
}

export function removeInjection(moduleId: string, slot: string): void {
  const config = getInjections()
  if (config[moduleId]) {
    ;(config[moduleId] as any)[slot] = null
    writeStore(STORE_KEY, config)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ph:injection", { detail: { moduleId, slot } }))
    }
  }
}

export { STORE_KEY }
