import { Star, ArrowRight, MessageCircle, Radio, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedSection } from './AnimatedSection';
import { useStore } from '@/context/StoreContext';

export function ReferencesPreview() {
  const { references, settings } = useStore();
  const active = references.filter(r => r.active).slice(0, 4);

  if (active.length === 0) return null;

  return (
    <AnimatedSection className="container py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
            Clientes satisfeitos
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Resultados reais de clientes da C4SH STORE.</p>
        </div>
        <Link
          to="/referencias"
          className="text-xs text-primary flex items-center gap-1 hover:underline shrink-0 font-medium"
          aria-label="Ver todas as referências"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {active.map((ref, i) => (
          <AnimatedSection key={ref.id} delay={i * 0.08}>
            <div className="glass-card rounded-xl overflow-hidden">
              {ref.image ? (
                <img src={ref.image} alt="" className="w-full h-auto object-cover" loading="lazy" decoding="async" />
              ) : (
                <div className="aspect-square bg-secondary/50 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-primary/20" />
                </div>
              )}
              <div className="p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-foreground">{ref.shortText?.slice(0, 2)}**</span>
                  <span className="flex items-center gap-0.5 text-[8px] text-primary bg-primary/10 px-1 py-0.5 rounded-full">
                    <Shield className="h-2 w-2" /> Verificado
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{ref.comment}</p>
                <div className="flex gap-0.5 mt-1">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-2 w-2 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <Link
        to="/referencias"
        className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
      >
        Ver todas as referências
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </AnimatedSection>
  );
}
