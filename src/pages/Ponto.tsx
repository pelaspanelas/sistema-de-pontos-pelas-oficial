import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Camera, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/hooks/use-auth'
import { registrarPonto, fetchPontoDiario } from '@/services/ponto'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const RESTAURANT_COORDS = { lat: -23.684373976093497, lon: -46.552994816658426 }
const MAX_RADIUS = 50

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

type PontoStep = 'loading' | 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida' | 'concluido'

interface CameraCaptureProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapture: (blob: Blob) => void
}

function CameraCapture({ open, onOpenChange, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState('')

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      setError(
        'Não foi possível acessar a câmera. Você pode fazer o upload de uma foto clicando no botão abaixo.',
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [open, startCamera, stopCamera])

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth || 640
      canvas.height = videoRef.current.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              onCapture(blob)
              stopCamera()
              onOpenChange(false)
            }
          },
          'image/jpeg',
          0.8,
        )
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tirar Foto</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          {error ? (
            <div className="text-destructive text-sm text-center p-4 bg-destructive/10 rounded-md flex flex-col items-center">
              <p className="mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Escolher Arquivo / Tirar Foto
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onCapture(e.target.files[0])
                    stopCamera()
                    onOpenChange(false)
                  }
                }}
              />
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <Button onClick={handleCapture} size="lg" className="w-full max-w-sm gap-2">
                <Camera className="w-5 h-5" />
                Capturar Foto
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function Ponto() {
  const [time, setTime] = useState(new Date())
  const [isInsideGeofence, setIsInsideGeofence] = useState(false)
  const [distanceMsg, setDistanceMsg] = useState('Verificando localização...')
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [step, setStep] = useState<PontoStep>('loading')
  const [showCamera, setShowCamera] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)

  const { toast } = useToast()
  const { user } = useAuth()

  const loadPontoStatus = async () => {
    if (!user) return
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { record } = await fetchPontoDiario(user.id, today)

      if (!record) {
        setStep('entrada')
      } else if (record.entrada && !record.saida_almoco) {
        setStep('saida_almoco')
      } else if (record.saida_almoco && !record.retorno_almoco) {
        setStep('retorno_almoco')
      } else if (record.retorno_almoco && !record.saida) {
        setStep('saida')
      } else if (record.saida) {
        setStep('concluido')
      } else {
        setStep('entrada')
      }
    } catch (e) {
      console.error(e)
      setStep('entrada')
    }
  }

  useEffect(() => {
    let watchId: number
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude
          setUserLocation({ lat, lon })
          const dist = getDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lon, lat, lon)
          if (dist <= MAX_RADIUS) {
            setIsInsideGeofence(true)
            setDistanceMsg('Você está no local correto.')
          } else {
            setIsInsideGeofence(false)
            setDistanceMsg('Você não está no restaurante. Aproxime-se para registrar o ponto.')
          }
        },
        (err) => {
          console.error(err)
          setIsInsideGeofence(false)
          setDistanceMsg('Habilite a localização para registrar o ponto.')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    } else {
      setDistanceMsg('Geolocalização não suportada pelo seu navegador.')
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    loadPontoStatus()
    return () => clearInterval(timer)
  }, [user])

  const processPonto = async (photoBlob?: Blob) => {
    if (!user || !userLocation) return
    setIsCheckingIn(true)
    try {
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')
      const timeStr = format(now, 'HH:mm')

      let tipoPonto = 'entrada'
      if (step === 'saida_almoco') tipoPonto = 'almoço_saída'
      if (step === 'retorno_almoco') tipoPonto = 'almoço_retorno'
      if (step === 'saida') tipoPonto = 'saída'

      const result = await registrarPonto({
        profileId: user.id,
        data: todayStr,
        dataHora: now.toISOString(),
        tipoPonto,
        horario: timeStr,
        fotoFile: photoBlob,
        latitude: userLocation.lat,
        longitude: userLocation.lon,
      })

      if (result?.toastVariant === 'warning') {
        toast({
          title: 'Atenção',
          description: result.toastMsg,
          className: 'bg-yellow-50 text-yellow-900 border-yellow-200',
        })
      } else {
        toast({
          title: 'Ponto Registrado!',
          description: `Registro efetuado com sucesso às ${timeStr}`,
          className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        })
      }

      await loadPontoStatus()
    } catch (err: any) {
      if (err.message === 'FORA_DO_HORARIO') {
        toast({
          variant: 'destructive',
          title: 'Acesso Negado',
          description: 'Fora do horário de trabalho',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao registrar ponto',
          description: err.message || 'Ocorreu um erro desconhecido.',
        })
      }
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handlePontoClick = () => {
    if (!isInsideGeofence && !import.meta.env.DEV) return
    if (step === 'entrada' || step === 'saida') {
      setShowCamera(true)
    } else {
      processPonto()
    }
  }

  const dateFormatted = format(time, "EEEE, dd 'de' MMMM", { locale: ptBR })
  const timeFormatted = format(time, 'HH:mm:ss')

  const stepLabels: Record<string, string> = {
    entrada: 'Registrar Entrada',
    saida_almoco: 'Saída Almoço',
    retorno_almoco: 'Retorno Almoço',
    saida: 'Registrar Saída',
  }

  if (step === 'loading') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Carregando informações do ponto...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6 animate-fade-in-up">
        {step === 'concluido' ? (
          <Card className="border-emerald-200 bg-emerald-50 shadow-sm overflow-hidden animate-fade-in">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-900">Jornada Concluída</h2>
              <p className="text-emerald-700">
                Todos os registros de hoje foram feitos com sucesso.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
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
                  Próximo registro:{' '}
                  <span className="text-foreground font-bold">{stepLabels[step]}</span>
                </div>
              </CardContent>
            </Card>

            {!isInsideGeofence && (
              <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg text-sm font-medium animate-fade-in">
                <MapPin className="h-5 w-5 text-orange-500 shrink-0" />
                <p>{distanceMsg}</p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full h-16 text-lg rounded-xl shadow-elevation hover:-translate-y-1 transition-all duration-200 gap-2"
              onClick={handlePontoClick}
              disabled={(!isInsideGeofence && !import.meta.env.DEV) || isCheckingIn}
            >
              {(step === 'entrada' || step === 'saida') && <Camera className="w-5 h-5" />}
              {isCheckingIn ? 'Registrando...' : stepLabels[step]}
            </Button>

            {!isInsideGeofence && import.meta.env.DEV && (
              <button
                onClick={() => setIsInsideGeofence(true)}
                className="text-xs text-muted-foreground underline w-full text-center mt-2 hover:text-foreground"
              >
                [Dev] Simular estar no local
              </button>
            )}
          </>
        )}
      </div>

      <CameraCapture open={showCamera} onOpenChange={setShowCamera} onCapture={processPonto} />
    </div>
  )
}
