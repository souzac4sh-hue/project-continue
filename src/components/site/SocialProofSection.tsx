import { Activity, ShieldCheck, Clock, ShoppingBag, CreditCard, CheckCircle } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { useStore } from '@/context/StoreContext';

const timeOffsets = ['há 2 min', 'há 5 min', 'há 12 min', 'há 18 min', 'há 23 min'];

const activityIcons = [ShoppingBag, CreditCard, CheckCircle, Activity];

export function SocialProofSection() {
  const { activities } = useStore();
  const active = activities.filter(a => a.active).slice(0, 4);

  if (active.length === 0) return null;

  return (
    <AnimatedSection className="container py-8">
      <div className="text-center mb-5">
        <h2 className="font-serif text-lg font-bold text-foreground flex items-center justify-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Atividade recente
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Clientes que já passaram pela C4SH STORE.</p>
      </div>
      <div className="space-y-2.5">
        {active.map((a, i) => {
          const IconComponent = activityIcons[i % activityIcons.length];
          const timeLabel = timeOffsets[i % timeOffsets.length];
          
          return (
            <AnimatedSection key={a.id} delay={i * 0.08}>
              <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 hover:border-primary/20 transition-all">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground/90 leading-relaxed">
                    {a.displayName && (
                      <span className="font-semibold text-primary">{a.displayName} </span>
                    )}
                    {a.message}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground/60">{timeLabel}</span>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500/80 animate-pulse shrink-0" aria-label="Ativo" />
              </div>
            </AnimatedSection>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
