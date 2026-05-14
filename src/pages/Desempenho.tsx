import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Trash2, Loader2, StickyNote } from 'lucide-react'

type Tarefa = {
  id: string
  titulo: string
  descricao?: string | null
  data: string
  quantidade_meta: string
  prioridade: number
  responsavel_id?: string | null
  responsavel?: { id: string; name: string } | null
}

type Conclusao = {
  id: string
  tarefa_id: string | null
  funcionario_id: string
  status: string
  descricao?: string | null
  data?: string | null
  data_conclusao: string
  responsavel?: { id: string; name: string } | null
}

type Informativo = {
  id: string
  titulo: string
  mensagem: string
  created_at: string
  destinatarios: string[] | null
  lido?: boolean
}

type Employee = {
  id: string
  name: string
}

type TarefaRow = {
  id: string
  isLivre: boolean
  titulo: string
  descricao?: string
  data: string
  prioridade?: number
  quantidade_meta: string
  status: string
  conclusao_id?: string
  responsavel?: { id: string; name: string } | null
  responsavel_id?: string | null
}

const PRIORITIES: Record<number, { label: string; color: string }> = {
  1: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
  2: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  3: { label: 'Alta', color: 'bg-red-100 text-red-800' },
}

export default function Desempenho() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const isManagerOrAdmin = profile?.access_level === 'total' || profile?.access_level === 'gerencia'

  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [selectedUser, setSelectedUser] = useState<string>('todos')
  const [dateFilter, setDateFilter] = useState<'ontem' | 'hoje' | 'amanha'>('hoje')

  const [funcionarios, setFuncionarios] = useState<Employee[]>([])
  const [tarefas, setTarefas] = useState<TarefaRow[]>([])
  const [informativos, setInformativos] = useState<Informativo[]>([])

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const [livreModalOpen, setLivreModalOpen] = useState(false)
  const [livreDesc, setLivreDesc] = useState('')
  const [livreData, setLivreData] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [livreStatus, setLivreStatus] = useState('pendente')
  const [adding, setAdding] = useState(false)

  const [selectedInf, setSelectedInf] = useState<Informativo | null>(null)
  const [readingInf, setReadingInf] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const months = useMemo(() => {
    const result = []
    for (let i = -6; i < 6; i++) {
      const d = new Date()
      d.setMonth(d.getMonth() + i)
      result.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase()),
      })
    }
    return result
  }, [])

  useEffect(() => {
    if (isManagerOrAdmin) {
      supabase
        .from('profiles')
        .select('id, name')
        .order('name')
        .then(({ data }) => {
          if (data) setFuncionarios(data)
        })
    }
  }, [isManagerOrAdmin])

  const getFilterDate = () => {
    const d = new Date()
    if (dateFilter === 'ontem') d.setDate(d.getDate() - 1)
    if (dateFilter === 'amanha') d.setDate(d.getDate() + 1)
    return format(d, 'yyyy-MM-dd')
  }

  const fetchDados = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const targetDateStr = getFilterDate()

      let query = supabase
        .from('tarefas')
        .select('*, responsavel:profiles!tarefas_responsavel_id_fkey(id, name)')
        .eq('data', targetDateStr)
        .order('data', { ascending: true })

      if (!isManagerOrAdmin) {
        query = query.eq('responsavel_id', profile.id)
      } else if (selectedUser !== 'todos') {
        query = query.eq('responsavel_id', selectedUser)
      }

      const { data: tarefasData, error: tarefasError } = await query
      if (tarefasError) throw tarefasError

      const taskIds = tarefasData.map((t) => t.id)
      let concluidasData: Conclusao[] = []

      if (taskIds.length > 0) {
        const { data: cData1, error: cError1 } = await supabase
          .from('tarefas_concluidas')
          .select('*')
          .in('tarefa_id', taskIds)
        if (cError1) throw cError1
        if (cData1) concluidasData.push(...(cData1 as Conclusao[]))
      }

      // @ts-expect-error
      let queryLivre = supabase
        .from('tarefas_concluidas')
        .select('*, responsavel:profiles!tarefas_concluidas_funcionario_id_fkey(id, name)')
        .is('tarefa_id', null)
        .eq('data', targetDateStr)

      if (!isManagerOrAdmin) {
        queryLivre = queryLivre.eq('funcionario_id', profile.id)
      } else if (selectedUser !== 'todos') {
        queryLivre = queryLivre.eq('funcionario_id', selectedUser)
      }

      const { data: cData2, error: cError2 } = await queryLivre
      if (cError2) throw cError2
      if (cData2) concluidasData.push(...(cData2 as Conclusao[]))

      const mixedTarefas: TarefaRow[] = [
        ...tarefasData.map((t) => {
          const conclusao = concluidasData.find((c) => c.tarefa_id === t.id)
          return {
            id: t.id,
            isLivre: false,
            titulo: t.titulo,
            descricao: t.descricao || undefined,
            data: t.data,
            prioridade: t.prioridade,
            quantidade_meta: t.quantidade_meta,
            status: conclusao ? conclusao.status : 'pendente',
            conclusao_id: conclusao?.id,
            responsavel: t.responsavel,
            responsavel_id: t.responsavel_id,
          }
        }),
        ...concluidasData
          .filter((c) => !c.tarefa_id)
          .map((c) => ({
            id: c.id,
            isLivre: true,
            titulo: 'Tarefa Livre',
            descricao: c.descricao || undefined,
            data: c.data || c.data_conclusao || format(new Date(), 'yyyy-MM-dd'),
            prioridade: undefined,
            quantidade_meta: '-',
            status: c.status,
            conclusao_id: c.id,
            responsavel: c.responsavel,
            responsavel_id: c.funcionario_id,
          })),
      ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

      setTarefas(mixedTarefas)

      const { data: informativosData, error: informativosError } = await supabase
        .from('informativos')
        .select('*')
        .or('lido.eq.false,lido.is.null')
        .order('created_at', { ascending: false })
      if (informativosError) throw informativosError

      const filteredInformativos = (informativosData || []).filter((inf) => {
        if (!inf.destinatarios || inf.destinatarios.length === 0) return true
        if (!isManagerOrAdmin) {
          return inf.destinatarios.includes(profile.id)
        }
        if (selectedUser !== 'todos') {
          return inf.destinatarios.includes(selectedUser)
        }
        return true
      })
      setInformativos(filteredInformativos as Informativo[])
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao buscar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [month, selectedUser, profile?.id, dateFilter])

  const toggleStatus = async (tarefa: TarefaRow) => {
    const processingId = tarefa.isLivre ? tarefa.conclusao_id! : tarefa.id
    setProcessing(processingId)
    const newStatus = tarefa.status === 'concluida' ? 'pendente' : 'concluida'

    try {
      if (tarefa.conclusao_id) {
        const { error } = await supabase
          .from('tarefas_concluidas')
          .update({ status: newStatus })
          .eq('id', tarefa.conclusao_id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tarefas_concluidas').insert({
          tarefa_id: tarefa.id,
          funcionario_id: profile?.id,
          data_conclusao: format(new Date(), 'yyyy-MM-dd'),
          status: newStatus,
        })
        if (error) throw error
      }
      toast({ title: 'Sucesso', description: `Tarefa marcada como ${newStatus}` })
      fetchDados()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  const handleAddTarefaLivre = async () => {
    if (!livreDesc.trim()) {
      toast({ title: 'Erro', description: 'Preencha a descrição', variant: 'destructive' })
      return
    }
    if (!livreData) {
      toast({ title: 'Erro', description: 'Preencha a data', variant: 'destructive' })
      return
    }

    const selectedDate = new Date(livreData + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      toast({
        title: 'Erro',
        description: 'A data não pode ser no passado',
        variant: 'destructive',
      })
      return
    }

    setAdding(true)
    try {
      const newConclusao = {
        funcionario_id: profile?.id,
        descricao: livreDesc,
        data: livreData,
        data_conclusao: livreData,
        status: livreStatus,
        criado_por: profile?.id,
      }
      // @ts-expect-error
      const { error: concError } = await supabase.from('tarefas_concluidas').insert(newConclusao)
      if (concError) throw concError

      toast({ title: 'Sucesso', description: 'Tarefa adicionada com sucesso' })
      setLivreModalOpen(false)
      setLivreDesc('')
      setLivreData(format(new Date(), 'yyyy-MM-dd'))
      setLivreStatus('pendente')
      fetchDados()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao adicionar tarefa', variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  const confirmDelete = (conclusaoId: string) => {
    setTaskToDelete(conclusaoId)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!taskToDelete) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('tarefas_concluidas').delete().eq('id', taskToDelete)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Tarefa deletada' })
      fetchDados()
      setDeleteConfirmOpen(false)
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao deletar tarefa', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const handleReadInformativo = async () => {
    if (!selectedInf) return
    setReadingInf(true)
    try {
      // @ts-expect-error
      const { error } = await supabase
        .from('informativos')
        .update({ lido: true })
        .eq('id', selectedInf.id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Informativo marcado como lido' })
      setSelectedInf(null)
      fetchDados()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao marcar como lido', variant: 'destructive' })
    } finally {
      setReadingInf(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {isManagerOrAdmin ? 'Desempenho da Equipe' : 'Meu Desempenho'}
        </h1>
        <div className="flex flex-wrap gap-3">
          {isManagerOrAdmin && (
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os funcionários</SelectItem>
                {funcionarios.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Minhas Tarefas</CardTitle>
              <CardDescription>Acompanhe suas atividades do período</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <RadioGroup
                value={dateFilter}
                onValueChange={(val: any) => setDateFilter(val)}
                className="flex space-x-2"
                disabled={loading}
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="ontem" id="ontem" />
                  <Label htmlFor="ontem" className="cursor-pointer">
                    Ontem
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="hoje" id="hoje" />
                  <Label htmlFor="hoje" className="cursor-pointer">
                    Hoje
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="amanha" id="amanha" />
                  <Label htmlFor="amanha" className="cursor-pointer">
                    Amanhã
                  </Label>
                </div>
              </RadioGroup>
              <Button onClick={() => setLivreModalOpen(true)} size="sm">
                Adicionar Tarefa Livre
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : tarefas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="rounded-full bg-muted p-3">
                  <span className="text-xl">📋</span>
                </div>
                <p className="text-muted-foreground">Nenhuma tarefa para este período</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Data</TableHead>
                      {isManagerOrAdmin && selectedUser === 'todos' && (
                        <TableHead>Responsável</TableHead>
                      )}
                      <TableHead>Quantidade/Meta</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[80px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tarefas.map((t) => {
                      const isConcluida = t.status === 'concluida'
                      const prio = t.prioridade ? PRIORITIES[t.prioridade] : null
                      const rowKey = t.isLivre ? t.conclusao_id! : t.id

                      return (
                        <TableRow key={rowKey}>
                          <TableCell className="font-medium min-w-[200px]">
                            <div className="flex items-start space-x-2">
                              {t.isLivre && (
                                <StickyNote className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                              )}
                              <div className="flex flex-col space-y-1">
                                <span>{t.titulo}</span>
                                {t.descricao && (
                                  <span className="text-xs text-muted-foreground line-clamp-2">
                                    {t.descricao}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(t.data + 'T00:00:00'), 'dd/MM/yyyy')}
                          </TableCell>
                          {isManagerOrAdmin && selectedUser === 'todos' && (
                            <TableCell>{t.responsavel?.name || '-'}</TableCell>
                          )}
                          <TableCell>{t.quantidade_meta}</TableCell>
                          <TableCell>
                            {prio ? (
                              <Badge variant="secondary" className={prio.color}>
                                {prio.label}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`task-${rowKey}`}
                                checked={isConcluida}
                                disabled={processing === rowKey}
                                onCheckedChange={() => toggleStatus(t)}
                              />
                              <label
                                htmlFor={`task-${rowKey}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {isConcluida ? 'Concluída' : 'Pendente'}
                              </label>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {t.isLivre ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => confirmDelete(t.conclusao_id!)}
                                disabled={processing === rowKey}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" disabled>
                                -
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informativos</CardTitle>
            <CardDescription>Comunicados e avisos importantes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : informativos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="rounded-full bg-muted p-3">
                  <span className="text-xl">📢</span>
                </div>
                <p className="text-muted-foreground">Nenhum informativo recebido</p>
              </div>
            ) : (
              <div className="space-y-4">
                {informativos.map((inf) => (
                  <div
                    key={inf.id}
                    onClick={() => setSelectedInf(inf)}
                    className="p-4 border rounded-xl bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h4 className="font-semibold text-sm leading-tight">{inf.titulo}</h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-md">
                        {format(new Date(inf.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {inf.mensagem}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={livreModalOpen} onOpenChange={setLivreModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Tarefa Livre</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva a tarefa detalhadamente..."
                value={livreDesc}
                onChange={(e) => setLivreDesc(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={livreData} onChange={(e) => setLivreData(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <RadioGroup
                value={livreStatus}
                onValueChange={setLivreStatus}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pendente" id="r1" />
                  <Label htmlFor="r1">Pendente</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="concluida" id="r2" />
                  <Label htmlFor="r2">Concluída</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLivreModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTarefaLivre} disabled={adding}>
              {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Deseja deletar esta tarefa livre? Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedInf} onOpenChange={(open) => !open && setSelectedInf(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedInf && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedInf.titulo}</DialogTitle>
                <DialogDescription>
                  Enviado em {format(new Date(selectedInf.created_at), 'dd/MM/yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedInf.mensagem}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInf(null)}
                  disabled={readingInf}
                >
                  Fechar
                </Button>
                <Button onClick={handleReadInformativo} disabled={readingInf}>
                  {readingInf && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Marcar como Lido
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
