import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
  details: PayslipDetails
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0)
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
        <p style="margin: 0 0 16px; font-size: 15px;">Olá <strong>${payload.name}</strong>,</p>
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
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
          Este é um e-mail automático, não responda. Em caso de dúvidas, entre em contato com o departamento de RH.
        </p>
      </div>
    </div>
  `
}

async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<{ success: boolean; error?: string }> {
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY não configurado' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pelas Panelas <noreply@pelaspanelas.com.br>',
        to,
        subject,
        html,
      }),
    })

    if (response.ok) {
      return { success: true }
    }

    const errBody = await response.text()
    return { success: false, error: `Resend API ${response.status}: ${errBody}` }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao enviar email',
    }
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

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data: existing } = await serviceClient
      .from('payslip_envios')
      .select('id, created_at')
      .eq('profile_id', profileId)
      .eq('mes', mes)
      .eq('ano', ano)
      .eq('canal', canal)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({
          sucesso: true,
          idempotent: true,
          message: 'Holerite já enviado anteriormente para este período e canal.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const emailHtml = buildEmailHtml(payload)
    const subject = `Holerite - ${payload.month}/${payload.year}`
    const emailResult = await sendEmailViaResend(payload.email, subject, emailHtml)

    await serviceClient.from('payslip_envios').insert({
      profile_id: profileId,
      mes,
      ano,
      canal,
      enviado_por: user.id,
    })

    if (!emailResult.success && resendApiKey) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          error: emailResult.error || 'Falha ao enviar email',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        emailSent: emailResult.success,
        message: emailResult.success
          ? 'Holerite enviado por email com sucesso!'
          : 'Envio registrado. Provider de email não configurado.',
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
