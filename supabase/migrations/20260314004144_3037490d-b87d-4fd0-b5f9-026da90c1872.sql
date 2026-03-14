
-- 1. Tighten pix_orders INSERT policy: only allow initial/pending state values
DROP POLICY IF EXISTS "Anon can insert pix orders" ON public.pix_orders;

CREATE POLICY "Anon can insert pix orders with safe defaults"
  ON public.pix_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    payment_status = 'pending'::payment_status
    AND paid_at IS NULL
    AND recovered_at IS NULL
    AND abandoned_at IS NULL
    AND copied_at IS NULL
    AND support_contacted_at IS NULL
    AND gateway_status IS NULL
    AND recovery_status = 'pending'::recovery_status
    AND lead_status IN ('started'::lead_status, 'pix_generated'::lead_status)
    AND copied_pix = false
    AND discount_amount >= 0
    AND amount > 0
  );

-- 2. Tighten checkout_events INSERT policy: only allow legitimate client-side event types
DROP POLICY IF EXISTS "Anyone can insert checkout events" ON public.checkout_events;

CREATE POLICY "Anon can insert safe checkout events"
  ON public.checkout_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type IN (
      'form_submitted'::checkout_event_type,
      'pix_generated'::checkout_event_type,
      'pix_copied'::checkout_event_type,
      'support_clicked'::checkout_event_type,
      'order_abandoned'::checkout_event_type,
      'whatsapp_redirected'::checkout_event_type,
      'pix_screen_opened'::checkout_event_type
    )
  );
