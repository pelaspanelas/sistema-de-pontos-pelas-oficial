import { useState, useEffect } from 'react'
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
import { Loader2, Plus, Pencil, Trash2, Banknote, AlertCircle, Lock } from 'lucide-react'

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

  // Formulário de lançamento / edição
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [valorInput, setValorInput] = useState('')
  const [descricaoInput, setDescricaoInput] = useState('Vale / Adiantamento')
  const [editingValeId, setEditingValeId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchVales()
      resetForm()
    }
  }, [isOpen, month, year])

  const resetForm = () => {
    setSelectedProfileId('')
    setValorInput('')
    setDescricaoInput('Vale / Adiantamento')
    setEditingValeId(null)
  }

  const fetchVales = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lancamentos_folha')
        .select('id, profile_id, mes, ano, tipo, categoria, valor, descricao, created_at')
        .eq('mes', month)
        .eq('ano', year)
        .eq('tipo', 'vale')
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

  const handleStartEdit = (vale: ValeLaunch) => {
    if (isClosed) return
    setEditingValeId(vale.id)
    setSelectedProfileId(vale.profile_id)
    setValorInput(vale.valor.toString())
    setDescricaoInput(vale.descricao || 'Vale / Adiantamento')
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  const handleSaveVale = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isClosed) {
      toast({
        variant: 'destructive',
        title: 'Mês Fechado',
        description: 'Não é possível lançar ou editar vales em uma competência fechada.',
      })
      return
    }

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
      if (editingValeId) {
        const { error } = await supabase
          .from('lancamentos_folha')
          .update({
            profile_id: selectedProfileId,
            valor: valorNum,
            descricao: descricaoInput.trim() || 'Vale / Adiantamento',
            categoria: 'debito',
            tipo: 'vale',
          })
          .eq('id', editingValeId)

        if (error) throw error
        toast({ title: 'Vale atualizado com sucesso' })
      } else {
        const { error } = await supabase.from('lancamentos_folha').insert({
          profile_id: selectedProfileId,
          mes: month,
          ano: year,
          tipo: 'vale',
          categoria: 'debito',
          valor: valorNum,
          descricao: descricaoInput.trim() || 'Vale / Adiantamento',
          criado_por: user?.id,
        })

        if (error) throw error
        toast({ title: 'Vale lançado com sucesso' })
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

  const handleDeleteVale = async (valeId: string) => {
    if (isClosed) {
      toast({
        variant: 'destructive',
        title: 'Mês Fechado',
        description: 'Não é possível remover vales em competência fechada.',
      })
      return
    }

    if (!confirm('Deseja realmente remover este vale?')) return

    setDeletingId(valeId)
    try {
      const { error } = await supabase.from('lancamentos_folha').delete().eq('id', valeId)
      if (error) throw error

      toast({ title: 'Vale removido com sucesso' })
      if (editingValeId === valeId) resetForm()
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

  const totalVales = vales.reduce((acc, v) => acc + (Number(v.valor) || 0), 0)

  // Filtrar colaboradores que têm entra_folha ativo (e status Ativo)
  const eligibleColaboradores = colaboradores
    .filter((c) => c.entra_folha !== false)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Lançamento de Vales</DialogTitle>
                <DialogDescription>
                  Competência:{' '}
                  <strong className="capitalize">
                    {monthName} de {year}
                  </strong>
                </DialogDescription>
              </div>
            </div>
            {isClosed && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Mês Fechado
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isClosed && (
          <div className="flex items-center gap-2 p-3 text-sm bg-rose-50 border border-rose-200 text-rose-800 rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Esta competência está fechada. Apenas consulta é permitida; não é possível adicionar,
              editar ou excluir vales.
            </span>
          </div>
        )}

        {/* Formulário de inclusão/edição */}
        {!isClosed && (
          <form onSubmit={handleSaveVale} className="p-4 bg-muted/40 rounded-lg border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {editingValeId ? 'Editar Vale' : 'Novo Lançamento de Vale'}
              </span>
              {editingValeId && (
                <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                  Cancelar Edição
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1 md:col-span-1">
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

              <div className="space-y-1">
                <Label htmlFor="valor" className="text-xs">
                  Valor (R$)
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

              <div className="space-y-1">
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

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saving || !selectedProfileId || !valorInput}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : editingValeId ? (
                  <Pencil className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingValeId ? 'Atualizar Vale' : 'Lançar Vale'}
              </Button>
            </div>
          </form>
        )}

        {/* Listagem de vales da competência */}
        <div className="flex-1 overflow-auto border rounded-lg mt-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : vales.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhum vale lançado para esta competência ({monthName}/{year}).
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {!isClosed && <TableHead className="w-24 text-center">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {vales.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.profile_name}</TableCell>
                    <TableCell className="text-muted-foreground">{v.descricao}</TableCell>
                    <TableCell className="text-right font-semibold text-rose-600">
                      {formatCurrency(v.valor)}
                    </TableCell>
                    {!isClosed && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleStartEdit(v)}
                            title="Editar vale"
                            disabled={saving}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-700"
                            onClick={() => handleDeleteVale(v.id)}
                            title="Remover vale"
                            disabled={deletingId === v.id || saving}
                          >
                            {deletingId === v.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Rodapé informativo com total */}
        <div className="flex items-center justify-between pt-4 border-t mt-2">
          <div className="text-xs text-muted-foreground">
            Total de {vales.length} {vales.length === 1 ? 'vale lançado' : 'vales lançados'} no
            período
          </div>
          <div className="text-sm font-semibold">
            Total de Vales: <span className="text-rose-600">{formatCurrency(totalVales)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
