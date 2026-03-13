import { Crown, ArrowRight, Gift, Lock, Sparkles, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedSection } from './AnimatedSection';
import { useStore } from '@/context/StoreContext';

const benefits = [
  { icon: Lock, text: 'Métodos privados e exclusivos' },
  { icon: Gift, text: 'Promoções e drops limitados' },
  { icon: Sparkles, text: 'Conteúdos antes de todos' },
  { icon: Bell, text: 'Alertas de oportunidades' },
];

export function VipCTA() {
  const { settings } = useStore();

  return (
    <AnimatedSection className="container py-8">
      <div className="relative overflow-hidden rounded-2xl gold-gradient p-7 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/15 to-black/40" />
        {/* Decorative elements */}
        <div className="absolute top-3 left-3 w-16 h-16 rounded-full border border-white/5" />
        <div className="absolute bottom-3 right-3 w-24 h-24 rounded-full border border-white/5" />

        <div className="relative z-10">
          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 animate-float">
            <Crown className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="font-serif text-xl font-bold text-primary-foreground mb-2">Grupo VIP C4SH STORE</h2>
          <p className="text-xs text-primary-foreground/70 max-w-xs mx-auto mb-5 leading-relaxed">
            Entre no grupo e receba novidades, oportunidades e atualizações primeiro.
          </p>

          <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto mb-6">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-2 bg-white/8 rounded-lg px-3 py-2 text-left"
              >
                <b.icon className="h-3.5 w-3.5 text-primary-foreground/70 shrink-0" />
                <span className="text-[10px] text-primary-foreground/85 font-medium leading-tight">{b.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.a
            href={settings.vipGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-background font-bold text-sm px-7 py-3.5 rounded-xl shadow-lg"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            aria-label="Entrar no Grupo VIP via WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.458-1.495A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.724-5.993-1.953a.75.75 0 00-.597-.108l-3.071 1.03 1.03-3.071a.75.75 0 00-.108-.597A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Entrar no Grupo VIP
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.a>
        </div>
      </div>
    </AnimatedSection>
  );
}