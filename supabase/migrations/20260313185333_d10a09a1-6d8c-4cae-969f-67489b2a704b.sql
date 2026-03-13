
-- Drop overly permissive policies on pix_orders
DROP POLICY IF EXISTS "Anyone can read pix orders" ON public.pix_orders;
DROP POLICY IF EXISTS "Anyone can update pix orders" ON public.pix_orders;
DROP POLICY IF EXISTS "Anyone can insert pix orders" ON public.pix_orders;

-- Allow anon to insert (needed for checkout flow via edge functions using service_role, but also client tracking)
CREATE POLICY "Anon can insert pix orders"
ON public.pix_orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated admins can read
CREATE POLICY "Admins can read pix orders"
ON public.pix_orders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only authenticated admins can update
CREATE POLICY "Admins can update pix orders"
ON public.pix_orders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop overly permissive policies on checkout_events
DROP POLICY IF EXISTS "Anyone can read checkout events" ON public.checkout_events;

-- Only authenticated admins can read checkout events
CREATE POLICY "Admins can read checkout events"
ON public.checkout_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop overly permissive policies on recovery_messages
DROP POLICY IF EXISTS "Anyone can read recovery messages" ON public.recovery_messages;
DROP POLICY IF EXISTS "Anyone can insert recovery messages" ON public.recovery_messages;
DROP POLICY IF EXISTS "Anyone can update recovery messages" ON public.recovery_messages;
DROP POLICY IF EXISTS "Anyone can delete recovery messages" ON public.recovery_messages;

-- Only admins can manage recovery_messages
CREATE POLICY "Admins can read recovery messages"
ON public.recovery_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert recovery messages"
ON public.recovery_messages FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update recovery messages"
ON public.recovery_messages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete recovery messages"
ON public.recovery_messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop overly permissive policies on recovery_settings
DROP POLICY IF EXISTS "Anyone can read recovery settings" ON public.recovery_settings;
DROP POLICY IF EXISTS "Anyone can insert recovery settings" ON public.recovery_settings;
DROP POLICY IF EXISTS "Anyone can update recovery settings" ON public.recovery_settings;

-- Only admins can manage recovery_settings
CREATE POLICY "Admins can read recovery settings"
ON public.recovery_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert recovery settings"
ON public.recovery_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update recovery settings"
ON public.recovery_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
