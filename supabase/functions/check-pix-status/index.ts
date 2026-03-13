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
    const { orderId } = await req.json()

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // First check local DB
    const { data: order, error: dbError } = await supabase
      .from('pix_orders')
      .select('payment_status, paid_at, provider_identifier, identifier')
      .eq('identifier', orderId)
      .maybeSingle()

    if (dbError) {
      console.error('DB query error:', dbError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!order) {
      return new Response(JSON.stringify({ status: 'not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If already paid in DB, return immediately
    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ status: 'paid', paid_at: order.paid_at }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fallback: check SigiloPay API directly
    const SIGILOPAY_PUBLIC_KEY = Deno.env.get('SIGILOPAY_PUBLIC_KEY')
    const SIGILOPAY_SECRET_KEY = Deno.env.get('SIGILOPAY_SECRET_KEY')

    if (SIGILOPAY_PUBLIC_KEY && SIGILOPAY_SECRET_KEY) {
      try {
        const checkResponse = await fetch(`https://api.sigilopay.com/v1/charges/${orderId}`, {
          method: 'GET',
          headers: {
            'x-public-key': SIGILOPAY_PUBLIC_KEY,
            'x-secret-key': SIGILOPAY_SECRET_KEY,
          },
        })

        if (checkResponse.ok) {
          const chargeData = await checkResponse.json()
          const chargeStatus = chargeData?.status || chargeData?.paymentStatus

          if (chargeStatus === 'paid' || chargeStatus === 'approved' || chargeStatus === 'completed') {
            const paidAt = new Date().toISOString()

            // Update DB
            await supabase.from('pix_orders').update({
              payment_status: 'paid',
              lead_status: 'paid',
              paid_at: paidAt,
              last_step: 'payment_confirmed',
            }).eq('identifier', orderId)

            await supabase.from('checkout_events').insert({
              order_id: orderId,
              event_type: 'payment_confirmed',
              identifier: orderId,
              metadata: { source: 'polling_fallback' },
            })

            return new Response(JSON.stringify({ status: 'paid', paid_at: paidAt }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }
      } catch (apiErr) {
        console.error('SigiloPay status check error:', apiErr)
        // Continue with DB status
      }
    }

    return new Response(JSON.stringify({ status: order.payment_status || 'pending' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('check-pix-status error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
