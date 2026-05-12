export interface ScheduleFormState {
  day_of_week: number
  entry_time: string
  lunch_start: string
  lunch_end: string
  exit_time: string
}

export interface ColaboradorFormState {
  nome: string
  telefone: string
  dataNascimento: string
  cpf: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  email: string
  senha?: string
  cargo: string
  acesso: string
  dataAdmissao: string
  salarioBase: string
  schedules: ScheduleFormState[]
}
