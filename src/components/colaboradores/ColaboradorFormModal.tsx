import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { TabPessoal } from './TabPessoal'
import { TabProfissional } from './TabProfissional'
import { TabHorarios } from './TabHorarios'
import { TabPermissoes } from './TabPermissoes'
import { ColaboradorFormState } from '@/types/colaborador'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

const initialSchedules = Array.from({ length: 7 }).map((_, i) => ({
  day_of_week: i,
  entry_time: '',
  lunch_start: '',
  lunch_end: '',
  exit_time: '',
}))

function safeDateToDB(dateStr: string) {
  if (!dateStr || dateStr.length < 10) return null
  const [d, m, y] = dateStr.split('/')
  const month = parseInt(m, 10)
  const day = parseInt(d, 10)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${y}-${m}-${d}`
}

function parseCurrencyToDBLocal(val: string) {
  if (!val) return 0
  return Number(val.replace(/\D/g, '')) / 100
}

export function ColaboradorFormModal({
  open,
  onOpenChange,
  onSaved,
  colaboradorId,
  isAdmin,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  colaboradorId?: string | null
  isAdmin: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ColaboradorFormState>({
    nome: '',
    telefone: '',
    dataNascimento: '',
    cpf: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    email: '',
    senha: '',
    cargo: '',
    acesso: 'colaborador',
    dataAdmissao: '',
    salarioBase: '',
    schedules: initialSchedules,
    permissions: {
      dashboard_principal: false,
      dashboard_desempenho: false,
      cadastros: false,
      operacional: false,
      historico: false,
    },
  })

  useEffect(() => {
    if (open && colaboradorId) {
      setFetching(true)
      Promise.all([
        supabase.from('profiles').select('*').eq('id', colaboradorId).single(),
        supabase.from('schedules').select('*').eq('profile_id', colaboradorId),
      ]).then(([profileRes, schedRes]) => {
        if (profileRes.data) {
          const p = profileRes.data
          const loadedSchedules = [...initialSchedules]
          if (schedRes.data) {
            schedRes.data.forEach((s) => {
              const day = s.day_of_week
              loadedSchedules[day] = {
                day_of_week: day,
                entry_time: s.entry_time?.substring(0, 5) || '',
                lunch_start: s.lunch_start?.substring(0, 5) || '',
                lunch_end: s.lunch_end?.substring(0, 5) || '',
                exit_time: s.exit_time?.substring(0, 5) || '',
              }
            })
          }

          setFormData({
            id: p.id,
            nome: p.name || '',
            telefone: p.phone || '',
            dataNascimento: p.birth_date ? p.birth_date.split('-').reverse().join('/') : '',
            cpf: p.cpf || '',
            cep: p.zip_code || '',
            endereco: p.address || '',
            numero: p.address_number || '',
            complemento: p.complement || '',
            bairro: p.neighborhood || '',
            cidade: p.city || '',
            email: p.email || '',
            senha: '',
            cargo: p.role || '',
            acesso: p.access_level || 'colaborador',
            dataAdmissao: p.admission_date ? p.admission_date.split('-').reverse().join('/') : '',
            salarioBase: p.base_salary ? (p.base_salary * 100).toString() : '',
            schedules: loadedSchedules,
            permissions: p.permissions || {
              dashboard_principal: false,
              dashboard_desempenho: false,
              cadastros: false,
              operacional: false,
              historico: false,
            },
          })
        }
        setFetching(false)
      })
    } else if (open) {
      setFormData({
        nome: '',
        telefone: '',
        dataNascimento: '',
        cpf: '',
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        email: '',
        senha: '',
        cargo: '',
        acesso: 'colaborador',
        dataAdmissao: '',
        salarioBase: '',
        schedules: initialSchedules,
        permissions: {
          dashboard_principal: false,
          dashboard_desempenho: false,
          cadastros: false,
          operacional: false,
          historico: false,
        },
      })
    }
  }, [open, colaboradorId])

  const handleSave = async () => {
    setLoading(true)
    try {
      const birthDate = safeDateToDB(formData.dataNascimento)
      const admissionDate = safeDateToDB(formData.dataAdmissao)

      if (formData.id) {
        const { error } = await supabase.rpc('update_user_account', {
          p_user_id: formData.id,
          p_name: formData.nome,
          p_phone: formData.telefone,
          p_birth_date: birthDate,
          p_cpf: formData.cpf,
          p_zip_code: formData.cep,
          p_address: formData.endereco,
          p_address_number: formData.numero,
          p_complement: formData.complemento,
          p_neighborhood: formData.bairro,
          p_city: formData.cidade,
          p_role: formData.cargo,
          p_access_level: formData.acesso,
          p_admission_date: admissionDate,
          p_base_salary: parseCurrencyToDBLocal(formData.salarioBase),
          p_schedules: formData.schedules,
          p_permissions: formData.permissions,
        })
        if (error) throw error
        toast({ title: 'Colaborador atualizado com sucesso!' })
      } else {
        const { error } = await supabase.rpc('create_user_account', {
          p_email: formData.email,
          p_password: formData.senha || '123456',
          p_name: formData.nome,
          p_phone: formData.telefone,
          p_birth_date: birthDate,
          p_cpf: formData.cpf,
          p_zip_code: formData.cep,
          p_address: formData.endereco,
          p_address_number: formData.numero,
          p_complement: formData.complemento,
          p_neighborhood: formData.bairro,
          p_city: formData.cidade,
          p_role: formData.cargo,
          p_access_level: formData.acesso,
          p_admission_date: admissionDate,
          p_base_salary: parseCurrencyToDBLocal(formData.salarioBase),
          p_schedules: formData.schedules,
          p_permissions: formData.permissions,
        })
        if (error) throw error
        toast({ title: 'Colaborador salvo com sucesso!' })
      }

      onOpenChange(false)
      onSaved()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{colaboradorId ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
        </DialogHeader>
        {fetching ? (
          <div className="py-12 text-center text-muted-foreground">Carregando dados...</div>
        ) : (
          <Tabs defaultValue="pessoal" className="w-full mt-4">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
              <TabsTrigger value="profissional">Profissional</TabsTrigger>
              <TabsTrigger value="horarios">Horários</TabsTrigger>
              {isAdmin && <TabsTrigger value="permissoes">Permissões</TabsTrigger>}
            </TabsList>
            <div className="py-4">
              <TabsContent value="pessoal">
                <TabPessoal data={formData} onChange={setFormData} />
              </TabsContent>
              <TabsContent value="profissional">
                <TabProfissional data={formData} onChange={setFormData} />
              </TabsContent>
              <TabsContent value="horarios">
                <TabHorarios data={formData} onChange={setFormData} />
              </TabsContent>
              {isAdmin && (
                <TabsContent value="permissoes">
                  <TabPermissoes data={formData} onChange={setFormData} />
                </TabsContent>
              )}
            </div>
          </Tabs>
        )}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || fetching}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
