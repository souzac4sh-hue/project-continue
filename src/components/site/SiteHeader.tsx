import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, BookOpen, Star, Menu, X, Users } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/context/StoreContext';

const navItems = [
  { label: 'Loja', path: '/', icon: ShoppingBag },
  { label: 'Métodos', path: '/metodos', icon: BookOpen },
  { label: 'Referências', path: '/referencias', icon: Star },
];

export function SiteHeader() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings } = useStore();
  const { brand } = settings;

  const showTopNotif = settings.showTopNotification && settings.topNotificationText;

  const storeModeLabel = settings.storeMode === 'online'
    ? null
    : settings.storeMode === 'busy'
      ? { text: 'Ocupado', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' }
      : { text: 'Offline', color: 'text-destructive bg-destructive/10 border-destructive/20' };

  return (
    <>
      {showTopNotif && (
        <div className="w-full bg-secondary border-b border-border/40 py-1.5 text-center">
          <p className="text-xs font-medium text-foreground/80">{settings.topNotificationText}</p>
        </div>
      )}
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/98 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85">
      <div className="container flex h-14 items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group" aria-label={`${brand.brandName} - Página inicial`}>
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center shadow-sm shadow-black/30 group-hover:shadow-md transition-shadow">
              <span className="text-[10px] font-black text-primary-foreground tracking-tight">C4</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <motion.span
              initial={brand.logoAnimation ? { opacity: 0, y: -4 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-base font-bold gold-text-animated tracking-wide font-sans shimmer-text"
            >
              {brand.brandName}
            </motion.span>
            {storeModeLabel ? (
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${storeModeLabel.color}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span className="text-[8px] font-bold uppercase tracking-wider">{storeModeLabel.text}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/8 border border-emerald-500/15">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-400/90 uppercase tracking-wider">Online</span>
              </span>
            )}
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegação do site">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                location.pathname === item.path
                  ? 'text-foreground bg-secondary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
              aria-current={location.pathname === item.path ? 'page' : undefined}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {location.pathname === item.path && (
                <motion.div
                  layoutId="desktop-nav-indicator"
                  className="absolute bottom-0 left-3 right-3 h-px bg-primary/50"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <a
            href={settings.vipGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-secondary hover:border-border transition-all"
            aria-label="Entrar no Grupo VIP"
          >
            <Users className="h-3.5 w-3.5" />
            Grupo VIP
          </a>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-border/20 bg-background/98 backdrop-blur-xl overflow-hidden"
          >
            <nav className="container py-3 flex flex-col gap-1" aria-label="Menu mobile">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-foreground bg-secondary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <a
                href={settings.vipGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                <Users className="h-5 w-5" />
                Grupo VIP
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  );
}