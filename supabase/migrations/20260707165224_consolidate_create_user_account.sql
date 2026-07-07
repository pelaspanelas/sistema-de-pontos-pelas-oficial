-- Consolidate overloaded create_user_account functions to resolve PGRST203 (HTTP 300) ambiguity.
-- Drop ALL existing signatures before recreating a single definitive version.

DROP FUNCTION IF EXISTS public.create_user_account(text, text, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.create_user_account(text, text, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric);
DROP FUNCTION IF EXISTS public.create_user_account(text, text, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric, uuid);

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
  p_loja_id uuid DEFAULT NULL
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
    access_level, admission_date, base_salary, status, permissions, valor_vt, loja_id
  ) VALUES (
    new_user_id, p_email, p_name, NULLIF(p_phone, ''), p_birth_date, NULLIF(p_cpf, ''), NULLIF(p_zip_code, ''), NULLIF(p_address, ''),
    NULLIF(p_address_number, ''), NULLIF(p_complement, ''), NULLIF(p_neighborhood, ''), NULLIF(p_city, ''), NULLIF(p_role, ''),
    p_access_level, p_admission_date, p_base_salary, 'Ativo', p_permissions, p_valor_vt, p_loja_id
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
