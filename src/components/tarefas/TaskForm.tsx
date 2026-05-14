import { useState } from 'react'
import { format, startOfDay, parseISO, isBefore } from 'date-fns'
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
import { Task, Employee } from './types'

interface TaskFormProps {
  initialData?: Task | null
  employees: Employee[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function TaskForm({ initialData, employees, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const [formData, setFormData] = useState({
    titulo: initialData?.titulo || '',
    descricao: initialData?.descricao || '',
    data: initialData?.data || format(new Date(), 'yyyy-MM-dd'),
    data_vencimento: initialData?.data_vencimento || '',
    responsavel_id: initialData?.responsavel_id || '',
    quantidade_meta: initialData?.quantidade_meta || '',
    prioridade: initialData?.prioridade?.toString() || '2',
    tipo_repeticao: initialData?.tipo_repeticao || 'nenhuma',
    dias_semana: initialData?.dias_semana || ([] as number[]),
    dia_mes: initialData?.dia_mes?.toString() || '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (
      !formData.titulo ||
      !formData.data ||
      !formData.responsavel_id ||
      !formData.quantidade_meta ||
      !formData.prioridade
    ) {
      return setError('Preencha todos os campos obrigatórios.')
    }

    const today = startOfDay(new Date())
    if (isBefore(parseISO(formData.data), today) && !initialData) {
      return setError('A data não pode ser no passado.')
    }

    const payload = {
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      data: formData.data,
      data_vencimento: formData.data_vencimento || null,
      responsavel_id: formData.responsavel_id,
      quantidade_meta: formData.quantidade_meta,
      prioridade: parseInt(formData.prioridade, 10),
      tipo_repeticao: formData.tipo_repeticao,
      dias_semana: formData.tipo_repeticao === 'semanal' ? formData.dias_semana : null,
      dia_mes: formData.tipo_repeticao === 'mensal' ? parseInt(formData.dia_mes, 10) : null,
      ativo: true,
    }

    await onSubmit(payload)
  }

  const WEEK_DAYS = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título *</Label>
          <Input
            value={formData.titulo}
            onChange={(e) => setFormData((f) => ({ ...f, titulo: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label>Responsável *</Label>
          <Select
            value={formData.responsavel_id}
            onValueChange={(v) => setFormData((f) => ({ ...f, responsavel_id: v }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
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
          value={formData.descricao}
          onChange={(e) => setFormData((f) => ({ ...f, descricao: e.target.value }))}
          disabled={isLoading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data *</Label>
          <Input
            type="date"
            value={formData.data}
            onChange={(e) => setFormData((f) => ({ ...f, data: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label>Vencimento</Label>
          <Input
            type="date"
            value={formData.data_vencimento}
            onChange={(e) => setFormData((f) => ({ ...f, data_vencimento: e.target.value }))}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantidade/Meta *</Label>
          <Input
            value={formData.quantidade_meta}
            onChange={(e) => setFormData((f) => ({ ...f, quantidade_meta: e.target.value }))}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label>Prioridade *</Label>
          <RadioGroup
            value={formData.prioridade}
            onValueChange={(v) => setFormData((f) => ({ ...f, prioridade: v }))}
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
          value={formData.tipo_repeticao}
          onValueChange={(v) =>
            setFormData((f) => ({
              ...f,
              tipo_repeticao: v,
              dias_semana: [],
              dia_mes: '',
            }))
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              { value: 'nenhuma', label: 'Sem repetição' },
              { value: 'diaria', label: 'Diária' },
              { value: 'semanal', label: 'Semanal' },
              { value: 'mensal', label: 'Mensal' },
            ].map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {formData.tipo_repeticao === 'semanal' && (
        <div className="grid grid-cols-4 gap-2">
          {WEEK_DAYS.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                id={`day-${day.value}`}
                checked={formData.dias_semana.includes(day.value)}
                onCheckedChange={(checked) => {
                  setFormData((f) => ({
                    ...f,
                    dias_semana: checked
                      ? [...f.dias_semana, day.value]
                      : f.dias_semana.filter((d) => d !== day.value),
                  }))
                }}
                disabled={isLoading}
              />
              <Label htmlFor={`day-${day.value}`}>{day.label}</Label>
            </div>
          ))}
        </div>
      )}
      {formData.tipo_repeticao === 'mensal' && (
        <div className="space-y-2">
          <Label>Dia do Mês</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.dia_mes}
            onChange={(e) => setFormData((f) => ({ ...f, dia_mes: e.target.value }))}
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
