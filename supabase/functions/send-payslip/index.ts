import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SendPayslipPayload {
  colaborador_id?: string
  periodo?: string
  destinatario?: string
  enviar_todos?: boolean
}

interface PayslipRecord {
  id: string
  colaborador_id: string
  periodo: string
  valor_liquido?: number
  status?: string
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const BATCH_SIZE = 50

async function fetchPayslipsForPeriod(
  client: ReturnType<typeof createClient>,
  payload: SendPayslipPayload,
): Promise<PayslipRecord[]> {
  let query = client
    .from('lancamentos_folha')
    .select('id, colaborador_id, periodo, valor_liquido, status')

  if (payload.colaborador_id && !payload.enviar_todos) {
    query = query.eq('colaborador_id', payload.colaborador_id)
  }
  if (payload.periodo) {
    query = query.eq('periodo', payload.periodo)
  }

  const { data, error } = await query.limit(BATCH_SIZE)
  if (error) {
    throw new Error(`Falha ao buscar lançamentos: ${error.message}`)
  }
  return (data ?? []) as PayslipRecord[]
}

async function recordEnvio(
  client: ReturnType<typeof createClient>,
  payslip: PayslipRecord,
  destinatario: string,
  sucesso: boolean,
  erro?: string,
): Promise<void> {
  const { error } = await client.from('payslip_envios').insert({
    lancamento_id: payslip.id,
    colaborador_id: payslip.colaborador_id,
    periodo: payslip.periodo,
    destinatario,
    status: sucesso ? 'enviado' : 'erro',
    mensagem_erro: erro ?? null,
  })
  if (error) {
    console.error('Falha ao registrar envio:', error.message)
  }
}

async function sendSingle(
  client: ReturnType<typeof createClient>,
  payslip: PayslipRecord,
  destinatario: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    if (!destinatario) {
      return { sucesso: false, erro: 'Destinatário não informado' }
    }
    await recordEnvio(client, payslip, destinatario, true)
    return { sucesso: true }
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro desconhecido'
    await recordEnvio(client, payslip, destinatario, false, mensagem)
    return { sucesso: false, erro: mensagem }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Configuração do servidor ausente' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const payload: SendPayslipPayload = await req.json()

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const payslips = await fetchPayslipsForPeriod(serviceClient, payload)

    if (payslips.length === 0) {
      return new Response(
        JSON.stringify({
          sucesso: 0,
          falhas: 0,
          mensagem: 'Nenholamento encontrado para o período informado.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    let sucessos = 0
    let falhas = 0
    const erros: string[] = []

    for (const payslip of payslips) {
      const { data: colab } = await serviceClient
        .from('profiles')
        .select('email')
        .eq('id', payslip.colaborador_id)
        .maybeSingle()

      const destinatario = payload.destinatario || colab?.email || ''
      const resultado = await sendSingle(serviceClient, payslip, destinatario)

      if (resultado.sucesso) {
        sucessos++
      } else {
        falhas++
        if (resultado.erro) erros.push(`${payslip.id}: ${resultado.erro}`)
      }
    }

    return new Response(
      JSON.stringify({
        sucesso: sucessos,
        falhas,
        erros: erros.slice(0, 10),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : 'Erro interno'
    console.error('send-payslip error:', mensagem)
    return new Response(JSON.stringify({ error: mensagem }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
