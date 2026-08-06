import { supabase } from '@/lib/supabase/client'

export async function fetchPontoDiario(profileId: string, data: string) {
  const { data: record, error } = await supabase
    .from('pontos_diarios')
    .select('*')
    .eq('profile_id', profileId)
    .eq('data', data)
    .maybeSingle()
  return { record, error }
}

function parseTimeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

async function registrarPontoIndividual(
  profileId: string,
  data: string,
  dataHoraISO: string,
  tipoPonto: string,
  horario: string,
  tipoRegistro: string = 'automático',
) {
  const { error } = await supabase.from('pontos').insert({
    profile_id: profileId,
    criado_por: profileId,
    data,
    data_hora: dataHoraISO,
    tipo_ponto: tipoPonto,
    horario,
    tipo_registro: tipoRegistro,
    status_validacao: tipoRegistro === 'automático' ? 'validado' : null,
  })
  if (error) throw error
}

export async function registrarPonto({
  profileId,
  data,
  dataHora,
  tipoPonto,
  horario,
  fotoFile,
  latitude,
  longitude,
}: {
  profileId: string
  data: string
  dataHora: string
  tipoPonto: string
  horario: string
  fotoFile?: Blob
  latitude: number
  longitude: number
}) {
  let statusValidacao = null
  let toastMsg = null
  let toastVariant = 'default'

  let hasBancoHoras = false
  let almocoAutomatico = false
  let daySchedule: any = null

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('banco_horas_ativo, role, almoco_automatico')
      .eq('id', profileId)
      .single()

    hasBancoHoras = profile?.banco_horas_ativo === true
    almocoAutomatico = profile?.almoco_automatico === true
    const role = profile?.role

    const { data: checkFerias } = await supabase
      .from('ferias')
      .select('id')
      .eq('profile_id', profileId)
      .lte('data_inicio', data)
      .gte('data_fim', data)
      .neq('status', 'cancelada')
      .maybeSingle()

    if (checkFerias) {
      throw new Error('EM_FERIAS')
    }

    if (hasBancoHoras) {
      toastMsg = 'Ponto registrado com banco de horas ativo'
    }

    const now = new Date(dataHora)
    const dayOfWeek = now.getDay()
    const { data: schedule } = await supabase
      .from('schedules')
      .select('*')
      .eq('profile_id', profileId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle()

    daySchedule = schedule

    if (schedule) {
      const actualTime = parseTimeToMinutes(horario)

      if (!hasBancoHoras) {
        if (tipoPonto === 'entrada' && schedule.entry_time) {
          const expectedTime = parseTimeToMinutes(schedule.entry_time)
          const diff = actualTime - expectedTime

          if (diff < -20) {
            throw new Error('FORA_DO_HORARIO_PERMITIDO')
          } else if (diff >= -20 && diff < -5) {
            statusValidacao = `aviso_antecipado:${diff}`
            toastMsg = 'Ponto registrado antes do horário'
            toastVariant = 'warning'
          }
        } else if (tipoPonto === 'saída' && schedule.exit_time) {
          const expectedTime = parseTimeToMinutes(schedule.exit_time)
          const diff = actualTime - expectedTime

          const isTolerantRole = role === 'Diretor' || role === 'Sócio'

          if (!isTolerantRole && diff > 15) {
            throw new Error('LIMITE_SAIDA_EXCEDIDO')
          } else if (diff > 5 && diff <= 15) {
            statusValidacao = `aviso_atrasado:${diff}`
            toastMsg = 'Ponto registrado após o horário'
            toastVariant = 'warning'
          }
        }
      }
    }
  } catch (err: any) {
    if (err.message === 'FORA_DO_HORARIO_PERMITIDO') {
      throw err
    }
  }

  let foto_url = null
  if (fotoFile) {
    const fileName = `${profileId}/${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pontos_fotos')
      .upload(fileName, fotoFile)
    if (uploadData) {
      const {
        data: { publicUrl },
      } = supabase.storage.from('pontos_fotos').getPublicUrl(fileName)
      foto_url = publicUrl
    } else if (uploadError) {
      console.error('Failed to upload photo:', uploadError)
    }
  }

  const { error: err1 } = await supabase.from('pontos').insert({
    profile_id: profileId,
    criado_por: profileId,
    data,
    data_hora: dataHora,
    tipo_ponto: tipoPonto,
    horario,
    foto_url,
    latitude,
    longitude,
    status_validacao: statusValidacao,
  })

  if (err1) throw err1

  const { record } = await fetchPontoDiario(profileId, data)

  const colMap: Record<string, string> = {
    entrada: 'entrada',
    almoço_saída: 'saida_almoco',
    almoço_retorno: 'retorno_almoco',
    saída: 'saida',
  }
  const colName = colMap[tipoPonto]

  const updateHorasCalculadas = (
    tEntrada: string | null,
    tSaidaAlmoco: string | null,
    tRetornoAlmoco: string | null,
    tSaida: string | null,
  ) => {
    if (tEntrada && tSaidaAlmoco && tRetornoAlmoco && tSaida) {
      const m1 = parseTimeToMinutes(tEntrada)
      const m2 = parseTimeToMinutes(tSaidaAlmoco)
      const m3 = parseTimeToMinutes(tRetornoAlmoco)
      const m4 = parseTimeToMinutes(tSaida)
      const totalMinutes = m2 - m1 + (m4 - m3)
      return totalMinutes / 60
    }
    return null
  }

  if (record) {
    const updates: any = { [colName]: horario }

    const tEntrada = colName === 'entrada' ? horario : record.entrada
    const tSaidaAlmoco = colName === 'saida_almoco' ? horario : record.saida_almoco
    const tRetornoAlmoco = colName === 'retorno_almoco' ? horario : record.retorno_almoco
    const tSaida = colName === 'saida' ? horario : record.saida

    const horas = updateHorasCalculadas(tEntrada, tSaidaAlmoco, tRetornoAlmoco, tSaida)
    if (horas !== null) {
      updates.horas_calculadas = horas
    }

    const { error: err2 } = await supabase
      .from('pontos_diarios')
      .update(updates)
      .eq('id', record.id)
    if (err2) throw err2
  } else {
    const { error: err3 } = await supabase.from('pontos_diarios').insert({
      profile_id: profileId,
      criado_por: profileId,
      data,
      [colName]: horario,
      tipo_registro: 'automático',
    })
    if (err3) throw err3
  }

  if (tipoPonto === 'entrada' && almocoAutomatico && daySchedule) {
    const lunchStart = daySchedule.lunch_start
    const lunchEnd = daySchedule.lunch_end

    if (lunchStart && lunchEnd) {
      const lunchStartStr = lunchStart.substring(0, 5)
      const lunchEndStr = lunchEnd.substring(0, 5)

      const [yy, mm, dd] = data.split('-')
      const lunchStartISO = new Date(`${yy}-${mm}-${dd}T${lunchStart}:00`).toISOString()
      const lunchEndISO = new Date(`${yy}-${mm}-${dd}T${lunchEnd}:00`).toISOString()

      await registrarPontoIndividual(
        profileId,
        data,
        lunchStartISO,
        'almoço_saída',
        lunchStartStr,
        'automático',
      )
      await registrarPontoIndividual(
        profileId,
        data,
        lunchEndISO,
        'almoço_retorno',
        lunchEndStr,
        'automático',
      )

      const { record: updatedRecord } = await fetchPontoDiario(profileId, data)
      if (updatedRecord) {
        const tEntrada = updatedRecord.entrada
        const horas = updateHorasCalculadas(
          tEntrada,
          lunchStartStr,
          lunchEndStr,
          updatedRecord.saida,
        )
        const { error: errLunch } = await supabase
          .from('pontos_diarios')
          .update({
            saida_almoco: lunchStartStr,
            retorno_almoco: lunchEndStr,
            ...(horas !== null ? { horas_calculadas: horas } : {}),
          })
          .eq('id', updatedRecord.id)
        if (errLunch) throw errLunch
      }

      toastMsg = toastMsg
        ? `${toastMsg}. Almoço registrado automaticamente (${lunchStartStr} - ${lunchEndStr})`
        : `Almoço registrado automaticamente (${lunchStartStr} - ${lunchEndStr})`
    }
  }

  return { toastMsg, toastVariant }
}
