import { useState, useEffect, useRef } from 'react'
import { Search, MoreHorizontal, Mail, Phone, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ColaboradorFormModal } from '@/components/colaboradores/ColaboradorFormModal'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function Colaboradores() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [filter, setFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos')
  const [search, setSearch] = useState('')
  const [colaboradores, setColaboradores] = useState<any[]>([])

  const [isAdmin, setIsAdmin] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  const [actionUser, setActionUser] = useState<any>(null)
  const [confirmType, setConfirmType] = useState<'inativar' | 'deletar' | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null)

  const fetchColaboradores = async () => {
    const { data } = await supabase.from('profiles').select('*').order('name')
    if (data) setColaboradores(data)
  }

  useEffect(() => {
    fetchColaboradores()
    if (user) {
      supabase
        .from('profiles')
        .select('access_level')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setIsAdmin(data?.access_level === 'total')
        })
    }
  }, [user])

  const filteredColaboradores = colaboradores.filter((c) => {
    if (filter !== 'Todos' && c.status !== filter) return false
    if (
      search &&
      !c.name?.toLowerCase().includes(search.toLowerCase()) &&
      !c.email?.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  const activeCount = colaboradores.filter((c) => c.status === 'Ativo').length

  const handleEdit = (c: any) => {
    setEditingUserId(c.id)
    setIsModalOpen(true)
  }

  const handleActionClick = (c: any) => {
    setActionUser(c)
    setConfirmType(c.status === 'Ativo' ? 'inativar' : 'deletar')
    setIsConfirmOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!actionUser || !confirmType) return

    try {
      if (confirmType === 'inativar') {
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'Inativo' })
          .eq('id', actionUser.id)
        if (error) throw error
        toast({ title: 'Colaborador inativado com sucesso' })
      } else {
        const { error } = await supabase.rpc('delete_user_account', { p_user_id: actionUser.id })
        if (error) throw error
        toast({ title: 'Colaborador deletado com sucesso' })
      }
      fetchColaboradores()
    } catch (err: any) {
      toast({ title: 'Erro ao executar ação', description: err.message, variant: 'destructive' })
    } finally {
      setIsConfirmOpen(false)
    }
  }

  const triggerPhotoUpload = (c: any) => {
    setUploadingUserId(c.id)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadingUserId) return

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${uploadingUserId}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', uploadingUserId)
      if (updateError) throw updateError

      toast({ title: 'Foto atualizada com sucesso' })
      fetchColaboradores()
    } catch (error: any) {
      toast({ title: 'Erro ao fazer upload', description: error.message, variant: 'destructive' })
    } finally {
      setUploadingUserId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="bg-banner rounded-2xl p-8 md:p-10 text-white shadow-sm animate-slide-up">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Talentos & Cultura</h1>
        <p className="text-white/90 text-lg md:text-xl max-w-2xl font-light mb-8">
          Gerencie os colaboradores da sua organização com eficiência e estilo.
        </p>
        <div className="flex gap-10">
          <div>
            <div className="text-4xl font-bold">{activeCount}</div>
            <div className="text-xs font-semibold tracking-wider text-white/80 uppercase mt-1">
              Ativos
            </div>
          </div>
          <div>
            <div className="text-4xl font-bold">3</div>
            <div className="text-xs font-semibold tracking-wider text-white/80 uppercase mt-1">
              Departamentos
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2 animate-slide-up"
        style={{ animationDelay: '100ms' }}
      >
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9 bg-background shadow-sm border-muted"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-muted/50 rounded-lg p-1 border">
            {['Todos', 'Ativo', 'Inativo'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button
            className="bg-foreground text-background hover:bg-foreground/90 ml-auto md:ml-2"
            onClick={() => {
              setEditingUserId(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Colaborador
          </Button>
        </div>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-slide-up"
        style={{ animationDelay: '200ms' }}
      >
        {filteredColaboradores.map((colaborador) => (
          <Card
            key={colaborador.id}
            className={`overflow-hidden hover:shadow-md transition-shadow ${colaborador.status === 'Inativo' ? 'opacity-70 bg-muted/30 grayscale-[0.3]' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Avatar className="h-14 w-14 ring-1 ring-border">
                  <AvatarImage src={colaborador.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {colaborador.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={colaborador.status === 'Ativo' ? 'default' : 'secondary'}
                    className={
                      colaborador.status === 'Ativo'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-200'
                    }
                  >
                    {colaborador.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground -mr-2"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(colaborador)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => triggerPhotoUpload(colaborador)}>
                        Trocar Foto
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleActionClick(colaborador)}
                      >
                        {colaborador.status === 'Ativo' ? 'Inativar' : 'Deletar'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <h3
                  className="font-semibold text-lg leading-tight line-clamp-1"
                  title={colaborador.name}
                >
                  {colaborador.name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {colaborador.role || 'Sem Cargo'}
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{colaborador.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{colaborador.phone || 'N/I'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{colaborador.city || 'N/I'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredColaboradores.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            Nenhum colaborador encontrado.
          </div>
        )}
      </div>

      <ColaboradorFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSaved={fetchColaboradores}
        colaboradorId={editingUserId}
        isAdmin={isAdmin}
      />

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmType === 'inativar'
                ? `Tem certeza que deseja inativar ${actionUser?.name}?`
                : `Tem certeza que deseja deletar permanentemente ${actionUser?.name}? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmType === 'deletar'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
