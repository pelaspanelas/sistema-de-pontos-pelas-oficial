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

  if (record) {
    const updates: any = { [colName]: horario }

    const tEntrada = colName === 'entrada' ? horario : record.entrada
    const tSaidaAlmoco = colName === 'saida_almoco' ? horario : record.saida_almoco
    const tRetornoAlmoco = colName === 'retorno_almoco' ? horario : record.retorno_almoco
    const tSaida = colName === 'saida' ? horario : record.saida

    if (tEntrada && tSaidaAlmoco && tRetornoAlmoco && tSaida) {
      const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
      }
      const m1 = parseTime(tEntrada)
      const m2 = parseTime(tSaidaAlmoco)
      const m3 = parseTime(tRetornoAlmoco)
      const m4 = parseTime(tSaida)

      const totalMinutes = m2 - m1 + (m4 - m3)
      updates.horas_calculadas = totalMinutes / 60
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
}
