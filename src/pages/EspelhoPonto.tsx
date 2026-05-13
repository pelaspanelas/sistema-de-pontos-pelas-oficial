import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO, endOfMonth } from 'date-fns'

const MONTHS = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
]

const CURRENT_YEAR = new Date().getFullYear().toString()

function formatDecimalHours(decimal: number | null | undefined) {
  if (decimal === null || decimal === undefined) return '--:--'
  const isNegative = decimal < 0
  const abs = Math.abs(decimal)
  let h = Math.floor(abs)
  let m = Math.round((abs - h) * 60)
  if (m === 60) {
    m = 0
    h += 1
  }
  return `${isNegative ? '-' : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatDecimalBalance(decimal: number | null | undefined) {
  if (decimal === null || decimal === undefined) return '--:--'
  const isNegative = decimal < 0
  const abs = Math.abs(decimal)
  let h = Math.floor(abs)
  let m = Math.round((abs - h) * 60)
  if (m === 60) {
    m = 0
    h += 1
  }
  return `${isNegative ? '-' : '+'}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export default function EspelhoPonto() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<any[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [selectedUser, setSelectedUser] = useState<string>('me')

  const isManagerOrAdmin = profile?.access_level === 'total' || profile?.access_level === 'gerencia'

  useEffect(() => {
    if (isManagerOrAdmin) {
      fetchUsers()
    }
  }, [isManagerOrAdmin])

  useEffect(() => {
    if (user) {
      fetchRecords()
    }
  }, [user, selectedMonth, selectedYear, selectedUser])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('status', 'Ativo')
        .order('name')
      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar colaboradores',
        description: err.message,
      })
    }
  }

  async function fetchRecords() {
    setLoading(true)
    try {
      const targetUserId = selectedUser === 'me' ? user?.id : selectedUser
      if (!targetUserId) return

      const monthInt = parseInt(selectedMonth, 10)
      const yearInt = parseInt(selectedYear, 10)

      const start = format(new Date(yearInt, monthInt, 1), 'yyyy-MM-dd')
      const end = format(endOfMonth(new Date(yearInt, monthInt, 1)), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('pontos_diarios')
        .select('*')
        .eq('profile_id', targetUserId)
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar registros',
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const rowsWithBalance = useMemo(() => {
    const ascRecords = [...records].reverse()
    let cumulative = 0
    const mapped = ascRecords.map((r) => {
      const dailyHours = r.horas_calculadas || 0
      const dailyBalance = dailyHours > 0 ? dailyHours - 8 : 0
      cumulative += dailyBalance
      return {
        ...r,
        saldo_dia: dailyBalance,
        saldo_acumulado: cumulative,
      }
    })
    return mapped.reverse()
  }, [records])

  const totalBalance = rowsWithBalance.length > 0 ? rowsWithBalance[0].saldo_acumulado : 0
  const isPositive = totalBalance >= 0

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Espelho de Ponto</h2>
          <p className="text-muted-foreground text-sm">
            Acompanhamento de registros de ponto individuais.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {isManagerOrAdmin && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background">
                <SelectValue placeholder="Selecionar Colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Meus Registros</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] bg-background">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {[CURRENT_YEAR, (parseInt(CURRENT_YEAR) - 1).toString()].map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="md:col-span-1 border-l-4 shadow-sm"
          style={{ borderLeftColor: isPositive ? '#10b981' : '#ef4444' }}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Saldo do Mês (Acumulado)</p>
              <p
                className={`text-3xl font-bold tracking-tighter ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {formatDecimalBalance(totalBalance)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${isPositive ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <Clock className={`h-6 w-6 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-slide-up">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            Registros de {MONTHS.find((m) => m.value === selectedMonth)?.label}
          </CardTitle>
          <CardDescription>Resumo de horas trabalhadas no período selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rowsWithBalance.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhum registro de ponto neste mês.</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[120px]">Data</TableHead>
                      <TableHead>Entrada 1</TableHead>
                      <TableHead>Saída 1</TableHead>
                      <TableHead>Entrada 2</TableHead>
                      <TableHead>Saída 2</TableHead>
                      <TableHead>Total Hrs</TableHead>
                      <TableHead className="text-right">Saldo Acumulado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rowsWithBalance.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {format(parseISO(row.data), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.entrada || '--:--'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.saida_almoco || '--:--'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.retorno_almoco || '--:--'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.saida || '--:--'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDecimalHours(row.horas_calculadas)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            row.saldo_acumulado > 0
                              ? 'text-emerald-600'
                              : row.saldo_acumulado < 0
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {formatDecimalBalance(row.saldo_acumulado)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {rowsWithBalance.map((row) => (
                  <Card key={row.id} className="overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2 border-b flex justify-between items-center">
                      <span className="font-semibold">
                        {format(parseISO(row.data), 'dd/MM/yyyy')}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          row.saldo_acumulado > 0
                            ? 'text-emerald-600'
                            : row.saldo_acumulado < 0
                              ? 'text-red-600'
                              : 'text-muted-foreground'
                        }`}
                      >
                        Saldo: {formatDecimalBalance(row.saldo_acumulado)}
                      </span>
                    </div>
                    <CardContent className="p-4 grid grid-cols-2 gap-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs">Entrada 1</span>
                        <span className="font-medium">{row.entrada || '--:--'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Saída 1</span>
                        <span className="font-medium">{row.saida_almoco || '--:--'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Entrada 2</span>
                        <span className="font-medium">{row.retorno_almoco || '--:--'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Saída 2</span>
                        <span className="font-medium">{row.saida || '--:--'}</span>
                      </div>
                      <div className="col-span-2 pt-2 border-t mt-1 flex justify-between">
                        <div>
                          <span className="text-muted-foreground text-xs mr-2">Total Horas:</span>
                          <span className="font-semibold">
                            {formatDecimalHours(row.horas_calculadas)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
