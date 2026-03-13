import { ShoppingBag, BookOpen, Users, Star } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/context/StoreContext';

export function FloatingButtons() {
  const { settings } = useStore();
  const location = useLocation();

  const buttons = [
    { icon: ShoppingBag, label: 'Loja', path: '/' },
    { icon: BookOpen, label: 'Métodos', path: '/metodos' },
    { icon: Users, label: 'Grupo VIP', href: settings.vipGroupLink, accent: true },
    { icon: Star, label: 'Referências', path: '/referencias' },
  ];

  return (
    <>
      {/* Desktop: floating VIP button */}
      <div className="fixed bottom-6 right-6 z-50 hidden md:block">
        <motion.a
          href={settings.vipGroupLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full gold-gradient px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-black/30 pulse-glow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Users className="h-4 w-4" />
          Grupo VIP
        </motion.a>
      </div>

      {/* Mobile: fixed bottom action bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        aria-label="Navegação principal"
      >
        {/* Top glow line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div
          className="bg-background/98 backdrop-blur-xl"
          style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.5), 0 -1px 0 rgba(75,130,190,0.08)' }}
        >
          <div className="flex items-center justify-around px-1 py-1.5">
            {buttons.map((btn) => {
              const isActive = btn.path && location.pathname === btn.path;

              if (btn.href) {
                return (
                  <motion.a
                    key={btn.label}
                    whileTap={{ scale: 0.85 }}
                    href={btn.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-muted-foreground"
                    aria-label={btn.label}
                  >
                    <btn.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{btn.label}</span>
                  </motion.a>
                );
              }

              return (
                <motion.div key={btn.label} whileTap={{ scale: 0.85 }}>
                  <Link
                    to={btn.path!}
                    className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-300 relative ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={btn.label}
                  >
                    {/* Active glow pill behind icon */}
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-glow"
                        className="absolute inset-0 rounded-xl bg-primary/[0.06] border border-primary/10"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-0.5">
                      <btn.icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? 'text-foreground' : ''}`} />
                      <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-foreground' : ''}`}>{btn.label}</span>
                    </div>
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-dot"
                        className="absolute -top-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary/50"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </nav>
    </>
  );
}
