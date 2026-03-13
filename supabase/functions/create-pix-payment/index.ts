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
    const { productId, productName, amount, customerName, customerPhone, customerEmail, customerDocument, couponCode, discountAmount } = await req.json()

    if (!productId || !customerName || !customerPhone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Sanitize inputs
    const cleanPhone = customerPhone.replace(/\D/g, '')
    const cleanName = customerName.trim().substring(0, 100)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── SERVER-SIDE PRICE VALIDATION ──
    // Look up the real product price from site_config instead of trusting client
    const { data: configData, error: configError } = await supabase
      .from('site_config')
      .select('settings')
      .eq('id', 'main')
      .maybeSingle()

    if (configError || !configData?.settings) {
      console.error('Failed to load site config for price validation:', configError)
      return new Response(JSON.stringify({ error: 'Unable to validate product price' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const siteData = configData.settings as Record<string, unknown>
    const products = (siteData.products as Array<Record<string, unknown>>) || []
    const product = products.find((p) => p.id === productId)

    if (!product) {
      console.error('Product not found for price validation:', productId)
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (product.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Product is not available' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Determine the real price from DB (use promotion price if active)
    const hasPromo = product.promotion && product.promotionPrice
    const realPrice = hasPromo
      ? Math.round(parseFloat(String(product.promotionPrice)) * 100) / 100
      : Math.round(parseFloat(String(product.price)) * 100) / 100
    const realProductName = String(product.name || productName)

    if (realPrice <= 0 || realPrice > 50000) {
      return new Response(JSON.stringify({ error: 'Invalid product price' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let cleanAmount = realPrice
    const originalAmount = realPrice

    // Log if client sent a different amount (potential tampering attempt)
    const clientAmount = Math.round(parseFloat(amount) * 100) / 100
    if (Math.abs(clientAmount - realPrice) > 0.01) {
      console.warn(`Price mismatch detected! Client sent ${clientAmount}, real price is ${realPrice} for product ${productId}`)
    }

    // Validate and apply coupon server-side
    let validatedCouponCode: string | null = null
    let validatedDiscount = 0

    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .maybeSingle()

      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date()
        const notExhausted = !coupon.usage_limit || coupon.times_used < coupon.usage_limit

        if (notExpired && notExhausted) {
          if (coupon.discount_type === 'percentage') {
            validatedDiscount = Math.round(cleanAmount * coupon.discount_value / 100 * 100) / 100
          } else {
            validatedDiscount = Math.min(coupon.discount_value, cleanAmount - 0.01)
          }
          cleanAmount = Math.round((cleanAmount - validatedDiscount) * 100) / 100
          validatedCouponCode = coupon.code

          // Increment usage
          await supabase
            .from('coupons')
            .update({ times_used: (coupon.times_used || 0) + 1 })
            .eq('id', coupon.id)
        }
      }
    }

    const SIGILOPAY_PUBLIC_KEY = Deno.env.get('SIGILOPAY_PUBLIC_KEY')
    const SIGILOPAY_SECRET_KEY = Deno.env.get('SIGILOPAY_SECRET_KEY')

    if (!SIGILOPAY_PUBLIC_KEY || !SIGILOPAY_SECRET_KEY) {
      console.error('[CREATE-PIX] SigiloPay API keys not configured')
      return new Response(JSON.stringify({ error: 'Payment provider not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[CREATE-PIX] Starting Pix generation', JSON.stringify({
      productId,
      productName: realProductName,
      orderAmount: cleanAmount,
      originalAmount,
      hasCoupon: Boolean(validatedCouponCode),
    }))

    // Generate unique identifier for this order
    const identifier = crypto.randomUUID()
    console.log('[CREATE-PIX] Generated checkout identifier:', identifier)

    // Call SigiloPay API to create Pix charge
    const apiUrl = 'https://app.sigilopay.com.br/api/v1/gateway/pix/receive'
    console.log('[CREATE-PIX] Calling SigiloPay:', apiUrl, 'with validated amount:', cleanAmount, '(original price:', originalAmount, ')')

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
    console.log('[CREATE-PIX] SigiloPay response status:', sigiloResponse.status, 'body preview:', responseText.substring(0, 500))

    if (!sigiloResponse.ok) {
      console.error('[CREATE-PIX] SigiloPay API error:', sigiloResponse.status, responseText.substring(0, 1000))
      return new Response(JSON.stringify({ error: 'Failed to generate Pix payment', details: responseText.substring(0, 200) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sigiloData: Record<string, unknown>
    try {
      sigiloData = JSON.parse(responseText)
    } catch {
      console.error('[CREATE-PIX] SigiloPay returned non-JSON:', responseText.substring(0, 500))
      return new Response(JSON.stringify({ error: 'Invalid payment provider response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pixData = sigiloData?.pix as Record<string, unknown> | undefined
    const transactionData = sigiloData?.transaction as Record<string, unknown> | undefined
    const pixCode = pixData?.code || (sigiloData?.pixCode as string) || (sigiloData?.qrcode as string)

    if (!pixCode) {
      console.error('[CREATE-PIX] No pix code in SigiloPay response:', JSON.stringify(sigiloData))
      return new Response(JSON.stringify({ error: 'Invalid payment provider response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const providerIdentifier =
      (sigiloData?.transactionId as string) ||
      (sigiloData?.id as string) ||
      (transactionData?.id as string) ||
      (pixData?.transactionId as string) ||
      null

    const pixAmount = (pixData?.amount as number) || (sigiloData?.amount as number) || cleanAmount

    const { error: dbError } = await supabase.from('pix_orders').insert({
      identifier,
      product_id: productId,
      product_name: realProductName,
      product_price: originalAmount,
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
      provider_identifier: providerIdentifier,
      provider_response: sigiloData as Record<string, unknown>,
      coupon_code: validatedCouponCode,
      discount_amount: validatedDiscount,
    })

    if (dbError) {
      console.error('[CREATE-PIX] Failed to save order in database:', dbError)
      return new Response(JSON.stringify({ error: 'Failed to persist checkout order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[CREATE-PIX] Checkout saved successfully', JSON.stringify({
      identifier,
      providerIdentifier,
      productId,
      amount: cleanAmount,
      pixAmount,
    }))

    // Track checkout event
    await supabase.from('checkout_events').insert({
      order_id: identifier,
      event_type: 'pix_generated',
      identifier,
      metadata: { product_id: productId, amount: cleanAmount, coupon: validatedCouponCode },
    })

    return new Response(JSON.stringify({
      orderId: identifier,
      pixCode,
      amount: pixAmount,
      productName: realProductName,
      productPrice: originalAmount,
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