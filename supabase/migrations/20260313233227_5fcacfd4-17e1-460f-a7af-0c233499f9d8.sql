CREATE OR REPLACE FUNCTION public.get_pix_order_status(order_identifier text)
RETURNS TABLE(payment_status text, paid_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT payment_status::text, paid_at
  FROM public.pix_orders
  WHERE identifier = order_identifier
  LIMIT 1;
$$;