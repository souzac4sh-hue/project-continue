-- Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  expires_at timestamptz,
  usage_limit integer,
  times_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_coupon_discount_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.discount_type NOT IN ('percentage', 'fixed') THEN
    RAISE EXCEPTION 'discount_type must be percentage or fixed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_coupon_discount_type_trigger
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.validate_coupon_discount_type();

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Public can read active coupons (for validation at checkout)
CREATE POLICY "Anyone can read active coupons" ON public.coupons
  FOR SELECT TO anon, authenticated USING (active = true);

-- Admin full access
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add coupon fields to pix_orders
ALTER TABLE public.pix_orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE public.pix_orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;