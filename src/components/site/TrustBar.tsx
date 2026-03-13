import { Shield, Zap, CreditCard, Smartphone, Star, ShoppingCart } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

const iconMap = [Zap, CreditCard, Smartphone, Shield, Star, ShoppingCart];

export function TrustBar() {
  const { settings } = useStore();
  const items = settings.trustBarItems;

  return (
    <div className="w-full overflow-hidden border-y border-border/20 bg-secondary/30">
      <div className="flex animate-trust-scroll" aria-label="Benefícios da loja">
        {[...items, ...items, ...items].map((item, i) => {
          const Icon = iconMap[i % iconMap.length];
          return (
            <span
              key={i}
              className="shrink-0 px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <Icon className="h-3 w-3 text-muted-foreground/60" />
              {item.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}