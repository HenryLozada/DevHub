import type { PropDefinition } from "../types"

interface Props {
  def: PropDefinition
  value: unknown
  onChange: (val: boolean) => void
}

export function BooleanControl({ def, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <label className="eyebrow">
        {def.label}
      </label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-[34px] h-[21px] rounded-full transition-colors border ${
          value
            ? "bg-brand border-brand"
            : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] size-[15px] bg-white rounded-full transition-transform ${
            value ? "translate-x-[13px]" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
