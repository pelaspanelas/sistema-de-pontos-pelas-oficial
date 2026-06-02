CREATE TABLE IF NOT EXISTS public.ferias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  status text NOT NULL DEFAULT 'agendada',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ferias_select" ON public.ferias;
CREATE POLICY "ferias_select" ON public.ferias
  FOR SELECT TO authenticated USING (profile_id = auth.uid() OR is_manager_or_admin());

DROP POLICY IF EXISTS "ferias_insert" ON public.ferias;
CREATE POLICY "ferias_insert" ON public.ferias
  FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "ferias_update" ON public.ferias;
CREATE POLICY "ferias_update" ON public.ferias
  FOR UPDATE TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "ferias_delete" ON public.ferias;
CREATE POLICY "ferias_delete" ON public.ferias
  FOR DELETE TO authenticated USING (is_manager_or_admin());

CREATE INDEX IF NOT EXISTS ferias_profile_id_idx ON public.ferias(profile_id);
