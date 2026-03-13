import { TrendingUp, Clock, Users, Star } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
          const duration = 1800;
          const steps = 50;
          const stepTime = duration / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 4);
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
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -2, transition: { duration: 0.25 } }}
              className="relative rounded-xl border border-border/30 bg-card p-4 text-center group cursor-default overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(10,132,255,0.08)] hover:border-border/50"
            >
              {/* Subtle radial highlight */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-primary/[0.03] blur-2xl group-hover:bg-primary/[0.06] transition-all duration-500 pointer-events-none" />
              {/* Inner top highlight line */}
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                  className="h-11 w-11 rounded-full bg-secondary border border-border/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_12px_rgba(10,132,255,0.06)] group-hover:shadow-[0_0_16px_rgba(10,132,255,0.12)] group-hover:border-primary/20 transition-all duration-300"
                >
                  <Icon className="h-5 w-5 text-foreground/50 group-hover:text-foreground/70 transition-colors duration-300" />
                </motion.div>
                <p className="font-sans text-xl font-extrabold text-foreground leading-tight tracking-tight">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} format={stat.format} />
                </p>
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight font-medium tracking-wide uppercase">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground/50 text-center mt-5 italic">Resultados construídos com consistência.</p>
    </AnimatedSection>
  );
}
