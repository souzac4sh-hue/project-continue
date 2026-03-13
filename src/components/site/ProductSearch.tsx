import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';

export function ProductSearch() {
  const { products } = useStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeProducts = products.filter(p => p.status === 'active');
  const filtered = query.trim().length > 1
    ? activeProducts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="container py-4" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar produtos..."
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 mx-4 mt-1 z-50 rounded-xl bg-card border border-border/50 shadow-xl shadow-black/30 overflow-hidden max-h-64 overflow-y-auto">
          {filtered.map(p => {
            const hasPromo = p.promotion && p.promotionPrice;
            return (
              <Link
                key={p.id}
                to={`/produto/${p.slug || p.id}`}
                onClick={() => { setQuery(''); setOpen(false); }}
                className="flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/20 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                </div>
                <span className="text-sm font-bold text-primary ml-3 shrink-0">
                  R$ {(hasPromo ? p.promotionPrice! : p.price).toFixed(2)}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {open && query.trim().length > 1 && filtered.length === 0 && (
        <div className="absolute left-0 right-0 mx-4 mt-1 z-50 rounded-xl bg-card border border-border/50 shadow-xl shadow-black/30 p-4">
          <p className="text-sm text-muted-foreground text-center">Nenhum produto encontrado</p>
        </div>
      )}
    </div>
  );
}
