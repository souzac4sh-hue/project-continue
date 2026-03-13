-- Remove public enumeration of coupon codes
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;

-- Add admin-only read policy for coupons (admin manages via panel)
CREATE POLICY "Admins can read coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));