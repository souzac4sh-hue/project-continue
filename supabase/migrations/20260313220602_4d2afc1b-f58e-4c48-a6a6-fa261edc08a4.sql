
-- Ninja coupons table for secure server-side coupon generation
CREATE TABLE public.ninja_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percentage integer NOT NULL CHECK (discount_percentage IN (10, 20)),
  product_id text,
  source text NOT NULL DEFAULT 'ninja',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  is_used boolean NOT NULL DEFAULT false,
  max_uses integer NOT NULL DEFAULT 1,
  current_uses integer NOT NULL DEFAULT 0,
  session_id text,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  used_at timestamptz
);

-- Enable RLS
ALTER TABLE public.ninja_coupons ENABLE ROW LEVEL SECURITY;

-- No public SELECT - coupons are validated server-side only
-- Admins can view all coupons
CREATE POLICY "Admins can read ninja coupons"
  ON public.ninja_coupons FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage coupons
CREATE POLICY "Admins can manage ninja coupons"
  ON public.ninja_coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookup during validation
CREATE INDEX idx_ninja_coupons_code ON public.ninja_coupons(code);
CREATE INDEX idx_ninja_coupons_session ON public.ninja_coupons(session_id);
CREATE INDEX idx_ninja_coupons_visitor ON public.ninja_coupons(visitor_id);
