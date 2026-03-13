import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Copy, MessageSquare, RefreshCw, Loader2, DollarSign, Clock,
  CheckCircle2, XCircle, TrendingUp, ShoppingBag, Target,
  CalendarIcon, BarChart3, AlertTriangle, Award, Search, Download,
} from 'lucide-react';

type PixOrder = {
  id: string;
  identifier: string;
  provider_identifier: string | null;
  product_name: string;
  amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'expired';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  created_at: string;
  paid_at: string | null;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  paid: { label: 'Pago', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  failed: { label: 'Falhou', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  expired: { label: 'Expirado', color: 'bg-muted text-muted-foreground border-border' },
};

const periodFilters = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'all', label: 'Todos' },
  { value: 'custom', label: 'Período' },
];

const statusFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'paid', label: 'Pagos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'failed', label: 'Falhos' },
  { value: 'expired', label: 'Expirados' },
];

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getDateStart(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
    }
    case '7d': return new Date(now.getTime() - 7 * 86400000);
    case '30d': return new Date(now.getTime() - 30 * 86400000);
    default: return null;
  }
}

export function AdminPixOrders() {
  const [orders, setOrders] = useState<PixOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pix_orders')
      .select('id, identifier, provider_identifier, product_name, amount, payment_status, customer_name, customer_phone, customer_email, created_at, paid_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      toast({ title: 'Erro ao carregar pedidos Pix', variant: 'destructive' });
    } else {
      setOrders((data as PixOrder[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  // Filtered orders
  const filtered = useMemo(() => {
    let result = orders;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o =>
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.product_name.toLowerCase().includes(q) ||
        o.identifier.toLowerCase().includes(q)
      );
    }

    // Period filter
    if (periodFilter === 'custom' && customFrom) {
      const from = new Date(customFrom); from.setHours(0, 0, 0, 0);
      const to = customTo ? new Date(customTo) : new Date();
      to.setHours(23, 59, 59, 999);
      result = result.filter(o => {
        const d = new Date(o.created_at);
        return d >= from && d <= to;
      });
    } else if (periodFilter !== 'all') {
      const start = getDateStart(periodFilter);
      if (start) result = result.filter(o => new Date(o.created_at) >= start);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(o => o.payment_status === statusFilter);
    }

    return result;
  }, [orders, periodFilter, statusFilter, searchQuery, customFrom, customTo]);

  // Stats
  const stats = useMemo(() => {
    let periodOrders = orders;
    if (periodFilter === 'custom' && customFrom) {
      const from = new Date(customFrom); from.setHours(0, 0, 0, 0);
      const to = customTo ? new Date(customTo) : new Date();
      to.setHours(23, 59, 59, 999);
      periodOrders = periodOrders.filter(o => {
        const d = new Date(o.created_at);
        return d >= from && d <= to;
      });
    } else if (periodFilter !== 'all') {
      const start = getDateStart(periodFilter);
      if (start) periodOrders = periodOrders.filter(o => new Date(o.created_at) >= start);
    }

    const paid = periodOrders.filter(o => o.payment_status === 'paid');
    const pending = periodOrders.filter(o => o.payment_status === 'pending');
    const failed = periodOrders.filter(o => o.payment_status === 'failed');

    const totalRevenue = paid.reduce((s, o) => s + Number(o.amount), 0);
    const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const paidAll = orders.filter(o => o.payment_status === 'paid');
    const revenueToday = paidAll.filter(o => o.paid_at && new Date(o.paid_at) >= todayStart).reduce((s, o) => s + Number(o.amount), 0);

    const weekStart = new Date(Date.now() - 7 * 86400000);
    const revenue7d = paidAll.filter(o => o.paid_at && new Date(o.paid_at) >= weekStart).reduce((s, o) => s + Number(o.amount), 0);

    const monthStart = new Date(Date.now() - 30 * 86400000);
    const revenueMonth = paidAll.filter(o => o.paid_at && new Date(o.paid_at) >= monthStart).reduce((s, o) => s + Number(o.amount), 0);

    const conversionRate = periodOrders.length > 0 ? (paid.length / periodOrders.length) * 100 : 0;

    const productRevenue: Record<string, { count: number; revenue: number }> = {};
    paid.forEach(o => {
      if (!productRevenue[o.product_name]) productRevenue[o.product_name] = { count: 0, revenue: 0 };
      productRevenue[o.product_name].count++;
      productRevenue[o.product_name].revenue += Number(o.amount);
    });
    const topByCount = Object.entries(productRevenue).sort((a, b) => b[1].count - a[1].count)[0];
    const topByRevenue = Object.entries(productRevenue).sort((a, b) => b[1].revenue - a[1].revenue)[0];

    return {
      totalRevenue, revenueToday, revenue7d, revenueMonth,
      paidCount: paid.length, pendingCount: pending.length, failedCount: failed.length,
      avgTicket, conversionRate,
      topProductByCount: topByCount ? `${topByCount[0]} (${topByCount[1].count})` : '—',
      topProductByRevenue: topByRevenue ? `${topByRevenue[0]} (${formatCurrency(topByRevenue[1].revenue)})` : '—',
      totalOrders: periodOrders.length,
    };
  }, [orders, periodFilter, customFrom, customTo]);

  const copyDeliveryMessage = (order: PixOrder) => {
    const msg = `✅ Pagamento Pix confirmado!\n\nProduto: ${order.product_name}\nValor: R$ ${Number(order.amount).toFixed(2)}\nPedido: ${order.identifier}\n\nObrigado pela preferência! 🔥`;
    navigator.clipboard.writeText(msg);
    toast({ title: '📋 Mensagem copiada!' });
  };

  const exportCSV = () => {
    const headers = ['Pedido', 'Produto', 'Cliente', 'Telefone', 'Valor', 'Status', 'Criado', 'Pago em'];
    const rows = filtered.map(o => [
      o.identifier,
      o.product_name,
      o.customer_name,
      o.customer_phone,
      Number(o.amount).toFixed(2),
      statusConfig[o.payment_status]?.label || o.payment_status,
      format(new Date(o.created_at), "dd/MM/yyyy HH:mm"),
      o.paid_at ? format(new Date(o.paid_at), "dd/MM/yyyy HH:mm") : '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-pix-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: '📥 CSV exportado!' });
  };

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5" /> Faturamento
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={DollarSign} label="Total" value={formatCurrency(stats.totalRevenue)} accent />
          <StatCard icon={TrendingUp} label="Hoje" value={formatCurrency(stats.revenueToday)} />
          <StatCard icon={BarChart3} label="7 dias" value={formatCurrency(stats.revenue7d)} />
          <StatCard icon={CalendarIcon} label="30 dias" value={formatCurrency(stats.revenueMonth)} />
        </div>
      </div>

      {/* Metrics Cards */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> Métricas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={CheckCircle2} label="Pagos" value={String(stats.paidCount)} positive />
          <StatCard icon={Clock} label="Pendentes" value={String(stats.pendingCount)} warning />
          <StatCard icon={AlertTriangle} label="Falhas" value={String(stats.failedCount)} negative />
          <StatCard icon={Target} label="Conversão" value={`${stats.conversionRate.toFixed(1)}%`} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <StatCard icon={ShoppingBag} label="Ticket médio" value={formatCurrency(stats.avgTicket)} />
          <StatCard icon={Award} label="Mais vendido" value={stats.topProductByCount} small />
          <StatCard icon={DollarSign} label="Maior faturamento" value={stats.topProductByRevenue} small />
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou produto..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Período:</span>
          {periodFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setPeriodFilter(f.value)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                periodFilter === f.value
                  ? 'gold-gradient text-primary-foreground border-transparent'
                  : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/30'
              )}
            >
              {f.label}
            </button>
          ))}
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={exportCSV} className="h-8 px-3 text-xs border-primary/30 text-primary">
              <Download className="h-3.5 w-3.5 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={fetchOrders} className="h-8 px-2" disabled={loading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {periodFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <DatePickerInline label="De" date={customFrom} onChange={setCustomFrom} />
            <DatePickerInline label="Até" date={customTo} onChange={setCustomTo} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Status:</span>
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                statusFilter === f.value
                  ? 'gold-gradient text-primary-foreground border-transparent'
                  : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/30'
              )}
            >
              {f.label}
              {f.value !== 'all' && (
                <span className="ml-1 opacity-70">
                  ({orders.filter(o => o.payment_status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Pedido</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Produto</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Cliente</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Telefone</th>
                  <th className="text-right p-3 text-xs text-muted-foreground font-medium">Valor</th>
                  <th className="text-center p-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Criado</th>
                  <th className="text-left p-3 text-xs text-muted-foreground font-medium">Pago em</th>
                  <th className="text-center p-3 text-xs text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const cfg = statusConfig[o.payment_status] || statusConfig.pending;
                  return (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="p-3">
                        <span className="font-mono text-[11px] text-muted-foreground">{o.identifier.slice(0, 20)}…</span>
                        {o.provider_identifier && (
                          <span className="block font-mono text-[10px] text-muted-foreground/60">{o.provider_identifier}</span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-foreground">{o.product_name}</td>
                      <td className="p-3 text-muted-foreground">{o.customer_name}</td>
                      <td className="p-3 text-muted-foreground">{o.customer_phone}</td>
                      <td className="p-3 text-right font-bold text-primary">{formatCurrency(Number(o.amount))}</td>
                      <td className="p-3 text-center">
                        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block', cfg.color)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(o.created_at), "dd/MM/yy HH:mm")}
                      </td>
                      <td className="p-3 text-xs whitespace-nowrap">
                        {o.paid_at ? (
                          <span className="text-green-400">{format(new Date(o.paid_at), "dd/MM/yy HH:mm")}</span>
                        ) : '—'}
                      </td>
                      <td className="p-3">
                        {o.payment_status === 'paid' && (
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => copyDeliveryMessage(o)} title="Copiar mensagem">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => window.open(`https://wa.me/${o.customer_phone}`, '_blank')} title="WhatsApp">
                              <MessageSquare className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</p>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {filtered.map(o => {
              const cfg = statusConfig[o.payment_status] || statusConfig.pending;
              return (
                <div key={o.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[180px]">{o.identifier}</span>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{o.product_name}</p>
                  <p className="text-sm text-muted-foreground">{o.customer_name} · {o.customer_phone}</p>
                  {o.provider_identifier && (
                    <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">Provider: {o.provider_identifier}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-primary">{formatCurrency(Number(o.amount))}</p>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">
                        {format(new Date(o.created_at), "dd/MM/yy HH:mm")}
                      </span>
                      {o.paid_at && (
                        <span className="text-[10px] text-green-400 block">
                          Pago {format(new Date(o.paid_at), "dd/MM/yy HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                  {o.payment_status === 'paid' && (
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 px-3 text-xs flex-1 border-primary/30 text-primary" onClick={() => copyDeliveryMessage(o)}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar mensagem
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 px-2 border-primary/30 text-primary" onClick={() => window.open(`https://wa.me/${o.customer_phone}`, '_blank')}>
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Mostrando {filtered.length} de {orders.length} pedidos
          </p>
        </>
      )}
    </div>
  );
}

/* ── Subcomponents ── */

function StatCard({ icon: Icon, label, value, accent, positive, warning, negative, small }: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
  warning?: boolean;
  negative?: boolean;
  small?: boolean;
}) {
  const valueColor = accent
    ? 'text-primary'
    : positive
      ? 'text-green-400'
      : warning
        ? 'text-yellow-400'
        : negative
          ? 'text-red-400'
          : 'text-foreground';

  return (
    <div className="glass-card rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className={cn(small ? 'text-xs font-semibold truncate' : 'text-lg font-bold', valueColor)}>
        {value}
      </p>
    </div>
  );
}

function DatePickerInline({ label, date, onChange }: { label: string; date?: Date; onChange: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-8 text-xs gap-1.5 border-border', !date && 'text-muted-foreground')}>
          <CalendarIcon className="h-3.5 w-3.5" />
          {date ? format(date, "dd/MM/yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          locale={ptBR}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
