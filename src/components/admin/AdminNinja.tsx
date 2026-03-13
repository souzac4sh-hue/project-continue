import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  Sword, Plus, X, Save, Loader2, Eye, MousePointer, Ticket,
  BarChart3, Megaphone, ShoppingCart, Sparkles, Settings, Palette,
  Zap, Globe, MessageSquare,
} from 'lucide-react';
import { useState } from 'react';
import { NinjaRewardTier, NinjaPromoMessage, NinjaCheckoutMessage } from '@/data/mockData';

export function AdminNinja() {
  const { settings, setSettings, saveAll } = useStore();
  const ninja = settings.ninjaSettings;

  const [saving, setSaving] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTierCode, setNewTierCode] = useState('');
  const [newTierWeight, setNewTierWeight] = useState('70');
  const [newTierLabel, setNewTierLabel] = useState('');
  const [newPromoText, setNewPromoText] = useState('');
  const [newCheckoutText, setNewCheckoutText] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'states' | 'promo' | 'checkout' | 'coupon' | 'rewards' | 'analytics'>('general');

  const update = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      ninjaSettings: { ...prev.ninjaSettings, [key]: value },
    }));
  };

  const addCode = () => {
    if (!newCode.trim()) return;
    update('discountCodes', [...(ninja.discountCodes || []), newCode.trim().toUpperCase()]);
    setNewCode('');
  };

  const removeCode = (idx: number) => {
    update('discountCodes', ninja.discountCodes.filter((_: string, i: number) => i !== idx));
  };

  const addRewardTier = () => {
    if (!newTierCode.trim() || !newTierLabel.trim()) return;
    const tier: NinjaRewardTier = {
      code: newTierCode.trim().toUpperCase(),
      weight: parseInt(newTierWeight) || 50,
      label: newTierLabel.trim(),
    };
    update('rewardTiers', [...(ninja.rewardTiers || []), tier]);
    setNewTierCode(''); setNewTierWeight('70'); setNewTierLabel('');
  };

  const removeRewardTier = (idx: number) => {
    update('rewardTiers', (ninja.rewardTiers || []).filter((_: NinjaRewardTier, i: number) => i !== idx));
  };

  const addPromoMessage = () => {
    if (!newPromoText.trim()) return;
    const msg: NinjaPromoMessage = { id: Date.now().toString(), text: newPromoText.trim(), active: true };
    update('promoMessages', [...(ninja.promoMessages || []), msg]);
    setNewPromoText('');
  };

  const removePromoMessage = (id: string) => {
    update('promoMessages', (ninja.promoMessages || []).filter((m: NinjaPromoMessage) => m.id !== id));
  };

  const togglePromoMessage = (id: string, active: boolean) => {
    update('promoMessages', (ninja.promoMessages || []).map((m: NinjaPromoMessage) => m.id === id ? { ...m, active } : m));
  };

  const addCheckoutMessage = () => {
    if (!newCheckoutText.trim()) return;
    const msg: NinjaCheckoutMessage = { id: Date.now().toString(), text: newCheckoutText.trim(), active: true };
    update('checkoutMessages', [...(ninja.checkoutMessages || []), msg]);
    setNewCheckoutText('');
  };

  const removeCheckoutMessage = (id: string) => {
    update('checkoutMessages', (ninja.checkoutMessages || []).filter((m: NinjaCheckoutMessage) => m.id !== id));
  };

  const toggleCheckoutMessage = (id: string, active: boolean) => {
    update('checkoutMessages', (ninja.checkoutMessages || []).map((m: NinjaCheckoutMessage) => m.id === id ? { ...m, active } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAll();
      toast({ title: 'Configurações do Ninja salvas!' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
    setSaving(false);
  };

  const stats = ninja.stats || { totalAppearances: 0, totalClicks: 0, couponsGenerated: 0, couponsRedeemed: 0, promoAlertsShown: 0, checkoutAppearances: 0, checkoutClicks: 0 };
  const clickRate = stats.totalAppearances > 0 ? ((stats.totalClicks / stats.totalAppearances) * 100).toFixed(1) : '0';

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'states', label: 'Estados', icon: Zap },
    { id: 'appearance', label: 'Visual', icon: Palette },
    { id: 'promo', label: 'Promoções', icon: Megaphone },
    { id: 'checkout', label: 'Checkout', icon: ShoppingCart },
    { id: 'coupon', label: 'Cupons', icon: Ticket },
    { id: 'rewards', label: 'Recompensas', icon: Sparkles },
    { id: 'analytics', label: 'Métricas', icon: BarChart3 },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard icon={Eye} label="Aparições" value={stats.totalAppearances} />
        <StatCard icon={MousePointer} label="Cliques" value={stats.totalClicks} />
        <StatCard icon={Ticket} label="Cupons" value={stats.couponsGenerated} />
        <StatCard icon={BarChart3} label="CTR" value={`${clickRate}%`} />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* GENERAL */}
      {activeTab === 'general' && (
        <div className="glass-card rounded-xl p-5 space-y-5">
          <h3 className="font-serif font-semibold text-sm flex items-center gap-2">
            <Sword className="h-4 w-4 text-primary" /> Sistema Ninja Assistente
          </h3>

          <ToggleRow label="Ativar sistema ninja" checked={ninja.enabled} onChange={v => update('enabled', v)} />
          <ToggleRow label="Mostrar recompensa ao clicar" checked={ninja.showReward} onChange={v => update('showReward', v)} />

          <div className="border-t border-border/30 pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              🧪 Modo de teste
            </h4>
            <ToggleRow label="Ativar Ninja Test Mode" checked={ninja.testMode ?? false} onChange={v => update('testMode', v)} />
            <p className="text-[10px] text-muted-foreground mt-1">Quando ativo, o Ninja aparece rapidamente sem cooldown. Ideal para testar no preview.</p>
          </div>

          <div className="border-t border-border/30 pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              <Globe className="h-3 w-3 inline mr-1" /> Páginas ativas
            </h4>
            <ToggleRow label="Homepage" checked={ninja.showOnHomepage} onChange={v => update('showOnHomepage', v)} />
            <ToggleRow label="Página de produto" checked={ninja.showOnProductPage} onChange={v => update('showOnProductPage', v)} />
            <ToggleRow label="Checkout / Carrinho" checked={ninja.showOnCheckout} onChange={v => update('showOnCheckout', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Cooldown (min)</Label>
              <Input type="number" value={ninja.cooldownMinutes} onChange={e => update('cooldownMinutes', parseInt(e.target.value) || 2)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Máx por sessão</Label>
              <Input type="number" value={ninja.maxPerSession} onChange={e => update('maxPerSession', parseInt(e.target.value) || 1)} className="mt-1" />
            </div>
          </div>
        </div>
      )}

      {/* STATES */}
      {activeTab === 'states' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estados do Ninja</h4>
          <ToggleRow label="🧘 Idle — observa o usuário" checked={ninja.stateIdle} onChange={v => update('stateIdle', v)} />
          <ToggleRow label="📢 Promoção — anuncia ofertas" checked={ninja.statePromo} onChange={v => update('statePromo', v)} />
          <ToggleRow label="🎯 Caçador de cupom — clique para recompensa" checked={ninja.stateCouponHunter} onChange={v => update('stateCouponHunter', v)} />
          <ToggleRow label="🛒 Ajudante de checkout — incentiva conversão" checked={ninja.stateCheckoutHelper} onChange={v => update('stateCheckoutHelper', v)} />
          <ToggleRow label="⭐ Evento raro — recompensa especial" checked={ninja.stateRareEvent} onChange={v => update('stateRareEvent', v)} />
          {ninja.stateRareEvent && (
            <div>
              <Label className="text-xs">Chance do evento raro (%)</Label>
              <Input type="number" value={ninja.rareEventChance} onChange={e => update('rareEventChance', Math.min(100, Math.max(1, parseInt(e.target.value) || 5)))} className="mt-1" />
            </div>
          )}
        </div>
      )}

      {/* APPEARANCE */}
      {activeTab === 'appearance' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configurações visuais</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tamanho desktop (px)</Label>
              <Input type="number" value={ninja.desktopSize} onChange={e => update('desktopSize', Math.min(120, Math.max(60, parseInt(e.target.value) || 80)))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Tamanho mobile (px)</Label>
              <Input type="number" value={ninja.mobileSize} onChange={e => update('mobileSize', Math.min(100, Math.max(50, parseInt(e.target.value) || 64)))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Força do brilho (%)</Label>
              <Input type="number" value={ninja.glowStrength} onChange={e => update('glowStrength', Math.min(100, Math.max(0, parseInt(e.target.value) || 60)))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Alcance de movimento (px)</Label>
              <Input type="number" value={ninja.movementRange} onChange={e => update('movementRange', Math.min(500, Math.max(50, parseInt(e.target.value) || 200)))} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Frequência mín. (min)</Label>
              <Input type="number" value={ninja.frequencyMin} onChange={e => update('frequencyMin', parseFloat(e.target.value) || 1.5)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Frequência máx. (min)</Label>
              <Input type="number" value={ninja.frequencyMax} onChange={e => update('frequencyMax', parseFloat(e.target.value) || 3)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Posição preferida</Label>
            <select
              value={ninja.positionPreference}
              onChange={e => update('positionPreference', e.target.value)}
              className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="random">Aleatório</option>
              <option value="left">Esquerda → Direita</option>
              <option value="right">Direita → Esquerda</option>
            </select>
          </div>

          <div>
            <Label className="text-xs">Velocidade de animação (seg)</Label>
            <Input type="number" value={ninja.animationSpeed} onChange={e => update('animationSpeed', Math.min(8, Math.max(2, parseInt(e.target.value) || 4)))} className="mt-1" />
          </div>
        </div>
      )}

      {/* PROMO */}
      {activeTab === 'promo' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5 text-primary" /> Alertas de promoção
          </h4>

          <ToggleRow label="Ativar alertas de promoção" checked={ninja.promoEnabled} onChange={v => update('promoEnabled', v)} />
          <ToggleRow label="Incluir cupom nos alertas" checked={ninja.promoIncludesCoupon} onChange={v => update('promoIncludesCoupon', v)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Delay (segundos)</Label>
              <Input type="number" value={ninja.promoFrequencySeconds} onChange={e => update('promoFrequencySeconds', parseInt(e.target.value) || 60)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Cooldown (min)</Label>
              <Input type="number" value={ninja.promoCooldownMinutes} onChange={e => update('promoCooldownMinutes', parseInt(e.target.value) || 30)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Estilo de exibição</Label>
            <select
              value={ninja.promoDisplayStyle}
              onChange={e => update('promoDisplayStyle', e.target.value)}
              className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="bubble">Bolha</option>
              <option value="floating">Flutuante</option>
              <option value="banner">Mini banner</option>
            </select>
          </div>

          {/* Messages List */}
          <div>
            <Label className="text-xs mb-2 block">Mensagens de promoção</Label>
            <div className="space-y-2 mb-3">
              {(ninja.promoMessages || []).map((m: NinjaPromoMessage) => (
                <div key={m.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                  <Switch checked={m.active} onCheckedChange={v => togglePromoMessage(m.id, v)} className="scale-75" />
                  <span className="text-xs flex-1 truncate">{m.text}</span>
                  <button onClick={() => removePromoMessage(m.id)} className="hover:text-destructive text-muted-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newPromoText} onChange={e => setNewPromoText(e.target.value)} placeholder="🥷 Nova mensagem..." className="flex-1 text-xs" onKeyDown={e => e.key === 'Enter' && addPromoMessage()} />
              <Button variant="outline" size="sm" onClick={addPromoMessage}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT */}
      {activeTab === 'checkout' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="h-3.5 w-3.5 text-primary" /> Ninja no Checkout
          </h4>

          <ToggleRow label="Ativar ninja no checkout" checked={ninja.checkoutEnabled} onChange={v => update('checkoutEnabled', v)} />
          <ToggleRow label="Pode revelar cupom ao clicar" checked={ninja.checkoutCanRevealCoupon} onChange={v => update('checkoutCanRevealCoupon', v)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Delay inicial (seg)</Label>
              <Input type="number" value={ninja.checkoutDelaySeconds} onChange={e => update('checkoutDelaySeconds', parseInt(e.target.value) || 8)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Inatividade (seg)</Label>
              <Input type="number" value={ninja.checkoutInactivitySeconds} onChange={e => update('checkoutInactivitySeconds', parseInt(e.target.value) || 15)} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Máx aparições no checkout</Label>
              <Input type="number" value={ninja.checkoutMaxAppearances} onChange={e => update('checkoutMaxAppearances', Math.min(5, Math.max(1, parseInt(e.target.value) || 2)))} className="mt-1" />
            </div>
          </div>

          {/* Checkout Messages */}
          <div>
            <Label className="text-xs mb-2 block">Mensagens do checkout</Label>
            <div className="space-y-2 mb-3">
              {(ninja.checkoutMessages || []).map((m: NinjaCheckoutMessage) => (
                <div key={m.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                  <Switch checked={m.active} onCheckedChange={v => toggleCheckoutMessage(m.id, v)} className="scale-75" />
                  <span className="text-xs flex-1 truncate">{m.text}</span>
                  <button onClick={() => removeCheckoutMessage(m.id)} className="hover:text-destructive text-muted-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newCheckoutText} onChange={e => setNewCheckoutText(e.target.value)} placeholder="🥷 Mensagem do checkout..." className="flex-1 text-xs" onKeyDown={e => e.key === 'Enter' && addCheckoutMessage()} />
              <Button variant="outline" size="sm" onClick={addCheckoutMessage}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* COUPON DELIVERY */}
      {activeTab === 'coupon' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Ticket className="h-3.5 w-3.5 text-primary" /> Entrega de cupons
          </h4>

          <ToggleRow label="Ativar entrega de cupons" checked={ninja.couponDeliveryEnabled} onChange={v => update('couponDeliveryEnabled', v)} />
          <ToggleRow label="Auto-copiar código" checked={ninja.couponAutoCopy} onChange={v => update('couponAutoCopy', v)} />
          <ToggleRow label="Auto-aplicar no checkout" checked={ninja.couponAutoApply} onChange={v => update('couponAutoApply', v)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Máx por sessão</Label>
              <Input type="number" value={ninja.couponMaxPerSession} onChange={e => update('couponMaxPerSession', Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Máx por dia</Label>
              <Input type="number" value={ninja.couponMaxPerDay} onChange={e => update('couponMaxPerDay', Math.min(10, Math.max(1, parseInt(e.target.value) || 2)))} className="mt-1" />
            </div>
          </div>
        </div>
      )}

      {/* REWARDS */}
      {activeTab === 'rewards' && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recompensas</h4>

          <div>
            <Label className="text-xs">Mensagem de recompensa</Label>
            <Input value={ninja.rewardMessage} onChange={e => update('rewardMessage', e.target.value)} className="mt-1" />
          </div>

          {/* Reward tiers */}
          <div>
            <Label className="text-xs mb-2 block">Níveis de recompensa (probabilidade)</Label>
            <div className="space-y-2 mb-3">
              {(ninja.rewardTiers || []).map((tier: NinjaRewardTier, i: number) => {
                const totalWeight = (ninja.rewardTiers || []).reduce((s: number, t: NinjaRewardTier) => s + t.weight, 0);
                const pct = totalWeight > 0 ? ((tier.weight / totalWeight) * 100).toFixed(0) : '0';
                return (
                  <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                    <span className="font-mono font-bold text-primary text-xs flex-1">{tier.code}</span>
                    <span className="text-[10px] text-muted-foreground">{tier.label}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{pct}%</span>
                    <button onClick={() => removeRewardTier(i)} className="hover:text-destructive text-muted-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input value={newTierCode} onChange={e => setNewTierCode(e.target.value)} placeholder="Código" className="font-mono text-xs" />
              <Input value={newTierLabel} onChange={e => setNewTierLabel(e.target.value)} placeholder="Label" className="text-xs" />
              <div className="flex gap-1">
                <Input type="number" value={newTierWeight} onChange={e => setNewTierWeight(e.target.value)} placeholder="Peso" className="text-xs w-16" />
                <Button variant="outline" size="sm" onClick={addRewardTier}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>

          {/* Fallback codes */}
          <div>
            <Label className="text-xs mb-2 block">Códigos de fallback</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(ninja.discountCodes || []).map((c: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-mono px-2.5 py-1 rounded-full">
                  {c}
                  <button onClick={() => removeCode(i)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="NINJA10" className="flex-1 font-mono" onKeyDown={e => e.key === 'Enter' && addCode()} />
              <Button variant="outline" size="sm" onClick={addCode}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-3">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Métricas do Ninja</h4>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Eye} label="Total aparições" value={stats.totalAppearances} />
              <StatCard icon={MousePointer} label="Total cliques" value={stats.totalClicks} />
              <StatCard icon={Ticket} label="Cupons gerados" value={stats.couponsGenerated} />
              <StatCard icon={BarChart3} label="Taxa de clique" value={`${clickRate}%`} />
              <StatCard icon={Megaphone} label="Promos exibidas" value={stats.promoAlertsShown} />
              <StatCard icon={ShoppingCart} label="Checkout aparições" value={stats.checkoutAppearances} />
              <StatCard icon={MousePointer} label="Checkout cliques" value={stats.checkoutClicks} />
              <StatCard icon={Sparkles} label="Cupons resgatados" value={stats.couponsRedeemed} />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                update('stats', {
                  totalAppearances: 0, totalClicks: 0, couponsGenerated: 0,
                  couponsRedeemed: 0, promoAlertsShown: 0, checkoutAppearances: 0, checkoutClicks: 0,
                });
                toast({ title: 'Métricas resetadas' });
              }}
            >
              Resetar métricas
            </Button>
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full gold-gradient text-primary-foreground">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="glass-card rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-lg font-bold text-primary">{value}</p>
    </div>
  );
}
