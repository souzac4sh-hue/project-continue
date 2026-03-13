import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-webhook-signature',
}

type NormalizedPaymentStatus = 'paid' | 'expired' | 'failed' | 'pending'
type OrderRow = {
  id: string
  identifier: string
  payment_status: string | null
  provider_identifier: string | null
  paid_at: string | null
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

function extractWebhookFields(payload: Record<string, unknown>) {
  const transaction = asRecord(payload.transaction)
  const charge = asRecord(payload.charge)
  const data = asRecord(payload.data)
  const pixInformation = asRecord(transaction.pixInformation)

  const identifierCandidates = toUniqueStrings([
    payload.identifier,
    transaction.identifier,
    charge.identifier,
    data.identifier,
    payload.external_reference,
    payload.externalReference,
    transaction.external_reference,
    transaction.externalReference,
    charge.external_reference,
    data.external_reference,
  ])

  const providerIdCandidates = toUniqueStrings([
    payload.transactionId,
    payload.transaction_id,
    payload.id,
    transaction.id,
    charge.transactionId,
    charge.transaction_id,
    data.transactionId,
    data.transaction_id,
    pixInformation.transactionId,
  ])

  const status = toUniqueStrings([
    payload.status,
    payload.payment_status,
    payload.paymentStatus,
    transaction.status,
    charge.status,
    data.status,
  ])[0]

  const event = toUniqueStrings([payload.event, payload.type])[0]

  const paidAt = toUniqueStrings([
    payload.paid_at,
    payload.paidAt,
    transaction.payedAt,
    transaction.paidAt,
  ])[0]

  const amountCandidate = payload.amount ?? transaction.amount ?? charge.amount ?? data.amount
  const amount = typeof amountCandidate === 'number'
    ? amountCandidate
    : typeof amountCandidate === 'string'
      ? Number(amountCandidate)
      : null

  return {
    identifierCandidates,
    providerIdCandidates,
    status,
    event,
    paidAt,
    amount: Number.isFinite(amount) ? amount : null,
  }
}

/**
 * Verify webhook signature using HMAC-SHA256.
 */
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const normalizedSignature = signature.replace(/^sha256=/i, '').trim().toLowerCase()

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

    if (computed.length !== normalizedSignature.length) return false

    let mismatch = 0
    for (let i = 0; i < computed.length; i++) {
      mismatch |= computed.charCodeAt(i) ^ normalizedSignature.charCodeAt(i)
    }

    return mismatch === 0
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}

async function findOrder(
  supabase: ReturnType<typeof createClient>,
  identifierCandidates: string[],
  providerIdCandidates: string[],
): Promise<OrderRow | null> {
  for (const identifier of identifierCandidates) {
    console.log('[WEBHOOK] Searching checkout by identifier:', identifier)
    const { data, error } = await supabase
      .from('pix_orders')
      .select('id, identifier, payment_status, provider_identifier, paid_at')
      .eq('identifier', identifier)
      .maybeSingle()

    if (error) {
      console.error('[WEBHOOK] Database lookup error by identifier:', error)
      continue
    }

    if (data) {
      console.log('[WEBHOOK] Checkout found by identifier:', data.identifier)
      return data as OrderRow
    }
  }

  for (const providerIdentifier of providerIdCandidates) {
    console.log('[WEBHOOK] Searching checkout by provider_identifier:', providerIdentifier)
    const { data, error } = await supabase
      .from('pix_orders')
      .select('id, identifier, payment_status, provider_identifier, paid_at')
      .eq('provider_identifier', providerIdentifier)
      .maybeSingle()

    if (error) {
      console.error('[WEBHOOK] Database lookup error by provider_identifier:', error)
      continue
    }

    if (data) {
      console.log('[WEBHOOK] Checkout found by provider_identifier:', data.identifier)
      return data as OrderRow
    }
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    console.log('[WEBHOOK] Webhook called')

    const rawBody = await req.text()
    console.log('[WEBHOOK] Headers received:', JSON.stringify(Object.fromEntries(req.headers.entries())))
    console.log('[WEBHOOK] Body received:', rawBody.substring(0, 4000))

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody)
    } catch (parseErr) {
      console.error('[WEBHOOK] Payload parsing error:', parseErr)
      return jsonResponse({ received: false, error: 'payload_parsing_error' }, 400)
    }

    console.log('[WEBHOOK] Parsed payload:', JSON.stringify(payload))

    const signature = req.headers.get('x-signature') || req.headers.get('x-webhook-signature')
    const sigiloSecret = Deno.env.get('SIGILOPAY_SECRET_KEY')

    if (sigiloSecret && signature) {
      const isValid = await verifySignature(rawBody, signature, sigiloSecret)
      if (!isValid) {
        console.error('[WEBHOOK] Signature verification failed')
        return jsonResponse({ received: false, error: 'invalid_signature' }, 401)
      }
      console.log('[WEBHOOK] Signature verified successfully')
    } else if (signature) {
      console.warn('[WEBHOOK] Signature received but SIGILOPAY_SECRET_KEY missing, accepting for compatibility')
    } else {
      console.warn('[WEBHOOK] No signature header received - accepting for compatibility')
    }

    const extracted = extractWebhookFields(payload)
    const receivedPaymentId = extracted.providerIdCandidates[0] || extracted.identifierCandidates[0] || null

    console.log('[WEBHOOK] Payment ID received:', receivedPaymentId)
    console.log('[WEBHOOK] Status received:', extracted.status || null)
    console.log('[WEBHOOK] Event received:', extracted.event || null)
    console.log('[WEBHOOK] Identifier candidates:', JSON.stringify(extracted.identifierCandidates))
    console.log('[WEBHOOK] Provider ID candidates:', JSON.stringify(extracted.providerIdCandidates))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const order = await findOrder(supabase, extracted.identifierCandidates, extracted.providerIdCandidates)

    if (!order) {
      console.error('[WEBHOOK] Checkout not found for received identifiers')
      return jsonResponse({ received: true, processed: false, error: 'checkout_not_found' }, 200)
    }

    if (order.payment_status === 'paid') {
      console.log('[WEBHOOK] Checkout already paid, idempotent success:', order.identifier)
      return jsonResponse({ received: true, processed: true, already_paid: true, status: 'paid' }, 200)
    }

    const normalizedStatus = normalizePaymentStatus(extracted.status, extracted.event)
    console.log('[WEBHOOK] Normalized payment status:', normalizedStatus)

    if (normalizedStatus === 'paid') {
      const paidAt = extracted.paidAt || new Date().toISOString()
      console.log('[WEBHOOK] Updating payment status to paid for checkout:', order.identifier)

      const { error: updateError } = await supabase
        .from('pix_orders')
        .update({
          payment_status: 'paid',
          lead_status: 'paid',
          paid_at: paidAt,
          last_step: 'payment_confirmed',
          gateway_status: extracted.status || extracted.event || 'paid',
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('[WEBHOOK] Database update error:', updateError)
        return jsonResponse({ received: false, error: 'database_update_error' }, 500)
      }

      await supabase.from('checkout_events').insert({
        order_id: order.identifier,
        event_type: 'payment_confirmed',
        identifier: order.identifier,
        metadata: {
          source: 'webhook',
          webhook_event: extracted.event || null,
          gateway_status: extracted.status || null,
          gateway_amount: extracted.amount,
          provider_identifier: order.provider_identifier || null,
        },
      })

      console.log('[WEBHOOK] Payment confirmed successfully for checkout:', order.identifier)
      return jsonResponse({ received: true, processed: true, status: 'paid' }, 200)
    }

    if (normalizedStatus === 'expired' || normalizedStatus === 'failed') {
      console.log('[WEBHOOK] Updating terminal non-paid status:', normalizedStatus, 'for checkout:', order.identifier)

      const { error: updateError } = await supabase
        .from('pix_orders')
        .update({
          payment_status: normalizedStatus === 'expired' ? 'expired' : 'failed',
          lead_status: 'expired',
          last_step: 'pix_expired',
          gateway_status: extracted.status || extracted.event || normalizedStatus,
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('[WEBHOOK] Database update error:', updateError)
        return jsonResponse({ received: false, error: 'database_update_error' }, 500)
      }

      if (normalizedStatus === 'expired') {
        await supabase.from('checkout_events').insert({
          order_id: order.identifier,
          event_type: 'pix_expired',
          identifier: order.identifier,
          metadata: {
            source: 'webhook',
            webhook_event: extracted.event || null,
            gateway_status: extracted.status || null,
          },
        })
      }

      return jsonResponse({ received: true, processed: true, status: normalizedStatus }, 200)
    }

    console.log('[WEBHOOK] Pending/unhandled status received, no state change applied')
    return jsonResponse({ received: true, processed: true, status: 'pending' }, 200)
  } catch (err) {
    console.error('[WEBHOOK] Webhook error:', err)
    return jsonResponse({ received: false, error: 'webhook_error' }, 500)
  }
})
