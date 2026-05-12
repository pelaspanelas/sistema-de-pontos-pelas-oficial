import { Users, Clock, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Line,
  LineChart,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import {
  DASHBOARD_METRICS,
  PRESENCA_SEMANA_DATA,
  EVOLUCAO_HORAS_EXTRAS_DATA,
} from '@/lib/mock-data'

export default function Index() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Visão Geral</h2>
        <p className="text-muted-foreground text-sm">Métricas operacionais do restaurante.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-slide-up" style={{ animationDelay: '0ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipe Hoje</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {DASHBOARD_METRICS.equipe.presentes}/{DASHBOARD_METRICS.equipe.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Colaboradores presentes</p>
          </CardContent>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atrasos</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{DASHBOARD_METRICS.atrasos}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados hoje</p>
          </CardContent>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horas Extras
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {DASHBOARD_METRICS.horasExtras}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total na semana</p>
          </CardContent>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Folgas</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{DASHBOARD_METRICS.folgas}</div>
            <p className="text-xs text-muted-foreground mt-1">Programadas para amanhã</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle>Presença na Semana</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ChartContainer
              config={{
                presentes: { label: 'Presentes', color: 'hsl(var(--chart-1))' },
                ausentes: { label: 'Ausentes / Folga', color: 'hsl(var(--chart-2))' },
              }}
              className="h-[300px] w-full"
            >
              <BarChart
                data={PRESENCA_SEMANA_DATA}
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <RechartsTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                />
                <Bar
                  dataKey="presentes"
                  fill="var(--color-presentes)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="ausentes"
                  fill="var(--color-ausentes)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-primary"></div> Presentes
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-muted-foreground"></div> Ausentes / Folga
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle>Evolução de Horas Extras</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ChartContainer
              config={{
                horas: { label: 'Horas Extras', color: 'hsl(var(--chart-3))' },
              }}
              className="h-[300px] w-full"
            >
              <LineChart
                data={EVOLUCAO_HORAS_EXTRAS_DATA}
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="semana"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="horas"
                  stroke="var(--color-horas)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
