import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, TrendingUp, TrendingDown } from "lucide-react"
import {
  type CashflowRule,
  type Recurrence,
  type RuleType,
  WEEKDAYS_FULL,
} from "@/lib/cashflow"
import { cn } from "@/lib/utils"

interface RuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: CashflowRule | null
  onSave: (data: Omit<CashflowRule, "id">) => void
  onDelete: (id: string) => void
}

export function RuleDialog({ open, onOpenChange, rule, onSave, onDelete }: RuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <RuleForm rule={rule} onSave={onSave} onDelete={onDelete} />}
      </DialogContent>
    </Dialog>
  )
}

function RuleForm({
  rule,
  onSave,
  onDelete,
}: Pick<RuleDialogProps, "rule" | "onSave" | "onDelete">) {
  const [concepto, setConcepto] = useState(rule?.concepto ?? "")
  const [monto, setMonto] = useState(rule ? String(rule.monto) : "")
  const [tipo, setTipo] = useState<RuleType>(rule?.tipo ?? "egreso")
  const [recurrencia, setRecurrencia] = useState<Recurrence>(rule?.recurrencia ?? "mensual")
  const [diaDelMes, setDiaDelMes] = useState(String(rule?.diaDelMes ?? 1))
  const [diaSemana, setDiaSemana] = useState(String(rule?.diaSemana ?? 5))

  const isEditing = Boolean(rule)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montoNum = Number.parseFloat(monto)
    if (!concepto.trim() || !Number.isFinite(montoNum) || montoNum <= 0) return

    onSave({
      concepto: concepto.trim(),
      monto: montoNum,
      tipo,
      recurrencia,
      diaDelMes: recurrencia === "mensual" ? Number.parseInt(diaDelMes, 10) : undefined,
      diaSemana: recurrencia === "semanal" ? Number.parseInt(diaSemana, 10) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar regla" : "Nueva regla"}</DialogTitle>
        <DialogDescription>
          Define un ingreso o egreso recurrente para proyectar tu flujo de caja.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Tipo: ingreso / egreso */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipo("ingreso")}
            aria-pressed={tipo === "ingreso"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-sm border p-2.5 text-sm font-medium transition-colors",
              tipo === "ingreso"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-hairline dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            )}
          >
            <TrendingUp className="size-4" />
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => setTipo("egreso")}
            aria-pressed={tipo === "egreso"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-sm border p-2.5 text-sm font-medium transition-colors",
              tipo === "egreso"
                ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
                : "border-hairline dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            )}
          >
            <TrendingDown className="size-4" />
            Egreso
          </button>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="rule-concepto">Concepto</Label>
          <Input
            id="rule-concepto"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Renta, Nómina, Internet"
            autoFocus
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="rule-monto">Monto (MXN)</Label>
          <Input
            id="rule-monto"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Recurrencia</Label>
          <Select value={recurrencia} onValueChange={(v) => setRecurrencia(v as Recurrence)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensual">Mensual (día fijo del mes)</SelectItem>
              <SelectItem value="semanal">Semanal (día de la semana)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recurrencia === "mensual" ? (
          <div className="grid gap-2">
            <Label htmlFor="rule-dia-mes">Día del mes</Label>
            <Select value={diaDelMes} onValueChange={(val) => setDiaDelMes(val ?? "")}>
              <SelectTrigger id="rule-dia-mes">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Día {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="rule-dia-semana">Día de la semana</Label>
            <Select value={diaSemana} onValueChange={(val) => setDiaSemana(val ?? "")}>
              <SelectTrigger id="rule-dia-semana">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS_FULL.map((wd, i) => (
                  <SelectItem key={wd} value={String(i)}>
                    {wd}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {isEditing ? (
          <Button
            type="button"
            variant="ghost"
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            onClick={() => onDelete(rule!.id)}
          >
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">{isEditing ? "Guardar cambios" : "Agregar regla"}</Button>
      </DialogFooter>
    </form>
  )
}
