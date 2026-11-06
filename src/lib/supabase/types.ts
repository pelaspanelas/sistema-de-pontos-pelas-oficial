// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
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
            foreignKeyName: "ajuste_ponto_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajuste_ponto_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          created_at: string
          holerite_copies: number | null
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          holerite_copies?: number | null
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          holerite_copies?: number | null
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
            foreignKeyName: "fechamento_mensal_fechado_por_fkey"
            columns: ["fechado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "feriados_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "ferias_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "historico_alteracoes_ponto_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_alteracoes_ponto_ponto_id_fkey"
            columns: ["ponto_id"]
            isOneToOne: false
            referencedRelation: "pontos"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_competencia_folha: {
        Row: {
          ano: number
          base_salary: number
          cpf: string | null
          created_at: string
          id: string
          mes: number
          name: string | null
          profile_id: string
          role: string | null
          valor_vt: number
        }
        Insert: {
          ano: number
          base_salary?: number
          cpf?: string | null
          created_at?: string
          id?: string
          mes: number
          name?: string | null
          profile_id: string
          role?: string | null
          valor_vt?: number
        }
        Update: {
          ano?: number
          base_salary?: number
          cpf?: string | null
          created_at?: string
          id?: string
          mes?: number
          name?: string | null
          profile_id?: string
          role?: string | null
          valor_vt?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_competencia_folha_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "lancamentos_folha_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          created_at: string
          endereco: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      payslip_envios: {
        Row: {
          ano: number
          canal: string
          created_at: string
          enviado_por: string | null
          id: string
          mes: number
          profile_id: string
        }
        Insert: {
          ano: number
          canal: string
          created_at?: string
          enviado_por?: string | null
          id?: string
          mes: number
          profile_id: string
        }
        Update: {
          ano?: number
          canal?: string
          created_at?: string
          enviado_por?: string | null
          id?: string
          mes?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslip_envios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          device_id: string | null
          face_match_score: number | null
          foto_url: string | null
          horario: string
          id: string
          latitude: number | null
          longitude: number | null
          metodo_auth: string
          nsr: number
          origem: string
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
          device_id?: string | null
          face_match_score?: number | null
          foto_url?: string | null
          horario: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metodo_auth?: string
          nsr?: number
          origem?: string
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
          device_id?: string | null
          face_match_score?: number | null
          foto_url?: string | null
          horario?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metodo_auth?: string
          nsr?: number
          origem?: string
          profile_id?: string
          status_validacao?: string | null
          tipo_ponto?: string
          tipo_registro?: string | null
          updated_at?: string
          wifi_conectado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pontos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "tablets_ponto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_diarios: {
        Row: {
          created_at: string
          criado_por: string
          data: string
          device_id: string | null
          entrada: string | null
          horas_calculadas: number | null
          id: string
          metodo_auth: string
          origem: string
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
          device_id?: string | null
          entrada?: string | null
          horas_calculadas?: number | null
          id?: string
          metodo_auth?: string
          origem?: string
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
          device_id?: string | null
          entrada?: string | null
          horas_calculadas?: number | null
          id?: string
          metodo_auth?: string
          origem?: string
          profile_id?: string
          retorno_almoco?: string | null
          saida?: string | null
          saida_almoco?: string | null
          tipo_registro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_diarios_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_diarios_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "tablets_ponto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_diarios_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_level: string | null
          address: string | null
          address_number: string | null
          admission_date: string | null
          almoco_automatico: boolean
          avatar_url: string | null
          banco_horas_ativo: boolean
          base_salary: number | null
          birth_date: string | null
          city: string | null
          complement: string | null
          cpf: string | null
          created_at: string
          email: string
          entra_folha: boolean
          id: string
          loja_id: string | null
          name: string
          neighborhood: string | null
          permissions: Json | null
          phone: string | null
          pin_ponto: string | null
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
          almoco_automatico?: boolean
          avatar_url?: string | null
          banco_horas_ativo?: boolean
          base_salary?: number | null
          birth_date?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          entra_folha?: boolean
          id: string
          loja_id?: string | null
          name: string
          neighborhood?: string | null
          permissions?: Json | null
          phone?: string | null
          pin_ponto?: string | null
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
          almoco_automatico?: boolean
          avatar_url?: string | null
          banco_horas_ativo?: boolean
          base_salary?: number | null
          birth_date?: string | null
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          entra_folha?: boolean
          id?: string
          loja_id?: string | null
          name?: string
          neighborhood?: string | null
          permissions?: Json | null
          phone?: string | null
          pin_ponto?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
          valor_vt?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "schedules_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tablets_ponto: {
        Row: {
          ativo: boolean
          created_at: string
          device_token: string
          id: string
          nome_dispositivo: string
          pin_attempts: number
          pin_blocked_until: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          device_token: string
          id?: string
          nome_dispositivo: string
          pin_attempts?: number
          pin_blocked_until?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          device_token?: string
          id?: string
          nome_dispositivo?: string
          pin_attempts?: number
          pin_blocked_until?: string | null
        }
        Relationships: []
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
            foreignKeyName: "tarefas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            foreignKeyName: "tarefas_concluidas_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_concluidas_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_profile_data: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
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
          p_entra_folha?: boolean
          p_loja_id?: string
          p_name: string
          p_neighborhood: string
          p_password: string
          p_permissions?: Json
          p_phone: string
          p_pin_ponto?: string
          p_role: string
          p_schedules: Json
          p_valor_vt?: number
          p_zip_code: string
        }
        Returns: string
      }
      current_user_loja_id: { Args: never; Returns: string }
      delete_user_account: { Args: { p_user_id: string }; Returns: undefined }
      is_manager_or_admin: { Args: never; Returns: boolean }
      update_user_account: {
        Args: {
          p_access_level: string
          p_address: string
          p_address_number: string
          p_admission_date: string
          p_almoco_automatico?: boolean
          p_base_salary: number
          p_birth_date: string
          p_city: string
          p_complement: string
          p_cpf: string
          p_entra_folha?: boolean
          p_loja_id?: string
          p_name: string
          p_neighborhood: string
          p_permissions: Json
          p_phone: string
          p_pin_ponto?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

