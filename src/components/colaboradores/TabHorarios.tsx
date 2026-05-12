import { Input } from '@/components/ui/input'
import { ColaboradorFormState } from '@/types/colaborador'

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4 font-semibold text-sm mb-2 text-muted-foreground text-center">
        <div className="text-left">Dia</div>
        <div>Entrada</div>
        <div>Saída Almoço</div>
        <div>Retorno Almoço</div>
        <div>Saída</div>
      </div>
      {data.schedules.map((sched, idx) => (
        <div key={idx} className="grid grid-cols-5 gap-4 items-center">
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
        </div>
      ))}
    </div>
  )
}
