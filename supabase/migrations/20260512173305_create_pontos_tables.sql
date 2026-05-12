DO $$
BEGIN
  CREATE SEQUENCE IF NOT EXISTS pontos_nsr_seq START 1;

  CREATE TABLE IF NOT EXISTS public.pontos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nsr INTEGER NOT NULL DEFAULT nextval('pontos_nsr_seq'),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    data_hora TIMESTAMPTZ NOT NULL,
    tipo_ponto TEXT NOT NULL,
    horario TEXT NOT NULL,
    foto_url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    wifi_conectado BOOLEAN,
    status_validacao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(nsr)
  );

  CREATE TABLE IF NOT EXISTS public.pontos_diarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    criado_por UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    entrada TEXT,
    saida_almoco TEXT,
    retorno_almoco TEXT,
    saida TEXT,
    tipo_registro TEXT DEFAULT 'automático',
    horas_calculadas NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS pontos_profile_id_idx ON public.pontos(profile_id);
  CREATE INDEX IF NOT EXISTS pontos_data_idx ON public.pontos(data);
  CREATE INDEX IF NOT EXISTS pontos_diarios_profile_id_idx ON public.pontos_diarios(profile_id);
  CREATE INDEX IF NOT EXISTS pontos_diarios_data_idx ON public.pontos_diarios(data);
END $$;

ALTER TABLE public.pontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos_diarios ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND access_level IN ('total', 'gerencia')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "pontos_select" ON public.pontos;
CREATE POLICY "pontos_select" ON public.pontos
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_manager_or_admin());

DROP POLICY IF EXISTS "pontos_insert" ON public.pontos;
CREATE POLICY "pontos_insert" ON public.pontos
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() OR public.is_manager_or_admin());

DROP POLICY IF EXISTS "pontos_update" ON public.pontos;
CREATE POLICY "pontos_update" ON public.pontos
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR public.is_manager_or_admin());

DROP POLICY IF EXISTS "pontos_delete" ON public.pontos;
CREATE POLICY "pontos_delete" ON public.pontos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level = 'total'));

DROP POLICY IF EXISTS "pontos_diarios_select" ON public.pontos_diarios;
CREATE POLICY "pontos_diarios_select" ON public.pontos_diarios
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_manager_or_admin());

DROP POLICY IF EXISTS "pontos_diarios_insert" ON public.pontos_diarios;
CREATE POLICY "pontos_diarios_insert" ON public.pontos_diarios
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() OR public.is_manager_or_admin());

DROP POLICY IF EXISTS "pontos_diarios_update" ON public.pontos_diarios;
CREATE POLICY "pontos_diarios_update" ON public.pontos_diarios
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR public.is_manager_or_admin());

DROP POLICY IF EXISTS "pontos_diarios_delete" ON public.pontos_diarios;
CREATE POLICY "pontos_diarios_delete" ON public.pontos_diarios
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level = 'total'));

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pontos_fotos', 'pontos_fotos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "pontos_fotos_public_read" ON storage.objects;
CREATE POLICY "pontos_fotos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'pontos_fotos');

DROP POLICY IF EXISTS "pontos_fotos_insert" ON storage.objects;
CREATE POLICY "pontos_fotos_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pontos_fotos');
