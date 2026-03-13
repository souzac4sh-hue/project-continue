import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-webhook-signature',
}

/**
 * Verify webhook signature using HMAC-SHA256.
 */
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const computed = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (computed.length !== signature.length) return false
    let mismatch = 0
    for (let i = 0; i < computed.length; i++) {
      mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i)
    }
    return mismatch === 0
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    console.log('[WEBHOOK] Received request, body length:', rawBody.length)
    console.log('[WEBHOOK] Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())))

    // ── WEBHOOK SIGNATURE VERIFICATION ──
    const SIGILOPAY_SECRET_KEY = Deno.env.get('SIGILOPAY_SECRET_KEY')
    const signature = req.headers.get('x-signature') || req.headers.get('x-webhook-signature')

    if (SIGILOPAY_SECRET_KEY && signature) {
      const isValid = await verifySignature(rawBody, signature, SIGILOPAY_SECRET_KEY)
      if (!isValid) {
        console.error('[WEBHOOK] Signature verification FAILED')
        return new Response(JSON.stringify({ received: true, error: 'invalid_signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      console.log('[WEBHOOK] Signature verified successfully')
    } else if (signature) {
      console.log('[WEBHOOK] Signature present but no secret configured, accepting')
    } else {
      // SigiloPay may not send signature - accept but log warning
      console.warn('[WEBHOOK] No signature header present - accepting (SigiloPay may not send signatures)')
    }

    const body = JSON.parse(rawBody)
    console.log('[WEBHOOK] Parsed payload:', JSON.stringify(body))

    // Extract identifier and status - try multiple SigiloPay payload formats
    const identifier = body?.identifier || body?.charge?.identifier || body?.data?.identifier ||
                       body?.external_reference || body?.externalReference ||
                       body?.charge?.external_reference || body?.data?.external_reference
    const status = body?.status || body?.charge?.status || body?.data?.status ||
                   body?.payment_status || body?.paymentStatus
    const event = body?.event || body?.type
    const transactionId = body?.transactionId || body?.transaction_id || body?.id ||
                          body?.charge?.transactionId || body?.data?.transactionId

    console.log('[WEBHOOK] Extracted - identifier:', identifier, 'status:', status, 'event:', event, 'transactionId:', transactionId)

    if (!identifier) {
      console.error('[WEBHOOK] Missing identifier in payload:', JSON.stringify(body))
      // Try to find by transactionId (provider_identifier) as fallback
      if (transactionId) {
        console.log('[WEBHOOK] Attempting lookup by transactionId:', transactionId)
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )
        const { data: orderByTxn } = await supabase
          .from('pix_orders')
          .select('id, identifier, payment_status')
          .eq('provider_identifier', transactionId)
          .maybeSingle()

        if (orderByTxn) {
          console.log('[WEBHOOK] Found order by transactionId:', orderByTxn.identifier)
          // Process with found identifier
          return await processWebhook(supabase, orderByTxn.identifier, orderByTxn, status, event)
        }
      }

      return new Response(JSON.stringify({ received: true, error: 'missing_identifier' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order } = await supabase
      .from('pix_orders')
      .select('id, payment_status')
      .eq('identifier', identifier)
      .maybeSingle()

    if (!order) {
      console.error('[WEBHOOK] Order not found for identifier:', identifier)
      return new Response(JSON.stringify({ received: true, error: 'order_not_found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return await processWebhook(supabase, identifier, order, status, event)

  } catch (err) {
    console.error('[WEBHOOK] Error:', err)
    return new Response(JSON.stringify({ received: true, error: 'parse_error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processWebhook(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  order: { id: string; payment_status: string },
  status: string | undefined,
  event: string | undefined,
) {
  // Idempotency
  if (order.payment_status === 'paid') {
    console.log('[WEBHOOK] Order already paid, skipping:', identifier)
    return new Response(JSON.stringify({ received: true, already_paid: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Normalize status - accept multiple SigiloPay status formats
  const normalizedStatus = (status || '').toLowerCase()
  const isPaid = normalizedStatus === 'paid' || normalizedStatus === 'approved' ||
                 normalizedStatus === 'completed' || normalizedStatus === 'confirmed' ||
                 normalizedStatus === 'success' || normalizedStatus === 'settled' ||
                 event === 'charge.paid' || event === 'payment.approved' ||
                 event === 'pix.received' || event === 'payment.confirmed'

  console.log('[WEBHOOK] isPaid:', isPaid, 'normalizedStatus:', normalizedStatus, 'event:', event)

  if (isPaid) {
    const paidAt = new Date().toISOString()

    const { error: updateError, count } = await supabase.from('pix_orders').update({
      payment_status: 'paid',
      lead_status: 'paid',
      paid_at: paidAt,
      last_step: 'payment_confirmed',
    }).eq('identifier', identifier)

    if (updateError) {
      console.error('[WEBHOOK] Failed to update order:', updateError)
    } else {
      console.log('[WEBHOOK] ✅ Order marked as paid:', identifier, 'rows affected:', count)
    }

    await supabase.from('checkout_events').insert({
      order_id: identifier,
      event_type: 'payment_confirmed',
      identifier,
      metadata: { source: 'webhook', webhook_event: event || status },
    })

    return new Response(JSON.stringify({ received: true, processed: true, status: 'paid' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } else if (normalizedStatus === 'expired' || normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
    await supabase.from('pix_orders').update({
      payment_status: normalizedStatus === 'expired' ? 'expired' : 'failed',
      lead_status: 'expired',
      last_step: 'pix_expired',
    }).eq('identifier', identifier)

    console.log('[WEBHOOK] Order marked as', normalizedStatus, ':', identifier)
  } else {
    console.log('[WEBHOOK] Unhandled status:', normalizedStatus, 'for order:', identifier)
  }

  return new Response(JSON.stringify({ received: true, processed: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
