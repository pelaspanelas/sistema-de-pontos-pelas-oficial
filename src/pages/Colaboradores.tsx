import { useState } from 'react'
import { Search, Plus, MoreHorizontal, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { COLABORADORES_DATA } from '@/lib/mock-data'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Colaboradores() {
  const [filter, setFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos')
  const [search, setSearch] = useState('')

  const filteredColaboradores = COLABORADORES_DATA.filter((c) => {
    if (filter !== 'Todos' && c.status !== filter) return false
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !c.email.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  const activeCount = COLABORADORES_DATA.filter((c) => c.status === 'Ativo').length

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Banner */}
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

      {/* Toolbar */}
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
          <Button className="bg-foreground text-background hover:bg-foreground/90 ml-auto md:ml-2">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Colaborador
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-slide-up"
        style={{ animationDelay: '200ms' }}
      >
        {filteredColaboradores.map((colaborador) => (
          <Card key={colaborador.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Avatar className="h-14 w-14 ring-1 ring-border">
                  {colaborador.avatar ? (
                    <AvatarImage src={colaborador.avatar} alt={colaborador.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {colaborador.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={colaborador.status === 'Ativo' ? 'default' : 'secondary'}
                    className={
                      colaborador.status === 'Ativo'
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        : ''
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
                      <DropdownMenuItem>Editar Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Ver Relatórios</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
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
                <p className="text-xs text-muted-foreground font-medium">{colaborador.role}</p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{colaborador.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{colaborador.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{colaborador.city}</span>
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
    </div>
  )
}
