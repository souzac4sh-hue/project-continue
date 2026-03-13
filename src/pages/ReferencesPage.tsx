import { Star, MessageSquare, Calendar, ExternalLink, Radio, Users, Shield, ArrowRight, Zap, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/site/SiteHeader';
import { FloatingButtons } from '@/components/site/FloatingButtons';
import { SiteFooter } from '@/components/site/SiteFooter';
import { AnimatedSection } from '@/components/site/AnimatedSection';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

function maskName(name: string): string {
  if (!name || name.length <= 2) return name;
  return name.slice(0, 2) + '**';
}

function ChannelCTA({ text, link, variant = 'full' }: { text: string; link: string; variant?: 'full' | 'compact' }) {
  return (
    <motion.a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group flex items-center justify-center gap-2 gold-gradient text-primary-foreground font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/30 ${
        variant === 'full' ? 'w-full py-4 text-base' : 'px-6 py-3 text-sm'
      }`}
    >
      <ExternalLink className="h-4 w-4" />
      {text}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </motion.a>
  );
}

function ReferenceCard({ reference: r, index }: { reference: any; index: number }) {
  const masked = maskName(r.shortText);

  return (
    <AnimatedSection delay={index * 0.05}>
      <div className="glass-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 group">
        {/* Image — large */}
        {r.image ? (
          <div className="overflow-hidden bg-secondary">
            <img
              src={r.image}
              alt={r.shortText}
              className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-primary/20" />
          </div>
        )}

        {/* Content */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full gold-gradient flex items-center justify-center">
                <span className="text-[7px] font-bold text-primary-foreground">C4</span>
              </div>
              <span className="text-[11px] font-semibold text-foreground">{masked}</span>
            </div>
            <span className="flex items-center gap-1 text-[9px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-full">
              <Shield className="h-2 w-2" /> Verificado
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{r.comment}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-primary text-primary" />
              ))}
            </div>
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Calendar className="h-2 w-2" />
              {new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default function ReferencesPage() {
  const { references, settings } = useStore();
  const channel = settings.referenceChannel;
  const activeRefs = references
    .filter(r => r.active)
    .slice(0, channel.displayCount);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container py-8 pb-24 max-w-3xl mx-auto">
        {/* ═══ HEADER ═══ */}
        <AnimatedSection>
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Radio className="h-3 w-3 animate-pulse" /> Canal Oficial
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
              {channel.pageTitle}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
              {channel.pageSubtitle}
            </p>
          </div>
        </AnimatedSection>

        {/* ═══ TRUST TEXT + TOP CTA ═══ */}
        <AnimatedSection delay={0.1}>
          <div className="glass-card rounded-xl p-5 mb-6 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                  Veja abaixo algumas referências de clientes que já compraram e receberam seus pedidos.
                </p>
                <ChannelCTA text={channel.ctaButtonText} link={channel.channelLink} variant="compact" />
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ═══ STATS BAR ═══ */}
        <AnimatedSection delay={0.15}>
          <div className="flex items-center justify-center gap-6 mb-4 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{activeRefs.length}+</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Referências</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="flex items-center gap-1 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Avaliação</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-lg font-bold text-foreground">100%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entregue</p>
            </div>
          </div>
        </AnimatedSection>

        {/* ═══ SOCIAL PROOF LINE ═══ */}
        <AnimatedSection delay={0.18}>
          <div className="flex items-center gap-2 justify-center mb-6">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs text-muted-foreground">
              Novas referências são adicionadas regularmente
            </p>
          </div>
        </AnimatedSection>

        {/* ═══ GRID FEED ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {activeRefs.map((r, i) => (
            <ReferenceCard key={r.id} reference={r} index={i} />
          ))}
        </div>

        {/* ═══ FADE OVERLAY ═══ */}
        <div className="relative h-12 -mt-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

        {/* ═══ FINAL CTA BLOCK ═══ */}
        <AnimatedSection delay={0.1}>
          <div className="glass-card rounded-xl p-6 mt-4 text-center border border-primary/20 space-y-4">
            <div className="inline-flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-serif font-bold text-foreground">Quer ver todas as referências?</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {channel.ctaFinalText}
            </p>
            <ChannelCTA text={channel.ctaButtonText} link={channel.channelLink} />
          </div>
        </AnimatedSection>

        {/* ═══ BACK TO STORE ═══ */}
        <AnimatedSection delay={0.15}>
          <div className="mt-4 flex justify-center">
            <Link to="/">
              <Button variant="outline" className="gap-2 border-border hover:border-primary/30 text-muted-foreground hover:text-primary transition-colors">
                <ShoppingBag className="h-4 w-4" /> Ver produtos da loja
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>

      <SiteFooter />
      <FloatingButtons />
    </div>
  );
}
