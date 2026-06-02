import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { differenceInDays, differenceInYears, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plane,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Search,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FeriasRow {
  id: string
  profile_id: string
  data_inicio: string
  data_fim: string
  status: string
  observacoes: string | null
}

interface UserData {
  id: string
  name: string
  admission_date: string | null
  created_at: string
}

export default function Ferias() {
  const { profile } = useAuth()
  const { toast } = useToast()

  const isManagerOrAdmin = profile?.access_level === 'total' || profile?.access_level === 'gerencia'

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<string>(profile?.id || '')
  const [allFerias, setAllFerias] = useState<FeriasRow[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<FeriasRow>>({})

  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isManagerOrAdmin) {
      fetchAllData()
    } else {
      fetchMyData(profile?.id || '')
    }
  }, [isManagerOrAdmin])

  async function fetchAllData() {
    setLoading(true)
    try {
      const { data: usersData, error: errUsers } = await supabase
        .from('profiles')
        .select('id, name, admission_date, created_at')
        .eq('status', 'Ativo')
        .order('name')
      if (errUsers) throw errUsers

      const { data: feriasData, error: errFerias } = await supabase
        .from('ferias')
        .select('*')
        .order('data_inicio', { ascending: false })
      if (errFerias) throw errFerias

      setUsers(usersData || [])
      setAllFerias(feriasData || [])

      if (!selectedUser && usersData && usersData.length > 0) {
        setSelectedUser(usersData[0].id)
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar dados', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function fetchMyData(userId: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ferias')
        .select('*')
        .eq('profile_id', userId)
        .order('data_inicio', { ascending: false })
      if (error) throw error
      setAllFerias(data || [])
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar férias', description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const userProfile = isManagerOrAdmin
    ? users.find((u) => u.id === selectedUser)
    : ({
        id: profile?.id,
        name: profile?.name,
        admission_date: profile?.admission_date,
        created_at: profile?.created_at,
      } as UserData)

  const feriasUsuario = useMemo(() => {
    return allFerias.filter((f) => f.profile_id === userProfile?.id)
  }, [allFerias, userProfile])

  const balance = useMemo(() => {
    if (!userProfile) return { earned: 0, taken: 0, balance: 0 }

    const admission = userProfile.admission_date
      ? parseISO(userProfile.admission_date)
      : parseISO(userProfile.created_at || new Date().toISOString())
    const years = differenceInYears(new Date(), admission)
    const earned = Math.max(0, years * 30)

    const taken = feriasUsuario
      .filter((f) => f.status === 'concluida' || f.status === 'agendada')
      .reduce((acc, f) => {
        const days = differenceInDays(parseISO(f.data_fim), parseISO(f.data_inicio)) + 1
        return acc + days
      }, 0)

    return { earned, taken, balance: earned - taken }
  }, [feriasUsuario, userProfile])

  const reportData = useMemo(() => {
    if (!users.length) return []
    return users
      .map((u) => {
        const admission = u.admission_date
          ? parseISO(u.admission_date)
          : parseISO(u.created_at || new Date().toISOString())
        const years = differenceInYears(new Date(), admission)
        const earned = Math.max(0, years * 30)

        const userF = allFerias.filter(
          (f) => f.profile_id === u.id && (f.status === 'concluida' || f.status === 'agendada'),
        )
        const taken = userF.reduce((acc, f) => {
          const days = differenceInDays(parseISO(f.data_fim), parseISO(f.data_inicio)) + 1
          return acc + days
        }, 0)

        return {
          user: u,
          earned,
          taken,
          balance: earned - taken,
          years,
          admission_date: u.admission_date || u.created_at,
        }
      })
      .filter((item) => item.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [users, allFerias, searchTerm])

  const openModal = (record?: FeriasRow) => {
    if (record) {
      setFormData(record)
    } else {
      setFormData({
        profile_id: selectedUser,
        status: 'agendada',
        data_inicio: '',
        data_fim: '',
        observacoes: '',
      })
    }
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return
    try {
      const { error } = await supabase.from('ferias').delete().eq('id', id)
      if (error) throw error
      toast({ title: 'Sucesso', description: 'Registro excluído.' })
      if (isManagerOrAdmin) fetchAllData()
      else fetchMyData(profile?.id || '')
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.data_inicio || !formData.data_fim) {
      return toast({ variant: 'destructive', title: 'Preencha as datas' })
    }
    if (parseISO(formData.data_inicio) > parseISO(formData.data_fim)) {
      return toast({
        variant: 'destructive',
        title: 'Data final deve ser maior ou igual à inicial',
      })
    }

    setIsSubmitting(true)
    try {
      if (formData.id) {
        const { error } = await supabase
          .from('ferias')
          .update({
            data_inicio: formData.data_inicio,
            data_fim: formData.data_fim,
            status: formData.status,
            observacoes: formData.observacoes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id)
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Férias atualizadas.' })
      } else {
        const { error } = await supabase.from('ferias').insert({
          profile_id: formData.profile_id,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim,
          status: formData.status,
          observacoes: formData.observacoes,
        })
        if (error) throw error
        toast({ title: 'Sucesso', description: 'Férias agendadas.' })
      }
      setModalOpen(false)
      if (isManagerOrAdmin) fetchAllData()
      else fetchMyData(profile?.id || '')
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusColors: Record<string, string> = {
    agendada: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    concluida: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    cancelada: 'bg-muted text-muted-foreground hover:bg-muted',
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Gestão de Férias</h2>
          <p className="text-muted-foreground text-sm">Acompanhamento de saldo e agendamentos.</p>
        </div>
      </div>

      <Tabs defaultValue="agendamentos" className="w-full">
        {isManagerOrAdmin && (
          <TabsList className="mb-6 bg-muted/50 border">
            <TabsTrigger value="agendamentos" className="data-[state=active]:bg-background">
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="relatorio" className="data-[state=active]:bg-background">
              Relatório de Saldos
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="agendamentos" className="space-y-6 m-0">
          {isManagerOrAdmin && (
            <div className="flex justify-end gap-2 w-full sm:w-auto">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full sm:w-[250px] bg-background">
                  <SelectValue placeholder="Selecionar Colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => openModal()} className="gap-2 shrink-0">
                <Plus className="w-4 h-4" /> Agendar
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Dias de Direito</p>
                  <p className="text-3xl font-bold tracking-tighter text-primary">
                    {balance.earned}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Dias Usufruídos</p>
                  <p className="text-3xl font-bold tracking-tighter text-blue-600">
                    {balance.taken}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className={balance.balance > 30 ? 'border-orange-200 bg-orange-50/50' : ''}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Saldo Disponível</p>
                  <p
                    className={`text-3xl font-bold tracking-tighter ${balance.balance > 30 ? 'text-orange-600' : 'text-emerald-600'}`}
                  >
                    {balance.balance}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${balance.balance > 30 ? 'bg-orange-100' : 'bg-emerald-50'}`}
                >
                  {balance.balance > 30 ? (
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  ) : (
                    <Plane className="h-6 w-6 text-emerald-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico e Agendamentos</CardTitle>
              <CardDescription>
                {userProfile?.name
                  ? `Registros de ${userProfile.name}`
                  : 'Seus registros de férias'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : feriasUsuario.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-muted/20">
                  <Plane className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum registro encontrado.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Observações</TableHead>
                        {isManagerOrAdmin && <TableHead className="w-[100px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feriasUsuario.map((f) => {
                        const days =
                          differenceInDays(parseISO(f.data_fim), parseISO(f.data_inicio)) + 1
                        return (
                          <TableRow key={f.id}>
                            <TableCell className="font-medium">
                              {format(parseISO(f.data_inicio), 'dd/MM/yyyy')} até{' '}
                              {format(parseISO(f.data_fim), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell>{days} dias</TableCell>
                            <TableCell>
                              <Badge className={`capitalize ${statusColors[f.status] || ''}`}>
                                {f.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {f.observacoes || '-'}
                            </TableCell>
                            {isManagerOrAdmin && (
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => openModal(f)}>
                                    <Pencil className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(f.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive/70 hover:text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isManagerOrAdmin && (
          <TabsContent value="relatorio" className="space-y-6 m-0">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Saldo de Férias da Equipe</CardTitle>
                  <CardDescription>
                    Visão geral de direitos e saldos de todos os colaboradores ativos.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar colaborador..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="text-center py-10 border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Nenhum colaborador encontrado.</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Colaborador</TableHead>
                          <TableHead>Admissão</TableHead>
                          <TableHead className="text-right">Anos Trabalhados</TableHead>
                          <TableHead className="text-right">Dias de Direito</TableHead>
                          <TableHead className="text-right">Dias Usufruídos</TableHead>
                          <TableHead className="text-right">Saldo Atual</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((row) => (
                          <TableRow key={row.user.id}>
                            <TableCell className="font-medium">{row.user.name}</TableCell>
                            <TableCell>
                              {format(parseISO(row.admission_date), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="text-right">{row.years}</TableCell>
                            <TableCell className="text-right">{row.earned}</TableCell>
                            <TableCell className="text-right">{row.taken}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {row.balance > 30 ? (
                                <span className="text-orange-600 flex items-center justify-end gap-1">
                                  <AlertCircle className="w-4 h-4" /> {row.balance}
                                </span>
                              ) : (
                                <span className="text-emerald-600">{row.balance}</span>
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
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Editar Férias' : 'Agendar Férias'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={formData.data_inicio || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, data_inicio: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={formData.data_fim || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, data_fim: e.target.value }))}
                  required
                />
              </div>
            </div>

            {formData.data_inicio && formData.data_fim && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                Total:{' '}
                <span className="font-semibold text-foreground">
                  {differenceInDays(parseISO(formData.data_fim), parseISO(formData.data_inicio)) +
                    1}
                </span>{' '}
                dias.
              </div>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status || 'agendada'}
                onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Detalhes opcionais..."
                value={formData.observacoes || ''}
                onChange={(e) => setFormData((p) => ({ ...p, observacoes: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
