-- Set up storage for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
CREATE POLICY "Avatar upload" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar update" ON storage.objects;
CREATE POLICY "Avatar update" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;
CREATE POLICY "Avatar delete" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar read" ON storage.objects;
CREATE POLICY "Avatar read" ON storage.objects 
  FOR SELECT TO public 
  USING (bucket_id = 'avatars');
