import { useState, useEffect } from "react"
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
import { Trash2 } from "lucide-react"
import {
  type PersonalEvent,
  type EventCategory,
  type EventRecurrence,
} from "@/lib/events"
import { MONTHS, WEEKDAYS_FULL } from "@/lib/cashflow"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: PersonalEvent | null
  onSave: (data: Omit<PersonalEvent, "id">) => void
  onDelete: (id: string) => void
}

export function EventDialog({ open, onOpenChange, event, onSave, onDelete }: EventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && <EventForm event={event} onSave={onSave} onDelete={onDelete} />}
      </DialogContent>
    </Dialog>
  )
}

function EventForm({
  event,
  onSave,
  onDelete,
}: Pick<EventDialogProps, "event" | "onSave" | "onDelete">) {
  const [nombre, setNombre] = useState(event?.nombre ?? "")
  const [categoria, setCategoria] = useState<EventCategory>(event?.categoria ?? "rutina")
  const [recurrencia, setRecurrencia] = useState<EventRecurrence>(event?.recurrencia ?? "diario")
  
  const [diaDelMes, setDiaDelMes] = useState(String(event?.diaDelMes ?? 1))
  const [mesDelAño, setMesDelAño] = useState(String(event?.mesDelAño ?? 0))
  const [diaSemana, setDiaSemana] = useState(String(event?.diasSemana?.[0] ?? 0))
  const [fechaUnica, setFechaUnica] = useState(event?.fechaUnica ?? "")
  const [horaInicio, setHoraInicio] = useState(event?.horaInicio ?? "")
  const [horaFin, setHoraFin] = useState(event?.horaFin ?? "")
  const [nota, setNota] = useState(event?.nota ?? "")

  const isEditing = Boolean(event)

  useEffect(() => {
    if (!event) {
      if (categoria === "cumpleaños") setRecurrencia("anual")
      else if (categoria === "concierto") setRecurrencia("unico")
      else if (categoria === "laboral") setRecurrencia("dias_laborales")
      else if (categoria === "rutina") setRecurrencia("diario")
    }
  }, [categoria, event])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return

    onSave({
      nombre: nombre.trim(),
      categoria,
      recurrencia,
      mesDelAño: recurrencia === "anual" ? parseInt(mesDelAño, 10) : undefined,
      diaDelMes: recurrencia === "anual" || recurrencia === "mensual" ? parseInt(diaDelMes, 10) : undefined,
      diasSemana: recurrencia === "semanal" ? [parseInt(diaSemana, 10)] : undefined,
      fechaUnica: recurrencia === "unico" ? fechaUnica : undefined,
      horaInicio: horaInicio || undefined,
      horaFin: horaFin || undefined,
      nota: nota.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar Evento" : "Nuevo Evento Personal"}</DialogTitle>
        <DialogDescription>
          Agrega eventos a tu agenda que no afectan el flujo de caja.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label>Categoría</Label>
          <Select value={categoria} onValueChange={(v) => setCategoria(v as EventCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cumpleaños">Cumpleaños</SelectItem>
              <SelectItem value="concierto">Evento / Concierto</SelectItem>
              <SelectItem value="laboral">Laboral / Proyecto</SelectItem>
              <SelectItem value="rutina">Rutina / Hábito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="event-nombre">Nombre del evento</Label>
          <Input
            id="event-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Cumpleaños de Juan, Gimnasio"
            autoFocus
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Recurrencia</Label>
          <Select value={recurrencia} onValueChange={(v) => setRecurrencia(v as EventRecurrence)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unico">Una sola vez</SelectItem>
              <SelectItem value="diario">Diario</SelectItem>
              <SelectItem value="dias_laborales">Días Laborales (L-V)</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensual">Mensual (dia fijo del mes)</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recurrencia === "unico" && (
          <div className="grid gap-2">
            <Label htmlFor="event-fecha">Fecha</Label>
            <Input
              id="event-fecha"
              type="date"
              value={fechaUnica}
              onChange={(e) => setFechaUnica(e.target.value)}
              required
            />
          </div>
        )}

        {recurrencia === "semanal" && (
          <div className="grid gap-2">
            <Label>Día de la semana</Label>
            <Select value={diaSemana} onValueChange={(val) => setDiaSemana(val ?? "")}>
              <SelectTrigger>
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

        {recurrencia === "anual" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>Mes</Label>
              <Select value={mesDelAño} onValueChange={(val) => setMesDelAño(val ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Día</Label>
              <Select value={diaDelMes} onValueChange={(val) => setDiaDelMes(val ?? "")}>
                <SelectTrigger>
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
          </div>
        )}

        {recurrencia === "mensual" && (
          <div className="grid gap-2">
            <Label>Dia del mes</Label>
            <Select value={diaDelMes} onValueChange={(val) => setDiaDelMes(val ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Dia {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-2">
            <Label htmlFor="event-hora-inicio">Hora de inicio</Label>
            <Input
              id="event-hora-inicio"
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-hora-fin">Hora de fin</Label>
            <Input
              id="event-hora-fin"
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="event-nota">Nota (Opcional)</Label>
          <Input
            id="event-nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Información adicional"
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {isEditing ? (
          <Button
            type="button"
            variant="ghost"
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            onClick={() => onDelete(event!.id)}
          >
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">{isEditing ? "Guardar cambios" : "Agregar evento"}</Button>
      </DialogFooter>
    </form>
  )
}
