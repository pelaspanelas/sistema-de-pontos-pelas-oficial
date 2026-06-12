-- Create table for company settings
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default row
INSERT INTO public.company_settings (id) VALUES ('00000000-0000-0000-0000-000000000001'::uuid) ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_settings_select" ON public.company_settings;
CREATE POLICY "company_settings_select" ON public.company_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "company_settings_update" ON public.company_settings;
CREATE POLICY "company_settings_update" ON public.company_settings
  FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.access_level IN ('total', 'gerencia') ));

-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects on logos bucket
DROP POLICY IF EXISTS "logos_select" ON storage.objects;
CREATE POLICY "logos_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "logos_insert" ON storage.objects;
CREATE POLICY "logos_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos' AND EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.access_level IN ('total', 'gerencia') ));

DROP POLICY IF EXISTS "logos_update" ON storage.objects;
CREATE POLICY "logos_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'logos' AND EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.access_level IN ('total', 'gerencia') ));

DROP POLICY IF EXISTS "logos_delete" ON storage.objects;
CREATE POLICY "logos_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'logos' AND EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.access_level IN ('total', 'gerencia') ));
