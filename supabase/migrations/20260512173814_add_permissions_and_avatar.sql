DO $$
BEGIN
  -- Add avatar_url and permissions to profiles
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"dashboard_principal": false, "dashboard_desempenho": false, "cadastros": false, "operacional": false, "historico": false}'::jsonb;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

  -- Create Storage Bucket
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('avatars', 'avatars', true) 
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Setup Storage Policies
DROP POLICY IF EXISTS "Avatar public access" ON storage.objects;
CREATE POLICY "Avatar public access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar authenticated upload" ON storage.objects;
CREATE POLICY "Avatar authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar authenticated update" ON storage.objects;
CREATE POLICY "Avatar authenticated update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar authenticated delete" ON storage.objects;
CREATE POLICY "Avatar authenticated delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- Update create_user_account function
CREATE OR REPLACE FUNCTION public.create_user_account(
  p_email text, p_password text, p_name text, p_phone text, p_birth_date date,
  p_cpf text, p_zip_code text, p_address text, p_address_number text,
  p_complement text, p_neighborhood text, p_city text, p_role text,
  p_access_level text, p_admission_date date, p_base_salary numeric,
  p_schedules jsonb, p_permissions jsonb DEFAULT '{"dashboard_principal": false, "dashboard_desempenho": false, "cadastros": false, "operacional": false, "historico": false}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  sched JSONB;
BEGIN
  new_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current,
    phone, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('name', p_name),
    false, 'authenticated', 'authenticated',
    '', '', '', '', '',
    NULL,
    '', '', ''
  );

  INSERT INTO public.profiles (
    id, email, name, phone, birth_date, cpf, zip_code, address, 
    address_number, complement, neighborhood, city, role, 
    access_level, admission_date, base_salary, status, permissions
  ) VALUES (
    new_user_id, p_email, p_name, p_phone, p_birth_date, p_cpf, p_zip_code, p_address,
    p_address_number, p_complement, p_neighborhood, p_city, p_role,
    p_access_level, p_admission_date, p_base_salary, 'Ativo', p_permissions
  );

  FOR sched IN SELECT * FROM jsonb_array_elements(p_schedules)
  LOOP
    INSERT INTO public.schedules (
      profile_id, day_of_week, entry_time, lunch_start, lunch_end, exit_time
    ) VALUES (
      new_user_id, 
      (sched->>'day_of_week')::INT, 
      NULLIF(sched->>'entry_time', '')::TIME, 
      NULLIF(sched->>'lunch_start', '')::TIME, 
      NULLIF(sched->>'lunch_end', '')::TIME, 
      NULLIF(sched->>'exit_time', '')::TIME
    );
  END LOOP;

  RETURN new_user_id;
END;
$$;

-- Function to update user
CREATE OR REPLACE FUNCTION public.update_user_account(
  p_user_id uuid, p_name text, p_phone text, p_birth_date date,
  p_cpf text, p_zip_code text, p_address text, p_address_number text,
  p_complement text, p_neighborhood text, p_city text, p_role text,
  p_access_level text, p_admission_date date, p_base_salary numeric,
  p_schedules jsonb, p_permissions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sched JSONB;
BEGIN
  UPDATE public.profiles SET
    name = p_name,
    phone = p_phone,
    birth_date = p_birth_date,
    cpf = p_cpf,
    zip_code = p_zip_code,
    address = p_address,
    address_number = p_address_number,
    complement = p_complement,
    neighborhood = p_neighborhood,
    city = p_city,
    role = p_role,
    access_level = p_access_level,
    admission_date = p_admission_date,
    base_salary = p_base_salary,
    permissions = p_permissions,
    updated_at = NOW()
  WHERE id = p_user_id;

  DELETE FROM public.schedules WHERE profile_id = p_user_id;

  FOR sched IN SELECT * FROM jsonb_array_elements(p_schedules)
  LOOP
    INSERT INTO public.schedules (
      profile_id, day_of_week, entry_time, lunch_start, lunch_end, exit_time
    ) VALUES (
      p_user_id, 
      (sched->>'day_of_week')::INT, 
      NULLIF(sched->>'entry_time', '')::TIME, 
      NULLIF(sched->>'lunch_start', '')::TIME, 
      NULLIF(sched->>'lunch_end', '')::TIME, 
      NULLIF(sched->>'exit_time', '')::TIME
    );
  END LOOP;
END;
$$;

-- Function to delete user completely
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
