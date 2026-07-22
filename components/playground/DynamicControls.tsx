import type { ComponentMeta, PropDefinition } from "./types"
import { StringControl, TextControl } from "./controls/StringControl"
import { NumberControl } from "./controls/NumberControl"
import { BooleanControl } from "./controls/BooleanControl"
import { SelectControl } from "./controls/SelectControl"
import { ColorControl } from "./controls/ColorControl"

interface Props {
  meta: ComponentMeta
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

export function DynamicControls({ meta, values, onChange }: Props) {
  return (
    <div className="space-y-4">
      {meta.props.map((def) => (
        <ControlRow key={def.key} def={def} value={values[def.key]} onChange={(v) => onChange(def.key, v)} />
      ))}
    </div>
  )
}

function ControlRow({ def, value, onChange }: { def: PropDefinition; value: unknown; onChange: (val: any) => void }) {
  switch (def.type) {
    case "string":
      return <StringControl def={def} value={value} onChange={onChange} />
    case "text":
      return <TextControl def={def} value={value} onChange={onChange} />
    case "number":
      return <NumberControl def={def} value={value} onChange={onChange} />
    case "boolean":
      return <BooleanControl def={def} value={value} onChange={onChange} />
    case "select":
      return <SelectControl def={def} value={value} onChange={onChange} />
    case "color":
      return <ColorControl def={def} value={value} onChange={onChange} />
    default:
      return <p className="text-[10px] text-zinc-400">Tipo no soportado: {def.type}</p>
  }
}
