import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useSidebar } from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Clock,
  Users,
  Briefcase,
  CheckSquare,
  FileText,
  Calendar,
  DollarSign,
  BarChart2,
  Star,
  Gift,
  LogOut,
  Fingerprint,
  ChefHat,
  ClipboardCheck,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, profile, loading: authLoading } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleSignOut = async () => {
    handleLinkClick()
    await signOut()
    navigate('/login')
  }

  if (authLoading) {
    return (
      <Sidebar>
        <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/50">
          <div className="flex flex-col items-center gap-1 text-primary">
            <ChefHat className="h-8 w-8" />
            <span className="font-semibold text-sm tracking-tight text-foreground">
              Pelas Panelas
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-4 pt-6 flex flex-col gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </SidebarContent>

        <SidebarFooter className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-10 text-primary hover:text-primary hover:bg-primary/10 font-medium"
                onClick={handleLinkClick}
              >
                <Link to="/ponto">
                  <Fingerprint className="h-5 w-5 mr-2" />
                  <span>Acessar Ponto</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="mt-2">
              <SidebarMenuButton
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    )
  }

  const isAdmin = profile?.access_level === 'total'
  const isGerencia = profile?.access_level === 'gerencia'
  const permissions = (profile?.permissions as Record<string, boolean>) || {}

  const filteredNavItems = []

  // DASHBOARD
  const dashboardItems = []
  if (isAdmin || permissions.dashboard_principal) {
    dashboardItems.push({ name: 'Principal', path: '/', icon: LayoutDashboard })
  }
  // Desempenho é acessível a todos os colaboradores
  dashboardItems.push({ name: 'Desempenho', path: '/desempenho', icon: BarChart2 })

  if (dashboardItems.length > 0) {
    filteredNavItems.push({ label: 'DASHBOARD', items: dashboardItems })
  }

  // CADASTROS
  if (isAdmin || permissions.cadastros) {
    filteredNavItems.push({
      label: 'CADASTROS',
      items: [
        { name: 'Colaboradores', path: '/colaboradores', icon: Users },
        { name: 'Cargos e Funções', path: '/cargos-funcoes', icon: Briefcase },
        { name: 'Tarefas', path: '/tarefas', icon: CheckSquare },
        { name: 'Feriados', path: '/feriados', icon: Calendar },
      ],
    })
  }

  // OPERACIONAL
  if (isAdmin || permissions.operacional) {
    const operacionalItems = [
      { name: 'Registros de Ponto', path: '/espelho-ponto', icon: Clock },
      { name: 'Registro de Férias', path: '/ferias', icon: Calendar },
    ]
    if (isAdmin || isGerencia) {
      operacionalItems.push({
        name: 'Ajustes de Ponto',
        path: '/ajustes-ponto',
        icon: ClipboardCheck,
      })
      operacionalItems.push({
        name: 'Folha de Pagamento',
        path: '/folha-pagamento',
        icon: DollarSign,
      })
    }
    filteredNavItems.push({
      label: 'OPERACIONAL',
      items: operacionalItems,
    })
  }

  // HISTÓRICO
  if (isAdmin || permissions.historico) {
    filteredNavItems.push({
      label: 'HISTÓRICO',
      items: [
        { name: 'Relatórios', path: '/relatorios', icon: FileText },
        { name: 'Avaliações', path: '/avaliacoes', icon: Star },
        { name: 'Bonificações', path: '/bonificacoes', icon: Gift },
      ],
    })
  }

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/50">
        <Link
          to="/"
          onClick={handleLinkClick}
          className="flex flex-col items-center gap-1 text-primary"
        >
          <ChefHat className="h-8 w-8" />
          <span className="font-semibold text-sm tracking-tight text-foreground">
            Pelas Panelas
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4">
        {filteredNavItems.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-2 mb-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        onClick={handleLinkClick}
                        className={`h-9 px-3 ${isActive ? 'bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                      >
                        <Link to={item.path}>
                          <item.icon
                            className={`h-4 w-4 mr-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                          />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 text-primary hover:text-primary hover:bg-primary/10 font-medium"
              onClick={handleLinkClick}
            >
              <Link to="/ponto">
                {' '}
                <Fingerprint className="h-5 w-5 mr-2" />
                <span>Acessar Ponto</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
