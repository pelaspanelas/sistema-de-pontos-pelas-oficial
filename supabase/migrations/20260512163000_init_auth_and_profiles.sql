-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  cpf TEXT,
  zip_code TEXT,
  address TEXT,
  address_number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  role TEXT,
  access_level TEXT DEFAULT 'colaborador',
  admission_date DATE,
  base_salary NUMERIC,
  status TEXT DEFAULT 'Ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schedules Table
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL,
  entry_time TIME,
  lunch_start TIME,
  lunch_end TIME,
  exit_time TIME,
  UNIQUE(profile_id, day_of_week)
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "schedules_select" ON public.schedules;
CREATE POLICY "schedules_select" ON public.schedules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "schedules_insert" ON public.schedules;
CREATE POLICY "schedules_insert" ON public.schedules FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "schedules_update" ON public.schedules;
CREATE POLICY "schedules_update" ON public.schedules FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "schedules_delete" ON public.schedules;
CREATE POLICY "schedules_delete" ON public.schedules FOR DELETE TO authenticated USING (true);

-- RPC Function to safely create a user from frontend without Service Role
CREATE OR REPLACE FUNCTION public.create_user_account(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_birth_date DATE,
  p_cpf TEXT,
  p_zip_code TEXT,
  p_address TEXT,
  p_address_number TEXT,
  p_complement TEXT,
  p_neighborhood TEXT,
  p_city TEXT,
  p_role TEXT,
  p_access_level TEXT,
  p_admission_date DATE,
  p_base_salary NUMERIC,
  p_schedules JSONB
) RETURNS UUID AS $$
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
    access_level, admission_date, base_salary, status
  ) VALUES (
    new_user_id, p_email, p_name, p_phone, p_birth_date, p_cpf, p_zip_code, p_address,
    p_address_number, p_complement, p_neighborhood, p_city, p_role,
    p_access_level, p_admission_date, p_base_salary, 'Ativo'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed initial admin user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'wagner@pelaspanelas.com.br') THEN
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
      'wagner@pelaspanelas.com.br',
      crypt('wag7132', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Wagner"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, role, access_level, status)
    VALUES (new_user_id, 'wagner@pelaspanelas.com.br', 'Wagner', 'Administrador', 'total', 'Ativo')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
