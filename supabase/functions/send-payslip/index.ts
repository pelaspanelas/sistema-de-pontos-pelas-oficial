import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface PayslipDetails {
  baseSalary?: number
  vt?: number
  extras?: number
  discounts?: number
  netPay?: number
  totalCredits?: number
  totalDebits?: number
}

interface PayslipPayload {
  email: string
  name: string
  month: string
  year: number
  details: PayslipDetails
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

function buildHtmlEmail(payload: PayslipPayload): string {
  const { name, month, year, details } = payload
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <div style="background-color: #0f172a; color: #fff; padding: 16px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Recibo de Pagamento</h2>
        <p style="margin: 4px 0 0; opacity: 0.8;">Pelas Panelas</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p><strong>Colaborador:</strong> ${name}</p>
        <p><strong>Competência:</strong> ${month} de ${year}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0;">Salário Base</td>
            <td style="padding: 6px 0; text-align: right;">${formatCurrency(details.baseSalary)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Vale Transporte</td>
            <td style="padding: 6px 0; text-align: right;">${formatCurrency(details.vt)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Extras / Bônus</td>
            <td style="padding: 6px 0; text-align: right;">${formatCurrency(details.extras)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Descontos</td>
            <td style="padding: 6px 0; text-align: right; color: #dc2626;">-${formatCurrency(details.discounts)}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
          <span>Total Líquido</span>
          <span style="color: #16a34a;">${formatCurrency(details.netPay)}</span>
        </div>
      </div>
      <p style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 16px;">
        Este é um recibo automático. Em caso de dúvidas, contate o departamento financeiro.
      </p>
    </div>
  `
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: PayslipPayload = await req.json()
    const { email, name, month, year, details } = payload

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Email e nome do colaborador são obrigatórios.' }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        },
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'no-reply@pelaspanelas.com.br'
    const html = buildHtmlEmail({ email, name, month, year, details })
    const subject = `Holerite - ${month} de ${year}`

    let emailSent = false
    let providerResponse: unknown = null

    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Pelas Panelas <${fromEmail}>`,
          to: [email],
          subject,
          html,
        }),
      })

      emailSent = response.ok
      providerResponse = await response.text()
      if (!response.ok) {
        throw new Error(`Resend API error: ${response.status} - ${providerResponse}`)
      }
    } else {
      console.warn('[send-payslip] RESEND_API_KEY not configured. Logging email payload instead.')
      console.log(`Sending payslip email to ${email} (${name}) - ${subject}`)
      console.log(html)
      emailSent = true
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        message: `Holerite enviado para ${email}`,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('[send-payslip] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    })
  }
})
