import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColaboradorFormState } from '@/types/colaborador'
import { maskDate, maskCurrency } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'

export function TabProfissional({
  data,
  onChange,
}: {
  data: ColaboradorFormState
  onChange: (d: ColaboradorFormState) => void
}) {
  const update = (field: keyof ColaboradorFormState, value: string) =>
    onChange({ ...data, [field]: value })

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 space-y-2">
        <Label>E-mail</Label>
        <Input type="email" value={data.email} onChange={(e) => update('email', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Senha Temporária</Label>
        <Input
          type="password"
          placeholder="123456"
          value={data.senha}
          onChange={(e) => update('senha', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Cargo</Label>
        <Input value={data.cargo} onChange={(e) => update('cargo', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Nível de Acesso</Label>
        <Select value={data.acesso} onValueChange={(v) => update('acesso', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Acesso Total (Admin)</SelectItem>
            <SelectItem value="gerencia">Gerência</SelectItem>
            <SelectItem value="colaborador">Colaborador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Data de Admissão</Label>
        <Input
          placeholder="DD/MM/AAAA"
          value={data.dataAdmissao}
          onChange={(e) => update('dataAdmissao', maskDate(e.target.value))}
          maxLength={10}
        />
      </div>
      <div className="space-y-2">
        <Label>Salário Base</Label>
        <Input
          placeholder="R$ 0,00"
          value={data.salarioBase}
          onChange={(e) => update('salarioBase', maskCurrency(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label>Valor Diário VT</Label>
        <Input
          placeholder="R$ 0,00"
          value={data.valor_vt}
          onChange={(e) => update('valor_vt', maskCurrency(e.target.value))}
        />
      </div>
      <div className="col-span-2 mt-2">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
          <div className="space-y-0.5">
            <Label className="text-base">Liberar Banco de Horas</Label>
            <p className="text-sm text-muted-foreground">
              Permite que o colaborador bata ponto em qualquer horário
            </p>
          </div>
          <Switch
            checked={data.banco_horas_ativo}
            onCheckedChange={(v) => onChange({ ...data, banco_horas_ativo: v })}
          />
        </div>
      </div>
    </div>
  )
}
