import { useStore } from '@/context/StoreContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function AdminSettings() {
  const { settings, setSettings, saveAll } = useStore();
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
        <div><Label>Link Telegram</Label><Input value={(settings as any).telegramLink || ''} onChange={e => update('telegramLink', e.target.value)} className="mt-1" placeholder="https://t.me/seucanalaqui" /></div>
        <div><Label>Link Instagram</Label><Input value={(settings as any).instagramLink || ''} onChange={e => update('instagramLink', e.target.value)} className="mt-1" placeholder="https://instagram.com/seuuser" /></div>
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Notificação Superior</h3>
        <div className="flex items-center gap-2">
          <Switch checked={(settings as any).showTopNotification || false} onCheckedChange={v => update('showTopNotification', v)} />
          <Label>Exibir barra de notificação no topo</Label>
        </div>
        {(settings as any).showTopNotification && (
          <div>
            <Label>Texto da notificação</Label>
            <Input value={(settings as any).topNotificationText || ''} onChange={e => update('topNotificationText', e.target.value)} className="mt-1" placeholder="🔥 Promoção por tempo limitado!" />
          </div>
        )}
      </section>

      <section className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-serif font-semibold">Modo Manutenção</h3>
        <div className="flex items-center gap-2">
          <Switch checked={(settings as any).maintenanceMode || false} onCheckedChange={v => update('maintenanceMode', v)} />
          <Label>Ativar modo manutenção</Label>
        </div>
        <p className="text-[10px] text-muted-foreground">Quando ativado, visitantes verão uma mensagem de manutenção no site.</p>
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
