import { TrendingUp, Clock, Users, Star } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/context/StoreContext';

const iconMap = [TrendingUp, Clock, Users, Star];

function AnimatedCounter({ target, suffix, format }: { target: number; suffix: string; format: boolean }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!ref.current || hasAnimated.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          if (target === 0) { setCount(0); return; }
          const duration = 1500;
          const steps = 40;
          const stepTime = duration / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * eased));
            if (step >= steps) clearInterval(timer);
          }, stepTime);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const display = target === 0
    ? suffix
    : format
      ? `${count.toLocaleString('pt-BR')}${suffix}`
      : `${count}${suffix}`;

  return <span ref={ref}>{display}</span>;
}

export function AuthoritySection() {
  const { settings } = useStore();
  const stats = settings.authorityStats;

  return (
    <AnimatedSection className="container py-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = iconMap[i % iconMap.length];
          return (
            <AnimatedSection key={i} delay={i * 0.1}>
              <div className="glass-card rounded-xl p-4 text-center group shimmer hover:border-primary/25 hover:shadow-[0_4px_20px_hsl(43_74%_49%/0.1)] transition-all duration-300">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2.5 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(43_74%_49%/0.15)] transition-all duration-300">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-serif text-lg font-bold gold-text leading-tight">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} format={stat.format} />
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{stat.label}</p>
              </div>
            </AnimatedSection>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground text-center mt-4 italic">Resultados construídos com consistência.</p>
    </AnimatedSection>
  );
}
