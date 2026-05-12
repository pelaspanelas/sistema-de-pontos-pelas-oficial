export const MOCK_USERS = {
  ana: { id: '1', name: 'Ana Silva', email: 'ana@pelas.com', role: 'admin', initials: 'AS' },
  carlos: {
    id: '2',
    name: 'Carlos Oliveira',
    email: 'carlos@pelas.com',
    role: 'gerente',
    initials: 'CO',
  },
  mariana: {
    id: '3',
    name: 'Mariana Santos',
    email: 'mariana@pelas.com',
    role: 'colaborador',
    initials: 'MS',
  },
}

export const CURRENT_USER = MOCK_USERS.carlos // Assuming manager for demo purposes

export const DASHBOARD_METRICS = {
  equipe: { presentes: 45, total: 47 },
  atrasos: 3,
  horasExtras: '12h',
  folgas: 5,
}

export const PRESENCA_SEMANA_DATA = [
  { day: 'Seg', presentes: 45, ausentes: 2 },
  { day: 'Ter', presentes: 46, ausentes: 1 },
  { day: 'Qua', presentes: 44, ausentes: 3 },
  { day: 'Qui', presentes: 47, ausentes: 0 },
  { day: 'Sex', presentes: 45, ausentes: 2 },
  { day: 'Sáb', presentes: 40, ausentes: 7 },
  { day: 'Dom', presentes: 35, ausentes: 12 },
]

export const EVOLUCAO_HORAS_EXTRAS_DATA = [
  { semana: 'Sem 1', horas: 40 },
  { semana: 'Sem 2', horas: 35 },
  { semana: 'Sem 3', horas: 55 },
  { semana: 'Sem 4', horas: 20 },
]

export const ESPELHO_PONTO_DATA = [
  {
    date: '12/05/2026',
    ent1: '08:00',
    sai1: '12:00',
    ent2: '13:00',
    sai2: '17:00',
    total: '08:00',
    saldo: '+00:00',
  },
  {
    date: '11/05/2026',
    ent1: '08:15',
    sai1: '12:00',
    ent2: '13:00',
    sai2: '17:30',
    total: '08:15',
    saldo: '+00:15',
  },
  {
    date: '10/05/2026',
    ent1: '07:50',
    sai1: '12:00',
    ent2: '13:00',
    sai2: '16:50',
    total: '08:00',
    saldo: '+00:00',
  },
  {
    date: '09/05/2026',
    ent1: '08:00',
    sai1: '12:00',
    ent2: '13:00',
    sai2: '17:00',
    total: '08:00',
    saldo: '+00:00',
  },
  {
    date: '08/05/2026',
    ent1: '08:00',
    sai1: '12:00',
    ent2: '13:00',
    sai2: '18:00',
    total: '09:00',
    saldo: '+01:00',
  },
]

export const COLABORADORES_DATA = [
  {
    id: 1,
    name: 'Mara Carolina Simonelli',
    role: 'DIRETORA RH',
    email: 'mara.simonelli@hotmail.com',
    phone: '(11) 93341-2051',
    city: 'Santo André',
    status: 'Ativo',
    initials: 'MA',
    avatar: null,
  },
  {
    id: 2,
    name: "Wagner Alberto D'Angelo",
    role: 'CEO',
    email: 'admin@pelaspanelas.com.br',
    phone: '(11) 97087-7191',
    city: 'São Bernardo do Campo',
    status: 'Ativo',
    initials: 'WA',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
  },
  {
    id: 3,
    name: 'Carlos Oliveira',
    role: 'GERENTE DE OPERAÇÕES',
    email: 'carlos@pelas.com',
    phone: '(11) 98888-7777',
    city: 'São Paulo',
    status: 'Ativo',
    initials: 'CO',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=2',
  },
  {
    id: 4,
    name: 'João Pedro Santos',
    role: 'GARÇOM',
    email: 'joao.santos@pelas.com',
    phone: '(11) 95555-4444',
    city: 'São Caetano do Sul',
    status: 'Inativo',
    initials: 'JP',
    avatar: null,
  },
]
