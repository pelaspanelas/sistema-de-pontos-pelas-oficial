DO $$
BEGIN
  -- Add lido to informativos
  ALTER TABLE public.informativos ADD COLUMN IF NOT EXISTS lido BOOLEAN DEFAULT FALSE;

  -- Add descricao and data to tarefas_concluidas
  ALTER TABLE public.tarefas_concluidas ADD COLUMN IF NOT EXISTS descricao TEXT;
  ALTER TABLE public.tarefas_concluidas ADD COLUMN IF NOT EXISTS data DATE;

  -- Add delete policy for tarefas_concluidas
  DROP POLICY IF EXISTS "tarefas_concluidas_delete" ON public.tarefas_concluidas;
  CREATE POLICY "tarefas_concluidas_delete" ON public.tarefas_concluidas
    FOR DELETE TO authenticated USING ((funcionario_id = auth.uid()) OR is_manager_or_admin());

  -- Update informativos policy to allow marking as read
  DROP POLICY IF EXISTS "informativos_update" ON public.informativos;
  CREATE POLICY "informativos_update" ON public.informativos
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
END $$;
