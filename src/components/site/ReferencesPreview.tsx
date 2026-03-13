import { Star, ArrowRight, MessageCircle, Quote, Radio, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedSection } from './AnimatedSection';
import { useStore } from '@/context/StoreContext';

export function ReferencesPreview() {
  const { references, settings } = useStore();
  const active = references.filter(r => r.active).slice(0, 3);
  const channel = settings.referenceChannel;

  if (active.length === 0) return null;

  return (
    <AnimatedSection className="container py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
            Canal de Referências
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Resultados reais de clientes da C4SH STORE.</p>
        </div>
        <Link
          to="/referencias"
          className="text-xs text-primary flex items-center gap-1 hover:underline shrink-0 font-medium"
          aria-label="Ver todas as referências"
        >
          Ver canal <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {active.map((ref, i) => (
          <AnimatedSection key={ref.id} delay={i * 0.1}>
            <div className="glass-card rounded-xl p-4">
              <div className="flex gap-3">
                {ref.image ? (
                  <img src={ref.image} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" loading="lazy" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Quote className="h-3 w-3 text-primary/40 mb-1" aria-hidden="true" />
                  <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2">{ref.comment}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="h-2.5 w-2.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{ref.shortText} · {ref.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* CTA to channel */}
      <AnimatedSection delay={0.35}>
        <a
          href={channel.channelLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {channel.ctaButtonText}
        </a>
      </AnimatedSection>
    </AnimatedSection>
  );
}
