import { Wrench, Clock } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export function MaintenanceScreen() {
  const { settings } = useStore();
  const { brand } = settings;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-sm space-y-6">
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt={brand.brandName} className="h-16 w-16 rounded-xl object-cover mx-auto" />
        ) : (
          <div className="h-16 w-16 rounded-xl gold-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <span className="text-sm font-black text-primary-foreground tracking-tight">C4</span>
          </div>
        )}

        <div className="glass-card rounded-2xl p-8 space-y-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Wrench className="h-7 w-7 text-primary" />
          </div>

          <h1 className="font-serif text-xl font-bold text-foreground">
            {brand.brandName}
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {settings.maintenanceMessage || '🔧 Estamos em manutenção. Voltamos em breve!'}
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            <span>Voltamos em breve</span>
          </div>
        </div>

        {settings.whatsappNumber && (
          <a
            href={`https://wa.me/${settings.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
          >
            Falar com suporte via WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
