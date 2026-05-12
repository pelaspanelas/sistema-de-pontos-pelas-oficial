import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'
import { CURRENT_USER } from '@/lib/mock-data'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Sistema de Ponto',
  '/ponto': 'Sistema de Ponto',
  '/espelho-ponto': 'Espelho de Ponto',
  '/colaboradores': 'Pelas Panelas',
}

export default function Layout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Pelas Panelas'

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
                <span className="font-medium">{CURRENT_USER.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {CURRENT_USER.role}
                </span>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage
                  src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2`}
                  alt={CURRENT_USER.name}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {CURRENT_USER.initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 bg-background pb-12">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
