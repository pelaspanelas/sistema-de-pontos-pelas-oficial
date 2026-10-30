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
  FinancialBreakdownModal,
  EmployeeFinancialDetail,
} from '@/components/folha-pagamento/FinancialBreakdownModal'
import { ValesModal, ColaboradorFolhaOption } from '@/components/folha-pagamento/ValesModal'
import {
  RescisaoModal,
  ColaboradorRescisaoOption,
} from '@/components/folha-pagamento/RescisaoModal'
import { Banknote, Calculator } from 'lucide-react'
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
  const [activeModal, setActiveModal] = useState<
    'salarios' | 'vt' | 'extras' | 'descontos' | 'total' | 'decimo3' | 'ferias' | null
  >(null)
  const [valesModalOpen, setValesModalOpen] = useState(false)
  const [rescisaoModalOpen, setRescisaoModalOpen] = useState(false)
  const [rawProfiles, setRawProfiles] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isManagerOrAdmin =
    profile?.access_level === 'total' ||
    profile?.access_level === 'gerencia' ||
    profile?.access_level === 'admin' ||
    profile?.access_level === 'manager'

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
        { data: historicoSnapshots },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, name, role, base_salary, cpf, valor_vt, admission_date, status, entra_folha' as any,
          ),
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
        supabase
          .from('historico_competencia_folha' as any)
          .select('profile_id, base_salary, valor_vt, role, name, cpf')
          .eq('mes', Number(month))
          .eq('ano', Number(year)),
      ])

      if (errProfiles || errPontos || errLaunches) {
        throw new Error('Erro ao carregar dados.')
      }

      setRawProfiles(profiles || [])

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

      const snapshotsByProfile: Record<string, any> = {}
      if (historicoSnapshots) {
        ;(historicoSnapshots as any[]).forEach((h) => {
          snapshotsByProfile[h.profile_id] = h
        })
      }

      const validProfiles = ((profiles as any[]) || []).filter((p) => {
        // Must have entra_folha enabled (or default true if null/undefined)
        if (p.entra_folha === false) return false
        if (p.status !== 'Ativo') return false
        if (p.admission_date) {
          return p.admission_date <= endDate
        }
        return true
      })

      const isMonthClosed = !!fechamento

      const payroll: PayrollItem[] = validProfiles
        .map((p) => {
          const totalHours = hoursByProfile[p.id] || 0
          const snap = snapshotsByProfile[p.id]

          // If month is closed and we have snapshot data, use immutable historical base_salary and valor_vt
          const baseSalary =
            isMonthClosed && snap ? Number(snap.base_salary) || 0 : Number(p.base_salary) || 0

          const valorVt =
            isMonthClosed && snap ? Number(snap.valor_vt) || 0 : Number(p.valor_vt) || 0

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

  const totalHours = data.reduce((acc, curr) => acc + curr.totalHours, 0)
  const totalEmployees = data.length

  const sumBaseSalaries = data.reduce((acc, curr) => acc + curr.baseSalary, 0)

  const sumVt = data.reduce((acc, curr) => {
    const vtLaunches = curr.launches.filter(
      (l) => l.categoria === 'credito' && l.tipo.toLowerCase() === 'vt',
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

  const totalCost = sumBaseSalaries + sumVt + sumOvertime - sumDiscounts

  const provision13 = sumBaseSalaries / 12
  const provisionVacation = provision13 / 3

  // Modal breakdowns
  const salariosBreakdown: EmployeeFinancialDetail[] = data
    .filter((d) => d.baseSalary > 0)
    .map((d) => ({
      profileId: d.profileId,
      name: d.name,
      role: d.role,
      total: d.baseSalary,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const vtBreakdown: EmployeeFinancialDetail[] = data
    .map((d) => {
      const vtLaunches = d.launches.filter(
        (l) => l.categoria === 'credito' && l.tipo.toLowerCase() === 'vt',
      )
      const total = vtLaunches.reduce((sum, l) => sum + l.valor, 0)
      return {
        profileId: d.profileId,
        name: d.name,
        role: d.role,
        total,
        items: vtLaunches.map((l) => ({
          id: l.id,
          description: l.descricao || 'Vale Transporte',
          amount: l.valor,
          type: l.tipo,
          category: l.categoria,
        })),
      }
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  const extrasBreakdown: EmployeeFinancialDetail[] = data
    .map((d) => {
      const extraLaunches = d.launches.filter((l) => {
        if (l.categoria !== 'credito') return false
        const tipo = l.tipo.toLowerCase()
        return tipo === 'hora_extra' || tipo === 'bonus'
      })
      const total = extraLaunches.reduce((sum, l) => sum + l.valor, 0)
      return {
        profileId: d.profileId,
        name: d.name,
        role: d.role,
        total,
        items: extraLaunches.map((l) => ({
          id: l.id,
          description: l.descricao || (l.tipo === 'hora_extra' ? 'Hora Extra' : 'Bônus'),
          amount: l.valor,
          type: l.tipo,
          category: l.categoria,
        })),
      }
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  const discountsBreakdown: EmployeeFinancialDetail[] = data
    .map((d) => {
      const discountLaunches = d.launches.filter((l) => {
        if (l.categoria !== 'debito') return false
        return l.tipo.toLowerCase() !== 'vale'
      })
      const total = discountLaunches.reduce((sum, l) => sum + l.valor, 0)
      return {
        profileId: d.profileId,
        name: d.name,
        role: d.role,
        total,
        items: discountLaunches.map((l) => ({
          id: l.id,
          description: l.descricao || 'Desconto',
          amount: l.valor,
          type: l.tipo,
          category: l.categoria,
        })),
      }
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  const totalFolhaBreakdown: EmployeeFinancialDetail[] = data
    .map((d) => {
      const vt = d.launches
        .filter((l) => l.categoria === 'credito' && l.tipo.toLowerCase() === 'vt')
        .reduce((sum, l) => sum + l.valor, 0)
      const extras = d.launches
        .filter((l) => {
          if (l.categoria !== 'credito') return false
          const tipo = l.tipo.toLowerCase()
          return tipo === 'hora_extra' || tipo === 'bonus'
        })
        .reduce((sum, l) => sum + l.valor, 0)
      const discounts = d.launches
        .filter((l) => l.categoria === 'debito' && l.tipo.toLowerCase() !== 'vale')
        .reduce((sum, l) => sum + l.valor, 0)

      const cost = d.baseSalary + vt + extras - discounts

      const items: Array<{
        id: string
        description: string
        amount: number
        type?: string
        category?: 'credito' | 'debito'
      }> = [
        {
          id: 'base',
          description: 'Salário Base',
          amount: d.baseSalary,
          category: 'credito' as const,
        },
      ]

      if (vt > 0) {
        items.push({
          id: 'vt',
          description: 'Vale Transporte',
          amount: vt,
          category: 'credito' as const,
        })
      }

      if (extras > 0) {
        items.push({
          id: 'extras',
          description: 'Horas Extras e Bônus',
          amount: extras,
          category: 'credito' as const,
        })
      }

      if (discounts > 0) {
        items.push({
          id: 'discounts',
          description: 'Descontos (exceto adiantamento)',
          amount: discounts,
          category: 'debito' as const,
        })
      }

      return {
        profileId: d.profileId,
        name: d.name,
        role: d.role,
        total: cost,
        items,
      }
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => a.name.localeCompare(b.name))

  const decimo3Breakdown: EmployeeFinancialDetail[] = data
    .filter((d) => d.baseSalary > 0)
    .map((d) => ({
      profileId: d.profileId,
      name: d.name,
      role: d.role,
      total: d.baseSalary / 12,
      items: [
        {
          id: 'calc',
          description: `Salário Base (${formatCurrency(d.baseSalary)}) ÷ 12 meses`,
          amount: d.baseSalary / 12,
          category: 'credito' as const,
        },
      ],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const feriasBreakdown: EmployeeFinancialDetail[] = data
    .filter((d) => d.baseSalary > 0)
    .map((d) => ({
      profileId: d.profileId,
      name: d.name,
      role: d.role,
      total: d.baseSalary / 12 / 3,
      items: [
        {
          id: 'calc',
          description: `Provisão 13º (${formatCurrency(d.baseSalary / 12)}) ÷ 3 (1/3 constitucional)`,
          amount: d.baseSalary / 12 / 3,
          category: 'credito' as const,
        },
      ],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

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

      // Save snapshots for all active profiles entering payroll
      const { data: profilesToSnapshot } = await supabase
        .from('profiles')
        .select('id, name, role, cpf, base_salary, valor_vt, entra_folha, status')
        .eq('status', 'Ativo')

      if (profilesToSnapshot && profilesToSnapshot.length > 0) {
        const snapshots = (profilesToSnapshot as any[])
          .filter((p) => p.entra_folha !== false)
          .map((p) => ({
            profile_id: p.id,
            mes: Number(month),
            ano: Number(year),
            base_salary: Number(p.base_salary) || 0,
            valor_vt: Number(p.valor_vt) || 0,
            role: p.role || null,
            name: p.name || null,
            cpf: p.cpf || null,
          }))

        if (snapshots.length > 0) {
          await supabase
            .from('historico_competencia_folha' as any)
            .upsert(snapshots, { onConflict: 'profile_id,mes,ano' })
        }
      }

      toast({ title: 'Mês finalizado com sucesso!' })
      setIsClosed(true)
      fetchData()
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

            <Button
              variant="outline"
              onClick={() => setValesModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Banknote className="w-4 h-4 text-emerald-600" />
              Lançamento de Vales
            </Button>

            <Button
              variant="outline"
              onClick={() => setRescisaoModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Calculator className="w-4 h-4 text-primary" />
              Simular Rescisão
            </Button>

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
          <Card
            className="bg-primary text-primary-foreground cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
            onClick={() => setActiveModal('total')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total da Folha</CardTitle>
              <DollarSign className="h-4 w-4 opacity-75" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              <p className="text-xs opacity-75 mt-1 flex items-center justify-between">
                <span>Estimativa de custos do período</span>
                <span className="text-[11px] font-medium underline opacity-90">
                  Ver composição →
                </span>
              </p>
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
          <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 hover:scale-[1.01] active:scale-[0.99] group"
            onClick={() => setActiveModal('salarios')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                Soma de Salários
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(sumBaseSalaries)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>Salários base do período</span>
                <span className="text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes →
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 hover:scale-[1.01] active:scale-[0.99] group"
            onClick={() => setActiveModal('vt')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                Soma de VT
              </CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(sumVt)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>Vale transporte total projetado</span>
                <span className="text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes →
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-emerald-500/50 hover:scale-[1.01] active:scale-[0.99] group"
            onClick={() => setActiveModal('extras')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-emerald-600 transition-colors">
                Horas Extras e Bônus
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(sumOvertime)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>Total de horas extras e premiações</span>
                <span className="text-[11px] font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes →
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-rose-500/50 hover:scale-[1.01] active:scale-[0.99] group"
            onClick={() => setActiveModal('descontos')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-rose-600 transition-colors">
                Soma de Descontos
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{formatCurrency(sumDiscounts)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>Débitos (exceto adiantamento)</span>
                <span className="text-[11px] font-medium text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes →
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-amber-500/50 hover:scale-[1.01] active:scale-[0.99] group"
            onClick={() => setActiveModal('decimo3')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-amber-600 transition-colors">
                13º Salário Projetado
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(provision13)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>Provisão mensal base</span>
                <span className="text-[11px] font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes →
                </span>
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-sky-500/50 hover:scale-[1.01] active:scale-[0.99] group"
            onClick={() => setActiveModal('ferias')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-sky-600 transition-colors">
                Férias Projetadas
              </CardTitle>
              <Palmtree className="h-4 w-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-600">
                {formatCurrency(provisionVacation)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                <span>Provisão do terço de férias</span>
                <span className="text-[11px] font-medium text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes →
                </span>
              </p>
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

        {/* Modais de Detalhamento Financeiro */}
        <FinancialBreakdownModal
          isOpen={activeModal === 'salarios'}
          onClose={() => setActiveModal(null)}
          title="Detalhamento da Soma de Salários"
          subtitle={`Salário base de cada colaborador para ${monthName} de ${year}.`}
          monthName={monthName}
          year={year}
          totalSum={sumBaseSalaries}
          colorClass="text-primary"
          emptyMessage="Nenhum colaborador com salário base cadastrado no período."
          data={salariosBreakdown}
          icon={<Wallet className="h-6 w-6 text-primary" />}
        />

        <FinancialBreakdownModal
          isOpen={activeModal === 'vt'}
          onClose={() => setActiveModal(null)}
          title="Detalhamento da Soma de VT"
          subtitle={`Valores e lançamentos de Vale Transporte de cada colaborador para ${monthName} de ${year}.`}
          monthName={monthName}
          year={year}
          totalSum={sumVt}
          colorClass="text-primary"
          emptyMessage="Nenhum lançamento de Vale Transporte encontrado para este período."
          data={vtBreakdown}
          icon={<Bus className="h-6 w-6 text-primary" />}
        />

        <FinancialBreakdownModal
          isOpen={activeModal === 'extras'}
          onClose={() => setActiveModal(null)}
          title="Detalhamento de Horas Extras e Bônus"
          subtitle={`Lançamentos de horas extras e premiações por colaborador para ${monthName} de ${year}.`}
          monthName={monthName}
          year={year}
          totalSum={sumOvertime}
          colorClass="text-emerald-600 dark:text-emerald-400"
          emptyMessage="Nenhum lançamento de horas extras ou bônus encontrado para este período."
          data={extrasBreakdown}
          icon={<TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
        />

        <FinancialBreakdownModal
          isOpen={activeModal === 'descontos'}
          onClose={() => setActiveModal(null)}
          title="Detalhamento da Soma de Descontos"
          subtitle={`Descontos e débitos aplicados por colaborador (excluindo adiantamento quinzenal de 40%).`}
          monthName={monthName}
          year={year}
          totalSum={sumDiscounts}
          colorClass="text-rose-600 dark:text-rose-400"
          emptyMessage="Nenhum desconto registrado para este período."
          data={discountsBreakdown}
          icon={<TrendingDown className="h-6 w-6 text-rose-600 dark:text-rose-400" />}
        />

        <FinancialBreakdownModal
          isOpen={activeModal === 'total'}
          onClose={() => setActiveModal(null)}
          title="Detalhamento do Total da Folha"
          subtitle={`Composição do custo total por colaborador (Salário Base + VT + Extras/Bônus - Descontos).`}
          monthName={monthName}
          year={year}
          totalSum={totalCost}
          colorClass="text-primary"
          emptyMessage="Nenhum custo registrado para os colaboradores neste período."
          data={totalFolhaBreakdown}
          icon={<DollarSign className="h-6 w-6 text-primary" />}
        />

        <FinancialBreakdownModal
          isOpen={activeModal === 'decimo3'}
          onClose={() => setActiveModal(null)}
          title="Detalhamento do 13º Salário Projetado"
          subtitle={`Provisão mensal individual de 1/12 do salário base para ${monthName} de ${year}.`}
          monthName={monthName}
          year={year}
          totalSum={provision13}
          colorClass="text-amber-600 dark:text-amber-400"
          emptyMessage="Nenhum salário base para calcular a provisão de 13º."
          data={decimo3Breakdown}
          icon={<CalendarDays className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
        />

        <FinancialBreakdownModal
          isOpen={activeModal === 'ferias'}
          onClose={() => setActiveModal(null)}
          title="Detalhamento de Férias Projetadas"
          subtitle={`Provisão mensal individual do 1/3 constitucional de férias para ${monthName} de ${year}.`}
          monthName={monthName}
          year={year}
          totalSum={provisionVacation}
          colorClass="text-sky-600 dark:text-sky-400"
          emptyMessage="Nenhum salário base para calcular a provisão de férias."
          data={feriasBreakdown}
          icon={<Palmtree className="h-6 w-6 text-sky-600 dark:text-sky-400" />}
        />

        {/* Modal de Lançamento de Vales */}
        <ValesModal
          isOpen={valesModalOpen}
          onClose={() => setValesModalOpen(false)}
          month={Number(month)}
          year={Number(year)}
          monthName={monthName}
          isClosed={isClosed}
          colaboradores={rawProfiles as ColaboradorFolhaOption[]}
          onSuccess={fetchData}
        />

        {/* Modal de Simulação de Rescisão */}
        <RescisaoModal
          isOpen={rescisaoModalOpen}
          onClose={() => setRescisaoModalOpen(false)}
          colaboradores={rawProfiles as ColaboradorRescisaoOption[]}
        />

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
