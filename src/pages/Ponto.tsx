import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Ponto() {
  const [time, setTime] = useState(new Date())
  const [isInsideGeofence, setIsInsideGeofence] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    // Simulate geofence check delay
    const geoTimer = setTimeout(() => setIsInsideGeofence(false), 1500)

    return () => {
      clearInterval(timer)
      clearTimeout(geoTimer)
    }
  }, [])

  const handlePonto = () => {
    setIsCheckingIn(true)
    setTimeout(() => {
      setIsCheckingIn(false)
      toast({
        title: 'Ponto Registrado!',
        description: `Entrada registrada com sucesso às ${format(time, 'HH:mm')}`,
        className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      })
    }, 1000)
  }

  const dateFormatted = format(time, "EEEE, dd 'de' MMMM", { locale: ptBR })
  const timeFormatted = format(time, 'HH:mm:ss')

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6 animate-fade-in-up">
        <Card className="border-border shadow-sm overflow-hidden">
          <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground font-medium capitalize">{dateFormatted}</p>
              <h1
                className="text-6xl md:text-8xl font-bold tracking-tighter text-primary animate-pulse"
                style={{ animationDuration: '2s' }}
              >
                {timeFormatted}
              </h1>
            </div>

            <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted/50 border text-sm text-muted-foreground gap-2 font-medium">
              <Clock className="w-4 h-4" />
              Status: Nenhum
            </div>
          </CardContent>
        </Card>

        {!isInsideGeofence && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg text-sm font-medium animate-fade-in">
            <MapPin className="h-5 w-5 text-orange-500 shrink-0" />
            <p>Você não está no restaurante. Aproxime-se para registrar o ponto.</p>
          </div>
        )}

        <Button
          size="lg"
          className="w-full h-16 text-lg rounded-xl shadow-elevation hover:-translate-y-1 transition-all duration-200"
          onClick={handlePonto}
          disabled={!isInsideGeofence || isCheckingIn}
        >
          {isCheckingIn ? 'Registrando...' : 'Registrar Entrada'}
        </Button>

        {/* Debug button just to test functionality since geofence is mocked to false */}
        {!isInsideGeofence && (
          <button
            onClick={() => setIsInsideGeofence(true)}
            className="text-xs text-muted-foreground underline w-full text-center mt-2 hover:text-foreground"
          >
            [Dev] Simular entrada na área do restaurante
          </button>
        )}
      </div>
    </div>
  )
}
