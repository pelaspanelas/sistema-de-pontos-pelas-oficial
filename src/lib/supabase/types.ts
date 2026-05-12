// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      pontos: {
        Row: {
          created_at: string
          data: string
          data_hora: string
          foto_url: string | null
          horario: string
          id: string
          latitude: number | null
          longitude: number | null
          nsr: number
          profile_id: string
          status_validacao: string | null
          tipo_ponto: string
          updated_at: string
          wifi_conectado: boolean | null
        }
        Insert: {
          created_at?: string
          data: string
          data_hora: string
          foto_url?: string | null
          horario: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nsr?: number
          profile_id: string
          status_validacao?: string | null
          tipo_ponto: string
          updated_at?: string
          wifi_conectado?: boolean | null
        }
        Update: {
          created_at?: string
          data?: string
          data_hora?: string
          foto_url?: string | null
          horario?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nsr?: number
          profile_id?: string
          status_validacao?: string | null
          tipo_ponto?: string
          updated_at?: string
          wifi_conectado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'pontos_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      pontos_diarios: {
        Row: {
          created_at: string
          criado_por: string
          data: string
          entrada: string | null
          horas_calculadas: number | null
          id: string
          profile_id: string
          retorno_almoco: string | null
          saida: string | null
          saida_almoco: string | null
          tipo_registro: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          data: string
          entrada?: string | null
          horas_calculadas?: number | null
          id?: string
          profile_id: string
          retorno_almoco?: string | null
          saida?: string | null
          saida_almoco?: string | null
          tipo_registro?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          data?: string
          entrada?: string | null
          horas_calculadas?: number | null
          id?: string
          profile_id?: string
          retorno_almoco?: string | null
          saida?: string | null
          saida_almoco?: string | null
          tipo_registro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pontos_diarios_criado_por_fkey'
            columns: ['criado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pontos_diarios_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          access_level: string | null
          address: string | null
          address_number: string | null
          admission_date: string | null
          base_salary: number | null
          birth_date: string | null
          city: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          name: string
          neighborhood: string | null
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          access_level?: string | null
          address?: string | null
          address_number?: string | null
          admission_date?: string | null
          base_salary?: number | null
          birth_date?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          neighborhood?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          access_level?: string | null
          address?: string | null
          address_number?: string | null
          admission_date?: string | null
          base_salary?: number | null
          birth_date?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          neighborhood?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          day_of_week: number
          entry_time: string | null
          exit_time: string | null
          id: string
          lunch_end: string | null
          lunch_start: string | null
          profile_id: string
        }
        Insert: {
          day_of_week: number
          entry_time?: string | null
          exit_time?: string | null
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          profile_id: string
        }
        Update: {
          day_of_week?: number
          entry_time?: string | null
          exit_time?: string | null
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedules_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_account: {
        Args: {
          p_access_level: string
          p_address: string
          p_address_number: string
          p_admission_date: string
          p_base_salary: number
          p_birth_date: string
          p_city: string
          p_complement: string
          p_cpf: string
          p_email: string
          p_name: string
          p_neighborhood: string
          p_password: string
          p_phone: string
          p_role: string
          p_schedules: Json
          p_zip_code: string
        }
        Returns: string
      }
      is_manager_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: pontos
//   id: uuid (not null, default: gen_random_uuid())
//   nsr: integer (not null, default: nextval('pontos_nsr_seq'::regclass))
//   profile_id: uuid (not null)
//   data: date (not null)
//   data_hora: timestamp with time zone (not null)
//   tipo_ponto: text (not null)
//   horario: text (not null)
//   foto_url: text (nullable)
//   latitude: numeric (nullable)
//   longitude: numeric (nullable)
//   wifi_conectado: boolean (nullable)
//   status_validacao: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: pontos_diarios
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   criado_por: uuid (not null)
//   data: date (not null)
//   entrada: text (nullable)
//   saida_almoco: text (nullable)
//   retorno_almoco: text (nullable)
//   saida: text (nullable)
//   tipo_registro: text (nullable, default: 'automático'::text)
//   horas_calculadas: numeric (nullable, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   name: text (not null)
//   phone: text (nullable)
//   birth_date: date (nullable)
//   cpf: text (nullable)
//   zip_code: text (nullable)
//   address: text (nullable)
//   address_number: text (nullable)
//   complement: text (nullable)
//   neighborhood: text (nullable)
//   city: text (nullable)
//   role: text (nullable)
//   access_level: text (nullable, default: 'colaborador'::text)
//   admission_date: date (nullable)
//   base_salary: numeric (nullable)
//   status: text (nullable, default: 'Ativo'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: schedules
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   day_of_week: integer (not null)
//   entry_time: time without time zone (nullable)
//   lunch_start: time without time zone (nullable)
//   lunch_end: time without time zone (nullable)
//   exit_time: time without time zone (nullable)

// --- CONSTRAINTS ---
// Table: pontos
//   UNIQUE pontos_nsr_key: UNIQUE (nsr)
//   PRIMARY KEY pontos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY pontos_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: pontos_diarios
//   FOREIGN KEY pontos_diarios_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES profiles(id) ON DELETE CASCADE
//   PRIMARY KEY pontos_diarios_pkey: PRIMARY KEY (id)
//   FOREIGN KEY pontos_diarios_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: schedules
//   PRIMARY KEY schedules_pkey: PRIMARY KEY (id)
//   UNIQUE schedules_profile_id_day_of_week_key: UNIQUE (profile_id, day_of_week)
//   FOREIGN KEY schedules_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE

// --- ROW LEVEL SECURITY POLICIES ---
// Table: pontos
//   Policy "pontos_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.access_level = 'total'::text))))
//   Policy "pontos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((profile_id = auth.uid()) OR is_manager_or_admin())
//   Policy "pontos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((profile_id = auth.uid()) OR is_manager_or_admin())
//   Policy "pontos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((profile_id = auth.uid()) OR is_manager_or_admin())
// Table: pontos_diarios
//   Policy "pontos_diarios_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.access_level = 'total'::text))))
//   Policy "pontos_diarios_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((profile_id = auth.uid()) OR is_manager_or_admin())
//   Policy "pontos_diarios_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((profile_id = auth.uid()) OR is_manager_or_admin())
//   Policy "pontos_diarios_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((profile_id = auth.uid()) OR is_manager_or_admin())
// Table: profiles
//   Policy "profiles_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "profiles_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "profiles_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "profiles_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: schedules
//   Policy "schedules_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "schedules_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "schedules_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "schedules_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true

// --- DATABASE FUNCTIONS ---
// FUNCTION create_user_account(text, text, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb)
//   CREATE OR REPLACE FUNCTION public.create_user_account(p_email text, p_password text, p_name text, p_phone text, p_birth_date date, p_cpf text, p_zip_code text, p_address text, p_address_number text, p_complement text, p_neighborhood text, p_city text, p_role text, p_access_level text, p_admission_date date, p_base_salary numeric, p_schedules jsonb)
//    RETURNS uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     new_user_id UUID;
//     sched JSONB;
//   BEGIN
//     new_user_id := gen_random_uuid();
//
//     INSERT INTO auth.users (
//       id, instance_id, email, encrypted_password, email_confirmed_at,
//       created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
//       is_super_admin, role, aud,
//       confirmation_token, recovery_token, email_change_token_new,
//       email_change, email_change_token_current,
//       phone, phone_change, phone_change_token, reauthentication_token
//     ) VALUES (
//       new_user_id,
//       '00000000-0000-0000-0000-000000000000',
//       p_email,
//       crypt(p_password, gen_salt('bf')),
//       NOW(), NOW(), NOW(),
//       '{"provider": "email", "providers": ["email"]}'::jsonb,
//       jsonb_build_object('name', p_name),
//       false, 'authenticated', 'authenticated',
//       '', '', '', '', '',
//       NULL,
//       '', '', ''
//     );
//
//     INSERT INTO public.profiles (
//       id, email, name, phone, birth_date, cpf, zip_code, address,
//       address_number, complement, neighborhood, city, role,
//       access_level, admission_date, base_salary, status
//     ) VALUES (
//       new_user_id, p_email, p_name, p_phone, p_birth_date, p_cpf, p_zip_code, p_address,
//       p_address_number, p_complement, p_neighborhood, p_city, p_role,
//       p_access_level, p_admission_date, p_base_salary, 'Ativo'
//     );
//
//     FOR sched IN SELECT * FROM jsonb_array_elements(p_schedules)
//     LOOP
//       INSERT INTO public.schedules (
//         profile_id, day_of_week, entry_time, lunch_start, lunch_end, exit_time
//       ) VALUES (
//         new_user_id,
//         (sched->>'day_of_week')::INT,
//         NULLIF(sched->>'entry_time', '')::TIME,
//         NULLIF(sched->>'lunch_start', '')::TIME,
//         NULLIF(sched->>'lunch_end', '')::TIME,
//         NULLIF(sched->>'exit_time', '')::TIME
//       );
//     END LOOP;
//
//     RETURN new_user_id;
//   END;
//   $function$
//
// FUNCTION is_manager_or_admin()
//   CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
//    RETURNS boolean
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN EXISTS (
//       SELECT 1 FROM public.profiles
//       WHERE id = auth.uid()
//       AND access_level IN ('total', 'gerencia')
//     );
//   END;
//   $function$
//
// FUNCTION rls_auto_enable()
//   CREATE OR REPLACE FUNCTION public.rls_auto_enable()
//    RETURNS event_trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'pg_catalog'
//   AS $function$
//   DECLARE
//     cmd record;
//   BEGIN
//     FOR cmd IN
//       SELECT *
//       FROM pg_event_trigger_ddl_commands()
//       WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
//         AND object_type IN ('table','partitioned table')
//     LOOP
//        IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
//         BEGIN
//           EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
//           RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
//         EXCEPTION
//           WHEN OTHERS THEN
//             RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
//         END;
//        ELSE
//           RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
//        END IF;
//     END LOOP;
//   END;
//   $function$
//

// --- INDEXES ---
// Table: pontos
//   CREATE INDEX pontos_data_idx ON public.pontos USING btree (data)
//   CREATE UNIQUE INDEX pontos_nsr_key ON public.pontos USING btree (nsr)
//   CREATE INDEX pontos_profile_id_idx ON public.pontos USING btree (profile_id)
// Table: pontos_diarios
//   CREATE INDEX pontos_diarios_data_idx ON public.pontos_diarios USING btree (data)
//   CREATE INDEX pontos_diarios_profile_id_idx ON public.pontos_diarios USING btree (profile_id)
// Table: schedules
//   CREATE UNIQUE INDEX schedules_profile_id_day_of_week_key ON public.schedules USING btree (profile_id, day_of_week)
