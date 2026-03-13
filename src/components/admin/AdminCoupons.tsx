import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Tag } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  times_used: number;
  created_at: string;
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New coupon form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  const loadCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCoupons(data as unknown as Coupon[]);
    setLoading(false);
  };

  useEffect(() => { loadCoupons(); }, []);

  const handleAdd = async () => {
    if (!code.trim() || !discountValue) {
      toast({ title: 'Preencha código e valor', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('coupons').insert({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      expires_at: expiresAt || null,
      usage_limit: usageLimit ? parseInt(usageLimit) : null,
    } as any);
    if (error) {
      toast({ title: 'Erro ao criar cupom', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Cupom criado!' });
      setCode(''); setDiscountValue(''); setExpiresAt(''); setUsageLimit('');
      loadCoupons();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('coupons').update({ active } as any).eq('id', id);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active } : c));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('coupons').delete().eq('id', id);
    setCoupons(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Cupom removido' });
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Novo Cupom</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Código</Label>
            <Input value={code} onChange={e => setCode(e.target.value)} placeholder="NINJA10" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Valor</Label>
            <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="10" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as 'percentage' | 'fixed')}
              className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="percentage">Porcentagem (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Limite de uso</Label>
            <Input type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="Ilimitado" className="mt-1" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Expira em</Label>
            <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="mt-1" />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={saving} className="gold-gradient text-primary-foreground w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Criar Cupom
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {coupons.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum cupom criado</p>}
        {coupons.map(c => (
          <div key={c.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-primary text-sm">{c.code}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {c.discount_type === 'percentage' ? `${c.discount_value}%` : `R$ ${c.discount_value.toFixed(2)}`}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Usado {c.times_used}x {c.usage_limit ? `/ ${c.usage_limit}` : ''}
                {c.expires_at ? ` · Expira ${new Date(c.expires_at).toLocaleDateString('pt-BR')}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={c.active} onCheckedChange={v => toggleActive(c.id, v)} />
              <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
