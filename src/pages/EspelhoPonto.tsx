import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { ESPELHO_PONTO_DATA } from '@/lib/mock-data'

export default function EspelhoPonto() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Espelho de Ponto</h2>
          <p className="text-muted-foreground text-sm">
            Acompanhamento de registros de ponto individuais.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Maio 2026
          </Button>
          <Button size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      <Card className="animate-slide-up">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Registros de Maio</CardTitle>
          <CardDescription>Resumo de horas trabalhadas no período.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead>Entrada 1</TableHead>
                  <TableHead>Saída 1</TableHead>
                  <TableHead>Entrada 2</TableHead>
                  <TableHead>Saída 2</TableHead>
                  <TableHead>Total Hrs</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ESPELHO_PONTO_DATA.map((row, i) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell className="text-muted-foreground">{row.ent1}</TableCell>
                    <TableCell className="text-muted-foreground">{row.sai1}</TableCell>
                    <TableCell className="text-muted-foreground">{row.ent2}</TableCell>
                    <TableCell className="text-muted-foreground">{row.sai2}</TableCell>
                    <TableCell className="font-medium">{row.total}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${row.saldo.startsWith('+') && row.saldo !== '+00:00' ? 'text-emerald-600' : 'text-muted-foreground'}`}
                    >
                      {row.saldo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
