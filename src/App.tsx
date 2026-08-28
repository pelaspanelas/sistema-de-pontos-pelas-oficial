import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider, useAuth } from './hooks/use-auth'
import Layout from './components/Layout'
import Ponto from './pages/Ponto'
import Dashboard from './pages/Dashboard'
import ChangePassword from './pages/ChangePassword'
import EspelhoPonto from './pages/EspelhoPonto'
import Colaboradores from './pages/Colaboradores'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Tarefas from './pages/Tarefas'
import Desempenho from './pages/Desempenho'
import FolhaPagamento from './pages/FolhaPagamento'
import Ferias from './pages/Ferias'
import FolhaPagamentoDetalhes from './pages/FolhaPagamentoDetalhes'
import Feriados from './pages/Feriados'
import AjustesPonto from './pages/AjustesPonto'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading)
    return <div className="min-h-screen flex items-center justify-center">Aguarde...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const PermissionGuard = ({
  permission,
  requiresGerenciaOrAdmin,
  children,
}: {
  permission?: string
  requiresGerenciaOrAdmin?: boolean
  children: React.ReactNode
}) => {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (!profile) return <Navigate to="/ponto" replace />

  const isAdmin = profile.access_level === 'total' || profile.access_level === 'admin'
  const isGerencia = profile.access_level === 'gerencia' || profile.access_level === 'manager'

  if (isAdmin) return <>{children}</>

  const permissions = (profile.permissions as Record<string, boolean>) || {}

  if (permission && !permissions[permission]) {
    return <Navigate to="/ponto" replace />
  }

  if (requiresGerenciaOrAdmin && !isGerencia) {
    return <Navigate to="/ponto" replace />
  }

  return <>{children}</>
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={
                <PermissionGuard permission="dashboard_principal" requiresGerenciaOrAdmin>
                  <Dashboard />
                </PermissionGuard>
              }
            />
            <Route path="/ponto" element={<Ponto />} />

            <Route
              path="/espelho-ponto"
              element={
                <PermissionGuard permission="operacional">
                  <EspelhoPonto />
                </PermissionGuard>
              }
            />
            <Route
              path="/ajustes-ponto"
              element={
                <PermissionGuard requiresGerenciaOrAdmin>
                  <AjustesPonto />
                </PermissionGuard>
              }
            />
            <Route
              path="/colaboradores"
              element={
                <PermissionGuard permission="cadastros">
                  <Colaboradores />
                </PermissionGuard>
              }
            />

            <Route path="/desempenho" element={<Desempenho />} />

            {/* Redirects for non-implemented routes mentioned in sidebar to keep UI functional */}
            <Route
              path="/cargos-funcoes"
              element={
                <PermissionGuard permission="cadastros">
                  <Navigate to="/colaboradores" replace />
                </PermissionGuard>
              }
            />
            <Route
              path="/tarefas"
              element={
                <PermissionGuard permission="cadastros">
                  <Tarefas />
                </PermissionGuard>
              }
            />
            <Route
              path="/feriados"
              element={
                <PermissionGuard permission="cadastros">
                  <Feriados />
                </PermissionGuard>
              }
            />
            <Route
              path="/ferias"
              element={
                <PermissionGuard permission="operacional">
                  <Ferias />
                </PermissionGuard>
              }
            />
            <Route
              path="/folha-pagamento"
              element={
                <PermissionGuard requiresGerenciaOrAdmin>
                  <FolhaPagamento />
                </PermissionGuard>
              }
            />
            <Route
              path="/folha-pagamento/:id"
              element={
                <PermissionGuard requiresGerenciaOrAdmin>
                  <FolhaPagamentoDetalhes />
                </PermissionGuard>
              }
            />
            <Route
              path="/relatorios"
              element={
                <PermissionGuard permission="historico">
                  <Navigate to="/" replace />
                </PermissionGuard>
              }
            />
            <Route
              path="/avaliacoes"
              element={
                <PermissionGuard permission="historico">
                  <Navigate to="/colaboradores" replace />
                </PermissionGuard>
              }
            />
            <Route
              path="/bonificacoes"
              element={
                <PermissionGuard permission="historico">
                  <Navigate to="/" replace />
                </PermissionGuard>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
