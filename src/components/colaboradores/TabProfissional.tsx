import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [showPin, setShowPin] = useState(false)

  const update = (field: keyof ColaboradorFormState, value: string) =>
    onChange({ ...data, [field]: value })

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and max 4 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    update('pin_ponto', val)
  }

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
      <div className="space-y-2">
        <Label>PIN do Ponto (Tablet)</Label>
        <div className="relative">
          <Input
            type={showPin ? 'text' : 'password'}
            placeholder="4 dígitos"
            value={data.pin_ponto || ''}
            onChange={handlePinChange}
            maxLength={4}
            inputMode="numeric"
            pattern="[0-9]*"
            className="pr-10 font-mono tracking-widest"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            tabIndex={-1}
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
            onClick={() => setShowPin(!showPin)}
          >
            {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          PIN de 4 dígitos para registro de ponto no tablet.
        </p>
      </div>
      <div className="space-y-2 flex flex-col justify-between">
        <div>
          <Label>Entra na Folha?</Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Define se o colaborador aparece nos relatórios e cálculos da folha de pagamento.
          </p>
        </div>
        <div className="flex items-center space-x-3 pt-1">
          <Switch
            checked={data.entra_folha ?? true}
            onCheckedChange={(v) => onChange({ ...data, entra_folha: v })}
          />
          <span className="text-sm font-medium">
            {(data.entra_folha ?? true) ? 'Sim (Incluído)' : 'Não (Ignorado)'}
          </span>
        </div>
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
      <div className="col-span-2">
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
          <div className="space-y-0.5">
            <Label className="text-base">Almoço Automático</Label>
            <p className="text-sm text-muted-foreground">
              Registra automaticamente saída e retorno do almoço com base nos horários cadastrados
            </p>
          </div>
          <Switch
            checked={data.almoco_automatico}
            onCheckedChange={(v) => onChange({ ...data, almoco_automatico: v })}
          />
        </div>
      </div>
    </div>
  )
}
