import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { buildRecoveryWhatsAppUrl } from '@/lib/checkoutTracker';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  MessageSquare, RefreshCw, Loader2, Copy, Clock,
  CheckCircle2, AlertTriangle, Target, Users, Flame,
  CalendarIcon, Eye, StickyNote, Phone, ExternalLink,
  TrendingUp, BarChart3, Filter,
} from 'lucide-react';

type Lead = {
  id: string;
  identifier: string;
  product_name: string;
  product_price: number | null;
  amount: number;
  pix_amount: number | null;
  payment_status: string;
  lead_status: string | null;
  last_step: string | null;
  customer_name: string;
  customer_phone: string;
  copied_pix: boolean | null;
  copied_at: string | null;
  created_at: string;
  abandoned_at: string | null;
  recovered_at: string | null;
  support_contacted_at: string | null;
  recovery_status: string | null;
  notes: string | null;
};

type RecoveryMessage = {
  id: string;
  title: string;
  template: string;
  active: boolean | null;
};

const leadStatusLabels: Record<string, { label: string; color: string }> = {
  started: { label: 'Iniciado', color: 'bg-blue-500/20 text-blue-400' },
  pix_generated: { label: 'Pix Gerado', color: 'bg-yellow-500/20 text-yellow-400' },
  pix_copied: { label: 'Pix Copiado', color: 'bg-orange-500/20 text-orange-400' },
  awaiting_payment: { label: 'Aguardando', color: 'bg-yellow-500/20 text-yellow-400' },
  abandoned: { label: 'Abandonado', color: 'bg-red-500/20 text-red-400' },
  support_requested: { label: 'Suporte', color: 'bg-purple-500/20 text-purple-400' },
  recovered: { label: 'Recuperado', color: 'bg-green-500/20 text-green-400' },
  paid: { label: 'Pago', color: 'bg-green-500/20 text-green-400' },
  expired: { label: 'Expirado', color: 'bg-muted text-muted-foreground' },
};

const recoveryStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em atendimento',
  no_response: 'Sem resposta',
  recovered: 'Recuperado',
  lost: 'Perdido',
};

const periodFilters = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'all', label: 'Todos' },
  { value: 'custom', label: 'Período' },
];

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getDateRange(period: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now); d.setHours(0, 0, 0, 0);
      return { start: d, end: null };
    }
    case 'yesterday': {
      const d = new Date(now.getTime() - 86400000); d.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(0, 0, 0, 0);
      return { start: d, end: e };
    }
    case '7d': return { start: new Date(now.getTime() - 7 * 86400000), end: null };
    case '30d': return { start: new Date(now.getTime() - 30 * 86400000), end: null };
    default: return { start: null, end: null };
  }
}

const priorityTabs = [
  { id: 'all', label: 'Todos' },
  { id: 'hot', label: '🔥 Quentes' },
  { id: 'recent', label: '⏰ Recentes' },
  { id: 'abandoned_today', label: '📉 Abandonos Hoje' },
  { id: 'awaiting', label: '⏳ Aguardando' },
];

export function AdminRecovery() {
  const { settings } = useStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<RecoveryMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('7d');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [priorityTab, setPriorityTab] = useState('all');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notesText, setNotesText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [leadsRes, msgsRes] = await Promise.all([
      supabase.from('pix_orders').select('*').order('created_at', { ascending: false }).limit(1000),
      supabase.from('recovery_messages').select('*').eq('active', true).order('sort_order'),
    ]);
    setLeads((leadsRes.data as Lead[]) || []);
    setMessages((msgsRes.data as RecoveryMessage[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const products = useMemo(() => {
    const set = new Set(leads.map(l => l.product_name));
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    let result = leads;

    // Period
    if (periodFilter === 'custom' && customFrom) {
      const from = new Date(customFrom); from.setHours(0, 0, 0, 0);
      const to = customTo ? new Date(customTo) : new Date();
      to.setHours(23, 59, 59, 999);
      result = result.filter(o => { const d = new Date(o.created_at); return d >= from && d <= to; });
    } else if (periodFilter !== 'all') {
      const { start, end } = getDateRange(periodFilter);
      if (start) result = result.filter(o => new Date(o.created_at) >= start);
      if (end) result = result.filter(o => new Date(o.created_at) < end);
    }

    // Lead status
    if (leadStatusFilter !== 'all') {
      result = result.filter(o => o.lead_status === leadStatusFilter);
    }

    // Product
    if (productFilter !== 'all') {
      result = result.filter(o => o.product_name === productFilter);
    }

    return result;
  }, [leads, periodFilter, leadStatusFilter, productFilter, customFrom, customTo]);

  // Stats from filtered
  const stats = useMemo(() => {
    const allPeriod = leads.filter(o => {
      if (periodFilter === 'custom' && customFrom) {
        const from = new Date(customFrom); from.setHours(0, 0, 0, 0);
        const to = customTo ? new Date(customTo) : new Date(); to.setHours(23, 59, 59, 999);
        const d = new Date(o.created_at); return d >= from && d <= to;
      } else if (periodFilter !== 'all') {
        const { start, end } = getDateRange(periodFilter);
        const d = new Date(o.created_at);
        if (start && d < start) return false;
        if (end && d >= end) return false;
        return true;
      }
      return true;
    });

    const abandoned = allPeriod.filter(o => o.lead_status === 'abandoned');
    const recovered = allPeriod.filter(o => o.lead_status === 'recovered' || o.recovered_at);
    const copiedNotPaid = allPeriod.filter(o => o.copied_pix && o.payment_status !== 'paid');
    const support = allPeriod.filter(o => o.support_contacted_at);
    const recoveryRate = abandoned.length > 0 ? (recovered.length / abandoned.length) * 100 : 0;

    // Top abandoned product
    const prodAbandoned: Record<string, number> = {};
    abandoned.forEach(o => { prodAbandoned[o.product_name] = (prodAbandoned[o.product_name] || 0) + 1; });
    const topAbandoned = Object.entries(prodAbandoned).sort((a, b) => b[1] - a[1])[0];

    const topRecovered: Record<string, number> = {};
    recovered.forEach(o => { topRecovered[o.product_name] = (topRecovered[o.product_name] || 0) + 1; });
    const topRecoveredProd = Object.entries(topRecovered).sort((a, b) => b[1] - a[1])[0];

    return {
      abandonedCount: abandoned.length,
      recoveredCount: recovered.length,
      copiedNotPaidCount: copiedNotPaid.length,
      supportCount: support.length,
      recoveryRate,
      topAbandoned: topAbandoned ? `${topAbandoned[0]} (${topAbandoned[1]})` : '—',
      topRecovered: topRecoveredProd ? `${topRecoveredProd[0]} (${topRecoveredProd[1]})` : '—',
    };
  }, [leads, periodFilter, customFrom, customTo]);

  const handleRecoveryStatus = async (lead: Lead, status: string) => {
    const extraFields: Record<string, unknown> = { recovery_status: status };
    if (status === 'recovered') {
      extraFields.lead_status = 'recovered';
      extraFields.recovered_at = new Date().toISOString();
    }

    await supabase.from('pix_orders').update(extraFields).eq('id', lead.id);
    toast({ title: `Status atualizado para ${recoveryStatusLabels[status] || status}` });
    fetchData();
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    await supabase.from('pix_orders').update({ notes: notesText }).eq('id', selectedLead.id);
    toast({ title: 'Observação salva!' });
    setSelectedLead(null);
    fetchData();
  };

  const openRecoveryWhatsApp = (lead: Lead) => {
    const template = selectedMessage
      ? messages.find(m => m.id === selectedMessage)?.template
      : messages[0]?.template;
    if (!template) {
      toast({ title: 'Nenhuma mensagem configurada', variant: 'destructive' });
      return;
    }
    const url = buildRecoveryWhatsAppUrl(
      settings.whatsappNumber,
      lead.customer_phone,
      template,
      { product_name: lead.product_name, order_id: lead.identifier, amount: Number(lead.amount), customer_name: lead.customer_name },
    );
    window.open(url, '_blank');
  };

  const getLeadTags = (lead: Lead) => {
    const tags: { label: string; color: string }[] = [];
    if (lead.copied_pix && lead.payment_status !== 'paid') tags.push({ label: '🔥 Lead Quente', color: 'bg-orange-500/20 text-orange-400' });
    if (lead.support_contacted_at) tags.push({ label: '💬 Pediu Suporte', color: 'bg-purple-500/20 text-purple-400' });
    if (lead.lead_status === 'abandoned' && lead.abandoned_at) {
      const mins = Math.floor((Date.now() - new Date(lead.abandoned_at).getTime()) / 60000);
      if (mins < 60) tags.push({ label: '⏰ Abandono Recente', color: 'bg-red-500/20 text-red-400' });
    }
    return tags;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={AlertTriangle} label="Abandonados" value={String(stats.abandonedCount)} negative />
        <StatCard icon={CheckCircle2} label="Recuperados" value={String(stats.recoveredCount)} positive />
        <StatCard icon={Target} label="Taxa Recuperação" value={`${stats.recoveryRate.toFixed(1)}%`} />
        <StatCard icon={Copy} label="Copiou Pix (não pagou)" value={String(stats.copiedNotPaidCount)} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard icon={Users} label="Pediu Suporte" value={String(stats.supportCount)} small />
        <StatCard icon={Flame} label="Mais Abandono" value={stats.topAbandoned} small />
        <StatCard icon={TrendingUp} label="Mais Recuperação" value={stats.topRecovered} small />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {periodFilters.map(f => (
            <button key={f.value} onClick={() => setPeriodFilter(f.value)}
              className={cn('text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                periodFilter === f.value ? 'gold-gradient text-primary-foreground border-transparent' : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/30'
              )}>
              {f.label}
            </button>
          ))}
          <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto h-8 px-2" disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>

        {periodFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <DatePickerInline label="De" date={customFrom} onChange={setCustomFrom} />
            <DatePickerInline label="Até" date={customTo} onChange={setCustomTo} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          {['all', 'abandoned', 'support_requested', 'pix_copied', 'started', 'expired', 'recovered'].map(s => (
            <button key={s} onClick={() => setLeadStatusFilter(s)}
              className={cn('text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                leadStatusFilter === s ? 'gold-gradient text-primary-foreground border-transparent' : 'bg-secondary/50 text-muted-foreground border-border'
              )}>
              {s === 'all' ? 'Todos' : (leadStatusLabels[s]?.label || s)}
            </button>
          ))}
        </div>

        {products.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Produto:</span>
            <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
              className="text-xs bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground">
              <option value="all">Todos</option>
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}

        {/* Message selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mensagem:</span>
          <select value={selectedMessage} onChange={e => setSelectedMessage(e.target.value)}
            className="text-xs bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground flex-1 max-w-xs">
            {messages.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum lead encontrado com os filtros selecionados.</p>
        )}
        {filtered.map(lead => {
          const statusCfg = leadStatusLabels[lead.lead_status || 'started'] || leadStatusLabels.started;
          const tags = getLeadTags(lead);

          return (
            <div key={lead.id} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                    {tags.map((t, i) => (
                      <span key={i} className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', t.color)}>
                        {t.label}
                      </span>
                    ))}
                    {lead.recovery_status && lead.recovery_status !== 'pending' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground">
                        {recoveryStatusLabels[lead.recovery_status] || lead.recovery_status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{lead.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.customer_phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary">{formatCurrency(Number(lead.amount))}</p>
                  <p className="text-[10px] text-muted-foreground">{lead.product_name}</p>
                </div>
              </div>

              {/* Timeline info */}
              <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                <span>Criado: {format(new Date(lead.created_at), 'dd/MM HH:mm')}</span>
                {lead.last_step && <span>Etapa: {lead.last_step}</span>}
                {lead.abandoned_at && <span className="text-destructive">Abandonou: {format(new Date(lead.abandoned_at), 'dd/MM HH:mm')}</span>}
                {lead.copied_at && <span className="text-orange-400">Copiou Pix: {format(new Date(lead.copied_at), 'dd/MM HH:mm')}</span>}
                {lead.support_contacted_at && <span className="text-purple-400">Suporte: {format(new Date(lead.support_contacted_at), 'dd/MM HH:mm')}</span>}
                {lead.recovered_at && <span className="text-green-400">Recuperado: {format(new Date(lead.recovered_at), 'dd/MM HH:mm')}</span>}
              </div>

              {/* Notes */}
              {lead.notes && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                  {lead.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => openRecoveryWhatsApp(lead)}
                  className="h-8 text-xs gold-gradient text-primary-foreground">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Recuperar no WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelectedLead(lead); setNotesText(lead.notes || ''); }}
                  className="h-8 text-xs border-border">
                  <StickyNote className="h-3.5 w-3.5 mr-1.5" /> Observação
                </Button>
                <select
                  value={lead.recovery_status || 'pending'}
                  onChange={e => handleRecoveryStatus(lead, e.target.value)}
                  className="text-[10px] bg-secondary border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  {Object.entries(recoveryStatusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif">Observação — {selectedLead?.customer_name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            placeholder="Ex: cliente disse que vai pagar depois, banco bloqueou..."
            rows={4}
          />
          <Button onClick={handleSaveNotes} className="gold-gradient text-primary-foreground">
            Salvar Observação
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, positive, negative, small }: {
  icon: React.ElementType; label: string; value: string; positive?: boolean; negative?: boolean; small?: boolean;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-3.5 w-3.5', positive ? 'text-green-500' : negative ? 'text-destructive' : 'text-primary')} />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className={cn('font-bold', small ? 'text-sm' : 'text-2xl',
        positive ? 'text-green-500' : negative ? 'text-destructive' : 'text-primary'
      )}>{value}</p>
    </div>
  );
}

function DatePickerInline({ label, date, onChange }: { label: string; date?: Date; onChange: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5" />
          {label}: {date ? format(date, 'dd/MM/yy') : '—'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  );
}
