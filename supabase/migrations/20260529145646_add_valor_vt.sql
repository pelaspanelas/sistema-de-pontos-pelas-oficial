ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS valor_vt numeric DEFAULT 0;

DROP FUNCTION IF EXISTS public.create_user_account(text, text, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb);
DROP FUNCTION IF EXISTS public.create_user_account(text, text, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.create_user_account(
  p_email text, p_password text, p_name text, p_phone text, p_birth_date date, 
  p_cpf text, p_zip_code text, p_address text, p_address_number text, 
  p_complement text, p_neighborhood text, p_city text, p_role text, 
  p_access_level text, p_admission_date date, p_base_salary numeric, 
  p_schedules jsonb, p_permissions jsonb DEFAULT '{"cadastros": false, "historico": false, "operacional": false, "dashboard_principal": false, "dashboard_desempenho": false}'::jsonb,
  p_valor_vt numeric DEFAULT 0
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
    access_level, admission_date, base_salary, status, permissions, valor_vt
  ) VALUES (
    new_user_id, p_email, p_name, p_phone, p_birth_date, p_cpf, p_zip_code, p_address,
    p_address_number, p_complement, p_neighborhood, p_city, p_role,
    p_access_level, p_admission_date, p_base_salary, 'Ativo', p_permissions, p_valor_vt
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

DROP FUNCTION IF EXISTS public.update_user_account(uuid, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.update_user_account(
  p_user_id uuid, p_name text, p_phone text, p_birth_date date, p_cpf text, 
  p_zip_code text, p_address text, p_address_number text, p_complement text, 
  p_neighborhood text, p_city text, p_role text, p_access_level text, 
  p_admission_date date, p_base_salary numeric, p_schedules jsonb, 
  p_permissions jsonb, p_valor_vt numeric DEFAULT 0
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
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Wagner"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );

    INSERT INTO public.profiles (
      id, email, name, role, access_level, status
    ) VALUES (
      new_user_id, 'wagner@pelaspanelas.com.br', 'Wagner', 'Administrador', 'total', 'Ativo'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
