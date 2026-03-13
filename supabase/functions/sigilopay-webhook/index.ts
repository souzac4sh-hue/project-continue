import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Verify webhook signature using HMAC-SHA256.
 * SigiloPay sends a signature in the x-signature header.
 * If no secret is configured, we log a warning but still process (graceful degradation).
 */
async function verifySignature(body: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false

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

    // Compare in constant time (prevent timing attacks)
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

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()

    // ── WEBHOOK SIGNATURE VERIFICATION ──
    const SIGILOPAY_SECRET_KEY = Deno.env.get('SIGILOPAY_SECRET_KEY')
    const signature = req.headers.get('x-signature') || req.headers.get('x-webhook-signature')

    if (SIGILOPAY_SECRET_KEY) {
      if (!signature) {
        console.warn('Webhook received without signature header — rejecting for security')
        return new Response(JSON.stringify({ received: true, error: 'missing_signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const isValid = await verifySignature(rawBody, signature, SIGILOPAY_SECRET_KEY)
      if (!isValid) {
        console.error('Webhook signature verification FAILED — potential forgery attempt')
        return new Response(JSON.stringify({ received: true, error: 'invalid_signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('Webhook signature verified successfully')
    } else {
      console.warn('SIGILOPAY_SECRET_KEY not configured — skipping signature verification (UNSAFE for production)')
    }

    const body = JSON.parse(rawBody)
    console.log('Webhook received:', JSON.stringify(body))

    // Extract identifier and status from SigiloPay webhook payload
    // SigiloPay may send: { identifier, status, ... } or { charge: { identifier, status } }
    const identifier = body?.identifier || body?.charge?.identifier || body?.data?.identifier
    const status = body?.status || body?.charge?.status || body?.data?.status
    const event = body?.event || body?.type

    if (!identifier) {
      console.error('Webhook missing identifier:', JSON.stringify(body))
      // Return 200 to avoid SigiloPay retrying
      return new Response(JSON.stringify({ received: true, error: 'missing_identifier' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Check if this order exists
    const { data: order } = await supabase
      .from('pix_orders')
      .select('id, payment_status')
      .eq('identifier', identifier)
      .maybeSingle()

    if (!order) {
      console.error('Webhook: order not found for identifier:', identifier)
      return new Response(JSON.stringify({ received: true, error: 'order_not_found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Idempotency: if already paid, skip
    if (order.payment_status === 'paid') {
      console.log('Webhook: order already paid, skipping:', identifier)
      return new Response(JSON.stringify({ received: true, already_paid: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isPaid = status === 'paid' || status === 'approved' || status === 'completed' ||
                   event === 'charge.paid' || event === 'payment.approved'

    if (isPaid) {
      const paidAt = new Date().toISOString()

      const { error: updateError } = await supabase.from('pix_orders').update({
        payment_status: 'paid',
        lead_status: 'paid',
        paid_at: paidAt,
        last_step: 'payment_confirmed',
      }).eq('identifier', identifier)

      if (updateError) {
        console.error('Webhook: failed to update order:', updateError)
      }

      // Track event
      await supabase.from('checkout_events').insert({
        order_id: identifier,
        event_type: 'payment_confirmed',
        identifier,
        metadata: { source: 'webhook', webhook_event: event || status },
      })

      console.log('Webhook: order marked as paid:', identifier)
    } else if (status === 'expired' || status === 'failed') {
      await supabase.from('pix_orders').update({
        payment_status: status === 'expired' ? 'expired' : 'failed',
        lead_status: 'expired',
        last_step: 'pix_expired',
      }).eq('identifier', identifier)
    }

    return new Response(JSON.stringify({ received: true, processed: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Webhook error:', err)
    // Return 200 to prevent retries on parse errors
    return new Response(JSON.stringify({ received: true, error: 'parse_error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})