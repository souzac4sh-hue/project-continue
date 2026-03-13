import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, ArrowLeft, Loader2, ShieldCheck, Clock,
  ExternalLink, CheckCircle2, XCircle, MessageSquare,
  AlertTriangle, Smartphone, RefreshCw, HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { trackCheckoutEvent, updateLeadStatus, markPixCopied, markAbandoned, markSupportContacted } from '@/lib/checkoutTracker';

type CheckoutState = 'loading' | 'awaiting' | 'waiting_confirm' | 'paid' | 'error' | 'expired';

// These are now derived from settings in the component

const buildWhatsAppUrl = (whatsappNumber: string, orderId: string, productName: string) => {
  const msg = encodeURIComponent(
    `Olá, acabei de pagar o pedido ${orderId} do produto ${productName}.`
  );
  return `https://wa.me/${whatsappNumber}?text=${msg}`;
};

const buildSupportWhatsAppUrl = (
  whatsappNumber: string,
  orderId: string,
  productName: string,
  amount: number,
  customerName: string,
) => {
  const msg = encodeURIComponent(
    `Olá, estou com dificuldade para pagar o pedido ${orderId} do produto ${productName}, no valor de R$ ${amount.toFixed(2)}. Meu banco exibiu bloqueio ou análise de segurança no Pix.`
  );
  return `https://wa.me/${whatsappNumber}?text=${msg}`;
};

// Social proof names now come from settings

export default function PixCheckoutPage() {
  const [searchParams] = useSearchParams();
  const { settings } = useStore();
  const ct = settings.checkoutTexts;
  const TIMER_SECONDS = ct.pixTimerMinutes * 60;
  const URGENCY_THRESHOLD = ct.pixUrgencyMinutes * 60;
  const socialProofNames = settings.socialProofNames;

  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [pixCode, setPixCode] = useState(searchParams.get('pixCode') || '');
  const productName = searchParams.get('productName') || '';
  const amount = parseFloat(searchParams.get('amount') || '0');
  const customerName = searchParams.get('customerName') || '';

  const [state, setState] = useState<CheckoutState>(pixCode ? 'awaiting' : 'loading');
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(TIMER_SECONDS);
  const [showNudge, setShowNudge] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [socialProof, setSocialProof] = useState<string | null>(null);
  const trackedScreenOpen = useRef(false);

  // Track screen opened
  useEffect(() => {
    if (orderId && !trackedScreenOpen.current) {
      trackedScreenOpen.current = true;
      trackCheckoutEvent(orderId, 'pix_screen_opened');
      updateLeadStatus(orderId, 'pix_generated', 'pix_screen_opened');
    }
  }, [orderId]);

  const handleCopy = useCallback(() => {
    if (!pixCode) return;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setState('waiting_confirm');
    setTimeout(() => setCopied(false), 2500);
  }, [pixCode]);

  // Poll for payment status
  useEffect(() => {
    if (!orderId || state === 'paid' || state === 'error' || state === 'expired') return;
    const check = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-pix-status', {
          body: { orderId },
        });
        if (!error && data?.status === 'paid') setState('paid');
      } catch { /* silently retry */ }
    };
    const interval = setInterval(check, 5000);
    check();
    return () => clearInterval(interval);
  }, [orderId, state]);

  // Countdown timer
  useEffect(() => {
    if (state !== 'awaiting' && state !== 'waiting_confirm') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { setState('expired'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  // Elapsed timer for 60s nudge
  useEffect(() => {
    if (state !== 'awaiting' && state !== 'waiting_confirm') return;
    const timer = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= 60 && !showNudge) setShowNudge(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, showNudge]);

  // Social proof notifications
  useEffect(() => {
    if (state !== 'awaiting' && state !== 'waiting_confirm') return;
    const show = () => {
      const name = socialProofNames[Math.floor(Math.random() * socialProofNames.length)];
      setSocialProof(name);
      setTimeout(() => setSocialProof(null), 4000);
    };
    const firstTimeout = setTimeout(show, 8000);
    // Use recursive setTimeout for varying intervals
    let nextTimer: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      nextTimer = setTimeout(() => {
        show();
        scheduleNext();
      }, 15000 + Math.random() * 10000);
    };
    scheduleNext();
    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(nextTimer);
    };
  }, [state]);

  // Auto redirect to WhatsApp on payment
  useEffect(() => {
    if (state !== 'paid' || !orderId || !productName) return;
    const whatsappUrl = buildWhatsAppUrl(settings.whatsappNumber, orderId, productName);
    const timer = setTimeout(() => { window.open(whatsappUrl, '_blank'); }, 4000);
    return () => clearTimeout(timer);
  }, [state, orderId, productName, settings.whatsappNumber]);

  const handleRegeneratePix = async () => {
    setIsRegenerating(true);
    try {
      const productId = searchParams.get('productId') || 'unknown';
      const productPrice = parseFloat(searchParams.get('productPrice') || searchParams.get('amount') || '0');
      const phone = searchParams.get('customerPhone') || '';
      
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          productId,
          productName,
          amount: productPrice,
          customerName,
          customerPhone: phone,
        },
      });

      if (error || !data?.pixCode) {
        toast({ title: 'Erro ao gerar novo Pix', description: 'Tente novamente.', variant: 'destructive' });
        return;
      }

      setOrderId(data.orderId);
      setPixCode(data.pixCode);
      setCountdown(TIMER_SECONDS);
      setElapsed(0);
      setShowNudge(false);
      setState('awaiting');
      setCopied(false);
    } finally {
      setIsRegenerating(false);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const isUrgent = countdown <= URGENCY_THRESHOLD && countdown > 0;

  const supportUrl = buildSupportWhatsAppUrl(
    settings.whatsappNumber,
    orderId || '',
    productName || '',
    amount,
    customerName,
  );

  const isActive = state === 'awaiting' || state === 'waiting_confirm';

  if (!pixCode || !orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Dados de pagamento inválidos.</p>
          <Link to="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar à loja</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8 relative">
      {/* Social Proof Notification */}
      <AnimatePresence>
        {socialProof && isActive && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-4 left-1/2 z-50 bg-card border border-border/50 rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{socialProof}</span> acabou de finalizar um pedido
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-4"
      >
        {/* Header */}
        <div className="text-center mb-2">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar à loja
          </Link>
          <h1 className="font-serif text-xl font-bold text-foreground">Pagamento Pix</h1>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          {/* Product Info */}
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div>
              <p className="text-xs text-muted-foreground">Produto</p>
              <p className="font-semibold text-foreground text-sm">{productName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className="font-bold text-primary text-lg">R$ {amount.toFixed(2)}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* AWAITING / WAITING_CONFIRM */}
            {isActive && (
              <motion.div key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Status */}
                <div className="flex items-center justify-center gap-2">
                  {state === 'waiting_confirm' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-medium text-primary">{ct.waitingTitle}</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-sm font-medium text-yellow-500">Aguardando pagamento</span>
                    </>
                  )}
                </div>

                {/* Waiting confirm helper text */}
                {state === 'waiting_confirm' && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-[11px] text-center text-muted-foreground/80"
                  >
                    {ct.waitingSubtitle}
                  </motion.p>
                )}

                {/* Timer */}
                <div className={`flex items-center justify-center gap-1.5 text-xs transition-colors ${
                  isUrgent ? 'text-destructive font-semibold' : 'text-muted-foreground'
                }`}>
                  <Clock className="h-3.5 w-3.5" />
                  {isUrgent ? (
                    <span>{ct.urgencyMessage} — {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                  ) : (
                    <span>Este Pix expira em: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                  )}
                </div>

                {/* Cent variation note */}
                <p className="text-[10px] text-center text-muted-foreground/60">
                  {ct.centVariationNote}
                </p>

                {/* UX Tip */}
                <p className="text-[11px] text-center text-muted-foreground">
                  Use o QR Code ou copie o código abaixo para pagar
                </p>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <QRCodeSVG value={pixCode} size={200} level="M" />
                  </div>
                </div>

                {/* Pix Code */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 text-center">Pix Copia e Cola</p>
                  <div className="bg-secondary/50 rounded-xl p-3 break-all text-xs text-muted-foreground font-mono max-h-20 overflow-y-auto">
                    {pixCode}
                  </div>
                </div>

                {/* Copy Button */}
                <Button onClick={handleCopy} className="w-full py-5 rounded-xl font-bold text-sm gold-gradient text-primary-foreground">
                  {copied
                    ? <><Check className="h-4 w-4 mr-2" /> ✔ Código Pix copiado!</>
                    : <><Copy className="h-4 w-4 mr-2" /> Copiar código Pix</>
                  }
                </Button>

                {/* Generate New Pix */}
                {elapsed >= 30 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                      variant="outline"
                      onClick={handleRegeneratePix}
                      disabled={isRegenerating}
                      className="w-full h-10 text-xs border-border hover:border-primary/30 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isRegenerating ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Gerando novo Pix...</>
                      ) : (
                        <><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Gerar novo Pix</>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Trust indicators */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary/60" />
                    {ct.paymentSecureText}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 text-center">
                    {ct.gatewayAlertText}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 text-center">
                    {ct.transferAnywayText}
                  </p>
                </div>
              </motion.div>
            )}

            {/* PAID */}
            {state === 'paid' && (
              <motion.div key="paid" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                </motion.div>
                 <h2 className="font-serif text-lg font-bold text-foreground">{ct.paidTitle}</h2>
                 <p className="text-sm text-muted-foreground">{ct.paidRedirectText}</p>
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                <Button variant="outline" className="mt-4" onClick={() => {
                  const url = buildWhatsAppUrl(settings.whatsappNumber, orderId!, productName!);
                  window.open(url, '_blank');
                }}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Abrir WhatsApp agora
                </Button>
              </motion.div>
            )}

            {/* EXPIRED */}
            {state === 'expired' && (
              <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-6">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                 <h2 className="font-serif text-lg font-bold text-foreground">{ct.expiredTitle}</h2>
                 <p className="text-sm text-muted-foreground">{ct.expiredText}</p>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleRegeneratePix} disabled={isRegenerating} className="gold-gradient text-primary-foreground">
                    {isRegenerating ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" /> Gerar novo Pix</>
                    )}
                  </Button>
                  <Link to="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar à loja</Button></Link>
                </div>
              </motion.div>
            )}

            {/* LOADING */}
            {state === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Gerando Pix...</p>
              </motion.div>
            )}

            {/* ERROR */}
            {state === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-6">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="font-serif text-lg font-bold text-foreground">Erro ao gerar Pix</h2>
                <p className="text-sm text-muted-foreground">Tente novamente ou entre em contato.</p>
                <Link to="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button></Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 60s Nudge ── */}
        {isActive && (
          <AnimatePresence>
            {showNudge && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card rounded-2xl p-5 border border-yellow-500/20"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="space-y-2">
                     <p className="text-sm font-semibold text-foreground">{ct.nudgeTitle}</p>
                     <ul className="text-xs text-muted-foreground leading-relaxed space-y-1">
                       <li>• {ct.nudgeTip1}</li>
                       <li>• {ct.nudgeTip2}</li>
                       <li>• {ct.nudgeTip3}</li>
                     </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-primary/30 text-primary mt-1"
                      onClick={() => window.open(supportUrl, '_blank')}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Falar com suporte
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── Guidance Block ── */}
        {isActive && (
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{ct.guidanceTitle}</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {ct.guidanceDescription}
            </p>

            <p className="text-xs text-muted-foreground font-medium">
              {ct.guidanceBlockedText}
            </p>

            <div className="space-y-3">
              <GuidanceItem
                icon={<CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                text={ct.guidanceTip1}
              />
              <GuidanceItem
                icon={<Smartphone className="h-3.5 w-3.5 text-primary" />}
                text={ct.guidanceTip2}
              />
              <GuidanceItem
                icon={<RefreshCw className="h-3.5 w-3.5 text-primary" />}
                text={ct.guidanceTip3}
              />
            </div>

            {/* Support as last resort */}
            <div className="border-t border-border/30 pt-3 space-y-2.5">
              <p className="text-[11px] text-muted-foreground/70">
                {ct.guidanceSupportText}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs border-border hover:border-primary/30 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => window.open(supportUrl, '_blank')}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Falar com suporte no WhatsApp
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── Subcomponent ── */

function GuidanceItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
