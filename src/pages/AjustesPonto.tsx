import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Check, X, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getPendingAjustes, approveAjuste, rejectAjuste } from '@/services/ajustes'

const TIPO_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  saida_almoco: 'Saída Almoço',
  retorno_almoco: 'Retorno Almoço',
  saida: 'Saída',
}

export default function AjustesPonto() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [ajustes, setAjustes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const { data, error } = await getPendingAjustes()
      if (error) throw error
      setAjustes(data || [])
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar ajustes',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = async (ajuste: any) => {
    if (!user) return
    setProcessing(ajuste.id)
    try {
      await approveAjuste(ajuste, user.id)
      toast({
        title: 'Ajuste aprovado com sucesso',
        className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      })
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao aprovar ajuste',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (ajuste: any) => {
    if (!user) return
    setProcessing(ajuste.id)
    try {
      await rejectAjuste(ajuste, user.id)
      toast({
        title: 'Ajuste reprovado',
        className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      })
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao reprovar ajuste',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Ajustes de Ponto</h2>
        <p className="text-muted-foreground text-sm">
          Aprove ou reprova solicitações de ajuste de ponto dos colaboradores.
        </p>
      </div>

      <Card className="animate-slide-up">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Solicitações Pendentes</CardTitle>
          <CardDescription>
            {ajustes.length} solicitação(ões) aguardando processamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : ajustes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma solicitação pendente.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Horário Solicitado</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ajustes.map((ajuste) => (
                    <TableRow key={ajuste.id}>
                      <TableCell className="font-medium">{ajuste.usuario?.name || 'N/I'}</TableCell>
                      <TableCell>{format(parseISO(ajuste.data_ponto), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{TIPO_LABELS[ajuste.tipo_ponto] || ajuste.tipo_ponto}</TableCell>
                      <TableCell className="font-mono">{ajuste.horario_solicitado}</TableCell>
                      <TableCell className="max-w-xs truncate" title={ajuste.motivo}>
                        {ajuste.motivo}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleApprove(ajuste)}
                            disabled={processing === ajuste.id}
                          >
                            {processing === ajuste.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(ajuste)}
                            disabled={processing === ajuste.id}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reprovar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
