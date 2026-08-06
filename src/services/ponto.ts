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

function calcHorasCalculadas(
  tEntrada: string | null,
  tSaidaAlmoco: string | null,
  tRetornoAlmoco: string | null,
  tSaida: string | null,
) {
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
  let almocoAutomaticoRegistrado = false
  let scheduleLunchMissing = false

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('banco_horas_ativo, role, almoco_automatico')
    .eq('id', profileId)
    .single()

  if (profileError) {
    console.error('[registrarPonto] Failed to fetch profile:', profileError)
    throw new Error('Falha ao buscar dados do colaborador: ' + profileError.message)
  }

  const hasBancoHoras = profile?.banco_horas_ativo === true
  const almocoAutomatico = profile?.almoco_automatico === true
  const role = profile?.role

  const { data: checkFerias, error: feriasError } = await supabase
    .from('ferias')
    .select('id')
    .eq('profile_id', profileId)
    .lte('data_inicio', data)
    .gte('data_fim', data)
    .neq('status', 'cancelada')
    .maybeSingle()

  if (feriasError) {
    console.error('[registrarPonto] Failed to check férias:', feriasError)
    throw new Error('Falha ao verificar período de férias: ' + feriasError.message)
  }

  if (checkFerias) {
    throw new Error('EM_FERIAS')
  }

  if (hasBancoHoras) {
    toastMsg = 'Ponto registrado com banco de horas ativo'
  }

  const now = new Date(dataHora)
  const dayOfWeek = now.getDay()
  const { data: daySchedule, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('profile_id', profileId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle()

  if (scheduleError) {
    console.error('[registrarPonto] Failed to fetch schedule:', scheduleError)
    throw new Error('Falha ao buscar horário cadastrado: ' + scheduleError.message)
  }

  if (daySchedule && !hasBancoHoras) {
    const actualTime = parseTimeToMinutes(horario)

    if (tipoPonto === 'entrada' && daySchedule.entry_time) {
      const expectedTime = parseTimeToMinutes(daySchedule.entry_time)
      const diff = actualTime - expectedTime

      if (diff < -20) {
        throw new Error('FORA_DO_HORARIO_PERMITIDO')
      } else if (diff >= -20 && diff < -5) {
        statusValidacao = `aviso_antecipado:${diff}`
        toastMsg = 'Ponto registrado antes do horário'
        toastVariant = 'warning'
      }
    } else if (tipoPonto === 'saída' && daySchedule.exit_time) {
      const expectedTime = parseTimeToMinutes(daySchedule.exit_time)
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
      console.error('[registrarPonto] Failed to upload photo:', uploadError)
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

  if (err1) {
    console.error('[registrarPonto] Failed to insert ponto:', err1)
    throw err1
  }

  const { record, error: fetchDiarioError } = await fetchPontoDiario(profileId, data)
  if (fetchDiarioError) {
    console.error('[registrarPonto] Failed to fetch pontos_diarios:', fetchDiarioError)
    throw new Error('Falha ao buscar registro diário de ponto: ' + fetchDiarioError.message)
  }

  const colMap: Record<string, string> = {
    entrada: 'entrada',
    almoço_saída: 'saida_almoco',
    almoço_retorno: 'retorno_almoco',
    saída: 'saida',
  }
  const colName = colMap[tipoPonto]

  if (record) {
    const updates: any = { [colName]: horario }

    const tEntrada = colName === 'entrada' ? horario : record.entrada
    const tSaidaAlmoco = colName === 'saida_almoco' ? horario : record.saida_almoco
    const tRetornoAlmoco = colName === 'retorno_almoco' ? horario : record.retorno_almoco
    const tSaida = colName === 'saida' ? horario : record.saida

    const horas = calcHorasCalculadas(tEntrada, tSaidaAlmoco, tRetornoAlmoco, tSaida)
    if (horas !== null) {
      updates.horas_calculadas = horas
    }

    const { error: err2 } = await supabase
      .from('pontos_diarios')
      .update(updates)
      .eq('id', record.id)
    if (err2) {
      console.error('[registrarPonto] Failed to update pontos_diarios:', err2)
      throw err2
    }
  } else {
    const { error: err3 } = await supabase.from('pontos_diarios').insert({
      profile_id: profileId,
      criado_por: profileId,
      data,
      [colName]: horario,
      tipo_registro: 'automático',
    })
    if (err3) {
      console.error('[registrarPonto] Failed to insert pontos_diarios:', err3)
      throw err3
    }
  }

  if (tipoPonto === 'entrada' && almocoAutomatico) {
    const lunchStart = daySchedule?.lunch_start
    const lunchEnd = daySchedule?.lunch_end

    if (lunchStart && lunchEnd) {
      const lunchStartStr = lunchStart.substring(0, 5)
      const lunchEndStr = lunchEnd.substring(0, 5)

      const [yy, mm, dd] = data.split('-')
      const lunchStartISO = new Date(`${yy}-${mm}-${dd}T${lunchStart}:00`).toISOString()
      const lunchEndISO = new Date(`${yy}-${mm}-${dd}T${lunchEnd}:00`).toISOString()

      try {
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

        const { record: updatedRecord, error: refetchError } = await fetchPontoDiario(
          profileId,
          data,
        )
        if (refetchError) {
          console.error(
            '[registrarPonto] Failed to refetch pontos_diarios after lunch:',
            refetchError,
          )
          throw refetchError
        }

        if (updatedRecord) {
          const tEntrada = updatedRecord.entrada
          const horas = calcHorasCalculadas(
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
          if (errLunch) {
            console.error(
              '[registrarPonto] Failed to update pontos_diarios with lunch times:',
              errLunch,
            )
            throw errLunch
          }
        }

        almocoAutomaticoRegistrado = true
        toastMsg = toastMsg
          ? `${toastMsg}. Almoço registrado automaticamente (${lunchStartStr} - ${lunchEndStr})`
          : `Almoço registrado automaticamente (${lunchStartStr} - ${lunchEndStr})`
      } catch (lunchErr: any) {
        console.error('[registrarPonto] Failed to register automatic lunch:', lunchErr)
        throw new Error('Falha ao registrar almoço automático: ' + lunchErr.message)
      }
    } else {
      scheduleLunchMissing = true
      console.warn(
        `[registrarPonto] almoco_automatico enabled but no lunch_start/lunch_end found for profile ${profileId} on day_of_week ${dayOfWeek}`,
      )
      toastMsg = toastMsg
        ? `${toastMsg}. Almoço automático não registrado: horário de almoço não cadastrado para este dia.`
        : 'Almoço automático não registrado: horário de almoço não cadastrado para este dia. Registre manualmente.'
      toastVariant = 'warning'
    }
  }

  return { toastMsg, toastVariant, almocoAutomaticoRegistrado, scheduleLunchMissing }
}
