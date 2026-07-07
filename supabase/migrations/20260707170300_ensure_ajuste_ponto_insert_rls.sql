-- Ensure RLS policies for ajuste_ponto allow authenticated users to INSERT
-- records where usuario_id matches their own auth.uid()

ALTER TABLE public.ajuste_ponto ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own adjustment requests
DROP POLICY IF EXISTS "ajuste_ponto_insert" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_insert" ON public.ajuste_ponto
    FOR INSERT TO authenticated
    WITH CHECK (usuario_id = auth.uid());

-- Allow authenticated users to read their own adjustment requests or managers/admins to read all
DROP POLICY IF EXISTS "ajuste_ponto_select" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_select" ON public.ajuste_ponto
    FOR SELECT TO authenticated
    USING (usuario_id = auth.uid() OR is_manager_or_admin());

-- Allow only managers/admins to update adjustment requests (approve/reject)
DROP POLICY IF EXISTS "ajuste_ponto_update" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_update" ON public.ajuste_ponto
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin())
    WITH CHECK (is_manager_or_admin());

-- Allow only managers/admins to delete adjustment requests
DROP POLICY IF EXISTS "ajuste_ponto_delete" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_delete" ON public.ajuste_ponto
    FOR DELETE TO authenticated
    USING (is_manager_or_admin());
