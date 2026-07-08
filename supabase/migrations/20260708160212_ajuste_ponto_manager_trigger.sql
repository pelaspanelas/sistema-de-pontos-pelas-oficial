-- Add updated_at trigger for ajuste_ponto to refresh on status change
CREATE OR REPLACE FUNCTION public.refresh_ajuste_ponto_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ajuste_ponto_updated_at ON public.ajuste_ponto;
CREATE TRIGGER ajuste_ponto_updated_at
  BEFORE UPDATE ON public.ajuste_ponto
  FOR EACH ROW EXECUTE FUNCTION public.refresh_ajuste_ponto_updated_at();

-- Ensure RLS policies are correct for ajuste_ponto
ALTER TABLE public.ajuste_ponto ENABLE ROW LEVEL SECURITY;

-- Employees can SELECT their own records; managers/admins can SELECT all
DROP POLICY IF EXISTS "ajuste_ponto_select" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_select" ON public.ajuste_ponto
    FOR SELECT TO authenticated
    USING (usuario_id = auth.uid() OR is_manager_or_admin());

-- Employees can INSERT their own adjustment requests
DROP POLICY IF EXISTS "ajuste_ponto_insert" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_insert" ON public.ajuste_ponto
    FOR INSERT TO authenticated
    WITH CHECK (usuario_id = auth.uid());

-- Only managers/admins can UPDATE (approve/reject) adjustment requests
DROP POLICY IF EXISTS "ajuste_ponto_update" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_update" ON public.ajuste_ponto
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

-- Only managers/admins can DELETE adjustment requests
DROP POLICY IF EXISTS "ajuste_ponto_delete" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_delete" ON public.ajuste_ponto
    FOR DELETE TO authenticated
    USING (is_manager_or_admin());
