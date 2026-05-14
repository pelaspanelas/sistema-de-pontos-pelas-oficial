import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export const getTarefas = async (mesAno: string) => {
  const [year, month] = mesAno.split('-')
  const startDate = new Date(Number(year), Number(month) - 1, 1)
  const endDate = new Date(Number(year), Number(month), 0)

  const { data, error } = await supabase
    .from('tarefas')
    .select('*, responsavel:profiles(id, name)')
    .gte('data', format(startDate, 'yyyy-MM-dd'))
    .lte('data', format(endDate, 'yyyy-MM-dd'))
    .order('data', { ascending: true })

  return { data, error }
}

export const createTarefa = async (tarefa: any) => {
  const { data, error } = await supabase.from('tarefas').insert([tarefa]).select().single()
  return { data, error }
}

export const updateTarefa = async (id: string, tarefa: any) => {
  const { data, error } = await supabase
    .from('tarefas')
    .update(tarefa)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const deleteTarefa = async (id: string) => {
  const { error } = await supabase.from('tarefas').delete().eq('id', id)
  return { error }
}

export const createInformativo = async (informativo: any) => {
  const { data, error } = await supabase
    .from('informativos')
    .insert([informativo])
    .select()
    .single()
  return { data, error }
}

export const getFuncionarios = async () => {
  const { data, error } = await supabase.from('profiles').select('id, name').order('name')
  return { data, error }
}
