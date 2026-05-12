import { Link, useLocation } from 'react-router-dom'
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
  SidebarSeparator,
} from '@/components/ui/sidebar'

const navItems = [
  {
    label: 'DASHBOARD',
    items: [
      { name: 'Principal', path: '/', icon: LayoutDashboard },
      { name: 'Desempenho', path: '/desempenho', icon: BarChart2 },
    ],
  },
  {
    label: 'CADASTROS',
    items: [
      { name: 'Colaboradores', path: '/colaboradores', icon: Users },
      { name: 'Cargos e Funções', path: '/cargos-funcoes', icon: Briefcase },
      { name: 'Tarefas', path: '/tarefas', icon: CheckSquare },
    ],
  },
  {
    label: 'OPERACIONAL',
    items: [
      { name: 'Registros de Ponto', path: '/espelho-ponto', icon: Clock },
      { name: 'Registro de Férias', path: '/ferias', icon: Calendar },
      { name: 'Folha de Pagamento', path: '/folha-pagamento', icon: DollarSign },
    ],
  },
  {
    label: 'HISTÓRICO',
    items: [
      { name: 'Relatórios', path: '/relatorios', icon: FileText },
      { name: 'Avaliações', path: '/avaliacoes', icon: Star },
      { name: 'Bonificações', path: '/bonificacoes', icon: Gift },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/50">
        <Link to="/" className="flex flex-col items-center gap-1 text-primary">
          <ChefHat className="h-8 w-8" />
          <span className="font-semibold text-sm tracking-tight text-foreground">
            Pelas Panelas
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4">
        {navItems.map((group) => (
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
            >
              <Link to="/ponto">
                <Fingerprint className="h-5 w-5 mr-2" />
                <span>Acessar Ponto</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/login">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sair</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
