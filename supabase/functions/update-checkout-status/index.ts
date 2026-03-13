import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const ALLOWED_ACTIONS = ['pix_copied', 'abandoned', 'support_contacted', 'update_lead_status'] as const
type Action = typeof ALLOWED_ACTIONS[number]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, orderId, leadStatus, lastStep, extraFields } = await req.json()

    // Input validation
    if (!orderId || typeof orderId !== 'string' || orderId.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid orderId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!action || typeof action !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate orderId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(orderId)) {
      return new Response(JSON.stringify({ error: 'Invalid orderId format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!ALLOWED_ACTIONS.includes(action as Action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'pix_copied':
        updateData = {
          copied_pix: true,
          copied_at: new Date().toISOString(),
          lead_status: 'pix_copied',
          last_step: 'pix_copied',
        }
        await supabase.from('checkout_events').insert({
          order_id: orderId,
          event_type: 'pix_copied',
          identifier: orderId,
        })
        break

      case 'abandoned':
        updateData = {
          lead_status: 'abandoned',
          abandoned_at: new Date().toISOString(),
          last_step: 'abandoned',
        }
        await supabase.from('checkout_events').insert({
          order_id: orderId,
          event_type: 'order_abandoned',
          identifier: orderId,
        })
        break

      case 'support_contacted':
        updateData = {
          support_contacted_at: new Date().toISOString(),
          lead_status: 'support_requested',
          last_step: 'support_clicked',
        }
        await supabase.from('checkout_events').insert({
          order_id: orderId,
          event_type: 'support_clicked',
          identifier: orderId,
        })
        break

      case 'update_lead_status':
        if (leadStatus) updateData.lead_status = leadStatus
        if (lastStep) updateData.last_step = lastStep
        if (extraFields && typeof extraFields === 'object') {
          // Only allow safe fields
          const safeFields = ['paid_at', 'last_step', 'lead_status']
          for (const [k, v] of Object.entries(extraFields)) {
            if (safeFields.includes(k)) updateData[k] = v
          }
        }
        break
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('pix_orders')
        .update(updateData)
        .eq('identifier', orderId)

      if (error) {
        console.error('Failed to update order:', error)
        return new Response(JSON.stringify({ error: 'Update failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('update-checkout-status error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
