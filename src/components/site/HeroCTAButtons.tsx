import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/context/StoreContext';
import { AnimatedSection } from './AnimatedSection';

export function HeroCTAButtons() {
  const { heroButtons, settings } = useStore();
  const activeButtons = heroButtons.filter(b => b.active);

  if (activeButtons.length === 0) return null;

  return (
    <AnimatedSection className="container py-5">
      <div className="text-center mb-4">
        <h2 className="font-serif text-base font-bold gold-text">{settings.brand.brandName}</h2>
        <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
          {settings.brand.slogan}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {activeButtons.map((btn) => {
          const isVip = btn.variant === 'primary';
          const link = isVip ? settings.vipGroupLink : btn.link;
          const external = isVip ? true : btn.link.startsWith('http');

          const icon = isVip ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.458-1.495A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.724-5.993-1.953a.75.75 0 00-.597-.108l-3.071 1.03 1.03-3.071a.75.75 0 00-.108-.597A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
          ) : <Star className="h-4 w-4" />;

          const className = isVip
            ? 'flex items-center justify-center gap-2 rounded-xl gold-gradient text-primary-foreground font-bold py-4 text-sm transition-all active:scale-[0.97]'
            : 'flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card text-foreground font-bold py-4 text-sm transition-all active:scale-[0.97] hover:border-primary/60 hover:bg-primary/5';

          if (external) {
            return (
              <motion.a
                key={btn.id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {icon}
                {btn.label}
              </motion.a>
            );
          }

          return (
            <motion.div key={btn.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link to={link} className={className}>
                {icon}
                {btn.label}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
