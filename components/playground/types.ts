import type { ComponentType } from "react"

export type ControlType = "string" | "number" | "boolean" | "select" | "color" | "text"

export interface PropDefinition {
  key: string
  label: string
  type: ControlType
  defaultValue: unknown
  options?: { label: string; value: unknown }[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
}

export interface ComponentMeta {
  id: string
  name: string
  description: string
  category: string
  component: ComponentType<any>
  props: PropDefinition[]
  codeTemplate: (props: Record<string, unknown>, children?: string) => string
  transformProps?: (props: Record<string, unknown>) => Record<string, unknown>
}

export interface PlaygroundState {
  selectedId: string
  propValues: Record<string, unknown>
}
