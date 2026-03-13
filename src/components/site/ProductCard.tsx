import { ShoppingBag, Flame, Tag, Zap, Star, Gem, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Product } from '@/data/mockData';
import { StarRating } from './StarRating';

const badgeConfig: Record<string, { icon: typeof Flame; label: string; className: string }> = {
  best_seller: { icon: Flame, label: 'Mais vendido', className: 'bg-orange-500/90 text-white' },
  fast: { icon: Zap, label: 'Rápido', className: 'bg-secondary text-foreground border border-border/50' },
  recommended: { icon: Star, label: 'Recomendado', className: 'bg-emerald-600/90 text-white' },
  premium: { icon: Gem, label: 'Premium', className: 'bg-secondary text-foreground border border-border/50' },
  promo: { icon: Tag, label: 'Promo', className: 'bg-destructive text-destructive-foreground' },
};

function getUrgencyText(product: Product): string | null {
  const seed = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  if (product.bestSeller || product.badge === 'best_seller') {
    const buyers = 15 + (seed % 30);
    return `🔥 ${buyers} pessoas compraram hoje`;
  }
  if (product.badge === 'fast') return '⚡ Entrega imediata';
  if (product.featured) return '📈 Alta demanda';
  return null;
}

export function ProductCard({ product }: { product: Product }) {
  const hasPromo = product.promotion && product.promotionPrice;
  const badge = product.badge ? badgeConfig[product.badge] : null;
  const urgency = getUrgencyText(product);
  const seed = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const reviewCount = 40 + (seed % 160);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        to={`/produto/${product.slug || product.id}`}
        className="glass-card rounded-xl overflow-hidden group block focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 hover:-translate-y-1"
        aria-label={`Ver produto ${product.name} por R$ ${(hasPromo ? product.promotionPrice! : product.price).toFixed(2)}`}
      >
        <div className="aspect-[16/10] bg-secondary flex items-center justify-center relative overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/15" />
              <span className="text-[9px] text-muted-foreground/30 font-medium">Sem imagem</span>
            </div>
          )}
          {badge && (
            <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm ${badge.className}`}>
              <badge.icon className="h-3 w-3" /> {badge.label}
            </span>
          )}
          {hasPromo && !product.badge && (
            <span className="absolute bottom-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Tag className="h-3 w-3" /> Promo
            </span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-3.5">
          <h3 className="font-serif font-semibold text-foreground group-hover:text-foreground transition-colors text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          
          <div className="mt-1">
            <StarRating rating={5} count={reviewCount} />
          </div>
          
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{product.description}</p>
          
          {urgency && (
            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground leading-tight">{urgency}</span>
            </div>
          )}
          
          <div className="mt-2.5 flex items-end justify-between">
            <div>
              {hasPromo ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through text-xs">R$ {product.price.toFixed(2)}</span>
                  <span className="text-foreground font-bold text-sm">R$ {product.promotionPrice!.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-foreground font-bold text-sm">R$ {product.price.toFixed(2)}</span>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <svg viewBox="0 0 512 512" className="h-2.5 w-2.5 fill-muted-foreground/50" aria-hidden="true"><path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C347.6 377.6 342.7 391.2 331.2 392.4C252.7 400.7 183.6 358.3 152.5 295.4L134.6 313.3C129.2 318.7 119.9 318.7 114.5 313.3L37.5 236.3C32.1 230.9 32.1 221.6 37.5 216.2L114.5 139.2C119.9 133.8 129.2 133.8 134.6 139.2L211.6 216.2C217 221.6 217 230.9 211.6 236.3L193.7 254.2C217.1 267.9 242.4 278.1 269.5 283.5L242.4 292.5zM464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256z"/></svg>
                À vista no Pix
              </p>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold gold-gradient text-primary-foreground px-2.5 py-1.5 rounded-lg transition-all">
              Ver <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}