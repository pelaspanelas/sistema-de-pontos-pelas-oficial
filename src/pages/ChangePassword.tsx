import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { LockKeyhole } from 'lucide-react'

export default function ChangePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password === '123456') {
      setError('Escolha uma senha diferente da padrão.')
      return
    }

    setLoading(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      await signOut()
      navigate('/login?changed=true')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-xl overflow-hidden border border-border/50 animate-fade-in-up">
        <div className="p-8 pb-6 bg-primary/5 flex flex-col items-center border-b border-border/50">
          <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground mb-4 shadow-lg">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Alterar Senha</h2>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Para sua segurança, é obrigatório alterar a senha padrão antes de continuar.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="p-8 space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="bg-muted/50"
            />
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={loading} size="lg">
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
