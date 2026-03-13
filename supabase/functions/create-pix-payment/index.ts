import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productId, productName, amount, customerName, customerPhone, customerEmail, customerDocument } = await req.json()

    if (!productName || !amount || !customerName || !customerPhone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Sanitize inputs
    const cleanPhone = customerPhone.replace(/\D/g, '')
    const cleanName = customerName.trim().substring(0, 100)
    const cleanAmount = Math.round(parseFloat(amount) * 100) / 100

    if (cleanAmount <= 0 || cleanAmount > 50000) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const SIGILOPAY_PUBLIC_KEY = Deno.env.get('SIGILOPAY_PUBLIC_KEY')
    const SIGILOPAY_SECRET_KEY = Deno.env.get('SIGILOPAY_SECRET_KEY')

    if (!SIGILOPAY_PUBLIC_KEY || !SIGILOPAY_SECRET_KEY) {
      console.error('SigiloPay API keys not configured')
      return new Response(JSON.stringify({ error: 'Payment provider not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate unique identifier for this order
    const identifier = crypto.randomUUID()

    // Call SigiloPay API to create Pix charge
    const apiUrl = 'https://app.sigilopay.com.br/api/v1/gateway/pix/receive'
    console.log('Calling SigiloPay:', apiUrl, 'with amount:', cleanAmount)

    const sigiloResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': SIGILOPAY_PUBLIC_KEY,
        'x-secret-key': SIGILOPAY_SECRET_KEY,
      },
      body: JSON.stringify({
        identifier,
        amount: cleanAmount,
        client: {
          name: cleanName,
          email: customerEmail || 'deposito@deposito.com',
          phone: cleanPhone,
          document: customerDocument || '37734576850',
        },
      }),
    })

    const responseText = await sigiloResponse.text()
    console.log('SigiloPay response status:', sigiloResponse.status, 'body preview:', responseText.substring(0, 500))

    if (!sigiloResponse.ok) {
      console.error('SigiloPay API error:', sigiloResponse.status, responseText.substring(0, 1000))
      return new Response(JSON.stringify({ error: 'Failed to generate Pix payment', details: responseText.substring(0, 200) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sigiloData: Record<string, unknown>
    try {
      sigiloData = JSON.parse(responseText)
    } catch {
      console.error('SigiloPay returned non-JSON:', responseText.substring(0, 500))
      return new Response(JSON.stringify({ error: 'Invalid payment provider response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pixData = sigiloData?.pix as Record<string, unknown> | undefined
    const pixCode = pixData?.code || (sigiloData?.pixCode as string) || (sigiloData?.qrcode as string)

    if (!pixCode) {
      console.error('No pix code in SigiloPay response:', JSON.stringify(sigiloData))
      return new Response(JSON.stringify({ error: 'Invalid payment provider response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Save order to database using service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const pixAmount = (pixData?.amount as number) || (sigiloData?.amount as number) || cleanAmount

    const { error: dbError } = await supabase.from('pix_orders').insert({
      identifier,
      product_id: productId || 'unknown',
      product_name: productName,
      product_price: cleanAmount,
      amount: cleanAmount,
      pix_amount: pixAmount,
      pix_code: pixCode,
      customer_name: cleanName,
      customer_phone: cleanPhone,
      customer_email: customerEmail || '',
      customer_document: customerDocument || '',
      payment_status: 'pending',
      lead_status: 'pix_generated',
      last_step: 'pix_generated',
      provider: 'sigilopay',
      provider_identifier: (sigiloData?.id as string) || null,
      provider_response: sigiloData as Record<string, unknown>,
    })

    if (dbError) {
      console.error('Failed to save order:', dbError)
      // Still return the pix code even if DB save fails
    }

    // Track checkout event
    await supabase.from('checkout_events').insert({
      order_id: identifier,
      event_type: 'pix_generated',
      identifier,
      metadata: { product_id: productId, amount: cleanAmount },
    })

    return new Response(JSON.stringify({
      orderId: identifier,
      pixCode,
      amount: pixAmount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('create-pix-payment error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
