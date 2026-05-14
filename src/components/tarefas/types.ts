export type Task = {
  id: string
  titulo: string
  descricao?: string
  data: string
  responsavel_id: string
  responsavel: { name: string }
  quantidade_meta: string
  prioridade: number
  data_vencimento?: string | null
  tipo_repeticao: string
  dias_semana?: number[] | null
  dia_mes?: number | null
  ativo?: boolean
}

export type Employee = {
  id: string
  name: string
}

export const PRIORITIES: Record<number, { label: string; color: string }> = {
  1: { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
  2: { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  3: { label: 'Alta', color: 'bg-red-100 text-red-800' },
}
