import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import {
  DollarSign,
  Clock,
  Users,
  Loader2,
  ChevronRight,
  Lock,
  Unlock,
  Printer,
  Settings,
  Upload,
  Bus,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  Palmtree,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaySlipPrint } from '@/components/folha-pagamento/PaySlipPrint'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Launch {
  id: string
  descricao: string
  categoria: 'credito' | 'debito'
  valor: number
  tipo: string
}

interface PayrollItem {
  profileId: string
  name: string
  role: string
  cpf: string
  baseSalary: number
  valorVt: number
  totalCredits: number
  totalDebits: number
  totalHours: number
  calculatedPayment: number
  launches: Launch[]
}

const months = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export default function FolhaPagamento() {
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString())
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PayrollItem[]>([])
  const [isClosed, setIsClosed] = useState(false)
  const [closing, setClosing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [holeriteCopies, setHoleriteCopies] = useState(2)
  const [savingSettings, setSavingSettings] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isManagerOrAdmin = profile?.access_level === 'total' || profile?.access_level === 'gerencia'

  useEffect(() => {
    fetchData()
  }, [month, year])

  async function fetchData() {
    setLoading(true)
    setSelectedIds(new Set())
    try {
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      const endDateDate = new Date(Number(year), Number(month), 0)
      const endDate = `${year}-${month.padStart(2, '0')}-${endDateDate.getDate().toString().padStart(2, '0')}`

      const [{ data: fechamento }, { data: settings }] = await Promise.all([
        supabase
          .from('fechamento_mensal')
          .select('id')
          .eq('mes', Number(month))
          .eq('ano', Number(year))
          .maybeSingle(),
        supabase.from('company_settings').select('*').maybeSingle(),
      ])

      setIsClosed(!!fechamento)
      if (settings) {
        if (settings.logo_url) setCompanyLogoUrl(settings.logo_url)
        if ((settings as any).holerite_copies !== undefined)
          setHoleriteCopies((settings as any).holerite_copies)
      }

      const [
        { data: profiles, error: errProfiles },
        { data: pontos, error: errPontos },
        { data: launches, error: errLaunches },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, role, base_salary, cpf, valor_vt, admission_date, status'),
        supabase
          .from('pontos_diarios')
          .select('profile_id, horas_calculadas')
          .gte('data', startDate)
          .lte('data', endDate),
        supabase
          .from('lancamentos_folha')
          .select('id, profile_id, categoria, valor, descricao, tipo')
          .eq('mes', Number(month))
          .eq('ano', Number(year)),
      ])

      if (errProfiles || errPontos || errLaunches) {
        throw new Error('Erro ao carregar dados.')
      }

      const hoursByProfile: Record<string, number> = {}
      pontos?.forEach((p) => {
        const h = Number(p.horas_calculadas) || 0
        if (!hoursByProfile[p.profile_id]) hoursByProfile[p.profile_id] = 0
        hoursByProfile[p.profile_id] += h
      })

      const launchesByProfile: Record<string, Launch[]> = {}
      launches?.forEach((l) => {
        if (!launchesByProfile[l.profile_id]) launchesByProfile[l.profile_id] = []
        launchesByProfile[l.profile_id].push({
          id: l.id,
          descricao: l.descricao,
          categoria: l.categoria as 'credito' | 'debito',
          valor: Number(l.valor) || 0,
          tipo: l.tipo || '',
        })
      })

      const validProfiles = (profiles || []).filter((p) => {
        if (p.status !== 'Ativo') return false
        if (p.admission_date) {
          return p.admission_date <= endDate
        }
        return true
      })

      const payroll: PayrollItem[] = validProfiles
        .map((p) => {
          const totalHours = hoursByProfile[p.id] || 0
          const baseSalary = Number(p.base_salary) || 0
          const valorVt = Number(p.valor_vt) || 0
          const userLaunches = launchesByProfile[p.id] || []

          let credits = 0
          let debits = 0
          userLaunches.forEach((l) => {
            if (l.categoria === 'credito') credits += l.valor
            if (l.categoria === 'debito') debits += l.valor
          })

          const calculatedPayment = baseSalary + credits - debits

          return {
            profileId: p.id,
            name: p.name,
            role: p.role || 'Não definido',
            cpf: p.cpf || '',
            baseSalary,
            valorVt,
            totalCredits: credits,
            totalDebits: debits,
            totalHours,
            calculatedPayment,
            launches: userLaunches,
          }
        })
        .filter((p) => p.totalHours > 0 || p.baseSalary > 0)
        .sort((a, b) => a.name.localeCompare(b.name))

      setData(payroll)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao conectar com o banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const totalCost = data.reduce((acc, curr) => acc + curr.calculatedPayment, 0)
  const totalHours = data.reduce((acc, curr) => acc + curr.totalHours, 0)
  const totalEmployees = data.length

  const sumBaseSalaries = data.reduce((acc, curr) => acc + curr.baseSalary, 0)

  const sumVt = data.reduce((acc, curr) => {
    const vtLaunches = curr.launches.filter(
      (l) =>
        l.tipo.toLowerCase().includes('vale transporte') ||
        l.tipo.toLowerCase() === 'vt' ||
        l.descricao.toLowerCase().includes('vale transporte') ||
        l.descricao.toLowerCase() === 'vt',
    )
    return acc + vtLaunches.reduce((sum, l) => sum + l.valor, 0)
  }, 0)

  const sumDiscounts = data.reduce((acc, curr) => {
    const discountLaunches = curr.launches.filter((l) => {
      if (l.categoria !== 'debito') return false
      return l.tipo.toLowerCase() !== 'vale'
    })
    return acc + discountLaunches.reduce((sum, l) => sum + l.valor, 0)
  }, 0)

  const sumOvertime = data.reduce((acc, curr) => {
    const overtimeLaunches = curr.launches.filter((l) => {
      if (l.categoria !== 'credito') return false
      const tipo = l.tipo.toLowerCase()
      return tipo === 'hora_extra' || tipo === 'bonus'
    })
    return acc + overtimeLaunches.reduce((sum, l) => sum + l.valor, 0)
  }, 0)

  const provision13 = sumBaseSalaries / 12
  const provisionVacation = provision13 / 3

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  function formatHours(decimalHours: number) {
    const h = Math.floor(decimalHours)
    const m = Math.round((decimalHours - h) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  async function handleCloseMonth() {
    if (
      !confirm(
        `Deseja realmente finalizar o mês ${month}/${year}? Nenhuma alteração poderá ser feita após isso.`,
      )
    )
      return
    setClosing(true)
    try {
      const { error } = await supabase.from('fechamento_mensal').insert({
        mes: Number(month),
        ano: Number(year),
        fechado_por: profile?.id,
      })
      if (error) throw error
      toast({ title: 'Mês finalizado com sucesso!' })
      setIsClosed(true)
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally {
      setClosing(false)
    }
  }

  function toggleSelectAll() {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.map((d) => d.profileId)))
    }
  }

  function toggleRowSelection(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const selectedData = data.filter((d) => selectedIds.has(d.profileId))
  const monthName = months[Number(month) - 1]

  async function handleClearLaunches() {
    setClearing(true)
    try {
      const selectedArray = Array.from(selectedIds)
      const { error } = await supabase
        .from('lancamentos_folha')
        .delete()
        .in('profile_id', selectedArray)
        .eq('mes', Number(month))
        .eq('ano', Number(year))

      if (error) throw error

      toast({ title: 'Lançamentos apagados com sucesso!' })
      fetchData()
      setConfirmClearOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao apagar lançamentos',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setClearing(false)
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      const { error } = await supabase
        .from('company_settings')
        .update({ holerite_copies: holeriteCopies } as any)
        .eq('id', '00000000-0000-0000-0000-000000000001')

      if (error) {
        const { error: insertErr } = await supabase.from('company_settings').insert({
          id: '00000000-0000-0000-0000-000000000001',
          holerite_copies: holeriteCopies,
        } as any)
        if (insertErr) throw insertErr
      }

      toast({ title: 'Configurações salvas com sucesso!' })
      setSettingsOpen(false)
    } catch (error) {
      toast({ title: 'Erro ao salvar configurações', variant: 'destructive' })
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `logo-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('company_settings')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', '00000000-0000-0000-0000-000000000001')

      if (updateError) {
        const { error: insertError } = await supabase.from('company_settings').insert({
          id: '00000000-0000-0000-0000-000000000001',
          logo_url: urlData.publicUrl,
        })
        if (insertError) throw insertError
      }

      setCompanyLogoUrl(urlData.publicUrl)
      toast({ title: 'Logo atualizada com sucesso!' })
      setSettingsOpen(false)
    } catch (error) {
      toast({ title: 'Erro ao fazer upload da logo', variant: 'destructive' })
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Folha de Pagamento</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isManagerOrAdmin && (
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configurações da Empresa</DialogTitle>
                    <DialogDescription>
                      Faça o upload do logo que aparecerá nos holerites impressos e PDFs.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      {companyLogoUrl ? (
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <img
                            src={companyLogoUrl}
                            alt="Logo da Empresa"
                            className="max-h-24 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="p-8 border border-dashed rounded-lg bg-muted/10 text-muted-foreground flex flex-col items-center">
                          <Upload className="w-8 h-8 mb-2 opacity-50" />
                          <p>Nenhuma logo configurada</p>
                        </div>
                      )}

                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {companyLogoUrl ? 'Trocar Logo' : 'Fazer Upload'}
                      </Button>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <Label>Quantidade de cópias por holerite</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={holeriteCopies}
                          onChange={(e) => setHoleriteCopies(Number(e.target.value))}
                        />
                        <Button onClick={handleSaveSettings} disabled={savingSettings}>
                          {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {isManagerOrAdmin && (
              <Button
                variant={isClosed ? 'secondary' : 'default'}
                onClick={handleCloseMonth}
                disabled={isClosed || closing}
                className={!isClosed ? 'bg-rose-600 hover:bg-rose-700' : ''}
              >
                {closing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isClosed ? (
                  <Lock className="w-4 h-4 mr-2" />
                ) : (
                  <Unlock className="w-4 h-4 mr-2" />
                )}
                {isClosed ? 'Mês Finalizado' : 'Finalizar Mês'}
              </Button>
            )}
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-md">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium opacity-80 uppercase tracking-wider">
                Competência Atual
              </p>
              <h3 className="text-lg font-bold">
                {monthName} de {year}
              </h3>
            </div>
          </div>
          {isClosed ? (
            <div className="flex items-center text-sm font-medium bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full border border-rose-200">
              <Lock className="w-4 h-4 mr-1.5" /> Fechado
            </div>
          ) : (
            <div className="flex items-center text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
              <Unlock className="w-4 h-4 mr-1.5" /> Em Aberto
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total da Folha</CardTitle>
              <DollarSign className="h-4 w-4 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              <p className="text-xs opacity-75 mt-1">Estimativa de custos do período</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume de Horas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHours(totalHours)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total de horas calculadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">Registrados neste período</p>
            </CardContent>
          </Card>
        </div>

        <h3 className="text-lg font-medium tracking-tight mb-4">Detalhamento Financeiro</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soma de Salários</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(sumBaseSalaries)}</div>
              <p className="text-xs text-muted-foreground mt-1">Salários base do período</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soma de VT</CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(sumVt)}</div>
              <p className="text-xs text-muted-foreground mt-1">Vale transporte total projetado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Extras e Bônus</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(sumOvertime)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de horas extras e premiações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Soma de Descontos</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{formatCurrency(sumDiscounts)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Débitos aplicados (exceto adiantamento 40%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">13º Salário Projetado</CardTitle>
              <CalendarDays className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(provision13)}</div>
              <p className="text-xs text-muted-foreground mt-1">Provisão mensal base</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Férias Projetadas</CardTitle>
              <Palmtree className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-600">
                {formatCurrency(provisionVacation)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Provisão do terço de férias</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between py-2 min-h-[40px]">
          <p className="text-sm text-muted-foreground">
            {selectedIds.size > 0 ? `${selectedIds.size} selecionados` : ''}
          </p>
          {selectedIds.size > 0 && (
            <div className="flex gap-2">
              {isManagerOrAdmin && (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmClearOpen(true)}
                  disabled={isClosed}
                  className="animate-fade-in-up"
                >
                  Limpar Lançamentos
                </Button>
              )}
              <Button onClick={() => window.print()} className="animate-fade-in-up">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Selecionados
              </Button>
            </div>
          )}
        </div>

        <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Limpar Lançamentos</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja apagar todos os lançamentos manuais dos funcionários
                selecionados para este mês? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setConfirmClearOpen(false)}
                disabled={clearing}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleClearLaunches} disabled={clearing}>
                {clearing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirmar Exclusão
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Calculando folha de pagamento...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-card space-y-2">
            <DollarSign className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">
              Nenhum registro encontrado para este período.
            </p>
          </div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={selectedIds.size === data.length && data.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Salário Base</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Créditos</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Débitos</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow
                    key={item.profileId}
                    className="hover:bg-muted/50 group transition-colors"
                  >
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedIds.has(item.profileId)}
                        onCheckedChange={() => toggleRowSelection(item.profileId)}
                      />
                    </TableCell>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(`/folha-pagamento/${item.profileId}?month=${month}&year=${year}`)
                      }
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.role}</p>
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right hidden sm:table-cell cursor-pointer"
                      onClick={() =>
                        navigate(`/folha-pagamento/${item.profileId}?month=${month}&year=${year}`)
                      }
                    >
                      {formatCurrency(item.baseSalary)}
                    </TableCell>
                    <TableCell
                      className="text-right hidden md:table-cell text-emerald-600 cursor-pointer"
                      onClick={() =>
                        navigate(`/folha-pagamento/${item.profileId}?month=${month}&year=${year}`)
                      }
                    >
                      +{formatCurrency(item.totalCredits)}
                    </TableCell>
                    <TableCell
                      className="text-right hidden md:table-cell text-rose-600 cursor-pointer"
                      onClick={() =>
                        navigate(`/folha-pagamento/${item.profileId}?month=${month}&year=${year}`)
                      }
                    >
                      -{formatCurrency(item.totalDebits)}
                    </TableCell>
                    <TableCell
                      className="text-right font-bold text-primary cursor-pointer"
                      onClick={() =>
                        navigate(`/folha-pagamento/${item.profileId}?month=${month}&year=${year}`)
                      }
                    >
                      {formatCurrency(item.calculatedPayment)}
                    </TableCell>
                    <TableCell
                      className="text-right cursor-pointer"
                      onClick={() =>
                        navigate(`/folha-pagamento/${item.profileId}?month=${month}&year=${year}`)
                      }
                    >
                      <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                        Ver Detalhes
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Batch Print Area */}
      <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-50 w-full overflow-visible">
        {selectedData.map((item, index) => (
          <div key={`${item.profileId}-${index}`} className="print-page-break">
            {Array.from({ length: holeriteCopies }).map((_, i) => (
              <PaySlipPrint
                key={i}
                profile={{
                  id: item.profileId,
                  name: item.name,
                  role: item.role,
                  cpf: item.cpf,
                  base_salary: item.baseSalary,
                }}
                launches={item.launches}
                monthName={monthName}
                year={Number(year)}
                totalCredits={item.totalCredits}
                totalDebits={item.totalDebits}
                netPay={item.calculatedPayment}
                companyLogoUrl={companyLogoUrl}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
