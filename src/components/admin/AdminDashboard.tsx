import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Target,
  Copy, AlertTriangle, CheckCircle2, Clock, BarChart3, Loader2, Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PixOrder = {
  id: string;
  product_name: string;
  amount: number;
  payment_status: string;
  lead_status: string | null;
  copied_pix: boolean | null;
  support_contacted_at: string | null;
  created_at: string;
  paid_at: string | null;
  abandoned_at: string | null;
  recovered_at: string | null;
};

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminDashboard() {
  const [orders, setOrders] = useState<PixOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('pix_orders')
      .select('id, product_name, amount, payment_status, lead_status, copied_pix, support_contacted_at, created_at, paid_at, abandoned_at, recovered_at')
      .order('created_at', { ascending: false })
      .limit(1000)
      .then(({ data, error }) => {
        if (error) console.error('[ADMIN] Failed to load orders:', error);
        console.log('[ADMIN] Orders loaded:', data?.length ?? 0);
        setOrders((data as PixOrder[]) || []);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(Date.now() - 7 * 86400000);

    const total = orders.length;
    const paid = orders.filter(o => o.payment_status === 'paid');
    const abandoned = orders.filter(o => o.lead_status === 'abandoned');
    const recovered = orders.filter(o => o.lead_status === 'recovered' || o.recovered_at);
    const copiedNotPaid = orders.filter(o => o.copied_pix && o.payment_status !== 'paid');
    const supportContacted = orders.filter(o => o.support_contacted_at);

    const totalRevenue = paid.reduce((s, o) => s + Number(o.amount), 0);
    const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
    const todayPaid = todayOrders.filter(o => o.payment_status === 'paid');
    const todayAbandoned = todayOrders.filter(o => o.lead_status === 'abandoned');
    const todayRevenue = todayPaid.reduce((s, o) => s + Number(o.amount), 0);

    const conversionRate = total > 0 ? (paid.length / total) * 100 : 0;
    const abandonmentRate = total > 0 ? (abandoned.length / total) * 100 : 0;
    const recoveryRate = abandoned.length > 0 ? (recovered.length / abandoned.length) * 100 : 0;
    const copyConversion = copiedNotPaid.length + paid.filter(o => o.copied_pix).length > 0
      ? (paid.filter(o => o.copied_pix).length / (copiedNotPaid.length + paid.filter(o => o.copied_pix).length)) * 100
      : 0;

    // Product breakdown
    const productStats: Record<string, { total: number; paid: number; abandoned: number; revenue: number }> = {};
    orders.forEach(o => {
      if (!productStats[o.product_name]) productStats[o.product_name] = { total: 0, paid: 0, abandoned: 0, revenue: 0 };
      productStats[o.product_name].total++;
      if (o.payment_status === 'paid') {
        productStats[o.product_name].paid++;
        productStats[o.product_name].revenue += Number(o.amount);
      }
      if (o.lead_status === 'abandoned') productStats[o.product_name].abandoned++;
    });

    const topAbandonment = Object.entries(productStats)
      .sort((a, b) => b[1].abandoned - a[1].abandoned)
      .slice(0, 3);

    const topConversion = Object.entries(productStats)
      .filter(([, s]) => s.total > 0)
      .sort((a, b) => (b[1].paid / b[1].total) - (a[1].paid / a[1].total))
      .slice(0, 3);

    return {
      total, paidCount: paid.length, abandonedCount: abandoned.length,
      recoveredCount: recovered.length, copiedNotPaidCount: copiedNotPaid.length,
      supportCount: supportContacted.length, totalRevenue, todayRevenue,
      todayOrdersCount: todayOrders.length, todayPaidCount: todayPaid.length,
      todayAbandonedCount: todayAbandoned.length,
      conversionRate, abandonmentRate, recoveryRate, copyConversion,
      topAbandonment, topConversion, productStats,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={DollarSign} label="Faturamento Total" value={formatCurrency(stats.totalRevenue)} accent />
        <KPICard icon={TrendingUp} label="Faturamento Hoje" value={formatCurrency(stats.todayRevenue)} />
        <KPICard icon={Target} label="Taxa de Conversão" value={`${stats.conversionRate.toFixed(1)}%`} positive={stats.conversionRate > 30} />
        <KPICard icon={TrendingDown} label="Taxa de Abandono" value={`${stats.abandonmentRate.toFixed(1)}%`} negative={stats.abandonmentRate > 50} />
      </div>

      {/* Funnel metrics */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> Funil de Checkout
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KPICard icon={ShoppingBag} label="Checkouts Iniciados" value={String(stats.total)} small />
          <KPICard icon={CheckCircle2} label="Pagos" value={String(stats.paidCount)} small positive />
          <KPICard icon={AlertTriangle} label="Abandonados" value={String(stats.abandonedCount)} small negative />
          <KPICard icon={Copy} label="Copiou Pix (não pagou)" value={String(stats.copiedNotPaidCount)} small />
          <KPICard icon={Users} label="Pediu Suporte" value={String(stats.supportCount)} small />
        </div>
      </div>

      {/* Recovery metrics */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5" /> Recuperação
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard icon={Users} label="Leads Recuperados" value={String(stats.recoveredCount)} positive />
          <KPICard icon={Target} label="Taxa de Recuperação" value={`${stats.recoveryRate.toFixed(1)}%`} />
          <KPICard icon={Copy} label="Conversão após Copiar" value={`${stats.copyConversion.toFixed(1)}%`} />
          <KPICard icon={Clock} label="Abandonos Hoje" value={String(stats.todayAbandonedCount)} negative />
        </div>
      </div>

      {/* Today summary */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">📊 Resumo de Hoje</h3>
        <div className="grid grid-cols-3 gap-3">
          <KPICard icon={ShoppingBag} label="Iniciados" value={String(stats.todayOrdersCount)} small />
          <KPICard icon={CheckCircle2} label="Pagos" value={String(stats.todayPaidCount)} small positive />
          <KPICard icon={AlertTriangle} label="Abandonos" value={String(stats.todayAbandonedCount)} small negative />
        </div>
      </div>

      {/* Product breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Produtos com mais abandono
          </h3>
          {stats.topAbandonment.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {stats.topAbandonment.map(([name, s]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate">{name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.abandoned} abandonos</span>
                    <span className="text-xs text-destructive font-bold">
                      {s.total > 0 ? `${((s.abandoned / s.total) * 100).toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" /> Produtos com melhor conversão
          </h3>
          {stats.topConversion.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          ) : (
            <div className="space-y-2">
              {stats.topConversion.map(([name, s]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate">{name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.paid}/{s.total}</span>
                    <span className="text-xs text-green-500 font-bold">
                      {s.total > 0 ? `${((s.paid / s.total) * 100).toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({
  icon: Icon,
  label,
  value,
  accent,
  positive,
  negative,
  small,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
  negative?: boolean;
  small?: boolean;
}) {
  return (
    <div className={cn(
      'glass-card rounded-xl p-4',
      accent && 'border-primary/30',
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn(
          'h-3.5 w-3.5',
          accent ? 'text-primary' : positive ? 'text-green-500' : negative ? 'text-destructive' : 'text-muted-foreground',
        )} />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className={cn(
        'font-bold',
        small ? 'text-lg' : 'text-2xl',
        accent ? 'text-primary' : positive ? 'text-green-500' : negative ? 'text-destructive' : 'text-foreground',
      )}>
        {value}
      </p>
    </div>
  );
}
