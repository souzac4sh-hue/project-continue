
-- ENUMS
CREATE TYPE public.lead_status AS ENUM (
  'started', 'pix_generated', 'pix_copied', 'awaiting_payment',
  'abandoned', 'support_requested', 'recovered', 'paid', 'expired'
);

CREATE TYPE public.checkout_event_type AS ENUM (
  'form_submitted', 'pix_generated', 'pix_copied', 'support_clicked',
  'new_pix_generated', 'payment_confirmed', 'order_abandoned',
  'whatsapp_redirected', 'pix_expired', 'pix_screen_opened'
);

CREATE TYPE public.recovery_status AS ENUM (
  'pending', 'in_progress', 'no_response', 'recovered', 'lost'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending', 'paid', 'failed', 'expired'
);

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- USER ROLES TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- SITE CONFIG TABLE
CREATE TABLE public.site_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site config" ON public.site_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert site config" ON public.site_config FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update site config" ON public.site_config FOR UPDATE TO anon, authenticated USING (true);

-- PIX ORDERS TABLE (full creation with all new fields)
CREATE TABLE public.pix_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_price NUMERIC DEFAULT 0,
  amount NUMERIC NOT NULL,
  pix_amount NUMERIC DEFAULT 0,
  pix_code TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  customer_document TEXT DEFAULT '',
  payment_status public.payment_status DEFAULT 'pending',
  lead_status public.lead_status DEFAULT 'started',
  last_step TEXT DEFAULT 'form_submitted',
  provider TEXT DEFAULT 'sigilopay',
  provider_identifier TEXT,
  provider_response JSONB,
  copied_pix BOOLEAN DEFAULT false,
  copied_at TIMESTAMP WITH TIME ZONE,
  abandoned_at TIMESTAMP WITH TIME ZONE,
  recovered_at TIMESTAMP WITH TIME ZONE,
  support_contacted_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  recovery_status public.recovery_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pix_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert pix orders" ON public.pix_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read pix orders" ON public.pix_orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update pix orders" ON public.pix_orders FOR UPDATE TO anon, authenticated USING (true);

CREATE INDEX idx_pix_orders_lead_status ON public.pix_orders(lead_status);
CREATE INDEX idx_pix_orders_recovery_status ON public.pix_orders(recovery_status);
CREATE INDEX idx_pix_orders_created_at ON public.pix_orders(created_at);
CREATE INDEX idx_pix_orders_payment_status ON public.pix_orders(payment_status);

-- CHECKOUT EVENTS TABLE
CREATE TABLE public.checkout_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  identifier TEXT,
  event_type public.checkout_event_type NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert checkout events" ON public.checkout_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read checkout events" ON public.checkout_events FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX idx_checkout_events_order_id ON public.checkout_events(order_id);
CREATE INDEX idx_checkout_events_created_at ON public.checkout_events(created_at);

-- RECOVERY MESSAGES TABLE
CREATE TABLE public.recovery_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.recovery_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read recovery messages" ON public.recovery_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert recovery messages" ON public.recovery_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update recovery messages" ON public.recovery_messages FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete recovery messages" ON public.recovery_messages FOR DELETE TO anon, authenticated USING (true);

-- RECOVERY SETTINGS TABLE
CREATE TABLE public.recovery_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  abandonment_timeout_minutes INTEGER DEFAULT 10,
  show_support_button BOOLEAN DEFAULT true,
  show_regenerate_pix BOOLEAN DEFAULT true,
  mark_hot_on_copy BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.recovery_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read recovery settings" ON public.recovery_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can update recovery settings" ON public.recovery_settings FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert recovery settings" ON public.recovery_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- INSERT DEFAULTS
INSERT INTO public.recovery_messages (title, template, is_default, active, sort_order) VALUES
  ('Mensagem padrão', 'Olá, vi que você iniciou o pedido do produto {{product_name}}, mas o pagamento não foi concluído. Se precisar de ajuda para finalizar, posso te orientar agora.', true, true, 1),
  ('Pedido pendente', 'Olá, seu pedido do produto {{product_name}} ficou pendente. Se quiser, posso te ajudar a concluir agora.', false, true, 2),
  ('Dificuldade no pagamento', 'Oi, vi que você tentou finalizar seu pedido e pode ter encontrado alguma dificuldade no pagamento. Se quiser, posso te passar suporte agora.', false, true, 3),
  ('Pedido disponível', 'Seu pedido ainda está disponível. Se precisar de ajuda para pagar ou quiser tentar novamente, me chama aqui.', false, true, 4),
  ('Banco bloqueou', 'Olá, vi que você chegou a gerar o Pix do pedido {{order_id}}, mas ele não foi concluído. Se seu banco bloqueou, posso te orientar a tentar outro banco ou gerar novo pagamento.', false, true, 5);

INSERT INTO public.recovery_settings (id, abandonment_timeout_minutes, show_support_button, show_regenerate_pix, mark_hot_on_copy) VALUES
  ('main', 10, true, true, true);

-- TIMESTAMP TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_recovery_messages_updated_at
  BEFORE UPDATE ON public.recovery_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recovery_settings_updated_at
  BEFORE UPDATE ON public.recovery_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
