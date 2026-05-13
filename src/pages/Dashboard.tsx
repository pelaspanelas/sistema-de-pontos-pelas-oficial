import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart, Pie, Cell, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { format, differenceInYears, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, X, Clock, Users, CalendarOff } from 'lucide-react'

export default function Dashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [expedienteCount, setExpedienteCount] = useState(0)
  const [bancoHoras, setBancoHoras] = useState({ text: '00:00', isPositive: true })
  const [ajustes, setAjustes] = useState<any[]>([])
  const [tempoCasa, setTempoCasa] = useState<any[]>([])

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedStatus, setSelectedStatus] = useState('pendente')

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i.toString(),
      label: format(new Date(2024, i, 1), 'MMMM', { locale: ptBR }),
    }))
  }, [])

  const fetchData = async () => {
    try {
      // Expediente
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: expedienteData, error: err1 } = await supabase
        .from('pontos_diarios')
        .select('id')
        .eq('data', today)
        .not('entrada', 'is', null)
        .is('saida', null)

      if (err1) throw err1
      setExpedienteCount(expedienteData?.length || 0)

      // Banco de Horas
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd')
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd')
      const { data: monthData, error: err2 } = await supabase
        .from('pontos_diarios')
        .select('horas_calculadas')
        .gte('data', start)
        .lte('data', end)

      if (err2) throw err2

      let totalMinutes = 0
      monthData?.forEach((p) => {
        const worked = p.horas_calculadas || 0
        if (worked > 0) {
          totalMinutes += (worked - 8) * 60
        }
      })
      const isPositive = totalMinutes >= 0
      const absMins = Math.abs(totalMinutes)
      const h = Math.floor(absMins / 60)
      const m = Math.round(absMins % 60)
      setBancoHoras({
        text: `${isPositive ? '+' : '-'}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        isPositive,
      })

      // Ajustes de Ponto
      const targetMonthStart = format(
        startOfMonth(new Date(new Date().getFullYear(), parseInt(selectedMonth), 1)),
        'yyyy-MM-dd',
      )
      const targetMonthEnd = format(
        endOfMonth(new Date(new Date().getFullYear(), parseInt(selectedMonth), 1)),
        'yyyy-MM-dd',
      )

      let ajustesQuery = supabase
        .from('ajuste_ponto')
        .select(`*, profiles!ajuste_ponto_usuario_id_fkey(name)`)
        .gte('data_ponto', targetMonthStart)
        .lte('data_ponto', targetMonthEnd)
        .order('created_at', { ascending: false })

      if (selectedStatus !== 'todos') {
        ajustesQuery = ajustesQuery.eq('status', selectedStatus)
      }

      const { data: ajustesData, error: err3 } = await ajustesQuery
      if (err3) throw err3
      setAjustes(ajustesData || [])

      // Tempo de Casa
      const { data: profilesData, error: err4 } = await supabase
        .from('profiles')
        .select('admission_date')
        .eq('status', 'Ativo')
        .not('admission_date', 'is', null)

      if (err4) throw err4

      const faixas = {
        '0-1 ano': 0,
        '1-3 anos': 0,
        '3-5 anos': 0,
        '5+ anos': 0,
      }

      profilesData?.forEach((p) => {
        if (!p.admission_date) return
        const years = differenceInYears(new Date(), parseISO(p.admission_date))
        if (years < 1) faixas['0-1 ano']++
        else if (years < 3) faixas['1-3 anos']++
        else if (years < 5) faixas['3-5 anos']++
        else faixas['5+ anos']++
      })

      const newChartData = [
        { name: '0-1 ano', value: faixas['0-1 ano'], fill: 'var(--color-faixa1)' },
        { name: '1-3 anos', value: faixas['1-3 anos'], fill: 'var(--color-faixa2)' },
        { name: '3-5 anos', value: faixas['3-5 anos'], fill: 'var(--color-faixa3)' },
        { name: '5+ anos', value: faixas['5+ anos'], fill: 'var(--color-faixa4)' },
      ].filter((d) => d.value > 0)

      setTempoCasa(newChartData)
    } catch (error: any) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [selectedMonth, selectedStatus])

  const handleAction = async (id: string, status: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('ajuste_ponto')
        .update({ status, aprovado_por: user?.id })
        .eq('id', id)

      if (error) throw error
      toast({ title: `Ajuste ${status === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso` })
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar ajuste',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const chartConfig = {
    faixa1: { label: '0-1 ano', color: 'hsl(var(--chart-1))' },
    faixa2: { label: '1-3 anos', color: 'hsl(var(--chart-2))' },
    faixa3: { label: '3-5 anos', color: 'hsl(var(--chart-3))' },
    faixa4: { label: '5+ anos', color: 'hsl(var(--chart-4))' },
  }

  const truncate = (str: string, len: number) => {
    if (!str) return ''
    if (str.length <= len) return str
    return str.substring(0, len) + '...'
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[140px] w-full rounded-xl" />
          <Skeleton className="h-[140px] w-full rounded-xl" />
          <Skeleton className="h-[140px] w-full rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[400px] w-full md:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] w-full md:col-span-1 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Dashboard Principal</CardTitle>
          <CardDescription>Resumo operacional e gestão de ponto da equipe</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários em Expediente</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{expedienteCount}</div>
            <p className="text-xs text-muted-foreground">Bateram entrada mas não saída</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banco de Horas (Mês)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${bancoHoras.isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {bancoHoras.text}
            </div>
            <p className="text-xs text-muted-foreground">Saldo acumulado do mês corrente</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absenteísmo</CardTitle>
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">--</div>
            <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ajustes de Ponto Pendentes</CardTitle>
              <CardDescription>Gerencie as solicitações de ajuste de ponto</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="capitalize">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {ajustes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ajuste pendente neste mês
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo de Ponto</TableHead>
                      <TableHead>Horário Solicitado</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ajustes.map((ajuste) => (
                      <TableRow key={ajuste.id}>
                        <TableCell className="font-medium">
                          {ajuste.profiles?.name || 'Desconhecido'}
                        </TableCell>
                        <TableCell>{format(parseISO(ajuste.data_ponto), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{ajuste.horario_solicitado}</TableCell>
                        <TableCell className="max-w-[200px]" title={ajuste.motivo}>
                          {truncate(ajuste.motivo, 50)}
                        </TableCell>
                        <TableCell className="text-right">
                          {ajuste.status === 'pendente' ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => handleAction(ajuste.id, 'aprovado')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleAction(ajuste.id, 'rejeitado')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${ajuste.status === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            >
                              {ajuste.status.charAt(0).toUpperCase() + ajuste.status.slice(1)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Tempo de Casa</CardTitle>
            <CardDescription>Distribuição de funcionários ativos</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center pb-8">
            {tempoCasa.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full aspect-square max-h-[250px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={tempoCasa}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {tempoCasa.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="text-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
