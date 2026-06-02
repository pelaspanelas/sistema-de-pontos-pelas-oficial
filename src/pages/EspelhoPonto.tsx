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
import {
  Calendar as CalendarIcon,
  Clock,
  Pencil,
  LayoutList,
  CalendarDays as CalendarDaysIcon,
  FileDown,
  Settings2,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  format,
  parseISO,
  endOfMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isWeekend,
} from 'date-fns'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
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

function AdminEditModal({
  open,
  onOpenChange,
  dataPonto,
  record,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dataPonto: string
  record: any
  onSubmit: (form: any) => Promise<void>
}) {
  const [form, setForm] = useState({
    entrada: '',
    saida_almoco: '',
    retorno_almoco: '',
    saida: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setForm({
        entrada: record?.entrada || '',
        saida_almoco: record?.saida_almoco || '',
        retorno_almoco: record?.retorno_almoco || '',
        saida: record?.saida || '',
      })
    }
  }, [open, record])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    const fields = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'] as const
    for (const f of fields) {
      if (form[f] && !form[f].match(timeRegex)) {
        toast({
          variant: 'destructive',
          title: 'Horário inválido',
          description: `Formato inválido. Use HH:mm`,
        })
        return
      }
    }

    setIsSubmitting(true)
    await onSubmit(form)
    setIsSubmitting(false)
  }

  const handleChange = (field: string, value: string) => {
    let v = value.replace(/\D/g, '')
    if (v.length > 4) v = v.slice(0, 4)
    if (v.length >= 3) {
      v = v.slice(0, 2) + ':' + v.slice(2)
    }
    setForm((prev) => ({ ...prev, [field]: v }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuste Manual de Ponto (Admin)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Input value={dataPonto ? format(parseISO(dataPonto), 'dd/MM/yyyy') : ''} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entrada</Label>
              <Input
                placeholder="00:00"
                value={form.entrada}
                onChange={(e) => handleChange('entrada', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Saída Almoço</Label>
              <Input
                placeholder="00:00"
                value={form.saida_almoco}
                onChange={(e) => handleChange('saida_almoco', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Retorno Almoço</Label>
              <Input
                placeholder="00:00"
                value={form.retorno_almoco}
                onChange={(e) => handleChange('retorno_almoco', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Saída</Label>
              <Input
                placeholder="00:00"
                value={form.saida}
                onChange={(e) => handleChange('saida', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
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
  const [feriados, setFeriados] = useState<any[]>([])

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [selectedUser, setSelectedUser] = useState<string>('me')

  const [ajusteModal, setAjusteModal] = useState(false)
  const [ajusteData, setAjusteData] = useState({ data_ponto: '', tipo_ponto: '' })

  const [adminEditModal, setAdminEditModal] = useState(false)
  const [adminEditData, setAdminEditData] = useState<{ data_ponto: string; record: any }>({
    data_ponto: '',
    record: null,
  })

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

      const [resPontosDiarios, resAjustes, resPontos, resFeriados] = await Promise.all([
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
        supabase.from('feriados').select('*').gte('data', start).lte('data', end),
      ])

      if (resPontosDiarios.error) throw resPontosDiarios.error
      if (resAjustes.error) throw resAjustes.error
      if (resPontos.error) throw resPontos.error
      if (resFeriados.error) throw resFeriados.error

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
      setFeriados(resFeriados.data || [])

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

  const exportToCSV = () => {
    const headers = [
      'Data',
      'Entrada',
      'Saída Almoço',
      'Retorno Almoço',
      'Saída',
      'Total Horas',
      'Horas Acumuladas',
    ]

    const csvContent = [
      headers.join(','),
      ...rowsWithBalance.map((row) =>
        [
          format(parseISO(row.data), 'dd/MM/yyyy'),
          row.entrada || '--:--',
          row.saida_almoco || '--:--',
          row.retorno_almoco || '--:--',
          row.saida || '--:--',
          formatDecimalHours(row.horas_calculadas),
          formatDecimalHours(row.horas_acumuladas_linha),
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `espelho_ponto_${selectedMonth}_${selectedYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function openActionModal(data_ponto: string, field: string = 'entrada', rowRecord?: any) {
    if (isManagerOrAdmin) {
      const rec = rowRecord || records.find((r) => r.data === data_ponto)
      setAdminEditData({ data_ponto, record: rec })
      setAdminEditModal(true)
    } else {
      setAjusteData({ data_ponto, tipo_ponto: field })
      setAjusteModal(true)
    }
  }

  async function handleAdminEditSubmit(form: any) {
    const targetUserId = selectedUser === 'me' ? user?.id : selectedUser
    if (!targetUserId) return

    const parseTime = (t: string) => {
      if (!t) return null
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }

    let horas_calculadas: number | null = null
    const m1 = parseTime(form.entrada)
    const m2 = parseTime(form.saida_almoco)
    const m3 = parseTime(form.retorno_almoco)
    const m4 = parseTime(form.saida)

    if (m1 !== null && m2 !== null && m3 !== null && m4 !== null) {
      horas_calculadas = (m2 - m1 + (m4 - m3)) / 60
    }

    try {
      let diarioId = adminEditData.record?.id
      if (!diarioId) {
        const { data, error } = await supabase
          .from('pontos_diarios')
          .insert({
            profile_id: targetUserId,
            criado_por: user!.id,
            data: adminEditData.data_ponto,
            entrada: form.entrada || null,
            saida_almoco: form.saida_almoco || null,
            retorno_almoco: form.retorno_almoco || null,
            saida: form.saida || null,
            horas_calculadas,
            tipo_registro: 'manual',
          })
          .select()
          .single()
        if (error) throw error
        diarioId = data.id
      } else {
        const { error } = await supabase
          .from('pontos_diarios')
          .update({
            entrada: form.entrada || null,
            saida_almoco: form.saida_almoco || null,
            retorno_almoco: form.retorno_almoco || null,
            saida: form.saida || null,
            horas_calculadas,
            tipo_registro: 'manual',
          })
          .eq('id', diarioId)
        if (error) throw error
      }

      const colMap = {
        entrada: 'entrada',
        saida_almoco: 'almoço_saída',
        retorno_almoco: 'almoço_retorno',
        saida: 'saída',
      }

      for (const [key, tipoPonto] of Object.entries(colMap)) {
        const horario = form[key as keyof typeof form]
        const oldHorario = adminEditData.record?.[key] || null

        if (horario !== oldHorario) {
          if (horario) {
            const { data: existing } = await supabase
              .from('pontos')
              .select('id')
              .eq('profile_id', targetUserId)
              .eq('data', adminEditData.data_ponto)
              .eq('tipo_ponto', tipoPonto)
              .maybeSingle()

            let pontoId = existing?.id

            if (existing) {
              await supabase
                .from('pontos')
                .update({ horario, tipo_registro: 'manual' })
                .eq('id', existing.id)
            } else {
              const { data: newPonto } = await supabase
                .from('pontos')
                .insert({
                  profile_id: targetUserId,
                  criado_por: user!.id,
                  data: adminEditData.data_ponto,
                  data_hora: new Date(`${adminEditData.data_ponto}T${horario}:00`).toISOString(),
                  tipo_ponto: tipoPonto,
                  horario,
                  tipo_registro: 'manual',
                })
                .select('id')
                .single()
              pontoId = newPonto?.id
            }

            if (pontoId) {
              await supabase.from('historico_alteracoes_ponto').insert({
                ponto_id: pontoId,
                alterado_por: user!.id,
                coluna_alterada: key,
                valor_anterior: oldHorario,
                valor_novo: horario,
              } as any)
            }
          } else {
            const { data: existing } = await supabase
              .from('pontos')
              .select('id')
              .eq('profile_id', targetUserId)
              .eq('data', adminEditData.data_ponto)
              .eq('tipo_ponto', tipoPonto)
              .maybeSingle()

            if (existing) {
              await supabase.from('historico_alteracoes_ponto').insert({
                ponto_id: existing.id,
                alterado_por: user!.id,
                coluna_alterada: key,
                valor_anterior: oldHorario,
                valor_novo: null,
              } as any)

              await supabase.from('pontos').delete().eq('id', existing.id)
            }
          }
        }
      }

      toast({
        title: 'Ponto ajustado com sucesso',
        className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      })
      setAdminEditModal(false)
      fetchRecords()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar ajuste',
        description: err.message,
      })
    }
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

    const hasPending = ajustesPendentes.some(
      (a) => a.data_ponto === row.data && a.tipo_ponto === field,
    )

    if (hasPending && !value) {
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
      <span className="flex items-center gap-1 group">
        <span
          className={cn(
            isManual
              ? 'text-blue-600 font-semibold flex items-center gap-1'
              : value
                ? 'text-muted-foreground'
                : 'text-muted-foreground',
          )}
        >
          {value || '--:--'}
          {isManual && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Settings2 className="w-3 h-3 text-blue-500" />
              </TooltipTrigger>
              <TooltipContent>Editado Manualmente</TooltipContent>
            </Tooltip>
          )}
        </span>
        {(!value || isManagerOrAdmin) && !hasPending && (
          <button
            type="button"
            title={isManagerOrAdmin ? 'Editar Ponto' : 'Solicitar Ajuste'}
            className="text-muted-foreground/40 hover:text-primary transition-colors disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
            onClick={() => openActionModal(row.data, field, row)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
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
          {isManual && <Settings2 className="w-3 h-3 text-blue-500" />}
          {(!value || isManagerOrAdmin) && !hasPending && (
            <button
              type="button"
              className="text-muted-foreground hover:text-primary"
              onClick={() => openActionModal(row.data, field, row)}
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
          <div className="hidden sm:block">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as 'list' | 'calendar')}
              className="bg-background border rounded-md h-10 p-1"
            >
              <ToggleGroupItem value="list" aria-label="Lista" className="px-3 text-sm">
                <LayoutList className="h-4 w-4 mr-2" /> Lista
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendário" className="px-3 text-sm">
                <CalendarDaysIcon className="h-4 w-4 mr-2" /> Calendário
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

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
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="hidden sm:flex gap-2 h-10 px-3"
            >
              <FileDown className="w-4 h-4" /> Exportar
            </Button>
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
          <div className="sm:hidden mb-4 flex gap-2">
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as 'list' | 'calendar')}
              className="bg-background border rounded-md p-1 flex-1 flex"
            >
              <ToggleGroupItem value="list" aria-label="Lista" className="flex-1 text-sm">
                <LayoutList className="h-4 w-4 mr-2" /> Lista
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendário" className="flex-1 text-sm">
                <CalendarDaysIcon className="h-4 w-4 mr-2" /> Calendário
              </ToggleGroupItem>
            </ToggleGroup>
            <Button variant="outline" onClick={exportToCSV} className="h-10 px-3">
              <FileDown className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <div className="min-w-[700px] border rounded-md overflow-hidden bg-background">
                <div className="grid grid-cols-7 border-b bg-muted/50 [&>div:nth-child(7n)]:border-r-0">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                    <div key={d} className="p-2 text-center text-sm font-semibold border-r">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 [&>div:nth-child(7n)]:border-r-0">
                  {(() => {
                    const monthInt = parseInt(selectedMonth, 10)
                    const yearInt = parseInt(selectedYear, 10)
                    const baseDate = new Date(yearInt, monthInt, 1)

                    const start = startOfWeek(startOfMonth(baseDate))
                    const end = endOfWeek(endOfMonth(baseDate))
                    const days = eachDayOfInterval({ start, end })

                    return days.map((day, i) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const record = rowsWithBalance.find((r) => r.data === dateStr)
                      const feriado = feriados.find((f) => f.data === dateStr)
                      const isCurrentMonth = isSameMonth(day, baseDate)
                      const isWknd = isWeekend(day)
                      const isDayToday = isToday(day)

                      return (
                        <div
                          key={dateStr}
                          className={cn(
                            'border-b border-r p-2 min-h-[120px] flex flex-col gap-1 transition-colors cursor-pointer group',
                            !isCurrentMonth && 'bg-muted/20 opacity-60',
                            isCurrentMonth && isWknd && 'bg-muted/10',
                            isCurrentMonth && feriado && 'bg-orange-50/30',
                            'hover:bg-muted/30',
                          )}
                          onClick={() => openActionModal(dateStr, 'entrada', record)}
                        >
                          <div className="flex justify-between items-start">
                            <span
                              className={cn(
                                'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                                isDayToday
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-foreground',
                              )}
                            >
                              {format(day, 'd')}
                            </span>
                            {feriado && isCurrentMonth && (
                              <span
                                className="text-[10px] text-orange-700 font-semibold truncate max-w-[60px] bg-orange-100/80 px-1 py-0.5 rounded"
                                title={feriado.nome}
                              >
                                {feriado.nome}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex-1 flex flex-col justify-end">
                            {record ? (
                              <div className="text-[11px] space-y-0.5">
                                {['entrada', 'saida_almoco', 'retorno_almoco', 'saida'].map(
                                  (field) => {
                                    const labels: Record<string, string> = {
                                      entrada: 'Ent',
                                      saida_almoco: 'S.Alm',
                                      retorno_almoco: 'R.Alm',
                                      saida: 'Saí',
                                    }
                                    const val = record[field]
                                    const isManual = manualPointsMap[dateStr]?.[field]
                                    const hasPending = ajustesPendentes.some(
                                      (a) => a.data_ponto === dateStr && a.tipo_ponto === field,
                                    )

                                    return (
                                      <div
                                        key={field}
                                        className="flex justify-between items-center group/item"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openActionModal(dateStr, field, record)
                                        }}
                                      >
                                        <span className="text-muted-foreground">
                                          {labels[field]}:
                                        </span>
                                        <span
                                          className={cn(
                                            'font-medium transition-colors cursor-pointer group-hover/item:text-primary',
                                            isManual
                                              ? 'text-blue-600'
                                              : val
                                                ? 'text-foreground'
                                                : '',
                                            !val && hasPending && 'text-orange-500',
                                            !val && !hasPending && 'text-muted-foreground/30',
                                          )}
                                        >
                                          {val ? val : hasPending ? 'Pendente' : '--:--'}
                                        </span>
                                      </div>
                                    )
                                  },
                                )}
                                <div className="pt-1 mt-1 border-t flex justify-between items-center font-semibold">
                                  <span className="text-muted-foreground">Tot:</span>
                                  <span className={getHoursColor(record.horas_calculadas)}>
                                    {formatDecimalHours(record.horas_calculadas)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground/40 text-center flex-1 flex items-center justify-center group-hover:text-primary/50 transition-colors">
                                Sem registro
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
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
      <AdminEditModal
        open={adminEditModal}
        onOpenChange={setAdminEditModal}
        dataPonto={adminEditData.data_ponto}
        record={adminEditData.record}
        onSubmit={handleAdminEditSubmit}
      />
    </div>
  )
}
