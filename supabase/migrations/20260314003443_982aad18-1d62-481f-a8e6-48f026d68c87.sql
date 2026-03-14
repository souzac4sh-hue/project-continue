
-- 1. Create a secure function to serve public site config (strips sensitive keys)
CREATE OR REPLACE FUNCTION public.get_public_site_config()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  raw_settings jsonb;
BEGIN
  SELECT settings INTO raw_settings
  FROM public.site_config
  WHERE id = 'main';
  
  IF raw_settings IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Strip sensitive keys from the nested settings object
  IF raw_settings ? 'settings' AND jsonb_typeof(raw_settings->'settings') = 'object' THEN
    raw_settings = jsonb_set(
      raw_settings,
      '{settings}',
      (raw_settings->'settings') - 'pixToken' - 'pixKey' - 'pixWebhook' - 'sigiloPayToken' - 'sigiloPaySecret' - 'webhookSecret' - 'apiSecret'
    );
  END IF;
  
  RETURN raw_settings;
END;
$$;

-- 2. Drop the permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can read site config" ON public.site_config;

-- 3. Add admin-only SELECT policy
CREATE POLICY "Admins can read site config"
  ON public.site_config
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
