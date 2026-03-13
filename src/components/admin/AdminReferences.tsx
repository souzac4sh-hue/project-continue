import { useState } from 'react';
import { Plus, Edit2, Trash2, Settings2, GripVertical, Loader2, Save } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from '@/hooks/use-toast';
import { Reference } from '@/data/mockData';

export function AdminReferences() {
  const { references, setReferences, settings, setSettings, saveAll } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Reference>>({});
  const [saving, setSaving] = useState(false);
  const channel = settings.referenceChannel;

  const updateChannel = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      referenceChannel: { ...prev.referenceChannel, [key]: value },
    }));
  };

  const openNew = () => {
    setCurrent({ image: '', comment: '', shortText: '', date: new Date().toISOString().split('T')[0], active: true });
    setEditOpen(true);
  };
  const openEdit = (r: Reference) => { setCurrent({ ...r }); setEditOpen(true); };

  const save = () => {
    if (!current.comment?.trim()) { toast({ title: 'Comentário obrigatório', variant: 'destructive' }); return; }
    if (current.id) {
      setReferences(prev => prev.map(r => r.id === current.id ? { ...r, ...current } as Reference : r));
    } else {
      setReferences(prev => [...prev, { ...current, id: Date.now().toString() } as Reference]);
    }
    setEditOpen(false);
    toast({ title: '✅ Referência salva!' });
  };

  const remove = (id: string) => { setReferences(prev => prev.filter(r => r.id !== id)); toast({ title: 'Referência removida' }); };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setReferences(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const handlePersist = async () => {
    setSaving(true);
    try { await saveAll(); toast({ title: '✅ Referências salvas no banco!' }); }
    catch { toast({ title: '❌ Erro ao salvar', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={openNew} className="gold-gradient text-primary-foreground flex-1">
          <Plus className="h-4 w-4 mr-2" /> Nova Referência
        </Button>
        <Button onClick={() => setConfigOpen(true)} variant="outline" size="icon">
          <Settings2 className="h-4 w-4" />
        </Button>
        <Button onClick={handlePersist} disabled={saving} variant="outline" className="border-primary/30 text-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Salvar</>}
        </Button>
      </div>

      <div className="grid gap-3">
        {references.map((r, idx) => (
          <div key={r.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
            <button onClick={() => moveUp(idx)} className="p-1 rounded hover:bg-secondary cursor-grab" aria-label="Mover para cima">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            {r.image && <img src={r.image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{r.shortText}</p>
                {!r.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inativa</span>}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{r.comment}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
              <button onClick={() => remove(r.id)} className="p-2 rounded-lg hover:bg-destructive/20"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">{current.id ? 'Editar' : 'Nova'} Referência</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <ImageUpload value={current.image || ''} onChange={url => setCurrent(c => ({ ...c, image: url }))} folder="references" label="Imagem / Print" aspectRatio="aspect-square" />
            <div><Label>Texto curto</Label><Input value={current.shortText || ''} onChange={e => setCurrent(c => ({ ...c, shortText: e.target.value }))} className="mt-1" /></div>
            <div><Label>Comentário</Label><Input value={current.comment || ''} onChange={e => setCurrent(c => ({ ...c, comment: e.target.value }))} className="mt-1" /></div>
            <div><Label>Data</Label><Input type="date" value={current.date || ''} onChange={e => setCurrent(c => ({ ...c, date: e.target.value }))} className="mt-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={current.active ?? true} onCheckedChange={v => setCurrent(c => ({ ...c, active: v }))} /><Label>Ativa</Label></div>
            <Button onClick={save} className="w-full gold-gradient text-primary-foreground font-bold">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">Configurar Canal de Referências</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Link do Canal</Label><Input value={channel.channelLink} onChange={e => updateChannel('channelLink', e.target.value)} className="mt-1" placeholder="https://t.me/seucanalaqui" /></div>
            <div><Label>Título da Página</Label><Input value={channel.pageTitle} onChange={e => updateChannel('pageTitle', e.target.value)} className="mt-1" /></div>
            <div><Label>Subtítulo</Label><Input value={channel.pageSubtitle} onChange={e => updateChannel('pageSubtitle', e.target.value)} className="mt-1" /></div>
            <div><Label>Texto de Apoio</Label><Textarea value={channel.pageSupportText} onChange={e => updateChannel('pageSupportText', e.target.value)} className="mt-1" rows={3} /></div>
            <div><Label>Texto do Botão CTA</Label><Input value={channel.ctaButtonText} onChange={e => updateChannel('ctaButtonText', e.target.value)} className="mt-1" /></div>
            <div><Label>Texto Final</Label><Textarea value={channel.ctaFinalText} onChange={e => updateChannel('ctaFinalText', e.target.value)} className="mt-1" rows={3} /></div>
            <div><Label>Quantidade exibida no site</Label><Input type="number" min={1} max={20} value={channel.displayCount} onChange={e => updateChannel('displayCount', Number(e.target.value))} className="mt-1" /></div>
            <Button onClick={() => { setConfigOpen(false); toast({ title: '✅ Canal configurado!' }); }} className="w-full gold-gradient text-primary-foreground font-bold">Salvar Configurações</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
