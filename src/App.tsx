import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

import Layout from './components/Layout'
import Index from './pages/Index'
import Ponto from './pages/Ponto'
import EspelhoPonto from './pages/EspelhoPonto'
import Colaboradores from './pages/Colaboradores'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
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
          <Route path="/login" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
