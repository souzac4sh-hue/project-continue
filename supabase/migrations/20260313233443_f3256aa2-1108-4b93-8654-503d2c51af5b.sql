DROP FUNCTION IF EXISTS public.get_pix_order_status(text);

CREATE FUNCTION public.get_pix_order_status(order_identifier text)
RETURNS TABLE(payment_status text, paid_at timestamptz, gateway_status text, provider_identifier text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT payment_status::text, paid_at, gateway_status, provider_identifier
  FROM public.pix_orders
  WHERE identifier = order_identifier
  LIMIT 1;
$$;