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
import { Calendar as CalendarIcon, Clock, Pencil } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format, parseISO, endOfMonth } from 'date-fns'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

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

function getHoursColor(decimal: number | null | undefined) {
  if (!decimal) return 'text-muted-foreground'
  const mins = Math.round(decimal * 60)
  return mins >= 440 ? 'text-emerald-600' : 'text-red-600'
}

function AjusteModal({
  open,
  onOpenChange,
  dataPonto,
  tipoPonto,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataPonto: string
  tipoPonto: string
  onSubmit: (data: any) => Promise<void>
}) {
  const [form, setForm] = useState({ tipo_ponto: tipoPonto, horario_solicitado: '', motivo: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setForm({ tipo_ponto: tipoPonto || 'entrada', horario_solicitado: '', motivo: '' })
    }
  }, [open, tipoPonto])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.horario_solicitado.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      toast({
        variant: 'destructive',
        title: 'Horário inválido',
        description: 'Use o formato HH:mm',
      })
      return
    }
    if (form.motivo.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Justificativa muito curta',
        description: 'Mínimo de 10 caracteres',
      })
      return
    }
    setIsSubmitting(true)
    await onSubmit(form)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar Ajuste de Ponto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input value={dataPonto ? format(parseISO(dataPonto), 'dd/MM/yyyy') : ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Ponto</Label>
            <Select
              value={form.tipo_ponto}
              onValueChange={(v) => setForm((prev) => ({ ...prev, tipo_ponto: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida_almoco">Almoço (Almoço)</SelectItem>
                <SelectItem value="retorno_almoco">Retorno (Retorno)</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Horário Solicitado (HH:mm)</Label>
            <Input
              placeholder="00:00"
              value={form.horario_solicitado}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '')
                if (v.length > 4) v = v.slice(0, 4)
                if (v.length >= 3) {
                  v = v.slice(0, 2) + ':' + v.slice(2)
                }
                setForm((prev) => ({ ...prev, horario_solicitado: v }))
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Justificativa</Label>
            <Textarea
              placeholder="Por que não bateu o ponto? (mínimo 10 caracteres)"
              value={form.motivo}
              onChange={(e) => setForm((prev) => ({ ...prev, motivo: e.target.value }))}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function EspelhoPonto() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<any[]>([])
  const [ajustesPendentes, setAjustesPendentes] = useState<any[]>([])
  const [manualPointsMap, setManualPointsMap] = useState<Record<string, Record<string, boolean>>>(
    {},
  )
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [selectedUser, setSelectedUser] = useState<string>('me')

  const [ajusteModal, setAjusteModal] = useState(false)
  const [ajusteData, setAjusteData] = useState({ data_ponto: '', tipo_ponto: '' })

  const isManagerOrAdmin = profile?.access_level === 'total' || profile?.access_level === 'gerencia'

  useEffect(() => {
    if (isManagerOrAdmin) fetchUsers()
  }, [isManagerOrAdmin])

  useEffect(() => {
    if (user) fetchRecords()
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

      const [resPontosDiarios, resAjustes, resPontos] = await Promise.all([
        supabase
          .from('pontos_diarios')
          .select('*')
          .eq('profile_id', targetUserId)
          .gte('data', start)
          .lte('data', end)
          .order('data', { ascending: false }),
        supabase
          .from('ajuste_ponto')
          .select('*')
          .eq('usuario_id', targetUserId)
          .eq('status', 'pendente')
          .gte('data_ponto', start)
          .lte('data_ponto', end),
        supabase
          .from('pontos')
          .select('data, tipo_ponto, tipo_registro')
          .eq('profile_id', targetUserId)
          .gte('data', start)
          .lte('data', end),
      ])

      if (resPontosDiarios.error) throw resPontosDiarios.error
      if (resAjustes.error) throw resAjustes.error
      if (resPontos.error) throw resPontos.error

      const map: Record<string, Record<string, boolean>> = {}
      resPontos.data?.forEach((p) => {
        if (!map[p.data]) map[p.data] = {}
        if (p.tipo_registro === 'manual') {
          const colMap: Record<string, string> = {
            entrada: 'entrada',
            almoço_saída: 'saida_almoco',
            almoço_retorno: 'retorno_almoco',
            saída: 'saida',
          }
          const field = colMap[p.tipo_ponto]
          if (field) map[p.data][field] = true
        }
      })

      let fetchedRecords = resPontosDiarios.data || []
      const updates: any[] = []

      fetchedRecords = fetchedRecords.map((r) => {
        if (r.entrada && r.saida_almoco && r.retorno_almoco && r.saida) {
          const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number)
            return h * 60 + m
          }
          const m1 = parseTime(r.entrada)
          const m2 = parseTime(r.saida_almoco)
          const m3 = parseTime(r.retorno_almoco)
          const m4 = parseTime(r.saida)
          const totalMins = m2 - m1 + (m4 - m3)
          const hrs = totalMins / 60

          const currentHrs = r.horas_calculadas ? Number(r.horas_calculadas) : null
          if (currentHrs === null || Math.abs(currentHrs - hrs) > 0.001) {
            updates.push({ id: r.id, horas_calculadas: hrs })
            return { ...r, horas_calculadas: hrs }
          }
        }
        return r
      })

      setManualPointsMap(map)
      setRecords(fetchedRecords)
      setAjustesPendentes(resAjustes.data || [])

      updates.forEach((u) => {
        supabase
          .from('pontos_diarios')
          .update({ horas_calculadas: u.horas_calculadas })
          .eq('id', u.id)
          .then()
      })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar registros', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const rowsWithBalance = useMemo(() => {
    const ascRecords = [...records].reverse()
    let cumulative = 0
    const mapped = ascRecords.map((r) => {
      const dailyHours = r.horas_calculadas || 0
      cumulative += dailyHours
      return {
        ...r,
        horas_acumuladas_linha: cumulative,
      }
    })
    return mapped.reverse()
  }, [records])

  const totalAccumulated =
    rowsWithBalance.length > 0 ? rowsWithBalance[0].horas_acumuladas_linha : 0

  function openAjusteModal(data_ponto: string, tipo_ponto: string) {
    setAjusteData({ data_ponto, tipo_ponto })
    setAjusteModal(true)
  }

  async function handleAjusteSubmit(form: any) {
    const targetUserId = selectedUser === 'me' ? user?.id : selectedUser
    if (!targetUserId) return

    const { error } = await supabase.from('ajuste_ponto').insert({
      usuario_id: targetUserId,
      data_ponto: ajusteData.data_ponto,
      horario_solicitado: form.horario_solicitado,
      motivo: form.motivo,
      tipo_ponto: form.tipo_ponto,
      status: 'pendente',
    } as any)

    if (error) throw error

    toast({
      title: 'Solicitação enviada para análise',
      className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    })
    setAjusteModal(false)
    fetchRecords()
  }

  const renderCell = (row: any, field: string) => {
    const value = row[field]
    const isManual = manualPointsMap[row.data]?.[field]

    if (value) {
      return (
        <span className={isManual ? 'text-blue-600 font-semibold' : 'text-muted-foreground'}>
          {value}
        </span>
      )
    }

    const hasPending = ajustesPendentes.some(
      (a) => a.data_ponto === row.data && a.tipo_ponto === field,
    )

    if (hasPending) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center text-orange-500 text-xs font-medium cursor-help gap-1">
              --:-- <Clock className="w-3 h-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>Ajuste solicitado - Aguardando aprovação</TooltipContent>
        </Tooltip>
      )
    }

    return (
      <span className="flex items-center gap-1 text-muted-foreground group">
        --:--
        <button
          type="button"
          title="Solicitar Ajuste"
          className="text-muted-foreground/40 hover:text-primary transition-colors disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
          onClick={() => openAjusteModal(row.data, field)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </span>
    )
  }

  const renderMobileCell = (row: any, field: string, label: string) => {
    const value = row[field]
    const isManual = manualPointsMap[row.data]?.[field]
    const hasPending = ajustesPendentes.some(
      (a) => a.data_ponto === row.data && a.tipo_ponto === field,
    )

    return (
      <div>
        <span className="text-muted-foreground block text-xs">{label}</span>
        <span className={`font-medium flex items-center gap-2 ${isManual ? 'text-blue-600' : ''}`}>
          {value || '--:--'}
          {!value && !hasPending && (
            <button
              type="button"
              className="text-muted-foreground hover:text-primary"
              onClick={() => openAjusteModal(row.data, field)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
        {!value && hasPending && (
          <span className="text-xs text-orange-500 block mt-1">
            Ajuste solicitado - Aguardando aprovação
          </span>
        )}
      </div>
    )
  }

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
        <Card className="md:col-span-1 border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Horas Acumuladas (Mês)</p>
              <p className="text-3xl font-bold tracking-tighter text-primary">
                {formatDecimalHours(totalAccumulated)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
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
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[120px]">Data</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Almoço</TableHead>
                      <TableHead>Retorno</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Total Hrs</TableHead>
                      <TableHead className="text-right">Horas Acumuladas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rowsWithBalance.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {format(parseISO(row.data), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{renderCell(row, 'entrada')}</TableCell>
                        <TableCell>{renderCell(row, 'saida_almoco')}</TableCell>
                        <TableCell>{renderCell(row, 'retorno_almoco')}</TableCell>
                        <TableCell>{renderCell(row, 'saida')}</TableCell>
                        <TableCell className={`font-medium ${getHoursColor(row.horas_calculadas)}`}>
                          {formatDecimalHours(row.horas_calculadas)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatDecimalHours(row.horas_acumuladas_linha)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-4">
                {rowsWithBalance.map((row) => (
                  <Card key={row.id} className="overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2 border-b flex justify-between items-center">
                      <span className="font-semibold">
                        {format(parseISO(row.data), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        Acumulado: {formatDecimalHours(row.horas_acumuladas_linha)}
                      </span>
                    </div>
                    <CardContent className="p-4 grid grid-cols-2 gap-y-3 text-sm">
                      {renderMobileCell(row, 'entrada', 'Entrada')}
                      {renderMobileCell(row, 'saida_almoco', 'Almoço')}
                      {renderMobileCell(row, 'retorno_almoco', 'Retorno')}
                      {renderMobileCell(row, 'saida', 'Saída')}

                      <div className="col-span-2 pt-2 border-t mt-1 flex justify-between">
                        <div>
                          <span className="text-muted-foreground text-xs mr-2">Total Horas:</span>
                          <span className={`font-semibold ${getHoursColor(row.horas_calculadas)}`}>
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

      <AjusteModal
        open={ajusteModal}
        onOpenChange={setAjusteModal}
        dataPonto={ajusteData.data_ponto}
        tipoPonto={ajusteData.tipo_ponto}
        onSubmit={handleAjusteSubmit}
      />
    </div>
  )
}
