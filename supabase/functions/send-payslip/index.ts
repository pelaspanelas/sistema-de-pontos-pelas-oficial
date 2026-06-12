import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { email, month, year, details } = body

    // Simulate sending email for the pay slip
    console.log(`Sending pay slip for ${month}/${year} to ${email}`)
    console.log(`Details:`, details)

    // In a real scenario, integrate with Resend, SendGrid, etc.
    // e.g. await fetch('https://api.resend.com/emails', { ... })

    return new Response(
      JSON.stringify({ success: true, message: `Holerite enviado para ${email}` }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    })
  }
})
