import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  DollarSign,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Bus,
  Banknote,
  Zap,
  Printer,
  Pencil,
  Lock,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Profile {
  id: string
  name: string
  role: string
  cpf: string
  admission_date: string
  base_salary: number
  banco_horas_ativo: boolean
  valor_vt?: number
}

interface Launch {
  id: string
  tipo: string
  categoria: 'credito' | 'debito'
  valor: number
  descricao: string
}

export default function FolhaPagamentoDetalhes() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [launches, setLaunches] = useState<Launch[]>([])
  const [daysWorked, setDaysWorked] = useState(0)
  const [totalHours, setTotalHours] = useState(0)
  const [isClosed, setIsClosed] = useState(false)

  const [expectedHours, setExpectedHours] = useState(0)
  const [projectedDays, setProjectedDays] = useState(0)
  const [nextMonthInfo, setNextMonthInfo] = useState({ month: 1, year: 2024, name: '' })

  const [dailyVt, setDailyVt] = useState('')
  const [savingVt, setSavingVt] = useState(false)
  const [isSavingAdiantamento, setIsSavingAdiantamento] = useState(false)

  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false)
  const [savingLaunch, setSavingLaunch] = useState(false)
  const [editingLaunchId, setEditingLaunchId] = useState<string | null>(null)

  const [launchForm, setLaunchForm] = useState({
    descricao: '',
    categoria: 'credito' as 'credito' | 'debito',
    tipo: 'bonus',
    valor: '',
  })

  useEffect(() => {
    if (id) fetchData()
  }, [id, month, year])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: fechamento } = await supabase
        .from('fechamento_mensal')
        .select('id')
        .eq('mes', month)
        .eq('ano', year)
        .maybeSingle()
      setIsClosed(!!fechamento)

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, name, role, cpf, admission_date, base_salary, banco_horas_ativo, valor_vt')
        .eq('id', id)
        .single()
      if (profileErr) throw profileErr
      setProfile(profileData)

      if (profileData.valor_vt && Number(profileData.valor_vt) > 0) {
        setDailyVt(profileData.valor_vt.toString())
      }

      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDateDate = new Date(year, month, 0)
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${endDateDate.getDate().toString().padStart(2, '0')}`

      let nextM = month + 1
      let nextY = year
      if (nextM > 12) {
        nextM = 1
        nextY++
      }
      const nextMonthName = new Date(nextY, nextM - 1).toLocaleString('pt-BR', { month: 'long' })
      setNextMonthInfo({ month: nextM, year: nextY, name: nextMonthName })

      const nextMonthEndDateDate = new Date(nextY, nextM, 0)
      const nextEndDate = `${nextY}-${nextM.toString().padStart(2, '0')}-${nextMonthEndDateDate.getDate().toString().padStart(2, '0')}`

      const { data: feriadosData } = await supabase
        .from('feriados' as any)
        .select('data')
        .gte('data', startDate)
        .lte('data', nextEndDate)

      const feriadosThisMonth =
        feriadosData?.filter((f: any) =>
          f.data.startsWith(`${year}-${month.toString().padStart(2, '0')}`),
        ) || []
      const feriadosNextMonth =
        feriadosData?.filter((f: any) =>
          f.data.startsWith(`${nextY}-${nextM.toString().padStart(2, '0')}`),
        ) || []

      const { data: pontos, error: pontosErr } = await supabase
        .from('pontos_diarios')
        .select('data, horas_calculadas')
        .eq('profile_id', id)
        .gte('data', startDate)
        .lte('data', endDate)

      if (pontosErr) throw pontosErr

      const uniqueDays = new Set(pontos?.map((p) => p.data)).size
      const hours = pontos?.reduce((acc, p) => acc + (Number(p.horas_calculadas) || 0), 0) || 0

      setDaysWorked(uniqueDays)
      setTotalHours(hours)

      const { data: schedulesData, error: schedulesErr } = await supabase
        .from('schedules')
        .select('day_of_week')
        .eq('profile_id', id)

      if (!schedulesErr && schedulesData) {
        let scheduledDaysCurrentMonth = 0
        for (let i = 1; i <= endDateDate.getDate(); i++) {
          const dateString = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`
          const isHoliday = feriadosThisMonth.some((f: any) => f.data === dateString)

          if (!isHoliday) {
            const dayOfWeek = new Date(year, month - 1, i).getDay()
            if (schedulesData.some((s) => s.day_of_week === dayOfWeek)) {
              scheduledDaysCurrentMonth++
            }
          }
        }
        setExpectedHours(scheduledDaysCurrentMonth * (7 + 20 / 60))

        let scheduledDaysNext = 0
        for (let i = 1; i <= nextMonthEndDateDate.getDate(); i++) {
          const dateString = `${nextY}-${nextM.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`
          const isHoliday = feriadosNextMonth.some((f: any) => f.data === dateString)

          if (!isHoliday) {
            const dayOfWeek = new Date(nextY, nextM - 1, i).getDay()
            if (schedulesData.some((s) => s.day_of_week === dayOfWeek)) {
              scheduledDaysNext++
            }
          }
        }
        setProjectedDays(scheduledDaysNext)
      }

      const { data: launchesData, error: launchesErr } = await supabase
        .from('lancamentos_folha')
        .select('id, tipo, categoria, valor, descricao')
        .eq('profile_id', id)
        .eq('mes', month)
        .eq('ano', year)
        .order('created_at', { ascending: false })

      if (launchesErr) throw launchesErr
      setLaunches(launchesData || [])
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar detalhes do colaborador.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleAddVt() {
    if (isClosed)
      return toast({
        title: 'Mês fechado',
        description: 'Não é possível alterar.',
        variant: 'destructive',
      })
    if (!dailyVt || Number(dailyVt) <= 0 || projectedDays <= 0) return
    setSavingVt(true)
    try {
      const valorTotal = Number(dailyVt) * projectedDays
      const nextMonthStr = `${nextMonthInfo.month.toString().padStart(2, '0')}/${nextMonthInfo.year}`
      const descricao = `VT Antecipado - ${nextMonthStr}`

      const existingVt = launches.find((l) => l.tipo === 'vt' && l.descricao === descricao)

      if (existingVt) {
        const { error } = await supabase
          .from('lancamentos_folha')
          .update({ valor: valorTotal, descricao })
          .eq('id', existingVt.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('lancamentos_folha').insert({
          profile_id: id,
          mes: month,
          ano: year,
          tipo: 'vt',
          categoria: 'credito',
          valor: valorTotal,
          descricao,
          criado_por: user?.id,
        })
        if (error) throw error
      }

      toast({ title: 'Sucesso', description: 'Vale Transporte projetado salvo com sucesso.' })
      setDailyVt('')
      fetchData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar VT.', variant: 'destructive' })
    } finally {
      setSavingVt(false)
    }
  }

  async function handleAdiantamento() {
    if (isClosed)
      return toast({
        title: 'Mês fechado',
        description: 'Não é possível alterar.',
        variant: 'destructive',
      })
    if (!profile?.base_salary) return
    setIsSavingAdiantamento(true)
    try {
      const valor = profile.base_salary * 0.4
      const descricao = 'Adiantamento Quinzenal (40%)'

      const existingVale = launches.find((l) => l.tipo === 'vale' && l.descricao === descricao)

      if (existingVale) {
        const { error } = await supabase
          .from('lancamentos_folha')
          .update({ valor, descricao })
          .eq('id', existingVale.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('lancamentos_folha').insert({
          profile_id: id,
          mes: month,
          ano: year,
          tipo: 'vale',
          categoria: 'debito',
          valor,
          descricao,
          criado_por: user?.id,
        })
        if (error) throw error
      }

      toast({ title: 'Sucesso', description: 'Adiantamento lançado com sucesso.' })
      fetchData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao lançar adiantamento.', variant: 'destructive' })
    } finally {
      setIsSavingAdiantamento(false)
    }
  }

  async function handleCreateLaunch(e: React.FormEvent) {
    e.preventDefault()
    if (isClosed)
      return toast({
        title: 'Mês fechado',
        description: 'Não é possível alterar.',
        variant: 'destructive',
      })
    setSavingLaunch(true)
    try {
      if (editingLaunchId) {
        const { error } = await supabase
          .from('lancamentos_folha')
          .update({
            tipo: launchForm.tipo,
            categoria: launchForm.categoria,
            valor: Number(launchForm.valor),
            descricao: launchForm.descricao,
          })
          .eq('id', editingLaunchId)
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Lançamento atualizado com sucesso.' })
      } else {
        const { error } = await supabase.from('lancamentos_folha').insert({
          profile_id: id,
          mes: month,
          ano: year,
          tipo: launchForm.tipo,
          categoria: launchForm.categoria,
          valor: Number(launchForm.valor),
          descricao: launchForm.descricao,
          criado_por: user?.id,
        })
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Lançamento adicionado com sucesso.' })
      }
      setIsLaunchModalOpen(false)
      setLaunchForm({ descricao: '', categoria: 'credito', tipo: 'bonus', valor: '' })
      setEditingLaunchId(null)
      fetchData()
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar lançamento.',
        variant: 'destructive',
      })
    } finally {
      setSavingLaunch(false)
    }
  }

  async function handleDeleteLaunch(launchId: string) {
    if (isClosed)
      return toast({
        title: 'Mês fechado',
        description: 'Não é possível alterar.',
        variant: 'destructive',
      })
    if (!confirm('Deseja realmente excluir este lançamento?')) return
    try {
      const { error } = await supabase.from('lancamentos_folha').delete().eq('id', launchId)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Lançamento removido.' })
      fetchData()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao remover.', variant: 'destructive' })
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile)
    return <div className="p-8 text-center text-muted-foreground">Colaborador não encontrado.</div>

  const totalCredits = launches
    .filter((l) => l.categoria === 'credito')
    .reduce((acc, l) => acc + Number(l.valor), 0)
  const totalDebits = launches
    .filter((l) => l.categoria === 'debito')
    .reduce((acc, l) => acc + Number(l.valor), 0)
  const netPay = (Number(profile.base_salary) || 0) + totalCredits - totalDebits
  const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' })

  const balanceHours = totalHours - expectedHours

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in no-print">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/folha-pagamento')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold tracking-tight">{profile.name}</h2>
                {isClosed && (
                  <span className="flex items-center text-xs font-medium bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
                    <Lock className="w-3 h-3 mr-1" /> Mês Fechado
                  </span>
                )}
              </div>
              <p className="text-muted-foreground capitalize mt-1">
                {profile.role || 'Sem cargo'} • {monthName} de {year}
              </p>
            </div>
          </div>
          <Button variant="default" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Gerar Holerite
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salário Base</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(profile.base_salary || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Créditos</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                +{formatCurrency(totalCredits)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Débitos</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">-{formatCurrency(totalDebits)}</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Líquido a Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(netPay)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Análise de Horas
              </CardTitle>
              <CardDescription>
                Comparativo de horas esperadas vs realizadas ({monthName}).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/30 p-2 rounded-lg border flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">Esperadas</span>
                  <span className="text-lg font-bold">{expectedHours.toFixed(1)}h</span>
                </div>
                <div className="bg-muted/30 p-2 rounded-lg border flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">Realizadas</span>
                  <span className="text-lg font-bold">{totalHours.toFixed(1)}h</span>
                </div>
                <div
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center ${balanceHours >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}
                >
                  <span className="text-xs font-medium opacity-80">Saldo</span>
                  <span className="text-lg font-bold">
                    {balanceHours > 0 ? '+' : ''}
                    {balanceHours.toFixed(1)}h
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={isClosed}
                onClick={() => {
                  setEditingLaunchId(null)
                  setLaunchForm({
                    descricao: 'Pagamento de Horas Extras',
                    categoria: 'credito',
                    tipo: 'hora_extra',
                    valor: '',
                  })
                  setIsLaunchModalOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Lançar Hora Extra
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Projeção de VT
              </CardTitle>
              <CardDescription>
                Cálculo para {nextMonthInfo.name} de {nextMonthInfo.year}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="space-y-2 flex-1">
                  <Label>Dias Previstos</Label>
                  <Input
                    type="number"
                    min="0"
                    disabled={isClosed}
                    value={projectedDays}
                    onChange={(e) => setProjectedDays(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Valor Diário (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isClosed}
                    value={dailyVt}
                    onChange={(e) => setDailyVt(e.target.value)}
                    placeholder="Ex: 15.50"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleAddVt}
                disabled={savingVt || !dailyVt || projectedDays === 0 || isClosed}
              >
                {savingVt ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Confirmar Lançamento
              </Button>
              {Number(dailyVt) > 0 && projectedDays > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Valor total:{' '}
                  <strong className="text-foreground">
                    {formatCurrency(Number(dailyVt) * projectedDays)}
                  </strong>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>Ferramentas de adiantamento e bônus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                <span className="text-sm font-medium text-muted-foreground">Valor Base (40%)</span>
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency((profile.base_salary || 0) * 0.4)}
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={handleAdiantamento}
                disabled={isSavingAdiantamento || !profile.base_salary || isClosed}
              >
                {isSavingAdiantamento ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Banknote className="h-4 w-4 mr-2" />
                )}
                Lançar Adiantamento (40%)
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lançamentos Manuais</CardTitle>
              <CardDescription>Gerencie créditos e débitos para este período.</CardDescription>
            </div>
            {!isClosed && (
              <Button
                onClick={() => {
                  setEditingLaunchId(null)
                  setLaunchForm({ descricao: '', categoria: 'credito', tipo: 'bonus', valor: '' })
                  setIsLaunchModalOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lançamento
              </Button>
            )}

            <Dialog open={isLaunchModalOpen} onOpenChange={setIsLaunchModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingLaunchId ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateLaunch} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={launchForm.categoria}
                      onValueChange={(v: 'credito' | 'debito') =>
                        setLaunchForm({ ...launchForm, categoria: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credito">Crédito (Acréscimo)</SelectItem>
                        <SelectItem value="debito">Débito (Desconto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={launchForm.tipo}
                      onValueChange={(v) => setLaunchForm({ ...launchForm, tipo: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bonus">Bônus / Premiação</SelectItem>
                        <SelectItem value="vt">Vale Transporte</SelectItem>
                        <SelectItem value="vale">Adiantamento (Vale)</SelectItem>
                        <SelectItem value="falta">Falta / Atraso</SelectItem>
                        <SelectItem value="consumo">Consumo</SelectItem>
                        <SelectItem value="hora_extra">Hora Extra</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      required
                      placeholder="Ex: Vale do dia 20"
                      value={launchForm.descricao}
                      onChange={(e) => setLaunchForm({ ...launchForm, descricao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={launchForm.valor}
                      onChange={(e) => setLaunchForm({ ...launchForm, valor: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsLaunchModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={savingLaunch}>
                      {savingLaunch && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Salvar Lançamento
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {launches.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border rounded-lg bg-muted/20">
                Nenhum lançamento registrado neste mês.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {launches.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.descricao}</TableCell>
                      <TableCell className="capitalize">{l.tipo.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${l.categoria === 'credito' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}
                        >
                          {l.categoria === 'credito' ? 'Crédito' : 'Débito'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            l.categoria === 'credito'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {l.categoria === 'credito' ? '+' : '-'}
                          {formatCurrency(l.valor)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isClosed && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingLaunchId(l.id)
                                setLaunchForm({
                                  descricao: l.descricao,
                                  categoria: l.categoria,
                                  tipo: l.tipo,
                                  valor: String(l.valor),
                                })
                                setIsLaunchModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDeleteLaunch(l.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="hidden print:block print-area bg-white text-black p-8 font-sans w-full max-w-[210mm] mx-auto">
        <div className="border-2 border-black p-4 mb-4">
          <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">Pelas Panelas</h1>
              <p className="text-sm">CNPJ: 00.000.000/0001-00</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase">Recibo de Pagamento de Salário</h2>
              <p className="font-semibold text-lg">
                Mês/Ano: {monthName} / {year}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 mb-4 text-sm">
            <div className="col-span-2">
              <p className="text-gray-600 text-xs">Código</p>
              <p className="font-bold">{profile.id.substring(0, 8)}</p>
            </div>
            <div className="col-span-5">
              <p className="text-gray-600 text-xs">Nome do Funcionário</p>
              <p className="font-bold">{profile.name}</p>
            </div>
            <div className="col-span-3">
              <p className="text-gray-600 text-xs">Função</p>
              <p className="font-bold">{profile.role || 'Não informada'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600 text-xs">CPF</p>
              <p className="font-bold">{profile.cpf || 'Não informado'}</p>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black mb-4 text-sm">
          <thead>
            <tr>
              <th className="border-b-2 border-black border-r py-2 px-3 text-left w-16">Cód</th>
              <th className="border-b-2 border-black border-r py-2 px-3 text-left">Descrição</th>
              <th className="border-b-2 border-black border-r py-2 px-3 text-right w-32">
                Vencimentos
              </th>
              <th className="border-b-2 border-black py-2 px-3 text-right w-32">Descontos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-black py-1 px-3">001</td>
              <td className="border-r border-black py-1 px-3">Salário Base</td>
              <td className="border-r border-black py-1 px-3 text-right">
                {formatCurrency(profile.base_salary)}
              </td>
              <td className="py-1 px-3 text-right"></td>
            </tr>
            {launches.map((l, idx) => (
              <tr key={l.id}>
                <td className="border-r border-black py-1 px-3">
                  {(idx + 2).toString().padStart(3, '0')}
                </td>
                <td className="border-r border-black py-1 px-3">{l.descricao}</td>
                <td className="border-r border-black py-1 px-3 text-right">
                  {l.categoria === 'credito' ? formatCurrency(l.valor) : ''}
                </td>
                <td className="py-1 px-3 text-right">
                  {l.categoria === 'debito' ? formatCurrency(l.valor) : ''}
                </td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 10 - launches.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border-r border-black py-1 px-3 h-7"></td>
                <td className="border-r border-black py-1 px-3"></td>
                <td className="border-r border-black py-1 px-3"></td>
                <td className="py-1 px-3"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-2 border-black flex">
          <div className="w-1/2 p-2 text-xs border-r-2 border-black">
            <p>DECLARO TER RECEBIDO A IMPORTÂNCIA LÍQUIDA DISCRIMINADA NESTE RECIBO.</p>
            <div className="mt-12 text-center flex flex-col items-center">
              <div className="w-3/4 border-t border-black mb-1"></div>
              <p>Assinatura do Funcionário</p>
              <p className="mt-2">Data: ___/___/_____</p>
            </div>
          </div>
          <div className="w-1/2">
            <div className="flex border-b-2 border-black">
              <div className="w-1/2 p-2 border-r-2 border-black">
                <p className="text-gray-600 text-xs mb-1">Total de Vencimentos</p>
                <p className="font-bold text-right">
                  {formatCurrency((profile.base_salary || 0) + totalCredits)}
                </p>
              </div>
              <div className="w-1/2 p-2">
                <p className="text-gray-600 text-xs mb-1">Total de Descontos</p>
                <p className="font-bold text-right">{formatCurrency(totalDebits)}</p>
              </div>
            </div>
            <div className="p-2 flex justify-between items-center h-full">
              <p className="font-bold text-sm">Valor Líquido:</p>
              <p className="font-bold text-xl">{formatCurrency(netPay)}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
