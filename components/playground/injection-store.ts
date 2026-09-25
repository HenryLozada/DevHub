import { readStore, writeStore } from "@/lib/local-store"

const STORE_KEY = "ph_playground_injections"

export interface InjectedComponent {
  componentId: string
  props: Record<string, unknown>
}

/** moduleId → slot name (e.g. "background") → injected component */
export type InjectionConfig = Record<string, Record<string, InjectedComponent | null>>

export function getInjections(): InjectionConfig {
  return readStore<InjectionConfig>(STORE_KEY, {})
}

export function setInjection(moduleId: string, slot: string, injection: InjectedComponent): void {
  const config = getInjections()
  if (!config[moduleId]) config[moduleId] = { background: null }
  config[moduleId][slot] = injection
  writeStore(STORE_KEY, config)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ph:injection", { detail: { moduleId, slot } }))
  }
}

export function removeInjection(moduleId: string, slot: string): void {
  const config = getInjections()
  if (config[moduleId]) {
    config[moduleId][slot] = null
    writeStore(STORE_KEY, config)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ph:injection", { detail: { moduleId, slot } }))
    }
  }
}

export { STORE_KEY }
