CREATE TABLE IF NOT EXISTS public.feriados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feriados_select" ON public.feriados;
CREATE POLICY "feriados_select" ON public.feriados
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "feriados_insert" ON public.feriados;
CREATE POLICY "feriados_insert" ON public.feriados
  FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "feriados_update" ON public.feriados;
CREATE POLICY "feriados_update" ON public.feriados
  FOR UPDATE TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "feriados_delete" ON public.feriados;
CREATE POLICY "feriados_delete" ON public.feriados
  FOR DELETE TO authenticated USING (is_manager_or_admin());
