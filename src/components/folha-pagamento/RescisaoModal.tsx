import { useState, useMemo } from 'react'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calculator, AlertTriangle, UserCheck, Calendar, Info } from 'lucide-react'

export interface ColaboradorRescisaoOption {
  id: string
  name: string
  role?: string | null
  base_salary?: number | null
  admission_date?: string | null
  entra_folha?: boolean
  status?: string | null
}

interface RescisaoModalProps {
  isOpen: boolean
  onClose: () => void
  colaboradores: ColaboradorRescisaoOption[]
}

type MotivoRescisao =
  | 'dispensa_sem_justa_causa'
  | 'pedido_demissao'
  | 'dispensa_com_justa_causa'
  | 'acordo_comum'
  | 'termino_contrato'

const MOTIVOS: { id: MotivoRescisao; label: string }[] = [
  { id: 'dispensa_sem_justa_causa', label: 'Dispensa sem justa causa (pela empresa)' },
  { id: 'pedido_demissao', label: 'Pedido de demissão (pelo colaborador)' },
  { id: 'dispensa_com_justa_causa', label: 'Dispensa com justa causa' },
  { id: 'acordo_comum', label: 'Acordo mútuo (art. 484-A CLT)' },
  { id: 'termino_contrato', label: 'Término de contrato de experiência / prazo' },
]

export function RescisaoModal({ isOpen, onClose, colaboradores }: RescisaoModalProps) {
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [dataDemissao, setDataDemissao] = useState(new Date().toISOString().split('T')[0])
  const [motivo, setMotivo] = useState<MotivoRescisao>('dispensa_sem_justa_causa')
  const [feriasVencidas, setFeriasVencidas] = useState(false)
  const [avisoPrevioIndenizado, setAvisoPrevioIndenizado] = useState(true)

  // Filtrar apenas os que têm entra_folha ativo
  const eligibleColaboradores = useMemo(() => {
    return colaboradores
      .filter((c) => c.entra_folha !== false)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [colaboradores])

  const selectedColaborador = useMemo(() => {
    return eligibleColaboradores.find((c) => c.id === selectedProfileId) || null
  }, [eligibleColaboradores, selectedProfileId])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  // Cálculo das verbas rescisórias
  const simulacao = useMemo(() => {
    if (!selectedColaborador || !selectedColaborador.admission_date || !dataDemissao) {
      return null
    }

    const salarioBase = Number(selectedColaborador.base_salary) || 0
    if (salarioBase <= 0) return null

    const dataAdmissao = new Date(selectedColaborador.admission_date + 'T00:00:00')
    const dataSaida = new Date(dataDemissao + 'T00:00:00')

    if (isNaN(dataAdmissao.getTime()) || isNaN(dataSaida.getTime()) || dataSaida < dataAdmissao) {
      return { error: 'Data de saída deve ser igual ou posterior à data de admissão.' }
    }

    // 1. Tempo de serviço
    const diffTime = Math.abs(dataSaida.getTime() - dataAdmissao.getTime())
    const diffDaysTotal = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const anosCompletos = Math.floor(diffDaysTotal / 365)
    const mesesTotaisTrabalhados = Math.max(1, Math.round(diffDaysTotal / 30.4375))

    // 2. Saldo de Salário
    // Dias trabalhados no mês de saída (dia do mês da saída)
    const diaSaida = dataSaida.getDate()
    // No direito trabalhista, base de 30 dias por mês
    const diasSaldoSalario = Math.min(30, diaSaida)
    const saldoSalario = (salarioBase / 30) * diasSaldoSalario

    // 3. Aviso Prévio Proporcional (Lei 12.506/2011)
    // 30 dias + 3 dias por ano completo de serviço, máx 90 dias
    let diasAvisoPrevio = 30 + Math.min(60, anosCompletos * 3)
    let valorAvisoPrevio = 0

    if (motivo === 'dispensa_sem_justa_causa' && avisoPrevioIndenizado) {
      valorAvisoPrevio = (salarioBase / 30) * diasAvisoPrevio
    } else if (motivo === 'acordo_comum' && avisoPrevioIndenizado) {
      // Acordo mútuo: aviso prévio indenizado pela metade (50%)
      valorAvisoPrevio = (salarioBase / 30) * diasAvisoPrevio * 0.5
    } else {
      // Pedido de demissão, justa causa ou término: empresa não indeniza aviso
      diasAvisoPrevio = 0
      valorAvisoPrevio = 0
    }

    // 4. 13º Salário Proporcional
    // Meses no ano corrente com 15 dias ou mais trabalhados
    // Projeção do aviso prévio indenizado na contagem:
    const dataFimAviso = new Date(dataSaida)
    if (valorAvisoPrevio > 0) {
      dataFimAviso.setDate(dataFimAviso.getDate() + diasAvisoPrevio)
    }

    // Se admitido no mesmo ano, conta a partir da admissão; senão a partir de 1º de Jan
    const inicioAnoCalculo =
      dataAdmissao.getFullYear() === dataSaida.getFullYear()
        ? dataAdmissao
        : new Date(dataSaida.getFullYear(), 0, 1)

    // Contagem de avos do 13º no ano
    let avos13 = 0
    const mesInicio13 = inicioAnoCalculo.getMonth()
    const mesFim13 = dataSaida.getMonth()

    for (let m = mesInicio13; m <= mesFim13; m++) {
      let diasNoMes = 30
      if (m === mesInicio13 && dataAdmissao.getFullYear() === dataSaida.getFullYear()) {
        const diasRestantesMes = 30 - dataAdmissao.getDate() + 1
        diasNoMes = diasRestantesMes
      }
      if (m === mesFim13) {
        diasNoMes = diaSaida
      }
      if (diasNoMes >= 15) {
        avos13++
      }
    }
    // Avos adicionais pela projeção do aviso indenizado
    let avos13Aviso = 0
    if (valorAvisoPrevio > 0) {
      const diasAvisoRestantes = dataFimAviso.getDate()
      if (dataFimAviso.getMonth() > dataSaida.getMonth() && diasAvisoRestantes >= 15) {
        avos13Aviso = 1
      }
    }
    const avos13Total = Math.min(12, avos13 + avos13Aviso)

    let valor13 = 0
    if (motivo !== 'dispensa_com_justa_causa') {
      valor13 = (salarioBase / 12) * avos13Total
    }

    // 5. Férias Proporcionais + 1/3
    // Período aquisitivo: do aniversário de admissão mais recente até a saída
    // Data do último aniversário de admissão
    const ultimoAniversario = new Date(
      dataSaida.getFullYear(),
      dataAdmissao.getMonth(),
      dataAdmissao.getDate(),
    )
    if (ultimoAniversario > dataSaida) {
      ultimoAniversario.setFullYear(ultimoAniversario.getFullYear() - 1)
    }

    const diffAquisitivoDias = Math.floor(
      (dataSaida.getTime() - ultimoAniversario.getTime()) / (1000 * 60 * 60 * 24),
    )
    let avosFerias = Math.floor(diffAquisitivoDias / 30)
    const restoDias = diffAquisitivoDias % 30
    if (restoDias >= 15) {
      avosFerias++
    }
    if (valorAvisoPrevio > 0 && avos13Aviso > 0) {
      avosFerias++
    }
    const avosFeriasTotal = Math.min(12, Math.max(1, avosFerias))

    let feriasProporcionais = 0
    let tercoFeriasProporcionais = 0
    if (motivo !== 'dispensa_com_justa_causa') {
      feriasProporcionais = (salarioBase / 12) * avosFeriasTotal
      tercoFeriasProporcionais = feriasProporcionais / 3
    }

    // 6. Férias Vencidas + 1/3 (se houver período aquisitivo anterior não gozado)
    let valorFeriasVencidas = 0
    let tercoFeriasVencidas = 0
    if (feriasVencidas && motivo !== 'dispensa_com_justa_causa') {
      valorFeriasVencidas = salarioBase
      tercoFeriasVencidas = salarioBase / 3
    }

    // 7. Multa FGTS (40% ou 20% no acordo mútuo)
    // Estimativa dos depósitos: 8% do salário sobre o número total de meses trabalhados
    const fgtsSaldoEstimado = salarioBase * 0.08 * mesesTotaisTrabalhados
    let aliquotaMulta = 0
    let multaFgts = 0

    if (motivo === 'dispensa_sem_justa_causa') {
      aliquotaMulta = 0.4 // 40%
      multaFgts = fgtsSaldoEstimado * 0.4
    } else if (motivo === 'acordo_comum') {
      aliquotaMulta = 0.2 // 20%
      multaFgts = fgtsSaldoEstimado * 0.2
    }

    // Total Geral Bruto Rescisório
    const totalGeral =
      saldoSalario +
      valorAvisoPrevio +
      valor13 +
      feriasProporcionais +
      tercoFeriasProporcionais +
      valorFeriasVencidas +
      tercoFeriasVencidas +
      multaFgts

    return {
      salarioBase,
      anosCompletos,
      diasSaldoSalario,
      saldoSalario,
      diasAvisoPrevio,
      valorAvisoPrevio,
      avos13Total,
      valor13,
      avosFeriasTotal,
      feriasProporcionais,
      tercoFeriasProporcionais,
      valorFeriasVencidas,
      tercoFeriasVencidas,
      fgtsSaldoEstimado,
      aliquotaMulta,
      multaFgts,
      totalGeral,
      mesesTotaisTrabalhados,
    }
  }, [selectedColaborador, dataDemissao, motivo, feriasVencidas, avisoPrevioIndenizado])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Simular Rescisão Trabalhista</DialogTitle>
              <DialogDescription>
                Estimativa dos valores rescisórios com base nas regras CLT e tempo de serviço
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Aviso de simulação */}
        <div className="flex items-start gap-2.5 p-3 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-md">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Atenção:</strong> Este cálculo é uma <em>simulação estimada</em> baseada nas
            regras gerais da CLT e dados cadastrais. Não substitui o TRCT homologado e não considera
            eventuais descontos específicos de INSS/IRRF ou cláusulas de acordo coletivo da
            categoria.
          </div>
        </div>

        {/* Parâmetros da Simulação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-muted/40 rounded-lg border">
          <div className="space-y-1 md:col-span-1">
            <Label htmlFor="rescisao-colaborador" className="text-xs">
              Colaborador
            </Label>
            <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
              <SelectTrigger id="rescisao-colaborador">
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
            <Label htmlFor="data-demissao" className="text-xs">
              Data de Saída / Dispensa
            </Label>
            <Input
              id="data-demissao"
              type="date"
              value={dataDemissao}
              onChange={(e) => setDataDemissao(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="motivo-rescisao" className="text-xs">
              Motivo da Rescisão
            </Label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoRescisao)}>
              <SelectTrigger id="motivo-rescisao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedColaborador && (
            <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  Admissão:{' '}
                  <strong className="text-foreground">
                    {selectedColaborador.admission_date
                      ? new Date(
                          selectedColaborador.admission_date + 'T00:00:00',
                        ).toLocaleDateString('pt-BR')
                      : 'Não cadastrada'}
                  </strong>
                </span>
                <span>
                  Salário Base:{' '}
                  <strong className="text-foreground">
                    {formatCurrency(selectedColaborador.base_salary || 0)}
                  </strong>
                </span>
                <span>
                  Cargo:{' '}
                  <strong className="text-foreground">{selectedColaborador.role || 'Geral'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                    checked={feriasVencidas}
                    onChange={(e) => setFeriasVencidas(e.target.checked)}
                  />
                  <span>Possui 1 período de férias vencidas?</span>
                </label>
                {(motivo === 'dispensa_sem_justa_causa' || motivo === 'acordo_comum') && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                      checked={avisoPrevioIndenizado}
                      onChange={(e) => setAvisoPrevioIndenizado(e.target.checked)}
                    />
                    <span>Aviso prévio indenizado</span>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Exibição dos Resultados */}
        <div className="flex-1 overflow-auto border rounded-lg p-4 space-y-4">
          {!selectedColaborador ? (
            <div className="flex flex-col items-center justify-center p-10 text-muted-foreground text-center">
              <UserCheck className="h-10 w-10 opacity-30 mb-2" />
              <p className="text-sm font-medium">
                Selecione um colaborador acima para simular a rescisão.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Serão calculados saldo de salário, 13º, férias, aviso prévio e multa de FGTS.
              </p>
            </div>
          ) : !simulacao ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              Colaborador sem salário base cadastrado ou datas inválidas.
            </div>
          ) : 'error' in simulacao ? (
            <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-md border border-rose-200">
              {simulacao.error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-muted/40 p-2.5 rounded border text-center">
                  <span className="text-[11px] text-muted-foreground block">Tempo de Empresa</span>
                  <strong className="text-sm">
                    {simulacao.anosCompletos} {simulacao.anosCompletos === 1 ? 'ano' : 'anos'} (
                    {simulacao.mesesTotaisTrabalhados} meses)
                  </strong>
                </div>
                <div className="bg-muted/40 p-2.5 rounded border text-center">
                  <span className="text-[11px] text-muted-foreground block">Dias de Aviso</span>
                  <strong className="text-sm">
                    {simulacao.diasAvisoPrevio > 0
                      ? `${simulacao.diasAvisoPrevio} dias`
                      : 'Não indenizado'}
                  </strong>
                </div>
                <div className="bg-muted/40 p-2.5 rounded border text-center">
                  <span className="text-[11px] text-muted-foreground block">Avos 13º</span>
                  <strong className="text-sm">{simulacao.avos13Total}/12</strong>
                </div>
                <div className="bg-muted/40 p-2.5 rounded border text-center">
                  <span className="text-[11px] text-muted-foreground block">Avos Férias</span>
                  <strong className="text-sm">{simulacao.avosFeriasTotal}/12</strong>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detalhamento de Verbas Rescisórias
                </h4>

                <div className="divide-y border rounded-lg bg-card">
                  {/* Saldo de Salário */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <div className="font-medium">Saldo de Salário</div>
                      <div className="text-xs text-muted-foreground">
                        {simulacao.diasSaldoSalario} dias trabalhados no mês da saída
                      </div>
                    </div>
                    <span className="font-semibold">{formatCurrency(simulacao.saldoSalario)}</span>
                  </div>

                  {/* Aviso Prévio */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <div className="font-medium">Aviso Prévio Indenizado</div>
                      <div className="text-xs text-muted-foreground">
                        {simulacao.valorAvisoPrevio > 0
                          ? `${simulacao.diasAvisoPrevio} dias conforme Lei 12.506 (30 + 3/ano)`
                          : 'Sem aviso indenizado pela empresa'}
                      </div>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(simulacao.valorAvisoPrevio)}
                    </span>
                  </div>

                  {/* 13º Proporcional */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <div className="font-medium">13º Salário Proporcional</div>
                      <div className="text-xs text-muted-foreground">
                        {simulacao.avos13Total}/12 avos no ano
                      </div>
                    </div>
                    <span className="font-semibold">{formatCurrency(simulacao.valor13)}</span>
                  </div>

                  {/* Férias Proporcionais */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <div className="font-medium">Férias Proporcionais</div>
                      <div className="text-xs text-muted-foreground">
                        {simulacao.avosFeriasTotal}/12 avos do período aquisitivo
                      </div>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(simulacao.feriasProporcionais)}
                    </span>
                  </div>

                  {/* 1/3 Constitucional de Férias Proporcionais */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <div className="font-medium">
                        1/3 Constitucional sobre Férias Proporcionais
                      </div>
                      <div className="text-xs text-muted-foreground">Terço constitucional</div>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(simulacao.tercoFeriasProporcionais)}
                    </span>
                  </div>

                  {/* Férias Vencidas + 1/3 se houver */}
                  {feriasVencidas && (
                    <>
                      <div className="flex items-center justify-between p-3 text-sm bg-muted/20">
                        <div>
                          <div className="font-medium">Férias Vencidas (Simples)</div>
                          <div className="text-xs text-muted-foreground">1 período integral</div>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(simulacao.valorFeriasVencidas)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 text-sm bg-muted/20">
                        <div>
                          <div className="font-medium">
                            1/3 Constitucional sobre Férias Vencidas
                          </div>
                          <div className="text-xs text-muted-foreground">Terço constitucional</div>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(simulacao.tercoFeriasVencidas)}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Multa Rescisória de FGTS */}
                  <div className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        Multa Rescisória de FGTS
                        {simulacao.aliquotaMulta > 0 && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {(simulacao.aliquotaMulta * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {simulacao.aliquotaMulta > 0
                          ? `Sobre base estimada de R$ ${simulacao.fgtsSaldoEstimado.toFixed(2)} (8% x ${simulacao.mesesTotaisTrabalhados} meses)`
                          : 'Não aplicável para este motivo de rescisão'}
                      </div>
                    </div>
                    <span className="font-semibold">{formatCurrency(simulacao.multaFgts)}</span>
                  </div>
                </div>
              </div>

              {/* Total Geral da Simulação */}
              <Card className="bg-primary/5 border-primary/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium uppercase text-muted-foreground block">
                      Total Bruto Estimado da Rescisão
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Soma de todas as verbas rescisórias acima calculadas
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(simulacao.totalGeral)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
