import { Star, MessageSquare, Calendar, ExternalLink, Radio, Users, Shield, ArrowRight, ArrowLeft, Zap, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/site/SiteHeader';
import { FloatingButtons } from '@/components/site/FloatingButtons';
import { SiteFooter } from '@/components/site/SiteFooter';
import { AnimatedSection } from '@/components/site/AnimatedSection';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
  return (
    <AnimatedSection delay={index * 0.06}>
      <div className="glass-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 group">
        {/* Channel post header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <div className="h-8 w-8 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">C4</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">C4SH STORE</p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-medium">
            <Shield className="h-2.5 w-2.5" /> Verificado
          </div>
        </div>

        {/* Image — large, prominent */}
        {r.image ? (
          <div className="mx-3 mt-2 rounded-lg overflow-hidden bg-secondary">
            <img
              src={r.image}
              alt={r.shortText}
              className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : (
          <div className="mx-3 mt-2 rounded-lg aspect-[2/1] bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-primary/20" />
          </div>
        )}

        {/* Content */}
        <div className="p-4 pt-3">
          <p className="text-sm font-medium text-foreground mb-1">{r.shortText}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
          <div className="flex gap-0.5 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-primary text-primary" />
            ))}
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

      <div className="container py-8 pb-24 max-w-2xl mx-auto">
        {/* ═══ 1. HEADER ═══ */}
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

        {/* ═══ 2. TRUST TEXT + TOP CTA ═══ */}
        <AnimatedSection delay={0.1}>
          <div className="glass-card rounded-xl p-5 mb-6 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                  {channel.pageSupportText}
                </p>
                <ChannelCTA text={channel.ctaButtonText} link={channel.channelLink} variant="compact" />
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ═══ 3. STATS BAR ═══ */}
        <AnimatedSection delay={0.15}>
          <div className="flex items-center justify-center gap-6 mb-8 text-center">
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

        {/* ═══ 4. SOCIAL PROOF LINE ═══ */}
        <AnimatedSection delay={0.18}>
          <div className="flex items-center gap-2 justify-center mb-6">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs text-muted-foreground">
              Centenas de clientes atendidos · Novas referências adicionadas regularmente
            </p>
          </div>
        </AnimatedSection>

        {/* ═══ 5. FEED (first half) ═══ */}
        <div className="space-y-4">
          {activeRefs.slice(0, Math.ceil(activeRefs.length / 2)).map((r, i) => (
            <ReferenceCard key={r.id} reference={r} index={i} />
          ))}
        </div>

        {/* ═══ 6. MID CTA ═══ */}
        {activeRefs.length > 4 && (
          <AnimatedSection delay={0.1}>
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <ChannelCTA text="Ver todas as atualizações" link={channel.channelLink} variant="compact" />
              <div className="flex-1 h-px bg-border" />
            </div>
          </AnimatedSection>
        )}

        {/* ═══ 7. FEED (second half) ═══ */}
        <div className="space-y-4">
          {activeRefs.slice(Math.ceil(activeRefs.length / 2)).map((r, i) => (
            <ReferenceCard key={r.id} reference={r} index={i} />
          ))}
        </div>

        {/* ═══ 8. FADE OVERLAY ═══ */}
        <div className="relative h-16 -mt-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

        {/* ═══ 9. FINAL CTA BLOCK ═══ */}
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

        {/* ═══ 10. BACK TO STORE ═══ */}
        <AnimatedSection delay={0.15}>
          <div className="mt-4 flex justify-center">
            <Link to="/">
              <Button variant="outline" className="gap-2 border-border hover:border-primary/30 text-muted-foreground hover:text-primary transition-colors">
                <ShoppingBag className="h-4 w-4" /> Voltar para a loja
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
