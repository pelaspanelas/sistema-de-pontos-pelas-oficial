import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChefHat, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)

  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const searchParams = new URLSearchParams(window.location.search)
  const changed = searchParams.get('changed')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      if (password === '123456') {
        navigate('/change-password')
      } else {
        navigate('/ponto')
      }
    }
  }

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: resetError } = await resetPassword(email)

    if (resetError) {
      setError(resetError.message)
    } else {
      toast({
        title: 'E-mail enviado',
        description: 'Um link de recuperação foi enviado para o seu e-mail.',
      })
      setIsRecoveryMode(false)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-xl overflow-hidden border border-border/50 animate-fade-in-up">
        <div className="p-8 pb-6 bg-primary/5 flex flex-col items-center border-b border-border/50">
          <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground mb-4 shadow-lg">
            <ChefHat className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Pelas Panelas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isRecoveryMode ? 'Recuperação de Senha' : 'Sistema de Gestão de Ponto'}
          </p>
        </div>

        {isRecoveryMode ? (
          <form onSubmit={handleRecovery} className="p-8 space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="recovery-email">E-mail corporativo</Label>
              <Input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-muted/50"
                placeholder="Digite seu e-mail"
              />
              <p className="text-xs text-muted-foreground pt-2">
                Enviaremos um link para você redefinir sua senha.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full font-semibold" disabled={loading} size="lg">
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsRecoveryMode(false)
                  setError('')
                }}
                disabled={loading}
              >
                Voltar para o login
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {changed && (
              <div className="p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md animate-fade-in-down">
                Senha alterada com sucesso! Faça login com a nova senha.
              </div>
            )}
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(true)
                    setError('')
                  }}
                  className="text-xs text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-muted/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-semibold" disabled={loading} size="lg">
              {loading ? 'Acessando...' : 'Acessar Sistema'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
