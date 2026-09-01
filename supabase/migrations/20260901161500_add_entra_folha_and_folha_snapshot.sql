-- Migration: Add entra_folha to profiles, update RPCs, and create historico_competencia_folha

-- 1. Add column entra_folha to profiles with default true
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS entra_folha BOOLEAN NOT NULL DEFAULT true;

-- 2. Drop existing overloaded functions
DROP FUNCTION IF EXISTS public.create_user_account(text, text, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric, uuid, text);
DROP FUNCTION IF EXISTS public.create_user_account(text, text, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric, uuid, text, boolean);

-- 3. Recreate create_user_account with p_entra_folha
CREATE OR REPLACE FUNCTION public.create_user_account(
  p_email text,
  p_password text,
  p_name text,
  p_phone text,
  p_birth_date date,
  p_cpf text,
  p_zip_code text,
  p_address text,
  p_address_number text,
  p_complement text,
  p_neighborhood text,
  p_city text,
  p_role text,
  p_access_level text,
  p_admission_date date,
  p_base_salary numeric,
  p_schedules jsonb,
  p_permissions jsonb DEFAULT '{"cadastros": false, "historico": false, "operacional": false, "dashboard_principal": false, "dashboard_desempenho": false}'::jsonb,
  p_valor_vt numeric DEFAULT 0,
  p_loja_id uuid DEFAULT NULL::uuid,
  p_pin_ponto text DEFAULT NULL::text,
  p_entra_folha boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    access_level, admission_date, base_salary, status, permissions, valor_vt, loja_id, pin_ponto, entra_folha
  ) VALUES (
    new_user_id, p_email, p_name, NULLIF(p_phone, ''), p_birth_date, NULLIF(p_cpf, ''), NULLIF(p_zip_code, ''), NULLIF(p_address, ''),
    NULLIF(p_address_number, ''), NULLIF(p_complement, ''), NULLIF(p_neighborhood, ''), NULLIF(p_city, ''), NULLIF(p_role, ''),
    p_access_level, p_admission_date, p_base_salary, 'Ativo', p_permissions, p_valor_vt, p_loja_id, NULLIF(p_pin_ponto, ''), COALESCE(p_entra_folha, true)
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
$function$;

-- 4. Drop existing overloaded update_user_account functions
DROP FUNCTION IF EXISTS public.update_user_account(uuid, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric, uuid, boolean, text);
DROP FUNCTION IF EXISTS public.update_user_account(uuid, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric, uuid, boolean, text, boolean);

-- 5. Recreate update_user_account with p_entra_folha
CREATE OR REPLACE FUNCTION public.update_user_account(
  p_user_id uuid,
  p_name text,
  p_phone text,
  p_birth_date date,
  p_cpf text,
  p_zip_code text,
  p_address text,
  p_address_number text,
  p_complement text,
  p_neighborhood text,
  p_city text,
  p_role text,
  p_access_level text,
  p_admission_date date,
  p_base_salary numeric,
  p_schedules jsonb,
  p_permissions jsonb,
  p_valor_vt numeric DEFAULT 0,
  p_loja_id uuid DEFAULT NULL::uuid,
  p_almoco_automatico boolean DEFAULT false,
  p_pin_ponto text DEFAULT NULL::text,
  p_entra_folha boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    valor_vt = p_valor_vt,
    loja_id = p_loja_id,
    almoco_automatico = p_almoco_automatico,
    pin_ponto = NULLIF(p_pin_ponto, ''),
    entra_folha = COALESCE(p_entra_folha, true),
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
$function$;

-- 6. Create table historico_competencia_folha for immutable payroll records upon closing
CREATE TABLE IF NOT EXISTS public.historico_competencia_folha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mes INT NOT NULL,
  ano INT NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  valor_vt NUMERIC NOT NULL DEFAULT 0,
  role TEXT,
  name TEXT,
  cpf TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, mes, ano)
);

CREATE INDEX IF NOT EXISTS historico_competencia_folha_mes_ano_idx ON public.historico_competencia_folha(mes, ano);
CREATE INDEX IF NOT EXISTS historico_competencia_folha_profile_idx ON public.historico_competencia_folha(profile_id);

ALTER TABLE public.historico_competencia_folha ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico_competencia_folha_select" ON public.historico_competencia_folha;
CREATE POLICY "historico_competencia_folha_select" ON public.historico_competencia_folha 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "historico_competencia_folha_insert" ON public.historico_competencia_folha;
CREATE POLICY "historico_competencia_folha_insert" ON public.historico_competencia_folha 
  FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level IN ('total', 'gerencia', 'admin', 'manager'))
);

DROP POLICY IF EXISTS "historico_competencia_folha_update" ON public.historico_competencia_folha;
CREATE POLICY "historico_competencia_folha_update" ON public.historico_competencia_folha 
  FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level IN ('total', 'gerencia', 'admin', 'manager'))
);

DROP POLICY IF EXISTS "historico_competencia_folha_delete" ON public.historico_competencia_folha;
CREATE POLICY "historico_competencia_folha_delete" ON public.historico_competencia_folha 
  FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level IN ('total', 'gerencia', 'admin', 'manager'))
);

-- 7. Backfill historic snapshots for already closed months if any
DO $$
DECLARE
  f RECORD;
BEGIN
  FOR f IN SELECT mes, ano FROM public.fechamento_mensal
  LOOP
    INSERT INTO public.historico_competencia_folha (profile_id, mes, ano, base_salary, valor_vt, role, name, cpf)
    SELECT p.id, f.mes, f.ano, COALESCE(p.base_salary, 0), COALESCE(p.valor_vt, 0), p.role, p.name, p.cpf
    FROM public.profiles p
    WHERE p.status = 'Ativo' AND COALESCE(p.entra_folha, true) = true
    ON CONFLICT (profile_id, mes, ano) DO NOTHING;
  END LOOP;
END $$;
