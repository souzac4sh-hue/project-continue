import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/context/StoreContext';

export function HeroCarousel() {
  const { heroBanners, settings } = useStore();
  const banners = heroBanners.filter(b => b.active).sort((a, b) => a.order - b.order);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (!settings.heroAutoplay || banners.length <= 1 || paused) return;
    const ms = (settings.autoplayInterval || 5) * 1000;
    const interval = setInterval(next, ms);
    return () => clearInterval(interval);
  }, [settings.heroAutoplay, settings.autoplayInterval, banners.length, next, paused]);

  useEffect(() => {
    if (!paused) return;
    const t = setTimeout(() => setPaused(false), 6000);
    return () => clearTimeout(t);
  }, [paused, current]);

  const interact = () => setPaused(true);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      interact();
      touchDeltaX.current > 0 ? prev() : next();
    }
  };

  if (banners.length === 0) return null;

  const banner = banners[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '30%' : '-30%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-30%' : '30%', opacity: 0 }),
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[16/7] md:aspect-[21/8] w-full overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.a
            key={current}
            href={banner.link || '#'}
            onClick={() => interact()}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 block"
          >
            {banner.image ? (
              <img src={banner.image} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            ) : (
              <div className="absolute inset-0 bg-secondary" />
            )}
            {/* Deeper gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />
            {!banner.image && <div className="absolute inset-0 gold-gradient opacity-[0.08]" />}

            {(banner.title || banner.subtitle) && (
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 md:pb-14 text-center px-6">
                {banner.title && (
                  <motion.h2
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="font-serif text-xl sm:text-2xl md:text-4xl font-bold gold-text leading-tight"
                    style={{ textShadow: '0 2px 20px hsl(200 100% 50% / 0.3), 0 4px 40px hsl(0 0% 0% / 0.5)' }}
                  >
                    {banner.title}
                  </motion.h2>
                )}
                {banner.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-xs md:text-sm text-foreground/70 max-w-md mt-1.5"
                    style={{ textShadow: '0 1px 8px hsl(0 0% 0% / 0.6)' }}
                  >
                    {banner.subtitle}
                  </motion.p>
                )}
              </div>
            )}
          </motion.a>
        </AnimatePresence>

      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); interact(); prev(); }}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 rounded-full bg-background/60 border border-primary/20 flex items-center justify-center backdrop-blur-md hover:bg-background/80 hover:border-primary/40 transition-all"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); interact(); next(); }}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 rounded-full bg-background/60 border border-primary/20 flex items-center justify-center backdrop-blur-md hover:bg-background/80 hover:border-primary/40 transition-all"
            aria-label="Próximo"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </button>
        </>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { interact(); setCurrent(i); }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-7 h-2 gold-gradient shadow-sm shadow-primary/30'
                  : 'w-2 h-2 bg-foreground/20 hover:bg-foreground/40'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
