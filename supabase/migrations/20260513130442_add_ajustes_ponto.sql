-- Update pontos table
ALTER TABLE public.pontos ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.pontos ADD COLUMN IF NOT EXISTS tipo_registro TEXT DEFAULT 'automático';

-- Create ajuste_ponto table
CREATE TABLE IF NOT EXISTS public.ajuste_ponto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    aprovado_por UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    data_ponto DATE NOT NULL,
    horario_solicitado TEXT NOT NULL,
    motivo TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS ajuste_ponto_usuario_id_idx ON public.ajuste_ponto (usuario_id);
CREATE INDEX IF NOT EXISTS ajuste_ponto_status_idx ON public.ajuste_ponto (status);
CREATE INDEX IF NOT EXISTS ajuste_ponto_data_ponto_idx ON public.ajuste_ponto (data_ponto);

-- Enable RLS
ALTER TABLE public.ajuste_ponto ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "ajuste_ponto_select" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_select" ON public.ajuste_ponto
    FOR SELECT TO authenticated
    USING (usuario_id = auth.uid() OR is_manager_or_admin());

DROP POLICY IF EXISTS "ajuste_ponto_insert" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_insert" ON public.ajuste_ponto
    FOR INSERT TO authenticated
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "ajuste_ponto_update" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_update" ON public.ajuste_ponto
    FOR UPDATE TO authenticated
    USING (is_manager_or_admin());

DROP POLICY IF EXISTS "ajuste_ponto_delete" ON public.ajuste_ponto;
CREATE POLICY "ajuste_ponto_delete" ON public.ajuste_ponto
    FOR DELETE TO authenticated
    USING (is_manager_or_admin());
