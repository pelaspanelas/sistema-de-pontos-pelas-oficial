CREATE TABLE IF NOT EXISTS public.historico_alteracoes_ponto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ponto_id UUID REFERENCES public.pontos(id) ON DELETE SET NULL,
    alterado_por UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    coluna_alterada TEXT NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.historico_alteracoes_ponto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico_select" ON public.historico_alteracoes_ponto;
CREATE POLICY "historico_select" ON public.historico_alteracoes_ponto
    FOR SELECT TO authenticated
    USING (is_manager_or_admin());

DROP POLICY IF EXISTS "historico_insert" ON public.historico_alteracoes_ponto;
CREATE POLICY "historico_insert" ON public.historico_alteracoes_ponto
    FOR INSERT TO authenticated
    WITH CHECK (is_manager_or_admin());
