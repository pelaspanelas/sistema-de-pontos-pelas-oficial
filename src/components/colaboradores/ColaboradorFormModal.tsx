import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TabPessoal } from './TabPessoal'
import { TabProfissional } from './TabProfissional'
import { TabHorarios } from './TabHorarios'
import { ColaboradorFormState } from '@/types/colaborador'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { parseDateToDB, parseCurrencyToDB } from '@/lib/utils'

const initialSchedules = Array.from({ length: 7 }).map((_, i) => ({
  day_of_week: i,
  entry_time: '',
  lunch_start: '',
  lunch_end: '',
  exit_time: '',
}))

export function ColaboradorFormModal({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('create_user_account', {
        p_email: formData.email,
        p_password: formData.senha || '123456',
        p_name: formData.nome,
        p_phone: formData.telefone,
        p_birth_date: parseDateToDB(formData.dataNascimento),
        p_cpf: formData.cpf,
        p_zip_code: formData.cep,
        p_address: formData.endereco,
        p_address_number: formData.numero,
        p_complement: formData.complemento,
        p_neighborhood: formData.bairro,
        p_city: formData.cidade,
        p_role: formData.cargo,
        p_access_level: formData.acesso,
        p_admission_date: parseDateToDB(formData.dataAdmissao),
        p_base_salary: parseCurrencyToDB(formData.salarioBase),
        p_schedules: formData.schedules,
      })

      if (error) throw error
      toast({ title: 'Colaborador salvo com sucesso!' })
      setOpen(false)
      onSaved()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-foreground text-background hover:bg-foreground/90 ml-auto md:ml-2">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Colaborador</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="pessoal" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
            <TabsTrigger value="profissional">Profissional</TabsTrigger>
            <TabsTrigger value="horarios">Horários</TabsTrigger>
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
          </div>
        </Tabs>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
