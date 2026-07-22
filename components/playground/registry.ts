import { RippleButton } from "@/components/ui/ripple-button"
import { FlickeringGrid } from "@/components/ui/flickering-grid"
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern"
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern"
import { Particles } from "@/components/ui/particles"
import type { ComponentMeta } from "./types"

export const COMPONENT_REGISTRY: ComponentMeta[] = [
  {
    id: "ripple-button",
    name: "RippleButton",
    description: "Botón con efecto de onda al hacer clic",
    category: "Buttons",
    component: RippleButton,
    props: [
      {
        key: "children",
        label: "Texto del botón",
        type: "string",
        defaultValue: "Click me",
        placeholder: "Ej: Enviar, Cancelar, etc.",
      },
      {
        key: "rippleColor",
        label: "Color del ripple",
        type: "color",
        defaultValue: "#ffffff",
      },
      {
        key: "duration",
        label: "Duración (ms)",
        type: "select",
        defaultValue: "600ms",
        options: [
          { label: "300ms (rápido)", value: "300ms" },
          { label: "600ms (normal)", value: "600ms" },
          { label: "1000ms (lento)", value: "1000ms" },
        ],
      },
      {
        key: "disabled",
        label: "Deshabilitado",
        type: "boolean",
        defaultValue: false,
      },
    ],
    codeTemplate: (props, children) => {
      const lines = [`<RippleButton`]
      if (props.rippleColor && props.rippleColor !== "#ffffff") {
        lines.push(`  rippleColor="${props.rippleColor}"`)
      }
      if (props.duration && props.duration !== "600ms") {
        lines.push(`  duration="${props.duration}"`)
      }
      if (props.disabled) lines.push(`  disabled`)
      lines.push(`>`)
      lines.push(`  ${children || "Click me"}`)
      lines.push(`</RippleButton>`)
      return lines.join("\n")
    },
  },
  {
    id: "flickering-grid",
    name: "FlickeringGrid",
    description: "Cuadrícula animada con parpadeo aleatorio estilo matrix",
    category: "Backgrounds",
    component: FlickeringGrid,
    props: [
      {
        key: "squareSize",
        label: "Tamaño de celda",
        type: "number",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
      },
      {
        key: "gridGap",
        label: "Separación",
        type: "number",
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 1,
      },
      {
        key: "flickerChance",
        label: "Probabilidad de parpadeo",
        type: "number",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        defaultValue: "#76b900",
      },
      {
        key: "maxOpacity",
        label: "Opacidad máxima",
        type: "number",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        key: "symbols",
        label: "Símbolo (un solo carácter)",
        type: "string",
        defaultValue: "",
        placeholder: "ej: ☠ ◆ ⬡ ◈ — vacío = cuadrados",
      },
    ],
    codeTemplate: (props) => {
      const lines = [`<FlickeringGrid`]
      if (props.squareSize !== 4) lines.push(`  squareSize={${props.squareSize}}`)
      if (props.gridGap !== 6) lines.push(`  gridGap={${props.gridGap}}`)
      if (props.flickerChance !== 0.3) lines.push(`  flickerChance={${props.flickerChance}}`)
      if (props.color && props.color !== "#76b900") lines.push(`  color="${props.color}"`)
      if (props.maxOpacity !== 0.3) lines.push(`  maxOpacity={${props.maxOpacity}}`)
      if (props.symbols) lines.push(`  symbols={["${(props.symbols as string)[0]}"]}`)
      lines.push(`  className="h-full w-full"`)
      lines.push(`/>`)
      return lines.join("\n")
    },
  },
  {
    id: "animated-grid-pattern",
    name: "AnimatedGridPattern",
    description: "Patrón de cuadrícula con recuadros animados",
    category: "Backgrounds",
    component: AnimatedGridPattern,
    props: [
      {
        key: "width",
        label: "Ancho de celda",
        type: "number",
        defaultValue: 40,
        min: 10,
        max: 100,
        step: 5,
      },
      {
        key: "height",
        label: "Alto de celda",
        type: "number",
        defaultValue: 40,
        min: 10,
        max: 100,
        step: 5,
      },
      {
        key: "numSquares",
        label: "Cantidad de recuadros",
        type: "number",
        defaultValue: 50,
        min: 5,
        max: 200,
        step: 5,
      },
      {
        key: "maxOpacity",
        label: "Opacidad máxima",
        type: "number",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
      },
      {
        key: "duration",
        label: "Duración animación (s)",
        type: "number",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
      },
      {
        key: "repeatDelay",
        label: "Retardo entre repeticiones (s)",
        type: "number",
        defaultValue: 0.5,
        min: 0,
        max: 5,
        step: 0.1,
      },
    ],
    codeTemplate: (props) => {
      const lines = [`<AnimatedGridPattern`]
      if (props.width !== 40) lines.push(`  width={${props.width}}`)
      if (props.height !== 40) lines.push(`  height={${props.height}}`)
      if (props.numSquares !== 50) lines.push(`  numSquares={${props.numSquares}}`)
      if (props.maxOpacity !== 0.5) lines.push(`  maxOpacity={${props.maxOpacity}}`)
      if (props.duration !== 4) lines.push(`  duration={${props.duration}}`)
      if (props.repeatDelay !== 0.5) lines.push(`  repeatDelay={${props.repeatDelay}}`)
      lines.push(`  className="h-full w-full"`)
      lines.push(`/>`)
      return lines.join("\n")
    },
  },
  {
    id: "interactive-grid-pattern",
    name: "InteractiveGridPattern",
    description: "Patrón de cuadrícula interactivo que resalta al hacer hover",
    component: InteractiveGridPattern,
    category: "background",
    props: [
      {
        key: "width",
        label: "Ancho de celda",
        type: "number",
        defaultValue: 40,
        min: 10,
        max: 120,
        step: 4,
      },
      {
        key: "height",
        label: "Alto de celda",
        type: "number",
        defaultValue: 40,
        min: 10,
        max: 120,
        step: 4,
      },
      {
        key: "horizontal",
        label: "Celdas horizontales",
        type: "number",
        defaultValue: 24,
        min: 4,
        max: 60,
        step: 2,
      },
      {
        key: "vertical",
        label: "Celdas verticales",
        type: "number",
        defaultValue: 24,
        min: 4,
        max: 60,
        step: 2,
      },
    ],
    transformProps: (props) => ({
      ...props,
      squares: [props.horizontal ?? 24, props.vertical ?? 24] as [number, number],
    }),
    codeTemplate: (props) => {
      const lines = [`<InteractiveGridPattern`]
      if (props.width !== 40) lines.push(`  width={${props.width}}`)
      if (props.height !== 40) lines.push(`  height={${props.height}}`)
      if (props.horizontal !== 24 || props.vertical !== 24)
        lines.push(`  squares={[${props.horizontal}, ${props.vertical}]}`)
      lines.push(`  className="h-full w-full"`)
      lines.push(`/>`)
      return lines.join("\n")
    },
  },
  {
    id: "particles",
    name: "Particles",
    description: "Partículas animadas que reaccionan al movimiento del mouse",
    component: Particles,
    category: "background",
    props: [
      {
        key: "quantity",
        label: "Cantidad",
        type: "number",
        defaultValue: 100,
        min: 10,
        max: 500,
        step: 10,
      },
      {
        key: "size",
        label: "Tamaño",
        type: "number",
        defaultValue: 0.4,
        min: 0.1,
        max: 3,
        step: 0.1,
      },
      {
        key: "staticity",
        label: "Staticity",
        type: "number",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 5,
      },
      {
        key: "ease",
        label: "Easing",
        type: "number",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 5,
      },
      {
        key: "color",
        label: "Color",
        type: "color",
        defaultValue: "#ffffff",
      },
      {
        key: "vx",
        label: "Velocidad X",
        type: "number",
        defaultValue: 0,
        min: -5,
        max: 5,
        step: 0.1,
      },
      {
        key: "vy",
        label: "Velocidad Y",
        type: "number",
        defaultValue: 0,
        min: -5,
        max: 5,
        step: 0.1,
      },
    ],
    codeTemplate: (props) => {
      const lines = [`<Particles`]
      if (props.quantity !== 100) lines.push(`  quantity={${props.quantity}}`)
      if (props.size !== 0.4) lines.push(`  size={${props.size}}`)
      if (props.staticity !== 50) lines.push(`  staticity={${props.staticity}}`)
      if (props.ease !== 50) lines.push(`  ease={${props.ease}}`)
      if (props.color !== "#ffffff") lines.push(`  color="${props.color}"`)
      if (props.vx !== 0) lines.push(`  vx={${props.vx}}`)
      if (props.vy !== 0) lines.push(`  vy={${props.vy}}`)
      lines.push(`  className="h-full w-full"`)
      lines.push(`/>`)
      return lines.join("\n")
    },
  },
]

export function getComponentById(id: string): ComponentMeta | undefined {
  return COMPONENT_REGISTRY.find((c) => c.id === id)
}

export function getCategories(): string[] {
  return [...new Set(COMPONENT_REGISTRY.map((c) => c.category))]
}
