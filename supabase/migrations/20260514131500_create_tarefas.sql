DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    responsavel_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quantidade_meta TEXT NOT NULL,
    prioridade INT NOT NULL CHECK (prioridade IN (1, 2, 3)),
    data_vencimento DATE,
    tipo_repeticao TEXT NOT NULL DEFAULT 'nenhuma',
    dias_semana INT[],
    dia_mes INT,
    ativo BOOLEAN DEFAULT true,
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.informativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    destinatarios UUID[],
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS public.tarefas_concluidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarefa_id UUID REFERENCES public.tarefas(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    data_conclusao DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );
END $$;

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_concluidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarefas_select" ON public.tarefas;
CREATE POLICY "tarefas_select" ON public.tarefas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tarefas_insert" ON public.tarefas;
CREATE POLICY "tarefas_insert" ON public.tarefas FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "tarefas_update" ON public.tarefas;
CREATE POLICY "tarefas_update" ON public.tarefas FOR UPDATE TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "tarefas_delete" ON public.tarefas;
CREATE POLICY "tarefas_delete" ON public.tarefas FOR DELETE TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "informativos_select" ON public.informativos;
CREATE POLICY "informativos_select" ON public.informativos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "informativos_insert" ON public.informativos;
CREATE POLICY "informativos_insert" ON public.informativos FOR INSERT TO authenticated WITH CHECK (is_manager_or_admin());

DROP POLICY IF EXISTS "informativos_update" ON public.informativos;
CREATE POLICY "informativos_update" ON public.informativos FOR UPDATE TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "informativos_delete" ON public.informativos;
CREATE POLICY "informativos_delete" ON public.informativos FOR DELETE TO authenticated USING (is_manager_or_admin());

DROP POLICY IF EXISTS "tarefas_concluidas_select" ON public.tarefas_concluidas;
CREATE POLICY "tarefas_concluidas_select" ON public.tarefas_concluidas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tarefas_concluidas_insert" ON public.tarefas_concluidas;
CREATE POLICY "tarefas_concluidas_insert" ON public.tarefas_concluidas FOR INSERT TO authenticated WITH CHECK (funcionario_id = auth.uid() OR is_manager_or_admin());

DROP POLICY IF EXISTS "tarefas_concluidas_update" ON public.tarefas_concluidas;
CREATE POLICY "tarefas_concluidas_update" ON public.tarefas_concluidas FOR UPDATE TO authenticated USING (funcionario_id = auth.uid() OR is_manager_or_admin());

DO $$
DECLARE
  ana_id UUID;
  carlos_id UUID;
  mariana_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE name = 'Ana Silva') THEN
    ana_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token) 
    VALUES (ana_id, '00000000-0000-0000-0000-000000000000', 'ana@example.com', crypt('Password123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Ana Silva"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');
    
    INSERT INTO public.profiles (id, email, name, status) VALUES (ana_id, 'ana@example.com', 'Ana Silva', 'Ativo');
  ELSE
    SELECT id INTO ana_id FROM public.profiles WHERE name = 'Ana Silva' LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE name = 'Carlos Oliveira') THEN
    carlos_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token) 
    VALUES (carlos_id, '00000000-0000-0000-0000-000000000000', 'carlos@example.com', crypt('Password123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Carlos Oliveira"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');
    
    INSERT INTO public.profiles (id, email, name, status) VALUES (carlos_id, 'carlos@example.com', 'Carlos Oliveira', 'Ativo');
  ELSE
    SELECT id INTO carlos_id FROM public.profiles WHERE name = 'Carlos Oliveira' LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE name = 'Mariana Santos') THEN
    mariana_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token) 
    VALUES (mariana_id, '00000000-0000-0000-0000-000000000000', 'mariana@example.com', crypt('Password123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{"name": "Mariana Santos"}', false, 'authenticated', 'authenticated', '', '', '', '', '', NULL, '', '', '');
    
    INSERT INTO public.profiles (id, email, name, status) VALUES (mariana_id, 'mariana@example.com', 'Mariana Santos', 'Ativo');
  ELSE
    SELECT id INTO mariana_id FROM public.profiles WHERE name = 'Mariana Santos' LIMIT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tarefas WHERE titulo = 'Limpar a cozinha' AND data = '2026-05-10') THEN
    INSERT INTO public.tarefas (titulo, descricao, data, responsavel_id, quantidade_meta, prioridade, data_vencimento, tipo_repeticao, ativo)
    VALUES ('Limpar a cozinha', 'Limpeza geral pós-expediente', '2026-05-10', ana_id, '1x ao dia', 3, '2026-05-10', 'diaria', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tarefas WHERE titulo = 'Estoque de Bebidas' AND data = '2026-05-15') THEN
    INSERT INTO public.tarefas (titulo, descricao, data, responsavel_id, quantidade_meta, prioridade, data_vencimento, tipo_repeticao, ativo)
    VALUES ('Estoque de Bebidas', 'Contar e repor', '2026-05-15', carlos_id, 'Total', 2, '2026-05-15', 'nenhuma', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tarefas WHERE titulo = 'Organizar mesas' AND data = '2026-05-20') THEN
    INSERT INTO public.tarefas (titulo, descricao, data, responsavel_id, quantidade_meta, prioridade, data_vencimento, tipo_repeticao, ativo)
    VALUES ('Organizar mesas', '', '2026-05-20', mariana_id, 'Salão Principal', 1, '2026-05-20', 'nenhuma', true);
  END IF;
END $$;
