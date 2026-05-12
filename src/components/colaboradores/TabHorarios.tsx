import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ColaboradorFormState } from '@/types/colaborador'
import { Copy } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function TabHorarios({
  data,
  onChange,
}: {
  data: ColaboradorFormState
  onChange: (d: ColaboradorFormState) => void
}) {
  const updateSchedule = (index: number, field: string, value: string) => {
    const newSchedules = [...data.schedules]
    newSchedules[index] = { ...newSchedules[index], [field]: value }
    onChange({ ...data, schedules: newSchedules })
  }

  const handleCopy = (idx: number) => {
    if (idx === 6) return // Sábado: não copia para baixo
    const current = data.schedules[idx]
    const next = data.schedules[idx + 1]

    if (next.entry_time || next.lunch_start || next.lunch_end || next.exit_time) {
      if (!window.confirm(`Deseja sobrescrever os horários de ${DAYS[idx + 1]}?`)) {
        return
      }
    }

    const newSchedules = [...data.schedules]
    newSchedules[idx + 1] = {
      ...newSchedules[idx + 1],
      entry_time: current.entry_time,
      lunch_start: current.lunch_start,
      lunch_end: current.lunch_end,
      exit_time: current.exit_time,
    }
    onChange({ ...data, schedules: newSchedules })
    toast({ title: `Horários copiados para ${DAYS[idx + 1]}` })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_40px] gap-4 font-semibold text-sm mb-2 text-muted-foreground text-center items-center">
        <div className="text-left">Dia</div>
        <div>Entrada</div>
        <div>Saída Almoço</div>
        <div>Retorno Almoço</div>
        <div>Saída</div>
        <div></div>
      </div>
      {data.schedules.map((sched, idx) => (
        <div key={idx} className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_40px] gap-4 items-center">
          <div className="text-sm font-medium">{DAYS[idx]}</div>
          <Input
            type="time"
            value={sched.entry_time}
            onChange={(e) => updateSchedule(idx, 'entry_time', e.target.value)}
          />
          <Input
            type="time"
            value={sched.lunch_start}
            onChange={(e) => updateSchedule(idx, 'lunch_start', e.target.value)}
          />
          <Input
            type="time"
            value={sched.lunch_end}
            onChange={(e) => updateSchedule(idx, 'lunch_end', e.target.value)}
          />
          <Input
            type="time"
            value={sched.exit_time}
            onChange={(e) => updateSchedule(idx, 'exit_time', e.target.value)}
          />
          <div>
            {idx < 6 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                title={`Copiar para ${DAYS[idx + 1]}`}
                onClick={() => handleCopy(idx)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
