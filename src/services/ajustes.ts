import { supabase } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'

export async function getPendingAjustes() {
  const { data, error } = await supabase
    .from('ajuste_ponto')
    .select('*, usuario:profiles!ajuste_ponto_usuario_id_fkey(id, name)')
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getMyAjustes(userId: string) {
  const { data, error } = await supabase
    .from('ajuste_ponto')
    .select('*')
    .eq('usuario_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

const TIPO_PONTO_MAP: Record<string, string> = {
  entrada: 'entrada',
  saida_almoco: 'almoço_saída',
  retorno_almoco: 'almoço_retorno',
  saida: 'saída',
}

const COL_MAP: Record<string, string> = {
  entrada: 'entrada',
  saida_almoco: 'saida_almoco',
  retorno_almoco: 'retorno_almoco',
  saida: 'saida',
}

function parseTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

async function createNotification(
  usuarioId: string,
  managerId: string,
  dataPonto: string,
  status: string,
) {
  const dataFormatada = format(parseISO(dataPonto), 'dd/MM/yyyy')
  const statusText = status === 'aprovado' ? 'aprovado' : 'reprovado'
  const { error } = await supabase.from('informativos').insert({
    titulo: 'Ajuste de Ponto Processado',
    mensagem: `Seu pedido de ajuste para o dia ${dataFormatada} foi ${statusText}.`,
    destinatarios: [usuarioId],
    criado_por: managerId,
    lido: false,
  })
  if (error) throw error
}

async function syncPontosDiarios(
  usuarioId: string,
  managerId: string,
  data: string,
  colName: string,
  horario: string,
) {
  const { data: diario } = await supabase
    .from('pontos_diarios')
    .select('*')
    .eq('profile_id', usuarioId)
    .eq('data', data)
    .maybeSingle()

  if (diario) {
    const updates: any = { [colName]: horario, tipo_registro: 'manual' }
    const tEntrada = colName === 'entrada' ? horario : diario.entrada
    const tSaidaAlmoco = colName === 'saida_almoco' ? horario : diario.saida_almoco
    const tRetornoAlmoco = colName === 'retorno_almoco' ? horario : diario.retorno_almoco
    const tSaida = colName === 'saida' ? horario : diario.saida

    if (tEntrada && tSaidaAlmoco && tRetornoAlmoco && tSaida) {
      updates.horas_calculadas =
        (parseTime(tSaidaAlmoco) -
          parseTime(tEntrada) +
          parseTime(tSaida) -
          parseTime(tRetornoAlmoco)) /
        60
    }

    const { error } = await supabase.from('pontos_diarios').update(updates).eq('id', diario.id)
    if (error) throw error
  } else {
    const insertObj: any = {
      profile_id: usuarioId,
      criado_por: managerId,
      data,
      tipo_registro: 'manual',
    }
    insertObj[colName] = horario
    const { error } = await supabase.from('pontos_diarios').insert(insertObj)
    if (error) throw error
  }
}

export async function approveAjuste(ajuste: any, managerId: string) {
  const { error: updateError } = await supabase
    .from('ajuste_ponto')
    .update({ status: 'aprovado', aprovado_por: managerId })
    .eq('id', ajuste.id)
  if (updateError) throw updateError

  const pontoTipo = TIPO_PONTO_MAP[ajuste.tipo_ponto] || ajuste.tipo_ponto
  const horario = ajuste.horario_solicitado
  const data = ajuste.data_ponto

  const { data: existing } = await supabase
    .from('pontos')
    .select('id, horario')
    .eq('profile_id', ajuste.usuario_id)
    .eq('data', data)
    .eq('tipo_ponto', pontoTipo)
    .maybeSingle()

  if (existing) {
    const { error: pontoError } = await supabase
      .from('pontos')
      .update({ horario, tipo_registro: 'manual' })
      .eq('id', existing.id)
    if (pontoError) throw pontoError

    await supabase.from('historico_alteracoes_ponto').insert({
      ponto_id: existing.id,
      alterado_por: managerId,
      coluna_alterada: 'horario',
      valor_anterior: existing.horario,
      valor_novo: horario,
    } as any)
  } else {
    const { data: newPonto, error: pontoError } = await supabase
      .from('pontos')
      .insert({
        profile_id: ajuste.usuario_id,
        criado_por: managerId,
        data,
        data_hora: new Date(`${data}T${horario}:00`).toISOString(),
        tipo_ponto: pontoTipo,
        horario,
        tipo_registro: 'manual',
        status_validacao: 'validado',
      })
      .select('id')
      .single()
    if (pontoError) throw pontoError

    if (newPonto) {
      await supabase.from('historico_alteracoes_ponto').insert({
        ponto_id: newPonto.id,
        alterado_por: managerId,
        coluna_alterada: 'horario',
        valor_anterior: null,
        valor_novo: horario,
      } as any)
    }
  }

  const colName = COL_MAP[ajuste.tipo_ponto] || ajuste.tipo_ponto
  await syncPontosDiarios(ajuste.usuario_id, managerId, data, colName, horario)

  await createNotification(ajuste.usuario_id, managerId, data, 'aprovado')
}

export async function rejectAjuste(ajuste: any, managerId: string) {
  const { error: updateError } = await supabase
    .from('ajuste_ponto')
    .update({ status: 'reprovado', aprovado_por: managerId })
    .eq('id', ajuste.id)
  if (updateError) throw updateError

  await createNotification(ajuste.usuario_id, managerId, ajuste.data_ponto, 'reprovado')
}
