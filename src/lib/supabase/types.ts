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
      ajuste_ponto: {
        Row: {
          aprovado_por: string | null
          created_at: string | null
          data_ponto: string
          horario_solicitado: string
          id: string
          motivo: string
          status: string | null
          tipo_ponto: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          aprovado_por?: string | null
          created_at?: string | null
          data_ponto: string
          horario_solicitado: string
          id?: string
          motivo: string
          status?: string | null
          tipo_ponto?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          aprovado_por?: string | null
          created_at?: string | null
          data_ponto?: string
          horario_solicitado?: string
          id?: string
          motivo?: string
          status?: string | null
          tipo_ponto?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ajuste_ponto_aprovado_por_fkey'
            columns: ['aprovado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ajuste_ponto_usuario_id_fkey'
            columns: ['usuario_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      company_settings: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fechamento_mensal: {
        Row: {
          ano: number
          created_at: string
          fechado_por: string | null
          id: string
          mes: number
        }
        Insert: {
          ano: number
          created_at?: string
          fechado_por?: string | null
          id?: string
          mes: number
        }
        Update: {
          ano?: number
          created_at?: string
          fechado_por?: string | null
          id?: string
          mes?: number
        }
        Relationships: [
          {
            foreignKeyName: 'fechamento_mensal_fechado_por_fkey'
            columns: ['fechado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      feriados: {
        Row: {
          created_at: string
          criado_por: string | null
          data: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          data: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          data?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: 'feriados_criado_por_fkey'
            columns: ['criado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ferias: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          observacoes: string | null
          profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          observacoes?: string | null
          profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          observacoes?: string | null
          profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ferias_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      historico_alteracoes_ponto: {
        Row: {
          alterado_por: string
          coluna_alterada: string
          created_at: string
          id: string
          ponto_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          alterado_por: string
          coluna_alterada: string
          created_at?: string
          id?: string
          ponto_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          alterado_por?: string
          coluna_alterada?: string
          created_at?: string
          id?: string
          ponto_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'historico_alteracoes_ponto_alterado_por_fkey'
            columns: ['alterado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'historico_alteracoes_ponto_ponto_id_fkey'
            columns: ['ponto_id']
            isOneToOne: false
            referencedRelation: 'pontos'
            referencedColumns: ['id']
          },
        ]
      }
      informativos: {
        Row: {
          created_at: string
          criado_por: string | null
          destinatarios: string[] | null
          id: string
          lido: boolean | null
          mensagem: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          destinatarios?: string[] | null
          id?: string
          lido?: boolean | null
          mensagem: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          destinatarios?: string[] | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      lancamentos_folha: {
        Row: {
          ano: number
          categoria: string
          created_at: string
          criado_por: string | null
          descricao: string
          id: string
          mes: number
          profile_id: string
          tipo: string
          valor: number
        }
        Insert: {
          ano: number
          categoria: string
          created_at?: string
          criado_por?: string | null
          descricao: string
          id?: string
          mes: number
          profile_id: string
          tipo: string
          valor?: number
        }
        Update: {
          ano?: number
          categoria?: string
          created_at?: string
          criado_por?: string | null
          descricao?: string
          id?: string
          mes?: number
          profile_id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'lancamentos_folha_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      pontos: {
        Row: {
          alerta_visualizado: boolean | null
          created_at: string
          criado_por: string | null
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
          tipo_registro: string | null
          updated_at: string
          wifi_conectado: boolean | null
        }
        Insert: {
          alerta_visualizado?: boolean | null
          created_at?: string
          criado_por?: string | null
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
          tipo_registro?: string | null
          updated_at?: string
          wifi_conectado?: boolean | null
        }
        Update: {
          alerta_visualizado?: boolean | null
          created_at?: string
          criado_por?: string | null
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
          tipo_registro?: string | null
          updated_at?: string
          wifi_conectado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'pontos_criado_por_fkey'
            columns: ['criado_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
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
          avatar_url: string | null
          banco_horas_ativo: boolean
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
          permissions: Json | null
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string
          valor_vt: number | null
          zip_code: string | null
        }
        Insert: {
          access_level?: string | null
          address?: string | null
          address_number?: string | null
          admission_date?: string | null
          avatar_url?: string | null
          banco_horas_ativo?: boolean
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
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
          valor_vt?: number | null
          zip_code?: string | null
        }
        Update: {
          access_level?: string | null
          address?: string | null
          address_number?: string | null
          admission_date?: string | null
          avatar_url?: string | null
          banco_horas_ativo?: boolean
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
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
          valor_vt?: number | null
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
      tarefas: {
        Row: {
          ativo: boolean | null
          created_at: string
          criado_por: string | null
          data: string
          data_vencimento: string | null
          descricao: string | null
          dia_mes: number | null
          dias_semana: number[] | null
          id: string
          prioridade: number
          quantidade_meta: string
          responsavel_id: string | null
          tipo_repeticao: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          criado_por?: string | null
          data: string
          data_vencimento?: string | null
          descricao?: string | null
          dia_mes?: number | null
          dias_semana?: number[] | null
          id?: string
          prioridade: number
          quantidade_meta: string
          responsavel_id?: string | null
          tipo_repeticao?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          criado_por?: string | null
          data?: string
          data_vencimento?: string | null
          descricao?: string | null
          dia_mes?: number | null
          dias_semana?: number[] | null
          id?: string
          prioridade?: number
          quantidade_meta?: string
          responsavel_id?: string | null
          tipo_repeticao?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tarefas_responsavel_id_fkey'
            columns: ['responsavel_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      tarefas_concluidas: {
        Row: {
          created_at: string
          criado_por: string | null
          data: string | null
          data_conclusao: string
          descricao: string | null
          funcionario_id: string | null
          id: string
          status: string
          tarefa_id: string | null
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          data?: string | null
          data_conclusao: string
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          status?: string
          tarefa_id?: string | null
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          data?: string | null
          data_conclusao?: string
          descricao?: string | null
          funcionario_id?: string | null
          id?: string
          status?: string
          tarefa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tarefas_concluidas_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tarefas_concluidas_tarefa_id_fkey'
            columns: ['tarefa_id']
            isOneToOne: false
            referencedRelation: 'tarefas'
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
          p_permissions?: Json
          p_phone: string
          p_role: string
          p_schedules: Json
          p_valor_vt?: number
          p_zip_code: string
        }
        Returns: string
      }
      delete_user_account: { Args: { p_user_id: string }; Returns: undefined }
      is_manager_or_admin: { Args: never; Returns: boolean }
      update_user_account: {
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
          p_name: string
          p_neighborhood: string
          p_permissions: Json
          p_phone: string
          p_role: string
          p_schedules: Json
          p_user_id: string
          p_valor_vt?: number
          p_zip_code: string
        }
        Returns: undefined
      }
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
// Table: ajuste_ponto
//   id: uuid (not null, default: gen_random_uuid())
//   usuario_id: uuid (not null)
//   aprovado_por: uuid (nullable)
//   data_ponto: date (not null)
//   horario_solicitado: text (not null)
//   motivo: text (not null)
//   status: text (nullable, default: 'pendente'::text)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   tipo_ponto: text (nullable)
// Table: company_settings
//   id: uuid (not null, default: gen_random_uuid())
//   logo_url: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: fechamento_mensal
//   id: uuid (not null, default: gen_random_uuid())
//   mes: integer (not null)
//   ano: integer (not null)
//   fechado_por: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: feriados
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   data: date (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   criado_por: uuid (nullable)
// Table: ferias
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   data_inicio: date (not null)
//   data_fim: date (not null)
//   status: text (not null, default: 'agendada'::text)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: historico_alteracoes_ponto
//   id: uuid (not null, default: gen_random_uuid())
//   ponto_id: uuid (nullable)
//   alterado_por: uuid (not null)
//   coluna_alterada: text (not null)
//   valor_anterior: text (nullable)
//   valor_novo: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: informativos
//   id: uuid (not null, default: gen_random_uuid())
//   titulo: text (not null)
//   mensagem: text (not null)
//   destinatarios: _uuid (nullable)
//   criado_por: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   lido: boolean (nullable, default: false)
// Table: lancamentos_folha
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   mes: integer (not null)
//   ano: integer (not null)
//   tipo: text (not null)
//   categoria: text (not null)
//   valor: numeric (not null, default: 0)
//   descricao: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   criado_por: uuid (nullable)
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
//   criado_por: uuid (nullable)
//   tipo_registro: text (nullable, default: 'automático'::text)
//   alerta_visualizado: boolean (nullable, default: false)
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
//   permissions: jsonb (nullable, default: '{"cadastros": false, "historico": false, "operacional": false, "dashboard_principal": false, "dashboard_desempenho": false}'::jsonb)
//   avatar_url: text (nullable)
//   banco_horas_ativo: boolean (not null, default: false)
//   valor_vt: numeric (nullable, default: 0)
// Table: schedules
//   id: uuid (not null, default: gen_random_uuid())
//   profile_id: uuid (not null)
//   day_of_week: integer (not null)
//   entry_time: time without time zone (nullable)
//   lunch_start: time without time zone (nullable)
//   lunch_end: time without time zone (nullable)
//   exit_time: time without time zone (nullable)
// Table: tarefas
//   id: uuid (not null, default: gen_random_uuid())
//   titulo: text (not null)
//   descricao: text (nullable)
//   data: date (not null)
//   responsavel_id: uuid (nullable)
//   quantidade_meta: text (not null)
//   prioridade: integer (not null)
//   data_vencimento: date (nullable)
//   tipo_repeticao: text (not null, default: 'nenhuma'::text)
//   dias_semana: _int4 (nullable)
//   dia_mes: integer (nullable)
//   ativo: boolean (nullable, default: true)
//   criado_por: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: tarefas_concluidas
//   id: uuid (not null, default: gen_random_uuid())
//   tarefa_id: uuid (nullable)
//   funcionario_id: uuid (nullable)
//   data_conclusao: date (not null)
//   status: text (not null, default: 'pendente'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   descricao: text (nullable)
//   data: date (nullable)
//   criado_por: uuid (nullable)

// --- CONSTRAINTS ---
// Table: ajuste_ponto
//   FOREIGN KEY ajuste_ponto_aprovado_por_fkey: FOREIGN KEY (aprovado_por) REFERENCES profiles(id) ON DELETE CASCADE
//   PRIMARY KEY ajuste_ponto_pkey: PRIMARY KEY (id)
//   FOREIGN KEY ajuste_ponto_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: company_settings
//   PRIMARY KEY company_settings_pkey: PRIMARY KEY (id)
// Table: fechamento_mensal
//   FOREIGN KEY fechamento_mensal_fechado_por_fkey: FOREIGN KEY (fechado_por) REFERENCES profiles(id) ON DELETE SET NULL
//   UNIQUE fechamento_mensal_mes_ano_key: UNIQUE (mes, ano)
//   PRIMARY KEY fechamento_mensal_pkey: PRIMARY KEY (id)
// Table: feriados
//   FOREIGN KEY feriados_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES profiles(id) ON DELETE SET NULL
//   PRIMARY KEY feriados_pkey: PRIMARY KEY (id)
// Table: ferias
//   PRIMARY KEY ferias_pkey: PRIMARY KEY (id)
//   FOREIGN KEY ferias_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: historico_alteracoes_ponto
//   FOREIGN KEY historico_alteracoes_ponto_alterado_por_fkey: FOREIGN KEY (alterado_por) REFERENCES profiles(id) ON DELETE CASCADE
//   PRIMARY KEY historico_alteracoes_ponto_pkey: PRIMARY KEY (id)
//   FOREIGN KEY historico_alteracoes_ponto_ponto_id_fkey: FOREIGN KEY (ponto_id) REFERENCES pontos(id) ON DELETE SET NULL
// Table: informativos
//   FOREIGN KEY informativos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY informativos_pkey: PRIMARY KEY (id)
// Table: lancamentos_folha
//   CHECK lancamentos_folha_categoria_check: CHECK ((categoria = ANY (ARRAY['credito'::text, 'debito'::text])))
//   FOREIGN KEY lancamentos_folha_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY lancamentos_folha_pkey: PRIMARY KEY (id)
//   FOREIGN KEY lancamentos_folha_profile_id_fkey: FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: pontos
//   FOREIGN KEY pontos_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES profiles(id) ON DELETE CASCADE
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
// Table: tarefas
//   FOREIGN KEY tarefas_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY tarefas_pkey: PRIMARY KEY (id)
//   CHECK tarefas_prioridade_check: CHECK ((prioridade = ANY (ARRAY[1, 2, 3])))
//   FOREIGN KEY tarefas_responsavel_id_fkey: FOREIGN KEY (responsavel_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: tarefas_concluidas
//   FOREIGN KEY tarefas_concluidas_criado_por_fkey: FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY tarefas_concluidas_funcionario_id_fkey: FOREIGN KEY (funcionario_id) REFERENCES profiles(id) ON DELETE CASCADE
//   PRIMARY KEY tarefas_concluidas_pkey: PRIMARY KEY (id)
//   FOREIGN KEY tarefas_concluidas_tarefa_id_fkey: FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE

// --- ROW LEVEL SECURITY POLICIES ---
// Table: ajuste_ponto
//   Policy "ajuste_ponto_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
//   Policy "ajuste_ponto_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (usuario_id = auth.uid())
//   Policy "ajuste_ponto_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((usuario_id = auth.uid()) OR is_manager_or_admin())
//   Policy "ajuste_ponto_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
// Table: company_settings
//   Policy "company_settings_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "company_settings_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.access_level = ANY (ARRAY['total'::text, 'gerencia'::text])))))
// Table: fechamento_mensal
//   Policy "fechamento_mensal_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.access_level = ANY (ARRAY['total'::text, 'gerencia'::text])))))
//   Policy "fechamento_mensal_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.access_level = ANY (ARRAY['total'::text, 'gerencia'::text])))))
//   Policy "fechamento_mensal_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: feriados
//   Policy "feriados_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
//   Policy "feriados_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_manager_or_admin()
//   Policy "feriados_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "feriados_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
// Table: ferias
//   Policy "ferias_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
//   Policy "ferias_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_manager_or_admin()
//   Policy "ferias_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((profile_id = auth.uid()) OR is_manager_or_admin())
//   Policy "ferias_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
// Table: historico_alteracoes_ponto
//   Policy "historico_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_manager_or_admin()
//   Policy "historico_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
// Table: informativos
//   Policy "informativos_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
//   Policy "informativos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_manager_or_admin()
//   Policy "informativos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "informativos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: lancamentos_folha
//   Policy "lancamentos_folha_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
//   Policy "lancamentos_folha_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_manager_or_admin()
//   Policy "lancamentos_folha_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
//   Policy "lancamentos_folha_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
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
// Table: tarefas
//   Policy "tarefas_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
//   Policy "tarefas_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: is_manager_or_admin()
//   Policy "tarefas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "tarefas_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: is_manager_or_admin()
// Table: tarefas_concluidas
//   Policy "tarefas_concluidas_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: ((funcionario_id = auth.uid()) OR is_manager_or_admin())
//   Policy "tarefas_concluidas_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((funcionario_id = auth.uid()) OR is_manager_or_admin())
//   Policy "tarefas_concluidas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "tarefas_concluidas_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((funcionario_id = auth.uid()) OR is_manager_or_admin())

// --- DATABASE FUNCTIONS ---
// FUNCTION create_user_account(text, text, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric)
//   CREATE OR REPLACE FUNCTION public.create_user_account(p_email text, p_password text, p_name text, p_phone text, p_birth_date date, p_cpf text, p_zip_code text, p_address text, p_address_number text, p_complement text, p_neighborhood text, p_city text, p_role text, p_access_level text, p_admission_date date, p_base_salary numeric, p_schedules jsonb, p_permissions jsonb DEFAULT '{"cadastros": false, "historico": false, "operacional": false, "dashboard_principal": false, "dashboard_desempenho": false}'::jsonb, p_valor_vt numeric DEFAULT 0)
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
//       access_level, admission_date, base_salary, status, permissions, valor_vt
//     ) VALUES (
//       new_user_id, p_email, p_name, p_phone, p_birth_date, p_cpf, p_zip_code, p_address,
//       p_address_number, p_complement, p_neighborhood, p_city, p_role,
//       p_access_level, p_admission_date, p_base_salary, 'Ativo', p_permissions, p_valor_vt
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
// FUNCTION delete_user_account(uuid)
//   CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     DELETE FROM auth.users WHERE id = p_user_id;
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
// FUNCTION update_user_account(uuid, text, text, date, text, text, text, text, text, text, text, text, text, date, numeric, jsonb, jsonb, numeric)
//   CREATE OR REPLACE FUNCTION public.update_user_account(p_user_id uuid, p_name text, p_phone text, p_birth_date date, p_cpf text, p_zip_code text, p_address text, p_address_number text, p_complement text, p_neighborhood text, p_city text, p_role text, p_access_level text, p_admission_date date, p_base_salary numeric, p_schedules jsonb, p_permissions jsonb, p_valor_vt numeric DEFAULT 0)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     sched JSONB;
//   BEGIN
//     UPDATE public.profiles SET
//       name = p_name,
//       phone = p_phone,
//       birth_date = p_birth_date,
//       cpf = p_cpf,
//       zip_code = p_zip_code,
//       address = p_address,
//       address_number = p_address_number,
//       complement = p_complement,
//       neighborhood = p_neighborhood,
//       city = p_city,
//       role = p_role,
//       access_level = p_access_level,
//       admission_date = p_admission_date,
//       base_salary = p_base_salary,
//       permissions = p_permissions,
//       valor_vt = p_valor_vt,
//       updated_at = NOW()
//     WHERE id = p_user_id;
//
//     DELETE FROM public.schedules WHERE profile_id = p_user_id;
//
//     FOR sched IN SELECT * FROM jsonb_array_elements(p_schedules)
//     LOOP
//       INSERT INTO public.schedules (
//         profile_id, day_of_week, entry_time, lunch_start, lunch_end, exit_time
//       ) VALUES (
//         p_user_id,
//         (sched->>'day_of_week')::INT,
//         NULLIF(sched->>'entry_time', '')::TIME,
//         NULLIF(sched->>'lunch_start', '')::TIME,
//         NULLIF(sched->>'lunch_end', '')::TIME,
//         NULLIF(sched->>'exit_time', '')::TIME
//       );
//     END LOOP;
//   END;
//   $function$
//

// --- INDEXES ---
// Table: ajuste_ponto
//   CREATE INDEX ajuste_ponto_data_ponto_idx ON public.ajuste_ponto USING btree (data_ponto)
//   CREATE INDEX ajuste_ponto_status_idx ON public.ajuste_ponto USING btree (status)
//   CREATE INDEX ajuste_ponto_usuario_id_idx ON public.ajuste_ponto USING btree (usuario_id)
// Table: fechamento_mensal
//   CREATE UNIQUE INDEX fechamento_mensal_mes_ano_key ON public.fechamento_mensal USING btree (mes, ano)
// Table: ferias
//   CREATE INDEX ferias_profile_id_idx ON public.ferias USING btree (profile_id)
// Table: pontos
//   CREATE INDEX pontos_data_idx ON public.pontos USING btree (data)
//   CREATE UNIQUE INDEX pontos_nsr_key ON public.pontos USING btree (nsr)
//   CREATE INDEX pontos_profile_id_idx ON public.pontos USING btree (profile_id)
// Table: pontos_diarios
//   CREATE INDEX pontos_diarios_data_idx ON public.pontos_diarios USING btree (data)
//   CREATE INDEX pontos_diarios_profile_id_idx ON public.pontos_diarios USING btree (profile_id)
// Table: schedules
//   CREATE UNIQUE INDEX schedules_profile_id_day_of_week_key ON public.schedules USING btree (profile_id, day_of_week)
