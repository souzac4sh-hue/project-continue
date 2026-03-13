import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

type NormalizedPaymentStatus = 'paid' | 'expired' | 'failed' | 'pending'

type OrderRow = {
  id: string
  identifier: string
  payment_status: string | null
  paid_at: string | null
  provider_identifier: string | null
  provider_response: Record<string, unknown> | null
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function toUniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>()
  for (const value of values) {
    if (typeof value !== 'string') continue
    const normalized = value.trim()
    if (!normalized) continue
    seen.add(normalized)
  }
  return [...seen]
}

function normalizePaymentStatus(rawStatus?: string, rawEvent?: string): NormalizedPaymentStatus {
  const status = (rawStatus || '').trim().toLowerCase()
  const event = (rawEvent || '').trim().toLowerCase()

  const paidStatuses = new Set(['paid', 'approved', 'completed', 'confirmed', 'success', 'settled'])
  const paidEvents = new Set([
    'charge.paid',
    'payment.approved',
    'payment.confirmed',
    'pix.received',
    'transaction_paid',
    'transaction.paid',
    'transaction_completed',
    'transaction.completed',
  ])

  const failedStatuses = new Set(['failed', 'cancelled', 'canceled', 'rejected'])
  const failedEvents = new Set(['transaction_failed', 'transaction.failed', 'payment.failed'])

  if (paidStatuses.has(status) || paidEvents.has(event)) return 'paid'
  if (status === 'expired') return 'expired'
  if (failedStatuses.has(status) || failedEvents.has(event)) return 'failed'
  return 'pending'
}

function extractGatewayStatus(payload: Record<string, unknown>) {
  const transaction = asRecord(payload.transaction)
  const charge = asRecord(payload.charge)
  const data = asRecord(payload.data)

  const rawStatus = toUniqueStrings([
    payload.status,
    payload.paymentStatus,
    payload.payment_status,
    transaction.status,
    charge.status,
    data.status,
  ])[0]

  const rawEvent = toUniqueStrings([
    payload.event,
    payload.type,
    transaction.event,
    charge.event,
    data.event,
  ])[0]

  const paidAt = toUniqueStrings([
    payload.paid_at,
    payload.paidAt,
    transaction.paidAt,
    transaction.payedAt,
    charge.paidAt,
    data.paidAt,
  ])[0]

  return {
    rawStatus,
    rawEvent,
    paidAt,
    normalizedStatus: normalizePaymentStatus(rawStatus, rawEvent),
  }
}

function buildProbeIds(order: OrderRow): string[] {
  const providerResponse = asRecord(order.provider_response)
  const transaction = asRecord(providerResponse.transaction)
  const pix = asRecord(providerResponse.pix)
  const orderNode = asRecord(providerResponse.order)

  return toUniqueStrings([
    order.identifier,
    order.provider_identifier,
    providerResponse.transactionId,
    providerResponse.id,
    providerResponse.identifier,
    transaction.id,
    transaction.identifier,
    pix.transactionId,
    orderNode.id,
  ])
}

function buildSigiloEndpoints(probeId: string): string[] {
  const encodedId = encodeURIComponent(probeId)
  return [
    `https://app.sigilopay.com.br/api/v1/gateway/pix/status/${encodedId}`,
    `https://app.sigilopay.com.br/api/v1/gateway/pix/charge/${encodedId}`,
    `https://app.sigilopay.com.br/api/v1/gateway/pix/${encodedId}`,
    `https://app.sigilopay.com.br/api/v1/gateway/transaction/${encodedId}`,
    `https://app.sigilopay.com.br/api/v1/gateway/transactions/${encodedId}`,
  ]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[CHECK-STATUS] Polling request received')

    const { orderId } = await req.json()
    if (!orderId || typeof orderId !== 'string') {
      return jsonResponse({ error: 'Missing orderId' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: order, error: dbError } = await supabase
      .from('pix_orders')
      .select('id, identifier, payment_status, paid_at, provider_identifier, provider_response')
      .eq('identifier', orderId)
      .maybeSingle()

    if (dbError) {
      console.error('[CHECK-STATUS] Database query error:', dbError)
      return jsonResponse({ error: 'Database error' }, 500)
    }

    if (!order) {
      console.log('[CHECK-STATUS] Order not found:', orderId)
      return jsonResponse({ status: 'not_found' })
    }

    console.log('[CHECK-STATUS] Local order found:', order.identifier, 'status:', order.payment_status)

    if (order.payment_status === 'paid') {
      return jsonResponse({ status: 'paid', paid_at: order.paid_at })
    }

    if (order.payment_status === 'expired' || order.payment_status === 'failed') {
      return jsonResponse({ status: order.payment_status })
    }

    const sigiloPublicKey = Deno.env.get('SIGILOPAY_PUBLIC_KEY')
    const sigiloSecretKey = Deno.env.get('SIGILOPAY_SECRET_KEY')

    if (!sigiloPublicKey || !sigiloSecretKey) {
      console.warn('[CHECK-STATUS] SigiloPay keys not configured, relying on webhook only')
      return jsonResponse({ status: order.payment_status || 'pending' })
    }

    const probeIds = buildProbeIds(order as OrderRow)
    console.log('[CHECK-STATUS] Probe IDs:', JSON.stringify(probeIds))

    for (const probeId of probeIds) {
      const endpointsToTry = buildSigiloEndpoints(probeId)

      for (const endpoint of endpointsToTry) {
        try {
          console.log('[CHECK-STATUS] Querying SigiloPay endpoint:', endpoint)

          const checkResponse = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'x-public-key': sigiloPublicKey,
              'x-secret-key': sigiloSecretKey,
              'Content-Type': 'application/json',
            },
          })

          const responseText = await checkResponse.text()
          console.log('[CHECK-STATUS] Endpoint response status:', checkResponse.status)

          if (!checkResponse.ok) {
            if (checkResponse.status !== 404) {
              console.warn('[CHECK-STATUS] Non-404 error from SigiloPay:', checkResponse.status, responseText.substring(0, 400))
            }
            continue
          }

          let payload: Record<string, unknown>
          try {
            payload = JSON.parse(responseText)
          } catch {
            console.warn('[CHECK-STATUS] Non-JSON response from endpoint, skipping')
            continue
          }

          const extracted = extractGatewayStatus(payload)
          console.log('[CHECK-STATUS] Extracted gateway status:', extracted.rawStatus, 'event:', extracted.rawEvent, 'normalized:', extracted.normalizedStatus)

          if (extracted.normalizedStatus === 'paid') {
            const paidAt = extracted.paidAt || new Date().toISOString()

            console.log('[CHECK-STATUS] Updating local order to paid:', order.identifier)
            const { error: updateError } = await supabase
              .from('pix_orders')
              .update({
                payment_status: 'paid',
                lead_status: 'paid',
                paid_at: paidAt,
                last_step: 'payment_confirmed',
              })
              .eq('id', order.id)

            if (updateError) {
              console.error('[CHECK-STATUS] Database update error:', updateError)
            } else {
              await supabase.from('checkout_events').insert({
                order_id: order.identifier,
                event_type: 'payment_confirmed',
                identifier: order.identifier,
                metadata: {
                  source: 'polling_fallback',
                  endpoint,
                  gateway_status: extracted.rawStatus || null,
                  gateway_event: extracted.rawEvent || null,
                },
              })
            }

            return jsonResponse({ status: 'paid', paid_at: paidAt })
          }

          if (extracted.normalizedStatus === 'expired' || extracted.normalizedStatus === 'failed') {
            const terminalStatus = extracted.normalizedStatus === 'expired' ? 'expired' : 'failed'

            await supabase
              .from('pix_orders')
              .update({
                payment_status: terminalStatus,
                lead_status: 'expired',
                last_step: 'pix_expired',
              })
              .eq('id', order.id)

            return jsonResponse({ status: terminalStatus })
          }
        } catch (apiError) {
          console.error('[CHECK-STATUS] Endpoint request error:', endpoint, apiError)
        }
      }
    }

    const { data: freshOrder } = await supabase
      .from('pix_orders')
      .select('payment_status, paid_at')
      .eq('id', order.id)
      .maybeSingle()

    if (freshOrder?.payment_status === 'paid') {
      return jsonResponse({ status: 'paid', paid_at: freshOrder.paid_at })
    }

    return jsonResponse({ status: freshOrder?.payment_status || order.payment_status || 'pending' })
  } catch (err) {
    console.error('[CHECK-STATUS] Error:', err)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
