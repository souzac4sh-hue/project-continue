import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { ShoppingBag, BookOpen, Star, Users } from 'lucide-react';

export function SiteFooter() {
  const { settings } = useStore();
  const { brand } = settings;

  return (
    <footer className="border-t border-border/30 bg-card/40 pb-24" role="contentinfo">
      <div className="container py-10">
        <div className="flex flex-col items-center text-center gap-5">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.brandName} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center shadow-sm shadow-primary/20">
              <span className="text-[11px] font-black text-primary-foreground tracking-tight">C4</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            {settings.footerText}
          </p>

          <nav className="flex flex-wrap justify-center gap-5 text-xs" aria-label="Links do rodapé">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <ShoppingBag className="h-3 w-3" /> Loja
            </Link>
            <Link to="/metodos" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" /> Métodos
            </Link>
            <Link to="/referencias" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Star className="h-3 w-3" /> Referências
            </Link>
            <a
              href={settings.vipGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
            >
              <Users className="h-3 w-3" /> Grupo VIP
            </a>
          </nav>

          <div className="h-px w-24 bg-border/50" />

          <p className="text-[10px] text-muted-foreground/50">
            © 2025 {brand.brandName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
