import { BookOpen, CheckCircle, Clock, XCircle, ShoppingBag, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { SiteHeader } from '@/components/site/SiteHeader';
import { FloatingButtons } from '@/components/site/FloatingButtons';

const statusConfig = {
  active: { label: 'Ativo', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  coming_soon: { label: 'Em Breve', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  unavailable: { label: 'Indisponível', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function MethodsPage() {
  const { methods, products } = useStore();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container py-8 pb-24">
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Métodos
        </h1>
        <p className="text-muted-foreground mb-8">Conheça nossos métodos de funcionamento.</p>

        <div className="grid gap-4">
          {methods.map(method => {
            const status = statusConfig[method.status];
            const linkedProduct = method.linkedProductId ? products.find(p => p.id === method.linkedProductId) : null;

            return (
              <div key={method.id} className="glass-card rounded-xl overflow-hidden animate-fade-in">
                <div className="aspect-[21/9] bg-secondary flex items-center justify-center overflow-hidden">
                  {method.banner ? (
                    <img src={method.banner} alt={method.name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-10 w-10 text-muted-foreground/20" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-lg font-semibold">{method.name}</h3>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                      <status.icon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{method.description}</p>

                  {method.videoUrl && (
                    <div className="mb-4 aspect-video rounded-lg bg-secondary flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}

                  {method.notes && (
                    <p className="text-xs text-muted-foreground mb-4 italic">{method.notes}</p>
                  )}

                  {linkedProduct && method.status === 'active' && (
                    <Link
                      to={`/produto/${linkedProduct.slug || linkedProduct.id}`}
                      className="inline-flex items-center gap-2 gold-gradient text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform"
                    >
                      <ShoppingBag className="h-4 w-4" /> Comprar Agora
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FloatingButtons />
    </div>
  );
}
