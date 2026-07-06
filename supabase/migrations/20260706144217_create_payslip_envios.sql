CREATE TABLE IF NOT EXISTS public.payslip_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mes integer NOT NULL,
  ano integer NOT NULL,
  canal text NOT NULL CHECK (canal IN ('email', 'whatsapp', 'ambos')),
  enviado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payslip_envios_profile_id_idx
  ON public.payslip_envios USING btree (profile_id);

CREATE INDEX IF NOT EXISTS payslip_envios_mes_ano_idx
  ON public.payslip_envios USING btree (mes, ano);

ALTER TABLE public.payslip_envios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payslip_envios_select" ON public.payslip_envios;
CREATE POLICY "payslip_envios_select" ON public.payslip_envios
  FOR SELECT TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "payslip_envios_insert" ON public.payslip_envios;
CREATE POLICY "payslip_envios_insert" ON public.payslip_envios
  FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "payslip_envios_update" ON public.payslip_envios;
CREATE POLICY "payslip_envios_update" ON public.payslip_envios
  FOR UPDATE TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "payslip_envios_delete" ON public.payslip_envios;
CREATE POLICY "payslip_envios_delete" ON public.payslip_envios
  FOR DELETE TO authenticated USING (is_manager_or_admin());
