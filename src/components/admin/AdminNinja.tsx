import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Sword, Plus, X, Save, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function AdminNinja() {
  const { settings, setSettings, saveAll } = useStore();
  const ninja = settings.ninjaSettings;

  const [saving, setSaving] = useState(false);
  const [newCode, setNewCode] = useState('');

  const update = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      ninjaSettings: { ...ninja, [key]: value },
    } as any));
  };

  const addCode = () => {
    if (!newCode.trim()) return;
    update('discountCodes', [...(ninja.discountCodes || []), newCode.trim().toUpperCase()]);
    setNewCode('');
  };

  const removeCode = (idx: number) => {
    update('discountCodes', ninja.discountCodes.filter((_: string, i: number) => i !== idx));
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

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h3 className="font-serif font-semibold text-sm flex items-center gap-2">
          <Sword className="h-4 w-4 text-primary" /> Mascote Ninja
        </h3>

        <div className="flex items-center justify-between">
          <Label>Ativar mascote</Label>
          <Switch checked={ninja.enabled} onCheckedChange={v => update('enabled', v)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Frequência mín. (min)</Label>
            <Input type="number" value={ninja.frequencyMin} onChange={e => update('frequencyMin', parseInt(e.target.value) || 3)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Frequência máx. (min)</Label>
            <Input type="number" value={ninja.frequencyMax} onChange={e => update('frequencyMax', parseInt(e.target.value) || 5)} className="mt-1" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Cooldown (min)</Label>
            <Input type="number" value={ninja.cooldownMinutes} onChange={e => update('cooldownMinutes', parseInt(e.target.value) || 10)} className="mt-1" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>Mostrar recompensa ao clicar</Label>
          <Switch checked={ninja.showReward} onCheckedChange={v => update('showReward', v)} />
        </div>

        <div>
          <Label className="text-xs">Mensagem de recompensa</Label>
          <Input value={ninja.rewardMessage} onChange={e => update('rewardMessage', e.target.value)} className="mt-1" />
        </div>

        {/* Discount codes */}
        <div>
          <Label className="text-xs mb-2 block">Códigos de desconto</Label>
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
            <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="NINJA10" className="flex-1" onKeyDown={e => e.key === 'Enter' && addCode()} />
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
