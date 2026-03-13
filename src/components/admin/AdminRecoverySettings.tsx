import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Save, Settings, MessageSquare, GripVertical } from 'lucide-react';

type RecoveryMessage = {
  id: string;
  title: string;
  template: string;
  is_default: boolean | null;
  active: boolean | null;
  sort_order: number | null;
};

type RecoverySettingsData = {
  abandonment_timeout_minutes: number | null;
  show_support_button: boolean | null;
  show_regenerate_pix: boolean | null;
  mark_hot_on_copy: boolean | null;
};

export function AdminRecoverySettings() {
  const [messages, setMessages] = useState<RecoveryMessage[]>([]);
  const [settings, setSettings] = useState<RecoverySettingsData>({
    abandonment_timeout_minutes: 10,
    show_support_button: true,
    show_regenerate_pix: true,
    mark_hot_on_copy: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<RecoveryMessage | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [msgsRes, settingsRes] = await Promise.all([
        supabase.from('recovery_messages').select('*').order('sort_order'),
        supabase.from('recovery_settings').select('*').eq('id', 'main').maybeSingle(),
      ]);
      setMessages((msgsRes.data as RecoveryMessage[]) || []);
      if (settingsRes.data) {
        setSettings(settingsRes.data as RecoverySettingsData);
      }
      setLoading(false);
    };
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase.from('recovery_settings').update(settings).eq('id', 'main');
    if (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } else {
      toast({ title: 'Configurações salvas!' });
    }
    setSaving(false);
  };

  const addMessage = async () => {
    if (!newTitle.trim() || !newTemplate.trim()) {
      toast({ title: 'Preencha título e mensagem', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('recovery_messages').insert({
      title: newTitle.trim(),
      template: newTemplate.trim(),
      sort_order: messages.length + 1,
    });
    if (!error) {
      toast({ title: 'Mensagem adicionada!' });
      setNewTitle('');
      setNewTemplate('');
      setShowAdd(false);
      const { data } = await supabase.from('recovery_messages').select('*').order('sort_order');
      setMessages((data as RecoveryMessage[]) || []);
    }
  };

  const updateMessage = async () => {
    if (!editMsg) return;
    await supabase.from('recovery_messages').update({
      title: editMsg.title,
      template: editMsg.template,
      active: editMsg.active,
    }).eq('id', editMsg.id);
    toast({ title: 'Mensagem atualizada!' });
    setEditMsg(null);
    const { data } = await supabase.from('recovery_messages').select('*').order('sort_order');
    setMessages((data as RecoveryMessage[]) || []);
  };

  const deleteMessage = async (id: string) => {
    await supabase.from('recovery_messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    toast({ title: 'Mensagem removida' });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Settings */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h3 className="font-serif font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" /> Configurações de Recuperação
        </h3>

        <div className="space-y-4">
          <div>
            <Label>Tempo para considerar abandono (minutos)</Label>
            <Input
              type="number"
              value={settings.abandonment_timeout_minutes || 10}
              onChange={e => setSettings(s => ({ ...s, abandonment_timeout_minutes: parseInt(e.target.value) || 10 }))}
              className="mt-1 max-w-[200px]"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Mostrar botão de suporte no checkout</Label>
              <p className="text-xs text-muted-foreground">Botão "Falar com suporte" durante pagamento</p>
            </div>
            <Switch checked={settings.show_support_button ?? true} onCheckedChange={v => setSettings(s => ({ ...s, show_support_button: v }))} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Mostrar botão "Gerar novo Pix"</Label>
              <p className="text-xs text-muted-foreground">Permite ao cliente gerar novo código</p>
            </div>
            <Switch checked={settings.show_regenerate_pix ?? true} onCheckedChange={v => setSettings(s => ({ ...s, show_regenerate_pix: v }))} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Marcar como lead quente ao copiar Pix</Label>
              <p className="text-xs text-muted-foreground">Destaca no admin quem copiou o código</p>
            </div>
            <Switch checked={settings.mark_hot_on_copy ?? true} onCheckedChange={v => setSettings(s => ({ ...s, mark_hot_on_copy: v }))} />
          </div>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="gold-gradient text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>

      {/* Messages */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Mensagens de Recuperação
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Nova Mensagem
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Use <code className="bg-secondary px-1 py-0.5 rounded text-primary">{'{{product_name}}'}</code>,{' '}
          <code className="bg-secondary px-1 py-0.5 rounded text-primary">{'{{order_id}}'}</code>,{' '}
          <code className="bg-secondary px-1 py-0.5 rounded text-primary">{'{{amount}}'}</code>,{' '}
          <code className="bg-secondary px-1 py-0.5 rounded text-primary">{'{{customer_name}}'}</code> nas mensagens.
        </p>

        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{msg.title}</span>
                  {msg.is_default && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">Padrão</span>
                  )}
                  {!msg.active && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inativa</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditMsg({ ...msg })}>
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                  {!msg.is_default && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteMessage(msg.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{msg.template}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editMsg} onOpenChange={() => setEditMsg(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif">Editar Mensagem</DialogTitle>
          </DialogHeader>
          {editMsg && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input value={editMsg.title} onChange={e => setEditMsg({ ...editMsg, title: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea value={editMsg.template} onChange={e => setEditMsg({ ...editMsg, template: e.target.value })} rows={4} className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativa</Label>
                <Switch checked={editMsg.active ?? true} onCheckedChange={v => setEditMsg({ ...editMsg, active: v })} />
              </div>
              <Button onClick={updateMessage} className="w-full gold-gradient text-primary-foreground">Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-serif">Nova Mensagem de Recuperação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Banco bloqueou" className="mt-1" />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={newTemplate} onChange={e => setNewTemplate(e.target.value)} placeholder="Olá, vi que..." rows={4} className="mt-1" />
            </div>
            <Button onClick={addMessage} className="w-full gold-gradient text-primary-foreground">Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
