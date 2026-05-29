import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Feriado {
  id: string
  nome: string
  data: string
}

export default function Feriados() {
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome: '', data: '' })
  const { toast } = useToast()

  useEffect(() => {
    fetchFeriados()
  }, [])

  async function fetchFeriados() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('feriados' as any)
        .select('*')
        .order('data', { ascending: true })

      if (error) throw error
      setFeriados(data || [])
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('feriados' as any).insert({
        nome: form.nome,
        data: form.data,
      })
      if (error) throw error
      toast({ title: 'Feriado adicionado com sucesso!' })
      setIsOpen(false)
      setForm({ nome: '', data: '' })
      fetchFeriados()
    } catch (err: any) {
      toast({ title: 'Erro ao adicionar', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja remover este feriado?')) return
    try {
      const { error } = await supabase
        .from('feriados' as any)
        .delete()
        .eq('id', id)
      if (error) throw error
      toast({ title: 'Feriado removido.' })
      fetchFeriados()
    } catch (err: any) {
      toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Feriados</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie os feriados que impactam o cálculo de horas e VT.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Feriado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Feriado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome do Feriado</Label>
                <Input
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Natal"
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  required
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : feriados.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto opacity-20 mb-4" />
              Nenhum feriado cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feriados.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(f.data), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{f.nome}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
