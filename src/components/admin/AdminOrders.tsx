import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Copy, MessageSquare } from 'lucide-react';

const statusLabels: Record<string, string> = {
  new: 'Novo',
  awaiting_payment: 'Aguardando Pgto',
  paid: 'Pago',
  in_progress: 'Em Execução',
  completed: 'Concluído',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  awaiting_payment: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_progress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  completed: 'bg-muted text-muted-foreground border-border',
};

const filterTabs = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Novos' },
  { value: 'awaiting_payment', label: 'Aguardando' },
  { value: 'paid', label: 'Pagos' },
  { value: 'in_progress', label: 'Execução' },
  { value: 'completed', label: 'Concluídos' },
];

export function AdminOrders() {
  const { orders, setOrders } = useStore();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const updateStatus = (id: string, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o));
    toast({ title: `Status atualizado para ${statusLabels[status]}` });
  };

  const copyDeliveryMessage = (order: typeof orders[0]) => {
    const msg = `✅ Pedido concluído!\n\nProduto: ${order.productName}\nValor: R$ ${order.value.toFixed(2)}\nPedido: ${order.id}\n\nObrigado pela preferência! 🔥`;
    navigator.clipboard.writeText(msg);
    toast({ title: '📋 Mensagem copiada!' });
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors ${
              filter === tab.value
                ? 'gold-gradient text-primary-foreground border-transparent'
                : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1 opacity-70">
                ({orders.filter(o => o.status === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map(o => (
          <div key={o.id} className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-primary text-sm">{o.id}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[o.status]}`}>
                {statusLabels[o.status]}
              </span>
            </div>
            <p className="text-sm font-medium">{o.productName}</p>
            <p className="text-sm text-muted-foreground">{o.customerName} · {o.customerPhone}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm font-bold text-primary">R$ {o.value.toFixed(2)}</p>
              <span className="text-xs text-muted-foreground">{new Date(o.date).toLocaleDateString('pt-BR')}</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 border-primary/30 text-primary"
                onClick={() => copyDeliveryMessage(o)}
                title="Copiar mensagem de entrega"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 border-primary/30 text-primary"
                onClick={() => window.open(`https://wa.me/${o.customerPhone}`, '_blank')}
                title="Abrir WhatsApp"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</p>}
      </div>
    </div>
  );
}
