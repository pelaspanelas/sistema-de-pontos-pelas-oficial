import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AuthProvider, useAuth } from './hooks/use-auth'
import Layout from './components/Layout'
import Index from './pages/Index'
import Ponto from './pages/Ponto'
import EspelhoPonto from './pages/EspelhoPonto'
import Colaboradores from './pages/Colaboradores'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading)
    return <div className="min-h-screen flex items-center justify-center">Aguarde...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/ponto" element={<Ponto />} />
            <Route path="/espelho-ponto" element={<EspelhoPonto />} />
            <Route path="/colaboradores" element={<Colaboradores />} />

            {/* Redirects for non-implemented routes mentioned in sidebar to keep UI functional */}
            <Route path="/desempenho" element={<Navigate to="/" replace />} />
            <Route path="/cargos-funcoes" element={<Navigate to="/colaboradores" replace />} />
            <Route path="/tarefas" element={<Navigate to="/colaboradores" replace />} />
            <Route path="/ferias" element={<Navigate to="/espelho-ponto" replace />} />
            <Route path="/folha-pagamento" element={<Navigate to="/espelho-ponto" replace />} />
            <Route path="/relatorios" element={<Navigate to="/" replace />} />
            <Route path="/avaliacoes" element={<Navigate to="/colaboradores" replace />} />
            <Route path="/bonificacoes" element={<Navigate to="/" replace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
