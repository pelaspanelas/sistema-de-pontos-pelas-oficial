import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColaboradorFormState } from '@/types/colaborador'
import { maskCPF, maskPhone, maskCEP, maskDate } from '@/lib/utils'

export function TabPessoal({
  data,
  onChange,
}: {
  data: ColaboradorFormState
  onChange: (d: ColaboradorFormState) => void
}) {
  const update = (field: keyof ColaboradorFormState, value: string) =>
    onChange({ ...data, [field]: value })

  const handleCepChange = async (val: string) => {
    const masked = maskCEP(val)
    update('cep', masked)
    if (masked.length === 9) {
      const clean = masked.replace(/\D/g, '')
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const viacep = await res.json()
        if (!viacep.erro) {
          onChange({
            ...data,
            cep: masked,
            endereco: viacep.logradouro || '',
            bairro: viacep.bairro || '',
            cidade: viacep.localidade || '',
          })
        }
      } catch {
        /* intentionally ignored */
      }
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 space-y-2">
        <Label>Nome Completo</Label>
        <Input value={data.nome} onChange={(e) => update('nome', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>CPF</Label>
        <Input
          value={data.cpf}
          onChange={(e) => update('cpf', maskCPF(e.target.value))}
          maxLength={14}
        />
      </div>
      <div className="space-y-2">
        <Label>Data de Nascimento</Label>
        <Input
          placeholder="DD/MM/AAAA"
          value={data.dataNascimento}
          onChange={(e) => update('dataNascimento', maskDate(e.target.value))}
          maxLength={10}
        />
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          value={data.telefone}
          onChange={(e) => update('telefone', maskPhone(e.target.value))}
          maxLength={15}
        />
      </div>
      <div className="space-y-2">
        <Label>CEP</Label>
        <Input value={data.cep} onChange={(e) => handleCepChange(e.target.value)} maxLength={9} />
      </div>
      <div className="col-span-2 space-y-2">
        <Label>Endereço</Label>
        <Input value={data.endereco} onChange={(e) => update('endereco', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Número</Label>
        <Input value={data.numero} onChange={(e) => update('numero', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Complemento</Label>
        <Input value={data.complemento} onChange={(e) => update('complemento', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Bairro</Label>
        <Input value={data.bairro} onChange={(e) => update('bairro', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Cidade</Label>
        <Input value={data.cidade} onChange={(e) => update('cidade', e.target.value)} />
      </div>
    </div>
  )
}
