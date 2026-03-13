import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Sword, Plus, X, Save, Loader2, Eye, MousePointer, Ticket, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { NinjaRewardTier } from '@/data/mockData';

export function AdminNinja() {
  const { settings, setSettings, saveAll } = useStore();
  const ninja = settings.ninjaSettings;

  const [saving, setSaving] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTierCode, setNewTierCode] = useState('');
  const [newTierWeight, setNewTierWeight] = useState('70');
  const [newTierLabel, setNewTierLabel] = useState('');

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
    setNewTierCode('');
    setNewTierWeight('70');
    setNewTierLabel('');
  };

  const removeRewardTier = (idx: number) => {
    update('rewardTiers', (ninja.rewardTiers || []).filter((_: NinjaRewardTier, i: number) => i !== idx));
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

  const stats = ninja.stats || { totalAppearances: 0, totalClicks: 0, couponsGenerated: 0, couponsRedeemed: 0 };
  const clickRate = stats.totalAppearances > 0 ? ((stats.totalClicks / stats.totalAppearances) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Eye} label="Aparições" value={stats.totalAppearances} />
        <StatCard icon={MousePointer} label="Cliques" value={stats.totalClicks} />
        <StatCard icon={Ticket} label="Cupons gerados" value={stats.couponsGenerated} />
        <StatCard icon={BarChart3} label="Taxa de clique" value={`${clickRate}%`} />
      </div>

      {/* Enable / Disable */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h3 className="font-serif font-semibold text-sm flex items-center gap-2">
          <Sword className="h-4 w-4 text-primary" /> Mascote Ninja
        </h3>

        <div className="flex items-center justify-between">
          <Label>Ativar sistema ninja</Label>
          <Switch checked={ninja.enabled} onCheckedChange={v => update('enabled', v)} />
        </div>

        <div className="flex items-center justify-between">
          <Label>Mostrar recompensa ao clicar</Label>
          <Switch checked={ninja.showReward} onCheckedChange={v => update('showReward', v)} />
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aparência</h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Frequência mín. (min)</Label>
            <Input type="number" value={ninja.frequencyMin} onChange={e => update('frequencyMin', parseInt(e.target.value) || 3)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Frequência máx. (min)</Label>
            <Input type="number" value={ninja.frequencyMax} onChange={e => update('frequencyMax', parseInt(e.target.value) || 5)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Cooldown (min)</Label>
            <Input type="number" value={ninja.cooldownMinutes} onChange={e => update('cooldownMinutes', parseInt(e.target.value) || 10)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Máx por sessão</Label>
            <Input type="number" value={ninja.maxPerSession} onChange={e => update('maxPerSession', parseInt(e.target.value) || 1)} className="mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Tamanho (px)</Label>
            <Input type="number" value={ninja.ninjaSize} onChange={e => update('ninjaSize', Math.min(90, Math.max(60, parseInt(e.target.value) || 72)))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Velocidade (seg)</Label>
            <Input type="number" value={ninja.animationSpeed} onChange={e => update('animationSpeed', Math.min(6, Math.max(2, parseInt(e.target.value) || 4)))} className="mt-1" />
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
      </div>

      {/* Reward Settings */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recompensa</h4>

        <div>
          <Label className="text-xs">Mensagem de recompensa</Label>
          <Input value={ninja.rewardMessage} onChange={e => update('rewardMessage', e.target.value)} className="mt-1" />
        </div>

        {/* Reward tiers with weights */}
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
          <Label className="text-xs mb-2 block">Códigos de fallback (sem peso)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(ninja.discountCodes || []).map((c: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-mono px-2.5 py-1 rounded-full">
                {c}
                <button onClick={() => removeCode(i)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="NINJA10" className="flex-1 font-mono" onKeyDown={e => e.key === 'Enter' && addCode()} />
            <Button variant="outline" size="sm" onClick={addCode}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gold-gradient text-primary-foreground">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Configurações
      </Button>
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
