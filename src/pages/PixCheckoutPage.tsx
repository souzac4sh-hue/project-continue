import { useEffect, useState, useCallback, useRef } from 'react';
import { NinjaAssistant } from '@/components/site/NinjaAssistant';
import { useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, ArrowLeft, Loader2, ShieldCheck, Clock,
  ExternalLink, CheckCircle2, XCircle, MessageSquare,
  AlertTriangle, Smartphone, RefreshCw, HelpCircle, Zap, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { trackCheckoutEvent, updateLeadStatus, markPixCopied, markAbandoned, markSupportContacted } from '@/lib/checkoutTracker';

type CheckoutState = 'loading' | 'awaiting' | 'waiting_confirm' | 'paid' | 'error' | 'expired';

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

function PaidAutoRedirect({ whatsappUrl }: { whatsappUrl: string }) {
  const [sec, setSec] = useState(5);
  useEffect(() => {
    const t = setInterval(() => setSec(p => {
      if (p <= 1) { clearInterval(t); window.open(whatsappUrl, '_blank'); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [whatsappUrl]);
  return (
    <div className="space-y-3 mt-2">
      <p className="text-xs text-muted-foreground">Redirecionando em {sec}s...</p>
      <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-base py-6" onClick={() => window.open(whatsappUrl, '_blank')}>
        <MessageSquare className="h-5 w-5 mr-2" /> 📦 Receber meu produto
      </Button>
    </div>
  );
}

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

  // Debug only with ?debug=1
  const DEBUG_PIX = searchParams.get('debug') === '1';
  const [debugInfo, setDebugInfo] = useState({
    pollCount: 0,
    lastCheck: '',
    lastDbStatus: '',
    lastEdgeStatus: '',
    lastError: '',
    gatewayStatus: '',
    providerIdentifier: '',
    webhookDetected: false,
  });

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
    toast({ title: '✔ Código Pix copiado!', description: 'Cole no app do seu banco para pagar.' });
    setTimeout(() => setCopied(false), 3000);
    if (orderId) {
      markPixCopied(orderId);
    }
  }, [pixCode, orderId]);

  // Poll for payment status - dual strategy: fast DB poll + edge function fallback
  useEffect(() => {
    if (!orderId || state === 'paid' || state === 'error' || state === 'expired') return;

    let pollCount = 0;

    const checkDb = async (): Promise<boolean> => {
      try {
        const { data, error } = await supabase.rpc('get_pix_order_status', {
          order_identifier: orderId,
        });
        if (error) {
          console.error('[PIX_FRONTEND] DB poll error:', error);
          setDebugInfo(prev => ({ ...prev, lastError: `DB: ${error.message}` }));
          return false;
        }
        const row = Array.isArray(data) ? data[0] : data;
        const dbStatus = row?.payment_status || 'unknown';
        console.log('[PIX_FRONTEND] DB poll result:', dbStatus, 'gateway:', row?.gateway_status, 'provider:', row?.provider_identifier);
        setDebugInfo(prev => ({
          ...prev,
          lastDbStatus: dbStatus,
          gatewayStatus: row?.gateway_status || '',
          providerIdentifier: row?.provider_identifier || '',
          webhookDetected: dbStatus === 'paid',
          lastCheck: new Date().toLocaleTimeString(),
        }));
        if (dbStatus === 'paid') {
          console.log('[PIX_FRONTEND] ✅ Payment confirmed via DB poll:', orderId);
          setState('paid');
          trackCheckoutEvent(orderId, 'payment_confirmed');
          return true;
        }
        if (dbStatus === 'expired' || dbStatus === 'failed') {
          setState(dbStatus === 'expired' ? 'expired' : 'error');
          return true;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[PIX_FRONTEND] DB poll exception:', msg);
        setDebugInfo(prev => ({ ...prev, lastError: `DB exception: ${msg}` }));
      }
      return false;
    };

    const checkEdgeFunction = async (): Promise<boolean> => {
      try {
        console.log('[PIX_FRONTEND] Calling check-pix-status edge function for:', orderId);
        const { data, error } = await supabase.functions.invoke('check-pix-status', {
          body: { orderId },
        });
        if (error) {
          console.error('[PIX_FRONTEND] check-pix-status error:', error);
          setDebugInfo(prev => ({ ...prev, lastError: `Edge: ${error.message}` }));
          return false;
        }
        console.log('[PIX_FRONTEND] check-pix-status response:', JSON.stringify(data));
        setDebugInfo(prev => ({ ...prev, lastEdgeStatus: data?.status || 'unknown' }));
        if (data?.status === 'paid') {
          console.log('[PIX_FRONTEND] ✅ Payment confirmed via edge function:', orderId);
          setState('paid');
          trackCheckoutEvent(orderId, 'payment_confirmed');
          return true;
        }
        if (data?.status === 'expired' || data?.status === 'failed') {
          setState(data.status === 'expired' ? 'expired' : 'error');
          return true;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[PIX_FRONTEND] Edge function exception:', msg);
        setDebugInfo(prev => ({ ...prev, lastError: `Edge exception: ${msg}` }));
      }
      return false;
    };

    const check = async () => {
      pollCount++;
      console.log('[PIX_FRONTEND] Poll #' + pollCount + ' for order:', orderId);
      setDebugInfo(prev => ({ ...prev, pollCount }));

      // Fast path: check DB directly (instant, no external API call)
      const dbResult = await checkDb();
      if (dbResult) return;

      // Every 3rd poll, also try edge function (which probes SigiloPay API)
      if (pollCount % 3 === 0) {
        await checkEdgeFunction();
      }
    };

    const interval = setInterval(check, 3000);
    check();
    return () => clearInterval(interval);
  }, [orderId, state]);

  // Countdown timer
  useEffect(() => {
    if (state !== 'awaiting' && state !== 'waiting_confirm') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setState('expired');
          if (orderId) {
            markAbandoned(orderId);
            trackCheckoutEvent(orderId, 'pix_expired');
          }
          return 0;
        }
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
    trackCheckoutEvent(orderId, 'whatsapp_redirected');
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

      if (orderId) {
        trackCheckoutEvent(orderId, 'new_pix_generated', { new_order_id: data.orderId });
      }
      setOrderId(data.orderId);
      setPixCode(data.pixCode);
      setCountdown(TIMER_SECONDS);
      setElapsed(0);
      setShowNudge(false);
      setState('awaiting');
      setCopied(false);
      trackedScreenOpen.current = false;
    } finally {
      setIsRegenerating(false);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const isUrgent = countdown <= URGENCY_THRESHOLD && countdown > 0;
  const timerProgress = countdown / TIMER_SECONDS;

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-6 relative">
      {/* DEBUG PANEL */}
      {DEBUG_PIX && (
        <div className="fixed top-2 right-2 z-[9999] bg-black/90 text-green-400 font-mono text-[10px] p-3 rounded-lg max-w-xs shadow-xl border border-green-500/30 overflow-auto max-h-[50vh]">
          <div className="font-bold text-green-300 mb-1">🐛 PIX DEBUG</div>
          <div>Order: {orderId?.substring(0, 8)}...</div>
          <div>Provider: {debugInfo.providerIdentifier?.substring(0, 12) || 'N/A'}</div>
          <div>State: <span className={state === 'paid' ? 'text-green-300' : 'text-yellow-300'}>{state}</span></div>
          <div>DB Status: <span className={debugInfo.lastDbStatus === 'paid' ? 'text-green-300' : 'text-yellow-300'}>{debugInfo.lastDbStatus || '...'}</span></div>
          <div>Edge Status: {debugInfo.lastEdgeStatus || '...'}</div>
          <div>Gateway: {debugInfo.gatewayStatus || 'N/A'}</div>
          <div>Webhook: {debugInfo.webhookDetected ? '✅ YES' : '❌ NO'}</div>
          <div>Polls: {debugInfo.pollCount}</div>
          <div>Last Check: {debugInfo.lastCheck || '...'}</div>
          {debugInfo.lastError && <div className="text-red-400 mt-1">Error: {debugInfo.lastError}</div>}
        </div>
      )}
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
        className="w-full max-w-md space-y-3"
      >
        {/* Header */}
        <div className="text-center mb-1">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar à loja
          </Link>
          <h1 className="font-serif text-xl font-bold text-foreground">Pagamento Pix</h1>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
          {/* Product Info */}
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Produto</p>
              <p className="font-semibold text-foreground text-sm">{productName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Valor</p>
              <p className="font-bold text-foreground text-xl">R$ {amount.toFixed(2)}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* AWAITING / WAITING_CONFIRM */}
            {isActive && (
              <motion.div key="awaiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2">
                  {state === 'waiting_confirm' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-semibold text-primary">{ct.waitingTitle}</span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full">
                      <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="text-sm font-medium text-yellow-500">Aguardando pagamento</span>
                    </div>
                  )}
                </div>

                {/* Waiting confirm helper text */}
                {state === 'waiting_confirm' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-center space-y-1"
                  >
                    <p className="text-[11px] text-muted-foreground/80">
                      {ct.waitingSubtitle}
                    </p>
                    <p className="text-[11px] text-primary/70 font-medium">
                      O sistema detecta o pagamento automaticamente
                    </p>
                  </motion.div>
                )}

                {/* Timer with progress bar */}
                <div className="space-y-1.5">
                  <div className={`flex items-center justify-center gap-1.5 text-xs transition-colors ${
                    isUrgent ? 'text-destructive font-bold' : 'text-muted-foreground'
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    {isUrgent ? (
                      <span>⚠️ {ct.urgencyMessage} — {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                    ) : (
                      <span>Pix expira em {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${isUrgent ? 'bg-destructive' : 'bg-primary/60'}`}
                      style={{ width: `${timerProgress * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Cent variation note */}
                <p className="text-[10px] text-center text-muted-foreground/60">
                  {ct.centVariationNote}
                </p>

                {/* Instruction */}
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-medium text-foreground">
                    Escaneie o QR Code ou copie o código abaixo
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Após o pagamento, a confirmação é automática
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-xl ring-1 ring-border/20 shadow-black/20">
                    <QRCodeSVG value={pixCode} size={180} level="M" className="sm:w-[200px] sm:h-[200px]" />
                  </div>
                </div>

                {/* Pix Code */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 text-center font-medium">Pix Copia e Cola</p>
                  <div className="bg-secondary/50 rounded-xl p-3 break-all text-[11px] text-muted-foreground font-mono max-h-16 overflow-y-auto leading-relaxed">
                    {pixCode}
                  </div>
                </div>

                {/* Copy Button — large, prominent */}
                <Button
                  onClick={handleCopy}
                  className={`w-full py-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                    copied
                      ? 'bg-emerald-600 hover:bg-emerald-600 text-white scale-[1.02]'
                      : 'gold-gradient text-primary-foreground pulse-glow shadow-lg shadow-black/30'
                  }`}
                >
                  {copied ? (
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Check className="h-5 w-5" /> Código Pix copiado! Cole no app do banco
                    </motion.span>
                  ) : (
                    <><Copy className="h-5 w-5 mr-2" /> Copiar código Pix</>
                  )}
                </Button>

                {/* Generate New Pix */}
                {elapsed >= 30 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Button
                      variant="outline"
                      onClick={handleRegeneratePix}
                      disabled={isRegenerating}
                      className="w-full h-10 text-xs border-border/50 hover:border-border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isRegenerating ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Gerando novo Pix...</>
                      ) : (
                        <><RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Gerar novo Pix</>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Trust strip */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <TrustPill icon={<ShieldCheck className="h-3 w-3" />} text="Pix seguro" />
                  <TrustPill icon={<Zap className="h-3 w-3" />} text="Confirmação automática" />
                  <TrustPill icon={<Lock className="h-3 w-3" />} text="Entrega rápida" />
                </div>

                {/* Gateway alert (subtle) */}
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-muted-foreground/60">
                    {ct.gatewayAlertText}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {ct.transferAnywayText}
                  </p>
                </div>
              </motion.div>
            )}

            {/* PAID */}
            {state === 'paid' && (
              <motion.div key="paid" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                  <div className="relative inline-block">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-green-500/30"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 1.2, repeat: 2 }}
                    />
                  </div>
                </motion.div>
                <h2 className="font-serif text-lg font-bold text-foreground">{ct.paidTitle}</h2>
                <p className="text-sm text-muted-foreground">Clique no botão abaixo para receber seu produto via WhatsApp</p>
                <PaidAutoRedirect whatsappUrl={buildWhatsAppUrl(settings.whatsappNumber, orderId!, productName!)} />
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
                className="glass-card rounded-2xl p-4 border border-yellow-500/20"
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
                      className="h-8 text-xs border-border/50 text-foreground/70 mt-1"
                      onClick={() => { if (orderId) markSupportContacted(orderId); window.open(supportUrl, '_blank'); }}
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

        {/* ── Guidance Block (compact) ── */}
        {isActive && (
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-foreground/60" />
              <h3 className="text-sm font-semibold text-foreground">{ct.guidanceTitle}</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {ct.guidanceDescription}
            </p>

            <div className="space-y-2">
              <GuidanceItem
                icon={<CheckCircle2 className="h-3.5 w-3.5 text-foreground/50" />}
                text={ct.guidanceTip1}
              />
              <GuidanceItem
                icon={<Smartphone className="h-3.5 w-3.5 text-foreground/50" />}
                text={ct.guidanceTip2}
              />
              <GuidanceItem
                icon={<RefreshCw className="h-3.5 w-3.5 text-foreground/50" />}
                text={ct.guidanceTip3}
              />
            </div>

            {/* Support as last resort */}
            <div className="border-t border-border/30 pt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs border-border/50 hover:border-border text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { if (orderId) markSupportContacted(orderId); window.open(supportUrl, '_blank'); }}
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Falar com suporte no WhatsApp
              </Button>
            </div>
          </div>
        )}
      </motion.div>
      <NinjaAssistant context="checkout" />
    </div>
  );
}

/* ── Subcomponents ── */

function TrustPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-xl bg-secondary/50 border border-border/20">
      <span className="text-foreground/50">{icon}</span>
      <span className="text-[9px] text-muted-foreground text-center leading-tight font-medium">{text}</span>
    </div>
  );
}

function GuidanceItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
