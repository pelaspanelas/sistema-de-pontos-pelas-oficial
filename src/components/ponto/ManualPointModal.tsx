import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus } from 'lucide-react'

export function ManualPointModal({
  trigger,
  onSuccess,
}: {
  trigger?: React.ReactNode
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([])

  const [profileId, setProfileId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState('')

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      supabase
        .from('profiles')
        .select('id, name')
        .eq('status', 'Ativo')
        .order('name')
        .then(({ data }) => {
          if (data) setProfiles(data)
        })
      // reset forms
      setProfileId('')
      setDate('')
      setTime('')
      setType('')
    }
  }, [open])

  const handleSave = async () => {
    if (!profileId || !date || !time || !type) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { data: ptDiario, error: errDiario } = await supabase
        .from('pontos_diarios')
        .select('*')
        .eq('profile_id', profileId)
        .eq('data', date)
        .maybeSingle()

      if (errDiario && errDiario.code !== 'PGRST116') throw errDiario

      const updates: any = {
        [type]: time,
        tipo_registro: 'manual',
        criado_por: user.id,
        updated_at: new Date().toISOString(),
      }

      const tEntrada = type === 'entrada' ? time : ptDiario?.entrada || null
      const tSaidaAlmoco = type === 'saida_almoco' ? time : ptDiario?.saida_almoco || null
      const tRetornoAlmoco = type === 'retorno_almoco' ? time : ptDiario?.retorno_almoco || null
      const tSaida = type === 'saida' ? time : ptDiario?.saida || null

      if (tEntrada && tSaidaAlmoco && tRetornoAlmoco && tSaida) {
        const parseTime = (t: string) => {
          const [h, m] = t.split(':').map(Number)
          return h * 60 + m
        }
        const m1 = parseTime(tEntrada)
        const m2 = parseTime(tSaidaAlmoco)
        const m3 = parseTime(tRetornoAlmoco)
        const m4 = parseTime(tSaida)
        updates.horas_calculadas = (m2 - m1 + (m4 - m3)) / 60
      }

      if (ptDiario) {
        const { error: errUpdate } = await supabase
          .from('pontos_diarios')
          .update(updates)
          .eq('id', ptDiario.id)
        if (errUpdate) throw errUpdate
      } else {
        updates.profile_id = profileId
        updates.data = date
        const { error: errInsert } = await supabase.from('pontos_diarios').insert(updates)
        if (errInsert) throw errInsert
      }

      const pontoTypeMap: Record<string, string> = {
        entrada: 'entrada',
        saida_almoco: 'almoço_saída',
        retorno_almoco: 'almoço_retorno',
        saida: 'saída',
      }

      const { error: errPonto } = await supabase.from('pontos').insert({
        profile_id: profileId,
        tipo_ponto: pontoTypeMap[type] || 'entrada',
        horario: time,
        data: date,
        data_hora: new Date(`${date}T${time}:00`).toISOString(),
        tipo_registro: 'manual',
        status_validacao: 'validado',
        criado_por: user.id,
      })

      if (errPonto) throw errPonto

      toast({ title: 'Ponto lançado com sucesso' })
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast({ title: 'Erro ao lançar ponto', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Lançar Ponto Manual
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lançar Ponto Manual</DialogTitle>
          <DialogDescription>Registre um ponto manualmente para um colaborador.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Colaborador</Label>
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Ponto</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida_almoco">Saída Almoço</SelectItem>
                <SelectItem value="retorno_almoco">Retorno Almoço</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
