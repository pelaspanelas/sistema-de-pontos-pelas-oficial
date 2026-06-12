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
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
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
}

interface PayrollItem {
  profileId: string
  name: string
  role: string
  cpf: string
  baseSalary: number
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
        supabase.from('company_settings').select('logo_url').maybeSingle(),
      ])

      setIsClosed(!!fechamento)
      if (settings?.logo_url) setCompanyLogoUrl(settings.logo_url)

      const [
        { data: profiles, error: errProfiles },
        { data: pontos, error: errPontos },
        { data: launches, error: errLaunches },
      ] = await Promise.all([
        supabase.from('profiles').select('id, name, role, base_salary, cpf').eq('status', 'Ativo'),
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
        })
      })

      const payroll: PayrollItem[] = (profiles || [])
        .map((p) => {
          const totalHours = hoursByProfile[p.id] || 0
          const baseSalary = Number(p.base_salary) || 0
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Folha de Pagamento</h2>
            {isClosed && (
              <span className="flex items-center text-xs font-medium bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
                <Lock className="w-3 h-3 mr-1" /> Fechado
              </span>
            )}
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total da Folha</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              <p className="text-xs text-muted-foreground mt-1">Estimativa de custos do período</p>
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

        <div className="flex items-center justify-between py-2 min-h-[40px]">
          <p className="text-sm text-muted-foreground">
            {selectedIds.size > 0 ? `${selectedIds.size} selecionados` : ''}
          </p>
          {selectedIds.size > 0 && (
            <Button onClick={() => window.print()} className="animate-fade-in-up">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Selecionados
            </Button>
          )}
        </div>

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
            <PaySlipPrint
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
            {/* Duplicate to fit A4 page with 2 A5 slips */}
            <PaySlipPrint
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
          </div>
        ))}
      </div>
    </>
  )
}
