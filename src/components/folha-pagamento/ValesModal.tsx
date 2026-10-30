import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Banknote,
  AlertCircle,
  Lock,
  Calendar,
  Layers,
  Info,
} from 'lucide-react'

export interface ColaboradorFolhaOption {
  id: string
  name: string
  role?: string | null
  base_salary?: number | null
  entra_folha?: boolean
  status?: string | null
}

interface ValeLaunch {
  id: string
  profile_id: string
  profile_name?: string
  mes: number
  ano: number
  tipo: string
  categoria: string
  valor: number
  descricao: string
  created_at: string
}

interface ValesModalProps {
  isOpen: boolean
  onClose: () => void
  month: number
  year: number
  monthName: string
  isClosed: boolean
  colaboradores: ColaboradorFolhaOption[]
  onSuccess: () => void
}

const MONTH_NAMES = [
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

export function ValesModal({
  isOpen,
  onClose,
  month,
  year,
  monthName,
  isClosed,
  colaboradores,
  onSuccess,
}: ValesModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [vales, setVales] = useState<ValeLaunch[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Conjunto de competências fechadas cadastradas no sistema: Set<"ano-mes">
  const [closedCompetencias, setClosedCompetencias] = useState<Set<string>>(new Set())

  // Filtro de visualização da listagem: 'screen' (mês da tela), 'all' (todas) ou 'YYYY-M'
  const [viewFilter, setViewFilter] = useState<'screen' | 'all'>('screen')

  // Formulário de lançamento de vale
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [valorInput, setValorInput] = useState('')
  const [descricaoInput, setDescricaoInput] = useState('Vale / Adiantamento')
  const [origemMes, setOrigemMes] = useState<number>(month)
  const [origemAno, setOrigemAno] = useState<number>(year)
  const [parcelasCount, setParcelasCount] = useState<number>(1)

  // Edição de parcela individual
  const [editingVale, setEditingVale] = useState<ValeLaunch | null>(null)
  const [editMes, setEditMes] = useState<number>(month)
  const [editAno, setEditAno] = useState<number>(year)

  // Anos disponíveis para seleção (ano anterior, atual e próximos 2)
  const availableYears = useMemo(() => {
    const current = new Date().getFullYear()
    return [current - 1, current, current + 1, current + 2]
  }, [])

  useEffect(() => {
    if (isOpen) {
      setOrigemMes(month)
      setOrigemAno(year)
      setViewFilter('screen')
      fetchClosedCompetencias()
      fetchVales()
      resetForm()
    }
  }, [isOpen, month, year])

  const resetForm = () => {
    setSelectedProfileId('')
    setValorInput('')
    setDescricaoInput('Vale / Adiantamento')
    setParcelasCount(1)
    setOrigemMes(month)
    setOrigemAno(year)
    setEditingVale(null)
  }

  const fetchClosedCompetencias = async () => {
    try {
      const { data, error } = await supabase.from('fechamento_mensal').select('mes, ano')
      if (error) throw error
      const set = new Set<string>()
      ;(data || []).forEach((row) => {
        set.add(`${row.ano}-${row.mes}`)
      })
      setClosedCompetencias(set)
    } catch {
      // Ignora silenciosamente ou mantém o estado
    }
  }

  const fetchVales = async () => {
    setLoading(true)
    try {
      // Buscar todos os vales ou os vales relevantes
      const { data, error } = await supabase
        .from('lancamentos_folha')
        .select('id, profile_id, mes, ano, tipo, categoria, valor, descricao, created_at')
        .eq('tipo', 'vale')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const enriched: ValeLaunch[] = (data || []).map((v) => {
        const colab = colaboradores.find((c) => c.id === v.profile_id)
        return {
          ...v,
          profile_name: colab?.name || 'Colaborador',
        }
      })
      setVales(enriched)
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar vales',
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // Calcula os meses das parcelas geradas
  const simulatedParcelas = useMemo(() => {
    const valorNum = parseFloat(valorInput.replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0 || parcelasCount < 1) return []

    const items: Array<{
      numero: number
      mes: number
      ano: number
      mesNome: string
      valor: number
    }> = []

    const valorUnitario = Math.floor((valorNum / parcelasCount) * 100) / 100
    const diferencaCentavos = Math.round((valorNum - valorUnitario * parcelasCount) * 100) / 100

    for (let i = 1; i <= parcelasCount; i++) {
      let targetMes: number
      let targetAno: number

      if (parcelasCount === 1) {
        // 1x desconta no próprio mês de origem selecionado
        targetMes = origemMes
        targetAno = origemAno
      } else {
        // 2x ou mais desconta a partir do mês seguinte ao mês de origem
        // i = 1 -> origemMes + 1, i = 2 -> origemMes + 2, etc.
        const totalMeses = origemMes + i // Ex: mes 9 + 1 = 10 (outubro)
        targetMes = ((totalMeses - 1) % 12) + 1
        targetAno = origemAno + Math.floor((totalMeses - 1) / 12)
      }

      // Ajusta possíveis centavos na última parcela
      const valorFinal = i === parcelasCount ? valorUnitario + diferencaCentavos : valorUnitario

      items.push({
        numero: i,
        mes: targetMes,
        ano: targetAno,
        mesNome: MONTH_NAMES[targetMes - 1],
        valor: Math.round(valorFinal * 100) / 100,
      })
    }

    return items
  }, [valorInput, parcelasCount, origemMes, origemAno])

  const handleStartEdit = (vale: ValeLaunch) => {
    const isValeClosed = closedCompetencias.has(`${vale.ano}-${vale.mes}`)
    if (isValeClosed) {
      toast({
        variant: 'destructive',
        title: 'Competência Fechada',
        description: `Não é possível editar um vale da competência ${MONTH_NAMES[vale.mes - 1]}/${vale.ano} pois está fechada.`,
      })
      return
    }

    setEditingVale(vale)
    setSelectedProfileId(vale.profile_id)
    setValorInput(vale.valor.toString())
    setDescricaoInput(vale.descricao || 'Vale / Adiantamento')
    setEditMes(vale.mes)
    setEditAno(vale.ano)
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  const handleSaveVale = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProfileId) {
      toast({
        variant: 'destructive',
        title: 'Selecione um colaborador',
        description: 'É necessário selecionar o colaborador para o lançamento.',
      })
      return
    }

    const valorNum = parseFloat(valorInput.replace(',', '.'))
    if (isNaN(valorNum) || valorNum <= 0) {
      toast({
        variant: 'destructive',
        title: 'Valor inválido',
        description: 'Informe um valor numérico positivo para o vale.',
      })
      return
    }

    setSaving(true)
    try {
      if (editingVale) {
        // Valida se o mês para o qual o vale está sendo salvo está fechado
        if (closedCompetencias.has(`${editAno}-${editMes}`)) {
          toast({
            variant: 'destructive',
            title: 'Competência Fechada',
            description: `A competência ${MONTH_NAMES[editMes - 1]}/${editAno} está fechada. Não é possível alterar para ela.`,
          })
          setSaving(false)
          return
        }

        const { error } = await supabase
          .from('lancamentos_folha')
          .update({
            profile_id: selectedProfileId,
            mes: editMes,
            ano: editAno,
            valor: valorNum,
            descricao: descricaoInput.trim() || 'Vale / Adiantamento',
            categoria: 'debito',
            tipo: 'vale',
          })
          .eq('id', editingVale.id)

        if (error) throw error
        toast({ title: 'Vale atualizado com sucesso' })
      } else {
        // Lançamento com parcelamento
        const parcelas = simulatedParcelas
        if (parcelas.length === 0) {
          throw new Error('Nenhuma parcela gerada para o lançamento.')
        }

        // Verifica se alguma das competências das parcelas está fechada
        const parcelasFechadas = parcelas.filter((p) => closedCompetencias.has(`${p.ano}-${p.mes}`))
        if (parcelasFechadas.length > 0) {
          const comps = parcelasFechadas.map((p) => `${p.mesNome}/${p.ano}`).join(', ')
          toast({
            variant: 'destructive',
            title: 'Competência Fechada',
            description: `Não é possível lançar parcelas na(s) competência(s) fechada(s): ${comps}.`,
          })
          setSaving(false)
          return
        }

        const baseDesc = descricaoInput.trim() || 'Vale'
        const records = parcelas.map((p) => {
          let descCompleta = baseDesc
          if (parcelasCount > 1) {
            descCompleta = `${baseDesc} (${p.numero}/${parcelasCount} - Origem: ${MONTH_NAMES[origemMes - 1].slice(0, 3)}/${origemAno})`
          }
          return {
            profile_id: selectedProfileId,
            mes: p.mes,
            ano: p.ano,
            tipo: 'vale',
            categoria: 'debito',
            valor: p.valor,
            descricao: descCompleta,
            criado_por: user?.id,
          }
        })

        const { error } = await supabase.from('lancamentos_folha').insert(records)
        if (error) throw error

        if (parcelasCount > 1) {
          toast({
            title: 'Vale parcelado com sucesso!',
            description: `Lançadas ${parcelasCount} parcelas a partir de ${parcelas[0].mesNome}/${parcelas[0].ano}.`,
          })
        } else {
          toast({
            title: 'Vale lançado com sucesso!',
            description: `Lançado na competência ${MONTH_NAMES[origemMes - 1]}/${origemAno}.`,
          })
        }
      }

      resetForm()
      await fetchVales()
      onSuccess()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar vale',
        description: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVale = async (vale: ValeLaunch) => {
    const isValeClosed = closedCompetencias.has(`${vale.ano}-${vale.mes}`)
    if (isValeClosed) {
      toast({
        variant: 'destructive',
        title: 'Competência Fechada',
        description: `Não é possível remover vales da competência fechada (${MONTH_NAMES[vale.mes - 1]}/${vale.ano}).`,
      })
      return
    }

    if (!confirm('Deseja realmente remover este vale?')) return

    setDeletingId(vale.id)
    try {
      const { error } = await supabase.from('lancamentos_folha').delete().eq('id', vale.id)
      if (error) throw error

      toast({ title: 'Vale removido com sucesso' })
      if (editingVale?.id === vale.id) resetForm()
      await fetchVales()
      onSuccess()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover vale',
        description: err.message,
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  // Filtrar colaboradores que têm entra_folha ativo
  const eligibleColaboradores = useMemo(() => {
    return colaboradores
      .filter((c) => c.entra_folha !== false)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [colaboradores])

  // Vales filtrados para exibição na tabela
  const displayedVales = useMemo(() => {
    if (viewFilter === 'screen') {
      return vales.filter((v) => v.mes === month && v.ano === year)
    }
    return vales
  }, [vales, viewFilter, month, year])

  const totalDisplayed = displayedVales.reduce((acc, v) => acc + (Number(v.valor) || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Lançamento e Controle de Vales</DialogTitle>
                <DialogDescription>
                  Competência atual na folha:{' '}
                  <strong className="capitalize">
                    {monthName} de {year}
                  </strong>
                </DialogDescription>
              </div>
            </div>
            {isClosed && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Mês Atual Fechado
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Formulário de inclusão/edição */}
        <form onSubmit={handleSaveVale} className="p-4 bg-muted/40 rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {editingVale ? 'Editar Parcela de Vale' : 'Novo Lançamento de Vale'}
              </span>
              {!editingVale && parcelasCount > 1 && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                  {parcelasCount}x parcelado
                </Badge>
              )}
            </div>
            {editingVale && (
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancelar Edição
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Colaborador */}
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="colaborador" className="text-xs">
                Colaborador
              </Label>
              <Select
                value={selectedProfileId}
                onValueChange={setSelectedProfileId}
                disabled={saving}
              >
                <SelectTrigger id="colaborador">
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleColaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor total */}
            <div className="space-y-1">
              <Label htmlFor="valor" className="text-xs">
                {editingVale ? 'Valor da Parcela (R$)' : 'Valor Total do Vale (R$)'}
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                disabled={saving}
                required
              />
            </div>

            {/* Parcelamento (apenas no modo novo) */}
            {!editingVale ? (
              <div className="space-y-1">
                <Label htmlFor="parcelamento" className="text-xs flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Parcelamento
                </Label>
                <Select
                  value={parcelasCount.toString()}
                  onValueChange={(v) => setParcelasCount(Number(v))}
                  disabled={saving}
                >
                  <SelectTrigger id="parcelamento">
                    <SelectValue placeholder="Parcelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x (À vista no mês)</SelectItem>
                    <SelectItem value="2">2x (a partir do mês seg.)</SelectItem>
                    <SelectItem value="3">3x (a partir do mês seg.)</SelectItem>
                    <SelectItem value="4">4x (a partir do mês seg.)</SelectItem>
                    <SelectItem value="5">5x (a partir do mês seg.)</SelectItem>
                    <SelectItem value="6">6x (a partir do mês seg.)</SelectItem>
                    <SelectItem value="10">10x (a partir do mês seg.)</SelectItem>
                    <SelectItem value="12">12x (a partir do mês seg.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="edit-mes" className="text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Competência do Desconto
                </Label>
                <Select
                  value={`${editAno}-${editMes}`}
                  onValueChange={(v) => {
                    const [y, m] = v.split('-').map(Number)
                    setEditAno(y)
                    setEditMes(m)
                  }}
                  disabled={saving}
                >
                  <SelectTrigger id="edit-mes">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, idx) => (
                      <SelectItem key={idx} value={`${editAno}-${idx + 1}`}>
                        {m}/{editAno}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Escolha do Mês/Ano de Origem (apenas no modo novo) */}
            {!editingVale ? (
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Mês de Origem do Vale
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={origemMes.toString()}
                    onValueChange={(v) => setOrigemMes(Number(v))}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((m, idx) => (
                        <SelectItem key={idx} value={(idx + 1).toString()}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={origemAno.toString()}
                    onValueChange={(v) => setOrigemAno(Number(v))}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {/* Descrição / Motivo */}
            <div className={`space-y-1 ${!editingVale ? 'sm:col-span-2' : 'sm:col-span-3'}`}>
              <Label htmlFor="descricao" className="text-xs">
                Descrição / Motivo
              </Label>
              <Input
                id="descricao"
                placeholder="Ex: Vale adiantamento"
                value={descricaoInput}
                onChange={(e) => setDescricaoInput(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Preview das parcelas geradas */}
          {!editingVale && simulatedParcelas.length > 0 && parcelasCount > 1 && (
            <div className="p-2.5 bg-primary/5 rounded-md border border-primary/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-primary">
                <Info className="w-3.5 h-3.5" />
                <span>
                  Divisão do desconto (Origem: {MONTH_NAMES[origemMes - 1]}/{origemAno} →{' '}
                  {parcelasCount}x parcelas):
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {simulatedParcelas.map((p) => {
                  const isClosedComp = closedCompetencias.has(`${p.ano}-${p.mes}`)
                  return (
                    <span
                      key={p.numero}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${
                        isClosedComp
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-background border-muted'
                      }`}
                    >
                      <span className="font-semibold text-muted-foreground">{p.numero}ª:</span>
                      <strong className="capitalize">
                        {p.mesNome}/{p.ano}
                      </strong>
                      <span className="text-rose-600 font-semibold">{formatCurrency(p.valor)}</span>
                      {isClosedComp && (
                        <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                          Fechada
                        </Badge>
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="submit" disabled={saving || !selectedProfileId || !valorInput}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : editingVale ? (
                <Pencil className="h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {editingVale
                ? 'Atualizar Parcela'
                : parcelasCount > 1
                  ? `Lançar Vale em ${parcelasCount}x`
                  : 'Lançar Vale'}
            </Button>
          </div>
        </form>

        {/* Barra de Filtro de Visualização */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Exibir:</Label>
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
              <Button
                type="button"
                variant={viewFilter === 'screen' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setViewFilter('screen')}
              >
                Mês da tela ({monthName}/{year})
              </Button>
              <Button
                type="button"
                variant={viewFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setViewFilter('all')}
              >
                Todos os meses ({vales.length})
              </Button>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {displayedVales.length} {displayedVales.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {/* Listagem de vales da competência */}
        <div className="flex-1 overflow-auto border rounded-lg mt-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : displayedVales.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              {viewFilter === 'screen'
                ? `Nenhum vale lançado para o mês da tela (${monthName}/${year}).`
                : 'Nenhum vale registrado no sistema.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="w-32">Mês Desconto</TableHead>
                  <TableHead>Descrição / Parcela</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-24 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedVales.map((v) => {
                  const isValeClosed = closedCompetencias.has(`${v.ano}-${v.mes}`)
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.profile_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs capitalize font-normal">
                            {MONTH_NAMES[v.mes - 1]}/{v.ano}
                          </Badge>
                          {isValeClosed && (
                            <Badge
                              variant="destructive"
                              className="h-4 px-1 text-[10px]"
                              title="Competência Fechada"
                            >
                              <Lock className="w-2.5 h-2.5" />
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{v.descricao}</TableCell>
                      <TableCell className="text-right font-semibold text-rose-600">
                        {formatCurrency(v.valor)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleStartEdit(v)}
                            title={isValeClosed ? 'Mês fechado (não editável)' : 'Editar parcela'}
                            disabled={saving || isValeClosed}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 disabled:opacity-40"
                            onClick={() => handleDeleteVale(v)}
                            title={isValeClosed ? 'Mês fechado (não removível)' : 'Remover parcela'}
                            disabled={deletingId === v.id || saving || isValeClosed}
                          >
                            {deletingId === v.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Rodapé informativo com total */}
        <div className="flex items-center justify-between pt-4 border-t mt-2">
          <div className="text-xs text-muted-foreground">
            {viewFilter === 'screen'
              ? `Total de vales em ${monthName}/${year}: ${displayedVales.length}`
              : `Total de todas as parcelas: ${displayedVales.length}`}
          </div>
          <div className="text-sm font-semibold">
            Total Descontos: <span className="text-rose-600">{formatCurrency(totalDisplayed)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
