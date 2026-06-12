CREATE TABLE IF NOT EXISTS public.fechamento_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes INT NOT NULL,
  ano INT NOT NULL,
  fechado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mes, ano)
);

ALTER TABLE public.fechamento_mensal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fechamento_mensal_select" ON public.fechamento_mensal;
CREATE POLICY "fechamento_mensal_select" ON public.fechamento_mensal 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "fechamento_mensal_insert" ON public.fechamento_mensal;
CREATE POLICY "fechamento_mensal_insert" ON public.fechamento_mensal 
  FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level IN ('total', 'gerencia'))
);

DROP POLICY IF EXISTS "fechamento_mensal_delete" ON public.fechamento_mensal;
CREATE POLICY "fechamento_mensal_delete" ON public.fechamento_mensal 
  FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level IN ('total', 'gerencia'))
);
