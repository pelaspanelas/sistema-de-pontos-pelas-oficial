import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Upload, Trash2, Camera } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Sistema de Ponto',
  '/ponto': 'Sistema de Ponto',
  '/espelho-ponto': 'Espelho de Ponto',
  '/colaboradores': 'Pelas Panelas',
}

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase()
  return '#' + '00000'.substring(0, 6 - c.length) + c
}

function getInitials(name: string) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut, refreshProfile } = useAuth()
  const { toast } = useToast()

  const title = PAGE_TITLES[location.pathname] || 'Pelas Panelas'

  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = async () => {
    await signOut()
    toast({ title: 'Desconectado com sucesso' })
    setLogoutModalOpen(false)
    navigate('/login')
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB',
        variant: 'destructive',
      })
      return
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Utilize JPG ou PNG',
        variant: 'destructive',
      })
      return
    }

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${profile.id}/avatar_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)
      if (updateError) throw updateError

      await refreshProfile()
      toast({
        title: 'Foto atualizada com sucesso',
        className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      })
      setAvatarModalOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro ao fazer upload', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!profile) return
    setUploadingAvatar(true)
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id)
      if (updateError) throw updateError

      await refreshProfile()
      toast({ title: 'Foto removida' })
      setAvatarModalOpen(false)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background px-4 md:px-6 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground" />
            <div className="h-4 w-px bg-border hidden md:block" />
            <h1 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <span className="hidden md:inline-block border p-1 rounded bg-muted/30">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-muted-foreground"
                >
                  <path
                    d="M1.5 1H13.5C13.7761 1 14 1.22386 14 1.5V13.5C14 13.7761 13.7761 14 13.5 14H1.5C1.22386 14 1 13.7761 1 13.5V1.5C1 1.22386 1.22386 1 1.5 1ZM2 2V13H13V2H2Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </span>
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end text-sm">
                {profile ? (
                  <>
                    <span className="font-medium">{profile.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {profile.access_level}
                    </span>
                  </>
                ) : (
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 float-right" />
                  </div>
                )}
              </div>

              {profile ? (
                <button
                  onClick={() => setAvatarModalOpen(true)}
                  className="relative group rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-transform group-hover:scale-105">
                    <AvatarImage src={profile.avatar_url || ''} alt={profile.name} />
                    <AvatarFallback
                      style={{
                        backgroundColor: getAvatarColor(profile.name),
                        color: '#fff',
                      }}
                    >
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </button>
              ) : (
                <Skeleton className="h-8 w-8 rounded-full" />
              )}
            </div>
            <button
              onClick={() => setLogoutModalOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 bg-background pb-12">
          <Outlet />
        </main>
      </SidebarInset>

      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deseja sair do sistema?</DialogTitle>
            <DialogDescription>
              Você será desconectado e precisará fazer login novamente para acessar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setLogoutModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={avatarModalOpen} onOpenChange={setAvatarModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Foto de Perfil</DialogTitle>
            <DialogDescription>
              Faça upload de uma nova foto (JPG, PNG, máx 5MB) ou remova a atual.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-6">
            <Avatar className="h-24 w-24 text-2xl">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback
                style={
                  profile
                    ? {
                        backgroundColor: getAvatarColor(profile.name),
                        color: '#fff',
                      }
                    : undefined
                }
              >
                {profile ? getInitials(profile.name) : 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-4 w-full">
              <input
                type="file"
                accept="image/jpeg, image/png"
                className="hidden"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                disabled={uploadingAvatar}
              />
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingAvatar ? 'Enviando...' : 'Fazer Upload'}
              </Button>

              {profile?.avatar_url && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRemovePhoto}
                  disabled={uploadingAvatar}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover Foto
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
