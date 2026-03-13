import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Play, Users, Check, ShieldCheck, Zap, Clock, TrendingUp, MessageCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { trackCheckoutEvent } from '@/lib/checkoutTracker';
import { useStore } from '@/context/StoreContext';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { FloatingButtons } from '@/components/site/FloatingButtons';
import { FloatingNotifications } from '@/components/site/FloatingNotifications';
import { ProductTrustBlock } from '@/components/site/ProductTrustBlock';
import { PaymentMethods } from '@/components/site/PaymentMethods';
import { SimilarProducts } from '@/components/site/SimilarProducts';
import { AnimatedSection } from '@/components/site/AnimatedSection';
import { StarRating } from '@/components/site/StarRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

// fakeReviews now come from settings

export default function ProductPage() {
  const { id } = useParams();
  const { products, settings, addOrder, references } = useStore();
  const product = products.find(p => p.slug === id || p.id === id);
  const navigate = useNavigate();
  const [buyOpen, setBuyOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Produto não encontrado.</p>
          <Link to="/" className="text-primary underline mt-4 inline-block">Voltar à loja</Link>
        </div>
      </div>
    );
  }

  const finalPrice = product.promotion && product.promotionPrice ? product.promotionPrice : product.price;
  const seed = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const reviewCount = 40 + (seed % 160);
  const recentBuyers = 15 + (seed % 30);

  const handlePurchase = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          productId: product.id,
          productName: product.name,
          amount: finalPrice,
          customerName: name.trim(),
          customerPhone: phone.trim(),
        },
      });

      if (error || !data?.pixCode) {
        toast({ title: 'Erro ao gerar Pix', description: data?.error || 'Tente novamente.', variant: 'destructive' });
        setIsProcessing(false);
        return;
      }

      // Track form submitted event
      if (data.orderId) {
        trackCheckoutEvent(data.orderId, 'form_submitted', { product_name: product.name, amount: finalPrice } as Record<string, string | number>);
        trackCheckoutEvent(data.orderId, 'pix_generated');
      }

      setBuyOpen(false);
      setName('');
      setPhone('');

      // Navigate to checkout page
      const params = new URLSearchParams({
        orderId: data.orderId,
        pixCode: data.pixCode,
        productName: data.productName,
        amount: String(data.amount),
        productPrice: String(data.productPrice || finalPrice),
        productId: product.id,
        customerName: name.trim(),
        customerPhone: phone.trim(),
      });
      navigate(`/checkout?${params.toString()}`);
    } catch {
      toast({ title: 'Erro de conexão', description: 'Verifique sua internet e tente novamente.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const activeRefs = references.filter(r => r.active).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container py-6 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="aspect-video rounded-xl bg-secondary flex items-center justify-center mb-5 overflow-hidden relative"
        >
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
          )}
          {/* Live badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-primary/20">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-foreground/80">ONLINE</span>
          </div>
        </motion.div>

        {/* Urgency bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-center gap-3 mb-4 flex-wrap"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            <TrendingUp className="h-3 w-3" /> Alta demanda
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> Última venda há poucos minutos
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            🔥 {recentBuyers} compraram hoje
          </span>
        </motion.div>

        {/* Name & Price */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-foreground">{product.name}</h1>

          {/* Star Rating */}
          <div className="mb-3">
            <StarRating rating={5} count={reviewCount} size="md" />
          </div>

          {product.promotion && product.promotionPrice ? (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-muted-foreground line-through text-lg">R$ {product.price.toFixed(2)}</span>
              <span className="gold-text text-2xl font-bold">R$ {product.promotionPrice.toFixed(2)}</span>
              <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                -{Math.round((1 - product.promotionPrice / product.price) * 100)}%
              </span>
            </div>
          ) : (
            <p className="gold-text text-2xl font-bold mb-2">R$ {product.price.toFixed(2)}</p>
          )}
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
            <svg viewBox="0 0 512 512" className="h-3 w-3 fill-primary/60" aria-hidden="true"><path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C347.6 377.6 342.7 391.2 331.2 392.4C252.7 400.7 183.6 358.3 152.5 295.4L134.6 313.3C129.2 318.7 119.9 318.7 114.5 313.3L37.5 236.3C32.1 230.9 32.1 221.6 37.5 216.2L114.5 139.2C119.9 133.8 129.2 133.8 134.6 139.2L211.6 216.2C217 221.6 217 230.9 211.6 236.3L193.7 254.2C217.1 267.9 242.4 278.1 269.5 283.5L242.4 292.5zM464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256z"/></svg>
            À vista no Pix
          </p>

          <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
            {product.fullDescription || product.description}
          </p>
        </motion.div>

        {/* Benefits */}
        {product.benefits && product.benefits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass-card rounded-xl p-4 mb-6"
          >
            <h3 className="font-serif font-semibold text-sm mb-3 text-foreground">O que está incluso</h3>
            <ul className="space-y-2">
              {product.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Notes */}
        {product.notes && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">{product.notes}</p>
          </div>
        )}

        {/* Video */}
        {product.videoUrl && (
          <div className="mb-6">
            <h3 className="font-serif font-semibold mb-3 flex items-center gap-2 text-foreground text-sm">
              <Play className="h-4 w-4 text-primary" /> Tutorial
            </h3>
            <div className="aspect-video rounded-xl bg-secondary flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground/30" />
            </div>
          </div>
        )}

        {/* Como funciona */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="glass-card rounded-xl p-4 mb-6"
        >
          <h3 className="font-serif font-semibold text-sm mb-3 text-foreground">Como funciona</h3>
          <ol className="space-y-2.5">
            {[
              'Faça seu pedido diretamente pelo site',
              'Envie as informações necessárias',
              'Receba confirmação no WhatsApp',
              'Pedido finalizado com agilidade',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col gap-3 mb-4"
          id="comprar"
        >
          <Button
            onClick={() => setBuyOpen(true)}
            className="w-full gold-gradient text-primary-foreground font-bold py-7 text-base rounded-xl hover:scale-[1.02] transition-transform pulse-glow shadow-lg shadow-primary/20"
          >
            <ShoppingBag className="h-5 w-5 mr-2" /> Comprar Agora — R$ {finalPrice.toFixed(2)}
          </Button>
          <a href={settings.vipGroupLink} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full py-5 text-sm rounded-xl border-primary/30 text-primary hover:bg-primary/10">
              <Users className="h-4 w-4 mr-2" /> Entrar no Grupo VIP
            </Button>
          </a>
        </motion.div>

        {/* Trust seals below CTA */}
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary/70" /> Entrega rápida
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary/70" /> Processo seguro
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5 text-primary/70" /> Suporte via WhatsApp
          </span>
        </div>

        {/* Trust Block */}
        <div className="mb-8">
          <ProductTrustBlock />
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <PaymentMethods />
        </div>

        {/* Customer Reviews */}
        <AnimatedSection className="mb-8">
          <h3 className="font-serif font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" /> Avaliações de clientes
          </h3>
          <div className="space-y-2.5">
            {settings.fakeReviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-xl p-3.5"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-primary">{review.name}</span>
                  <span className="text-[10px] text-muted-foreground/60">{review.time}</span>
                </div>
                <StarRating rating={review.rating} size="sm" />
                <p className="text-sm text-muted-foreground mt-1.5 italic">"{review.text}"</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* References related */}
        {activeRefs.length > 0 && (
          <AnimatedSection className="mb-8">
            <h3 className="font-serif font-semibold text-sm text-foreground mb-3">Resultados de quem já comprou</h3>
            <div className="space-y-2.5">
              {activeRefs.map(ref => (
                <div key={ref.id} className="glass-card rounded-xl p-3.5">
                  <p className="text-sm text-muted-foreground italic">"{ref.comment}"</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5">{ref.shortText} · {ref.date}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        )}

        {/* Similar Products */}
        <div className="mb-8">
          <SimilarProducts currentProduct={product} />
        </div>
      </div>

      <SiteFooter />

      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif">Finalizar Compra</DialogTitle>
            <DialogDescription>{product.name} — R$ {finalPrice.toFixed(2)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="name">Nome ou nick</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Digite seu nome ou nick" className="mt-1" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="mt-1" maxLength={20} inputMode="tel" />
            </div>

            {/* Trust indicators inside dialog */}
            <div className="flex items-center justify-center gap-3 py-1 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-primary/70" /> Pagamento seguro
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Zap className="h-3 w-3 text-primary/70" /> Confirmação automática
              </span>
            </div>

            <Button onClick={handlePurchase} disabled={isProcessing} className="w-full gold-gradient text-primary-foreground font-bold py-6 rounded-xl text-sm">
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando Pix...</>
              ) : (
                <>Confirmar Pedido — R$ {finalPrice.toFixed(2)}</>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground/60">
              +1.000 pedidos realizados com sucesso
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <FloatingButtons />
      <FloatingNotifications />
    </div>
  );
}
