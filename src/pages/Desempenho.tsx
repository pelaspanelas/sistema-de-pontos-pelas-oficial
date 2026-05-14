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
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

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
  tarefa_id: string
  status: string
}

type Informativo = {
  id: string
  titulo: string
  mensagem: string
  created_at: string
  destinatarios: string[] | null
}

type Employee = {
  id: string
  name: string
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

  const [funcionarios, setFuncionarios] = useState<Employee[]>([])
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [concluidas, setConcluidas] = useState<Conclusao[]>([])
  const [informativos, setInformativos] = useState<Informativo[]>([])

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const [livreModalOpen, setLivreModalOpen] = useState(false)
  const [livreDesc, setLivreDesc] = useState('')
  const [adding, setAdding] = useState(false)

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

  const fetchDados = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const [yearStr, monthStr] = month.split('-')
      const startDate = new Date(Number(yearStr), Number(monthStr) - 1, 1)
      const endDate = new Date(Number(yearStr), Number(monthStr), 0)

      let query = supabase
        .from('tarefas')
        .select('*, responsavel:profiles!tarefas_responsavel_id_fkey(id, name)')
        .gte('data', format(startDate, 'yyyy-MM-dd'))
        .lte('data', format(endDate, 'yyyy-MM-dd'))
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
        const { data: cData, error: cError } = await supabase
          .from('tarefas_concluidas')
          .select('id, tarefa_id, status')
          .in('tarefa_id', taskIds)
        if (cError) throw cError
        concluidasData = cData
      }

      const { data: informativosData, error: informativosError } = await supabase
        .from('informativos')
        .select('*')
        .order('created_at', { ascending: false })
      if (informativosError) throw informativosError

      setTarefas(tarefasData || [])
      setConcluidas(concluidasData || [])

      const filteredInformativos = informativosData.filter((inf) => {
        if (!inf.destinatarios || inf.destinatarios.length === 0) return true
        if (!isManagerOrAdmin) {
          return inf.destinatarios.includes(profile.id)
        }
        if (selectedUser !== 'todos') {
          return inf.destinatarios.includes(selectedUser)
        }
        return true
      })
      setInformativos(filteredInformativos || [])
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao buscar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [month, selectedUser, profile?.id])

  const toggleStatus = async (tarefa: Tarefa) => {
    setProcessing(tarefa.id)
    const existing = concluidas.find((c) => c.tarefa_id === tarefa.id)
    const newStatus = existing?.status === 'concluida' ? 'pendente' : 'concluida'

    try {
      if (existing) {
        const { error } = await supabase
          .from('tarefas_concluidas')
          .update({ status: newStatus })
          .eq('id', existing.id)
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
    if (!livreDesc.trim()) return
    setAdding(true)
    try {
      const titulo = livreDesc.split('\n')[0].slice(0, 100) || 'Tarefa Livre'
      const newTarefa = {
        titulo,
        descricao: livreDesc,
        data: format(new Date(), 'yyyy-MM-dd'),
        responsavel_id: profile?.id,
        quantidade_meta: '1',
        prioridade: 1,
        tipo_repeticao: 'nenhuma',
      }

      const { data: taskData, error: taskError } = await supabase
        .from('tarefas')
        .insert(newTarefa)
        .select()
        .single()
      if (taskError) throw taskError

      const newConclusao = {
        tarefa_id: taskData.id,
        funcionario_id: profile?.id,
        data_conclusao: format(new Date(), 'yyyy-MM-dd'),
        status: 'pendente',
      }
      const { error: concError } = await supabase.from('tarefas_concluidas').insert(newConclusao)
      if (concError) throw concError

      toast({ title: 'Sucesso', description: 'Tarefa adicionada com sucesso' })
      setLivreModalOpen(false)
      setLivreDesc('')
      fetchDados()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao adicionar tarefa', variant: 'destructive' })
    } finally {
      setAdding(false)
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
              <CardDescription>Acompanhe suas atividades do mês</CardDescription>
            </div>
            <Button onClick={() => setLivreModalOpen(true)} size="sm">
              Adicionar Tarefa Livre
            </Button>
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
                <p className="text-muted-foreground">Nenhuma tarefa para este mês</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarefa</TableHead>
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
                      const isConcluida = concluidas.some(
                        (c) => c.tarefa_id === t.id && c.status === 'concluida',
                      )
                      const prio = PRIORITIES[t.prioridade] || PRIORITIES[1]
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium min-w-[200px]">
                            <div className="flex flex-col space-y-1">
                              <span>{t.titulo}</span>
                              {t.descricao && (
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                  {t.descricao}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          {isManagerOrAdmin && selectedUser === 'todos' && (
                            <TableCell>{t.responsavel?.name || '-'}</TableCell>
                          )}
                          <TableCell>{t.quantidade_meta}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={prio.color}>
                              {prio.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`task-${t.id}`}
                                checked={isConcluida}
                                disabled={processing === t.id}
                                onCheckedChange={() => toggleStatus(t)}
                              />
                              <label
                                htmlFor={`task-${t.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {isConcluida ? 'Concluída' : 'Pendente'}
                              </label>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" disabled>
                              -
                            </Button>
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
                    className="p-4 border rounded-xl bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h4 className="font-semibold text-sm leading-tight">{inf.titulo}</h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-md">
                        {format(new Date(inf.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
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
          <div className="py-4">
            <Textarea
              placeholder="Descreva a tarefa detalhadamente..."
              value={livreDesc}
              onChange={(e) => setLivreDesc(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLivreModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTarefaLivre} disabled={!livreDesc.trim() || adding}>
              {adding ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
