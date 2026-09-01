import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { AwsClient } from 'npm:aws4fetch'
import { corsHeaders } from './cors.ts'

interface LookupRequest {
  action: 'lookup'
  device_token: string
  pin: string
}

interface RegistrarRequest {
  action: 'registrar'
  device_token: string
  profile_id: string
  foto_base64: string
}

type RequestBody = LookupRequest | RegistrarRequest

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Helpers de Horário e Data no fuso de São Paulo (America/Sao_Paulo / UTC-3)
function getSaoPauloDateParts(d: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  })

  const parts = formatter.formatToParts(d)
  const map: Record<string, string> = {}
  for (const part of parts) {
    map[part.type] = part.value
  }

  // Obter o dia da semana numérico em SP (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
  const weekdayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  }).format(d)
  const weekdaysMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  const dayOfWeek = weekdaysMap[weekdayFmt] ?? d.getDay()

  const dateStr = `${map.year}-${map.month}-${map.day}`
  const timeStr = `${map.hour}:${map.minute}`

  return {
    dateStr,
    timeStr,
    dayOfWeek,
  }
}

// Converte string "HH:mm" ou "HH:mm:ss" em minutos desde 00:00
function timeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

// Calcula horas trabalhadas decimais a partir de entrada, saida_almoco, retorno_almoco e saida
function calcularHorasTrabalhadas(
  entrada: string | null,
  saidaAlmoco: string | null,
  retornoAlmoco: string | null,
  saida: string | null,
): number {
  const mEntrada = timeToMinutes(entrada)
  const mSaidaAlmoco = timeToMinutes(saidaAlmoco)
  const mRetornoAlmoco = timeToMinutes(retornoAlmoco)
  const mSaida = timeToMinutes(saida)

  if (mEntrada === null || mSaida === null) return 0

  let totalMinutos = 0
  if (mSaidaAlmoco !== null && mRetornoAlmoco !== null) {
    const manha = Math.max(0, mSaidaAlmoco - mEntrada)
    const tarde = Math.max(0, mSaida - mRetornoAlmoco)
    totalMinutos = manha + tarde
  } else {
    totalMinutos = Math.max(0, mSaida - mEntrada)
  }

  return Number((totalMinutos / 60).toFixed(4))
}

// Converte base64 (dataUrl ou raw) para Uint8Array
function base64ToUint8Array(base64Data: string): {
  bytes: Uint8Array
  contentType: string
  rawBase64: string
} {
  let raw = base64Data
  let contentType = 'image/jpeg'

  if (base64Data.includes(';base64,')) {
    const parts = base64Data.split(';base64,')
    const match = parts[0].match(/:(.*?)$/)
    if (match && match[1]) {
      contentType = match[1]
    }
    raw = parts[1]
  }

  const binaryStr = atob(raw)
  const len = binaryStr.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  return { bytes, contentType, rawBase64: raw }
}

// Helper para converter ArrayBuffer em string base64 padrão
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Reconhecimento facial em modo sombra (não bloqueante) com AWS Rekognition
async function compararFacialSombra(
  avatarUrl: string | null | undefined,
  targetRawBase64: string,
): Promise<number | null> {
  if (!avatarUrl || !avatarUrl.trim()) {
    return null
  }

  const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
  const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
  const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1'

  if (!awsAccessKeyId || !awsSecretAccessKey) {
    console.warn('Credenciais AWS não configuradas para comparação facial em modo sombra')
    return null
  }

  try {
    // 1. Download da foto de referência (SourceImage)
    const avatarResponse = await fetch(avatarUrl)
    if (!avatarResponse.ok) {
      console.warn(
        `Não foi possível baixar foto de referência de ${avatarUrl}: status ${avatarResponse.status}`,
      )
      return null
    }

    const avatarArrayBuffer = await avatarResponse.arrayBuffer()
    const sourceBase64 = arrayBufferToBase64(avatarArrayBuffer)

    // 2. Inicializa o cliente aws4fetch
    const aws = new AwsClient({
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      region: awsRegion,
      service: 'rekognition',
    })

    const rekognitionEndpoint = `https://rekognition.${awsRegion}.amazonaws.com/`

    const requestBody = {
      SourceImage: {
        Bytes: sourceBase64,
      },
      TargetImage: {
        Bytes: targetRawBase64,
      },
      SimilarityThreshold: 0,
    }

    const response = await aws.fetch(rekognitionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'RekognitionService.CompareFaces',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn('AWS Rekognition retornou erro não bloqueante:', response.status, errorText)

      // Verificar se o erro indica especificamente que nenhum rosto foi detectado na imagem de origem ou destino
      // Exemplos de erro do Rekognition:
      // {"__type":"InvalidParameterException","Message":"There are no faces in the image."}
      // {"__type":"InvalidParameterException","Message":"SourceImage face not detected."}
      // {"__type":"InvalidParameterException","Message":"TargetImage face not detected."}
      try {
        const errorJson = JSON.parse(errorText)
        const errorType = errorJson.__type || errorJson.code || errorJson.name || ''
        const errorMsg = (errorJson.Message || errorJson.message || errorText).toLowerCase()

        const isFaceNotDetected =
          errorType.includes('InvalidParameterException') &&
          (errorMsg.includes('no face') ||
            errorMsg.includes('not detected') ||
            errorMsg.includes('face not') ||
            errorMsg.includes('faces in the image') ||
            errorMsg.includes('sem rosto') ||
            errorMsg.includes('nenhum rosto'))

        // Também verificar se a mensagem em texto puro contém menção explícita de ausência de face
        const textLower = errorText.toLowerCase()
        const isGenericFaceNotDetected =
          textLower.includes('there are no faces') ||
          textLower.includes('no faces in the image') ||
          textLower.includes('face not detected') ||
          textLower.includes('no faces detected') ||
          textLower.includes('sourceimage face not detected') ||
          textLower.includes('targetimage face not detected')

        if (isFaceNotDetected || isGenericFaceNotDetected) {
          console.info('AWS Rekognition: nenhum rosto detectado na foto (-1)')
          return -1
        }
      } catch {
        const textLower = errorText.toLowerCase()
        if (
          textLower.includes('there are no faces') ||
          textLower.includes('no faces in the image') ||
          textLower.includes('face not detected') ||
          textLower.includes('no faces detected') ||
          textLower.includes('sourceimage face not detected') ||
          textLower.includes('targetimage face not detected')
        ) {
          console.info('AWS Rekognition: nenhum rosto detectado na foto (-1)')
          return -1
        }
      }

      return null
    }

    const data = await response.json()
    const faceMatches = data.FaceMatches

    if (Array.isArray(faceMatches) && faceMatches.length > 0) {
      // Pega a maior similaridade entre as correspondências encontradas
      let maxSimilarity = 0
      for (const match of faceMatches) {
        if (typeof match.Similarity === 'number' && match.Similarity > maxSimilarity) {
          maxSimilarity = match.Similarity
        }
      }
      return maxSimilarity
    }

    // Se a AWS respondeu sem erro mas sem FaceMatches (rosto não bateu ou não foi detectado correspondente)
    return 0
  } catch (faceErr) {
    console.warn(
      'Erro ao processar comparação facial em modo sombra (ignorado com sucesso):',
      faceErr,
    )

    // Se porventura a exceção lançada contiver a mensagem de face não detectada
    const errMessage = (faceErr instanceof Error ? faceErr.message : String(faceErr)).toLowerCase()
    if (
      errMessage.includes('there are no faces') ||
      errMessage.includes('no faces in the image') ||
      errMessage.includes('face not detected') ||
      errMessage.includes('no faces detected') ||
      errMessage.includes('sourceimage face not detected') ||
      errMessage.includes('targetimage face not detected')
    ) {
      return -1
    }

    return null
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Configuração do servidor Supabase ausente' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const body: RequestBody = await req.json().catch(() => ({}) as RequestBody)

    if (!body || !body.action) {
      return new Response(
        JSON.stringify({ error: 'Parâmetro "action" é obrigatório (lookup ou registrar)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // =========================================================================
    // MODO LOOKUP: Validação de PIN e busca de perfil para confirmação
    // =========================================================================
    if (body.action === 'lookup') {
      const { device_token, pin } = body

      if (!device_token) {
        return new Response(JSON.stringify({ error: 'device_token é obrigatório' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      if (!pin) {
        return new Response(JSON.stringify({ error: 'pin é obrigatório' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // 1. Busca tablet autorizado e ativo
      const { data: tablet, error: tabletError } = await supabase
        .from('tablets_ponto')
        .select('*')
        .eq('device_token', device_token)
        .eq('ativo', true)
        .maybeSingle()

      if (tabletError || !tablet) {
        return new Response(
          JSON.stringify({
            error: 'Tablet não autorizado',
            code: 'TABLET_NOT_AUTHORIZED',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        )
      }

      // 2. Verifica se o tablet está temporariamente bloqueado por tentativas
      const now = new Date()
      if (tablet.pin_blocked_until) {
        const blockedUntil = new Date(tablet.pin_blocked_until)
        if (blockedUntil > now) {
          const segundosRestantes = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000)
          return new Response(
            JSON.stringify({
              error: `Muitas tentativas, aguarde ${segundosRestantes} segundos`,
              code: 'PIN_BLOCKED',
              retry_after_seconds: segundosRestantes,
            }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            },
          )
        }
      }

      // 3. Busca colaborador ativo pelo PIN
      const pinLimpo = String(pin).trim()
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, role, status, pin_ponto')
        .eq('pin_ponto', pinLimpo)
        .eq('status', 'Ativo')
        .maybeSingle()

      // 4. Se não encontrar o colaborador
      if (profileError || !profile) {
        const currentAttempts = (tablet.pin_attempts || 0) + 1

        if (currentAttempts >= 5) {
          // Bloqueia por 1 minuto e zera tentativas
          const blockDate = new Date(Date.now() + 60 * 1000).toISOString()
          await supabase
            .from('tablets_ponto')
            .update({
              pin_attempts: 0,
              pin_blocked_until: blockDate,
            })
            .eq('id', tablet.id)

          return new Response(
            JSON.stringify({
              error: 'Muitas tentativas, aguarde 60 segundos',
              code: 'PIN_BLOCKED',
              retry_after_seconds: 60,
            }),
            {
              status: 429,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            },
          )
        } else {
          // Incrementa tentativas
          await supabase
            .from('tablets_ponto')
            .update({ pin_attempts: currentAttempts })
            .eq('id', tablet.id)

          return new Response(
            JSON.stringify({
              error: 'PIN inválido',
              code: 'PIN_INVALID',
              attempts_left: 5 - currentAttempts,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            },
          )
        }
      }

      // 5. Encontrou: zera tentativas e limpa bloqueio
      await supabase
        .from('tablets_ponto')
        .update({
          pin_attempts: 0,
          pin_blocked_until: null,
        })
        .eq('id', tablet.id)

      return new Response(
        JSON.stringify({
          profile_id: profile.id,
          nome: profile.name,
          avatar_url: profile.avatar_url,
          role: profile.role,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // =========================================================================
    // MODO REGISTRAR: Upload de foto e gravação de batida de ponto
    // =========================================================================
    if (body.action === 'registrar') {
      const { device_token, profile_id, foto_base64 } = body

      if (!device_token) {
        return new Response(JSON.stringify({ error: 'device_token é obrigatório' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      if (!profile_id) {
        return new Response(JSON.stringify({ error: 'profile_id é obrigatório' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      if (!foto_base64) {
        return new Response(JSON.stringify({ error: 'foto_base64 é obrigatória' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // 1. Revalida device_token ativo
      const { data: tablet, error: tabletError } = await supabase
        .from('tablets_ponto')
        .select('*')
        .eq('device_token', device_token)
        .eq('ativo', true)
        .maybeSingle()

      if (tabletError || !tablet) {
        return new Response(
          JSON.stringify({
            error: 'Tablet não autorizado',
            code: 'TABLET_NOT_AUTHORIZED',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        )
      }

      // Busca perfil do colaborador
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, status, almoco_automatico, avatar_url')
        .eq('id', profile_id)
        .maybeSingle()

      if (profileError || !profile) {
        return new Response(JSON.stringify({ error: 'Colaborador não encontrado' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      if (profile.status !== 'Ativo') {
        return new Response(JSON.stringify({ error: 'Colaborador inativo no sistema' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // Horário e data de referência no fuso de São Paulo
      const { dateStr: dataHoje, timeStr: horarioAtual, dayOfWeek } = getSaoPauloDateParts()
      const dataHoraIso = new Date().toISOString()
      const timestampMs = Date.now()

      // 2. Busca registro diário existente de hoje
      const { data: pontoDiario, error: diarioError } = await supabase
        .from('pontos_diarios')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('data', dataHoje)
        .maybeSingle()

      if (diarioError && diarioError.code !== 'PGRST116') {
        console.error('Erro ao consultar pontos_diarios:', diarioError)
      }

      const registrosDoDia = pontoDiario
        ? {
            entrada: pontoDiario.entrada || null,
            saida_almoco: pontoDiario.saida_almoco || null,
            retorno_almoco: pontoDiario.retorno_almoco || null,
            saida: pontoDiario.saida || null,
          }
        : null

      // 3. Checagem de Férias ativas (tabela ferias)
      const { data: feriasAtivas } = await supabase
        .from('ferias')
        .select('id, data_inicio, data_fim, status')
        .eq('profile_id', profile.id)
        .lte('data_inicio', dataHoje)
        .gte('data_fim', dataHoje)
        .neq('status', 'cancelada')
        .maybeSingle()

      if (feriasAtivas) {
        return new Response(
          JSON.stringify({
            error: `Colaborador está em período de férias de ${feriasAtivas.data_inicio} até ${feriasAtivas.data_fim}.`,
            code: 'FERIAS_ATIVAS',
            is_business_error: true,
            nome_colaborador: profile.name,
            registros_dia: registrosDoDia,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        )
      }

      // 4. Determinação do próximo tipo de ponto
      let tipoPonto = ''
      let tipoPontoDescricao = ''
      const almocoAuto = !!profile.almoco_automatico

      if (!pontoDiario || !pontoDiario.entrada) {
        tipoPonto = 'entrada'
        tipoPontoDescricao = 'Entrada'
      } else if (almocoAuto) {
        // Se almoco_automatico for true, o colaborador só bate entrada e saída
        if (!pontoDiario.saida) {
          tipoPonto = 'saída'
          tipoPontoDescricao = 'Saída'
        } else {
          return new Response(
            JSON.stringify({
              error: 'Todos os pontos do dia já foram registrados.',
              code: 'PONTOS_COMPLETOS',
              is_business_error: true,
              nome_colaborador: profile.name,
              registros_dia: registrosDoDia,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            },
          )
        }
      } else {
        // Fluxo manual completo (4 batidas)
        if (!pontoDiario.saida_almoco) {
          tipoPonto = 'almoço_saída'
          tipoPontoDescricao = 'Saída para Almoço'
        } else if (!pontoDiario.retorno_almoco) {
          tipoPonto = 'almoço_retorno'
          tipoPontoDescricao = 'Retorno do Almoço'
        } else if (!pontoDiario.saida) {
          tipoPonto = 'saída'
          tipoPontoDescricao = 'Saída'
        } else {
          return new Response(
            JSON.stringify({
              error: 'Todos os pontos do dia já foram registrados.',
              code: 'PONTOS_COMPLETOS',
              is_business_error: true,
              nome_colaborador: profile.name,
              registros_dia: registrosDoDia,
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            },
          )
        }
      }

      // 5. Upload da foto para o bucket pontos_fotos: {profile_id}/{timestamp}.jpg
      const { bytes, contentType, rawBase64 } = base64ToUint8Array(foto_base64)
      const filePath = `${profile.id}/${timestampMs}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('pontos_fotos')
        .upload(filePath, bytes, {
          contentType,
          upsert: true,
        })

      if (uploadError) {
        console.error('Erro no upload da foto do ponto:', uploadError)
        return new Response(
          JSON.stringify({ error: 'Falha ao salvar foto do ponto: ' + uploadError.message }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        )
      }

      const { data: urlData } = supabase.storage.from('pontos_fotos').getPublicUrl(filePath)
      const fotoUrl = urlData?.publicUrl || null

      // 5.1 Reconhecimento facial em modo sombra (não bloqueante)
      const faceMatchScore = await compararFacialSombra(profile.avatar_url, rawBase64)

      // 6. Inserção na tabela pontos (batida principal com foto e score de similaridade facial)
      const { error: pontoInsertError } = await supabase.from('pontos').insert({
        profile_id: profile.id,
        criado_por: profile.id,
        data: dataHoje,
        data_hora: dataHoraIso,
        tipo_ponto: tipoPonto,
        horario: horarioAtual,
        foto_url: fotoUrl,
        face_match_score: faceMatchScore,
        origem: 'tablet_recepcao',
        device_id: tablet.id,
        metodo_auth: 'pin',
        tipo_registro: 'automático',
      })

      if (pontoInsertError) {
        console.error('Erro ao inserir ponto:', pontoInsertError)
        return new Response(
          JSON.stringify({ error: 'Erro ao registrar batida: ' + pontoInsertError.message }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        )
      }

      // 7. Atualização / Inserção em pontos_diarios e tratamento de almoço automático
      if (!pontoDiario) {
        // Criando o registro diário na entrada
        let saidaAlmocoVal: string | null = null
        let retornoAlmocoVal: string | null = null

        // Se o colaborador tiver almoço automático, buscar os horários de almoço na tabela schedules
        if (almocoAuto) {
          const { data: schedule } = await supabase
            .from('schedules')
            .select('lunch_start, lunch_end')
            .eq('profile_id', profile.id)
            .eq('day_of_week', dayOfWeek)
            .maybeSingle()

          if (schedule?.lunch_start && schedule?.lunch_end) {
            saidaAlmocoVal = schedule.lunch_start.slice(0, 5)
            retornoAlmocoVal = schedule.lunch_end.slice(0, 5)

            // Criar também as batidas automáticas de almoço na tabela pontos
            // Almoço Saída
            await supabase.from('pontos').insert({
              profile_id: profile.id,
              criado_por: profile.id,
              data: dataHoje,
              data_hora: `${dataHoje}T${saidaAlmocoVal}:00.000Z`,
              tipo_ponto: 'almoço_saída',
              horario: saidaAlmocoVal,
              status_validacao: 'validado',
              origem: 'tablet_recepcao',
              device_id: tablet.id,
              metodo_auth: 'pin',
              tipo_registro: 'automático',
            })

            // Almoço Retorno
            await supabase.from('pontos').insert({
              profile_id: profile.id,
              criado_por: profile.id,
              data: dataHoje,
              data_hora: `${dataHoje}T${retornoAlmocoVal}:00.000Z`,
              tipo_ponto: 'almoço_retorno',
              horario: retornoAlmocoVal,
              status_validacao: 'validado',
              origem: 'tablet_recepcao',
              device_id: tablet.id,
              metodo_auth: 'pin',
              tipo_registro: 'automático',
            })
          }
        }

        const horas = calcularHorasTrabalhadas(horarioAtual, saidaAlmocoVal, retornoAlmocoVal, null)

        const { error: insertDiarioError } = await supabase.from('pontos_diarios').insert({
          profile_id: profile.id,
          criado_por: profile.id,
          data: dataHoje,
          entrada: horarioAtual,
          saida_almoco: saidaAlmocoVal,
          retorno_almoco: retornoAlmocoVal,
          saida: null,
          horas_calculadas: horas,
          origem: 'tablet_recepcao',
          device_id: tablet.id,
          metodo_auth: 'pin',
          tipo_registro: 'automático',
        })

        if (insertDiarioError) {
          console.error('Erro ao inserir pontos_diarios:', insertDiarioError)
        }
      } else {
        // Atualizando registro diário existente
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
          origem: 'tablet_recepcao',
          device_id: tablet.id,
          metodo_auth: 'pin',
        }

        let novaEntrada = pontoDiario.entrada
        let novaSaidaAlmoco = pontoDiario.saida_almoco
        let novoRetornoAlmoco = pontoDiario.retorno_almoco
        let novaSaida = pontoDiario.saida

        if (tipoPonto === 'almoço_saída') {
          updateData.saida_almoco = horarioAtual
          novaSaidaAlmoco = horarioAtual
        } else if (tipoPonto === 'almoço_retorno') {
          updateData.retorno_almoco = horarioAtual
          novoRetornoAlmoco = horarioAtual
        } else if (tipoPonto === 'saída') {
          updateData.saida = horarioAtual
          novaSaida = horarioAtual
        }

        // Se for saída ou estiver preenchendo o ciclo, recalcula horas
        const horas = calcularHorasTrabalhadas(
          novaEntrada,
          novaSaidaAlmoco,
          novoRetornoAlmoco,
          novaSaida,
        )
        updateData.horas_calculadas = horas

        const { error: updateDiarioError } = await supabase
          .from('pontos_diarios')
          .update(updateData)
          .eq('id', pontoDiario.id)

        if (updateDiarioError) {
          console.error('Erro ao atualizar pontos_diarios:', updateDiarioError)
        }
      }

      return new Response(
        JSON.stringify({
          nome_colaborador: profile.name,
          tipo_ponto_registrado: tipoPontoDescricao,
          horario: horarioAtual,
          mensagem: `${tipoPontoDescricao} registrada com sucesso às ${horarioAtual}!`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    return new Response(
      JSON.stringify({
        error: `Ação "${(body as Record<string, unknown>).action}" não reconhecida`,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro interno no servidor'
    console.error('registrar-ponto-tablet error:', mensagem)
    return new Response(JSON.stringify({ error: mensagem }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
