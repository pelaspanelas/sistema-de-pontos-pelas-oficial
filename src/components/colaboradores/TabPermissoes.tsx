import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ColaboradorFormState } from '@/types/colaborador'

export function TabPermissoes({
  data,
  onChange,
}: {
  data: ColaboradorFormState
  onChange: (d: ColaboradorFormState) => void
}) {
  const togglePermission = (key: keyof typeof data.permissions, checked: boolean) => {
    onChange({
      ...data,
      permissions: {
        ...data.permissions,
        [key]: checked,
      },
    })
  }

  const permissoes = [
    { id: 'dashboard_principal', label: 'Dashboard (Principal)' },
    { id: 'dashboard_desempenho', label: 'Dashboard (Desempenho)' },
    { id: 'cadastros', label: 'Cadastros' },
    { id: 'operacional', label: 'Operacional' },
    { id: 'historico', label: 'Histórico' },
  ]

  return (
    <div className="space-y-4 py-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Controle de acesso às páginas do sistema
      </h3>
      <div className="grid gap-4 border rounded-lg p-6 bg-muted/20">
        {permissoes.map((perm) => (
          <div key={perm.id} className="flex items-center space-x-2">
            <Checkbox
              id={perm.id}
              checked={data.permissions[perm.id as keyof typeof data.permissions]}
              onCheckedChange={(c) => togglePermission(perm.id as any, c === true)}
            />
            <Label htmlFor={perm.id} className="cursor-pointer font-normal">
              {perm.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
