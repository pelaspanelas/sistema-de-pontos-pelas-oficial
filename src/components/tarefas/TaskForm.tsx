import { useState } from 'react'
import { startOfDay, parseISO, isBefore } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { EMPLOYEES, Task } from './types'

interface TaskFormProps {
  initialData?: Task | null
  onSubmit: (data: Omit<Task, 'id' | 'responsibleName'>) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function TaskForm({ initialData, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: initialData?.date || '',
    dueDate: initialData?.dueDate || '',
    responsibleId: initialData?.responsibleId || '',
    quantity: initialData?.quantity || '',
    priority: initialData?.priority || '2',
    repetition: initialData?.repetition || 'Sem repetição',
    repetitionDays: initialData?.repetitionDays || [],
    repetitionMonthDay: initialData?.repetitionMonthDay || '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (
      !formData.title ||
      !formData.date ||
      !formData.responsibleId ||
      !formData.quantity ||
      !formData.priority
    ) {
      return setError('Preencha todos os campos obrigatórios.')
    }

    const today = startOfDay(new Date())
    if (isBefore(parseISO(formData.date), today) && !initialData) {
      return setError('A data não pode ser no passado.')
    }

    await onSubmit(formData as any)
  }

  const WEEK_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label>Responsável *</Label>
          <Select
            value={formData.responsibleId}
            onValueChange={(v) => setFormData((f) => ({ ...f, responsibleId: v }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYEES.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
          disabled={isLoading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data *</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label>Vencimento</Label>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData((f) => ({ ...f, dueDate: e.target.value }))}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantidade/Meta *</Label>
          <Input
            value={formData.quantity}
            onChange={(e) => setFormData((f) => ({ ...f, quantity: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label>Prioridade *</Label>
          <RadioGroup
            value={formData.priority}
            onValueChange={(v) => setFormData((f) => ({ ...f, priority: v }))}
            className="flex space-x-4 mt-2"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="p1" />
              <Label htmlFor="p1">Baixa</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="p2" />
              <Label htmlFor="p2">Média</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="p3" />
              <Label htmlFor="p3">Alta</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Repetição</Label>
        <Select
          value={formData.repetition}
          onValueChange={(v) =>
            setFormData((f) => ({
              ...f,
              repetition: v,
              repetitionDays: [],
              repetitionMonthDay: '',
            }))
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['Sem repetição', 'Diária', 'Semanal', 'Mensal'].map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {formData.repetition === 'Semanal' && (
        <div className="grid grid-cols-4 gap-2">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={`day-${day}`}
                checked={formData.repetitionDays.includes(day)}
                onCheckedChange={(checked) => {
                  setFormData((f) => ({
                    ...f,
                    repetitionDays: checked
                      ? [...f.repetitionDays, day]
                      : f.repetitionDays.filter((d) => d !== day),
                  }))
                }}
                disabled={isLoading}
              />
              <Label htmlFor={`day-${day}`}>{day}</Label>
            </div>
          ))}
        </div>
      )}
      {formData.repetition === 'Mensal' && (
        <div className="space-y-2">
          <Label>Dia do Mês</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.repetitionMonthDay}
            onChange={(e) => setFormData((f) => ({ ...f, repetitionMonthDay: e.target.value }))}
            disabled={isLoading}
          />
        </div>
      )}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Tarefa'}
        </Button>
      </div>
    </form>
  )
}
