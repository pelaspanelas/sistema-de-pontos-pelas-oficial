-- Update is_manager_or_admin to support 'admin' and 'manager' access levels
-- alongside existing 'total' and 'gerencia'
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND access_level IN ('total', 'gerencia', 'admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles SELECT policy:
-- Policy 1: Authenticated users can SELECT their own profile
-- Policy 2: Admins/managers can SELECT all profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (
    id = auth.uid() OR public.is_manager_or_admin()
  );

-- Ensure admin user exists with correct password and access_level = 'admin'
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'wagner@pelaspanelas.com.br';

  IF admin_user_id IS NOT NULL THEN
    UPDATE auth.users SET
      encrypted_password = crypt('Skip@Pass123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = '',
      recovery_token = '',
      email_change_token_new = '',
      email_change = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = ''
    WHERE email = 'wagner@pelaspanelas.com.br';

    UPDATE public.profiles SET
      access_level = 'admin',
      role = COALESCE(role, 'Administrador'),
      status = 'Ativo',
      updated_at = NOW()
    WHERE id = admin_user_id;
  ELSE
    admin_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'wagner@pelaspanelas.com.br',
      crypt('Skip@Pass123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"name": "Wagner"}'::jsonb,
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL,
      '', '', ''
    );

    INSERT INTO public.profiles (id, email, name, role, access_level, status)
    VALUES (admin_user_id, 'wagner@pelaspanelas.com.br', 'Wagner', 'Administrador', 'admin', 'Ativo')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
