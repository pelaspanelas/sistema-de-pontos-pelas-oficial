import { useState, useEffect } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { DollarSign, Clock, Users, Loader2 } from 'lucide-react'

interface PayrollItem {
  profileId: string
  name: string
  role: string
  baseSalary: number
  totalHours: number
  calculatedPayment: number
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
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [month, year])

  async function fetchData() {
    setLoading(true)
    try {
      const startDate = `${year}-${month.padStart(2, '0')}-01`
      const endDateDate = new Date(Number(year), Number(month), 0)
      const endDate = `${year}-${month.padStart(2, '0')}-${endDateDate.getDate().toString().padStart(2, '0')}`

      const [{ data: profiles, error: errProfiles }, { data: pontos, error: errPontos }] =
        await Promise.all([
          supabase.from('profiles').select('id, name, role, base_salary').eq('status', 'Ativo'),
          supabase
            .from('pontos_diarios')
            .select('profile_id, horas_calculadas')
            .gte('data', startDate)
            .lte('data', endDate),
        ])

      if (errProfiles || errPontos) {
        throw new Error('Erro ao carregar dados.')
      }

      const hoursByProfile: Record<string, number> = {}
      pontos?.forEach((p) => {
        const h = Number(p.horas_calculadas) || 0
        if (!hoursByProfile[p.profile_id]) hoursByProfile[p.profile_id] = 0
        hoursByProfile[p.profile_id] += h
      })

      const payroll: PayrollItem[] = (profiles || [])
        .map((p) => {
          const totalHours = hoursByProfile[p.id] || 0
          const baseSalary = Number(p.base_salary) || 0
          const hourlyRate = baseSalary / 220
          const calculatedPayment = totalHours * hourlyRate

          return {
            profileId: p.id,
            name: p.name,
            role: p.role || 'Não definido',
            baseSalary,
            totalHours,
            calculatedPayment,
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Folha de Pagamento</h2>
        <div className="flex items-center space-x-2">
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
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-right">Salário Base</TableHead>
                <TableHead className="text-right">Horas Totais</TableHead>
                <TableHead className="text-right">Valor a Receber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.profileId}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.baseSalary)}</TableCell>
                  <TableCell className="text-right">{formatHours(item.totalHours)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.calculatedPayment)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
