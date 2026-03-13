import { useStore } from '@/context/StoreContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { StoreMode } from '@/data/mockData';

export function AdminSettings() {
  const { settings, setSettings, saveAll } = useStore();
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateColor = (key: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAll();
      toast({ title: '✅ Configurações salvas!' });
    } catch {
      toast({ title: '❌ Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      {/* Store Operation Mode */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Modo de Operação da Loja</h3>
        <p className="text-[10px] text-muted-foreground">Controla o status visível da loja para os visitantes.</p>
        <Select value={settings.storeMode} onValueChange={(v: StoreMode) => update('storeMode', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="online">🟢 Online — Operação normal</SelectItem>
            <SelectItem value="busy">🟡 Ocupado — Entregas com atraso</SelectItem>
            <SelectItem value="offline">🔴 Offline — Loja fechada</SelectItem>
          </SelectContent>
        </Select>
        {settings.storeMode !== 'online' && (
          <div>
            <Label>Mensagem personalizada (opcional)</Label>
            <Input
              value={settings.storeModeMessage || ''}
              onChange={e => update('storeModeMessage', e.target.value)}
              className="mt-1"
              placeholder={settings.storeMode === 'busy' ? 'Alta demanda no momento...' : 'Loja offline no momento...'}
            />
          </div>
        )}
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Modo de Compra</h3>
        <Select value={settings.purchaseMode} onValueChange={v => update('purchaseMode', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual (WhatsApp)</SelectItem>
            <SelectItem value="automatic">Automático (Pix)</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold">Pix</h3>
          <Switch checked={settings.pixEnabled} onCheckedChange={v => update('pixEnabled', v)} />
        </div>
        {settings.pixEnabled && (
          <div className="space-y-3">
            <div><Label>Token API</Label><Input value={settings.pixToken || ''} onChange={e => update('pixToken', e.target.value)} className="mt-1" /></div>
            <div><Label>Chave Pix</Label><Input value={settings.pixKey || ''} onChange={e => update('pixKey', e.target.value)} className="mt-1" /></div>
            <div><Label>Webhook URL</Label><Input value={settings.pixWebhook || ''} onChange={e => update('pixWebhook', e.target.value)} className="mt-1" /></div>
          </div>
        )}
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">WhatsApp</h3>
        <div><Label>Número vendas</Label><Input value={settings.whatsappNumber} onChange={e => update('whatsappNumber', e.target.value)} className="mt-1" /></div>
        <div><Label>Link Grupo VIP</Label><Input value={settings.vipGroupLink} onChange={e => update('vipGroupLink', e.target.value)} className="mt-1" /></div>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Redes Sociais</h3>
        <div><Label>Link Telegram</Label><Input value={settings.telegramLink || ''} onChange={e => update('telegramLink', e.target.value)} className="mt-1" placeholder="https://t.me/seucanalaqui" /></div>
        <div><Label>Link Instagram</Label><Input value={settings.instagramLink || ''} onChange={e => update('instagramLink', e.target.value)} className="mt-1" placeholder="https://instagram.com/seuuser" /></div>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Notificação Superior</h3>
        <div className="flex items-center gap-2">
          <Switch checked={settings.showTopNotification || false} onCheckedChange={v => update('showTopNotification', v)} />
          <Label>Exibir barra de notificação no topo</Label>
        </div>
        {settings.showTopNotification && (
          <div>
            <Label>Texto da notificação</Label>
            <Input value={settings.topNotificationText || ''} onChange={e => update('topNotificationText', e.target.value)} className="mt-1" placeholder="🔥 Promoção por tempo limitado!" />
          </div>
        )}
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Modo Manutenção</h3>
        <div className="flex items-center gap-2">
          <Switch checked={settings.maintenanceMode || false} onCheckedChange={v => update('maintenanceMode', v)} />
          <Label>Ativar modo manutenção</Label>
        </div>
        {settings.maintenanceMode && (
          <div>
            <Label>Mensagem de manutenção</Label>
            <Input value={settings.maintenanceMessage || ''} onChange={e => update('maintenanceMessage', e.target.value)} className="mt-1" placeholder="🔧 Estamos em manutenção. Voltamos em breve!" />
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">Quando ativado, visitantes verão uma tela de manutenção e não poderão comprar.</p>
      </section>

      {/* Color Controls */}
      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Cores da Marca</h3>
        <p className="text-[10px] text-muted-foreground">Ajuste as cores principais do site. O padrão é dourado (gold).</p>
        
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Cor Primária (Matiz: {settings.colors.primaryHue}°)</Label>
            <input
              type="range"
              min={0}
              max={360}
              value={settings.colors.primaryHue}
              onChange={e => updateColor('primaryHue', Number(e.target.value))}
              className="w-full mt-1 accent-primary"
              style={{ background: `linear-gradient(to right, hsl(0 74% 49%), hsl(60 74% 49%), hsl(120 74% 49%), hsl(180 74% 49%), hsl(240 74% 49%), hsl(300 74% 49%), hsl(360 74% 49%))` }}
            />
            <div className="flex gap-2 mt-1">
              <div>
                <Label className="text-[10px]">Saturação</Label>
                <Input type="number" min={0} max={100} value={settings.colors.primarySaturation} onChange={e => updateColor('primarySaturation', Number(e.target.value))} className="h-7 text-xs w-20" />
              </div>
              <div>
                <Label className="text-[10px]">Luminosidade</Label>
                <Input type="number" min={0} max={100} value={settings.colors.primaryLightness} onChange={e => updateColor('primaryLightness', Number(e.target.value))} className="h-7 text-xs w-20" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div
              className="h-10 w-10 rounded-lg border border-border"
              style={{ background: `hsl(${settings.colors.primaryHue} ${settings.colors.primarySaturation}% ${settings.colors.primaryLightness}%)` }}
            />
            <span className="text-xs text-muted-foreground">Preview da cor primária</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              updateColor('primaryHue', 43);
              updateColor('primarySaturation', 74);
              updateColor('primaryLightness', 49);
            }}
          >
            Restaurar padrão (Gold)
          </Button>
        </div>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Texto do Rodapé</h3>
        <Textarea value={settings.footerText} onChange={e => update('footerText', e.target.value)} rows={3} />
      </section>

      <Button onClick={handleSave} disabled={saving} className="w-full gold-gradient text-primary-foreground font-bold">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar Configurações'}
      </Button>
    </div>
  );
}
