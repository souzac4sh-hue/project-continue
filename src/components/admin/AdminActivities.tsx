import { useState } from 'react';
import { Plus, Edit2, Trash2, Bell, BellOff, Loader2, Save } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Activity } from '@/data/mockData';

export function AdminActivities() {
  const { activities, setActivities, saveAll } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Activity>>({});
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setCurrent({
      message: '', date: new Date().toISOString().split('T')[0], active: true,
      showAsNotification: true, displayName: '', interval: 40, duration: 6,
    });
    setEditOpen(true);
  };
  const openEdit = (a: Activity) => { setCurrent({ ...a }); setEditOpen(true); };

  const save = () => {
    if (!current.message?.trim()) { toast({ title: 'Mensagem obrigatória', variant: 'destructive' }); return; }
    if (current.id) {
      setActivities(prev => prev.map(a => a.id === current.id ? { ...a, ...current } as Activity : a));
    } else {
      setActivities(prev => [...prev, { ...current, id: Date.now().toString() } as Activity]);
    }
    setEditOpen(false);
    toast({ title: '✅ Atividade salva!' });
  };

  const remove = (id: string) => { setActivities(prev => prev.filter(a => a.id !== id)); toast({ title: 'Atividade removida' }); };

  const handlePersist = async () => {
    setSaving(true);
    try { await saveAll(); toast({ title: '✅ Atividades salvas no banco!' }); }
    catch { toast({ title: '❌ Erro ao salvar', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={openNew} className="gold-gradient text-primary-foreground flex-1"><Plus className="h-4 w-4 mr-2" /> Nova Atividade</Button>
        <Button onClick={handlePersist} disabled={saving} variant="outline" className="border-primary/30 text-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Salvar</>}
        </Button>
      </div>
      <div className="grid gap-3">
        {activities.map(a => (
          <div key={a.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {a.showAsNotification ? <Bell className="h-4 w-4 text-primary shrink-0" /> : <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />}
              <div>
                <p className="font-medium text-sm">
                  {a.displayName ? <span className="text-primary">{a.displayName}</span> : null}
                  {a.displayName ? ' ' : ''}{a.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.active ? 'Ativa' : 'Inativa'}{a.showAsNotification ? ' · Notificação' : ''}{a.interval ? ` · ${a.interval}s` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
              <button onClick={() => remove(a.id)} className="p-2 rounded-lg hover:bg-destructive/20"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-serif">{current.id ? 'Editar' : 'Nova'} Atividade</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome mascarado (opcional)</Label>
              <Input value={current.displayName || ''} onChange={e => setCurrent(c => ({ ...c, displayName: e.target.value }))} className="mt-1" placeholder="Ex: M**rio, An***a" />
              <p className="text-[10px] text-muted-foreground mt-1">Deixe vazio para mensagem sem nome</p>
            </div>
            <div><Label>Mensagem</Label><Input value={current.message || ''} onChange={e => setCurrent(c => ({ ...c, message: e.target.value }))} className="mt-1" placeholder="Ex: adquiriu acesso recentemente" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Intervalo (seg)</Label><Input type="number" value={current.interval || 8} onChange={e => setCurrent(c => ({ ...c, interval: Number(e.target.value) }))} className="mt-1" /></div>
              <div><Label>Duração (seg)</Label><Input type="number" value={current.duration || 5} onChange={e => setCurrent(c => ({ ...c, duration: Number(e.target.value) }))} className="mt-1" /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={current.active ?? true} onCheckedChange={v => setCurrent(c => ({ ...c, active: v }))} /><Label>Ativa</Label></div>
            <div className="flex items-center gap-2"><Switch checked={current.showAsNotification ?? true} onCheckedChange={v => setCurrent(c => ({ ...c, showAsNotification: v }))} /><Label>Exibir como notificação flutuante</Label></div>
            <Button onClick={save} className="w-full gold-gradient text-primary-foreground font-bold">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
