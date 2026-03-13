import { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, Save } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from '@/hooks/use-toast';
import { Method } from '@/data/mockData';

export function AdminMethods() {
  const { methods, setMethods, products, saveAll } = useStore();
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<Method>>({});
  const [saving, setSaving] = useState(false);

  const openNew = () => { setCurrent({ name: '', description: '', banner: '', status: 'active' }); setEditOpen(true); };
  const openEdit = (m: Method) => { setCurrent({ ...m }); setEditOpen(true); };

  const save = () => {
    if (!current.name?.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    if (current.id) {
      setMethods(prev => prev.map(m => m.id === current.id ? { ...m, ...current } as Method : m));
    } else {
      setMethods(prev => [...prev, { ...current, id: Date.now().toString() } as Method]);
    }
    setEditOpen(false);
    toast({ title: '✅ Método salvo!' });
  };

  const remove = (id: string) => { setMethods(prev => prev.filter(m => m.id !== id)); toast({ title: 'Método removido' }); };

  const handlePersist = async () => {
    setSaving(true);
    try { await saveAll(); toast({ title: '✅ Métodos salvos no banco!' }); }
    catch { toast({ title: '❌ Erro ao salvar', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const statusLabels = { active: 'Ativo', coming_soon: 'Em Breve', unavailable: 'Indisponível' };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={openNew} className="gold-gradient text-primary-foreground flex-1"><Plus className="h-4 w-4 mr-2" /> Novo Método</Button>
        <Button onClick={handlePersist} disabled={saving} variant="outline" className="border-primary/30 text-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Salvar</>}
        </Button>
      </div>
      <div className="grid gap-3">
        {methods.map(m => (
          <div key={m.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
            {m.banner && <img src={m.banner} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{m.name}</p>
              <p className="text-sm text-muted-foreground">{statusLabels[m.status]}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
              <button onClick={() => remove(m.id)} className="p-2 rounded-lg hover:bg-destructive/20"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif">{current.id ? 'Editar' : 'Novo'} Método</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <ImageUpload value={current.banner || ''} onChange={url => setCurrent(c => ({ ...c, banner: url }))} folder="methods" label="Imagem / Banner" />
            <div><Label>Nome</Label><Input value={current.name || ''} onChange={e => setCurrent(c => ({ ...c, name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Descrição</Label><Textarea value={current.description || ''} onChange={e => setCurrent(c => ({ ...c, description: e.target.value }))} className="mt-1" /></div>
            <div><Label>Status</Label>
              <Select value={current.status || 'active'} onValueChange={v => setCurrent(c => ({ ...c, status: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="coming_soon">Em Breve</SelectItem>
                  <SelectItem value="unavailable">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Produto vinculado</Label>
              <Select value={current.linkedProductId || ''} onValueChange={v => setCurrent(c => ({ ...c, linkedProductId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>URL do vídeo</Label><Input value={current.videoUrl || ''} onChange={e => setCurrent(c => ({ ...c, videoUrl: e.target.value }))} className="mt-1" /></div>
            <div><Label>Observações</Label><Textarea value={current.notes || ''} onChange={e => setCurrent(c => ({ ...c, notes: e.target.value }))} className="mt-1" /></div>
            <Button onClick={save} className="w-full gold-gradient text-primary-foreground font-bold">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
