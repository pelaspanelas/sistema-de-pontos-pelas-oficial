import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Employee } from './types'

interface InfoFormProps {
  employees: Employee[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function InformativoForm({ employees, onSubmit, onCancel, isLoading }: InfoFormProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    recipientsType: 'Todos',
    specificRecipients: [] as string[],
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.titulo || !formData.mensagem) {
      return setError('Preencha título e mensagem.')
    }
    if (formData.recipientsType === 'Especificos' && formData.specificRecipients.length === 0) {
      return setError('Selecione ao menos um destinatário.')
    }

    const payload = {
      titulo: formData.titulo,
      mensagem: formData.mensagem,
      destinatarios: formData.recipientsType === 'Todos' ? [] : formData.specificRecipients,
    }

    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label>Título *</Label>
        <Input
          value={formData.titulo}
          onChange={(e) => setFormData((f) => ({ ...f, titulo: e.target.value }))}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label>Mensagem *</Label>
        <Textarea
          value={formData.mensagem}
          onChange={(e) => setFormData((f) => ({ ...f, mensagem: e.target.value }))}
          disabled={isLoading}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label>Destinatários *</Label>
        <RadioGroup
          value={formData.recipientsType}
          onValueChange={(v) => setFormData((f) => ({ ...f, recipientsType: v }))}
          className="flex space-x-4 mt-2"
          disabled={isLoading}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Todos" id="t1" />
            <Label htmlFor="t1">Todos os funcionários</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Especificos" id="t2" />
            <Label htmlFor="t2">Específicos</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.recipientsType === 'Especificos' && (
        <div className="grid grid-cols-2 gap-2 mt-2 p-4 border rounded-md max-h-48 overflow-y-auto">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center space-x-2">
              <Checkbox
                id={`emp-${emp.id}`}
                checked={formData.specificRecipients.includes(emp.id)}
                onCheckedChange={(checked) => {
                  setFormData((f) => ({
                    ...f,
                    specificRecipients: checked
                      ? [...f.specificRecipients, emp.id]
                      : f.specificRecipients.filter((id) => id !== emp.id),
                  }))
                }}
                disabled={isLoading}
              />
              <Label htmlFor={`emp-${emp.id}`}>{emp.name}</Label>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar Informativo'}
        </Button>
      </div>
    </form>
  )
}
