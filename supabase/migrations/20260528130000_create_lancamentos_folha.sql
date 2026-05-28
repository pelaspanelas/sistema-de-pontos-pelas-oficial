CREATE TABLE IF NOT EXISTS public.lancamentos_folha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mes integer NOT NULL,
  ano integer NOT NULL,
  tipo text NOT NULL,
  categoria text NOT NULL CHECK (categoria IN ('credito', 'debito')),
  valor numeric NOT NULL DEFAULT 0,
  descricao text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.lancamentos_folha ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lancamentos_folha_select" ON public.lancamentos_folha;
CREATE POLICY "lancamentos_folha_select" ON public.lancamentos_folha
  FOR SELECT TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "lancamentos_folha_insert" ON public.lancamentos_folha;
CREATE POLICY "lancamentos_folha_insert" ON public.lancamentos_folha
  FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "lancamentos_folha_update" ON public.lancamentos_folha;
CREATE POLICY "lancamentos_folha_update" ON public.lancamentos_folha
  FOR UPDATE TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "lancamentos_folha_delete" ON public.lancamentos_folha;
CREATE POLICY "lancamentos_folha_delete" ON public.lancamentos_folha
  FOR DELETE TO authenticated USING (is_manager_or_admin());

DO $$
DECLARE
  first_user_id uuid;
BEGIN
  SELECT id INTO first_user_id FROM public.profiles WHERE status = 'Ativo' LIMIT 1;
  IF first_user_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.lancamentos_folha WHERE profile_id = first_user_id AND tipo = 'bonus' AND mes = EXTRACT(MONTH FROM NOW())::int AND ano = EXTRACT(YEAR FROM NOW())::int) THEN
      INSERT INTO public.lancamentos_folha (profile_id, mes, ano, tipo, categoria, valor, descricao)
      VALUES (first_user_id, EXTRACT(MONTH FROM NOW())::int, EXTRACT(YEAR FROM NOW())::int, 'bonus', 'credito', 150.00, 'Bônus de Produtividade Inicial');
    END IF;
  END IF;
END $$;
