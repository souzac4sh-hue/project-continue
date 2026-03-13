import { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const statusLabels: Record<string, string> = {
  new: 'Pedido Recebido',
  awaiting_payment: 'Aguardando Pagamento',
  paid: 'Pago',
  in_progress: 'Em Execução',
  completed: 'Concluído',
};

const statusColors: Record<string, string> = {
  new: 'text-blue-400',
  awaiting_payment: 'text-yellow-400',
  paid: 'text-green-400',
  in_progress: 'text-orange-400',
  completed: 'text-primary',
};

export default function OrderTrackingPage() {
  const { orders } = useStore();
  const [orderId, setOrderId] = useState('');
  const [found, setFound] = useState<typeof orders[0] | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    setSearched(true);
    const order = orders.find(o => o.id.toLowerCase() === orderId.trim().toLowerCase());
    setFound(order || null);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container py-8 max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="font-serif text-2xl font-bold mb-2">Consultar Pedido</h1>
        <p className="text-muted-foreground text-sm mb-6">Insira o número do seu pedido.</p>

        <div className="flex gap-2 mb-6">
          <Input
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="Ex: PED001"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} className="gold-gradient text-primary-foreground">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {searched && !found && (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-muted-foreground">Pedido não encontrado.</p>
          </div>
        )}

        {found && (
          <div className="glass-card rounded-xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pedido</span>
              <span className="font-bold text-primary">{found.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Produto</span>
              <span className="text-sm font-medium">{found.productName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="text-sm font-medium">R$ {found.value.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-sm font-bold ${statusColors[found.status]}`}>
                {statusLabels[found.status]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Data</span>
              <span className="text-sm">{new Date(found.date).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
