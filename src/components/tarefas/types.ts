export type Task = {
  id: string
  title: string
  description?: string
  date: string
  dueDate?: string
  responsibleId: string
  responsibleName: string
  quantity: string
  priority: '1' | '2' | '3'
  repetition: string
  repetitionDays?: string[]
  repetitionMonthDay?: string
}

export const EMPLOYEES = [
  { id: '1', name: 'Ana Silva' },
  { id: '2', name: 'Carlos Oliveira' },
  { id: '3', name: 'Mariana Santos' },
]

export const PRIORITIES: Record<string, { label: string; color: string }> = {
  '1': { label: 'Baixa', color: 'bg-blue-100 text-blue-800' },
  '2': { label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  '3': { label: 'Alta', color: 'bg-red-100 text-red-800' },
}

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Limpar a cozinha',
    description: 'Limpeza geral pós-expediente',
    date: '2026-05-10',
    dueDate: '2026-05-10',
    responsibleId: '1',
    responsibleName: 'Ana Silva',
    quantity: '1x ao dia',
    priority: '3',
    repetition: 'Diária',
  },
  {
    id: '2',
    title: 'Estoque de Bebidas',
    description: 'Contar e repor',
    date: '2026-05-15',
    dueDate: '2026-05-15',
    responsibleId: '2',
    responsibleName: 'Carlos Oliveira',
    quantity: 'Total',
    priority: '2',
    repetition: 'Sem repetição',
  },
  {
    id: '3',
    title: 'Organizar mesas',
    description: '',
    date: '2026-05-20',
    dueDate: '2026-05-20',
    responsibleId: '3',
    responsibleName: 'Mariana Santos',
    quantity: 'Salão Principal',
    priority: '1',
    repetition: 'Sem repetição',
  },
]
