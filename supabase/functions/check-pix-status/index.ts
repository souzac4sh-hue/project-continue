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

    // Check local DB first
    const { data: order, error: dbError } = await supabase
      .from('pix_orders')
      .select('payment_status, paid_at, provider_identifier, identifier')
      .eq('identifier', orderId)
      .maybeSingle()

    if (dbError) {
      console.error('[CHECK-STATUS] DB query error:', dbError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!order) {
      console.log('[CHECK-STATUS] Order not found:', orderId)
      return new Response(JSON.stringify({ status: 'not_found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If already paid in DB, return immediately
    if (order.payment_status === 'paid') {
      console.log('[CHECK-STATUS] Order already paid in DB:', orderId)
      return new Response(JSON.stringify({ status: 'paid', paid_at: order.paid_at }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If expired or failed, return
    if (order.payment_status === 'expired' || order.payment_status === 'failed') {
      return new Response(JSON.stringify({ status: order.payment_status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fallback: check SigiloPay API directly using multiple endpoint patterns
    const SIGILOPAY_PUBLIC_KEY = Deno.env.get('SIGILOPAY_PUBLIC_KEY')
    const SIGILOPAY_SECRET_KEY = Deno.env.get('SIGILOPAY_SECRET_KEY')

    if (SIGILOPAY_PUBLIC_KEY && SIGILOPAY_SECRET_KEY) {
      // Try multiple SigiloPay API endpoints
      const endpointsToTry = [
        `https://app.sigilopay.com.br/api/v1/gateway/pix/status/${orderId}`,
        `https://app.sigilopay.com.br/api/v1/gateway/pix/charge/${orderId}`,
        `https://app.sigilopay.com.br/api/v1/gateway/pix/${orderId}`,
      ]

      // Also try with provider_identifier if available
      if (order.provider_identifier) {
        endpointsToTry.push(
          `https://app.sigilopay.com.br/api/v1/gateway/pix/status/${order.provider_identifier}`,
          `https://app.sigilopay.com.br/api/v1/gateway/pix/charge/${order.provider_identifier}`,
        )
      }

      for (const endpoint of endpointsToTry) {
        try {
          console.log('[CHECK-STATUS] Trying SigiloPay endpoint:', endpoint)
          const checkResponse = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'x-public-key': SIGILOPAY_PUBLIC_KEY,
              'x-secret-key': SIGILOPAY_SECRET_KEY,
              'Content-Type': 'application/json',
            },
          })

          const responseText = await checkResponse.text()
          console.log('[CHECK-STATUS] SigiloPay response:', checkResponse.status, responseText.substring(0, 500))

          if (checkResponse.ok) {
            let chargeData: Record<string, unknown>
            try {
              chargeData = JSON.parse(responseText)
            } catch {
              console.log('[CHECK-STATUS] Non-JSON response, skipping endpoint')
              continue
            }

            // Try multiple status field names
            const chargeStatus = (
              chargeData?.status || chargeData?.paymentStatus || chargeData?.payment_status ||
              chargeData?.pix?.status || chargeData?.charge?.status || chargeData?.data?.status
            ) as string | undefined

            console.log('[CHECK-STATUS] Extracted charge status:', chargeStatus)

            if (chargeStatus) {
              const normalized = chargeStatus.toLowerCase()
              if (normalized === 'paid' || normalized === 'approved' || normalized === 'completed' ||
                  normalized === 'confirmed' || normalized === 'success' || normalized === 'settled') {
                const paidAt = new Date().toISOString()

                // Update DB
                const { error: updateErr } = await supabase.from('pix_orders').update({
                  payment_status: 'paid',
                  lead_status: 'paid',
                  paid_at: paidAt,
                  last_step: 'payment_confirmed',
                }).eq('identifier', orderId)

                if (updateErr) {
                  console.error('[CHECK-STATUS] Failed to update order:', updateErr)
                } else {
                  console.log('[CHECK-STATUS] ✅ Order marked as paid via polling:', orderId)
                }

                await supabase.from('checkout_events').insert({
                  order_id: orderId,
                  event_type: 'payment_confirmed',
                  identifier: orderId,
                  metadata: { source: 'polling_fallback', endpoint },
                })

                return new Response(JSON.stringify({ status: 'paid', paid_at: paidAt }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
              } else if (normalized === 'expired' || normalized === 'failed' || normalized === 'cancelled') {
                return new Response(JSON.stringify({ status: normalized === 'expired' ? 'expired' : 'failed' }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
              }
            }
            // If we got a valid response but status is still pending, don't try more endpoints
            if (chargeData && Object.keys(chargeData).length > 0) {
              console.log('[CHECK-STATUS] Got valid response, status still pending')
              break
            }
          } else if (checkResponse.status === 404) {
            console.log('[CHECK-STATUS] Endpoint returned 404, trying next')
            continue
          } else {
            console.log('[CHECK-STATUS] Endpoint returned', checkResponse.status)
          }
        } catch (apiErr) {
          console.error('[CHECK-STATUS] API error for endpoint', endpoint, ':', apiErr)
          continue
        }
      }
    } else {
      console.warn('[CHECK-STATUS] SigiloPay keys not configured, relying on webhook only')
    }

    return new Response(JSON.stringify({ status: order.payment_status || 'pending' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[CHECK-STATUS] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
