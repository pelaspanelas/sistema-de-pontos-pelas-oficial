-- Consolidate overloaded update_user_account functions to resolve PGRST203 (HTTP 300) ambiguity.
-- Drop ALL existing signatures before recreating a single definitive version.

DROP FUNCTION IF EXISTS public.update_user_account(uuid, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.update_user_account(uuid, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric);
DROP FUNCTION IF EXISTS public.update_user_account(uuid, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric, uuid);

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
  p_loja_id uuid DEFAULT NULL
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
