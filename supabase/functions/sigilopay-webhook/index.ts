import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const body = await req.json()
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
