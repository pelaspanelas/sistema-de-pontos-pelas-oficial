import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Info } from 'lucide-react'

export interface DetailItemBreakdown {
  id: string
  description: string
  amount: number
  type?: string
  category?: 'credito' | 'debito'
}

export interface EmployeeFinancialDetail {
  profileId: string
  name: string
  role?: string
  total: number
  items?: DetailItemBreakdown[]
}

export interface CardFinancialDetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  monthName: string
  year: string | number
  totalSum: number
  colorClass?: string
  emptyMessage?: string
  data: EmployeeFinancialDetail[]
  icon?: React.ReactNode
}

export function FinancialBreakdownModal({
  isOpen,
  onClose,
  title,
  subtitle,
  monthName,
  year,
  totalSum,
  colorClass = 'text-primary',
  emptyMessage = 'Nenhum valor encontrado para este detalhamento no período selecionado.',
  data,
  icon,
}: CardFinancialDetailModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.role && item.role.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const hasSubItems = data.some((item) => item.items && item.items.length > 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 rounded-lg bg-muted/60">{icon}</div>}
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center justify-between">
                <span>{title}</span>
                <span className={`text-xl font-bold ${colorClass}`}>
                  {formatCurrency(totalSum)}
                </span>
              </DialogTitle>
              <DialogDescription className="mt-1">
                {subtitle || `Detalhamento individual da competência de ${monthName} de ${year}.`}
              </DialogDescription>
            </div>
          </div>

          <div className="pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por colaborador ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {filteredData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Info className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">{emptyMessage}</p>
              {searchTerm && (
                <p className="text-xs text-muted-foreground">
                  Nenhum colaborador corresponde à busca "{searchTerm}".
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Colaborador</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.profileId} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="py-3">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{item.name}</p>
                          {item.role && (
                            <p className="text-xs text-muted-foreground">{item.role}</p>
                          )}
                        </div>
                        {item.items && item.items.length > 0 && (
                          <div className="mt-2 space-y-1 pl-2 border-l-2 border-muted-foreground/20">
                            {item.items.map((sub, idx) => (
                              <div
                                key={sub.id || idx}
                                className="flex items-center justify-between text-xs text-muted-foreground pr-2"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span>•</span>
                                  <span>{sub.description}</span>
                                  {sub.type && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1 py-0 h-4 font-normal uppercase"
                                    >
                                      {sub.type.replace('_', ' ')}
                                    </Badge>
                                  )}
                                </span>
                                <span
                                  className={`font-medium ${
                                    sub.category === 'debito'
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {sub.category === 'debito' ? '-' : '+'}
                                  {formatCurrency(sub.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top py-3">
                        <span className={`text-base font-bold ${colorClass}`}>
                          {formatCurrency(item.total)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/30 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filteredData.length} colaborador{filteredData.length !== 1 ? 'es' : ''}{' '}
            {searchTerm ? 'encontrado(s)' : 'listado(s)'}
          </span>
          <div className="flex items-center gap-2">
            <span>Total:</span>
            <span className={`font-bold text-sm ${colorClass}`}>
              {formatCurrency(filteredData.reduce((acc, curr) => acc + curr.total, 0))}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
