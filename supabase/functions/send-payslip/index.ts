import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SESv2Client, SendEmailCommand } from 'npm:@aws-sdk/client-sesv2@3'
import { corsHeaders } from '../_shared/cors.ts'

interface PayslipLaunch {
  descricao: string
  categoria: 'credito' | 'debito'
  valor: number
}

interface PayslipDetails {
  baseSalary: number
  vt: number
  extras: number
  discounts: number
  netPay: number
  totalCredits: number
  totalDebits: number
}

interface SendPayslipPayload {
  email: string
  name: string
  month: string
  year: number
  profileId?: string
  mes?: number
  ano?: number
  canal?: 'email' | 'whatsapp' | 'ambos'
  launches?: PayslipLaunch[]
  details: PayslipDetails
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildLaunchRowsHtml(launches: PayslipLaunch[]): string {
  if (!launches || launches.length === 0) return ''
  return launches
    .map(
      (l) => `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px;">${escapeHtml(l.descricao)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; text-align: right; color: ${l.categoria === 'credito' ? '#059669' : '#dc2626'};">
            ${l.categoria === 'credito' ? '+' : '-'}${formatCurrency(l.valor)}
          </td>
        </tr>`,
    )
    .join('')
}

function buildLaunchRowsText(launches: PayslipLaunch[]): string {
  if (!launches || launches.length === 0) return ''
  return launches
    .map(
      (l) =>
        `  - ${l.descricao}: ${l.categoria === 'credito' ? '+' : '-'}${formatCurrency(l.valor)}`,
    )
    .join('\n')
}

function buildEmailHtml(payload: SendPayslipPayload): string {
  const d = payload.details
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1e40af; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Holerite - Pelas Panelas</h1>
        <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Competência: ${payload.month}/${payload.year}</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Olá <strong>${escapeHtml(payload.name)}</strong>,</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">
          Segue o resumo do seu holerite referente a <strong>${payload.month}/${payload.year}</strong>:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">Salário Base</td>
            <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatCurrency(d.baseSalary)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">Vale Transporte</td>
            <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatCurrency(d.vt)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">Extras / Bônus</td>
            <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #059669;">${formatCurrency(d.extras)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">Descontos</td>
            <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: right; color: #dc2626;">-${formatCurrency(d.discounts)}</td>
          </tr>
          <tr style="background: #eff6ff;">
            <td style="padding: 14px 10px; font-weight: bold; font-size: 15px;">Total Líquido</td>
            <td style="padding: 14px 10px; font-weight: bold; text-align: right; color: #1e40af; font-size: 16px;">${formatCurrency(d.netPay)}</td>
          </tr>
        </table>
        ${
          payload.launches && payload.launches.length > 0
            ? `
        <p style="margin: 24px 0 8px; font-size: 14px; font-weight: bold;">Lançamentos do período:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 8px 0 16px;">
          ${buildLaunchRowsHtml(payload.launches)}
        </table>`
            : ''
        }
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Este é um e-mail automático, não responda. Em caso de dúvidas, entre em contato com o departamento de RH.
        </p>
      </div>
    </div>
  `
}

function buildEmailText(payload: SendPayslipPayload): string {
  const d = payload.details
  const lines = [
    'HOLERITE - PELAS PANELAS',
    `Competência: ${payload.month}/${payload.year}`,
    '',
    `Olá ${payload.name},`,
    '',
    `Salário Base: ${formatCurrency(d.baseSalary)}`,
    `Vale Transporte: ${formatCurrency(d.vt)}`,
    `Extras / Bônus: ${formatCurrency(d.extras)}`,
    `Descontos: -${formatCurrency(d.discounts)}`,
    '',
    `TOTAL LÍQUIDO: ${formatCurrency(d.netPay)}`,
  ]
  if (payload.launches && payload.launches.length > 0) {
    lines.push('', 'Lançamentos do período:')
    lines.push(buildLaunchRowsText(payload.launches))
  }
  lines.push('', 'Este é um e-mail automático, não responda.')
  return lines.join('\n')
}

function getSesClient(): SESv2Client | null {
  const accessKey = Deno.env.get('AWS_ACCESS_KEY_ID') ?? ''
  const secretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY') ?? ''
  const region = Deno.env.get('AWS_REGION') ?? ''
  if (!accessKey || !secretKey || !region) return null
  return new SESv2Client({
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  })
}

async function sendEmailViaSes(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<{ success: boolean; error?: string }> {
  const client = getSesClient()
  if (!client) {
    return {
      success: false,
      error:
        'Serviço de e-mail não configurado no servidor (credenciais AWS ausentes). Contate o administrador.',
    }
  }

  const from = Deno.env.get('PAYSLIP_FROM_EMAIL') || 'noreply@pelaspanelas.com.br'

  try {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'utf-8' },
            Body: {
              Html: { Data: html, Charset: 'utf-8' },
              Text: { Data: text, Charset: 'utf-8' },
            },
          },
        },
      }),
    )
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao enviar e-mail'
    console.error('SES send error:', message)
    return { success: false, error: `Falha no envio do e-mail: ${message}` }
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

    if (!payload.email || !payload.name) {
      return new Response(
        JSON.stringify({ error: 'Email e nome do colaborador são obrigatórios' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const mes = payload.mes || new Date().getMonth() + 1
    const ano = payload.ano || payload.year || new Date().getFullYear()
    const canal = payload.canal || 'email'
    const profileId = payload.profileId || user.id

    const emailHtml = buildEmailHtml(payload)
    const emailText = buildEmailText(payload)
    const subject = `Holerite - ${payload.month}/${payload.year}`
    const emailResult = await sendEmailViaSes(payload.email, subject, emailHtml, emailText)

    if (!emailResult.success) {
      return new Response(
        JSON.stringify({ sucesso: false, error: emailResult.error || 'Falha ao enviar e-mail' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    await serviceClient.from('payslip_envios').insert({
      profile_id: profileId,
      mes,
      ano,
      canal,
      enviado_por: user.id,
    })

    return new Response(
      JSON.stringify({
        sucesso: true,
        emailSent: true,
        message: 'Holerite enviado por e-mail com sucesso!',
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
